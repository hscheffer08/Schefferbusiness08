import { useEffect, useState } from 'react';
import { BookOpenCheck, BrainCircuit, CheckCircle2, ChevronDown, Clipboard, Loader2, RotateCcw, Sparkles, Target } from 'lucide-react';
import { ensureFreshSession } from '@/lib/supabase';

type Section = { number:number; title:string; objective:string; explanation:string; keyPoints:string[]; connections:string[] };
type Summary = {
  title:string; subject:string; topic:string; focus:string; orientation:string; introduction:string;
  sections:Section[]; chronology:{label:string;description:string}[]; glossary:{term:string;definition:string}[];
  mustRemember:string[]; commonConfusions:{mistake:string;correction:string}[]; finalReview:string;
  activeRecall:{question:string;answer:string}[];
};
type ApiResponse = { summary?:Summary; error?:string };

const SUBJECTS=['Biologia','História','Geografia','Filosofia','Sociologia','Português','Literatura','Matemática','Física','Química','Inglês','Outra'];
const FOCUSES=['ENEM e vestibulares','Ensino médio','Aprofundado','Do zero'];
const STORAGE='conectae:study-summary:last';

function toText(s:Summary){
  const out=[s.title,'',s.orientation,'',s.introduction,''];
  s.sections.forEach(x=>{out.push(x.number+'. '+x.title,x.objective?'Objetivo: '+x.objective:'',x.explanation);if(x.keyPoints.length)out.push('Pontos-chave:\n- '+x.keyPoints.join('\n- '));if(x.connections.length)out.push('Conexões:\n- '+x.connections.join('\n- '));out.push('')});
  if(s.chronology.length){out.push('Sequência / linha do tempo');s.chronology.forEach(x=>out.push(x.label+': '+x.description));out.push('')}
  if(s.glossary.length){out.push('Glossário');s.glossary.forEach(x=>out.push(x.term+': '+x.definition));out.push('')}
  if(s.mustRemember.length)out.push('O que não pode esquecer\n- '+s.mustRemember.join('\n- '),'');
  out.push('Revisão final',s.finalReview,'');
  if(s.activeRecall.length){out.push('Perguntas de revisão');s.activeRecall.forEach((x,i)=>out.push((i+1)+'. '+x.question+'\nResposta: '+x.answer))}
  return out.filter(Boolean).join('\n');
}

