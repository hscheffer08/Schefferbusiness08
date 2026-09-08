import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, BookOpenCheck, CheckCircle2, Clock3, ExternalLink, Loader2, RotateCcw, Trophy, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import PostMockTwinAdaptation from '@/components/PostMockTwinAdaptation';

type ExamId = 'insper' | 'ibmec' | 'einstein' | 'link';
type Option = 'A' | 'B' | 'C' | 'D' | 'E';
type Question = {
  id:number; exam_id:string; area:string; skill_name:string; difficulty:number; prompt:string;
  option_a:string|null; option_b:string|null; option_c:string|null; option_d:string|null; option_e:string|null;
  correct_option:string|null; explanation:string; source_kind:'official'|'official_adapted'|'authorial';
  source_exam_year:number|null; source_exam_label:string|null; source_exam_url:string|null;
};
type Config = {
  id:ExamId; label:string; count:number; exact:boolean; time:number; distribution:Record<string,number>;
  detail:string; extra:string; source:string;
};

const CONFIGS:Config[] = [
  {id:'insper',label:'Insper',count:60,exact:true,time:240,distribution:{Linguagens:15,Matemática:15,Humanas:15,Natureza:15},detail:'60 objetivas, 15 por área, no mesmo tamanho do exame/simulado oficial.',extra:'A prova completa também inclui Redação.',source:'https://www.insper.edu.br/pt/cursos/vestibular'},
  {id:'ibmec',label:'Ibmec',count:50,exact:true,time:180,distribution:{Linguagens:25,Matemática:15,Humanas:10},detail:'50 objetivas: Português/Literatura/Inglês, Matemática e Raciocínio Lógico, História e Geografia.',extra:'A prova completa também inclui Redação.',source:'https://www.ibmec.br/blog/graduacao/gabarito-vestibular-ibmec-26-2'},
  {id:'einstein',label:'Einstein',count:50,exact:true,time:300,distribution:{Linguagens:15,Humanas:10,Matemática:10,Natureza:15},detail:'50 objetivas com a distribuição agregada da prova oficial.',extra:'A prova completa também tem 5 questões analítico-discursivas e Redação.',source:'https://www.vunesp.com.br/FEAE2502'},
  {id:'link',label:'Link School',count:20,exact:false,time:60,distribution:{Matemática:20},detail:'20 questões de treino da etapa de Matemática do Link Sprint.',extra:'A Link não divulga a quantidade oficial de questões. Depois da Matemática, o processo inclui Business Case com 3 entregas.',source:'https://lsb.edu.br/pt-br/adm'},
];

const optionText=(q:Question,o:Option)=>q[`option_${o.toLowerCase()}` as keyof Question] as string|null;
const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const scoreKey=(id:number,seed:number)=>((id*1103515245+seed*12345)>>>0);
const isUsable=(q:Question)=>Boolean(q.prompt&&q.correct_option&&['A','B','C','D','E'].includes(q.correct_option)&&q.option_a&&q.option_b&&q.option_c&&q.option_d&&q.option_e);

function areaMatches(q:Question,wanted:string){
  const a=norm(q.area);
  const w=norm(wanted);
  if(w==='humanas') return a.includes('humana')||a.includes('historia')||a.includes('geografia');
  if(w==='linguagens') return a.includes('linguag')||a.includes('portugues')||a.includes('literatura')||a.includes('ingles');
  if(w==='natureza') return a.includes('natureza')||a.includes('biolog')||a.includes('quim')||a.includes('fisic');
  if(w==='matematica') return a.includes('matemat')||a.includes('raciocinio logico');
  return a.includes(w);
}

function pickQuestions(pool:Question[],config:Config,seed:number){
  const chosen:Question[]=[];
  const used=new Set<number>();
  Object.entries(config.distribution).forEach(([area,amount])=>{
    const candidates=pool.filter(q=>!used.has(q.id)&&areaMatches(q,area)).sort((a,b)=>scoreKey(a.id,seed)-scoreKey(b.id,seed));
    const grounded=candidates.filter(q=>q.source_kind!=='authorial');
    const authorial=candidates.filter(q=>q.source_kind==='authorial');
    const groundedTarget=Math.min(Math.ceil(amount*.45),grounded.length);
    const selected=[...grounded.slice(0,groundedTarget),...authorial.slice(0,amount-groundedTarget)];
    if(selected.length<amount) selected.push(...candidates.filter(q=>!selected.some(s=>s.id===q.id)).slice(0,amount-selected.length));
    selected.slice(0,amount).forEach(q=>{used.add(q.id);chosen.push(q)});
  });
  if(chosen.length<config.count){
    pool.filter(q=>!used.has(q.id)).sort((a,b)=>scoreKey(a.id,seed+17)-scoreKey(b.id,seed+17)).slice(0,config.count-chosen.length).forEach(q=>chosen.push(q));
  }
  return chosen.slice(0,config.count).sort((a,b)=>scoreKey(a.id,seed+31)-scoreKey(b.id,seed+31));
}

