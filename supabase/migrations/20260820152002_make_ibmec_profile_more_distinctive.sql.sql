/*
# Make Ibmec profile more distinctive to reduce over-matching

## Problem
Ibmec's dimension weights were too "moderate" (mostly 74–90), sitting close to the
midpoint. Because alignment = 100 - |student - university|, a university with
weights near the center matches almost any student profile. This made Ibmec
appear as top match far too often.

## Fix
Push Ibmec's weights further from the midpoint to make the profile more polarized:
- STRENGTHS (raise toward 90–100): corporate/finance, practical learning,
  networking, market employability, quantitative reasoning, teamwork.
- WEAKNESSES (lower toward 55–68): academic rigor, theory, international
  mobility, entrepreneurship, purpose/impact, extracurricular depth, portfolio.

This makes Ibmec win only when the student genuinely has a corporate/finance/
practical profile, and lose clearly when the student is academic, international,
or entrepreneurial.

## Changes
- Updates ~30 rows in university_dimension_weights for university_id = 'IBMEC'.
- No schema changes, no new tables, no policy changes.
- Only data updates — fully reversible.
*/

-- Academic pillar: lower (Ibmec is not academically rigorous)
UPDATE university_dimension_weights SET weight = 68 WHERE university_id = 'IBMEC' AND dimension_id = 'theory_comfort';
UPDATE university_dimension_weights SET weight = 70 WHERE university_id = 'IBMEC' AND dimension_id = 'rigor_depth';
UPDATE university_dimension_weights SET weight = 72 WHERE university_id = 'IBMEC' AND dimension_id = 'academic_perf';
UPDATE university_dimension_weights SET weight = 74 WHERE university_id = 'IBMEC' AND dimension_id = 'analytical_data';
UPDATE university_dimension_weights SET weight = 72 WHERE university_id = 'IBMEC' AND dimension_id = 'writing_argument';
UPDATE university_dimension_weights SET weight = 60 WHERE university_id = 'IBMEC' AND dimension_id = 'english_level';

-- Behavioral pillar: keep moderate but polarize
UPDATE university_dimension_weights SET weight = 72 WHERE university_id = 'IBMEC' AND dimension_id = 'autonomy_selfdirection';
UPDATE university_dimension_weights SET weight = 94 WHERE university_id = 'IBMEC' AND dimension_id = 'teamwork_collab';
UPDATE university_dimension_weights SET weight = 82 WHERE university_id = 'IBMEC' AND dimension_id = 'oral_pitch';
UPDATE university_dimension_weights SET weight = 68 WHERE university_id = 'IBMEC' AND dimension_id = 'curiosity_learning';
UPDATE university_dimension_weights SET weight = 70 WHERE university_id = 'IBMEC' AND dimension_id = 'decision_uncertainty';
UPDATE university_dimension_weights SET weight = 74 WHERE university_id = 'IBMEC' AND dimension_id = 'time_discipline';
UPDATE university_dimension_weights SET weight = 86 WHERE university_id = 'IBMEC' AND dimension_id = 'conflict_handling';
UPDATE university_dimension_weights SET weight = 76 WHERE university_id = 'IBMEC' AND dimension_id = 'critical_thinking';
UPDATE university_dimension_weights SET weight = 70 WHERE university_id = 'IBMEC' AND dimension_id = 'resilience_pressure';
UPDATE university_dimension_weights SET weight = 88 WHERE university_id = 'IBMEC' AND dimension_id = 'problem_solving';

