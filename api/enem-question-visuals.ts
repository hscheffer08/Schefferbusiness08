const DIMVS_BASE = 'https://dimvs.com';
const IMAGE_HOST = 'zospydaosoqbdpxgpnni.supabase.co';
const IMAGE_BASE = `https://${IMAGE_HOST}/storage/v1/object/public/images/enem`;

type VisualPayload = {
  images: string[];
  option_images: Record<string, string>;
  source_question_number?: number;
};

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function stripHtml(value: string) {
  return decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function tokens(value: string) {
  return new Set(normalize(value).split(' ').filter((word) => word.length >= 4));
}

function similarity(a: string, b: string) {
  const na = normalize(a);
  const nb = normalize(b);
  if (!na || !nb) return 0;
  const prefix = na.slice(0, 90);
  if (prefix.length >= 35 && nb.includes(prefix)) return 1;
  const ta = tokens(a);
  const tb = tokens(b);
  if (!ta.size || !tb.size) return 0;
  let common = 0;
  for (const item of ta) if (tb.has(item)) common += 1;
  return common / Math.max(1, Math.min(ta.size, tb.size));
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    redirect: 'follow',
    signal: AbortSignal.timeout(15000),
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ConectaeVisualReader/1.2)',
      Accept: 'text/html,application/xhtml+xml',
    },
  });
  if (!response.ok) throw new Error(`Visual source HTTP ${response.status}`);
  return response.text();
}

function findQuestionHref(indexHtml: string, prompt: string, questionNumber: number) {
  const anchors = [...indexHtml.matchAll(/<a\b[^>]*href=["']([^"']*\/public\/question\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];
  let best: { href: string; score: number; number?: number } | null = null;
  for (const match of anchors) {
    const href = decodeHtml(match[1]);
    const text = stripHtml(match[2]);
    if (!text) continue;
    const number = Number(text.match(/\bQ\.?\s*(\d{1,3})\b/i)?.[1]);
    const semantic = similarity(prompt, text);
    let score = semantic;
    if (Number.isInteger(number) && number === questionNumber) score = Math.max(score, 0.72);
    // Different ENEM booklet colors reorder questions. A strong text match must
    // beat an accidental number match from another color.
    if (semantic >= 0.58) score = Math.max(score, 0.9 + Math.min(0.09, semantic / 10));
    if (!best || score > best.score) best = { href, score, number: Number.isInteger(number) ? number : undefined };
  }
  if (!best || best.score < 0.42) return null;
  return best;
}

function attr(tag: string, name: string) {
  const match = tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, 'i'));
  return match ? decodeHtml(match[1]) : '';
}

function cleanVisualUrl(raw: string) {
  try {
    const cleaned = raw.replace(/[\]})>,;]+$/g, '');
    const url = new URL(cleaned, DIMVS_BASE);
    if (url.hostname !== IMAGE_HOST) return '';
    if (!url.pathname.startsWith('/storage/v1/object/public/images/enem/')) return '';
    return url.toString();
  } catch {
    return '';
  }
}

function parseQuestionNumber(html: string) {
  const plain = stripHtml(html.slice(0, 12000));
  const match = plain.match(/Quest[aã]o\s+(\d{1,3})/i);
  const number = Number(match?.[1]);
  return Number.isInteger(number) ? number : undefined;
}

function parseVisuals(html: string): VisualPayload {
  const images: string[] = [];
  const optionImages: Record<string, string> = {};
  const seen = new Set<string>();
  const tags = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);

  for (const tag of tags) {
    const candidates = [attr(tag, 'src'), attr(tag, 'data-src')].filter(Boolean);
    let url = '';
    for (const candidate of candidates) {
      url = cleanVisualUrl(candidate);
      if (url) break;
    }
    if (!url || seen.has(url)) continue;
    seen.add(url);

    const alt = normalize(attr(tag, 'alt'));
    const pathName = new URL(url).pathname.split('/').pop() || '';
    const letter = pathName.match(/_([a-e])(?:\.[a-z0-9]+)+$/i)?.[1]?.toUpperCase();
    if (alt.includes('alternativa') && letter) optionImages[letter] = url;
    else images.push(url);
  }

  if (!images.length && !Object.keys(optionImages).length) {
    const loose = html.match(/https:\/\/zospydaosoqbdpxgpnni\.supabase\.co\/storage\/v1\/object\/public\/images\/enem\/[^"'<>\\\s]+/gi) || [];
    for (const raw of loose) {
      const url = cleanVisualUrl(decodeHtml(raw.replace(/\\u0026/g, '&')));
      if (!url || seen.has(url)) continue;
      seen.add(url);
      images.push(url);
    }
  }

  return { images, option_images: optionImages, source_question_number: parseQuestionNumber(html) };
}

async function imageExists(url: string) {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(6000),
      headers: { 'User-Agent': 'ConectaeVisualProbe/1.0', Accept: 'image/*,*/*;q=0.8' },
    });
    if (!response.ok) return false;
    const type = (response.headers.get('content-type') || '').toLowerCase();
    return !type || type.startsWith('image/');
  } catch {
    return false;
  }
}

