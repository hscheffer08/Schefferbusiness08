const FALLBACK_SUPABASE_URL = 'https://kmognvgnfisdchzffkgh.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttb2dudmduZmlzZGNoemZma2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MzkxNjksImV4cCI6MjEwMjMxNTE2OX0.JarpsXfgv8PplL3Ryvs6iFfEPiv_rnp2Cx5i1I67fCk';

function clean(value: unknown) {
  return String(value ?? '').trim().replace(/^["']|["']$/g, '');
}

function isPlaceholder(value: unknown) {
  return /(?:^|[._-])(x{4,}|placeholder|changeme|seu-projeto|your-project|sua-chave)(?:[._-]|$)/i.test(clean(value));
}

function hasValidSupabaseHost(value: unknown) {
  const raw = clean(value);
  if (!raw || isPlaceholder(raw)) return false;
  try {
    const parsed = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    return /^[a-z0-9-]+\.supabase\.co$/i.test(parsed.hostname) && !isPlaceholder(parsed.hostname);
  } catch {
    return false;
  }
}

function sanitizeSupabaseEnvironment() {
  const serverUrl = clean(process.env.SUPABASE_URL);
  const viteUrl = clean(process.env.VITE_SUPABASE_URL);
  const chosenUrl = hasValidSupabaseHost(serverUrl)
    ? serverUrl
    : hasValidSupabaseHost(viteUrl)
      ? viteUrl
      : FALLBACK_SUPABASE_URL;

  const serverKey = clean(process.env.SUPABASE_ANON_KEY);
  const viteKey = clean(process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
  const chosenKey = serverKey && !isPlaceholder(serverKey)
    ? serverKey
    : viteKey && !isPlaceholder(viteKey)
      ? viteKey
      : FALLBACK_SUPABASE_ANON_KEY;

  process.env.SUPABASE_URL = chosenUrl;
  process.env.SUPABASE_ANON_KEY = chosenKey;
}

export default async function handler(req: any, res: any) {
  sanitizeSupabaseEnvironment();
  const { default: tutor } = await import('./education-tutor-v5.js');
  return tutor(req, res);
}
