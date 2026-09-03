import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowLeft, BookOpen, CalendarDays, CheckCircle2, ExternalLink, Home, Loader2, Minus, PlayCircle, Plus, Save, Sparkles, Target, Trophy, Video, X, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getExamModel, isSupportedInstitutionCourse, type ExamMetric } from '@/lib/exam-models';
import { buildRoadmap } from '@/lib/admissions-roadmap';
import { isSupplementalQuestion, mergePracticeQuestions } from '@/lib/supplemental-practice-questions';
import WeeklyPlanExperience from '@/components/WeeklyPlanExperience';
import DifficultyProfile from '@/components/DifficultyProfile';
import { type DifficultySelection } from '@/lib/exam-skill-catalog';
import './admissions-planner-v6.css';

type Tab='hoje'|'plano'|'questoes'|'prova';
type AcademicArea={area_id:string;name:string;courses:string};
type University={area_university_id:number;area_id:string;university_name:string;course_label:string};
type Question={id:number;exam_id:string;area:string;skill_name:string;difficulty:number;prompt:string;option_a:string|null;option_b:string|null;option_c:string|null;option_d:string|null;option_e:string|null;correct_option:string|null;explanation:string|null};
type Attempt={exam_id:string;area:string;skill_name:string|null;correct:boolean|null;created_at:string};
type Priority={metric:ExamMetric;current:number;goal:number;missing:number;score:number;accuracy:number|null};
type SkillDiagnostic={id:string;exam_id:string;area:string;skill_code:string|null;error_type:string|null;error_detail:string|null;diagnosis:{skill_name?:string}|null;created_at:string;evidence_path:string|null};
type AdmissionCutoff={institution:string;exam_id:string;course_label:string;variant:string;year:number;modality:string;target_kind:string;target_value:number;max_value:number|null;confidence:string;source_url:string;notes:string|null};

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

function goalFor(metric:ExamMetric,examId:string,dataGoal?:number){
  if(Number.isFinite(dataGoal))return clamp(Math.round(dataGoal!),0,metric.max);
  if(examId==='enem'){
    const fallback:Record<string,number>={Linguagens:36,Humanas:37,Natureza:35,'Matemática':37,'Redação':900};
    return fallback[metric.key]??Math.round(metric.max*.8);
  }
  if(examId==='cmmg'){
    if(metric.key==='Redação')return Math.round(metric.max*.8);
    const pct:Record<string,number>={'Língua Portuguesa':.78,'Literatura':.75,'Inglês':.78,'Biologia':.82,'Física':.75,'Química':.8,'Matemática':.8,'Linguagens':.8,'Conhecimentos Gerais':.75,'Humanas':.75};
    return Math.max(1,Math.round(metric.max*(pct[metric.key]??.78)));
  }
  if(examId==='insper')return metric.key==='Redação'?75:12;
  if(examId==='fuvest'){
    if(metric.key==='1ª fase')return Math.round(metric.max*.8);
    if(metric.key==='Português'||metric.key==='Redação')return 36;
    return 72;
  }
  const link:Record<string,number>={'Matemática':75,'Business Case':82,'Escrita':80,'Oral':80,'Portfólio':78,'Entrevista':80};
  return link[metric.key]??78;
}

function enemGoalsFromCutoff(cutoff:number){
  // Faixas de planejamento ancoradas na nota de corte oficial do curso.
  // Para Medicina em ~818 pontos, a meta fica em ~160 acertos totais + redação forte,
  // coerente com resultados reais de aprovados. Não é uma conversão determinística da TRI.
  if(cutoff>=810)return {Linguagens:39,Humanas:40,Natureza:40,'Matemática':41,'Redação':940}; // 160/180
  if(cutoff>=795)return {Linguagens:38,Humanas:39,Natureza:39,'Matemática':40,'Redação':920}; // 156/180
  if(cutoff>=780)return {Linguagens:37,Humanas:38,Natureza:37,'Matemática':39,'Redação':910}; // 151/180
  if(cutoff>=765)return {Linguagens:36,Humanas:37,Natureza:35,'Matemática':38,'Redação':900}; // 146/180
  if(cutoff>=750)return {Linguagens:35,Humanas:36,Natureza:34,'Matemática':37,'Redação':880}; // 142/180
  if(cutoff>=735)return {Linguagens:34,Humanas:35,Natureza:32,'Matemática':36,'Redação':860}; // 137/180
  return {Linguagens:32,Humanas:34,Natureza:30,'Matemática':34,'Redação':840}; // 130/180
}

