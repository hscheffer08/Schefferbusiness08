import { createClient } from '@supabase/supabase-js';
import tutorV5 from './education-tutor-v5.js';
import { SAS5_DAY1_2026_META, sas5Day1Key, sas5Day1Question } from './sas5-day1-2026.js';

const SUPABASE_URL='https://kmognvgnfisdchzffkgh.supabase.co';
const SUPABASE_ANON_KEY='sb_publishable_2DCxkYOlTKqsVjDxYg5pxg_pf5YqdTA';

function clip(value: unknown, max: number) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function latestUserText(req:any){
  const messages=Array.isArray(req?.body?.messages)?req.body.messages:[];
  return String([...messages].reverse().find((m:any)=>m?.role==='user')?.content||'');
}

function injectSasCorpus(req:any){
  if(req?.method!=='POST'||!req?.body||typeof req.body!=='object')return;
  const latest=latestUserText(req);
  const context=req.body.context&&typeof req.body.context==='object'?req.body.context:{};
  const joined=`${latest} ${context.currentQuestion||''}`;
  const isSas=/\bSAS\b|5\s*[ºoª]?\s*simulado|simulado\s+SAS|SAS\s*5/i.test(joined);
  if(!isSas)return;

  const qMatch=joined.match(/(?:quest(?:ão|ao)|q)\s*[.º°:#-]*\s*(90|[1-8]?\d)\b/i);
  const q=qMatch?Number(qMatch[1]):null;
  const item=q&&q>=1&&q<=90?sas5Day1Question(q):null;
  const corpus=item
    ? `[CORPUS SAS 5 - DIA 1 2026] Questão ${item.q}: gabarito analítico ${item.answer}; área ${item.area}; foco: ${item.focus}; confiança ${item.confidence}. ${SAS5_DAY1_2026_META.status}. ${item.confidence==='medium'?SAS5_DAY1_2026_META.note:''} Use esta referência para conferir a resolução, mas explique o raciocínio a partir do enunciado apresentado pelo aluno e nunca chame este gabarito de oficial.`
    : `[CORPUS SAS 5 - DIA 1 2026] ${SAS5_DAY1_2026_META.label}. ${SAS5_DAY1_2026_META.status}. Gabarito analítico de referência: ${sas5Day1Key()}. ${SAS5_DAY1_2026_META.note} Se o aluno indicar uma questão específica, use o item correspondente e explique a lógica, sem afirmar que é gabarito oficial.`;

  const current=clip(context.currentQuestion,1500);
  req.body={...req.body,context:{...context,currentQuestion:clip(current?`${current}\n\n${corpus}`:corpus,3000)}};
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
    injectSasCorpus(req);
  } catch (error: any) {
    console.warn('tutor v6 enrichment skipped', error?.message || error);
  }
  return tutorV5(req, res);
}
