/*
# Admin response viewer functions

1. New Functions
- `get_admin_sessions()` — returns all student_sessions joined with auth.users
  email and user_profiles display_name, so the admin panel can list who answered.
- `get_admin_session_answers(p_session_id uuid)` — returns all student_answers
  for a given session, joined with questions.question_text, so the admin can
  read individual responses.

2. Security
- Both functions are SECURITY DEFINER so they can read auth.users (which RLS
  blocks for the anon/authenticated roles).
- Both functions verify the caller's app_metadata role is 'admin' and raise
  an exception otherwise, so non-admins get nothing.
- The functions are granted EXECUTE to authenticated only.
- search_path set to 'public' to prevent search_path injection.
*/

CREATE OR REPLACE FUNCTION public.get_admin_sessions()
RETURNS TABLE (
  session_id uuid,
  user_id uuid,
  email text,
  display_name text,
  completed_at timestamptz,
  consent_given boolean,
  answer_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) <> 'admin' THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.user_id,
    u.email,
    p.display_name,
    s.completed_at,
    s.consent_given,
    (SELECT count(*) FROM student_answers a WHERE a.session_id = s.id)
  FROM student_sessions s
  LEFT JOIN auth.users u ON u.id = s.user_id
  LEFT JOIN user_profiles p ON p.id = s.user_id
  ORDER BY s.completed_at DESC NULLS LAST;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_session_answers(p_session_id uuid)
RETURNS TABLE (
  question_id text,
  question_text text,
  answer_value text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) <> 'admin' THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  RETURN QUERY
  SELECT
    a.question_id,
    q.question_text,
    a.answer_value,
    a.created_at
  FROM student_answers a
  LEFT JOIN questions q ON q.question_id = a.question_id
  WHERE a.session_id = p_session_id
  ORDER BY a.question_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_admin_sessions() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_admin_session_answers(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_session_answers(uuid) TO authenticated;