-- CultureGoals pillar: strengthen corporate/finance, weaken international/entrepreneurial
UPDATE university_dimension_weights SET weight = 64 WHERE university_id = 'IBMEC' AND dimension_id = 'experimental_learning';
UPDATE university_dimension_weights SET weight = 98 WHERE university_id = 'IBMEC' AND dimension_id = 'practical_learning';
UPDATE university_dimension_weights SET weight = 82 WHERE university_id = 'IBMEC' AND dimension_id = 'student_life_traditional';
UPDATE university_dimension_weights SET weight = 98 WHERE university_id = 'IBMEC' AND dimension_id = 'corporate_management';
UPDATE university_dimension_weights SET weight = 62 WHERE university_id = 'IBMEC' AND dimension_id = 'entrepreneurial_intent';
UPDATE university_dimension_weights SET weight = 55 WHERE university_id = 'IBMEC' AND dimension_id = 'mobility_willingness';
UPDATE university_dimension_weights SET weight = 100 WHERE university_id = 'IBMEC' AND dimension_id = 'market_employability';
UPDATE university_dimension_weights SET weight = 55 WHERE university_id = 'IBMEC' AND dimension_id = 'startup_founder_fit';
UPDATE university_dimension_weights SET weight = 98 WHERE university_id = 'IBMEC' AND dimension_id = 'finance_markets';
UPDATE university_dimension_weights SET weight = 62 WHERE university_id = 'IBMEC' AND dimension_id = 'global_mindset';
UPDATE university_dimension_weights SET weight = 55 WHERE university_id = 'IBMEC' AND dimension_id = 'purpose_impact';
UPDATE university_dimension_weights SET weight = 84 WHERE university_id = 'IBMEC' AND dimension_id = 'brand_prestige';
UPDATE university_dimension_weights SET weight = 82 WHERE university_id = 'IBMEC' AND dimension_id = 'tech_ai_orientation';
UPDATE university_dimension_weights SET weight = 98 WHERE university_id = 'IBMEC' AND dimension_id = 'networking_value';

-- Evidence pillar: lower academic evidence, keep professional
UPDATE university_dimension_weights SET weight = 66 WHERE university_id = 'IBMEC' AND dimension_id = 'achievement_selectivity';
UPDATE university_dimension_weights SET weight = 80 WHERE university_id = 'IBMEC' AND dimension_id = 'leadership_evidence';
UPDATE university_dimension_weights SET weight = 78 WHERE university_id = 'IBMEC' AND dimension_id = 'project_execution';
UPDATE university_dimension_weights SET weight = 92 WHERE university_id = 'IBMEC' AND dimension_id = 'work_experience';
UPDATE university_dimension_weights SET weight = 58 WHERE university_id = 'IBMEC' AND dimension_id = 'extracurricular_depth';
UPDATE university_dimension_weights SET weight = 78 WHERE university_id = 'IBMEC' AND dimension_id = 'initiative_history';
UPDATE university_dimension_weights SET weight = 60 WHERE university_id = 'IBMEC' AND dimension_id = 'portfolio_depth';
UPDATE university_dimension_weights SET weight = 66 WHERE university_id = 'IBMEC' AND dimension_id = 'entrepreneurial_proof';

-- Cultural axes: make more extreme
UPDATE university_axis_targets SET target = 90 WHERE university_id = 'IBMEC' AND axis_id = 'axis_01_pratica_vs_teoria';
UPDATE university_axis_targets SET target = 30 WHERE university_id = 'IBMEC' AND axis_id = 'axis_02_corporativo_vs_founder';
UPDATE university_axis_targets SET target = 50 WHERE university_id = 'IBMEC' AND axis_id = 'axis_03_local_vs_global';
UPDATE university_axis_targets SET target = 50 WHERE university_id = 'IBMEC' AND axis_id = 'axis_04_estrutura_vs_autonomia';
UPDATE university_axis_targets SET target = 90 WHERE university_id = 'IBMEC' AND axis_id = 'axis_05_individual_vs_colaborativo';
UPDATE university_axis_targets SET target = 60 WHERE university_id = 'IBMEC' AND axis_id = 'axis_06_tradicional_vs_experimental';
UPDATE university_axis_targets SET target = 60 WHERE university_id = 'IBMEC' AND axis_id = 'axis_07_prova_vs_holistico';
UPDATE university_axis_targets SET target = 30 WHERE university_id = 'IBMEC' AND axis_id = 'axis_08_tecnico_vs_proposito';
UPDATE university_axis_targets SET target = 72 WHERE university_id = 'IBMEC' AND axis_id = 'axis_09_baixa_exposicao_vs_pitch';
UPDATE university_axis_targets SET target = 72 WHERE university_id = 'IBMEC' AND axis_id = 'axis_10_baixa_ia_vs_ia_tech';
UPDATE university_axis_targets SET target = 40 WHERE university_id = 'IBMEC' AND axis_id = 'axis_11_risco_baixo_vs_risco_alto';
UPDATE university_axis_targets SET target = 100 WHERE university_id = 'IBMEC' AND axis_id = 'axis_12_financas_baixa_vs_alta';
