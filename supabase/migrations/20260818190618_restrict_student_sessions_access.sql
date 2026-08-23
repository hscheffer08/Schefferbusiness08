/*
  # Restrict access to student_sessions

  1. Problem
     - `anon_select_sessions`, `anon_update_sessions` and `anon_delete_sessions` used an
       unconditional `true` predicate for `anon` and `authenticated`, so any caller with
       the public anon key could list every session (exposing the `user_id` that links a
       real account to its answers), tamper with `consent_given`, or delete every row.

  2. Changes
     - Drop the three unconditional anon policies.
     - Replace the anon INSERT policy with one that requires anonymous callers to leave
       the owner column null and signed-in callers to claim only their own id.

  3. Security
     - Reads, updates and deletes now go only through the owner-scoped `auth_*` policies.
     - Anonymous visitors can still record a session; the client supplies the row id
       itself so no read-back permission is needed.
*/

DROP POLICY IF EXISTS "anon_select_sessions" ON public.student_sessions;
DROP POLICY IF EXISTS "anon_update_sessions" ON public.student_sessions;
DROP POLICY IF EXISTS "anon_delete_sessions" ON public.student_sessions;
DROP POLICY IF EXISTS "anon_insert_sessions" ON public.student_sessions;

CREATE POLICY "insert_own_or_anonymous_session"
  ON public.student_sessions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (auth.uid() IS NULL AND user_id IS NULL)
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );
