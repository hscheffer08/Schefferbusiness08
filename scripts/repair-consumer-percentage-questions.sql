-- Idempotent content repair: approximate percentages require explicit rounding.
-- Only the audited template with a verified B answer is changed.
BEGIN;
WITH candidates AS (
  SELECT id, prompt,
    regexp_match(prompt, '^Uma pesquisa com ([0-9]+) consumidores indica que ([0-9]+)% priorizam preço e ([0-9]+)% priorizam qualidade\. Quantos consumidores priorizam preço\?$') AS parts
  FROM public.exam_practice_questions
  WHERE active = true AND correct_option = 'B'
), checked AS (
  SELECT *, parts[1]::numeric * parts[2]::numeric / 100 AS amount
  FROM candidates WHERE parts IS NOT NULL
)
UPDATE public.exam_practice_questions q
SET prompt = replace(replace(c.prompt,
      'indica que ', 'indica que aproximadamente '),
      'Quantos consumidores priorizam preço?',
      'Aproximadamente quantos consumidores priorizam preço? Arredonde para o inteiro mais próximo.'),
    explanation = format('Calcule %s × %s / 100 = %s. Como os percentuais são aproximados, arredonde para o inteiro mais próximo: %s consumidores.',
      c.parts[1], c.parts[2], replace(trim_scale(c.amount)::text, '.', ','), round(c.amount))
FROM checked c
WHERE q.id = c.id AND q.prompt = c.prompt
  AND c.amount <> round(c.amount)
  AND q.option_b = round(c.amount)::text
RETURNING q.id, q.exam_id;
COMMIT;
