import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ExternalLink, Loader2, RotateCcw, Search, X, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { extractOfficialAnswer, extractOfficialQuestion } from '@/lib/official-pdf-client';

type ExamId='enem'|'cmmg'|'fuvest'|'insper'|'link';
type Mode='official'|'adapted'|'authorial';
type OfficialRef={question_id:string;vestibular:string;year:number;question_number:number;area:string|null;subject:string|null;skill_name:string|null;correct_option:string|null;source_pdf_url:string|null;answer_key_url:string|null;source_url:string|null};
type Practice={id:number;exam_id:ExamId;area:string;skill_name:string;difficulty:number;prompt:string;option_a:string|null;option_b:string|null;option_c:string|null;option_d:string|null;option_e:string|null;correct_option:string|null;explanation:string|null;source_kind:string|null;source_exam_year:number|null;source_question_number:number|null;source_exam_url:string|null;source_answer_url:string|null};
type Extracted={found?:boolean;prompt:string;option_a:string|null;option_b:string|null;option_c:string|null;option_d:string|null;option_e:string|null;needs_source_image:boolean;image_note:string|null;confidence:number};

type ExamCfg={id:ExamId;label:string;vestibular?:string;areas:string[]};
const EXAMS:ExamCfg[]=[
  {id:'enem',label:'ENEM',vestibular:'ENEM',areas:['Linguagens','Humanas','Natureza','Matemática']},
  {id:'cmmg',label:'CMMG',vestibular:'Vestibular Ciências Médicas-MG',areas:['Linguagens','Natureza','Matemática']},
  {id:'fuvest',label:'FUVEST',areas:[]},{id:'insper',label:'Insper',areas:[]},{id:'link',label:'Link',areas:[]},
];
const LETTERS=['A','B','C','D','E'] as const;
function option(source:Extracted|Practice|null,l:typeof LETTERS[number]){return source?.[`option_${l.toLowerCase()}` as keyof (Extracted&Practice)] as string|null||null}
const sleep=(ms:number)=>new Promise(r=>setTimeout(r,ms));

