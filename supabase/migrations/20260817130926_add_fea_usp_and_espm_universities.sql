-- Insert FEA-USP and ESPM as full members of the existing schema.
-- They use the exact same tables, dimensions, axes and structure as all other universities.

-- ============================================================
-- FEA-USP
-- ============================================================
INSERT INTO universities (
  university_id, name, course, location, format,
  positioning, program_differentiators, admissions, values,
  high_fit_student, low_fit_student, match_rationale, primary_source_url
) VALUES (
  'FEAUSP',
  'FEA-USP',
  'Administração',
  'São Paulo, SP',
  'Integral — Cidade Universitária (Butantã)',
  'Business school pública de forte tradição acadêmica, com rigor intelectual, autonomia, base quantitativa e acesso ao amplo ecossistema da USP',
  'Formação conceitual sólida em administração, economia e finanças; forte base quantitativa e analítica; grande diversidade de entidades estudantis e oportunidades extracurriculares; ecossistema universitário amplo',
  'Ingresso via FUVEST e ENEM-USP; processo baseado em desempenho acadêmico e exames — sem avaliação de personalidade ou entrevista',
  'Rigor acadêmico, autonomia, análise quantitativa, reputação, competitividade, diversidade de oportunidades e independência',
  'Aluno com alto desempenho acadêmico, forte em matemática, independente, valoriza reputação acadêmica, confortável em ambiente competitivo e busca formação sem mensalidade',
  'Aluno que precisa de acompanhamento individual constante, prefere turmas muito pequenas, busca ambiente extremamente estruturado ou rejeita competitividade acadêmica',
  'Fontes oficiais da FEA-USP destacam rigor acadêmico, formação conceitual, ecossistema da USP e forte inserção em finanças, consultoria e gestão',
  'https://www.fea.usp.br/'
);

-- ESPM
INSERT INTO universities (
  university_id, name, course, location, format,
  positioning, program_differentiators, admissions, values,
  high_fit_student, low_fit_student, match_rationale, primary_source_url
) VALUES (
  'ESPM',
  'ESPM',
  'Administração',
  'São Paulo, SP',
  'Diurno e Noturno',
  'Business school orientada a mercado que combina administração, marketing, inovação, tecnologia, criatividade e dados',
  'Curso de Administração com foco em Business, Inovação e Marketing; projetos reais, cases, hackathons, contato com empresas; minors e trilhas de personalização; forte componente de tecnologia e dados',
  'Vestibular próprio com provas de Português, Matemática, Inglês, Humanidades e Cultura Geral Contemporânea, e Redação; também aceita ENEM',
  'Criatividade, empreendedorismo, prática, inovação, marketing, colaboração, comunicação e conexão com mercado',
  'Aluno criativo, comunicativo, empreendedor, que gosta de marketing, projetos práticos, cases, trabalhos em grupo e quer combinar business com inovação e tecnologia',
  'Aluno que busca formação quase exclusivamente matemática, prefere economia teórica profunda, rejeita trabalhos em grupo ou apresentações, ou valoriza muito mais teoria acadêmica que aplicação prática',
  'Fontes oficiais da ESPM destacam foco em Business, Inovação e Marketing, metodologia baseada em projetos e forte conexão com mercado',
  'https://www.espm.br/graduacao/administracao/'
);

