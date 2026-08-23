-- Add follow-up text question for referrer name
INSERT INTO public.questions (question_id, question_text, block, response_type, is_required, mvp_status, score_usage, helper_text, is_quick_match)
VALUES (
  'Q42',
  'Qual o nome de quem te indicou?',
  'Contexto',
  'Texto',
  false,
  'core',
  'none',
  'Se ninguém te indicou, pode pular essa pergunta.',
  true
)
ON CONFLICT (question_id) DO NOTHING;
