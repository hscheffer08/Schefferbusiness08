import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Compass, Database, GraduationCap, Layers3, Search, Target } from 'lucide-react';
import { ACADEMIC_AREAS, type AcademicArea } from '@/lib/area-match-data';
import { professionalQuestionsForArea } from '@/lib/professional-area-matching';
import { calculateProfessionalMatches, loadProfessionalAreas, type ProfessionalArea } from '@/lib/professional-area-match';
import { adaptiveLearningStatus, applyAdaptiveCalibration, loadAreaCalibration, orderQuestionsAdaptively, recordAreaResponses, type AreaCalibration } from '@/lib/adaptive-area-match';
import CommercialAreaResults from '@/components/CommercialAreaResults';
import { trackEvent } from '@/lib/analytics';

interface Props { onClose: () => void; initialAreaId?: string | null; }
type Step = 'areas' | 'quiz' | 'results';

const AREA_PHOTOS = [
  'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=900&q=78',
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3d57bc86b40?auto=format&fit=crop&w=900&q=78',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=78',
  'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=900&q=78',
  'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=78',
  'https://images.unsplash.com/photo-1484417894907-623942c8ee29?auto=format&fit=crop&w=900&q=78',
];
const HERO = 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=84';
const CARD_TONES = [
  'from-cyan-400/20 via-brand-500/10 to-transparent border-cyan-300/15',
  'from-violet-400/15 via-indigo-500/10 to-transparent border-violet-300/15',
  'from-amber-300/15 via-orange-500/10 to-transparent border-amber-300/15',
  'from-emerald-300/15 via-cyan-500/10 to-transparent border-emerald-300/15',
];

