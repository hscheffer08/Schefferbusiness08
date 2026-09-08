import { useEffect, useMemo, useState } from 'react';
import { Brain, CheckCircle2, Clock3, Flame, Loader2, Mic2, RefreshCcw, Save, Target, Users, Video } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
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
const twists=[
  'Seu tempo restante foi reduzido em 40%. Reestruture a resposta preservando apenas o essencial.',
  'O avaliador discorda da sua premissa principal. Defenda sua posição sem repetir o argumento inicial.',
  'O orçamento do case caiu pela metade. Adapte sua solução sem abandonar o objetivo central.',
  'Uma nova informação contradiz parte da sua proposta. Explique o que você muda e o que mantém.',
  'Você tem 30 segundos para resumir sua resposta em uma única recomendação e duas evidências.',
  'Outro candidato apresentou uma ideia parecida. Mostre em que sua proposta é diferente e melhor.',
  'O avaliador pede um exemplo concreto imediatamente. Responda sem ganhar tempo com introduções.',
];

export default function PhaseTrainingLab(){
  const{user}=useAuth();
  const[exam,setExam]=useState<'link'|'insper'>('link');
  const[rows,setRows]=useState<Drill[]>([]);
  const[phase,setPhase]=useState('Todas');
  const[active,setActive]=useState<Drill|null>(null);
  const[notes,setNotes]=useState('');
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState('');
  const[secondsLeft,setSecondsLeft]=useState<number|null>(null);
  const[running,setRunning]=useState(false);
  const[twist,setTwist]=useState('');
  const[scores,setScores]=useState<Record<string,number>>({});
  const[saving,setSaving]=useState(false);
  const[saved,setSaved]=useState(false);

  useEffect(()=>{let alive=true;(async()=>{
    if(!supabase){setError('Banco indisponível.');setLoading(false);return}
    const{data,error:loadError}=await supabase.from('admission_phase_drills').select('*').order('exam_id').order('phase').order('id');
    if(!alive)return;
    if(loadError){setError('Não foi possível carregar o laboratório de fases.');setLoading(false);return}
    setRows((data??[]) as Drill[]);setLoading(false);
  })();return()=>{alive=false}},[]);

  useEffect(()=>{
    if(!running||secondsLeft===null||secondsLeft<=0)return;
    const timer=window.setInterval(()=>setSecondsLeft(v=>v===null?null:Math.max(0,v-1)),1000);
    return()=>window.clearInterval(timer);
  },[running,secondsLeft]);
  useEffect(()=>{if(secondsLeft===0)setRunning(false)},[secondsLeft]);

  const examRows=useMemo(()=>rows.filter(r=>r.exam_id===exam),[rows,exam]);
  const phases=useMemo(()=>['Todas',...Array.from(new Set(examRows.map(r=>r.phase)))],[examRows]);
  const filtered=useMemo(()=>phase==='Todas'?examRows:examRows.filter(r=>r.phase===phase),[examRows,phase]);
  const weightedScore=active?Math.round(active.rubric.reduce((sum,r)=>sum+(scores[r.criterion]||0)*r.weight,0)/Math.max(1,active.rubric.reduce((sum,r)=>sum+r.weight,0))*10)/10:0;
  const resetFor=(drill:Drill|null)=>{setActive(drill);setNotes('');setTwist('');setScores({});setSaved(false);setRunning(false);setSecondsLeft(drill?drill.time_limit_minutes*60:null)};
  const pick=()=>{if(!filtered.length)return;resetFor(filtered[Math.floor(Math.random()*filtered.length)])};

  useEffect(()=>{setPhase('Todas');resetFor(null)},[exam]);

  const addPressure=()=>{const options=twists.filter(t=>t!==twist);setTwist(options[Math.floor(Math.random()*options.length)]||twists[0])};
  const formatTime=(s:number|null)=>s===null?'--:--':`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  async function saveAttempt(){
    if(!supabase||!user||!active)return;
    setSaving(true);setSaved(false);
    const elapsed=active.time_limit_minutes*60-(secondsLeft??active.time_limit_minutes*60);
    const{error:saveError}=await supabase.from('student_phase_drill_attempts').insert({
      user_id:user.id,drill_id:active.id,exam_id:active.exam_id,phase:active.phase,competency:active.competency,
      duration_seconds:Math.max(0,elapsed),notes,pressure_twist:twist||null,rubric_scores:scores,weighted_score:weightedScore||null,
    });
    setSaving(false);if(saveError){setError('Não consegui salvar este treino.');return}setSaved(true);
  }

  if(loading)return <section className="plan6-card span12"><Loader2 className="animate-spin"/></section>;
  if(error&&!rows.length)return <section className="plan6-card span12"><strong>{error}</strong></section>;

  return <div className="plan6" style={{paddingBottom:0,background:'transparent'}}>
    <div className="plan6-shell" style={{paddingTop:26,paddingBottom:34}}>
      <section className="plan6-card span12">
        <div className="plan6-sectionlabel">Admissions Pressure Lab</div>
        <h2>Oratória, dinâmica, vídeo, case, entrevista e decisões sob pressão.</h2>
        <p>Treinos autorais separados das questões oficiais. Aqui a ideia é reproduzir o desconforto real das etapas: tempo curto, contra-argumentação, mudança de cenário e avaliação por critérios.</p>
        <div className="plan6-actions" style={{marginTop:14}}>
          <button className={`plan6-btn ${exam==='link'?'primary':''}`} onClick={()=>setExam('link')}>Link School · {rows.filter(r=>r.exam_id==='link').length} treinos</button>
          <button className={`plan6-btn ${exam==='insper'?'primary':''}`} onClick={()=>setExam('insper')}>Insper · {rows.filter(r=>r.exam_id==='insper').length} treinos</button>
        </div>
      </section>

      <section className="plan6-card span12" style={{marginTop:18}}>
        <div className="plan6-sectionlabel">Escolha a etapa</div>
        <div className="plan6-qfilters">{phases.map(p=><button key={p} className={`plan6-chip ${phase===p?'active':''}`} onClick={()=>{setPhase(p);resetFor(null)}}>{p}</button>)}</div>
        <div className="plan6-actions"><button className="plan6-btn primary" onClick={pick}><RefreshCcw size={14}/>Sortear desafio</button><span className="plan6-chip active">{filtered.length} exercícios disponíveis</span></div>
      </section>

      {!active&&<section className="plan6-card span12" style={{marginTop:18}}><div className="plan6-sectionlabel"><Target size={14} style={{display:'inline',marginRight:6}}/>Como usar</div><h2>Treine como se fosse valendo.</h2><p>Escolha uma etapa e inicie um desafio. O cronômetro é interno. No meio, use o modo pressão para receber uma mudança inesperada. No fim, dê notas por critério e salve o treino para acompanhar evolução.</p><div className="plan6-qgrid" style={{marginTop:14}}>{filtered.slice(0,6).map(d=>{const Icon=modeIcon(d.response_mode);return <article key={d.id} className="plan6-qitem" style={{cursor:'pointer'}} onClick={()=>resetFor(d)}><div className="plan6-qtop"><span>{d.phase}</span><span>{d.time_limit_minutes} min</span></div><strong><Icon size={14} style={{display:'inline',marginRight:6}}/>{d.title}</strong><p>{d.competency}</p></article>})}</div></section>}

      {active&&<section className="plan6-card span12" style={{marginTop:18}}>
        <div className="plan6-qtop"><span>{active.phase} · {active.competency}</span><span><Clock3 size={13} style={{display:'inline',marginRight:4}}/>{active.time_limit_minutes} min</span></div>
        <div style={{display:'flex',gap:12,flexWrap:'wrap',justifyContent:'space-between',alignItems:'center'}}><h2>{active.title}</h2><div className="plan6-chip active" style={{fontSize:18,minHeight:46,display:'inline-flex',alignItems:'center'}}>{formatTime(secondsLeft)}</div></div>
        <div className="plan6-actions" style={{marginTop:12}}><button className="plan6-btn primary" onClick={()=>setRunning(v=>!v)}>{running?'Pausar cronômetro':'Iniciar cronômetro'}</button><button className="plan6-btn" onClick={()=>{setSecondsLeft(active.time_limit_minutes*60);setRunning(false)}}>Reiniciar tempo</button><button className="plan6-btn" onClick={addPressure}><Flame size={14}/>Adicionar imprevisto</button></div>
        <div className="plan6-callout blue" style={{marginTop:14}}><strong>Seu desafio</strong><p>{active.prompt}</p></div>
        {twist&&<div className="plan6-callout orange" style={{marginTop:12,borderColor:'rgba(251,191,36,.28)',background:'rgba(251,191,36,.07)'}}><strong><Flame size={15} style={{display:'inline',marginRight:6}}/>Virada de pressão</strong><p>{twist}</p></div>}
        <p><b>Instruções:</b> {active.instructions}</p>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Rascunhe sua estrutura, argumentos, exemplos, resposta ou autoavaliação aqui..." style={{width:'100%',minHeight:150,border:'1px solid rgba(131,171,230,.23)',borderRadius:14,background:'#06152f',color:'#fff',padding:14,outline:'none'}}/>

        <div style={{marginTop:18}}><div className="plan6-sectionlabel">Scorecard da banca</div><div className="plan6-qgrid">{active.rubric.map(r=><div key={r.criterion} className="plan6-qitem" style={{cursor:'default'}}><div className="plan6-qtop"><span>{r.criterion.replaceAll('_',' ')}</span><span>peso {r.weight}%</span></div><strong>{scores[r.criterion]??0}/10</strong><input type="range" min="0" max="10" step="1" value={scores[r.criterion]??0} onChange={e=>setScores(s=>({...s,[r.criterion]:Number(e.target.value)}))} className="plan6-slider"/></div>)}</div><div className="plan6-callout blue" style={{marginTop:14}}><strong>Nota ponderada: {weightedScore}/10</strong><p>É uma autoavaliação estruturada, não uma nota oficial da instituição. O valor fica salvo para comparar seu próprio progresso entre treinos.</p></div></div>

        <div className="plan6-actions" style={{marginTop:16}}><button className="plan6-btn primary" onClick={saveAttempt} disabled={saving}>{saving?<Loader2 size={14} className="animate-spin"/>:<Save size={14}/>}Salvar treino</button><button className="plan6-btn" onClick={pick}><RefreshCcw size={14}/>Próximo desafio</button><button className="plan6-btn" onClick={()=>resetFor(null)}>Voltar aos treinos</button></div>
        {saved&&<div className="plan6-message"><CheckCircle2 size={15} style={{display:'inline',marginRight:6}}/>Treino salvo no seu histórico.</div>}
        {error&&<div className="plan6-message">{error}</div>}
        <div className="plan6-statmeta" style={{marginTop:12}}>Base: {active.source_basis}.</div>
      </section>}
    </div>
  </div>;
}
