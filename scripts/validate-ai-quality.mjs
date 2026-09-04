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
const tutor=fs.readFileSync(new URL('../api/education-tutor.ts',import.meta.url),'utf8');
const premium=fs.readFileSync(new URL('../api/education-tutor-premium.ts',import.meta.url),'utf8');
const analyzer=fs.readFileSync(new URL('../api/analyze-question.ts',import.meta.url),'utf8');
for(const marker of ['gpt-5.6-luna','selective-adversarial-review','unexpected-script-repair','agrees_with_preliminary','self_check_passed','uncertainty_reason','confidenceLabel','answerable'])if(!tutor.includes(marker))throw new Error(`Tutor sem proteção obrigatória: ${marker}.`);
for(const marker of ['gpt-5.6-luna','self_check_passed','uncertainty_reason']){if(!premium.includes(marker))throw new Error(`Premium sem proteção obrigatória: ${marker}.`);if(!analyzer.includes(marker))throw new Error(`Analisador sem proteção obrigatória: ${marker}.`);}
console.log(`Qualidade da IA validada: ${cases.length} casos, ${areas.size} áreas e ${behaviors.size} comportamentos epistemológicos.`);
