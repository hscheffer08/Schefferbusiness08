import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, ExternalLink, Loader2, Search, X, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type ExamId='enem'|'cmmg'|'fuvest'|'insper'|'link';
type Mode='official'|'adapted'|'authorial';
type Question={
  id:number; exam_id:ExamId; area:string; skill_name:string; difficulty:number; prompt:string;
  option_a:string|null; option_b:string|null; option_c:string|null; option_d:string|null; option_e:string|null;
  correct_option:string|null; explanation:string|null; source_kind:string|null; source_exam_year:number|null;
  source_question_number:number|null; source_exam_label:string|null; source_exam_url:string|null; source_answer_url:string|null;
};

const EXAMS:{id:ExamId;label:string;indexed:number}[]=[
  {id:'enem',label:'ENEM',indexed:1260},{id:'cmmg',label:'CMMG',indexed:600},{id:'fuvest',label:'FUVEST',indexed:270},{id:'insper',label:'Insper',indexed:0},{id:'link',label:'Link',indexed:0},
];

const modeFor=(exam:ExamId,rows:Question[]):Mode=>rows.some(q=>q.exam_id===exam&&q.source_kind==='official')?'official':rows.some(q=>q.exam_id===exam&&q.source_kind==='official_adapted')?'adapted':'authorial';

