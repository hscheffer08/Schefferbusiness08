import fs from 'node:fs';

const gatePath = 'src/components/AdmissionsPlannerGate.tsx';
const mainPath = 'src/main.tsx';
const accountPath = 'src/lib/account-controls-mount.tsx';

const gate = fs.readFileSync(gatePath, 'utf8');
const main = fs.readFileSync(mainPath, 'utf8');
const account = fs.readFileSync(accountPath, 'utf8');

const requiredGatePatterns = [
  /useAuth\(\)/,
  /window\.location\.replace\(['\"]\/\?auth=login&next=course['\"]\)/,
  /if\s*\(\s*loading\s*\|\|\s*!user\s*\)/,
  /<Gate\b/,
];

for (const pattern of requiredGatePatterns) {
  if (!pattern.test(gate)) {
    console.error(`Planner auth invariant failed: ${gatePath} is missing ${pattern}`);
    process.exit(1);
  }
}

if (/<Auth\b/.test(gate)) {
  console.error(`Planner auth invariant failed: ${gatePath} must not render a separate login. Authentication belongs to the Home.`);
  process.exit(1);
}

if (!/import\s*\{\s*AuthProvider\s*\}\s*from\s*['\"]\.\/lib\/auth-context(?:\.tsx)?['\"]/.test(main) || !/<AuthProvider>/.test(main)) {
  console.error('Planner auth invariant failed: src/main.tsx must own the single root AuthProvider.');
  process.exit(1);
}

if (/\bAuthProvider\b/.test(gate)) {
  console.error(`Planner auth invariant failed: ${gatePath} must consume root auth and must not create a nested AuthProvider.`);
  process.exit(1);
}

if (/\bAuthProvider\b/.test(account)) {
  console.error(`Planner auth invariant failed: ${accountPath} must consume root auth and must not create a nested AuthProvider.`);
  process.exit(1);
}

if (!/AdmissionsPlannerGate/.test(main)) {
  console.error('Planner auth invariant failed: src/main.tsx must route the approval planner through AdmissionsPlannerGate.');
  process.exit(1);
}

if (/from ['\"]@\/components\/AdmissionsPlannerV\d+['\"]/.test(main)) {
  console.error('Planner auth invariant failed: src/main.tsx must never import a planner version directly.');
  process.exit(1);
}

console.log('Planner auth invariant OK: Home owns login and one root AuthProvider protects the approval planner.');
