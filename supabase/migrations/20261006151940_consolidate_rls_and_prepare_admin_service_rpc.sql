-- Applied to production as Supabase migration 20261006151940.
-- Consolidate duplicated RLS policies and move admin SECURITY DEFINER RPC calls behind the server API.

DO $$
DECLARE r record;
DECLARE d text;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public'
      AND p.proname IN ('get_admin_dashboard_stats','get_admin_impact_stats','get_admin_session_answers','get_admin_sessions','get_admin_traffic_stats')
  LOOP
    d := pg_get_functiondef(r.oid);
    d := replace(d,
      'if auth.uid() is null
     or coalesce(auth.jwt() -> ''app_metadata'' ->> ''role'', '''') <> ''admin'' then',
      'if coalesce(auth.jwt() ->> ''role'', '''') <> ''service_role'' and (auth.uid() is null or coalesce(auth.jwt() -> ''app_metadata'' ->> ''role'', '''') <> ''admin'') then');
    d := replace(d,
      'if auth.uid() is null or coalesce(auth.jwt() -> ''app_metadata'' ->> ''role'', '''') <> ''admin'' then',
      'if coalesce(auth.jwt() ->> ''role'', '''') <> ''service_role'' and (auth.uid() is null or coalesce(auth.jwt() -> ''app_metadata'' ->> ''role'', '''') <> ''admin'') then');
    d := replace(d,
      'IF ((auth.jwt() -> ''app_metadata''::text) ->> ''role''::text) <> ''admin'' THEN',
      'IF coalesce(auth.jwt() ->> ''role'', '''') <> ''service_role'' AND ((auth.jwt() -> ''app_metadata''::text) ->> ''role''::text) <> ''admin'' THEN');
    EXECUTE d;
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.oid::regprocedure);
  END LOOP;
END $$;

DROP POLICY IF EXISTS rate_limit_service_role ON public.api_rate_limit_events;
CREATE POLICY rate_limit_service_role ON public.api_rate_limit_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS admin_read_ai_tutor_feedback ON public.ai_tutor_feedback;
DROP POLICY IF EXISTS ai_tutor_feedback_select_own ON public.ai_tutor_feedback;
CREATE POLICY ai_tutor_feedback_select_own ON public.ai_tutor_feedback
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id OR coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role','')='admin');

DROP POLICY IF EXISTS admin_read_ai_tutor_usage ON public.ai_tutor_usage;
DROP POLICY IF EXISTS "users read own ai tutor usage" ON public.ai_tutor_usage;
CREATE POLICY "users read own ai tutor usage" ON public.ai_tutor_usage
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id OR coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role','')='admin');

DROP POLICY IF EXISTS admin_read_essay_access ON public.essay_course_access;
DROP POLICY IF EXISTS read_own_essay_access ON public.essay_course_access;
CREATE POLICY read_own_essay_access ON public.essay_course_access
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id OR coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role','')='admin');

DROP POLICY IF EXISTS admin_read_all_reviewers ON public.essay_reviewers;
DROP POLICY IF EXISTS read_own_reviewer_role ON public.essay_reviewers;
CREATE POLICY read_own_reviewer_role ON public.essay_reviewers
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id OR coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role','')='admin');

DROP POLICY IF EXISTS essay_materials_admin ON public.essay_course_materials;
DROP POLICY IF EXISTS essay_materials_read ON public.essay_course_materials;
CREATE POLICY essay_materials_read ON public.essay_course_materials
  FOR SELECT TO authenticated
  USING (
    (has_essay_course_access() AND EXISTS (
      SELECT 1 FROM public.essay_course_modules m
      WHERE m.id = essay_course_materials.module_id AND m.status='published'
    ))
    OR coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role','')='admin'
  );
CREATE POLICY essay_materials_admin_insert ON public.essay_course_materials
  FOR INSERT TO authenticated WITH CHECK (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role','')='admin');
CREATE POLICY essay_materials_admin_update ON public.essay_course_materials
  FOR UPDATE TO authenticated
  USING (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role','')='admin')
  WITH CHECK (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role','')='admin');
CREATE POLICY essay_materials_admin_delete ON public.essay_course_materials
  FOR DELETE TO authenticated USING (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role','')='admin');

DROP POLICY IF EXISTS admin_crud_essay_modules ON public.essay_course_modules;
DROP POLICY IF EXISTS read_published_essay_modules ON public.essay_course_modules;
CREATE POLICY read_published_essay_modules ON public.essay_course_modules
  FOR SELECT TO authenticated
  USING (
    (status='published' AND has_essay_course_access())
    OR coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role','')='admin'
  );
CREATE POLICY admin_insert_essay_modules ON public.essay_course_modules
  FOR INSERT TO authenticated WITH CHECK (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role','')='admin');
CREATE POLICY admin_update_essay_modules ON public.essay_course_modules
  FOR UPDATE TO authenticated
  USING (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role','')='admin')
  WITH CHECK (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role','')='admin');
CREATE POLICY admin_delete_essay_modules ON public.essay_course_modules
  FOR DELETE TO authenticated USING (coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role','')='admin');

DROP POLICY IF EXISTS "students insert own submissions" ON public.essay_submissions;
DROP POLICY IF EXISTS "students read own submissions" ON public.essay_submissions;
DROP POLICY IF EXISTS "correctors read all submissions" ON public.essay_submissions;
DROP POLICY IF EXISTS select_own_essay_submissions ON public.essay_submissions;
CREATE POLICY select_own_essay_submissions ON public.essay_submissions
  FOR SELECT TO authenticated
  USING (
    (select auth.uid()) = user_id
    OR is_essay_reviewer()
    OR EXISTS (SELECT 1 FROM public.essay_correctors c WHERE c.user_id=(select auth.uid()))
  );

DROP POLICY IF EXISTS "correctors review submissions" ON public.essay_submissions;
DROP POLICY IF EXISTS update_essay_submissions_status ON public.essay_submissions;
CREATE POLICY update_essay_submissions_status ON public.essay_submissions
  FOR UPDATE TO authenticated
  USING (
    is_essay_reviewer()
    OR EXISTS (SELECT 1 FROM public.essay_correctors c WHERE c.user_id=(select auth.uid()))
  )
  WITH CHECK (
    is_essay_reviewer()
    OR EXISTS (SELECT 1 FROM public.essay_correctors c WHERE c.user_id=(select auth.uid()))
  );

DROP POLICY IF EXISTS admin_read_student_exam_attempts ON public.student_exam_attempts;
DROP POLICY IF EXISTS "own attempts read" ON public.student_exam_attempts;
CREATE POLICY "own attempts read" ON public.student_exam_attempts
  FOR SELECT TO authenticated
  USING ((select auth.uid())=user_id OR coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role','')='admin');

DROP POLICY IF EXISTS admin_read_student_official_exam_answers ON public.student_official_exam_answers;
DROP POLICY IF EXISTS "own official exam answers read" ON public.student_official_exam_answers;
CREATE POLICY "own official exam answers read" ON public.student_official_exam_answers
  FOR SELECT TO authenticated
  USING ((select auth.uid())=user_id OR coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role','')='admin');

DROP POLICY IF EXISTS admin_read_student_official_exam_sessions ON public.student_official_exam_sessions;
DROP POLICY IF EXISTS "own official exam sessions read" ON public.student_official_exam_sessions;
CREATE POLICY "own official exam sessions read" ON public.student_official_exam_sessions
  FOR SELECT TO authenticated
  USING ((select auth.uid())=user_id OR coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role','')='admin');

DROP POLICY IF EXISTS admin_read_student_phase_drill_attempts ON public.student_phase_drill_attempts;
DROP POLICY IF EXISTS phase_attempts_select_own ON public.student_phase_drill_attempts;
CREATE POLICY phase_attempts_select_own ON public.student_phase_drill_attempts
  FOR SELECT TO public
  USING ((select auth.uid())=user_id OR coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role','')='admin');

DROP POLICY IF EXISTS admin_read_student_practice_attempts ON public.student_practice_attempts;
DROP POLICY IF EXISTS student_practice_attempts_select_own ON public.student_practice_attempts;
CREATE POLICY student_practice_attempts_select_own ON public.student_practice_attempts
  FOR SELECT TO authenticated
  USING ((select auth.uid())=user_id OR coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role','')='admin');

DROP POLICY IF EXISTS admin_read_student_weekly_plan_progress ON public.student_weekly_plan_progress;
DROP POLICY IF EXISTS students_read_own_weekly_progress ON public.student_weekly_plan_progress;
CREATE POLICY students_read_own_weekly_progress ON public.student_weekly_plan_progress
  FOR SELECT TO authenticated
  USING ((select auth.uid())=user_id OR coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role','')='admin');
