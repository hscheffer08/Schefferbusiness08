-- Add 11 private Brazilian business schools to the same matching model used by
-- the existing Brazilian institutions. This migration is idempotent and does
-- not update or delete any pre-existing Brazilian university.

create temporary table _br_private_universities on commit drop as
select * from (values
  (
    'INTELI', 'Inteli', 'ADM Tech (Administração)', 'São Paulo, SP',
    'Presencial, 4 anos; integral nos dois primeiros anos e parcial nos dois últimos',
    'Business, tecnologia e liderança integrados em uma formação baseada em projetos reais',
    'ADM Tech combina 60% de negócios e liderança com 40% de tecnologia; primeiro ano comum, PBL, projetos com empresas, dados e inteligência artificial',
    'Processo seletivo próprio com avaliação acadêmica e etapas de Perfil e Projeto; o edital vigente também prevê formas substitutivas para a prova',
    'Tecnologia, protagonismo, colaboração, inovação, liderança, pensamento crítico, execução e empreendedorismo',
    'Aluno proativo, colaborativo e interessado em negócios e tecnologia, confortável com projetos, problemas abertos, apresentações e construção de soluções',
    'Aluno que procura formação predominantemente teórica, evita trabalhos em equipe e apresentações ou não quer tecnologia aplicada a negócios',
    'A proposta ADM Tech e o processo holístico favorecem perfis com forte execução, análise, liderança, colaboração e interesse por IA e produtos digitais',
    'https://www.inteli.edu.br/adm-tech/',
    '{"academic_perf":86,"achievement_selectivity":91,"analytical_data":96,"autonomy_selfdirection":94,"brand_prestige":87,"conflict_handling":92,"corporate_management":91,"critical_thinking":97,"curiosity_learning":98,"decision_uncertainty":96,"english_level":88,"entrepreneurial_intent":97,"entrepreneurial_proof":95,"experimental_learning":100,"extracurricular_depth":94,"finance_markets":78,"global_mindset":90,"initiative_history":98,"leadership_evidence":97,"market_employability":94,"math_quant":92,"mobility_willingness":84,"networking_value":94,"oral_pitch":97,"portfolio_depth":98,"practical_learning":100,"problem_solving":100,"project_execution":100,"purpose_impact":92,"resilience_pressure":94,"rigor_depth":90,"startup_founder_fit":98,"student_life_traditional":60,"teamwork_collab":100,"tech_ai_orientation":100,"theory_comfort":72,"time_discipline":96,"work_experience":90,"writing_argument":96}'::jsonb,
    '{"axis_01_pratica_vs_teoria":100,"axis_02_corporativo_vs_founder":82,"axis_03_local_vs_global":88,"axis_04_estrutura_vs_autonomia":88,"axis_05_individual_vs_colaborativo":100,"axis_06_tradicional_vs_experimental":100,"axis_07_prova_vs_holistico":96,"axis_08_tecnico_vs_proposito":72,"axis_09_baixa_exposicao_vs_pitch":98,"axis_10_baixa_ia_vs_ia_tech":100,"axis_11_risco_baixo_vs_risco_alto":88,"axis_12_financas_baixa_vs_alta":72}'::jsonb
  ),
  (
    'FGV_EBAPE', 'FGV EBAPE', 'Administração', 'Rio de Janeiro, RJ',
    'Presencial, 4 anos; 5º semestre dedicado à experiência internacional',
    'Formação analítica, global e rigorosa para atuação em empresas, governo e terceiro setor',
    'Currículo com pensamento crítico-analítico, rigor metodológico, teoria e prática; intercâmbio previsto, dupla graduação e programa internacional IBEA',
    'Ingresso por vestibular, ENEM ou exames internacionais como IB, Abitur, BAC, AP e SAT, conforme edital vigente',
    'Rigor, pensamento crítico, visão global, ética, diversidade, liderança e impacto público e empresarial',
    'Aluno analítico, academicamente forte, com inglês e mobilidade internacional, interessado em liderança, consultoria, gestão e ambientes diversos',
    'Aluno que evita análise quantitativa, rigor acadêmico, exposição internacional ou discussão de problemas públicos e organizacionais complexos',
    'O currículo internacional e analítico da EBAPE favorece perfis globais, críticos, quantitativos e orientados a liderança e carreira',
    'https://ebape.fgv.br/cursos/graduacao/graduacao-em-administracao',
    '{"academic_perf":92,"achievement_selectivity":91,"analytical_data":94,"brand_prestige":93,"corporate_management":92,"critical_thinking":94,"english_level":94,"finance_markets":87,"global_mindset":98,"market_employability":92,"mobility_willingness":96,"rigor_depth":94,"startup_founder_fit":72,"theory_comfort":89,"writing_argument":90}'::jsonb,
    '{"axis_01_pratica_vs_teoria":78,"axis_02_corporativo_vs_founder":38,"axis_03_local_vs_global":100,"axis_04_estrutura_vs_autonomia":78,"axis_05_individual_vs_colaborativo":84,"axis_06_tradicional_vs_experimental":72,"axis_07_prova_vs_holistico":40,"axis_08_tecnico_vs_proposito":82,"axis_09_baixa_exposicao_vs_pitch":82,"axis_10_baixa_ia_vs_ia_tech":78,"axis_11_risco_baixo_vs_risco_alto":58,"axis_12_financas_baixa_vs_alta":88}'::jsonb
  ),
  (
    'PUCRIO_IAG', 'PUC-Rio IAG', 'Administração', 'Rio de Janeiro, RJ',
    'Presencial, currículo flexível e multidisciplinar',
    'Escola de negócios humanista, criativa e global, com flexibilidade acadêmica e cinco ênfases',
    'Ênfases em Estratégia, Finanças, Gestão de Pessoas e Processos, Gestão do Ambiente Digital e Marketing; integração com o ecossistema amplo da PUC-Rio',
    'Ingresso pelas modalidades e editais de graduação da PUC-Rio, incluindo vestibular e demais formas publicadas para o período',
    'Ética, criatividade, visão global, autonomia, diversidade, pensamento crítico, responsabilidade e inovação',
    'Aluno criativo e autônomo que busca formação ampla, flexível e ética, com interesse em negócios, marketing, finanças, pessoas ou transformação digital',
    'Aluno que prefere currículo totalmente rígido, foco exclusivamente quantitativo ou pouca abertura para formação humanística e multidisciplinar',
    'A flexibilidade curricular e as cinco ênfases geram aderência para perfis autônomos, globais, criativos e interessados em diferentes áreas de gestão',
    'https://www.puc-rio.br/ensinopesq/ccg/administracao.html',
    '{"academic_perf":86,"autonomy_selfdirection":88,"brand_prestige":88,"critical_thinking":90,"english_level":86,"finance_markets":85,"global_mindset":90,"networking_value":87,"purpose_impact":88,"tech_ai_orientation":84,"theory_comfort":83,"writing_argument":88}'::jsonb,
    '{"axis_01_pratica_vs_teoria":68,"axis_02_corporativo_vs_founder":50,"axis_03_local_vs_global":90,"axis_04_estrutura_vs_autonomia":85,"axis_05_individual_vs_colaborativo":85,"axis_06_tradicional_vs_experimental":74,"axis_07_prova_vs_holistico":55,"axis_08_tecnico_vs_proposito":86,"axis_09_baixa_exposicao_vs_pitch":82,"axis_10_baixa_ia_vs_ia_tech":82,"axis_11_risco_baixo_vs_risco_alto":64,"axis_12_financas_baixa_vs_alta":84}'::jsonb
  ),
  (
    'MACKENZIE', 'Universidade Presbiteriana Mackenzie', 'Administração', 'São Paulo, SP',
    'Presencial, 8 semestres, opções matutina e noturna no campus Higienópolis',
    'Formação tradicional e completa em gestão, com empreendedorismo, ética, liderança e conexão empresarial',
    'Disciplinas de gestão e empreendedorismo, formação generalista, tradição universitária, entidades estudantis e integração com o mercado de São Paulo',
    'Vestibular de graduação, ENEM e demais modalidades previstas no edital vigente do Mackenzie',
    'Tradição, ética, liderança, empreendedorismo, responsabilidade, empregabilidade e formação integral',
    'Aluno que valoriza tradição universitária, vida de campus, formação generalista, carreira corporativa, liderança e empreendedorismo',
    'Aluno que busca uma escola pequena, extremamente experimental ou currículo quase exclusivamente tecnológico e orientado a startups',
    'A tradição, a estrutura universitária e o foco em gestão e empregabilidade favorecem perfis corporativos, responsáveis e interessados em uma experiência completa de campus',
    'https://www.mackenzie.br/graduacao/sao-paulo-higienopolis/administracao',
    '{"brand_prestige":87,"corporate_management":90,"entrepreneurial_intent":84,"market_employability":88,"networking_value":88,"purpose_impact":84,"rigor_depth":84,"student_life_traditional":92,"theory_comfort":83}'::jsonb,
    '{"axis_01_pratica_vs_teoria":70,"axis_02_corporativo_vs_founder":40,"axis_03_local_vs_global":68,"axis_04_estrutura_vs_autonomia":66,"axis_05_individual_vs_colaborativo":80,"axis_06_tradicional_vs_experimental":65,"axis_07_prova_vs_holistico":45,"axis_08_tecnico_vs_proposito":78,"axis_09_baixa_exposicao_vs_pitch":72,"axis_10_baixa_ia_vs_ia_tech":70,"axis_11_risco_baixo_vs_risco_alto":58,"axis_12_financas_baixa_vs_alta":82}'::jsonb
  ),
  (
    'FIA', 'FIA Business School', 'Administração', 'São Paulo, SP',
    'Presencial, 4 anos',
    'Business school fortemente conectada ao mercado, à gestão corporativa e à atuação internacional',
    'Formação em liderança de projetos, gestão de negócios e decisão; professores com experiência acadêmica e empresarial, pesquisa, consultoria e visão internacional',
    'Ingresso por vestibular próprio, ENEM, transferência ou certificações internacionais, com entrevista e avaliação acadêmica conforme a modalidade',
    'Mercado, liderança, estratégia, trabalho em equipe, decisão, visão internacional, ética e impacto',
    'Aluno pragmático e ambicioso, interessado em grandes organizações, consultoria, finanças, networking executivo e aplicação de gestão',
    'Aluno que procura vida universitária ampla fora de negócios ou prefere formação pouco conectada a empresas e decisões gerenciais',
    'A especialização institucional em Administração e a proximidade com executivos e empresas favorecem perfis corporativos, estratégicos e orientados ao mercado',
    'https://fia.com.br/graduacao/administracao/',
    '{"brand_prestige":88,"corporate_management":96,"finance_markets":91,"global_mindset":92,"leadership_evidence":91,"market_employability":96,"networking_value":94,"practical_learning":92,"tech_ai_orientation":86,"work_experience":86}'::jsonb,
    '{"axis_01_pratica_vs_teoria":82,"axis_02_corporativo_vs_founder":35,"axis_03_local_vs_global":88,"axis_04_estrutura_vs_autonomia":72,"axis_05_individual_vs_colaborativo":88,"axis_06_tradicional_vs_experimental":80,"axis_07_prova_vs_holistico":55,"axis_08_tecnico_vs_proposito":72,"axis_09_baixa_exposicao_vs_pitch":82,"axis_10_baixa_ia_vs_ia_tech":82,"axis_11_risco_baixo_vs_risco_alto":60,"axis_12_financas_baixa_vs_alta":90}'::jsonb
  ),
  (
    'FAAP', 'FAAP', 'Administração', 'São Paulo, SP',
    'Presencial, 4 anos, opções matutina e noturna',
    'Formação premium, criativa e global em negócios, com forte rede e integração a Economia e Relações Internacionais',
    'Administração integra o programa Business and International Affairs, com possibilidade de segunda e terceira titulação, visão global, empreendedorismo e liderança',
    'Vestibular FAAP, ENEM e demais formas de ingresso divulgadas pela instituição para o período',
    'Criatividade, visão global, empreendedorismo, liderança, repertório, networking, inovação e responsabilidade',
    'Aluno comunicativo e global que valoriza networking, empreendedorismo, repertório cultural, negócios internacionais e flexibilidade de trajetória',
    'Aluno que busca ambiente exclusivamente quantitativo, baixo custo ou pouca exposição a apresentações, rede profissional e experiências multidisciplinares',
    'A integração entre Administração, Economia e Relações Internacionais favorece perfis globais, comunicativos, empreendedores e interessados em rede e mercado',
    'https://www.faap.br/graduacao/administracao/',
    '{"brand_prestige":89,"corporate_management":90,"entrepreneurial_intent":88,"global_mindset":92,"networking_value":94,"oral_pitch":88,"portfolio_depth":84,"purpose_impact":84,"student_life_traditional":86,"tech_ai_orientation":82}'::jsonb,
    '{"axis_01_pratica_vs_teoria":82,"axis_02_corporativo_vs_founder":50,"axis_03_local_vs_global":92,"axis_04_estrutura_vs_autonomia":82,"axis_05_individual_vs_colaborativo":84,"axis_06_tradicional_vs_experimental":80,"axis_07_prova_vs_holistico":50,"axis_08_tecnico_vs_proposito":78,"axis_09_baixa_exposicao_vs_pitch":88,"axis_10_baixa_ia_vs_ia_tech":80,"axis_11_risco_baixo_vs_risco_alto":68,"axis_12_financas_baixa_vs_alta":84}'::jsonb
  ),
  (
    'PUCMINAS', 'PUC Minas', 'Administração', 'Belo Horizonte, MG',
    'Presencial, com oferta em diferentes campi e turnos',
    'Formação humanista e sólida em gestão, combinando responsabilidade social, teoria e aplicação profissional',
    'Currículo generalista em gestão e negócios, integração universitária, extensão, empreendedorismo e formação ética alinhada à tradição PUC',
    'Vestibular presencial, processo simplificado, nota do ENEM, prova on-line e outras modalidades divulgadas para cada campus',
    'Ética, humanismo, responsabilidade social, colaboração, liderança, conhecimento e compromisso com a sociedade',
    'Aluno que busca formação abrangente, ambiente universitário tradicional, propósito, ética, colaboração e base consistente em gestão',
    'Aluno que prioriza uma escola exclusivamente de negócios, experiência extrema de startup ou currículo centrado quase só em tecnologia',
    'A combinação entre tradição acadêmica, formação humanista e gestão favorece perfis responsáveis, colaborativos e interessados em impacto e carreira',
    'https://www.pucminas.br/campus/lourdes/ensino/graduacao/Paginas/Administracao.aspx',
    '{"brand_prestige":85,"corporate_management":85,"global_mindset":78,"market_employability":84,"networking_value":82,"purpose_impact":92,"rigor_depth":85,"student_life_traditional":90,"teamwork_collab":90,"theory_comfort":84}'::jsonb,
    '{"axis_01_pratica_vs_teoria":70,"axis_02_corporativo_vs_founder":38,"axis_03_local_vs_global":68,"axis_04_estrutura_vs_autonomia":68,"axis_05_individual_vs_colaborativo":88,"axis_06_tradicional_vs_experimental":66,"axis_07_prova_vs_holistico":48,"axis_08_tecnico_vs_proposito":92,"axis_09_baixa_exposicao_vs_pitch":74,"axis_10_baixa_ia_vs_ia_tech":68,"axis_11_risco_baixo_vs_risco_alto":56,"axis_12_financas_baixa_vs_alta":76}'::jsonb
  ),
  (
    'PUCRS', 'PUCRS Escola de Negócios', 'Administração de Empresas', 'Porto Alegre, RS',
    'Presencial, bacharelado com diferentes linhas de formação',
    'Escola de negócios inovadora e prática, integrada ao ecossistema Tecnopuc e a projetos com empresas',
    'Linhas em Administração de Empresas, Inovação e Empreendedorismo, Liderança e Gestão de Pessoas, Marketing e Negócios Internacionais; projetos e conexão direta com mercado',
    'Vestibular, ENEM e demais modalidades publicadas pela PUCRS para a graduação',
    'Inovação, empreendedorismo, liderança, colaboração, impacto, tecnologia, mercado e formação humana',
    'Aluno que valoriza inovação, projetos, empreendedorismo, vida universitária, tecnologia e possibilidade de escolher uma linha de negócios',
    'Aluno que deseja currículo estreito, exclusivamente teórico ou pouca interação com projetos, empresas e áreas diferentes de gestão',
    'As linhas de formação e o ecossistema de inovação favorecem perfis práticos, empreendedores, colaborativos e conectados a tecnologia e mercado',
    'https://portal.pucrs.br/ensino/cursos/graduacao/administracao-administracao-de-empresas/',
    '{"brand_prestige":86,"entrepreneurial_intent":90,"experimental_learning":88,"global_mindset":84,"market_employability":88,"networking_value":86,"practical_learning":90,"project_execution":88,"purpose_impact":88,"startup_founder_fit":86,"student_life_traditional":90,"tech_ai_orientation":88}'::jsonb,
    '{"axis_01_pratica_vs_teoria":88,"axis_02_corporativo_vs_founder":65,"axis_03_local_vs_global":82,"axis_04_estrutura_vs_autonomia":82,"axis_05_individual_vs_colaborativo":90,"axis_06_tradicional_vs_experimental":90,"axis_07_prova_vs_holistico":55,"axis_08_tecnico_vs_proposito":88,"axis_09_baixa_exposicao_vs_pitch":86,"axis_10_baixa_ia_vs_ia_tech":90,"axis_11_risco_baixo_vs_risco_alto":78,"axis_12_financas_baixa_vs_alta":82}'::jsonb
  ),
  (
    'PUCPR', 'PUCPR Escola de Negócios', 'Administração', 'Curitiba, PR',
    'Presencial, bacharelado em Administração',
    'Formação em gestão orientada a dados, propósito e internacionalização, dentro de uma universidade completa',
    'Decisão gerencial em Finanças, Marketing, Operações e Logística baseada em dados; programa de Administração Internacional e oportunidades de mobilidade',
    'Vestibular, ENEM, vestibular agendado, transferência e demais formas de ingresso divulgadas pela PUCPR',
    'Ética, propósito, inovação, visão global, análise, liderança, sustentabilidade e transformação social',
    'Aluno analítico e global que quer combinar gestão, dados, finanças, operações, propósito e oportunidades internacionais',
    'Aluno que rejeita formação humanista, análise de dados ou uma grade generalista de gestão dentro de uma universidade tradicional',
    'O foco em decisão baseada em dados, áreas funcionais e internacionalização favorece perfis analíticos, globais e orientados a gestão responsável',
    'https://www.pucpr.br/cursos-graduacao/administracao/',
    '{"analytical_data":90,"brand_prestige":86,"corporate_management":90,"english_level":88,"finance_markets":88,"global_mindset":90,"practical_learning":86,"purpose_impact":88,"student_life_traditional":88,"tech_ai_orientation":88,"theory_comfort":84}'::jsonb,
    '{"axis_01_pratica_vs_teoria":78,"axis_02_corporativo_vs_founder":38,"axis_03_local_vs_global":90,"axis_04_estrutura_vs_autonomia":74,"axis_05_individual_vs_colaborativo":86,"axis_06_tradicional_vs_experimental":78,"axis_07_prova_vs_holistico":48,"axis_08_tecnico_vs_proposito":88,"axis_09_baixa_exposicao_vs_pitch":78,"axis_10_baixa_ia_vs_ia_tech":88,"axis_11_risco_baixo_vs_risco_alto":60,"axis_12_financas_baixa_vs_alta":88}'::jsonb
  ),
  (
    'UNISINOS_GIL', 'Unisinos', 'Administração — Gestão para Inovação e Liderança', 'Porto Alegre, RS',
    'Presencial, integral, graduação imersiva',
    'Programa experimental e internacional voltado a inovação, liderança, projetos e colaboração',
    'Projetos integradores desde o início, currículo interdisciplinar, avaliações contínuas e duas experiências internacionais incorporadas à proposta do curso',
    'Processo seletivo Unisinos com ingresso anual e escolha da linha de formação no momento da inscrição, conforme edital vigente',
    'Inovação, liderança, colaboração, criatividade, empreendedorismo, visão global, projetos e impacto',
    'Aluno colaborativo, criativo e autônomo que busca imersão, projetos, liderança, inovação e experiências internacionais',
    'Aluno que prefere formação convencional, baixa intensidade, avaliações apenas por prova ou pouca mobilidade e trabalho em grupo',
    'A graduação imersiva, os projetos integradores e a experiência internacional favorecem perfis experimentais, colaborativos, líderes e empreendedores',
    'https://www.unisinos.br/graduacao/administracao-gestao-para-inovacao-e-lideranca',
    '{"autonomy_selfdirection":90,"entrepreneurial_intent":92,"experimental_learning":94,"global_mindset":92,"leadership_evidence":94,"mobility_willingness":90,"oral_pitch":90,"practical_learning":94,"project_execution":94,"purpose_impact":90,"startup_founder_fit":90,"teamwork_collab":94}'::jsonb,
    '{"axis_01_pratica_vs_teoria":94,"axis_02_corporativo_vs_founder":74,"axis_03_local_vs_global":92,"axis_04_estrutura_vs_autonomia":88,"axis_05_individual_vs_colaborativo":96,"axis_06_tradicional_vs_experimental":96,"axis_07_prova_vs_holistico":62,"axis_08_tecnico_vs_proposito":90,"axis_09_baixa_exposicao_vs_pitch":92,"axis_10_baixa_ia_vs_ia_tech":86,"axis_11_risco_baixo_vs_risco_alto":82,"axis_12_financas_baixa_vs_alta":74}'::jsonb
  ),
  (
    'UNIFOR', 'Universidade de Fortaleza', 'Administração', 'Fortaleza, CE',
    'Presencial, bacharelado em Administração',
    'Formação prática e internacionalmente acreditada em gestão, com forte conexão empresarial e liderança regional',
    'Mais de 50 anos de tradição, acreditação AACSB, trilhas de formação em áreas de negócios, projetos, inovação e integração com empresas',
    'Processo seletivo continuado, ENEM, prova on-line e demais modalidades divulgadas pela Unifor para cada semestre',
    'Excelência, inovação, empreendedorismo, ética, liderança, impacto regional, tecnologia e mercado',
    'Aluno que busca forte conexão empresarial, formação prática, campus completo, inovação, finanças e oportunidades no Nordeste',
    'Aluno que procura uma escola pequena fora de um campus universitário ou formação quase exclusivamente teórica e sem interação regional',
    'A acreditação internacional, a tradição e a conexão empresarial favorecem perfis práticos, líderes, analíticos e orientados a mercado e impacto regional',
    'https://unifor.br/web/graduacao/administracao',
    '{"analytical_data":88,"brand_prestige":86,"corporate_management":90,"entrepreneurial_intent":88,"finance_markets":88,"global_mindset":86,"market_employability":91,"networking_value":88,"practical_learning":90,"purpose_impact":86,"student_life_traditional":90,"tech_ai_orientation":86}'::jsonb,
    '{"axis_01_pratica_vs_teoria":86,"axis_02_corporativo_vs_founder":50,"axis_03_local_vs_global":82,"axis_04_estrutura_vs_autonomia":74,"axis_05_individual_vs_colaborativo":88,"axis_06_tradicional_vs_experimental":82,"axis_07_prova_vs_holistico":50,"axis_08_tecnico_vs_proposito":84,"axis_09_baixa_exposicao_vs_pitch":82,"axis_10_baixa_ia_vs_ia_tech":86,"axis_11_risco_baixo_vs_risco_alto":68,"axis_12_financas_baixa_vs_alta":88}'::jsonb
  )
) as u(
  university_id, name, course, location, format, positioning,
  program_differentiators, admissions, values, high_fit_student,
  low_fit_student, match_rationale, primary_source_url,
  dimension_overrides, axis_overrides
);

