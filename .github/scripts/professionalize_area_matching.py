from pathlib import Path


def replace_once(path: str, old: str, new: str):
    p = Path(path)
    text = p.read_text()
    if old not in text:
        raise SystemExit(f'Pattern not found in {path}: {old[:120]!r}')
    p.write_text(text.replace(old, new, 1))

# 1) Make Supabase questions the source of truth for the live questionnaire.
path = 'src/lib/professional-area-match.ts'
replace_once(
    path,
    "export interface ProfessionalArea extends Omit<AcademicArea, 'universities'> {\n  universities: ProfessionalUniversity[];\n  dimensionWeights: Record<string, number>;\n}",
    "export interface ProfessionalAreaQuestion {\n  id: string;\n  text: string;\n  dimension: string;\n  low: string;\n  high: string;\n  weight: number;\n}\n\nexport interface ProfessionalArea extends Omit<AcademicArea, 'universities'> {\n  universities: ProfessionalUniversity[];\n  dimensionWeights: Record<string, number>;\n  questions: ProfessionalAreaQuestion[];\n}"
)

replace_once(
    path,
    "      { data: evidence },\n      { data: legacyUniversities },",
    "      { data: evidence },\n      { data: areaQuestions },\n      { data: legacyUniversities },"
)
replace_once(
    path,
    "      supabase.from('area_university_evidence').select('area_university_id,confidence'),\n      supabase.from('universities').select('*'),",
    "      supabase.from('area_university_evidence').select('area_university_id,confidence'),\n      supabase.from('area_questions').select('question_id,area_id,question_order,question_text,dimension,scale_min_label,scale_max_label,is_required'),\n      supabase.from('universities').select('*'),"
)
replace_once(
    path,
    "      dimensionWeights: weightsByArea.get(a.area_id) ?? {},\n      universities: universities.filter((u:any)=>u.area_id===a.area_id).map((u:any)=>{",
    "      dimensionWeights: weightsByArea.get(a.area_id) ?? {},\n      questions: (areaQuestions ?? [])\n        .filter((q:any) => q.area_id === a.area_id)\n        .sort((x:any,y:any) => Number(x.question_order) - Number(y.question_order))\n        .map((q:any) => ({\n          id: String(q.question_id),\n          text: String(q.question_text),\n          dimension: String(q.dimension),\n          low: String(q.scale_min_label),\n          high: String(q.scale_max_label),\n          weight: Number((weightsByArea.get(a.area_id) ?? {})[String(q.dimension)] ?? 1),\n        })),\n      universities: universities.filter((u:any)=>u.area_id===a.area_id).map((u:any)=>{"
)
replace_once(
    path,
    "    dimensionWeights: {},\n    universities: area.universities.map((u,index)=>({",
    "    dimensionWeights: {},\n    questions: [],\n    universities: area.universities.map((u,index)=>({"
)

old_student = """  const student: Record<string,number> = {};\n  Object.entries(QUESTION_DIMENSION_MAP).forEach(([questionId, dimensionIds]) => {\n    const raw = answers[questionId];\n    if (raw == null) return;\n    dimensionIds.forEach(d => student[d] = raw * 20);\n  });"""
new_student = """  const studentSamples = new Map<string, number[]>();\n  const addSignal = (dimensionId: string, value: number) => {\n    const current = studentSamples.get(dimensionId) ?? [];\n    current.push(value);\n    studentSamples.set(dimensionId, current);\n  };\n\n  if (area.questions?.length) {\n    for (const question of area.questions) {\n      const raw = answers[question.id];\n      if (raw == null) continue;\n      const dimensionIds = QUESTION_DIMENSION_MAP[question.dimension] ?? [question.dimension];\n      dimensionIds.forEach((dimensionId) => addSignal(dimensionId, raw * 20));\n    }\n  } else {\n    Object.entries(QUESTION_DIMENSION_MAP).forEach(([questionId, dimensionIds]) => {\n      const raw = answers[questionId];\n      if (raw == null) return;\n      dimensionIds.forEach((dimensionId) => addSignal(dimensionId, raw * 20));\n    });\n  }\n\n  const student: Record<string,number> = Object.fromEntries(\n    [...studentSamples.entries()].map(([dimensionId, values]) => [\n      dimensionId,\n      values.reduce((sum, value) => sum + value, 0) / values.length,\n    ])\n  );"""
replace_once(path, old_student, new_student)

# 2) Portal uses database questions when available and live metrics instead of stale constants.
path = 'src/components/AreaMatchPortal.tsx'
replace_once(
    path,
    "  const fallback = ACADEMIC_AREAS.map((a,index)=>({ ...a, dimensionWeights:{}, universities:a.universities.map((u,i)=>({...u,areaUniversityId:index*20+i,dataConfidence:40,evidenceCount:0})) }));",
    "  const fallback = ACADEMIC_AREAS.map((a,index)=>({ ...a, dimensionWeights:{}, questions:[], universities:a.universities.map((u,i)=>({...u,areaUniversityId:index*20+i,dataConfidence:40,evidenceCount:0})) }));"
)
replace_once(
    path,
    "  const questions = area ? professionalQuestionsForArea(area as AcademicArea) : [];\n  const matches = useMemo(() => area ? calculateProfessionalMatches(area, answers) : [], [area, answers]);\n  const filtered = areas.filter(item => `${item.name} ${item.courses}`.toLowerCase().includes(query.toLowerCase()));",
    "  const questions = area ? (area.questions?.length ? area.questions : professionalQuestionsForArea(area as AcademicArea)) : [];\n  const matches = useMemo(() => area ? calculateProfessionalMatches(area, answers) : [], [area, answers]);\n  const filtered = areas.filter(item => `${item.name} ${item.courses}`.toLowerCase().includes(query.toLowerCase()));\n  const totalOptions = areas.reduce((sum, item) => sum + item.universities.length, 0);"
)
replace_once(
    path,
    "[['30','cursos'],['360','opções'],['24','dimensões por perfil']]",
    "[[String(areas.length),'cursos'],[String(totalOptions),'opções'],['24','dimensões por perfil']]"
)

# 3) Offline fallback also includes the new course-specific questions.
path = 'src/lib/professional-area-matching.ts'
replace_once(
    path,
    "import type { AcademicArea, AreaUniversity } from '@/lib/area-match-data';",
    "import type { AcademicArea, AreaUniversity } from '@/lib/area-match-data';\nimport { EXTRA_AREA_QUESTIONS } from '@/lib/expanded-course-data';"
)
replace_once(
    path,
    "    { id:'theory', dimension:'theory', weight:0.8, text:`Quanto você valoriza fundamentos teóricos e compreensão conceitual profunda em ${area.courses}?`, low:'Mais aplicação', high:'Muita teoria' },\n  ];",
    "    { id:'theory', dimension:'theory', weight:0.8, text:`Quanto você valoriza fundamentos teóricos e compreensão conceitual profunda em ${area.courses}?`, low:'Mais aplicação', high:'Muita teoria' },\n    ...(EXTRA_AREA_QUESTIONS[area.id] ?? []).map((q) => ({ ...q, weight: 1.05 })),\n  ];"
)

# 4) Never show a stale option count on the marketing home.
path = 'src/lib/expanded-home-mount.tsx'
replace_once(path, "['50 cursos','360 opções','24 dimensões','Match por perfil']", "['50 cursos','500+ opções','24 dimensões','Match por perfil']")

# remove this one-shot automation after it has done its job
Path('.github/scripts/professionalize_area_matching.py').unlink()
Path('.github/workflows/professionalize-area-matching.yml').unlink(missing_ok=True)
