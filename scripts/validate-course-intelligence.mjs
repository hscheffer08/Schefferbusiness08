import fs from 'node:fs';

const model = fs.readFileSync('src/lib/exam-models.ts', 'utf8');
const planner = fs.readFileSync('src/components/AdmissionsPlannerV11.tsx', 'utf8');

const checks = [
  ['UFMG uses a verified course allowlist', model.includes("if (university === 'UFMG') return UFMG_VERIFIED_COURSES.has(course);")],
  ['UFMG verified allowlist exists', model.includes('const UFMG_VERIFIED_COURSES = new Set([')],
  ['Generic fixed ENEM 32-per-area target is absent', !planner.includes("metric.key==='Redação'?820:32") && !planner.includes("metric.key === 'Redação' ? 820 : 32")],
  ['Planner consumes official cutoff references', planner.includes("from('admission_cutoff_references')")],
  ['Planner exposes data-calibrated goals', planner.includes('enemGoalsFromCutoff')],
];

const invalidUfmgLabels = [
  'Análise e Desenvolvimento de Sistemas',
  'Cinema e Audiovisual',
  'Engenharia de Software',
  'Gastronomia',
  'Gestão de Recursos Humanos',
  'Logística',
  'Marketing',
  'Moda',
  'Relações Internacionais',
  'Serviço Social',
];

const setMatch = model.match(/const UFMG_VERIFIED_COURSES = new Set\(\[([\s\S]*?)\]\);/);
const setBody = setMatch?.[1] ?? '';
for (const label of invalidUfmgLabels) {
  checks.push([`UFMG does not falsely expose ${label}`, !setBody.includes(`'${label}'`)]);
}

let failed = false;
for (const [name, ok] of checks) {
  if (ok) console.log(`PASS ${name}`);
  else {
    console.error(`FAIL ${name}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('Course intelligence validation passed.');
