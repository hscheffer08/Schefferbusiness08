-- Add FGV EAESP Administração to the Brazilian university catalogue and matching model.

insert into public.universities
  (university_id,name,course,location,format,positioning,program_differentiators,
   admissions,values,high_fit_student,low_fit_student,match_rationale,
   primary_source_url,country_code)
values
  ('FGV_EAESP','FGV EAESP','Administração','São Paulo, SP',
   'Presencial, 4 anos; integral do 1º ao 5º semestre e parcial do 6º ao 8º',
   'Formação sólida e analítica em Administração, conectando contexto econômico, social, político e global a decisões de gestão.',
   'Administração baseada em dados, oportunidades internacionais, dupla graduação, intercâmbio, empreendedorismo, networking e conexão com o mercado.',
   'Vestibular FGV em duas fases no mesmo dia, além das demais modalidades publicadas pela instituição.',
   'Ética, sustentabilidade, empreendedorismo, pensamento crítico, visão sistêmica, diversidade e adaptação.',
   'Aluno academicamente forte, analítico, comprometido, adaptável e interessado em negócios, dados, contexto global, carreira corporativa ou empreendedorismo.',
   'Aluno que evita carga analítica, trabalho em equipe, competição acadêmica ou contato intenso com problemas de gestão e mercado.',
   'A EAESP tende a aderir a perfis quantitativos, analíticos e ambiciosos que valorizam marca, networking, internacionalização, gestão e empreendedorismo.',
   'https://eaesp.fgv.br/cursos/graduacao-administracao-empresas','BR')
on conflict (university_id) do update set
  name=excluded.name, course=excluded.course, location=excluded.location,
  format=excluded.format, positioning=excluded.positioning,
  program_differentiators=excluded.program_differentiators,
  admissions=excluded.admissions, values=excluded.values,
  high_fit_student=excluded.high_fit_student, low_fit_student=excluded.low_fit_student,
  match_rationale=excluded.match_rationale,
  primary_source_url=excluded.primary_source_url, country_code=excluded.country_code;

insert into public.university_dimension_weights
  (university_id,dimension_id,weight,importance,tolerance,confidence,evidence_level,
   rationale,source_url,reviewed_at)
select 'FGV_EAESP', d.dimension_id,
  case d.dimension_id
    when 'academic_perf' then 94 when 'achievement_selectivity' then 93
    when 'analytical_data' then 96 when 'brand_prestige' then 97
    when 'corporate_management' then 96 when 'critical_thinking' then 95
    when 'english_level' then 91 when 'entrepreneurial_intent' then 90
    when 'finance_markets' then 93 when 'global_mindset' then 96
    when 'leadership_evidence' then 88 when 'market_employability' then 97
    when 'math_quant' then 95 when 'mobility_willingness' then 90
    when 'networking_value' then 97 when 'problem_solving' then 94
    when 'rigor_depth' then 96 when 'teamwork_collab' then 88
    when 'theory_comfort' then 90 when 'writing_argument' then 90
    when 'tech_ai_orientation' then 86 when 'practical_learning' then 88
    when 'startup_founder_fit' then 84 when 'purpose_impact' then 86
    else 78
  end,
  case when d.dimension_id in
    ('academic_perf','achievement_selectivity','analytical_data','brand_prestige',
     'corporate_management','critical_thinking','finance_markets','global_mindset',
     'market_employability','math_quant','networking_value','rigor_depth')
    then 90 else 72 end,
  20,0.78,'I',
  'Perfil institucional derivado da proposta acadêmica e do processo seletivo público da FGV EAESP.',
  'https://eaesp.fgv.br/cursos/graduacao-administracao-empresas',current_date
from public.dimensions d
on conflict (university_id,dimension_id) do update set
  weight=excluded.weight, importance=excluded.importance,
  tolerance=excluded.tolerance, confidence=excluded.confidence,
  evidence_level=excluded.evidence_level, rationale=excluded.rationale,
  source_url=excluded.source_url, reviewed_at=excluded.reviewed_at;

insert into public.university_axis_targets
  (university_id,axis_id,target,importance,tolerance,confidence,evidence_level,
   rationale,source_url,reviewed_at)
select 'FGV_EAESP', a.axis_id,
  case a.axis_id
    when 'axis_01_pratica_vs_teoria' then 72
    when 'axis_02_corporativo_vs_founder' then 42
    when 'axis_03_local_vs_global' then 92
    when 'axis_04_estrutura_vs_autonomia' then 64
    when 'axis_05_individual_vs_colaborativo' then 82
    when 'axis_06_tradicional_vs_experimental' then 70
    when 'axis_07_prova_vs_holistico' then 24
    when 'axis_08_tecnico_vs_proposito' then 58
    when 'axis_09_baixa_exposicao_vs_pitch' then 78
    when 'axis_10_baixa_ia_vs_ia_tech' then 74
    when 'axis_11_risco_baixo_vs_risco_alto' then 62
    when 'axis_12_financas_baixa_vs_alta' then 91
    else 70
  end,
  82,20,0.78,'I',
  'Alvo cultural baseado na estrutura do curso, internacionalização, formação analítica e processo seletivo da FGV EAESP.',
  'https://eaesp.fgv.br/cursos/graduacao-administracao-empresas',current_date
from public.cultural_axes a
on conflict (university_id,axis_id) do update set
  target=excluded.target, importance=excluded.importance,
  tolerance=excluded.tolerance, confidence=excluded.confidence,
  evidence_level=excluded.evidence_level, rationale=excluded.rationale,
  source_url=excluded.source_url, reviewed_at=excluded.reviewed_at;

insert into public.sources
  (source_id,university_id,source_name,url,usage_note,source_type,reviewed_at)
values
  ('source_fgv_eaesp_course','FGV_EAESP','Graduação em Administração de Empresas — FGV EAESP',
   'https://eaesp.fgv.br/cursos/graduacao-administracao-empresas',
   'Curso, perfil, diferenciais, internacionalização e processo seletivo.','institutional',current_date),
  ('source_fgv_eaesp_admission','FGV_EAESP','Edital unificado FGV 2027.1',
   'https://vestibular.fgv.br/sites/default/files/2026-07/materiais/edital-unificado_01-2027_4.pdf',
   'Estrutura das fases e critérios do vestibular de Administração.','institutional',current_date)
on conflict (source_id) do update set
  university_id=excluded.university_id, source_name=excluded.source_name,
  url=excluded.url, usage_note=excluded.usage_note,
  source_type=excluded.source_type, reviewed_at=excluded.reviewed_at;