export default function StudySummaryAstra(){
  const[subject,setSubject]=useState('Biologia');
  const[custom,setCustom]=useState('');
  const[topic,setTopic]=useState('');
  const[focus,setFocus]=useState('ENEM e vestibulares');
  const[material,setMaterial]=useState('');
  const[summary,setSummary]=useState<Summary|null>(null);
  const[busy,setBusy]=useState(false);
  const[error,setError]=useState('');
  const[copied,setCopied]=useState(false);
  const chosen=subject==='Outra'?custom.trim():subject;
  const canGenerate=chosen.length>=2&&topic.trim().length>=3&&!busy;

  useEffect(()=>{try{const raw=sessionStorage.getItem(STORAGE);if(!raw)return;const x=JSON.parse(raw);if(!x?.summary?.sections?.length)return;setSubject(x.subject||'Biologia');setCustom(x.custom||'');setTopic(x.topic||'');setFocus(x.focus||FOCUSES[0]);setMaterial(x.material||'');setSummary(x.summary)}catch{}},[]);

  async function request(token:string){
    return fetch('/api/study-summary',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({subject:chosen,topic:topic.trim(),focus,material:material.trim()}),signal:AbortSignal.timeout(220_000)});
  }

  async function generate(){
    if(!canGenerate)return;
    setBusy(true);setError('');setCopied(false);
    try{
      let session=await ensureFreshSession();
      if(!session?.access_token)throw new Error('Entre na sua conta para usar o Astra.');
      let response=await request(session.access_token);
      if(response.status===401){session=await ensureFreshSession(true);if(!session?.access_token)throw new Error('Sua sessão expirou. Entre novamente.');response=await request(session.access_token)}
      const data=await response.json() as ApiResponse;
      if(!response.ok||!data.summary)throw new Error(data.error||'Não foi possível gerar o resumo.');
      setSummary(data.summary);
      try{sessionStorage.setItem(STORAGE,JSON.stringify({subject,custom,topic,focus,material,summary:data.summary}))}catch{}
    }catch(e){setError(e instanceof Error?e.message:'Não foi possível gerar o resumo agora.')}
    finally{setBusy(false)}
  }

  async function copy(){
    if(!summary)return;
    try{await navigator.clipboard.writeText(toText(summary));setCopied(true);setTimeout(()=>setCopied(false),1800)}
    catch{setError('Não foi possível copiar automaticamente.')}
  }

  function reset(){
    setTopic('');setMaterial('');setSummary(null);setError('');setCopied(false);
    try{sessionStorage.removeItem(STORAGE)}catch{}
    window.scrollTo({top:0,behavior:'smooth'});
  }

  return <div className="space-y-5">
    <section className="overflow-hidden rounded-[28px] border border-[#234576] bg-[#06152f]">
      <div className="border-b border-[#173765] bg-[radial-gradient(circle_at_85%_0%,rgba(36,108,255,.25),transparent_38%),#071a38] p-6 md:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#31588e] bg-[#0b2856] px-3 py-1.5 text-[11px] font-black uppercase tracking-[.12em] text-[#a9c7ef]"><Sparkles className="h-4 w-4"/>Resumos com Astra</div>
        <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-[-.04em] md:text-5xl">Entenda a matéria em uma sequência que faz sentido.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[#a9bddc] md:text-base">O Astra organiza da base ao aprofundamento, usa ordem cronológica quando existe e ordem lógica quando ela ensina melhor. O resultado é extenso, conectado e feito para revisão.</p>
      </div>

      <div className="grid gap-5 p-5 md:p-7 lg:grid-cols-2">
        <label className="text-xs font-black uppercase tracking-[.12em] text-[#8eb7ff]">Matéria
          <span className="relative mt-2 block"><select value={subject} onChange={e=>setSubject(e.target.value)} className="min-h-12 w-full appearance-none rounded-xl border border-[#234576] bg-[#031027] px-4 pr-10 text-sm font-bold text-white outline-none focus:border-[#72a5ff]">{SUBJECTS.map(x=><option key={x}>{x}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-[#7891b4]"/></span>
          {subject==='Outra'&&<input value={custom} onChange={e=>setCustom(e.target.value)} maxLength={80} placeholder="Ex.: Relações Internacionais" className="mt-2 min-h-12 w-full rounded-xl border border-[#234576] bg-[#031027] px-4 text-sm normal-case tracking-normal text-white outline-none placeholder:text-[#607a9f] focus:border-[#72a5ff]"/>}
        </label>

        <label className="text-xs font-black uppercase tracking-[.12em] text-[#8eb7ff]">Foco
          <span className="relative mt-2 block"><select value={focus} onChange={e=>setFocus(e.target.value)} className="min-h-12 w-full appearance-none rounded-xl border border-[#234576] bg-[#031027] px-4 pr-10 text-sm font-bold normal-case tracking-normal text-white outline-none focus:border-[#72a5ff]">{FOCUSES.map(x=><option key={x}>{x}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-[#7891b4]"/></span>
        </label>

        <label className="text-xs font-black uppercase tracking-[.12em] text-[#8eb7ff] lg:col-span-2">Assunto
          <input value={topic} onChange={e=>setTopic(e.target.value)} maxLength={220} placeholder="Ex.: Revolução Francesa; síntese proteica; cinemática..." className="mt-2 min-h-12 w-full rounded-xl border border-[#234576] bg-[#031027] px-4 text-sm normal-case tracking-normal text-white outline-none placeholder:text-[#607a9f] focus:border-[#72a5ff]"/>
        </label>

        <div className="lg:col-span-2">
          <div className="flex justify-between gap-3"><div><div className="text-xs font-black uppercase tracking-[.12em] text-[#8eb7ff]">Seu material <span className="text-[#7891b4]">(opcional)</span></div><p className="mt-1 text-xs leading-relaxed text-[#7891b4]">Cole anotações ou texto da aula. O Astra usa como base e corrige inconsistências evidentes.</p></div><span className="text-[10px] font-bold text-[#607a9f]">{material.length}/20000</span></div>
          <textarea value={material} onChange={e=>setMaterial(e.target.value)} maxLength={20000} rows={8} placeholder="Cole aqui o material que precisa entrar no resumo..." className="mt-2 w-full resize-y rounded-2xl border border-[#234576] bg-[#031027] p-4 text-sm leading-6 text-white outline-none placeholder:text-[#607a9f] focus:border-[#72a5ff]"/>
        </div>

        {error&&<p className="lg:col-span-2 rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</p>}
        <div className="lg:col-span-2"><button onClick={generate} disabled={!canGenerate} className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#246cff] px-5 font-black disabled:opacity-45">{busy?<><Loader2 className="h-5 w-5 animate-spin"/>Astra está montando o resumo completo…</>:<><BrainCircuit className="h-5 w-5"/>Gerar resumo perfeito</>}</button>{busy&&<p className="mt-3 text-center text-xs text-[#7891b4]">Organizando pré-requisitos, sequência, explicações, conexões e revisão final.</p>}</div>
      </div>
    </section>

    {summary&&<article className="space-y-5">
      <section className="rounded-[28px] border border-[#31588e] bg-[#071a38] p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between"><div><div className="text-[11px] font-black uppercase tracking-[.14em] text-[#72a5ff]">{summary.subject} · {summary.focus}</div><h2 className="mt-2 max-w-3xl text-3xl font-black tracking-[-.04em] md:text-4xl">{summary.title}</h2><p className="mt-4 max-w-4xl whitespace-pre-line text-sm leading-7 text-[#b5c8e3]">{summary.orientation}</p></div><div className="flex gap-2"><button onClick={copy} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#31588e] bg-[#0b2856] px-4 text-xs font-black">{copied?<CheckCircle2 className="h-4 w-4 text-emerald-300"/>:<Clipboard className="h-4 w-4"/>}{copied?'Copiado':'Copiar'}</button><button onClick={reset} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#234576] px-4 text-xs font-black text-[#b5c8e3]"><RotateCcw className="h-4 w-4"/>Novo</button></div></div>
        <div className="mt-6 rounded-2xl border border-[#234576] bg-[#031027] p-5"><div className="flex items-center gap-2 font-black"><BookOpenCheck className="h-5 w-5 text-[#72a5ff]"/>Visão geral</div><p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#c4d4ea]">{summary.introduction}</p></div>
      </section>

      {summary.sections.map(s=><section key={s.number} className="rounded-[26px] border border-[#173765] bg-[#06152f] p-5 md:p-7">
        <div className="flex items-start gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#0b2856] text-sm font-black text-[#8eb7ff]">{s.number}</span><div><h3 className="text-xl font-black md:text-2xl">{s.title}</h3>{s.objective&&<p className="mt-2 text-xs font-bold leading-relaxed text-[#7891b4]">{s.objective}</p>}</div></div>
        <p className="mt-5 whitespace-pre-line text-[15px] leading-8 text-[#c4d4ea]">{s.explanation}</p>
        {!!s.keyPoints.length&&<div className="mt-6 rounded-2xl border border-[#31588e]/60 bg-[#071a38] p-4"><div className="text-xs font-black uppercase tracking-[.12em] text-[#8eb7ff]">Pontos-chave</div><ul className="mt-3 space-y-2 text-sm leading-6 text-[#c4d4ea]">{s.keyPoints.map(x=><li key={x} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#72a5ff]"/>{x}</li>)}</ul></div>}
        {!!s.connections.length&&<div className="mt-3 rounded-2xl bg-[#041027] p-4"><div className="text-xs font-black uppercase tracking-[.12em] text-[#7891b4]">Como isso se conecta</div><ul className="mt-3 space-y-2 text-sm leading-6 text-[#a9bddc]">{s.connections.map(x=><li key={x}>→ {x}</li>)}</ul></div>}
      </section>)}

      {!!summary.chronology.length&&<section className="rounded-[26px] border border-[#31588e] bg-[#071a38] p-5 md:p-7"><h3 className="flex items-center gap-2 text-xl font-black"><Target className="h-5 w-5 text-[#72a5ff]"/>Sequência do assunto</h3><div className="mt-5 space-y-3">{summary.chronology.map((x,i)=><div key={x.label+i} className="grid gap-2 rounded-2xl border border-[#234576] bg-[#031027] p-4 sm:grid-cols-[170px_1fr]"><strong className="text-sm text-[#8eb7ff]">{x.label}</strong><p className="text-sm leading-6 text-[#c4d4ea]">{x.description}</p></div>)}</div></section>}

      <div className="grid gap-5 lg:grid-cols-2">
        {!!summary.glossary.length&&<section className="rounded-[26px] border border-[#173765] bg-[#06152f] p-5 md:p-6"><h3 className="text-xl font-black">Glossário essencial</h3><div className="mt-4 space-y-3">{summary.glossary.map(x=><div key={x.term} className="rounded-xl bg-[#031027] p-4"><strong className="text-sm text-[#8eb7ff]">{x.term}</strong><p className="mt-1 text-sm leading-6 text-[#b5c8e3]">{x.definition}</p></div>)}</div></section>}
        {!!summary.mustRemember.length&&<section className="rounded-[26px] border border-emerald-300/20 bg-emerald-300/[.05] p-5 md:p-6"><h3 className="text-xl font-black text-emerald-100">O que você não pode esquecer</h3><ul className="mt-4 space-y-3 text-sm leading-6 text-[#c4d4ea]">{summary.mustRemember.map(x=><li key={x} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300"/>{x}</li>)}</ul></section>}
      </div>

      {!!summary.commonConfusions.length&&<section className="rounded-[26px] border border-amber-300/20 bg-amber-300/[.05] p-5 md:p-7"><h3 className="text-xl font-black text-amber-100">Confusões comuns</h3><div className="mt-4 grid gap-3 md:grid-cols-2">{summary.commonConfusions.map((x,i)=><div key={x.mistake+i} className="rounded-2xl bg-[#041027] p-4"><p className="text-sm leading-6 text-[#d8cdb8]">{x.mistake}</p><p className="mt-3 text-sm leading-6 text-[#c4d4ea]"><strong className="text-white">Correto: </strong>{x.correction}</p></div>)}</div></section>}

      <section className="rounded-[28px] border border-[#31588e] bg-[#06152f] p-6 md:p-8"><div className="text-xs font-black uppercase tracking-[.14em] text-[#72a5ff]">Fechamento</div><h3 className="mt-2 text-2xl font-black">Revisão final integrada</h3><p className="mt-4 whitespace-pre-line text-[15px] leading-8 text-[#c4d4ea]">{summary.finalReview}</p></section>

      {!!summary.activeRecall.length&&<section className="rounded-[28px] border border-[#173765] bg-[#06152f] p-5 md:p-7"><h3 className="text-xl font-black">Teste se você realmente entendeu</h3><p className="mt-2 text-sm text-[#7891b4]">Tente responder antes de abrir.</p><div className="mt-5 space-y-3">{summary.activeRecall.map((x,i)=><details key={x.question+i} className="rounded-2xl border border-[#234576] bg-[#031027] p-4"><summary className="cursor-pointer font-black leading-6"><span className="mr-2 text-[#72a5ff]">{i+1}.</span>{x.question}</summary><p className="mt-3 border-t border-[#173765] pt-3 text-sm leading-7 text-[#b5c8e3]">{x.answer}</p></details>)}</div></section>}
    </article>}
  </div>;
}
