import type {
  University,
  Dimension,
  CulturalAxis,
  Question,
  PillarWeight,
  UniversityDimensionWeight,
  UniversityAxisTarget,
  QuestionDimension,
  OfficialEvidence,
  EvidenceDimension,
  MatchResult,
  AnswerMap,
  QuizMode,
} from '@/types';
import { normalizeAnswerToScore } from '@/lib/question-options';

export interface MatchingData {
  universities: University[];
  dimensions: Dimension[];
  culturalAxes: CulturalAxis[];
  questions: Question[];
  pillarWeights: PillarWeight[];
  universityDimensionWeights: UniversityDimensionWeight[];
  universityAxisTargets: UniversityAxisTarget[];
  questionDimensions: QuestionDimension[];
  officialEvidence: OfficialEvidence[];
  evidenceDimensions: EvidenceDimension[];
}

const PILLAR_LABELS: Record<string, string> = {
  Academic: 'Adequação Acadêmica',
  Behavioral: 'Fit Comportamental',
  Evidence: 'Evidência e Conquistas',
  CultureGoals: 'Objetivos e Cultura',
  CulturalAxes: 'Fit Cultural',
};

const SUBSCORE_DIMENSIONS: Record<string, string[]> = {
  academic_fit: ['academic_perf', 'analytical_data', 'english_level', 'math_quant', 'rigor_depth', 'theory_comfort', 'writing_argument'],
  career_fit: ['corporate_management', 'market_employability', 'networking_value', 'brand_prestige'],
  entrepreneurship_fit: ['entrepreneurial_intent', 'startup_founder_fit', 'practical_learning'],
  cultural_fit: [],
  international_fit: ['global_mindset', 'mobility_willingness', 'english_level'],
  learning_style_fit: ['practical_learning', 'experimental_learning', 'theory_comfort', 'autonomy_selfdirection'],
};

const STUDENT_PROFILE_DIMENSIONS = [
  'entrepreneurial_intent',
  'analytical_data',
  'global_mindset',
  'leadership_evidence',
  'oral_pitch',
  'resilience_pressure',
  'curiosity_learning',
  'purpose_impact',
  'tech_ai_orientation',
  'networking_value',
];

export function calculateMatches(
  data: MatchingData,
  answers: AnswerMap,
  scoreBonus = 0
): MatchResult[] {
  const dimensionScores = computeDimensionScores(data, answers);
  const culturalAxisScores = computeCulturalAxisScores(data, answers);

  const pillarWeightMap = new Map<string, number>();
  for (const pw of data.pillarWeights) {
    pillarWeightMap.set(pw.pillar, Number(pw.weight_pct));
  }

  const results: MatchResult[] = data.universities.map((university) => {
    const uniDimWeights = new Map<string, number>();
    for (const udw of data.universityDimensionWeights) {
      if (udw.university_id === university.university_id) {
        uniDimWeights.set(udw.dimension_id, udw.weight);
      }
    }

    const uniAxisTargets = new Map<string, number>();
    for (const uat of data.universityAxisTargets) {
      if (uat.university_id === university.university_id) {
        uniAxisTargets.set(uat.axis_id, uat.target);
      }
    }

    const pillarScores = computePillarScores(
      dimensionScores,
      uniDimWeights,
      data.dimensions,
      pillarWeightMap
    );

    const culturalFitScore = computeCulturalFitScore(
      culturalAxisScores,
      uniAxisTargets
    );

    pillarScores['CulturalAxes'] = culturalFitScore;

    const rawScore = computeOverallScore(pillarScores, pillarWeightMap);
    const amplifiedScore = amplifyScore(rawScore);
    const overallScore = capScore(amplifiedScore);

    const topReasons = computeTopReasons(
      university,
      dimensionScores,
      uniDimWeights,
      data.dimensions
    );

    const mismatchPoint = computeMismatchPoint(
      university,
      dimensionScores,
      uniDimWeights,
      data.dimensions
    );

    const evidence = data.officialEvidence.filter(
      (e) => e.university_id === university.university_id
    );

    const subScores = computeSubScores(dimensionScores, uniDimWeights, data.dimensions);

    return {
      university,
      overallScore,
      rawScore: rawScore,
      pillarScores,
      culturalFitScore,
      subScores,
      topReasons,
      mismatchPoint,
      evidence,
    };
  });

  // Stretch the distance between scores so differences feel more impactful.
  // This widens gaps between ranked universities without changing the ranking order.
  const scores = results.map((r) => r.overallScore);
  const meanScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const stretchFactor = 2.2;
  for (const r of results) {
    const stretched = meanScore + (r.overallScore - meanScore) * stretchFactor;
    r.overallScore = Math.max(0, Math.min(99, Math.round(stretched) + scoreBonus));
  }

  results.sort((a, b) => b.overallScore - a.overallScore || b.rawScore - a.rawScore);

  return results;
}

