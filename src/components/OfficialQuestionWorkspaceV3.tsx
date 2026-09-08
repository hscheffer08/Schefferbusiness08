/* eslint-disable @typescript-eslint/no-explicit-any, no-empty */
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ExternalLink, Loader2, RotateCcw, Search, X, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { extractOfficialAnswer, extractOfficialAnswerRemotely, extractOfficialQuestion, extractOfficialQuestionRemotely } from '@/lib/official-pdf-client';
import { isEnemInteractiveQuestion } from '@/lib/enem-official-availability';

type ExamId='enem'|'cmmg'|'fuvest'|'insper'|'link';
type Mode='official'|'adapted'|'authorial';
type OfficialRef={question_id:string;series_id:string;vestibular:string;year:number;question_number:number;area:string|null;subject:string|null;skill_name:string|null;correct_option:string|null;source_pdf_url:string|null;answer_key_url:string|null;source_url:string|null;day:number|null;booklet_code:string|null;color:string|null;prompt_text:string|null;option_a:string|null;option_b:string|null;option_c:string|null;option_d:string|null;option_e:string|null};
type Practice={id:number;exam_id:ExamId;area:string;skill_name:string;difficulty:number;prompt:string;option_a:string|null;option_b:string|null;option_c:string|null;option_d:string|null;option_e:string|null;correct_option:string|null;explanation:string|null;source_kind:string|null;source_exam_year:number|null;source_question_number:number|null;source_exam_url:string|null;source_answer_url:string|null};
type Extracted={found?:boolean;prompt:string;option_a:string|null;option_b:string|null;option_c:string|null;option_d:string|null;option_e:string|null;correct_option?:string|null;needs_source_image:boolean;image_note:string|null;confidence:number;images?:string[];option_images?:Record<string,string>;source_page?:number};
type EnemSubjectMaps=Record<string,Record<string,string>>;

type ExamCfg={id:ExamId;label:string;vestibular?:string;areas:string[]};
const EXAMS:ExamCfg[]=[
  {id:'enem',label:'ENEM',vestibular:'ENEM',areas:['Linguagens','Humanas','Natureza','Matemática']},
  {id:'cmmg',label:'CMMG',vestibular:'Vestibular Ciências Médicas-MG',areas:['Linguagens','Natureza','Matemática']},
  {id:'fuvest',label:'FUVEST',vestibular:'FUVEST',areas:['Conhecimentos Gerais']},
  {id:'insper',label:'Insper',areas:[]},{id:'link',label:'Link',areas:[]},
];
const ENEM_SUBJECTS:Record<string,string[]>={
  Linguagens:['Língua Portuguesa','Literatura','Artes','Educação Física','Língua Estrangeira','Tecnologias da Comunicação'],
  Humanas:['História','Geografia','Filosofia','Sociologia'],
  Natureza:['Biologia','Física','Química'],
  Matemática:['Matemática'],
};
const LETTERS=['A','B','C','D','E'] as const;
function option(source:any,l:typeof LETTERS[number]){return source?.[`option_${l.toLowerCase()}`] as string|null||null}
function semester(q:OfficialRef){const s=`${q.source_pdf_url||''} ${q.answer_key_url||''}`;if(/(?:2[-_ ]?SEM|2o-SEMESTRE|2026_2)/i.test(s))return'2º semestre';if(/(?:1[-_ ]?SEM|1o-SEMESTRE|2026_1)/i.test(s))return'1º semestre';return q.booklet_code&&!/^(?:1|5|ARQUIVO|V1)$/i.test(q.booklet_code)?`caderno ${q.booklet_code}`:''}
function edition(q:OfficialRef,label:string){const term=q.series_id==='cmmg'?semester(q):'';return `${label} ${q.year}${term?` · ${term}`:''} · Questão ${q.question_number}`}
function cmmgSubject(number:number){if(number<=8)return'Língua Portuguesa';if(number<=12)return'Literatura';if(number<=24)return'Inglês';if(number<=38)return'Biologia';if(number<=42)return'Física';if(number<=50)return'Química';return'Matemática'}
function officialSubject(q:OfficialRef,enemMaps:EnemSubjectMaps={}){
  if(q.series_id==='cmmg')return cmmgSubject(q.question_number);
  if(q.series_id==='enem')return enemMaps[`${q.year}:${q.area||''}`]?.[String(q.question_number)]||'';
  const subject=String(q.subject||'').trim();
  if(!subject||subject===q.area||/^1ª fase$/i.test(subject))return'';
  return subject;
}

