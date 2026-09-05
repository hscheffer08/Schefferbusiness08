-- Keep the official vestibular bank subject to the caller's RLS context.
-- All underlying official-exam tables already grant SELECT and have RLS enabled.
alter view public.official_vestibular_question_bank
  set (security_invoker = true);
