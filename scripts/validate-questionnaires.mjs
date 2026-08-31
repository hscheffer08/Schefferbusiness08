import fs from 'node:fs';

const quiz = fs.readFileSync('src/components/Quiz.tsx', 'utf8');
const home = fs.readFileSync('src/lib/expanded-home-mount.tsx', 'utf8');
const vocational = fs.readFileSync('src/components/VocationalDemoPremium.tsx', 'utf8');
const qa = fs.readFileSync('scripts/qa-vocational-v2.cjs', 'utf8');

const checks = [
  [quiz.includes('clearProgress'), 'Quiz imports/uses clearProgress'],
  [quiz.includes('setAnswers({})') && quiz.includes('setCurrentStep(0)'), 'Start-over resets answers and step'],
  [quiz.includes("saveProgress({}, 0)"), 'Start-over persists an empty progress state'],
  [quiz.includes('onClick={() => void startFreshQuestionnaire()}'), 'Start-over button uses the real reset handler'],
  [home.includes('48 perguntas para cruzar interesses'), 'Home advertises 48 vocational questions'],
  [!home.includes('36 perguntas para cruzar interesses'), 'Stale 36-question copy is absent'],
  [vocational.includes('48 perguntas'), 'Vocational intro displays 48 questions'],
  [qa.includes('VOCATIONAL_QUESTIONS.length !== 48'), 'Synthetic QA enforces 48 vocational questions'],
  [qa.includes('VOCATIONAL_COURSES.length !== 50'), 'Synthetic QA enforces 50 vocational courses'],
];

const failed = checks.filter(([ok]) => !ok);
for (const [ok, label] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
if (failed.length) {
  console.error(`Questionnaire validation failed: ${failed.length} check(s)`);
  process.exit(1);
}
console.log('Questionnaire validation passed.');
