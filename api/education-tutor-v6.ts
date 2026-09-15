import { createClient } from '@supabase/supabase-js';
import tutorV5 from './education-tutor-v5.js';

const SUPABASE_URL=(process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL||'https://kmognvgnfisdchzffkgh.supabase.co').replace(/\/+$/,'');
const SUPABASE_ANON_KEY=process.env.SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_ANON_KEY||'';

function clip(value: unknown, max: number) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

async function hydrateSavedCourseTarget(req: any) {
  if (req?.method !== 'POST') return;
  const auth = String(req.headers?.authorization || '');
  if (!auth.startsWith('Bearer ')) return;
  const token = auth.slice(7).trim();
  if (!token) return;

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: userError } = await client.auth.getUser(token);
  const user = userData?.user;
  if (userError || !user) return;

  const { data: pref, error: prefError } = await client
    .from('student_exam_preferences')
    .select('exam_id,course_label,selected_area_id,selected_university_id,weekly_hours,current_scores,updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (prefError || !pref) return;

  let universityName = '';
  let courseLabel = clip(pref.course_label, 120);
  if (pref.selected_university_id) {
    const { data: university } = await client
      .from('area_universities')
      .select('university_name,course_label,area_id')
      .eq('area_university_id', pref.selected_university_id)
      .maybeSingle();
    universityName = clip(university?.university_name, 140);
    courseLabel = clip(university?.course_label || pref.course_label, 120);
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const context = body.context && typeof body.context === 'object' ? body.context : {};
  const savedTarget = [
    '[ALVO SALVO DO CURSO — FONTE DE VERDADE]',
    `Prova ativa: ${clip(pref.exam_id, 40)}.`,
    universityName ? `Faculdade: ${universityName}.` : '',
    courseLabel ? `Curso: ${courseLabel}.` : '',
    Number.isFinite(Number(pref.weekly_hours)) ? `Tempo semanal salvo: ${Number(pref.weekly_hours)}h.` : '',
    'Mantenha respostas, prioridades e recomendações coerentes com este alvo salvo. Não troque de faculdade, curso ou prova por inferência.',
  ].filter(Boolean).join(' ');

  const currentQuestion = clip(context.currentQuestion, 1500);
  req.body = {
    ...body,
    context: {
      ...context,
      exam: clip(pref.exam_id || context.exam || 'enem', 40).toLowerCase(),
      targetUniversity: universityName || undefined,
      targetCourse: courseLabel || undefined,
      selectedAreaId: clip(pref.selected_area_id, 100) || undefined,
      weeklyHours: pref.weekly_hours ?? context.weeklyHours,
      currentScores: pref.current_scores ?? context.currentScores,
      currentQuestion: currentQuestion ? `${currentQuestion}\n\n${savedTarget}` : savedTarget,
    },
  };
}

export default async function handler(req: any, res: any) {
  try {
    await hydrateSavedCourseTarget(req);
  } catch (error: any) {
    console.warn('tutor v6 enrichment skipped', error?.message || error);
  }
  return tutorV5(req, res);
}