export default function AreaMatchPortal({ onClose, initialAreaId }: Props) {
  const fallback = ACADEMIC_AREAS.map((a,index)=>({ ...a, dimensionWeights:{}, questions:[], universities:a.universities.map((u,i)=>({...u,areaUniversityId:index*20+i,dataConfidence:40,evidenceCount:0})) }));
  const [areas, setAreas] = useState<ProfessionalArea[]>(fallback);
  const [step, setStep] = useState<Step>(initialAreaId ? 'quiz' : 'areas');
  const [area, setArea] = useState<ProfessionalArea | null>(fallback.find(a=>a.id===initialAreaId) ?? null);
  const [query, setQuery] = useState('');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [index, setIndex] = useState(0);
  const [dataReady, setDataReady] = useState(false);
  const [calibration, setCalibration] = useState<AreaCalibration>({});
  const [questionOrder, setQuestionOrder] = useState<string[]>([]);

  useEffect(() => {
    let active = true;
    loadProfessionalAreas(ACADEMIC_AREAS).then(loaded => {
      if (!active) return;
      setAreas(loaded);
      if (initialAreaId) setArea(loaded.find(a=>a.id===initialAreaId) ?? fallback.find(a=>a.id===initialAreaId) ?? null);
      setDataReady(true);
    });
    return () => { active = false; };
  }, [initialAreaId]);

  const baseQuestions = area ? (area.questions?.length ? area.questions : professionalQuestionsForArea(area as AcademicArea)) : [];
  const questions = questionOrder.length
    ? questionOrder.map(id => baseQuestions.find(question => question.id === id)).filter((question): question is typeof baseQuestions[number] => Boolean(question))
    : baseQuestions;
  const adaptiveArea = useMemo(() => area ? applyAdaptiveCalibration(area, answers, calibration) : null, [area, answers, calibration]);
  const matches = useMemo(() => dataReady && adaptiveArea ? calculateProfessionalMatches(adaptiveArea, answers) : [], [dataReady, adaptiveArea, answers]);
  const learningStatus = adaptiveLearningStatus(calibration);
  const filtered = areas.filter(item => `${item.name} ${item.courses}`.toLowerCase().includes(query.toLowerCase()));
  const totalOptions = areas.reduce((sum, item) => sum + item.universities.length, 0);

  useEffect(() => {
    if (!area) { setCalibration({}); setQuestionOrder([]); return; }
    let active = true;
    loadAreaCalibration(area.id).then(nextCalibration => {
      if (!active) return;
      setCalibration(nextCalibration);
      const sourceQuestions = area.questions?.length ? area.questions : professionalQuestionsForArea(area as AcademicArea);
      setQuestionOrder(orderQuestionsAdaptively(sourceQuestions, nextCalibration).map(question => question.id));
    });
    return () => { active = false; };
  }, [area]);

  const selectArea = (selected:ProfessionalArea) => {
    if (!dataReady) return;
    setArea(selected); setAnswers({}); setIndex(0); setCalibration({}); setQuestionOrder([]); setStep('quiz');
    trackEvent('area_selected', { area_id:selected.id, area_name:selected.name, courses:selected.courses });
  };
  const openPlanner = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('planner','aprovacao');
    window.location.assign(`${url.pathname}${url.search}${url.hash}`);
  };

  if (step === 'areas') return <div className="min-h-screen bg-[#070b16] text-ink-50 relative">
    <div className="fixed inset-0 pointer-events-none"><div className="absolute -left-36 top-20 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[140px]"/><div className="absolute -right-40 top-[35%] w-[520px] h-[520px] rounded-full bg-violet-500/10 blur-[150px]"/></div>
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070b16]/95 backdrop-blur-2xl px-4 md:px-8 py-3.5">
      <div className="mx-auto max-w-6xl grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <button onClick={onClose} className="justify-self-start inline-flex items-center gap-2 text-sm text-ink-300 hover:text-white"><ArrowLeft className="w-4 h-4"/> <span className="hidden sm:inline">Início</span></button>
        <div className="flex items-center gap-2 font-extrabold"><div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-300 to-brand-500 flex items-center justify-center"><GraduationCap className="w-4 h-4 text-[#07101d]"/></div><span>Conectaê</span></div>
        <div className="justify-self-end flex items-center gap-2">
          <span className="hidden lg:inline-flex items-center gap-1 text-[11px] text-ink-500"><Database className="w-3.5 h-3.5"/>{dataReady?'Banco profissional ativo':'Carregando dados'}</span>
          <button onClick={openPlanner} className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/[0.08] px-3 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-300/[0.14]"><Target className="w-4 h-4"/><span className="hidden sm:inline">Plano de aprovação</span><span className="sm:hidden">Plano</span></button>
        </div>
      </div>
    </header>
    <main className="relative max-w-6xl mx-auto px-5 md:px-8 py-8 md:py-10 pb-24">
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 min-h-[300px] md:min-h-[320px] mb-7 shadow-2xl shadow-black/30">
        <img src={HERO} alt="Campus universitário" className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer"/>
        <div className="absolute inset-0 bg-gradient-to-r from-[#07101d] via-[#07101d]/90 to-[#07101d]/35"/>
        <div className="relative z-10 max-w-3xl p-7 md:p-10 min-h-[300px] md:min-h-[320px] flex flex-col justify-end">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-cyan-200 text-sm font-semibold mb-4"><Compass className="w-4 h-4"/> Já sabe seu curso?</span>
          <h1 className="text-4xl md:text-6xl font-black tracking-[-.035em] leading-[1.02] mb-4">Descubra onde você pode <span className="text-cyan-200">se encaixar melhor.</span></h1>
          <p className="text-ink-300 text-base md:text-lg max-w-2xl">Compare faculdades por fit, ambiente, carreira, qualidade disponível e confiança dos dados — sem transformar tudo em um ranking genérico.</p>
        </div>
      </section>
      <div className="grid grid-cols-3 gap-3 mb-6">{[[String(areas.length),'cursos'],[String(totalOptions),'opções'],['24','dimensões por perfil']].map(([number,label],i)=><div key={label} className={`rounded-2xl border p-4 bg-gradient-to-br ${CARD_TONES[i]}`}><div className="text-xl md:text-2xl font-black">{number}</div><div className="text-[10px] md:text-xs uppercase tracking-[.10em] md:tracking-[.13em] font-bold text-ink-500">{label}</div></div>)}</div>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">
        <div><div className="text-xs font-bold uppercase tracking-[.14em] text-cyan-200 mb-1">Todos os cursos</div><h2 className="text-2xl md:text-3xl font-black tracking-[-.03em]">Escolha entre {areas.length} áreas e cursos</h2><p className="text-sm text-ink-500 mt-1">Role a página para ver todos. Nenhum curso fica escondido atrás desta tela.</p></div>
        <div className="relative w-full md:max-w-md"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-500"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar área ou curso..." className="w-full rounded-2xl border border-white/10 bg-white/[0.045] py-4 pl-12 pr-4 outline-none focus:border-cyan-300/40"/></div>
      </div>
      <div className="mb-4 text-xs text-ink-500">Mostrando <b className="text-white">{filtered.length}</b> de {areas.length} cursos</div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">{filtered.map((item,cardIndex)=><button key={item.id} onClick={()=>selectArea(item)} disabled={!dataReady} className={`group relative overflow-hidden text-left rounded-[22px] border disabled:opacity-50 disabled:cursor-wait bg-gradient-to-br ${CARD_TONES[cardIndex % CARD_TONES.length]} hover:-translate-y-1 hover:border-white/25 transition-all duration-300`}>
        <div className="h-32 overflow-hidden relative"><img src={AREA_PHOTOS[cardIndex%AREA_PHOTOS.length]} alt="" className="w-full h-full object-cover opacity-65 group-hover:scale-105 transition-all duration-500" referrerPolicy="no-referrer"/><div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] via-transparent to-transparent"/><span className="absolute top-3 right-3 text-[11px] px-2.5 py-1 rounded-full bg-black/35 border border-white/10">{item.universities.length} faculdades</span></div>
        <div className="p-5"><div className="w-10 h-10 -mt-10 relative z-10 rounded-xl bg-[#10182a] border border-white/10 text-cyan-200 flex items-center justify-center mb-4"><BookOpen className="w-5 h-5"/></div><h3 className="font-black text-xl mb-1">{item.name}</h3><p className="text-sm text-cyan-200 mb-2 font-medium">{item.courses}</p><p className="text-sm text-ink-500 leading-relaxed min-h-[60px]">{item.description}</p><span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-ink-300 group-hover:text-white">Fazer match <ArrowRight className="w-4 h-4"/></span></div>
      </button>)}</div>
      {filtered.length===0&&<div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-ink-400">Nenhum curso encontrado com essa busca.</div>}
    </main>
  </div>;

  if (!dataReady) return <div className="min-h-screen bg-[#070b16] text-ink-50 flex items-center justify-center px-6"><div className="text-center max-w-md"><div className="w-12 h-12 mx-auto mb-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 flex items-center justify-center"><Database className="w-6 h-6 text-cyan-200"/></div><h2 className="text-2xl font-black mb-2">Carregando banco profissional</h2><p className="text-sm text-ink-400">Estamos conectando perguntas, pesos e os 24 indicadores de perfil de cada faculdade antes de iniciar o match.</p></div></div>;

  if (!area) return null;

  if (step === 'quiz') {
    const q = questions[index];
    if (!q) return null;
    const value = answers[q.id];
    const answered = value !== undefined;
    const progress = ((index+1)/questions.length)*100;
    return <div className="min-h-screen bg-[#070b16] text-ink-50 relative overflow-hidden">
      <header className="px-5 md:px-10 py-5 flex items-center justify-between"><button onClick={()=>{setStep('areas');setArea(null);}} className="inline-flex items-center gap-2 text-sm text-ink-300"><ArrowLeft className="w-4 h-4"/> Áreas</button><span className="text-xs font-bold text-cyan-200 rounded-full px-3 py-1.5 border border-cyan-300/15 bg-cyan-300/5">{area.name} · {learningStatus.active?'Adaptativo':'Calibrando'}</span><span className="text-xs text-ink-500">{index+1}/{questions.length}</span></header>
      <div className="h-1 bg-white/5"><div className="h-full bg-gradient-to-r from-cyan-300 to-brand-400 transition-all" style={{width:`${progress}%`}}/></div>
      <main className="max-w-2xl mx-auto px-5 py-16"><div className="inline-flex items-center gap-2 text-xs text-ink-500 mb-4"><Layers3 className="w-4 h-4 text-cyan-300"/> Questionário profissional · {area.courses}</div><h2 className="text-3xl md:text-5xl font-black tracking-[-.025em] leading-tight mb-10">{q.text}</h2><ContinuousPercentInput value={value} low={q.low} high={q.high} onChange={(next)=>setAnswers({...answers,[q.id]:next})}/>{!answered&&<p className="text-center text-xs text-cyan-200/75 mb-9">Escolha uma opção para continuar — nenhuma resposta é preenchida automaticamente.</p>}{answered&&<div className="mb-9"/>}<div className="flex gap-3"><button disabled={index===0} onClick={()=>setIndex(index-1)} className="px-5 py-3.5 rounded-xl border border-white/10 text-ink-300 disabled:opacity-30">Anterior</button><button disabled={!answered} onClick={()=>{if(!answered)return;if(index===questions.length-1){void recordAreaResponses(area,answers);setStep('results');trackEvent('area_questionnaire_completed',{area_id:area.id,questions:questions.length,adaptive:learningStatus.active,learned_dimensions:learningStatus.learnedDimensions});}else setIndex(index+1);}} className="flex-1 px-5 py-3.5 rounded-xl bg-gradient-to-r from-cyan-300 to-brand-400 text-[#06131c] font-black inline-flex items-center justify-center gap-2 disabled:opacity-35 disabled:cursor-not-allowed">{index===questions.length-1?'Ver análise completa':'Continuar'} <ArrowRight className="w-4 h-4"/></button></div></main>
    </div>;
  }

  return <CommercialAreaResults area={area} answers={answers} matches={matches} onBack={()=>setStep('areas')} onHome={onClose}/>;
}

