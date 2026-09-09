import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const pdfCache = new Map<string, Promise<any>>();
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
const MAX_PDF_BYTES = 35 * 1024 * 1024;

function allowedUrl(raw: unknown) {
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

function directHeaders(sourceUrl: string) {
  const referer = refererFor(sourceUrl);
  return {
    Accept: 'application/pdf,application/octet-stream;q=0.9,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    ...(referer ? { Referer: referer } : {}),
  };
}

function proxyHeaders() {
  return {
    Accept: 'application/pdf,application/octet-stream;q=0.9,*/*;q=0.8',
    'User-Agent': 'ConectaeOfficialPageLocator/2.1',
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

async function fetchPdfResponse(sourceUrl: string) {
  let lastError: any = null;
  for (const candidate of sourceVariants(sourceUrl)) {
    try {
      return await requestCandidate(candidate, directHeaders(candidate), 10000);
    } catch (error: any) {
      lastError = error;
    }
  }

  const proxyUrl = `${SUPABASE_PDF_PROXY}?url=${encodeURIComponent(sourceUrl)}`;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await requestCandidate(proxyUrl, proxyHeaders(), 12000);
    } catch (error: any) {
      lastError = error;
      if (!error?.retryable || attempt === 1) break;
      await wait(300);
    }
  }

  if (lastError?.retryable) {
    try {
      return await requestCandidate(sourceUrl, directHeaders(sourceUrl), 10000);
    } catch (error: any) {
      lastError = error;
    }
  }
  throw lastError || new Error('A fonte oficial não respondeu.');
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Z0-9{} ]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();
}

function pageLines(items: any[]) {
  const rows = new Map<string, { column: number; y: number; parts: { x: number; text: string }[] }>();
  for (const item of items) {
    const text = String(item?.str || '').replace(/¬/g, '').trim();
    if (!text) continue;
    const transform = item?.transform || [];
    const x = Number(transform[4] || 0);
    const y = Number(transform[5] || 0);
    const column = x >= 300 ? 1 : 0;
    const roundedY = Math.round(y / 2) * 2;
    const key = `${column}:${roundedY}`;
    if (!rows.has(key)) rows.set(key, { column, y: roundedY, parts: [] });
    rows.get(key)!.parts.push({ x, text });
  }
  return [...rows.values()]
    .sort((a, b) => a.column - b.column || b.y - a.y)
    .map((row) => row.parts.sort((a, b) => a.x - b.x).map((part) => part.text).join(' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function isQuestionMarker(line: string, questionNumber: number) {
  const normalized = normalize(line);
  return new RegExp(`\\bQUEST(?:AO|A0)\\s+0*${questionNumber}\\b`).test(normalized)
    || new RegExp(`^\\s*\\{\\s*0*${questionNumber}\\s*\\}\\s*`).test(line)
    || new RegExp(`^\\s*0*${questionNumber}\\s*[.)-]\\s+\\S`, 'i').test(line)
    || new RegExp(`^\\s*0*${questionNumber}\\s*$`).test(line);
}

function hasPdfSignature(data: ArrayBuffer) {
  if (data.byteLength < 5) return false;
  const bytes = new Uint8Array(data, 0, 5);
  return String.fromCharCode(...bytes) === '%PDF-';
}

async function fetchPdfBytes(sourceUrl: string) {
  const response = await fetchPdfResponse(sourceUrl);
  const data = await response.arrayBuffer();
  if (!data.byteLength) throw new Error('PDF vazio.');
  if (data.byteLength > MAX_PDF_BYTES) throw new Error('PDF grande demais.');
  if (!hasPdfSignature(data)) throw new Error('A fonte oficial retornou conteúdo que não é PDF.');
  return data;
}

async function loadPdf(sourceUrl: string) {
  let cached = pdfCache.get(sourceUrl);
  if (cached) return cached;
  cached = (async () => {
    const data = await fetchPdfBytes(sourceUrl);
    return getDocument({ data: new Uint8Array(data), isEvalSupported: false, useSystemFonts: true, disableFontFace: false }).promise;
  })();
  pdfCache.set(sourceUrl, cached);
  try {
    return await cached;
  } catch (error) {
    pdfCache.delete(sourceUrl);
    throw error;
  }
}

async function locatePage(sourceUrl: string, questionNumber: number) {
  const pdf = await loadPdf(sourceUrl);
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const lines = pageLines((content as any).items || []);
    if (lines.some((line) => isQuestionMarker(line, questionNumber))) return pageNumber;
    const flattened = normalize(lines.join(' '));
    if (new RegExp(`\\bQUEST(?:AO|A0)\\s+0*${questionNumber}\\b`).test(flattened)) return pageNumber;
  }
  return null;
}

export default async function handler(req: any, res: any) {
  if (!['GET', 'HEAD'].includes(req.method)) return res.status(405).json({ error: 'Método não permitido.' });
  const sourceUrl = allowedUrl(req.query?.sourceUrl);
  const questionNumber = Number(req.query?.questionNumber);
  if (!sourceUrl || !Number.isInteger(questionNumber) || questionNumber < 1 || questionNumber > 250) {
    return res.status(400).json({ error: 'Fonte ou número da questão inválido.' });
  }

  try {
    const sourcePage = await locatePage(sourceUrl, questionNumber);
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=2592000, stale-while-revalidate=7776000');
    if (req.method === 'HEAD') return res.status(sourcePage ? 200 : 404).end();
    if (!sourcePage) return res.status(404).json({ error: 'Página da questão não localizada.' });
    return res.status(200).json({ source_page: sourcePage });
  } catch (error: any) {
    console.error('locate-official-question-page failed', {
      host: new URL(sourceUrl).hostname,
      message: String(error?.message || error),
      status: Number(error?.status) || undefined,
    });
    return res.status(502).json({ error: 'Não consegui localizar a página da questão agora. Tente novamente em instantes.' });
  }
}
