import { supabase } from '@/lib/supabase';
import type {
  University,
  Dimension,
  CulturalAxis,
  Question,
  TextRubric,
  PillarWeight,
  UniversityDimensionWeight,
  UniversityAxisTarget,
  QuestionDimension,
  OfficialEvidence,
  EvidenceDimension,
  Source,
} from '@/types';
import type { DatabaseData } from '@/lib/api';

type QueryResult<T> = { data: T[] | null; error: unknown };

const LOAD_TIMEOUT_MS = 12_000;

const INTELI: University = {
  university_id: 'INTELI',
  name: 'Inteli',
  course: 'ADM Tech (Administração)',
  location: 'São Paulo, SP',
  format: 'Presencial — integral nos 2 primeiros anos e parcial nos 3º e 4º anos',
  positioning: 'Instituição de ensino superior orientada à interseção entre tecnologia, negócios e liderança, com formação prática baseada em projetos e forte proximidade com empresas e desafios reais',
  program_differentiators: 'Metodologia Project-Based Learning (PBL); projetos reais em equipe; integração entre administração, tecnologia, dados, inovação e liderança; ambiente de alta intensidade prática e cultura de construção, experimentação e resolução de problemas',
  admissions: 'Processo seletivo holístico em três eixos: Prova, Perfil e Projeto. O Eixo Perfil avalia redações e histórico extracurricular; o Eixo Projeto avalia raciocínio, resolução de desafios e interação em equipe. ENEM, SAT, ACT, IB e olimpíadas elegíveis podem substituir o Eixo Prova conforme edital vigente',
  values: 'Tecnologia, protagonismo, colaboração, inovação, liderança, pensamento crítico, execução, empreendedorismo, aprendizagem prática e impacto',
  high_fit_student: 'Aluno curioso, proativo e colaborativo, interessado em negócios e tecnologia, confortável com projetos em equipe, apresentações, problemas abertos e aprendizagem prática; valoriza inovação, empreendedorismo, liderança e contato com empresas',
  low_fit_student: 'Aluno que busca uma graduação predominantemente teórica e tradicional, prefere avaliações quase exclusivamente por provas individuais, evita trabalho em equipe e apresentações ou tem pouco interesse por tecnologia aplicada a negócios',
  match_rationale: 'O Inteli apresenta aderência especialmente alta para perfis que combinam business, tecnologia, projetos, liderança, pensamento analítico, autonomia e colaboração. A metodologia PBL e o processo seletivo holístico tornam evidências de execução, comunicação, pensamento crítico e trabalho em equipe particularmente relevantes para o fit',
  primary_source_url: 'https://www.inteli.edu.br/',
  image_url: null,
};

const INTELI_DIMENSION_WEIGHTS: UniversityDimensionWeight[] = Object.entries({
  academic_perf: 86,
  achievement_selectivity: 91,
  analytical_data: 96,
  autonomy_selfdirection: 94,
  brand_prestige: 87,
  conflict_handling: 92,
  corporate_management: 91,
  critical_thinking: 97,
  curiosity_learning: 98,
  decision_uncertainty: 96,
  english_level: 88,
  entrepreneurial_intent: 97,
  entrepreneurial_proof: 95,
  experimental_learning: 100,
  extracurricular_depth: 94,
  finance_markets: 78,
  global_mindset: 90,
  initiative_history: 98,
  leadership_evidence: 97,
  market_employability: 94,
  math_quant: 92,
  mobility_willingness: 84,
  networking_value: 94,
  oral_pitch: 97,
  portfolio_depth: 98,
  practical_learning: 100,
  problem_solving: 100,
  project_execution: 100,
  purpose_impact: 92,
  resilience_pressure: 94,
  rigor_depth: 90,
  startup_founder_fit: 98,
  student_life_traditional: 60,
  teamwork_collab: 100,
  tech_ai_orientation: 100,
  theory_comfort: 72,
  time_discipline: 96,
  work_experience: 90,
  writing_argument: 96,
}).map(([dimension_id, weight]) => ({ university_id: 'INTELI', dimension_id, weight }));

const INTELI_AXIS_TARGETS: UniversityAxisTarget[] = Object.entries({
  axis_01_pratica_vs_teoria: 100,
  axis_02_corporativo_vs_founder: 82,
  axis_03_local_vs_global: 88,
  axis_04_estrutura_vs_autonomia: 88,
  axis_05_individual_vs_colaborativo: 100,
  axis_06_tradicional_vs_experimental: 100,
  axis_07_prova_vs_holistico: 96,
  axis_08_tecnico_vs_proposito: 72,
  axis_09_baixa_exposicao_vs_pitch: 98,
  axis_10_baixa_ia_vs_ia_tech: 100,
  axis_11_risco_baixo_vs_risco_alto: 88,
  axis_12_financas_baixa_vs_alta: 72,
}).map(([axis_id, target]) => ({ university_id: 'INTELI', axis_id, target }));

