import { useEffect, useMemo, useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  ArrowLeft, BookOpen, BrainCircuit, CalendarDays, CheckCircle2, ChevronRight,
  Clock3, Database, Download, ExternalLink, FileText, Flame, GraduationCap,
  Loader2, PlayCircle, Save, Sparkles, Target, TrendingUp, Video, X, XCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type ExamId = 'enem' | 'fuvest' | 'insper' | 'link' | 'cmmg';
type Tab = 'dashboard' | 'plan' | 'practice' | 'database';
type ExamProfile = { exam_id: ExamId; label: string; institution: string; exam_date: string | null; format_summary: string; official_source_url: string };
type SkillRow = { id: number; exam_id: ExamId; area: string; skill_code: string; skill_name: string; importance: number; diagnostic_tags: string[] };
type StudyResource = { id: number; exam_id: ExamId; area: string | null; skill_name: string | null; resource_type: string; title: string; url: string | null; search_query: string | null; description: string | null; official: boolean; priority: number };
type PracticeQuestion = { id: number; exam_id: ExamId; area: string; skill_name: string; difficulty: number; prompt: string; option_a: string | null; option_b: string | null; option_c: string | null; option_d: string | null; option_e: string | null; correct_option: string | null; explanation: string | null; estimated_minutes: number | null; source_basis: string | null };
type CourseTarget = { exam_id: ExamId; course_label: string; target_kind: string; target_value: number | null; target_range: { low?: number; high?: number }; area_weights: Record<string, number>; confidence: 'official' | 'historical' | 'estimated'; rationale: string | null };
type AcademicArea = { area_id: string; name: string; courses: string };
type University = { area_university_id: number; area_id: string; university_name: string; course_label: string; institution_type: string | null };
type Metric = { key: string; label: string; max: number; defaultValue: number; unit: string };
type Priority = { metric: Metric; current: number; goal: number; gap: number; score: number; skills: SkillRow[]; comfort: boolean };

type WeekPlan = {
  week: number; phase: string; focus: string; secondary: string; checkpoint: number; unit: string;
  p1?: Priority; p2?: Priority; hours: number; theoryHours: number; practiceHours: number; reviewHours: number; simulationHours: number;
  skills: SkillRow[]; questions: PracticeQuestion[]; resources: StudyResource[]; deliverables: string[];
};

const EXAM_ORDER: ExamId[] = ['enem', 'fuvest', 'insper', 'link', 'cmmg'];
const LABELS: Record<ExamId, string> = { enem: 'ENEM 2026', fuvest: 'FUVEST 2027', insper: 'Insper 2027.1', link: 'Link Journey 2027.1', cmmg: 'Ciências Médicas-MG 2027.1' };
const METRICS: Record<ExamId, Metric[]> = {
  enem: [
    { key:'Linguagens',label:'Linguagens',max:45,defaultValue:28,unit:'acertos' },
    { key:'Humanas',label:'Humanas',max:45,defaultValue:29,unit:'acertos' },
    { key:'Natureza',label:'Natureza',max:45,defaultValue:24,unit:'acertos' },
    { key:'Matemática',label:'Matemática',max:45,defaultValue:26,unit:'acertos' },
    { key:'Redação',label:'Redação',max:1000,defaultValue:760,unit:'pontos' },
  ],
  fuvest: [
    { key:'1ª fase',label:'1ª fase',max:80,defaultValue:52,unit:'acertos' },
    { key:'Português',label:'Português discursivo',max:100,defaultValue:58,unit:'%' },
    { key:'2ª fase',label:'Específicas 2ª fase',max:100,defaultValue:55,unit:'%' },
    { key:'Redação',label:'Redação',max:100,defaultValue:62,unit:'%' },
  ],
  insper: [
    { key:'Objetivas',label:'Objetivas',max:60,defaultValue:39,unit:'acertos' },
    { key:'Matemática',label:'Matemática',max:100,defaultValue:68,unit:'%' },
    { key:'Linguagens',label:'Linguagens',max:100,defaultValue:72,unit:'%' },
    { key:'Redação',label:'Redação',max:100,defaultValue:67,unit:'%' },
  ],
  link: [
    { key:'Matemática',label:'Matemática SPRINT',max:100,defaultValue:65,unit:'%' },
    { key:'Business Case',label:'Business case',max:100,defaultValue:58,unit:'%' },
    { key:'Escrita',label:'Comunicação escrita',max:100,defaultValue:68,unit:'%' },
    { key:'Oral',label:'Comunicação oral',max:100,defaultValue:70,unit:'%' },
    { key:'Portfólio',label:'PREP / portfólio',max:100,defaultValue:62,unit:'%' },
  ],
  cmmg: [
    { key:'Biologia',label:'Biologia',max:100,defaultValue:66,unit:'%' },
    { key:'Química',label:'Química',max:100,defaultValue:62,unit:'%' },
    { key:'Física',label:'Física',max:100,defaultValue:58,unit:'%' },
    { key:'Matemática',label:'Matemática',max:100,defaultValue:61,unit:'%' },
    { key:'Linguagens',label:'Linguagens',max:100,defaultValue:70,unit:'%' },
    { key:'Literatura',label:'Campo Geral',max:100,defaultValue:45,unit:'%' },
  ],
};

const norm = (s:string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const clamp = (n:number,min:number,max:number) => Math.max(min,Math.min(max,n));
const daysUntil = (date:string|null) => { if(!date) return null; const now=new Date(); now.setHours(0,0,0,0); return Math.max(0,Math.ceil((new Date(`${date}T12:00:00`).getTime()-now.getTime())/86400000)); };
const examFromUniversity = (name:string):ExamId => { const n=norm(name); if(n.includes('insper')) return 'insper'; if(n.includes('link school')||n==='link') return 'link'; if(n.includes('ciencias medicas')||n.includes('fcm-mg')) return 'cmmg'; if(n.includes('usp')||n.includes('universidade de sao paulo')) return 'fuvest'; return 'enem'; };
const weightFor = (m:Metric,w:Record<string,number>) => Object.entries(w).find(([k])=>norm(m.key).includes(norm(k))||norm(k).includes(norm(m.key)))?.[1] ?? 1;

function fallbackTarget(course:string,exam:ExamId):CourseTarget {
  const c=norm(course); const health=/medicina|odontologia|farmacia|biomedicina|enfermagem|fisioterapia|nutricao|veterinaria|fono/.test(c); const quant=/engenharia|computacao|economia|matematica|fisica|quimica/.test(c); const hum=/direito|relacoes internacionais|historia|geografia|letras|jornalismo/.test(c);
  const base=exam==='enem'?(health?815:quant?770:hum?755:735):exam==='link'?85:health?86:82;
  return { exam_id:exam,course_label:course,target_kind:exam==='enem'?'competitive_score':'readiness_pct',target_value:base,target_range:exam==='enem'?{low:base-15,high:base+15}:{low:base-5,high:Math.min(96,base+6)},area_weights:{},confidence:'estimated',rationale:'Meta competitiva de preparação; não representa corte oficial universal.' };
}

function baseTarget(exam:ExamId,m:Metric,target:CourseTarget){
  const base=target.target_value ?? (exam==='enem'?780:82); const w=weightFor(m,target.area_weights??{});
  if(exam==='enem'){
    if(m.key==='Redação') return clamp(Math.round(770+(base-700)*1.02+(w-.2)*120),760,960);
    return clamp(Math.round(29+Math.max(0,(base-700)/135)*10+(w-.2)*16),27,43);
  }
  if(m.key==='1ª fase') return clamp(Math.round(80*(base/100)),54,76);
  if(m.key==='Objetivas') return clamp(Math.round(60*(base/100)),40,58);
  return clamp(Math.round(78+(w-1)*12),Math.round(m.max*.68),m.max);
}

function youtubeSearch(q:string){ return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`; }
function questionOptions(q:PracticeQuestion){ return [['A',q.option_a],['B',q.option_b],['C',q.option_c],['D',q.option_d],['E',q.option_e]].filter((x):x is [string,string]=>Boolean(x[1])); }

export default function AdmissionsPlannerIntelligenceV4({ onBack }:{ onBack:()=>void }){
  const [tab,setTab]=useState<Tab>('dashboard');
  const [loading,setLoading]=useState(true);
  const [userId,setUserId]=useState('');
  const [profiles,setProfiles]=useState<ExamProfile[]>([]);
  const [skills,setSkills]=useState<SkillRow[]>([]);
  const [studyResources,setStudyResources]=useState<StudyResource[]>([]);
  const [questions,setQuestions]=useState<PracticeQuestion[]>([]);
  const [targets,setTargets]=useState<CourseTarget[]>([]);
  const [areas,setAreas]=useState<AcademicArea[]>([]);
  const [universities,setUniversities]=useState<University[]>([]);
  const [selectedArea,setSelectedArea]=useState('');
  const [selectedUniversity,setSelectedUniversity]=useState('');
  const [examId,setExamId]=useState<ExamId>('enem');
  const [values,setValues]=useState<Record<string,number>>({});
  const [comfortAreas,setComfortAreas]=useState<string[]>([]);
  const [weeklyHours,setWeeklyHours]=useState(10);
  const [message,setMessage]=useState('');
  const [saving,setSaving]=useState(false);
  const [practiceQueue,setPracticeQueue]=useState<PracticeQuestion[]>([]);
  const [practiceIndex,setPracticeIndex]=useState(0);
  const [selectedOption,setSelectedOption]=useState('');
  const [writtenAnswer,setWrittenAnswer]=useState('');
  const [practiceResult,setPracticeResult]=useState<boolean|null>(null);
  const [revealed,setRevealed]=useState(false);
  const [sessionCorrect,setSessionCorrect]=useState(0);
  const [sessionTotal,setSessionTotal]=useState(0);

  useEffect(()=>{ let live=true; (async()=>{
    if(!supabase){setLoading(false);return;}
    const {data:userData}=await supabase.auth.getUser(); if(!userData.user){setLoading(false);return;} setUserId(userData.user.id);
    const [p,s,sr,q,t,a,u,pref]=await Promise.all([
      supabase.from('exam_intelligence_profiles').select('exam_id,label,institution,exam_date,format_summary,official_source_url').in('exam_id',EXAM_ORDER),
      supabase.from('exam_skill_taxonomy').select('*').in('exam_id',EXAM_ORDER).order('importance',{ascending:false}),
      supabase.from('exam_study_resources').select('*').eq('active',true).in('exam_id',EXAM_ORDER).order('priority',{ascending:false}),
      supabase.from('exam_practice_questions').select('*').eq('active',true).in('exam_id',EXAM_ORDER),
      supabase.from('course_exam_targets').select('*').in('exam_id',EXAM_ORDER),
      supabase.from('academic_areas').select('area_id,name,courses').order('name'),
      supabase.from('area_universities').select('area_university_id,area_id,university_name,course_label,institution_type').order('university_name'),
      supabase.from('student_exam_preferences').select('*').eq('user_id',userData.user.id).order('updated_at',{ascending:false}).limit(1).maybeSingle(),
    ]);
    if(!live)return;
    const areaRows=(a.data??[]) as AcademicArea[]; const uniRows=(u.data??[]) as University[]; const pr=pref.data as {exam_id?:ExamId;comfort_areas?:string[];weekly_hours?:number;selected_area_id?:string;selected_university_id?:number}|null;
    setProfiles((p.data??[]) as ExamProfile[]); setSkills((s.data??[]) as SkillRow[]); setStudyResources((sr.data??[]) as StudyResource[]); setQuestions((q.data??[]) as PracticeQuestion[]); setTargets((t.data??[]) as CourseTarget[]); setAreas(areaRows); setUniversities(uniRows);
    const initialArea=pr?.selected_area_id && areaRows.some(x=>x.area_id===pr.selected_area_id)?pr.selected_area_id:(areaRows[0]?.area_id??'');
    const allowed=uniRows.filter(x=>x.area_id===initialArea); const initialUni=pr?.selected_university_id && allowed.some(x=>x.area_university_id===pr.selected_university_id)?String(pr.selected_university_id):String(allowed[0]?.area_university_id??'');
    setSelectedArea(initialArea); setSelectedUniversity(initialUni); if(pr?.exam_id) setExamId(pr.exam_id); setComfortAreas(pr?.comfort_areas??[]); setWeeklyHours(Number(pr?.weekly_hours??10)); setLoading(false);
  })(); return()=>{live=false}; },[]);

  const filteredUniversities=useMemo(()=>universities.filter(u=>u.area_id===selectedArea),[universities,selectedArea]);
  useEffect(()=>{ if(loading)return; if(!filteredUniversities.length){setSelectedUniversity('');return;} if(!filteredUniversities.some(u=>String(u.area_university_id)===selectedUniversity)) setSelectedUniversity(String(filteredUniversities[0].area_university_id)); },[filteredUniversities,selectedUniversity,loading]);
  const university=filteredUniversities.find(u=>String(u.area_university_id)===selectedUniversity)??null;
  const area=areas.find(a=>a.area_id===selectedArea)??null;
  const course=university?.course_label||area?.courses||area?.name||'Administração';
  useEffect(()=>{ if(university) setExamId(examFromUniversity(university.university_name)); },[university?.area_university_id]);

  useEffect(()=>{ const next=Object.fromEntries(METRICS[examId].map(m=>[m.key,m.defaultValue])); try{Object.assign(next,JSON.parse(localStorage.getItem(`conectae:exam-values:${examId}`)||'{}'));}catch{/*noop*/} setValues(next); },[examId]);
  useEffect(()=>{ if(Object.keys(values).length)localStorage.setItem(`conectae:exam-values:${examId}`,JSON.stringify(values)); },[examId,values]);

  useEffect(()=>{ if(loading||!userId||!selectedArea||!selectedUniversity||!university)return; const timer=window.setTimeout(async()=>{
    await supabase?.from('student_exam_preferences').upsert({user_id:userId,exam_id:examId,comfort_areas:comfortAreas,weekly_hours:weeklyHours,selected_area_id:selectedArea,selected_university_id:Number(selectedUniversity),course_label:course,updated_at:new Date().toISOString()},{onConflict:'user_id,exam_id'});
  },350); return()=>window.clearTimeout(timer); },[loading,userId,examId,comfortAreas,weeklyHours,selectedArea,selectedUniversity,university?.area_university_id,course]);

  const profile=profiles.find(p=>p.exam_id===examId)??null;
  const metrics=METRICS[examId]; const examSkills=skills.filter(s=>s.exam_id===examId); const examQuestions=questions.filter(q=>q.exam_id===examId); const examStudy=studyResources.filter(r=>r.exam_id===examId);
  const target=targets.find(t=>t.exam_id===examId&&norm(t.course_label)===norm(course))??fallbackTarget(course,examId);
  const remainingDays=daysUntil(profile?.exam_date??null);

  const targetValues=useMemo(()=>{ const bases=Object.fromEntries(metrics.map(m=>[m.key,baseTarget(examId,m,target)])) as Record<string,number>; const obj=metrics.filter(m=>m.key!=='Redação').map(m=>(values[m.key]??0)/m.max); const avg=obj.length?obj.reduce((a,b)=>a+b,0)/obj.length:.6; const out:Record<string,number>={}; for(const m of metrics){ const current=values[m.key]??0; const delta=current/m.max-avg; let adj=(m.max<=100?delta*m.max*.13:delta*50); if(comfortAreas.includes(m.key))adj+=m.max<=100?2:25; if(current>=bases[m.key])adj+=m.max<=100?2:20; const floor=examId==='enem'&&m.key!=='Redação'?24:m.max*.55; out[m.key]=clamp(Math.round(bases[m.key]+adj),Math.round(floor),m.max===1000?980:m.max); } return out; },[metrics,examId,target,values,comfortAreas]);

  const priorities:Priority[]=useMemo(()=>metrics.map(metric=>{ const current=values[metric.key]??0; const goal=targetValues[metric.key]??metric.max; const gap=Math.max(0,goal-current)/metric.max; const matching=examSkills.filter(s=>norm(s.area).includes(norm(metric.key))||norm(metric.key).includes(norm(s.area))); const imp=matching.length?Math.max(...matching.map(s=>Number(s.importance))):1; const comfort=comfortAreas.includes(metric.key); return{metric,current,goal,gap,score:gap*imp*(comfort?.75:1.22),skills:matching.slice(0,5),comfort}; }).sort((a,b)=>b.score-a.score),[metrics,values,targetValues,examSkills,comfortAreas]);
  const readiness=useMemo(()=>Math.round(priorities.reduce((s,p)=>s+Math.min(1,p.current/Math.max(1,p.goal)),0)/Math.max(1,priorities.length)*100),[priorities]);
  const weeks=Math.max(1,Math.min(12,remainingDays?Math.ceil(remainingDays/7):10));

  const weeklyPlan:WeekPlan[]=useMemo(()=>Array.from({length:weeks},(_,i)=>{
    const progress=(i+1)/weeks; const pool=priorities.slice(0,Math.max(3,Math.min(5,priorities.length))); const p1=pool[i%pool.length]; const p2=pool[(i+1)%pool.length]; const focus=p1?.metric.label??'Revisão geral'; const secondary=p2?.metric.label??'Consolidação'; const checkpoint=p1?Math.round(p1.current+(p1.goal-p1.current)*(1-Math.pow(1-progress,1.2))):0;
    const theoryHours=Math.max(.5,Math.round(weeklyHours*.25*2)/2); const practiceHours=Math.max(1,Math.round(weeklyHours*.45*2)/2); const reviewHours=Math.max(.5,Math.round(weeklyHours*.15*2)/2); const simulationHours=Math.max(.5,Math.round((weeklyHours-theoryHours-practiceHours-reviewHours)*2)/2);
    const areaMatches=examQuestions.filter(q=>norm(q.area).includes(norm(p1?.metric.key??''))||norm(p1?.metric.key??'').includes(norm(q.area))); const fallback=examQuestions.filter(q=>!areaMatches.some(a=>a.id===q.id)); const poolQ=[...areaMatches,...fallback]; const count=clamp(Math.round(weeklyHours*.65),4,10); const start=(i*count)%Math.max(1,poolQ.length); const rotated=[...poolQ.slice(start),...poolQ.slice(0,start)].slice(0,count);
    const resources=examStudy.filter(r=>!r.area||norm(r.area).includes(norm(p1?.metric.key??''))||norm(p1?.metric.key??'').includes(norm(r.area))).slice(0,4);
    const skillsForWeek=[...(p1?.skills??[]),...(p2?.skills??[])].filter((s,idx,arr)=>arr.findIndex(x=>x.skill_code===s.skill_code)===idx).slice(0,5);
    const phase=progress<.3?'Base + diagnóstico':progress<.7?'Volume + domínio':progress<.9?'Prova específica + velocidade':'Simulado + revisão final';
    return{week:i+1,phase,focus,secondary,checkpoint,unit:p1?.metric.unit??'%',p1,p2,hours:weeklyHours,theoryHours,practiceHours,reviewHours,simulationHours,skills:skillsForWeek,questions:rotated,resources,deliverables:[`Fechar ${rotated.length} questões com correção ativa`,`Revisar todos os erros e registrar o motivo`,`Atingir checkpoint de ${checkpoint} ${p1?.metric.unit??'%'}`,progress>.65?'Fazer bloco cronometrado no formato da prova':'Produzir resumo de uma página das principais lacunas']};
  }),[weeks,priorities,weeklyHours,examQuestions,examStudy]);

  const toggleComfort=(key:string)=>setComfortAreas(v=>v.includes(key)?v.filter(x=>x!==key):[...v,key]);
  const saveSimulation=async()=>{ setSaving(true);setMessage(''); try{ const rows=metrics.map(m=>({user_id:userId,exam_id:examId,exam_year:2026,area:m.key,correct:Math.round(values[m.key]??0),total:m.max,score:m.max>100?values[m.key]??0:null,occurred_at:new Date().toISOString().slice(0,10),metadata:{adaptive_target:targetValues[m.key],readiness,course,university:university?.university_name??null,comfort_areas:comfortAreas}})); const {error}=await supabase!.from('student_exam_attempts').insert(rows); if(error)throw error; setMessage('Simulado salvo. Metas e plano semanal foram recalculados.'); }catch{setMessage('Não foi possível salvar o simulado. Tente novamente.');}finally{setSaving(false);} };

  const startPractice=(qs:PracticeQuestion[])=>{ const list=qs.length?qs:examQuestions.slice(0,10); setPracticeQueue(list);setPracticeIndex(0);setSelectedOption('');setWrittenAnswer('');setPracticeResult(null);setRevealed(false);setSessionCorrect(0);setSessionTotal(0);setTab('practice'); };
  const activeQuestion=practiceQueue[practiceIndex]??null;
  const answerPractice=async()=>{ if(!activeQuestion)return; const objective=Boolean(activeQuestion.correct_option); if(objective&&!selectedOption)return; if(!objective&&!writtenAnswer.trim())return; const ok=objective?selectedOption===activeQuestion.correct_option:null; setPracticeResult(ok);setRevealed(true);setSessionTotal(v=>v+1);if(ok)setSessionCorrect(v=>v+1); try{ await supabase?.from('student_practice_attempts').insert({user_id:userId,exam_id:examId,question_id:activeQuestion.id,area:activeQuestion.area,skill_name:activeQuestion.skill_name,selected_option:objective?selectedOption:null,response_text:objective?null:writtenAnswer,correct:ok}); }catch{/* UI remains functional */} };
  const nextPractice=()=>{ if(practiceIndex>=practiceQueue.length-1){setMessage(`Sessão concluída: ${sessionCorrect}/${sessionTotal} objetivas corretas. O histórico já alimenta sua conta.`);setTab('plan');return;} setPracticeIndex(i=>i+1);setSelectedOption('');setWrittenAnswer('');setPracticeResult(null);setRevealed(false); };

  const addText=(doc:jsPDF,text:string,x:number,y:number,width=180,size=10)=>{doc.setFontSize(size);const lines=doc.splitTextToSize(text,width);doc.text(lines,x,y);return y+lines.length*(size*.48+1.2);};
  const downloadPdf=(weekIndex?:number)=>{ const doc=new jsPDF(); const list=weekIndex==null?weeklyPlan:[weeklyPlan[weekIndex]].filter(Boolean); let y=18; doc.setFontSize(19);doc.text('Conectaê — Plano de Aprovação',14,y);y+=9;y=addText(doc,`${course} · ${university?.university_name??''} · ${profile?.label??LABELS[examId]}`,14,y,180,10);y=addText(doc,`Prontidão ${readiness}% · ${weeklyHours}h/semana · Meta global ${target.target_value??'adaptativa'}`,14,y+2,180,10); for(const w of list){if(!w)continue;if(y>245){doc.addPage();y=18;}doc.setFontSize(14);doc.text(`Semana ${w.week} — ${w.phase}`,14,y);y+=7;y=addText(doc,`Foco: ${w.focus} | Secundária: ${w.secondary} | Checkpoint: ${w.checkpoint} ${w.unit}`,14,y);y=addText(doc,`Rotina: ${w.theoryHours}h teoria · ${w.practiceHours}h questões · ${w.reviewHours}h revisão de erros · ${w.simulationHours}h simulado`,14,y+1);y=addText(doc,`Habilidades: ${w.skills.map(s=>s.skill_name).join(' • ')||'revisão integrada'}`,14,y+1); doc.setFontSize(11);doc.text('Questões da semana',14,y+4);y+=10; w.questions.forEach((q,idx)=>{if(y>258){doc.addPage();y=18;}y=addText(doc,`${idx+1}. [${q.area} · ${q.skill_name}] ${q.prompt}`,16,y,176,9); questionOptions(q).forEach(([letter,opt])=>{y=addText(doc,`${letter}) ${opt}`,20,y,170,8);}); if(!q.correct_option){y=addText(doc,'Resposta: ________________________________________________________________',20,y+1,170,8);y=addText(doc,'________________________________________________________________________',20,y,170,8);} y+=2;}); doc.setFontSize(11);doc.text('Gabarito comentado',14,y+4);y+=10; w.questions.forEach((q,idx)=>{if(y>258){doc.addPage();y=18;}y=addText(doc,`${idx+1}. ${q.correct_option?`Alternativa ${q.correct_option}`:'Resposta discursiva'} — ${q.explanation||'Reveja a habilidade indicada e justifique o raciocínio.'}`,16,y,176,8);y+=1;}); y+=5; }
    doc.save(`conectae-${examId}-${weekIndex==null?'plano-completo':`semana-${weekIndex+1}`}.pdf`);
  };

  if(loading)return <div className="min-h-screen bg-[#070b16] flex items-center justify-center"><Loader2 className="w-9 h-9 animate-spin text-cyan-300"/></div>;

  return <div className="min-h-screen bg-[#070b16] text-ink-50">
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070b16]/95 backdrop-blur-xl"><div className="max-w-[1450px] mx-auto px-5 md:px-8 py-4 flex items-center justify-between"><button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-ink-300"><ArrowLeft className="w-4 h-4"/>Voltar</button><div className="flex items-center gap-2"><div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-300 to-violet-400 flex items-center justify-center"><BrainCircuit className="w-5 h-5 text-[#07111d]"/></div><div><div className="font-black">Conectaê Intelligence</div><div className="text-[10px] uppercase tracking-[.14em] text-cyan-200">Approval Engine v4</div></div></div><div className="hidden md:block text-xs text-emerald-200">✓ salvo na sua conta</div></div></header>

    <main className="max-w-[1450px] mx-auto px-5 md:px-8 py-7 pb-24">
      <section className="grid xl:grid-cols-[1.15fr_.85fr] gap-5 mb-6">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6 md:p-8"><div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-black text-cyan-100"><Sparkles className="w-4 h-4"/>plano pessoal salvo automaticamente</div><h1 className="text-3xl md:text-5xl font-black tracking-[-.035em] leading-[1.02] mt-4">Estude o que realmente aumenta sua chance.</h1><p className="text-ink-300 mt-4 max-w-3xl">Curso, faculdade, prova, simulados, matérias fortes, horas disponíveis, questões e erros ficam conectados ao mesmo plano.</p><div className="grid sm:grid-cols-2 gap-3 mt-6"><label className="text-xs font-bold text-ink-400">Curso<select value={selectedArea} onChange={e=>setSelectedArea(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b1424] px-3 py-3 text-sm text-white">{areas.map(a=><option key={a.area_id} value={a.area_id}>{a.courses||a.name}</option>)}</select></label><label className="text-xs font-bold text-ink-400">Faculdade<select value={selectedUniversity} onChange={e=>setSelectedUniversity(e.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#0b1424] px-3 py-3 text-sm text-white">{filteredUniversities.map(u=><option key={u.area_university_id} value={u.area_university_id}>{u.university_name}</option>)}</select></label></div><div className="mt-3 text-xs text-emerald-200">Curso e faculdade são salvos automaticamente na sua conta.</div></div>
        <div className="rounded-[28px] border border-cyan-300/15 bg-gradient-to-br from-cyan-300/[0.08] to-violet-400/[0.05] p-6"><div className="text-[10px] uppercase tracking-[.15em] text-ink-500 font-black">Prontidão estimada</div><div className="text-6xl font-black text-cyan-200 mt-2">{readiness}%</div><div className="mt-4 h-2 rounded-full bg-white/5 overflow-hidden"><div className="h-full bg-cyan-300 rounded-full" style={{width:`${readiness}%`}}/></div><div className="grid grid-cols-2 gap-3 mt-5"><div className="rounded-2xl bg-black/15 border border-white/10 p-4"><CalendarDays className="w-4 h-4 text-cyan-200"/><div className="text-xs text-ink-500 mt-2">Até a prova</div><div className="font-black">{remainingDays==null?'por etapas':`${remainingDays} dias`}</div></div><div className="rounded-2xl bg-black/15 border border-white/10 p-4"><Target className="w-4 h-4 text-fuchsia-200"/><div className="text-xs text-ink-500 mt-2">Meta global</div><div className="font-black">{target.target_value??'adaptativa'}{examId==='enem'?' pts':'%'}</div></div></div></div>
      </section>

      <nav className="flex gap-2 overflow-x-auto mb-6">{([['dashboard','Diagnóstico'],['plan','Plano semanal'],['practice','Questões'],['database','Banco da prova']] as [Tab,string][]).map(([id,label])=><button key={id} onClick={()=>setTab(id)} className={`whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-black ${tab===id?'border-cyan-300/40 bg-cyan-300/10 text-cyan-100':'border-white/10 text-ink-400'}`}>{label}</button>)}</nav>
      {message&&<div className="mb-5 rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.07] px-4 py-3 text-sm text-emerald-100">{message}</div>}

      {tab==='dashboard'&&<div className="grid xl:grid-cols-[1fr_.85fr] gap-5">
        <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6"><div className="flex items-center justify-between gap-3"><div><div className="text-xs uppercase tracking-[.14em] font-black text-cyan-200">Seu nível atual</div><h2 className="text-2xl font-black mt-1">Simulado por componente</h2></div><button onClick={saveSimulation} disabled={saving} className="rounded-xl bg-cyan-300 text-[#07111d] px-4 py-2.5 font-black text-sm inline-flex items-center gap-2"><Save className="w-4 h-4"/>{saving?'Salvando...':'Salvar simulado'}</button></div><div className="space-y-5 mt-6">{metrics.map(m=>{const value=values[m.key]??0;const goal=targetValues[m.key]??m.max;return <div key={m.key}><div className="flex justify-between items-end mb-2"><div><div className="font-black">{m.label}</div><div className="text-xs text-cyan-200">meta adaptativa: {goal} {m.unit} · {value>=goal?'meta atingida':`faltam ${Math.max(0,goal-value)}`}</div></div><div className="text-xl font-black">{value}</div></div><input type="range" min={0} max={m.max} step={m.max>100?10:1} value={value} onChange={e=>setValues(v=>({...v,[m.key]:Number(e.target.value)}))} className="w-full accent-cyan-300"/></div>})}</div></section>
        <section className="space-y-5"><div className="rounded-[28px] border border-amber-300/25 bg-amber-300/[0.06] p-6"><div className="text-xs uppercase tracking-[.14em] text-amber-200 font-black">Matérias de conforto</div><h2 className="text-xl font-black mt-1">Onde você ganha pontos com mais facilidade?</h2><p className="text-xs text-ink-500 mt-2">Marcar uma força reduz a carga de recuperação, mas pode elevar a meta nessa área para compensar lacunas.</p><div className="flex flex-wrap gap-2 mt-4">{metrics.map(m=><button key={m.key} onClick={()=>toggleComfort(m.key)} className={`rounded-xl border px-3 py-2 text-sm font-bold ${comfortAreas.includes(m.key)?'border-emerald-300/40 bg-emerald-300/10 text-emerald-100':'border-white/10 text-ink-400'}`}>{comfortAreas.includes(m.key)?'✓ ':''}{m.label}</button>)}</div><div className="mt-5"><label className="text-xs font-bold text-ink-400">Horas disponíveis por semana: <span className="text-white">{weeklyHours}h</span></label><input type="range" min={3} max={30} step={1} value={weeklyHours} onChange={e=>setWeeklyHours(Number(e.target.value))} className="w-full accent-amber-300 mt-2"/></div></div><div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6"><div className="text-xs uppercase tracking-[.14em] text-fuchsia-200 font-black">Prioridades</div><div className="space-y-3 mt-4">{priorities.slice(0,5).map((p,i)=><div key={p.metric.key} className="rounded-2xl border border-white/10 bg-black/15 p-4 flex items-center justify-between gap-3"><div><div className="text-xs text-ink-500">#{i+1}{p.comfort?' · força declarada':''}</div><div className="font-black">{p.metric.label}</div><div className="text-xs text-ink-500">{p.current} → {p.goal} {p.metric.unit}</div></div><TrendingUp className="w-4 h-4 text-cyan-200"/></div>)}</div></div></section>
      </div>}

      {tab==='plan'&&<section><div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5"><div><div className="text-xs uppercase tracking-[.14em] font-black text-violet-200">Plano de execução</div><h2 className="text-3xl font-black mt-1">{weeks} semanas até sua meta</h2><p className="text-sm text-ink-400 mt-2 max-w-3xl">Cada semana combina teoria, questões, correção de erros, revisão e simulado. As questões são selecionadas do banco da prova e podem ser respondidas aqui no Conectaê.</p></div><button onClick={()=>downloadPdf()} className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-3 text-sm font-black text-cyan-100 inline-flex items-center gap-2"><Download className="w-4 h-4"/>Plano completo + questões em PDF</button></div><div className="space-y-4">{weeklyPlan.map((w,idx)=><article key={w.week} className="rounded-[26px] border border-white/10 bg-white/[0.03] p-5 md:p-6"><div className="flex flex-col xl:flex-row xl:items-start justify-between gap-5"><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-cyan-300/10 border border-cyan-300/20 px-3 py-1 text-xs font-black text-cyan-100">SEMANA {w.week}</span><span className="text-xs text-ink-500">{w.phase}</span></div><h3 className="text-2xl font-black mt-3">{w.focus} <span className="text-ink-600">+</span> {w.secondary}</h3><div className="grid sm:grid-cols-4 gap-2 mt-4">{[[BookOpen,`${w.theoryHours}h`,'Teoria'],[PlayCircle,`${w.practiceHours}h`,'Questões'],[TrendingUp,`${w.reviewHours}h`,'Correção'],[Flame,`${w.simulationHours}h`,'Simulado']].map(([Icon,h,label])=>{const I=Icon as typeof BookOpen;return <div key={String(label)} className="rounded-xl border border-white/10 bg-black/15 p-3"><I className="w-4 h-4 text-cyan-200"/><div className="font-black mt-1">{String(h)}</div><div className="text-[10px] text-ink-500">{String(label)}</div></div>})}</div><div className="mt-4 rounded-2xl border border-violet-300/15 bg-violet-300/[0.04] p-4"><div className="text-[10px] uppercase tracking-wider text-violet-200 font-black">O que estudar</div><div className="flex flex-wrap gap-2 mt-2">{w.skills.map(s=><span key={s.skill_code} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-ink-300">{s.skill_name}</span>)}</div></div><div className="mt-4 grid md:grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 p-4"><div className="text-xs font-black text-ink-300">Entregas da semana</div>{w.deliverables.map(d=><div key={d} className="flex gap-2 text-xs text-ink-500 mt-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0"/>{d}</div>)}</div><div className="rounded-2xl border border-white/10 p-4"><div className="text-xs font-black text-ink-300">Checkpoint</div><div className="text-3xl font-black text-cyan-200 mt-2">{w.checkpoint} {w.unit}</div><div className="text-xs text-ink-500 mt-1">meta intermediária para {w.focus}</div></div></div></div><aside className="xl:w-[360px] space-y-3"><div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.05] p-4"><div className="font-black">{w.questions.length} questões selecionadas</div><div className="text-xs text-ink-500 mt-1">Com resposta e explicação dentro do site.</div><button onClick={()=>startPractice(w.questions)} className="mt-3 w-full rounded-xl bg-emerald-300 text-[#07111d] py-2.5 font-black text-sm">Resolver no Conectaê</button></div><div className="rounded-2xl border border-white/10 p-4"><div className="font-black text-sm flex items-center gap-2"><Video className="w-4 h-4 text-violet-200"/>Aulas e recursos</div><div className="space-y-2 mt-3">{w.resources.map(r=><a key={r.id} target="_blank" rel="noreferrer" href={r.url||youtubeSearch(`${r.search_query||r.title} ${w.skills[0]?.skill_name||w.focus}`)} className="block rounded-xl border border-white/10 bg-black/15 px-3 py-2.5 text-xs text-ink-300 hover:text-white">{r.official?'Fonte oficial: ':''}{r.title}<ExternalLink className="inline w-3 h-3 ml-1"/></a>)}</div></div><button onClick={()=>downloadPdf(idx)} className="w-full rounded-xl border border-white/10 py-3 text-sm font-black inline-flex items-center justify-center gap-2"><FileText className="w-4 h-4"/>PDF desta semana + gabarito</button></aside></div></article>)}</div></section>}

      {tab==='practice'&&<section className="max-w-4xl mx-auto"><div className="flex items-center justify-between gap-3 mb-5"><div><div className="text-xs uppercase tracking-[.14em] font-black text-emerald-200">Sala de questões</div><h2 className="text-3xl font-black mt-1">Resolva sem sair do Conectaê</h2></div>{practiceQueue.length>0&&<div className="text-sm text-ink-400">{practiceIndex+1}/{practiceQueue.length} · {sessionCorrect} acertos</div>}</div>{!activeQuestion?<div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-8 text-center"><Database className="w-10 h-10 text-ink-600 mx-auto"/><h3 className="font-black text-xl mt-3">Escolha uma lista</h3><p className="text-sm text-ink-500 mt-2">Você pode começar por uma semana do plano ou fazer uma lista geral da prova.</p><button onClick={()=>startPractice(examQuestions.slice(0,15))} className="mt-5 rounded-xl bg-cyan-300 text-[#07111d] px-5 py-3 font-black">Começar 15 questões de {profile?.label??LABELS[examId]}</button></div>:<div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6 md:p-8"><div className="flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-cyan-300/10 px-3 py-1 text-cyan-100 font-black">{activeQuestion.area}</span><span className="rounded-full bg-white/5 px-3 py-1 text-ink-400">{activeQuestion.skill_name}</span><span className="rounded-full bg-white/5 px-3 py-1 text-ink-400">dificuldade {activeQuestion.difficulty}/5</span></div><div className="text-lg md:text-xl font-bold leading-relaxed mt-5">{activeQuestion.prompt}</div>{activeQuestion.correct_option?<div className="space-y-2 mt-6">{questionOptions(activeQuestion).map(([letter,opt])=><button key={letter} disabled={revealed} onClick={()=>setSelectedOption(letter)} className={`w-full text-left rounded-2xl border p-4 transition-all ${selectedOption===letter?'border-cyan-300/50 bg-cyan-300/10':'border-white/10 bg-black/15'} ${revealed&&letter===activeQuestion.correct_option?'!border-emerald-300/50 !bg-emerald-300/10':''}` }><span className="font-black mr-2">{letter})</span>{opt}</button>)}</div>:<textarea value={writtenAnswer} disabled={revealed} onChange={e=>setWrittenAnswer(e.target.value)} placeholder="Escreva sua resposta completa e justifique o raciocínio..." className="mt-6 w-full min-h-44 rounded-2xl border border-white/10 bg-[#0b1424] p-4 text-sm outline-none focus:border-cyan-300/35"/>}{!revealed?<button onClick={answerPractice} disabled={activeQuestion.correct_option?!selectedOption:!writtenAnswer.trim()} className="mt-5 w-full rounded-xl bg-cyan-300 text-[#07111d] py-3.5 font-black disabled:opacity-40">Responder e ver correção</button>:<div className={`mt-5 rounded-2xl border p-5 ${practiceResult===false?'border-red-300/20 bg-red-300/[0.05]':'border-emerald-300/20 bg-emerald-300/[0.05]'}`}><div className="flex items-center gap-2 font-black">{practiceResult===false?<XCircle className="w-5 h-5 text-red-300"/>:<CheckCircle2 className="w-5 h-5 text-emerald-300"/>}{activeQuestion.correct_option?(practiceResult?'Correto':'Resposta incorreta'):'Resposta enviada — confira o critério'}</div>{activeQuestion.correct_option&&<div className="text-sm text-ink-300 mt-3">Gabarito: <strong>{activeQuestion.correct_option}</strong></div>}<div className="mt-3 text-sm leading-relaxed text-ink-300"><strong>Explicação:</strong> {activeQuestion.explanation||'Revise a habilidade e compare seu raciocínio com o conteúdo estudado.'}</div><button onClick={nextPractice} className="mt-4 rounded-xl bg-white text-[#07111d] px-5 py-2.5 font-black text-sm">{practiceIndex===practiceQueue.length-1?'Concluir sessão':'Próxima questão'}</button></div>}</div>}</section>}

      {tab==='database'&&<div className="grid xl:grid-cols-2 gap-5"><section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6"><div className="text-xs uppercase tracking-[.14em] text-cyan-200 font-black">Banco da prova</div><h2 className="text-2xl font-black mt-1">{profile?.label??LABELS[examId]}</h2><p className="text-sm text-ink-400 mt-3 leading-relaxed">{profile?.format_summary||'Estrutura específica da seleção.'}</p><div className="grid grid-cols-3 gap-3 mt-5"><div className="rounded-xl border border-white/10 p-4"><div className="text-2xl font-black">{examQuestions.length}</div><div className="text-[10px] text-ink-500">QUESTÕES</div></div><div className="rounded-xl border border-white/10 p-4"><div className="text-2xl font-black">{examSkills.length}</div><div className="text-[10px] text-ink-500">HABILIDADES</div></div><div className="rounded-xl border border-white/10 p-4"><div className="text-2xl font-black">{examStudy.length}</div><div className="text-[10px] text-ink-500">RECURSOS</div></div></div><button onClick={()=>startPractice(examQuestions.slice(0,20))} className="mt-5 w-full rounded-xl bg-cyan-300 text-[#07111d] py-3 font-black">Fazer lista de 20 questões</button></section><section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-6"><div className="text-xs uppercase tracking-[.14em] text-violet-200 font-black">Fontes e aulas</div><div className="space-y-3 mt-4">{examStudy.map(r=><a key={r.id} href={r.url||youtubeSearch(r.search_query||r.title)} target="_blank" rel="noreferrer" className="block rounded-2xl border border-white/10 bg-black/15 p-4"><div className="font-black text-sm">{r.title}</div><div className="text-xs text-ink-500 mt-1">{r.description}</div></a>)}{profile?.official_source_url&&<a href={profile.official_source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-black text-cyan-200 mt-3">Fonte oficial da prova <ExternalLink className="w-4 h-4"/></a>}</div></section></div>}
    </main>
  </div>;
}
