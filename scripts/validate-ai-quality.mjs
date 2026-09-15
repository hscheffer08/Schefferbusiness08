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

// Validate the consolidated tutor entry point.
const tutorRoute=fs.readFileSync(new URL('../api/education-tutor.ts',import.meta.url),'utf8');
const analyzerRoute=fs.readFileSync(new URL('../api/analyze-question.ts',import.meta.url),'utf8');
const twin=fs.readFileSync(new URL('../src/lib/study-twin-engine.ts',import.meta.url),'utf8');
const tutorUi=fs.readFileSync(new URL('../src/components/AIEducationTutor.tsx',import.meta.url),'utf8');

// The consolidated tutor must contain all guardrails from the former v2–v6 chain.
const tutorMarkers=[
  'student_exam_preferences','area_universities','ALVO SALVO DO CURSO','targetUniversity','targetCourse',
  'official_vestibular_question_bank_v2','exam_intelligence_profiles','exam_study_resources','exam_resources',
  'MODO TUTOR COMPLETO','resumos','mnemônicos','BASE DE CONHECIMENTO RECUPERADA',
  'QUALITY_CONTEXT','highRiskQuestion','quality-guard','CHECAGEM AVANÇADA',
  'exemplos recuperados do banco são material de apoio',
  'student_practice_attempts','student_skill_diagnostics','student_exam_preferences',
  'melhor rendimento medido','prioridade observada','confiança','Método indicado','dificuldades declaradas',
  'gpt-5.6-luna','adversarial-review','external-verification','unexpectedScript',
  'agrees_with_preliminary','self_check_passed','uncertainty_reason','confidenceLabel',
  'answerable','rankPractice','EXEMPLOS RECUPERADOS','adminUnlimited','premiumUnlimited',
  'web_verified===true','needsBetterImage','student_seen_questions',
  'source_exam_year','source_question_number','limit=1500','provenanceAware','seenQuestionAware',
  'gpt-5.6-sol','anthropic/claude-opus-5','google/gemini-3.6-flash','DAILY_LIMIT = 10',
  'reserveDailyUse','ai_tutor_usage','dailyQuestionLimit:DAILY_LIMIT','remainingQuestions',
  'if (!userId) return json(res, 401',
];
for(const marker of tutorMarkers)if(!tutorRoute.includes(marker))throw new Error(`Tutor consolidado sem proteção obrigatória: ${marker}`);
for(const exam of ['enem','fuvest','cmmg','insper','link','ibmec','einstein'])if(!tutorRoute.includes(`${exam}:`))throw new Error(`Tutor sem perfil explícito: ${exam}`);

// The consolidated analyzer must contain visual review guardrails.
const analyzerMarkers=[
  'gpt-5.6-luna','visual-review','self_check_passed','uncertainty_reason',
  'agrees_with_preliminary','Taxonomia','origin_hint','needs_better_photo',
];
for(const marker of analyzerMarkers)if(!analyzerRoute.includes(marker))throw new Error(`Analisador sem proteção obrigatória: ${marker}`);
for(const exam of ['enem','fuvest','cmmg','insper','link','ibmec','einstein'])if(!analyzerRoute.includes(`${exam}:`))throw new Error(`Analisador sem perfil explícito: ${exam}`);

// Study twin engine markers.
for(const marker of ['Beta(2,2)','focusScore','minutesPerWeek','successCriterion','declaredDifficulty','dominantError','evidenceScore'])if(!twin.includes(marker))throw new Error(`Gêmeo sem proteção analítica: ${marker}`);

// UI integration markers.
for(const marker of ["fetch('/api/education-tutor'",'confidenceReason','data.sources','Fontes:'])if(!tutorUi.includes(marker))throw new Error(`Interface da IA sem integração obrigatória: ${marker}`);

const coverage=JSON.parse(fs.readFileSync(new URL('../tests/exam-ai-coverage.json',import.meta.url),'utf8'));
for(const exam of ['enem','cmmg'])if(!coverage.exams?.[exam])throw new Error(`Cobertura ausente: ${exam}.`);
const requiredSubjects={enem:['Humanas','Linguagens','Matemática','Natureza','Redação'],cmmg:['Biologia','Física','Inglês','Língua Portuguesa','Linguagens','Literatura','Matemática','Química','Redação']};
for(const [exam,subjects] of Object.entries(requiredSubjects))for(const subject of subjects)if(Number(coverage.exams[exam][subject]||0)<3)throw new Error(`Cobertura insuficiente: ${exam} / ${subject}.`);
for(const key of ['allActiveItemsHaveAnswerKey','allActiveItemsHaveExplanation','allActiveItemsHaveSourceBasis'])if(coverage.quality?.[key]!==true)throw new Error(`Falha de qualidade na base: ${key}.`);
const coveredSubjects=Object.values(coverage.exams).reduce((total,exam)=>total+Object.keys(exam).length,0);
console.log(`Guardrails estruturais da IA validados: ${cases.length} casos difíceis catalogados, GPT-5.6 Sol + revisão adversarial, limite diário server-side, corpus educacional ampliado, alvo salvo sincronizado, ${coveredSubjects} áreas ENEM/CMMG e 7 perfis de prova.`);
