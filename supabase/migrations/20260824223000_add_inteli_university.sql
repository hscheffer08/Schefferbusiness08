-- Add Inteli (Instituto de Tecnologia e Liderança) as a full member of the matching database.
-- Uses the same university, dimension, cultural-axis, evidence and source structure as existing institutions.
-- Profile focuses on ADM Tech (Administração), the business-oriented undergraduate program.

-- ============================================================
-- University profile
-- ============================================================
INSERT INTO universities (
  university_id, name, course, location, format,
  positioning, program_differentiators, admissions, values,
  high_fit_student, low_fit_student, match_rationale, primary_source_url
) VALUES (
  'INTELI',
  'Inteli',
  'ADM Tech (Administração)',
  'São Paulo, SP',
  'Presencial — integral nos 2 primeiros anos e parcial nos 3º e 4º anos',
  'Instituição de ensino superior orientada à interseção entre tecnologia, negócios e liderança, com formação prática baseada em projetos e forte proximidade com empresas e desafios reais',
  'Metodologia Project-Based Learning (PBL); projetos reais em equipe; integração entre administração, tecnologia, dados, inovação e liderança; ambiente de alta intensidade prática e cultura de construção, experimentação e resolução de problemas',
  'Processo seletivo holístico em três eixos: Prova, Perfil e Projeto. O Eixo Perfil avalia redações e histórico extracurricular; o Eixo Projeto avalia raciocínio, resolução de desafios e interação em equipe. ENEM, SAT, ACT, IB e olimpíadas elegíveis podem substituir o Eixo Prova conforme edital vigente',
  'Tecnologia, protagonismo, colaboração, inovação, liderança, pensamento crítico, execução, empreendedorismo, aprendizagem prática e impacto',
  'Aluno curioso, proativo e colaborativo, interessado em negócios e tecnologia, confortável com projetos em equipe, apresentações, problemas abertos e aprendizagem prática; valoriza inovação, empreendedorismo, liderança e contato com empresas',
  'Aluno que busca uma graduação predominantemente teórica e tradicional, prefere avaliações quase exclusivamente por provas individuais, evita trabalho em equipe e apresentações ou tem pouco interesse por tecnologia aplicada a negócios',
  'O Inteli apresenta aderência especialmente alta para perfis que combinam business, tecnologia, projetos, liderança, pensamento analítico, autonomia e colaboração. A metodologia PBL e o processo seletivo holístico tornam evidências de execução, comunicação, pensamento crítico e trabalho em equipe particularmente relevantes para o fit',
  'https://www.inteli.edu.br/'
)
ON CONFLICT (university_id) DO UPDATE SET
  name = EXCLUDED.name,
  course = EXCLUDED.course,
  location = EXCLUDED.location,
  format = EXCLUDED.format,
  positioning = EXCLUDED.positioning,
  program_differentiators = EXCLUDED.program_differentiators,
  admissions = EXCLUDED.admissions,
  values = EXCLUDED.values,
  high_fit_student = EXCLUDED.high_fit_student,
  low_fit_student = EXCLUDED.low_fit_student,
  match_rationale = EXCLUDED.match_rationale,
  primary_source_url = EXCLUDED.primary_source_url;

