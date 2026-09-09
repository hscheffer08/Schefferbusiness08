
export type UFMGDirectOfficialQuestion = {
  found: boolean;
  prompt: string;
  options: string[];
  needsSourceImage: boolean;
  sourcePage: number;
};

const PDFJS_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs';
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
const SUPABASE_PDF_PROXY = 'https://kmognvgnfisdchzffkgh.supabase.co/functions/v1/official-pdf-proxy';

let pdfjsPromise: Promise<any> | null = null;
const pdfCache = new Map<string, Promise<any>>();

function remoteImport(url: string) {
  const importer = new Function('u', 'return import(u)') as (u: string) => Promise<any>;
  return importer(url);
}

async function getPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = remoteImport(PDFJS_URL).then((mod: any) => {
      mod.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      return mod;
    });
  }
  return pdfjsPromise;
}

async function fetchPdfBytes(sourceUrl: string) {
  const urls = [
    `/api/proxy-official-pdf?url=${encodeURIComponent(sourceUrl)}`,
    `${SUPABASE_PDF_PROXY}?url=${encodeURIComponent(sourceUrl)}`,
  ];
  let lastError = '';
  for (const url of urls) {
    try {
      const response = await fetch(url, { cache: 'force-cache' });
      if (!response.ok) {
        lastError = `HTTP ${response.status}`;
        continue;
      }
      const data = await response.arrayBuffer();
      if (data.byteLength) return data;
      lastError = 'arquivo vazio';
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }
  throw new Error(`Não foi possível carregar a prova oficial${lastError ? `: ${lastError}` : ''}.`);
}

async function loadPdf(sourceUrl: string) {
  if (!pdfCache.has(sourceUrl)) {
    pdfCache.set(sourceUrl, (async () => {
      const lib = await getPdfJs();
      const bytes = await fetchPdfBytes(sourceUrl);
      return lib.getDocument({ data: new Uint8Array(bytes), useWorkerFetch: true, isEvalSupported: false }).promise;
    })());
  }
  return pdfCache.get(sourceUrl)!;
}

function clean(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

function pageLines(items: any[]) {
  const rows = new Map<number, { x: number; str: string }[]>();
  for (const item of items) {
    const str = String(item?.str ?? '').trim();
    if (!str) continue;
    const transform = item?.transform ?? [];
    const x = Number(transform[4] ?? 0);
    const y = Number(transform[5] ?? 0);
    const key = Math.round(y / 2) * 2;
    if (!rows.has(key)) rows.set(key, []);
    rows.get(key)!.push({ x, str });
  }
  return [...rows.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([, parts]) => clean(parts.sort((a, b) => a.x - b.x).map(part => part.str).join(' ')))
    .filter(Boolean);
}

function isQuestionMarker(line: string, questionNumber: number) {
  const normalized = normalize(line).replace(/[^A-Z0-9 ]+/g, ' ');
  return new RegExp(`\\bQUESTAO\\s+0*${questionNumber}\\b`).test(normalized)
    || new RegExp(`^\\s*0*${questionNumber}\\s*[.)-]\\s+\\S`, 'i').test(line);
}

function stripQuestionMarker(line: string, questionNumber: number) {
  return line
    .replace(new RegExp(`^\\s*QUEST(?:Ã|A)O\\s+0*${questionNumber}\\s*[.):-]?\\s*`, 'i'), '')
    .replace(new RegExp(`^\\s*0*${questionNumber}\\s*[.):-]\\s*`, 'i'), '')
    .trim();
}

function splitOptions(lines: string[]) {
  const markers: Array<{ index: number; letter: string; rest: string }> = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    const match = line.match(/^([A-D])\s*[).:-]?\s+(.+)$/i);
    if (match) markers.push({ index, letter: match[1].toUpperCase(), rest: match[2] });
  }

  for (let start = 0; start < markers.length; start += 1) {
    const sequence = markers.slice(start, start + 4);
    if (sequence.length < 4) continue;
    if (sequence.map(item => item.letter).join('') !== 'ABCD') continue;

    const prompt = clean(lines.slice(0, sequence[0].index).join(' '));
    const options = sequence.map((marker, optionIndex) => {
      const end = optionIndex < 3 ? sequence[optionIndex + 1].index : lines.length;
      return clean([marker.rest, ...lines.slice(marker.index + 1, end)].join(' '));
    });
    if (prompt && options.every(Boolean)) return { prompt, options };
  }
  return null;
}

export async function extractUFMGOfficialQuestion(
  sourceUrl: string,
  questionNumber: number,
  preferredPage: number,
): Promise<UFMGDirectOfficialQuestion> {
  const pdf = await loadPdf(sourceUrl);
  const startPage = Math.max(1, preferredPage - 1);
  const endPage = Math.min(pdf.numPages, preferredPage + 2);

  let started = false;
  let sourcePage = preferredPage;
  const collected: string[] = [];

  for (let pageNumber = startPage; pageNumber <= endPage; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const lines = pageLines(content.items ?? []);

    for (const line of lines) {
      if (!started) {
        if (!isQuestionMarker(line, questionNumber)) continue;
        started = true;
        sourcePage = pageNumber;
        const remainder = stripQuestionMarker(line, questionNumber);
        if (remainder) collected.push(remainder);
        continue;
      }

      if (isQuestionMarker(line, questionNumber + 1)) {
        const parsed = splitOptions(collected);
        if (!parsed) break;
        const combined = `${parsed.prompt} ${parsed.options.join(' ')}`;
        return {
          found: true,
          prompt: parsed.prompt,
          options: parsed.options,
          needsSourceImage: /\b(figura|imagem|gráfico|grafico|tabela|mapa|esquema|fotografia|charge|tirinha)\b/i.test(combined),
          sourcePage,
        };
      }
      collected.push(line);
    }
  }

  if (started) {
    const parsed = splitOptions(collected);
    if (parsed) {
      const combined = `${parsed.prompt} ${parsed.options.join(' ')}`;
      return {
        found: true,
        prompt: parsed.prompt,
        options: parsed.options,
        needsSourceImage: /\b(figura|imagem|gráfico|grafico|tabela|mapa|esquema|fotografia|charge|tirinha)\b/i.test(combined),
        sourcePage,
      };
    }
  }

  return { found: false, prompt: '', options: [], needsSourceImage: true, sourcePage: preferredPage };
}