insert into public.universities (
  university_id, name, course, location, format, positioning,
  program_differentiators, admissions, values, high_fit_student,
  low_fit_student, match_rationale, primary_source_url, image_url, country_code
)
select
  university_id, name, course, location, format, positioning,
  program_differentiators, admissions, values, high_fit_student,
  low_fit_student, match_rationale, primary_source_url, null, 'BR'
from _br_private_universities
on conflict (university_id) do update set
  name = excluded.name,
  course = excluded.course,
  location = excluded.location,
  format = excluded.format,
  positioning = excluded.positioning,
  program_differentiators = excluded.program_differentiators,
  admissions = excluded.admissions,
  values = excluded.values,
  high_fit_student = excluded.high_fit_student,
  low_fit_student = excluded.low_fit_student,
  match_rationale = excluded.match_rationale,
  primary_source_url = excluded.primary_source_url,
  country_code = excluded.country_code;

-- Every institution receives a value for every current matching dimension.
with dimension_baseline as (
  select d.dimension_id,
    case d.dimension_id
      when 'academic_perf' then 82 when 'achievement_selectivity' then 80
      when 'analytical_data' then 82 when 'autonomy_selfdirection' then 80
      when 'brand_prestige' then 82 when 'conflict_handling' then 80
      when 'corporate_management' then 84 when 'critical_thinking' then 86
      when 'curiosity_learning' then 84 when 'decision_uncertainty' then 82
      when 'english_level' then 76 when 'entrepreneurial_intent' then 82
      when 'entrepreneurial_proof' then 74 when 'experimental_learning' then 78
      when 'extracurricular_depth' then 74 when 'finance_markets' then 80
      when 'global_mindset' then 78 when 'initiative_history' then 82
      when 'leadership_evidence' then 84 when 'market_employability' then 86
      when 'math_quant' then 78 when 'mobility_willingness' then 72
      when 'networking_value' then 84 when 'oral_pitch' then 80
      when 'portfolio_depth' then 72 when 'practical_learning' then 84
      when 'problem_solving' then 86 when 'project_execution' then 84
      when 'purpose_impact' then 76 when 'resilience_pressure' then 82
      when 'rigor_depth' then 82 when 'startup_founder_fit' then 78
      when 'student_life_traditional' then 78 when 'teamwork_collab' then 86
      when 'tech_ai_orientation' then 78 when 'theory_comfort' then 76
      when 'time_discipline' then 82 when 'work_experience' then 74
      when 'writing_argument' then 80 else 75
    end as baseline_weight
  from public.dimensions d
)
insert into public.university_dimension_weights (university_id, dimension_id, weight)
select
  u.university_id,
  d.dimension_id,
  coalesce((u.dimension_overrides ->> d.dimension_id)::numeric, d.baseline_weight)
