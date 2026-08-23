-- Allow admins to read all student sessions, answers, and match history
-- so they can review individual responses in the admin panel.
-- Only the SELECT verb is granted; writes remain owner-only.

CREATE POLICY "admin_read_student_sessions"
  ON student_sessions FOR SELECT
  TO authenticated
  USING (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text);

CREATE POLICY "admin_read_student_answers"
  ON student_answers FOR SELECT
  TO authenticated
  USING (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text);

CREATE POLICY "admin_read_match_history"
  ON match_history FOR SELECT
  TO authenticated
  USING (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text);

-- Admin also needs to read user email/profile to attribute sessions.
CREATE POLICY "admin_read_user_profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) = 'admin'::text);
