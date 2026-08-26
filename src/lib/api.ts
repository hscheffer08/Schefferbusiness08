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
  MatchResult,
  AnswerMap,
  SavedUniversity,
  UserFeedback,
  AdminSettings,
  SharingConsent,
  ConsentStatus,
  ConsentScope,
  Referrer,
  Referral,
  ReferralRankingEntry,
} from '@/types';

export interface DatabaseData {
  universities: University[];
  dimensions: Dimension[];
  culturalAxes: CulturalAxis[];
  questions: Question[];
  textRubrics: TextRubric[];
  pillarWeights: PillarWeight[];
  universityDimensionWeights: UniversityDimensionWeight[];
  universityAxisTargets: UniversityAxisTarget[];
  questionDimensions: QuestionDimension[];
  officialEvidence: OfficialEvidence[];
  evidenceDimensions: EvidenceDimension[];
  sources: Source[];
}

export async function loadDatabaseData(): Promise<DatabaseData> {
  if (!supabase) throw new Error('Supabase client not initialized');

  const [
    universitiesRes,
    dimensionsRes,
    culturalAxesRes,
    questionsRes,
    textRubricsRes,
    pillarWeightsRes,
    udwRes,
    uatRes,
    qdRes,
    evidenceRes,
    edRes,
    sourcesRes,
  ] = await Promise.all([
    supabase.from('universities').select('*'),
    supabase.from('dimensions').select('*'),
    supabase.from('cultural_axes').select('*'),
    supabase.from('questions').select('*').order('question_id'),
    supabase.from('text_rubrics').select('*'),
    supabase.from('pillar_weights').select('*'),
    supabase.from('university_dimension_weights').select('*'),
    supabase.from('university_axis_targets').select('*'),
    supabase.from('question_dimensions').select('*'),
    supabase.from('official_evidence').select('*'),
    supabase.from('evidence_dimensions').select('*'),
    supabase.from('sources').select('*'),
  ]);

  const errors = [
    universitiesRes.error,
    dimensionsRes.error,
    culturalAxesRes.error,
    questionsRes.error,
    textRubricsRes.error,
    pillarWeightsRes.error,
    udwRes.error,
    uatRes.error,
    qdRes.error,
    evidenceRes.error,
    edRes.error,
    sourcesRes.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    // The raw message names relations, constraints and policies. Keep it in the console
    // for debugging and give the user a message with no internal detail in it.
    console.error('loadDatabaseData failed', errors);
    throw new Error('Não foi possível carregar os dados agora.');
  }

  return {
    universities: universitiesRes.data as University[],
    dimensions: dimensionsRes.data as Dimension[],
    culturalAxes: culturalAxesRes.data as CulturalAxis[],
    questions: questionsRes.data as Question[],
    textRubrics: textRubricsRes.data as TextRubric[],
    pillarWeights: pillarWeightsRes.data as PillarWeight[],
    universityDimensionWeights: udwRes.data as UniversityDimensionWeight[],
    universityAxisTargets: uatRes.data as UniversityAxisTarget[],
    questionDimensions: qdRes.data as QuestionDimension[],
    officialEvidence: evidenceRes.data as OfficialEvidence[],
    evidenceDimensions: edRes.data as EvidenceDimension[],
    sources: sourcesRes.data as Source[],
  };
}

export async function saveSession(
  answers: Record<string, string>,
  consentGiven: boolean
): Promise<string | null> {
  if (!supabase) return null;

  // The session id is generated client-side so the row never has to be read back.
  // Reading it back would require a SELECT policy, and sessions must not be readable
  // by anyone other than their owner.
  const sessionId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const { data: userData } = await supabase.auth.getUser();

  const { error: sessionError } = await supabase.from('student_sessions').insert({
    id: sessionId,
    user_id: userData.user?.id ?? null,
    completed_at: new Date().toISOString(),
    consent_given: consentGiven,
  });

  if (sessionError) return null;

  const answerRows = Object.entries(answers).map(([questionId, answerValue]) => ({
    session_id: sessionId,
    question_id: questionId,
    answer_value: answerValue,
  }));

  if (answerRows.length > 0) {
    await supabase.from('student_answers').insert(answerRows);
  }

  return sessionId;
}