from _br_private_universities u
cross join dimension_baseline d
on conflict (university_id, dimension_id) do update set weight = excluded.weight;

-- Every institution also receives a target for every current cultural axis.
with axis_baseline as (
  select a.axis_id,
    case a.axis_id
      when 'axis_01_pratica_vs_teoria' then 78
      when 'axis_02_corporativo_vs_founder' then 48
      when 'axis_03_local_vs_global' then 75
      when 'axis_04_estrutura_vs_autonomia' then 75
      when 'axis_05_individual_vs_colaborativo' then 85
      when 'axis_06_tradicional_vs_experimental' then 76
      when 'axis_07_prova_vs_holistico' then 55
      when 'axis_08_tecnico_vs_proposito' then 76
      when 'axis_09_baixa_exposicao_vs_pitch' then 78
      when 'axis_10_baixa_ia_vs_ia_tech' then 76
      when 'axis_11_risco_baixo_vs_risco_alto' then 72
      when 'axis_12_financas_baixa_vs_alta' then 80
      else 75
    end as baseline_target
  from public.cultural_axes a
)
insert into public.university_axis_targets (university_id, axis_id, target)
select
  u.university_id,
  a.axis_id,
  coalesce((u.axis_overrides ->> a.axis_id)::numeric, a.baseline_target)
