import { getExamModel, isSupportedInstitutionCourse } from '../src/lib/exam-models.ts';
import { getExamSkillCatalog } from '../src/lib/exam-skill-catalog.ts';
import { getMilestones, buildRoadmap } from '../src/lib/admissions-roadmap.ts';

const assert=(name,ok,detail='')=>{if(!ok){console.error(`FAIL ${name}${detail?` — ${detail}`:''}`);process.exitCode=1;return}console.log(`PASS ${name}`)};

const ibmec=getExamModel('Ibmec','Administração');
assert('Ibmec has its own exam profile',ibmec.examId==='ibmec');
assert('Ibmec objective structure totals 50',ibmec.metrics.filter(m=>['Linguagens','Matemática','Humanas'].includes(m.key)).reduce((s,m)=>s+m.max,0)===50);
assert('Ibmec includes essay and competency stage',ibmec.metrics.some(m=>m.key==='Redação')&&ibmec.metrics.some(m=>m.key==='Dinâmica'));
assert('Ibmec supported courses are constrained',isSupportedInstitutionCourse('Ibmec','Administração')&&!isSupportedInstitutionCourse('Ibmec','Medicina'));
const ibmecCatalog=getExamSkillCatalog('ibmec','Administração');
assert('Ibmec catalog includes English and dynamics',ibmecCatalog.subjects.some(s=>s.subject==='Língua Inglesa')&&ibmecCatalog.subjects.some(s=>s.area==='Dinâmica'));
assert('Ibmec roadmap has dedicated milestones',getMilestones('ibmec','Administração').some(m=>m.label.includes('Ibmec')));

const einstein=getExamModel('Faculdade Israelita de Ciências da Saúde Albert Einstein','Medicina');
assert('Einstein has its own exam profile',einstein.examId==='einstein');
assert('Einstein objective structure totals 50',einstein.metrics.filter(m=>['Linguagens','Humanas','Natureza','Matemática'].includes(m.key)).reduce((s,m)=>s+m.max,0)===50);
assert('Einstein models 5 discursive questions as 30-point block',einstein.metrics.some(m=>m.key==='Dissertativas'&&m.max===30));
assert('Einstein models essay as 20-point block',einstein.metrics.some(m=>m.key==='Redação'&&m.max===20));
assert('Einstein Medicine includes MME',einstein.metrics.some(m=>m.key==='MME'));
const einsteinAdmin=getExamModel('Faculdade Israelita de Ciências da Saúde Albert Einstein','Administração');
assert('Einstein non-Medicine does not add MME',!einsteinAdmin.metrics.some(m=>m.key==='MME'));
assert('Einstein supported courses include Biomedical Engineering',isSupportedInstitutionCourse('Faculdade Israelita de Ciências da Saúde Albert Einstein','Engenharia Biomédica'));
const einsteinCatalog=getExamSkillCatalog('einstein','Medicina');
assert('Einstein catalog includes discursive preparation and MME',einsteinCatalog.subjects.some(s=>s.area==='Dissertativas')&&einsteinCatalog.subjects.some(s=>s.area==='MME'));
assert('Einstein Medicine roadmap reaches MME milestone',getMilestones('einstein','Medicina').some(m=>m.label.includes('MME')));

const priorities=einstein.metrics.map(metric=>({metric,current:Math.round(metric.defaultValue*.8),goal:Math.max(1,Math.round(metric.max*.8)),missing:Math.max(1,Math.round(metric.max*.2)),score:metric.key==='Natureza'?1:.25,accuracy:null}));
const questions=Array.from({length:100},(_,i)=>({id:i+1,exam_id:'einstein',area:['Linguagens','Humanas','Natureza','Matemática'][i%4],skill_name:'Treino adaptado',prompt:`Questão ${i+1}`,difficulty:3}));
const roadmap=buildRoadmap({model:einstein,course:'Medicina',priorities,weeklyHours:10,questions,today:new Date('2026-09-06T12:00:00-03:00')});
assert('Einstein roadmap stays inside weekly budget',roadmap.weeks.every(w=>w.totalPlannedMinutes===600));
assert('Einstein roadmap switches to MME after written exam',roadmap.weeks.some(w=>w.phase.includes('2ª fase')&&w.focusKey==='MME'));

if(process.exitCode)process.exit(process.exitCode);
console.log('Ibmec and Einstein validation passed.');
