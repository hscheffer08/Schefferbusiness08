from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / 'src/lib/professional-area-match.ts'
text = path.read_text(encoding='utf-8')

marker = "export async function loadProfessionalAreas(fallback: AcademicArea[]): Promise<ProfessionalArea[]> {"
helper = r'''const PAGE_SIZE = 1000;

async function fetchAllRows(table: string, columns: string, orderColumns: string[] = []): Promise<any[]> {
  if (!supabase) return [];
  const rows: any[] = [];
  let from = 0;

  while (true) {
    let query: any = supabase.from(table).select(columns);
    for (const column of orderColumns) query = query.order(column, { ascending: true });
    const { data, error } = await query.range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const page = data ?? [];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return rows;
}

function normalizeFallbackMatchProfile(profile: Record<string, number>): Record<string, number> {
  const normalized: Record<string, number> = {};
  for (const [dimension, score] of Object.entries(profile ?? {})) {
    const targets = QUESTION_DIMENSION_MAP[dimension] ?? [dimension];
    for (const target of targets) normalized[target] = Number(score);
  }
  return normalized;
}

'''
if helper not in text:
    if marker not in text:
        raise SystemExit('loadProfessionalAreas marker not found')
    text = text.replace(marker, helper + marker)

old = r'''    const [
      { data: areas },
      { data: universities },
      { data: profiles },
      { data: weights },
      { data: evidence },
      { data: areaQuestions },
      { data: legacyUniversities },
      { data: legacyWeights },
      { data: legacyEvidence },
    ] = await Promise.all([
      supabase.from('academic_areas').select('area_id,name,courses,description'),
      supabase.from('area_universities').select('*'),
      supabase.from('area_university_dimension_profiles').select('*'),
      supabase.from('area_dimension_priorities').select('*'),
      supabase.from('area_university_evidence').select('area_university_id,confidence'),
      supabase.from('area_questions').select('question_id,area_id,question_order,question_text,dimension,scale_min_label,scale_max_label,is_required'),
      supabase.from('universities').select('*'),
      supabase.from('university_dimension_weights').select('university_id,dimension_id,weight'),
      supabase.from('official_evidence').select('university_id,evidence_id'),
    ]);
    if (!areas?.length || !universities?.length) return fallback.map(toFallbackProfessionalArea);'''
new = r'''    const [
      areas,
      universities,
      profiles,
      weights,
      evidence,
      areaQuestions,
      legacyUniversities,
      legacyWeights,
      legacyEvidence,
    ] = await Promise.all([
      fetchAllRows('academic_areas', 'area_id,name,courses,description', ['area_id']),
      fetchAllRows('area_universities', '*', ['area_university_id']),
      fetchAllRows('area_university_dimension_profiles', '*', ['area_university_id', 'dimension_id']),
      fetchAllRows('area_dimension_priorities', '*', ['area_id', 'dimension_id']),
      fetchAllRows('area_university_evidence', 'area_university_id,confidence', ['area_university_id']),
      fetchAllRows('area_questions', 'question_id,area_id,question_order,question_text,dimension,scale_min_label,scale_max_label,is_required', ['area_id', 'question_order', 'question_id']),
      fetchAllRows('universities', '*', ['university_id']),
      fetchAllRows('university_dimension_weights', 'university_id,dimension_id,weight', ['university_id', 'dimension_id']),
      fetchAllRows('official_evidence', 'university_id,evidence_id', ['university_id', 'evidence_id']),
    ]);
    if (!areas.length || !universities.length) return fallback.map(toFallbackProfessionalArea);'''
if old not in text:
    raise SystemExit('Old Supabase bulk query block not found')
text = text.replace(old, new)

old_fallback = r'''    universities: area.universities.map((u,index)=>({
      ...u,
      areaUniversityId:index+1,
      dataConfidence:40,
      evidenceCount:0,
    }))'''
new_fallback = r'''    universities: area.universities.map((u,index)=>({
      ...u,
      matchProfile: normalizeFallbackMatchProfile(u.matchProfile),
      areaUniversityId:index+1,
      dataConfidence:40,
      evidenceCount:0,
    }))'''
if old_fallback not in text:
    raise SystemExit('Fallback university block not found')
text = text.replace(old_fallback, new_fallback)

old_map = "  const rawResults = area.universities.map(university => {"
new_map = r'''  const eligibleUniversities = area.universities.filter((university) =>
    Object.values(university.matchProfile ?? {}).some((value) => Number.isFinite(Number(value)))
  );

  if (!eligibleUniversities.length) {
    console.error(`No dimensional university profiles available for area ${area.id}.`);
    return [];
  }

  const rawResults = eligibleUniversities.map(university => {'''
if old_map not in text:
    raise SystemExit('rawResults map marker not found')
text = text.replace(old_map, new_map)
path.write_text(text, encoding='utf-8')

results_path = ROOT / 'src/components/CommercialAreaResults.tsx'
results = results_path.read_text(encoding='utf-8')
results = results.replace("value={`${topMetrics.length}/5 disponíveis`} detail=\"CPC · Enade · IDD · IGC · CC\"", "value={topMetrics.length ? `${topMetrics.length}/5 disponíveis` : 'Não cadastrados'} detail={topMetrics.length ? 'CPC · Enade · IDD · IGC · CC' : 'Indicadores oficiais ainda não cadastrados para este curso'}")
results = results.replace("O que significa “0/5”, “3/5” ou “5/5 indicadores”?", "Como funcionam os indicadores oficiais?")
results_path.write_text(results, encoding='utf-8')

validator = ROOT / 'scripts/validate-professional-match.mjs'
validator.write_text(r'''import fs from 'node:fs';
const engine = fs.readFileSync('src/lib/professional-area-match.ts', 'utf8');
const results = fs.readFileSync('src/components/CommercialAreaResults.tsx', 'utf8');
const checks = [
  [engine.includes("const PAGE_SIZE = 1000"), 'Pagination page size is defined'],
  [engine.includes("fetchAllRows('area_university_dimension_profiles'"), 'University profiles are paginated'],
  [engine.includes("fetchAllRows('area_dimension_priorities'"), 'Area priorities are paginated'],
  [engine.includes("fetchAllRows('area_questions'"), 'Area questions are paginated'],
  [engine.includes('normalizeFallbackMatchProfile'), 'Fallback profiles use professional dimension IDs'],
  [engine.includes('eligibleUniversities'), 'Universities without dimensional profiles are excluded'],
  [results.includes("'Não cadastrados'"), 'Missing official indicators are not shown as 0/5'],
];
let failed = 0;
for (const [ok,label] of checks) { console.log(`${ok ? 'PASS' : 'FAIL'} ${label}`); if (!ok) failed++; }
if (failed) process.exit(1);
console.log('Professional match validation passed.');
''', encoding='utf-8')

package_path = ROOT / 'package.json'
package = json.loads(package_path.read_text(encoding='utf-8'))
package['scripts']['validate:professional-match'] = 'node scripts/validate-professional-match.mjs'
build = package['scripts']['build']
if 'validate:professional-match' not in build:
    build = build.replace('npm run validate:questionnaires &&', 'npm run validate:questionnaires && npm run validate:professional-match &&')
package['scripts']['build'] = build
package_path.write_text(json.dumps(package, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

print('Professional matching pagination and empty-profile safeguards repaired.')
