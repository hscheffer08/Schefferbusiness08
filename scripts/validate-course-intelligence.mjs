import fs from 'node:fs';

const model = fs.readFileSync('src/lib/exam-models.ts', 'utf8');
const planner = fs.readFileSync('src/components/AdmissionsPlannerV11.tsx', 'utf8');

const checks = [
  ['UFMG uses a verified course allowlist', model.includes("if (university === 'UFMG') return UFMG_VERIFIED_COURSES.has(course);")],
  ['UFMG verified allowlist exists', model.includes('const UFMG_VERIFIED_COURSES = new Set([')],
  ['Generic fixed ENEM 32-per-area target is absent', !planner.includes("metric.key==='Redação'?820:32") && !planner.includes("metric.key === 'Redação' ? 820 : 32")],
  ['Planner consumes official cutoff references', planner.includes("from('admission_cutoff_references')")],
  ['Planner exposes data-calibrated goals', planner.includes('enemGoalsFromCutoff')],
  ['Planner taxonomy exposes 51 course labels', model.includes('SITE_PLANNER_COURSES') && model.includes("'Engenharia Biomédica'") && model.includes("'Terapia Ocupacional'")],
  ['Every course has an institution-neutral ENEM fallback', model.includes("{university:'ENEM — plano geral',courses:[...SITE_PLANNER_COURSES]}") && model.includes("if (university === 'ENEM — plano geral') return SITE_PLANNER_COURSE_SET.has(course);")],
  ['Planner keeps every academic area visible', planner.includes('const cleanAreas=(a??[]) as AcademicArea[];')],
  ['Planner creates a generic ENEM option per course area', planner.includes("university_name:GENERIC_ENEM_UNIVERSITY") && planner.includes('area_university_id:-100000-index')],
  ['Generic route does not persist a fake university foreign key', planner.includes('university&&university.area_university_id>0?university.area_university_id:null')],
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
