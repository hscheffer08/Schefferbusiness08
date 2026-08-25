export interface University {
  university_id: string;
  name: string;
  course: string | null;
  location: string | null;
  format: string | null;
  positioning: string | null;
  program_differentiators: string | null;
  admissions: string | null;
  values: string | null;
  high_fit_student: string | null;
  low_fit_student: string | null;
  match_rationale: string | null;
  primary_source_url: string | null;
  image_url: string | null;
}

export interface Dimension {
  dimension_id: string;
  pillar: string;
  name: string;
  definition: string | null;
  student_scoring_method: string | null;
}

export interface CulturalAxis {
  axis_id: string;
  name: string;
  scale_description: string | null;
}

export type QuizMode = 'quick' | 'full';

export interface Question {
  question_id: string;
  question_text: string;
  block: string;
  response_type: string;
  is_required: boolean;
  mvp_status: string | null;
  score_usage: string | null;
  helper_text: string | null;
  scale_min_label: string | null;
  scale_mid_label: string | null;
  scale_max_label: string | null;
  is_quick_match: boolean;
}

export interface TextRubric {
  rubric_id: string;
  rubric_name: string;
  range_min: number;
  range_max: number;
  description: string;
  observable_signs: string;
}

export interface PillarWeight {
  pillar: string;
  weight_pct: number;
}

export interface UniversityDimensionWeight {
  university_id: string;
  dimension_id: string;
  weight: number;
}

export interface UniversityAxisTarget {
  university_id: string;
  axis_id: string;
  target: number;
}

export interface QuestionDimension {
  question_id: string;
  dimension_id: string;
}

export interface OfficialEvidence {
  evidence_id: string;
  university_id: string;
  evidence_name: string;
  evidence_type: string | null;
  summary: string | null;
  source_url: string | null;
}

export interface EvidenceDimension {
  evidence_id: string;
  dimension_id: string;
}

export interface Source {
  source_id: string;
  university_id: string;
  source_name: string;
  url: string;
  usage_note: string | null;
}

export interface MatchResult {
  university: University;
  overallScore: number;
  rawScore: number;
  pillarScores: Record<string, number>;
  culturalFitScore: number;
  subScores: Record<string, number>;
  topReasons: string[];
  mismatchPoint: string;
  evidence: OfficialEvidence[];
}

export type Screen =
  | 'home'
  | 'quiz'
  | 'results'
  | 'detail'
  | 'auth'
  | 'profile'
  | 'onboarding'
  | 'compare'
  | 'consent'
  | 'howitworks'
  | 'methodology'
  | 'faq'
  | 'privacy'
  | 'terms'
  | 'faculty-questionnaire'
  | 'usa-universities'
  | 'admin';

export type FacultyEvidenceCategory =
  | 'extracurriculars'
  | 'grades'
  | 'languages'
  | 'awards'
  | 'projects'
  | 'experience';

export interface FacultyEvidence {
  id: string;
  user_id: string;
  category: FacultyEvidenceCategory;
  title: string;
  institution: string | null;
  details: string | null;
  occurred_on: string | null;
  file_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  verification_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  display_name: string | null;
  school_year: string | null;
  city: string | null;
  state: string | null;
  age_range: string | null;
  onboarding_completed: boolean;
  created_at: string;
}

export interface MatchHistoryEntry {
  id: string;
  user_id: string;
  session_id: string | null;
  top_university_id: string;
  top_university_name: string;
  top_score: number;
  all_scores: { university_id: string; name: string; score: number }[];
  created_at: string;
}

export interface SavedUniversity {
  id: string;
  university_id: string;
  created_at: string;
}

export interface UserFeedback {
  rating: 'positive' | 'negative';
  comment: string | null;
}

export interface AdminSettings {
  payments_enabled: boolean;
  price_brl: number;
  free_period_active: boolean;
  updated_at: string;
}

export interface AnalyticsEvent {
  event_type: string;
  user_id?: string | null;
  session_id?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
}

export interface AnswerMap {
  [questionId: string]: string;
}

export type ConsentStatus = 'accepted' | 'declined' | 'revoked';
export type ConsentScope = 'all_participating' | 'my_ranking' | 'top_match' | 'none';

export interface SharingConsent {
  id: string;
  user_id: string;
  consent_status: ConsentStatus;
  consent_scope: ConsentScope;
  consent_given_at: string | null;
  consent_revoked_at: string | null;
  privacy_policy_version: string;
  requires_guardian_consent: boolean;
  guardian_consent_given: boolean;
  guardian_consent_given_at: string | null;
  guardian_name: string | null;
  guardian_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Referrer {
  id: string;
  name: string;
  referral_code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referral_code: string;
  referred_user_id: string | null;
  referred_user_name: string | null;
  referred_user_email: string | null;
  referral_source: string;
  quiz_started: boolean;
  quiz_completed: boolean;
  is_valid: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReferralRankingEntry {
  referrer_id: string;
  name: string;
  referral_code: string;
  is_active: boolean;
  total_accesses: number;
  quizzes_started: number;
  quizzes_completed: number;
  valid_referrals: number;
  conversion_rate: number;
}
