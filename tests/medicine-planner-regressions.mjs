import assert from 'node:assert/strict';
import fs from 'node:fs';
import { getExamModel, mergeRemoteExamModel, normalizeStoredScores, calculateExamScore } from '../src/lib/exam-models.ts';
import { componentGoals, goalFor } from '../src/lib/planner-goals.ts';
import { sameStudySubject } from '../src/lib/study-area-match.ts';
import { buildRoadmap } from '../src/lib/admissions-roadmap-balanced.ts';
import { officialReadingPage } from '../src/lib/official-reading-context.ts';
const fixtures=JSON.parse(fs.readFileSync(new URL('./fixtures/medicine-models.json',import.meta.url),'utf8'));
assert.equal(sameStudySubject('Educação Física e cultura corporal','Física'),false);
assert.equal(sameStudySubject('Física','Física'),true);
assert.equal(sameStudySubject('Língua estrangeira','Inglês'),true);
assert.equal(sameStudySubject('Língua Portuguesa e interpretação','Português'),true);
for(const row of fixtures){
 const model=mergeRemoteExamModel(getExamModel(row.university_name,row.course_label),row);
 const fallbackGoals=componentGoals(model,null);
 assert.deepEqual(fallbackGoals,{});
 assert.deepEqual(componentGoals(model,0),{});
 const values=normalizeStoredScores(model,{'Matemática':650,'Redação':800});
 for(const m of model.metrics){
  assert.ok(values[m.key]>=0&&values[m.key]<=m.max);
  assert.ok(goalFor(m,model,fallbackGoals[m.key])>=m.max*.6,`${row.university_name} ${m.key}: goal collapsed`);
 }
 const custom=componentGoals(model,model.overall.max*.85,true);
 assert.ok(calculateExamScore(model,custom)>=model.overall.max*.85);
 const priorities=model.metrics.map(metric=>({metric,current:values[metric.key],goal:goalFor(metric,model),missing:Math.max(0,goalFor(metric,model)-values[metric.key]),score:Math.max(0,goalFor(metric,model)-values[metric.key])/metric.max}));
 const roadmap=buildRoadmap({model,course:'Medicina',priorities,weeklyHours:9,questions:[],today:new Date('2026-10-04T12:00:00-03:00')});
 for(const week of roadmap.weeks){
  assert.equal(week.sessionPlan.reduce((s,r)=>s+r.minutes,0),540);
  assert.equal(week.videoTitle,`Aula dirigida: ${week.topic}`);
  assert.ok(decodeURIComponent(week.videoUrl).includes(week.topic));
  for(const f of week.focusMix){
   if(f.key==='Física')assert.doesNotMatch(f.topic,/corporais|corpo|esporte|Brasil Colônia/i);
   if(f.key==='Inglês')assert.doesNotMatch(f.topic,/revisão dirigida e questões/);
  }
 }
 console.log(`PASS ${row.university_name} / ${row.route_key}`);
}
const enem=getExamModel('ENEM — plano geral','Medicina');
assert.equal(normalizeStoredScores(enem,{'Matemática':0},false)['Matemática'],0);
const unrelated=mergeRemoteExamModel(enem,{university_name:'Test',course_label:'Medicina',exam_id:'enem',model:{components:[{key:'Física',max:7,unit:'acertos',goal:null}],target:{value:null},scoreProfile:'component'}});
assert.equal(unrelated.metrics[0].studyArea,undefined);
assert.equal(unrelated.metrics[0].goal,undefined);
assert.equal(unrelated.metrics[0].defaultValue,5);
const source='https://vestibular.cmmg.edu.br/wp-content/uploads/2026/07/CMMG_2-SEM_2026.pdf';
for(let q=1;q<=5;q++)assert.equal(officialReadingPage(source,q),3);
assert.equal(officialReadingPage(source,6),null);
assert.equal(officialReadingPage('https://example.com/CMMG_2-SEM_2026.pdf',1),null);
console.log('PASS null goals, subject isolation, score ranges, lesson consistency, time budgets and shared reading');
