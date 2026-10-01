import { useEffect, useState } from 'react';
import { BookOpenCheck, BrainCircuit, CheckCircle2, ChevronDown, Clipboard, Download, FileText, Loader2, RotateCcw, Share2, Sparkles, Target, Trash2 } from 'lucide-react';
import { ensureFreshSession, supabase } from '@/lib/supabase';
import { createStudySummaryPdfFile, downloadStudySummaryPdf } from '@/lib/study-summary-pdf';

type Section = { number:number; title:string; objective:string; explanation:string; keyPoints:string[]; connections:string[] };
type Summary = {
  title:string; subject:string; topic:string; focus:string; orientation:string; introduction:string;
  sections:Section[]; chronology:{label:string;description:string}[]; glossary:{term:string;definition:string}[];
  mustRemember:string[]; commonConfusions:{mistake:string;correction:string}[]; finalReview:string;
  activeRecall:{question:string;answer:string}[];
};
type Outline = {
  title:string; orientation:string; introduction:string;
  sections:{title:string;objective:string}[];
};
type Extras = {
  chronology:{label:string;description:string}[]; glossary:{term:string;definition:string}[];
  mustRemember:string[]; commonConfusions:{mistake:string;correction:string}[];
  finalReview:string; activeRecall:{question:string;answer:string}[];
};
type ApiResponse = {
  outline?:Outline; section?:Section; extras?:Extras; error?:string;
};

const SUBJECTS=['Biologia','História','Geografia','Filosofia','Sociologia','Português','Literatura','Matemática','Física','Química','Inglês','Outra'];
const FOCUSES=['ENEM e vestibulares','Ensino médio','Aprofundado','Do zero'];
const STORAGE='conectae:study-summary:last';
const LIBRARY_STORAGE='conectae:study-summaries:v1';
const LIBRARY_LIMIT=18;
const EMPTY_EXTRAS:Extras={chronology:[],glossary:[],mustRemember:[],commonConfusions:[],finalReview:'',activeRecall:[]};
type SavedSummary={id:string;createdAt:string;updatedAt:string;summary:Summary};

function isSummary(value:unknown):value is Summary{
  if(!value||typeof value!=='object')return false;
  const candidate=value as Partial<Summary>;
  return typeof candidate.title==='string'&&typeof candidate.subject==='string'&&typeof candidate.topic==='string'&&Array.isArray(candidate.sections)&&candidate.sections.length>0;
}
function readLibrary():SavedSummary[]{
  try{
    const raw=localStorage.getItem(LIBRARY_STORAGE);if(!raw)return[];
    const parsed=JSON.parse(raw);if(!Array.isArray(parsed))return[];
    return parsed.filter((item):item is SavedSummary=>Boolean(item&&typeof item.id==='string'&&typeof item.createdAt==='string'&&typeof item.updatedAt==='string'&&isSummary(item.summary))).slice(0,LIBRARY_LIMIT);
  }catch{return[]}
}
function writeLibrary(items:SavedSummary[]){try{localStorage.setItem(LIBRARY_STORAGE,JSON.stringify(items.slice(0,LIBRARY_LIMIT)))}catch{}}
function mergeLibrary(...groups:SavedSummary[][]){
  const merged=new Map<string,SavedSummary>();
  groups.flat().forEach(item=>{const current=merged.get(item.id);if(!current||item.updatedAt>current.updatedAt)merged.set(item.id,item)});
  return Array.from(merged.values()).sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).slice(0,LIBRARY_LIMIT);
}
function makeSummaryId(){return globalThis.crypto?.randomUUID?.()||`summary-${Date.now()}-${Math.random().toString(36).slice(2,10)}`}
function savedDate(value:string){try{return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(value))}catch{return''}}

