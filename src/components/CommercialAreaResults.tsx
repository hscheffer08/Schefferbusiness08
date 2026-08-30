import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, BookOpen, Check, ExternalLink, GraduationCap, Heart, Info, Scale, ShieldCheck, Sparkles, Target, X } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import type { ProfessionalArea, ProfessionalMatchResult, ProfessionalUniversity } from '@/lib/professional-area-match';

type Props = {
  area: ProfessionalArea;
  answers: Record<string, number>;
  matches: ProfessionalMatchResult[];
  onBack: () => void;
  onHome: () => void;
};

const PROFILE_LABELS: Record<string,string> = {
  rigor:'Rigor acadêmico', practical:'Aprendizagem prática', research:'Pesquisa', people:'Contato com pessoas', technology:'Tecnologia e dados', leadership:'Liderança', structure:'Estrutura', international:'Internacionalização', flexibility:'Flexibilidade', faculty:'Proximidade com professores', collaboration:'Colaboração', competition:'Competitividade', campus:'Vida universitária', career:'Carreira', entrepreneurship:'Empreendedorismo', impact:'Impacto social', quantitative:'Intensidade quantitativa', theory:'Base teórica'
};

function qualityScore(u: ProfessionalUniversity) {
  const values = [u.cpc,u.enade,u.idd,u.igc,u.cc].filter((v):v is number => typeof v === 'number' && Number.isFinite(v));
  if (!values.length) return null;
  const normalized = values.map(v => v <= 5 ? v * 20 : Math.min(100, v));
  return Math.round(normalized.reduce((a,b)=>a+b,0)/normalized.length);
}

function confidenceLabel(v:number) { return v >= 70 ? 'Alta' : v >= 50 ? 'Média' : 'Em verificação'; }

