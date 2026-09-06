function allowed(raw: unknown) {
  try {
    const url = new URL(String(raw || ''));
    if (url.protocol !== 'https:') return '';
    if (!['download.inep.gov.br', 'vestibular.cmmg.edu.br'].includes(url.hostname)) return '';
    if (!/\.pdf$/i.test(url.pathname)) return '';
    return url.toString();
  } catch {
    return '';
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' });
  const url = allowed(req.query?.url);
  if (!url) return res.status(400).json({ error: 'Fonte oficial inválida.' });

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(30000),
      headers: { 'User-Agent': 'Conectae/1.0 (+official-question-reader)' },
    });
    if (!response.ok) return res.status(502).json({ error: 'A fonte oficial não respondeu.' });
    const type = response.headers.get('content-type') || '';
    if (!type.toLowerCase().includes('pdf')) return res.status(502).json({ error: 'A fonte retornou um arquivo inválido.' });
    const buffer = Buffer.from(await response.arrayBuffer());
    if (!buffer.length || buffer.length > 30 * 1024 * 1024) return res.status(502).json({ error: 'PDF oficial inválido ou grande demais.' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', String(buffer.length));
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).send(buffer);
  } catch (error: any) {
    console.error('proxy-official-pdf failed', error?.message || error);
    return res.status(502).json({ error: 'Não consegui acessar a fonte oficial agora.' });
  }
}
