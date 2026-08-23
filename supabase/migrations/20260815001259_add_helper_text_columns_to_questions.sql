/*
# Add helper text and scale label columns to questions table

## Purpose
Add columns to store improved question wording, helper/explanation text, and
custom scale labels for slider questions — without modifying existing data or logic.

## Changes to existing table `questions`
- `helper_text` (text, nullable) — short explanation shown below the question
- `scale_min_label` (text, nullable) — label for the left end of the slider (0)
- `scale_mid_label` (text, nullable) — label for the middle of the slider (50)
- `scale_max_label` (text, nullable) — label for the right end of the slider (100)

## Important Notes
1. All new columns are nullable — existing rows and queries continue to work unchanged.
2. The original `question_text` column will be updated with clearer wording in a separate migration.
3. No existing columns are removed or renamed.
4. No RLS policy changes needed — the questions table is already readable by anon/authenticated.
*/

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS helper_text text,
  ADD COLUMN IF NOT EXISTS scale_min_label text,
  ADD COLUMN IF NOT EXISTS scale_mid_label text,
  ADD COLUMN IF NOT EXISTS scale_max_label text;
