import { useMemo, useState } from 'react';
import { BrainCircuit, Check, ChevronDown, ChevronUp, Save, Search, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getExamSkillCatalog, topicKey, type DifficultyLevel, type DifficultySelection } from '@/lib/exam-skill-catalog';
import { countGranularTopics, expandStudyCatalog } from '@/lib/granular-study-topics';
import type { ExamId } from '@/lib/exam-models';

export default function DifficultyProfile({examId,course,value,onChange}:{examId:ExamId;course:string;value:DifficultySelection;onChange:(next:DifficultySelection)=>void}){
 const baseCatalog=useMemo(()=>getExamSkillCatalog(examId,course),[examId,course]);
 const catalog=useMemo(()=>expandStudyCatalog(baseCatalog),[baseCatalog]);
 const[open,setOpen]=useState<Record<string,boolean>>({});
 const[query,setQuery]=useState('');
 const[saving,setSaving]=useState(false);
 const[msg,setMsg]=useState('');
 const selected=Object.keys(value).length;
 const totalTopics=countGranularTopics(baseCatalog);
 const normalized=query.trim().toLowerCase();
 const visibleSubjects=useMemo(()=>catalog.subjects.map(s=>({...s,topics:normalized?s.topics.filter(t=>`${s.subject} ${s.area} ${t}`.toLowerCase().includes(normalized)):s.topics})).filter(s=>s.topics.length>0),[catalog,normalized]);
 const setLevel=(key:string,level:DifficultyLevel)=>{const next={...value};if(next[key]===level)delete next[key];else next[key]=level;onChange(next)};
 const save=async()=>{setSaving(true);setMsg('');try{if(!supabase)throw new Error();const{data}=await supabase.auth.getUser();if(!data.user)throw new Error();const{error}=await supabase.from('student_exam_preferences').upsert({user_id:data.user.id,exam_id:examId,difficulty_topics:value,updated_at:new Date().toISOString()},{onConflict:'user_id,exam_id'});if(error)throw error;setMsg('Dificuldades salvas. O plano foi recalculado para priorizar exatamente estes conteúdos.');window.dispatchEvent(new CustomEvent('conectae:difficulties-saved',{detail:{examId,value}}));}catch{setMsg('Não foi possível salvar agora. Tente novamente.')}finally{setSaving(false)}};
 return <section className="plan6-card span12">
  <div className="plan6-sectionlabel"><BrainCircuit size={14} style={{display:'inline',marginRight:6}}/>Mapa de dificuldades</div>
  <h2>Marque exatamente o conteúdo em que você tem dúvida.</h2>
  <p>O mapa agora desce até subtópicos específicos. O plano redistribui o mesmo tempo semanal usando suas marcações, notas, erros recentes e dificuldades detectadas por foto.</p>
  <div className="plan6-callout blue" style={{marginTop:14}}><strong><ShieldCheck size={15} style={{display:'inline',marginRight:7}}/>Base da prova</strong><p>{catalog.label}. A organização parte da referência oficial e detalha os conteúdos em unidades de estudo menores; isso não cria pesos oficiais por tópico.</p><a className="plan6-btn" href={catalog.sourceUrl} target="_blank" rel="noreferrer">Ver fonte oficial</a></div>
  <div style={{display:'flex',gap:8,flexWrap:'wrap',margin:'14px 0'}}><span className="plan6-chip active">{selected} tópicos marcados</span><span className="plan6-chip">{totalTopics} conteúdos disponíveis</span><span className="plan6-chip">1 = atenção</span><span className="plan6-chip">2 = dificuldade</span><span className="plan6-chip">3 = muita dificuldade</span></div>
  <label className="plan6-chip" style={{display:'flex',alignItems:'center',gap:8,marginBottom:12,maxWidth:520}}><Search size={15}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar: crase, MRUV, genética mendeliana, Era Vargas..." aria-label="Buscar conteúdo de dificuldade" style={{border:0,outline:'none',background:'transparent',width:'100%'}}/></label>
  {visibleSubjects.map(s=>{const isOpen=normalized?true:(open[s.subject]??false);const count=s.topics.filter(t=>value[topicKey(s.subject,t)]).length;return <div key={s.subject} style={{borderTop:'1px solid rgba(113,147,198,.18)',padding:'10px 0'}}>
   <button type="button" onClick={()=>!normalized&&setOpen(v=>({...v,[s.subject]:!isOpen}))} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,textAlign:'left'}}><span><b>{s.subject}</b><span style={{opacity:.65,marginLeft:8,fontSize:12}}>{s.area} · {s.topics.length} conteúdos{count?` · ${count} marcados`:''}</span></span>{isOpen?<ChevronUp size={17}/>:<ChevronDown size={17}/>}</button>
   {isOpen&&<div style={{display:'grid',gap:8,marginTop:10}}>{s.topics.map(t=>{const key=topicKey(s.subject,t);const level=value[key];return <div key={key} style={{display:'grid',gridTemplateColumns:'1fr auto',gap:10,alignItems:'center'}}><span style={{fontSize:13,lineHeight:1.35}}>{t}</span><div style={{display:'flex',gap:5}}>{([1,2,3] as DifficultyLevel[]).map(n=><button key={n} type="button" onClick={()=>setLevel(key,n)} aria-label={`${t}: dificuldade ${n}`} className={`plan6-chip ${level===n?'active':''}`} style={{minWidth:36,justifyContent:'center'}}>{level===n?<Check size={13}/>:n}</button>)}</div></div>})}</div>}
  </div>})}
  {!visibleSubjects.length&&<div className="plan6-message">Nenhum conteúdo encontrado. Tente outro termo.</div>}
  <div className="plan6-actions" style={{marginTop:16}}><button className="plan6-btn primary" onClick={save} disabled={saving}><Save size={15}/>{saving?'Salvando...':'Salvar dificuldades e adaptar meu plano'}</button></div>
  {msg&&<div className="plan6-message" style={{marginTop:12}}>{msg}</div>}
 </section>;
}
