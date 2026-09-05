import { useEffect, useMemo, useState } from 'react';
import { Brain, Clock3, Loader2, Mic2, RefreshCcw, Target, Users, Video } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import './admissions-planner-v6.css';

type Drill={
  id:number;
  exam_id:'link'|'insper';
  phase:string;
  competency:string;
  title:string;
  prompt:string;
  instructions:string;
  rubric:{criterion:string;weight:number}[];
  time_limit_minutes:number;
  response_mode:string;
  source_basis:string;
};

const modeIcon=(mode:string)=>mode==='group'?Users:mode==='video'?Video:mode==='oral'?Mic2:Brain;

export default function PhaseTrainingLab(){
  const[exam,setExam]=useState<'link'|'insper'>('link');
  const[rows,setRows]=useState<Drill[]>([]);
  const[phase,setPhase]=useState('Todas');
  const[active,setActive]=useState<Drill|null>(null);
  const[notes,setNotes]=useState('');
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState('');

  useEffect(()=>{let alive=true;(async()=>{
    if(!supabase){setError('Banco indisponível.');setLoading(false);return}
    const{data,error:loadError}=await supabase.from('admission_phase_drills').select('*').order('exam_id').order('phase').order('id');
    if(!alive)return;
    if(loadError){setError('Não foi possível carregar o laboratório de fases.');setLoading(false);return}
    setRows((data??[]) as Drill[]);setLoading(false);
  })();return()=>{alive=false}},[]);

  const examRows=useMemo(()=>rows.filter(r=>r.exam_id===exam),[rows,exam]);
  const phases=useMemo(()=>['Todas',...Array.from(new Set(examRows.map(r=>r.phase)))],[examRows]);
  const filtered=useMemo(()=>phase==='Todas'?examRows:examRows.filter(r=>r.phase===phase),[examRows,phase]);
  const pick=()=>{if(!filtered.length)return;const next=filtered[Math.floor(Math.random()*filtered.length)];setActive(next);setNotes('')};

  useEffect(()=>{setPhase('Todas');setActive(null);setNotes('')},[exam]);

  if(loading)return <section className="plan6-card span12"><Loader2 className="animate-spin"/></section>;
  if(error)return <section className="plan6-card span12"><strong>{error}</strong></section>;

  return <div className="plan6" style={{paddingBottom:0,background:'transparent'}}>
    <div className="plan6-shell" style={{paddingTop:26,paddingBottom:34}}>
      <section className="plan6-card span12">
        <div className="plan6-sectionlabel">Laboratório das outras fases</div>
        <h2>Oratória, dinâmica, vídeo, case, entrevista e desafios.</h2>
        <p>Treinos autorais separados das questões oficiais. O objetivo é praticar as habilidades cobradas nas etapas públicas de Link e Insper sem fingir que estes exercícios são itens oficiais.</p>
        <div className="plan6-actions" style={{marginTop:14}}>
          <button className={`plan6-btn ${exam==='link'?'primary':''}`} onClick={()=>setExam('link')}>Link School · {rows.filter(r=>r.exam_id==='link').length} treinos</button>
          <button className={`plan6-btn ${exam==='insper'?'primary':''}`} onClick={()=>setExam('insper')}>Insper · {rows.filter(r=>r.exam_id==='insper').length} treinos</button>
        </div>
      </section>

      <section className="plan6-card span12" style={{marginTop:18}}>
        <div className="plan6-sectionlabel">Escolha a etapa</div>
        <div className="plan6-qfilters">{phases.map(p=><button key={p} className={`plan6-chip ${phase===p?'active':''}`} onClick={()=>{setPhase(p);setActive(null)}}>{p}</button>)}</div>
        <div className="plan6-actions"><button className="plan6-btn primary" onClick={pick}><RefreshCcw size={14}/>Sortear desafio</button><span className="plan6-chip active">{filtered.length} exercícios disponíveis</span></div>
      </section>

      {!active&&<section className="plan6-card span12" style={{marginTop:18}}><div className="plan6-sectionlabel"><Target size={14} style={{display:'inline',marginRight:6}}/>Como usar</div><h2>Treine como se fosse valendo.</h2><p>Escolha uma etapa, sorteie um desafio, ligue um cronômetro e responda sem consultar roteiro. Depois compare sua entrega com a rubrica.</p><div className="plan6-qgrid" style={{marginTop:14}}>{filtered.slice(0,6).map(d=>{const Icon=modeIcon(d.response_mode);return <article key={d.id} className="plan6-qitem" style={{cursor:'pointer'}} onClick={()=>{setActive(d);setNotes('')}}><div className="plan6-qtop"><span>{d.phase}</span><span>{d.time_limit_minutes} min</span></div><strong><Icon size={14} style={{display:'inline',marginRight:6}}/>{d.title}</strong><p>{d.competency}</p></article>})}</div></section>}

      {active&&<section className="plan6-card span12" style={{marginTop:18}}>
        <div className="plan6-qtop"><span>{active.phase} · {active.competency}</span><span><Clock3 size={13} style={{display:'inline',marginRight:4}}/>{active.time_limit_minutes} min</span></div>
        <h2>{active.title}</h2>
        <div className="plan6-callout blue" style={{marginTop:14}}><strong>Seu desafio</strong><p>{active.prompt}</p></div>
        <p><b>Instruções:</b> {active.instructions}</p>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Rascunhe sua estrutura, argumentos, exemplos ou autoavaliação aqui..." style={{width:'100%',minHeight:150,border:'1px solid rgba(131,171,230,.23)',borderRadius:14,background:'#06152f',color:'#fff',padding:14,outline:'none'}}/>
        <div className="plan6-strengths" style={{marginTop:14}}>{active.rubric.map(r=><span key={r.criterion} className="plan6-chip active">{r.criterion.replaceAll('_',' ')} · {r.weight}%</span>)}</div>
        <div className="plan6-actions" style={{marginTop:16}}><button className="plan6-btn primary" onClick={pick}><RefreshCcw size={14}/>Próximo desafio</button><button className="plan6-btn" onClick={()=>{setActive(null);setNotes('')}}>Voltar aos treinos</button></div>
        <div className="plan6-statmeta" style={{marginTop:12}}>Base: {active.source_basis}.</div>
      </section>}
    </div>
  </div>;
}
