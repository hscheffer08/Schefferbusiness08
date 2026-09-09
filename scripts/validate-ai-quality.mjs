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
const tutorV5=fs.readFileSync(new URL('../api/education-tutor-v5.ts',import.meta.url),'utf8');
const tutorPublic=fs.readFileSync(new URL('../api/education-tutor-public.ts',import.meta.url),'utf8');
const tutorV4=fs.readFileSync(new URL('../api/education-tutor-v4.ts',import.meta.url),'utf8');
const tutorV3=fs.readFileSync(new URL('../api/education-tutor-v3.ts',import.meta.url),'utf8');
const tutor=fs.readFileSync(new URL('../api/education-tutor-v2.ts',import.meta.url),'utf8');
const twin=fs.readFileSync(new URL('../src/lib/study-twin-engine.ts',import.meta.url),'utf8');
const premium=fs.readFileSync(new URL('../api/education-tutor-premium.ts',import.meta.url),'utf8');
const analyzerRoute=fs.readFileSync(new URL('../api/analyze-question.ts',import.meta.url),'utf8');
const analyzerV3=fs.readFileSync(new URL('../api/analyze-question-v3.ts',import.meta.url),'utf8');
const analyzer=fs.readFileSync(new URL('../api/analyze-question-v2.ts',import.meta.url),'utf8');
const tutorUi=fs.readFileSync(new URL('../src/components/AIEducationTutor.tsx',import.meta.url),'utf8');

if(!tutorRoute.includes("export { default } from './education-tutor-v5.js'"))throw new Error('A rota principal precisa usar a IA v5 com corpus educacional completo.');
if(!tutorV5.includes("from './education-tutor-public.js'"))throw new Error('A IA v5 precisa delegar ao núcleo público sem perder o corpus completo.');
for(const marker of ['official_vestibular_question_bank_v2','exam_intelligence_profiles','exam_study_resources','exam_resources','MODO TUTOR COMPLETO','resumos','mnemônicos','BASE DE CONHECIMENTO RECUPERADA'])if(!tutorV5.includes(marker))throw new Error(`Tutor v5 sem corpus/capacidade obrigatória: ${marker}.`);
for(const marker of ['publicAccess:true','dailyQuestionLimit:null','loginRequired:false'])if(!tutorV5.includes(marker))throw new Error(`Tutor v5 sem acesso público declarado: ${marker}.`);

// Keep validating the legacy quality layers because they remain regression references for
// the same reasoning, study-twin and exam-specific safeguards used by the public core.
if(!tutorV4.includes("from './education-tutor-v3.js'"))throw new Error('A IA v4 precisa preservar o enriquecimento do gêmeo da v3.');
for(const exam of ['ibmec','einstein'])if(!tutorV4.includes(`${exam}:`))throw new Error(`Tutor v4 sem contexto explícito: ${exam}.`);
for(const marker of ['QUALITY_CONTEXT','highRiskQuestion','quality-guard','CHECAGEM AVANÇADA','exemplos recuperados do banco são material de apoio'])if(!tutorV4.includes(marker))throw new Error(`Tutor v4 sem proteção de qualidade: ${marker}.`);
for(const marker of ['student_practice_attempts','student_skill_diagnostics','student_exam_preferences','melhor rendimento medido','prioridade observada','confiança','Método indicado','dificuldades declaradas'])if(!tutorV3.includes(marker))throw new Error(`Tutor v3 sem evidência obrigatória do gêmeo: ${marker}.`);
for(const marker of ['Beta(2,2)','focusScore','minutesPerWeek','successCriterion','declaredDifficulty','dominantError','evidenceScore'])if(!twin.includes(marker))throw new Error(`Gêmeo sem proteção analítica: ${marker}.`);
for(const marker of ['gpt-5.6-luna','adversarial-review','external-verification','unexpectedScript','agrees_with_preliminary','self_check_passed','uncertainty_reason','confidenceLabel','answerable','rankPractice','EXEMPLOS RECUPERADOS','adminUnlimited','premiumUnlimited','web_verified===true','needsBetterImage','student_seen_questions','source_exam_year','source_question_number','limit=1500','provenanceAware','seenQuestionAware'])if(!tutor.includes(marker))throw new Error(`Tutor v2 sem proteção obrigatória: ${marker}.`);
for(const exam of ['enem','fuvest','cmmg','insper','link'])if(!tutor.includes(`${exam}:`))throw new Error(`Tutor v2 sem perfil explícito: ${exam}.`);

