const OFFICIAL_HOSTS = new Set([
  'download.inep.gov.br',
  'vestibular.cmmg.edu.br',
  'www.fuvest.br',
  'fuvest.br',
  'backend.copeve.ufmg.br',
]);
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);
const DEFAULT_SUPABASE_URL = 'https://kmognvgnfisdchzffkgh.supabase.co';
const SUPABASE_URL = (process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL).replace(/\/$/, '');
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const SUPABASE_PDF_PROXY = `${SUPABASE_URL}/functions/v1/official-pdf-proxy`;
const MAX_RANGE_BYTES = 2 * 1024 * 1024;
const MAX_FULL_PDF_BYTES = 30 * 1024 * 1024;

function allowed(raw: unknown) {
  try {
    const url = new URL(String(raw || ''));
    if (url.protocol !== 'https:' || !OFFICIAL_HOSTS.has(url.hostname) || !/\.pdf$/i.test(url.pathname)) return '';
    return url.toString();
  } catch {
    return '';
  }
}

function sourceVariants(sourceUrl: string) {
  const variants = [sourceUrl];
  const parsed = new URL(sourceUrl);
  if (parsed.hostname === 'www.fuvest.br') {
    parsed.hostname = 'fuvest.br';
    variants.push(parsed.toString());
  } else if (parsed.hostname === 'fuvest.br') {
    parsed.hostname = 'www.fuvest.br';
    variants.push(parsed.toString());
  }
  return [...new Set(variants)];
}

function refererFor(sourceUrl: string) {
  const host = new URL(sourceUrl).hostname;
  if (host === 'download.inep.gov.br') return 'https://www.gov.br/inep/';
  if (host === 'vestibular.cmmg.edu.br') return 'https://vestibular.cmmg.edu.br/';
  if (host === 'www.fuvest.br' || host === 'fuvest.br') return 'https://www.fuvest.br/';
  if (host === 'backend.copeve.ufmg.br') return 'https://www.ufmg.br/copeve/';
  return '';
}

function directHeaders(sourceUrl: string, range: string | null) {
  const referer = refererFor(sourceUrl);
  return {
    Accept: 'application/pdf,application/octet-stream;q=0.9,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    ...(referer ? { Referer: referer } : {}),
    ...(range ? { Range: range } : {}),
  };
}

function proxyHeaders() {
  return {
    Accept: 'application/pdf,application/octet-stream;q=0.9,*/*;q=0.8',
    'User-Agent': 'ConectaeOfficialPdfProxy/2.1',
    ...(SUPABASE_ANON_KEY ? { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } : {}),
  };
}

async function requestCandidate(target: string, headers: Record<string, string>, timeoutMs: number) {
  const response = await fetch(target, { redirect: 'follow', headers, signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) {
    const error: any = new Error(`PDF HTTP ${response.status}`);
    error.status = response.status;
    error.retryable = RETRYABLE_STATUS.has(response.status);
    throw error;
  }
  const type = (response.headers.get('content-type') || '').toLowerCase();
  if (type && !type.includes('pdf') && !type.includes('octet-stream') && !type.includes('binary')) {
    const error: any = new Error('A fonte retornou conteúdo que não parece ser PDF.');
    error.status = response.status;
    error.retryable = false;
    throw error;
  }
  return response;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchOfficialPdf(sourceUrl: string, range: string | null) {
  let lastError: any = null;

  for (const candidate of sourceVariants(sourceUrl)) {
    try {
      return await requestCandidate(candidate, directHeaders(candidate, range), 8000);
    } catch (error: any) {
      lastError = error;
    }
  }

  const proxyUrl = `${SUPABASE_PDF_PROXY}?url=${encodeURIComponent(sourceUrl)}`;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await requestCandidate(proxyUrl, proxyHeaders(), 10000);
    } catch (error: any) {
      lastError = error;
      if (!error?.retryable || attempt === 1) break;
      await wait(300);
    }
  }

  if (lastError?.retryable) {
    try {
      return await requestCandidate(sourceUrl, directHeaders(sourceUrl, range), 8000);
    } catch (error: any) {
      lastError = error;
    }
  }

  throw lastError || new Error('A fonte oficial não respondeu.');
}

