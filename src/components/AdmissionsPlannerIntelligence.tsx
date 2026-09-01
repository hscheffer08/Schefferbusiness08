import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  Database,
  ExternalLink,
  FileScan,
  Flame,
  GraduationCap,
  Loader2,
  Save,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type ExamId = 'enem' | 'fuvest' | 'insper' | 'link' | 'cmmg';
type Tab = 'dashboard' | 'plan' | 'scanner' | 'database';

type ExamProfile = {
  exam_id: ExamId;
  label: string;
  institution: string;
  exam_date: string | null;
  format_summary: string;
  official_source_url: string;
  scoring_model: Record<string, unknown>;
  stages: Array<Record<string, unknown>>;
  priorities: Record<string, unknown>;
};

type SkillRow = {
  id: number;
  exam_id: ExamId;
  area: string;
  skill_code: string;
  skill_name: string;
  parent_skill: string | null;
  importance: number;
  diagnostic_tags: string[];
};

type ResourceRow = {
  id: number;
  exam_id: ExamId;
  resource_type: string;
  year: number | null;
  label: string;
  url: string;
  metadata: Record<string, unknown>;
};

type CourseTarget = {
  exam_id: ExamId;
  course_label: string;
  target_kind: string;
  target_value: number | null;
  target_range: { low?: number; high?: number };
  area_weights: Record<string, number>;
  confidence: 'official' | 'historical' | 'estimated';
  rationale: string | null;
};

type AcademicArea = { area_id: string; name: string; courses: string };
type University = {
  area_university_id: number;
  area_id: string;
  university_name: string;
  course_label: string;
  institution_type: string | null;
};

type Metric = { key: string; label: string; max: number; defaultValue: number; unit: string };

const EXAM_ORDER: ExamId[] = ['enem', 'fuvest', 'insper', 'link', 'cmmg'];

const FALLBACK_LABELS: Record<ExamId, string> = {
  enem: 'ENEM 2026',
  fuvest: 'FUVEST 2027',
  insper: 'Insper 2027.1',
  link: 'Link Journey 2027.1',
  cmmg: 'Ciências Médicas-MG 2027.1',
};

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
    { key: 'Business case', label: 'Business case', max: 100, defaultValue: 58, unit: '%' },
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

const EXAM_ACCENTS: Record<ExamId, string> = {
  enem: 'cyan',
  fuvest: 'violet',
  insper: 'amber',
  link: 'fuchsia',
  cmmg: 'emerald',
};

function examFromUniversity(name: string): ExamId {
  const n = name.toLowerCase();
  if (n.includes('insper')) return 'insper';
  if (n.includes('link school') || n === 'link') return 'link';
  if (n.includes('ciências médicas') || n.includes('ciencias medicas') || n.includes('fcm-mg')) return 'cmmg';
  if (n.includes('usp') || n.includes('universidade de são paulo')) return 'fuvest';
  return 'enem';
}

