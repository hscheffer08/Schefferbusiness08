from pathlib import Path

path = Path('src/components/CommercialAreaResults.tsx')
text = path.read_text()

old_import = "import { trackEvent } from '@/lib/analytics';\n"
new_import = old_import + "import { recordAreaFeedback } from '@/lib/adaptive-area-match';\n"
if "recordAreaFeedback" not in text:
    if old_import not in text:
        raise SystemExit('trackEvent import not found')
    text = text.replace(old_import, new_import, 1)

old = "const submitFeedback=()=>{if(!expectation||!top)return;trackEvent('result_expectation_feedback',{area_id:area.id,area_name:area.name,top_university:top.university.name,top_score:top.score,expected:expectation,comment:feedbackText.trim()||null});setFeedbackSent(true)};"
new = "const submitFeedback=()=>{if(!expectation||!top)return;trackEvent('result_expectation_feedback',{area_id:area.id,area_name:area.name,top_university:top.university.name,top_score:top.score,expected:expectation,comment:feedbackText.trim()||null});void recordAreaFeedback(area,answers,top,expectation);setFeedbackSent(true)};"
if old not in text and new not in text:
    raise SystemExit('submitFeedback target not found')
text = text.replace(old, new, 1)

path.write_text(text)
