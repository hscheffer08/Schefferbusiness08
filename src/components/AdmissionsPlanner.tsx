import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Brain,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Loader2,
  RefreshCw,
  Save,
  ScanLine,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import {
  ENEM_AREAS,
  daysUntil,
  estimatedTargetScore,
  getCourseTarget,
  getInstitutionExam,
  type EnemArea,
} from '@/lib/admissions-planner-data';

interface AdmissionsPlannerProps {
  onBack: () => void;
}

interface AcademicAreaRow {
  area_id: string;
  name: string;
  courses: string;
}

interface AreaUniversityRow {
  area_university_id: number;
  area_id: string;
  university_name: string;
  course_label: string;
  institution_type: string | null;
  admissions_summary: string | null;
  source_url: string | null;
}

type ScoreMap = Record<EnemArea, number>;
type ObjectiveArea = Exclude<EnemArea, 'essay'>;

type SimulationRecord = {
  id: string;
  createdAt: string;
  examLabel: string;
  course: string;
  university: string;
  scores: ScoreMap;
};

const OBJECTIVE_AREAS: ObjectiveArea[] = ['languages', 'humanities', 'nature', 'math'];

const defaultScores: ScoreMap = {
  languages: 27,
  humanities: 27,
  nature: 24,
  math: 25,
  essay: 760,
};

const AREA_LABEL: Record<EnemArea, string> = {
  languages: 'Linguagens',
  humanities: 'Humanas',
  nature: 'Natureza',
  math: 'Matemática',
  essay: 'Redação',
};

const AREA_SHORT: Record<EnemArea, string> = {
  languages: 'LIN',
  humanities: 'HUM',
  nature: 'NAT',
  math: 'MAT',
  essay: 'RED',
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function classifyQuestion(text: string): { area: EnemArea; skill: string; explanation: string } {
  const t = text.toLowerCase();
  if (/função|equação|porcent|probabil|geometr|triâng|matriz|derivad|gráfico|razão|proporção/.test(t)) {
    const skill = /probabil/.test(t)
      ? 'Probabilidade'
      : /geometr|triâng/.test(t)
        ? 'Geometria'
        : /função|gráfico/.test(t)
          ? 'Funções e gráficos'
          : 'Álgebra e resolução de problemas';
    return { area: 'math', skill, explanation: 'A questão exige modelagem quantitativa, reconhecimento de relações e execução matemática.' };
  }
  if (/célula|dna|genét|ecolog|químic|mol|reação|força|energia|circuit|velocidade|vírus|bactér/.test(t)) {
    const skill = /dna|genét/.test(t)
      ? 'Genética'
      : /ecolog/.test(t)
        ? 'Ecologia'
        : /químic|mol|reação/.test(t)
          ? 'Química e transformações'
          : /força|energia|circuit|velocidade/.test(t)
            ? 'Física aplicada'
            : 'Biologia e saúde';
    return { area: 'nature', skill, explanation: 'A habilidade central está em interpretar fenômenos naturais e aplicar conceitos científicos ao problema.' };
  }
  if (/revolução|estado|democr|território|globalização|capitalismo|guerra|filosof|sociolog|história|geografia/.test(t)) {
    return { area: 'humanities', skill: 'Interpretação histórico-social', explanation: 'A questão depende de contexto, leitura de evidências e relações entre processos sociais, políticos e espaciais.' };
  }
  if (/texto|autor|linguagem|metáfora|poema|narrador|gênero|charge|publicidade|argument|gramát/.test(t)) {
    return { area: 'languages', skill: 'Interpretação e efeitos de sentido', explanation: 'O foco é compreender propósito, construção de sentido e estratégia linguística do texto.' };
  }
  return { area: 'languages', skill: 'Interpretação de enunciado', explanation: 'Sem palavras-chave suficientes, o sistema prioriza leitura do comando, inferência e eliminação de alternativas.' };
}

function buildTargets(course: string, targetScore: number, scores: ScoreMap, comfortAreas: ObjectiveArea[]) {
  const profile = getCourseTarget(course);
  const strength = Object.fromEntries(OBJECTIVE_AREAS.map((area) => [area, scores[area] / 45])) as Record<ObjectiveArea, number>;
  const totalWeight = OBJECTIVE_AREAS.reduce((sum, area) => sum + profile.weights[area], 0);
  const scoreFactor = clamp((targetScore - 640) / 210, 0.32, 0.94);

  const raw = OBJECTIVE_AREAS.map((area) => {
    const courseImportance = profile.weights[area] / totalWeight;
    const userStrength = strength[area];
    const declaredStrengthBoost = comfortAreas.includes(area) ? 2 : 0;
    const compensation = (userStrength - 0.58) * 7;
    const courseBoost = (courseImportance - 0.25) * 18;
    const base = 22 + scoreFactor * 17;
    return [area, clamp(Math.round(base + compensation + courseBoost + declaredStrengthBoost), 20, 42)] as const;
  });

  const targets = Object.fromEntries(raw) as Record<EnemArea, number>;
  targets.essay = clamp(Math.round(760 + (targetScore - 720) * 1.25), 760, 940);
  return targets;
}

function weekPlan(course: string, targetScore: number, scores: ScoreMap, weeks: number, comfortAreas: ObjectiveArea[]) {
  const profile = getCourseTarget(course);
  const targets = buildTargets(course, targetScore, scores, comfortAreas);
  const safeWeeks = Math.max(1, weeks);
  const visibleWeeks = Math.min(safeWeeks, 12);

  const rankedAreas = [...OBJECTIVE_AREAS].sort((a, b) => {
    const gapA = Math.max(0, targets[a] - scores[a]);
    const gapB = Math.max(0, targets[b] - scores[b]);
    const comfortPenaltyA = comfortAreas.includes(a) ? 0.72 : 1.15;
    const comfortPenaltyB = comfortAreas.includes(b) ? 0.72 : 1.15;
    const priorityA = gapA * profile.weights[a] * comfortPenaltyA;
    const priorityB = gapB * profile.weights[b] * comfortPenaltyB;
    return priorityB - priorityA;
  });

  const rows = Array.from({ length: visibleWeeks }, (_, index) => {
    const progress = (index + 1) / visibleWeeks;
    const objective = OBJECTIVE_AREAS.map((area) => {
      const start = scores[area];
      const target = targets[area];
      const easedProgress = 1 - Math.pow(1 - progress, 1.15);
      return { area, hits: Math.round(start + (target - start) * easedProgress) };
    });

    const rotation = index % rankedAreas.length;
    const primary = rankedAreas[rotation];
    const secondary = rankedAreas[(rotation + 1) % rankedAreas.length];
    const focus = [primary, secondary].map((area) => profile.focusSkills[area][index % profile.focusSkills[area].length]);
    const essay = Math.round(scores.essay + (targets.essay - scores.essay) * progress);

    return { week: index + 1, objective, essay, focus, priorityAreas: [primary, secondary] };
  });

  return { targets, rows, rankedAreas };
}

function readStoredScores(key: string, fallback: ScoreMap) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? { ...fallback, ...JSON.parse(saved) } : fallback;
  } catch {
    return fallback;
  }
}