function ContinuousPercentInput({ value, low, high, onChange }: { value: number | undefined; low: string; high: string; onChange: (value:number)=>void }) {
  const shown = value == null ? 50 : Math.max(0, Math.min(100, value));
  const commit = (next:number) => { if (Number.isFinite(next)) onChange(Math.max(0, Math.min(100, Number(next.toFixed(2))))); };
  return <div className="mb-9">
    <div className="flex items-center justify-center gap-3 mb-5">
      <input aria-label="Percentual exato" type="number" min={0} max={100} step={0.1} value={value ?? ''} placeholder="50" onChange={e=>{ if(e.target.value==='') return; commit(Number(e.target.value)); }} className="w-32 rounded-2xl border border-cyan-300/25 bg-cyan-300/[0.07] px-4 py-3 text-center text-2xl font-black text-cyan-100 outline-none focus:border-cyan-300/60"/>
      <span className="text-2xl font-black text-cyan-200">%</span>
    </div>
    <input aria-label="Escala contínua de 0 a 100" type="range" min={0} max={100} step={1} value={shown} onChange={e=>commit(Number(e.target.value))} className="w-full accent-cyan-300"/>
    <div className="flex justify-between text-[11px] text-ink-600 mt-2"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
    <div className="grid grid-cols-6 gap-2 mt-4">{[0,20,40,60,80,100].map(n=><button type="button" key={n} onClick={()=>commit(n)} className={`rounded-xl border py-2 text-xs font-bold transition-all ${value===n?'border-cyan-300/45 bg-cyan-300/15 text-cyan-100':'border-white/10 bg-white/[0.03] text-ink-500 hover:text-ink-200'}`}>{n}%</button>)}</div>
    <div className="flex justify-between gap-4 text-xs text-ink-500 mt-4"><span className="text-left max-w-[45%]">{low}</span><span className="text-right max-w-[45%]">{high}</span></div>
    <p className="text-center text-[11px] text-ink-600 mt-3">Use o campo para informar qualquer valor, inclusive decimal (ex.: 72,5).</p>
  </div>;
}