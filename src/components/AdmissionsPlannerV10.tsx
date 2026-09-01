import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, CalendarDays, CheckCircle2, ExternalLink, Home, Loader2, Minus, PlayCircle, Plus, Save, Target, Trophy, Video, X, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getExamModel, isSupportedInstitutionCourse, type ExamMetric } from '@/lib/exam-models';
import { buildRoadmap } from '@/lib/admissions-roadmap';
import './admissions-planner-v6.css';

type Tab='hoje'|'plano'|'questoes'|'prova';
type AcademicArea={area_id:string;name:string;courses:string};
type University={area_university_id:number;area_id:string;university_name:string;course_label:string};
type Question={id:number;exam_id:string;area:string;skill_name:string;difficulty:number;prompt:string;option_a:string|null;option_b:string|null;option_c:string|null;option_d:string|null;option_e:string|null;correct_option:string|null;explanation:string|null};
type Attempt={exam_id:string;area:string;skill_name:string|null;correct:boolean|null;created_at:string};
type Priority={metric:ExamMetric;current:number;goal:number;missing:number;score:number;accuracy:number|null};

const RETAINED=new Set(['UFMG','USP','Faculdade Ciências Médicas de Minas Gerais','Insper','Link School of Business']);
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
const fmtDate=(iso:string)=>new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(`${iso}T12:00:00-03:00`));

function matchQuestionArea(area:string,key:string){
  const a=normalize(area),k=normalize(key.replace('2ª fase — ','').replace('2a fase — ',''));
  if(a===k||a.includes(k)||k.includes(a))return true;
  if(k==='natureza')return ['natureza','biologia','fisica','quimica'].some(x=>a.includes(x));
  if(k==='humanas'||k==='conhecimentos gerais')return ['humanas','historia','geografia','filosofia','sociologia','conhecimentos gerais'].some(x=>a.includes(x));
  if(k==='linguagens')return ['linguagens','portugues','literatura','ingles'].some(x=>a.includes(x));
  if(k==='1ª fase')return true;
  if(k==='oral')return a.includes('comunicacao')||a.includes('entrevista');
  if(k==='portfolio')return a.includes('prep')||a.includes('portfolio');
  if(k==='escrita')return a.includes('business case')||a.includes('sprint')||a.includes('escrita');
  if(k==='matematica'&&(a.includes('sprint')||a.includes('matematica')))return true;
  return false;
}

function goalFor(metric:ExamMetric,examId:string){
  if(examId==='enem')return metric.key==='Redação'?820:32;
  if(examId==='cmmg'){
    if(metric.key==='Redação')return Math.round(metric.max*.8);
    const pct:Record<string,number>={'Língua Portuguesa':.78,'Literatura':.75,'Inglês':.78,'Biologia':.82,'Física':.75,'Química':.8,'Matemática':.8,'Linguagens':.8,'Conhecimentos Gerais':.75,'Humanas':.75};
    return Math.max(1,Math.round(metric.max*(pct[metric.key]??.78)));
  }
  if(examId==='insper')return metric.key==='Redação'?75:12;
  if(examId==='fuvest'){
    if(metric.key==='1ª fase')return 64;
    if(metric.key==='Português'||metric.key==='Redação')return 36;
    return 72;
  }
  const link:Record<string,number>={'Matemática':75,'Business Case':82,'Escrita':80,'Oral':80,'Portfólio':78,'Entrevista':80};
  return link[metric.key]??78;
}

