const IMAGE_HOST = 'zospydaosoqbdpxgpnni.supabase.co';
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function allowedImageUrl(raw: unknown) {
  try {
    const url = new URL(String(raw || ''));
    if (url.protocol !== 'https:' || url.hostname !== IMAGE_HOST) return '';
    if (!url.pathname.startsWith('/storage/v1/object/public/images/enem/')) return '';
    if (!/\.(?:png|jpe?g|webp|gif)$/i.test(url.pathname)) return '';
    return url.toString();
  } catch {
    return '';
  }
}

export default async function handler(req: any, res: any) {
  if (!['GET', 'HEAD'].includes(req.method)) {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  const sourceUrl = allowedImageUrl(req.query?.url);
  if (!sourceUrl) return res.status(400).json({ error: 'Imagem inválida.' });

  try {
    const response = await fetch(sourceUrl, {
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (compatible; ConectaeEnemImageProxy/1.0)',
      },
    });

    if (!response.ok) return res.status(response.status === 404 ? 404 : 502).end();
    const type = (response.headers.get('content-type') || '').toLowerCase();
    if (!type.startsWith('image/')) return res.status(502).end();

    const length = Number(response.headers.get('content-length') || 0);
    if (length > MAX_IMAGE_BYTES) return res.status(413).end();

    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=7776000');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method === 'HEAD') return res.status(200).end();

    const data = await response.arrayBuffer();
    if (!data.byteLength || data.byteLength > MAX_IMAGE_BYTES) return res.status(413).end();
    return res.status(200).send(Buffer.from(data));
  } catch (error: any) {
    console.error('proxy-enem-image failed', error?.message || error);
    return res.status(502).end();
  }
}