export async function saveMatchHistory(results: MatchResult[]): Promise<void> {
  if (!supabase) return;
  if (results.length === 0) return;

  const top = results[0];
  const allScores = results.map((r) => ({
    university_id: r.university.university_id,
    name: r.university.name,
    score: r.overallScore,
  }));

  await supabase.from('match_history').insert({
    top_university_id: top.university.university_id,
    top_university_name: top.university.name,
    top_score: top.overallScore,
    all_scores: allScores,
  });
}

// --- Questionnaire progress ---
export async function saveProgress(answers: AnswerMap, currentStep: number): Promise<void> {
  if (!supabase) return;
  await supabase.from('questionnaire_progress').upsert({
    answers,
    current_step: currentStep,
    updated_at: new Date().toISOString(),
  });
}

export async function loadProgress(): Promise<{ answers: AnswerMap; currentStep: number } | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('questionnaire_progress')
    .select('answers, current_step')
    .maybeSingle();
  if (error || !data) return null;
  return { answers: data.answers as AnswerMap, currentStep: data.current_step as number };
}

export async function clearProgress(): Promise<void> {
  if (!supabase) return;
  await supabase.from('questionnaire_progress').delete().neq('id', '00000000-0000-0000-0000-000000000000');
}

// --- Favorites ---
export async function getSavedUniversities(): Promise<SavedUniversity[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('saved_universities')
    .select('id, university_id, created_at')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as SavedUniversity[];
}

export async function saveUniversity(universityId: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('saved_universities').insert({ university_id: universityId });
  return !error;
}

export async function unsaveUniversity(universityId: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from('saved_universities').delete().eq('university_id', universityId);
  return !error;
}

export async function isUniversitySaved(universityId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data, error } = await supabase
    .from('saved_universities')
    .select('id')
    .eq('university_id', universityId)
    .maybeSingle();
  if (error || !data) return false;
  return true;
}

// --- Feedback ---
export async function saveFeedback(
  rating: 'positive' | 'negative',
  comment: string | null
): Promise<void> {
  if (!supabase) return;
  await supabase.from('user_feedback').insert({ rating, comment });
}

// --- Admin settings ---
export async function getAdminSettings(): Promise<AdminSettings | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('admin_settings')
    .select('payments_enabled, price_brl, free_period_active, updated_at')
    .eq('id', 1)
    .maybeSingle();
  if (error || !data) return null;
  return {
    payments_enabled: data.payments_enabled,
    price_brl: Number(data.price_brl),
    free_period_active: data.free_period_active,
    updated_at: data.updated_at,
  };
}

export function getEvidenceForUniversity(
  evidence: OfficialEvidence[],
  _evidenceDimensions: EvidenceDimension[],
  universityId: string
): OfficialEvidence[] {
  return evidence.filter((e) => e.university_id === universityId);
}

// --- Sharing consent ---

export function isMinor(ageRange: string | null | undefined): boolean {
  if (!ageRange) return false;
  const minorRanges = ['Menos de 15 anos', '15-16 anos', '17-18 anos'];
  return minorRanges.includes(ageRange);
}

export async function getSharingConsent(): Promise<SharingConsent | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('sharing_consents')
    .select('*')
    .maybeSingle();
  if (error || !data) return null;
  return data as SharingConsent;
}

