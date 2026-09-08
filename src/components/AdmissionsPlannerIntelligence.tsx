import { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  ArrowLeft, BarChart3, BookOpen, BrainCircuit, CalendarDays, Camera, CheckCircle2,
  ChevronRight, Clock3, Database, Download, ExternalLink, FileScan, Flame,
  GraduationCap, Loader2, PlayCircle, Save, ShieldCheck, Sparkles, Target,
  TimerReset, TrendingUp, Video, XCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type ExamId = 'enem' | 'fuvest' | 'insper' | 'link' | 'cmmg';
type Tab = 'dashboard' | 'plan' | 'scanner' | 'database';

type ExamProfile = { exam_id: ExamId; label: string; institution: string; exam_date: string | null; format_summary: string; official_source_url: string; scoring_model: Record<string, unknown>; stages: Array<Record<string, unknown>>; priorities: Record<string, unknown> };
type SkillRow = { id: number; exam_id: ExamId; area: string; skill_code: string; skill_name: string; parent_skill: string | null; importance: number; diagnostic_tags: string[] };
type ResourceRow = { id: number; exam_id: ExamId; resource_type: string; year: number | null; label: string; url: string; metadata: Record<string, unknown> };
type StudyResource = { id: number; exam_id: ExamId; area: string | null; skill_name: string | null; resource_type: string; title: string; url: string | null; search_query: string | null; description: string | null; official: boolean; priority: number };
type PracticeQuestion = { id: number; exam_id: ExamId; area: string; skill_name: string; difficulty: number; prompt: string; option_a: string | null; option_b: string | null; option_c: string | null; option_d: string | null; option_e: string | null; correct_option: string | null; explanation: string | null; estimated_minutes: number | null; source_basis: string | null };
type CourseTarget = { exam_id: ExamId; course_label: string; target_kind: string; target_value: number | null; target_range: { low?: number; high?: number }; area_weights: Record<string, number>; confidence: 'official' | 'historical' | 'estimated'; rationale: string | null };
type AcademicArea = { area_id: string; name: string; courses: string };
type University = { area_university_id: number; area_id: string; university_name: string; course_label: string; institution_type: string | null };
type Metric = { key: string; label: string; max: number; defaultValue: number; unit: string };
type Priority = { metric: Metric; current: number; goal: number; gap: number; score: number; skills: SkillRow[]; comfort: boolean };

const EXAM_ORDER: ExamId[] = ['enem', 'fuvest', 'insper', 'link', 'cmmg'];
const FALLBACK_LABELS: Record<ExamId, string> = { enem: 'ENEM 2026', fuvest: 'FUVEST 2027', insper: 'Insper 2027.1', link: 'Link Journey 2027.1', cmmg: 'Ciências Médicas-MG 2027.1' };
const METRICS: Record<ExamId, Metric[]> = {
  enem: [
    { key: 'Linguagens', label: 'Linguagens', max: 45, defaultValue: 28, unit: 'acertos' },
    { key: 'Humanas', label: 'Humanas', max: 45, defaultValue: 29, unit: 'acertos' },
    { key: 'Natureza', label: 'Natureza', max: 45, defaultValue: 24, unit: 'acertos' },
    { key: 'Matemática', label: 'Matemática', max: 45, defaultValue: 26, unit: 'acertos' },
    { key: 'Redação', label: 'Redação', max: 1000, defaultValue: 760, unit: 'pontos' },
  ],
  fuvest: [
    { key: '1ª fase', label: '1ª fase', max: 80, defaultValue: 52, unit: 'acertos' },
    { key: 'Português', label: 'Português discursivo', max: 100, defaultValue: 58, unit: '%' },
    { key: '2ª fase', label: 'Específicas 2ª fase', max: 100, defaultValue: 55, unit: '%' },
    { key: 'Redação', label: 'Redação', max: 100, defaultValue: 62, unit: '%' },
  ],
  insper: [
    { key: 'Objetivas', label: 'Objetivas', max: 60, defaultValue: 39, unit: 'acertos' },
    { key: 'Matemática', label: 'Matemática', max: 100, defaultValue: 68, unit: '%' },
    { key: 'Linguagens', label: 'Linguagens', max: 100, defaultValue: 72, unit: '%' },
    { key: 'Redação', label: 'Redação', max: 100, defaultValue: 67, unit: '%' },
  ],
  link: [
    { key: 'Matemática', label: 'Matemática SPRINT', max: 100, defaultValue: 65, unit: '%' },
    { key: 'Business Case', label: 'Business case', max: 100, defaultValue: 58, unit: '%' },
    { key: 'Escrita', label: 'Comunicação escrita', max: 100, defaultValue: 68, unit: '%' },
    { key: 'Oral', label: 'Comunicação oral', max: 100, defaultValue: 70, unit: '%' },
    { key: 'Portfólio', label: 'PREP / portfólio', max: 100, defaultValue: 62, unit: '%' },
  ],
  cmmg: [
    { key: 'Biologia', label: 'Biologia', max: 100, defaultValue: 66, unit: '%' },
    { key: 'Química', label: 'Química', max: 100, defaultValue: 62, unit: '%' },
    { key: 'Física', label: 'Física', max: 100, defaultValue: 58, unit: '%' },
    { key: 'Matemática', label: 'Matemática', max: 100, defaultValue: 61, unit: '%' },
    { key: 'Linguagens', label: 'Linguagens', max: 100, defaultValue: 70, unit: '%' },
    { key: 'Literatura', label: 'Campo Geral', max: 100, defaultValue: 45, unit: '%' },
  ],
};

function normalize(s: string) { return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
function examFromUniversity(name: string): ExamId {
  const n = normalize(name);
  if (n.includes('insper')) return 'insper';
  if (n.includes('link school') || n === 'link') return 'link';
  if (n.includes('ciencias medicas') || n.includes('fcm-mg')) return 'cmmg';
  if (n.includes('usp') || n.includes('universidade de sao paulo')) return 'fuvest';
  return 'enem';
}
function daysUntil(date: string | null) { if (!date) return null; const now = new Date(); now.setHours(0,0,0,0); return Math.max(0, Math.ceil((new Date(`${date}T12:00:00`).getTime() - now.getTime()) / 86400000)); }
function weightFor(metric: Metric, weights: Record<string, number>) { const mk = normalize(metric.key); return Object.entries(weights).find(([k]) => mk.includes(normalize(k)) || normalize(k).includes(mk))?.[1] ?? 1; }
function fallbackTarget(course: string, exam: ExamId): CourseTarget {
  const c = normalize(course); const health = /medicina|odontologia|farmacia|biomedicina|enfermagem|fisioterapia|nutricao|veterinaria|fono/.test(c); const quant = /engenharia|computacao|economia|matematica|fisica|quimica/.test(c); const hum = /direito|relacoes internacionais|historia|geografia|letras|jornalismo/.test(c);
  const base = exam === 'enem' ? (health ? 815 : quant ? 770 : hum ? 755 : 735) : exam === 'link' ? 85 : health ? 86 : 82;
  return { exam_id: exam, course_label: course, target_kind: exam === 'enem' ? 'competitive_score' : 'readiness_pct', target_value: base, target_range: exam === 'enem' ? { low: base - 15, high: base + 15 } : { low: base - 5, high: Math.min(96, base + 6) }, area_weights: {}, confidence: 'estimated', rationale: 'Meta competitiva de preparação; não é um corte oficial universal.' };
}
function baseTargetForMetric(exam: ExamId, metric: Metric, target: CourseTarget) {
  const base = target.target_value ?? (exam === 'enem' ? 780 : 82); const w = weightFor(metric, target.area_weights ?? {});
  if (exam === 'enem') {
    if (metric.key === 'Redação') return clamp(Math.round(770 + (base - 700) * 1.02 + (w - .2) * 120), 760, 960);
    return clamp(Math.round(29 + Math.max(0, (base - 700) / 135) * 10 + (w - .2) * 16), 27, 43);
  }
  if (metric.key === '1ª fase') return clamp(Math.round(80 * (base / 100)), 54, 76);
  if (metric.key === 'Objetivas') return clamp(Math.round(60 * (base / 100)), 40, 58);
  return clamp(Math.round(78 + (w - 1) * 12), Math.round(metric.max * .68), metric.max);
}

export default function AdmissionsPlannerIntelligence({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<ExamProfile[]>([]);
  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [studyResources, setStudyResources] = useState<StudyResource[]>([]);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [targets, setTargets] = useState<CourseTarget[]>([]);
  const [areas, setAreas] = useState<AcademicArea[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [examId, setExamId] = useState<ExamId>('enem');
  const [values, setValues] = useState<Record<string, number>>({});
  const [comfortAreas, setComfortAreas] = useState<string[]>([]);
  const [weeklyHours, setWeeklyHours] = useState(8);
  const [questionText, setQuestionText] = useState('');
  const [scannerResult, setScannerResult] = useState<SkillRow | null>(null);
  const [scannerConfidence, setScannerConfidence] = useState(0);
  const [errorType, setErrorType] = useState('conteúdo');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [activeQuestion, setActiveQuestion] = useState<PracticeQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [practiceResult, setPracticeResult] = useState<boolean | null>(null);
  const [practiceCorrect, setPracticeCorrect] = useState(0);
  const [practiceTotal, setPracticeTotal] = useState(0);

  useEffect(() => {
    let live = true;
    (async () => {
      if (!supabase) { setLoading(false); return; }
      const [p,s,r,sr,q,t,a,u] = await Promise.all([
        supabase.from('exam_intelligence_profiles').select('*').in('exam_id', EXAM_ORDER),
        supabase.from('exam_skill_taxonomy').select('*').in('exam_id', EXAM_ORDER).order('importance', { ascending: false }),
        supabase.from('exam_resources').select('*').in('exam_id', EXAM_ORDER).order('year', { ascending: false }),
        supabase.from('exam_study_resources').select('*').eq('active', true).in('exam_id', EXAM_ORDER).order('priority', { ascending: false }),
        supabase.from('exam_practice_questions').select('*').eq('active', true).in('exam_id', EXAM_ORDER),
        supabase.from('course_exam_targets').select('*').in('exam_id', EXAM_ORDER),
        supabase.from('academic_areas').select('area_id,name,courses').order('name'),
        supabase.from('area_universities').select('area_university_id,area_id,university_name,course_label,institution_type').order('university_name'),
      ]);
      if (!live) return;
      setProfiles((p.data ?? []) as ExamProfile[]); setSkills((s.data ?? []) as SkillRow[]); setResources((r.data ?? []) as ResourceRow[]); setStudyResources((sr.data ?? []) as StudyResource[]); setQuestions((q.data ?? []) as PracticeQuestion[]); setTargets((t.data ?? []) as CourseTarget[]); setAreas((a.data ?? []) as AcademicArea[]); setUniversities((u.data ?? []) as University[]);
      setSelectedArea((a.data?.[0] as AcademicArea | undefined)?.area_id ?? ''); setLoading(false);
    })();
    return () => { live = false; };
  }, []);

  const area = areas.find(x => x.area_id === selectedArea) ?? null;
  const filteredUniversities = useMemo(() => universities.filter(u => u.area_id === selectedArea), [universities, selectedArea]);
  useEffect(() => { if (!filteredUniversities.length) return setSelectedUniversity(''); if (!filteredUniversities.some(u => String(u.area_university_id) === selectedUniversity)) setSelectedUniversity(String(filteredUniversities[0].area_university_id)); }, [filteredUniversities, selectedUniversity]);
  const university = filteredUniversities.find(u => String(u.area_university_id) === selectedUniversity) ?? null;
  const course = university?.course_label || area?.courses || area?.name || 'Administração';
  useEffect(() => { if (university) setExamId(examFromUniversity(university.university_name)); }, [university?.area_university_id]);

  useEffect(() => {
    const next = Object.fromEntries(METRICS[examId].map(m => [m.key, m.defaultValue]));
    try { Object.assign(next, JSON.parse(localStorage.getItem(`conectae:exam-values:${examId}`) || '{}')); } catch { /* noop */ }
    setValues(next);
    try { setComfortAreas(JSON.parse(localStorage.getItem(`conectae:comfort:${examId}`) || '[]')); } catch { setComfortAreas([]); }
    setWeeklyHours(Number(localStorage.getItem(`conectae:weekly-hours:${examId}`) || 8));
    setActiveQuestion(null); setPracticeResult(null); setSelectedOption(''); setMessage('');
  }, [examId]);
  useEffect(() => { if (Object.keys(values).length) localStorage.setItem(`conectae:exam-values:${examId}`, JSON.stringify(values)); }, [examId, values]);
  useEffect(() => { localStorage.setItem(`conectae:comfort:${examId}`, JSON.stringify(comfortAreas)); }, [examId, comfortAreas]);
  useEffect(() => { localStorage.setItem(`conectae:weekly-hours:${examId}`, String(weeklyHours)); }, [examId, weeklyHours]);

  const profile = profiles.find(p => p.exam_id === examId) ?? null;
  const metrics = METRICS[examId];
  const examSkills = skills.filter(s => s.exam_id === examId);
  const examResources = resources.filter(r => r.exam_id === examId);
  const examStudyResources = studyResources.filter(r => r.exam_id === examId);
  const examQuestions = questions.filter(q => q.exam_id === examId);
  const target = targets.find(t => t.exam_id === examId && normalize(t.course_label) === normalize(course)) ?? fallbackTarget(course, examId);
  const remainingDays = daysUntil(profile?.exam_date ?? null);

  const targetValues = useMemo(() => {
    const bases = Object.fromEntries(metrics.map(m => [m.key, baseTargetForMetric(examId, m, target)])) as Record<string, number>;
    const normalizedNow = metrics.map(m => ({ m, pct: (values[m.key] ?? 0) / m.max })).filter(x => x.m.key !== 'Redação');
    const avg = normalizedNow.length ? normalizedNow.reduce((s,x) => s + x.pct, 0) / normalizedNow.length : .6;
    const out: Record<string, number> = {};
    for (const m of metrics) {
      const base = bases[m.key]; const current = values[m.key] ?? 0; const pct = current / m.max; const declared = comfortAreas.includes(m.key);
      const strengthDelta = pct - avg;
      let adjustment = 0;
      if (m.max <= 100) adjustment += strengthDelta * m.max * .12;
      else adjustment += strengthDelta * 45;
      if (declared) adjustment += m.max <= 100 ? Math.max(1, m.max * .025) : 20;
      if (current >= base) adjustment += m.max <= 100 ? Math.max(1, m.max * .03) : 20;
      const floor = examId === 'enem' && m.key !== 'Redação' ? 24 : m.max * .55;
      out[m.key] = clamp(Math.round(base + adjustment), Math.round(floor), m.max === 1000 ? 980 : m.max);
    }
    return out;
  }, [metrics, examId, target, values, comfortAreas]);

  const priorities: Priority[] = useMemo(() => metrics.map(metric => {
    const current = values[metric.key] ?? 0; const goal = targetValues[metric.key] ?? metric.max; const gap = Math.max(0, goal - current) / metric.max;
    const matching = examSkills.filter(s => normalize(s.area).includes(normalize(metric.key)) || normalize(metric.key).includes(normalize(s.area)));
    const importance = matching.length ? Math.max(...matching.map(s => Number(s.importance))) : 1;
    const comfort = comfortAreas.includes(metric.key); const score = gap * importance * (comfort ? .72 : 1.18);
    return { metric, current, goal, gap, score, skills: matching.slice(0,3), comfort };
  }).sort((a,b) => b.score - a.score), [metrics, values, targetValues, examSkills, comfortAreas]);

  const readiness = useMemo(() => Math.round(priorities.reduce((s,p) => s + Math.min(1, p.current / Math.max(1,p.goal)), 0) / Math.max(1,priorities.length) * 100), [priorities]);
  const weeks = Math.max(1, Math.min(12, remainingDays ? Math.ceil(remainingDays / 7) : 8));
  const weeklyPlan = useMemo(() => Array.from({ length: weeks }, (_, i) => {
    const progress = (i + 1) / weeks; const p1 = priorities[i % Math.max(1, Math.min(3, priorities.length))]; const p2 = priorities[(i + 1) % Math.max(1, Math.min(4, priorities.length))];
    const focus = p1?.metric.label ?? 'Revisão geral'; const checkpoint = p1 ? Math.round(p1.current + (p1.goal - p1.current) * (1 - Math.pow(1-progress,1.15))) : 0;
    const hrs1 = Math.max(1, Math.round(weeklyHours * .55)); const hrs2 = Math.max(1, weeklyHours - hrs1);
    const q = examQuestions.filter(x => normalize(x.area).includes(normalize(p1?.metric.key ?? '')) || normalize(p1?.metric.key ?? '').includes(normalize(x.area))).slice(0,3);
    const sr = examStudyResources.filter(x => !x.area || normalize(x.area).includes(normalize(p1?.metric.key ?? '')) || normalize(p1?.metric.key ?? '').includes(normalize(x.area))).slice(0,3);
    return { week:i+1, phase: progress < .35 ? 'Fundação e diagnóstico' : progress < .75 ? 'Volume e correção' : 'Simulado e precisão', focus, checkpoint, unit:p1?.metric.unit ?? '%', p1, p2, hrs1, hrs2, q, sr };
  }), [weeks, priorities, weeklyHours, examQuestions, examStudyResources]);

  const toggleComfort = (key: string) => setComfortAreas(v => v.includes(key) ? v.filter(x => x !== key) : [...v, key]);
  const classify = (text: string) => { const t = normalize(text); let best: SkillRow | null = null; let bestScore = 0; for (const s of examSkills) { const terms = [...(s.diagnostic_tags ?? []), s.skill_name, s.area].map(normalize).flatMap(x => x.split(/\s+/)).filter(x => x.length >= 4); const score = terms.filter(term => t.includes(term)).length * Number(s.importance || 1); if (score > bestScore) { bestScore = score; best = s; } } if (!best && examSkills.length) best = examSkills[0]; setScannerResult(best); setScannerConfidence(best ? clamp(Math.round(52 + bestScore * 11), 52, 96) : 0); };
  const handleImage = async (file: File | null) => { if (!file) return; const Ctor = (window as unknown as { TextDetector?: new () => { detect:(source:ImageBitmap)=>Promise<Array<{rawValue?:string}>> } }).TextDetector; if (!Ctor) return setMessage('OCR nativo não disponível neste navegador. Cole o enunciado abaixo.'); try { const bitmap = await createImageBitmap(file); const blocks = await new Ctor().detect(bitmap); const text = blocks.map(b=>b.rawValue ?? '').join(' ').trim(); setQuestionText(text); if (text) classify(text); } catch { setMessage('Não consegui ler a imagem. Cole o enunciado para diagnosticar.'); } };

  const savePreferences = async () => {
    setSaving(true); setMessage('');
    try { if (!supabase) throw new Error(); const { data } = await supabase.auth.getUser(); if (!data.user) { setMessage('Preferências salvas neste dispositivo. Entre na conta para sincronizar.'); return; } await supabase.from('student_exam_preferences').upsert({ user_id:data.user.id, exam_id:examId, comfort_areas:comfortAreas, weekly_hours:weeklyHours, updated_at:new Date().toISOString() }, { onConflict:'user_id,exam_id' }); setMessage('Preferências sincronizadas com seu plano.'); } catch { setMessage('Preferências mantidas neste dispositivo.'); } finally { setSaving(false); }
  };
  const saveAttempt = async () => {
    setSaving(true); setMessage(''); const stamp = new Date().toISOString(); localStorage.setItem(`conectae:last-simulation:${examId}`, JSON.stringify({ values, targetValues, course, university:university?.university_name, at:stamp }));
    try { if (!supabase) throw new Error(); const { data } = await supabase.auth.getUser(); if (!data.user) { setMessage('Simulado registrado neste dispositivo. O plano já foi recalculado.'); return; } const rows = metrics.map(m => ({ user_id:data.user!.id, exam_id:examId, exam_year:2026, area:m.key, correct:Math.round(values[m.key] ?? 0), total:m.max, score:m.max > 100 ? values[m.key] ?? 0 : null, occurred_at:new Date().toISOString().slice(0,10), metadata:{ adaptive_target:targetValues[m.key], readiness, course, university:university?.university_name ?? null, comfort_areas:comfortAreas } })); const { error } = await supabase.from('student_exam_attempts').insert(rows); if (error) throw error; setMessage('Simulado salvo. Metas, prioridades e semanas foram recalculadas.'); } catch { setMessage('Simulado salvo localmente; o plano foi recalculado mesmo sem sincronização.'); } finally { setSaving(false); }
  };
  const saveDiagnostic = async (correct: boolean) => { if (!scannerResult || !questionText.trim()) return; try { if (!supabase) throw new Error(); const { data } = await supabase.auth.getUser(); if (!data.user) return setMessage('Diagnóstico salvo localmente.'); await supabase.from('student_skill_diagnostics').insert({ user_id:data.user.id, exam_id:examId, skill_code:scannerResult.skill_code, area:scannerResult.area, question_text:questionText.slice(0,4000), correct, confidence:scannerConfidence/100, error_type:correct?null:errorType, diagnosis:{ skill_name:scannerResult.skill_name, next_action:correct?'Revisão espaçada':`Revisar ${scannerResult.skill_name} com foco em ${errorType}` } }); setMessage('Diagnóstico incorporado ao mapa de habilidades.'); } catch { setMessage('Diagnóstico mantido neste dispositivo.'); } };
  const checkPractice = async () => { if (!activeQuestion) return; if (!activeQuestion.correct_option) { setPracticeResult(null); return setMessage('Questão discursiva: compare sua resposta com o critério de correção abaixo.'); } const ok = selectedOption === activeQuestion.correct_option; setPracticeResult(ok); setPracticeTotal(v=>v+1); if (ok) setPracticeCorrect(v=>v+1); try { if (supabase) { const { data } = await supabase.auth.getUser(); if (data.user) await supabase.from('student_practice_attempts').insert({ user_id:data.user.id, exam_id:examId, question_id:activeQuestion.id, area:activeQuestion.area, skill_name:activeQuestion.skill_name, selected_option:selectedOption, correct:ok }); } } catch { /* local UX still works */ } };
  const openQuestion = (q?: PracticeQuestion) => { const next = q ?? examQuestions.find(x => !activeQuestion || x.id !== activeQuestion.id) ?? examQuestions[0]; setActiveQuestion(next ?? null); setSelectedOption(''); setPracticeResult(null); };
  const downloadPdf = (weekIndex?: number) => { const doc = new jsPDF(); const weeksToPrint = weekIndex == null ? weeklyPlan : [weeklyPlan[weekIndex]]; let y=18; doc.setFontSize(18); doc.text('Conectaê — Plano de Aprovação',14,y); y+=9; doc.setFontSize(10); doc.text(`${course} · ${university?.university_name ?? 'Faculdade selecionada'} · ${profile?.label ?? FALLBACK_LABELS[examId]}`,14,y); y+=8; doc.text(`Prontidão: ${readiness}% · Horas/semana: ${weeklyHours} · Meta global: ${target.target_value ?? 'adaptativa'}`,14,y); y+=10; for (const w of weeksToPrint) { if (!w) continue; if (y>260) { doc.addPage(); y=18; } doc.setFontSize(13); doc.text(`Semana ${w.week} — ${w.phase}`,14,y); y+=7; doc.setFontSize(10); doc.text(`Foco: ${w.focus} · checkpoint ${w.checkpoint} ${w.unit}`,14,y); y+=6; doc.text(`Bloco 1: ${w.hrs1}h ${w.p1?.metric.label ?? ''} | Bloco 2: ${w.hrs2}h ${w.p2?.metric.label ?? ''}`,14,y); y+=7; for (const q of w.q) { const lines = doc.splitTextToSize(`• ${q.skill_name}: ${q.prompt}`,180); doc.text(lines,16,y); y += lines.length*5+2; } y+=4; } doc.save(`conectae-plano-${examId}${weekIndex==null?'':`-semana-${weekIndex+1}`}.pdf`); };

  if (loading) return <div className="min-h-screen bg-[#070b16] flex items-center justify-center"><Loader2 className="w-9 h-9 animate-spin text-cyan-300" /></div>;

  return <div className="min-h-screen bg-[#070b16] text-ink-50 relative overflow-hidden">
    <div className="fixed inset-0 pointer-events-none"><div className="absolute -top-48 -left-40 w-[620px] h-[620px] rounded-full bg-cyan-500/12 blur-[145px]"/><div className="absolute top-1/4 -right-48 w-[620px] h-[620px] rounded-full bg-violet-500/10 blur-[150px]"/></div>
    <header className="relative z-10 border-b border-white/10 bg-[#070b16]/90 backdrop-blur-xl sticky top-0"><div className="max-w-[1450px] mx-auto px-5 md:px-8 py-4 flex items-center justify-between gap-4"><button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-ink-300 hover:text-white"><ArrowLeft className="w-4 h-4"/>Voltar</button><div className="flex items-center gap-2"><div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-300 to-violet-400 flex items-center justify-center"><BrainCircuit className="w-5 h-5 text-[#07111d]"/></div><div><div className="font-black leading-none">Conectaê Intelligence</div><div className="text-[10px] tracking-[.15em] uppercase text-cyan-200 mt-1">Approval Engine v3</div></div></div><div className="hidden md:flex items-center gap-2 text-xs text-ink-400"><ShieldCheck className="w-4 h-4 text-emerald-300"/>plano adaptativo</div></div></header>
    <main className="relative z-10 max-w-[1450px] mx-auto px-5 md:px-8 py-7 pb-24">
      <section className="grid xl:grid-cols-[1.1fr_.9fr] gap-5 mb-6"><div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6 md:p-8"><div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-black text-cyan-200 mb-4"><Sparkles className="w-3.5 h-3.5"/>curso + prova + desempenho + rotina</div><h1 className="text-3xl md:text-5xl font-black tracking-[-.035em] leading-[1.02]">Seu caminho até a aprovação, recalculado em tempo real.</h1><p className="mt-4 text-ink-300 max-w-3xl leading-relaxed">Informe seu desempenho e suas matérias fortes. O Conectaê redistribui metas, horas, habilidades, questões e checkpoints conforme a prova e a faculdade.</p><div className="grid sm:grid-cols-2 gap-3 mt-6"><label className="text-xs font-bold text-ink-400">Curso<select value={selectedArea} onChange={e=>setSelectedArea(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b1424] px-3 py-3 text-sm text-white">{areas.map(a=><option key={a.area_id} value={a.area_id}>{a.courses||a.name}</option>)}</select></label><label className="text-xs font-bold text-ink-400">Faculdade<select value={selectedUniversity} onChange={e=>setSelectedUniversity(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b1424] px-3 py-3 text-sm text-white">{filteredUniversities.map(u=><option key={u.area_university_id} value={u.area_university_id}>{u.university_name}</option>)}</select></label></div></div><div className="rounded-[28px] border border-cyan-300/15 bg-gradient-to-br from-cyan-300/[0.08] to-violet-400/[0.05] p-6"><div className="text-[10px] uppercase tracking-[.15em] text-ink-500 font-black">Prontidão estimada</div><div className="text-6xl font-black text-cyan-200 mt-2">{readiness}%</div><div className="mt-4 h-2 rounded-full bg-white/5 overflow-hidden"><div className="h-full bg-gradient-to-r from-cyan-300 via-brand-300 to-violet-300" style={{width:`${readiness}%`}}/></div><div className="grid grid-cols-2 gap-3 mt-5"><div className="rounded-2xl border border-white/10 bg-black/15 p-4"><CalendarDays className="w-4 h-4 text-cyan-200 mb-2"/><div className="text-xs text-ink-500">Até a prova</div><div className="font-black mt-1">{remainingDays===null?'por etapas':`${remainingDays} dias`}</div></div><div className="rounded-2xl border border-white/10 bg-black/15 p-4"><Target className="w-4 h-4 text-fuchsia-200 mb-2"/><div className="text-xs text-ink-500">Meta global</div><div className="font-black mt-1">{target.target_value ?? 'adaptativa'}{examId==='enem'?' pts':'%'}</div></div></div><button onClick={()=>downloadPdf()} className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-black inline-flex items-center justify-center gap-2"><Download className="w-4 h-4"/>Baixar plano completo em PDF</button></div></section>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">{EXAM_ORDER.map(id=>{const p=profiles.find(x=>x.exam_id===id);return <button key={id} onClick={()=>setExamId(id)} className={`rounded-2xl border p-4 text-left ${id===examId?'border-cyan-300/45 bg-cyan-300/10':'border-white/10 bg-white/[.025]'}`}><GraduationCap className="w-4 h-4 text-cyan-200"/><div className="font-black text-sm mt-3">{p?.label??FALLBACK_LABELS[id]}</div><div className="text-[11px] text-ink-500 mt-1">{p?.exam_date?new Date(`${p.exam_date}T12:00:00`).toLocaleDateString('pt-BR'):'por etapas'}</div></button>})}</section>
      <nav className="flex gap-2 overflow-x-auto mb-6 pb-1">{([['dashboard','Diagnóstico'],['plan','Plano semanal'],['scanner','Scanner de questões'],['database','Banco da prova']] as [Tab,string][]).map(([id,label])=><button key={id} onClick={()=>setTab(id)} className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-black border ${tab===id?'border-cyan-300/40 bg-cyan-300/10 text-cyan-100':'border-white/10 bg-white/[.025] text-ink-400'}`}>{label}</button>)}</nav>
      {message&&<div className="mb-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/[.06] px-4 py-3 text-sm text-cyan-100">{message}</div>}

      {tab==='dashboard'&&<div className="space-y-5"><section className="rounded-[28px] border border-amber-300/25 bg-amber-300/[.055] p-6"><div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div><div className="text-xs uppercase tracking-[.14em] font-black text-amber-200">Sua estratégia pessoal</div><h2 className="text-2xl font-black mt-1">Quais matérias são mais confortáveis para você?</h2><p className="text-sm text-ink-400 mt-2">Marque suas forças. O motor pode exigir mais delas e aliviar áreas fracas sem abandonar a meta global.</p></div><div className="min-w-52"><div className="text-xs font-bold text-ink-400 mb-2">Horas disponíveis por semana</div><input type="range" min={2} max={30} value={weeklyHours} onChange={e=>setWeeklyHours(Number(e.target.value))} className="w-full accent-amber-300"/><div className="font-black text-amber-100 mt-1">{weeklyHours} horas/semana</div></div></div><div className="flex flex-wrap gap-2 mt-5">{metrics.map(m=><button key={m.key} onClick={()=>toggleComfort(m.key)} className={`rounded-xl border px-4 py-3 text-sm font-black ${comfortAreas.includes(m.key)?'border-amber-300/50 bg-amber-300/15 text-amber-100':'border-white/10 bg-black/15 text-ink-400'}`}>{m.label}{comfortAreas.includes(m.key)?' ✓ força':''}</button>)}</div><button onClick={savePreferences} disabled={saving} className="mt-4 rounded-xl border border-amber-300/25 px-4 py-2.5 text-xs font-black text-amber-100">Salvar estratégia</button></section>
        <div className="grid xl:grid-cols-[1fr_.8fr] gap-5"><section className="rounded-[28px] border border-white/10 bg-white/[.03] p-6"><div className="flex items-center justify-between gap-4 mb-5"><div><div className="text-xs uppercase tracking-[.14em] font-black text-cyan-200">Seu nível agora</div><h2 className="text-2xl font-black mt-1">Desempenho por componente</h2></div><button onClick={saveAttempt} disabled={saving} className="rounded-xl bg-cyan-300 text-[#07111d] px-4 py-2.5 font-black text-sm inline-flex items-center gap-2"><Save className="w-4 h-4"/>Registrar simulado</button></div><div className="space-y-5">{metrics.map(m=>{const value=values[m.key]??0;const goal=targetValues[m.key]??m.max;return <div key={m.key}><div className="flex justify-between gap-3 mb-2"><div><div className="font-bold">{m.label}</div><div className="text-xs text-cyan-200">meta adaptativa agora: <b>{goal} {m.unit}</b></div><div className="text-[11px] text-ink-600 mt-0.5">faltam {Math.max(0,goal-value)} {m.unit}</div></div><div className={`text-xl font-black ${value>=goal?'text-emerald-300':'text-white'}`}>{value}</div></div><input type="range" min={0} max={m.max} step={m.max>100?10:1} value={value} onChange={e=>setValues(v=>({...v,[m.key]:Number(e.target.value)}))} className="w-full accent-cyan-300"/></div>})}</div>{examId==='enem'&&<div className="mt-5 rounded-2xl border border-amber-300/15 bg-amber-300/[.05] p-4 text-xs text-amber-100/80">Acertos no ENEM são usados como meta de consistência. A TRI não permite converter um número fixo de acertos em nota exata.</div>}</section><section className="rounded-[28px] border border-white/10 bg-white/[.03] p-6"><div className="text-xs uppercase tracking-[.14em] font-black text-fuchsia-200">Motor adaptativo</div><h2 className="text-2xl font-black mt-1 mb-5">Onde cada hora vale mais</h2><div className="space-y-3">{priorities.map((p,i)=><div key={p.metric.key} className="rounded-2xl border border-white/10 bg-black/15 p-4"><div className="flex items-start justify-between gap-3"><div className="flex gap-3"><span className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center font-black">{i+1}</span><div><div className="font-black">{p.metric.label}{p.comfort&&<span className="ml-2 text-[10px] text-amber-200">FORÇA</span>}</div><div className="text-xs text-ink-500 mt-1">{p.current} → {p.goal} {p.metric.unit}</div></div></div><TrendingUp className="w-4 h-4 text-cyan-200"/></div>{p.skills.length>0&&<div className="flex flex-wrap gap-1.5 mt-3">{p.skills.map(s=><span key={s.skill_code} className="rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[10px]">{s.skill_name}</span>)}</div>}</div>)}</div></section></div></div>}

      {tab==='plan'&&<section className="space-y-4"><div className="rounded-[28px] border border-white/10 bg-white/[.03] p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"><div><div className="text-xs uppercase tracking-[.14em] font-black text-violet-200">{weeks} semanas · {weeklyHours}h/semana</div><h2 className="text-3xl font-black mt-1">Plano executável, não só metas</h2><p className="text-sm text-ink-400 mt-2">Cada semana combina checkpoint, horas por prioridade, habilidades, prática e conteúdo.</p></div><div className="text-right"><div className="text-xs text-ink-500">Prática nesta sessão</div><div className="font-black text-xl">{practiceCorrect}/{practiceTotal} corretas</div></div></div><div className="grid lg:grid-cols-2 gap-4">{weeklyPlan.map((w,idx)=><article key={w.week} className="rounded-[26px] border border-white/10 bg-white/[.025] p-5"><div className="flex items-center justify-between"><div><span className="text-xs font-black text-cyan-200">SEMANA {w.week}</span><h3 className="text-xl font-black mt-1">{w.focus}</h3></div><Flame className="w-5 h-5 text-amber-200"/></div><div className="text-sm text-ink-400 mt-1">{w.phase}</div><div className="grid grid-cols-3 gap-2 mt-4"><div className="rounded-xl bg-black/15 border border-white/10 p-3"><div className="text-[10px] text-ink-500 uppercase">checkpoint</div><div className="font-black mt-1">{w.checkpoint} {w.unit}</div></div><div className="rounded-xl bg-black/15 border border-white/10 p-3"><div className="text-[10px] text-ink-500 uppercase">prioridade 1</div><div className="font-black mt-1">{w.hrs1}h</div><div className="text-[10px] text-ink-500">{w.p1?.metric.label}</div></div><div className="rounded-xl bg-black/15 border border-white/10 p-3"><div className="text-[10px] text-ink-500 uppercase">prioridade 2</div><div className="font-black mt-1">{w.hrs2}h</div><div className="text-[10px] text-ink-500">{w.p2?.metric.label}</div></div></div>{w.p1?.skills.length? <div className="mt-4"><div className="text-[10px] uppercase tracking-wider text-ink-500 mb-2">habilidades da semana</div><div className="flex flex-wrap gap-1.5">{w.p1.skills.map(s=><span key={s.skill_code} className="rounded-full border border-violet-300/15 bg-violet-300/[.06] px-2.5 py-1 text-[10px] text-violet-100">{s.skill_name}</span>)}</div></div>:null}<div className="grid sm:grid-cols-3 gap-2 mt-4"><button onClick={()=>openQuestion(w.q[0])} disabled={!w.q.length} className="rounded-xl bg-cyan-300 text-[#07111d] py-2.5 text-xs font-black inline-flex items-center justify-center gap-1.5 disabled:opacity-35"><PlayCircle className="w-4 h-4"/>Fazer questões</button>{w.sr.find(r=>r.resource_type==='video_search')?<a target="_blank" rel="noreferrer" href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${w.sr.find(r=>r.resource_type==='video_search')?.search_query ?? profile?.label ?? ''} ${w.focus}`)}`} className="rounded-xl border border-red-300/20 bg-red-300/[.06] py-2.5 text-xs font-black text-red-100 inline-flex items-center justify-center gap-1.5"><Video className="w-4 h-4"/>Ver aula</a>:<button disabled className="rounded-xl border border-white/10 py-2.5 text-xs text-ink-600">Vídeo indisponível</button>}<button onClick={()=>downloadPdf(idx)} className="rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-black inline-flex items-center justify-center gap-1.5"><Download className="w-4 h-4"/>PDF da semana</button></div>{w.sr.filter(r=>r.url).slice(0,2).map(r=><a key={r.id} href={r.url!} target="_blank" rel="noreferrer" className="mt-2 block text-xs text-cyan-200 hover:underline">{r.official?'Fonte oficial: ':''}{r.title} ↗</a>)}</article>)}</div></section>}

      {tab==='scanner'&&<div className="grid xl:grid-cols-[1fr_.85fr] gap-5"><section className="rounded-[28px] border border-white/10 bg-white/[.03] p-6"><div className="font-black text-xl mb-4">Scanner de questão</div><label className="block rounded-2xl border border-dashed border-cyan-300/25 bg-cyan-300/[.04] p-5 text-center cursor-pointer"><Camera className="w-6 h-6 text-cyan-200 mx-auto mb-2"/><div className="font-bold text-sm">Enviar foto ou print</div><input type="file" accept="image/*" className="hidden" onChange={e=>void handleImage(e.target.files?.[0]??null)}/></label><textarea value={questionText} onChange={e=>setQuestionText(e.target.value)} placeholder="Cole aqui o enunciado completo..." className="mt-4 w-full min-h-44 rounded-2xl border border-white/10 bg-[#0b1424] p-4 text-sm"/><button onClick={()=>classify(questionText)} disabled={!questionText.trim()} className="mt-3 w-full rounded-xl bg-cyan-300 text-[#07111d] py-3 font-black disabled:opacity-40">Diagnosticar habilidade</button></section><section className="rounded-[28px] border border-white/10 bg-white/[.03] p-6">{scannerResult?<><div className="text-xs font-black text-emerald-200">{scannerConfidence}% confiança</div><h3 className="text-2xl font-black mt-3">{scannerResult.skill_name}</h3><div className="text-sm text-ink-400">{scannerResult.area}</div><div className="mt-5"><div className="text-xs font-black">Se errou, qual foi o motivo?</div><div className="flex flex-wrap gap-2 mt-3">{['conteúdo','interpretação','procedimento','tempo','desatenção'].map(t=><button key={t} onClick={()=>setErrorType(t)} className={`rounded-full px-3 py-1.5 text-xs font-bold border ${errorType===t?'border-fuchsia-300/40 bg-fuchsia-300/10':'border-white/10'}`}>{t}</button>)}</div></div><div className="grid grid-cols-2 gap-2 mt-4"><button onClick={()=>void saveDiagnostic(false)} className="rounded-xl border border-red-300/20 bg-red-300/[.07] py-3 text-sm font-black">Errei</button><button onClick={()=>void saveDiagnostic(true)} className="rounded-xl border border-emerald-300/20 bg-emerald-300/[.07] py-3 text-sm font-black">Acertei</button></div></>:<div className="min-h-72 flex flex-col items-center justify-center text-center text-ink-500"><FileScan className="w-10 h-10 mb-3"/>Envie uma questão para conectá-la ao mapa de habilidades.</div>}</section></div>}

      {tab==='database'&&<div className="grid xl:grid-cols-[.9fr_1.1fr] gap-5"><section className="rounded-[28px] border border-white/10 bg-white/[.03] p-6"><div className="text-xs uppercase tracking-[.14em] font-black text-cyan-200">Perfil da prova</div><h2 className="text-2xl font-black mt-1">{profile?.label??FALLBACK_LABELS[examId]}</h2><p className="mt-4 text-sm text-ink-300 leading-relaxed">{profile?.format_summary}</p><div className="grid grid-cols-3 gap-2 mt-5"><div className="rounded-xl bg-black/15 border border-white/10 p-3"><BookOpen className="w-4 h-4 text-amber-200"/><div className="font-black mt-2">{examSkills.length}</div><div className="text-[10px] text-ink-500">habilidades</div></div><div className="rounded-xl bg-black/15 border border-white/10 p-3"><Database className="w-4 h-4 text-cyan-200"/><div className="font-black mt-2">{examQuestions.length}</div><div className="text-[10px] text-ink-500">questões internas</div></div><div className="rounded-xl bg-black/15 border border-white/10 p-3"><Video className="w-4 h-4 text-red-200"/><div className="font-black mt-2">{examStudyResources.length}</div><div className="text-[10px] text-ink-500">recursos</div></div></div>{profile?.official_source_url&&<a href={profile.official_source_url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-cyan-200">Fonte oficial <ExternalLink className="w-4 h-4"/></a>}</section><section className="rounded-[28px] border border-white/10 bg-white/[.03] p-6"><div className="text-xs uppercase tracking-[.14em] font-black text-fuchsia-200">Fontes e materiais</div><div className="space-y-3 mt-4">{[...examStudyResources,...examResources.map(r=>({id:100000+r.id,exam_id:r.exam_id,area:null,skill_name:null,resource_type:r.resource_type,title:r.label,url:r.url,search_query:null,description:null,official:true,priority:100} as StudyResource))].slice(0,12).map(r=><div key={r.id} className="rounded-2xl border border-white/10 bg-black/15 p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-black text-sm">{r.title}</div><div className="text-xs text-ink-500 mt-1">{r.official?'oficial · ':''}{r.resource_type.replaceAll('_',' ')}</div></div>{r.url?<a href={r.url} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4 text-cyan-200"/></a>:r.search_query?<a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(r.search_query)}`} target="_blank" rel="noreferrer"><Video className="w-4 h-4 text-red-200"/></a>:null}</div>{r.description&&<p className="text-xs text-ink-500 mt-2">{r.description}</p>}</div>)}</div></section></div>}

      {activeQuestion&&<div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"><div className="max-w-2xl mx-auto my-8 rounded-[28px] border border-white/10 bg-[#0b1424] p-6"><div className="flex justify-between gap-4"><div><div className="text-xs uppercase tracking-wider text-cyan-200 font-black">{activeQuestion.area} · dificuldade {activeQuestion.difficulty}/5</div><div className="text-xs text-ink-500 mt-1">{activeQuestion.skill_name}</div></div><button onClick={()=>setActiveQuestion(null)} className="text-ink-400"><XCircle className="w-6 h-6"/></button></div><h3 className="text-xl font-black mt-5 leading-relaxed">{activeQuestion.prompt}</h3>{activeQuestion.correct_option?<div className="space-y-2 mt-5">{(['A','B','C','D','E'] as const).map(letter=>{const text=activeQuestion[`option_${letter.toLowerCase()}` as keyof PracticeQuestion] as string|null;if(!text)return null;return <button key={letter} onClick={()=>practiceResult===null&&setSelectedOption(letter)} className={`w-full text-left rounded-xl border p-3 text-sm ${selectedOption===letter?'border-cyan-300/50 bg-cyan-300/10':'border-white/10 bg-black/15'}`}><b>{letter})</b> {text}</button>})}</div>:<textarea className="mt-5 w-full min-h-36 rounded-xl border border-white/10 bg-black/20 p-4 text-sm" placeholder="Escreva sua resposta discursiva aqui..."/>}<button onClick={()=>void checkPractice()} disabled={!!activeQuestion.correct_option&&!selectedOption} className="mt-5 w-full rounded-xl bg-cyan-300 text-[#07111d] py-3 font-black disabled:opacity-40">Corrigir</button>{practiceResult!==null&&<div className={`mt-4 rounded-xl border p-4 ${practiceResult?'border-emerald-300/25 bg-emerald-300/[.07]':'border-red-300/25 bg-red-300/[.07]'}`}><div className="font-black">{practiceResult?'Correto':'Ainda não'}</div><div className="text-sm text-ink-300 mt-2">{activeQuestion.explanation}</div></div>}{!activeQuestion.correct_option&&message&&<div className="mt-4 rounded-xl border border-violet-300/20 bg-violet-300/[.06] p-4 text-sm text-violet-100">{activeQuestion.explanation||'Compare sua resposta com os elementos essenciais esperados.'}</div>}<div className="grid grid-cols-2 gap-2 mt-4"><button onClick={()=>openQuestion()} className="rounded-xl border border-white/10 py-2.5 text-sm font-black">Próxima questão</button><button onClick={()=>setActiveQuestion(null)} className="rounded-xl border border-white/10 py-2.5 text-sm text-ink-400">Voltar ao plano</button></div></div></div>}

      <footer className="mt-8 grid md:grid-cols-4 gap-3">{[[Database,'Banco por prova',`${examSkills.length} habilidades`],[BarChart3,'Meta adaptativa','muda com seu desempenho'],[Clock3,'Rotina real',`${weeklyHours}h por semana`],[PlayCircle,'Prática ativa',`${examQuestions.length} questões disponíveis`]].map(([Icon,title,text])=>{const I=Icon as typeof Database;return <div key={String(title)} className="rounded-2xl border border-white/10 bg-white/[.025] p-4"><I className="w-4 h-4 text-cyan-200 mb-3"/><div className="font-black text-sm">{String(title)}</div><div className="text-xs text-ink-500 mt-1">{String(text)}</div></div>})}</footer>
    </main>
  </div>;
}
