-- Applied to production as Supabase migration 20261006153813.
-- Finalize production hardening after the audited frontend/API deployment is live.

REVOKE ALL ON FUNCTION public.get_admin_dashboard_stats(timestamptz) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_admin_impact_stats(timestamptz) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_admin_session_answers(uuid) FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_admin_sessions() FROM public, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_admin_traffic_stats(timestamptz) FROM public, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_stats(timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_impact_stats(timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_session_answers(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_sessions() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_traffic_stats(timestamptz) TO service_role;

REVOKE ALL ON FUNCTION public.redeem_essay_course_access(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_essay_course_access(text) TO service_role;

UPDATE storage.buckets
SET public = false
WHERE id = 'biology-course-materials';

DROP POLICY IF EXISTS biology_storage_read ON storage.objects;
DROP POLICY IF EXISTS biology_materials_read ON public.biology_course_materials;
REVOKE SELECT ON TABLE public.biology_course_materials FROM anon, authenticated;
