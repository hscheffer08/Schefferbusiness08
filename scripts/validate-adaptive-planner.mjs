import fs from 'node:fs';

const read=(p)=>fs.readFileSync(p,'utf8');
const planner=read('src/components/AdmissionsPlannerV11.tsx');
const gate=read('src/components/AdmissionsPlannerGate.tsx');
const embeddedQuestions=read('src/components/EmbeddedQuestionBank.tsx');
const dashboard=read('src/components/CourseDashboard.tsx');
const roadmap=read('src/lib/admissions-roadmap.ts');
const catalog=read('src/lib/exam-skill-catalog.ts');
const granular=read('src/lib/granular-study-topics.ts');
const profiler=read('src/components/DifficultyProfile.tsx');
const progress=read('src/components/WeeklyPlanExperience.tsx');
const tutor=read('api/education-tutor-v2.ts');

const checks=[
  ['difficulty profiler is mounted',planner.includes('<DifficultyProfile')],
  ['declared difficulties are persisted',planner.includes('difficulty_topics:difficultyTopics')],
  ['photo diagnostics feed the roadmap',planner.includes('diagnostics:relevantDiagnostics.map')],
  ['roadmap accepts declared difficulty signals',roadmap.includes('difficultyTopics?:DifficultySelection')],
  ['roadmap boosts priorities from manual difficulties',roadmap.includes('manual.reduce((a,b)=>a+b.level')],
  ['roadmap uses photo diagnostics for priority',roadmap.includes('diagnosticFor')&&roadmap.includes('scans.length')],
  ['roadmap keeps the saved weekly hours as total budget',roadmap.includes('totalMinutes=Math.round(weeklyHours*60)')],
  ['catalog covers ENEM',catalog.includes("examId==='enem'")],
  ['catalog covers FUVEST',catalog.includes("examId==='fuvest'")],
  ['catalog covers Insper',catalog.includes("examId==='insper'")],
  ['catalog covers CMMG',catalog.includes("examId==='cmmg'")],
  ['catalog covers Link',catalog.includes("label:'Jornada Link'")],
  ['Insper catalog includes official essay criteria',catalog.includes('Revisão pelos quatro critérios oficiais do Insper')],
  ['Link catalog separates PREP and SPRINT',catalog.includes("subject:'PREP: trajetória acadêmica'")&&catalog.includes("subject:'SPRINT: business case'")],
  ['granular map covers exact school topics',['MRUV','Crase','Genética mendeliana','Era Vargas','Probabilidade condicional','Unit economics'].every(x=>granular.includes(x))],
  ['difficulty profiler expands the official catalog',profiler.includes('expandStudyCatalog')&&profiler.includes('countGranularTopics')],
  ['study twin clearly does not require submitted answers',profiler.includes('não precisa enviar prova, gabarito ou respostas')],
  ['study twin uses progressive disclosure',profiler.includes('Criar meu gêmeo')&&profiler.includes('started&&<>')],
  ['difficulty profiler supports topic search',profiler.includes('Busque um conteúdo: crase, MRUV, genética')],
  ['top declared difficulties feed exact roadmap diagnostics',profiler.includes('selectedDetails.slice(0,8)')&&profiler.includes("evidence_path:'manual_difficulty'")&&profiler.includes("conectae:diagnostic-saved")],
  ['course home prioritizes course, college, ENEM scores and twin',['Curso</span>','Faculdade</span>','Últimas notas do ENEM','Seu gêmeo de estudos'].every(x=>dashboard.includes(x))],
  ['study twin remains one tap from course home',dashboard.includes('onOpenTwin')&&dashboard.includes('Criar meu gêmeo')],
  ['mobile navigation has four clear destinations',gate.includes("['inicio','Início',Home]")&&gate.includes("['plano','Plano',Target]")&&gate.includes("['treinar','Treinar',BookOpenCheck]")&&gate.includes("['mais','Mais',LayoutGrid]")],
  ['secondary tools are grouped instead of stacked on course home',gate.includes("type TrainingView='hub'")&&gate.includes("type MoreView='hub'")],
  ['old floating shortcuts remain removed',!gate.includes('Próximo melhor movimento')&&!gate.includes('Treinar outras fases')&&!gate.includes('Corrigir simulado')&&!gate.includes('Atualizar meu gêmeo</button></div>')],
  ['Questions lives inside Training',gate.includes("['questoes','Questões','Pratique por matéria e conteúdo no banco de questões.'")&&gate.includes('<EmbeddedQuestionBank')],
  ['question bank is a dedicated module instead of hidden planner tab',!embeddedQuestions.includes('AdmissionsPlannerV11')&&embeddedQuestions.includes("exam_practice_questions")],
  ['question bank separates exams explicitly',['ENEM','CMMG','FUVEST','Insper','Link'].every(x=>embeddedQuestions.includes(`label:'${x}'`))],
  ['question bank separates provenance',embeddedQuestions.includes("official_adapted")&&embeddedQuestions.includes('Adaptada de prova real')&&embeddedQuestions.includes('Estilo da prova')],
  ['question bank exposes granular filters',embeddedQuestions.includes('Buscar conteúdo ou palavra-chave')&&embeddedQuestions.includes("label:'Matéria'")&&embeddedQuestions.includes("label:'Conteúdo'"))],
  ['question modal sits above permanent navigation',embeddedQuestions.includes('z-[200]')&&embeddedQuestions.includes("conectae:question-modal")&&embeddedQuestions.includes("document.body.style.overflow"))],
  ['question bank exposes executable simulations',planner.includes('startSimulation')&&planner.includes('SPRINT dirigido')],
  ['AI recognizes all exam fingerprints',tutor.includes('EXAM_FINGERPRINTS')&&['enem:','fuvest:','cmmg:','insper:','link:'].every(x=>tutor.includes(x))],
  ['AI falls back to the exam taxonomy',tutor.includes('taxonomyRefs')&&tutor.includes('const pool')],
  ['AI uses seen-question history',tutor.includes('student_seen_questions')&&tutor.includes('seen.has')],
  ['AI uses provenance metadata',tutor.includes('source_exam_year')&&tutor.includes('source_question_number')&&tutor.includes('provenanceAware')],
  ['weekly progress is account-persisted',progress.includes('student_weekly_plan_progress')],
  ['weekly progress is keyed by exam and week',progress.includes("eq('exam_id',examId)")&&progress.includes("eq('week_start',w.start)")],
];

let failed=false;
for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)failed=true;}
if(failed)process.exit(1);
console.log('Adaptive planner validation passed.');