-- ============================================================
-- Dimension weights — FEA-USP
-- Mapping from the provided scores to existing dimensions:
-- ============================================================
INSERT INTO university_dimension_weights (university_id, dimension_id, weight) VALUES
  ('FEAUSP', 'academic_perf', 96),
  ('FEAUSP', 'achievement_selectivity', 88),
  ('FEAUSP', 'analytical_data', 84),
  ('FEAUSP', 'autonomy_selfdirection', 97),
  ('FEAUSP', 'brand_prestige', 100),
  ('FEAUSP', 'conflict_handling', 88),
  ('FEAUSP', 'corporate_management', 94),
  ('FEAUSP', 'critical_thinking', 96),
  ('FEAUSP', 'curiosity_learning', 88),
  ('FEAUSP', 'decision_uncertainty', 91),
  ('FEAUSP', 'english_level', 68),
  ('FEAUSP', 'entrepreneurial_intent', 78),
  ('FEAUSP', 'entrepreneurial_proof', 78),
  ('FEAUSP', 'experimental_learning', 77),
  ('FEAUSP', 'extracurricular_depth', 98),
  ('FEAUSP', 'finance_markets', 94),
  ('FEAUSP', 'global_mindset', 83),
  ('FEAUSP', 'initiative_history', 88),
  ('FEAUSP', 'leadership_evidence', 88),
  ('FEAUSP', 'market_employability', 98),
  ('FEAUSP', 'math_quant', 89),
  ('FEAUSP', 'mobility_willingness', 83),
  ('FEAUSP', 'networking_value', 92),
  ('FEAUSP', 'oral_pitch', 88),
  ('FEAUSP', 'portfolio_depth', 75),
  ('FEAUSP', 'practical_learning', 75),
  ('FEAUSP', 'problem_solving', 91),
  ('FEAUSP', 'project_execution', 75),
  ('FEAUSP', 'purpose_impact', 86),
  ('FEAUSP', 'resilience_pressure', 94),
  ('FEAUSP', 'rigor_depth', 96),
  ('FEAUSP', 'startup_founder_fit', 75),
  ('FEAUSP', 'student_life_traditional', 83),
  ('FEAUSP', 'teamwork_collab', 80),
  ('FEAUSP', 'tech_ai_orientation', 76),
  ('FEAUSP', 'theory_comfort', 96),
  ('FEAUSP', 'time_discipline', 90),
  ('FEAUSP', 'work_experience', 86),
  ('FEAUSP', 'writing_argument', 92);

-- ============================================================
-- Dimension weights — ESPM
-- ============================================================
INSERT INTO university_dimension_weights (university_id, dimension_id, weight) VALUES
  ('ESPM', 'academic_perf', 84),
  ('ESPM', 'achievement_selectivity', 82),
  ('ESPM', 'analytical_data', 89),
  ('ESPM', 'autonomy_selfdirection', 86),
  ('ESPM', 'brand_prestige', 94),
  ('ESPM', 'conflict_handling', 85),
  ('ESPM', 'corporate_management', 89),
  ('ESPM', 'critical_thinking', 87),
  ('ESPM', 'curiosity_learning', 90),
  ('ESPM', 'decision_uncertainty', 88),
  ('ESPM', 'english_level', 82),
  ('ESPM', 'entrepreneurial_intent', 94),
  ('ESPM', 'entrepreneurial_proof', 90),
  ('ESPM', 'experimental_learning', 96),
  ('ESPM', 'extracurricular_depth', 88),
  ('ESPM', 'finance_markets', 84),
  ('ESPM', 'global_mindset', 90),
  ('ESPM', 'initiative_history', 91),
  ('ESPM', 'leadership_evidence', 91),
  ('ESPM', 'market_employability', 94),
  ('ESPM', 'math_quant', 80),
  ('ESPM', 'mobility_willingness', 90),
  ('ESPM', 'networking_value', 95),
  ('ESPM', 'oral_pitch', 91),
  ('ESPM', 'portfolio_depth', 98),
  ('ESPM', 'practical_learning', 98),
  ('ESPM', 'problem_solving', 91),
  ('ESPM', 'project_execution', 98),
  ('ESPM', 'purpose_impact', 88),
  ('ESPM', 'resilience_pressure', 85),
  ('ESPM', 'rigor_depth', 84),
  ('ESPM', 'startup_founder_fit', 90),
  ('ESPM', 'student_life_traditional', 70),
  ('ESPM', 'teamwork_collab', 91),
  ('ESPM', 'tech_ai_orientation', 92),
  ('ESPM', 'theory_comfort', 78),
  ('ESPM', 'time_discipline', 86),
  ('ESPM', 'work_experience', 89),
  ('ESPM', 'writing_argument', 87);