function toText(s:Summary){
  const out=[s.title,'',s.orientation,'',s.introduction,''];
  s.sections.forEach(x=>{out.push(x.number+'. '+x.title,x.objective?'Objetivo: '+x.objective:'',x.explanation);if(x.keyPoints.length)out.push('Pontos-chave:\n- '+x.keyPoints.join('\n- '));if(x.connections.length)out.push('Conexões:\n- '+x.connections.join('\n- '));out.push('')});
  if(s.chronology.length){out.push('Sequência / linha do tempo');s.chronology.forEach(x=>out.push(x.label+': '+x.description));out.push('')}
  if(s.glossary.length){out.push('Glossário');s.glossary.forEach(x=>out.push(x.term+': '+x.definition));out.push('')}
  if(s.mustRemember.length)out.push('O que não pode esquecer\n- '+s.mustRemember.join('\n- '),'');
  if(s.finalReview)out.push('Revisão final',s.finalReview,'');
  if(s.activeRecall.length){out.push('Perguntas de revisão');s.activeRecall.forEach((x,i)=>out.push((i+1)+'. '+x.question+'\nResposta: '+x.answer))}
  return out.filter(Boolean).join('\n');
}

const wait=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));

export default function StudySummaryAstra(){
  const[subject,setSubject]=useState('Biologia');
  const[custom,setCustom]=useState('');
  const[topic,setTopic]=useState('');
  const[focus,setFocus]=useState('ENEM e vestibulares');
  const[material,setMaterial]=useState('');
  const[summary,setSummary]=useState<Summary|null>(null);
  const[busy,setBusy]=useState(false);
  const[error,setError]=useState('');
  const[progress,setProgress]=useState('');
  const[copied,setCopied]=useState(false);
  const[savedSummaries,setSavedSummaries]=useState<SavedSummary[]>([]);
  const[sharingId,setSharingId]=useState<string|null>(null);
  const chosen=subject==='Outra'?custom.trim():subject;
  const canGenerate=chosen.length>=2&&topic.trim().length>=3&&!busy;

  useEffect(()=>{try{const raw=sessionStorage.getItem(STORAGE);if(!raw)return;const x=JSON.parse(raw);if(!x?.summary?.sections?.length)return;setSubject(x.subject||'Biologia');setCustom(x.custom||'');setTopic(x.topic||'');setFocus(x.focus||FOCUSES[0]);setMaterial(x.material||'');setSummary(x.summary)}catch{}},[]);
  useEffect(()=>{
    let alive=true;
    const local=readLibrary();setSavedSummaries(local);
    void(async()=>{
      try{
        const session=await ensureFreshSession();
        if(!alive||!session?.user?.id||!supabase)return;
        const{data,error:loadError}=await supabase.from('study_summaries').select('id,summary,created_at,updated_at').eq('user_id',session.user.id).order('updated_at',{ascending:false}).limit(24);
        if(loadError){console.warn('Could not load saved study summaries',loadError);return}
        const remote:SavedSummary[]=(data??[]).flatMap((row:any)=>isSummary(row.summary)?[{id:String(row.id),createdAt:String(row.created_at),updatedAt:String(row.updated_at),summary:row.summary as Summary}]:[]);
        if(!alive)return;
        setSavedSummaries(current=>{const next=mergeLibrary(current,remote);writeLibrary(next);return next});
      }catch(error){console.warn('Could not sync saved study summaries',error)}
    })();
    return()=>{alive=false};
  },[]);

  async function request(token:string,payload:Record<string,unknown>){
    let lastError='Não foi possível gerar esta parte do resumo.';
    let activeToken=token;
    for(let attempt=0;attempt<3;attempt++){
      try{
        const response=await fetch('/api/study-summary',{
          method:'POST',
          headers:{'Content-Type':'application/json',Authorization:'Bearer '+activeToken},
          body:JSON.stringify({...payload,compact:attempt>0}),
          signal:AbortSignal.timeout(attempt>0?95_000:115_000)
        });
        let data:ApiResponse={};
        try{data=await response.json() as ApiResponse}catch{}
        if(response.ok)return data;
        lastError=data.error||lastError;
        if(response.status===401&&attempt<2){
          const refreshed=await ensureFreshSession(true);
          if(refreshed?.access_token){
            activeToken=refreshed.access_token;
            await wait(250);
            continue;
          }
        }
        if(![429,500,502,503,504].includes(response.status)||attempt===2)throw new Error(lastError);
      }catch(e){
        lastError=e instanceof Error?e.message:lastError;
        if(attempt===2||/sessão|Entre na sua conta/i.test(lastError))throw new Error(lastError);
      }
      await wait(900*(attempt+1));
    }
    throw new Error(lastError);
  }

  async function generate(){
    if(!canGenerate)return;
    setBusy(true);setError('');setProgress('Montando a estrutura completa…');setCopied(false);setSummary(null);
    try{
      const session=await ensureFreshSession();
      if(!session?.access_token)throw new Error('Entre na sua conta para usar o Astra.');
      const token=session.access_token;
      const base={subject:chosen,topic:topic.trim(),focus,material:material.trim()};

      const outlineData=await request(token,{...base,phase:'outline'});
      if(!outlineData.outline?.sections?.length)throw new Error(outlineData.error||'O Astra não conseguiu planejar o resumo.');
      const outline=outlineData.outline;
      const plans=outline.sections;
      const sections:Array<Section>=new Array(plans.length);
      let cursor=0;
      let completed=0;

      setProgress('Estrutura pronta. Escrevendo '+plans.length+' partes em blocos menores…');

      async function worker(){
        while(true){
          const index=cursor++;
          if(index>=plans.length)return;
          const plan=plans[index];
          const sectionData=await request(token,{
            ...base,
            phase:'section',
            section:{number:index+1,title:plan.title,objective:plan.objective},
            outlineSections:plans
          });
          if(!sectionData.section)throw new Error(sectionData.error||'Uma parte do resumo não foi concluída.');
          sections[index]=sectionData.section;
          completed++;
          setProgress('Astra escreveu '+completed+' de '+plans.length+' partes. Continuando…');
        }
      }

      await Promise.all(Array.from({length:Math.min(2,plans.length)},()=>worker()));
      setProgress('Finalizando revisão, glossário e perguntas…');
      const extrasData=await request(token,{
        ...base,
        phase:'extras',
        outline,
        outlineSections:plans
      }).catch(()=>null);
      const extras=extrasData?.extras||EMPTY_EXTRAS;

      const finalSummary:Summary={
        title:outline.title,
        subject:chosen,
        topic:topic.trim(),
        focus,
        orientation:outline.orientation,
        introduction:outline.introduction,
        sections,
        chronology:extras.chronology,
        glossary:extras.glossary,
        mustRemember:extras.mustRemember,
        commonConfusions:extras.commonConfusions,
        finalReview:extras.finalReview||outline.orientation,
        activeRecall:extras.activeRecall,
      };

      setSummary(finalSummary);
      setProgress('');
      try{sessionStorage.setItem(STORAGE,JSON.stringify({subject,custom,topic,focus,material,summary:finalSummary}))}catch{}
      saveGeneratedSummary(finalSummary);
    }catch(e){
      setError(e instanceof Error?e.message:'Não foi possível gerar o resumo agora.');
      setProgress('');
    }finally{setBusy(false)}
  }

  function saveGeneratedSummary(value:Summary){
    const now=new Date().toISOString();
    const item:SavedSummary={id:makeSummaryId(),createdAt:now,updatedAt:now,summary:value};
    setSavedSummaries(current=>{const next=mergeLibrary([item],current);writeLibrary(next);return next});
    void(async()=>{
      try{
        const session=await ensureFreshSession();
        if(!session?.user?.id||!supabase)return;
        const{error:saveError}=await supabase.from('study_summaries').upsert({id:item.id,user_id:session.user.id,title:value.title,subject:value.subject,topic:value.topic,focus:value.focus,summary:value,created_at:now,updated_at:now},{onConflict:'id'});
        if(saveError)console.warn('Could not sync study summary',saveError);
      }catch(syncError){console.warn('Could not sync study summary',syncError)}
    })();
  }

  async function copy(){
    if(!summary)return;
    try{await navigator.clipboard.writeText(toText(summary));setCopied(true);setTimeout(()=>setCopied(false),1800)}
    catch{setError('Não foi possível copiar automaticamente.')}
  }

  function openSaved(item:SavedSummary){
    const value=item.summary;
    const storedSubject=SUBJECTS.includes(value.subject)?value.subject:'Outra';
    const storedCustom=storedSubject==='Outra'?value.subject:'';
    setSubject(storedSubject);setCustom(storedCustom);
    setTopic(value.topic);setFocus(FOCUSES.includes(value.focus)?value.focus:FOCUSES[0]);setMaterial('');setSummary(value);setError('');setProgress('');setCopied(false);
    try{sessionStorage.setItem(STORAGE,JSON.stringify({subject:storedSubject,custom:storedCustom,topic:value.topic,focus:value.focus,material:'',summary:value}))}catch{}
    window.setTimeout(()=>document.getElementById('astra-summary-result')?.scrollIntoView({behavior:'smooth',block:'start'}),80);
  }

  async function sharePdf(value:Summary,id:string){
    setSharingId(id);setError('');
    try{
      const file=createStudySummaryPdfFile(value);
      const canNativeShare=typeof navigator.share==='function'&&(!navigator.canShare||navigator.canShare({files:[file]}));
      if(canNativeShare)await navigator.share({title:value.title,text:`Resumo do Astra: ${value.subject} · ${value.topic}`,files:[file]});
      else downloadStudySummaryPdf(value);
    }catch(shareError){
      if(shareError instanceof Error&&shareError.name==='AbortError')return;
      setError('Não foi possível compartilhar o PDF agora. Você ainda pode baixar o arquivo normalmente.');
    }finally{setSharingId(null)}
  }

  function removeSaved(id:string){
    if(!window.confirm('Remover este resumo salvo?'))return;
    setSavedSummaries(current=>{const next=current.filter(item=>item.id!==id);writeLibrary(next);return next});
    void(async()=>{
      try{
        const session=await ensureFreshSession();
        if(!session?.user?.id||!supabase)return;
        const{error:deleteError}=await supabase.from('study_summaries').delete().eq('id',id).eq('user_id',session.user.id);
        if(deleteError)console.warn('Could not delete study summary',deleteError);
      }catch(deleteError){console.warn('Could not delete study summary',deleteError)}
    })();
  }

  function reset(){
    setTopic('');setMaterial('');setSummary(null);setError('');setProgress('');setCopied(false);
    try{sessionStorage.removeItem(STORAGE)}catch{}
    window.scrollTo({top:0,behavior:'smooth'});
  }

  return <div className="space-y-5">
    <section className="overflow-hidden rounded-[28px] border border-[#234576] bg-[#06152f]">
      <div className="border-b border-[#173765] bg-[radial-gradient(circle_at_85%_0%,rgba(36,108,255,.25),transparent_38%),#071a38] p-6 md:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#31588e] bg-[#0b2856] px-3 py-1.5 text-[11px] font-black uppercase tracking-[.12em] text-[#a9c7ef]"><Sparkles className="h-4 w-4"/>Resumos com Astra</div>
        <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-[-.04em] md:text-5xl">Entenda a matéria em uma sequência que faz sentido.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[#a9bddc] md:text-base">O Astra divide automaticamente resumos grandes em partes menores, aprofunda cada uma e junta tudo no final. Assim, o tamanho do conteúdo não fica preso ao limite de uma única resposta.</p>
      </div>

      {!!savedSummaries.length&&<div className="border-b border-[#173765] bg-[#041027] p-5 md:p-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="flex items-center gap-2 text-lg font-black"><FileText className="h-5 w-5 text-[#72a5ff]"/>Seus resumos</h2><p className="mt-1 text-xs leading-5 text-[#7891b4]">Abra, baixe ou compartilhe de novo. Quando você está logado, os resumos também ficam sincronizados com sua conta.</p></div><span className="text-[11px] font-black uppercase tracking-[.1em] text-[#607a9f]">{savedSummaries.length} salvo{savedSummaries.length===1?'':'s'}</span></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">{savedSummaries.map(item=><article key={item.id} className="overflow-hidden rounded-2xl border border-[#234576] bg-[#06152f]">
          <button type="button" onClick={()=>openSaved(item)} className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-[#071a38]"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#0b2856] text-[#72a5ff]"><FileText className="h-5 w-5"/></span><span className="min-w-0"><strong className="block line-clamp-2 text-sm leading-5">{item.summary.title}</strong><span className="mt-1 block truncate text-xs font-bold text-[#8eb7ff]">{item.summary.subject} · {item.summary.topic}</span><span className="mt-1 block text-[10px] font-bold text-[#607a9f]">Salvo em {savedDate(item.createdAt)}</span></span></button>
          <div className="flex items-center gap-2 border-t border-[#173765] px-3 py-2.5"><button type="button" onClick={()=>downloadStudySummaryPdf(item.summary)} className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0b2856] px-3 text-[11px] font-black text-[#b9d2f4]"><Download className="h-3.5 w-3.5"/>PDF</button><button type="button" onClick={()=>void sharePdf(item.summary,item.id)} disabled={sharingId===item.id} className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#31588e] px-3 text-[11px] font-black text-[#dce9fb] disabled:opacity-50">{sharingId===item.id?<Loader2 className="h-3.5 w-3.5 animate-spin"/>:<Share2 className="h-3.5 w-3.5"/>}Compartilhar</button><button type="button" onClick={()=>removeSaved(item.id)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-[#234576] text-[#7891b4] hover:text-rose-200" aria-label="Remover resumo salvo"><Trash2 className="h-3.5 w-3.5"/></button></div>
        </article>)}</div>
      </div>}

      <div className="grid gap-5 p-5 md:p-7 lg:grid-cols-2">
        <label className="text-xs font-black uppercase tracking-[.12em] text-[#8eb7ff]">Matéria
          <span className="relative mt-2 block"><select value={subject} onChange={e=>setSubject(e.target.value)} className="min-h-12 w-full appearance-none rounded-xl border border-[#234576] bg-[#031027] px-4 pr-10 text-sm font-bold text-white outline-none focus:border-[#72a5ff]">{SUBJECTS.map(x=><option key={x}>{x}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-[#7891b4]"/></span>
          {subject==='Outra'&&<input value={custom} onChange={e=>setCustom(e.target.value)} maxLength={80} placeholder="Ex.: Relações Internacionais" className="mt-2 min-h-12 w-full rounded-xl border border-[#234576] bg-[#031027] px-4 text-sm normal-case tracking-normal text-white outline-none placeholder:text-[#607a9f] focus:border-[#72a5ff]"/>}
        </label>

        <label className="text-xs font-black uppercase tracking-[.12em] text-[#8eb7ff]">Foco
          <span className="relative mt-2 block"><select value={focus} onChange={e=>setFocus(e.target.value)} className="min-h-12 w-full appearance-none rounded-xl border border-[#234576] bg-[#031027] px-4 pr-10 text-sm font-bold normal-case tracking-normal text-white outline-none focus:border-[#72a5ff]">{FOCUSES.map(x=><option key={x}>{x}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-3.5 h-4 w-4 text-[#7891b4]"/></span>
        </label>

        <label className="text-xs font-black uppercase tracking-[.12em] text-[#8eb7ff] lg:col-span-2">Assunto
          <textarea value={topic} onChange={e=>setTopic(e.target.value)} maxLength={4000} rows={3} placeholder="Ex.: 1. Fontes renováveis; 2. Transportes no Brasil; 3. Dinâmica atmosférica..." className="mt-2 w-full resize-y rounded-xl border border-[#234576] bg-[#031027] px-4 py-3 text-sm leading-6 normal-case tracking-normal text-white outline-none placeholder:text-[#607a9f] focus:border-[#72a5ff]"/>
        </label>

        <div className="lg:col-span-2">
          <div className="flex justify-between gap-3"><div><div className="text-xs font-black uppercase tracking-[.12em] text-[#8eb7ff]">Seu material <span className="text-[#7891b4]">(opcional)</span></div><p className="mt-1 text-xs leading-relaxed text-[#7891b4]">Cole anotações ou texto da aula. O Astra usa como base e corrige inconsistências evidentes.</p></div><span className="text-[10px] font-bold text-[#607a9f]">{material.length}/60000</span></div>
          <textarea value={material} onChange={e=>setMaterial(e.target.value)} maxLength={60000} rows={8} placeholder="Cole aqui o material que precisa entrar no resumo..." className="mt-2 w-full resize-y rounded-2xl border border-[#234576] bg-[#031027] p-4 text-sm leading-6 text-white outline-none placeholder:text-[#607a9f] focus:border-[#72a5ff]"/>
        </div>

        {error&&<p className="lg:col-span-2 rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</p>}
        <div className="lg:col-span-2"><button onClick={generate} disabled={!canGenerate} className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#246cff] px-5 font-black disabled:opacity-45">{busy?<><Loader2 className="h-5 w-5 animate-spin"/>Astra está montando o resumo completo…</>:<><BrainCircuit className="h-5 w-5"/>Gerar resumo perfeito</>}</button>{busy&&<p className="mt-3 text-center text-xs text-[#7891b4]">{progress||'Organizando o conteúdo em partes menores para não estourar o limite.'}</p>}</div>
      </div>
    </section>

    {summary&&<article id="astra-summary-result" className="scroll-mt-24 space-y-5">
      <section className="rounded-[28px] border border-[#31588e] bg-[#071a38] p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between"><div><div className="text-[11px] font-black uppercase tracking-[.14em] text-[#72a5ff]">{summary.subject} · {summary.focus}</div><h2 className="mt-2 max-w-3xl text-3xl font-black tracking-[-.04em] md:text-4xl">{summary.title}</h2><p className="mt-4 max-w-4xl whitespace-pre-line text-sm leading-7 text-[#b5c8e3]">{summary.orientation}</p></div><div className="flex flex-wrap gap-2"><button onClick={()=>downloadStudySummaryPdf(summary)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#246cff] px-4 text-xs font-black"><Download className="h-4 w-4"/>Baixar PDF</button><button onClick={()=>void sharePdf(summary,'current')} disabled={sharingId==='current'} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#72a5ff]/45 bg-[#0b2856] px-4 text-xs font-black disabled:opacity-50">{sharingId==='current'?<Loader2 className="h-4 w-4 animate-spin"/>:<Share2 className="h-4 w-4"/>}Compartilhar</button><button onClick={copy} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#31588e] bg-[#0b2856] px-4 text-xs font-black">{copied?<CheckCircle2 className="h-4 w-4 text-emerald-300"/>:<Clipboard className="h-4 w-4"/>}{copied?'Copiado':'Copiar'}</button><button onClick={reset} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#234576] px-4 text-xs font-black text-[#b5c8e3]"><RotateCcw className="h-4 w-4"/>Novo</button></div></div>
        <div className="mt-6 rounded-2xl border border-[#234576] bg-[#031027] p-5"><div className="flex items-center gap-2 font-black"><BookOpenCheck className="h-5 w-5 text-[#72a5ff]"/>Visão geral</div><p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#c4d4ea]">{summary.introduction}</p></div>
      </section>

      {summary.sections.map(s=><section key={s.number} className="rounded-[26px] border border-[#173765] bg-[#06152f] p-5 md:p-7">
        <div className="flex items-start gap-4"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#0b2856] text-sm font-black text-[#8eb7ff]">{s.number}</span><div><h3 className="text-xl font-black md:text-2xl">{s.title}</h3>{s.objective&&<p className="mt-2 text-xs font-bold leading-relaxed text-[#7891b4]">{s.objective}</p>}</div></div>
        <p className="mt-5 whitespace-pre-line text-[15px] leading-8 text-[#c4d4ea]">{s.explanation}</p>
        {!!s.keyPoints.length&&<div className="mt-6 rounded-2xl border border-[#31588e]/60 bg-[#071a38] p-4"><div className="text-xs font-black uppercase tracking-[.12em] text-[#8eb7ff]">Pontos-chave</div><ul className="mt-3 space-y-2 text-sm leading-6 text-[#c4d4ea]">{s.keyPoints.map((x,i)=><li key={x+i} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#72a5ff]"/>{x}</li>)}</ul></div>}
        {!!s.connections.length&&<div className="mt-3 rounded-2xl bg-[#041027] p-4"><div className="text-xs font-black uppercase tracking-[.12em] text-[#7891b4]">Como isso se conecta</div><ul className="mt-3 space-y-2 text-sm leading-6 text-[#a9bddc]">{s.connections.map((x,i)=><li key={x+i}>→ {x}</li>)}</ul></div>}
      </section>)}

      {!!summary.chronology.length&&<section className="rounded-[26px] border border-[#31588e] bg-[#071a38] p-5 md:p-7"><h3 className="flex items-center gap-2 text-xl font-black"><Target className="h-5 w-5 text-[#72a5ff]"/>Sequência do assunto</h3><div className="mt-5 space-y-3">{summary.chronology.map((x,i)=><div key={x.label+i} className="grid gap-2 rounded-2xl border border-[#234576] bg-[#031027] p-4 sm:grid-cols-[170px_1fr]"><strong className="text-sm text-[#8eb7ff]">{x.label}</strong><p className="text-sm leading-6 text-[#c4d4ea]">{x.description}</p></div>)}</div></section>}

      <div className="grid gap-5 lg:grid-cols-2">
        {!!summary.glossary.length&&<section className="rounded-[26px] border border-[#173765] bg-[#06152f] p-5 md:p-6"><h3 className="text-xl font-black">Glossário essencial</h3><div className="mt-4 space-y-3">{summary.glossary.map((x,i)=><div key={x.term+i} className="rounded-xl bg-[#031027] p-4"><strong className="text-sm text-[#8eb7ff]">{x.term}</strong><p className="mt-1 text-sm leading-6 text-[#b5c8e3]">{x.definition}</p></div>)}</div></section>}
        {!!summary.mustRemember.length&&<section className="rounded-[26px] border border-emerald-300/20 bg-emerald-300/[.05] p-5 md:p-6"><h3 className="text-xl font-black text-emerald-100">O que você não pode esquecer</h3><ul className="mt-4 space-y-3 text-sm leading-6 text-[#c4d4ea]">{summary.mustRemember.map((x,i)=><li key={x+i} className="flex gap-2"><CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-emerald-300"/>{x}</li>)}</ul></section>}
      </div>

      {!!summary.commonConfusions.length&&<section className="rounded-[26px] border border-amber-300/20 bg-amber-300/[.05] p-5 md:p-7"><h3 className="text-xl font-black text-amber-100">Confusões comuns</h3><div className="mt-4 grid gap-3 md:grid-cols-2">{summary.commonConfusions.map((x,i)=><div key={x.mistake+i} className="rounded-2xl bg-[#041027] p-4"><p className="text-sm leading-6 text-[#d8cdb8]">{x.mistake}</p><p className="mt-3 text-sm leading-6 text-[#c4d4ea]"><strong className="text-white">Correto: </strong>{x.correction}</p></div>)}</div></section>}

      {!!summary.finalReview&&<section className="rounded-[28px] border border-[#31588e] bg-[#06152f] p-6 md:p-8"><div className="text-xs font-black uppercase tracking-[.14em] text-[#72a5ff]">Fechamento</div><h3 className="mt-2 text-2xl font-black">Revisão final integrada</h3><p className="mt-4 whitespace-pre-line text-[15px] leading-8 text-[#c4d4ea]">{summary.finalReview}</p></section>}

      {!!summary.activeRecall.length&&<section className="rounded-[28px] border border-[#173765] bg-[#06152f] p-5 md:p-7"><h3 className="text-xl font-black">Teste se você realmente entendeu</h3><p className="mt-2 text-sm text-[#7891b4]">Tente responder antes de abrir.</p><div className="mt-5 space-y-3">{summary.activeRecall.map((x,i)=><details key={x.question+i} className="rounded-2xl border border-[#234576] bg-[#031027] p-4"><summary className="cursor-pointer font-black leading-6"><span className="mr-2 text-[#72a5ff]">{i+1}.</span>{x.question}</summary><p className="mt-3 border-t border-[#173765] pt-3 text-sm leading-7 text-[#b5c8e3]">{x.answer}</p></details>)}</div></section>}
    </article>}
  </div>;
}
