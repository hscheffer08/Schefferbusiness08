import { useEffect, useMemo, useState } from 'react';
import { BrainCircuit, Check, ChevronDown, ChevronUp, Save, Search, Sparkles, Target, Trophy, Activity, Clock3 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getExamSkillCatalog, topicKey, type DifficultyLevel, type DifficultySelection } from '@/lib/exam-skill-catalog';
import { countGranularTopics, expandStudyCatalog } from '@/lib/granular-study-topics';
import { buildStudyTwin, type TwinAttempt, type TwinDiagnostic, type TwinPriority } from '@/lib/study-twin-engine';
import type { ExamId } from '@/lib/exam-models';

export default function DifficultyProfile({examId,course,value,onChange}:{examId:ExamId;course:string;value:DifficultySelection;onChange:(next:DifficultySelection)=>void}){
 const baseCatalog=useMemo(()=>getExamSkillCatalog(examId,course),[examId,course]);
 const catalog=useMemo(()=>expandStudyCatalog(baseCatalog),[baseCatalog]);
 const[open,setOpen]=useState<Record<string,boolean>>({});
 const[query,setQuery]=useState('');
 const[started,setStarted]=useState(Object.keys(value).length>0);
 const[saving,setSaving]=useState(false);
 const[msg,setMsg]=useState('');
 const[twinAttempts,setTwinAttempts]=useState<TwinAttempt[]>([]);
 const[twinDiagnostics,setTwinDiagnostics]=useState<TwinDiagnostic[]>([]);
 const[twinHours,setTwinHours]=useState(9);
 const[twinLoading,setTwinLoading]=useState(true);
 const selected=Object.keys(value).length;
 const totalTopics=countGranularTopics(baseCatalog);
 const normalized=query.trim().toLowerCase();
 useEffect(()=>{if(selected>0)setStarted(true)},[selected]);
 const subjectStats=useMemo(()=>catalog.subjects.map(s=>{
   const levels=s.topics.map(t=>value[topicKey(s.subject,t)]??0);
   const marked=levels.filter(Boolean).length;
   const exactLevel=marked===levels.length&&levels.length>0&&levels.every(level=>level===levels[0])?levels[0] as DifficultyLevel:0;
   return{...s,marked,exactLevel};
 }),[catalog,value]);
 const selectedSubjects=subjectStats.filter(s=>s.marked>0).length;
 const visibleSubjects=useMemo(()=>catalog.subjects.map(s=>({...s,topics:normalized?s.topics.filter(t=>`${s.subject} ${s.area} ${t}`.toLowerCase().includes(normalized)):s.topics})).filter(s=>s.topics.length>0),[catalog,normalized]);
 const setLevel=(key:string,level:DifficultyLevel)=>{const next={...value};if(next[key]===level)delete next[key];else next[key]=level;onChange(next)};
 const setSubjectLevel=(subject:string,level:DifficultyLevel)=>{
   const item=catalog.subjects.find(s=>s.subject===subject);if(!item)return;
   const keys=item.topics.map(topic=>topicKey(item.subject,topic));
   const clear=keys.length>0&&keys.every(key=>value[key]===level);
   const next={...value};
   keys.forEach(key=>{if(clear)delete next[key];else next[key]=level});
   onChange(next);setStarted(true);setOpen(v=>({...v,[subject]:true}));setMsg('');
 };
 const selectedDetails=useMemo(()=>catalog.subjects.flatMap(s=>s.topics.map(topic=>({subject:s.subject,area:s.area,topic,key:topicKey(s.subject,topic),level:value[topicKey(s.subject,topic)]??0}))).filter(x=>x.level>0).sort((a,b)=>b.level-a.level||a.topic.localeCompare(b.topic,'pt-BR')),[catalog,value]);

 const refreshTwin=async()=>{
   try{
     if(!supabase){setTwinLoading(false);return}
     const{data:userData}=await supabase.auth.getUser();const user=userData.user;if(!user){setTwinLoading(false);return}
     const[{data:attempts},{data:diagnostics},{data:pref}]=await Promise.all([
       supabase.from('student_practice_attempts').select('exam_id,area,skill_name,correct,created_at,duration_seconds').eq('user_id',user.id).eq('exam_id',examId).order('created_at',{ascending:false}).limit(240),
       supabase.from('student_skill_diagnostics').select('area,skill_code,error_type,created_at,diagnosis').eq('user_id',user.id).eq('exam_id',examId).order('created_at',{ascending:false}).limit(80),
       supabase.from('student_exam_preferences').select('weekly_hours').eq('user_id',user.id).eq('exam_id',examId).maybeSingle(),
     ]);
     setTwinAttempts((attempts??[]) as TwinAttempt[]);setTwinDiagnostics((diagnostics??[]) as TwinDiagnostic[]);if(pref?.weekly_hours)setTwinHours(Number(pref.weekly_hours));
   }finally{setTwinLoading(false)}
 };
 useEffect(()=>{setTwinLoading(true);refreshTwin();const handler=()=>refreshTwin();window.addEventListener('conectae:diagnostic-saved',handler);return()=>window.removeEventListener('conectae:diagnostic-saved',handler)},[examId]);
 const twinPriorities=useMemo<TwinPriority[]>(()=>{
   const areas=Array.from(new Set(catalog.subjects.map(s=>s.area)));
   return areas.map(area=>({metric:{key:area,label:area,max:100,unit:'pontos'},current:0,goal:0,missing:0,score:1,accuracy:null}));
 },[catalog]);
 const twin=useMemo(()=>buildStudyTwin({examId,priorities:twinPriorities,attempts:twinAttempts,diagnostics:twinDiagnostics,difficultyTopics:value,weeklyHours:twinHours}),[examId,twinPriorities,twinAttempts,twinDiagnostics,value,twinHours]);

 const save=async()=>{setSaving(true);setMsg('');try{
   if(!supabase)throw new Error();
   const{data}=await supabase.auth.getUser();if(!data.user)throw new Error();
   const{error}=await supabase.from('student_exam_preferences').upsert({user_id:data.user.id,exam_id:examId,difficulty_topics:value,updated_at:new Date().toISOString()},{onConflict:'user_id,exam_id'});if(error)throw error;
   await supabase.from('student_skill_diagnostics').delete().eq('user_id',data.user.id).eq('exam_id',examId).eq('evidence_path','manual_difficulty');
   const exactFocus=selectedDetails.slice(0,8);
   if(exactFocus.length){
     const{error:diagnosticError}=await supabase.from('student_skill_diagnostics').insert(exactFocus.map(item=>({
       user_id:data.user.id,exam_id:examId,skill_code:null,area:item.area,question_text:null,correct:null,confidence:1,
       error_type:'declared_difficulty',error_detail:`Dificuldade declarada: ${item.topic}`,
       diagnosis:{source:'manual_difficulty',skill_name:item.topic,subject:item.subject,level:item.level},evidence_path:'manual_difficulty'
     })));
     if(diagnosticError)throw diagnosticError;
   }
   setMsg(exactFocus.length?`Gêmeo atualizado com ${exactFocus.length} prioridades. O plano já pode usar esses pontos.`:'Gêmeo atualizado. Você pode voltar aqui quando descobrir novas dificuldades.');
   window.dispatchEvent(new CustomEvent('conectae:difficulties-saved',{detail:{examId,value}}));
   window.dispatchEvent(new CustomEvent('conectae:diagnostic-saved',{detail:{examId,source:'manual_difficulty'}}));
   await refreshTwin();
 }catch{setMsg('Não foi possível salvar agora. Tente novamente.')}finally{setSaving(false)}};
 return <section className="plan6-card span12" style={{overflow:'hidden'}}>
  <div className="plan6-sectionlabel"><BrainCircuit size={14} style={{display:'inline',marginRight:6}}/>Seu gêmeo de estudos</div>
  <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) auto',gap:18,alignItems:'start'}}>
   <div><h2 style={{maxWidth:720}}>O gêmeo não olha só o que você diz que é difícil. Ele compara o que você sente com o que você realmente rende.</h2><p style={{maxWidth:800}}>Ele cruza dificuldades declaradas, acertos recentes, quantidade de evidências, tipos de erro e tempo disponível. Conforme você responde questões, ele identifica forças, prioridades, onde ainda falta medir e qual método tende a dar mais retorno.</p></div>
   {selectedSubjects>0&&<span className="plan6-chip active" style={{whiteSpace:'nowrap'}}><Sparkles size={13}/> {selectedSubjects} {selectedSubjects===1?'matéria em foco':'matérias em foco'}</span>}
  </div>

  <div className="plan6-callout blue" style={{margin:'16px 0'}}>
   <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start',flexWrap:'wrap'}}><div><strong>Leitura por evidências · confiança {twin.evidenceLabel}</strong><p style={{marginTop:5}}>{twinLoading?'Lendo seu histórico...':twin.summary}</p></div><span className="plan6-chip active"><Activity size={13}/>{twin.evidenceScore}% evidência</span></div>
   {!twinLoading&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))',gap:8,marginTop:12}}>
    <div style={{border:'1px solid rgba(113,147,198,.18)',borderRadius:12,padding:11}}><div style={{fontSize:11,opacity:.58}}>AMOSTRA MEDIDA</div><b>{twin.measuredAttempts} respostas</b><div style={{fontSize:11,opacity:.65,marginTop:2}}>{twin.measuredSkills} habilidades observadas</div></div>
    <div style={{border:'1px solid rgba(113,147,198,.18)',borderRadius:12,padding:11}}><div style={{fontSize:11,opacity:.58}}>MELHOR RENDIMENTO</div><b>{twin.strongest?.label||'Ainda medindo'}</b><div style={{fontSize:11,opacity:.65,marginTop:2}}>{twin.strongest?`${twin.strongest.correct}/${twin.strongest.attempts} acertos · confiança ${twin.strongest.confidence}`:'Responda mais questões para confirmar'}</div></div>
    <div style={{border:'1px solid rgba(113,147,198,.18)',borderRadius:12,padding:11}}><div style={{fontSize:11,opacity:.58}}>HORAS DISPONÍVEIS</div><b>{twinHours}h/semana</b><div style={{fontSize:11,opacity:.65,marginTop:2}}>o gêmeo redistribui, não inventa horas</div></div>
   </div>}
  </div>

  {!twinLoading&&twin.priorities.length>0&&<div style={{margin:'14px 0 18px'}}>
   <div style={{display:'flex',alignItems:'center',gap:7,fontSize:12,fontWeight:900,marginBottom:8}}><Target size={15}/> Onde focar agora</div>
   <div style={{display:'grid',gap:8}}>{twin.priorities.slice(0,3).map((focus,index)=><div key={focus.key} style={{border:'1px solid rgba(113,147,198,.18)',borderRadius:14,padding:'12px 13px',background:index===0?'rgba(36,108,255,.07)':'rgba(255,255,255,.015)'}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'center',flexWrap:'wrap'}}><b>{index+1}. {focus.label}</b><span className="plan6-chip active"><Clock3 size={12}/>{focus.minutesPerWeek} min/semana</span></div>
    <div style={{fontSize:12,opacity:.68,marginTop:5}}>{focus.evidence}</div>
    <div style={{fontSize:13,lineHeight:1.45,marginTop:8}}><b>Como estudar:</b> {focus.method}</div>
    <div style={{fontSize:12,opacity:.7,marginTop:6}}><b>Quando reduzir o foco:</b> {focus.successCriterion}</div>
   </div>)}</div>
  </div>}

  {!twinLoading&&twin.strongest&&<div style={{display:'flex',gap:10,alignItems:'flex-start',padding:'12px 13px',border:'1px solid rgba(70,200,140,.2)',borderRadius:14,background:'rgba(70,200,140,.035)',marginBottom:16}}><Trophy size={17} style={{flex:'0 0 auto',marginTop:1}}/><div><b>Força a preservar: {twin.strongest.label}</b><div style={{fontSize:12,opacity:.7,marginTop:3}}>Seu melhor resultado medido não deve receber a maior fatia do tempo se outras áreas têm retorno maior. Faça manutenção curta e espaçada para não perder o domínio.</div></div></div>}

  <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:8,margin:'16px 0'}}>
   {[['1','Escolha as matérias'],['2','Refine os conteúdos'],['3','Salve e adapte o plano']].map(([n,label])=><div key={n} style={{border:'1px solid rgba(113,147,198,.16)',borderRadius:12,padding:'10px 12px',background:'rgba(255,255,255,.015)'}}><span style={{fontSize:11,opacity:.55}}>{n}</span><div style={{fontSize:13,fontWeight:700,marginTop:2}}>{label}</div></div>)}
  </div>

  <div className="plan6-callout blue" style={{margin:'4px 0 14px'}}>
   <strong>Quais matérias são mais difíceis para você?</strong>
   <p style={{marginTop:6}}>Marque a matéria inteira: <b>1</b> atenção, <b>2</b> dificuldade, <b>3</b> muita dificuldade. O gêmeo cruza essa percepção com seu desempenho medido; ela não substitui os dados de questões.</p>
   <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:8,marginTop:12}}>
    {subjectStats.map(s=><div key={s.subject} style={{border:`1px solid ${s.marked?'rgba(114,165,255,.55)':'rgba(113,147,198,.16)'}`,borderRadius:14,padding:'11px 12px',background:s.marked?'rgba(36,108,255,.06)':'rgba(255,255,255,.015)'}}>
      <button type="button" onClick={()=>{setStarted(true);setOpen(v=>({...v,[s.subject]:true}))}} style={{display:'block',width:'100%',textAlign:'left'}}><b style={{fontSize:13}}>{s.subject}</b><div style={{fontSize:11,opacity:.58,marginTop:3}}>{s.marked?s.exactLevel?`Matéria inteira · nível ${s.exactLevel}`:`${s.marked} conteúdos ajustados`:'Ainda não marcada'}</div></button>
      <div style={{display:'flex',gap:5,marginTop:9}}>{([1,2,3] as DifficultyLevel[]).map(n=><button key={n} type="button" onClick={()=>setSubjectLevel(s.subject,n)} aria-label={`${s.subject}: dificuldade ${n}`} className={`plan6-chip ${s.exactLevel===n?'active':''}`} style={{minWidth:38,justifyContent:'center'}}>{s.exactLevel===n?<Check size={13}/>:n}</button>)}</div>
    </div>)}
   </div>
  </div>

  {!started&&<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:14,flexWrap:'wrap',padding:'14px 0 4px'}}><div><strong>Comece pelo que você já sabe que é difícil.</strong><p style={{margin:'4px 0 0',fontSize:13,opacity:.72}}>Você pode marcar uma matéria inteira acima ou ir direto para “crase”, “MRUV”, “Era Vargas”, “genética mendeliana” e outros pontos específicos.</p></div><button className="plan6-btn primary" type="button" onClick={()=>setStarted(true)}><BrainCircuit size={15}/>Criar meu gêmeo</button></div>}

  {started&&<>
   <div style={{fontSize:12,fontWeight:800,margin:'14px 0 6px'}}>Refinar por conteúdo <span style={{opacity:.55,fontWeight:600}}>(opcional)</span></div>
   <label className="plan6-chip" style={{display:'flex',alignItems:'center',gap:8,margin:'8px 0 12px',maxWidth:560,padding:'10px 12px'}}><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Busque um conteúdo: crase, MRUV, genética..." aria-label="Buscar conteúdo de dificuldade" style={{border:0,outline:'none',background:'transparent',width:'100%'}}/></label>
   <div style={{fontSize:12,opacity:.58,marginBottom:8}}>{totalTopics} conteúdos disponíveis · 1 atenção · 2 dificuldade · 3 muita dificuldade</div>
   {visibleSubjects.map(s=>{const isOpen=normalized?true:(open[s.subject]??false);const count=s.topics.filter(t=>value[topicKey(s.subject,t)]).length;return <div key={s.subject} style={{borderTop:'1px solid rgba(113,147,198,.14)',padding:'10px 0'}}>
    <button type="button" onClick={()=>!normalized&&setOpen(v=>({...v,[s.subject]:!isOpen}))} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,textAlign:'left'}}><span><b>{s.subject}</b><span style={{opacity:.55,marginLeft:8,fontSize:12}}>{count?`${count} marcados`:`${s.topics.length} conteúdos`}</span></span>{isOpen?<ChevronUp size={17}/>:<ChevronDown size={17}/>}</button>
    {isOpen&&<div style={{display:'grid',gap:8,marginTop:10}}>{s.topics.map(t=>{const key=topicKey(s.subject,t);const level=value[key];return <div key={key} style={{display:'grid',gridTemplateColumns:'1fr auto',gap:10,alignItems:'center',padding:'7px 0'}}><span style={{fontSize:13,lineHeight:1.35}}>{t}</span><div style={{display:'flex',gap:5}}>{([1,2,3] as DifficultyLevel[]).map(n=><button key={n} type="button" onClick={()=>setLevel(key,n)} aria-label={`${t}: dificuldade ${n}`} className={`plan6-chip ${level===n?'active':''}`} style={{minWidth:36,justifyContent:'center'}}>{level===n?<Check size={13}/>:n}</button>)}</div></div>})}</div>}
   </div>})}
   {!visibleSubjects.length&&<div className="plan6-message">Nenhum conteúdo encontrado. Tente outro termo.</div>}
   <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:14,flexWrap:'wrap',marginTop:16,paddingTop:14,borderTop:'1px solid rgba(113,147,198,.14)'}}><div style={{fontSize:12,opacity:.62}}>Base: {catalog.label} · organizada a partir da referência oficial da prova.</div><button className="plan6-btn primary" onClick={save} disabled={saving}><Save size={15}/>{saving?'Salvando...':'Salvar e atualizar meu gêmeo'}</button></div>
  </>}
  {msg&&<div className="plan6-message" style={{marginTop:12}}>{msg}</div>}
 </section>;
}