const INTELI_EVIDENCE: OfficialEvidence[] = [
  {
    evidence_id: 'evidence_inteli_001', university_id: 'INTELI', evidence_name: 'ADM Tech — Administração', evidence_type: 'Direto institucional',
    summary: 'O processo seletivo de Graduação 2026 inclui ADM Tech (Administração), curso presencial com 80 vagas. Os dois primeiros anos são integrais e o 3º e 4º anos passam a período parcial.',
    source_url: 'https://www.inteli.edu.br/wp-content/uploads/2025/08/Edital-Processo-Seletivo-Inteli_-Graduacao-2026_OK.pdf',
  },
  {
    evidence_id: 'evidence_inteli_002', university_id: 'INTELI', evidence_name: 'Processo seletivo em três eixos', evidence_type: 'Direto do edital',
    summary: 'A seleção regular é estruturada nos Eixos Prova, Perfil e Projeto, tornando a avaliação mais ampla do que uma prova acadêmica isolada.',
    source_url: 'https://www.inteli.edu.br/wp-content/uploads/2025/08/Edital-Processo-Seletivo-Inteli_-Graduacao-2026_OK.pdf',
  },
  {
    evidence_id: 'evidence_inteli_003', university_id: 'INTELI', evidence_name: 'Eixo Perfil — redações e extracurricular', evidence_type: 'Direto do edital',
    summary: 'O Eixo Perfil avalia duas redações e histórico extracurricular, incluindo argumentação, capacidade analítica, pensamento crítico, atividades, honras e méritos.',
    source_url: 'https://www.inteli.edu.br/wp-content/uploads/2025/08/Edital-Processo-Seletivo-Inteli_-Graduacao-2026_OK.pdf',
  },
  {
    evidence_id: 'evidence_inteli_004', university_id: 'INTELI', evidence_name: 'Eixo Projeto — raciocínio e equipe', evidence_type: 'Direto do edital',
    summary: 'O Eixo Projeto avalia como o candidato desenvolve raciocínio, resolve desafios e interage com a equipe como membro de um time.',
    source_url: 'https://www.inteli.edu.br/wp-content/uploads/2025/08/Edital-Processo-Seletivo-Inteli_-Graduacao-2026_OK.pdf',
  },
  {
    evidence_id: 'evidence_inteli_005', university_id: 'INTELI', evidence_name: 'Substituição do Eixo Prova', evidence_type: 'Direto do edital',
    summary: 'O edital prevê possibilidade de uso de ENEM, SAT, ACT, IB ou olimpíadas de Matemática elegíveis em substituição ao Eixo Prova, sujeito aos critérios da edição vigente.',
    source_url: 'https://www.inteli.edu.br/wp-content/uploads/2025/08/Edital-Processo-Seletivo-Inteli_-Graduacao-2026_OK.pdf',
  },
  {
    evidence_id: 'evidence_inteli_006', university_id: 'INTELI', evidence_name: 'Modelo de ensino baseado em projetos', evidence_type: 'Direto institucional',
    summary: 'O modelo educacional do Inteli é baseado em projetos e metodologias ativas, integrando computação, negócios e liderança em desafios reais com parceiros.',
    source_url: 'https://www.inteli.edu.br/',
  },
];

const INTELI_EVIDENCE_DIMENSIONS: EvidenceDimension[] = [
  ['evidence_inteli_001', 'tech_ai_orientation'], ['evidence_inteli_001', 'corporate_management'],
  ['evidence_inteli_002', 'achievement_selectivity'], ['evidence_inteli_002', 'academic_perf'],
  ['evidence_inteli_003', 'writing_argument'], ['evidence_inteli_003', 'critical_thinking'], ['evidence_inteli_003', 'extracurricular_depth'],
  ['evidence_inteli_004', 'problem_solving'], ['evidence_inteli_004', 'teamwork_collab'], ['evidence_inteli_004', 'project_execution'], ['evidence_inteli_004', 'conflict_handling'],
  ['evidence_inteli_005', 'academic_perf'], ['evidence_inteli_005', 'math_quant'],
  ['evidence_inteli_006', 'practical_learning'], ['evidence_inteli_006', 'experimental_learning'], ['evidence_inteli_006', 'project_execution'], ['evidence_inteli_006', 'leadership_evidence'], ['evidence_inteli_006', 'tech_ai_orientation'],
].map(([evidence_id, dimension_id]) => ({ evidence_id, dimension_id }));

