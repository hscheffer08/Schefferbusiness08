import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { enforceRateLimit } from './_rate-limit.js';

const PASSWORD_HASH = '4097fd1d8435953124d3f836ca2ae42f5dd97168871d5107df2fb7370fbdfb9d';

function json(res: any, status: number, body: Record<string, unknown>) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(body);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });
  if (!await enforceRateLimit(req, res, { bucket: 'essay-course-redeem', limit: 10, windowSeconds: 300 })) return;

  const auth = String(req.headers.authorization || '');
  if (!auth.startsWith('Bearer ')) return json(res, 401, { error: 'Autenticação necessária.' });

  const url = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const anonKey = String(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url || !anonKey || !serviceRoleKey) return json(res, 500, { error: 'Servidor não configurado.' });

  const token = auth.slice(7).trim();
  const caller = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await caller.auth.getUser(token);
  if (userError || !userData.user) return json(res, 401, { error: 'Sessão inválida.' });

  const password = String(req.body?.password || '').trim();
  const suppliedHash = createHash('sha256').update(password).digest('hex');
  if (suppliedHash !== PASSWORD_HASH) return json(res, 403, { error: 'Senha incorreta.' });

  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await admin.from('essay_course_access').upsert({
    user_id: userData.user.id,
    access_method: 'password',
    granted_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  if (error) {
    console.error('Essay access grant failed', error.message);
    return json(res, 500, { error: 'Não foi possível liberar o acesso agora.' });
  }
  return json(res, 200, { ok: true });
}
