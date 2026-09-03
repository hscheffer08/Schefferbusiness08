import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Check, CheckCircle2, Clock3, ExternalLink, ListChecks, Loader2, PlayCircle, ShieldCheck, Target, Video, X } from 'lucide-react';
import type { RoadmapWeek } from '@/lib/admissions-roadmap';
import type { ExamId } from '@/lib/exam-models';
import { supabase } from '@/lib/supabase';

type Props={week:RoadmapWeek;examId:ExamId;formatDate:(iso:string)=>string;onOpenQuestions:(focus:string)=>void};

function progressPlanKey(examId:ExamId,w:RoadmapWeek){
  return `${examId}|${w.phase}|${w.focusKey}|${w.topic}|${w.hours}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .toLowerCase()
    .replace(/[^a-z0-9|._-]+/g,'-')
    .slice(0,220);
}

export default function WeeklyPlanExperience({week:w,examId,formatDate,onOpenQuestions}:Props){
  const[videoOpen,setVideoOpen]=useState(false);
  const[completed,setCompleted]=useState<string[]>([]);
  const[progressLoading,setProgressLoading]=useState(true);
  const[savingKey,setSavingKey]=useState<string|null>(null);
  const[progressError,setProgressError]=useState('');
  const sessionKeys=useMemo(()=>w.sessionPlan.map(s=>s.label),[w.sessionPlan]);
  const planKey=useMemo(()=>progressPlanKey(examId,w),[examId,w]);
  const doneCount=sessionKeys.filter(k=>completed.includes(k)).length;
  const pct=Math.round(doneCount/Math.max(1,sessionKeys.length)*100);

  useEffect(()=>{let alive=true;(async()=>{
    setProgressLoading(true);setProgressError('');
    try{
      if(!supabase)return;
      const{data:userData}=await supabase.auth.getUser();
      if(!userData.user)return;
      const{data,error}=await supabase.from('student_weekly_plan_progress')
        .select('completed_sessions')
        .eq('user_id',userData.user.id)
        .eq('exam_id',examId)
        .eq('plan_key',planKey)
        .eq('week_start',w.start)
        .maybeSingle();
      if(error)throw error;
      if(alive)setCompleted(Array.isArray(data?.completed_sessions)?data.completed_sessions:[]);
    }catch{
      if(alive){setCompleted([]);setProgressError('Não foi possível carregar o progresso desta semana.');}
    }finally{if(alive)setProgressLoading(false)}
  })();return()=>{alive=false}},[examId,planKey,w.start]);

  const toggleSession=async(key:string)=>{
    if(savingKey||!supabase)return;
    const previous=completed;
    const next=previous.includes(key)?previous.filter(x=>x!==key):[...previous,key];
    setCompleted(next);setSavingKey(key);setProgressError('');
    try{
      const{data:userData}=await supabase.auth.getUser();if(!userData.user)throw new Error();
      const{error}=await supabase.from('student_weekly_plan_progress').upsert({
        user_id:userData.user.id,
        exam_id:examId,
        plan_key:planKey,
        week_start:w.start,
        completed_sessions:next,
        updated_at:new Date().toISOString(),
      },{onConflict:'user_id,exam_id,plan_key,week_start'});
      if(error)throw error;
    }catch{
      setCompleted(previous);
      setProgressError('Não foi possível salvar esta conclusão. Tente novamente.');
    }finally{setSavingKey(null)}
  };

  return <section className="plan6-card span12">
    <div style={{display:'flex',justifyContent:'space-between',gap:16,alignItems:'flex-start',flexWrap:'wrap'}}>
      <div>
        <div className="plan6-sectionlabel">Semana {w.week} · {formatDate(w.start)}–{formatDate(w.end)}</div>
        <h2 style={{marginBottom:5}}>Missão: {w.focusLabel}</h2>
        <p style={{marginBottom:0}}>{w.phase} · <b>{w.topic}</b></p>
      </div>
      <div style={{display:'grid',gap:5,justifyItems:'end'}}><div className="plan6-statvalue">{w.hours}h exatas</div><div style={{fontSize:12,fontWeight:800,color:pct===100?'#9ee6b5':'#72a5ff'}}>{progressLoading?'Carregando progresso…':`${doneCount}/${sessionKeys.length} blocos concluídos`}</div></div>
    </div>

    {progressError&&<div className="plan6-message" style={{marginTop:10}}>{progressError}</div>}
    <div style={{height:7,borderRadius:999,background:'#0b2349',overflow:'hidden',marginTop:14}} aria-label={`${pct}% da missão semanal concluída`}><div style={{height:'100%',width:`${pct}%`,background:pct===100?'#6ee7a0':'#72a5ff',transition:'width .25s ease'}}/></div>
    {pct===100&&<div className="plan6-message" style={{marginTop:10}}><b>Semana concluída.</b> Seu próximo resultado e seus erros vão recalibrar as prioridades seguintes.</div>}

    <div className="plan6-grid" style={{marginTop:18}}>
      <div className="plan6-callout blue span7" style={{margin:0}}>
        <strong><ListChecks size={15} style={{display:'inline',marginRight:7}}/>O que estudar nesta semana</strong>
        <div style={{display:'grid',gap:9,marginTop:12}}>{w.studyChecklist.map((item,index)=><div key={`${w.week}-study-${index}`} style={{display:'flex',gap:9,alignItems:'flex-start',fontSize:13,lineHeight:1.5,color:'#d5e3f7'}}><span style={{display:'grid',placeItems:'center',flex:'0 0 auto',width:22,height:22,borderRadius:999,background:'#173765',color:'#9fc0ff',fontWeight:900,fontSize:11}}>{index+1}</span><span>{item}</span></div>)}</div>
      </div>
      <div className="plan6-callout span5" style={{margin:0}}>
        <strong><Target size={15} style={{display:'inline',marginRight:7}}/>Competências para treinar</strong>
        {w.questionSkills.length?<div style={{display:'flex',flexWrap:'wrap',gap:7,marginTop:12}}>{w.questionSkills.map(skill=><span key={skill} className="plan6-chip active">{skill}</span>)}</div>:<p style={{marginTop:10}}>O banco ainda não tem uma habilidade nomeada específica para este foco; use as questões da área e classifique cada erro após corrigir.</p>}
      </div>
    </div>

    <div className="plan6-callout blue" style={{marginTop:14}}>
      <strong><ShieldCheck size={15} style={{display:'inline',marginRight:7}}/>Por que esta semana existe</strong>
      <p>{w.rationale}</p>
      <small style={{opacity:.72}}>{w.evidenceLabel}. O plano nunca adiciona tarefas fora do tempo semanal salvo.</small>
    </div>

    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:12,marginTop:14}}>
      {w.sessionPlan.map((s,i)=>{const isDone=completed.includes(s.label);return <div key={`${w.week}-${s.label}`} className="plan6-callout" style={{margin:0,opacity:isDone?.78:1,borderColor:isDone?'rgba(110,231,160,.45)':undefined}}>
        <strong style={{display:'flex',alignItems:'center',gap:7}}><span style={{display:'grid',placeItems:'center',width:24,height:24,borderRadius:999,background:isDone?'#175c39':'#173765'}}>{isDone?<Check size={14}/>:i+1}</span>{s.label}</strong>
        <p style={{marginBottom:7}}>{s.task}</p>
        <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,fontWeight:800,color:'#72a5ff'}}><Clock3 size={13}/>{s.minutes} min</div>
        <p style={{fontSize:12,opacity:.72,marginTop:8,marginBottom:10}}><b>Prova de conclusão:</b> {s.proof}</p>
        <button type="button" className={`plan6-btn ${isDone?'':'primary'}`} disabled={Boolean(savingKey)||progressLoading} onClick={()=>toggleSession(s.label)}>{savingKey===s.label?<Loader2 size={14} className="animate-spin"/>:isDone?<CheckCircle2 size={14}/>:<Check size={14}/>} {isDone?'Concluído — desfazer':'Marcar como concluído'}</button>
      </div>})}
    </div>

    <div className="plan6-grid" style={{marginTop:14}}>
      <div className="plan6-callout blue span5">
        <strong><Video size={15} style={{display:'inline',marginRight:7}}/>Aula da semana</strong>
        <p>{w.videoTitle}<br/><span style={{opacity:.75}}>{w.videoChannel}</span></p>
        <div className="plan6-actions">
          {w.videoEmbedUrl&&<button className="plan6-btn primary" type="button" onClick={()=>setVideoOpen(true)}><PlayCircle size={14}/>Assistir aqui no site</button>}
          <a className="plan6-btn" href={w.videoUrl} target="_blank" rel="noreferrer"><ExternalLink size={14}/>{w.videoEmbedUrl?'Ver alternativas':'Encontrar aula do tema'}</a>
        </div>
      </div>
      <div className="plan6-callout span4">
        <strong><BookOpen size={15} style={{display:'inline',marginRight:7}}/>Questões com propósito</strong>
        <p><b>{w.questionTarget}</b> questões para aplicar <b>{w.topic}</b>, com correção obrigatória e registro do tipo de erro.</p>
        <button className="plan6-btn primary" onClick={()=>onOpenQuestions(w.focusKey)}><BookOpen size={14}/>Começar questões</button>
      </div>
      <div className="plan6-callout span3">
        <strong><Target size={15} style={{display:'inline',marginRight:7}}/>Checkpoint</strong>
        <p>{w.checkpoint}</p>
      </div>
    </div>

    <details style={{marginTop:14,border:'1px solid #173765',borderRadius:16,padding:'12px 14px',background:'#06152f'}} open={w.week===1}>
      <summary style={{cursor:'pointer',fontWeight:800}}>O que precisa estar pronto até domingo</summary>
      <div style={{display:'grid',gap:8,marginTop:12}}>{w.successCriteria.map(c=><div key={c} style={{display:'flex',gap:8,alignItems:'flex-start',fontSize:13,color:'#b8cae4'}}><CheckCircle2 size={16} style={{marginTop:1,flex:'0 0 auto',color:'#72a5ff'}}/>{c}</div>)}</div>
    </details>

    {videoOpen&&w.videoEmbedUrl&&<div role="dialog" aria-modal="true" style={{position:'fixed',inset:0,zIndex:120,background:'rgba(0,0,0,.82)',display:'grid',placeItems:'center',padding:18}} onClick={()=>setVideoOpen(false)}>
      <div style={{width:'min(960px,100%)',background:'#06152f',border:'1px solid #234576',borderRadius:18,padding:12}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',padding:'4px 4px 10px'}}><strong>{w.videoTitle}</strong><button type="button" aria-label="Fechar vídeo" onClick={()=>setVideoOpen(false)} style={{display:'grid',placeItems:'center',width:36,height:36,borderRadius:10,border:'1px solid #234576',background:'#081a38',color:'white'}}><X size={18}/></button></div>
        <div style={{position:'relative',paddingTop:'56.25%',overflow:'hidden',borderRadius:12,background:'#000'}}><iframe title={w.videoTitle} src={`${w.videoEmbedUrl}?rel=0`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen style={{position:'absolute',inset:0,width:'100%',height:'100%',border:0}}/></div>
      </div>
    </div>}
  </section>;
}
