import { supabase } from '@/lib/supabase';
import type { ProfessionalArea, ProfessionalAreaQuestion, ProfessionalMatchResult } from '@/lib/professional-area-match';

export type AreaCalibrationPoint = {
  sampleCount: number;
  mean: number;
  stddev: number;
  multiplier: number;
  feedbackCount: number;
  feedbackMultiplier: number;
};

export type AreaCalibration = Record<string, AreaCalibrationPoint>;
export type ResultExpectation = 'yes' | 'partly' | 'no';

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


const percentToCalibrationScale = (value: number) => Math.max(0, Math.min(5, value / 20));

const emptyPoint = (): AreaCalibrationPoint => ({
  sampleCount: 0,
  mean: 3,
  stddev: 0,
  multiplier: 1,
  feedbackCount: 0,
  feedbackMultiplier: 1,
});

export async function loadAreaCalibration(areaId: string): Promise<AreaCalibration> {
  if (!supabase) return {};
  const [{ data: responseData }, { data: feedbackData }] = await Promise.all([
    supabase
      .from('area_match_calibration')
      .select('dimension_id,sample_count,mean_value,stddev_value,weight_multiplier')
      .eq('area_id', areaId),
    supabase
      .from('area_match_feedback_calibration')
      .select('dimension_id,feedback_count,feedback_multiplier')
      .eq('area_id', areaId),
  ]);

  const result: AreaCalibration = {};
  for (const row of responseData ?? []) {
    const id = String(row.dimension_id);
    result[id] = {
      ...emptyPoint(),
      sampleCount: Number(row.sample_count ?? 0),
      mean: Number(row.mean_value ?? 3),
      stddev: Number(row.stddev_value ?? 0),
      multiplier: Number(row.weight_multiplier ?? 1),
    };
  }
  for (const row of feedbackData ?? []) {
    const id = String(row.dimension_id);
    result[id] = {
      ...(result[id] ?? emptyPoint()),
      feedbackCount: Number(row.feedback_count ?? 0),
      feedbackMultiplier: Number(row.feedback_multiplier ?? 1),
    };
  }
  return result;
}

function effectiveMultiplier(point?: AreaCalibrationPoint) {
  if (!point) return 1;
  const responseFactor = point.sampleCount >= 20 ? point.multiplier : 1;
  const feedbackFactor = point.feedbackCount >= 10 ? point.feedbackMultiplier : 1;
  return Math.max(0.85, Math.min(1.25, responseFactor * feedbackFactor));
}

export function orderQuestionsAdaptively(
  questions: ProfessionalAreaQuestion[],
  calibration: AreaCalibration,
): ProfessionalAreaQuestion[] {
  return [...questions].sort((a, b) => {
    const ca = calibration[a.dimension];
    const cb = calibration[b.dimension];
    const aInformation = a.weight * effectiveMultiplier(ca) * (ca && ca.sampleCount >= 20 ? 1 + Math.min(0.12, ca.stddev * 0.08) : 1);
    const bInformation = b.weight * effectiveMultiplier(cb) * (cb && cb.sampleCount >= 20 ? 1 + Math.min(0.12, cb.stddev * 0.08) : 1);
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
    if (!learned || (learned.sampleCount < 20 && learned.feedbackCount < 10)) continue;
    const answer = answers[question.id];
    const personalDeviation = answer == null || learned.sampleCount < 20 ? 0 : Math.min(1, Math.abs(percentToCalibrationScale(answer) - learned.mean) / 2);
    const personalBoost = 1 + personalDeviation * 0.12;
    const combined = Math.max(0.85, Math.min(1.25, effectiveMultiplier(learned) * personalBoost));
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
      answer_value: percentToCalibrationScale(answers[question.id]),
    }));
  if (!rows.length) return;
  const { error } = await supabase.from('area_match_responses').insert(rows);
  if (error) console.warn('Adaptive learning sample was not recorded.', error);
}

function feedbackSignals(
  area: ProfessionalArea,
  answers: Record<string, number>,
  top: ProfessionalMatchResult,
  expectation: ResultExpectation,
): Record<string, number> {
  const samples = new Map<string, number[]>();
  for (const question of area.questions ?? []) {
    const raw = answers[question.id];
    if (raw == null) continue;
    const dimensions = QUESTION_DIMENSIONS[question.dimension] ?? [question.dimension];
    for (const dimension of dimensions) {
      const target = Number(top.university.matchProfile[dimension]);
      if (!Number.isFinite(target)) continue;
      const student = Math.max(0, Math.min(100, raw));
      const similarity = Math.max(0, Math.min(1, 1 - Math.abs(student - target) / 100));
      const signed = expectation === 'yes'
        ? (similarity - 0.5) * 2
        : expectation === 'no'
          ? (0.5 - similarity) * 2
          : (similarity - 0.5) * 0.5;
      const current = samples.get(question.dimension) ?? [];
      current.push(Math.max(-1, Math.min(1, signed)));
      samples.set(question.dimension, current);
    }
  }
  return Object.fromEntries([...samples.entries()].map(([dimension, values]) => [
    dimension,
    Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(4)),
  ]));
}

export async function recordAreaFeedback(
  area: ProfessionalArea,
  answers: Record<string, number>,
  top: ProfessionalMatchResult,
  expectation: ResultExpectation,
): Promise<void> {
  if (!supabase) return;
  const signals = feedbackSignals(area, answers, top, expectation);
  if (!Object.keys(signals).length) return;
  const { error } = await supabase.from('area_match_feedback').insert({
    session_id: crypto.randomUUID(),
    area_id: area.id,
    top_university_id: top.university.id,
    top_university_name: top.university.name,
    top_score: top.score,
    expectation,
    dimension_signals: signals,
  });
  if (error) console.warn('Result feedback was not recorded for adaptive learning.', error);
}

export function adaptiveLearningStatus(calibration: AreaCalibration) {
  const points = Object.values(calibration);
  const responseMature = points.filter(point => point.sampleCount >= 20);
  const feedbackMature = points.filter(point => point.feedbackCount >= 10);
  return {
    active: responseMature.length > 0 || feedbackMature.length > 0,
    learnedDimensions: new Set([...responseMature, ...feedbackMature]).size,
    responseLearnedDimensions: responseMature.length,
    feedbackLearnedDimensions: feedbackMature.length,
    totalSamples: points.reduce((sum, point) => sum + point.sampleCount, 0),
    totalFeedback: points.reduce((sum, point) => sum + point.feedbackCount, 0),
  };
}
