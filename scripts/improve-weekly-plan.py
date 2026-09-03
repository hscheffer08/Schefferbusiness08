from pathlib import Path
import re

path=Path('src/components/AdmissionsPlannerV11.tsx')
text=path.read_text()
import_anchor="import { isSupplementalQuestion, mergePracticeQuestions } from '@/lib/supplemental-practice-questions';\n"
new_import=import_anchor+"import WeeklyPlanExperience from '@/components/WeeklyPlanExperience';\n"
if "WeeklyPlanExperience" not in text:
    if import_anchor not in text:
        raise SystemExit('weekly-plan: import anchor not found')
    text=text.replace(import_anchor,new_import,1)

pattern=re.compile(r'\{roadmap\.weeks\.map\(w=><section className="plan6-card span12".*?</section>\)\}',re.S)
replacement='{roadmap.weeks.map(w=><WeeklyPlanExperience key={`${w.week}-${w.start}`} week={w} formatDate={fmtDate} onOpenQuestions={openAreaQuestions}/>)}'
text,count=pattern.subn(replacement,text,count=1)
if count!=1:
    raise SystemExit(f'weekly-plan: expected exactly one weekly card block, found {count}')
path.write_text(text)
print('weekly-plan: integrated enhanced weekly experience')
