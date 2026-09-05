import fs from 'node:fs';

const cases=JSON.parse(fs.readFileSync(new URL('../tests/ai-hard-cases.json',import.meta.url),'utf8'));
const required=['id','area','trap','question','expectedBehavior'];
if(cases.length<20)throw new Error('A bateria de IA precisa ter pelo menos 20 casos difíceis.');
for(const c of cases){
  for(const key of required)if(!c[key])throw new Error(`Caso ${c.id||'sem id'} sem ${key}.`);
  if(c.expectedBehavior==='answer'&&(!Array.isArray(c.answerKey)||!c.answerKey.length))throw new Error(`Caso ${c.id} sem resposta esperada.`);
  if(['abstain','uncertain','verify'].includes(c.expectedBehavior)&&(!Array.isArray(c.missing)||!c.missing.length))throw new Error(`Caso ${c.id} sem motivo de incerteza.`);
}
const areas=new Set(cases.map(c=>c.area));if(areas.size<6)throw new Error('A bateria precisa cobrir pelo menos 6 áreas.');
const behaviors=new Set(cases.map(c=>c.expectedBehavior));for(const b of ['answer','abstain','uncertain','verify','challenge'])if(!behaviors.has(b))throw new Error(`Comportamento não testado: ${b}.`);

const tutorRoute=fs.readFileSync(new URL('../api/education-tutor.ts',import.meta.url),'utf8');
const tutor=fs.readFileSync(new URL('../api/education-tutor-v2.ts',import.meta.url),'utf8');
const premium=fs.readFileSync(new URL('../api/education-tutor-premium.ts',import.meta.url),'utf8');
const analyzerRoute=fs.readFileSync(new URL('../api/analyze-question.ts',import.meta.url),'utf8');
const analyzer=fs.readFileSync(new URL('../api/analyze-question-v2.ts',import.meta.url),'utf8');
const tutorUi=fs.readFileSync(new URL('../src/components/AIEducationTutor.tsx',import.meta.url),'utf8');

if(!tutorRoute.includes("export { default } from './education-tutor-v2.js'"))throw new Error('A rota principal precisa usar a IA v2.');
for(const marker of ['gpt-5.6-luna','adversarial-review','external-verification','unexpectedScript','agrees_with_preliminary','self_check_passed','uncertainty_reason','confidenceLabel','answerable','rankPractice','EXEMPLOS RECUPERADOS','adminUnlimited','premiumUnlimited','web_verified===true','needsBetterImage','student_seen_questions','source_exam_year','source_question_number','limit=1500','provenanceAware','seenQuestionAware'])if(!tutor.includes(marker))throw new Error(`Tutor v2 sem proteção obrigatória: ${marker}.`);
for(const exam of ['enem','fuvest','cmmg','insper','link'])if(!tutor.includes(`${exam}:`))throw new Error(`Tutor v2 sem perfil explícito: ${exam}.`);
if(!premium.includes("export { default } from './education-tutor.js'"))throw new Error('A rota Premium precisa reutilizar o tutor principal.');
if(!analyzerRoute.includes("export { default } from './analyze-question-v2.js'"))throw new Error('A rota de análise visual precisa usar a versão v2.');
for(const marker of ['gpt-5.6-luna','visual-review','self_check_passed','uncertainty_reason','agrees_with_preliminary','Taxonomia','origin_hint','needs_better_photo'])if(!analyzer.includes(marker))throw new Error(`Analisador v2 sem proteção obrigatória: ${marker}.`);
for(const exam of ['enem','fuvest','cmmg','insper','link'])if(!analyzer.includes(`${exam}:`))throw new Error(`Analisador v2 sem perfil explícito: ${exam}.`);
for(const marker of ["fetch('/api/education-tutor'",'data.premiumUnlimited','confidenceReason','data.sources','Fontes:'])if(!tutorUi.includes(marker))throw new Error(`Interface da IA sem integração obrigatória: ${marker}.`);

const coverage=JSON.parse(fs.readFileSync(new URL('../tests/exam-ai-coverage.json',import.meta.url),'utf8'));
for(const exam of ['enem','cmmg'])if(!coverage.exams?.[exam])throw new Error(`Cobertura ausente: ${exam}.`);
const requiredSubjects={enem:['Humanas','Linguagens','Matemática','Natureza','Redação'],cmmg:['Biologia','Física','Inglês','Língua Portuguesa','Linguagens','Literatura','Matemática','Química','Redação']};
for(const [exam,subjects] of Object.entries(requiredSubjects))for(const subject of subjects)if(Number(coverage.exams[exam][subject]||0)<3)throw new Error(`Cobertura insuficiente: ${exam} / ${subject}.`);
for(const key of ['allActiveItemsHaveAnswerKey','allActiveItemsHaveExplanation','allActiveItemsHaveSourceBasis'])if(coverage.quality?.[key]!==true)throw new Error(`Falha de qualidade na base: ${key}.`);
const coveredSubjects=Object.values(coverage.exams).reduce((total,exam)=>total+Object.keys(exam).length,0);
console.log(`Qualidade da IA v2 validada: ${cases.length} casos difíceis, ${coveredSubjects} áreas ENEM/CMMG, 5 perfis de prova e ${behaviors.size} comportamentos epistemológicos.`);