function parseRequestedRange(req: any) {
  const requestedStart = Number(req.query?.start);
  const requestedEnd = Number(req.query?.end);
  const queryChunked = Number.isInteger(requestedStart) && requestedStart >= 0;

  if (queryChunked) {
    const start = requestedStart;
    const end = Math.min(
      Number.isInteger(requestedEnd) && requestedEnd >= start ? requestedEnd : start + MAX_RANGE_BYTES - 1,
      start + MAX_RANGE_BYTES - 1,
    );
    return { chunked: true, start, end };
  }

  const header = String(req.headers?.range || '');
  const match = header.match(/^bytes=(\d+)-(\d*)$/i);
  if (!match) return { chunked: false, start: 0, end: null as number | null };
  const start = Number(match[1]);
  const requestedHeaderEnd = match[2] ? Number(match[2]) : start + MAX_RANGE_BYTES - 1;
  if (!Number.isInteger(start) || start < 0 || !Number.isInteger(requestedHeaderEnd) || requestedHeaderEnd < start) {
    return { chunked: false, start: 0, end: null as number | null };
  }
  return { chunked: true, start, end: Math.min(requestedHeaderEnd, start + MAX_RANGE_BYTES - 1) };
}

function hasPdfSignature(buffer: Buffer) {
  return buffer.length >= 5 && buffer.subarray(0, 5).toString('ascii') === '%PDF-';
}

export default async function handler(req: any, res: any) {
  if (!['GET', 'HEAD'].includes(req.method)) return res.status(405).json({ error: 'Método não permitido.' });
  const url = allowed(req.query?.url);
  if (!url) return res.status(400).json({ error: 'Fonte oficial inválida.' });

  const { chunked, start, end } = parseRequestedRange(req);
  const range = chunked && end !== null ? `bytes=${start}-${end}` : null;

  try {
    const response = await fetchOfficialPdf(url, range);
    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length || buffer.length > MAX_FULL_PDF_BYTES) {
      return res.status(502).json({ error: 'PDF oficial inválido ou grande demais.' });
    }

    const upstreamRange = response.headers.get('content-range') || '';
    const totalFromRange = Number(upstreamRange.match(/\/(\d+)$/)?.[1]);
    const upstreamHonoredRange = response.status === 206 && /^bytes\s+\d+-\d+\//i.test(upstreamRange);

    if ((!upstreamHonoredRange || start === 0) && !hasPdfSignature(buffer)) {
      console.error('proxy-official-pdf rejected non-PDF payload', {
        host: new URL(url).hostname,
        status: response.status,
        contentType: response.headers.get('content-type') || '',
      });
      return res.status(502).json({ error: 'A fonte oficial retornou um arquivo inválido.' });
    }

    const total = Number.isFinite(totalFromRange)
      ? totalFromRange
      : Number(response.headers.get('content-length')) || buffer.length;
    const payload = !chunked
      ? buffer
      : upstreamHonoredRange
        ? buffer.subarray(0, Math.min(buffer.length, end! - start + 1))
        : buffer.subarray(start, Math.min(buffer.length, end! + 1));

    if (!payload.length) return res.status(416).json({ error: 'Trecho do PDF fora do arquivo.' });

    const actualTotal = upstreamHonoredRange || response.status === 200 ? total : Math.max(total, start + payload.length);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', String(payload.length));
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('X-Pdf-Size', String(actualTotal));
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Expose-Headers', 'X-Pdf-Size, Content-Range, Accept-Ranges');

    if (chunked) {
      const actualEnd = start + payload.length - 1;
      res.setHeader('Content-Range', `bytes ${start}-${actualEnd}/${actualTotal}`);
      if (req.method === 'HEAD') return res.status(206).end();
      return res.status(206).send(payload);
    }
    if (req.method === 'HEAD') return res.status(200).end();
    return res.status(200).send(payload);
  } catch (error: any) {
    console.error('proxy-official-pdf failed', {
      host: new URL(url).hostname,
      message: String(error?.message || error),
      status: Number(error?.status) || undefined,
    });
    return res.status(502).json({ error: 'Não consegui acessar a fonte oficial agora. Tente novamente em instantes.' });
  }
}
