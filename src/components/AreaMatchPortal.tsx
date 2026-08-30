import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Compass, GraduationCap, Search, Sparkles, Trophy, ShieldCheck, AlertTriangle, Database, BarChart3, Layers3 } from 'lucide-react';
import { ACADEMIC_AREAS, type AcademicArea } from '@/lib/area-match-data';
import { professionalQuestionsForArea } from '@/lib/professional-area-matching';
import { calculateProfessionalMatches, loadProfessionalAreas, type ProfessionalArea } from '@/lib/professional-area-match';

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
  'from-fuchsia-400/15 via-violet-500/10 to-transparent border-fuchsia-300/15',
  'from-amber-300/15 via-orange-500/10 to-transparent border-amber-300/15',
  'from-emerald-300/15 via-cyan-500/10 to-transparent border-emerald-300/15',
  'from-violet-300/15 via-indigo-500/10 to-transparent border-violet-300/15',
  'from-rose-300/15 via-fuchsia-500/10 to-transparent border-rose-300/15',
];

export default function AreaMatchPortal({ onClose, initialAreaId }: Props) {
  const [areas, setAreas] = useState<ProfessionalArea[]>(ACADEMIC_AREAS.map((a,index)=>({ ...a, dimensionWeights:{}, universities:a.universities.map((u,i)=>({...u,areaUniversityId:index*10+i,dataConfidence:40,evidenceCount:0})) })));
  const initialArea = areas.find((a) => a.id === initialAreaId) ?? null;
  const [step, setStep] = useState<Step>(initialAreaId ? 'quiz' : 'areas');
  const [area, setArea] = useState<ProfessionalArea | null>(initialArea);
  const [query, setQuery] = useState('');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [index, setIndex] = useState(0);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    let active = true;
    loadProfessionalAreas(ACADEMIC_AREAS).then((loaded) => {
      if (!active) return;
      setAreas(loaded);
      if (initialAreaId) setArea(loaded.find(a=>a.id===initialAreaId) ?? null);
      setDataReady(true);
    });
    return () => { active = false; };
  }, [initialAreaId]);

  const questions = area ? professionalQuestionsForArea(area as AcademicArea) : [];
  const matches = useMemo(() => area ? calculateProfessionalMatches(area, answers) : [], [area, answers]);
  const filtered = areas.filter((item) => `${item.name} ${item.courses}`.toLowerCase().includes(query.toLowerCase()));

  const selectArea = (selected: ProfessionalArea) => {
    setArea(selected); setAnswers({}); setIndex(0); setStep('quiz');
  };

  if (step === 'areas') return (
    <div className="min-h-screen bg-[#070b16] text-ink-50 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none"><div className="absolute -left-36 top-20 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[140px]"/><div className="absolute -right-40 top-[35%] w-[520px] h-[520px] rounded-full bg-fuchsia-500/10 blur-[150px]"/></div>
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#070b16]/85 backdrop-blur-2xl px-5 md:px-10 py-4 flex items-center justify-between">
        <button onClick={onClose} className="inline-flex items-center gap-2 text-sm text-ink-300 hover:text-white"><ArrowLeft className="w-4 h-4" /> Voltar</button>
        <div className="flex items-center gap-2 font-extrabold"><div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-300 to-violet-400 flex items-center justify-center"><GraduationCap className="w-4 h-4 text-[#07101d]"/></div>Conecta<span className="text-cyan-300">ê</span></div>
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-ink-500"><Database className="w-3.5 h-3.5"/>{dataReady?'Banco profissional ativo':'Carregando dados'}</span>
      </header>

      <main className="relative max-w-6xl mx-auto px-5 md:px-8 py-10 md:py-14">
        <section className="relative overflow-hidden rounded-[34px] border border-white/10 min-h-[350px] mb-10 shadow-2xl shadow-black/30">
          <img src={HERO} alt="Campus universitário" className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07101d] via-[#07101d]/88 to-[#07101d]/25" />
          <div className="relative z-10 max-w-3xl p-7 md:p-11 flex min-h-[350px] flex-col justify-end">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-cyan-200 text-sm font-semibold mb-4"><Compass className="w-4 h-4"/> Já sabe seu curso?</span>
            <h1 className="text-4xl md:text-6xl font-black tracking-[-.035em] leading-[1.02] mb-4">Descubra onde você pode <span className="bg-gradient-to-r from-cyan-300 to-fuchsia-300 bg-clip-text text-transparent">se encaixar melhor.</span></h1>
            <p className="text-ink-300 text-base md:text-lg max-w-2xl">Escolha sua área e compare faculdades pelo seu jeito de aprender, prioridades de carreira, ambiente e perfil acadêmico.</p>
          </div>
        </section>

        <div className="grid sm:grid-cols-3 gap-3 mb-8">
          {[['23','áreas'],['276','opções'],['24','dimensões por perfil']].map(([number,label],i)=><div key={label} className={`rounded-2xl border p-4 bg-gradient-to-br ${CARD_TONES[i]}`}><div className="text-2xl font-black">{number}</div><div className="text-xs uppercase tracking-[.13em] font-bold text-ink-500">{label}</div></div>)}
        </div>

        <div className="relative max-w-2xl mb-8"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-500"/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Buscar área ou curso..." className="w-full rounded-2xl border border-white/10 bg-white/[0.045] py-4 pl-12 pr-4 outline-none focus:border-cyan-300/40 focus:bg-white/[0.06] backdrop-blur"/></div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">{filtered.map((item, cardIndex) => <button key={item.id} onClick={() => selectArea(item)} className={`group relative overflow-hidden text-left rounded-[26px] border bg-gradient-to-br ${CARD_TONES[cardIndex % CARD_TONES.length]} hover:-translate-y-1.5 hover:border-white/25 transition-all duration-300 shadow-xl shadow-black/10`}>
          <div className="h-32 overflow-hidden relative"><img src={AREA_PHOTOS[cardIndex % AREA_PHOTOS.length]} alt="" className="w-full h-full object-cover opacity-65 group-hover:scale-105 group-hover:opacity-80 transition-all duration-500" referrerPolicy="no-referrer"/><div className="absolute inset-0 bg-gradient-to-t from-[#0b1120] via-transparent to-transparent"/><span className="absolute top-3 right-3 text-[11px] px-2.5 py-1 rounded-full bg-black/35 border border-white/10 text-white backdrop-blur">{item.universities.length} faculdades</span></div>
          <div className="p-5"><div className="w-10 h-10 -mt-10 relative z-10 rounded-xl bg-[#10182a] border border-white/10 text-cyan-200 flex items-center justify-center mb-4 shadow-xl"><BookOpen className="w-5 h-5"/></div><h3 className="font-black text-xl mb-1">{item.name}</h3><p className="text-sm text-cyan-200 mb-2 font-medium">{item.courses}</p><p className="text-sm text-ink-500 leading-relaxed min-h-[60px]">{item.description}</p><span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-ink-300 group-hover:text-white group-hover:gap-2.5 transition-all">Fazer match <ArrowRight className="w-4 h-4"/></span></div>
        </button>)}</div>
      </main>
    </div>
  );

  if (!area) return null;
  if (step === 'quiz') {
    const q = questions[index]; const value = answers[q.id] ?? 3; const progress = ((index + 1) / questions.length) * 100;
    return <div className="min-h-screen bg-[#070b16] text-ink-50 relative overflow-hidden"><div className="absolute -left-40 top-24 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[150px] pointer-events-none"/><header className="relative px-5 md:px-10 py-5 flex items-center justify-between"><button onClick={() => { setStep('areas'); setArea(null); }} className="inline-flex items-center gap-2 text-sm text-ink-300"><ArrowLeft className="w-4 h-4"/> Áreas</button><span className="text-xs font-bold text-cyan-200 rounded-full px-3 py-1.5 border border-cyan-300/15 bg-cyan-300/5">{area.name}</span><span className="text-xs text-ink-500">{index+1}/{questions.length}</span></header><div className="h-1 bg-white/5"><div className="h-full bg-gradient-to-r from-cyan-300 via-brand-400 to-fuchsia-300 transition-all" style={{width:`${progress}%`}}/></div><main className="relative max-w-2xl mx-auto px-5 py-16"><div className="inline-flex items-center gap-2 text-xs text-ink-500 mb-4"><Layers3 className="w-4 h-4 text-cyan-300"/> Questionário profissional · {area.courses}</div><h2 className="text-3xl md:text-5xl font-black tracking-[-.025em] leading-tight mb-10">{q.text}</h2><div className="grid grid-cols-5 gap-2 md:gap-3 mb-3">{[1,2,3,4,5].map((n) => <button key={n} onClick={()=>setAnswers({...answers,[q.id]:n})} className={`h-16 md:h-20 rounded-2xl border font-black text-xl transition-all ${value===n?'border-cyan-300/45 bg-gradient-to-br from-cyan-300/20 to-violet-400/10 text-cyan-100 shadow-lg shadow-cyan-950/20 scale-[1.03]':'border-white/10 bg-white/[0.035] text-ink-400 hover:border-white/20 hover:bg-white/[0.055]'}`}>{n}</button>)}</div><div className="flex justify-between text-xs text-ink-500 mb-12"><span>{q.low}</span><span>{q.high}</span></div><div className="flex gap-3"><button disabled={index===0} onClick={()=>setIndex(index-1)} className="px-5 py-3.5 rounded-xl border border-white/10 text-ink-300 disabled:opacity-30">Anterior</button><button onClick={() => { setAnswers({...answers,[q.id]:value}); if (index === questions.length - 1) setStep('results'); else setIndex(index+1); }} className="flex-1 px-5 py-3.5 rounded-xl bg-gradient-to-r from-cyan-300 to-brand-400 hover:brightness-110 text-[#06131c] font-black inline-flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/20">{index===questions.length-1?'Ver análise completa':'Continuar'} <ArrowRight className="w-4 h-4"/></button></div></main></div>;
  }

  return <div className="min-h-screen bg-[#070b16] text-ink-50"><header className="px-5 md:px-10 py-5 flex items-center justify-between border-b border-white/10 bg-[#070b16]/90 backdrop-blur"><button onClick={()=>setStep('areas')} className="inline-flex items-center gap-2 text-sm text-ink-300"><ArrowLeft className="w-4 h-4"/> Trocar área</button><div className="flex items-center gap-2 font-black"><GraduationCap className="w-5 h-5 text-cyan-300"/>Conecta<span className="text-cyan-300">ê</span></div><button onClick={onClose} className="text-sm text-ink-400">Início</button></header><main className="max-w-5xl mx-auto px-5 py-12"><div className="mb-10 rounded-[30px] border border-white/10 bg-gradient-to-br from-cyan-300/10 via-white/[0.03] to-fuchsia-300/10 p-7 md:p-9 relative overflow-hidden"><div className="absolute right-0 top-0 w-56 h-56 rounded-full bg-fuchsia-400/10 blur-3xl"/><div className="relative"><span className="inline-flex items-center gap-2 text-cyan-200 text-sm font-bold mb-3"><Sparkles className="w-4 h-4"/> Fit personalizado · {area.name}</span><h1 className="text-4xl md:text-5xl font-black tracking-[-.03em] mb-3">Onde você tende a se encaixar melhor</h1><p className="text-ink-400 max-w-3xl">Seu resultado combina perfil, pesos específicos da área e confiança dos dados. Quanto mais forte a evidência, mais confiável o ranking.</p></div></div><div className="space-y-4">{matches.map((m, idx) => <div key={m.university.id} className={`rounded-[24px] border p-5 md:p-6 transition-all ${idx===0?'border-cyan-300/35 bg-gradient-to-br from-cyan-300/10 via-brand-500/5 to-fuchsia-300/5 shadow-xl shadow-cyan-950/15':'border-white/10 bg-white/[0.035] hover:bg-white/[0.05]'}`}><div className="flex items-start gap-4"><div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black ${idx===0?'bg-gradient-to-br from-cyan-300 to-brand-400 text-[#06131c]':'bg-white/[0.06] text-ink-300'}`}>{idx+1}</div><div className="flex-1 min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-xl font-black">{m.university.name}</h3>{idx===0 && <span className="inline-flex items-center gap-1 text-xs font-black text-cyan-200"><Trophy className="w-3.5 h-3.5"/> MELHOR FIT</span>}<span className="inline-flex items-center gap-1 text-[11px] text-ink-500"><ShieldCheck className="w-3.5 h-3.5"/> confiança {m.confidence}%</span>{m.university.evidenceCount>0&&<span className="inline-flex items-center gap-1 text-[11px] text-ink-500"><Database className="w-3.5 h-3.5"/>{m.university.evidenceCount} evidências</span>}</div><p className="text-sm text-ink-500 mt-1">{m.university.course}{m.university.campus?` · ${m.university.campus}`:''}</p><div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">{[['Acadêmico',m.breakdown.academic],['Aprendizagem',m.breakdown.learning],['Ambiente',m.breakdown.environment],['Carreira',m.breakdown.career],['Global/impacto',m.breakdown.globalPurpose]].map(([label,score],scoreIndex)=><div key={label as string} className={`rounded-xl border border-white/8 p-3 ${scoreIndex===0?'bg-cyan-300/[0.055]':scoreIndex===1?'bg-violet-300/[0.055]':scoreIndex===2?'bg-fuchsia-300/[0.05]':scoreIndex===3?'bg-amber-300/[0.05]':'bg-emerald-300/[0.05]'}`}><div className="text-[11px] text-ink-500">{label}</div><div className="text-lg font-black text-ink-100">{score}%</div></div>)}</div><div className="mt-4 grid md:grid-cols-2 gap-3"><div className="rounded-xl border border-cyan-300/15 bg-cyan-300/[0.045] p-3"><div className="text-[11px] font-black uppercase tracking-wide text-cyan-200 mb-2">Por que combina</div>{m.strengths.map(s=><div key={s} className="text-sm text-ink-300 mb-1">✓ {s}</div>)}</div><div className="rounded-xl border border-amber-300/15 bg-amber-300/[0.04] p-3"><div className="text-[11px] font-black uppercase tracking-wide text-amber-200 mb-2">Pontos de atenção</div>{m.watchouts.map(s=><div key={s} className="text-sm text-ink-300 mb-1">• {s}</div>)}</div></div><div className="flex flex-wrap gap-2 mt-4">{m.university.cpc!=null&&<span className="text-xs px-2 py-1 rounded-full bg-white/[0.06] text-ink-300">CPC {m.university.cpc}</span>}{m.university.enade!=null&&<span className="text-xs px-2 py-1 rounded-full bg-white/[0.06] text-ink-300">Enade {m.university.enade}</span>}{m.university.idd!=null&&<span className="text-xs px-2 py-1 rounded-full bg-white/[0.06] text-ink-300">IDD {m.university.idd}</span>}{m.university.igc!=null&&<span className="text-xs px-2 py-1 rounded-full bg-white/[0.06] text-ink-300">IGC {m.university.igc}</span>}</div></div><div className="text-right"><div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-cyan-200 to-fuchsia-200 bg-clip-text text-transparent">{m.score}%</div><div className="text-[11px] text-ink-500">fit pessoal</div></div></div></div>)}</div><div className="mt-8 grid md:grid-cols-3 gap-4"><div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-sm text-ink-500 flex gap-3"><CheckCircle2 className="w-5 h-5 text-cyan-300 flex-shrink-0"/><span><strong className="text-ink-300">Transparência:</strong> fit não é ranking acadêmico nem chance de aprovação.</span></div><div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-sm text-ink-500 flex gap-3"><AlertTriangle className="w-5 h-5 text-amber-300 flex-shrink-0"/><span><strong className="text-ink-300">Confiança:</strong> baixa evidência reduz automaticamente o peso do perfil.</span></div><div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 text-sm text-ink-500 flex gap-3"><BarChart3 className="w-5 h-5 text-fuchsia-300 flex-shrink-0"/><span><strong className="text-ink-300">Metodologia:</strong> cinco pilares aparecem separados para evitar nota opaca.</span></div></div></main></div>;
}