from _br_private_universities u
cross join axis_baseline a
on conflict (university_id, axis_id) do update set target = excluded.target;

create temporary table _br_private_sources on commit drop as
select * from (values
  ('source_inteli_course','INTELI','ADM Tech — curso','https://www.inteli.edu.br/adm-tech/','Curso, proporção entre negócios e tecnologia e proposta acadêmica.'),
  ('source_inteli_admission','INTELI','Processo seletivo Inteli','https://www.inteli.edu.br/processo-seletivo/','Etapas e formas de ingresso vigentes.'),
  ('source_inteli_global','INTELI','Experiência internacional','https://www.inteli.edu.br/experiencia-internacional/','Mobilidade, networking e competências interculturais.'),
  ('source_ebape_course','FGV_EBAPE','Graduação em Administração','https://ebape.fgv.br/cursos/graduacao/graduacao-em-administracao','Proposta, competências e diferenciais do curso.'),
  ('source_ebape_program','FGV_EBAPE','Programa da graduação','https://ebape.fgv.br/cursos/graduacao/graduacao-em-administracao/programa','Currículo, intercâmbio, dupla graduação e IBEA.'),
  ('source_ebape_admission','FGV_EBAPE','Formas de ingresso','https://ebape.fgv.br/cursos/graduacao/graduacao-em-administracao/formas-ingresso','Vestibular, ENEM e exames internacionais.'),
  ('source_pucrio_course','PUCRIO_IAG','Administração PUC-Rio','https://www.puc-rio.br/ensinopesq/ccg/administracao.html','Objetivos, formação global e ética.'),
  ('source_pucrio_iag','PUCRIO_IAG','IAG Escola de Negócios','https://iag.puc-rio.br/','Ênfases, flexibilidade e proposta da escola.'),
  ('source_pucrio_admission','PUCRIO_IAG','Ingresso PUC-Rio','https://www.puc-rio.br/vestibular/','Editais e modalidades de ingresso.'),
  ('source_mack_course','MACKENZIE','Administração Mackenzie','https://www.mackenzie.br/graduacao/sao-paulo-higienopolis/administracao','Formato e proposta acadêmica.'),
  ('source_mack_curriculum','MACKENZIE','Matriz curricular','https://www.mackenzie.br/graduacao/sao-paulo-higienopolis/administracao/matriz-curricular','Componentes curriculares do bacharelado.'),
  ('source_mack_admission','MACKENZIE','Vestibular graduação','https://www.mackenzie.br/processos-seletivos/vestibular-graduacao','Processo seletivo e formas de ingresso.'),
  ('source_fia_course','FIA','Administração FIA','https://fia.com.br/graduacao/administracao/','Objetivos, competências e duração.'),
  ('source_fia_undergrad','FIA','Graduação FIA','https://fia.com.br/graduacao/','Escola, cursos e formas de ingresso.'),
  ('source_fia_faculty','FIA','Corpo docente','https://fia.com.br/graduacao/corpo-docente/','Perfil acadêmico do corpo docente.'),
  ('source_faap_course','FAAP','Administração FAAP','https://www.faap.br/graduacao/administracao/','Curso e diferenciais.'),
  ('source_faap_bia','FAAP','Business and International Affairs','https://www.faap.br/graduacao/business-and-international-affairs/','Programa interdisciplinar e titulações.'),
  ('source_faap_admission','FAAP','Vestibular FAAP','https://vestibular.faap.br/administracao','Curso e processo de ingresso.'),
  ('source_pucminas_course','PUCMINAS','Administração PUC Minas','https://www.pucminas.br/campus/lourdes/ensino/graduacao/Paginas/Administracao.aspx','Curso e estrutura acadêmica.'),
  ('source_pucminas_profile','PUCMINAS','Como é a graduação','https://conexao.pucminas.br/blog/vida-academica/administracao-na-puc-minas/','Proposta do curso e formas de ingresso.'),
  ('source_pucminas_admission','PUCMINAS','Processo seletivo PUC Minas','https://www.pucminas.br/processoseletivo/Paginas/default.aspx','Modalidades e editais de ingresso.'),
  ('source_pucrs_course','PUCRS','Administração de Empresas','https://portal.pucrs.br/ensino/cursos/graduacao/administracao-administracao-de-empresas/','Curso e competências.'),
  ('source_pucrs_innovation','PUCRS','Inovação e Empreendedorismo','https://portal.pucrs.br/ensino/cursos/graduacao/administracao-inovacao-e-empreendedorismo/','Linha de formação prática e empreendedora.'),
  ('source_pucrs_school','PUCRS','Escola de Negócios','https://portal.pucrs.br/ensino/escola-de-negocios/','Portfólio de graduações e linhas de formação.'),
  ('source_pucpr_course','PUCPR','Administração PUCPR','https://www.pucpr.br/cursos-graduacao/administracao/','Currículo orientado a áreas funcionais e dados.'),
  ('source_pucpr_global','PUCPR','Administração Internacional','https://www.pucpr.br/cursos-graduacao/programa-de-administracao-internacional/','Experiência e formação internacional.'),
  ('source_pucpr_admission','PUCPR','Graduação PUCPR','https://www.pucpr.br/graduacao/','Formas de ingresso.'),
  ('source_unisinos_gil','UNISINOS_GIL','Gestão para Inovação e Liderança','https://www.unisinos.br/graduacao/administracao-gestao-para-inovacao-e-lideranca','Imersão, projetos e experiências internacionais.'),
  ('source_unisinos_admin','UNISINOS_GIL','Administração Unisinos','https://www.unisinos.br/graduacao/administracao','Curso e linhas de formação.'),
  ('source_unisinos_admission','UNISINOS_GIL','Ingresso Unisinos','https://www.unisinos.br/vestibular','Processo seletivo de graduação.'),
  ('source_unifor_course','UNIFOR','Administração Unifor','https://unifor.br/web/graduacao/administracao','Trilhas, acreditação e diferenciais.'),
  ('source_unifor_admission','UNIFOR','Processo seletivo Unifor','https://unifor.br/web/graduacao/processo-seletivo/inscricoes','Formas e calendário de ingresso.'),
  ('source_unifor_courses','UNIFOR','Cursos de graduação','https://unifor.br/web/graduacao/todos-os-cursos','Oferta institucional de graduação.')
) as s(source_id, university_id, source_name, url, usage_note);