-- ============================================================
-- Dimension weights — Inteli ADM Tech
-- 0-100 expresses how strongly each trait is characteristic/relevant to fit.
-- ============================================================
INSERT INTO university_dimension_weights (university_id, dimension_id, weight) VALUES
  ('INTELI', 'academic_perf', 86),
  ('INTELI', 'achievement_selectivity', 91),
  ('INTELI', 'analytical_data', 96),
  ('INTELI', 'autonomy_selfdirection', 94),
  ('INTELI', 'brand_prestige', 87),
  ('INTELI', 'conflict_handling', 92),
  ('INTELI', 'corporate_management', 91),
  ('INTELI', 'critical_thinking', 97),
  ('INTELI', 'curiosity_learning', 98),
  ('INTELI', 'decision_uncertainty', 96),
  ('INTELI', 'english_level', 88),
  ('INTELI', 'entrepreneurial_intent', 97),
  ('INTELI', 'entrepreneurial_proof', 95),
  ('INTELI', 'experimental_learning', 100),
  ('INTELI', 'extracurricular_depth', 94),
  ('INTELI', 'finance_markets', 78),
  ('INTELI', 'global_mindset', 90),
  ('INTELI', 'initiative_history', 98),
  ('INTELI', 'leadership_evidence', 97),
  ('INTELI', 'market_employability', 94),
  ('INTELI', 'math_quant', 92),
  ('INTELI', 'mobility_willingness', 84),
  ('INTELI', 'networking_value', 94),
  ('INTELI', 'oral_pitch', 97),
  ('INTELI', 'portfolio_depth', 98),
  ('INTELI', 'practical_learning', 100),
  ('INTELI', 'problem_solving', 100),
  ('INTELI', 'project_execution', 100),
  ('INTELI', 'purpose_impact', 92),
  ('INTELI', 'resilience_pressure', 94),
  ('INTELI', 'rigor_depth', 90),
  ('INTELI', 'startup_founder_fit', 98),
  ('INTELI', 'student_life_traditional', 60),
  ('INTELI', 'teamwork_collab', 100),
  ('INTELI', 'tech_ai_orientation', 100),
  ('INTELI', 'theory_comfort', 72),
  ('INTELI', 'time_discipline', 96),
  ('INTELI', 'work_experience', 90),
  ('INTELI', 'writing_argument', 96)
ON CONFLICT (university_id, dimension_id) DO UPDATE SET weight = EXCLUDED.weight;

-- ============================================================
-- Cultural axis targets — Inteli ADM Tech
-- ============================================================
INSERT INTO university_axis_targets (university_id, axis_id, target) VALUES
  ('INTELI', 'axis_01_pratica_vs_teoria', 100),
  ('INTELI', 'axis_02_corporativo_vs_founder', 82),
  ('INTELI', 'axis_03_local_vs_global', 88),
  ('INTELI', 'axis_04_estrutura_vs_autonomia', 88),
  ('INTELI', 'axis_05_individual_vs_colaborativo', 100),
  ('INTELI', 'axis_06_tradicional_vs_experimental', 100),
  ('INTELI', 'axis_07_prova_vs_holistico', 96),
  ('INTELI', 'axis_08_tecnico_vs_proposito', 72),
  ('INTELI', 'axis_09_baixa_exposicao_vs_pitch', 98),
  ('INTELI', 'axis_10_baixa_ia_vs_ia_tech', 100),
  ('INTELI', 'axis_11_risco_baixo_vs_risco_alto', 88),
  ('INTELI', 'axis_12_financas_baixa_vs_alta', 72)
ON CONFLICT (university_id, axis_id) DO UPDATE SET target = EXCLUDED.target;

-- ============================================================
-- Official evidence
-- ============================================================
INSERT INTO official_evidence (
  evidence_id, university_id, evidence_name, evidence_type, summary, source_url
) VALUES
  (
    'evidence_inteli_001', 'INTELI', 'ADM Tech — Administração', 'Direto institucional',
    'O processo seletivo de Graduação 2026 inclui ADM Tech (Administração), curso presencial com 80 vagas. Os dois primeiros anos são integrais e o 3º e 4º anos passam a período parcial, conforme organização acadêmica da instituição.',
    'https://www.inteli.edu.br/wp-content/uploads/2025/08/Edital-Processo-Seletivo-Inteli_-Graduacao-2026_OK.pdf'
  ),
  (
    'evidence_inteli_002', 'INTELI', 'Processo seletivo em três eixos', 'Direto do edital',
    'A seleção regular é estruturada nos Eixos Prova, Perfil e Projeto. Candidatos aprovados no Eixo Prova avançam para Perfil e Projeto, tornando a avaliação mais ampla do que uma prova acadêmica isolada.',
    'https://www.inteli.edu.br/wp-content/uploads/2025/08/Edital-Processo-Seletivo-Inteli_-Graduacao-2026_OK.pdf'
  ),
  (
    'evidence_inteli_003', 'INTELI', 'Eixo Perfil — redações e extracurricular', 'Direto do edital',
    'O Eixo Perfil avalia duas redações e histórico extracurricular. A rubrica considera argumentação, capacidade analítica e pensamento crítico, além de atividades extracurriculares, honras e méritos.',
    'https://www.inteli.edu.br/wp-content/uploads/2025/08/Edital-Processo-Seletivo-Inteli_-Graduacao-2026_OK.pdf'
  ),
  (
    'evidence_inteli_004', 'INTELI', 'Eixo Projeto — raciocínio e equipe', 'Direto do edital',
    'O Eixo Projeto avalia como o candidato desenvolve raciocínio, resolve desafios e interage com a equipe como membro de um time.',
    'https://www.inteli.edu.br/wp-content/uploads/2025/08/Edital-Processo-Seletivo-Inteli_-Graduacao-2026_OK.pdf'
  ),
  (
    'evidence_inteli_005', 'INTELI', 'Substituição do Eixo Prova', 'Direto do edital',
    'O edital prevê possibilidade de uso de ENEM, SAT, ACT, IB ou olimpíadas de Matemática elegíveis em substituição ao Eixo Prova, sujeito aos critérios e equivalências da edição vigente. Perfil e Projeto continuam obrigatórios para candidatos regulares.',
    'https://www.inteli.edu.br/wp-content/uploads/2025/08/Edital-Processo-Seletivo-Inteli_-Graduacao-2026_OK.pdf'
  ),
  (
    'evidence_inteli_006', 'INTELI', 'Modelo de ensino baseado em projetos', 'Direto institucional',
    'O modelo educacional do Inteli é baseado em projetos e metodologias ativas, com integração entre competências de computação, negócios e liderança e desenvolvimento de projetos reais com parceiros de mercado.',
    'https://www.inteli.edu.br/'
  )
