import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { fetchOfficialPdfResponse, parseOfficialPdfUrl } from './_official-pdf-fetch';

const pdfCache = new Map<string, Promise<any>>();
const MAX_PDF_BYTES = 35 * 1024 * 1024;

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
  const response = await fetchOfficialPdfResponse(sourceUrl, null);
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
    return getDocument({
      data: new Uint8Array(data),
      isEvalSupported: false,
      useSystemFonts: true,
      disableFontFace: false,
    }).promise;
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

  const sourceUrl = parseOfficialPdfUrl(req.query?.sourceUrl);
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
      host: (() => {
        try { return new URL(sourceUrl).hostname; } catch { return 'unknown'; }
      })(),
      message: String(error?.message || error),
      status: Number(error?.status) || undefined,
    });
    return res.status(502).json({ error: 'Não consegui localizar a página da questão agora. Tente novamente em instantes.' });
  }
}