function daysUntil(date: string | null) {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${date}T12:00:00`);
  return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86400000));
}

function normalize(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function targetForMetric(exam: ExamId, metric: Metric, target: CourseTarget | null, weights: Record<string, number>) {
  const basePct = target?.target_value ?? (exam === 'enem' ? 780 : 82);
  const weightKey = normalize(metric.key);
  const weightEntry = Object.entries(weights).find(([k]) => normalize(k).includes(weightKey) || weightKey.includes(normalize(k)));
  const w = weightEntry?.[1] ?? 1;

  if (exam === 'enem') {
    if (metric.key === 'Redação') return Math.min(960, Math.max(760, Math.round(760 + (basePct - 700) * 1.08 + (w - 0.2) * 180)));
    const scorePressure = Math.max(0, (basePct - 700) / 135);
    return Math.min(43, Math.max(27, Math.round(29 + scorePressure * 10 + (w - 0.2) * 20)));
  }
  if (metric.key === '1ª fase') return Math.min(76, Math.max(55, Math.round(80 * ((target?.target_value ?? 82) / 100))));
  if (metric.key === 'Objetivas') return Math.min(58, Math.max(42, Math.round(60 * ((target?.target_value ?? 80) / 100))));
  const raw = 78 + (w - 1) * 16;
  return Math.min(metric.max, Math.max(Math.round(metric.max * 0.68), Math.round(raw)));
}

function fallbackTarget(course: string, exam: ExamId): CourseTarget {
  const c = normalize(course);
  const health = /medicina|odontologia|farmacia|biomedicina|enfermagem|fisioterapia|nutricao|veterinaria|fono/.test(c);
  const quantitative = /engenharia|computacao|economia|matematica|fisica|quimica/.test(c);
  const humanities = /direito|relacoes internacionais|historia|geografia|letras|jornalismo/.test(c);
  const base = exam === 'enem' ? (health ? 815 : quantitative ? 770 : humanities ? 755 : 735) : exam === 'link' ? 85 : health ? 86 : 82;
  return {
    exam_id: exam,
    course_label: course,
    target_kind: exam === 'enem' ? 'competitive_score' : 'readiness_pct',
    target_value: base,
    target_range: exam === 'enem' ? { low: base - 15, high: base + 15 } : { low: base - 5, high: Math.min(96, base + 6) },
    area_weights: {},
    confidence: 'estimated',
    rationale: 'Meta competitiva de preparação. Não representa corte oficial universal.',
  };
}

export default function AdmissionsPlannerIntelligence({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<ExamProfile[]>([]);
  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [resources, setResources] = useState<ResourceRow[]>([]);
  const [targets, setTargets] = useState<CourseTarget[]>([]);
  const [areas, setAreas] = useState<AcademicArea[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [examId, setExamId] = useState<ExamId>('enem');
  const [values, setValues] = useState<Record<string, number>>({});
  const [questionText, setQuestionText] = useState('');
  const [scannerResult, setScannerResult] = useState<SkillRow | null>(null);
  const [scannerConfidence, setScannerConfidence] = useState(0);
  const [errorType, setErrorType] = useState('conteúdo');
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);
  const [diagnosticCount, setDiagnosticCount] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!supabase) { setLoading(false); return; }
      const [p, s, r, t, a, u] = await Promise.all([
        supabase.from('exam_intelligence_profiles').select('*').in('exam_id', EXAM_ORDER),
        supabase.from('exam_skill_taxonomy').select('*').in('exam_id', EXAM_ORDER).order('importance', { ascending: false }),
        supabase.from('exam_resources').select('*').in('exam_id', EXAM_ORDER).order('year', { ascending: false }),
        supabase.from('course_exam_targets').select('*').in('exam_id', EXAM_ORDER),
        supabase.from('academic_areas').select('area_id,name,courses').order('name'),
        supabase.from('area_universities').select('area_university_id,area_id,university_name,course_label,institution_type').order('university_name'),
      ]);
      if (!active) return;
      setProfiles((p.data ?? []) as ExamProfile[]);
      setSkills((s.data ?? []) as SkillRow[]);
      setResources((r.data ?? []) as ResourceRow[]);
      setTargets((t.data ?? []) as CourseTarget[]);
      setAreas((a.data ?? []) as AcademicArea[]);
      setUniversities((u.data ?? []) as University[]);
      const firstArea = (a.data?.[0] as AcademicArea | undefined)?.area_id ?? '';
      setSelectedArea(firstArea);

      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const [attempts, diagnostics] = await Promise.all([
          supabase.from('student_exam_attempts').select('id', { count: 'exact', head: true }).eq('user_id', userData.user.id),
          supabase.from('student_skill_diagnostics').select('id', { count: 'exact', head: true }).eq('user_id', userData.user.id),
        ]);
        setAttemptCount(attempts.count ?? 0);
        setDiagnosticCount(diagnostics.count ?? 0);
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const area = areas.find((x) => x.area_id === selectedArea) ?? null;
  const course = area?.courses || area?.name || 'Administração';
  const filteredUniversities = useMemo(() => universities.filter((u) => u.area_id === selectedArea), [universities, selectedArea]);

  useEffect(() => {
    if (!filteredUniversities.length) { setSelectedUniversity(''); return; }
    if (!filteredUniversities.some((u) => String(u.area_university_id) === selectedUniversity)) {
      setSelectedUniversity(String(filteredUniversities[0].area_university_id));
    }
  }, [filteredUniversities, selectedUniversity]);

  const university = filteredUniversities.find((u) => String(u.area_university_id) === selectedUniversity) ?? null;

  useEffect(() => {
    if (university) setExamId(examFromUniversity(university.university_name));
  }, [university?.area_university_id]);

  useEffect(() => {
    const next: Record<string, number> = {};
    for (const metric of METRICS[examId]) next[metric.key] = metric.defaultValue;
    const stored = localStorage.getItem(`conectae:exam-values:${examId}`);
    if (stored) {
      try { Object.assign(next, JSON.parse(stored)); } catch { /* ignore */ }
    }
    setValues(next);
    setScannerResult(null);
    setQuestionText('');
  }, [examId]);

  useEffect(() => {
    if (Object.keys(values).length) localStorage.setItem(`conectae:exam-values:${examId}`, JSON.stringify(values));
  }, [examId, values]);

  const profile = profiles.find((p) => p.exam_id === examId) ?? null;
  const examSkills = skills.filter((s) => s.exam_id === examId);
  const examResources = resources.filter((r) => r.exam_id === examId);
  const target = targets.find((t) => t.exam_id === examId && normalize(t.course_label) === normalize(course)) ?? fallbackTarget(course, examId);
  const metrics = METRICS[examId];
  const targetValues = useMemo(() => Object.fromEntries(metrics.map((m) => [m.key, targetForMetric(examId, m, target, target.area_weights ?? {})])), [examId, metrics, target]);
  const remainingDays = daysUntil(profile?.exam_date ?? null);

  const readiness = useMemo(() => {
    let score = 0;
    let totalWeight = 0;
    for (const metric of metrics) {
      const current = values[metric.key] ?? 0;
      const goal = targetValues[metric.key] ?? metric.max;
      const normalizedProgress = Math.min(1, current / Math.max(1, goal));
      const skillWeight = Object.entries(target.area_weights ?? {}).find(([k]) => normalize(metric.key).includes(normalize(k)))?.[1] ?? 1;
      score += normalizedProgress * skillWeight;
      totalWeight += skillWeight;
    }
    return Math.round((score / Math.max(1, totalWeight)) * 100);
  }, [metrics, target.area_weights, targetValues, values]);

  const priorities = useMemo(() => {
    return metrics.map((metric) => {
      const current = values[metric.key] ?? 0;
      const goal = targetValues[metric.key] ?? metric.max;
      const gap = Math.max(0, goal - current) / metric.max;
      const matchingSkills = examSkills.filter((s) => normalize(s.area).includes(normalize(metric.key)) || normalize(metric.key).includes(normalize(s.area)));
      const importance = matchingSkills.length ? Math.max(...matchingSkills.map((s) => Number(s.importance))) : 1;
      return { metric, current, goal, gap, importance, score: gap * importance, skills: matchingSkills.slice(0, 3) };
    }).sort((a, b) => b.score - a.score);
  }, [examSkills, metrics, targetValues, values]);

  const weeks = Math.max(1, Math.min(12, remainingDays ? Math.ceil(remainingDays / 7) : 8));
  const weeklyPlan = useMemo(() => Array.from({ length: weeks }, (_, i) => {
    const progress = (i + 1) / weeks;
    const phase = progress < 0.4 ? 'Base + correção de lacunas' : progress < 0.78 ? 'Volume + prova específica' : 'Simulado + precisão';
    const top = priorities[(i + Math.floor(i / 2)) % Math.max(1, Math.min(3, priorities.length))];
    return {
      week: i + 1,
      phase,
      focus: top?.metric.label ?? 'Revisão geral',
      goal: top ? Math.round(top.current + (top.goal - top.current) * progress) : 0,
      unit: top?.metric.unit ?? '%',
      skills: top?.skills.map((s) => s.skill_name) ?? [],
    };
  }), [priorities, weeks]);

  const classify = (text: string) => {
    const normalized = normalize(text);
    let best: SkillRow | null = null;
    let bestScore = 0;
    for (const skill of examSkills) {
      const terms = [...(skill.diagnostic_tags ?? []), skill.skill_name, skill.area]
        .map(normalize)
        .flatMap((x) => x.split(/\s+/))
        .filter((x) => x.length >= 4);
      const hits = terms.filter((term) => normalized.includes(term)).length;
      const score = hits * Number(skill.importance || 1);
      if (score > bestScore) { bestScore = score; best = skill; }
    }
    if (!best && examSkills.length) best = examSkills[0];
    setScannerResult(best);
    setScannerConfidence(best ? Math.min(96, Math.round(52 + bestScore * 11)) : 0);
  };

  const handleImage = async (file: File | null) => {
    if (!file) return;
    const detectorCtor = (window as unknown as { TextDetector?: new () => { detect: (source: ImageBitmap) => Promise<Array<{ rawValue?: string }>> } }).TextDetector;
    if (!detectorCtor) {
      setSavedMessage('Seu navegador não oferece OCR nativo. Cole o enunciado abaixo; o diagnóstico continua funcionando.');
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      const detector = new detectorCtor();
      const blocks = await detector.detect(bitmap);
      const text = blocks.map((b) => b.rawValue ?? '').join(' ').trim();
      setQuestionText(text);
      if (text) classify(text);
    } catch {
      setSavedMessage('Não consegui ler a imagem automaticamente. Cole o enunciado para analisar.');
    }
  };

  const saveAttempt = async () => {
    setSaving(true); setSavedMessage('');
    try {
      if (!supabase) throw new Error('offline');
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        localStorage.setItem(`conectae:last-simulation:${examId}`, JSON.stringify({ values, at: new Date().toISOString() }));
        setSavedMessage('Simulado salvo neste dispositivo. Entre na conta para construir histórico longitudinal.');
        return;
      }
      const rows = metrics.map((metric) => ({
        user_id: data.user!.id,
        exam_id: examId,
        exam_year: 2026,
        area: metric.key,
        correct: Math.round(values[metric.key] ?? 0),
        total: metric.max,
        score: metric.max > 100 ? values[metric.key] ?? 0 : null,
        metadata: { target: targetValues[metric.key], readiness, course, university: university?.university_name ?? null },
      }));
      const { error } = await supabase.from('student_exam_attempts').insert(rows);
      if (error) throw error;
      setAttemptCount((v) => v + rows.length);
      setSavedMessage('Desempenho salvo. O próximo plano usa esse histórico para priorizar lacunas recorrentes.');
    } catch {
      setSavedMessage('Não foi possível salvar na nuvem agora; seus valores continuam salvos localmente.');
    } finally { setSaving(false); }
  };

  const saveDiagnostic = async (correct: boolean) => {
    if (!scannerResult || !questionText.trim()) return;
    setSaving(true); setSavedMessage('');
    try {
      if (!supabase) throw new Error('offline');
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        const key = `conectae:diagnostic:${examId}:${scannerResult.skill_code}`;
        const previous = Number(localStorage.getItem(key) ?? 0);
        localStorage.setItem(key, String(previous + (correct ? 0 : 1)));
        setSavedMessage('Diagnóstico salvo localmente. Entre na conta para acumular histórico entre dispositivos.');
        return;
      }
      const { error } = await supabase.from('student_skill_diagnostics').insert({
        user_id: data.user.id,
        exam_id: examId,
        skill_code: scannerResult.skill_code,
        area: scannerResult.area,
        question_text: questionText.slice(0, 4000),
        correct,
        confidence: scannerConfidence / 100,
        error_type: correct ? null : errorType,
        diagnosis: {
          skill_name: scannerResult.skill_name,
          importance: scannerResult.importance,
          next_action: correct ? 'Manter revisão espaçada' : `Refazer bloco de ${scannerResult.skill_name} e revisar erro de ${errorType}`,
        },
      });
      if (error) throw error;
      setDiagnosticCount((v) => v + 1);
      setSavedMessage('Questão incorporada ao seu mapa de habilidades.');
    } catch {
      setSavedMessage('Não foi possível salvar na nuvem agora.');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#070b16] flex items-center justify-center"><Loader2 className="w-9 h-9 animate-spin text-cyan-300" /></div>;

  return (
    <div className="min-h-screen bg-[#070b16] text-ink-50 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none"><div className="absolute -top-48 -left-40 w-[620px] h-[620px] rounded-full bg-cyan-500/12 blur-[145px]" /><div className="absolute top-1/4 -right-48 w-[620px] h-[620px] rounded-full bg-violet-500/10 blur-[150px]" /></div>
      <header className="relative z-10 border-b border-white/10 bg-[#070b16]/85 backdrop-blur-xl sticky top-0">
        <div className="max-w-[1450px] mx-auto px-5 md:px-8 py-4 flex items-center justify-between gap-4">
          <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-ink-300 hover:text-white"><ArrowLeft className="w-4 h-4" /> Voltar</button>
          <div className="flex items-center gap-2"><div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-300 to-violet-400 flex items-center justify-center"><BrainCircuit className="w-5 h-5 text-[#07111d]" /></div><div><div className="font-black leading-none">Conectaê Intelligence</div><div className="text-[10px] tracking-[.15em] uppercase text-cyan-200 mt-1">Approval Engine v2</div></div></div>
          <div className="hidden md:flex items-center gap-2 text-xs text-ink-400"><ShieldCheck className="w-4 h-4 text-emerald-300" /> dados pessoais protegidos</div>
        </div>
      </header>

      <main className="relative z-10 max-w-[1450px] mx-auto px-5 md:px-8 py-7 pb-24">
        <section className="grid xl:grid-cols-[1.1fr_.9fr] gap-5 mb-6">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-black text-cyan-200 mb-4"><Sparkles className="w-3.5 h-3.5" /> inteligência específica por prova</div>
            <h1 className="text-3xl md:text-5xl font-black tracking-[-.035em] leading-[1.02]">Pare de estudar para uma prova genérica.</h1>
            <p className="mt-4 text-ink-300 max-w-3xl leading-relaxed">O motor cruza curso, faculdade, formato real da seleção, distância até a prova, seu desempenho atual e cada questão errada para recalcular prioridades semana a semana.</p>
            <div className="grid sm:grid-cols-2 gap-3 mt-6">
              <label className="text-xs font-bold text-ink-400">Curso
                <select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b1424] px-3 py-3 text-sm text-white outline-none focus:border-cyan-300/40">
                  {areas.map((a) => <option key={a.area_id} value={a.area_id}>{a.courses || a.name}</option>)}
                </select>
              </label>
              <label className="text-xs font-bold text-ink-400">Faculdade
                <select value={selectedUniversity} onChange={(e) => setSelectedUniversity(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b1424] px-3 py-3 text-sm text-white outline-none focus:border-cyan-300/40">
                  {filteredUniversities.map((u) => <option key={u.area_university_id} value={u.area_university_id}>{u.university_name}</option>)}
                </select>
              </label>
            </div>
          </div>
          <div className="rounded-[28px] border border-cyan-300/15 bg-gradient-to-br from-cyan-300/[0.08] to-violet-400/[0.05] p-6">
            <div className="text-[10px] uppercase tracking-[.15em] text-ink-500 font-black">Prontidão estimada</div>
            <div className="flex items-end justify-between gap-4 mt-2"><div className="text-6xl font-black text-cyan-200">{readiness}%</div><div className="text-right text-xs text-ink-400">{attemptCount} registros de desempenho<br />{diagnosticCount} diagnósticos de questões</div></div>
            <div className="mt-4 h-2 rounded-full bg-white/5 overflow-hidden"><div className="h-full bg-gradient-to-r from-cyan-300 via-brand-300 to-violet-300 rounded-full" style={{ width: `${readiness}%` }} /></div>
            <div className="grid grid-cols-2 gap-3 mt-5"><div className="rounded-2xl border border-white/10 bg-black/15 p-4"><CalendarDays className="w-4 h-4 text-cyan-200 mb-2" /><div className="text-xs text-ink-500">Até a prova</div><div className="font-black mt-1">{remainingDays === null ? 'por etapas' : `${remainingDays} dias`}</div></div><div className="rounded-2xl border border-white/10 bg-black/15 p-4"><Target className="w-4 h-4 text-fuchsia-200 mb-2" /><div className="text-xs text-ink-500">Meta</div><div className="font-black mt-1">{target.target_value ?? 'adaptativa'}{examId === 'enem' ? ' pts' : '%'}</div></div></div>
          </div>
        </section>

        <section className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
          {EXAM_ORDER.map((id) => {
            const p = profiles.find((x) => x.exam_id === id);
            const active = id === examId;
            return <button key={id} onClick={() => setExamId(id)} className={`rounded-2xl border p-4 text-left transition-all ${active ? 'border-cyan-300/45 bg-cyan-300/10 -translate-y-0.5' : 'border-white/10 bg-white/[0.025] hover:bg-white/[0.05]'}`}><div className="flex items-center justify-between"><GraduationCap className={`w-4 h-4 ${active ? 'text-cyan-200' : 'text-ink-500'}`} /><span className="text-[9px] uppercase tracking-widest text-ink-600">{EXAM_ACCENTS[id]}</span></div><div className="font-black text-sm mt-3">{p?.label ?? FALLBACK_LABELS[id]}</div><div className="text-[11px] text-ink-500 mt-1">{p?.exam_date ? new Date(`${p.exam_date}T12:00:00`).toLocaleDateString('pt-BR') : 'processo por etapas'}</div></button>;
          })}
        </section>

        <nav className="flex gap-2 overflow-x-auto mb-6 pb-1">
          {([['dashboard','Diagnóstico'],['plan','Plano semanal'],['scanner','Scanner de questões'],['database','Banco da prova']] as [Tab,string][]).map(([id,label]) => <button key={id} onClick={() => setTab(id)} className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-black border ${tab === id ? 'border-cyan-300/40 bg-cyan-300/10 text-cyan-100' : 'border-white/10 bg-white/[0.025] text-ink-400 hover:text-white'}`}>{label}</button>)}
        </nav>

        {savedMessage && <div className="mb-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/8 px-4 py-3 text-sm text-emerald-100 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />{savedMessage}</div>}

        {tab === 'dashboard' && <div className="grid xl:grid-cols-[1fr_.8fr] gap-5">
          <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <div className="flex items-center justify-between gap-4 mb-5"><div><div className="text-xs uppercase tracking-[.14em] font-black text-cyan-200">Seu nível agora</div><h2 className="text-2xl font-black mt-1">Desempenho por componente</h2></div><button onClick={saveAttempt} disabled={saving} className="rounded-xl bg-cyan-300 text-[#07111d] px-4 py-2.5 font-black text-sm inline-flex items-center gap-2 disabled:opacity-60">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar simulado</button></div>
            <div className="space-y-5">{metrics.map((metric) => { const value = values[metric.key] ?? 0; const goal = targetValues[metric.key] ?? metric.max; return <div key={metric.key}><div className="flex items-end justify-between gap-3 mb-2"><div><div className="font-bold">{metric.label}</div><div className="text-xs text-ink-500">meta atual: {goal} {metric.unit}</div></div><div className={`text-lg font-black ${value >= goal ? 'text-emerald-300' : 'text-ink-200'}`}>{value}</div></div><input type="range" min={0} max={metric.max} step={metric.max > 100 ? 10 : 1} value={value} onChange={(e) => setValues((v) => ({ ...v, [metric.key]: Number(e.target.value) }))} className="w-full accent-cyan-300" /></div>; })}</div>
            {examId === 'enem' && <div className="mt-5 rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] p-4 text-xs text-amber-100/80">No ENEM, acertos e nota TRI não têm relação linear. O sistema usa acertos como meta de consistência, não promete uma nota exata a partir de um número fixo de questões.</div>}
          </section>
          <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">
            <div className="text-xs uppercase tracking-[.14em] font-black text-fuchsia-200">Motor adaptativo</div><h2 className="text-2xl font-black mt-1 mb-5">O que mais aumenta sua chance agora</h2>
            <div className="space-y-3">{priorities.slice(0, 5).map((p, index) => <div key={p.metric.key} className="rounded-2xl border border-white/10 bg-black/15 p-4"><div className="flex items-start justify-between gap-3"><div className="flex gap-3"><span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black ${index === 0 ? 'bg-red-400/15 text-red-200' : index === 1 ? 'bg-amber-300/15 text-amber-100' : 'bg-white/5 text-ink-400'}`}>{index + 1}</span><div><div className="font-black">{p.metric.label}</div><div className="text-xs text-ink-500 mt-1">{p.current} → {p.goal} {p.metric.unit}</div></div></div><TrendingUp className="w-4 h-4 text-cyan-200" /></div>{p.skills.length > 0 && <div className="flex flex-wrap gap-1.5 mt-3">{p.skills.map((s) => <span key={s.skill_code} className="rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[10px] text-ink-300">{s.skill_name}</span>)}</div>}</div>)}</div>
          </section>
        </div>}

        {tab === 'plan' && <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-7"><div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6"><div><div className="text-xs uppercase tracking-[.14em] font-black text-violet-200">{weeks} semanas</div><h2 className="text-2xl md:text-3xl font-black mt-1">Rota até {profile?.label ?? FALLBACK_LABELS[examId]}</h2></div><div className="text-xs text-ink-500 max-w-md">As metas interpolam seu nível atual até a faixa de segurança e alternam as três maiores lacunas para evitar estudar só o que você já sabe.</div></div><div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">{weeklyPlan.map((w) => <div key={w.week} className="rounded-2xl border border-white/10 bg-black/15 p-5"><div className="flex items-center justify-between"><span className="text-xs font-black text-cyan-200">SEMANA {w.week}</span><Flame className="w-4 h-4 text-amber-200" /></div><div className="font-black text-lg mt-3">{w.focus}</div><div className="text-sm text-ink-400 mt-1">{w.phase}</div><div className="mt-4 rounded-xl bg-white/[0.04] border border-white/10 p-3"><div className="text-[10px] uppercase tracking-wider text-ink-500">checkpoint</div><div className="font-black mt-1">{w.goal} {w.unit}</div></div>{w.skills.length > 0 && <div className="mt-3 space-y-1">{w.skills.map((s) => <div key={s} className="text-xs text-ink-400 flex gap-2"><ChevronRight className="w-3 h-3 mt-0.5 text-violet-300" />{s}</div>)}</div>}</div>)}</div></section>}

        {tab === 'scanner' && <div className="grid xl:grid-cols-[1fr_.85fr] gap-5">
          <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6"><div className="flex items-center gap-3 mb-4"><div className="w-11 h-11 rounded-2xl bg-cyan-300/10 text-cyan-200 flex items-center justify-center"><FileScan className="w-5 h-5" /></div><div><div className="font-black text-xl">Scanner de questão</div><div className="text-xs text-ink-500">classifica usando a taxonomia específica de {profile?.label ?? FALLBACK_LABELS[examId]}</div></div></div><label className="block rounded-2xl border border-dashed border-cyan-300/25 bg-cyan-300/[0.04] p-5 text-center cursor-pointer hover:bg-cyan-300/[0.07]"><Camera className="w-6 h-6 text-cyan-200 mx-auto mb-2" /><div className="font-bold text-sm">Enviar foto ou print</div><div className="text-xs text-ink-500 mt-1">OCR nativo quando disponível</div><input type="file" accept="image/*" className="hidden" onChange={(e) => void handleImage(e.target.files?.[0] ?? null)} /></label><textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} placeholder="Cole aqui o enunciado completo da questão..." className="mt-4 w-full min-h-44 rounded-2xl border border-white/10 bg-[#0b1424] p-4 text-sm outline-none focus:border-cyan-300/35" /><button onClick={() => classify(questionText)} disabled={!questionText.trim()} className="mt-3 w-full rounded-xl bg-cyan-300 text-[#07111d] py-3 font-black disabled:opacity-40 inline-flex items-center justify-center gap-2"><BrainCircuit className="w-4 h-4" /> Diagnosticar habilidade</button></section>
          <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6">{scannerResult ? <><div className="flex items-center justify-between gap-3"><div className="text-xs uppercase tracking-wider font-black text-emerald-200">{scannerConfidence}% confiança</div><Database className="w-4 h-4 text-ink-500" /></div><h3 className="text-2xl font-black mt-3">{scannerResult.skill_name}</h3><div className="text-sm text-ink-400 mt-1">{scannerResult.area} · importância {Number(scannerResult.importance).toFixed(2)}x</div><div className="mt-5 rounded-2xl border border-white/10 bg-black/15 p-4"><div className="text-xs font-black text-ink-300">Se você errou, classifique o motivo:</div><div className="flex flex-wrap gap-2 mt-3">{['conteúdo','interpretação','procedimento','tempo','desatenção'].map((type) => <button key={type} onClick={() => setErrorType(type)} className={`rounded-full px-3 py-1.5 text-xs font-bold border ${errorType === type ? 'border-fuchsia-300/40 bg-fuchsia-300/10 text-fuchsia-100' : 'border-white/10 text-ink-500'}`}>{type}</button>)}</div></div><div className="mt-4 grid grid-cols-2 gap-2"><button onClick={() => void saveDiagnostic(false)} className="rounded-xl border border-red-300/20 bg-red-300/8 py-3 text-sm font-black text-red-100">Errei esta questão</button><button onClick={() => void saveDiagnostic(true)} className="rounded-xl border border-emerald-300/20 bg-emerald-300/8 py-3 text-sm font-black text-emerald-100">Acertei</button></div><div className="mt-5 text-xs text-ink-500 leading-relaxed">Cada registro vira sinal para o motor: habilidade, prova, tipo de erro, frequência e importância. Com histórico, a prioridade deixa de ser só “matéria fraca” e passa a distinguir lacuna de conteúdo, leitura, método, tempo e desatenção.</div></> : <div className="h-full min-h-80 flex flex-col items-center justify-center text-center"><FileScan className="w-10 h-10 text-ink-700 mb-3" /><div className="font-black text-ink-300">Nenhuma questão analisada</div><div className="text-sm text-ink-600 max-w-xs mt-2">Envie uma questão para conectá-la ao seu mapa de habilidades.</div></div>}</section>
        </div>}

        {tab === 'database' && <div className="grid xl:grid-cols-[.9fr_1.1fr] gap-5"><section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6"><div className="flex items-start justify-between gap-4"><div><div className="text-xs uppercase tracking-[.14em] font-black text-cyan-200">Perfil oficial</div><h2 className="text-2xl font-black mt-1">{profile?.label ?? FALLBACK_LABELS[examId]}</h2></div><Database className="w-6 h-6 text-cyan-200" /></div><p className="mt-4 text-sm text-ink-300 leading-relaxed">{profile?.format_summary ?? 'Estrutura específica da prova.'}</p><div className="grid sm:grid-cols-2 gap-3 mt-5"><div className="rounded-2xl bg-black/15 border border-white/10 p-4"><TimerReset className="w-4 h-4 text-violet-200 mb-2" /><div className="text-xs text-ink-500">Data principal</div><div className="font-black mt-1">{profile?.exam_date ? new Date(`${profile.exam_date}T12:00:00`).toLocaleDateString('pt-BR') : 'etapas do processo'}</div></div><div className="rounded-2xl bg-black/15 border border-white/10 p-4"><BookOpen className="w-4 h-4 text-amber-200 mb-2" /><div className="text-xs text-ink-500">Taxonomia</div><div className="font-black mt-1">{examSkills.length} habilidades-chave</div></div></div>{profile?.official_source_url && <a href={profile.official_source_url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-cyan-200 hover:text-cyan-100">Abrir fonte oficial <ExternalLink className="w-4 h-4" /></a>}</section><section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6"><div className="text-xs uppercase tracking-[.14em] font-black text-fuchsia-200">Base de inteligência</div><h2 className="text-2xl font-black mt-1 mb-5">Fontes e repertório da prova</h2><div className="space-y-3">{examResources.map((r) => <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="block rounded-2xl border border-white/10 bg-black/15 p-4 hover:border-fuchsia-300/25"><div className="flex items-start justify-between gap-3"><div><div className="font-black text-sm">{r.label}</div><div className="text-xs text-ink-500 mt-1">{r.resource_type.replaceAll('_',' ')} {r.year ? `· ${r.year}` : ''}</div></div><ExternalLink className="w-4 h-4 text-ink-600" /></div></a>)}{examResources.length === 0 && <div className="text-sm text-ink-500">Nenhum recurso carregado.</div>}</div><div className="mt-5 rounded-2xl border border-violet-300/15 bg-violet-300/[0.05] p-4 text-xs text-violet-100/80">O banco guarda metadados, taxonomia e histórico de desempenho; provas completas continuam ligadas às fontes oficiais. Isso permite analisar padrões sem copiar material protegido.</div></section></div>}

        <footer className="mt-8 grid md:grid-cols-4 gap-3">{[
          [Database, 'Banco por prova', 'perfis, recursos, rotas e metas'],
          [BarChart3, 'Histórico longitudinal', 'simulados por aluno e por área'],
          [BrainCircuit, 'Diagnóstico granular', 'habilidade + tipo de erro'],
          [Target, 'Meta adaptativa', 'curso + instituição + prazo'],
        ].map(([Icon, title, text]) => { const I = Icon as typeof Database; return <div key={String(title)} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"><I className="w-4 h-4 text-cyan-200 mb-3" /><div className="font-black text-sm">{String(title)}</div><div className="text-xs text-ink-500 mt-1">{String(text)}</div></div>; })}</footer>
      </main>
    </div>
  );
}
