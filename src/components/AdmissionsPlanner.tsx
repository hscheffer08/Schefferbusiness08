import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  CalendarDays,
  Camera,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  PlayCircle,
  RefreshCw,
  Save,
  ScanLine,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { supabase } from '@/lib/supabase';
import {
  daysUntil,
  estimatedTargetScore,
  getCourseTarget,
  getInstitutionExam,
  type EnemArea,
} from '@/lib/admissions-planner-data';

interface AdmissionsPlannerProps { onBack: () => void; }
interface AcademicAreaRow { area_id: string; name: string; courses: string; }
interface AreaUniversityRow {
  area_university_id: number;
  area_id: string;
  university_name: string;
  course_label: string;
  institution_type: string | null;
  admissions_summary: string | null;
  source_url: string | null;
}
interface PracticeQuestion {
  id: number;
  exam_id: string;
  area: string;
  skill_name: string;
  difficulty: number;
  prompt: string;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  option_e: string | null;
  correct_option: string | null;
  explanation: string;
  estimated_minutes: number;
}
interface StudyResource {
  id: number;
  exam_id: string;
  area: string | null;
  skill_name: string | null;
  resource_type: string;
  title: string;
  url: string | null;
  search_query: string | null;
  description: string | null;
  official: boolean;
}

type ScoreMap = Record<EnemArea, number>;
type ObjectiveArea = Exclude<EnemArea, 'essay'>;
type Tab = 'goal' | 'plan' | 'practice' | 'scanner';
type SimulationRecord = { id: string; createdAt: string; examLabel: string; course: string; university: string; scores: ScoreMap; };

const OBJECTIVE_AREAS: ObjectiveArea[] = ['languages', 'humanities', 'nature', 'math'];
const defaultScores: ScoreMap = { languages: 27, humanities: 27, nature: 24, math: 25, essay: 760 };
const AREA_LABEL: Record<EnemArea, string> = { languages: 'Linguagens', humanities: 'Humanas', nature: 'Natureza', math: 'Matemática', essay: 'Redação' };
const AREA_SHORT: Record<EnemArea, string> = { languages: 'LIN', humanities: 'HUM', nature: 'NAT', math: 'MAT', essay: 'RED' };