export default function AdmissionsPlanner({ onBack }: AdmissionsPlannerProps) {
  const [areas, setAreas] = useState<AcademicAreaRow[]>([]);
  const [universities, setUniversities] = useState<AreaUniversityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedUniversityId, setSelectedUniversityId] = useState<number | null>(null);
  const [scores, setScores] = useState<ScoreMap>(() => readStoredScores('conectae:approval-scores', defaultScores));
  const [draftScores, setDraftScores] = useState<ScoreMap>(() => readStoredScores('conectae:approval-scores', defaultScores));
  const [comfortAreas, setComfortAreas] = useState<ObjectiveArea[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('conectae:comfort-areas') || '[]') as ObjectiveArea[];
    } catch {
      return [];
    }
  });
  const [simulations, setSimulations] = useState<SimulationRecord[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('conectae:simulations') || '[]') as SimulationRecord[];
    } catch {
      return [];
    }
  });
  const [lastPlanUpdate, setLastPlanUpdate] = useState<string | null>(() => localStorage.getItem('conectae:last-plan-update'));
  const [tab, setTab] = useState<'goal' | 'plan' | 'scanner'>('goal');
  const [questionText, setQuestionText] = useState('');
  const [scanResult, setScanResult] = useState<ReturnType<typeof classifyQuestion> | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const [areaResult, universityResult] = await Promise.all([
        supabase.from('academic_areas').select('area_id,name,courses').order('name'),
        supabase.from('area_universities').select('area_university_id,area_id,university_name,course_label,institution_type,admissions_summary,source_url').order('university_name'),
      ]);
      if (!active) return;
      setAreas((areaResult.data ?? []) as AcademicAreaRow[]);
      setUniversities((universityResult.data ?? []) as AreaUniversityRow[]);
      const firstArea = (areaResult.data?.[0] as AcademicAreaRow | undefined)?.area_id ?? '';
      setSelectedArea((current) => current || firstArea);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    localStorage.setItem('conectae:approval-scores', JSON.stringify(scores));
  }, [scores]);

  useEffect(() => {
    localStorage.setItem('conectae:comfort-areas', JSON.stringify(comfortAreas));
  }, [comfortAreas]);

  useEffect(() => {
    localStorage.setItem('conectae:simulations', JSON.stringify(simulations.slice(0, 12)));
  }, [simulations]);

  const area = areas.find((item) => item.area_id === selectedArea) ?? null;
  const areaUniversities = useMemo(() => universities.filter((item) => item.area_id === selectedArea), [universities, selectedArea]);

  useEffect(() => {
    if (!areaUniversities.length) {
      setSelectedUniversityId(null);
      return;
    }
    if (!areaUniversities.some((item) => item.area_university_id === selectedUniversityId)) {
      setSelectedUniversityId(areaUniversities[0].area_university_id);
    }
  }, [areaUniversities, selectedUniversityId]);

  const university = areaUniversities.find((item) => item.area_university_id === selectedUniversityId) ?? null;
  const course = university?.course_label || area?.courses || '';
  const exam = getInstitutionExam(university?.university_name ?? '');
  const targetScore = university
    ? estimatedTargetScore(course, university.university_name, university.institution_type)
    : getCourseTarget(course || 'Administração').targetScore;
  const days = daysUntil(exam.date);
  const weeks = Math.max(1, Math.ceil(days / 7));
  const plan = useMemo(
    () => weekPlan(course || 'Administração', targetScore, scores, weeks, comfortAreas),
    [course, targetScore, scores, weeks, comfortAreas],
  );

  const averageObjective = Math.round(OBJECTIVE_AREAS.reduce((sum, areaId) => sum + scores[areaId], 0) / OBJECTIVE_AREAS.length);
  const targetAverage = Math.round(OBJECTIVE_AREAS.reduce((sum, areaId) => sum + plan.targets[areaId], 0) / OBJECTIVE_AREAS.length);
  const hasDraftChanges = ENEM_AREAS.some(({ id }) => draftScores[id] !== scores[id]);

  const registerSimulation = () => {
    const now = new Date();
    const record: SimulationRecord = {
      id: `${now.getTime()}`,
      createdAt: now.toISOString(),
      examLabel: exam.label,
      course: course || 'Curso selecionado',
      university: university?.university_name || 'Faculdade selecionada',
      scores: { ...draftScores },
    };
    setScores({ ...draftScores });
    setSimulations((current) => [record, ...current].slice(0, 12));
    const timestamp = now.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    setLastPlanUpdate(timestamp);
    localStorage.setItem('conectae:last-plan-update', timestamp);
    setTab('plan');
  };

  const toggleComfortArea = (areaId: ObjectiveArea) => {
    setComfortAreas((current) => current.includes(areaId) ? current.filter((item) => item !== areaId) : [...current, areaId]);
  };

  const handleImage = async (file: File | undefined) => {
    if (!file) return;
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(URL.createObjectURL(file));
    setScanResult(null);
    setScanning(true);
    try {
      const TextDetectorCtor = (window as typeof window & { TextDetector?: new () => { detect: (source: ImageBitmap) => Promise<Array<{ rawValue?: string }>> } }).TextDetector;
      if (TextDetectorCtor) {
        const bitmap = await createImageBitmap(file);
        const blocks = await new TextDetectorCtor().detect(bitmap);
        const text = blocks.map((block) => block.rawValue || '').join(' ').trim();
        if (text) setQuestionText(text);
      }
    } catch {
      // Fallback manual permanece disponível.
    } finally {
      setScanning(false);
    }
  };

  const analyzeQuestion = () => {
    const text = questionText.trim();
    if (!text) return;
    const result = classifyQuestion(text);
    setScanResult(result);
    const key = `conectae:skill-errors:${result.area}:${result.skill}`;
    const current = Number(localStorage.getItem(key) || '0');
    localStorage.setItem(key, String(current + 1));
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-400" /></div>;
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-48 left-1/4 w-[560px] h-[560px] rounded-full bg-brand-500/15 blur-[150px]" />
        <div className="absolute top-1/2 -right-56 w-[520px] h-[520px] rounded-full bg-accent-500/10 blur-[150px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12">
        <button onClick={onBack} className="flex items-center gap-2 text-ink-400 hover:text-ink-100 text-sm font-medium"><ArrowLeft className="w-4 h-4" /> Voltar</button>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold"><Target className="w-4 h-4" /> Plano de Aprovação</div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pb-24">
        <section className="max-w-4xl mb-8">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">Da nota que você tem à nota que precisa.</h1>
          <p className="mt-3 text-ink-400 leading-relaxed">Registre cada simulado. O plano recalcula o ponto de partida, as metas intermediárias e as matérias prioritárias automaticamente.</p>
        </section>

        <section className="grid lg:grid-cols-[1.05fr_1.45fr] gap-5 mb-5">
          <div className="glass rounded-2xl border border-ink-800 p-5">
            <p className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-4">1. Seu objetivo</p>
            <label className="block text-sm text-ink-300 mb-2">Curso</label>
            <select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)} className="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-3 text-ink-100 outline-none focus:border-brand-500">
              {areas.map((item) => <option key={item.area_id} value={item.area_id}>{item.courses}</option>)}
            </select>
            <label className="block text-sm text-ink-300 mb-2 mt-4">Faculdade</label>
            <select value={selectedUniversityId ?? ''} onChange={(e) => setSelectedUniversityId(Number(e.target.value))} className="w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-3 text-ink-100 outline-none focus:border-brand-500">
              {areaUniversities.map((item) => <option key={item.area_university_id} value={item.area_university_id}>{item.university_name}</option>)}
            </select>

            {university && (
              <div className="mt-5 rounded-2xl border border-brand-500/35 bg-brand-500/10 p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-brand-300">Sua meta principal</p>
                <div className="mt-2 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-5xl font-black text-brand-200 leading-none">{targetScore}</p>
                    <p className="text-xs text-ink-400 mt-2">meta competitiva estimada para {course}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-ink-100">{exam.label}</p>
                    <p className="text-xs text-accent-300 mt-1">{days} dias · {weeks} semanas</p>
                  </div>
                </div>
                <div className="mt-4 border-t border-brand-500/15 pt-3">
                  <p className="text-xs leading-relaxed text-ink-400">{university.admissions_summary || exam.admissions}</p>
                  <a href={university.source_url || exam.sourceUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand-300 hover:text-brand-200">Ver fonte de ingresso <ExternalLink className="w-3.5 h-3.5" /></a>
                </div>
              </div>
            )}
          </div>

          <div className="glass rounded-2xl border border-ink-800 p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div><p className="text-xs font-bold text-ink-500 uppercase tracking-wider">2. Novo simulado</p><p className="text-sm text-ink-400 mt-1">Coloque o resultado mais recente e salve para recalcular o calendário.</p></div>
              <TrendingUp className="w-5 h-5 text-accent-400" />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {OBJECTIVE_AREAS.map((areaId) => (
                <label key={areaId} className="p-3 rounded-xl bg-ink-900/70 border border-ink-800">
                  <span className="flex items-center justify-between text-sm"><span className="text-ink-300">{AREA_LABEL[areaId]}</span><strong className="text-ink-100">{draftScores[areaId]}/45</strong></span>
                  <input type="range" min={0} max={45} value={draftScores[areaId]} onChange={(e) => setDraftScores((current) => ({ ...current, [areaId]: Number(e.target.value) }))} className="w-full mt-3 accent-current" />
                  <div className="mt-2 flex justify-between text-[10px]"><span className="text-ink-600">Atual: {scores[areaId]}</span><span className="text-brand-300">Meta: {plan.targets[areaId]}</span></div>
                </label>
              ))}
              <label className="sm:col-span-2 p-3 rounded-xl bg-ink-900/70 border border-ink-800">
                <span className="flex items-center justify-between text-sm"><span className="text-ink-300">Redação</span><strong className="text-ink-100">{draftScores.essay}/1000</strong></span>
                <input type="range" min={0} max={1000} step={20} value={draftScores.essay} onChange={(e) => setDraftScores((current) => ({ ...current, essay: Number(e.target.value) }))} className="w-full mt-3 accent-current" />
                <div className="mt-2 flex justify-between text-[10px]"><span className="text-ink-600">Atual: {scores.essay}</span><span className="text-brand-300">Meta: {plan.targets.essay}</span></div>
              </label>
            </div>
            <button onClick={registerSimulation} className={`mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-black transition-colors ${hasDraftChanges ? 'bg-brand-500 hover:bg-brand-400 text-ink-950' : 'bg-ink-800 hover:bg-ink-700 text-ink-200'}`}>
              {hasDraftChanges ? <RefreshCw className="w-4 h-4" /> : <Save className="w-4 h-4" />} Registrar simulado e recalcular plano
            </button>
            {lastPlanUpdate && <p className="mt-2 text-center text-[11px] text-ink-500">Calendário recalculado em {lastPlanUpdate}</p>}
          </div>
        </section>

        <section className="glass rounded-2xl border border-ink-800 p-5 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-ink-500 uppercase tracking-wider">3. Suas matérias de conforto</p>
              <p className="text-sm text-ink-400 mt-1">Marque onde você se sente mais seguro. O motor usa isso para proteger seus pontos fortes e concentrar mais estudo nos gargalos.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {OBJECTIVE_AREAS.map((areaId) => {
                const selected = comfortAreas.includes(areaId);
                return (
                  <button key={areaId} onClick={() => toggleComfortArea(areaId)} className={`px-3 py-2 rounded-xl border text-sm font-semibold transition-colors ${selected ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300' : 'border-ink-800 bg-ink-900/60 text-ink-400 hover:text-ink-200'}`}>
                    {selected && <CheckCircle2 className="inline w-4 h-4 mr-1.5" />}{AREA_LABEL[areaId]}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <nav className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {[
            ['goal', 'Metas de nota', Target],
            ['plan', 'Plano semanal', CalendarDays],
            ['scanner', 'Scanner de questões', ScanLine],
          ].map(([id, label, Icon]) => (
            <button key={String(id)} onClick={() => setTab(id as typeof tab)} className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border whitespace-nowrap text-sm font-semibold transition-colors ${tab === id ? 'border-brand-500/50 bg-brand-500/10 text-brand-200' : 'border-ink-800 bg-ink-900/50 text-ink-400 hover:text-ink-200'}`}><Icon className="w-4 h-4" />{String(label)}</button>
          ))}
        </nav>

        {tab === 'goal' && (
          <section className="space-y-4">
            <div className="glass rounded-2xl border border-brand-500/30 bg-brand-500/5 p-5 md:p-6">
              <div className="grid md:grid-cols-3 gap-4 items-center">
                <div><p className="text-xs font-bold text-ink-500 uppercase tracking-wider">Meta final</p><p className="text-5xl font-black text-brand-200 mt-1">{targetScore}</p><p className="text-xs text-ink-500 mt-1">referência competitiva</p></div>
                <div><p className="text-xs font-bold text-ink-500 uppercase tracking-wider">Média objetiva atual</p><p className="text-4xl font-black text-ink-100 mt-1">{averageObjective}<span className="text-base text-ink-500">/45</span></p></div>
                <div><p className="text-xs font-bold text-ink-500 uppercase tracking-wider">Média objetiva alvo</p><p className="text-4xl font-black text-accent-300 mt-1">{targetAverage}<span className="text-base text-ink-500">/45</span></p></div>
              </div>
            </div>

            <div className="glass rounded-2xl border border-ink-800 p-5 md:p-6">
              <h2 className="font-bold text-ink-100">Metas por matéria</h2>
              <p className="text-sm text-ink-400 mt-1 mb-5">O número grande é exatamente o que o plano quer que você alcance até a prova.</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {ENEM_AREAS.map(({ id, label }) => {
                  const current = scores[id];
                  const target = plan.targets[id];
                  const max = id === 'essay' ? 1000 : 45;
                  const gap = target - current;
                  return (
                    <div key={id} className={`p-4 rounded-2xl border ${gap <= 0 ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-ink-800 bg-ink-900/60'}`}>
                      <div className="flex items-center justify-between"><span className="text-xs font-bold text-ink-500">{AREA_SHORT[id]}</span>{target <= current ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <ArrowRight className="w-4 h-4 text-brand-400" />}</div>
                      <p className="mt-3 text-sm text-ink-300">{label}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-brand-400 mt-3">META</p>
                      <div className="flex items-end gap-1"><strong className="text-3xl text-ink-100">{target}</strong><span className="text-xs text-ink-500 mb-1">/{max}</span></div>
                      <div className="mt-3 pt-3 border-t border-ink-800 text-xs"><p className="text-ink-500">Atual: <strong className="text-ink-300">{current}</strong></p><p className={gap > 0 ? 'text-accent-300 mt-1' : 'text-emerald-400 mt-1'}>{gap > 0 ? `Faltam ${gap}` : `Acima da meta em ${Math.abs(gap)}`}</p></div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-5 p-4 rounded-xl bg-accent-500/5 border border-accent-500/20 text-sm text-ink-300 leading-relaxed"><Sparkles className="inline w-4 h-4 text-accent-300 mr-2" />As matérias marcadas como conforto podem carregar uma parcela maior da sua estratégia, mas o plano ainda preserva um piso mínimo nas áreas fracas.</div>
            </div>
          </section>
        )}

        {tab === 'plan' && (
          <section className="space-y-3">
            <div className="glass rounded-2xl border border-ink-800 p-5 flex items-start gap-3">
              <BookOpenCheck className="w-5 h-5 text-brand-400 mt-0.5" />
              <div className="flex-1"><h2 className="font-bold text-ink-100">Rota recalculada até {exam.label}</h2><p className="text-sm text-ink-400 mt-1">Cada vez que você registra um novo simulado, a Semana 1 passa a partir desse novo desempenho e todas as metas seguintes são redistribuídas.</p></div>
              {lastPlanUpdate && <span className="hidden md:inline text-[11px] text-ink-500">Atualizado {lastPlanUpdate}</span>}
            </div>

            <div className="glass rounded-2xl border border-ink-800 p-4">
              <p className="text-xs font-bold text-ink-500 uppercase tracking-wider">Prioridade atual do motor</p>
              <div className="mt-2 flex flex-wrap gap-2">{plan.rankedAreas.map((areaId, index) => <span key={areaId} className={`px-3 py-1.5 rounded-full text-xs font-bold ${index < 2 ? 'bg-accent-500/10 text-accent-300 border border-accent-500/20' : 'bg-ink-900 text-ink-400 border border-ink-800'}`}>{index + 1}. {AREA_LABEL[areaId]}</span>)}</div>
            </div>

            {plan.rows.map((row) => (
              <div key={`${lastPlanUpdate || 'initial'}-${row.week}`} className="glass rounded-2xl border border-ink-800 p-4 md:p-5">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="md:w-28"><span className="text-xs text-ink-500">Checkpoint</span><p className="font-bold text-ink-100">Semana {row.week}</p></div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">{row.objective.map(({ area: areaId, hits }) => <div key={areaId} className={`rounded-xl px-3 py-2 text-center ${row.priorityAreas.includes(areaId) ? 'bg-accent-500/10 border border-accent-500/15' : 'bg-ink-900 border border-transparent'}`}><p className="text-[10px] font-bold text-ink-500">{AREA_SHORT[areaId]}</p><p className="text-lg font-bold text-ink-100">{hits}/45</p><p className="text-[9px] text-ink-600">meta da semana</p></div>)}</div>
                  <div className="md:w-36 rounded-xl bg-brand-500/5 border border-brand-500/15 px-3 py-2"><p className="text-[10px] font-bold text-brand-400">REDAÇÃO</p><p className="text-lg font-bold text-brand-200">{row.essay}</p><p className="text-[9px] text-ink-600">meta da semana</p></div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">{row.focus.map((skill) => <span key={skill} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ink-800 text-xs text-ink-300"><Brain className="w-3 h-3 text-accent-400" />{skill}</span>)}</div>
              </div>
            ))}

            {simulations.length > 0 && (
              <div className="glass rounded-2xl border border-ink-800 p-5 mt-4">
                <p className="text-xs font-bold text-ink-500 uppercase tracking-wider">Histórico recente de simulados</p>
                <div className="mt-3 space-y-2">{simulations.slice(0, 4).map((item) => <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between gap-2 rounded-xl bg-ink-900/60 border border-ink-800 px-3 py-2"><div><p className="text-sm font-semibold text-ink-200">{item.examLabel}</p><p className="text-[11px] text-ink-500">{new Date(item.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p></div><div className="flex flex-wrap gap-2 text-[10px] text-ink-400">{OBJECTIVE_AREAS.map((areaId) => <span key={areaId}>{AREA_SHORT[areaId]} <strong className="text-ink-200">{item.scores[areaId]}</strong></span>)}<span>RED <strong className="text-ink-200">{item.scores.essay}</strong></span></div></div>)}</div>
              </div>
            )}
          </section>
        )}

        {tab === 'scanner' && (
          <section className="grid lg:grid-cols-2 gap-5">
            <div className="glass rounded-2xl border border-ink-800 p-5">
              <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-300 flex items-center justify-center"><Camera className="w-5 h-5" /></div><div><h2 className="font-bold text-ink-100">Escaneie uma questão</h2><p className="text-xs text-ink-500">Foto, print ou imagem da questão.</p></div></div>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => void handleImage(e.target.files?.[0])} />
              <button onClick={() => fileRef.current?.click()} className="w-full min-h-44 rounded-2xl border border-dashed border-ink-700 bg-ink-900/60 hover:border-brand-500/50 transition-colors overflow-hidden flex items-center justify-center">
                {imageUrl ? <img src={imageUrl} alt="Questão enviada" className="max-h-72 w-full object-contain" /> : <div className="text-center text-ink-500"><ScanLine className="w-8 h-8 mx-auto mb-2" /><p className="text-sm font-semibold text-ink-300">Tirar foto ou enviar imagem</p><p className="text-xs mt-1">O reconhecimento de texto é automático quando disponível no navegador.</p></div>}
              </button>
              <label className="block mt-4 text-sm text-ink-300">Texto reconhecido / enunciado</label>
              <textarea value={questionText} onChange={(e) => setQuestionText(e.target.value)} rows={6} placeholder="Se o reconhecimento automático não funcionar, cole ou digite o enunciado aqui." className="mt-2 w-full rounded-xl border border-ink-700 bg-ink-900 px-3 py-3 text-sm text-ink-100 outline-none focus:border-brand-500" />
              <button onClick={analyzeQuestion} disabled={!questionText.trim() || scanning} className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 disabled:opacity-40 disabled:cursor-not-allowed text-ink-950 font-bold px-4 py-3">{scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Analisar habilidade</button>
            </div>

            <div className="glass rounded-2xl border border-ink-800 p-5">
              {!scanResult ? <div className="h-full min-h-80 flex items-center justify-center text-center"><div><Brain className="w-10 h-10 text-ink-700 mx-auto mb-3" /><h3 className="font-bold text-ink-300">Seu diagnóstico aparece aqui</h3><p className="text-sm text-ink-500 max-w-sm mt-2">O sistema classifica área e habilidade e transforma o erro em prioridade de estudo nas próximas sessões.</p></div></div> : (
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-500/10 border border-accent-500/20 text-accent-300 text-xs font-bold">{AREA_LABEL[scanResult.area]}</div>
                  <h3 className="text-2xl font-bold mt-4 text-ink-100">{scanResult.skill}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-400">{scanResult.explanation}</p>
                  <div className="mt-5 p-4 rounded-xl border border-ink-800 bg-ink-900/70"><p className="text-xs font-bold text-ink-500 uppercase tracking-wider">Como melhorar agora</p><ol className="mt-3 space-y-3 text-sm text-ink-300"><li className="flex gap-2"><span className="text-brand-400 font-bold">1.</span><span>Revise a teoria mínima da habilidade por 15–20 minutos.</span></li><li className="flex gap-2"><span className="text-brand-400 font-bold">2.</span><span>Resolva 5 questões do mesmo tipo sem consultar a resposta.</span></li><li className="flex gap-2"><span className="text-brand-400 font-bold">3.</span><span>Marque o motivo do erro: conteúdo, interpretação, cálculo ou tempo.</span></li><li className="flex gap-2"><span className="text-brand-400 font-bold">4.</span><span>Refaça a questão em 48 horas e novamente na revisão semanal.</span></li></ol></div>
                  <button onClick={() => setTab('plan')} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-300 hover:text-brand-200">Voltar ao plano semanal <ChevronRight className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          </section>
        )}

        <footer className="mt-8 text-xs text-ink-600 leading-relaxed">As metas exibidas são metas competitivas de planejamento, não garantia de aprovação. Notas de corte mudam por ano, modalidade, campus, turno e ações afirmativas. Para processos próprios, o sistema usa a prova institucional quando identificada e mantém o link de fonte para conferência.</footer>
      </main>
    </div>
  );
}
