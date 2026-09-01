import fs from 'node:fs';

const gatePath = 'src/components/AdmissionsPlannerGate.tsx';
const mainPath = 'src/main.tsx';

const gate = fs.readFileSync(gatePath, 'utf8');
const main = fs.readFileSync(mainPath, 'utf8');

const requiredGatePatterns = [
  /AuthProvider/,
  /useAuth\(\)/,
  /if\s*\(\s*!user\s*\)/,
  /<Auth\b/,
  /<Gate\b/,
];

for (const pattern of requiredGatePatterns) {
  if (!pattern.test(gate)) {
    console.error(`Planner auth invariant failed: ${gatePath} is missing ${pattern}`);
    process.exit(1);
  }
}

if (!/AdmissionsPlannerGate/.test(main)) {
  console.error('Planner auth invariant failed: src/main.tsx must route the approval planner through AdmissionsPlannerGate.');
  process.exit(1);
}

if (/from ['\"]@\/components\/AdmissionsPlannerV\d+['\"]/.test(main)) {
  console.error('Planner auth invariant failed: src/main.tsx must never import a planner version directly.');
  process.exit(1);
}

console.log('Planner auth invariant OK: approval planner remains behind mandatory authentication.');
