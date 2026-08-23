-- Fix: auth.users.email is varchar(255) but the function return type expects text,
-- causing a "structure of query does not match function result type" error.
-- Cast email to text explicitly so the RETURN QUERY matches the declared return type.
CREATE OR REPLACE FUNCTION public.get_admin_sessions()
RETURNS TABLE(
  session_id uuid,
  user_id uuid,
  email text,
  display_name text,
  completed_at timestamp with time zone,
  consent_given boolean,
  answer_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) <> 'admin' THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.user_id,
    u.email::text,
    p.display_name,
    s.completed_at,
    s.consent_given,
    (SELECT count(*) FROM student_answers a WHERE a.session_id = s.id)
  FROM student_sessions s
  LEFT JOIN auth.users u ON u.id = s.user_id
  LEFT JOIN user_profiles p ON p.id = s.user_id
  ORDER BY s.completed_at DESC NULLS LAST;
END;
$function$;
