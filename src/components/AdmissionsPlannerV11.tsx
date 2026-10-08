import { goalFor, enemGoalsFromCutoff, componentGoals } from '@/lib/planner-goals';
import { sameStudySubject } from '@/lib/study-area-match';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowLeft, BookOpen, CalendarDays, CheckCircle2, ExternalLink, Home, Loader2, Minus, PlayCircle, Plus, Save, Sparkles, Target, Trophy, Video, X, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { calculateExamScore, getExamModel, isEnemScoringModel, isSupportedInstitutionCourse, mergeRemoteExamModel, normalizeStoredScores, type ExamMetric, type RemoteExamModelRow } from '@/lib/exam-models';
import { buildRoadmap } from '@/lib/admissions-roadmap-balanced';
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
type Priority={metric:ExamMetric;current:number;goal:number;missing:number;score:number;accuracy:number|null;sampleSize:number;sampleConfidence:number};
type SkillDiagnostic={id:string;exam_id:string;area:string;skill_code:string|null;error_type:string|null;error_detail:string|null;diagnosis:{skill_name?:string}|null;created_at:string;evidence_path:string|null};
type AdmissionCutoff={institution:string;exam_id:string;course_label:string;variant:string;year:number;modality:string;target_kind:string;target_value:number;max_value:number|null;confidence:string;source_url:string;notes:string|null};

const GENERIC_ENEM_UNIVERSITY='ENEM — plano geral';
const GUEST_PREF_KEY='conectae:planner-guest-preference';
const GUEST_ATTEMPTS_KEY='conectae:planner-guest-attempts';
const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
const fmtDate=(iso:string)=>new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(`${iso}T12:00:00-03:00`));
const confidenceLabel=(value?:string|null)=>({
  official_current:'edital ou fonte oficial do ciclo atual',
  official_current_structure:'estrutura oficial do ciclo atual; pesos específicos ainda não validados',
  official_current_route:'processo 2027 confirmado; detalhes do edital ainda não estruturados',
  official_recent:'formato oficial mais recente disponível',
  official_route:'forma de ingresso confirmada em fonte oficial; pesos específicos pendentes',
  institution_page:'página oficial da instituição; edital detalhado pendente',
  official:'fonte oficial verificada',
  test:'validação interna',
}[String(value??'')]??'modelo nativo verificado pelo Conectaê');