export default function OfficialQuestionWorkspaceV3(){
  const[exam,setExam]=useState<ExamId>(()=>{const s=localStorage.getItem('conectae:active-exam') as ExamId|null;return EXAMS.some(x=>x.id===s)?s!:'enem'});
  const[mode,setMode]=useState<Mode>('official'); const[official,setOfficial]=useState<OfficialRef[]>([]); const[practice,setPractice]=useState<Practice[]>([]); const[loading,setLoading]=useState(true);
  const[area,setArea]=useState('Todas'); const[subject,setSubject]=useState('Todas'); const[year,setYear]=useState('Todos'); const[search,setSearch]=useState('');
  const[enemSubjectMaps,setEnemSubjectMaps]=useState<EnemSubjectMaps>({}); const[subjectMapLoading,setSubjectMapLoading]=useState(false); const[subjectMapError,setSubjectMapError]=useState('');
  const[activeOfficial,setActiveOfficial]=useState<OfficialRef|null>(null); const[activePractice,setActivePractice]=useState<Practice|null>(null); const[extracted,setExtracted]=useState<Extracted|null>(null);
  const[extracting,setExtracting]=useState(false); const[extractError,setExtractError]=useState(''); const[bankError,setBankError]=useState(''); const[selected,setSelected]=useState(''); const[correct,setCorrect]=useState<string|null>(null); const[submitted,setSubmitted]=useState(false); const[answering,setAnswering]=useState(false); const[visibleCount,setVisibleCount]=useState(120);
  const cfg=EXAMS.find(x=>x.id===exam)!; const areasKey=cfg.areas.join('|');

  useEffect(()=>{localStorage.setItem('conectae:active-exam',exam);setArea('Todas');setSubject('Todas');setYear('Todos');setSearch('');setSubjectMapError('');setMode(cfg.vestibular?'official':'authorial')},[exam,cfg.vestibular]);
  useEffect(()=>{let alive=true;(async()=>{if(!supabase){setLoading(false);setBankError('Banco de questões indisponível.');return}setLoading(true);setBankError('');
    const pp=supabase.from('exam_practice_questions').select('id,exam_id,area,skill_name,difficulty,prompt,option_a,option_b,option_c,option_d,option_e,correct_option,explanation,source_kind,source_exam_year,source_question_number,source_exam_url,source_answer_url').eq('active',true).eq('exam_id',exam).range(0,1499);
    let refs:OfficialRef[]=[];
    if(cfg.vestibular){
      for(let from=0;from<2500;from+=500){
        const result=await supabase.from('official_vestibular_question_bank').select('question_id,series_id,vestibular,year,question_number,area,subject,skill_name,correct_option,source_pdf_url,answer_key_url,source_url,day,booklet_code,color,prompt_text,option_a,option_b,option_c,option_d,option_e').eq('series_id',exam).order('year',{ascending:false}).order('question_number',{ascending:true}).order('question_id',{ascending:true}).range(from,from+499);
        if(result.error)throw result.error;const batch=(result.data??[]) as OfficialRef[];refs.push(...batch);if(batch.length<500)break;
      }
      refs=refs.filter(q=>exam==='enem'?isEnemInteractiveQuestion(q.year,q.question_number):/\.pdf(?:$|\?)/i.test(q.source_pdf_url||''));
    }
    const pr=await pp;if(pr.error)throw pr.error;if(!alive)return;setOfficial(refs);setPractice((pr.data??[]) as Practice[]);setLoading(false);
  })().catch(error=>{console.error('question bank load failed',error);if(alive){setOfficial([]);setPractice([]);setBankError('Não consegui carregar o banco agora. Tente novamente.');setLoading(false)}});return()=>{alive=false}},[exam,cfg.vestibular,areasKey]);

  useEffect(()=>{
    if(exam!=='enem'||mode!=='official'||area==='Todas'){setSubjectMapLoading(false);setSubjectMapError('');return}
    let alive=true;
    const targetYears=(year==='Todos'?Array.from(new Set(official.filter(q=>q.area===area).map(q=>q.year))):[Number(year)]).filter(Number.isFinite).sort((a,b)=>b-a);
    (async()=>{
      setSubjectMapLoading(true);setSubjectMapError('');
      const loaded:EnemSubjectMaps={};let failed=0;
      await Promise.all(targetYears.map(async y=>{
        const mapKey=`${y}:${area}`;
        if(enemSubjectMaps[mapKey])return;
        const cacheKey=`conectae:enem-subject-map:${mapKey}`;
        try{const cached=localStorage.getItem(cacheKey);if(cached){const parsed=JSON.parse(cached);if(parsed&&typeof parsed==='object'){loaded[mapKey]=parsed;return}}}catch{}
        const source=official.find(q=>q.year===y&&q.area===area&&/\.pdf(?:$|\?)/i.test(q.source_pdf_url||''));
        if(!source?.source_pdf_url){failed+=1;return}
        try{
          const response=await fetch(`/api/enem-subject-map?year=${y}&area=${encodeURIComponent(area)}&sourceUrl=${encodeURIComponent(source.source_pdf_url)}`);
          const data=await response.json();
          if(!response.ok||!data?.subjects)throw new Error(data?.error||'Falha ao organizar matérias');
          loaded[mapKey]=data.subjects as Record<string,string>;
          try{localStorage.setItem(cacheKey,JSON.stringify(data.subjects))}catch{}
        }catch(error){console.warn('ENEM subject map failed',y,area,error);failed+=1}
      }));
      if(!alive)return;
      if(Object.keys(loaded).length)setEnemSubjectMaps(current=>({...current,...loaded}));
      setSubjectMapError(failed?'Algumas edições ainda não puderam ser organizadas por matéria. Tente novamente em instantes.':'');
      setSubjectMapLoading(false);
    })();
    return()=>{alive=false};
  },[exam,mode,area,year,official]);

  const adapted=useMemo(()=>practice.filter(q=>q.source_kind==='official_adapted'),[practice]); const authorial=useMemo(()=>practice.filter(q=>!q.source_kind||q.source_kind==='authorial'),[practice]);
  const rows:any[]=mode==='official'?official:mode==='adapted'?adapted:authorial;
  const availableAreas=mode==='official'?cfg.areas:Array.from(new Set((rows as Practice[]).map(q=>q.area).filter(Boolean)));
  const availableSubjects=useMemo(()=>{
    if(mode!=='official')return[];
    if(exam==='enem')return area==='Todas'?[]:[...(ENEM_SUBJECTS[area]||[])];
    const base=official.filter(q=>area==='Todas'||q.area===area);
    return Array.from(new Set(base.map(q=>officialSubject(q,enemSubjectMaps)).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'pt-BR'));
  },[official,area,mode,exam,enemSubjectMaps]);
  const years=useMemo(()=>['Todos',...Array.from(new Set(rows.map((q:any)=>mode==='official'?q.year:q.source_exam_year).filter((v:any)=>Number.isFinite(v)))).sort((a:any,b:any)=>b-a).map(String)],[rows,mode]);
  const filtered=useMemo(()=>rows.filter((q:any)=>{if(area!=='Todas'&&q.area!==area)return false;if(mode==='official'&&subject!=='Todas'&&officialSubject(q,enemSubjectMaps)!==subject)return false;const y=mode==='official'?q.year:q.source_exam_year;if(year!=='Todos'&&String(y)!==year)return false;const t=search.trim().toLowerCase();if(!t)return true;const h=mode==='official'?`${q.area||''} ${officialSubject(q,enemSubjectMaps)} ${q.subject||''} ${q.skill_name||''} ${q.question_number} ${q.year} ${q.series_id==='cmmg'?semester(q):''}`:`${q.area||''} ${q.skill_name||''} ${q.prompt||''} ${q.source_question_number||''}`;return h.toLowerCase().includes(t)}),[rows,area,subject,year,search,mode,enemSubjectMaps]);
  const counts=useMemo(()=>Object.fromEntries(cfg.areas.map(a=>[a,official.filter(q=>q.area===a).length])),[official,cfg.areas]);
  const subjectCounts=useMemo(()=>Object.fromEntries(availableSubjects.map(s=>[s,official.filter(q=>(area==='Todas'||q.area===area)&&(year==='Todos'||String(q.year)===year)&&officialSubject(q,enemSubjectMaps)===s).length])),[official,area,year,availableSubjects,enemSubjectMaps]);
  const modalOpen=Boolean(activeOfficial||activePractice);
  useEffect(()=>setVisibleCount(120),[exam,mode,area,subject,year,search]);
  useEffect(()=>{if(subject!=='Todas'&&!availableSubjects.includes(subject))setSubject('Todas')},[availableSubjects,subject]);
  useEffect(()=>{window.dispatchEvent(new CustomEvent('conectae:question-modal',{detail:{open:modalOpen}}));document.body.style.overflow=modalOpen?'hidden':'';return()=>{document.body.style.overflow='';window.dispatchEvent(new CustomEvent('conectae:question-modal',{detail:{open:false}}))}},[modalOpen]);

  function changeMode(next:Mode){setMode(next);setArea('Todas');setSubject('Todas');setYear('Todos');setSearch('')}
  function chooseArea(next:string){setArea(next);setSubject('Todas')}
  function reset(){setSelected('');setCorrect(null);setSubmitted(false);setAnswering(false);setExtracted(null);setExtractError('')}
  function close(){setActiveOfficial(null);setActivePractice(null);reset()}
  async function loadOfficial(q:OfficialRef){
    reset();setActiveOfficial(q);setActivePractice(null);setExtracting(true);const key=`conectae:official-v3:${q.question_id}`;
    try{const cached=sessionStorage.getItem(key);if(cached){setExtracted(JSON.parse(cached));setExtracting(false);return}}catch{}
    try{
      let value:Extracted|null=null;
      if(q.prompt_text&&q.option_a&&q.option_b&&q.option_c&&q.option_d)value={found:true,prompt:q.prompt_text,option_a:q.option_a,option_b:q.option_b,option_c:q.option_c,option_d:q.option_d,option_e:q.option_e,correct_option:q.correct_option,needs_source_image:false,image_note:null,confidence:1};
      if(!value&&q.series_id==='enem'){
        try{const response=await fetch(`/api/enem-official-questions?year=${q.year}&question=${q.question_number}`);const data=await response.json();if(response.ok&&data.found)value=data as Extracted}catch(error){console.warn('structured ENEM extraction failed',error)}
      }
      if(!value&&q.source_pdf_url&&/\.pdf(?:$|\?)/i.test(q.source_pdf_url)&&!/^https:\/\/download\.inep\.gov\.br\//i.test(q.source_pdf_url)){try{const d=await extractOfficialQuestion(q.source_pdf_url,q.question_number);if(d.found)value=d}catch(e){console.warn('deterministic official extraction failed',e)}}
      if(!value&&q.source_pdf_url&&/\.pdf(?:$|\?)/i.test(q.source_pdf_url)){try{const d=await extractOfficialQuestionRemotely(q.source_pdf_url,q.question_number,q.vestibular,q.year);if(d.found)value=d}catch(e){console.warn('remote official extraction failed',e)}}
      if(!value)throw new Error('Não foi possível reconstruir a questão a partir da fonte oficial.');
      setExtracted(value);try{sessionStorage.setItem(key,JSON.stringify(value))}catch{}
    }catch(e:any){setExtractError(e?.message||'Não consegui carregar essa questão oficial agora.')}finally{setExtracting(false)}
  }
  function openPractice(q:Practice){reset();setActivePractice(q);setActiveOfficial(null)}
  async function retry(){if(activeOfficial)await loadOfficial(activeOfficial)}

  async function submitOfficial(){if(!activeOfficial||!selected||submitted)return;setAnswering(true);try{
    let ans=extracted?.correct_option?.toUpperCase()||activeOfficial.correct_option?.toUpperCase()||null;
    if(!ans&&activeOfficial.answer_key_url&&!/^https:\/\/download\.inep\.gov\.br\//i.test(activeOfficial.answer_key_url)){try{ans=await extractOfficialAnswer(activeOfficial.answer_key_url,activeOfficial.question_number)}catch(e){console.warn('deterministic answer extraction failed',e)}}
    if(!ans&&activeOfficial.answer_key_url&&/\.pdf(?:$|\?)/i.test(activeOfficial.answer_key_url)){try{ans=await extractOfficialAnswerRemotely(activeOfficial.answer_key_url,activeOfficial.question_number,activeOfficial.vestibular,activeOfficial.year)}catch(e){console.warn('remote answer extraction failed',e)}}
    setCorrect(ans);setSubmitted(true);
  }finally{setAnswering(false)}}
  function submitPractice(){if(!activePractice||!selected||submitted)return;setCorrect(activePractice.correct_option?.toUpperCase()||null);setSubmitted(true)}
  const source:Extracted|Practice|null=activeOfficial?extracted:activePractice; const prompt=activeOfficial?extracted?.prompt:activePractice?.prompt; const result=Boolean(submitted&&correct&&selected===correct);

  if(loading)return <div className="grid min-h-[260px] place-items-center rounded-2xl border border-[#173765] bg-[#06152f]"><div className="flex items-center gap-2 text-sm font-bold text-[#9fb5d4]"><Loader2 size={17} className="animate-spin"/>Carregando questões…</div></div>;
  return <section className="pb-8">
    <div className="mb-4"><div className="text-[11px] font-extrabold uppercase tracking-[.1em] text-[#72a5ff]">Banco de questões</div><h1 className="mt-1 text-2xl font-extrabold tracking-[-.035em] md:text-3xl">Questões oficiais para resolver aqui.</h1><p className="mt-2 max-w-2xl text-sm text-[#9fb5d4]">Escolha o vestibular, o componente e a matéria específica. A seção “Oficiais” contém somente itens de provas reais.</p></div>
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{EXAMS.map(x=><button key={x.id} onClick={()=>setExam(x.id)} className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-extrabold ${exam===x.id?'border-[#72a5ff] bg-[#72a5ff] text-[#020817]':'border-[#173765] bg-[#06152f] text-[#9fb5d4]'}`}>{x.label}</button>)}</div>
    <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl border border-[#173765] bg-[#06152f] p-2"><button disabled={!cfg.vestibular} onClick={()=>changeMode('official')} className={`rounded-xl px-2 py-3 text-xs font-extrabold disabled:opacity-35 ${mode==='official'?'bg-amber-500/15 text-amber-200':'text-[#9fb5d4]'}`}>Oficiais<span className="block text-lg">{official.length}</span></button><button onClick={()=>changeMode('adapted')} className={`rounded-xl px-2 py-3 text-xs font-extrabold ${mode==='adapted'?'bg-[#0b2856] text-white':'text-[#9fb5d4]'}`}>Adaptadas<span className="block text-lg">{adapted.length}</span></button><button onClick={()=>changeMode('authorial')} className={`rounded-xl px-2 py-3 text-xs font-extrabold ${mode==='authorial'?'bg-[#0b2856] text-white':'text-[#9fb5d4]'}`}>Estilo da prova<span className="block text-lg">{authorial.length}</span></button></div>
    {mode==='official'&&cfg.vestibular&&<div className="mt-3 rounded-2xl border border-amber-400/25 bg-amber-400/[.05] p-4"><div className="font-extrabold">{cfg.label} · acervo oficial interativo</div><div className="mt-3 flex gap-2 overflow-x-auto pb-1">{cfg.areas.map(a=><button key={a} onClick={()=>chooseArea(a)} className={`shrink-0 rounded-xl border px-3 py-2 text-left ${area===a?'border-amber-300/50 bg-amber-300/10':'border-[#173765] bg-[#06152f]'}`}><strong className="block text-sm">{a}</strong><span className="text-[10px] text-[#9fb5d4]">{counts[a]||0} oficiais</span></button>)}</div>{availableSubjects.length>0&&<div className="mt-4 border-t border-amber-300/10 pt-4"><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.12em] text-amber-200">Matéria específica {subjectMapLoading&&<Loader2 size={12} className="animate-spin"/>}</div>{subjectMapLoading&&exam==='enem'&&<p className="mt-2 text-[11px] text-[#9fb5d4]">Organizando as questões oficiais do ENEM por matéria. Na primeira vez pode levar alguns segundos.</p>}{subjectMapError&&<p className="mt-2 text-[11px] text-amber-200">{subjectMapError}</p>}<div className="mt-2 flex flex-wrap gap-2"><button onClick={()=>setSubject('Todas')} className={`rounded-lg border px-3 py-2 text-xs font-bold ${subject==='Todas'?'border-[#72a5ff] bg-[#173765]':'border-[#173765] bg-[#06152f] text-[#9fb5d4]'}`}>Todas</button>{availableSubjects.map(s=><button key={s} disabled={subjectMapLoading&&exam==='enem'} onClick={()=>setSubject(s)} className={`rounded-lg border px-3 py-2 text-xs font-bold disabled:opacity-45 ${subject===s?'border-[#72a5ff] bg-[#173765]':'border-[#173765] bg-[#06152f] text-[#9fb5d4]'}`}>{s} <span className="opacity-70">({subjectMapLoading&&exam==='enem'?'…':subjectCounts[s]||0})</span></button>)}</div></div>}</div>}
    <div className="mt-3 flex flex-wrap gap-2"><button onClick={()=>chooseArea('Todas')} className={`rounded-lg border px-3 py-2 text-xs font-bold ${area==='Todas'?'border-[#72a5ff] bg-[#173765]':'border-[#173765] bg-[#06152f] text-[#9fb5d4]'}`}>Todas as áreas</button>{availableAreas.map(a=><button key={a} onClick={()=>chooseArea(a)} className={`rounded-lg border px-3 py-2 text-xs font-bold ${area===a?'border-[#72a5ff] bg-[#173765]':'border-[#173765] bg-[#06152f] text-[#9fb5d4]'}`}>{a}</button>)}</div>
    <div className="relative mt-3"><Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7691b5]" size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar conteúdo, matéria ou número" className="h-11 w-full rounded-xl border border-[#173765] bg-[#06152f] pl-10 pr-3 text-sm text-white outline-none placeholder:text-[#6680a5]"/></div>
    {years.length>1&&<div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{years.map(v=><button key={v} onClick={()=>{setYear(v);setSubject('Todas')}} className={`shrink-0 rounded-lg border px-3 py-1.5 text-[11px] font-bold ${year===v?'border-[#72a5ff] bg-[#173765] text-white':'border-[#173765] bg-[#06152f] text-[#9fb5d4]'}`}>{v==='Todos'?'Todos os anos':v}</button>)}</div>}
    {bankError&&<div className="mt-4 rounded-2xl border border-amber-400/25 bg-amber-400/[.06] p-4 text-sm text-amber-100">{bankError}</div>}
    <div className="mt-4 text-xs font-bold text-[#9fb5d4]">{filtered.length} {filtered.length===1?'questão encontrada':'questões encontradas'}{mode==='official'&&<span className="ml-1 text-amber-200">· somente oficiais</span>}</div>
    <div className="mt-3 grid gap-2.5 md:grid-cols-2">{filtered.slice(0,visibleCount).map((q:any)=>mode==='official'?<button key={q.question_id} onClick={()=>loadOfficial(q)} className="rounded-2xl border border-amber-400/20 bg-[#06152f] p-4 text-left"><div className="flex items-center justify-between"><span className="rounded-full bg-amber-300/10 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-amber-200">Oficial</span><span className="text-[10px] text-[#7691b5]">{q.year}</span></div><div className="mt-3 text-[11px] font-bold text-[#72a5ff]">{edition(q,cfg.label)}</div><strong className="mt-1.5 block text-sm">{officialSubject(q,enemSubjectMaps)||q.skill_name||q.subject||q.area||'Questão oficial'}</strong><p className="mt-2 text-xs text-[#9fb5d4]">Abrir e responder dentro do site</p></button>:<button key={q.id} onClick={()=>openPractice(q)} className="rounded-2xl border border-[#173765] bg-[#06152f] p-4 text-left"><div className="text-[10px] text-[#7691b5]">nível {q.difficulty}/5</div><strong className="mt-2 block text-sm">{q.skill_name}</strong><p className="mt-2 line-clamp-2 text-xs text-[#9fb5d4]">{q.prompt}</p></button>)}</div>
    {visibleCount<filtered.length&&<button onClick={()=>setVisibleCount(v=>v+120)} className="mt-4 min-h-11 w-full rounded-xl border border-[#72a5ff] bg-[#0b2856] px-4 text-sm font-extrabold">Carregar mais questões</button>}
    {!filtered.length&&<div className="mt-4 rounded-2xl border border-[#173765] bg-[#06152f] p-5 text-sm text-[#9fb5d4]">Nenhuma questão com esses filtros.</div>}

    {modalOpen&&<div className="fixed inset-0 z-[220] overflow-y-auto bg-[#020817] text-white" role="dialog" aria-modal="true"><div className="mx-auto min-h-full w-full max-w-3xl px-4 pb-[calc(env(safe-area-inset-bottom)+28px)] pt-[max(12px,env(safe-area-inset-top))] md:px-6"><div className="sticky top-0 z-10 -mx-1 flex items-center justify-between gap-3 border-b border-[#173765] bg-[#020817]/97 px-1 py-3 backdrop-blur-xl"><div><div className={`text-[11px] font-black uppercase tracking-wide ${activeOfficial?'text-amber-200':'text-[#72a5ff]'}`}>{activeOfficial?'Questão oficial':mode==='adapted'?'Adaptada de prova real':'Estilo da prova'}</div><div className="text-sm font-extrabold">{activeOfficial?edition(activeOfficial,cfg.label):cfg.label}</div></div><button onClick={close} className="grid h-11 w-11 place-items-center rounded-xl border border-[#173765] bg-[#06152f]" aria-label="Fechar"><X size={20}/></button></div>
      <div className="py-5">{extracting&&<div className="grid min-h-[260px] place-items-center"><div className="text-center"><Loader2 className="mx-auto animate-spin text-[#72a5ff]"/><p className="mt-3 text-sm text-[#9fb5d4]">Lendo a questão da prova oficial…</p></div></div>}
      {!extracting&&extractError&&<div className="rounded-2xl border border-amber-400/25 bg-amber-400/[.06] p-5"><strong>Não consegui reconstruir a questão nesta tentativa.</strong><p className="mt-2 text-sm text-[#9fb5d4]">{extractError}</p><button onClick={retry} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#72a5ff] px-4 text-sm font-extrabold text-[#020817]"><RotateCcw size={16}/>Tentar novamente</button>{activeOfficial?.source_pdf_url&&<a href={activeOfficial.source_pdf_url} target="_blank" rel="noreferrer" className="ml-3 mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#72a5ff]"><ExternalLink size={15}/>Fonte oficial</a>}</div>}
      {!extracting&&!extractError&&prompt&&source&&<><div className="text-xs font-bold text-[#72a5ff]">{activeOfficial?(officialSubject(activeOfficial,enemSubjectMaps)||activeOfficial.area):activePractice?.area}</div><h2 className="mt-3 whitespace-pre-line text-lg font-extrabold leading-relaxed md:text-xl">{prompt}</h2>{extracted?.images?.map((url,index)=><img key={url} src={url} alt={`Elemento visual ${index+1} da questão`} loading="lazy" className="mt-4 max-h-[560px] w-full rounded-xl border border-[#173765] bg-white object-contain"/>)}{activeOfficial&&extracted?.needs_source_image&&<div className="mt-3 rounded-xl border border-amber-300/25 bg-amber-300/[.06] p-3 text-xs text-[#9fb5d4]">{extracted.image_note||'Confira o elemento visual original antes de responder.'}</div>}{activeOfficial?.source_pdf_url&&extracted?.needs_source_image&&!extracted.images?.length&&<iframe title="Página original da questão" src={`/api/proxy-official-pdf?url=${encodeURIComponent(activeOfficial.source_pdf_url)}#page=${Math.max(1,(extracted.source_page||1)-1)}`} className="mt-4 h-[560px] w-full rounded-xl border border-[#173765] bg-white"/>}<div className="mt-5 grid gap-2.5">{LETTERS.map(l=>{const text=option(source,l);if(!text)return null;const chosen=selected===l,isCorrect=submitted&&correct===l,isWrong=submitted&&chosen&&correct!==l;const optionImage=extracted?.option_images?.[l];return <button key={l} disabled={submitted} onClick={()=>setSelected(l)} className={`flex min-h-14 items-start gap-3 rounded-xl border px-4 py-3 text-left ${isCorrect?'border-amber-400 bg-amber-400/10':isWrong?'border-amber-400 bg-amber-400/10':chosen?'border-[#72a5ff] bg-[#173765]':'border-[#173765] bg-[#06152f]'}`}><strong>{l}</strong><span className="min-w-0 flex-1 text-sm leading-relaxed">{text}{optionImage&&<img src={optionImage} alt={`Imagem da alternativa ${l}`} loading="lazy" className="mt-2 max-h-72 w-full rounded-lg bg-white object-contain"/>}</span></button>})}</div>
      {!submitted?<button disabled={!selected||answering} onClick={activeOfficial?submitOfficial:submitPractice} className="mt-5 min-h-12 w-full rounded-xl bg-[#72a5ff] px-4 text-sm font-extrabold text-[#020817] disabled:opacity-40">{answering?'Conferindo gabarito…':'Confirmar resposta'}</button>:<div className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-400/[.07] p-4"><div className="flex items-center gap-2 font-extrabold">{correct?(result?<><CheckCircle2 size={19}/>Resposta correta</>:<><XCircle size={19}/>Resposta incorreta</>):'Gabarito temporariamente indisponível'}</div>{correct&&<p className="mt-2 text-sm">Gabarito: <strong>{correct}</strong></p>}{activePractice?.explanation&&<p className="mt-2 text-sm text-[#9fb5d4]">{activePractice.explanation}</p>}{activeOfficial?.source_pdf_url&&<a href={activeOfficial.source_pdf_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[#72a5ff]"><ExternalLink size={14}/>Conferir prova oficial</a>}</div>}</>}
      </div></div></div>}
  </section>;
}
