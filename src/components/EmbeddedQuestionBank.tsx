import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, Loader2, Search, X, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type ExamId='enem'|'cmmg'|'fuvest'|'insper'|'link';
type SourceFilter='all'|'official'|'official_adapted'|'authorial';
type Question={
  id:number;exam_id:ExamId;area:string;skill_name:string;difficulty:number;prompt:string;
  option_a:string|null;option_b:string|null;option_c:string|null;option_d:string|null;option_e:string|null;
  correct_option:string|null;explanation:string|null;source_kind:string|null;source_exam_year:number|null;
  source_question_number:number|null;source_exam_label:string|null;source_caderno:string|null;
  source_exam_url:string|null;source_answer_url:string|null;
};

const EXAMS:{id:ExamId;label:string;indexed:number}[]=[
  {id:'enem',label:'ENEM',indexed:1260},
  {id:'cmmg',label:'CMMG',indexed:600},
  {id:'fuvest',label:'FUVEST',indexed:270},
  {id:'insper',label:'Insper',indexed:0},
  {id:'link',label:'Link',indexed:0},
];
const SOURCE_LABEL:Record<string,string>={official:'Oficial',official_adapted:'Adaptada de prova real',authorial:'Estilo da prova'};

export default function EmbeddedQuestionBank({ onBack }: { onBack: () => void }) {
  const[loading,setLoading]=useState(true);
  const[questions,setQuestions]=useState<Question[]>([]);
  const[exam,setExam]=useState<ExamId>(()=>{
    const saved=localStorage.getItem('conectae:active-exam') as ExamId|null;
    return EXAMS.some(x=>x.id===saved)?saved!:'enem';
  });
  const[source,setSource]=useState<SourceFilter>('all');
  const[area,setArea]=useState('Todas');
  const[skill,setSkill]=useState('Todos');
  const[year,setYear]=useState('Todos');
  const[search,setSearch]=useState('');
  const[active,setActive]=useState<Question|null>(null);
  const[selected,setSelected]=useState('');
  const[result,setResult]=useState<boolean|null>(null);
  const[startedAt,setStartedAt]=useState<number|null>(null);

  useEffect(()=>{let alive=true;(async()=>{
    if(!supabase){setLoading(false);return}
    const{data}=await supabase.from('exam_practice_questions')
      .select('id,exam_id,area,skill_name,difficulty,prompt,option_a,option_b,option_c,option_d,option_e,correct_option,explanation,source_kind,source_exam_year,source_question_number,source_exam_label,source_caderno,source_exam_url,source_answer_url')
      .eq('active',true).range(0,1999);
    if(alive){setQuestions((data??[]) as Question[]);setLoading(false)}
  })();return()=>{alive=false}},[]);

  useEffect(()=>{setArea('Todas');setSkill('Todos');setYear('Todos');setSource('all');setSearch('');localStorage.setItem('conectae:active-exam',exam)},[exam]);
  useEffect(()=>{setSkill('Todos');setYear('Todos')},[area]);

  useEffect(()=>{
    const isOpen=Boolean(active);
    window.dispatchEvent(new CustomEvent('conectae:question-modal',{detail:{open:isOpen}}));
    document.body.style.overflow=isOpen?'hidden':'';
    return()=>{document.body.style.overflow='';window.dispatchEvent(new CustomEvent('conectae:question-modal',{detail:{open:false}}))};
  },[active]);

  const examRows=useMemo(()=>questions.filter(q=>q.exam_id===exam),[questions,exam]);
  const sourceCounts=useMemo(()=>({
    official:examRows.filter(q=>q.source_kind==='official').length,
    official_adapted:examRows.filter(q=>q.source_kind==='official_adapted').length,
    authorial:examRows.filter(q=>!q.source_kind||q.source_kind==='authorial').length,
  }),[examRows]);
  const areas=useMemo(()=>['Todas',...Array.from(new Set(examRows.map(q=>q.area))).sort()],[examRows]);
  const areaRows=useMemo(()=>area==='Todas'?examRows:examRows.filter(q=>q.area===area),[examRows,area]);
  const skills=useMemo(()=>['Todos',...Array.from(new Set(areaRows.map(q=>q.skill_name).filter(Boolean))).sort()],[areaRows]);
  const years=useMemo(()=>['Todos',...Array.from(new Set(areaRows.map(q=>q.source_exam_year).filter((x):x is number=>Number.isFinite(x)))).sort((a,b)=>b-a).map(String)],[areaRows]);
  const filtered=useMemo(()=>{
    const term=search.trim().toLowerCase();
    return examRows.filter(q=>{
      if(source!=='all'&&(source==='authorial'?(!q.source_kind||q.source_kind==='authorial'):q.source_kind===source)===false)return false;
      if(area!=='Todas'&&q.area!==area)return false;
      if(skill!=='Todos'&&q.skill_name!==skill)return false;
      if(year!=='Todos'&&String(q.source_exam_year)!==year)return false;
      if(term&&!`${q.area} ${q.skill_name} ${q.prompt}`.toLowerCase().includes(term))return false;
      return true;
    });
  },[examRows,source,area,skill,year,search]);
  const selectedExam=EXAMS.find(x=>x.id===exam)!;

  const openQuestion=(q:Question)=>{setActive(q);setSelected('');setResult(null);setStartedAt(Date.now())};
  const nextQuestion=()=>{if(!active)return;const pool=filtered.filter(q=>q.id!==active.id);if(!pool.length){setActive(null);return}openQuestion(pool[Math.floor(Math.random()*pool.length)])};
  const answer=async()=>{
    if(!active||!selected||result!==null)return;
    const ok=selected===active.correct_option;setResult(ok);
    try{
      if(!supabase)return;const{data}=await supabase.auth.getUser();if(!data.user)return;
      await supabase.from('student_practice_attempts').insert({user_id:data.user.id,exam_id:active.exam_id,question_id:active.id,area:active.area,skill_name:active.skill_name,selected_option:selected,correct:ok,duration_seconds:startedAt?Math.max(1,Math.round((Date.now()-startedAt)/1000)):null});
    }catch{/* correção local continua disponível */}
  };

  if(loading)return <div className="grid min-h-[280px] place-items-center rounded-2xl border border-[#173765] bg-[#06152f]"><div className="flex items-center gap-2 text-sm font-bold text-[#9fb5d4]"><Loader2 size={17} className="animate-spin"/>Carregando questões…</div></div>;

  return <section className="pb-4">
    <div className="mb-4 flex items-start justify-between gap-3">
      <div><div className="text-[11px] font-extrabold uppercase tracking-[.1em] text-[#72a5ff]">Banco de questões</div><h1 className="mt-1 text-2xl font-extrabold tracking-[-.035em] md:text-3xl">Escolha a prova que você quer treinar.</h1><p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#93a9c9]">Questões são separadas pela origem. Nunca tratamos uma questão autoral como oficial.</p></div>
    </div>

    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {EXAMS.map(x=><button key={x.id} type="button" onClick={()=>setExam(x.id)} className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-extrabold ${exam===x.id?'border-[#3479ff] bg-[#246cff] text-white':'border-[#234576] bg-[#071a38] text-[#a9bddc]'}`}>{x.label}</button>)}
    </div>

    <div className="mt-3 rounded-2xl border border-[#173765] bg-[#06152f] p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-xl font-extrabold">{selectedExam.label}</div><div className="mt-1 text-xs text-[#8fa7c9]">{examRows.length} questões resolvíveis no Curso{selectedExam.indexed>0?` · ${selectedExam.indexed.toLocaleString('pt-BR')} referências oficiais indexadas`:''}</div></div></div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <button type="button" onClick={()=>setSource(source==='official'?'all':'official')} className={`rounded-xl border p-2.5 ${source==='official'?'border-emerald-400/60 bg-emerald-400/10':'border-[#1b3b69] bg-[#081a38]'}`}><strong className="block text-lg">{sourceCounts.official}</strong><span className="text-[10px] text-[#9fb5d4]">Oficiais</span></button>
        <button type="button" onClick={()=>setSource(source==='official_adapted'?'all':'official_adapted')} className={`rounded-xl border p-2.5 ${source==='official_adapted'?'border-[#4b8cff] bg-[#246cff]/10':'border-[#1b3b69] bg-[#081a38]'}`}><strong className="block text-lg">{sourceCounts.official_adapted}</strong><span className="text-[10px] text-[#9fb5d4]">De prova real</span></button>
        <button type="button" onClick={()=>setSource(source==='authorial'?'all':'authorial')} className={`rounded-xl border p-2.5 ${source==='authorial'?'border-[#4b8cff] bg-[#246cff]/10':'border-[#1b3b69] bg-[#081a38]'}`}><strong className="block text-lg">{sourceCounts.authorial}</strong><span className="text-[10px] text-[#9fb5d4]">Estilo da prova</span></button>
      </div>
    </div>

    <div className="mt-3 grid gap-2 md:grid-cols-4">
      <label className="relative md:col-span-2"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6f8ebc]" size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar conteúdo ou palavra-chave" className="h-11 w-full rounded-xl border border-[#234576] bg-[#071a38] pl-10 pr-3 text-sm text-white outline-none placeholder:text-[#6680a5]"/></label>
      {[{value:area,set:setArea,options:areas,label:'Matéria'},{value:skill,set:setSkill,options:skills,label:'Conteúdo'}].map((f,i)=><label key={i} className="relative"><span className="sr-only">{f.label}</span><select value={f.value} onChange={e=>f.set(e.target.value)} className="h-11 w-full appearance-none rounded-xl border border-[#234576] bg-[#071a38] px-3 pr-8 text-xs font-bold text-white outline-none"><option disabled value="">{f.label}</option>{f.options.map(o=><option key={o} value={o}>{o}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6f8ebc]" size={15}/></label>)}
    </div>
    {years.length>1&&<div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{years.map(y=><button type="button" key={y} onClick={()=>setYear(y)} className={`shrink-0 rounded-lg border px-3 py-1.5 text-[11px] font-bold ${year===y?'border-[#3479ff] bg-[#123a78] text-white':'border-[#203d67] bg-[#071a38] text-[#8fa7c9]'}`}>{y==='Todos'?'Todos os anos':y}</button>)}</div>}

    <div className="mt-4 flex items-center justify-between gap-3"><div className="text-xs font-bold text-[#8fa7c9]">{filtered.length} {filtered.length===1?'questão':'questões'} encontradas</div>{source!=='all'&&<button type="button" onClick={()=>setSource('all')} className="text-xs font-bold text-[#72a5ff]">Limpar origem</button>}</div>

    <div className="mt-3 grid gap-2.5 md:grid-cols-2">
      {filtered.slice(0,80).map(q=>{
        const provenance=SOURCE_LABEL[q.source_kind||'authorial']||'Estilo da prova';
        return <button type="button" key={q.id} onClick={()=>openQuestion(q)} className="rounded-2xl border border-[#183965] bg-[#06152f] p-4 text-left transition hover:border-[#3479ff]">
          <div className="flex items-center justify-between gap-2"><span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wide ${q.source_kind==='official'?'bg-emerald-300/10 text-emerald-200':q.source_kind==='official_adapted'?'bg-blue-300/10 text-blue-200':'bg-[#10294f] text-[#9fb5d4]'}`}>{provenance}</span><span className="text-[10px] text-[#708bb3]">nível {q.difficulty}/5</span></div>
          <div className="mt-3 text-[11px] font-bold text-[#72a5ff]">{selectedExam.label}{q.source_exam_year?` ${q.source_exam_year}`:''}{q.source_question_number?` · Q${q.source_question_number}`:''} · {q.area}</div>
          <strong className="mt-1.5 block text-sm leading-snug text-white">{q.skill_name}</strong>
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#8fa7c9]">{q.prompt}</p>
        </button>;
      })}
    </div>
    {!filtered.length&&<div className="mt-4 rounded-2xl border border-[#173765] bg-[#06152f] p-5 text-sm text-[#9fb5d4]">Não há questões resolvíveis com esses filtros ainda. Tente outra origem, matéria ou conteúdo.</div>}
    {filtered.length>80&&<div className="mt-3 text-center text-xs text-[#718aaf]">Mostrando 80 resultados. Use os filtros para encontrar o conteúdo exato.</div>}

    {active&&<div className="fixed inset-0 z-[200] overflow-y-auto bg-[#020817] text-white" role="dialog" aria-modal="true" aria-label="Resolver questão">
      <div className="mx-auto min-h-full w-full max-w-3xl px-4 pb-[calc(env(safe-area-inset-bottom)+28px)] pt-[max(14px,env(safe-area-inset-top))] md:px-6">
        <div className="sticky top-0 z-10 -mx-1 flex items-center justify-between gap-3 border-b border-[#173765] bg-[#020817]/96 px-1 py-3 backdrop-blur-xl"><div className="min-w-0"><div className="truncate text-[11px] font-bold text-[#72a5ff]">{EXAMS.find(x=>x.id===active.exam_id)?.label}{active.source_exam_year?` ${active.source_exam_year}`:''}{active.source_question_number?` · Q${active.source_question_number}`:''}</div><div className="truncate text-xs text-[#8fa7c9]">{active.area} · {active.skill_name}</div></div><button type="button" onClick={()=>setActive(null)} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#234576] bg-[#071a38]" aria-label="Fechar questão"><X size={20}/></button></div>
        <div className="py-5"><span className="inline-flex rounded-full bg-[#0c2a58] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#9fc1ff]">{SOURCE_LABEL[active.source_kind||'authorial']||'Estilo da prova'}</span><h2 className="mt-4 text-xl font-extrabold leading-relaxed md:text-2xl">{active.prompt}</h2>
          <div className="mt-5 space-y-2">{(['A','B','C','D','E'] as const).map(letter=>{const value=active[`option_${letter.toLowerCase()}` as keyof Question] as string|null;if(!value)return null;const chosen=selected===letter;return <button type="button" key={letter} disabled={result!==null} onClick={()=>setSelected(letter)} className={`flex min-h-14 w-full items-start gap-3 rounded-2xl border p-4 text-left ${chosen?'border-[#3479ff] bg-[#0c3574]':'border-[#234576] bg-[#071a38]'} disabled:cursor-default`}><strong className="w-6 shrink-0 text-lg">{letter}</strong><span className="pt-0.5 text-base leading-relaxed">{value}</span></button>})}</div>
          {result===null?<button type="button" disabled={!selected} onClick={answer} className="mt-5 min-h-12 w-full rounded-xl bg-[#246cff] px-4 text-sm font-extrabold disabled:opacity-40">Responder e corrigir</button>:<div className={`mt-5 rounded-2xl border p-4 ${result?'border-emerald-400/30 bg-emerald-400/10':'border-rose-400/30 bg-rose-400/10'}`}><div className="flex items-center gap-2 font-extrabold">{result?<CheckCircle2 size={18}/>:<XCircle size={18}/>} {result?'Acertou.':'Ainda não.'}</div><div className="mt-2 text-sm">Gabarito: <b>{active.correct_option}</b></div>{active.explanation&&<p className="mt-2 text-sm leading-relaxed text-[#c0d0e5]">{active.explanation}</p>}</div>}
          <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={()=>setActive(null)} className="min-h-12 rounded-xl border border-[#234576] bg-[#071a38] text-sm font-bold">Encerrar</button><button type="button" onClick={nextQuestion} className="min-h-12 rounded-xl border border-[#3479ff] bg-[#123a78] text-sm font-bold">Próxima questão</button></div>
          {(active.source_exam_url||active.source_answer_url)&&<div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-[#72a5ff]">{active.source_exam_url&&<a href={active.source_exam_url} target="_blank" rel="noreferrer">Ver prova-fonte</a>}{active.source_answer_url&&<a href={active.source_answer_url} target="_blank" rel="noreferrer">Ver gabarito-fonte</a>}</div>}
        </div>
      </div>
    </div>}
  </section>;
}