insert into public.sources (source_id, university_id, source_name, url, usage_note)
select source_id, university_id, source_name, url, usage_note
from _br_private_sources
on conflict (source_id) do update set
  university_id = excluded.university_id,
  source_name = excluded.source_name,
  url = excluded.url,
  usage_note = excluded.usage_note;

create temporary table _br_private_evidence on commit drop as
select * from (values
  ('evidence_inteli_curriculum','INTELI','ADM Tech: negócios e tecnologia','Currículo','O ADM Tech combina negócios, liderança, tecnologia, dados e desenvolvimento de soluções digitais em projetos.','https://www.inteli.edu.br/adm-tech/','curriculum'),
  ('evidence_inteli_admission','INTELI','Seleção por Perfil e Projeto','Admissão','O processo seletivo avalia dimensões acadêmicas e também perfil e resolução de desafios em projeto.','https://www.inteli.edu.br/processo-seletivo/','admission'),
  ('evidence_inteli_distinctive','INTELI','Mobilidade e liderança global','Diferencial','A instituição trata experiência internacional como parte da formação de líderes e do desenvolvimento intercultural.','https://www.inteli.edu.br/experiencia-internacional/','distinctive'),
  ('evidence_ebape_curriculum','FGV_EBAPE','Formação crítica e analítica','Currículo','O curso combina rigor metodológico, pensamento crítico, teoria, prática e preparação para diferentes tipos de organização.','https://ebape.fgv.br/cursos/graduacao/graduacao-em-administracao','curriculum'),
  ('evidence_ebape_admission','FGV_EBAPE','Múltiplas formas de ingresso','Admissão','A graduação publica ingresso por vestibular, ENEM e exames internacionais, incluindo SAT e IB.','https://ebape.fgv.br/cursos/graduacao/graduacao-em-administracao/formas-ingresso','admission'),
  ('evidence_ebape_distinctive','FGV_EBAPE','Experiência internacional no currículo','Diferencial','O programa prevê intercâmbio e oferece opções de dupla graduação e percurso internacional IBEA.','https://ebape.fgv.br/cursos/graduacao/graduacao-em-administracao/programa','distinctive'),
  ('evidence_pucrio_curriculum','PUCRIO_IAG','Currículo flexível com cinco ênfases','Currículo','O curso permite direcionamento em Estratégia, Finanças, Pessoas e Processos, Ambiente Digital ou Marketing.','https://iag.puc-rio.br/','curriculum'),
  ('evidence_pucrio_admission','PUCRIO_IAG','Ingresso pela PUC-Rio','Admissão','O acesso segue as modalidades e os editais de graduação publicados pela universidade.','https://www.puc-rio.br/vestibular/','admission'),
  ('evidence_pucrio_distinctive','PUCRIO_IAG','Visão global e ética','Diferencial','A formação declara objetivo de desenvolver administradores completos, criativos e capazes de transformar a realidade social.','https://www.puc-rio.br/ensinopesq/ccg/administracao.html','distinctive'),
  ('evidence_mack_curriculum','MACKENZIE','Administração em oito semestres','Currículo','O curso presencial desenvolve líderes para gestão e inclui formação empreendedora.','https://www.mackenzie.br/graduacao/sao-paulo-higienopolis/administracao','curriculum'),
  ('evidence_mack_admission','MACKENZIE','Vestibular de graduação','Admissão','A universidade mantém processo seletivo próprio e publica as modalidades de ingresso da graduação.','https://www.mackenzie.br/processos-seletivos/vestibular-graduacao','admission'),
  ('evidence_mack_distinctive','MACKENZIE','Tradição e empregabilidade','Diferencial','A instituição associa sua proposta à tradição, inovação, ética e empregabilidade.','https://www.mackenzie.br/','distinctive'),
  ('evidence_fia_curriculum','FIA','Gestão, projetos e decisão','Currículo','A graduação forma para trabalho em equipe, liderança de projetos, gestão de negócios e tomada de decisão.','https://fia.com.br/graduacao/administracao/','curriculum'),
  ('evidence_fia_admission','FIA','Ingresso diversificado','Admissão','A FIA divulga vestibular, ENEM, transferência e certificações internacionais, com avaliação acadêmica e entrevista conforme a modalidade.','https://fia.com.br/graduacao/','admission'),
  ('evidence_fia_distinctive','FIA','Especialização institucional em Administração','Diferencial','A escola combina educação, pesquisa e consultoria em Administração com professores acadêmicos e profissionais.','https://fia.com.br/','distinctive'),
  ('evidence_faap_curriculum','FAAP','Administração presencial','Currículo','O bacharelado tem duração de quatro anos, oferta matutina e noturna e orientação a liderança e novos negócios.','https://www.faap.br/graduacao/administracao/','curriculum'),
  ('evidence_faap_admission','FAAP','Vestibular e ENEM','Admissão','A instituição divulga vestibular próprio e uso do ENEM entre suas formas de ingresso.','https://vestibular.faap.br/administracao','admission'),
  ('evidence_faap_distinctive','FAAP','Business and International Affairs','Diferencial','Administração pode integrar uma trajetória interdisciplinar com Economia e Relações Internacionais e titulações adicionais.','https://www.faap.br/graduacao/business-and-international-affairs/','distinctive'),
  ('evidence_pucminas_curriculum','PUCMINAS','Formação ampla em Administração','Currículo','A graduação oferece base generalista em gestão dentro do ambiente acadêmico e humanista da PUC Minas.','https://www.pucminas.br/campus/lourdes/ensino/graduacao/Paginas/Administracao.aspx','curriculum'),
  ('evidence_pucminas_admission','PUCMINAS','Vestibular, ENEM e seleção simplificada','Admissão','A universidade divulga vestibular, nota do ENEM e processos simplificados entre as formas de ingresso.','https://conexao.pucminas.br/blog/vida-academica/administracao-na-puc-minas/','admission'),
  ('evidence_pucminas_distinctive','PUCMINAS','Gestão com ética e propósito','Diferencial','A proposta universitária combina formação profissional, ética, responsabilidade social e extensão.','https://www.pucminas.br/','distinctive'),
  ('evidence_pucrs_curriculum','PUCRS','Administração de Empresas','Currículo','O curso desenvolve identificação de oportunidades, criação de produtos, práticas de gestão, liderança e empreendedorismo.','https://portal.pucrs.br/ensino/cursos/graduacao/administracao-administracao-de-empresas/','curriculum'),
  ('evidence_pucrs_admission','PUCRS','Ingresso na graduação','Admissão','A universidade publica vestibular, ENEM e outras modalidades para seus bacharelados.','https://portal.pucrs.br/ensino/graduacao/','admission'),
  ('evidence_pucrs_distinctive','PUCRS','Linhas de formação em negócios','Diferencial','A Escola de Negócios oferece linhas em inovação, pessoas, marketing, negócios internacionais e administração de empresas.','https://portal.pucrs.br/ensino/escola-de-negocios/','distinctive'),
  ('evidence_pucpr_curriculum','PUCPR','Decisão gerencial baseada em dados','Currículo','O curso prepara para decisões em Finanças, Marketing, Operações e Logística com base em dados e teoria.','https://www.pucpr.br/cursos-graduacao/administracao/','curriculum'),
  ('evidence_pucpr_admission','PUCPR','Diversas formas de ingresso','Admissão','A PUCPR divulga vestibular presencial, ENEM, vestibular agendado e transferência.','https://www.pucpr.br/graduacao/','admission'),
  ('evidence_pucpr_distinctive','PUCPR','Programa de Administração Internacional','Diferencial','A Escola de Negócios oferece percurso internacional para ampliar atuação global e habilidades interculturais.','https://www.pucpr.br/cursos-graduacao/programa-de-administracao-internacional/','distinctive'),
  ('evidence_unisinos_curriculum','UNISINOS_GIL','Graduação imersiva e projetos integradores','Currículo','A linha GIL usa currículo interdisciplinar, avaliações contínuas e projeto integrador a cada ciclo de aprendizagem.','https://www.unisinos.br/graduacao/administracao-gestao-para-inovacao-e-lideranca','curriculum'),
  ('evidence_unisinos_admission','UNISINOS_GIL','Ingresso anual na linha GIL','Admissão','O edital prevê ingresso anual e escolha da linha de formação no momento da inscrição.','https://www.unisinos.br/vestibular','admission'),
  ('evidence_unisinos_distinctive','UNISINOS_GIL','Duas experiências internacionais','Diferencial','A proposta do curso inclui duas experiências internacionais em universidades parceiras.','https://www.unisinos.br/graduacao/administracao-gestao-para-inovacao-e-lideranca','distinctive'),
  ('evidence_unifor_curriculum','UNIFOR','Administração com trilhas de negócios','Currículo','A graduação combina tradição, áreas funcionais, projetos e trilhas de formação conectadas ao mercado.','https://unifor.br/web/graduacao/administracao','curriculum'),
  ('evidence_unifor_admission','UNIFOR','Processo seletivo continuado','Admissão','A instituição divulga seleção continuada, ENEM e prova on-line para ingresso na graduação.','https://unifor.br/web/graduacao/processo-seletivo/inscricoes','admission'),
  ('evidence_unifor_distinctive','UNIFOR','Acreditação AACSB','Diferencial','A página oficial do curso destaca mais de 50 anos de tradição e acreditação internacional AACSB.','https://unifor.br/web/graduacao/administracao','distinctive')
) as e(evidence_id, university_id, evidence_name, evidence_type, summary, source_url, evidence_group);