export async function saveSharingConsent(params: {
  consentStatus: ConsentStatus;
  consentScope: ConsentScope;
  requiresGuardianConsent: boolean;
  guardianName?: string;
  guardianEmail?: string;
}): Promise<SharingConsent | null> {
  if (!supabase) return null;

  const now = new Date().toISOString();
  const isAccepted = params.consentStatus === 'accepted' && params.consentScope !== 'none';

  const payload: Record<string, unknown> = {
    consent_status: params.consentStatus,
    consent_scope: params.consentScope,
    requires_guardian_consent: params.requiresGuardianConsent,
    privacy_policy_version: '1.0',
    updated_at: now,
  };

  if (params.requiresGuardianConsent) {
    payload.guardian_name = params.guardianName ?? null;
    payload.guardian_email = params.guardianEmail ?? null;
  }

  const existing = await getSharingConsent();

  if (existing) {
    if (isAccepted && !existing.consent_given_at) {
      payload.consent_given_at = now;
      payload.consent_revoked_at = null;
    } else if (!isAccepted && existing.consent_given_at) {
      payload.consent_revoked_at = now;
    }

    const { data, error } = await supabase
      .from('sharing_consents')
      .update(payload)
      .eq('id', existing.id)
      .select('*')
      .single();
    if (error) return null;
    return data as SharingConsent;
  } else {
    if (isAccepted) {
      payload.consent_given_at = now;
    }

    const { data, error } = await supabase
      .from('sharing_consents')
      .insert(payload)
      .select('*')
      .single();
    if (error) return null;
    return data as SharingConsent;
  }
}

export async function revokeSharingConsent(): Promise<boolean> {
  if (!supabase) return false;
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('sharing_consents')
    .update({
      consent_status: 'revoked',
      consent_scope: 'none',
      consent_revoked_at: now,
      updated_at: now,
    })
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '');
  return !error;
}

export async function getConsentStats(startDate?: string | null): Promise<{
  accepted: number;
  declined: number;
  revoked: number;
  total: number;
  byScope: { scope: string; count: number }[];
}> {
  if (!supabase) return { accepted: 0, declined: 0, revoked: 0, total: 0, byScope: [] };

  const statusQuery = supabase.from('sharing_consents').select('consent_status');
  const scopeQuery = supabase.from('sharing_consents').select('consent_scope');
  if (startDate) {
    statusQuery.gte('created_at', startDate);
    scopeQuery.gte('created_at', startDate);
  }

  const [statusRes, scopeRes] = await Promise.all([statusQuery, scopeQuery]);

  const rows = (statusRes.data ?? []) as { consent_status: string }[];
  const scopeRows = (scopeRes.data ?? []) as { consent_scope: string }[];

  const accepted = rows.filter((r) => r.consent_status === 'accepted').length;
  const declined = rows.filter((r) => r.consent_status === 'declined').length;
  const revoked = rows.filter((r) => r.consent_status === 'revoked').length;

  const scopeMap = new Map<string, number>();
  scopeRows.forEach((r) => {
    scopeMap.set(r.consent_scope, (scopeMap.get(r.consent_scope) ?? 0) + 1);
  });

  return {
    accepted,
    declined,
    revoked,
    total: rows.length,
    byScope: Array.from(scopeMap.entries()).map(([scope, count]) => ({ scope, count })),
  };
}

// ============================================================
// Referral system
// ============================================================

export function generateReferralCode(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z]/g, '')
    .toUpperCase()
    .slice(0, 8) || 'REF';
  const suffix = Math.floor(10 + Math.random() * 90);
  return `${base}${suffix}`;
}

export async function validateReferralCode(code: string): Promise<Referrer | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('referrers')
    .select('*')
    .eq('referral_code', code.toUpperCase())
    .eq('is_active', true)
    .maybeSingle();
  if (error || !data) return null;
  return data as Referrer;
}