export function getQuizScoreBonus(mode: QuizMode): number {
  return mode === 'quick' ? 15 : 10;
}

interface DimensionScore {
  dimensionId: string;
  score: number;
  answered: boolean;
}

function computeDimensionScores(
  data: MatchingData,
  answers: AnswerMap
): Map<string, DimensionScore> {
  const dimAccumulators = new Map<string, { sum: number; count: number }>();

  for (const q of data.questions) {
    const answer = answers[q.question_id];
    if (answer === undefined || answer === '') continue;

    const score = normalizeAnswerToScore(q, answer);

    const dims = data.questionDimensions.filter(
      (qd) => qd.question_id === q.question_id
    );

    for (const qd of dims) {
      const acc = dimAccumulators.get(qd.dimension_id);
      if (acc) {
        acc.sum += score;
        acc.count += 1;
      } else {
        dimAccumulators.set(qd.dimension_id, { sum: score, count: 1 });
      }
    }
  }

  const dimScores = new Map<string, DimensionScore>();
  for (const [dimId, acc] of dimAccumulators) {
    dimScores.set(dimId, {
      dimensionId: dimId,
      score: Math.round(acc.sum / acc.count),
      answered: true,
    });
  }

  for (const dim of data.dimensions) {
    if (!dimScores.has(dim.dimension_id)) {
      dimScores.set(dim.dimension_id, {
        dimensionId: dim.dimension_id,
        score: 50,
        answered: false,
      });
    }
  }

  return dimScores;
}

function computeCulturalAxisScores(
  data: MatchingData,
  answers: AnswerMap
): Map<string, number> {
  const axisScores = new Map<string, number>();

  const axisQuestionMap: Record<string, { questionId: string; transform: (v: string) => number }[]> = {
    axis_01_pratica_vs_teoria: [
      { questionId: 'Q20', transform: (v) => {
        const map: Record<string, number> = { teoria: 10, teoria_pratica: 55, cases: 75, projetos: 95 };
        return map[v] ?? 50;
      }},
    ],
    axis_02_corporativo_vs_founder: [
      { questionId: 'Q29', transform: (v) => {
        const val = parseInt(v, 10);
        return isNaN(val) ? 50 : 100 - val;
      }},
      { questionId: 'Q34', transform: (v) => {
        if (v === 'empreender') return 90;
        if (v === 'liderar') return 15;
        if (v === 'impacto') return 70;
        if (v === 'finance') return 20;
        return 50;
      }},
    ],
    axis_03_local_vs_global: [
      { questionId: 'Q27', transform: (v) => {
        const val = parseInt(v, 10);
        return isNaN(val) ? 50 : val;
      }},
      { questionId: 'Q28', transform: (v) => {
        const map: Record<string, number> = { nao: 15, talvez: 55, sim: 90 };
        return map[v] ?? 50;
      }},
    ],
    axis_04_estrutura_vs_autonomia: [
      { questionId: 'Q21', transform: (v) => {
        const val = parseInt(v, 10);
        return isNaN(val) ? 50 : val;
      }},
    ],
    axis_05_individual_vs_colaborativo: [
      { questionId: 'Q25', transform: (v) => {
        const map: Record<string, number> = { lidero: 80, colaboro: 90, executo: 50, solo: 15 };
        return map[v] ?? 50;
      }},
      { questionId: 'Q35', transform: (v) => {
        const map: Record<string, number> = { tradicional: 30, inovador: 50, competitivo: 20, colaborativo: 90, global: 70, pratico: 40 };
        return map[v] ?? 50;
      }},
    ],
    axis_06_tradicional_vs_experimental: [
      { questionId: 'Q35', transform: (v) => {
        const map: Record<string, number> = { tradicional: 10, inovador: 90, competitivo: 30, colaborativo: 60, global: 70, pratico: 75 };
        return map[v] ?? 50;
      }},
    ],
    axis_07_prova_vs_holistico: [
      { questionId: 'Q08', transform: (v) => {
        const text = v.trim();
        if (text.length < 5) return 30;
        return 70;
      }},
    ],
    axis_08_tecnico_vs_proposito: [
      { questionId: 'Q32', transform: (v) => {
        const val = parseInt(v, 10);
        return isNaN(val) ? 50 : val;
      }},
      { questionId: 'Q34', transform: (v) => {
        if (v === 'impacto') return 90;
        if (v === 'finance') return 10;
        if (v === 'academica') return 25;
        return 50;
      }},
    ],
    axis_09_baixa_exposicao_vs_pitch: [
      { questionId: 'Q23', transform: (v) => {
        const val = parseInt(v, 10);
        return isNaN(val) ? 50 : val;
      }},
    ],
    axis_10_baixa_ia_vs_ia_tech: [
      { questionId: 'Q31', transform: (v) => {
        const val = parseInt(v, 10);
        return isNaN(val) ? 50 : val;
      }},
    ],
    axis_11_risco_baixo_vs_risco_alto: [
      { questionId: 'Q29', transform: (v) => {
        const val = parseInt(v, 10);
        return isNaN(val) ? 50 : val;
      }},
    ],
    axis_12_financas_baixa_vs_alta: [
      { questionId: 'Q30', transform: (v) => {
        const val = parseInt(v, 10);
        return isNaN(val) ? 50 : val;
      }},
    ],
  };

  for (const axis of data.culturalAxes) {
    const mappings = axisQuestionMap[axis.axis_id];
    if (!mappings || mappings.length === 0) {
      axisScores.set(axis.axis_id, 50);
      continue;
    }

    const scores: number[] = [];
    for (const mapping of mappings) {
      const answer = answers[mapping.questionId];
      if (answer !== undefined && answer !== '') {
        scores.push(mapping.transform(answer));
      }
    }

    if (scores.length === 0) {
      axisScores.set(axis.axis_id, 50);
    } else {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      axisScores.set(axis.axis_id, Math.round(avg));
    }
  }

  return axisScores;
}

