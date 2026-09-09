const DEFAULT_SUPABASE_URL = 'https://kmognvgnfisdchzffkgh.supabase.co';
const SUPABASE_URL = (process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL).replace(/\/$/, '');
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const SUPABASE_PDF_PROXY = `${SUPABASE_URL}/functions/v1/official-pdf-proxy`;

export const OFFICIAL_PDF_HOSTS = new Set([
  'download.inep.gov.br',
  'vestibular.cmmg.edu.br',
  'www.fuvest.br',
  'fuvest.br',
  'backend.copeve.ufmg.br',
]);

const RETRYABLE_HTTP_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const DIRECT_TIMEOUT_MS = 8_000;
const PROXY_TIMEOUT_MS = 10_000;

class OfficialPdfFetchError extends Error {
  status?: number;
  retryable: boolean;

  constructor(message: string, status?: number, retryable = true) {
    super(message);
    this.name = 'OfficialPdfFetchError';
    this.status = status;
    this.retryable = retryable;
  }
}

export function parseOfficialPdfUrl(raw: unknown) {
  try {
    const url = new URL(String(raw || ''));
    if (url.protocol !== 'https:') return '';
    if (!OFFICIAL_PDF_HOSTS.has(url.hostname)) return '';
    if (!/\.pdf$/i.test(url.pathname)) return '';
    return url.toString();
  } catch {
    return '';
  }
}

function sourceVariants(sourceUrl: string) {
  const variants = [sourceUrl];
  try {
    const parsed = new URL(sourceUrl);
    if (parsed.hostname === 'www.fuvest.br') {
      parsed.hostname = 'fuvest.br';
      variants.push(parsed.toString());
    } else if (parsed.hostname === 'fuvest.br') {
      parsed.hostname = 'www.fuvest.br';
      variants.push(parsed.toString());
    }
  } catch {
    // sourceUrl has already been validated by parseOfficialPdfUrl.
  }
  return [...new Set(variants)];
}

function refererFor(sourceUrl: string) {
  try {
    const host = new URL(sourceUrl).hostname;
    if (host === 'download.inep.gov.br') return 'https://www.gov.br/inep/';
    if (host === 'vestibular.cmmg.edu.br') return 'https://vestibular.cmmg.edu.br/';
    if (host === 'www.fuvest.br' || host === 'fuvest.br') return 'https://www.fuvest.br/';
    if (host === 'backend.copeve.ufmg.br') return 'https://www.ufmg.br/copeve/';
  } catch {
    // Ignore and fall back to no Referer.
  }
  return '';
}

function browserHeaders(sourceUrl: string, range?: string | null) {
  const referer = refererFor(sourceUrl);
  return {
    Accept: 'application/pdf,application/octet-stream;q=0.9,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    'Cache-Control': 'no-cache',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    ...(referer ? { Referer: referer } : {}),
    ...(range ? { Range: range } : {}),
  };
}

function proxyHeaders() {
  return {
    Accept: 'application/pdf,application/octet-stream;q=0.9,*/*;q=0.8',
    'User-Agent': 'ConectaeOfficialPdfProxy/2.0',
    ...(SUPABASE_ANON_KEY
      ? {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        }
      : {}),
  };
}

function isPlausiblePdfResponse(response: Response) {
  const type = (response.headers.get('content-type') || '').toLowerCase();
  if (!type) return true;
  return type.includes('pdf') || type.includes('octet-stream') || type.includes('binary');
}

async function requestCandidate(
  target: string,
  headers: Record<string, string>,
  timeoutMs: number,
) {
  try {
    const response = await fetch(target, {
      redirect: 'follow',
      headers,
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) {
      const retryable = RETRYABLE_HTTP_STATUS.has(response.status);
      throw new OfficialPdfFetchError(`PDF HTTP ${response.status}`, response.status, retryable);
    }
    if (!isPlausiblePdfResponse(response)) {
      throw new OfficialPdfFetchError('A fonte retornou conteúdo que não parece ser PDF.', response.status, false);
    }
    return response;
  } catch (error: any) {
    if (error instanceof OfficialPdfFetchError) throw error;
    const message = String(error?.message || error || 'Falha de rede ao acessar PDF.');
    throw new OfficialPdfFetchError(message, undefined, true);
  }
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchOfficialPdfResponse(sourceUrl: string, range?: string | null) {
  const directVariants = sourceVariants(sourceUrl);
  let lastError: OfficialPdfFetchError | null = null;

  // Try official hosts first. FUVEST is tested with and without www because both
  // variants have behaved differently behind CDNs over time.
  for (const candidate of directVariants) {
    try {
      return await requestCandidate(candidate, browserHeaders(candidate, range), DIRECT_TIMEOUT_MS);
    } catch (error: any) {
      lastError = error instanceof OfficialPdfFetchError
        ? error
        : new OfficialPdfFetchError(String(error?.message || error));
    }
  }

  // The Supabase edge proxy uses a different network path and is the main fallback
  // for upstreams that temporarily reject Vercel/serverless IPs. Retry only this
  // fallback, with a short backoff, for transient 5xx/rate-limit/network failures.
  const proxyUrl = `${SUPABASE_PDF_PROXY}?url=${encodeURIComponent(sourceUrl)}`;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await requestCandidate(proxyUrl, proxyHeaders(), PROXY_TIMEOUT_MS);
    } catch (error: any) {
      lastError = error instanceof OfficialPdfFetchError
        ? error
        : new OfficialPdfFetchError(String(error?.message || error));
      if (!lastError.retryable || attempt === 1) break;
      await wait(attempt === 0 ? 300 : 900);
    }
  }

  // One final direct attempt is useful when the upstream had a brief 502/503 while
  // the fallback was being tried. Skip it for permanent errors such as 403/404.
  if (lastError?.retryable) {
    try {
      return await requestCandidate(sourceUrl, browserHeaders(sourceUrl, range), DIRECT_TIMEOUT_MS);
    } catch (error: any) {
      lastError = error instanceof OfficialPdfFetchError
        ? error
        : new OfficialPdfFetchError(String(error?.message || error));
    }
  }

  throw lastError || new OfficialPdfFetchError('A fonte oficial não respondeu.');
}