export default function CommercialAreaResults({ area, answers, matches, onBack, onHome }: Props) {
  const [shortlist, setShortlist] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('conectae_shortlist') || '[]'); } catch { return []; }
  });
  const [compare, setCompare] = useState<string[]>([]);
  const [detail, setDetail] = useState<ProfessionalMatchResult | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [showMethod, setShowMethod] = useState(false);
  const [minFit, setMinFit] = useState(0);
  const [onlyEvidence, setOnlyEvidence] = useState(false);

  useEffect(() => {
    const top = matches[0];
    trackEvent('area_match_completed', { area_id: area.id, area_name: area.name, top_university: top?.university.name, top_score: top?.score, result_count: matches.length });
  }, [area.id, area.name, matches]);

  const profile = useMemo(() => Object.entries(answers)
    .filter(([k]) => PROFILE_LABELS[k])
    .map(([k,v]) => ({ label: PROFILE_LABELS[k], value: v * 20 }))
    .sort((a,b)=>b.value-a.value), [answers]);

  const visibleMatches = matches.filter(m => m.score >= minFit && (!onlyEvidence || m.university.evidenceCount > 0));
  const top = matches[0];
  const topQuality = top ? qualityScore(top.university) : null;

  const toggleShortlist = (id:string, universityName:string) => {
    const next = shortlist.includes(id) ? shortlist.filter(x=>x!==id) : [...shortlist,id];
    setShortlist(next);
    try { localStorage.setItem('conectae_shortlist', JSON.stringify(next)); } catch {}
    trackEvent(next.includes(id) ? 'shortlist_added' : 'shortlist_removed', { area_id: area.id, university: universityName });
  };

  const toggleCompare = (id:string) => setCompare(prev => prev.includes(id) ? prev.filter(x=>x!==id) : prev.length < 4 ? [...prev,id] : prev);
  const selected = compare.map(id => matches.find(m=>m.university.id===id)).filter(Boolean) as ProfessionalMatchResult[];

  const registerInterest = (m:ProfessionalMatchResult) => {
    trackEvent('program_interest', { area_id: area.id, area_name: area.name, university: m.university.name, program: m.university.course, fit_score: m.score });
    toggleShortlist(m.university.id, m.university.name);
  };

  return <div className="min-h-screen bg-[#070b16] text-ink-50">
    <header className="sticky top-0 z-30 px-5 md:px-10 py-5 flex items-center justify-between border-b border-white/10 bg-[#070b16]/90 backdrop-blur-xl">
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-ink-300"><ArrowLeft className="w-4 h-4"/> Trocar área</button>
      <div className="flex items-center gap-2 font-black"><GraduationCap className="w-5 h-5 text-cyan-300"/>Conecta<span className="text-cyan-300">ê</span></div>
      <button onClick={onHome} className="text-sm text-ink-400">Início</button>
    </header>

    <main className="max-w-6xl mx-auto px-5 py-10 md:py-12">
      <section className="rounded-[32px] border border-white/10 bg-gradient-to-br from-cyan-300/10 via-white/[0.03] to-violet-300/10 p-7 md:p-9 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-7">
          <div><div className="text-sm font-bold text-cyan-200 mb-2 flex items-center gap-2"><Sparkles className="w-4 h-4"/> Seu diagnóstico · {area.name}</div><h1 className="text-4xl md:text-5xl font-black tracking-[-.03em] mb-3">Decisão, não só ranking.</h1><p className="text-ink-400 max-w-3xl">O Conectaê separa compatibilidade pessoal, qualidade oficial, viabilidade de admissão e dados de valor. Quando não há dado suficiente, mostramos isso em vez de inventar precisão.</p></div>
          <button onClick={()=>setShowMethod(true)} className="px-4 py-3 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-bold inline-flex items-center gap-2"><Info className="w-4 h-4"/> Como calculamos</button>
        </div>
      </section>

      {top && <section className="grid md:grid-cols-4 gap-3 mb-8">
        <DecisionCard label="Fit pessoal" value={`${top.score}%`} detail="Seu perfil vs. 24 dimensões" tone="cyan" />
        <DecisionCard label="Qualidade oficial" value={topQuality == null ? 'Em verificação' : `${topQuality}%`} detail={topQuality == null ? 'Sem indicadores suficientes' : 'CPC/Enade/IDD/IGC/CC disponíveis'} tone="violet" />
        <DecisionCard label="Admissão" value="Separada" detail="Não confundimos fit com chance de aprovação" tone="amber" />
        <DecisionCard label="Confiança dos dados" value={confidenceLabel(top.confidence)} detail={`${top.confidence}% de cobertura/confiança`} tone="emerald" />
      </section>}

      <section className="grid lg:grid-cols-[1fr_320px] gap-6 mb-8">
        <div className="rounded-[26px] border border-white/10 bg-white/[0.035] p-6">
          <div className="flex items-center gap-2 mb-5"><Target className="w-5 h-5 text-cyan-300"/><h2 className="font-black text-xl">Seu perfil universitário</h2></div>
          <div className="grid sm:grid-cols-2 gap-3">{profile.slice(0,10).map(item=><div key={item.label}><div className="flex justify-between text-xs mb-1"><span className="text-ink-400">{item.label}</span><span className="font-bold text-ink-200">{item.value}%</span></div><div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-brand-400" style={{width:`${item.value}%`}}/></div></div>)}</div>
        </div>
        <div className="rounded-[26px] border border-white/10 bg-white/[0.035] p-6">
          <h2 className="font-black mb-4">Refinar resultados</h2>
          <label className="block text-xs text-ink-500 mb-2">Fit mínimo: {minFit || 50}%</label><input type="range" min="0" max="95" step="5" value={minFit} onChange={e=>setMinFit(Number(e.target.value))} className="w-full mb-5"/>
          <label className="flex items-center gap-2 text-sm text-ink-300"><input type="checkbox" checked={onlyEvidence} onChange={e=>setOnlyEvidence(e.target.checked)}/> Priorizar opções com evidências</label>
          <button disabled={compare.length<2} onClick={()=>setShowCompare(true)} className="mt-5 w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/10 font-bold disabled:opacity-40 inline-flex justify-center items-center gap-2"><Scale className="w-4 h-4"/> Comparar {compare.length ? `(${compare.length})` : ''}</button>
        </div>
      </section>

      <div className="space-y-4">{visibleMatches.map((m,idx)=>{
        const q = qualityScore(m.university);
        const saved = shortlist.includes(m.university.id);
        const compared = compare.includes(m.university.id);
        return <article key={m.university.id} className={`rounded-[26px] border p-5 md:p-6 ${idx===0?'border-cyan-300/30 bg-cyan-300/[0.055]':'border-white/10 bg-white/[0.03]'}`}>
          <div className="flex flex-col md:flex-row gap-5">
            <div className="w-11 h-11 rounded-xl bg-white/[0.06] flex items-center justify-center font-black shrink-0">{idx+1}</div>
            <div className="flex-1 min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-xl font-black">{m.university.name}</h3><span className="text-[11px] px-2 py-1 rounded-full border border-white/10 text-ink-400">{confidenceLabel(m.confidence)} confiança</span></div><p className="text-sm text-ink-500 mt-1">{m.university.course}{m.university.campus?` · ${m.university.campus}`:''}</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">{[['Acadêmico',m.breakdown.academic],['Aprendizagem',m.breakdown.learning],['Ambiente',m.breakdown.environment],['Carreira',m.breakdown.career],['Global',m.breakdown.globalPurpose]].map(([label,score])=><div key={String(label)} className="rounded-xl border border-white/10 bg-white/[0.025] p-3"><div className="text-[10px] text-ink-500">{label}</div><div className="font-black">{score}%</div></div>)}</div>
              <div className="flex flex-wrap gap-2 mt-4">{m.strengths.map(s=><span key={s} className="text-xs px-2.5 py-1.5 rounded-full bg-cyan-300/[0.08] text-cyan-100">✓ {s}</span>)}</div>
              <div className="flex flex-wrap gap-2 mt-5">
                <button onClick={()=>setDetail(m)} className="px-3.5 py-2 rounded-xl border border-white/10 bg-white/[0.04] text-sm font-bold inline-flex items-center gap-2"><BookOpen className="w-4 h-4"/> Ver programa</button>
                <button onClick={()=>toggleShortlist(m.university.id,m.university.name)} className={`px-3.5 py-2 rounded-xl border text-sm font-bold inline-flex items-center gap-2 ${saved?'border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-100':'border-white/10 bg-white/[0.04]'}`}><Heart className="w-4 h-4"/> {saved?'Na minha lista':'Salvar'}</button>
                <button onClick={()=>toggleCompare(m.university.id)} className={`px-3.5 py-2 rounded-xl border text-sm font-bold inline-flex items-center gap-2 ${compared?'border-violet-300/30 bg-violet-300/10':'border-white/10 bg-white/[0.04]'}`}><Check className="w-4 h-4"/> Comparar</button>
                <button onClick={()=>registerInterest(m)} className="px-3.5 py-2 rounded-xl bg-cyan-300 text-[#06131c] text-sm font-black">Tenho interesse</button>
              </div>
            </div>
            <div className="md:text-right shrink-0"><div className="text-4xl font-black text-cyan-200">{m.score}%</div><div className="text-[11px] text-ink-500">fit pessoal</div>{q!=null&&<div className="text-xs text-violet-200 mt-2">qualidade {q}%</div>}</div>
          </div>
        </article>;
      })}</div>

      <section className="grid md:grid-cols-3 gap-4 mt-8"><InfoCard title="Fit ≠ qualidade">Compatibilidade pessoal não é ranking acadêmico.</InfoCard><InfoCard title="Fit ≠ aprovação">Não exibimos probabilidade falsa de admissão sem dados robustos.</InfoCard><InfoCard title="Dados rastreáveis">Confiança e evidências ficam separadas do score de fit.</InfoCard></section>
    </main>

    {detail && <Modal onClose={()=>setDetail(null)} title={detail.university.name}><ProgramDetail m={detail} onInterest={()=>registerInterest(detail)}/></Modal>}
    {showCompare && <Modal onClose={()=>setShowCompare(false)} title="Comparação lado a lado"><Comparison items={selected}/></Modal>}
    {showMethod && <Modal onClose={()=>setShowMethod(false)} title="Metodologia Conectaê"><Methodology/></Modal>}
  </div>;
}

function DecisionCard({label,value,detail,tone}:{label:string;value:string;detail:string;tone:string}){ const cls = tone==='cyan'?'text-cyan-200':tone==='violet'?'text-violet-200':tone==='amber'?'text-amber-200':'text-emerald-200'; return <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5"><div className="text-xs text-ink-500 mb-2">{label}</div><div className={`text-2xl font-black ${cls}`}>{value}</div><div className="text-xs text-ink-500 mt-2">{detail}</div></div> }
function InfoCard({title,children}:{title:string;children:React.ReactNode}){return <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><div className="font-black text-sm mb-2">{title}</div><div className="text-sm text-ink-500">{children}</div></div>}
function Modal({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}){return <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"><div className="max-w-5xl mx-auto my-8 rounded-[28px] border border-white/10 bg-[#0b1220] shadow-2xl"><div className="sticky top-0 flex items-center justify-between p-5 border-b border-white/10 bg-[#0b1220]/95 backdrop-blur"><h2 className="font-black text-xl">{title}</h2><button onClick={onClose} className="p-2 rounded-xl bg-white/[0.05]"><X className="w-4 h-4"/></button></div><div className="p-5 md:p-7">{children}</div></div></div>}
function ProgramDetail({m,onInterest}:{m:ProfessionalMatchResult;onInterest:()=>void}){const u=m.university; const sections=[['Currículo',u.curriculumSummary],['Pesquisa',u.researchSummary],['Carreira',u.careerSummary],['Internacional',u.internationalSummary],['Bolsas e valor',u.scholarshipsSummary],['Experiência estudantil',u.studentExperienceSummary]]; return <div><div className="grid md:grid-cols-4 gap-3 mb-6"><DecisionCard label="Fit" value={`${m.score}%`} detail="Compatibilidade pessoal" tone="cyan"/><DecisionCard label="Confiança" value={confidenceLabel(m.confidence)} detail={`${m.confidence}%`} tone="emerald"/><DecisionCard label="Evidências" value={String(u.evidenceCount)} detail="Registros associados" tone="violet"/><DecisionCard label="Qualidade" value={qualityScore(u)==null?'Em verificação':`${qualityScore(u)}%`} detail="Indicadores oficiais disponíveis" tone="amber"/></div>{u.highFit&&<div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.05] p-5 mb-5"><div className="text-xs font-black text-cyan-200 mb-2">PERFIL DE ALTA ADERÊNCIA</div><p className="text-sm text-ink-300">{u.highFit}</p></div>}<div className="grid md:grid-cols-2 gap-4">{sections.filter(([,v])=>Boolean(v)).map(([title,text])=><div key={String(title)} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"><h3 className="font-black mb-2">{title}</h3><p className="text-sm leading-relaxed text-ink-400">{text}</p></div>)}</div><div className="flex flex-wrap gap-3 mt-6"><button onClick={onInterest} className="px-4 py-3 rounded-xl bg-cyan-300 text-[#06131c] font-black">Tenho interesse</button>{u.officialCourseUrl&&<a href={u.officialCourseUrl} target="_blank" rel="noreferrer" className="px-4 py-3 rounded-xl border border-white/10 bg-white/[0.04] font-bold inline-flex items-center gap-2">Fonte oficial <ExternalLink className="w-4 h-4"/></a>}</div></div>}
function Comparison({items}:{items:ProfessionalMatchResult[]}){if(items.length<2)return <p className="text-ink-400">Selecione pelo menos duas faculdades.</p>; const rows=[['Fit', (m:ProfessionalMatchResult)=>`${m.score}%`],['Acadêmico',(m:ProfessionalMatchResult)=>`${m.breakdown.academic}%`],['Aprendizagem',(m:ProfessionalMatchResult)=>`${m.breakdown.learning}%`],['Ambiente',(m:ProfessionalMatchResult)=>`${m.breakdown.environment}%`],['Carreira',(m:ProfessionalMatchResult)=>`${m.breakdown.career}%`],['Global/impacto',(m:ProfessionalMatchResult)=>`${m.breakdown.globalPurpose}%`],['Confiança',(m:ProfessionalMatchResult)=>`${m.confidence}%`],['Qualidade oficial',(m:ProfessionalMatchResult)=>qualityScore(m.university)==null?'—':`${qualityScore(m.university)}%`]] as const; return <div className="overflow-x-auto"><table className="w-full min-w-[720px]"><thead><tr><th className="text-left p-3 text-ink-500">Critério</th>{items.map(m=><th key={m.university.id} className="text-left p-3">{m.university.name}</th>)}</tr></thead><tbody>{rows.map(([label,fn])=><tr key={label} className="border-t border-white/10"><td className="p-3 text-sm text-ink-500">{label}</td>{items.map(m=><td key={m.university.id} className="p-3 font-bold">{fn(m)}</td>)}</tr>)}</tbody></table></div>}
function Methodology(){return <div className="space-y-5 text-sm text-ink-300"><p>O match compara o perfil do aluno com perfis institucionais em 24 dimensões, usando pesos específicos por área. As dimensões cobrem rigor, flexibilidade, pesquisa, prática, tecnologia, colaboração, carreira, empreendedorismo, internacionalização e impacto.</p><div className="grid md:grid-cols-2 gap-4"><InfoCard title="Fit pessoal">Mede compatibilidade de preferências. Não é ranking de qualidade.</InfoCard><InfoCard title="Qualidade oficial">Usa indicadores regulatórios quando eles existem e estão associados ao curso/campus correto.</InfoCard><InfoCard title="Admissão">É tratada separadamente. Sem dados suficientes, não mostramos probabilidades inventadas.</InfoCard><InfoCard title="Confiança">Mostra quanto do perfil está apoiado por dados e evidências específicas.</InfoCard></div><p className="text-ink-500">O objetivo é ser explicável: resultados devem poder ser auditados, comparados e atualizados conforme novas evidências entram no banco.</p></div>}
