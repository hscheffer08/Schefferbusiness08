/*
# Remove faculty-profile verification and allow imports from the full questionnaire

The faculty profile is now a user-authored profile, not a document-verification
workflow. Existing attachments remain available, but new records do not require
files or a verification status. Full-questionnaire imports are identified by a
stable source key so repeating the questionnaire updates the imported data
instead of creating duplicates.
*/

ALTER TABLE public.faculty_questionnaire_evidence
  ALTER COLUMN file_path DROP NOT NULL,
  ALTER COLUMN file_name DROP NOT NULL,
  ALTER COLUMN mime_type DROP NOT NULL,
  ALTER COLUMN file_size DROP NOT NULL;

ALTER TABLE public.faculty_questionnaire_evidence
  DROP COLUMN IF EXISTS verification_status;

ALTER TABLE public.faculty_questionnaire_evidence
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'full_quiz')),
  ADD COLUMN IF NOT EXISTS source_reference text NOT NULL DEFAULT gen_random_uuid()::text,
  ADD COLUMN IF NOT EXISTS imported_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS uq_faculty_profile_source
  ON public.faculty_questionnaire_evidence(user_id, source, source_reference);

GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.faculty_questionnaire_evidence
  TO authenticated;

ALTER TABLE public.faculty_questionnaire_evidence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_faculty_evidence" ON public.faculty_questionnaire_evidence;
CREATE POLICY "select_own_faculty_evidence"
  ON public.faculty_questionnaire_evidence FOR SELECT TO authenticated
  USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "insert_own_faculty_evidence" ON public.faculty_questionnaire_evidence;
CREATE POLICY "insert_own_faculty_evidence"
  ON public.faculty_questionnaire_evidence FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "update_own_faculty_evidence" ON public.faculty_questionnaire_evidence;
CREATE POLICY "update_own_faculty_evidence"
  ON public.faculty_questionnaire_evidence FOR UPDATE TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "delete_own_faculty_evidence" ON public.faculty_questionnaire_evidence;
CREATE POLICY "delete_own_faculty_evidence"
  ON public.faculty_questionnaire_evidence FOR DELETE TO authenticated
  USING ((select auth.uid()) = user_id);

NOTIFY pgrst, 'reload schema';
