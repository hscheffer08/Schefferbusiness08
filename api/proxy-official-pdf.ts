function allowed(raw: unknown) {
  try {
    const url = new URL(String(raw || ''));
    if (url.protocol !== 'https:') return '';
    if (!['download.inep.gov.br', 'vestibular.cmmg.edu.br', 'www.fuvest.br', 'backend.copeve.ufmg.br'].includes(url.hostname)) return '';
    if (!/\.pdf$/i.test(url.pathname)) return '';
    return url.toString();
  } catch {
    return '';
  }
}

export default async function handler(req: any, res: any) {
  if (!['GET', 'HEAD'].includes(req.method)) return res.status(405).json({ error: 'Método não permitido.' });
  const url = allowed(req.query?.url);
  if (!url) return res.status(400).json({ error: 'Fonte oficial inválida.' });

  const requestedStart = Number(req.query?.start);
  const requestedEnd = Number(req.query?.end);
  const chunked = Number.isInteger(requestedStart) && requestedStart >= 0;
  const start = chunked ? requestedStart : 0;
  const end = chunked
    ? Math.min(Number.isInteger(requestedEnd) && requestedEnd >= start ? requestedEnd : start + 2 * 1024 * 1024 - 1, start + 2 * 1024 * 1024 - 1)
    : null;

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(30000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ConectaeOfficialReader/1.0)',
        Accept: 'application/pdf,*/*;q=0.8',
        ...(chunked ? { Range: `bytes=${start}-${end}` } : {}),
      },
    });
    if (!response.ok) return res.status(502).json({ error: 'A fonte oficial não respondeu.' });
    const type = response.headers.get('content-type') || '';
    if (!type.toLowerCase().includes('pdf')) return res.status(502).json({ error: 'A fonte retornou um arquivo inválido.' });
    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length || buffer.length > 30 * 1024 * 1024) return res.status(502).json({ error: 'PDF oficial inválido ou grande demais.' });

    const upstreamRange = response.headers.get('content-range') || '';
    const totalFromRange = Number(upstreamRange.match(/\/(\d+)$/)?.[1]);
    const total = Number.isFinite(totalFromRange) ? totalFromRange : Number(response.headers.get('content-length')) || buffer.length;
    const payload = chunked ? buffer.subarray(0, Math.min(buffer.length, end! - start + 1)) : buffer;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', String(payload.length));
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('X-Pdf-Size', String(total));
    res.setHeader('Access-Control-Expose-Headers', 'X-Pdf-Size, Content-Range, Accept-Ranges');
    if (chunked) {
      const actualEnd = start + payload.length - 1;
      res.setHeader('Content-Range', `bytes ${start}-${actualEnd}/${total}`);
      if (req.method === 'HEAD') return res.status(206).end();
      return res.status(206).send(payload);
    }
    if (req.method === 'HEAD') return res.status(200).end();
    return res.status(200).send(payload);
  } catch (error: any) {
    console.error('proxy-official-pdf failed', error?.message || error);
    return res.status(502).json({ error: 'Não consegui acessar a fonte oficial agora.' });
  }
}
