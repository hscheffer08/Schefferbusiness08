import { createClient } from '@supabase/supabase-js';
import { verifyBiologyAccessToken } from './_biology-access.js';

function json(res: any, status: number, body: unknown) {
  res.setHeader('Cache-Control', 'private, no-store');
  return res.status(status).json(body);
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Método não permitido.' });
  const auth = String(req.headers.authorization || '');
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!verifyBiologyAccessToken(token)) return json(res, 401, { error: 'Acesso ao curso expirado. Digite a senha novamente.' });

  const url = String(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const serviceRoleKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!url || !serviceRoleKey) return json(res, 500, { error: 'Servidor não configurado.' });

  const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin
    .from('biology_course_materials')
    .select('id,lesson_key,file_name,storage_path,format,mime_type,size_bytes')
    .order('lesson_key')
    .order('format');
  if (error) {
    console.error('Biology materials lookup failed', error.message);
    return json(res, 500, { error: 'Não foi possível carregar os materiais.' });
  }

  const rows = await Promise.all((data || []).map(async (row: any) => {
    const signed = await admin.storage.from('biology-course-materials').createSignedUrl(row.storage_path, 3600);
    return { ...row, url: signed.data?.signedUrl || null };
  }));
  return json(res, 200, { materials: rows.filter((row: any) => row.url) });
}
