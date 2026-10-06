import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

type RateLimitOptions = {
  bucket: string;
  limit: number;
  windowSeconds: number;
};

function text(value: unknown) {
  return String(value ?? '').trim();
}

function clientSubject(req: any) {
  const forwarded = text(req.headers?.['x-forwarded-for']).split(',')[0]?.trim();
  const ip = forwarded || text(req.headers?.['x-real-ip']) || 'unknown';
  const ua = text(req.headers?.['user-agent']).slice(0, 160);
  return createHash('sha256').update(`${ip}\0${ua}`).digest('hex');
}

export async function enforceRateLimit(req: any, res: any, options: RateLimitOptions): Promise<boolean> {
  const url = text(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL).replace(/\/+$/, '');
  const serviceRoleKey = text(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!url || !serviceRoleKey) {
    console.warn('Rate limiter is not configured for this environment.');
    if (process.env.VERCEL_ENV === 'production') {
      res.status(503).json({ error: 'Serviço temporariamente indisponível.' });
      return false;
    }
    return true;
  }

  const subjectHash = clientSubject(req);
  const cutoff = new Date(Date.now() - options.windowSeconds * 1000).toISOString();
  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { count, error } = await admin
    .from('api_rate_limit_events')
    .select('id', { count: 'exact', head: true })
    .eq('bucket', options.bucket)
    .eq('subject_hash', subjectHash)
    .gte('created_at', cutoff);

  if (error) {
    console.error('Rate limit lookup failed', error.message);
    res.status(503).json({ error: 'Serviço temporariamente indisponível.' });
    return false;
  }

  if ((count ?? 0) >= options.limit) {
    res.setHeader('Retry-After', String(options.windowSeconds));
    res.status(429).json({ error: 'Muitas solicitações em pouco tempo. Tente novamente em alguns instantes.' });
    return false;
  }

  const { error: insertError } = await admin.from('api_rate_limit_events').insert({
    bucket: options.bucket,
    subject_hash: subjectHash,
  });
  if (insertError) {
    console.error('Rate limit write failed', insertError.message);
    res.status(503).json({ error: 'Serviço temporariamente indisponível.' });
    return false;
  }

  return true;
}
