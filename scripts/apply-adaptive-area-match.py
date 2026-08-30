from pathlib import Path

p=Path('src/components/AreaMatchPortal.tsx')
s=p.read_text()

s=s.replace("import { calculateProfessionalMatches, loadProfessionalAreas, type ProfessionalArea } from '@/lib/professional-area-match';", "import { calculateProfessionalMatches, loadProfessionalAreas, type ProfessionalArea } from '@/lib/professional-area-match';\nimport { adaptiveLearningStatus, applyAdaptiveCalibration, loadAreaCalibration, orderQuestionsAdaptively, recordAreaResponses, type AreaCalibration } from '@/lib/adaptive-area-match';")

s=s.replace("  const [dataReady, setDataReady] = useState(false);", "  const [dataReady, setDataReady] = useState(false);\n  const [calibration, setCalibration] = useState<AreaCalibration>({});\n  const [questionOrder, setQuestionOrder] = useState<string[]>([]);")

old="""  const questions = area ? (area.questions?.length ? area.questions : professionalQuestionsForArea(area as AcademicArea)) : [];
  const matches = useMemo(() => area ? calculateProfessionalMatches(area, answers) : [], [area, answers]);
"""
new="""  const baseQuestions = area ? (area.questions?.length ? area.questions : professionalQuestionsForArea(area as AcademicArea)) : [];
  const questions = questionOrder.length
    ? questionOrder.map(id => baseQuestions.find(question => question.id === id)).filter((question): question is typeof baseQuestions[number] => Boolean(question))
    : baseQuestions;
  const adaptiveArea = useMemo(() => area ? applyAdaptiveCalibration(area, answers, calibration) : null, [area, answers, calibration]);
  const matches = useMemo(() => adaptiveArea ? calculateProfessionalMatches(adaptiveArea, answers) : [], [adaptiveArea, answers]);
  const learningStatus = adaptiveLearningStatus(calibration);
"""
if old not in s: raise SystemExit('question block not found')
s=s.replace(old,new)

anchor="""  const selectArea = (selected:ProfessionalArea) => {
    setArea(selected); setAnswers({}); setIndex(0); setStep('quiz');
    trackEvent('area_selected', { area_id:selected.id, area_name:selected.name, courses:selected.courses });
  };
"""
replacement="""  useEffect(() => {
    if (!area) { setCalibration({}); setQuestionOrder([]); return; }
    let active = true;
    loadAreaCalibration(area.id).then(nextCalibration => {
      if (!active) return;
      setCalibration(nextCalibration);
      const sourceQuestions = area.questions?.length ? area.questions : professionalQuestionsForArea(area as AcademicArea);
      setQuestionOrder(orderQuestionsAdaptively(sourceQuestions, nextCalibration).map(question => question.id));
    });
    return () => { active = false; };
  }, [area]);

  const selectArea = (selected:ProfessionalArea) => {
    setArea(selected); setAnswers({}); setIndex(0); setCalibration({}); setQuestionOrder([]); setStep('quiz');
    trackEvent('area_selected', { area_id:selected.id, area_name:selected.name, courses:selected.courses });
  };
"""
if anchor not in s: raise SystemExit('selectArea block not found')
s=s.replace(anchor,replacement)

s=s.replace("<span className=\"text-xs font-bold text-cyan-200 rounded-full px-3 py-1.5 border border-cyan-300/15 bg-cyan-300/5\">{area.name}</span>", "<span className=\"text-xs font-bold text-cyan-200 rounded-full px-3 py-1.5 border border-cyan-300/15 bg-cyan-300/5\">{area.name} · {learningStatus.active?'Adaptativo':'Calibrando'}</span>")

old_finish="""if(index===questions.length-1){setStep('results');trackEvent('area_questionnaire_completed',{area_id:area.id,questions:questions.length});}else setIndex(index+1);"""
new_finish="""if(index===questions.length-1){void recordAreaResponses(area,answers);setStep('results');trackEvent('area_questionnaire_completed',{area_id:area.id,questions:questions.length,adaptive:learningStatus.active,learned_dimensions:learningStatus.learnedDimensions});}else setIndex(index+1);"""
if old_finish not in s: raise SystemExit('finish block not found')
s=s.replace(old_finish,new_finish)

p.write_text(s)
print('Adaptive area matching wired into portal.')