function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, value)); }
function readScores(key: string) {
  try { return { ...defaultScores, ...JSON.parse(localStorage.getItem(key) || '{}') } as ScoreMap; }
  catch { return defaultScores; }
}
function resolveExamId(name: string) {
  const n = name.toLowerCase();
  if (/ciências médicas|ciencias medicas|fcm-mg|cmmg/.test(n)) return 'cmmg';
  if (/link school/.test(n)) return 'link';
  if (/insper/.test(n)) return 'insper';
  if (/usp|universidade de são paulo/.test(n)) return 'fuvest';
  return getInstitutionExam(name).id || 'enem';
}
function examLabel(examId: string, fallback: string) {
  if (examId === 'cmmg') return 'Ciências Médicas-MG 2027.1';
  if (examId === 'link') return 'Link School · Processo seletivo';
  return fallback;
}
function buildTargets(course: string, targetScore: number, scores: ScoreMap, comfortAreas: ObjectiveArea[]) {
  const profile = getCourseTarget(course);
  const totalWeight = OBJECTIVE_AREAS.reduce((sum, area) => sum + profile.weights[area], 0);
  const factor = clamp((targetScore - 640) / 210, 0.32, 0.94);
  const pairs = OBJECTIVE_AREAS.map((area) => {
    const strength = scores[area] / 45;
    const courseImportance = profile.weights[area] / totalWeight;
    const declaredBoost = comfortAreas.includes(area) ? 2 : 0;
    const value = 22 + factor * 17 + (strength - 0.58) * 7 + (courseImportance - 0.25) * 18 + declaredBoost;
    return [area, clamp(Math.round(value), 20, 42)] as const;
  });
  const targets = Object.fromEntries(pairs) as ScoreMap;
  targets.essay = clamp(Math.round(760 + (targetScore - 720) * 1.25), 760, 940);
  return targets;
}
function buildWeekPlan(course: string, targetScore: number, scores: ScoreMap, weeks: number, comfortAreas: ObjectiveArea[]) {
  const profile = getCourseTarget(course);
  const targets = buildTargets(course, targetScore, scores, comfortAreas);
  const visibleWeeks = Math.min(Math.max(1, weeks), 12);
  const ranked = [...OBJECTIVE_AREAS].sort((a, b) => {
    const score = (area: ObjectiveArea) => Math.max(0, targets[area] - scores[area]) * profile.weights[area] * (comfortAreas.includes(area) ? 0.72 : 1.18);
    return score(b) - score(a);
  });
  const rows = Array.from({ length: visibleWeeks }, (_, index) => {
    const progress = 1 - Math.pow(1 - (index + 1) / visibleWeeks, 1.15);
    const objective = OBJECTIVE_AREAS.map((area) => ({ area, hits: Math.round(scores[area] + (targets[area] - scores[area]) * progress) }));
    const primary = ranked[index % ranked.length];
    const secondary = ranked[(index + 1) % ranked.length];
    const focus = [primary, secondary].map((area) => profile.focusSkills[area][index % profile.focusSkills[area].length]);
    return { week: index + 1, objective, essay: Math.round(scores.essay + (targets.essay - scores.essay) * progress), priorityAreas: [primary, secondary], focus };
  });
  return { targets, rows, ranked };
}
function classifyQuestion(text: string) {
  const t = text.toLowerCase();
  if (/função|equação|porcent|probabil|geometr|triâng|gráfico|razão|proporção/.test(t)) return { area: 'math' as EnemArea, skill: /probabil/.test(t) ? 'Probabilidade' : /geometr|triâng/.test(t) ? 'Geometria' : 'Álgebra e modelagem' };
  if (/dna|genét|ecolog|químic|mol|reação|força|energia|circuit|célula/.test(t)) return { area: 'nature' as EnemArea, skill: /dna|genét/.test(t) ? 'Genética' : /ecolog/.test(t) ? 'Ecologia' : 'Ciências da Natureza' };
  if (/revolução|estado|democr|território|globalização|guerra|história|geografia/.test(t)) return { area: 'humanities' as EnemArea, skill: 'Interpretação histórico-social' };
  return { area: 'languages' as EnemArea, skill: 'Interpretação e efeitos de sentido' };
}

