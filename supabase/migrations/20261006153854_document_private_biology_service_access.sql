-- Applied to production as Supabase migration 20261006153854.
-- Explicitly document that the private Biology material catalog is server-only.

DROP POLICY IF EXISTS biology_materials_service_only ON public.biology_course_materials;
CREATE POLICY biology_materials_service_only
  ON public.biology_course_materials
  FOR SELECT TO service_role
  USING (true);