function computePillarScores(
  dimensionScores: Map<string, DimensionScore>,
  uniDimWeights: Map<string, number>,
  dimensions: Dimension[],
  pillarWeightMap: Map<string, number>
): Record<string, number> {
  const pillarSums = new Map<string, { sum: number; count: number }>();

  for (const dim of dimensions) {
    const dimScore = dimensionScores.get(dim.dimension_id);
    if (!dimScore) continue;

    const uniWeight = uniDimWeights.get(dim.dimension_id) ?? 50;
    const directional = (dimScore.score / 100) * uniWeight;
    const distance = 100 - Math.abs(dimScore.score - uniWeight);
    let alignment = directional * 0.7 + distance * 0.3;

    if (!dimScore.answered) {
      alignment = alignment * 0.5;
    }

    const pillar = dim.pillar;
    const existing = pillarSums.get(pillar);
    if (existing) {
      existing.sum += alignment;
      existing.count += 1;
    } else {
      pillarSums.set(pillar, { sum: alignment, count: 1 });
    }
  }

  const result: Record<string, number> = {};
  for (const [pillar, { sum, count }] of pillarSums) {
    result[pillar] = sum / count;
  }

  return result;
}

function computeCulturalFitScore(
  axisScores: Map<string, number>,
  uniAxisTargets: Map<string, number>
): number {
  if (uniAxisTargets.size === 0) return 50;

  let sum = 0;
  let count = 0;

  for (const [axisId, target] of uniAxisTargets) {
    const studentScore = axisScores.get(axisId) ?? 50;
    const alignment = 100 - Math.abs(studentScore - target);
    sum += alignment;
    count += 1;
  }

  return count > 0 ? sum / count : 50;
}

function computeOverallScore(
  pillarScores: Record<string, number>,
  pillarWeightMap: Map<string, number>
): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [pillar, score] of Object.entries(pillarScores)) {
    const weight = pillarWeightMap.get(pillar) ?? 0;
    weightedSum += score * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) return 50;
  return weightedSum / totalWeight;
}

function computeTopReasons(
  university: University,
  dimensionScores: Map<string, DimensionScore>,
  uniDimWeights: Map<string, number>,
  dimensions: Dimension[]
): string[] {
  const alignments: { dimension: Dimension; alignment: number }[] = [];

  for (const dim of dimensions) {
    const dimScore = dimensionScores.get(dim.dimension_id);
    if (!dimScore) continue;

    const uniWeight = uniDimWeights.get(dim.dimension_id);
    if (uniWeight === undefined) continue;

    const alignment = 100 - Math.abs(dimScore.score - uniWeight);
    alignments.push({ dimension: dim, alignment });
  }

  alignments.sort((a, b) => b.alignment - a.alignment);

  const top = alignments.slice(0, 3);
  return top.map((a) => a.dimension.name);
}

function computeMismatchPoint(
  university: University,
  dimensionScores: Map<string, DimensionScore>,
  uniDimWeights: Map<string, number>,
  dimensions: Dimension[]
): string {
  let worstAlignment = 101;
  let worstDim: Dimension | null = null;

  for (const dim of dimensions) {
    const dimScore = dimensionScores.get(dim.dimension_id);
    if (!dimScore) continue;

    const uniWeight = uniDimWeights.get(dim.dimension_id);
    if (uniWeight === undefined) continue;

    const alignment = 100 - Math.abs(dimScore.score - uniWeight);
    if (alignment < worstAlignment) {
      worstAlignment = alignment;
      worstDim = dim;
    }
  }

  if (worstDim && worstAlignment < 70) {
    return worstDim.name;
  }

  return university.low_fit_student ?? 'Sem pontos de atenção significativos';
}