for(const marker of ['gpt-5.6-luna','adversarial-review','external-verification','unexpectedScript','agrees_with_preliminary','self_check_passed','uncertainty_reason','confidenceLabel','answerable','rankPractice','web_verified === true','needsBetterImage','student_seen_questions','source_exam_year','source_question_number','publicAccess: true','dailyQuestionLimit: null'])if(!tutorPublic.includes(marker))throw new Error(`Tutor público sem proteção obrigatória: ${marker}.`);
for(const marker of ['GOOGLE_GENERATIVE_AI_API_KEY','google(DIRECT_MODEL)','anonymousClientId','placeholder(url.hostname)','anon-${clientId}'])if(!tutorPublic.includes(marker))throw new Error(`Tutor público sem resiliência obrigatória: ${marker}.`);
for(const exam of ['enem','fuvest','cmmg','insper','link','ibmec','einstein'])if(!tutorPublic.includes(`${exam}:`))throw new Error(`Tutor público sem perfil explícito: ${exam}.`);
if(!tutorPublic.includes("const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''"))throw new Error('Tutor público precisa aceitar requisições sem Authorization.');

if(!premium.includes("export { default } from './education-tutor.js'"))throw new Error('A rota Premium precisa reutilizar o tutor principal.');
if(!analyzerRoute.includes("export { default } from './analyze-question-v3.js'"))throw new Error('A rota de análise visual precisa usar a versão v3 contextual.');
if(!analyzerV3.includes("from './analyze-question-v2.js'"))throw new Error('O analisador v3 precisa preservar a revisão adversarial da v2.');
for(const exam of ['ibmec','einstein'])if(!analyzerV3.includes(`${exam}:`))throw new Error(`Analisador v3 sem contexto explícito: ${exam}.`);
for(const marker of ['gpt-5.6-luna','visual-review','self_check_passed','uncertainty_reason','agrees_with_preliminary','Taxonomia','origin_hint','needs_better_photo'])if(!analyzer.includes(marker))throw new Error(`Analisador v2 sem proteção obrigatória: ${marker}.`);
for(const exam of ['enem','fuvest','cmmg','insper','link'])if(!analyzer.includes(`${exam}:`))throw new Error(`Analisador v2 sem perfil explícito: ${exam}.`);
for(const marker of ["fetch('/api/education-tutor'",'confidenceReason','data.sources','Fontes:','Acesso livre','IA liberada para todos'])if(!tutorUi.includes(marker))throw new Error(`Interface da IA pública sem integração obrigatória: ${marker}.`);
if(!tutorUi.includes('clientId: tutorClientId()'))throw new Error('Interface da IA pública precisa separar o limite dos visitantes anônimos.');

const coverage=JSON.parse(fs.readFileSync(new URL('../tests/exam-ai-coverage.json',import.meta.url),'utf8'));
for(const exam of ['enem','cmmg'])if(!coverage.exams?.[exam])throw new Error(`Cobertura ausente: ${exam}.`);
const requiredSubjects={enem:['Humanas','Linguagens','Matemática','Natureza','Redação'],cmmg:['Biologia','Física','Inglês','Língua Portuguesa','Linguagens','Literatura','Matemática','Química','Redação']};
for(const [exam,subjects] of Object.entries(requiredSubjects))for(const subject of subjects)if(Number(coverage.exams[exam][subject]||0)<3)throw new Error(`Cobertura insuficiente: ${exam} / ${subject}.`);
for(const key of ['allActiveItemsHaveAnswerKey','allActiveItemsHaveExplanation','allActiveItemsHaveSourceBasis'])if(coverage.quality?.[key]!==true)throw new Error(`Falha de qualidade na base: ${key}.`);
const coveredSubjects=Object.values(coverage.exams).reduce((total,exam)=>total+Object.keys(exam).length,0);
console.log(`Guardrails estruturais da IA v5 pública validados: ${cases.length} casos difíceis catalogados, corpus educacional ampliado, gêmeo baseado em evidências, ${coveredSubjects} áreas ENEM/CMMG e 7 perfis de prova. Este teste não substitui avaliação ao vivo de acurácia do modelo.`);