export async function createReferral(params: {
  referralCode: string;
  referrerId: string;
  referredUserId?: string | null;
  referredUserName?: string | null;
  referredUserEmail?: string | null;
  referralSource: string;
}): Promise<Referral | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('referrals')
    .insert({
      referrer_id: params.referrerId,
      referral_code: params.referralCode,
      referred_user_id: params.referredUserId ?? null,
      referred_user_name: params.referredUserName ?? null,
      referred_user_email: params.referredUserEmail ?? null,
      referral_source: params.referralSource,
      quiz_started: false,
      quiz_completed: false,
    })
    .select('*')
    .maybeSingle();
  if (error) return null;
  return data as Referral;
}

export async function updateReferralStatus(params: {
  referralId: string;
  quizStarted?: boolean;
  quizCompleted?: boolean;
}): Promise<void> {
  if (!supabase) return;
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (params.quizStarted !== undefined) updates.quiz_started = params.quizStarted;
  // `is_valid` is derived from `quiz_completed` by a database trigger and is not
  // writable by the client.
  if (params.quizCompleted !== undefined) {
    updates.quiz_completed = params.quizCompleted;
  }
  await supabase.from('referrals').update(updates).eq('id', params.referralId);
}

export async function findReferralByUser(userId: string): Promise<Referral | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .eq('referred_user_id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as Referral;
}

// --- Admin: referrer CRUD ---

export async function getAllReferrers(): Promise<Referrer[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('referrers')
    .select('*')
    .order('created_at', { ascending: true });
  if (error || !data) return [];
  return data as Referrer[];
}

export async function createReferrer(name: string): Promise<Referrer | null> {
  if (!supabase) return null;
  const code = generateReferralCode(name);
  const { data, error } = await supabase
    .from('referrers')
    .insert({ name, referral_code: code })
    .select('*')
    .maybeSingle();
  if (error) return null;
  return data as Referrer;
}

export async function updateReferrer(id: string, fields: Partial<Pick<Referrer, 'name' | 'is_active'>>): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('referrers')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id);
  return !error;
}

export async function getAllReferrals(): Promise<Referral[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as Referral[];
}

export async function getReferralRanking(): Promise<ReferralRankingEntry[]> {
  if (!supabase) return [];
  const [referrersRes, referralsRes] = await Promise.all([
    supabase.from('referrers').select('*'),
    supabase.from('referrals').select('*'),
  ]);

  if (referrersRes.error || !referrersRes.data) return [];
  const referrers = referrersRes.data as Referrer[];
  const referrals = (referralsRes.data ?? []) as Referral[];

  return referrers
    .map((r) => {
      const refs = referrals.filter((ref) => ref.referrer_id === r.id);
      const totalAccesses = refs.length;
      const quizzesStarted = refs.filter((ref) => ref.quiz_started).length;
      const quizzesCompleted = refs.filter((ref) => ref.quiz_completed).length;
      const validReferrals = refs.filter((ref) => ref.is_valid).length;
      const conversionRate = totalAccesses > 0 ? Math.round((quizzesCompleted / totalAccesses) * 100) : 0;
      return {
        referrer_id: r.id,
        name: r.name,
        referral_code: r.referral_code,
        is_active: r.is_active,
        total_accesses: totalAccesses,
        quizzes_started: quizzesStarted,
        quizzes_completed: quizzesCompleted,
        valid_referrals: validReferrals,
        conversion_rate: conversionRate,
      };
    })
    .sort((a, b) => b.valid_referrals - a.valid_referrals || b.total_accesses - a.total_accesses);
}

export function buildReferralLink(code: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/?ref=${code}`;
}

export function exportReferralRankingCSV(ranking: ReferralRankingEntry[]): string {
  const headers = ['Posicao', 'Indicador', 'Codigo', 'Acessos', 'Testes iniciados', 'Testes concluidos', 'Indicacoes validas', 'Taxa de conversao (%)'];
  const rows = ranking.map((r, i) => [
    i + 1,
    r.name,
    r.referral_code,
    r.total_accesses,
    r.quizzes_started,
    r.quizzes_completed,
    r.valid_referrals,
    r.conversion_rate,
  ]);
  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell)}"`).join(',')).join('\n');
  return csv;
}
