from pathlib import Path
p=Path('src/components/AdmissionsPlannerV11.tsx')
s=p.read_text()
s=s.replace("<WeeklyPlanExperience key={`${w.week}-${w.start}`} week={w} formatDate={fmtDate} onOpenQuestions={openAreaQuestions}/>", "<WeeklyPlanExperience key={`${w.week}-${w.start}`} week={w} examId={model.examId} formatDate={fmtDate} onOpenQuestions={openAreaQuestions}/>")
p.write_text(s)
print('weekly progress tracking integrated')
