import { supabase } from '@/lib/supabase';
import type {
  University,
  Dimension,
  CulturalAxis,
  Question,
  TextRubric,
  PillarWeight,
  UniversityDimensionWeight,
  UniversityAxisTarget,
  QuestionDimension,
  OfficialEvidence,
  EvidenceDimension,
  Source,
} from '@/types';
import type { DatabaseData } from '@/lib/api';

type QueryResult<T> = { data: T[] | null; error: unknown };

const LOAD_TIMEOUT_MS = 12_000;

async function safeQuery<T>(name: string, query: PromiseLike<QueryResult<T>>): Promise<T[]> {
  try {
    const { data, error } = await query;
    if (error) {
      console.warn(`Supabase table unavailable: ${name}`, error);
      return [];
    }
    return data ?? [];
  } catch (error) {
    console.warn(`Supabase request failed: ${name}`, error);
    return [];
  }
}

async function requiredQuery<T>(name: string, query: PromiseLike<QueryResult<T>>): Promise<T[]> {
  const result = await Promise.race([
    Promise.resolve(query),
    new Promise<never>((_, reject) =>
      window.setTimeout(() => reject(new Error(`Timeout loading ${name}`)), LOAD_TIMEOUT_MS)
    ),
  ]);
  if (result.error) throw new Error(`Required table unavailable: ${name}`);
  if (!result.data?.length) throw new Error(`Required table is empty: ${name}`);
  return result.data;
}

export async function loadDatabaseDataSafe(): Promise<DatabaseData> {
  if (!supabase) {
    console.error('Supabase client is not configured.');
    return {
      universities: [],
      dimensions: [],
      culturalAxes: [],
      questions: [],
      textRubrics: [],
      pillarWeights: [],
      universityDimensionWeights: [],
      universityAxisTargets: [],
      questionDimensions: [],
      officialEvidence: [],
      evidenceDimensions: [],
      sources: [],
    };
  }

  const [
    universities,
    dimensions,
    culturalAxes,
    questions,
    textRubrics,
    pillarWeights,
    universityDimensionWeights,
    universityAxisTargets,
    questionDimensions,
    officialEvidence,
    evidenceDimensions,
    sources,
  ] = await Promise.all([
    requiredQuery<University>('universities', supabase.from('universities').select('*')),
    requiredQuery<Dimension>('dimensions', supabase.from('dimensions').select('*')),
    safeQuery<CulturalAxis>('cultural_axes', supabase.from('cultural_axes').select('*')),
    requiredQuery<Question>('questions', supabase.from('questions').select('*').order('question_id')),
    safeQuery<TextRubric>('text_rubrics', supabase.from('text_rubrics').select('*')),
    safeQuery<PillarWeight>('pillar_weights', supabase.from('pillar_weights').select('*')),
    safeQuery<UniversityDimensionWeight>('university_dimension_weights', supabase.from('university_dimension_weights').select('*')),
    safeQuery<UniversityAxisTarget>('university_axis_targets', supabase.from('university_axis_targets').select('*')),
    safeQuery<QuestionDimension>('question_dimensions', supabase.from('question_dimensions').select('*')),
    safeQuery<OfficialEvidence>('official_evidence', supabase.from('official_evidence').select('*')),
    safeQuery<EvidenceDimension>('evidence_dimensions', supabase.from('evidence_dimensions').select('*')),
    safeQuery<Source>('sources', supabase.from('sources').select('*')),
  ]);

  return {
    universities,
    dimensions,
    culturalAxes,
    questions,
    textRubrics,
    pillarWeights,
    universityDimensionWeights,
    universityAxisTargets,
    questionDimensions,
    officialEvidence,
    evidenceDimensions,
    sources,
  };
}