function recoveryAction(type:string|null,area:string,skill:string){
  const label=skill||area;
  const map:Record<string,string>={
    conteudo:`Revisão extra de ${label}: conceito-base + recuperação ativa + 12 questões progressivas.`,
    interpretacao:`Extra de interpretação em ${label}: reescrever comandos, separar dados/restrições e fazer 10 questões comentadas.`,
    tempo:`Extra cronometrado de ${label}: 2 blocos curtos com regra de pular e voltar.`,
    calculo:`Extra de procedimento em ${label}: refazer etapas, sinais, unidades e 10 questões de execução.`,
    distracao:`Extra de precisão em ${label}: checklist de 10 segundos + 12 questões com conferência final.`,
    estrategia:`Extra de estratégia em ${label}: “o que tenho → o que quero → qual ferramenta usar” em 8 problemas.`,
    outro:`Extra dirigido de ${label}: atacar a dificuldade registrada e validar com questões novas.`,
  };
  return map[type||'outro']||map.outro;
}

export default function AdmissionsPlannerV11({onBack}:{onBack:()=>void}){
  const[loading,setLoading]=useState(true);
  const[areas,setAreas]=useState<AcademicArea[]>([]);
  const[universities,setUniversities]=useState<University[]>([]);
  const[questions,setQuestions]=useState<Question[]>([]);
  const[attempts,setAttempts]=useState<Attempt[]>([]);
  const[diagnostics,setDiagnostics]=useState<SkillDiagnostic[]>([]);
  const[selectedArea,setSelectedArea]=useState('');
  const[selectedUniversity,setSelectedUniversity]=useState('');
  const[values,setValues]=useState<Record<string,number>>({});
  const[appliedValues,setAppliedValues]=useState<Record<string,number>>({});
  const[weeklyHours,setWeeklyHours]=useState(9);
  const[appliedWeeklyHours,setAppliedWeeklyHours]=useState(9);
  const[dirty,setDirty]=useState(false);
  const[tab,setTab]=useState<Tab>('hoje');
  const[message,setMessage]=useState('');
  const[saving,setSaving]=useState(false);
  const[questionArea,setQuestionArea]=useState('Todas');
  const[activeQuestion,setActiveQuestion]=useState<Question|null>(null);
  const[selectedOption,setSelectedOption]=useState('');
  const[practiceResult,setPracticeResult]=useState<boolean|null>(null);
  const[questionStartedAt,setQuestionStartedAt]=useState<number|null>(null);
  const[cutoffs,setCutoffs]=useState<AdmissionCutoff[]>([]);
  const[difficultyTopics,setDifficultyTopics]=useState<DifficultySelection>({});

  const reloadDiagnostics=async(userId?:string,examId?:string)=>{
    if(!supabase)return;
    let uid=userId;
    if(!uid){const{data}=await supabase.auth.getUser();uid=data.user?.id}
    if(!uid)return;
    let query=supabase.from('student_skill_diagnostics').select('id,exam_id,area,skill_code,error_type,error_detail,diagnosis,created_at,evidence_path').eq('user_id',uid).order('created_at',{ascending:false}).limit(12);
    if(examId)query=query.eq('exam_id',examId);
    const{data}=await query;
    setDiagnostics((data??[]) as SkillDiagnostic[]);
  };

  useEffect(()=>{let alive=true;(async()=>{
    if(!supabase){setLoading(false);return}
    const[{data:a},{data:u},{data:q},{data:userData},{data:cutoffRows}]=await Promise.all([
      supabase.from('academic_areas').select('area_id,name,courses').order('name'),
      supabase.from('area_universities').select('area_university_id,area_id,university_name,course_label').order('university_name'),
      supabase.from('exam_practice_questions').select('*').eq('active',true),
      supabase.auth.getUser(),
      supabase.from('admission_cutoff_references').select('institution,exam_id,course_label,variant,year,modality,target_kind,target_value,max_value,confidence,source_url,notes').order('year',{ascending:false}),
    ]);
    if(!alive)return;
    const cleanUniversities=((u??[]) as University[]).filter(x=>RETAINED.has(x.university_name)&&isSupportedInstitutionCourse(x.university_name,x.course_label));
    const cleanAreas=((a??[]) as AcademicArea[]).filter(ar=>cleanUniversities.some(x=>x.area_id===ar.area_id));
    setAreas(cleanAreas);setUniversities(cleanUniversities);setQuestions(mergePracticeQuestions((q??[]) as Question[]) as Question[]);setCutoffs((cutoffRows??[]) as AdmissionCutoff[]);
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
      setSelectedUniversity(desiredUniversity);
      const wh=Number(pref?.weekly_hours??9);setWeeklyHours(wh);setAppliedWeeklyHours(wh);
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

  useEffect(()=>{(async()=>{
    const defaults=Object.fromEntries(metrics.map(m=>[m.key,m.defaultValue]));
    let stored:Record<string,number>={};try{stored=JSON.parse(localStorage.getItem(scoreStorageKey)||'{}')}catch{stored={}}
    let saved:Record<string,number>={};
    if(supabase){const{data:userData}=await supabase.auth.getUser();if(userData.user){const{data:pref}=await supabase.from('student_exam_preferences').select('current_scores,weekly_hours,difficulty_topics').eq('user_id',userData.user.id).eq('exam_id',model.examId).maybeSingle();if(pref?.current_scores&&typeof pref.current_scores==='object')saved=pref.current_scores as Record<string,number>;if(pref?.weekly_hours){setWeeklyHours(Number(pref.weekly_hours));setAppliedWeeklyHours(Number(pref.weekly_hours))}if(pref?.difficulty_topics&&typeof pref.difficulty_topics==='object')setDifficultyTopics(pref.difficulty_topics as DifficultySelection);else setDifficultyTopics({});await reloadDiagnostics(userData.user.id,model.examId)}}
    const next={...defaults,...stored,...saved};setValues(next);setAppliedValues(next);setDirty(false);setQuestionArea('Todas');setActiveQuestion(null);setSelectedOption('');setPracticeResult(null);localStorage.setItem('conectae:active-exam',model.examId);
  })()},[scoreStorageKey,model.examId,metrics]);

  useEffect(()=>{const handler=()=>reloadDiagnostics(undefined,model.examId);window.addEventListener('conectae:diagnostic-saved',handler);const timer=window.setInterval(handler,5000);return()=>{window.removeEventListener('conectae:diagnostic-saved',handler);window.clearInterval(timer)}},[model.examId]);

  const allowedQuestions=useMemo(()=>questions.filter(q=>q.exam_id===model.examId&&model.allowedQuestionAreas.some(a=>normalize(a)===normalize(q.area)||matchQuestionArea(q.area,a))),[questions,model]);
  const examAreas=['Todas',...Array.from(new Set(allowedQuestions.map(q=>q.area)))];
  const filteredQuestions=questionArea==='Todas'?allowedQuestions:allowedQuestions.filter(q=>q.area===questionArea);

  const activeCutoff=useMemo(()=>{
    if(!university)return null;
    return cutoffs
      .filter(c=>normalize(c.institution)===normalize(university.university_name)&&normalize(c.exam_id)===normalize(model.examId)&&normalize(c.course_label)===normalize(course))
      .sort((a,b)=>b.year-a.year||Number(b.target_value)-Number(a.target_value))[0]??null;
  },[cutoffs,university,model.examId,course]);
  const dataGoals=useMemo<Record<string,number>>(()=>{
    const goals:Record<string,number>={};
    if(!activeCutoff)return goals;
    if(model.examId==='enem')return {...goals,...enemGoalsFromCutoff(Number(activeCutoff.target_value))};
    if(model.examId==='fuvest'){
      const first=metrics.find(m=>m.key==='1ª fase');
      if(!first)return goals;
      const historicalMax=Number(activeCutoff.max_value||90);
      goals['1ª fase']=Math.ceil(Number(activeCutoff.target_value)/Math.max(1,historicalMax)*first.max);
    }
    return goals;
  },[activeCutoff,model.examId,metrics]);

  const diagnosis:Priority[]=useMemo(()=>metrics.map(metric=>{
    const current=appliedValues[metric.key]??metric.defaultValue;
    const goal=goalFor(metric,model.examId,dataGoals[metric.key]);
    const relevant=attempts.filter(a=>a.exam_id===model.examId&&matchQuestionArea(a.area,metric.key)&&a.correct!==null).slice(0,40);
    const accuracy=relevant.length?relevant.filter(x=>x.correct).length/relevant.length:null;
    const missing=Math.max(0,goal-current);
    const score=(missing/Math.max(1,metric.max))*(accuracy==null?1:accuracy<.6?1.25:accuracy>.85?.8:1);
    return{metric,current,goal,missing,score,accuracy};
  }),[metrics,appliedValues,attempts,model.examId,dataGoals]);
  const priorities=useMemo(()=>[...diagnosis].sort((a,b)=>b.score-a.score),[diagnosis]);
  const readiness=Math.round(diagnosis.reduce((s,p)=>s+Math.min(1,p.current/Math.max(1,p.goal)),0)/Math.max(1,diagnosis.length)*100);
  const top=priorities[0];
  const relevantDiagnostics=useMemo(()=>diagnostics.filter(d=>d.exam_id===model.examId&&model.allowedQuestionAreas.some(a=>matchQuestionArea(d.area,a))).slice(0,8),[diagnostics,model]);
  const roadmap=useMemo(()=>buildRoadmap({model,course,priorities,weeklyHours:appliedWeeklyHours,questions:allowedQuestions,difficultyTopics,diagnostics:relevantDiagnostics.map(d=>({area:d.area,skill:d.diagnosis?.skill_name||d.skill_code||d.area}))}),[model,course,priorities,appliedWeeklyHours,allowedQuestions,difficultyTopics,relevantDiagnostics]);

  const updateScore=(m:ExamMetric,n:number)=>{setValues(v=>({...v,[m.key]:clamp(Math.round(Number.isFinite(n)?n:0),0,m.max)}));setDirty(true)};
  const save=async()=>{setSaving(true);setMessage('');try{if(!supabase)throw new Error();const{data}=await supabase.auth.getUser();if(!data.user)throw new Error();const{error}=await supabase.from('student_exam_preferences').upsert({user_id:data.user.id,exam_id:model.examId,weekly_hours:weeklyHours,current_scores:values,selected_area_id:selectedArea,selected_university_id:selectedUniversity?Number(selectedUniversity):null,course_label:course,difficulty_topics:difficultyTopics,updated_at:new Date().toISOString()},{onConflict:'user_id,exam_id'});if(error)throw error;localStorage.setItem(scoreStorageKey,JSON.stringify(values));setAppliedValues({...values});setAppliedWeeklyHours(weeklyHours);setDirty(false);setMessage('Notas salvas. O plano foi recalculado com seus novos resultados.');setTab('plano')}catch{setMessage('Não foi possível salvar e recalcular agora. Tente novamente.')}finally{setSaving(false)}};
  const openQuestion=(q?:Question)=>{const next=q??filteredQuestions[Math.floor(Math.random()*Math.max(1,filteredQuestions.length))]??allowedQuestions[0];setActiveQuestion(next??null);setSelectedOption('');setPracticeResult(null);setQuestionStartedAt(Date.now())};
  const openAreaQuestions=(focus:string)=>{const pool=allowedQuestions.filter(q=>matchQuestionArea(q.area,focus));const next=pool[0];if(next){setQuestionArea(next.area);setTab('questoes');openQuestion(next)}else setTab('questoes')};
  const checkQuestion=async()=>{if(!activeQuestion||!selectedOption)return;const ok=selectedOption===activeQuestion.correct_option;setPracticeResult(ok);try{if(!supabase)return;const{data}=await supabase.auth.getUser();if(!data.user)return;if(isSupplementalQuestion(activeQuestion.id)){await supabase.from('student_skill_diagnostics').insert({user_id:data.user.id,exam_id:model.examId,skill_code:null,area:activeQuestion.area,question_text:activeQuestion.prompt,correct:ok,confidence:1,error_type:ok?null:'questao_autoral',diagnosis:{source:'conectae_autoral_v2',skill_name:activeQuestion.skill_name,selected_option:selectedOption,correct_option:activeQuestion.correct_option}})}else{await supabase.from('student_practice_attempts').insert({user_id:data.user.id,exam_id:model.examId,question_id:activeQuestion.id,area:activeQuestion.area,skill_name:activeQuestion.skill_name,selected_option:selectedOption,correct:ok,duration_seconds:questionStartedAt?Math.max(1,Math.round((Date.now()-questionStartedAt)/1000)):null})}setAttempts(v=>[{exam_id:model.examId,area:activeQuestion.area,skill_name:activeQuestion.skill_name,correct:ok,created_at:new Date().toISOString()},...v])}catch{setMessage('A resposta foi corrigida, mas não entrou no histórico.')}};
  const tabs:[Tab,string,ReactNode][]=[['hoje','Hoje',<Home size={18}/>],['plano','Plano',<CalendarDays size={18}/>],['questoes','Questões',<BookOpen size={18}/>],['prova','Prova',<Trophy size={18}/>]];

  if(loading)return <div className="plan6" style={{display:'grid',placeItems:'center'}}><Loader2 className="animate-spin"/></div>;

  return <div className="plan6">
    <header className="plan6-top"><div className="plan6-shell plan6-topin"><button className="plan6-back" onClick={onBack}><ArrowLeft size={17}/>Voltar</button><div className="plan6-brand"><span className="plan6-mark">C</span><span>Conectaê</span></div><div className="plan6-kicker plan6-desktop-only">Plano de aprovação</div></div></header>
    <main className="plan6-shell">
      <section className="plan6-hero"><div><div className="plan6-eyebrow"><Target size={15}/>plano adaptativo salvo</div><h1>Suas notas viram um plano até a prova.</h1><p className="plan6-lead">Edite seus resultados e clique em salvar. Só então o cronograma é recalculado, evitando mudanças acidentais enquanto você ainda está preenchendo.</p></div><aside className="plan6-summary"><strong>{roadmap.daysLeft}</strong><small>dias até a última etapa considerada</small><div className="plan6-progress"><span style={{width:`${readiness}%`}}/></div><div className="plan6-summary-row"><span>{model.title}</span><span><b>{readiness}%</b> prontidão</span></div></aside></section>
      <section className="plan6-selectors"><div className="plan6-field"><label>Curso</label><select value={selectedArea} onChange={e=>{setSelectedArea(e.target.value);setDirty(true)}}>{areas.map(a=><option key={a.area_id} value={a.area_id}>{a.courses||a.name}</option>)}</select></div><div className="plan6-field"><label>Faculdade</label><select value={selectedUniversity} onChange={e=>{setSelectedUniversity(e.target.value);setDirty(true)}}>{filteredUniversities.map(u=><option key={u.area_university_id} value={u.area_university_id}>{u.university_name}</option>)}</select></div><button className="plan6-save" disabled={saving} onClick={save}>{saving?<Loader2 size={16} className="animate-spin"/>:<Save size={16}/>}Salvar notas e atualizar meu plano</button></section>
      {dirty&&<div className="plan6-message">Você tem alterações ainda não aplicadas. Clique em <b>Salvar notas e atualizar meu plano</b> para recalcular o semana por semana.</div>}
      {message&&<div className="plan6-message">{message}</div>}
      <nav className="plan6-tabs">{tabs.map(([id,label])=><button key={id} className={`plan6-tab ${tab===id?'active':''}`} onClick={()=>setTab(id)}>{label}</button>)}</nav>

      {tab==='hoje'&&<div className="plan6-grid">
        <section className="plan6-card span7"><div className="plan6-sectionlabel">Prioridade do plano salvo</div><h2>{top?.metric.label??'Diagnóstico'}</h2><p>{top?.missing?`Faltam ${top.missing} ${top.metric.unit==='acertos'?'acertos':'pontos'} para a meta atual.`:'Meta atual atingida. O plano transfere mais tempo para a próxima prioridade.'}</p><div className="plan6-callout"><strong>Próxima semana</strong><p>{roadmap.weeks[0]?`${roadmap.weeks[0].focusLabel}: ${roadmap.weeks[0].topic}.`:'Cronograma encerrado para este ciclo.'}</p></div></section>
        <section className="plan6-card span5"><div className="plan6-sectionlabel">Seu ritmo</div><h2>{weeklyHours} horas por semana</h2><p>Altere o tempo e salve para recalcular o volume semanal.</p><input className="plan6-slider" type="range" min="3" max="30" step="1" value={weeklyHours} onChange={e=>{setWeeklyHours(Number(e.target.value));setDirty(true)}}/><div className="plan6-hour-scale"><span>3h</span><strong>{weeklyHours}h</strong><span>30h</span></div></section>
        <section className="plan6-card span12"><div className="plan6-sectionlabel">Suas notas</div><h2>{course} · {university?.university_name}</h2><p>Preencha tudo primeiro. O cronograma só muda depois de salvar.</p>{activeCutoff&&<div className="plan6-callout blue" style={{marginBottom:18}}><strong>Meta calibrada com dados reais</strong><p>Referência {activeCutoff.year} · {activeCutoff.modality}: <b>{Number(activeCutoff.target_value).toLocaleString('pt-BR',{maximumFractionDigits:2})}{model.examId==='enem'?' pontos':' acertos'}</b>. {model.examId==='enem'?'Os acertos abaixo são uma meta de planejamento compatível com essa faixa; a TRI pode mudar a nota mesmo com o mesmo número de acertos.':'A meta da 1ª fase é normalizada para o formato atual da prova.'}</p></div>}{metrics.map(m=>{const current=values[m.key]??m.defaultValue;const step=m.max>100?10:1;const goal=goalFor(m,model.examId,dataGoals[m.key]);return <div className="plan6-statline" key={m.key}><div><div className="plan6-statname">{m.label}</div><div className="plan6-statmeta">Agora <b>{current}</b> de {m.max} • meta {goal}</div><div className="plan6-score-control"><button type="button" onClick={()=>updateScore(m,current-step)}><Minus size={16}/></button><input className="plan6-slider" type="range" min="0" max={m.max} step={step} value={current} onChange={e=>updateScore(m,Number(e.target.value))}/><input className="plan6-score-number" type="number" min="0" max={m.max} step={step} value={current} onChange={e=>updateScore(m,Number(e.target.value||0))}/><button type="button" onClick={()=>updateScore(m,current+step)}><Plus size={16}/></button></div></div><div className="plan6-statvalue">{Math.max(0,goal-current)} faltam</div></div>})}<div className="plan6-actions" style={{marginTop:18}}><button className="plan6-btn primary" disabled={saving} onClick={save}><Save size={15}/>Salvar notas e atualizar meu plano</button></div></section>
      </div>}

      {tab==='plano'&&<div className="plan6-grid">
        <DifficultyProfile examId={model.examId} course={course} value={difficultyTopics} onChange={setDifficultyTopics}/>
        <section className="plan6-card span12"><div className="plan6-sectionlabel">Semana por semana</div><h2>{roadmap.weeks.length} semanas planejadas · {roadmap.dateLabel}</h2><p>O cronograma combina notas salvas, tempo disponível, dificuldades que você marcou, erros em questões e diagnósticos enviados por foto. Tudo é redistribuído dentro das mesmas horas semanais.</p><div className="plan6-strengths">{roadmap.milestones.map(m=><span className="plan6-chip active" key={`${m.date}-${m.label}`}>{fmtDate(m.date)} · {m.label}</span>)}</div></section>
        {relevantDiagnostics.length>0&&<section className="plan6-card span12"><div className="plan6-sectionlabel"><Sparkles size={14} style={{display:'inline',marginRight:6}}/>Extras adicionados pelas suas dificuldades</div><h2>O plano está atacando o que você enviou.</h2><p>Cada diagnóstico recente influencia a prioridade e o tema das próximas semanas. A recuperação abaixo mostra o que foi detectado, sem criar horas fora do seu orçamento semanal.</p>{relevantDiagnostics.map(d=>{const skill=d.diagnosis?.skill_name||d.skill_code||d.area;const video=`https://www.youtube.com/results?search_query=${encodeURIComponent(`${skill} ${model.examId} aula revisão`)}`;return <div className="plan6-statline" key={d.id}><div><div className="plan6-statname">EXTRA · {d.area} — {skill}</div><div className="plan6-statmeta">{recoveryAction(d.error_type,d.area,skill)}{d.error_detail?` • ${d.error_detail}`:''}</div><div className="plan6-actions" style={{marginTop:10}}><button className="plan6-btn primary" onClick={()=>openAreaQuestions(d.area)}><BookOpen size={14}/>Questões desta dificuldade</button><a className="plan6-btn" href={video} target="_blank" rel="noreferrer"><Video size={14}/>Vídeo de recuperação</a></div></div><div className="plan6-statvalue">extra</div></div>})}</section>}
        {roadmap.weeks.map(w=><WeeklyPlanExperience key={`${w.week}-${w.start}`} week={w} examId={model.examId} formatDate={fmtDate} onOpenQuestions={openAreaQuestions}/>)}
      </div>}

      {tab==='questoes'&&<section className="plan6-card"><div className="plan6-sectionlabel">Banco de questões</div><h2>{filteredQuestions.length} questões compatíveis</h2><div className="plan6-qfilters">{examAreas.map(a=><button key={a} className={`plan6-chip ${questionArea===a?'active':''}`} onClick={()=>setQuestionArea(a)}>{a}</button>)}</div><div className="plan6-qgrid">{filteredQuestions.map(q=><button className="plan6-qitem" key={q.id} onClick={()=>openQuestion(q)}><div className="plan6-qtop"><span>{q.area}</span><span>nível {q.difficulty}/5</span></div><strong>{q.skill_name}</strong><p>{q.prompt}</p></button>)}</div></section>}

      {tab==='prova'&&<div className="plan6-grid"><section className="plan6-card span7"><div className="plan6-sectionlabel">Estrutura oficial usada</div><h2>{model.title}</h2><p>{model.structure}</p><div className="plan6-strengths">{metrics.map(m=><span key={m.key} className="plan6-chip active">{m.label}</span>)}</div><a className="plan6-btn" style={{marginTop:18}} href={model.officialSource} target="_blank" rel="noreferrer"><ExternalLink size={14}/>Ver fonte oficial</a></section><section className="plan6-card span5"><div className="plan6-sectionlabel">Como adapta</div><h2>Notas + dificuldades + erros + tempo.</h2><p>O plano cruza desempenho, tópicos marcados por você, questões erradas e diagnósticos de fotos. Nenhuma dificuldade adiciona horas escondidas: o mesmo orçamento semanal é redistribuído.</p></section></div>}
    </main>

    {activeQuestion&&<div className="plan6-modal" onClick={e=>{if(e.target===e.currentTarget)setActiveQuestion(null)}}><div className="plan6-modalcard"><div className="plan6-modalmeta"><span>{activeQuestion.area} • nível {activeQuestion.difficulty}/5</span><button className="plan6-back" onClick={()=>setActiveQuestion(null)}><X size={19}/></button></div><div className="plan6-prompt">{activeQuestion.prompt}</div>{(['A','B','C','D','E'] as const).map(letter=>{const value=activeQuestion[`option_${letter.toLowerCase()}` as keyof Question] as string|null;return value?<button key={letter} className={`plan6-option ${selectedOption===letter?'selected':''}`} onClick={()=>{if(practiceResult===null)setSelectedOption(letter)}}><strong>{letter}</strong><span>{value}</span></button>:null})}<div className="plan6-actions" style={{marginTop:16}}>{practiceResult===null?<button className="plan6-btn primary" disabled={!selectedOption} onClick={checkQuestion}><CheckCircle2 size={15}/>Responder e corrigir</button>:<button className="plan6-btn primary" onClick={()=>openQuestion()}><PlayCircle size={15}/>Próxima questão</button>}<button className="plan6-btn" onClick={()=>setActiveQuestion(null)}>Voltar</button></div>{practiceResult!==null&&<div className={`plan6-answer ${practiceResult?'':'wrong'}`}><strong style={{display:'flex',alignItems:'center',gap:7}}>{practiceResult?<CheckCircle2 size={17}/>:<XCircle size={17}/>} {practiceResult?'Acertou.':'Ainda não.'}</strong><div style={{marginTop:7}}>Gabarito: <b>{activeQuestion.correct_option}</b></div><div style={{marginTop:6}}>{activeQuestion.explanation}</div></div>}</div></div>}
    <nav className="plan6-bottomnav">{tabs.map(([id,label,icon])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}>{icon}<span>{label}</span></button>)}</nav>
  </div>;
}