export default function OfficialQuestionWorkspace(){
  const[exam,setExam]=useState<ExamId>(()=>{const s=localStorage.getItem('conectae:active-exam') as ExamId|null;return EXAMS.some(x=>x.id===s)?s!:'enem'});
  const[questions,setQuestions]=useState<Question[]>([]);
  const[mode,setMode]=useState<Mode>('official');
  const[loading,setLoading]=useState(true);
  const[area,setArea]=useState('Todas'); const[skill,setSkill]=useState('Todos'); const[year,setYear]=useState('Todos'); const[search,setSearch]=useState('');
  const[active,setActive]=useState<Question|null>(null); const[selected,setSelected]=useState(''); const[result,setResult]=useState<boolean|null>(null);

  useEffect(()=>{let alive=true;(async()=>{if(!supabase){setLoading(false);return}const{data}=await supabase.from('exam_practice_questions').select('id,exam_id,area,skill_name,difficulty,prompt,option_a,option_b,option_c,option_d,option_e,correct_option,explanation,source_kind,source_exam_year,source_question_number,source_exam_label,source_exam_url,source_answer_url').eq('active',true).range(0,1999);if(alive){const rows=(data??[]) as Question[];setQuestions(rows);setMode(modeFor(exam,rows));setLoading(false)}})();return()=>{alive=false}},[]);
  useEffect(()=>{localStorage.setItem('conectae:active-exam',exam);setArea('Todas');setSkill('Todos');setYear('Todos');setSearch('');setMode(modeFor(exam,questions))},[exam,questions]);
  useEffect(()=>{setSkill('Todos');setYear('Todos')},[area]);
  useEffect(()=>{const open=Boolean(active);window.dispatchEvent(new CustomEvent('conectae:question-modal',{detail:{open}}));document.body.style.overflow=open?'hidden':'';return()=>{document.body.style.overflow='';window.dispatchEvent(new CustomEvent('conectae:question-modal',{detail:{open:false}}))}},[active]);

  const examRows=useMemo(()=>questions.filter(q=>q.exam_id===exam),[questions,exam]);
  const officialRows=useMemo(()=>examRows.filter(q=>q.source_kind==='official'),[examRows]);
  const adaptedRows=useMemo(()=>examRows.filter(q=>q.source_kind==='official_adapted'),[examRows]);
  const authorialRows=useMemo(()=>examRows.filter(q=>!q.source_kind||q.source_kind==='authorial'),[examRows]);
  const rows=mode==='official'?officialRows:mode==='adapted'?adaptedRows:authorialRows;
  const areas=useMemo(()=>['Todas',...Array.from(new Set(rows.map(q=>q.area).filter(Boolean))).sort()],[rows]);
  const areaRows=useMemo(()=>area==='Todas'?rows:rows.filter(q=>q.area===area),[rows,area]);
  const skills=useMemo(()=>['Todos',...Array.from(new Set(areaRows.map(q=>q.skill_name).filter(Boolean))).sort()],[areaRows]);
  const years=useMemo(()=>['Todos',...Array.from(new Set(rows.map(q=>q.source_exam_year).filter((x):x is number=>Number.isFinite(x)))).sort((a,b)=>b-a).map(String)],[rows]);
  const filtered=useMemo(()=>{const term=search.trim().toLowerCase();return rows.filter(q=>{if(area!=='Todas'&&q.area!==area)return false;if(skill!=='Todos'&&q.skill_name!==skill)return false;if(year!=='Todos'&&String(q.source_exam_year)!==year)return false;if(term&&!`${q.area} ${q.skill_name} ${q.prompt} ${q.source_question_number??''}`.toLowerCase().includes(term))return false;return true})},[rows,area,skill,year,search]);
  const selectedExam=EXAMS.find(x=>x.id===exam)!;

  const openQuestion=(q:Question)=>{setActive(q);setSelected('');setResult(null)};
  const answer=()=>{if(!active||!selected||result!==null)return;setResult(selected===active.correct_option)};
  const next=()=>{if(!active)return;const pool=filtered.filter(q=>q.id!==active.id);if(!pool.length){setActive(null);return}openQuestion(pool[Math.floor(Math.random()*pool.length)])};

  if(loading)return <div className="grid min-h-[260px] place-items-center rounded-2xl border border-[#173765] bg-[#06152f]"><div className="flex items-center gap-2 text-sm font-bold text-[#9fb5d4]"><Loader2 size={17} className="animate-spin"/>Carregando questões…</div></div>;

  return <section className="pb-8">
    <div className="mb-4"><div className="text-[11px] font-extrabold uppercase tracking-[.1em] text-[#72a5ff]">Banco de questões</div><h1 className="mt-1 text-2xl font-extrabold tracking-[-.035em] md:text-3xl">Resolva aqui. Veja a resposta só depois.</h1><p className="mt-2 max-w-2xl text-sm text-[#93a9c9]">Questões oficiais só aparecem nesta aba quando o enunciado e as alternativas estão completos no Curso. Referências sem questão completa não entram mais como treino.</p></div>

    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{EXAMS.map(x=><button key={x.id} type="button" onClick={()=>setExam(x.id)} className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-extrabold ${exam===x.id?'border-[#3479ff] bg-[#246cff] text-white':'border-[#234576] bg-[#071a38] text-[#a9bddc]'}`}>{x.label}</button>)}</div>

    <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl border border-[#173765] bg-[#06152f] p-2">
      <button type="button" onClick={()=>setMode('official')} className={`rounded-xl px-2 py-3 text-xs font-extrabold ${mode==='official'?'bg-emerald-500/15 text-emerald-200':'text-[#9fb5d4]'}`}>Oficiais <span className="block text-lg">{officialRows.length}</span></button>
      <button type="button" onClick={()=>setMode('adapted')} className={`rounded-xl px-2 py-3 text-xs font-extrabold ${mode==='adapted'?'bg-[#0b2856] text-white':'text-[#9fb5d4]'}`}>Adaptadas <span className="block text-lg">{adaptedRows.length}</span></button>
      <button type="button" onClick={()=>setMode('authorial')} className={`rounded-xl px-2 py-3 text-xs font-extrabold ${mode==='authorial'?'bg-[#0b2856] text-white':'text-[#9fb5d4]'}`}>Estilo da prova <span className="block text-lg">{authorialRows.length}</span></button>
    </div>

    {mode==='official'&&<div className="mt-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/[.05] p-4"><div className="font-extrabold">{selectedExam.label} · oficiais interativas</div><p className="mt-1 text-xs leading-relaxed text-[#9fb5d4]">{officialRows.length?`${officialRows.length} questões oficiais completas prontas para resolver aqui.`:`Ainda não há questões oficiais completas desse exame no treino. Existem ${selectedExam.indexed.toLocaleString('pt-BR')} referências oficiais indexadas, mas elas não serão mostradas como questão até terem enunciado e alternativas completos.`}</p></div>}

    <div className="mt-3 grid gap-2 md:grid-cols-4"><label className="relative md:col-span-2"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6f8ebc]" size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar conteúdo, palavra ou número" className="h-11 w-full rounded-xl border border-[#234576] bg-[#071a38] pl-10 pr-3 text-sm text-white outline-none placeholder:text-[#6680a5]"/></label>{[{value:area,set:setArea,options:areas},{value:skill,set:setSkill,options:skills}].map((f,i)=><label key={i} className="relative"><select value={f.value} onChange={e=>f.set(e.target.value)} className="h-11 w-full appearance-none rounded-xl border border-[#234576] bg-[#071a38] px-3 pr-8 text-xs font-bold text-white outline-none">{f.options.map(o=><option key={o} value={o}>{o}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6f8ebc]" size={15}/></label>)}</div>
    {years.length>1&&<div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{years.map(y=><button type="button" key={y} onClick={()=>setYear(y)} className={`shrink-0 rounded-lg border px-3 py-1.5 text-[11px] font-bold ${year===y?'border-[#3479ff] bg-[#123a78] text-white':'border-[#203d67] bg-[#071a38] text-[#8fa7c9]'}`}>{y==='Todos'?'Todos os anos':y}</button>)}</div>}

    <div className="mt-4 text-xs font-bold text-[#8fa7c9]">{filtered.length} {filtered.length===1?'questão encontrada':'questões encontradas'}</div>
    <div className="mt-3 grid gap-2.5 md:grid-cols-2">{filtered.slice(0,100).map(q=><button type="button" key={q.id} onClick={()=>openQuestion(q)} className={`rounded-2xl border bg-[#06152f] p-4 text-left transition hover:border-[#3479ff] ${q.source_kind==='official'?'border-emerald-400/25':'border-[#183965]'}`}><div className="flex items-center justify-between gap-2"><span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wide ${q.source_kind==='official'?'bg-emerald-300/10 text-emerald-200':q.source_kind==='official_adapted'?'bg-blue-300/10 text-blue-200':'bg-[#10294f] text-[#9fb5d4]'}`}>{q.source_kind==='official'?'Oficial':q.source_kind==='official_adapted'?'Adaptada de prova real':'Estilo da prova'}</span><span className="text-[10px] text-[#708bb3]">nível {q.difficulty}/5</span></div><div className="mt-3 text-[11px] font-bold text-[#72a5ff]">{selectedExam.label}{q.source_exam_year?` ${q.source_exam_year}`:''}{q.source_question_number?` · Q${q.source_question_number}`:''} · {q.area}</div><strong className="mt-1.5 block text-sm text-white">{q.skill_name}</strong><p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#8fa7c9]">{q.prompt}</p></button>)}</div>

    {!filtered.length&&<div className="mt-4 rounded-2xl border border-[#173765] bg-[#06152f] p-5 text-sm text-[#9fb5d4]">{mode==='official'?'Nenhuma questão oficial completa disponível aqui ainda. Use Adaptadas para treinar agora sem perder a origem da prova.':'Nenhuma questão com esses filtros.'}</div>}

    {active&&<div className="fixed inset-0 z-[220] overflow-y-auto bg-[#020817] text-white" role="dialog" aria-modal="true" aria-label="Resolver questão"><div className="mx-auto min-h-full w-full max-w-3xl px-4 pb-[calc(env(safe-area-inset-bottom)+28px)] pt-[max(12px,env(safe-area-inset-top))] md:px-6"><div className="sticky top-0 z-10 -mx-1 flex items-center justify-between gap-3 border-b border-[#173765] bg-[#020817]/97 px-1 py-3 backdrop-blur-xl"><div className="min-w-0"><div className={`text-[11px] font-black uppercase tracking-wide ${active.source_kind==='official'?'text-emerald-200':'text-[#72a5ff]'}`}>{active.source_kind==='official'?'Questão oficial':active.source_kind==='official_adapted'?'Adaptada de prova real':'Estilo da prova'}</div><div className="truncate text-sm font-extrabold">{selectedExam.label}{active.source_exam_year?` ${active.source_exam_year}`:''}{active.source_question_number?` · Questão ${active.source_question_number}`:''}</div></div><button type="button" onClick={()=>setActive(null)} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#234576] bg-[#071a38]" aria-label="Fechar"><X size={20}/></button></div>

      <div className="py-5"><div className="text-xs font-bold text-[#72a5ff]">{active.area} · {active.skill_name}</div><h2 className="mt-3 whitespace-pre-line text-lg font-extrabold leading-relaxed md:text-xl">{active.prompt}</h2><div className="mt-5 grid gap-2.5">{(['A','B','C','D','E'] as const).map(letter=>{const text=active[`option_${letter.toLowerCase()}` as keyof Question] as string|null;if(!text)return null;const chosen=selected===letter;const correct=result!==null&&letter===active.correct_option;const wrong=result===false&&chosen;return <button type="button" key={letter} disabled={result!==null} onClick={()=>setSelected(letter)} className={`flex min-h-14 items-start gap-3 rounded-xl border px-4 py-3 text-left ${correct?'border-emerald-400 bg-emerald-400/10':wrong?'border-rose-400 bg-rose-400/10':chosen?'border-[#3479ff] bg-[#123a78]':'border-[#234576] bg-[#071a38]'}`}><strong>{letter}</strong><span className="text-sm leading-relaxed">{text}</span></button>})}</div>

      {result===null?<button type="button" disabled={!selected} onClick={answer} className="mt-5 min-h-12 w-full rounded-xl bg-[#246cff] px-4 text-sm font-extrabold disabled:opacity-40">Confirmar resposta</button>:<div className={`mt-5 rounded-2xl border p-4 ${result?'border-emerald-400/30 bg-emerald-400/[.07]':'border-rose-400/30 bg-rose-400/[.07]'}`}><div className="flex items-center gap-2 font-extrabold">{result?<CheckCircle2 size={19}/>:<XCircle size={19}/>} {result?'Resposta correta':'Resposta incorreta'}</div><p className="mt-2 text-sm text-[#b8cae4]">Gabarito: <strong>{active.correct_option}</strong></p>{active.explanation&&<p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#9fb5d4]">{active.explanation.split('\n\nFonte para conferência:')[0]}</p>}<div className="mt-4 flex flex-wrap gap-2">{active.source_exam_url&&<a href={active.source_exam_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-[#234576] bg-[#071a38] px-3 py-2 text-xs font-bold"><ExternalLink size={14}/>Conferir prova oficial</a>}{active.source_answer_url&&<a href={active.source_answer_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-[#234576] bg-[#071a38] px-3 py-2 text-xs font-bold"><ExternalLink size={14}/>Gabarito oficial</a>}</div></div>}
      <div className="mt-4 grid grid-cols-2 gap-2"><button type="button" onClick={()=>setActive(null)} className="min-h-11 rounded-xl border border-[#234576] bg-[#071a38] text-sm font-bold">Encerrar</button><button type="button" onClick={next} className="min-h-11 rounded-xl bg-[#0b2856] text-sm font-extrabold">Próxima questão</button></div></div>
    </div></div>}
  </section>;
}
