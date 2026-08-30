import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Compass, GraduationCap, Search, Sparkles, Trophy, ShieldCheck, AlertTriangle, Database, BarChart3 } from 'lucide-react';
import { ACADEMIC_AREAS, type AcademicArea } from '@/lib/area-match-data';
import { professionalQuestionsForArea } from '@/lib/professional-area-matching';
import { calculateProfessionalMatches, loadProfessionalAreas, type ProfessionalArea } from '@/lib/professional-area-match';

interface Props { onClose: () => void; initialAreaId?: string | null; }
type Step = 'areas' | 'quiz' | 'results';

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
    if (selected.name === 'Negócios e Gestão') {
      const url = new URL(window.location.href);
      url.searchParams.set('modo', 'business');
      window.location.href = url.toString();
      return;
    }
    setArea(selected); setAnswers({}); setIndex(0); setStep('quiz');
  };

  if (step === 'areas') return (
    <div className="min-h-screen bg-ink-950 text-ink-50">
      <header className="sticky top-0 z-20 border-b border-ink-800 bg-ink-950/95 backdrop-blur px-5 md:px-10 py-4 flex items-center justify-between">
        <button onClick={onClose} className="inline-flex items-center gap-2 text-sm text-ink-300 hover:text-white"><ArrowLeft className="w-4 h-4" /> Voltar</button>
        <div className="flex items-center gap-2 font-bold"><GraduationCap className="w-5 h-5 text-brand-400"/>Conecta<span className="text-brand-400">ê</span></div>
        <span className="inline-flex items-center gap-1 text-[11px] text-ink-500"><Database className="w-3.5 h-3.5"/>{dataReady?'Banco profissional ativo':'Carregando dados'}</span>
      </header>
      <main className="max-w-6xl mx-auto px-5 md:px-8 py-10 md:py-16">
        <div className="max-w-3xl mb-10"><span className="inline-flex items-center gap-2 text-brand-300 text-sm font-semibold mb-4"><Compass className="w-4 h-4"/> Já sabe seu curso?</span><h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">Descubra a faculdade com maior <span className="gradient-text">fit para você</span></h1><p className="text-ink-400 text-lg">Cada trilha usa fatores acadêmicos, de aprendizagem, ambiente, carreira e exposição global. Os perfis são carregados do banco e cada característica tem peso e nível de confiança próprios.</p></div>
        <div className="relative max-w-2xl mb-8"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ink-500"/><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Buscar área ou curso..." className="w-full rounded-2xl border border-ink-700 bg-ink-900 py-4 pl-12 pr-4 outline-none focus:border-brand-500"/></div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">{filtered.map((item) => <button key={item.id} onClick={() => selectArea(item)} className="group text-left rounded-2xl border border-ink-800 bg-ink-900/60 p-5 hover:border-brand-500/60 hover:bg-ink-900 transition-all"><div className="flex items-start justify-between gap-3"><div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-300 flex items-center justify-center"><BookOpen className="w-5 h-5"/></div><span className="text-xs px-2 py-1 rounded-full bg-ink-800 text-ink-400">{item.universities.length} faculdades</span></div><h3 className="font-bold text-lg mt-4 mb-1">{item.name}</h3><p className="text-sm text-brand-300 mb-2">{item.courses}</p><p className="text-sm text-ink-500 leading-relaxed">{item.description}</p><span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-ink-300 group-hover:text-brand-300">Fazer match <ArrowRight className="w-4 h-4"/></span></button>)}</div>
      </main>
    </div>
  );

  if (!area) return null;
  if (step === 'quiz') {
    const q = questions[index]; const value = answers[q.id] ?? 3; const progress = ((index + 1) / questions.length) * 100;
    return <div className="min-h-screen bg-ink-950 text-ink-50"><header className="px-5 md:px-10 py-5 flex items-center justify-between"><button onClick={() => { setStep('areas'); setArea(null); }} className="inline-flex items-center gap-2 text-sm text-ink-300"><ArrowLeft className="w-4 h-4"/> Áreas</button><span className="text-xs font-semibold text-brand-300">{area.name}</span><span className="text-xs text-ink-500">{index+1}/{questions.length}</span></header><div className="h-1 bg-ink-900"><div className="h-full bg-brand-500 transition-all" style={{width:`${progress}%`}}/></div><main className="max-w-2xl mx-auto px-5 py-16"><p className="text-sm text-ink-500 mb-3">Questionário profissional · {area.courses}</p><h2 className="text-3xl md:text-4xl font-bold leading-tight mb-10">{q.text}</h2><div className="grid grid-cols-5 gap-2 mb-3">{[1,2,3,4,5].map((n) => <button key={n} onClick={()=>setAnswers({...answers,[q.id]:n})} className={`h-16 rounded-xl border font-bold text-lg transition-all ${value===n?'border-brand-400 bg-brand-500/20 text-brand-200':'border-ink-700 bg-ink-900 text-ink-400 hover:border-ink-600'}`}>{n}</button>)}</div><div className="flex justify-between text-xs text-ink-500 mb-12"><span>{q.low}</span><span>{q.high}</span></div><div className="flex gap-3"><button disabled={index===0} onClick={()=>setIndex(index-1)} className="px-5 py-3 rounded-xl border border-ink-700 text-ink-300 disabled:opacity-30">Anterior</button><button onClick={() => { setAnswers({...answers,[q.id]:value}); if (index === questions.length - 1) setStep('results'); else setIndex(index+1); }} className="flex-1 px-5 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-ink-950 font-bold inline-flex items-center justify-center gap-2">{index===questions.length-1?'Ver análise completa':'Continuar'} <ArrowRight className="w-4 h-4"/></button></div></main></div>;
  }

  return <div className="min-h-screen bg-ink-950 text-ink-50"><header className="px-5 md:px-10 py-5 flex items-center justify-between border-b border-ink-800"><button onClick={()=>setStep('areas')} className="inline-flex items-center gap-2 text-sm text-ink-300"><ArrowLeft className="w-4 h-4"/> Trocar área</button><div className="flex items-center gap-2 font-bold"><GraduationCap className="w-5 h-5 text-brand-400"/>Conecta<span className="text-brand-400">ê</span></div><button onClick={onClose} className="text-sm text-ink-400">Início</button></header><main className="max-w-5xl mx-auto px-5 py-12"><div className="mb-10"><span className="inline-flex items-center gap-2 text-brand-300 text-sm font-semibold mb-3"><Sparkles className="w-4 h-4"/> Fit personalizado · {area.name}</span><h1 className="text-4xl md:text-5xl font-bold mb-3">Onde você tende a se encaixar melhor</h1><p className="text-ink-400 max-w-3xl">A nota considera seu perfil e os pesos específicos da área. Dados de menor confiança recebem penalização automática para evitar falsa precisão.</p></div><div className="space-y-4">{matches.map((m, idx) => <div key={m.university.id} className={`rounded-2xl border p-5 md:p-6 ${idx===0?'border-brand-400/60 bg-brand-500/10':'border-ink-800 bg-ink-900/60'}`}><div className="flex items-start gap-4"><div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black ${idx===0?'bg-brand-500 text-ink-950':'bg-ink-800 text-ink-300'}`}>{idx+1}</div><div className="flex-1 min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-xl font-bold">{m.university.name}</h3>{idx===0 && <span className="inline-flex items-center gap-1 text-xs font-bold text-brand-300"><Trophy className="w-3.5 h-3.5"/> MELHOR FIT</span>}<span className="inline-flex items-center gap-1 text-[11px] text-ink-500"><ShieldCheck className="w-3.5 h-3.5"/> confiança {m.confidence}%</span>{m.university.evidenceCount>0&&<span className="inline-flex items-center gap-1 text-[11px] text-ink-500"><Database className="w-3.5 h-3.5"/>{m.university.evidenceCount} evidências</span>}</div><p className="text-sm text-ink-500 mt-1">{m.university.course}{m.university.campus?` · ${m.university.campus}`:''}</p><div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">{[['Acadêmico',m.breakdown.academic],['Aprendizagem',m.breakdown.learning],['Ambiente',m.breakdown.environment],['Carreira',m.breakdown.career],['Global/impacto',m.breakdown.globalPurpose]].map(([label,score])=><div key={label as string} className="rounded-xl bg-ink-950/50 border border-ink-800 p-3"><div className="text-[11px] text-ink-500">{label}</div><div className="text-lg font-bold text-ink-200">{score}%</div></div>)}</div><div className="mt-4 grid md:grid-cols-2 gap-3"><div className="rounded-xl border border-brand-500/20 bg-brand-500/5 p-3"><div className="text-[11px] font-bold uppercase tracking-wide text-brand-300 mb-2">Por que combina</div>{m.strengths.map(s=><div key={s} className="text-sm text-ink-300 mb-1">✓ {s}</div>)}</div><div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3"><div className="text-[11px] font-bold uppercase tracking-wide text-amber-300 mb-2">Pontos de atenção</div>{m.watchouts.map(s=><div key={s} className="text-sm text-ink-300 mb-1">• {s}</div>)}</div></div><div className="flex flex-wrap gap-2 mt-4">{m.university.cpc!=null&&<span className="text-xs px-2 py-1 rounded-full bg-ink-800 text-ink-300">CPC {m.university.cpc}</span>}{m.university.enade!=null&&<span className="text-xs px-2 py-1 rounded-full bg-ink-800 text-ink-300">Enade {m.university.enade}</span>}{m.university.idd!=null&&<span className="text-xs px-2 py-1 rounded-full bg-ink-800 text-ink-300">IDD {m.university.idd}</span>}{m.university.igc!=null&&<span className="text-xs px-2 py-1 rounded-full bg-ink-800 text-ink-300">IGC {m.university.igc}</span>}</div></div><div className="text-right"><div className="text-3xl font-black text-brand-300">{m.score}%</div><div className="text-[11px] text-ink-500">fit pessoal</div></div></div></div>)}</div><div className="mt-8 grid md:grid-cols-2 gap-4"><div className="rounded-2xl border border-ink-800 bg-ink-900/50 p-5 text-sm text-ink-500 flex gap-3"><CheckCircle2 className="w-5 h-5 text-brand-400 flex-shrink-0"/><span><strong className="text-ink-300">Transparência:</strong> fit pessoal não é ranking acadêmico nem chance de aprovação. Indicadores regulatórios aparecem separados.</span></div><div className="rounded-2xl border border-ink-800 bg-ink-900/50 p-5 text-sm text-ink-500 flex gap-3"><AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0"/><span><strong className="text-ink-300">Confiança:</strong> perfis ainda sem evidência oficial suficiente são penalizados automaticamente e identificados no resultado.</span></div></div><div className="mt-4 rounded-2xl border border-ink-800 bg-ink-900/50 p-5 text-sm text-ink-500 flex gap-3"><BarChart3 className="w-5 h-5 text-accent-400 flex-shrink-0"/><span>A metodologia separa preferências acadêmicas, ambiente, aprendizagem, carreira e exposição global para evitar um percentual opaco.</span></div></main></div>;
}
