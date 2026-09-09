import { fetchOfficialPdfResponse, parseOfficialPdfUrl } from './_official-pdf-fetch';

const MAX_RANGE_BYTES = 2 * 1024 * 1024;
const MAX_FULL_PDF_BYTES = 30 * 1024 * 1024;

function parseRequestedRange(req: any) {
  const requestedStart = Number(req.query?.start);
  const requestedEnd = Number(req.query?.end);
  const queryChunked = Number.isInteger(requestedStart) && requestedStart >= 0;

  if (queryChunked) {
    const start = requestedStart;
    const end = Math.min(
      Number.isInteger(requestedEnd) && requestedEnd >= start
        ? requestedEnd
        : start + MAX_RANGE_BYTES - 1,
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
  return {
    chunked: true,
    start,
    end: Math.min(requestedHeaderEnd, start + MAX_RANGE_BYTES - 1),
  };
}

function hasPdfSignature(buffer: Buffer) {
  if (buffer.length < 5) return false;
  return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
}

export default async function handler(req: any, res: any) {
  if (!['GET', 'HEAD'].includes(req.method)) {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const url = parseOfficialPdfUrl(req.query?.url);
  if (!url) return res.status(400).json({ error: 'Fonte oficial inválida.' });

  const { chunked, start, end } = parseRequestedRange(req);
  const range = chunked && end !== null ? `bytes=${start}-${end}` : null;

  try {
    const response = await fetchOfficialPdfResponse(url, range);
    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length || buffer.length > MAX_FULL_PDF_BYTES) {
      return res.status(502).json({ error: 'PDF oficial inválido ou grande demais.' });
    }

    const upstreamRange = response.headers.get('content-range') || '';
    const totalFromRange = Number(upstreamRange.match(/\/(\d+)$/)?.[1]);
    const upstreamHonoredRange = response.status === 206 && /^bytes\s+\d+-\d+\//i.test(upstreamRange);

    // A full response (or a range beginning at byte zero) must carry the PDF magic
    // bytes. This prevents an anti-bot/error HTML page with HTTP 200 from reaching
    // PDF.js and becoming a confusing client-side parsing error.
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
      host: (() => {
        try { return new URL(url).hostname; } catch { return 'unknown'; }
      })(),
      message: String(error?.message || error),
      status: Number(error?.status) || undefined,
    });
    return res.status(502).json({ error: 'Não consegui acessar a fonte oficial agora. Tente novamente em instantes.' });
  }
}
