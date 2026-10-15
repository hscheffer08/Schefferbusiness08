import fs from 'node:fs';

const gatePath = 'src/components/AdmissionsPlannerGate.tsx';
const mainPath = 'src/main.tsx';
const accountPath = 'src/lib/account-controls-mount.tsx';

const gate = fs.readFileSync(gatePath, 'utf8');
const main = fs.readFileSync(mainPath, 'utf8');
const account = fs.readFileSync(accountPath, 'utf8');

const requiredGatePatterns = [
  /useAuth\(\)/,
  /if\s*\(\s*loading\s*\)/,
  /auth['\"],\s*['\"]login/,
  /next['\"],\s*['\"]course/,
  /<Gate\b/,
];

for (const pattern of requiredGatePatterns) {
  if (!pattern.test(gate)) {
    console.error(`Planner access invariant failed: ${gatePath} is missing ${pattern}`);
    process.exit(1);
  }
}

const forbiddenGatePatterns = [
  /window\.location\.(?:replace|assign)\(['\"]\/\?auth=login&next=course['\"]\)/,
  /if\s*\(\s*loading\s*\|\|\s*!user\s*\)/,
];

for (const pattern of forbiddenGatePatterns) {
  if (pattern.test(gate)) {
    console.error(`Planner access invariant failed: ${gatePath} still requires an account to enter the course: ${pattern}`);
    process.exit(1);
  }
}

if (/<Auth\b/.test(gate)) {
  console.error(`Planner access invariant failed: ${gatePath} must not render a separate login. Authentication belongs to the shared account flow.`);
  process.exit(1);
}

if (!/import\s*\{\s*AuthProvider\s*\}\s*from\s*['\"]\.\/lib\/auth-context(?:\.tsx)?['\"]/.test(main) || !/<AuthProvider>/.test(main)) {
  console.error('Planner access invariant failed: src/main.tsx must own the single root AuthProvider.');
  process.exit(1);
}

if (/\bAuthProvider\b/.test(gate)) {
  console.error(`Planner access invariant failed: ${gatePath} must consume root auth and must not create a nested AuthProvider.`);
  process.exit(1);
}

if (/\bAuthProvider\b/.test(account)) {
  console.error(`Planner access invariant failed: ${accountPath} must consume root auth and must not create a nested AuthProvider.`);
  process.exit(1);
}

if (!/AdmissionsPlannerGate/.test(main)) {
  console.error('Planner access invariant failed: src/main.tsx must route the approval planner through AdmissionsPlannerGate.');
  process.exit(1);
}

if (/from ['\"]@\/components\/AdmissionsPlannerV\d+['\"]/.test(main)) {
  console.error('Planner access invariant failed: src/main.tsx must never import a planner version directly.');
  process.exit(1);
}

if (main.includes('CourseAccountGate')) {
  throw new Error('Course routes must not require a registered account to enter.');
}
for (const component of ['EssayCourse', 'PrivateCoursesHub', 'BiologyCourse']) {
  if (!main.includes(`<${component}/>`)) throw new Error(`${component} route must stay reachable without a course account gate`);
}
if (!main.includes('plannerOpen?') || !main.includes('<AdmissionsPlannerGate onBack={closePlanner}/>')) {
  throw new Error('Planner route must remain directly reachable.');
}
if (!gate.includes('Salvar progresso')) throw new Error('Preserve optional account action for cloud sync.');
if (!account.includes("url.searchParams.get('planner') === 'aprovacao'")) throw new Error('Preserve course deep links after optional login');
console.log('Planner access invariant OK: course entry is public and account login is optional.');

const planner = fs.readFileSync('src/components/AdmissionsPlannerV11.tsx', 'utf8');
const dashboard = fs.readFileSync('src/components/CourseDashboard.tsx', 'utf8');
const restorationChecks = [
  ['fetch all catalog pages', planner.includes('async function fetchAllCourseUniversities()') && planner.includes('.range(from,from+pageSize-1)')],
  ['stable ordering for pagination', planner.includes(".order('university_name').order('area_university_id')")],
  ['never silently replace a saved institution', planner.includes('A faculdade salva não está no catálogo carregado')],
  ['surface planner restoration errors', planner.includes('if(loadError)return')],
  ['guests may still enter the planner', !planner.includes('if(!userData.user)throw')],
  ['prefer complete saved dashboard course', dashboard.includes(".not('selected_area_id','is',null)")],
  ['scope weekly-hour updates to one exam', dashboard.includes(".eq('exam_id',pref.exam_id)")],
  ['do not reorder exams on hours change', dashboard.includes('update({weekly_hours:hours})')],
  ['surface dashboard restoration errors', dashboard.includes('if(loadError)return')],
];
for (const [name, passed] of restorationChecks) {
  if (!passed) throw new Error('Course restoration regression: ' + name);
}
console.log('Course restoration invariants OK: full catalog, saved selection, optional login, scoped hours and visible errors.');