const INTELI_SOURCES: Source[] = [
  { source_id: 'source_inteli_001', university_id: 'INTELI', source_name: 'Site institucional Inteli', url: 'https://www.inteli.edu.br/', usage_note: 'Proposta institucional, metodologia, graduação, tecnologia, negócios, liderança e projetos.' },
  { source_id: 'source_inteli_002', university_id: 'INTELI', source_name: 'Edital Processo Seletivo Inteli — Graduação 2026', url: 'https://www.inteli.edu.br/wp-content/uploads/2025/08/Edital-Processo-Seletivo-Inteli_-Graduacao-2026_OK.pdf', usage_note: 'Cursos, vagas, formato, etapas de seleção, Eixos Prova/Perfil/Projeto e exames substitutivos.' },
  { source_id: 'source_inteli_003', university_id: 'INTELI', source_name: 'Página do Processo Seletivo 2027', url: 'https://web.inteli.edu.br/processo-seletivo-2027', usage_note: 'Página institucional vigente para acompanhamento do próximo processo seletivo.' },
];

function addInteliFallback(data: DatabaseData): DatabaseData {
  if (data.universities.some((u) => u.university_id === 'INTELI')) return data;
  return {
    ...data,
    universities: [...data.universities, INTELI],
    universityDimensionWeights: [...data.universityDimensionWeights, ...INTELI_DIMENSION_WEIGHTS],
    universityAxisTargets: [...data.universityAxisTargets, ...INTELI_AXIS_TARGETS],
    officialEvidence: [...data.officialEvidence, ...INTELI_EVIDENCE],
    evidenceDimensions: [...data.evidenceDimensions, ...INTELI_EVIDENCE_DIMENSIONS],
    sources: [...data.sources, ...INTELI_SOURCES],
  };
}

function requireReferralQuestion(data: DatabaseData): DatabaseData {
  return {
    ...data,
    questions: data.questions.map((question) =>
      question.question_id === 'Q42'
        ? {
            ...question,
            is_required: true,
            is_quick_match: true,
            question_text: 'Quem te indicou o B-School Fit? Digite o nome e sobrenome.',
            helper_text: 'Obrigatório: informe o nome e sobrenome de quem te enviou ou indicou o B-School Fit.',
          }
        : question
    ),
  };
}

async function safeQuery<T>(name: string, query: PromiseLike<QueryResult<T>>): Promise<T[]> {
  try {
    const { data, error } = await query;
    if (error) {
      console.warn(`Supabase table unavailable: ${name}`, error);
      return [];
    }
    return data ?? [];
  } catch (error) {
    console.warn(`Supabase request failed: ${name}`, error);
    return [];
  }
}

async function requiredQuery<T>(name: string, query: PromiseLike<QueryResult<T>>): Promise<T[]> {
  const result = await Promise.race([
    Promise.resolve(query),
    new Promise<never>((_, reject) =>
      window.setTimeout(() => reject(new Error(`Timeout loading ${name}`)), LOAD_TIMEOUT_MS)
    ),
  ]);
  if (result.error) throw new Error(`Required table unavailable: ${name}`);
  if (!result.data?.length) throw new Error(`Required table is empty: ${name}`);
  return result.data;
}

export async function loadDatabaseDataSafe(): Promise<DatabaseData> {
  if (!supabase) {
    console.error('Supabase client is not configured.');
    return requireReferralQuestion(addInteliFallback({
      universities: [], dimensions: [], culturalAxes: [], questions: [], textRubrics: [], pillarWeights: [],
      universityDimensionWeights: [], universityAxisTargets: [], questionDimensions: [], officialEvidence: [], evidenceDimensions: [], sources: [],
    }));
  }

  const [universities, dimensions, culturalAxes, questions, textRubrics, pillarWeights, universityDimensionWeights, universityAxisTargets, questionDimensions, officialEvidence, evidenceDimensions, sources] = await Promise.all([
    requiredQuery<University>('universities', supabase.from('universities').select('*')),
    requiredQuery<Dimension>('dimensions', supabase.from('dimensions').select('*')),
    safeQuery<CulturalAxis>('cultural_axes', supabase.from('cultural_axes').select('*')),
    requiredQuery<Question>('questions', supabase.from('questions').select('*').order('question_id')),
    safeQuery<TextRubric>('text_rubrics', supabase.from('text_rubrics').select('*')),
    safeQuery<PillarWeight>('pillar_weights', supabase.from('pillar_weights').select('*')),
    safeQuery<UniversityDimensionWeight>('university_dimension_weights', supabase.from('university_dimension_weights').select('*')),
    safeQuery<UniversityAxisTarget>('university_axis_targets', supabase.from('university_axis_targets').select('*')),
    safeQuery<QuestionDimension>('question_dimensions', supabase.from('question_dimensions').select('*')),
    safeQuery<OfficialEvidence>('official_evidence', supabase.from('official_evidence').select('*')),
    safeQuery<EvidenceDimension>('evidence_dimensions', supabase.from('evidence_dimensions').select('*')),
    safeQuery<Source>('sources', supabase.from('sources').select('*')),
  ]);

  return requireReferralQuestion(addInteliFallback({
    universities, dimensions, culturalAxes, questions, textRubrics, pillarWeights,
    universityDimensionWeights, universityAxisTargets, questionDimensions, officialEvidence, evidenceDimensions, sources,
  }));
}
