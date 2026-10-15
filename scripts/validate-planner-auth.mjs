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

const courseGate = fs.readFileSync('src/components/CourseAccountGate.tsx', 'utf8');
if (!/if \(loading\)/.test(courseGate) || !/!user \|\| user.is_anonymous/.test(courseGate) || !main.includes('plannerOpen?<CourseAccountGate>')) {
  throw new Error('Course routes must wait for the shared session and require a registered user.');
}
for (const component of ['EssayCourse', 'PrivateCoursesHub', 'BiologyCourse']) {
  if (!main.includes(`<CourseAccountGate><${component}/></CourseAccountGate>`)) throw new Error(`${component} is missing its account gate`);
}
if (!account.includes("url.searchParams.get('planner') === 'aprovacao'")) throw new Error('Preserve course deep links after login');
console.log('Planner access invariant OK: course entry requires the shared account; authenticated tools keep the same session.');
