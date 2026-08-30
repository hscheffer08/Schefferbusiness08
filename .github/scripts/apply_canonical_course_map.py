from pathlib import Path

path = Path('src/components/VocationalDemoPremium.tsx')
text = path.read_text()
old_import = "import { ACADEMIC_AREAS } from '@/lib/area-match-data';"
new_import = "import { COURSE_TO_AREA_ID } from '@/lib/course-area-map';"
if old_import not in text:
    raise SystemExit('Academic areas import not found')
text = text.replace(old_import, new_import, 1)
old = """function academicAreaForCourse(course: VocationalCourse) {\n  const courseName = normalizeAcademicLabel(course.name);\n  return ACADEMIC_AREAS.find((area) => {\n    const courses = normalizeAcademicLabel(area.courses);\n    return courses.includes(courseName) || courseName.includes(courses);\n  }) ?? null;\n}"""
new = """function academicAreaForCourse(course: VocationalCourse) {\n  const exactAreaId = COURSE_TO_AREA_ID[course.name];\n  if (exactAreaId) return { id: exactAreaId };\n  const normalizedName = normalizeAcademicLabel(course.name);\n  const fallback = Object.entries(COURSE_TO_AREA_ID).find(([name]) => normalizeAcademicLabel(name) === normalizedName);\n  return fallback ? { id: fallback[1] } : null;\n}"""
if old not in text:
    raise SystemExit('academicAreaForCourse helper not found')
path.write_text(text.replace(old, new, 1))
Path('.github/scripts/apply_canonical_course_map.py').unlink()
Path('.github/workflows/apply-canonical-course-map.yml').unlink(missing_ok=True)