-- ============================================================
-- Cultural axis targets — FEA-USP
-- Mapping from cultural indicators:
--   Competitiva=91, Colaborativa=80, Acadêmica=97, Empreendedora=79,
--   Corporativa=86, Criativa=68, Analítica=96, Internacional=81,
--   Tradicional=83, Inovadora=77, Independente=97, Estruturada=72, Flexível=90
-- ============================================================
INSERT INTO university_axis_targets (university_id, axis_id, target) VALUES
  ('FEAUSP', 'axis_01_pratica_vs_teoria', 25),
  ('FEAUSP', 'axis_02_corporativo_vs_founder', 25),
  ('FEAUSP', 'axis_03_local_vs_global', 81),
  ('FEAUSP', 'axis_04_estrutura_vs_autonomia', 97),
  ('FEAUSP', 'axis_05_individual_vs_colaborativo', 80),
  ('FEAUSP', 'axis_06_tradicional_vs_experimental', 23),
  ('FEAUSP', 'axis_07_prova_vs_holistico', 15),
  ('FEAUSP', 'axis_08_tecnico_vs_proposito', 20),
  ('FEAUSP', 'axis_09_baixa_exposicao_vs_pitch', 60),
  ('FEAUSP', 'axis_10_baixa_ia_vs_ia_tech', 76),
  ('FEAUSP', 'axis_11_risco_baixo_vs_risco_alto', 30),
  ('FEAUSP', 'axis_12_financas_baixa_vs_alta', 94);

-- ============================================================
-- Cultural axis targets — ESPM
--   Competitiva=84, Colaborativa=91, Acadêmica=82, Empreendedora=96,
--   Corporativa=91, Criativa=100, Analítica=87, Internacional=91,
--   Tradicional=70, Inovadora=96, Independente=85, Estruturada=88, Flexível=94
-- ============================================================
INSERT INTO university_axis_targets (university_id, axis_id, target) VALUES
  ('ESPM', 'axis_01_pratica_vs_teoria', 98),
  ('ESPM', 'axis_02_corporativo_vs_founder', 70),
  ('ESPM', 'axis_03_local_vs_global', 90),
  ('ESPM', 'axis_04_estrutura_vs_autonomia', 80),
  ('ESPM', 'axis_05_individual_vs_colaborativo', 91),
  ('ESPM', 'axis_06_tradicional_vs_experimental', 96),
  ('ESPM', 'axis_07_prova_vs_holistico', 75),
  ('ESPM', 'axis_08_tecnico_vs_proposito', 65),
  ('ESPM', 'axis_09_baixa_exposicao_vs_pitch', 91),
  ('ESPM', 'axis_10_baixa_ia_vs_ia_tech', 92),
  ('ESPM', 'axis_11_risco_baixo_vs_risco_alto', 80),
  ('ESPM', 'axis_12_financas_baixa_vs_alta', 84);

-- ============================================================
-- Official evidence — FEA-USP
-- ============================================================
INSERT INTO official_evidence (evidence_id, university_id, evidence_name, evidence_type, summary, source_url) VALUES
  ('evidence_015', 'FEAUSP', 'Ingresso via FUVEST', 'Direto do edital', 'Processo seletivo baseado em exames acadêmicos — português, matemática, humanidades e ciências da natureza. Sem avaliação de personalidade ou entrevista.', 'https://www.fuvest.br/'),
  ('evidence_016', 'FEAUSP', 'Ingresso via ENEM-USP', 'Direto institucional', 'USP utiliza nota do ENEM para parte das vagas. Compatibilidade com a faculdade não significa probabilidade de aprovação.', 'https://www.usp.br/ingresso/'),
  ('evidence_017', 'FEAUSP', 'Ecossistema USP', 'Direto institucional', 'Acesso a mais de 200 entidades estudantis, centros acadêmicos, empresas juniores e ampla infraestrutura da Universidade de São Paulo.', 'https://www.fea.usp.br/');

