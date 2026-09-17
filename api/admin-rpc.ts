import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_RPCS = new Set([
  'get_admin_sessions',
  'get_admin_session_answers',
  'get_admin_impact_stats',
  'get_admin_traffic_stats',
]);

function json(res: VercelResponse, status: number, body: Record<string, unknown>) {
  return res.status(status).json(body);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });

  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return json(res, 401, { error: 'Autenticação necessária.' });

  const token = authHeader.slice(7);
  const { createClient } = await import('@supabase/supabase-js');

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !anonKey || !serviceKey) return json(res, 500, { error: 'Servidor não configurado.' });

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData.user) return json(res, 401, { error: 'Sessão inválida.' });

  // getUser(token) verifies the bearer token with Supabase Auth. Use the
  // verified user's app_metadata directly instead of getSession(), because
  // this stateless server request has no persisted browser auth session.
  const isAdmin = userData.user.app_metadata?.role === 'admin';
  if (!isAdmin) return json(res, 403, { error: 'Acesso negado: admin necessário.' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const rpcName = String(body?.rpc || '');
  if (!ALLOWED_RPCS.has(rpcName)) return json(res, 400, { error: 'RPC não permitida.' });

  const serviceClient = createClient(supabaseUrl, serviceKey);
  const { data, error } = await serviceClient.rpc(rpcName, body?.params || {});

  if (error) return json(res, 500, { error: error.message });
  return json(res, 200, { data });
}
