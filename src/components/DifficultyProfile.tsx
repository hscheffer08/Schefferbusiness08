import { useCallback, useEffect, useMemo, useState } from 'react';
import { BrainCircuit, Check, ChevronDown, ChevronUp, Save, Search, Sparkles, Target, Trophy, Activity, Clock3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getExamSkillCatalog, topicKey, type DifficultyLevel, type DifficultySelection } from '@/lib/exam-skill-catalog';
import { countGranularTopics, expandStudyCatalog } from '@/lib/granular-study-topics';
import { buildStudyTwin, type TwinAttempt, type TwinDiagnostic, type TwinPriority } from '@/lib/study-twin-engine';
import type { ExamId } from '@/lib/exam-models';

export default function DifficultyProfile({examId,course,value,onChange,weeklyHours}:{examId:ExamId;course:string;value:DifficultySelection;onChange:(next:DifficultySelection)=>void;weeklyHours:number}){
 const baseCatalog=useMemo(()=>getExamSkillCatalog(examId,course),[examId,course]);
 const catalog=useMemo(()=>expandStudyCatalog(baseCatalog),[baseCatalog]);
 const[open,setOpen]=useState<Record<string,boolean>>({});
 const[query,setQuery]=useState('');
 const[started,setStarted]=useState(Object.keys(value).length>0);
 const[saving,setSaving]=useState(false);
 const[msg,setMsg]=useState('');
 const[twinAttempts,setTwinAttempts]=useState<TwinAttempt[]>([]);
 const[twinDiagnostics,setTwinDiagnostics]=useState<TwinDiagnostic[]>([]);
 const[twinLoading,setTwinLoading]=useState(true);
 const selected=Object.keys(value).length;
 const totalTopics=countGranularTopics(baseCatalog);
 const normalized=query.trim().toLowerCase();
 useEffect(()=>{if(selected>0)setStarted(true)},[selected]);
 const subjectStats=useMemo(()=>catalog.subjects.map(s=>{
   const levels=s.topics.map(t=>value[topicKey(s.subject,t)]??0);
   const marked=levels.filter(Boolean).length;
   return{...s,marked};
 }),[catalog,value]);
 const selectedSubjects=subjectStats.filter(s=>s.marked>0).length;
 const visibleSubjects=useMemo(()=>catalog.subjects.map(s=>({...s,topics:normalized?s.topics.filter(t=>`${s.subject} ${s.area} ${t}`.toLowerCase().includes(normalized)):s.topics})).filter(s=>s.topics.length>0),[catalog,normalized]);
 const setLevel=(key:string,level:DifficultyLevel)=>{const next={...value};if(next[key]===level)delete next[key];else next[key]=level;onChange(next);setMsg('')};
 const openSubject=(subject:string)=>{setStarted(true);setOpen(v=>({...v,[subject]:true}));setMsg('')};
 const selectedDetails=useMemo(()=>catalog.subjects.flatMap(s=>s.topics.map(topic=>({subject:s.subject,area:s.area,topic,key:topicKey(s.subject,topic),level:value[topicKey(s.subject,topic)]??0}))).filter(x=>x.level>0).sort((a,b)=>b.level-a.level||a.topic.localeCompare(b.topic,'pt-BR')),[catalog,value]);

 const refreshTwin=useCallback(async()=>{
   try{
     if(!supabase){setTwinLoading(false);return}
     const{data:userData}=await supabase.auth.getUser();const user=userData.user;if(!user){setTwinLoading(false);return}
     const[{data:attempts},{data:diagnostics}]=await Promise.all([
       supabase.from('student_practice_attempts').select('exam_id,area,skill_name,correct,created_at,duration_seconds').eq('user_id',user.id).eq('exam_id',examId).order('created_at',{ascending:false}).limit(240),
       supabase.from('student_skill_diagnostics').select('area,skill_code,error_type,created_at,diagnosis').eq('user_id',user.id).eq('exam_id',examId).order('created_at',{ascending:false}).limit(80),
     ]);
     setTwinAttempts((attempts??[]) as TwinAttempt[]);setTwinDiagnostics((diagnostics??[]) as TwinDiagnostic[]);
   }finally{setTwinLoading(false)}
 },[examId]);
 useEffect(()=>{setTwinLoading(true);void refreshTwin();const handler=()=>void refreshTwin();window.addEventListener('conectae:diagnostic-saved',handler);return()=>window.removeEventListener('conectae:diagnostic-saved',handler)},[refreshTwin]);
 const twinPriorities=useMemo<TwinPriority[]>(()=>{
   const areas=Array.from(new Set(catalog.subjects.map(s=>s.area)));
   return areas.map(area=>({metric:{key:area,label:area,max:100,unit:'pontos'},current:0,goal:0,missing:0,score:1,accuracy:null}));
 },[catalog]);
 const twin=useMemo(()=>buildStudyTwin({examId,priorities:twinPriorities,attempts:twinAttempts,diagnostics:twinDiagnostics,difficultyTopics:value,weeklyHours}),[examId,twinPriorities,twinAttempts,twinDiagnostics,value,weeklyHours]);

 const save=async()=>{
   if(!selectedDetails.length){setStarted(true);setMsg('Escolha pelo menos um conteúdo específico antes de criar o gêmeo. Ex.: Matemática → função quadrática; Física → MRUV.');return}
   setSaving(true);setMsg('');try{
   if(!supabase)throw new Error();
   const{data}=await supabase.auth.getUser();if(!data.user)throw new Error();
   const{error}=await supabase.from('student_exam_preferences').upsert({user_id:data.user.id,exam_id:examId,difficulty_topics:value,updated_at:new Date().toISOString()},{onConflict:'user_id,exam_id'});if(error)throw error;
   await supabase.from('student_skill_diagnostics').delete().eq('user_id',data.user.id).eq('exam_id',examId).eq('evidence_path','manual_difficulty');
   const exactFocus=selectedDetails.slice(0,12);
   if(exactFocus.length){
     const{error:diagnosticError}=await supabase.from('student_skill_diagnostics').insert(exactFocus.map(item=>({
       user_id:data.user.id,exam_id:examId,skill_code:null,area:item.area,question_text:null,correct:null,confidence:1,
       error_type:'declared_difficulty',error_detail:`Dificuldade declarada: ${item.subject} > ${item.topic}`,
       diagnosis:{source:'manual_difficulty',skill_name:item.topic,subject:item.subject,area:item.area,level:item.level},evidence_path:'manual_difficulty'
     })));
     if(diagnosticError)throw diagnosticError;
   }
   setMsg(`Gêmeo atualizado com ${exactFocus.length} dificuldades específicas. O plano já pode priorizar esses conteúdos.`);
   window.dispatchEvent(new CustomEvent('conectae:difficulties-saved',{detail:{examId,value}}));
   window.dispatchEvent(new CustomEvent('conectae:diagnostic-saved',{detail:{examId,source:'manual_difficulty'}}));
   await refreshTwin();
 }catch{setMsg('Não foi possível salvar agora. Tente novamente.')}finally{setSaving(false)}};
 return <section className="plan6-card span12" style={{overflow:'hidden'}}>
  <div className="plan6-sectionlabel"><BrainCircuit size={14} style={{display:'inline',marginRight:6}}/>Seu gêmeo de estudos</div>
  <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) auto',gap:18,alignItems:'start'}}>
   <div><h2 style={{maxWidth:720}}>O gêmeo precisa saber exatamente onde está a dificuldade, não só a matéria geral.</h2><p style={{maxWidth:800}}>Ele cruza conteúdo específico, intensidade da dificuldade, acertos recentes, tipos de erro e tempo disponível. Quanto mais preciso você for — por exemplo “Matemática → função quadrática” em vez de só “Matemática” — mais útil fica o plano.</p></div>
   {selectedSubjects>0&&<span className="plan6-chip active" style={{whiteSpace:'nowrap'}}><Sparkles size={13}/> {selected} {selected===1?'conteúdo em foco':'conteúdos em foco'}</span>}
  </div>

  <div className="plan6-callout blue" style={{margin:'16px 0'}}>
   <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start',flexWrap:'wrap'}}><div><strong>Leitura por evidências · confiança {twin.evidenceLabel}</strong><p style={{marginTop:5}}>{twinLoading?'Lendo seu histórico...':twin.summary}</p></div><span className="plan6-chip active"><Activity size={13}/>{twin.evidenceScore}% evidência</span></div>
   {!twinLoading&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:8,marginTop:12}}>
    <div style={{border:'1px solid rgba(184,132,8,.18)',borderRadius:12,padding:11}}><div style={{fontSize:11,opacity:.58}}>AMOSTRA MEDIDA</div><b>{twin.measuredAttempts} respostas</b><div style={{fontSize:11,opacity:.65,marginTop:2}}>{twin.measuredSkills} habilidades observadas</div></div>
    <div style={{border:'1px solid rgba(184,132,8,.18)',borderRadius:12,padding:11}}><div style={{fontSize:11,opacity:.58}}>MELHOR RENDIMENTO</div><b>{twin.strongest?.label||'Ainda medindo'}</b><div style={{fontSize:11,opacity:.65,marginTop:2}}>{twin.strongest?`${twin.strongest.correct}/${twin.strongest.attempts} acertos · confiança ${twin.strongest.confidence}`:'Responda mais questões para confirmar'}</div></div>
    <div style={{border:'1px solid rgba(184,132,8,.18)',borderRadius:12,padding:11}}><div style={{fontSize:11,opacity:.58}}>HORAS DISPONÍVEIS</div><b>{weeklyHours}h/semana</b><div style={{fontSize:11,opacity:.65,marginTop:2}}>sincronizado com o plano salvo; o gêmeo redistribui, não inventa horas</div></div>
   </div>}
  </div>

  {!twinLoading&&twin.priorities.length>0&&<div style={{margin:'14px 0 18px'}}>
   <div style={{display:'flex',alignItems:'center',gap:7,fontSize:12,fontWeight:900,marginBottom:8}}><Target size={15}/> Onde focar agora</div>
   <div style={{display:'grid',gap:8}}>{twin.priorities.slice(0,3).map((focus,index)=><div key={focus.key} style={{border:'1px solid rgba(184,132,8,.18)',borderRadius:14,padding:'12px 13px',background:index===0?'rgba(255,212,94,.07)':'rgba(255,250,240,.015)'}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'center',flexWrap:'wrap'}}><b>{index+1}. {focus.label}</b><span className="plan6-chip active"><Clock3 size={12}/>{focus.minutesPerWeek} min/semana</span></div>
    <div style={{fontSize:12,opacity:.68,marginTop:5}}>{focus.evidence}</div>
    <div style={{fontSize:13,lineHeight:1.45,marginTop:8}}><b>Como estudar:</b> {focus.method}</div>
    <div style={{fontSize:12,opacity:.7,marginTop:6}}><b>Quando reduzir o foco:</b> {focus.successCriterion}</div>
   </div>)}</div>
  </div>}

  {!twinLoading&&twin.strongest&&<div style={{display:'flex',gap:10,alignItems:'flex-start',padding:'12px 13px',border:'1px solid rgba(224,170,24,.2)',borderRadius:14,background:'rgba(224,170,24,.035)',marginBottom:16}}><Trophy size={17} style={{flex:'0 0 auto',marginTop:1}}/><div><b>Força a preservar: {twin.strongest.label}</b><div style={{fontSize:12,opacity:.7,marginTop:3}}>Seu melhor resultado medido não deve receber a maior fatia do tempo se outras áreas têm retorno maior. Faça manutenção curta e espaçada para não perder o domínio.</div></div></div>}

  <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:8,margin:'16px 0'}}>
   {[['1','Escolha a matéria'],['2','Marque conteúdos específicos'],['3','Defina a intensidade']].map(([n,label])=><div key={n} style={{border:'1px solid rgba(184,132,8,.16)',borderRadius:12,padding:'10px 12px',background:'rgba(255,250,240,.015)'}}><span style={{fontSize:11,opacity:.55}}>{n}</span><div style={{fontSize:13,fontWeight:700,marginTop:2}}>{label}</div></div>)}
  </div>

  <div className="plan6-callout blue" style={{margin:'4px 0 14px'}}>
   <strong>1. Em qual matéria está a dificuldade?</strong>
   <p style={{marginTop:6}}>A matéria serve só para abrir os conteúdos. O gêmeo não aceita mais uma dificuldade genérica como “Matemática” ou “Biologia”: você precisa indicar o assunto exato.</p>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:8,marginTop:12}}>
    {subjectStats.map(s=><button key={s.subject} type="button" onClick={()=>openSubject(s.subject)} style={{border:`1px solid ${s.marked?'rgba(255,212,94,.55)':'rgba(184,132,8,.16)'}`,borderRadius:14,padding:'12px',background:s.marked?'rgba(255,212,94,.06)':'rgba(255,250,240,.015)',textAlign:'left'}}>
      <b style={{fontSize:13}}>{s.subject}</b><div style={{fontSize:11,opacity:.58,marginTop:3}}>{s.marked?`${s.marked} ${s.marked===1?'conteúdo marcado':'conteúdos marcados'}`:`Abrir ${s.topics.length} conteúdos`}</div>
    </button>)}
   </div>
  </div>

  {!started&&<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:14,flexWrap:'wrap',padding:'14px 0 4px'}}><div><strong>Comece escolhendo uma matéria acima.</strong><p style={{margin:'4px 0 0',fontSize:13,opacity:.72}}>Depois marque exatamente o que pega: “crase”, “MRUV”, “Era Vargas”, “genética mendeliana”, “função quadrática” etc.</p></div><button className="plan6-btn primary" type="button" onClick={()=>setStarted(true)}><BrainCircuit size={15}/>Escolher conteúdos</button></div>}

  {started&&<>
   <div style={{fontSize:12,fontWeight:800,margin:'14px 0 6px'}}>2. Especifique o conteúdo <span style={{opacity:.55,fontWeight:600}}>(obrigatório para o gêmeo)</span></div>
   <label className="plan6-chip" style={{display:'flex',alignItems:'center',gap:8,margin:'8px 0 12px',maxWidth:560,padding:'10px 12px'}}><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Busque: função quadrática, crase, MRUV, genética..." aria-label="Buscar conteúdo de dificuldade" style={{border:0,outline:'none',background:'transparent',width:'100%'}}/></label>
   <div style={{fontSize:12,opacity:.58,marginBottom:8}}>{totalTopics} conteúdos disponíveis · intensidade: 1 atenção · 2 dificuldade · 3 muita dificuldade</div>
   {selectedDetails.length>0&&<div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:12}}>{selectedDetails.slice(0,10).map(item=><span key={item.key} className="plan6-chip active" style={{fontSize:11}}>{item.subject} → {item.topic} · {item.level}</span>)}{selectedDetails.length>10&&<span className="plan6-chip">+{selectedDetails.length-10}</span>}</div>}
   {visibleSubjects.map(s=>{const isOpen=normalized?true:(open[s.subject]??false);const count=s.topics.filter(t=>value[topicKey(s.subject,t)]).length;return <div key={s.subject} style={{borderTop:'1px solid rgba(184,132,8,.14)',padding:'10px 0'}}>
    <button type="button" onClick={()=>!normalized&&setOpen(v=>({...v,[s.subject]:!isOpen}))} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,textAlign:'left'}}><span><b>{s.subject}</b><span style={{opacity:.55,marginLeft:8,fontSize:12}}>{count?`${count} marcados`:`${s.topics.length} conteúdos`}</span></span>{isOpen?<ChevronUp size={17}/>:<ChevronDown size={17}/>}</button>
    {isOpen&&<div style={{display:'grid',gap:8,marginTop:10}}>{s.topics.map(t=>{const key=topicKey(s.subject,t);const level=value[key];return <div key={key} style={{display:'grid',gridTemplateColumns:'1fr auto',gap:10,alignItems:'center',padding:'7px 0'}}><span style={{fontSize:13,lineHeight:1.35}}><b style={{fontWeight:700}}>{s.subject}</b><span style={{opacity:.45}}> → </span>{t}</span><div style={{display:'flex',gap:5}}>{([1,2,3] as DifficultyLevel[]).map(n=><button key={n} type="button" onClick={()=>setLevel(key,n)} aria-label={`${s.subject}, ${t}: dificuldade ${n}`} className={`plan6-chip ${level===n?'active':''}`} style={{minWidth:36,justifyContent:'center'}}>{level===n?<Check size={13}/>:n}</button>)}</div></div>})}</div>}
   </div>})}
   {!visibleSubjects.length&&<div className="plan6-message">Nenhum conteúdo encontrado. Tente outro termo.</div>}
   <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:14,flexWrap:'wrap',marginTop:16,paddingTop:14,borderTop:'1px solid rgba(184,132,8,.14)'}}><div style={{fontSize:12,opacity:.62}}>Base: {catalog.label} · o gêmeo salva matéria + conteúdo + intensidade.</div><button className="plan6-btn primary" onClick={save} disabled={saving||selectedDetails.length===0}><Save size={15}/>{saving?'Salvando...':selectedDetails.length?'Salvar dificuldades específicas':'Escolha um conteúdo'}</button></div>
  </>}
  {msg&&<div className="plan6-message" style={{marginTop:12}}>{msg}</div>}
 </section>;
}
