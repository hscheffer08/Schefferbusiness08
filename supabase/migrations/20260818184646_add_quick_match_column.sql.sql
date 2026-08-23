/*
# Add is_quick_match column to questions table

## Purpose
Marks which questions belong to the "Match Rápido" (quick match) track.
The quick match track uses ~15 high-impact questions that cover all key dimensions.
The full "Perfil Verificado" track uses all 40 questions.

## Changes
- Adds `is_quick_match` boolean column (default false) to `questions` table.
- Marks 15 questions as quick_match=true: Q01, Q02, Q03, Q04, Q06, Q20, Q21, Q25, Q26, Q27, Q29, Q30, Q31, Q33, Q34

## Selection Criteria
These 15 questions were chosen because they:
1. Cover all major pillars (Acadêmico, Comportamental, Cultura, Evidência)
2. Map to the most impactful dimensions for the matching algorithm
3. Are fast to answer (sliders and choice questions, no long text)
4. Together cover ~25 of the 39 dimensions
5. Distinguish FEA-USP (quant/finance/autonomy) from ESPM (creative/marketing/practical)

## Security
No security changes — this is a schema-only migration on an existing table.
*/

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS is_quick_match boolean NOT NULL DEFAULT false;

UPDATE questions SET is_quick_match = true
WHERE question_id IN (
  'Q01', -- Ano/série (Cadastro)
  'Q02', -- Média geral (Acadêmico → academic_perf)
  'Q03', -- Matérias que vai melhor (Acadêmico → math_quant, academic_perf)
  'Q04', -- Média em Matemática (Acadêmico → math_quant)
  'Q06', -- Nível de inglês (Acadêmico → english_level)
  'Q20', -- Estilo de aprendizagem: teoria/cases/projetos (Cultura → theory_comfort, practical_learning)
  'Q21', -- Autonomia (Comportamental → autonomy_selfdirection)
  'Q25', -- Liderança vs colaboração (Comportamental → leadership_evidence, teamwork_collab)
  'Q26', -- Importância de networking (Cultura → networking_value)
  'Q27', -- Importância de internacionalização (Cultura → global_mindset)
  'Q29', -- Empreendedorismo (Cultura → entrepreneurial_intent)
  'Q30', -- Finanças/mercado (Cultura → finance_markets)
  'Q31', -- Tecnologia/IA (Cultura → tech_ai_orientation)
  'Q33', -- Fatores mais importantes (Cultura → brand_prestige, networking, practical, market_employability)
  'Q34'  -- Objetivo profissional principal (Cultura → career direction)
);
