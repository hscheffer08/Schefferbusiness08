const COURSE_SUPABASE_URL = 'https://kmognvgnfisdchzffkgh.supabase.co';
const COURSE_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttb2dudmduZmlzZGNoemZma2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MzkxNjksImV4cCI6MjEwMjMxNTE2OX0.JarpsXfgv8PplL3Ryvs6iFfEPiv_rnp2Cx5i1I67fCk';

/**
 * The Course frontend is intentionally pinned to the canonical Supabase project.
 * The tutor API must validate the bearer token against that exact same project.
 * Do not let stale Vercel SUPABASE_* variables select a different project here.
 */
function pinCourseSupabaseEnvironment() {
  process.env.SUPABASE_URL = COURSE_SUPABASE_URL;
  process.env.VITE_SUPABASE_URL = COURSE_SUPABASE_URL;
  process.env.SUPABASE_ANON_KEY = COURSE_SUPABASE_ANON_KEY;
  process.env.VITE_SUPABASE_ANON_KEY = COURSE_SUPABASE_ANON_KEY;
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY = COURSE_SUPABASE_ANON_KEY;
}

export default async function handler(req: any, res: any) {
  pinCourseSupabaseEnvironment();
  const { default: tutor } = await import('./education-tutor-v5.js');
  return tutor(req, res);
}
