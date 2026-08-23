-- Add referral question that appears in both quiz modes
INSERT INTO public.questions (question_id, question_text, block, response_type, is_required, mvp_status, score_usage, helper_text, is_quick_match)
VALUES (
  'Q41',
  'Quem indicou o B-School Fit para você?',
  'Contexto',
  'Lista',
  false,
  'core',
  'none',
  'Se ninguém te indicou, é só escolher "Ninguém, encontrei sozinho".',
  true
)
ON CONFLICT (question_id) DO NOTHING;

-- Add referral options to the question_options map (handled in code, not DB)
-- The options will be defined in src/lib/question-options.ts