export default function AdmissionsPlannerV10({onBack}:{onBack:()=>void}){
  const[loading,setLoading]=useState(true);
  const[areas,setAreas]=useState<AcademicArea[]>([]);
  const[universities,setUniversities]=useState<University[]>([]);
  const[questions,setQuestions]=useState<Question[]>([]);
  const[attempts,setAttempts]=useState<Attempt[]>([]);
  const[selectedArea,setSelectedArea]=useState('');
  const[selectedUniversity,setSelectedUniversity]=useState('');
  const[values,setValues]=useState<Record<string,number>>({});
  const[weeklyHours,setWeeklyHours]=useState(9);
  const[tab,setTab]=useState<Tab>('hoje');
  const[message,setMessage]=useState('');
  const[saving,setSaving]=useState(false);
  const[questionArea,setQuestionArea]=useState('Todas');
  const[activeQuestion,setActiveQuestion]=useState<Question|null>(null);
  const[selectedOption,setSelectedOption]=useState('');
  const[practiceResult,setPracticeResult]=useState<boolean|null>(null);
  const[questionStartedAt,setQuestionStartedAt]=useState<number|null>(null);

  useEffect(()=>{let alive=true;(async()=>{
    if(!supabase){setLoading(false);return}
    const[{data:a},{data:u},{data:q},{data:userData}]=await Promise.all([
      supabase.from('academic_areas').select('area_id,name,courses').order('name'),
      supabase.from('area_universities').select('area_university_id,area_id,university_name,course_label').order('university_name'),
      supabase.from('exam_practice_questions').select('*').eq('active',true),
      supabase.auth.getUser(),
    ]);
    if(!alive)return;
    const cleanUniversities=((u??[]) as University[]).filter(x=>RETAINED.has(x.university_name)&&isSupportedInstitutionCourse(x.university_name,x.course_label));
    const cleanAreas=((a??[]) as AcademicArea[]).filter(ar=>cleanUniversities.some(x=>x.area_id===ar.area_id));
    setAreas(cleanAreas);setUniversities(cleanUniversities);setQuestions((q??[]) as Question[]);
    const user=userData.user;
    if(user){
      const[{data:pref},{data:at}]=await Promise.all([
        supabase.from('student_exam_preferences').select('*').eq('user_id',user.id).order('updated_at',{ascending:false}).limit(1).maybeSingle(),
        supabase.from('student_practice_attempts').select('exam_id,area,skill_name,correct,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(400),
      ]);
      setAttempts((at??[]) as Attempt[]);
      const desiredArea=pref?.selected_area_id&&cleanAreas.some(x=>x.area_id===pref.selected_area_id)?pref.selected_area_id:cleanAreas[0]?.area_id??'';
      setSelectedArea(desiredArea);
      const allowed=cleanUniversities.filter(x=>x.area_id===desiredArea);
      const desiredUniversity=pref?.selected_university_id&&allowed.some(x=>x.area_university_id===pref.selected_university_id)?String(pref.selected_university_id):String(allowed[0]?.area_university_id??'');
      setSelectedUniversity(desiredUniversity);setWeeklyHours(Number(pref?.weekly_hours??9));
    }else{
      const first=cleanAreas[0]?.area_id??'';setSelectedArea(first);setSelectedUniversity(String(cleanUniversities.find(x=>x.area_id===first)?.area_university_id??''));
    }
    setLoading(false);
  })();return()=>{alive=false}},[]);

  const filteredUniversities=useMemo(()=>universities.filter(u=>u.area_id===selectedArea),[universities,selectedArea]);
  useEffect(()=>{if(filteredUniversities.length&&!filteredUniversities.some(u=>String(u.area_university_id)===selectedUniversity))setSelectedUniversity(String(filteredUniversities[0].area_university_id))},[filteredUniversities,selectedUniversity]);
  const university=filteredUniversities.find(u=>String(u.area_university_id)===selectedUniversity)??null;
  const area=areas.find(a=>a.area_id===selectedArea)??null;
  const course=university?.course_label||area?.courses||area?.name||'Curso';
  const model=useMemo(()=>getExamModel(university?.university_name??'UFMG',course),[university?.university_name,course]);
  const metrics=model.metrics;
  const scoreStorageKey=useMemo(()=>`conectae:exam-values:${model.examId}:${university?.university_name??'sem-faculdade'}:${course}`,[model.examId,university?.university_name,course]);

  useEffect(()=>{
    const defaults=Object.fromEntries(metrics.map(m=>[m.key,m.defaultValue]));
    try{Object.assign(defaults,JSON.parse(localStorage.getItem(scoreStorageKey)||'{}'))}catch{}
    setValues(defaults);setQuestionArea('Todas');setActiveQuestion(null);setSelectedOption('');setPracticeResult(null);
  },[scoreStorageKey]);
  useEffect(()=>{if(Object.keys(values).length)localStorage.setItem(scoreStorageKey,JSON.stringify(values))},[values,scoreStorageKey]);

  const allowedQuestions=useMemo(()=>questions.filter(q=>q.exam_id===model.examId&&model.allowedQuestionAreas.some(a=>normalize(a)===normalize(q.area)||matchQuestionArea(q.area,a))),[questions,model]);
  const examAreas=['Todas',...Array.from(new Set(allowedQuestions.map(q=>q.area)))];
  const filteredQuestions=questionArea==='Todas'?allowedQuestions:allowedQuestions.filter(q=>q.area===questionArea);

  const diagnosis:Priority[]=useMemo(()=>metrics.map(metric=>{
    const current=values[metric.key]??metric.defaultValue;
    const goal=goalFor(metric,model.examId);
    const relevant=attempts.filter(a=>a.exam_id===model.examId&&matchQuestionArea(a.area,metric.key)&&a.correct!==null).slice(0,40);
    const accuracy=relevant.length?relevant.filter(x=>x.correct).length/relevant.length:null;
    const missing=Math.max(0,goal-current);
    const score=(missing/Math.max(1,metric.max))*(accuracy==null?1:accuracy<.6?1.25:accuracy>.85?.8:1);
    return{metric,current,goal,missing,score,accuracy};
  }),[metrics,values,attempts,model.examId]);
  const priorities=useMemo(()=>[...diagnosis].sort((a,b)=>b.score-a.score),[diagnosis]);
  const readiness=Math.round(diagnosis.reduce((s,p)=>s+Math.min(1,p.current/Math.max(1,p.goal)),0)/Math.max(1,diagnosis.length)*100);
  const top=priorities[0];
  const recent=attempts.filter(a=>a.exam_id===model.examId&&a.correct!==null).slice(0,100);
  const recentAccuracy=recent.length?Math.round(recent.filter(a=>a.correct).length/recent.length*100):null;
  const roadmap=useMemo(()=>buildRoadmap({model,course,priorities,weeklyHours,questions:allowedQuestions}),[model,course,priorities,weeklyHours,allowedQuestions]);

  const updateScore=(m:ExamMetric,n:number)=>setValues(v=>({...v,[m.key]:clamp(Math.round(Number.isFinite(n)?n:0),0,m.max)}));
  const save=async()=>{setSaving(true);setMessage('');try{if(!supabase)throw new Error();const{data}=await supabase.auth.getUser();if(!data.user)throw new Error();const{error}=await supabase.from('student_exam_preferences').upsert({user_id:data.user.id,exam_id:model.examId,weekly_hours:weeklyHours,current_scores:values,selected_area_id:selectedArea,selected_university_id:selectedUniversity?Number(selectedUniversity):null,course_label:course,updated_at:new Date().toISOString()},{onConflict:'user_id,exam_id'});if(error)throw error;setMessage('Plano, curso e desempenho salvos.')}catch{setMessage('Não foi possível sincronizar agora.')}finally{setSaving(false)}};
  const openQuestion=(q?:Question)=>{const next=q??filteredQuestions[Math.floor(Math.random()*Math.max(1,filteredQuestions.length))]??allowedQuestions[0];setActiveQuestion(next??null);setSelectedOption('');setPracticeResult(null);setQuestionStartedAt(Date.now())};
  const openWeekQuestions=(focus:string,ids:number[])=>{const exact=allowedQuestions.filter(q=>ids.includes(q.id));const byArea=allowedQuestions.filter(q=>matchQuestionArea(q.area,focus));const pool=exact.length?exact:byArea;const next=pool[0];if(next){setQuestionArea(next.area);setTab('questoes');openQuestion(next)}else{setTab('questoes')}};
  const checkQuestion=async()=>{if(!activeQuestion||!selectedOption)return;const ok=selectedOption===activeQuestion.correct_option;setPracticeResult(ok);try{if(!supabase)return;const{data}=await supabase.auth.getUser();if(!data.user)return;await supabase.from('student_practice_attempts').insert({user_id:data.user.id,exam_id:model.examId,question_id:activeQuestion.id,area:activeQuestion.area,skill_name:activeQuestion.skill_name,selected_option:selectedOption,correct:ok,duration_seconds:questionStartedAt?Math.max(1,Math.round((Date.now()-questionStartedAt)/1000)):null});setAttempts(v=>[{exam_id:model.examId,area:activeQuestion.area,skill_name:activeQuestion.skill_name,correct:ok,created_at:new Date().toISOString()},...v])}catch{}};
  const tabs:[Tab,string,any][]=[['hoje','Hoje',<Home size={18}/>],['plano','Plano',<CalendarDays size={18}/>],['questoes','Questões',<BookOpen size={18}/>],['prova','Prova',<Trophy size={18}/>]];

  if(loading)return <div className="plan6" style={{display:'grid',placeItems:'center'}}><Loader2 className="animate-spin"/></div>;

  return <div className="plan6">
    <header className="plan6-top"><div className="plan6-shell plan6-topin"><button className="plan6-back" onClick={onBack}><ArrowLeft size={17}/>Voltar</button><div className="plan6-brand"><span className="plan6-mark">C</span><span>Conectaê</span></div><div className="plan6-kicker plan6-desktop-only">Plano de aprovação</div></div></header>
    <main className="plan6-shell">
      <section className="plan6-hero"><div><div className="plan6-eyebrow"><Target size={15}/>cronograma até a prova</div><h1>Saiba o que estudar em cada semana.</h1><p className="plan6-lead">O plano usa a data real do processo seletivo, sua nota atual, a estrutura da prova e seu histórico para organizar matéria, aula e questões até o vestibular.</p></div><aside className="plan6-summary"><strong>{roadmap.daysLeft}</strong><small>dias até a última etapa considerada</small><div className="plan6-progress"><span style={{width:`${readiness}%`}}/></div><div className="plan6-summary-row"><span>{model.title}</span><span><b>{readiness}%</b> prontidão</span></div></aside></section>
      <section className="plan6-selectors"><div className="plan6-field"><label>Curso</label><select value={selectedArea} onChange={e=>setSelectedArea(e.target.value)}>{areas.map(a=><option key={a.area_id} value={a.area_id}>{a.courses||a.name}</option>)}</select></div><div className="plan6-field"><label>Faculdade</label><select value={selectedUniversity} onChange={e=>setSelectedUniversity(e.target.value)}>{filteredUniversities.map(u=><option key={u.area_university_id} value={u.area_university_id}>{u.university_name}</option>)}</select></div><button className="plan6-save" disabled={saving} onClick={save}>{saving?<Loader2 size={16} className="animate-spin"/>:<Save size={16}/>}Salvar meu plano</button></section>
      {message&&<div className="plan6-message">{message}</div>}
      <nav className="plan6-tabs">{tabs.map(([id,label])=><button key={id} className={`plan6-tab ${tab===id?'active':''}`} onClick={()=>setTab(id)}>{label}</button>)}</nav>

      {tab==='hoje'&&<div className="plan6-grid">
        <section className="plan6-card span7"><div className="plan6-sectionlabel">Prioridade agora</div><h2>{top?.metric.label??'Diagnóstico'}</h2><p>{top?.missing?`Faltam ${top.missing} ${top.metric.unit==='acertos'?'acertos':'pontos'} para a meta atual.`:'Meta atual atingida. O plano transfere mais tempo para a próxima prioridade.'}</p><div className="plan6-callout"><strong>Próxima semana</strong><p>{roadmap.weeks[0]?`${roadmap.weeks[0].focusLabel}: ${roadmap.weeks[0].topic}. Meta de ${roadmap.weeks[0].questionTarget} questões.`:'Cronograma encerrado para este ciclo.'}</p></div><div className="plan6-actions" style={{marginTop:16}}><button className="plan6-btn primary" onClick={()=>setTab('plano')}><CalendarDays size={15}/>Abrir semana por semana</button></div></section>
        <section className="plan6-card span5"><div className="plan6-sectionlabel">Seu ritmo</div><h2>{weeklyHours} horas por semana</h2><p>O volume de questões e a distribuição mudam automaticamente conforme o tempo disponível.</p><input className="plan6-slider" type="range" min="3" max="30" step="1" value={weeklyHours} onChange={e=>setWeeklyHours(Number(e.target.value))}/><div className="plan6-hour-scale"><span>3h</span><strong>{weeklyHours}h selecionadas</strong><span>30h</span></div><div className="plan6-callout blue" style={{marginTop:18}}><strong>Histórico</strong><p>{recentAccuracy==null?'Ainda sem histórico suficiente.':`${recentAccuracy}% de acerto nas últimas questões desta prova.`}</p></div></section>
        <section className="plan6-card span12"><div className="plan6-sectionlabel">Componentes cobrados</div><h2>{course} · {university?.university_name}</h2><p>Altere apenas sua nota real em cada componente. Uma matéria não modifica a outra.</p>{diagnosis.map(p=>{const step=p.metric.max>100?10:1;return <div className="plan6-statline" key={p.metric.key}><div><div className="plan6-statname">{p.metric.label}</div><div className="plan6-statmeta">Agora <b>{p.current}</b> de {p.metric.max} • meta {p.goal} de {p.metric.max}{p.metric.phase?` • ${p.metric.phase}`:''}</div><div className="plan6-score-control"><button type="button" onClick={()=>updateScore(p.metric,p.current-step)}><Minus size={16}/></button><input className="plan6-slider" type="range" min="0" max={p.metric.max} step={step} value={p.current} onChange={e=>updateScore(p.metric,Number(e.target.value))}/><input className="plan6-score-number" type="number" min="0" max={p.metric.max} step={step} value={p.current} onChange={e=>updateScore(p.metric,Number(e.target.value||0))}/><button type="button" onClick={()=>updateScore(p.metric,p.current+step)}><Plus size={16}/></button></div></div><div className="plan6-statvalue">{p.missing===0?'Meta atingida':`${p.missing} faltam`}</div></div>})}</section>
      </div>}

      {tab==='plano'&&<div className="plan6-grid">
        <section className="plan6-card span12"><div className="plan6-sectionlabel">Datas consideradas</div><h2>{roadmap.weeks.length} semanas planejadas · {roadmap.dateLabel}</h2><p>O cronograma vai da semana atual até a última etapa relevante. Quando o processo tem mais de uma fase, a matéria muda na data certa.</p><div className="plan6-strengths">{roadmap.milestones.map(m=><span className="plan6-chip active" key={`${m.date}-${m.label}`}>{fmtDate(m.date)} · {m.label}</span>)}</div></section>
        {roadmap.weeks.map(w=><section className="plan6-card span12" key={`${w.week}-${w.start}`}>
          <div style={{display:'flex',justifyContent:'space-between',gap:16,alignItems:'flex-start',flexWrap:'wrap'}}><div><div className="plan6-sectionlabel">Semana {w.week} · {fmtDate(w.start)}–{fmtDate(w.end)}</div><h2 style={{marginBottom:5}}>{w.focusLabel}</h2><p style={{marginBottom:0}}>{w.phase} · {w.topic}</p></div><div className="plan6-statvalue">~{w.hours}h foco</div></div>
          <div className="plan6-grid" style={{marginTop:18}}><div className="plan6-callout blue span5"><strong><Video size={15} style={{display:'inline',marginRight:7}}/>Vídeo especializado</strong><p>{w.videoTitle}<br/><span style={{opacity:.75}}>{w.videoChannel}</span></p><a className="plan6-btn" href={w.videoUrl} target="_blank" rel="noreferrer"><PlayCircle size={14}/>Assistir aula do tema</a></div><div className="plan6-callout span4"><strong><BookOpen size={15} style={{display:'inline',marginRight:7}}/>Questões da semana</strong><p>Resolver <b>{w.questionTarget}</b> questões de {w.focusLabel}, corrigindo cada erro por habilidade.</p><button className="plan6-btn primary" onClick={()=>openWeekQuestions(w.focusKey,w.questionIds)}><BookOpen size={14}/>Abrir questões desta matéria</button></div><div className="plan6-callout span3"><strong>Checkpoint</strong><p>{w.checkpoint}</p></div></div>
          <div className="plan6-statmeta" style={{marginTop:14}}><b>Objetivo:</b> {w.target}</div>
        </section>)}
      </div>}

      {tab==='questoes'&&<section><div className="plan6-card" style={{marginBottom:14}}><div className="plan6-sectionlabel">Banco filtrado pela sua prova</div><div style={{display:'flex',justifyContent:'space-between',alignItems:'end',gap:14,flexWrap:'wrap'}}><div><h2>{filteredQuestions.length} questões compatíveis</h2><p style={{marginBottom:0}}>O botão de cada semana traz você para a matéria programada naquele período.</p></div><button className="plan6-btn primary" disabled={!filteredQuestions.length} onClick={()=>openQuestion()}><PlayCircle size={14}/>Questão aleatória</button></div></div><div className="plan6-qfilters">{examAreas.map(a=><button key={a} className={`plan6-chip ${questionArea===a?'active':''}`} onClick={()=>setQuestionArea(a)}>{a}</button>)}</div><div className="plan6-qgrid">{filteredQuestions.map(q=><button className="plan6-qitem" key={q.id} onClick={()=>openQuestion(q)}><div className="plan6-qtop"><span>{q.area}</span><span>nível {q.difficulty}/5</span></div><strong>{q.skill_name}</strong><p>{q.prompt}</p></button>)}</div></section>}

      {tab==='prova'&&<div className="plan6-grid"><section className="plan6-card span7"><div className="plan6-sectionlabel">Estrutura oficial</div><h2>{model.title}</h2><p>{model.structure}</p><div className="plan6-strengths">{metrics.map(m=><span key={m.key} className="plan6-chip active">{m.label}</span>)}</div><a className="plan6-btn" style={{marginTop:18}} href={model.officialSource} target="_blank" rel="noreferrer"><ExternalLink size={14}/>Ver fonte oficial</a></section><section className="plan6-card span5"><div className="plan6-sectionlabel">Calendário</div><h2>Etapas usadas no plano</h2>{roadmap.milestones.map(m=><div className="plan6-callout" style={{marginTop:10}} key={m.date}><strong>{fmtDate(m.date)} · {m.label}</strong><p>{m.note}</p></div>)}</section></div>}
    </main>

    {activeQuestion&&<div className="plan6-modal" onClick={e=>{if(e.target===e.currentTarget)setActiveQuestion(null)}}><div className="plan6-modalcard"><div className="plan6-modalmeta"><span>{activeQuestion.area} • nível {activeQuestion.difficulty}/5</span><button className="plan6-back" onClick={()=>setActiveQuestion(null)}><X size={19}/></button></div><div className="plan6-prompt">{activeQuestion.prompt}</div>{(['A','B','C','D','E'] as const).map(letter=>{const value=activeQuestion[`option_${letter.toLowerCase()}` as keyof Question] as string|null;return value?<button key={letter} className={`plan6-option ${selectedOption===letter?'selected':''}`} onClick={()=>{if(practiceResult===null)setSelectedOption(letter)}}><strong>{letter}</strong><span>{value}</span></button>:null})}<div className="plan6-actions" style={{marginTop:16}}>{practiceResult===null?<button className="plan6-btn primary" disabled={!selectedOption} onClick={checkQuestion}><CheckCircle2 size={15}/>Responder e corrigir</button>:<button className="plan6-btn primary" onClick={()=>openQuestion()}><PlayCircle size={15}/>Próxima questão</button>}<button className="plan6-btn" onClick={()=>setActiveQuestion(null)}>Voltar</button></div>{practiceResult!==null&&<div className={`plan6-answer ${practiceResult?'':'wrong'}`}><strong style={{display:'flex',alignItems:'center',gap:7}}>{practiceResult?<CheckCircle2 size={17}/>:<XCircle size={17}/>} {practiceResult?'Acertou.':'Ainda não.'}</strong><div style={{marginTop:7}}>Gabarito: <b>{activeQuestion.correct_option}</b></div><div style={{marginTop:6}}>{activeQuestion.explanation}</div></div>}</div></div>}
    <nav className="plan6-bottomnav">{tabs.map(([id,label,icon])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}>{icon}<span>{label}</span></button>)}</nav>
  </div>;
}
