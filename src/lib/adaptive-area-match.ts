import { supabase } from '@/lib/supabase';
import type { ProfessionalArea, ProfessionalAreaQuestion } from '@/lib/professional-area-match';

export type AreaCalibrationPoint = {
  sampleCount: number;
  mean: number;
  stddev: number;
  multiplier: number;
};

export type AreaCalibration = Record<string, AreaCalibrationPoint>;

const QUESTION_DIMENSIONS: Record<string, string[]> = {
  rigor: ['academic_rigor'],
  practical: ['practical_learning', 'project_based'],
  research: ['research_intensity'],
  people: ['people_contact'],
  technology: ['technology_integration'],
  leadership: ['leadership'],
  structure: ['structure_support'],
  international: ['international_exposure'],
  flexibility: ['academic_flexibility', 'autonomy'],
  faculty: ['faculty_access'],
  collaboration: ['collaborative_culture', 'belonging_support'],
  competition: ['competitive_environment'],
  campus: ['campus_experience'],
  quantitative: ['quantitative_intensity'],
  theory: ['theory_orientation'],
  career: ['career_integration', 'employability_focus'],
  entrepreneurship: ['entrepreneurship'],
  impact: ['social_impact'],
};

export async function loadAreaCalibration(areaId: string): Promise<AreaCalibration> {
  if (!supabase) return {};
  const { data, error } = await supabase
    .from('area_match_calibration')
    .select('dimension_id,sample_count,mean_value,stddev_value,weight_multiplier')
    .eq('area_id', areaId);
  if (error || !data) return {};
  return Object.fromEntries(data.map(row => [String(row.dimension_id), {
    sampleCount: Number(row.sample_count ?? 0),
    mean: Number(row.mean_value ?? 3),
    stddev: Number(row.stddev_value ?? 0),
    multiplier: Number(row.weight_multiplier ?? 1),
  }]));
}

export function orderQuestionsAdaptively(
  questions: ProfessionalAreaQuestion[],
  calibration: AreaCalibration,
): ProfessionalAreaQuestion[] {
  return [...questions].sort((a, b) => {
    const ca = calibration[a.dimension];
    const cb = calibration[b.dimension];
    const aLearned = ca && ca.sampleCount >= 20 ? ca.multiplier : 1;
    const bLearned = cb && cb.sampleCount >= 20 ? cb.multiplier : 1;
    const aInformation = a.weight * aLearned * (ca && ca.sampleCount >= 20 ? 1 + Math.min(0.12, ca.stddev * 0.08) : 1);
    const bInformation = b.weight * bLearned * (cb && cb.sampleCount >= 20 ? 1 + Math.min(0.12, cb.stddev * 0.08) : 1);
    return bInformation - aInformation;
  });
}

export function applyAdaptiveCalibration(
  area: ProfessionalArea,
  answers: Record<string, number>,
  calibration: AreaCalibration,
): ProfessionalArea {
  if (!area.questions?.length || !Object.keys(calibration).length) return area;
  const nextWeights = { ...area.dimensionWeights };

  for (const question of area.questions) {
    const learned = calibration[question.dimension];
    if (!learned || learned.sampleCount < 20) continue;
    const answer = answers[question.id];
    const personalDeviation = answer == null ? 0 : Math.min(1, Math.abs(answer - learned.mean) / 2);
    const personalBoost = 1 + personalDeviation * 0.12;
    const combined = Math.max(0.88, Math.min(1.22, learned.multiplier * personalBoost));
    const dimensions = QUESTION_DIMENSIONS[question.dimension] ?? [question.dimension];
    for (const dimension of dimensions) {
      nextWeights[dimension] = (nextWeights[dimension] ?? 1) * combined;
    }
  }

  return { ...area, dimensionWeights: nextWeights };
}

export async function recordAreaResponses(
  area: ProfessionalArea,
  answers: Record<string, number>,
): Promise<void> {
  if (!supabase || !area.questions?.length) return;
  const sessionId = crypto.randomUUID();
  const rows = area.questions
    .filter(question => answers[question.id] != null)
    .map(question => ({
      session_id: sessionId,
      area_id: area.id,
      question_id: question.id,
      dimension_id: question.dimension,
      answer_value: answers[question.id],
    }));
  if (!rows.length) return;
  const { error } = await supabase.from('area_match_responses').insert(rows);
  if (error) console.warn('Adaptive learning sample was not recorded.', error);
}

export function adaptiveLearningStatus(calibration: AreaCalibration) {
  const points = Object.values(calibration);
  const mature = points.filter(point => point.sampleCount >= 20);
  return {
    active: mature.length > 0,
    learnedDimensions: mature.length,
    totalSamples: points.reduce((sum, point) => sum + point.sampleCount, 0),
  };
}
