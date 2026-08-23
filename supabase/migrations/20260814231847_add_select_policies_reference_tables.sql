/*
# Add SELECT policies to all reference tables

1. Problem
- All reference tables have RLS enabled but NO policies.
- With RLS enabled and no policies, the default is deny-all: the anon-key
  frontend gets zero rows from every table, so the app loads empty data
  and the quiz spinner spins forever.

2. Fix
- Add permissive SELECT policies (TO anon, authenticated) to every
  reference table so the frontend can read the data.
- These are read-only policies — no INSERT/UPDATE/DELETE policies are
  added, so the reference data stays protected from writes.

3. Tables affected (read-only SELECT policies added):
- universities
- dimensions
- cultural_axes
- questions
- text_rubrics
- sources
- pillar_weights
- university_dimension_weights
- university_axis_targets
- question_dimensions
- official_evidence
- evidence_dimensions
*/

-- universities
DROP POLICY IF EXISTS "anon_select_universities" ON universities;
CREATE POLICY "anon_select_universities" ON universities FOR SELECT
  TO anon, authenticated USING (true);

-- dimensions
DROP POLICY IF EXISTS "anon_select_dimensions" ON dimensions;
CREATE POLICY "anon_select_dimensions" ON dimensions FOR SELECT
  TO anon, authenticated USING (true);

-- cultural_axes
DROP POLICY IF EXISTS "anon_select_cultural_axes" ON cultural_axes;
CREATE POLICY "anon_select_cultural_axes" ON cultural_axes FOR SELECT
  TO anon, authenticated USING (true);

-- questions
DROP POLICY IF EXISTS "anon_select_questions" ON questions;
CREATE POLICY "anon_select_questions" ON questions FOR SELECT
  TO anon, authenticated USING (true);

-- text_rubrics
DROP POLICY IF EXISTS "anon_select_text_rubrics" ON text_rubrics;
CREATE POLICY "anon_select_text_rubrics" ON text_rubrics FOR SELECT
  TO anon, authenticated USING (true);

-- sources
DROP POLICY IF EXISTS "anon_select_sources" ON sources;
CREATE POLICY "anon_select_sources" ON sources FOR SELECT
  TO anon, authenticated USING (true);

-- pillar_weights
DROP POLICY IF EXISTS "anon_select_pillar_weights" ON pillar_weights;
CREATE POLICY "anon_select_pillar_weights" ON pillar_weights FOR SELECT
  TO anon, authenticated USING (true);

-- university_dimension_weights
DROP POLICY IF EXISTS "anon_select_university_dimension_weights" ON university_dimension_weights;
CREATE POLICY "anon_select_university_dimension_weights" ON university_dimension_weights FOR SELECT
  TO anon, authenticated USING (true);

-- university_axis_targets
DROP POLICY IF EXISTS "anon_select_university_axis_targets" ON university_axis_targets;
CREATE POLICY "anon_select_university_axis_targets" ON university_axis_targets FOR SELECT
  TO anon, authenticated USING (true);

-- question_dimensions
DROP POLICY IF EXISTS "anon_select_question_dimensions" ON question_dimensions;
CREATE POLICY "anon_select_question_dimensions" ON question_dimensions FOR SELECT
  TO anon, authenticated USING (true);

-- official_evidence
DROP POLICY IF EXISTS "anon_select_official_evidence" ON official_evidence;
CREATE POLICY "anon_select_official_evidence" ON official_evidence FOR SELECT
  TO anon, authenticated USING (true);

-- evidence_dimensions
DROP POLICY IF EXISTS "anon_select_evidence_dimensions" ON evidence_dimensions;
CREATE POLICY "anon_select_evidence_dimensions" ON evidence_dimensions FOR SELECT
  TO anon, authenticated USING (true);
