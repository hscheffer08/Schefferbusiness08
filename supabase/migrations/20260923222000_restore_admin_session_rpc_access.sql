-- Restore the admin response RPCs for authenticated callers.
-- The functions themselves enforce app_metadata.role = 'admin', so ordinary
-- authenticated users still receive an authorization error.

REVOKE EXECUTE ON FUNCTION public.get_admin_sessions() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_session_answers(uuid) FROM anon;

GRANT EXECUTE ON FUNCTION public.get_admin_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_session_answers(uuid) TO authenticated;