export default function AdmissionsPlanner({ onBack }: AdmissionsPlannerProps) {
  const [areas, setAreas] = useState<AcademicAreaRow[]>([]);
  const [universities, setUniversities] = useState<AreaUniversityRow[]>([]);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [resources, setResources] = useState<StudyResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedUniversityId, setSelectedUniversityId] = useState<number | null>(null);
  const [scores, setScores] = useState<ScoreMap>(() => readScores('conectae:approval-scores'));
  const [draftScores, setDraftScores] = useState<ScoreMap>(() => readScores('conectae:approval-scores'));
  const [comfortAreas, setComfortAreas] = useState<ObjectiveArea[]>(() => {
    try { return JSON.parse(localStorage.getItem('conectae:comfort-areas') || '[]'); } catch { return []; }
  });
  const [simulations, setSimulations] = useState<SimulationRecord[]>(() => {
    try { return JSON.parse(localStorage.getItem('conectae:simulations') || '[]'); } catch { return []; }
  });
  const [tab, setTab] = useState<Tab>('goal');
  const [lastPlanUpdate, setLastPlanUpdate] = useState<string | null>(() => localStorage.getItem('conectae:last-plan-update'));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showCorrection, setShowCorrection] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [scanResult, setScanResult] = useState<{ area: EnemArea; skill: string } | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!supabase) { setLoading(false); return; }
      const [a, u, q, r] = await Promise.all([
        supabase.from('academic_areas').select('area_id,name,courses').order('name'),
        supabase.from('area_universities').select('area_university_id,area_id,university_name,course_label,institution_type,admissions_summary,source_url').order('university_name'),
        supabase.from('exam_practice_questions').select('*').eq('active', true).order('difficulty'),
        supabase.from('exam_study_resources').select('*').eq('active', true).order('priority', { ascending: false }),
      ]);
      if (!active) return;
      setAreas((a.data || []) as AcademicAreaRow[]);
      setUniversities((u.data || []) as AreaUniversityRow[]);
      setQuestions((q.data || []) as PracticeQuestion[]);
      setResources((r.data || []) as StudyResource[]);
      setSelectedArea((current) => current || ((a.data?.[0] as AcademicAreaRow | undefined)?.area_id ?? ''));
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => { localStorage.setItem('conectae:approval-scores', JSON.stringify(scores)); }, [scores]);
  useEffect(() => { localStorage.setItem('conectae:comfort-areas', JSON.stringify(comfortAreas)); }, [comfortAreas]);
  useEffect(() => { localStorage.setItem('conectae:simulations', JSON.stringify(simulations.slice(0, 12))); }, [simulations]);

  const area = areas.find((item) => item.area_id === selectedArea) || null;
  const areaUniversities = useMemo(() => universities.filter((item) => item.area_id === selectedArea), [universities, selectedArea]);
  useEffect(() => {
    if (!areaUniversities.length) { setSelectedUniversityId(null); return; }
    if (!areaUniversities.some((item) => item.area_university_id === selectedUniversityId)) setSelectedUniversityId(areaUniversities[0].area_university_id);
  }, [areaUniversities, selectedUniversityId]);

  const university = areaUniversities.find((item) => item.area_university_id === selectedUniversityId) || null;
  const course = university?.course_label || area?.courses || 'Administração';
  const baseExam = getInstitutionExam(university?.university_name || '');
  const examId = resolveExamId(university?.university_name || '');
  const displayExam = examLabel(examId, baseExam.label);
  const targetScore = university ? estimatedTargetScore(course, university.university_name, university.institution_type) : getCourseTarget(course).targetScore;
  const days = daysUntil(baseExam.date);
  const weeks = Math.max(1, Math.ceil(days / 7));
  const plan = useMemo(() => buildWeekPlan(course, targetScore, scores, weeks, comfortAreas), [course, targetScore, scores, weeks, comfortAreas]);
  const currentQuestions = useMemo(() => questions.filter((q) => q.exam_id === examId), [questions, examId]);
  const currentResources = useMemo(() => resources.filter((r) => r.exam_id === examId), [resources, examId]);
  const practice = currentQuestions[questionIndex % Math.max(1, currentQuestions.length)] || null;

  const registerSimulation = () => {
    const now = new Date();
    const nextScores = { ...draftScores };
    setScores(nextScores);
    setSimulations((current) => [{ id: String(now.getTime()), createdAt: now.toISOString(), examLabel: displayExam, course, university: university?.university_name || '', scores: nextScores }, ...current].slice(0, 12));
    const stamp = now.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    setLastPlanUpdate(stamp);
    localStorage.setItem('conectae:last-plan-update', stamp);
    setTab('plan');
  };
  const toggleComfort = (areaId: ObjectiveArea) => setComfortAreas((current) => current.includes(areaId) ? current.filter((x) => x !== areaId) : [...current, areaId]);
  const openVideo = (skill: string) => window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(`${displayExam} ${skill} aula resolução`)}`, '_blank', 'noopener,noreferrer');
  const nextQuestion = () => { setQuestionIndex((i) => i + 1); setSelectedAnswer(null); setShowCorrection(false); };
  const generatePdf = (week = 1) => {
    const doc = new jsPDF();
    const row = plan.rows[Math.min(week - 1, plan.rows.length - 1)];
    doc.setFontSize(18); doc.text(`Conectaê · Semana ${week}`, 16, 18);
    doc.setFontSize(11); doc.text(`${course} · ${university?.university_name || ''} · ${displayExam}`, 16, 27);
    doc.text(`Meta geral de referência: ${targetScore}`, 16, 35);
    doc.text(`Prioridades: ${row.priorityAreas.map((a) => AREA_LABEL[a]).join(' + ')}`, 16, 43);
    let y = 54;
    row.objective.forEach(({ area: a, hits }) => { doc.text(`${AREA_LABEL[a]}: meta ${hits}/45`, 18, y); y += 7; });
    doc.text(`Redação: meta ${row.essay}/1000`, 18, y); y += 12;
    doc.setFontSize(14); doc.text('Questões de prática', 16, y); y += 9; doc.setFontSize(10);
    currentQuestions.slice(0, 6).forEach((q, idx) => {
      const lines = doc.splitTextToSize(`${idx + 1}. ${q.prompt}`, 175); doc.text(lines, 16, y); y += lines.length * 5 + 5;
      if (y > 270) { doc.addPage(); y = 18; }
    });
    doc.save(`conectae-semana-${week}-${examId}.pdf`);
  };
  const handleImage = async (file?: File) => {
    if (!file) return;
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(URL.createObjectURL(file));
  };
  const analyzeQuestion = () => { if (questionText.trim()) setScanResult(classifyQuestion(questionText)); };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#070b16]"><Loader2 className="w-8 h-8 animate-spin text-cyan-300" /></div>;

  return (
    <div className="min-h-screen bg-[#070b16] text-ink-50">
      <header className="max-w-7xl mx-auto px-5 md:px-8 py-6 flex items-center justify-between">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-ink-400 hover:text-white"><ArrowLeft className="w-4 h-4" />Voltar</button>
        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-bold text-cyan-200">Plano de Aprovação</span>
      </header>

      <main className="max-w-7xl mx-auto px-5 md:px-8 pb-24">
        <section className="mb-7">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">Seu plano muda quando <span className="text-cyan-300">seu desempenho muda.</span></h1>
          <p className="mt-3 max-w-3xl text-ink-400">Registre simulados, marque suas matérias fortes e receba metas, semanas de estudo, questões autorais, vídeos e PDFs alinhados à prova que você quer passar.</p>
        </section>

        <section className="grid lg:grid-cols-2 gap-5 mb-5">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <p className="text-xs uppercase tracking-widest text-ink-500 font-black">1 · Objetivo</p>
            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              <label className="text-sm text-ink-400">Curso<select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} className="mt-2 w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-3 text-white">{areas.map((x) => <option key={x.area_id} value={x.area_id}>{x.courses}</option>)}</select></label>
              <label className="text-sm text-ink-400">Faculdade<select value={selectedUniversityId ?? ''} onChange={(e) => setSelectedUniversityId(Number(e.target.value))} className="mt-2 w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-3 text-white">{areaUniversities.map((x) => <option key={x.area_university_id} value={x.area_university_id}>{x.university_name}</option>)}</select></label>
            </div>
            <div className="mt-5 rounded-2xl border border-cyan-300/25 bg-cyan-300/[0.07] p-5">
              <p className="text-xs font-black uppercase tracking-widest text-cyan-300">Sua meta final</p>
              <div className="mt-2 flex flex-wrap items-end justify-between gap-4"><div><div className="text-5xl font-black text-white">{targetScore}</div><p className="text-xs text-ink-500">referência competitiva geral</p></div><div className="text-right"><strong className="text-cyan-200">{displayExam}</strong><p className="text-xs text-ink-500">{days} dias · {weeks} semanas</p></div></div>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">{([...OBJECTIVE_AREAS, 'essay'] as EnemArea[]).map((a) => <div key={a} className="rounded-xl bg-black/20 p-2.5 text-center"><p className="text-[10px] font-bold text-ink-500">{AREA_SHORT[a]}</p><p className="font-black text-cyan-100">{plan.targets[a]}{a === 'essay' ? '/1000' : '/45'}</p></div>)}</div>
            </div>
          </div>

          <div className="rounded-3xl border-2 border-amber-300/25 bg-gradient-to-br from-amber-300/[0.09] to-transparent p-5 shadow-xl shadow-amber-950/10">
            <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-2xl bg-amber-300 text-[#1b1200] flex items-center justify-center"><Sparkles className="w-5 h-5" /></div><div><p className="text-xs font-black uppercase tracking-widest text-amber-200">2 · Importante</p><h2 className="text-xl font-black">Quais matérias são mais confortáveis para você?</h2></div></div>
            <p className="mt-3 text-sm text-ink-400">Marque suas forças. O algoritmo usa isso para explorar matérias em que você consegue pontuar mais e redistribuir esforço sem abandonar seus pontos fracos.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">{OBJECTIVE_AREAS.map((a) => { const active = comfortAreas.includes(a); return <button key={a} onClick={() => toggleComfort(a)} className={`rounded-2xl border p-4 text-left transition-all ${active ? 'border-amber-300 bg-amber-300/15 text-amber-100' : 'border-white/10 bg-black/15 text-ink-300 hover:border-amber-300/35'}`}><div className="flex items-center justify-between"><strong>{AREA_LABEL[a]}</strong>{active && <CheckCircle2 className="w-5 h-5" />}</div><p className="mt-1 text-xs opacity-70">{active ? 'Marcada como força' : 'Toque para marcar'}</p></button>; })}</div>
            <p className="mt-4 text-xs text-amber-100/70">Selecionadas: {comfortAreas.length ? comfortAreas.map((a) => AREA_LABEL[a]).join(', ') : 'nenhuma ainda'}</p>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 mb-6">
          <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-widest text-ink-500">3 · Novo simulado</p><h2 className="text-xl font-black mt-1">Atualize o que você realmente está acertando</h2></div><TrendingUp className="w-5 h-5 text-cyan-300" /></div>
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">{OBJECTIVE_AREAS.map((a) => <label key={a} className="rounded-2xl border border-white/10 bg-black/15 p-3"><span className="text-xs text-ink-400">{AREA_LABEL[a]}</span><div className="mt-1 flex items-end justify-between"><strong className="text-2xl">{draftScores[a]}</strong><span className="text-xs text-cyan-300">meta {plan.targets[a]}</span></div><input type="range" min={0} max={45} value={draftScores[a]} onChange={(e) => setDraftScores((s) => ({ ...s, [a]: Number(e.target.value) }))} className="w-full mt-3" /></label>)}<label className="rounded-2xl border border-white/10 bg-black/15 p-3"><span className="text-xs text-ink-400">Redação</span><div className="mt-1 flex items-end justify-between"><strong className="text-2xl">{draftScores.essay}</strong><span className="text-xs text-cyan-300">meta {plan.targets.essay}</span></div><input type="range" min={0} max={1000} step={20} value={draftScores.essay} onChange={(e) => setDraftScores((s) => ({ ...s, essay: Number(e.target.value) }))} className="w-full mt-3" /></label></div>
          <button onClick={registerSimulation} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 font-black text-[#07111d]"><RefreshCw className="w-4 h-4" />Registrar simulado e recalcular tudo</button>
        </section>

        <nav className="flex gap-2 overflow-x-auto mb-5">{([['goal','Metas',Target],['plan','Plano semanal',CalendarDays],['practice','Questões',BookOpen],['scanner','Scanner',ScanLine]] as const).map(([id,label,Icon]) => <button key={id} onClick={() => setTab(id)} className={`whitespace-nowrap rounded-xl border px-4 py-2.5 text-sm font-bold inline-flex items-center gap-2 ${tab === id ? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-200' : 'border-white/10 text-ink-400'}`}><Icon className="w-4 h-4" />{label}</button>)}</nav>

        {tab === 'goal' && <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"><div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">{([...OBJECTIVE_AREAS, 'essay'] as EnemArea[]).map((a) => { const now = scores[a], target = plan.targets[a], max = a === 'essay' ? 1000 : 45; return <div key={a} className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="text-xs font-black text-ink-500">{AREA_LABEL[a]}</p><p className="mt-2 text-3xl font-black text-cyan-200">{target}<span className="text-xs text-ink-600">/{max}</span></p><p className="mt-2 text-xs text-ink-400">Atual {now} · {target > now ? `faltam ${target-now}` : 'meta atingida'}</p></div>; })}</div>{simulations.length > 0 && <div className="mt-5 text-xs text-ink-500">Último recálculo: {lastPlanUpdate || new Date(simulations[0].createdAt).toLocaleDateString('pt-BR')}</div>}</section>}

        {tab === 'plan' && <section className="space-y-4">
          <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.05] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"><div><h2 className="text-xl font-black">Plano adaptativo até {displayExam}</h2><p className="text-sm text-ink-400">Cada novo simulado recria os checkpoints e os materiais sugeridos.</p></div><button onClick={() => generatePdf(1)} className="rounded-xl border border-cyan-300/30 px-4 py-2.5 text-sm font-bold text-cyan-200 inline-flex items-center gap-2"><Download className="w-4 h-4" />PDF do plano</button></div>
          {plan.rows.map((row) => {
            const weeklyQuestions = currentQuestions.filter((q) => row.focus.some((f) => q.skill_name.toLowerCase().includes(f.split(' ')[0].toLowerCase()))).slice(0,2);
            return <div key={row.week} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4"><div className="lg:w-28"><p className="text-xs text-ink-500">CHECKPOINT</p><h3 className="text-xl font-black">Semana {row.week}</h3></div><div className="grid grid-cols-2 sm:grid-cols-5 gap-2 flex-1">{row.objective.map(({area:a,hits}) => <div key={a} className="rounded-xl bg-black/20 p-2.5 text-center"><p className="text-[10px] text-ink-500 font-bold">{AREA_SHORT[a]}</p><p className="font-black">{hits}/45</p></div>)}<div className="rounded-xl bg-cyan-300/[0.07] p-2.5 text-center"><p className="text-[10px] text-cyan-400 font-bold">RED</p><p className="font-black text-cyan-100">{row.essay}</p></div></div></div>
              <div className="mt-4 grid md:grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/15 p-4"><p className="text-xs font-black uppercase tracking-wider text-ink-500">Prioridade</p><p className="mt-2 font-bold">{row.priorityAreas.map((a) => AREA_LABEL[a]).join(' + ')}</p><p className="mt-2 text-xs text-ink-500">Foco: {row.focus.join(' · ')}</p></div>
                <button onClick={() => { setQuestionIndex(Math.max(0, currentQuestions.findIndex((q) => weeklyQuestions.some((x) => x.id === q.id)))); setTab('practice'); }} className="rounded-2xl border border-violet-300/20 bg-violet-300/[0.06] p-4 text-left hover:border-violet-300/40"><BookOpen className="w-5 h-5 text-violet-300" /><strong className="block mt-2">Fazer questões agora</strong><span className="text-xs text-ink-500">Prática alinhada à prova e às habilidades da semana.</span></button>
                <div className="grid grid-cols-2 gap-2"><button onClick={() => openVideo(row.focus[0])} className="rounded-2xl border border-rose-300/20 bg-rose-300/[0.05] p-3 text-left"><PlayCircle className="w-5 h-5 text-rose-300" /><strong className="block mt-2 text-sm">Vídeo</strong><span className="text-[11px] text-ink-500">Buscar aula da habilidade</span></button><button onClick={() => generatePdf(row.week)} className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.05] p-3 text-left"><FileText className="w-5 h-5 text-amber-300" /><strong className="block mt-2 text-sm">PDF</strong><span className="text-[11px] text-ink-500">Semana + questões</span></button></div>
              </div>
            </div>;
          })}
          {currentResources.length > 0 && <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"><h3 className="font-black">Fontes e materiais da prova</h3><div className="mt-3 grid md:grid-cols-2 gap-3">{currentResources.slice(0,6).map((r) => <a key={r.id} href={r.url || `https://www.youtube.com/results?search_query=${encodeURIComponent(r.search_query || '')}`} target="_blank" rel="noreferrer" className="rounded-2xl border border-white/10 bg-black/15 p-4 hover:border-cyan-300/30"><div className="flex items-center justify-between"><strong className="text-sm">{r.title}</strong><ExternalLink className="w-4 h-4 text-cyan-300" /></div><p className="mt-1 text-xs text-ink-500">{r.description}</p></a>)}</div></div>}
        </section>}

        {tab === 'practice' && <section className="grid lg:grid-cols-[1.4fr_.6fr] gap-5">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 md:p-7">{practice ? <><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-violet-300/10 border border-violet-300/20 px-3 py-1 text-xs font-bold text-violet-200">{practice.area} · {practice.skill_name}</span><span className="text-xs text-ink-500">Dificuldade {practice.difficulty}/5</span></div><h2 className="mt-5 text-xl md:text-2xl font-black leading-relaxed">{practice.prompt}</h2>{practice.option_a ? <div className="mt-5 space-y-2">{(['A','B','C','D','E'] as const).map((letter) => { const value = practice[`option_${letter.toLowerCase()}` as keyof PracticeQuestion] as string | null; if (!value) return null; const chosen = selectedAnswer === letter; return <button key={letter} onClick={() => { setSelectedAnswer(letter); setShowCorrection(false); }} className={`w-full rounded-2xl border p-4 text-left ${chosen ? 'border-cyan-300 bg-cyan-300/10' : 'border-white/10 bg-black/15'}`}><strong className="mr-3 text-cyan-300">{letter}</strong>{value}</button>; })}</div> : <textarea className="mt-5 w-full min-h-36 rounded-2xl border border-white/10 bg-black/20 p-4" placeholder="Escreva sua resposta discursiva antes de ver a correção." />}
          <div className="mt-5 flex flex-wrap gap-2"><button onClick={() => setShowCorrection(true)} className="rounded-xl bg-cyan-300 px-5 py-3 font-black text-[#07111d]">Corrigir</button><button onClick={nextQuestion} className="rounded-xl border border-white/15 px-5 py-3 font-bold">Próxima questão <ArrowRight className="w-4 h-4 inline ml-1" /></button><button onClick={() => generatePdf(1)} className="rounded-xl border border-amber-300/25 px-4 py-3 text-amber-200 font-bold"><Download className="w-4 h-4 inline mr-1" />PDF</button></div>{showCorrection && <div className={`mt-5 rounded-2xl border p-4 ${!practice.correct_option || selectedAnswer === practice.correct_option ? 'border-emerald-300/20 bg-emerald-300/[0.05]' : 'border-rose-300/20 bg-rose-300/[0.05]'}`}><strong>{practice.correct_option ? `Resposta: ${practice.correct_option}` : 'Resposta esperada'}</strong><p className="mt-2 text-sm text-ink-300">{practice.explanation}</p></div>}</> : <div className="text-center py-16 text-ink-500">Ainda não há questões autorais para esta prova.</div>}</div>
          <aside className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"><Brain className="w-7 h-7 text-cyan-300" /><h3 className="mt-3 text-lg font-black">Banco da prova</h3><p className="mt-2 text-sm text-ink-400">{currentQuestions.length} questões autorais disponíveis nesta versão, conectadas à taxonomia da prova.</p><button onClick={() => practice && openVideo(practice.skill_name)} className="mt-4 w-full rounded-xl border border-rose-300/20 bg-rose-300/[0.05] p-3 font-bold text-rose-200"><PlayCircle className="w-4 h-4 inline mr-2" />Ver aula desta habilidade</button></aside>
        </section>}

        {tab === 'scanner' && <section className="grid lg:grid-cols-2 gap-5"><div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"><h2 className="text-xl font-black">Escaneie uma questão</h2><input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => void handleImage(e.target.files?.[0])} /><button onClick={() => fileRef.current?.click()} className="mt-4 w-full min-h-40 rounded-2xl border border-dashed border-white/15 bg-black/15 overflow-hidden">{imageUrl ? <img src={imageUrl} className="max-h-64 mx-auto object-contain" alt="Questão" /> : <div className="text-ink-500"><Camera className="w-8 h-8 mx-auto mb-2" />Tirar foto ou enviar imagem</div>}</button><textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} className="mt-4 w-full min-h-32 rounded-2xl border border-white/10 bg-black/20 p-4" placeholder="Cole ou digite o enunciado para classificar a habilidade." /><button onClick={analyzeQuestion} className="mt-3 rounded-xl bg-cyan-300 px-5 py-3 font-black text-[#07111d]">Analisar habilidade</button></div><div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">{scanResult ? <><span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs font-bold text-cyan-200">{AREA_LABEL[scanResult.area]}</span><h3 className="mt-4 text-2xl font-black">{scanResult.skill}</h3><p className="mt-2 text-sm text-ink-400">Use esta classificação para buscar prática e vídeo. O próximo passo recomendado é fazer 5 questões do mesmo tipo e repetir em 48 horas.</p><button onClick={() => { setTab('practice'); setQuestionIndex(0); }} className="mt-5 rounded-xl border border-cyan-300/25 px-4 py-3 text-cyan-200 font-bold">Ir para questões</button></> : <div className="h-full min-h-72 flex items-center justify-center text-center text-ink-500"><div><ScanLine className="w-10 h-10 mx-auto mb-3" />O diagnóstico aparece aqui.</div></div>}</div></section>}
      </main>
    </div>
  );
}
