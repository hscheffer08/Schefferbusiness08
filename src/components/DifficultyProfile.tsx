import { useEffect, useMemo, useState } from 'react';
import { BrainCircuit, Check, ChevronDown, ChevronUp, Save, Search, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getExamSkillCatalog, topicKey, type DifficultyLevel, type DifficultySelection } from '@/lib/exam-skill-catalog';
import { countGranularTopics, expandStudyCatalog } from '@/lib/granular-study-topics';
import type { ExamId } from '@/lib/exam-models';

export default function DifficultyProfile({examId,course,value,onChange}:{examId:ExamId;course:string;value:DifficultySelection;onChange:(next:DifficultySelection)=>void}){
 const baseCatalog=useMemo(()=>getExamSkillCatalog(examId,course),[examId,course]);
 const catalog=useMemo(()=>expandStudyCatalog(baseCatalog),[baseCatalog]);
 const[open,setOpen]=useState<Record<string,boolean>>({});
 const[query,setQuery]=useState('');
 const[started,setStarted]=useState(Object.keys(value).length>0);
 const[saving,setSaving]=useState(false);
 const[msg,setMsg]=useState('');
 const selected=Object.keys(value).length;
 const totalTopics=countGranularTopics(baseCatalog);
 const normalized=query.trim().toLowerCase();
 useEffect(()=>{if(selected>0)setStarted(true)},[selected]);
 const visibleSubjects=useMemo(()=>catalog.subjects.map(s=>({...s,topics:normalized?s.topics.filter(t=>`${s.subject} ${s.area} ${t}`.toLowerCase().includes(normalized)):s.topics})).filter(s=>s.topics.length>0),[catalog,normalized]);
 const setLevel=(key:string,level:DifficultyLevel)=>{const next={...value};if(next[key]===level)delete next[key];else next[key]=level;onChange(next)};
 const selectedDetails=useMemo(()=>catalog.subjects.flatMap(s=>s.topics.map(topic=>({subject:s.subject,area:s.area,topic,key:topicKey(s.subject,topic),level:value[topicKey(s.subject,topic)]??0}))).filter(x=>x.level>0).sort((a,b)=>b.level-a.level||a.topic.localeCompare(b.topic,'pt-BR')),[catalog,value]);
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
 }catch{setMsg('Não foi possível salvar agora. Tente novamente.')}finally{setSaving(false)}};
 return <section className="plan6-card span12" style={{overflow:'hidden'}}>
  <div className="plan6-sectionlabel"><BrainCircuit size={14} style={{display:'inline',marginRight:6}}/>Seu gêmeo de estudos</div>
  <div style={{display:'grid',gridTemplateColumns:'minmax(0,1fr) auto',gap:18,alignItems:'start'}}>
   <div><h2 style={{maxWidth:680}}>Diga onde você trava. O gêmeo monta o foco do plano.</h2><p style={{maxWidth:760}}>Você não precisa enviar prova, gabarito ou respostas. Só sinalize os conteúdos em que sente dúvida e o nível de dificuldade.</p></div>
   {selected>0&&<span className="plan6-chip active" style={{whiteSpace:'nowrap'}}><Sparkles size={13}/> {selected} marcados</span>}
  </div>

  <div style={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:8,margin:'16px 0'}}>
   {[['1','Escolha a matéria'],['2','Marque suas dúvidas'],['3','Salve e adapte o plano']].map(([n,label])=><div key={n} style={{border:'1px solid rgba(113,147,198,.16)',borderRadius:12,padding:'10px 12px',background:'rgba(255,255,255,.015)'}}><span style={{fontSize:11,opacity:.55}}>{n}</span><div style={{fontSize:13,fontWeight:700,marginTop:2}}>{label}</div></div>)}
  </div>

  {!started&&<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:14,flexWrap:'wrap',padding:'14px 0 4px'}}><div><strong>Comece pelo que você já sabe que é difícil.</strong><p style={{margin:'4px 0 0',fontSize:13,opacity:.72}}>Pode ser “crase”, “MRUV”, “Era Vargas”, “genética mendeliana” ou qualquer outro ponto específico.</p></div><button className="plan6-btn primary" type="button" onClick={()=>setStarted(true)}><BrainCircuit size={15}/>Criar meu gêmeo</button></div>}

  {started&&<>
   <label className="plan6-chip" style={{display:'flex',alignItems:'center',gap:8,margin:'12px 0',maxWidth:560,padding:'10px 12px'}}><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Busque um conteúdo: crase, MRUV, genética..." aria-label="Buscar conteúdo de dificuldade" style={{border:0,outline:'none',background:'transparent',width:'100%'}}/></label>
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
