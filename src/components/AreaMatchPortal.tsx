import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Compass, Database, GraduationCap, Layers3, Search } from 'lucide-react';
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
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=78',
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
  const matches = useMemo(() => adaptiveArea ? calculateProfessionalMatches(adaptiveArea, answers) : [], [adaptiveArea, answers]);
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
    setArea(selected); setAnswers({}); setIndex(0); setCalibration({}); setQuestionOrder([]); setStep('quiz');
    trackEvent('area_selected', { area_id:selected.id, area_name:selected.name, courses:selected.courses });
  };

  if (step === 'areas') return <div className="min-h-screen bg-[#070b16] text-ink-50 relative overflow-hidden">
    <div className="fixed inset-0 pointer-events-none"><div className="absolute -left-36 top-20 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[140px]"/><div className="absolute -right-40 top-[35%] w-[520px] h-[520px] rounded-full bg-violet-500/10 blur-[150px]"/></div>
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070b16]/85 backdrop-blur-2xl px-5 md:px-10 py-4 flex items-center justify-between">
      <button onClick={onClose} className="inline-flex items-center gap-2 text-sm text-ink-300 hover:text-white"><ArrowLeft className="w-4 h-4"/> Voltar</button>
      <div className="flex items-center gap-2 font-extrabold"><div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-300 to-brand-500 flex items-center justify-center"><GraduationCap className="w-4 h-4 text-[#07101d]"/></div>Conecta<span className="text-cyan-300">ê</span></div>
      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-ink-500"><Database className="w-3.5 h-3.5"/>{dataReady?'Banco profissional ativo':'Carregando dados'}</span>
    </header>
    <main className="relative max-w-6xl mx-auto px-5 md:px-8 py-10 md:py-14">
      <section className="relative overflow-hidden rounded-[34px] border border-white/10 min-h-[350px] mb-10 shadow-2xl shadow-black/30">
        <img src={HERO} alt="Campus universitário" className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer"/>
        <div className="absolute inset-0 bg-gradient-to-r from-[#07101d] via-[#07101d]/90 to-[#07101d]/30"/>
        <div className="relative z-10 max-w-3xl p-7 md:p-11 min-h-[350px] flex flex-col justify-end">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-cyan-200 text-sm font-semibold mb-4"><Compass className="w-4 h-4"/> Já sabe seu curso?</span>
          <h1 className="text-4xl md:text-6xl font-black tracking-[-.035em] leading-[1.02] mb-4">Descubra onde você pode <span className="text-cyan-200">se encaixar melhor.</span></h1>
          <p className="text-ink-300 text-base md:text-lg max-w-2xl">Compare faculdades por fit, ambiente, carreira, qualidade disponível e confiança dos dados — sem transformar tudo em um ranking genérico.</p>
        </div>
      </section>
      <div className="grid sm:grid-cols-3 gap-3 mb-8">{[[String(areas.length),'cursos'],[String(totalOptions),'opções'],['24','dimensões por perfil']].map(([number,label],i)=><div key={label} className={`rounded-2xl border p-4 bg-gradient-to-br ${CARD_TONES[i]}`}><div className="text-2xl font-black">{number}</div><div className="text-xs uppercase tracking-[.13em] font-bold text-ink-500">{label}</div></div>)}</div>
      <div className="relative max-w-2xl mb-8"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-500"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar área ou curso..." className="w-full rounded-2xl border border-white/10 bg-white/[0.045] py-4 pl-12 pr-4 outline-none focus:border-cyan-300/40"/></div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">{filtered.map((item,cardIndex)=><button key={item.id} onClick={()=>selectArea(item)} className={`group relative overflow-hidden text-left rounded-[26px] border bg-gradient-to-br ${CARD_TONES[cardIndex % CARD_TONES.length]} hover:-translate-y-1.5 hover:border-white/25 transition-all duration-300`}>
        <div className="h-32 overflow-hidden relative"><img src={AREA_PHOTOS[cardIndex%AREA_PHOTOS.length]} alt="" className="w-full h-full object-cover opacity-65 group-hover:scale-105 transition-all duration-500" referrerPolicy="no-referrer"/><div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] via-transparent to-transparent"/><span className="absolute top-3 right-3 text-[11px] px-2.5 py-1 rounded-full bg-black/35 border border-white/10">{item.universities.length} faculdades</span></div>
        <div className="p-5"><div className="w-10 h-10 -mt-10 relative z-10 rounded-xl bg-[#10182a] border border-white/10 text-cyan-200 flex items-center justify-center mb-4"><BookOpen className="w-5 h-5"/></div><h3 className="font-black text-xl mb-1">{item.name}</h3><p className="text-sm text-cyan-200 mb-2 font-medium">{item.courses}</p><p className="text-sm text-ink-500 leading-relaxed min-h-[60px]">{item.description}</p><span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-ink-300 group-hover:text-white">Fazer match <ArrowRight className="w-4 h-4"/></span></div>
      </button>)}</div>
    </main>
  </div>;

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
      <main className="max-w-2xl mx-auto px-5 py-16"><div className="inline-flex items-center gap-2 text-xs text-ink-500 mb-4"><Layers3 className="w-4 h-4 text-cyan-300"/> Questionário profissional · {area.courses}</div><h2 className="text-3xl md:text-5xl font-black tracking-[-.025em] leading-tight mb-10">{q.text}</h2><div className="grid grid-cols-5 gap-2 md:gap-3 mb-3">{[1,2,3,4,5].map(n=><button key={n} onClick={()=>setAnswers({...answers,[q.id]:n})} className={`h-16 md:h-20 rounded-2xl border font-black text-xl transition-all ${value===n?'border-cyan-300/45 bg-cyan-300/15 text-cyan-100 scale-[1.03]':'border-white/10 bg-white/[0.035] text-ink-400'}`}>{n}</button>)}</div><div className="flex justify-between text-xs text-ink-500 mb-3"><span>{q.low}</span><span>{q.high}</span></div>{!answered&&<p className="text-center text-xs text-cyan-200/75 mb-9">Escolha uma opção para continuar — nenhuma resposta é preenchida automaticamente.</p>}{answered&&<div className="mb-9"/>}<div className="flex gap-3"><button disabled={index===0} onClick={()=>setIndex(index-1)} className="px-5 py-3.5 rounded-xl border border-white/10 text-ink-300 disabled:opacity-30">Anterior</button><button disabled={!answered} onClick={()=>{if(!answered)return;if(index===questions.length-1){void recordAreaResponses(area,answers);setStep('results');trackEvent('area_questionnaire_completed',{area_id:area.id,questions:questions.length,adaptive:learningStatus.active,learned_dimensions:learningStatus.learnedDimensions});}else setIndex(index+1);}} className="flex-1 px-5 py-3.5 rounded-xl bg-gradient-to-r from-cyan-300 to-brand-400 text-[#06131c] font-black inline-flex items-center justify-center gap-2 disabled:opacity-35 disabled:cursor-not-allowed">{index===questions.length-1?'Ver análise completa':'Continuar'} <ArrowRight className="w-4 h-4"/></button></div></main>
    </div>;
  }

  return <CommercialAreaResults area={area} answers={answers} matches={matches} onBack={()=>setStep('areas')} onHome={onClose}/>;
}
