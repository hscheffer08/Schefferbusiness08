import { createHash } from 'node:crypto';
import { enforceRateLimit } from './_rate-limit.js';
import { issueBiologyAccessToken } from './_biology-access.js';

const PASSWORD_HASH = 'd5079fb31cbfb819f31142c68d0ad3bd26772e60c208bcea2aecc1efb8df2cb6';

function json(res: any, status: number, body: Record<string, unknown>) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(body);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });
  if (!await enforceRateLimit(req, res, { bucket: 'biology-course-redeem', limit: 10, windowSeconds: 300 })) return;

  const password = String(req.body?.password || '').trim();
  const suppliedHash = createHash('sha256').update(password).digest('hex');
  if (suppliedHash !== PASSWORD_HASH) return json(res, 403, { error: 'Senha incorreta.' });
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return json(res, 500, { error: 'Servidor não configurado.' });
  return json(res, 200, { ok: true, token: issueBiologyAccessToken() });
}
