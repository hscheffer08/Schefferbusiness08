import fs from 'node:fs';

const quiz = fs.readFileSync('src/components/Quiz.tsx', 'utf8');
const home = fs.readFileSync('src/lib/expanded-home-mount.tsx', 'utf8');
const vocational = fs.readFileSync('src/components/VocationalDemoPremium.tsx', 'utf8');
const qa = fs.readFileSync('scripts/qa-vocational-v2.cjs', 'utf8');

const professionalMatch = fs.readFileSync('src/lib/professional-area-match.ts', 'utf8');
const areaPortal = fs.readFileSync('src/components/AreaMatchPortal.tsx', 'utf8');
const commercialResults = fs.readFileSync('src/components/CommercialAreaResults.tsx', 'utf8');

const checks = [
  [quiz.includes('clearProgress'), 'Quiz imports/uses clearProgress'],
  [quiz.includes('setAnswers({})') && quiz.includes('setCurrentStep(0)'), 'Start-over resets answers and step'],
  [quiz.includes("saveProgress({}, 0)"), 'Start-over persists an empty progress state'],
  [quiz.includes('onClick={() => void startFreshQuestionnaire()}'), 'Start-over button uses the real reset handler'],
  [home.includes('48 perguntas para'), 'Home advertises 48 vocational questions'],
  [!home.includes('36 perguntas para cruzar interesses'), 'Stale 36-question copy is absent'],
  [vocational.includes('48 perguntas'), 'Vocational intro displays 48 questions'],
  [qa.includes('VOCATIONAL_QUESTIONS.length !== 48'), 'Synthetic QA enforces 48 vocational questions'],
  [qa.includes('VOCATIONAL_COURSES.length !== 50'), 'Synthetic QA enforces 50 vocational courses'],

  [professionalMatch.includes('fetchAllRows') && professionalMatch.includes('.range(from, from + PAGE_SIZE - 1)'), 'Professional catalog is paginated beyond Supabase row limits'],
  [professionalMatch.includes('Math.max(5, 100 - distance * 0.95)'), 'Similarity remains differentiated across the full response scale'],
  [professionalMatch.includes('eligibleUniversities') && professionalMatch.includes('No dimensional university profiles available'), 'Universities without dimensional profiles cannot receive neutral scores'],
  [areaPortal.includes('dataReady && adaptiveArea') && areaPortal.includes("if (!dataReady) return;"), 'Area matches wait for the professional database'],
  [commercialResults.includes("'Não cadastrados'"), 'Missing official indicators are labeled as unavailable instead of zero'],

  [areaPortal.includes('ContinuousPercentInput') && areaPortal.includes('step={0.1}'), 'Area questionnaire accepts arbitrary decimal percentages'],
  [professionalMatch.includes('Math.max(0, Math.min(100, raw))') && !professionalMatch.includes('raw * 20, question.weight'), 'Professional match compares continuous percentages directly'],
  [commercialResults.includes('Math.max(0,Math.min(100,raw))'), 'Profile summary preserves exact percentages'],
  [quiz.includes('parseFloat(value)') && quiz.includes('placeholder="Digite um valor"'), 'Main slider accepts exact decimal percentages'],
];

const failed = checks.filter(([ok]) => !ok);
for (const [ok, label] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);
if (failed.length) {
  console.error(`Questionnaire validation failed: ${failed.length} check(s)`);
  process.exit(1);
}
console.log('Questionnaire validation passed.');
