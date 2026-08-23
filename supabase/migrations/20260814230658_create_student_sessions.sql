/*
# Create student session and answer tables

1. New Tables
- `student_sessions`: stores a single questionnaire session (anonymous, no auth).
  - `id` (uuid, primary key)
  - `created_at` (timestamptz, default now)
  - `completed_at` (timestamptz, nullable, set when quiz is finished)
  - `consent_given` (boolean, default false — from Q40)
- `student_answers`: stores individual question answers for a session.
  - `id` (uuid, primary key)
  - `session_id` (uuid, FK to student_sessions, cascade on delete)
  - `question_id` (text, NOT NULL — references questions.question_id logically)
  - `answer_value` (text, NOT NULL — stores the student's answer, normalized to text)
  - `numeric_value` (integer, nullable — for questions that produce a numeric score)
  - `created_at` (timestamptz, default now)

2. Security
- Enable RLS on both tables.
- Allow anon + authenticated full CRUD — this is a single-tenant app with no sign-in.
  The data is intentionally public/shared (anonymous quiz sessions).

3. Important Notes
- These tables do NOT modify or reference any existing reference tables.
- No foreign keys to existing tables to avoid modifying their schema.
- question_id is a logical reference, not a hard FK constraint.
*/

CREATE TABLE IF NOT EXISTS student_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  consent_given boolean DEFAULT false
);

ALTER TABLE student_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_sessions" ON student_sessions;
CREATE POLICY "anon_select_sessions" ON student_sessions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_sessions" ON student_sessions;
CREATE POLICY "anon_insert_sessions" ON student_sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_sessions" ON student_sessions;
CREATE POLICY "anon_update_sessions" ON student_sessions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_sessions" ON student_sessions;
CREATE POLICY "anon_delete_sessions" ON student_sessions FOR DELETE
  TO anon, authenticated USING (true);

CREATE TABLE IF NOT EXISTS student_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES student_sessions(id) ON DELETE CASCADE,
  question_id text NOT NULL,
  answer_value text NOT NULL,
  numeric_value integer,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_student_answers_session_id ON student_answers(session_id);

ALTER TABLE student_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_answers" ON student_answers;
CREATE POLICY "anon_select_answers" ON student_answers FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_answers" ON student_answers;
CREATE POLICY "anon_insert_answers" ON student_answers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_answers" ON student_answers;
CREATE POLICY "anon_update_answers" ON student_answers FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_answers" ON student_answers;
CREATE POLICY "anon_delete_answers" ON student_answers FOR DELETE
  TO anon, authenticated USING (true);