export default function ExamSimulatorHub(){
  const [pool,setPool]=useState<Question[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [config,setConfig]=useState<Config|null>(null);
  const [seed,setSeed]=useState(1);
  const [questions,setQuestions]=useState<Question[]>([]);
  const [index,setIndex]=useState(0);
  const [answers,setAnswers]=useState<Record<number,Option>>({});
  const [finished,setFinished]=useState(false);
  const [startedAt,setStartedAt]=useState<number|null>(null);
  const [elapsed,setElapsed]=useState(0);

  useEffect(()=>{
    let live=true;
    (async()=>{
      if(!supabase){setError('Banco indisponível.');setLoading(false);return;}
      const {data,error}=await supabase.from('exam_practice_questions')
        .select('id,exam_id,area,skill_name,difficulty,prompt,option_a,option_b,option_c,option_d,option_e,correct_option,explanation,source_kind,source_exam_year,source_exam_label,source_exam_url')
        .in('exam_id',CONFIGS.map(c=>c.id)).eq('active',true).limit(3000);
      if(!live)return;
      if(error){setError('Não foi possível carregar os simulados.');setLoading(false);return;}
      setPool(((data??[]) as Question[]).filter(isUsable));setLoading(false);
    })();
    return()=>{live=false};
  },[]);

  useEffect(()=>{
    if(!startedAt||finished)return;
    const timer=window.setInterval(()=>setElapsed(Math.floor((Date.now()-startedAt)/1000)),1000);
    return()=>window.clearInterval(timer);
  },[startedAt,finished]);

  const result=useMemo(()=>{
    if(!finished)return null;
    const rows=questions.map(q=>({q,selected:answers[q.id]??null,ok:answers[q.id]===q.correct_option}));
    const correct=rows.filter(r=>r.ok).length;
    const byArea=[...new Set(rows.map(r=>r.q.area))].map(area=>{const r=rows.filter(x=>x.q.area===area);return {area,correct:r.filter(x=>x.ok).length,total:r.length}});
    return {rows,correct,total:rows.length,byArea};
  },[answers,finished,questions]);

  const start=(next:Config,nextSeed=seed)=>{
    const examPool=pool.filter(q=>q.exam_id===next.id);
    const selected=pickQuestions(examPool,next,nextSeed);
    setConfig(next);setQuestions(selected);setIndex(0);setAnswers({});setFinished(false);setStartedAt(Date.now());setElapsed(0);window.scrollTo({top:0,behavior:'smooth'});
  };

  const finish=async()=>{
    setFinished(true);
    if(!config||!supabase)return;
    const correct=questions.filter(q=>answers[q.id]===q.correct_option).length;
    const {data:{user}}=await supabase.auth.getUser();
    if(user){
      const grounded=questions.filter(q=>q.source_kind!=='authorial').length;
      await supabase.from('student_exam_attempts').insert({user_id:user.id,exam_id:config.id,exam_year:new Date().getFullYear(),area:'Simulado completo',correct,total:questions.length,score:questions.length?Math.round(correct/questions.length*1000)/10:0,duration_minutes:Math.max(1,Math.round(elapsed/60)),metadata:{kind:'mixed_mock',seed,official_or_adapted:grounded,authorial:questions.length-grounded,exact_official_count:config.exact}});
    }
    window.scrollTo({top:0,behavior:'smooth'});
  };

  const retry=()=>{if(!config)return;const s=seed+1;setSeed(s);start(config,s)};
  const formatTime=(seconds:number)=>`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;

  if(loading)return <div className="rounded-[22px] border border-[#241904] bg-[#0b0904] p-8 text-center text-[#ffd45e]"><Loader2 className="mx-auto animate-spin"/><p className="mt-3 text-sm font-bold">Montando simulados...</p></div>;
  if(error)return <div className="rounded-[22px] border border-amber-400/25 bg-amber-400/[.06] p-5 text-sm text-amber-100">{error}</div>;

  if(!config){
    return <section className="mb-8 rounded-[26px] border border-[#6f4f08] bg-[linear-gradient(145deg,#171105,#0b0904)] p-5 md:p-7">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="text-[11px] font-extrabold uppercase tracking-[.14em] text-[#ffd45e]">Simulados prontos</div><h2 className="mt-2 text-2xl font-black tracking-[-.03em] md:text-3xl">Faça a prova aqui e corrija na hora.</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#e0aa18]">Cada simulado mistura questões autorais com questões baseadas em provas e materiais oficiais, respeitando a distribuição da prova.</p></div><div className="rounded-xl border border-amber-300/20 bg-amber-300/[.06] px-3 py-2 text-xs font-bold text-amber-200"><BookOpenCheck className="mr-1.5 inline h-4 w-4"/>Origem identificada em cada item</div></div>
      <div className="mt-6 grid gap-3 md:grid-cols-2">{CONFIGS.map(c=>{
        const available=pool.filter(q=>q.exam_id===c.id).length;
        return <article key={c.id} className="rounded-[20px] border border-[#241904] bg-[#0b0904] p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="text-xl font-black">{c.label}</h3><p className="mt-1 text-xs leading-relaxed text-[#e0aa18]">{c.detail}</p></div><span className="rounded-lg bg-[#171105] px-2.5 py-1 text-xs font-black text-[#ffd45e]">{c.exact?`${c.count} questões`:`${c.count} treino`}</span></div><p className="mt-3 text-[11px] leading-relaxed text-[#b88408]">{c.extra}</p><div className="mt-4 flex items-center justify-between gap-3"><span className="text-[11px] font-bold text-[#b88408]">{available} itens disponíveis</span><button type="button" onClick={()=>start(c)} disabled={available<c.count} className="rounded-xl bg-[#ffd45e] px-4 py-2.5 text-xs font-extrabold disabled:cursor-not-allowed disabled:opacity-40">Começar simulado</button></div></article>
      })}</div>
      <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-300/20 bg-amber-300/[.05] p-3 text-[11px] leading-relaxed text-amber-100/90"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0"/><span>“Baseada em prova oficial” significa questão inédita calibrada por prova, edital ou material oficial. Ela não é apresentada como transcrição de uma questão antiga. Quando houver item oficial literal licenciado no banco, ele é marcado separadamente como “Oficial”.</span></div>
    </section>;
  }

  if(finished&&result){
    const pct=result.total?Math.round(result.correct/result.total*100):0;
    const grounded=result.rows.filter(r=>r.q.source_kind!=='authorial').length;
    return <section className="mb-8 rounded-[26px] border border-[#6f4f08] bg-[#0b0904] p-5 md:p-7"><button onClick={()=>{setConfig(null);setQuestions([]);setFinished(false)}} className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#ffd45e]"><ArrowLeft size={15}/>Outros simulados</button><div className="mt-5 grid gap-4 md:grid-cols-[.8fr_1.2fr]"><div className="rounded-[22px] border border-[#241904] bg-[#0b0904] p-5"><Trophy className="h-8 w-8 text-amber-300"/><div className="mt-4 text-xs font-bold text-[#b88408]">RESULTADO — {config.label}</div><div className="mt-1 text-5xl font-black">{pct}%</div><div className="mt-2 text-sm text-[#e0aa18]">{result.correct} de {result.total} questões corretas</div><div className="mt-4 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl bg-[#0b0904] p-3"><span className="block text-[#b88408]">Tempo</span><strong>{formatTime(elapsed)}</strong></div><div className="rounded-xl bg-[#0b0904] p-3"><span className="block text-[#b88408]">Mistura</span><strong>{grounded} fonte oficial + {result.total-grounded} autorais</strong></div></div><button onClick={retry} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#ffd45e] px-4 py-3 text-sm font-extrabold"><RotateCcw size={16}/>Gerar outra versão</button></div><div className="rounded-[22px] border border-[#241904] bg-[#0b0904] p-5"><div className="text-sm font-black">Desempenho por área</div><div className="mt-3 space-y-2">{result.byArea.map(a=><div key={a.area} className="flex items-center justify-between rounded-xl bg-[#0b0904] px-3 py-2.5 text-xs"><span>{a.area}</span><strong>{a.correct}/{a.total} · {Math.round(a.correct/a.total*100)}%</strong></div>)}</div><p className="mt-4 text-[11px] leading-relaxed text-[#b88408]">{config.extra}</p></div></div>
      <PostMockTwinAdaptation examId={config.id} examLabel={config.label} rows={result.rows} elapsed={elapsed} seed={seed}/>
      <div className="mt-5"><h3 className="text-lg font-black">Correção das questões</h3><div className="mt-3 space-y-3">{result.rows.map((r,i)=><details key={r.q.id} className={`rounded-xl border p-3 ${r.ok?'border-amber-300/15 bg-amber-300/[.04]':'border-amber-300/15 bg-amber-300/[.04]'}`}><summary className="cursor-pointer list-none"><div className="flex items-center gap-2">{r.ok?<CheckCircle2 className="h-4 w-4 text-amber-300"/>:<XCircle className="h-4 w-4 text-amber-300"/>}<strong className="text-sm">Questão {i+1}</strong><span className="text-[11px] text-[#b88408]">{r.q.area} · {r.q.skill_name}</span></div></summary><div className="mt-3 text-sm leading-relaxed text-[#ffd45e]">{r.q.prompt}</div><div className="mt-3 grid gap-1.5 text-xs"><span>Sua resposta: <b>{r.selected??'em branco'}</b></span><span>Gabarito: <b>{r.q.correct_option}</b></span></div><p className="mt-3 text-xs leading-relaxed text-[#e0aa18]">{r.q.explanation}</p><div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-bold"><span className={`rounded-full px-2 py-1 ${r.q.source_kind==='authorial'?'bg-[#241904] text-[#e0aa18]':'bg-amber-300/10 text-amber-200'}`}>{r.q.source_kind==='official'?'Oficial':r.q.source_kind==='official_adapted'?'Baseada em fonte oficial':'Autoral'}</span>{r.q.source_exam_label&&<span className="text-[#b88408]">{r.q.source_exam_label}</span>}{r.q.source_exam_url&&<a href={r.q.source_exam_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#ffd45e]">Fonte <ExternalLink size={10}/></a>}</div></details>)}</div></div>
    </section>;
  }

  const current=questions[index];
  if(!current)return <div className="rounded-xl border border-amber-300/20 p-4 text-sm text-amber-100">Não há questões suficientes para montar este simulado.</div>;
  const answered=Object.keys(answers).length;
  const selected=answers[current.id];
  return <section className="mb-8 rounded-[26px] border border-[#6f4f08] bg-[#0b0904] p-4 md:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-[11px] font-extrabold uppercase tracking-[.12em] text-[#ffd45e]">{config.label} · simulado misto</div><div className="mt-1 text-sm font-bold">Questão {index+1} de {questions.length}</div></div><div className="flex items-center gap-3 text-xs font-bold text-[#e0aa18]"><span className="inline-flex items-center gap-1"><Clock3 size={14}/>{formatTime(elapsed)}</span><span>{answered}/{questions.length} respondidas</span></div></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#171105]"><div className="h-full bg-[#ffd45e] transition-all" style={{width:`${((index+1)/questions.length)*100}%`}}/></div>
    <div className="mt-5 rounded-[20px] border border-[#241904] bg-[#0b0904] p-4 md:p-5"><div className="flex flex-wrap items-center gap-2 text-[10px] font-bold"><span className="rounded-full bg-[#171105] px-2 py-1 text-[#ffd45e]">{current.area}</span><span className="text-[#b88408]">{current.skill_name}</span><span className={`rounded-full px-2 py-1 ${current.source_kind==='authorial'?'bg-[#241904] text-[#e0aa18]':'bg-amber-300/10 text-amber-200'}`}>{current.source_kind==='official'?'Questão oficial':current.source_kind==='official_adapted'?'Baseada em prova/material oficial':'Questão autoral'}</span></div><p className="mt-4 text-base font-semibold leading-relaxed text-white md:text-lg">{current.prompt}</p><div className="mt-5 grid gap-2">{(['A','B','C','D','E'] as Option[]).map(o=>{const text=optionText(current,o);return <button key={o} type="button" onClick={()=>setAnswers(prev=>({...prev,[current.id]:o}))} className={`flex min-h-12 items-start gap-3 rounded-xl border px-3 py-3 text-left text-sm transition ${selected===o?'border-[#ffd45e] bg-[#171105]':'border-[#241904] bg-[#0b0904] hover:border-[#6f4f08]'}`}><span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg font-black ${selected===o?'bg-[#ffd45e] text-white':'bg-[#0b0904] text-[#b88408]'}`}>{o}</span><span className="pt-1 leading-relaxed">{text}</span></button>})}</div></div>
    <div className="mt-4 flex items-center justify-between gap-2"><button type="button" onClick={()=>setIndex(v=>Math.max(0,v-1))} disabled={index===0} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-[#241904] px-4 text-xs font-extrabold disabled:opacity-30"><ArrowLeft size={15}/>Anterior</button>{index<questions.length-1?<button type="button" onClick={()=>setIndex(v=>Math.min(questions.length-1,v+1))} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-[#ffd45e] px-4 text-xs font-extrabold">Próxima<ArrowRight size={15}/></button>:<button type="button" onClick={finish} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-amber-500 px-4 text-xs font-extrabold text-[#050505]">Finalizar e corrigir<CheckCircle2 size={15}/></button>}</div>
  </section>;
}
