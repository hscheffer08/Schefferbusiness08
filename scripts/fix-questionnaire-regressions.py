from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]

quiz_path = ROOT / 'src/components/Quiz.tsx'
quiz = quiz_path.read_text(encoding='utf-8')

quiz = quiz.replace(
    "import { saveProgress, loadProgress } from '@/lib/api';",
    "import { saveProgress, loadProgress, clearProgress } from '@/lib/api';",
)

old_reset = """  const skipSavedProgress = () => {\n    setHasSavedProgress(false);\n  };"""
new_reset = """  const startFreshQuestionnaire = async () => {\n    setAnswers({});\n    setCurrentStep(0);\n    setDirection('forward');\n    setHasSavedProgress(false);\n\n    if (user) {\n      try {\n        await clearProgress();\n        await saveProgress({}, 0);\n      } catch {\n        // The local reset is still authoritative for the current session.\n      }\n    }\n\n    trackEvent('questionnaire_restarted', { mode }, user?.id);\n  };"""
if old_reset not in quiz:
    raise SystemExit('Could not find saved-progress reset block in Quiz.tsx')
quiz = quiz.replace(old_reset, new_reset)

old_button = "onClick={skipSavedProgress}"
if old_button not in quiz:
    raise SystemExit('Could not find start-over button handler in Quiz.tsx')
quiz = quiz.replace(old_button, "onClick={() => void startFreshQuestionnaire()}")
quiz_path.write_text(quiz, encoding='utf-8')

home_path = ROOT / 'src/lib/expanded-home-mount.tsx'
home = home_path.read_text(encoding='utf-8')
old_copy = '36 perguntas para cruzar interesses, valores, estilo de trabalho e aptidões percebidas.'
new_copy = '48 perguntas para cruzar interesses, valores, estilo de trabalho e aptidões percebidas.'
if old_copy not in home and new_copy not in home:
    raise SystemExit('Could not find vocational question-count copy')
home = home.replace(old_copy, new_copy)
home_path.write_text(home, encoding='utf-8')

validator_path = ROOT / 'scripts/validate-questionnaires.mjs'
validator_path.write_text("""import fs from 'node:fs';\n\nconst quiz = fs.readFileSync('src/components/Quiz.tsx', 'utf8');\nconst home = fs.readFileSync('src/lib/expanded-home-mount.tsx', 'utf8');\nconst vocational = fs.readFileSync('src/components/VocationalDemoPremium.tsx', 'utf8');\nconst qa = fs.readFileSync('scripts/qa-vocational-v2.cjs', 'utf8');\n\nconst checks = [\n  [quiz.includes('clearProgress'), 'Quiz imports/uses clearProgress'],\n  [quiz.includes('setAnswers({})') && quiz.includes('setCurrentStep(0)'), 'Start-over resets answers and step'],\n  [quiz.includes("saveProgress({}, 0)"), 'Start-over persists an empty progress state'],\n  [quiz.includes('onClick={() => void startFreshQuestionnaire()}'), 'Start-over button uses the real reset handler'],\n  [home.includes('48 perguntas para cruzar interesses'), 'Home advertises 48 vocational questions'],\n  [!home.includes('36 perguntas para cruzar interesses'), 'Stale 36-question copy is absent'],\n  [vocational.includes('48 perguntas'), 'Vocational intro displays 48 questions'],\n  [qa.includes('VOCATIONAL_QUESTIONS.length !== 48'), 'Synthetic QA enforces 48 vocational questions'],\n  [qa.includes('VOCATIONAL_COURSES.length !== 50'), 'Synthetic QA enforces 50 vocational courses'],\n];\n\nconst failed = checks.filter(([ok]) => !ok);\nfor (const [ok, label] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`);\nif (failed.length) {\n  console.error(`Questionnaire validation failed: ${failed.length} check(s)`);\n  process.exit(1);\n}\nconsole.log('Questionnaire validation passed.');\n""", encoding='utf-8')

package_path = ROOT / 'package.json'
package = json.loads(package_path.read_text(encoding='utf-8'))
scripts = package.setdefault('scripts', {})
scripts['validate:questionnaires'] = 'node scripts/validate-questionnaires.mjs'
old_build = scripts.get('build', '')
if 'validate:questionnaires' not in old_build:
    scripts['build'] = 'npm run validate:catalog && npm run validate:questionnaires && npm run typecheck && vite build'
package_path.write_text(json.dumps(package, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

print('Questionnaire regressions repaired and build guard installed.')
# Trigger marker: 2026-08-31