async function storageFallback(year: number, questionNumber: number) {
  for (const extension of ['png', 'jpg', 'jpeg', 'webp']) {
    const url = `${IMAGE_BASE}/${year}/${questionNumber}.${extension}`;
    if (await imageExists(url)) return url;
  }
  return '';
}

function requestOrigin(req: any) {
  const forwardedHost = String(req.headers?.['x-forwarded-host'] || '').split(',')[0].trim();
  const directHost = String(req.headers?.host || '').trim();
  const host = forwardedHost || directHost;
  const safeHost = /^[a-z0-9.-]+(?::\d+)?$/i.test(host) ? host : 'xn--conecta-pya.app';
  const forwardedProto = String(req.headers?.['x-forwarded-proto'] || '').split(',')[0].trim();
  const proto = forwardedProto === 'http' && /^(localhost|127\.0\.0\.1)(?::\d+)?$/i.test(safeHost) ? 'http' : 'https';
  return `${proto}://${safeHost}`;
}

function proxied(req: any, sourceUrl: string) {
  return `${requestOrigin(req)}/api/proxy-enem-image?url=${encodeURIComponent(sourceUrl)}`;
}

function proxyPayload(req: any, payload: VisualPayload) {
  return {
    ...payload,
    images: payload.images.map((url) => proxied(req, url)),
    option_images: Object.fromEntries(Object.entries(payload.option_images).map(([letter, url]) => [letter, proxied(req, url)])),
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' });
  const year = Number(req.query?.year);
  const questionNumber = Number(req.query?.questionNumber);
  const prompt = String(req.query?.prompt || '').trim();
  if (!Number.isInteger(year) || year < 2019 || year > 2026 || !Number.isInteger(questionNumber) || questionNumber < 1 || questionNumber > 180 || prompt.length < 20) {
    return res.status(400).json({ error: 'Questão ENEM inválida.' });
  }

  try {
    const day = questionNumber <= 90 ? 1 : 2;
    const indexUrl = `${DIMVS_BASE}/public/provas/enem/${year}/dia-${day}`;
    let sourceUrl = '';
    let resolvedQuestionNumber = questionNumber;
    let payload: VisualPayload = { images: [], option_images: {}, source_question_number: questionNumber };

    try {
      const indexHtml = await fetchText(indexUrl);
      const best = findQuestionHref(indexHtml, prompt, questionNumber);
      if (best) {
        sourceUrl = new URL(best.href, DIMVS_BASE).toString();
        if (Number.isInteger(best.number)) resolvedQuestionNumber = Number(best.number);
        try {
          const questionHtml = await fetchText(sourceUrl);
          payload = parseVisuals(questionHtml);
          if (Number.isInteger(payload.source_question_number)) resolvedQuestionNumber = Number(payload.source_question_number);
        } catch (error: any) {
          console.warn('enem-question-visuals detail fetch failed', error?.message || error);
        }
      }
    } catch (error: any) {
      console.warn('enem-question-visuals index fetch failed', error?.message || error);
    }

    if (!payload.images.length && !Object.keys(payload.option_images).length && sourceUrl) {
      const fallback = await storageFallback(year, resolvedQuestionNumber);
      if (fallback) payload.images = [fallback];
    }

    res.setHeader('Cache-Control', 'public, s-maxage=2592000, stale-while-revalidate=7776000');
    if (!payload.images.length && !Object.keys(payload.option_images).length) {
      return res.status(404).json({ images: [], option_images: {}, source_question_number: resolvedQuestionNumber, source_url: sourceUrl || null });
    }
    return res.status(200).json({ ...proxyPayload(req, payload), source_question_number: resolvedQuestionNumber, source_url: sourceUrl || null });
  } catch (error: any) {
    console.error('enem-question-visuals failed', error?.message || error);
    return res.status(502).json({ error: 'Não consegui carregar a imagem original desta questão agora.', images: [], option_images: {} });
  }
}