function matchQuestionArea(area:string,key:string){
  const exact = sameStudySubject(area, key); if (exact !== undefined) return exact;

  const a=normalize(area),k=normalize(key.replace('2ª fase — ','').replace('2a fase — ',''));
  if(a===k||a.includes(k)||k.includes(a))return true;
  if(k==='natureza')return ['natureza','biologia','fisica','quimica'].some(x=>a.includes(x));
  if(k==='humanas'||k==='conhecimentos gerais')return ['humanas','historia','geografia','filosofia','sociologia','conhecimentos gerais'].some(x=>a.includes(x));
  if(k==='linguagens')return ['linguagens','portugues','literatura','ingles'].some(x=>a.includes(x));
  if(k==='dissertativas')return ['natureza','biologia','fisica','quimica','matematica','linguagens','humanas','dissertativas'].some(x=>a.includes(x));
  if(k==='dinamica'||k==='mme')return a.includes(k);
  if(k==='1ª fase')return true;
  if(k==='oral')return a.includes('comunicacao')||a.includes('entrevista');
  if(k==='portfolio')return a.includes('prep')||a.includes('portfolio');
  if(k==='escrita')return a.includes('business case')||a.includes('sprint')||a.includes('escrita');
  if(k==='matematica'&&(a.includes('sprint')||a.includes('matematica')))return true;
  return false;
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
  const[storedValues,setValues]=useState<Record<string,number>>({});
  const[storedAppliedValues,setAppliedValues]=useState<Record<string,number>>({});
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
  const[simulationQueue,setSimulationQueue]=useState<Question[]>([]);
  const[simulationIndex,setSimulationIndex]=useState(0);
  const[simulationScore,setSimulationScore]=useState(0);
  const[simulationResult,setSimulationResult]=useState<{correct:number;total:number;label:string}|null>(null);
  const[cutoffs,setCutoffs]=useState<AdmissionCutoff[]>([]);
  const[examModelRows,setExamModelRows]=useState<RemoteExamModelRow[]>([]);
  const[selectedRouteKey,setSelectedRouteKey]=useState('primary');
  const[storedTargetOverride,setTargetOverride]=useState<number|null>(null);
  const[loadedScoreKey,setLoadedScoreKey]=useState('');
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
    const[{data:a},{data:u},{data:userData},{data:cutoffRows},{data:modelRows}]=await Promise.all([
      supabase.from('academic_areas').select('area_id,name,courses').order('name'),
      supabase.from('area_universities').select('area_university_id,area_id,university_name,course_label').order('university_name'),
      supabase.auth.getUser(),
      supabase.from('admission_cutoff_references').select('institution,exam_id,course_label,variant,year,modality,target_kind,target_value,max_value,confidence,source_url,notes').order('year',{ascending:false}),
      supabase.from('course_exam_models').select('university_name,course_label,exam_id,route_key,route_label,practice_exam_id,source_confidence,cycle_label,structure_verified,notes,official_source_url,model').order('university_name'),
    ]);
    if(!alive)return;
    const allUniversities=(u??[]) as University[];
    const verifiedUniversities=allUniversities.filter(x=>isSupportedInstitutionCourse(x.university_name,x.course_label));
    const cleanAreas=(a??[]) as AcademicArea[];
    if(!cleanAreas.length){
      const derivedAreas=Array.from(new Map(allUniversities.map(row=>[row.area_id,{area_id:row.area_id,name:row.course_label||row.area_id,courses:row.course_label||row.area_id} as AcademicArea])).values()).sort((x,y)=>(x.courses||x.name).localeCompare(y.courses||y.name,'pt-BR'));
      cleanAreas.push(...derivedAreas);
    }
    const genericUniversities:University[]=cleanAreas.map((ar,index)=>({
      area_university_id:-100000-index,
      area_id:ar.area_id,
      university_name:GENERIC_ENEM_UNIVERSITY,
      course_label:ar.courses||ar.name,
    }));
    const cleanUniversities=[...verifiedUniversities,...genericUniversities];
    setAreas(cleanAreas);setUniversities(cleanUniversities);setCutoffs((cutoffRows??[]) as AdmissionCutoff[]);setExamModelRows((modelRows??[]) as RemoteExamModelRow[]);
    let guest:{selectedArea?:string;selectedUniversity?:string;selectedRouteKey?:string;weeklyHours?:number;difficultyTopics?:DifficultySelection}={};
    try{guest=JSON.parse(localStorage.getItem(GUEST_PREF_KEY)||'{}')}catch{guest={}}
    const user=userData.user;
    if(user){
      const{data:pref}=await supabase.from('student_exam_preferences').select('*').eq('user_id',user.id).order('updated_at',{ascending:false}).limit(1).maybeSingle();
      const desiredArea=pref?.selected_area_id&&cleanAreas.some(x=>x.area_id===pref.selected_area_id)?pref.selected_area_id:cleanAreas[0]?.area_id??'';
      setSelectedArea(desiredArea);
      const allowed=cleanUniversities.filter(x=>x.area_id===desiredArea);
      const savedLocal=guest.selectedArea===desiredArea&&guest.selectedUniversity&&allowed.some(x=>String(x.area_university_id)===String(guest.selectedUniversity))?String(guest.selectedUniversity):'';
      const generic=allowed.find(x=>x.university_name===GENERIC_ENEM_UNIVERSITY);
      const desiredUniversity=pref?.selected_university_id&&allowed.some(x=>x.area_university_id===pref.selected_university_id)?String(pref.selected_university_id):savedLocal||String(generic?.area_university_id??allowed[0]?.area_university_id??'');
      setSelectedUniversity(desiredUniversity);
      setSelectedRouteKey(String(pref?.selected_route_key??guest.selectedRouteKey??'primary'));
      const wh=Number(pref?.weekly_hours??guest.weeklyHours??9);setWeeklyHours(wh);setAppliedWeeklyHours(wh);
      if(guest.difficultyTopics&&typeof guest.difficultyTopics==='object')setDifficultyTopics(guest.difficultyTopics);
    }else{
      const first=cleanAreas[0]?.area_id??'';
      const desiredArea=guest.selectedArea&&cleanAreas.some(x=>x.area_id===guest.selectedArea)?guest.selectedArea:first;
      setSelectedArea(desiredArea);
      const allowed=cleanUniversities.filter(x=>x.area_id===desiredArea);
      const generic=allowed.find(x=>x.university_name===GENERIC_ENEM_UNIVERSITY);
      const desiredUniversity=guest.selectedUniversity&&allowed.some(x=>String(x.area_university_id)===String(guest.selectedUniversity))?String(guest.selectedUniversity):String(generic?.area_university_id??allowed[0]?.area_university_id??'');
      setSelectedUniversity(desiredUniversity);
      setSelectedRouteKey(String(guest.selectedRouteKey??'primary'));
      const localHours=Number(localStorage.getItem('conectae:weekly-hours')||guest.weeklyHours||9);
      if(Number.isFinite(localHours)){setWeeklyHours(localHours);setAppliedWeeklyHours(localHours)}
      if(guest.difficultyTopics&&typeof guest.difficultyTopics==='object')setDifficultyTopics(guest.difficultyTopics);
    }
    setLoading(false);
  })();return()=>{alive=false}},[]);

  const filteredUniversities=useMemo(()=>universities.filter(u=>u.area_id===selectedArea),[universities,selectedArea]);
  useEffect(()=>{if(!filteredUniversities.length)return;if(filteredUniversities.some(u=>String(u.area_university_id)===selectedUniversity))return;const generic=filteredUniversities.find(u=>u.university_name===GENERIC_ENEM_UNIVERSITY);setSelectedUniversity(String(generic?.area_university_id??filteredUniversities[0].area_university_id))},[filteredUniversities,selectedUniversity]);
  const university=filteredUniversities.find(u=>String(u.area_university_id)===selectedUniversity)??null;
  const area=areas.find(a=>a.area_id===selectedArea)??null;
  const course=university?.course_label||area?.courses||area?.name||'Curso';
  const routeOptions=useMemo(()=>examModelRows.filter(row=>normalize(row.university_name)===normalize(university?.university_name??'')&&normalize(row.course_label)===normalize(course)),[examModelRows,university?.university_name,course]);
  useEffect(()=>{if(!routeOptions.length){if(selectedRouteKey!=='primary')setSelectedRouteKey('primary');return}if(routeOptions.some(row=>(row.route_key||'primary')===selectedRouteKey))return;const preferred=routeOptions.find(row=>(row.route_key||'primary')==='primary')??routeOptions[0];setSelectedRouteKey(preferred.route_key||'primary')},[routeOptions,selectedRouteKey]);
  const activeRemoteModel=useMemo(()=>routeOptions.find(row=>(row.route_key||'primary')===selectedRouteKey)??routeOptions.find(row=>(row.route_key||'primary')==='primary')??routeOptions[0]??null,[routeOptions,selectedRouteKey]);
  const baseModel=useMemo(()=>getExamModel(university?.university_name??GENERIC_ENEM_UNIVERSITY,course),[university?.university_name,course]);
  const model=useMemo(()=>{const merged=mergeRemoteExamModel(baseModel,activeRemoteModel);return {...merged,metrics:merged.metrics.map(metric=>({...metric,defaultValue:0}))}},[baseModel,activeRemoteModel]);
  const metrics=model.metrics;
  const scoreStorageKey=useMemo(()=>`conectae:exam-values:${model.examId}:${university?.university_name??'sem-faculdade'}:${course}:${model.routeKey??selectedRouteKey}`,[model.examId,model.routeKey,university?.university_name,course,selectedRouteKey]);

  const scoreStateKey=`${scoreStorageKey}:${JSON.stringify(metrics)}`;
  const scoresReady=loadedScoreKey===scoreStateKey;
  const values=useMemo(()=>normalizeStoredScores(model,scoresReady?storedValues:{},false),[model,scoresReady,storedValues]);
  const appliedValues=useMemo(()=>normalizeStoredScores(model,scoresReady?storedAppliedValues:{},false),[model,scoresReady,storedAppliedValues]);
  const targetOverride=scoresReady?storedTargetOverride:null;

  useEffect(()=>{let alive=true;(async()=>{
    if(!supabase){setQuestions(mergePracticeQuestions([]) as Question[]);return}
    const[first,second]=await Promise.all([
      supabase.from('exam_practice_questions').select('*').eq('active',true).eq('exam_id',model.examId).range(0,999),
      supabase.from('exam_practice_questions').select('*').eq('active',true).eq('exam_id',model.examId).range(1000,1999),
    ]);
    if(!alive)return;
    const remote=[...(first.data??[]),...(second.data??[])] as Question[];
    setQuestions(mergePracticeQuestions(remote) as Question[]);
  })();return()=>{alive=false}},[model.examId]);

  useEffect(()=>{let alive=true;setMessage('');(async()=>{
    let stored:Record<string,number>={};try{stored=JSON.parse(localStorage.getItem(scoreStorageKey)||'{}')}catch{stored={}}
    let saved:Record<string,number>={};
    let signedIn=false;
    let routeTarget:number|null=null;
    if(supabase){
      const{data:userData}=await supabase.auth.getUser();
      if(userData.user){
        signedIn=true;
        const[{data:pref},{data:examAttempts}]=await Promise.all([
          supabase.from('student_exam_preferences').select('current_scores,weekly_hours,difficulty_topics,selected_university_id').eq('user_id',userData.user.id).eq('exam_id',model.examId).maybeSingle(),
          supabase.from('student_practice_attempts').select('exam_id,area,skill_name,correct,created_at').eq('user_id',userData.user.id).eq('exam_id',model.examId).order('created_at',{ascending:false}).limit(400),
        ]);
        if(university&&university.area_university_id>0){
          const{data:routeData}=await supabase.from('student_exam_route_scores').select('current_scores,target_override').eq('user_id',userData.user.id).eq('area_university_id',university.area_university_id).eq('course_label',course).eq('route_key',model.routeKey??selectedRouteKey).maybeSingle();
          if(routeData?.current_scores&&typeof routeData.current_scores==='object')saved=routeData.current_scores as Record<string,number>;
          if(routeData?.target_override!=null&&Number.isFinite(Number(routeData.target_override))&&Number(routeData.target_override)>0)routeTarget=Number(routeData.target_override);
        }
        if(!alive)return;
        setAttempts((examAttempts??[]) as Attempt[]);
        if(!Object.keys(saved).length&&(!university||university.area_university_id<=0)&&(!pref?.selected_university_id||Number(pref.selected_university_id)<=0)&&pref?.current_scores&&typeof pref.current_scores==='object')saved=pref.current_scores as Record<string,number>;
        if(pref?.weekly_hours){setWeeklyHours(Number(pref.weekly_hours));setAppliedWeeklyHours(Number(pref.weekly_hours))}
        if(pref?.difficulty_topics&&typeof pref.difficulty_topics==='object')setDifficultyTopics(pref.difficulty_topics as DifficultySelection);else setDifficultyTopics({});
        await reloadDiagnostics(userData.user.id,model.examId);
      }
    }
    if(!alive)return;
    if(!signedIn){
      try{
        const localAttempts=JSON.parse(localStorage.getItem(GUEST_ATTEMPTS_KEY)||'[]');
        setAttempts(Array.isArray(localAttempts)?(localAttempts as Attempt[]).filter(row=>row.exam_id===model.examId).slice(0,400):[]);
      }catch{setAttempts([])}
    }
    if(routeTarget===null){const rawTarget=localStorage.getItem(`${scoreStorageKey}:target`);const localTarget=rawTarget===null?NaN:Number(rawTarget);routeTarget=Number.isFinite(localTarget)&&localTarget>0?localTarget:null}
    const next=normalizeStoredScores(model,{...stored,...saved},false);setValues(next);setAppliedValues(next);setTargetOverride(routeTarget);setLoadedScoreKey(scoreStateKey);setDirty(false);setQuestionArea('Todas');setActiveQuestion(null);setSelectedOption('');setPracticeResult(null);localStorage.setItem('conectae:active-exam',model.examId);
  })().catch(()=>{if(alive)setMessage('Não foi possível carregar suas notas. Reabra o plano para tentar novamente.')});return()=>{alive=false}},[scoreStateKey,scoreStorageKey,model,metrics,university,course,selectedRouteKey]);

  useEffect(()=>{const handler=()=>void reloadDiagnostics(undefined,model.examId);window.addEventListener('conectae:diagnostic-saved',handler);return()=>window.removeEventListener('conectae:diagnostic-saved',handler)},[model.examId]);

  const allowedQuestions=useMemo(()=>questions.filter(q=>q.exam_id===model.examId&&model.allowedQuestionAreas.some(a=>normalize(a)===normalize(q.area)||matchQuestionArea(q.area,a))),[questions,model]);
  const examAreas=['Todas',...Array.from(new Set(allowedQuestions.map(q=>q.area)))];
  const filteredQuestions=questionArea==='Todas'?allowedQuestions:allowedQuestions.filter(q=>q.area===questionArea);

  const activeCutoff=useMemo(()=>{
    if(!university)return null;
    return cutoffs
      .filter(c=>normalize(c.institution)===normalize(university.university_name)&&normalize(c.exam_id)===normalize(model.admissionExamId??model.examId)&&normalize(c.course_label)===normalize(course))
      .sort((a,b)=>b.year-a.year||Number(b.target_value)-Number(a.target_value))[0]??null;
  },[cutoffs,university,model.examId,model.admissionExamId,course]);
  const effectiveTarget=targetOverride??model.target?.value??(activeCutoff?Number(activeCutoff.target_value):null);
  const dataGoals=useMemo<Record<string,number>>(()=>{
    const goals:Record<string,number>={};
    if(effectiveTarget===null||!Number.isFinite(Number(effectiveTarget))||Number(effectiveTarget)<=0)return goals;
    if(isEnemScoringModel(model))return {...goals,...enemGoalsFromCutoff(Number(effectiveTarget))};
    if(model.examId==='fuvest'&&activeCutoff){
      const first=metrics.find(m=>m.key==='1ª fase');
      if(!first)return goals;
      const historicalMax=Number(activeCutoff.max_value||90);
      goals['1ª fase']=Math.ceil(Number(activeCutoff.target_value)/Math.max(1,historicalMax)*first.max);
      return goals;
    }
    Object.assign(goals,componentGoals(model,effectiveTarget,targetOverride!==null));
    return goals;
  },[activeCutoff,effectiveTarget,model,metrics,targetOverride]);

  const diagnosis:Priority[]=useMemo(()=>{
    const averageWeight=metrics.reduce((sum,metric)=>sum+(metric.weight&&metric.weight>0?metric.weight:1),0)/Math.max(1,metrics.length);
    return metrics.map(metric=>{
      const current=appliedValues[metric.key]??metric.defaultValue;
      const goal=goalFor(metric,model,dataGoals[metric.key]);
      const studyKey=metric.studyArea??metric.key;
      const relevant=attempts.filter(a=>a.exam_id===model.examId&&matchQuestionArea(a.area,studyKey)&&a.correct!==null).slice(0,40);
      const accuracy=relevant.length?relevant.filter(x=>x.correct).length/relevant.length:null;
      const missing=Math.max(0,goal-current);
      const sampleSize=relevant.length;
      const sampleConfidence=Math.min(1,sampleSize/8);
      const performanceMultiplier=accuracy==null?1:accuracy<.6?1+.25*sampleConfidence:accuracy>.85?1-.2*sampleConfidence:1;
      const weightImpact=(metric.weight&&metric.weight>0?metric.weight:1)/Math.max(.1,averageWeight);
      const score=(missing/Math.max(1,metric.max))*performanceMultiplier*weightImpact;
      return{metric,current,goal,missing,score,accuracy,sampleSize,sampleConfidence};
    });
  },[metrics,appliedValues,attempts,model,dataGoals]);
  const priorities=useMemo(()=>[...diagnosis].sort((a,b)=>b.score-a.score),[diagnosis]);
  const readiness=Math.round((()=>{
    const rows=diagnosis.map(p=>{const declaredProgress=Math.min(1,p.current/Math.max(1,p.goal));if(p.accuracy==null||p.sampleConfidence<=0){const weight=p.metric.weight&&p.metric.weight>0?p.metric.weight:1;return{progress:declaredProgress,weight}}const measuredProgress=Math.min(1,p.accuracy/.8);const measuredWeight=.35*p.sampleConfidence;const progress=declaredProgress*(1-measuredWeight)+measuredProgress*measuredWeight;const weight=p.metric.weight&&p.metric.weight>0?p.metric.weight:1;return{progress,weight}});
    const totalWeight=rows.reduce((sum,row)=>sum+row.weight,0)||1;
    return rows.reduce((sum,row)=>sum+row.progress*row.weight,0)/totalWeight*100;
  })());
  const top=priorities[0];
  const relevantDiagnostics=useMemo(()=>diagnostics.filter(d=>d.exam_id===model.examId&&model.allowedQuestionAreas.some(a=>matchQuestionArea(d.area,a))).slice(0,8),[diagnostics,model]);
  const roadmap=useMemo(()=>buildRoadmap({model,course,priorities,weeklyHours:appliedWeeklyHours,questions:allowedQuestions,difficultyTopics,diagnostics:relevantDiagnostics.map(d=>({area:d.area,skill:d.diagnosis?.skill_name||d.skill_code||d.area}))}),[model,course,priorities,appliedWeeklyHours,allowedQuestions,difficultyTopics,relevantDiagnostics]);

  const questionBasedEnem=model.examId==='enem'&&model.scoreProfile==='component'&&metrics.filter(metric=>metric.unit==='acertos').length===4;
  const objectiveMetrics=useMemo(()=>metrics.filter(metric=>metric.unit==='acertos'),[metrics]);
  const currentObjectiveCorrect=useMemo(()=>objectiveMetrics.reduce((sum,metric)=>sum+Number(values[metric.key]??0),0),[objectiveMetrics,values]);
  const objectiveQuestionTotal=useMemo(()=>objectiveMetrics.reduce((sum,metric)=>sum+metric.max,0),[objectiveMetrics]);
  const currentOverall=useMemo(()=>calculateExamScore(model,values),[model,values]);
  const updateScore=(m:ExamMetric,n:number)=>{if(!scoresReady)return;const precision=m.max>=1000?10:1;const clean=Math.round(clamp(Number.isFinite(n)?n:0,0,m.max)*precision)/precision;setValues(v=>({...v,[m.key]:clean}));setDirty(true)};
  const save=async()=>{
    if(!scoresReady||!area||!university)return;
    setSaving(true);setMessage('');
    try{
      localStorage.setItem(scoreStorageKey,JSON.stringify(values));
      if(targetOverride!==null)localStorage.setItem(`${scoreStorageKey}:target`,String(targetOverride));else localStorage.removeItem(`${scoreStorageKey}:target`);
      localStorage.setItem('conectae:weekly-hours',String(weeklyHours));
      localStorage.setItem(GUEST_PREF_KEY,JSON.stringify({selectedArea,selectedUniversity,courseLabel:course,universityName:university.university_name,selectedRouteKey:model.routeKey??selectedRouteKey,weeklyHours,difficultyTopics}));
      setAppliedValues({...values});setAppliedWeeklyHours(weeklyHours);setDirty(false);
      if(!supabase){setMessage(`Plano recalculado e salvo neste dispositivo com ${weeklyHours}h por semana. Crie uma conta para sincronizar seu progresso.`);setTab('plano');return}
      const{data}=await supabase.auth.getUser();
      if(!data.user){setMessage(`Plano recalculado e salvo neste dispositivo com ${weeklyHours}h por semana. Crie uma conta para sincronizar seu progresso.`);setTab('plano');return}
      const routeKey=model.routeKey??selectedRouteKey;
      const preferencePayload={user_id:data.user.id,exam_id:model.examId,weekly_hours:weeklyHours,...(university&&university.area_university_id>0?{}:{current_scores:values}),selected_area_id:selectedArea,selected_university_id:university&&university.area_university_id>0?university.area_university_id:null,selected_route_key:routeKey,course_label:course,difficulty_topics:difficultyTopics,updated_at:new Date().toISOString()};
      const{error}=await supabase.from('student_exam_preferences').upsert(preferencePayload,{onConflict:'user_id,exam_id'});
      if(error)throw error;
      if(university&&university.area_university_id>0){
        const{error:routeError}=await supabase.from('student_exam_route_scores').upsert({user_id:data.user.id,area_university_id:university.area_university_id,course_label:course,route_key:routeKey,practice_exam_id:model.examId,current_scores:values,target_override:targetOverride,updated_at:new Date().toISOString()},{onConflict:'user_id,area_university_id,course_label,route_key'});
        if(routeError)throw routeError;
      }
      setMessage(`Plano recalculado com ${weeklyHours}h por semana (${weeklyHours*60} min) e sincronizado na sua conta.`);setTab('plano');
    }catch{setMessage('O plano ficou salvo neste dispositivo, mas não foi possível sincronizar com a conta agora.')}finally{setSaving(false)}
  };
  const openQuestion=(q?:Question)=>{const next=q??filteredQuestions[Math.floor(Math.random()*Math.max(1,filteredQuestions.length))]??allowedQuestions[0];setSimulationQueue([]);setSimulationResult(null);setActiveQuestion(next??null);setSelectedOption('');setPracticeResult(null);setQuestionStartedAt(Date.now())};
  const startSimulation=(requested:number,_label:string)=>{const byArea=new Map<string,Question[]>();for(const q of allowedQuestions){const rows=byArea.get(q.area)??[];rows.push(q);byArea.set(q.area,rows)}const groups=[...byArea.values()].map(rows=>[...rows].sort(()=>Math.random()-.5));const queue:Question[]=[];while(queue.length<Math.min(requested,allowedQuestions.length)&&groups.some(g=>g.length)){for(const group of groups){const next=group.shift();if(next&&queue.length<requested)queue.push(next)}}setSimulationQueue(queue);setSimulationIndex(0);setSimulationScore(0);setSimulationResult(null);setActiveQuestion(queue[0]??null);setSelectedOption('');setPracticeResult(null);setQuestionStartedAt(Date.now());if(!queue.length)setMessage('Ainda não há questões suficientes para iniciar este simulado.')};
  const advanceQuestion=()=>{if(simulationQueue.length){const nextIndex=simulationIndex+1;if(nextIndex<simulationQueue.length){setSimulationIndex(nextIndex);setActiveQuestion(simulationQueue[nextIndex]);setSelectedOption('');setPracticeResult(null);setQuestionStartedAt(Date.now())}else{const label=model.examId==='link'?'SPRINT dirigido':'simulado';setSimulationResult({correct:simulationScore,total:simulationQueue.length,label});setSimulationQueue([]);setActiveQuestion(null)}}else openQuestion()};
  const openAreaQuestions=(focus:string)=>{const pool=allowedQuestions.filter(q=>matchQuestionArea(q.area,focus));const next=pool[0];if(next){setQuestionArea(next.area);setTab('questoes');openQuestion(next)}else setTab('questoes')};
  const checkQuestion=async()=>{if(!activeQuestion||!selectedOption)return;const ok=selectedOption===activeQuestion.correct_option;setPracticeResult(ok);if(simulationQueue.length&&ok)setSimulationScore(s=>s+1);const attempt:Attempt={exam_id:model.examId,area:activeQuestion.area,skill_name:activeQuestion.skill_name,correct:ok,created_at:new Date().toISOString()};setAttempts(v=>[attempt,...v].slice(0,400));const saveGuestAttempt=()=>{try{const current=JSON.parse(localStorage.getItem(GUEST_ATTEMPTS_KEY)||'[]');const rows=Array.isArray(current)?current:[];localStorage.setItem(GUEST_ATTEMPTS_KEY,JSON.stringify([attempt,...rows].slice(0,400)))}catch{/* local persistence is best effort */}};try{if(!supabase){saveGuestAttempt();return}const{data}=await supabase.auth.getUser();if(!data.user){saveGuestAttempt();return}if(isSupplementalQuestion(activeQuestion.id)){await supabase.from('student_skill_diagnostics').insert({user_id:data.user.id,exam_id:model.examId,skill_code:null,area:activeQuestion.area,question_text:activeQuestion.prompt,correct:ok,confidence:1,error_type:ok?null:'questao_autoral',diagnosis:{source:'conectae_autoral_v2',skill_name:activeQuestion.skill_name,selected_option:selectedOption,correct_option:activeQuestion.correct_option}})}else{await supabase.from('student_practice_attempts').insert({user_id:data.user.id,exam_id:model.examId,question_id:activeQuestion.id,area:activeQuestion.area,skill_name:activeQuestion.skill_name,selected_option:selectedOption,correct:ok,duration_seconds:questionStartedAt?Math.max(1,Math.round((Date.now()-questionStartedAt)/1000)):null})}if(!ok)window.dispatchEvent(new CustomEvent('conectae:diagnostic-saved',{detail:{examId:model.examId,source:'practice_error'}}))}catch{setMessage('A resposta foi corrigida e entrou no plano atual, mas não foi possível sincronizar o histórico.')}};
  const tabs:[Tab,string,ReactNode][]=[['hoje','Hoje',<Home size={18}/>],['plano','Plano',<CalendarDays size={18}/>],['questoes','Questões',<BookOpen size={18}/>],['prova','Prova',<Trophy size={18}/>]];
  const objectiveQuestionCount=Math.round(metrics.filter(metric=>metric.unit==='acertos').reduce((sum,metric)=>sum+metric.max,0));
  const fallbackMini=model.examId==='fgv'?15:model.examId==='insper'?30:model.examId==='ibmec'||model.examId==='einstein'?25:20;
  const fallbackFull=model.examId==='fgv'?25:model.examId==='insper'?60:model.examId==='ibmec'||model.examId==='einstein'?50:30;
  const fullSimulationSize=Math.max(1,Math.round(model.fullSimulationSize??(model.roadmapMode==='balanced'&&objectiveQuestionCount>0?objectiveQuestionCount:fallbackFull)));
  const miniSimulationSize=Math.max(1,Math.min(fullSimulationSize,Math.round(model.miniSimulationSize??(model.roadmapMode==='balanced'?Math.min(30,Math.ceil(fullSimulationSize/2)):fallbackMini))));

  if(loading)return <div className="plan6" style={{display:'grid',placeItems:'center'}}><Loader2 className="animate-spin"/></div>;

  return <div className="plan6">
    <header className="plan6-top"><div className="plan6-shell plan6-topin"><button className="plan6-back" onClick={onBack}><ArrowLeft size={17}/>Voltar</button><div className="plan6-brand"><span className="plan6-mark">C</span><span>Conectaê</span></div><div className="plan6-kicker plan6-desktop-only">Plano de aprovação</div></div></header>
    <main className="plan6-shell">
      <section className="plan6-hero"><div><div className="plan6-eyebrow"><Target size={15}/>Seu plano adaptativo</div><h1>{questionBasedEnem?'Seus acertos viram um plano até a prova.':'Suas notas viram um plano até a prova.'}</h1><p className="plan6-lead">Edite seus resultados e clique em salvar. Só então o cronograma é recalculado, evitando mudanças acidentais enquanto você ainda está preenchendo.</p></div><aside className="plan6-summary"><strong>{roadmap.daysLeft}</strong><small>dias até a última etapa considerada</small><div className="plan6-progress"><span style={{width:`${readiness}%`}}/></div><div className="plan6-summary-row"><span>{model.title}</span><span><b>{readiness}%</b> prontidão</span></div></aside></section>
      <section id="course-target-settings" className="plan6-selectors">
        <div id="course-target-course" className="plan6-field"><label>Curso</label><select value={selectedArea} onChange={e=>{setSelectedArea(e.target.value);setDirty(true)}}>{areas.map(a=><option key={a.area_id} value={a.area_id}>{a.courses||a.name}</option>)}</select></div>
        <div id="course-target-university" className="plan6-field"><label>Faculdade</label><select value={selectedUniversity} onChange={e=>{setSelectedUniversity(e.target.value);setDirty(true)}}>{filteredUniversities.map(u=><option key={u.area_university_id} value={u.area_university_id}>{u.university_name}</option>)}</select></div>
        {routeOptions.length>1&&<div className="plan6-field"><label>Forma de ingresso</label><select value={model.routeKey??selectedRouteKey} onChange={e=>{setSelectedRouteKey(e.target.value);setDirty(true)}}>{routeOptions.map(row=><option key={row.route_key||'primary'} value={row.route_key||'primary'}>{row.route_label||row.route_key||'Processo principal'}</option>)}</select></div>}
        <button className="plan6-save" disabled={saving||!scoresReady} onClick={save}>{saving?<Loader2 size={16} className="animate-spin"/>:<Save size={16}/>}Salvar curso, faculdade e atualizar plano</button>
      </section>
      {dirty&&<div className="plan6-message">Alterações ainda não aplicadas. Ao salvar, o plano passará a usar <b>{weeklyHours}h/semana ({weeklyHours*60} min)</b> junto com suas novas notas e dificuldades.</div>}
      {message&&<div className="plan6-message">{message}</div>}
      <nav className="plan6-tabs">{tabs.map(([id,label])=><button key={id} className={`plan6-tab ${tab===id?'active':''}`} onClick={()=>setTab(id)}>{label}</button>)}</nav>

      {tab==='hoje'&&<div className="plan6-grid">
        <section className="plan6-card span7"><div className="plan6-sectionlabel">Prioridade do plano</div><h2>{top?.metric.label??'Diagnóstico'}</h2><p>{top?.missing?`Faltam ${top.missing} ${top.metric.unit==='acertos'?'acertos':'pontos'} para a meta atual.`:'Meta atual atingida. O plano transfere mais tempo para a próxima prioridade.'}</p><div className="plan6-callout"><strong>Próxima semana</strong><p>{roadmap.weeks[0]?`${roadmap.weeks[0].focusLabel}: ${roadmap.weeks[0].topic}.`:'Cronograma encerrado para este ciclo.'}</p></div></section>
        <section className="plan6-card span5"><div className="plan6-sectionlabel">Seu ritmo</div><h2>{weeklyHours} horas por semana</h2><p>Altere o tempo e salve para recalcular o volume semanal.</p><input className="plan6-slider" type="range" min="3" max="30" step="1" value={weeklyHours} onChange={e=>{setWeeklyHours(Number(e.target.value));setDirty(true)}}/><div className="plan6-hour-scale"><span>3h</span><strong>{weeklyHours}h · {weeklyHours*60} min</strong><span>30h</span></div></section>
        <section id="planner-scores" className="plan6-card span12">
          <div className="plan6-sectionlabel">{questionBasedEnem?'Seus acertos':'Suas notas'} · {model.routeLabel??'processo selecionado'}</div>
          <h2>{course} · {university?.university_name}</h2>
          <p>{questionBasedEnem?'Campos sem resultado salvo começam em zero. Informe quantas questões você acerta em cada área; a Redação permanece em pontos.':'Campos sem nota salva começam em zero. Preencha suas notas reais antes de salvar e interpretar a prontidão.'}</p><p>{model.scoreInputHelp||'Preencha exatamente os resultados no formato mostrado abaixo. O cronograma só muda depois de salvar.'}</p>
          <div className="plan6-callout blue" style={{marginBottom:18}}>
            {questionBasedEnem?<><strong>Acertos objetivos agora: {currentObjectiveCorrect.toLocaleString('pt-BR',{maximumFractionDigits:0})} / {objectiveQuestionTotal} questões</strong><p>O plano usa seus acertos por área para definir prioridades. A Redação é tratada separadamente em pontos, porque não é composta por questões objetivas.</p></>:<><strong>Nota calculada agora: {currentOverall.toLocaleString('pt-BR',{maximumFractionDigits:1})}{model.overall?.max?` / ${model.overall.max}`:''}</strong><p>{effectiveTarget!==null?<>Meta usada no plano: <b>{Number(effectiveTarget).toLocaleString('pt-BR',{maximumFractionDigits:1})}</b>{model.target?.year?` · referência ${model.target.year}`:activeCutoff?` · referência ${activeCutoff.year} ${activeCutoff.modality}`:''}.</>:<>Ainda não há corte oficial atual estruturado para esta rota. O plano usa metas por componente e você pode informar uma meta geral abaixo.</>}</p><div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginTop:10}}><label style={{fontSize:12,fontWeight:800}}>Meta geral</label><input className="plan6-score-number" style={{width:110}} type="number" min="0" max={model.overall?.max??1000} step="0.1" value={targetOverride??''} placeholder={String(model.target?.value??activeCutoff?.target_value??'')} onChange={e=>{const raw=e.target.value;setTargetOverride(raw===''||!Number.isFinite(Number(raw))||Number(raw)<=0?null:clamp(Number(raw),0,model.overall?.max??1000));setDirty(true)}}/><span style={{fontSize:11,opacity:.7}}>{targetOverride!==null?'meta personalizada':model.target?.value?'referência verificada/planejada':activeCutoff?'última referência disponível':'opcional'}</span></div></>}
          </div>
          {metrics.map(m=>{const current=values[m.key]??m.defaultValue;const step=m.max>=1000?.1:1;const goal=goalFor(m,model,dataGoals[m.key]);const missing=Math.max(0,goal-current);const unitLabel=m.unit==='acertos'?'questões':'pontos';const goalLabel=m.unit==='acertos'?'acertos':'pontos';return <div className="plan6-statline" key={m.key}><div><div className="plan6-statname">{m.label}</div><div className="plan6-statmeta">Agora <b>{current.toLocaleString('pt-BR',{maximumFractionDigits:m.unit==='acertos'?0:1})}</b> de {m.max} {unitLabel} • meta de estudo {goal.toLocaleString('pt-BR',{maximumFractionDigits:m.unit==='acertos'?0:1})} {goalLabel}{m.weight&&m.weight!==1?` • peso ${m.weight.toLocaleString('pt-BR',{maximumFractionDigits:3})}`:''}{Number.isFinite(m.minimum)?` • mínimo ${m.minimum}`:''}</div><div className="plan6-score-control"><button type="button" onClick={()=>updateScore(m,current-step)}><Minus size={16}/></button><input className="plan6-slider" type="range" min="0" max={m.max} step={m.max>=1000?1:step} value={current} onChange={e=>updateScore(m,Number(e.target.value))}/><input className="plan6-score-number" type="number" min="0" max={m.max} step={step} value={current} onChange={e=>updateScore(m,Number(e.target.value||0))}/><button type="button" onClick={()=>updateScore(m,current+step)}><Plus size={16}/></button></div></div><div className="plan6-statvalue">{missing.toLocaleString('pt-BR',{maximumFractionDigits:m.unit==='acertos'?0:1})} {goalLabel} faltam</div></div>})}
          <div className="plan6-actions" style={{marginTop:18}}><button className="plan6-btn primary" disabled={saving||!scoresReady} onClick={save}><Save size={15}/>{questionBasedEnem?'Salvar acertos e atualizar meu plano':'Salvar notas e atualizar meu plano'}</button></div>
        </section>
      </div>}

      {tab==='plano'&&<div className="plan6-grid">
        <DifficultyProfile examId={model.examId} course={course} value={difficultyTopics} onChange={setDifficultyTopics} weeklyHours={appliedWeeklyHours}/>
        <section className="plan6-card span12"><div className="plan6-sectionlabel">Semana por semana</div><h2>{roadmap.weeks.length} semanas planejadas · {roadmap.dateLabel}</h2><p>O cronograma combina {questionBasedEnem?'acertos salvos':'notas salvas'}, tempo disponível, dificuldades que você marcou, erros em questões e diagnósticos enviados por foto. Tudo é redistribuído dentro das mesmas horas semanais.</p><div className="plan6-strengths">{roadmap.milestones.map(m=><span className="plan6-chip active" key={`${m.date}-${m.label}`}>{fmtDate(m.date)} · {m.label}</span>)}</div></section>
        {relevantDiagnostics.length>0&&<section className="plan6-card span12"><div className="plan6-sectionlabel"><Sparkles size={14} style={{display:'inline',marginRight:6}}/>Extras adicionados pelas suas dificuldades</div><h2>O plano está atacando o que você enviou.</h2><p>Cada diagnóstico recente influencia a prioridade e o tema das próximas semanas. A recuperação abaixo mostra o que foi detectado, sem criar horas fora do seu orçamento semanal.</p>{relevantDiagnostics.map(d=>{const skill=d.diagnosis?.skill_name||d.skill_code||d.area;const video=`https://www.youtube.com/results?search_query=${encodeURIComponent(`${skill} ${model.examId} aula revisão`)}`;return <div className="plan6-statline" key={d.id}><div><div className="plan6-statname">EXTRA · {d.area} — {skill}</div><div className="plan6-statmeta">{recoveryAction(d.error_type,d.area,skill)}{d.error_detail?` • ${d.error_detail}`:''}</div><div className="plan6-actions" style={{marginTop:10}}><button className="plan6-btn primary" onClick={()=>openAreaQuestions(d.area)}><BookOpen size={14}/>Questões desta dificuldade</button><a className="plan6-btn" href={video} target="_blank" rel="noreferrer"><Video size={14}/>Vídeo de recuperação</a></div></div><div className="plan6-statvalue">extra</div></div>})}</section>}
        {roadmap.weeks.map(w=><WeeklyPlanExperience key={`${w.week}-${w.start}`} week={w} examId={model.examId} formatDate={fmtDate} onOpenQuestions={openAreaQuestions}/>)}
      </div>}

      {tab==='questoes'&&<div className="plan6-grid"><section className="plan6-card span12"><div className="plan6-sectionlabel">Simulados executáveis</div><h2>{model.examId==='link'?'Treine cada decisão da Jornada Link':'Treine no ritmo da prova'}</h2><p>{model.examId==='link'?'Os blocos misturam matemática, business case, escrita e comunicação para preparar o SPRINT; PREP e entrevista continuam detalhados no plano semanal.':model.examId==='einstein'?'O simulado objetivo replica a distribuição das quatro grandes áreas; as questões dissertativas, a redação e a MME de Medicina aparecem no plano como treinos próprios.':model.examId==='ibmec'?'O simulado trabalha as áreas objetivas do vestibular; redação e dinâmica de competências aparecem como blocos próprios no plano.':model.examId==='fgv'?'O banco combina questões autorais de Matemática, Português, Inglês, Ciências Humanas e treinos de raciocínio para a 2ª fase discursiva, sempre sinalizados como conteúdo Conectaê.':'As questões são distribuídas entre as áreas disponíveis e cada resposta entra no seu diagnóstico.'}</p><div className="plan6-actions"><button className="plan6-btn primary" onClick={()=>startSimulation(10,'Treino rápido')}>Treino rápido · 10</button><button className="plan6-btn" onClick={()=>startSimulation(miniSimulationSize,'Mini-simulado')}>Mini-simulado · {miniSimulationSize}</button><button className="plan6-btn" onClick={()=>startSimulation(fullSimulationSize,model.examId==='link'?'SPRINT dirigido':'Simulado completo')}>{model.examId==='link'?'SPRINT dirigido · 30':`Completo · ${fullSimulationSize}`}</button></div>{simulationResult&&<div className="plan6-callout blue" style={{marginTop:16}}><strong>Resultado do {simulationResult.label}: {simulationResult.correct}/{simulationResult.total}</strong><p>{simulationResult.correct/simulationResult.total>=.8?'Bom domínio. Revise apenas os erros antes do próximo bloco.':'Revise as habilidades erradas no plano e refaça um treino rápido.'}</p></div>}</section><section className="plan6-card span12"><div className="plan6-sectionlabel">Banco de questões</div><h2>{filteredQuestions.length} questões compatíveis</h2><div className="plan6-qfilters">{examAreas.map(a=><button key={a} className={`plan6-chip ${questionArea===a?'active':''}`} onClick={()=>setQuestionArea(a)}>{a}</button>)}</div><div className="plan6-qgrid">{filteredQuestions.map(q=><button className="plan6-qitem" key={q.id} onClick={()=>openQuestion(q)}><div className="plan6-qtop"><span>{q.area}</span><span>nível {q.difficulty}/5</span></div><strong>{q.skill_name}</strong><p>{q.prompt}</p></button>)}</div></section></div>}

      {tab==='prova'&&<div className="plan6-grid"><section className="plan6-card span7"><div className="plan6-sectionlabel">{model.structureVerified===false?'Referência de planejamento':'Estrutura verificada usada'}</div><h2>{model.title}</h2><p>{model.structure}</p>{model.cycleLabel&&<p><b>Ciclo:</b> {model.cycleLabel}</p>}{model.notes&&<div className="plan6-message">{model.notes}</div>}<div className="plan6-strengths">{metrics.map(m=><span key={m.key} className="plan6-chip active">{m.label}{m.weight&&m.weight!==1?` · peso ${m.weight}`:''}{Number.isFinite(m.minimum)?` · mín. ${m.minimum}`:''}</span>)}</div><a className="plan6-btn" style={{marginTop:18}} href={model.officialSource} target="_blank" rel="noreferrer"><ExternalLink size={14}/>Ver fonte usada</a></section><section className="plan6-card span5"><div className="plan6-sectionlabel">Como adapta</div><h2>{questionBasedEnem?'Acertos + dificuldades + erros + tempo.':'Nota + peso + dificuldades + erros + tempo.'}</h2><p>{questionBasedEnem?'O plano prioriza as áreas em que faltam mais acertos para a meta de estudo e combina isso com seu desempenho recente, dificuldades e erros registrados.':'O plano dá mais importância às áreas com maior peso no processo selecionado e às maiores distâncias da meta. Erros medidos e dificuldades específicas refinam a distribuição, sem criar horas extras.'}</p><p style={{marginTop:12,fontSize:12,opacity:.72}}>Confiabilidade da estrutura: <b>{confidenceLabel(model.sourceConfidence)}</b>.</p></section></div>}
    </main>

    {activeQuestion&&<div className="plan6-modal"><div className="plan6-modalcard"><div className="plan6-modalmeta"><span>{simulationQueue.length?`${simulationIndex+1}/${simulationQueue.length} • `:''}{activeQuestion.area} • nível {activeQuestion.difficulty}/5</span><button className="plan6-back" onClick={()=>{setActiveQuestion(null);setSimulationQueue([])}}><X size={19}/></button></div><div className="plan6-prompt">{activeQuestion.prompt}</div>{(['A','B','C','D','E'] as const).map(letter=>{const value=activeQuestion[`option_${letter.toLowerCase()}` as keyof Question] as string|null;return value?<button key={letter} className={`plan6-option ${selectedOption===letter?'selected':''}`} onClick={()=>{if(practiceResult===null)setSelectedOption(letter)}}><strong>{letter}</strong><span>{value}</span></button>:null})}<div className="plan6-actions" style={{marginTop:16}}>{practiceResult===null?<button className="plan6-btn primary" disabled={!selectedOption} onClick={checkQuestion}><CheckCircle2 size={15}/>Responder e corrigir</button>:<button className="plan6-btn primary" onClick={advanceQuestion}><PlayCircle size={15}/>{simulationQueue.length&&simulationIndex===simulationQueue.length-1?'Ver resultado':'Próxima questão'}</button>}<button className="plan6-btn" onClick={()=>{setActiveQuestion(null);setSimulationQueue([])}}>Encerrar</button></div>{practiceResult!==null&&<div className={`plan6-answer ${practiceResult?'':'wrong'}`}><strong style={{display:'flex',alignItems:'center',gap:7}}>{practiceResult?<CheckCircle2 size={17}/>:<XCircle size={17}/>} {practiceResult?'Acertou.':'Ainda não.'}</strong><div style={{marginTop:7}}>Gabarito: <b>{activeQuestion.correct_option}</b></div><div style={{marginTop:6}}>{activeQuestion.explanation}</div></div>}</div></div>}
    <nav className="plan6-bottomnav">{tabs.map(([id,label,icon])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}>{icon}<span>{label}</span></button>)}</nav>
  </div>;
}