ON CONFLICT (evidence_id) DO UPDATE SET
  university_id = EXCLUDED.university_id,
  evidence_name = EXCLUDED.evidence_name,
  evidence_type = EXCLUDED.evidence_type,
  summary = EXCLUDED.summary,
  source_url = EXCLUDED.source_url;

INSERT INTO evidence_dimensions (evidence_id, dimension_id) VALUES
  ('evidence_inteli_001', 'tech_ai_orientation'),
  ('evidence_inteli_001', 'corporate_management'),
  ('evidence_inteli_002', 'achievement_selectivity'),
  ('evidence_inteli_002', 'academic_perf'),
  ('evidence_inteli_003', 'writing_argument'),
  ('evidence_inteli_003', 'critical_thinking'),
  ('evidence_inteli_003', 'extracurricular_depth'),
  ('evidence_inteli_004', 'problem_solving'),
  ('evidence_inteli_004', 'teamwork_collab'),
  ('evidence_inteli_004', 'project_execution'),
  ('evidence_inteli_004', 'conflict_handling'),
  ('evidence_inteli_005', 'academic_perf'),
  ('evidence_inteli_005', 'math_quant'),
  ('evidence_inteli_006', 'practical_learning'),
  ('evidence_inteli_006', 'experimental_learning'),
  ('evidence_inteli_006', 'project_execution'),
  ('evidence_inteli_006', 'leadership_evidence'),
  ('evidence_inteli_006', 'tech_ai_orientation')
ON CONFLICT DO NOTHING;

-- ============================================================
-- Sources
-- ============================================================
INSERT INTO sources (source_id, university_id, source_name, url, usage_note) VALUES
  (
    'source_inteli_001', 'INTELI', 'Site institucional Inteli',
    'https://www.inteli.edu.br/',
    'Proposta institucional, metodologia, graduação, tecnologia, negócios, liderança e projetos.'
  ),
  (
    'source_inteli_002', 'INTELI', 'Edital Processo Seletivo Inteli — Graduação 2026',
    'https://www.inteli.edu.br/wp-content/uploads/2025/08/Edital-Processo-Seletivo-Inteli_-Graduacao-2026_OK.pdf',
    'Cursos, vagas, formato, etapas de seleção, Eixos Prova/Perfil/Projeto e exames substitutivos.'
  ),
  (
    'source_inteli_003', 'INTELI', 'Página do Processo Seletivo 2027',
    'https://web.inteli.edu.br/processo-seletivo-2027',
    'Página institucional vigente para acompanhamento do próximo processo seletivo.'
  )
ON CONFLICT (source_id) DO UPDATE SET
  university_id = EXCLUDED.university_id,
  source_name = EXCLUDED.source_name,
  url = EXCLUDED.url,
  usage_note = EXCLUDED.usage_note;

-- If the optional quick_match column exists, Inteli should participate in Quick Match too.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'universities' AND column_name = 'quick_match'
  ) THEN
    EXECUTE 'UPDATE universities SET quick_match = true WHERE university_id = ''INTELI''';
  END IF;
END $$;