function computeSubScores(
  dimensionScores: Map<string, DimensionScore>,
  uniDimWeights: Map<string, number>,
  dimensions: Dimension[]
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, dimIds] of Object.entries(SUBSCORE_DIMENSIONS)) {
    if (key === 'cultural_fit') continue;
    let sum = 0;
    let count = 0;
    for (const dimId of dimIds) {
      const dimScore = dimensionScores.get(dimId);
      if (!dimScore) continue;
      const uniWeight = uniDimWeights.get(dimId);
      if (uniWeight === undefined) continue;
      let alignment = 100 - Math.abs(dimScore.score - uniWeight);
      if (!dimScore.answered) {
        alignment = alignment * 0.5;
      }
      sum += alignment;
      count += 1;
    }
    result[key] = count > 0 ? Math.round(sum / count) : 50;
  }
  return result;
}

export function getSubScoreLabel(key: string): string {
  const labels: Record<string, string> = {
    academic_fit: 'Fit Acadêmico',
    career_fit: 'Fit de Carreira',
    entrepreneurship_fit: 'Fit Empreendedor',
    cultural_fit: 'Fit Cultural',
    international_fit: 'Fit Internacional',
    learning_style_fit: 'Fit com Estilo de Aprendizagem',
  };
  return labels[key] ?? key;
}

export function getSubScoreValue(
  result: MatchResult,
  key: string
): number {
  if (key === 'cultural_fit') {
    return Math.round(result.culturalFitScore);
  }
  if (result.subScores && result.subScores[key] !== undefined) {
    return Math.round(result.subScores[key]);
  }
  return 50;
}

export function getStudentProfileAttributes(
  data: MatchingData,
  answers: AnswerMap
): { name: string; score: number }[] {
  const dimScores = computeDimensionScores(data, answers);
  const result: { name: string; score: number }[] = [];
  for (const dimId of STUDENT_PROFILE_DIMENSIONS) {
    const dim = data.dimensions.find((d) => d.dimension_id === dimId);
    if (!dim) continue;
    const ds = dimScores.get(dimId);
    if (ds) result.push({ name: dim.name, score: ds.score });
  }
  result.sort((a, b) => b.score - a.score);
  return result.slice(0, 8);
}

const MAX_SCORE = 99;

function amplifyScore(raw: number): number {
  const boosted = 20 + raw * 0.85;
  return Math.max(0, Math.min(100, boosted));
}

function capScore(raw: number): number {
  if (raw <= 94) return raw;
  if (raw >= 100) return MAX_SCORE;
  return 94 + ((raw - 94) / (100 - 94)) * (MAX_SCORE - 94);
}

export interface CompatibilityBand {
  label: string;
  color: string;
  description: string;
}

export function getCompatibilityBand(score: number): CompatibilityBand {
  if (score < 55) return { label: 'Baixa compatibilidade', color: '#7e8aaf', description: 'Seu perfil atual apresenta menos pontos de alinhamento com as características priorizadas por esta instituição.' };
  if (score <= 69) return { label: 'Compatibilidade moderada', color: '#22d3ee', description: 'Seu perfil tem alguns pontos de alinhamento com esta instituição.' };
  if (score <= 79) return { label: 'Boa compatibilidade', color: '#60a5fa', description: 'Seu perfil apresenta alinhamento relevante com esta instituição.' };
  if (score <= 89) return { label: 'Ótima compatibilidade', color: '#60a5fa', description: 'Seu perfil tem um match claramente forte com esta instituição.' };
  if (score <= 95) return { label: 'Excelente compatibilidade', color: '#22d3ee', description: 'Seu perfil apresenta alinhamento muito alto com esta instituição.' };
  return { label: 'Compatibilidade excepcional', color: '#22d3ee', description: 'Seu perfil apresenta alinhamento extremamente alto em praticamente todos os principais pilares avaliados.' };
}

export const COMPATIBILITY_SCALE = [
  { range: '0–54%', label: 'Baixa' },
  { range: '55–69%', label: 'Moderada' },
  { range: '70–79%', label: 'Boa' },
  { range: '80–89%', label: 'Ótima' },
  { range: '90–95%', label: 'Excelente' },
  { range: '96–99%', label: 'Excepcional' },
];

export const COMPATIBILITY_EXPLANATION = 'O percentual representa o quanto seu perfil acadêmico, seus objetivos, preferências, estilo de aprendizagem e características pessoais se alinham ao perfil desta faculdade. Ele não representa sua chance de aprovação.';

export { PILLAR_LABELS };
