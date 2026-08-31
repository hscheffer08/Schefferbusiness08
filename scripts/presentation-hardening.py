from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# 1) Keep similarity informative across the full 1-5 answer scale.
match_path = ROOT / 'src/lib/professional-area-match.ts'
match = match_path.read_text(encoding='utf-8')
old_similarity = "const similarity = Math.max(0, 100 - Math.pow(distance, 1.18) * 1.35);"
new_similarity = "const similarity = Math.max(5, 100 - distance * 0.95);"
if old_similarity not in match and new_similarity not in match:
    raise SystemExit('Similarity formula not found')
match = match.replace(old_similarity, new_similarity)
match_path.write_text(match, encoding='utf-8')

# 2) Never let the user start or finish an area match on the lightweight fallback
# while the professional database is still loading.
portal_path = ROOT / 'src/components/AreaMatchPortal.tsx'
portal = portal_path.read_text(encoding='utf-8')
portal = portal.replace(
    "const matches = useMemo(() => adaptiveArea ? calculateProfessionalMatches(adaptiveArea, answers) : [], [adaptiveArea, answers]);",
    "const matches = useMemo(() => dataReady && adaptiveArea ? calculateProfessionalMatches(adaptiveArea, answers) : [], [dataReady, adaptiveArea, answers]);"
)
portal = portal.replace(
    "  const selectArea = (selected:ProfessionalArea) => {\n    setArea(selected);",
    "  const selectArea = (selected:ProfessionalArea) => {\n    if (!dataReady) return;\n    setArea(selected);"
)
portal = portal.replace(
    "onClick={()=>selectArea(item)} className={`group relative overflow-hidden text-left rounded-[26px] border",
    "onClick={()=>selectArea(item)} disabled={!dataReady} className={`group relative overflow-hidden text-left rounded-[26px] border disabled:opacity-50 disabled:cursor-wait"
)
loading_gate = '''\n  if (!dataReady) return <div className="min-h-screen bg-[#070b16] text-ink-50 flex items-center justify-center px-6"><div className="text-center max-w-md"><div className="w-12 h-12 mx-auto mb-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 flex items-center justify-center"><Database className="w-6 h-6 text-cyan-200"/></div><h2 className="text-2xl font-black mb-2">Carregando banco profissional</h2><p className="text-sm text-ink-400">Estamos conectando perguntas, pesos e os 24 indicadores de perfil de cada faculdade antes de iniciar o match.</p></div></div>;\n'''
old_loading_gate = '''\n  if (!dataReady && step !== 'areas') return <div className="min-h-screen bg-[#070b16] text-ink-50 flex items-center justify-center px-6"><div className="text-center max-w-md"><div className="w-12 h-12 mx-auto mb-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 flex items-center justify-center"><Database className="w-6 h-6 text-cyan-200"/></div><h2 className="text-2xl font-black mb-2">Carregando banco profissional</h2><p className="text-sm text-ink-400">Estamos conectando perguntas, pesos e os 24 indicadores de perfil de cada faculdade antes de iniciar o match.</p></div></div>;\n'''
if old_loading_gate in portal:
    portal = portal.replace(old_loading_gate, loading_gate)
elif loading_gate.strip() not in portal:
    needle = "\n  if (!area) return null;\n"
    if needle not in portal:
        raise SystemExit('Area loading insertion point not found')
    portal = portal.replace(needle, loading_gate + needle)
portal_path.write_text(portal, encoding='utf-8')

# 3) Keep homepage totals consistent with the live professional catalog.
home_path = ROOT / 'src/lib/expanded-home-mount.tsx'
home = home_path.read_text(encoding='utf-8')
home = home.replace("['50 cursos','500+ opções','24 dimensões','Match por perfil']", "['50 cursos','1.000 opções','24 dimensões','Match por perfil']")
home_path.write_text(home, encoding='utf-8')

# 4) Strengthen build-time regression checks.
validator_path = ROOT / 'scripts/validate-questionnaires.mjs'
validator = validator_path.read_text(encoding='utf-8')
additions = """
const professionalMatch = fs.readFileSync('src/lib/professional-area-match.ts', 'utf8');
const areaPortal = fs.readFileSync('src/components/AreaMatchPortal.tsx', 'utf8');
const commercialResults = fs.readFileSync('src/components/CommercialAreaResults.tsx', 'utf8');
"""
if "const professionalMatch = fs.readFileSync" not in validator:
    validator = validator.replace("const qa = fs.readFileSync('scripts/qa-vocational-v2.cjs', 'utf8');\n", "const qa = fs.readFileSync('scripts/qa-vocational-v2.cjs', 'utf8');\n" + additions)
checks = """
  [professionalMatch.includes('fetchAllRows') && professionalMatch.includes('.range(from, from + PAGE_SIZE - 1)'), 'Professional catalog is paginated beyond Supabase row limits'],
  [professionalMatch.includes('Math.max(5, 100 - distance * 0.95)'), 'Similarity remains differentiated across the full response scale'],
  [professionalMatch.includes('eligibleUniversities') && professionalMatch.includes('No dimensional university profiles available'), 'Universities without dimensional profiles cannot receive neutral scores'],
  [areaPortal.includes('dataReady && adaptiveArea') && areaPortal.includes("if (!dataReady) return;"), 'Area matches wait for the professional database'],
  [commercialResults.includes("'Não cadastrados'"), 'Missing official indicators are labeled as unavailable instead of zero'],
"""
marker = "  [qa.includes('VOCATIONAL_COURSES.length !== 50'), 'Synthetic QA enforces 50 vocational courses'],\n"
if "Professional catalog is paginated beyond Supabase row limits" not in validator:
    if marker not in validator:
        raise SystemExit('Validator insertion point not found')
    validator = validator.replace(marker, marker + checks)
validator_path.write_text(validator, encoding='utf-8')

print('Presentation hardening applied.')
# Trigger marker: final presentation preflight v2
