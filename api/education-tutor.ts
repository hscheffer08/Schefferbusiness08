/**
 * Tutor entrypoint.
 *
 * IMPORTANT: do not overwrite Supabase credentials here. The frontend and API
 * must use the same current Vercel environment. A hardcoded anon key can become
 * stale after a Supabase key rotation and makes valid Course sessions fail with
 * 401 even while the browser is correctly logged in.
 */
export default async function handler(req: any, res: any) {
  const { default: tutor } = await import('./education-tutor-v5.js');
  return tutor(req, res);
}