INSERT INTO evidence_dimensions (evidence_id, dimension_id) VALUES
  ('evidence_015', 'academic_perf'),
  ('evidence_015', 'rigor_depth'),
  ('evidence_015', 'writing_argument'),
  ('evidence_016', 'academic_perf'),
  ('evidence_016', 'math_quant'),
  ('evidence_017', 'extracurricular_depth'),
  ('evidence_017', 'networking_value'),
  ('evidence_017', 'leadership_evidence');

-- ============================================================
-- Official evidence — ESPM
-- ============================================================
INSERT INTO official_evidence (evidence_id, university_id, evidence_name, evidence_type, summary, source_url) VALUES
  ('evidence_018', 'ESPM', 'Vestibular ESPM', 'Direto do edital', 'Prova presencial com Português, Matemática, Inglês, Humanidades e Cultura Geral Contemporânea, e Redação. Datas e formatos podem mudar a cada semestre.', 'https://vestibular.espm.br/'),
  ('evidence_019', 'ESPM', 'Metodologia baseada em projetos', 'Direto institucional', 'Cases reais, hackathons, desafios empresariais, laboratórios e contato direto com empresas ao longo do curso.', 'https://www.espm.br/graduacao/administracao/'),
  ('evidence_020', 'ESPM', 'Minors e trilhas de personalização', 'Direto institucional', 'Trilhas como Growth & Digital Marketing, Mercado Financeiro, Strategic Management, Business Intelligence, Brand Management, ESG/Global Business e outras conforme oferta vigente.', 'https://www.espm.br/graduacao/administracao/');

INSERT INTO evidence_dimensions (evidence_id, dimension_id) VALUES
  ('evidence_018', 'academic_perf'),
  ('evidence_018', 'writing_argument'),
  ('evidence_018', 'math_quant'),
  ('evidence_019', 'practical_learning'),
  ('evidence_019', 'project_execution'),
  ('evidence_019', 'corporate_management'),
  ('evidence_019', 'oral_pitch'),
  ('evidence_020', 'experimental_learning'),
  ('evidence_020', 'market_employability'),
  ('evidence_020', 'entrepreneurial_intent');

-- ============================================================
-- Sources — FEA-USP
-- ============================================================
INSERT INTO sources (source_id, university_id, source_name, url, usage_note) VALUES
  ('source_017', 'FEAUSP', 'Portal institucional FEA-USP', 'https://www.fea.usp.br/', 'Missão, proposta acadêmica e ecossistema da USP.'),
  ('source_018', 'FEAUSP', 'Ingresso USP', 'https://www.usp.br/ingresso/', 'Modalidades de ingresso via FUVEST e ENEM-USP.'),
  ('source_019', 'FEAUSP', 'FUVEST', 'https://www.fuvest.br/', 'Edital e formato do vestibular USP.');

-- ============================================================
-- Sources — ESPM
-- ============================================================
INSERT INTO sources (source_id, university_id, source_name, url, usage_note) VALUES
  ('source_020', 'ESPM', 'Portal institucional ESPM', 'https://www.espm.br/graduacao/administracao/', 'Foco em Business, Inovação e Marketing; metodologia e diferenciais.'),
  ('source_021', 'ESPM', 'Vestibular ESPM', 'https://vestibular.espm.br/', 'Edital, provas e processo seletivo. Datas e formatos sujeitos a alteração.'),
  ('source_022', 'ESPM', 'Minors e trilhas', 'https://www.espm.br/graduacao/administracao/', 'Trilhas de personalização e flexibilidade acadêmica.');
