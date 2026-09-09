import { buildRoadmap } from '../src/lib/admissions-roadmap-balanced.ts';
import { getExamModel } from '../src/lib/exam-models.ts';
import { getExamSkillCatalog, topicKey } from '../src/lib/exam-skill-catalog.ts';

const assert=(name,ok,detail='')=>{
  if(!ok){console.error(`FAIL ${name}${detail?` — ${detail}`:''}`);process.exitCode=1;return}
  console.log(`PASS ${name}`);
};

const model=getExamModel('UFMG','Medicina');
const priorities=model.metrics.map(metric=>({
  metric,
  current:metric.key==='Matemática'?Math.max(0,metric.defaultValue-8):metric.defaultValue,
  goal:metric.key==='Matemática'?Math.min(metric.max,metric.defaultValue+10):Math.min(metric.max,metric.defaultValue+2),
  missing:metric.key==='Matemática'?18:2,
  score:metric.key==='Matemática'?1:.08,
  accuracy:metric.key==='Matemática'?.42:.8,
}));
const questions=Array.from({length:60},(_,i)=>({
  id:i+1,
  exam_id:model.examId,
  area:['Matemática','Natureza','Linguagens','Humanas','Redação'][i%5],
  skill_name:['Funções e gráficos','Genética','Interpretação','Geopolítica','Argumentação'][i%5],
  prompt:`Questão sintética ${i+1}`,
  difficulty:3,
}));
const today=new Date('2026-11-09T12:00:00-03:00');

const five=buildRoadmap({model,course:'Medicina',priorities,weeklyHours:5,questions,today});
const twelve=buildRoadmap({model,course:'Medicina',priorities,weeklyHours:12,questions,today});
assert('5h weekly budget becomes exactly 300 planned minutes',five.weeks[0]?.totalPlannedMinutes===300,`got ${five.weeks[0]?.totalPlannedMinutes}`);
assert('12h weekly budget becomes exactly 720 planned minutes',twelve.weeks[0]?.totalPlannedMinutes===720,`got ${twelve.weeks[0]?.totalPlannedMinutes}`);
assert('changing weekly hours changes question volume',Number(twelve.weeks[0]?.questionTarget)>Number(five.weeks[0]?.questionTarget),`${five.weeks[0]?.questionTarget} -> ${twelve.weeks[0]?.questionTarget}`);
assert('session minutes stay inside the saved weekly budget',twelve.weeks.every(w=>w.sessionPlan.reduce((sum,s)=>sum+s.minutes,0)===w.totalPlannedMinutes));
assert('between ENEM days the plan mixes Natureza and Matemática',five.weeks[0]?.focusMix.length===2&&new Set(five.weeks[0].focusMix.map(f=>f.key)).size===2,JSON.stringify(five.weeks[0]?.focusMix));

const preFirstDay=buildRoadmap({model,course:'Medicina',priorities,weeklyHours:9,questions,today:new Date('2026-09-09T12:00:00-03:00')});
const normalWeeks=preFirstDay.weeks.slice(0,5);
assert('normal ENEM weeks carry three simultaneous study fronts',normalWeeks.length>0&&normalWeeks.every(w=>w.focusMix.length>=3),normalWeeks.map(w=>w.focusMix.map(f=>f.key).join('/')).join(' | '));
assert('no study front monopolizes more than 60% of directed weekly time',normalWeeks.every(w=>Math.max(...w.focusMix.map(f=>f.weight))<=.60),normalWeeks.map(w=>Math.max(...w.focusMix.map(f=>f.weight))).join(','));
const covered=new Set(normalWeeks.flatMap(w=>w.focusMix.map(f=>f.key)));
assert('five-week window rotates across at least four ENEM areas',covered.size>=4,[...covered].join(', '));
assert('before ENEM day 1 the plan still covers day-2 subjects',covered.has('Matemática')&&covered.has('Natureza'),[...covered].join(', '));
assert('before ENEM day 1 the plan still covers day-1 subjects',covered.has('Linguagens')||covered.has('Humanas')||covered.has('Redação'),[...covered].join(', '));
assert('balanced weeks preserve exact saved time',normalWeeks.every(w=>w.sessionPlan.reduce((sum,s)=>sum+s.minutes,0)===w.totalPlannedMinutes));

const catalog=getExamSkillCatalog(model.examId,'Medicina');
const mathSubject=catalog.subjects.find(s=>/matem/i.test(`${s.subject} ${s.area}`));
const chosenTopic=mathSubject?.topics.find(t=>/fun/i.test(t))??mathSubject?.topics[0];
assert('math topic exists in the official study catalog',Boolean(mathSubject&&chosenTopic));
if(mathSubject&&chosenTopic){
  const difficultyTopics={[topicKey(mathSubject.subject,chosenTopic)]:3};
  const manual=buildRoadmap({model,course:'Medicina',priorities,weeklyHours:9,questions,difficultyTopics,today});
  assert('declared topic-level difficulty reaches the weekly roadmap',manual.weeks.some(w=>w.focusMix.some(f=>f.topic===chosenTopic)),chosenTopic);
  assert('roadmap explains that declared difficulty influenced balancing',manual.weeks.some(w=>w.focusMix.some(f=>f.topic===chosenTopic&&f.reason.includes('dificuldade declarada'))));
}

const photo=buildRoadmap({model,course:'Medicina',priorities,weeklyHours:9,questions,diagnostics:[{area:'Matemática',skill:'Trigonometria'}],today});
assert('photo/manual diagnostic reaches the weekly roadmap',photo.weeks.some(w=>w.focusMix.some(f=>f.topic==='Trigonometria')||w.topic==='Trigonometria'));
assert('diagnostic influence is visible in focus reasoning',photo.weeks.some(w=>w.focusMix.some(f=>f.reason.includes('diagnóstico'))));

if(process.exitCode)process.exit(process.exitCode);
console.log('Adaptive integration validation passed.');
