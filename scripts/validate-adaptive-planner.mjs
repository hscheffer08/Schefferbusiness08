import fs from 'node:fs';

const read=(p)=>fs.readFileSync(p,'utf8');
const planner=read('src/components/AdmissionsPlannerV11.tsx');
const roadmap=read('src/lib/admissions-roadmap.ts');
const catalog=read('src/lib/exam-skill-catalog.ts');
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
