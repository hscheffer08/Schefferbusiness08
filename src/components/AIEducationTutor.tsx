import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Camera, ImagePlus, Loader2, Maximize2, Minimize2, Send, Sparkles, Trash2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Message={role:'user'|'assistant';content:string};
type TutorContext={currentQuestion?:string;currentSkill?:string;currentArea?:string;currentCorrection?:string};

declare global {
  interface WindowEventMap {
    'conectae:tutor-open': CustomEvent<TutorContext>;
  }
}

const STARTERS=[
  'Explique minha maior dificuldade recente',
  'O que eu deveria revisar hoje?',
  'Crie uma questão parecida com o que estou errando',
  'Me ensine um conteúdo passo a passo',
];

async function imageToDataUrl(file:File){
  const bitmap=await createImageBitmap(file);
  const max=1600;
  const scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(bitmap.width*scale));
  canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('Não foi possível preparar a imagem.');
  ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  bitmap.close?.();
  return canvas.toDataURL('image/jpeg',.86);
}

export default function AIEducationTutor(){
  const[open,setOpen]=useState(false);
  const[expanded,setExpanded]=useState(false);
  const[busy,setBusy]=useState(false);
  const[input,setInput]=useState('');
  const[error,setError]=useState('');
  const[image,setImage]=useState<string>('');
  const[context,setContext]=useState<TutorContext>({});
  const[messages,setMessages]=useState<Message[]>([]);
  const[studentContext,setStudentContext]=useState<any>({exam:localStorage.getItem('conectae:active-exam')||'enem'});
  const bottomRef=useRef<HTMLDivElement|null>(null);

  const historyKey=useMemo(()=>`conectae:tutor:${studentContext.exam||'enem'}`,[studentContext.exam]);

  useEffect(()=>{
    try{const raw=localStorage.getItem(historyKey);setMessages(raw?JSON.parse(raw):[])}catch{setMessages([])}
  },[historyKey]);
  useEffect(()=>{try{localStorage.setItem(historyKey,JSON.stringify(messages.slice(-20)))}catch{}},[messages,historyKey]);
  useEffect(()=>{if(open)window.setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:'smooth'}),40)},[open,messages,busy]);

  useEffect(()=>{
    const handler=(event:CustomEvent<TutorContext>)=>{
      setContext(event.detail||{});
      setOpen(true);
      if(event.detail?.currentQuestion)setInput('Explique esta questão para mim e mostre como eu deveria pensar para resolver sozinho.');
    };
    window.addEventListener('conectae:tutor-open',handler as EventListener);
    return()=>window.removeEventListener('conectae:tutor-open',handler as EventListener);
  },[]);

  useEffect(()=>{(async()=>{
    if(!supabase)return;
    const exam=localStorage.getItem('conectae:active-exam')||'enem';
    const{data:userData}=await supabase.auth.getUser();
    if(!userData.user)return;
    const[{data:pref},{data:diag},{data:attempts}]=await Promise.all([
      supabase.from('student_exam_preferences').select('weekly_hours,current_scores').eq('user_id',userData.user.id).eq('exam_id',exam).maybeSingle(),
      supabase.from('student_skill_diagnostics').select('area,diagnosis,error_type').eq('user_id',userData.user.id).eq('exam_id',exam).order('created_at',{ascending:false}).limit(6),
      supabase.from('student_practice_attempts').select('area,skill_name,correct').eq('user_id',userData.user.id).eq('exam_id',exam).order('created_at',{ascending:false}).limit(20),
    ]);
    const recentDifficulties=(diag??[]).map((d:any)=>`${d.area}${d?.diagnosis?.skill_name?` · ${d.diagnosis.skill_name}`:''}${d.error_type?` · ${d.error_type}`:''}`);
    const grouped=new Map<string,{ok:number,total:number}>();
    for(const a of attempts??[]){const key=a.skill_name||a.area;const row=grouped.get(key)||{ok:0,total:0};row.total+=1;if(a.correct===true)row.ok+=1;grouped.set(key,row)}
    const recentPerformance=Array.from(grouped.entries()).slice(0,8).map(([key,v])=>`${key}: ${v.ok}/${v.total} acertos recentes`);
    setStudentContext({exam,weeklyHours:pref?.weekly_hours??'',recentDifficulties,recentPerformance});
  })()},[open]);

  const chooseImage=async(file:File|null)=>{
    if(!file)return;
    setError('');
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)){setError('Use JPG, PNG ou WebP.');return}
    if(file.size>10*1024*1024){setError('A imagem precisa ter até 10 MB.');return}
    try{setImage(await imageToDataUrl(file));setOpen(true)}catch(e:any){setError(e?.message||'Não consegui preparar a imagem.')}
  };

  const send=async(textOverride?:string)=>{
    const text=(textOverride??input).trim();
    if(!text||busy||!supabase)return;
    setBusy(true);setError('');
    const next=[...messages,{role:'user' as const,content:text}];
    setMessages(next);setInput('');
    try{
      const{data:sessionData}=await supabase.auth.getSession();
      const token=sessionData.session?.access_token;
      if(!token)throw new Error('Sua sessão expirou. Entre novamente.');
      const response=await fetch('/api/education-tutor',{
        method:'POST',
        headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
        body:JSON.stringify({messages:next.slice(-12),context:{...studentContext,...context},imageDataUrl:image||undefined}),
      });
      const data=await response.json().catch(()=>({}));
      if(!response.ok)throw new Error(data?.error||'Não foi possível responder agora.');
      setMessages(prev=>[...prev,{role:'assistant',content:String(data.answer||'')}]);
      setImage('');
    }catch(e:any){setError(e?.message||'Não foi possível conversar com a IA agora.')}finally{setBusy(false)}
  };

  const clearConversation=()=>{setMessages([]);setContext({});setImage('');setError('')};

  return <>
    {open&&<div className={`fixed z-[120] flex flex-col overflow-hidden border border-[#234576] bg-[#041027] text-white shadow-2xl shadow-black/50 ${expanded?'inset-2 md:inset-6 rounded-[22px]':'bottom-20 right-2 w-[calc(100vw-16px)] max-w-[430px] h-[min(680px,calc(100vh-100px))] rounded-[22px] md:right-5'}`}>
      <div className="flex items-center gap-3 border-b border-[#173765] bg-[#06162f] px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#246cff]"><Bot size={21}/></div>
        <div className="min-w-0 flex-1"><div className="flex items-center gap-1.5 text-sm font-extrabold">IA Conectaê <Sparkles size={14} className="text-[#72a5ff]"/></div><div className="truncate text-[11px] text-[#8ea8ca]">Tutor contextual · {studentContext.exam?.toUpperCase?.()||'sua prova'}</div></div>
        <button type="button" onClick={()=>setExpanded(v=>!v)} className="rounded-lg p-2 text-[#9fb5d4] hover:bg-[#102a54]" aria-label={expanded?'Reduzir':'Expandir'}>{expanded?<Minimize2 size={17}/>:<Maximize2 size={17}/>}</button>
        <button type="button" onClick={()=>setOpen(false)} className="rounded-lg p-2 text-[#9fb5d4] hover:bg-[#102a54]" aria-label="Fechar"><X size={18}/></button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 md:px-4">
        {!messages.length&&<div className="mx-auto max-w-sm py-6 text-center"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0c2a5c] text-[#72a5ff]"><Sparkles size={27}/></div><h3 className="mt-4 text-xl font-extrabold">Seu tutor para estudar de verdade</h3><p className="mt-2 text-sm leading-relaxed text-[#9fb5d4]">Pergunte uma dúvida, envie uma foto, peça uma explicação diferente ou treine uma habilidade. Eu considero sua prova e dificuldades recentes.</p><div className="mt-5 grid gap-2">{STARTERS.map(s=><button type="button" key={s} onClick={()=>send(s)} className="rounded-xl border border-[#234576] bg-[#071a38] px-3 py-2.5 text-left text-xs font-bold text-[#c6d7ee] hover:border-[#3f72b8] hover:bg-[#0a2550]">{s}</button>)}</div></div>}
        <div className="space-y-3">{messages.map((m,i)=><div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}><div className={`max-w-[90%] whitespace-pre-wrap rounded-2xl px-3.5 py-3 text-sm leading-relaxed ${m.role==='user'?'bg-[#246cff] text-white':'border border-[#193a68] bg-[#071a38] text-[#dce9fa]'}`}>{m.content}</div></div>)}{busy&&<div className="flex justify-start"><div className="inline-flex items-center gap-2 rounded-2xl border border-[#193a68] bg-[#071a38] px-3.5 py-3 text-sm text-[#9fb5d4]"><Loader2 size={16} className="animate-spin"/>Pensando na melhor forma de te ensinar…</div></div>}<div ref={bottomRef}/></div>
      </div>

      {image&&<div className="border-t border-[#173765] bg-[#06162f] px-3 py-2"><div className="flex items-center gap-2"><img src={image} alt="Imagem anexada" className="h-14 w-14 rounded-lg object-cover"/><div className="min-w-0 flex-1 text-xs text-[#a9bddc]">Imagem anexada à próxima pergunta.</div><button type="button" onClick={()=>setImage('')} className="rounded-lg p-2 text-[#9fb5d4] hover:bg-[#102a54]"><Trash2 size={16}/></button></div></div>}
      {error&&<div className="border-t border-[#5b2940] bg-[#2d1020] px-3 py-2 text-xs text-[#ffb6c8]">{error}</div>}
      <div className="border-t border-[#173765] bg-[#06162f] p-3">
        <div className="flex items-end gap-2 rounded-2xl border border-[#234576] bg-[#031027] p-2 focus-within:border-[#4d82cc]">
          <label className="shrink-0 cursor-pointer rounded-xl p-2 text-[#8eb7ff] hover:bg-[#102a54]" title="Enviar foto"><ImagePlus size={19}/><input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden onChange={e=>chooseImage(e.target.files?.[0]||null)}/></label>
          <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}} rows={1} placeholder="Pergunte qualquer dúvida…" className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-1 py-2 text-sm text-white outline-none placeholder:text-[#607a9f]"/>
          <button type="button" onClick={()=>send()} disabled={busy||!input.trim()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#246cff] disabled:opacity-40" aria-label="Enviar"><Send size={17}/></button>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3"><span className="text-[10px] text-[#607a9f]">A IA pode errar; confira regras e gabaritos oficiais quando necessário.</span><button type="button" onClick={clearConversation} className="shrink-0 text-[10px] font-bold text-[#8ea8ca] hover:text-white">Limpar conversa</button></div>
      </div>
    </div>}

    <button type="button" onClick={()=>setOpen(v=>!v)} className="fixed bottom-3 right-3 z-[119] inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#246cff] px-4 text-sm font-extrabold text-white shadow-2xl shadow-[#246cff]/25 md:bottom-5 md:right-5" aria-label="Abrir IA Conectaê"><Bot size={19}/><span>IA Conectaê</span></button>
  </>;
}