export default function OfficialQuestionWorkspaceV3(){
  const[exam,setExam]=useState<ExamId>(()=>{const s=localStorage.getItem('conectae:active-exam') as ExamId|null;return EXAMS.some(x=>x.id===s)?s!:'enem'});
  const[mode,setMode]=useState<Mode>('official'); const[official,setOfficial]=useState<OfficialRef[]>([]); const[practice,setPractice]=useState<Practice[]>([]); const[loading,setLoading]=useState(true);
  const[area,setArea]=useState('Todas'); const[year,setYear]=useState('Todos'); const[search,setSearch]=useState('');
  const[activeOfficial,setActiveOfficial]=useState<OfficialRef|null>(null); const[activePractice,setActivePractice]=useState<Practice|null>(null); const[extracted,setExtracted]=useState<Extracted|null>(null);
  const[extracting,setExtracting]=useState(false); const[extractError,setExtractError]=useState(''); const[selected,setSelected]=useState(''); const[correct,setCorrect]=useState<string|null>(null); const[submitted,setSubmitted]=useState(false); const[answering,setAnswering]=useState(false);
  const cfg=EXAMS.find(x=>x.id===exam)!; const areasKey=cfg.areas.join('|');

  useEffect(()=>{localStorage.setItem('conectae:active-exam',exam);setArea('Todas');setYear('Todos');setSearch('');setMode(cfg.vestibular?'official':'authorial')},[exam,cfg.vestibular]);
  useEffect(()=>{let alive=true;(async()=>{if(!supabase){setLoading(false);return}setLoading(true);
    const pp=supabase.from('exam_practice_questions').select('id,exam_id,area,skill_name,difficulty,prompt,option_a,option_b,option_c,option_d,option_e,correct_option,explanation,source_kind,source_exam_year,source_question_number,source_exam_url,source_answer_url').eq('active',true).eq('exam_id',exam).range(0,1499);
    let refs:OfficialRef[]=[];
    if(cfg.vestibular){const batches=await Promise.all(cfg.areas.map(a=>supabase!.from('official_vestibular_question_bank').select('question_id,vestibular,year,question_number,area,subject,skill_name,correct_option,source_pdf_url,answer_key_url,source_url').eq('vestibular',cfg.vestibular!).eq('area',a).not('source_pdf_url','is',null).order('year',{ascending:false}).order('question_number',{ascending:true}).limit(80)));
      refs=batches.flatMap(b=>(b.data??[]) as OfficialRef[]).filter(q=>/\.pdf(?:$|\?)/i.test(q.source_pdf_url||'')).reduce((acc,q)=>{if((acc.filter(x=>x.area===q.area).length)<60)acc.push(q);return acc},[] as OfficialRef[]);
    }
    const pr=await pp;if(!alive)return;setOfficial(refs);setPractice((pr.data??[]) as Practice[]);setLoading(false);
  })();return()=>{alive=false}},[exam,cfg.vestibular,areasKey]);

  const adapted=useMemo(()=>practice.filter(q=>q.source_kind==='official_adapted'),[practice]); const authorial=useMemo(()=>practice.filter(q=>!q.source_kind||q.source_kind==='authorial'),[practice]);
  const rows:any[]=mode==='official'?official:mode==='adapted'?adapted:authorial;
  const availableAreas=mode==='official'?cfg.areas:Array.from(new Set((rows as Practice[]).map(q=>q.area).filter(Boolean)));
  const years=useMemo(()=>['Todos',...Array.from(new Set(rows.map((q:any)=>mode==='official'?q.year:q.source_exam_year).filter((v:any)=>Number.isFinite(v)))).sort((a:any,b:any)=>b-a).map(String)],[rows,mode]);
  const filtered=useMemo(()=>rows.filter((q:any)=>{if(area!=='Todas'&&q.area!==area)return false;const y=mode==='official'?q.year:q.source_exam_year;if(year!=='Todos'&&String(y)!==year)return false;const t=search.trim().toLowerCase();if(!t)return true;const h=mode==='official'?`${q.area||''} ${q.subject||''} ${q.skill_name||''} ${q.question_number} ${q.year}`:`${q.area||''} ${q.skill_name||''} ${q.prompt||''} ${q.source_question_number||''}`;return h.toLowerCase().includes(t)}),[rows,area,year,search,mode]);
  const counts=useMemo(()=>Object.fromEntries(cfg.areas.map(a=>[a,official.filter(q=>q.area===a).length])),[official,cfg.areas]);
  const modalOpen=Boolean(activeOfficial||activePractice);
  useEffect(()=>{window.dispatchEvent(new CustomEvent('conectae:question-modal',{detail:{open:modalOpen}}));document.body.style.overflow=modalOpen?'hidden':'';return()=>{document.body.style.overflow='';window.dispatchEvent(new CustomEvent('conectae:question-modal',{detail:{open:false}}))}},[modalOpen]);

  function reset(){setSelected('');setCorrect(null);setSubmitted(false);setAnswering(false);setExtracted(null);setExtractError('')}
  function close(){setActiveOfficial(null);setActivePractice(null);reset()}
  async function callExtractor(q:OfficialRef){
    for(let attempt=0;attempt<2;attempt++){
      try{const r=await fetch('/api/extract-official-question',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'question',sourceUrl:q.source_pdf_url,questionNumber:q.question_number,exam:cfg.label,year:q.year})});const d=await r.json();if(r.ok&&d.found)return d as Extracted}catch{}
      if(attempt===0)await sleep(650);
    }
    return null;
  }
  async function loadOfficial(q:OfficialRef){
    reset();setActiveOfficial(q);setActivePractice(null);setExtracting(true);const key=`conectae:official-v3:${q.question_id}`;
    try{const cached=sessionStorage.getItem(key);if(cached){setExtracted(JSON.parse(cached));setExtracting(false);return}}catch{}
    try{
      let value:Extracted|null=null;
      if(q.source_pdf_url){try{const d=await extractOfficialQuestion(q.source_pdf_url,q.question_number);if(d.found)value=d}catch(e){console.warn('deterministic official extraction failed',e)}}
      if(!value)value=await callExtractor(q);
      if(!value)throw new Error('Não foi possível reconstruir a questão a partir da fonte oficial.');
      setExtracted(value);try{sessionStorage.setItem(key,JSON.stringify(value))}catch{}
    }catch(e:any){setExtractError(e?.message||'Não consegui carregar essa questão oficial agora.')}finally{setExtracting(false)}
  }
  function openPractice(q:Practice){reset();setActivePractice(q);setActiveOfficial(null)}
  async function retry(){if(activeOfficial)await loadOfficial(activeOfficial)}

  async function submitOfficial(){if(!activeOfficial||!selected||submitted)return;setAnswering(true);try{
    let ans=activeOfficial.correct_option?.toUpperCase()||null;
    if(!ans&&activeOfficial.answer_key_url){try{ans=await extractOfficialAnswer(activeOfficial.answer_key_url,activeOfficial.question_number)}catch(e){console.warn('deterministic answer extraction failed',e)}}
    if(!ans&&activeOfficial.answer_key_url){try{const r=await fetch('/api/extract-official-question',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'answer',sourceUrl:activeOfficial.answer_key_url,questionNumber:activeOfficial.question_number,exam:cfg.label,year:activeOfficial.year})});const d=await r.json();if(r.ok&&d.correct_option)ans=String(d.correct_option).toUpperCase()}catch{}}
    setCorrect(ans);setSubmitted(true);
  }finally{setAnswering(false)}}
  function submitPractice(){if(!activePractice||!selected||submitted)return;setCorrect(activePractice.correct_option?.toUpperCase()||null);setSubmitted(true)}
  const source:Extracted|Practice|null=activeOfficial?extracted:activePractice; const prompt=activeOfficial?extracted?.prompt:activePractice?.prompt; const result=Boolean(submitted&&correct&&selected===correct);

  if(loading)return <div className="grid min-h-[260px] place-items-center rounded-2xl border border-[#173765] bg-[#06152f]"><div className="flex items-center gap-2 text-sm font-bold text-[#9fb5d4]"><Loader2 size={17} className="animate-spin"/>Carregando questões…</div></div>;
  return <section className="pb-8">
    <div className="mb-4"><div className="text-[11px] font-extrabold uppercase tracking-[.1em] text-[#72a5ff]">Banco de questões</div><h1 className="mt-1 text-2xl font-extrabold tracking-[-.035em] md:text-3xl">Questões oficiais para resolver aqui.</h1><p className="mt-2 max-w-2xl text-sm text-[#93a9c9]">O PDF oficial é lido pelo próprio Curso. A resposta só aparece depois da sua tentativa.</p></div>
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{EXAMS.map(x=><button key={x.id} onClick={()=>setExam(x.id)} className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-extrabold ${exam===x.id?'border-[#3479ff] bg-[#246cff] text-white':'border-[#234576] bg-[#071a38] text-[#a9bddc]'}`}>{x.label}</button>)}</div>
    <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl border border-[#173765] bg-[#06152f] p-2"><button disabled={!cfg.vestibular} onClick={()=>setMode('official')} className={`rounded-xl px-2 py-3 text-xs font-extrabold disabled:opacity-35 ${mode==='official'?'bg-emerald-500/15 text-emerald-200':'text-[#9fb5d4]'}`}>Oficiais<span className="block text-lg">{official.length}</span></button><button onClick={()=>setMode('adapted')} className={`rounded-xl px-2 py-3 text-xs font-extrabold ${mode==='adapted'?'bg-[#0b2856] text-white':'text-[#9fb5d4]'}`}>Adaptadas<span className="block text-lg">{adapted.length}</span></button><button onClick={()=>setMode('authorial')} className={`rounded-xl px-2 py-3 text-xs font-extrabold ${mode==='authorial'?'bg-[#0b2856] text-white':'text-[#9fb5d4]'}`}>Estilo da prova<span className="block text-lg">{authorial.length}</span></button></div>
    {mode==='official'&&cfg.vestibular&&<div className="mt-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/[.05] p-4"><div className="font-extrabold">{cfg.label} · acervo oficial interativo</div><div className="mt-3 flex gap-2 overflow-x-auto pb-1">{cfg.areas.map(a=><button key={a} onClick={()=>setArea(a)} className={`shrink-0 rounded-xl border px-3 py-2 text-left ${area===a?'border-emerald-300/50 bg-emerald-300/10':'border-[#234576] bg-[#071a38]'}`}><strong className="block text-sm">{a}</strong><span className="text-[10px] text-[#9fb5d4]">{counts[a]||0} oficiais</span></button>)}</div></div>}
    <div className="mt-3 flex flex-wrap gap-2"><button onClick={()=>setArea('Todas')} className={`rounded-lg border px-3 py-2 text-xs font-bold ${area==='Todas'?'border-[#3479ff] bg-[#123a78]':'border-[#203d67] bg-[#071a38] text-[#8fa7c9]'}`}>Todas as áreas</button>{availableAreas.map(a=><button key={a} onClick={()=>setArea(a)} className={`rounded-lg border px-3 py-2 text-xs font-bold ${area===a?'border-[#3479ff] bg-[#123a78]':'border-[#203d67] bg-[#071a38] text-[#8fa7c9]'}`}>{a}</button>)}</div>
    <div className="relative mt-3"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6f8ebc]" size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar conteúdo, matéria ou número" className="h-11 w-full rounded-xl border border-[#234576] bg-[#071a38] pl-10 pr-3 text-sm text-white outline-none placeholder:text-[#6680a5]"/></div>
    {years.length>1&&<div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{years.map(v=><button key={v} onClick={()=>setYear(v)} className={`shrink-0 rounded-lg border px-3 py-1.5 text-[11px] font-bold ${year===v?'border-[#3479ff] bg-[#123a78] text-white':'border-[#203d67] bg-[#071a38] text-[#8fa7c9]'}`}>{v==='Todos'?'Todos os anos':v}</button>)}</div>}
    <div className="mt-4 text-xs font-bold text-[#8fa7c9]">{filtered.length} {filtered.length===1?'questão encontrada':'questões encontradas'}</div>
    <div className="mt-3 grid gap-2.5 md:grid-cols-2">{filtered.slice(0,120).map((q:any)=>mode==='official'?<button key={q.question_id} onClick={()=>loadOfficial(q)} className="rounded-2xl border border-emerald-400/20 bg-[#06152f] p-4 text-left"><div className="flex items-center justify-between"><span className="rounded-full bg-emerald-300/10 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-emerald-200">Oficial</span><span className="text-[10px] text-[#708bb3]">{q.year}</span></div><div className="mt-3 text-[11px] font-bold text-[#72a5ff]">{cfg.label} {q.year} · Questão {q.question_number}</div><strong className="mt-1.5 block text-sm">{q.skill_name||q.subject||q.area||'Questão oficial'}</strong><p className="mt-2 text-xs text-[#8fa7c9]">Abrir e responder dentro do site</p></button>:<button key={q.id} onClick={()=>openPractice(q)} className="rounded-2xl border border-[#183965] bg-[#06152f] p-4 text-left"><div className="text-[10px] text-[#708bb3]">nível {q.difficulty}/5</div><strong className="mt-2 block text-sm">{q.skill_name}</strong><p className="mt-2 line-clamp-2 text-xs text-[#8fa7c9]">{q.prompt}</p></button>)}</div>
    {!filtered.length&&<div className="mt-4 rounded-2xl border border-[#173765] bg-[#06152f] p-5 text-sm text-[#9fb5d4]">Nenhuma questão com esses filtros.</div>}

    {modalOpen&&<div className="fixed inset-0 z-[220] overflow-y-auto bg-[#020817] text-white" role="dialog" aria-modal="true"><div className="mx-auto min-h-full w-full max-w-3xl px-4 pb-[calc(env(safe-area-inset-bottom)+28px)] pt-[max(12px,env(safe-area-inset-top))] md:px-6"><div className="sticky top-0 z-10 -mx-1 flex items-center justify-between gap-3 border-b border-[#173765] bg-[#020817]/97 px-1 py-3 backdrop-blur-xl"><div><div className={`text-[11px] font-black uppercase tracking-wide ${activeOfficial?'text-emerald-200':'text-[#72a5ff]'}`}>{activeOfficial?'Questão oficial':mode==='adapted'?'Adaptada de prova real':'Estilo da prova'}</div><div className="text-sm font-extrabold">{cfg.label}{activeOfficial?` ${activeOfficial.year} · Questão ${activeOfficial.question_number}`:''}</div></div><button onClick={close} className="grid h-11 w-11 place-items-center rounded-xl border border-[#234576] bg-[#071a38]" aria-label="Fechar"><X size={20}/></button></div>
      <div className="py-5">{extracting&&<div className="grid min-h-[260px] place-items-center"><div className="text-center"><Loader2 className="mx-auto animate-spin text-[#72a5ff]"/><p className="mt-3 text-sm text-[#9fb5d4]">Lendo a questão da prova oficial…</p></div></div>}
      {!extracting&&extractError&&<div className="rounded-2xl border border-rose-400/25 bg-rose-400/[.06] p-5"><strong>Não consegui reconstruir a questão nesta tentativa.</strong><p className="mt-2 text-sm text-[#a9bddc]">{extractError}</p><button onClick={retry} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#246cff] px-4 text-sm font-extrabold"><RotateCcw size={16}/>Tentar novamente</button>{activeOfficial?.source_pdf_url&&<a href={activeOfficial.source_pdf_url} target="_blank" rel="noreferrer" className="ml-3 mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#8bb8ff]"><ExternalLink size={15}/>Fonte oficial</a>}</div>}
      {!extracting&&!extractError&&prompt&&source&&<><div className="text-xs font-bold text-[#72a5ff]">{activeOfficial?.area||activePractice?.area}</div><h2 className="mt-3 whitespace-pre-line text-lg font-extrabold leading-relaxed md:text-xl">{prompt}</h2>{activeOfficial&&extracted?.needs_source_image&&<div className="mt-3 rounded-xl border border-amber-300/25 bg-amber-300/[.06] p-3 text-xs text-[#d8cba6]">A questão menciona elemento visual. {extracted.image_note||''}</div>}<div className="mt-5 grid gap-2.5">{LETTERS.map(l=>{const text=option(source,l);if(!text)return null;const chosen=selected===l,isCorrect=submitted&&correct===l,isWrong=submitted&&chosen&&correct!==l;return <button key={l} disabled={submitted} onClick={()=>setSelected(l)} className={`flex min-h-14 items-start gap-3 rounded-xl border px-4 py-3 text-left ${isCorrect?'border-emerald-400 bg-emerald-400/10':isWrong?'border-rose-400 bg-rose-400/10':chosen?'border-[#3479ff] bg-[#123a78]':'border-[#234576] bg-[#071a38]'}`}><strong>{l}</strong><span className="text-sm leading-relaxed">{text}</span></button>})}</div>
      {!submitted?<button disabled={!selected||answering} onClick={activeOfficial?submitOfficial:submitPractice} className="mt-5 min-h-12 w-full rounded-xl bg-[#246cff] px-4 text-sm font-extrabold disabled:opacity-40">{answering?'Conferindo gabarito…':'Confirmar resposta'}</button>:<div className={`mt-5 rounded-2xl border p-4 ${correct?(result?'border-emerald-400/30 bg-emerald-400/[.07]':'border-rose-400/30 bg-rose-400/[.07]'):'border-amber-400/30 bg-amber-400/[.07]'}`}><div className="flex items-center gap-2 font-extrabold">{correct?(result?<><CheckCircle2 size={19}/>Resposta correta</>:<><XCircle size={19}/>Resposta incorreta</>):'Gabarito temporariamente indisponível'}</div>{correct&&<p className="mt-2 text-sm">Gabarito: <strong>{correct}</strong></p>}{activePractice?.explanation&&<p className="mt-2 text-sm text-[#a9bddc]">{activePractice.explanation}</p>}{activeOfficial?.source_pdf_url&&<a href={activeOfficial.source_pdf_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[#8bb8ff]"><ExternalLink size={14}/>Conferir prova oficial</a>}</div>}</>}
      </div></div></div>}
  </section>;
}
