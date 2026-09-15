-- =============================================================
-- Fix 1: SECURITY DEFINER view → SECURITY INVOKER
-- The official_vestibular_question_bank view was SECURITY DEFINER,
-- bypassing RLS of the querying user. Switch to SECURITY INVOKER so
-- RLS policies of the caller are enforced on underlying tables.
-- =============================================================
ALTER VIEW public.official_vestibular_question_bank
  SET (security_invoker = true);

-- Revoke DML privileges from anon and authenticated on the view.
-- Views should be read-only for clients; only SELECT is needed.
REVOKE INSERT, UPDATE, DELETE ON public.official_vestibular_question_bank FROM anon;
REVOKE INSERT, UPDATE, DELETE ON public.official_vestibular_question_bank FROM authenticated;

-- =============================================================
-- Fix 2: RLS enabled but no policy on official_question_materialized_cache
-- Add a SELECT policy for authenticated users (the edge function
-- delete-account and the frontend read materialized images by question_id).
-- Only authenticated users need to read this cache.
-- =============================================================
CREATE POLICY "authenticated_read_materialized_cache"
  ON public.official_question_materialized_cache FOR SELECT
  TO authenticated
  USING (true);

-- =============================================================
-- Fix 3: auth_rls_initplan — wrap auth.jwt() in subselect on 8 admin-read policies
-- The performance advisor flags auth.jwt() calls that are re-evaluated
-- per row. Wrapping in (SELECT auth.jwt() AS jwt) makes Postgres cache
-- the result for the duration of the query.
-- =============================================================
DROP POLICY IF EXISTS admin_read_ai_tutor_feedback ON public.ai_tutor_feedback;
CREATE POLICY admin_read_ai_tutor_feedback ON public.ai_tutor_feedback
  FOR SELECT TO authenticated
  USING (COALESCE(((SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'role'::text, ''::text) = 'admin'::text);

DROP POLICY IF EXISTS admin_read_ai_tutor_usage ON public.ai_tutor_usage;
CREATE POLICY admin_read_ai_tutor_usage ON public.ai_tutor_usage
  FOR SELECT TO authenticated
  USING (COALESCE(((SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'role'::text, ''::text) = 'admin'::text);

DROP POLICY IF EXISTS admin_read_student_exam_attempts ON public.student_exam_attempts;
CREATE POLICY admin_read_student_exam_attempts ON public.student_exam_attempts
  FOR SELECT TO authenticated
  USING (COALESCE(((SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'role'::text, ''::text) = 'admin'::text);

DROP POLICY IF EXISTS admin_read_student_official_exam_answers ON public.student_official_exam_answers;
CREATE POLICY admin_read_student_official_exam_answers ON public.student_official_exam_answers
  FOR SELECT TO authenticated
  USING (COALESCE(((SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'role'::text, ''::text) = 'admin'::text);

DROP POLICY IF EXISTS admin_read_student_official_exam_sessions ON public.student_official_exam_sessions;
CREATE POLICY admin_read_student_official_exam_sessions ON public.student_official_exam_sessions
  FOR SELECT TO authenticated
  USING (COALESCE(((SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'role'::text, ''::text) = 'admin'::text);

DROP POLICY IF EXISTS admin_read_student_phase_drill_attempts ON public.student_phase_drill_attempts;
CREATE POLICY admin_read_student_phase_drill_attempts ON public.student_phase_drill_attempts
  FOR SELECT TO authenticated
  USING (COALESCE(((SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'role'::text, ''::text) = 'admin'::text);

DROP POLICY IF EXISTS admin_read_student_practice_attempts ON public.student_practice_attempts;
CREATE POLICY admin_read_student_practice_attempts ON public.student_practice_attempts
  FOR SELECT TO authenticated
  USING (COALESCE(((SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'role'::text, ''::text) = 'admin'::text);

DROP POLICY IF EXISTS admin_read_student_weekly_plan_progress ON public.student_weekly_plan_progress;
CREATE POLICY admin_read_student_weekly_plan_progress ON public.student_weekly_plan_progress
  FOR SELECT TO authenticated
  USING (COALESCE(((SELECT auth.jwt() AS jwt) -> 'app_metadata'::text) ->> 'role'::text, ''::text) = 'admin'::text);

-- =============================================================
-- Fix 4: Revoke anon INSERT/UPDATE/DELETE on all tables.
-- The anon role should only have SELECT on public-read tables and
-- no write access. RLS policies already prevent unauthorized writes,
-- but revoking the base privileges adds defense-in-depth.
-- =============================================================
DO $$
DECLARE
  t text;
  tables_with_anon_write text[] := ARRAY[
    'academic_areas','admin_settings','admission_cutoff_references',
    'admission_phase_drills','analytics_events','area_dimension_priorities',
    'area_match_calibration','area_match_feedback','area_match_feedback_calibration',
    'area_match_responses','area_questionnaire_versions','area_questions',
    'area_universities','area_university_dimension_profiles','area_university_evidence',
    'course_exam_models','course_exam_targets','cultural_axes','dimensions',
    'enem_tri_empirical_calibration','evidence_dimensions','exam_intelligence_profiles',
    'exam_practice_questions','exam_resources','exam_skill_taxonomy',
    'exam_study_resources','faculty_questionnaire_evidence',
    'institution_interest_leads','institution_reference_sources',
    'match_dimensions','match_history','official_evidence','official_exam_booklets',
    'official_exam_editions','official_exam_error_reports','official_exam_item_booklet_map',
    'official_exam_items','official_exam_series','pillar_weights','question_dimensions',
    'questionnaire_progress','questions','referrals','referrers','saved_universities',
    'sharing_consents','sources','student_answers','student_exam_attempts',
    'student_exam_preferences','student_official_exam_answers',
    'student_official_exam_sessions','student_phase_drill_attempts',
    'student_practice_attempts','student_saved_programs','student_seen_questions',
    'student_sessions','student_skill_diagnostics','student_weekly_plan_progress',
    'text_rubrics','universities','university_admission_routes',
    'university_axis_targets','university_dimension_weights','user_feedback',
    'user_profiles'
  ];
BEGIN
  FOREACH t IN ARRAY tables_with_anon_write LOOP
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE ON public.%I FROM anon', t);
  END LOOP;
END;
$$;
