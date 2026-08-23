/*
# Add user authentication support: profiles + match history

1. New Tables
- `user_profiles`: stores display name for each user.
  - `id` (uuid, PK, FK to auth.users, cascade on delete)
  - `display_name` (text, nullable — user can set later)
  - `created_at` (timestamptz, default now)
- `match_history`: stores a snapshot of each completed quiz result per user.
  - `id` (uuid, PK)
  - `user_id` (uuid, NOT NULL, DEFAULT auth.uid(), FK to auth.users, cascade on delete)
  - `session_id` (uuid, nullable, FK to student_sessions, cascade on delete)
  - `top_university_id` (text, NOT NULL — university_id of #1 match)
  - `top_university_name` (text, NOT NULL — denormalized for display)
  - `top_score` (integer, NOT NULL — 0-100 overall match score)
  - `all_scores` (jsonb, NOT NULL — full ranking snapshot: [{university_id, name, score}])
  - `created_at` (timestamptz, default now)

2. Modified Tables
- `student_sessions`: added `user_id` column (uuid, nullable, DEFAULT auth.uid(),
  FK to auth.users ON DELETE SET NULL). Nullable so existing anonymous sessions
  are not broken. New authenticated sessions will have user_id populated
  automatically by the DEFAULT auth.uid() when the user is logged in.

3. Security
- `user_profiles`: RLS enabled, owner-scoped CRUD (auth.uid() = id).
- `match_history`: RLS enabled, owner-scoped CRUD (auth.uid() = user_id).
- `student_sessions`: existing anon policies kept. Added authenticated
  owner-scoped SELECT/INSERT/UPDATE/DELETE policies (auth.uid() = user_id)
  so logged-in users see only their own sessions.
- `student_answers`: existing anon policies kept. Added authenticated
  owner-scoped policies that check ownership through the parent session:
  EXISTS (SELECT 1 FROM student_sessions WHERE id = session_id AND user_id = auth.uid()).

4. Important Notes
- No reference tables are modified or deleted.
- student_sessions.user_id is nullable so old anonymous data is preserved.
- match_history.all_scores is a JSONB snapshot so the ranking can be
  displayed later even if university data changes.
- user_profiles.id = auth.users.id (1:1 relationship).
*/

-- 1. user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
CREATE POLICY "select_own_profile" ON user_profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
CREATE POLICY "insert_own_profile" ON user_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
CREATE POLICY "update_own_profile" ON user_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON user_profiles;
CREATE POLICY "delete_own_profile" ON user_profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- 2. Add user_id to student_sessions (nullable for backward compat)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'student_sessions' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE student_sessions ADD COLUMN user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add authenticated owner-scoped policies for student_sessions
DROP POLICY IF EXISTS "auth_select_own_sessions" ON student_sessions;
CREATE POLICY "auth_select_own_sessions" ON student_sessions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "auth_insert_own_sessions" ON student_sessions;
CREATE POLICY "auth_insert_own_sessions" ON student_sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "auth_update_own_sessions" ON student_sessions;
CREATE POLICY "auth_update_own_sessions" ON student_sessions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "auth_delete_own_sessions" ON student_sessions;
CREATE POLICY "auth_delete_own_sessions" ON student_sessions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Add authenticated owner-scoped policies for student_answers (through parent session)
DROP POLICY IF EXISTS "auth_select_own_answers" ON student_answers;
CREATE POLICY "auth_select_own_answers" ON student_answers FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM student_sessions WHERE student_sessions.id = student_answers.session_id AND student_sessions.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "auth_insert_own_answers" ON student_answers;
CREATE POLICY "auth_insert_own_answers" ON student_answers FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM student_sessions WHERE student_sessions.id = student_answers.session_id AND student_sessions.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "auth_update_own_answers" ON student_answers;
CREATE POLICY "auth_update_own_answers" ON student_answers FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM student_sessions WHERE student_sessions.id = student_answers.session_id AND student_sessions.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM student_sessions WHERE student_sessions.id = student_answers.session_id AND student_sessions.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "auth_delete_own_answers" ON student_answers;
CREATE POLICY "auth_delete_own_answers" ON student_answers FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM student_sessions WHERE student_sessions.id = student_answers.session_id AND student_sessions.user_id = auth.uid())
  );

-- 3. match_history table
CREATE TABLE IF NOT EXISTS match_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES student_sessions(id) ON DELETE CASCADE,
  top_university_id text NOT NULL,
  top_university_name text NOT NULL,
  top_score integer NOT NULL,
  all_scores jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_match_history_user_id ON match_history(user_id);
CREATE INDEX IF NOT EXISTS idx_match_history_created_at ON match_history(created_at DESC);

ALTER TABLE match_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_match_history" ON match_history;
CREATE POLICY "select_own_match_history" ON match_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_match_history" ON match_history;
CREATE POLICY "insert_own_match_history" ON match_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_match_history" ON match_history;
CREATE POLICY "update_own_match_history" ON match_history FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_match_history" ON match_history;
CREATE POLICY "delete_own_match_history" ON match_history FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