insert into public.official_evidence (
  evidence_id, university_id, evidence_name, evidence_type, summary, source_url
)
select evidence_id, university_id, evidence_name, evidence_type, summary, source_url
from _br_private_evidence
on conflict (evidence_id) do update set
  university_id = excluded.university_id,
  evidence_name = excluded.evidence_name,
  evidence_type = excluded.evidence_type,
  summary = excluded.summary,
  source_url = excluded.source_url;

insert into public.evidence_dimensions (evidence_id, dimension_id)
select e.evidence_id, m.dimension_id
from _br_private_evidence e
cross join lateral (
  select dimension_id
  from (values
    ('curriculum','practical_learning'), ('curriculum','corporate_management'),
    ('curriculum','market_employability'), ('curriculum','theory_comfort'),
    ('admission','academic_perf'), ('admission','writing_argument'),
    ('admission','achievement_selectivity'), ('admission','critical_thinking'),
    ('distinctive','global_mindset'), ('distinctive','entrepreneurial_intent'),
    ('distinctive','tech_ai_orientation'), ('distinctive','leadership_evidence')
  ) as map(evidence_group, dimension_id)
  where map.evidence_group = e.evidence_group
) m
on conflict do nothing;

-- Guardrail: fail the migration if any new school lacks complete model coverage.
do $$
declare
  expected_dimensions integer;
  expected_axes integer;
  incomplete_schools integer;
begin
  select count(*) into expected_dimensions from public.dimensions;
  select count(*) into expected_axes from public.cultural_axes;

  select count(*) into incomplete_schools
  from _br_private_universities u
  where (select count(*) from public.university_dimension_weights w where w.university_id = u.university_id) <> expected_dimensions
     or (select count(*) from public.university_axis_targets a where a.university_id = u.university_id) <> expected_axes;

  if incomplete_schools > 0 then
    raise exception 'Incomplete matching coverage for % new Brazilian universities', incomplete_schools;
  end if;
end $$;
