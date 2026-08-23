/*
# Questionário para as Faculdades

Cria uma área privada para o aluno registrar informações acadêmicas e
extracurriculares com um comprovante obrigatório em foto ou PDF.
*/

CREATE TABLE IF NOT EXISTS public.faculty_questionnaire_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN (
    'extracurriculars', 'grades', 'languages', 'awards', 'projects', 'experience'
  )),
  title text NOT NULL CHECK (char_length(title) BETWEEN 2 AND 160),
  institution text,
  details text,
  occurred_on date,
  file_path text NOT NULL,
  file_name text NOT NULL,
  mime_type text NOT NULL CHECK (mime_type IN (
    'image/jpeg', 'image/png', 'image/webp', 'application/pdf'
  )),
  file_size bigint NOT NULL CHECK (file_size > 0 AND file_size <= 10485760),
  verification_status text NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_faculty_evidence_user_category
  ON public.faculty_questionnaire_evidence(user_id, category, created_at DESC);

ALTER TABLE public.faculty_questionnaire_evidence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_faculty_evidence" ON public.faculty_questionnaire_evidence;
CREATE POLICY "select_own_faculty_evidence"
  ON public.faculty_questionnaire_evidence FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_faculty_evidence" ON public.faculty_questionnaire_evidence;
CREATE POLICY "insert_own_faculty_evidence"
  ON public.faculty_questionnaire_evidence FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_faculty_evidence" ON public.faculty_questionnaire_evidence;
CREATE POLICY "update_own_faculty_evidence"
  ON public.faculty_questionnaire_evidence FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_faculty_evidence" ON public.faculty_questionnaire_evidence;
CREATE POLICY "delete_own_faculty_evidence"
  ON public.faculty_questionnaire_evidence FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-evidence',
  'student-evidence',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "upload_own_student_evidence" ON storage.objects;
CREATE POLICY "upload_own_student_evidence"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'student-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "read_own_student_evidence" ON storage.objects;
CREATE POLICY "read_own_student_evidence"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'student-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "delete_own_student_evidence" ON storage.objects;
CREATE POLICY "delete_own_student_evidence"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'student-evidence'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
