/*
  # Restrict access to student_answers

  1. Problem
     - `anon_select_answers`, `anon_update_answers` and `anon_delete_answers` all used
       an unconditional `true` predicate for the `anon` and `authenticated` roles, so
       any caller holding the public anon key could read, rewrite or delete every
       student's questionnaire answers.

  2. Changes
     - Drop the three unconditional anon policies.
     - Add `public.session_belongs_to_caller(uuid)`, a SECURITY DEFINER helper so the
       INSERT policy can check session ownership without being blocked by RLS on
       `student_sessions`.
     - Replace the anon INSERT policy with one that only lets a caller add answers to a
       session they own (signed in) or to an ownerless session (anonymous visitor).

  3. Security
     - SELECT/UPDATE/DELETE remain available only through the existing owner-scoped
       `auth_*` policies. The app never reads this table, so no feature regresses.
*/

CREATE OR REPLACE FUNCTION public.session_belongs_to_caller(p_session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.student_sessions s
    WHERE s.id = p_session_id
      AND (
        (auth.uid() IS NOT NULL AND s.user_id = auth.uid())
        OR (auth.uid() IS NULL AND s.user_id IS NULL)
      )
  );
$$;

REVOKE ALL ON FUNCTION public.session_belongs_to_caller(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.session_belongs_to_caller(uuid) TO anon, authenticated;

DROP POLICY IF EXISTS "anon_select_answers" ON public.student_answers;
DROP POLICY IF EXISTS "anon_update_answers" ON public.student_answers;
DROP POLICY IF EXISTS "anon_delete_answers" ON public.student_answers;
DROP POLICY IF EXISTS "anon_insert_answers" ON public.student_answers;

CREATE POLICY "insert_answers_for_own_session"
  ON public.student_answers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (public.session_belongs_to_caller(session_id));
