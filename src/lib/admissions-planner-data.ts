export type EnemArea = 'languages' | 'humanities' | 'nature' | 'math' | 'essay';

export interface ExamProfile {
  id: string;
  label: string;
  date: string;
  admissions: string;
  sourceUrl: string;
}

export interface AreaTarget {
  targetScore: number;
  weights: Record<EnemArea, number>;
  focusSkills: Record<EnemArea, string[]>;
}

export const ENEM_AREAS: Array<{ id: EnemArea; label: string; questions: number }> = [
  { id: 'languages', label: 'Linguagens', questions: 45 },
  { id: 'humanities', label: 'Humanas', questions: 45 },
  { id: 'nature', label: 'Natureza', questions: 45 },
  { id: 'math', label: 'Matemática', questions: 45 },
  { id: 'essay', label: 'Redação', questions: 1 },
];

export const EXAMS: Record<string, ExamProfile> = {
  enem: {
    id: 'enem',
    label: 'ENEM 2026',
    date: '2026-11-08',
    admissions: 'ENEM / Sisu ou seleção institucional com nota do ENEM',
    sourceUrl: 'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/orientacoes/cronograma',
  },
  fuvest: {
    id: 'fuvest',
    label: 'FUVEST 2027 · 1ª fase',
    date: '2026-11-01',
    admissions: 'Vestibular FUVEST; algumas vagas também podem ter outras modalidades previstas pela USP',
    sourceUrl: 'https://www.fuvest.br/fuvest-2027-fuvest-divulga-datas-da-1a-e-da-2a-fase-do-vestibular-2027/',
  },
  unicamp: {
    id: 'unicamp',
    label: 'Vestibular Unicamp 2027 · 1ª fase',
    date: '2026-10-18',
    admissions: 'Vestibular Unicamp; também existem vagas via ENEM-Unicamp, Provão Paulista e outras modalidades',
    sourceUrl: 'https://www.unicamp.br/noticias/2026/08/31/unicamp-prorroga-inscricoes-para-o-vestibular-2027-ate-8-de-setembro/',
  },
  unesp: {
    id: 'unesp',
    label: 'Vunesp/Unesp 2027 · 1ª fase',
    date: '2026-11-22',
    admissions: 'Vestibular próprio organizado pela Vunesp',
    sourceUrl: 'https://www.fuvest.br/fuvest-2027-fuvest-e-vunesp-definem-novas-datas-de-aplicacao-das-provas-da-usp-e-da-unesp/',
  },
  uerj: {
    id: 'uerj',
    label: 'UERJ 2027 · 2º Exame de Qualificação',
    date: '2026-09-06',
    admissions: 'Vestibular UERJ: Exame de Qualificação + Exame Discursivo',
    sourceUrl: 'https://www.uerj.br/noticia/uerj-abre-inscricoes-para-o-2o-exame-de-qualificacao-do-vestibular-estadual-2027-prazo-termina-no-dia-7-de-agosto/',
  },
  insper: {
    id: 'insper',
    label: 'Vestibular Insper 2027.1',
    date: '2026-10-11',
    admissions: 'Vestibular Insper ou seleção via ENEM, SAT, IB e Olimpíadas, conforme edital',
    sourceUrl: 'https://www.insper.edu.br/pt/cursos/vestibular',
  },
  fgv: {
    id: 'fgv',
    label: 'Vestibular FGV 2027.1',
    date: '2026-10-18',
    admissions: 'Vestibular FGV; cursos elegíveis também oferecem ingresso via ENEM, exames internacionais e outras modalidades',
    sourceUrl: 'https://vestibular.fgv.br/formas-de-ingresso/vestibular-fgv',
  },
};

const defaultSkills: Record<EnemArea, string[]> = {
  languages: ['Interpretação de texto', 'Gêneros textuais', 'Funções da linguagem', 'Literatura e leitura crítica'],
  humanities: ['História do Brasil', 'Geopolítica', 'Filosofia e Sociologia', 'Geografia humana e econômica'],
  nature: ['Ecologia', 'Genética', 'Química geral', 'Mecânica e eletricidade'],
  math: ['Razão e proporção', 'Funções', 'Geometria', 'Estatística e probabilidade'],
  essay: ['Tese e projeto de texto', 'Repertório', 'Coesão', 'Proposta de intervenção'],
};

const quantitative = { languages: 0.16, humanities: 0.15, nature: 0.25, math: 0.32, essay: 0.12 };
const health = { languages: 0.15, humanities: 0.12, nature: 0.34, math: 0.20, essay: 0.19 };
const humanities = { languages: 0.29, humanities: 0.28, nature: 0.10, math: 0.12, essay: 0.21 };
const business = { languages: 0.20, humanities: 0.22, nature: 0.10, math: 0.29, essay: 0.19 };
const creative = { languages: 0.29, humanities: 0.23, nature: 0.10, math: 0.12, essay: 0.26 };
const balanced = { languages: 0.20, humanities: 0.20, nature: 0.20, math: 0.20, essay: 0.20 };

const explicitTargets: Record<string, number> = {
  'Medicina': 815,
  'Direito': 765,
  'Ciência da Computação': 780,
  'Engenharia de Computação': 770,
  'Engenharia de Software': 765,
  'Sistemas de Informação': 750,
  'Análise e Desenvolvimento de Sistemas': 710,
  'Engenharia Elétrica': 755,
  'Engenharia Mecânica': 755,
  'Engenharia Civil': 745,
  'Engenharia Química': 760,
  'Engenharia de Produção': 750,
  'Arquitetura e Urbanismo': 745,
  'Psicologia': 770,
  'Odontologia': 775,
  'Farmácia': 735,
  'Biomedicina': 745,
  'Enfermagem': 720,
  'Fisioterapia': 735,
  'Nutrição': 720,
  'Medicina Veterinária': 760,
  'Administração': 735,
  'Ciências Econômicas': 755,
  'Ciências Contábeis': 720,
  'Relações Internacionais': 755,
  'Jornalismo': 725,
  'Publicidade e Propaganda': 715,
  'Design': 710,
  'Pedagogia': 680,
  'História': 690,
  'Geografia': 685,
  'Letras': 685,
  'Ciências Biológicas': 725,
  'Química': 710,
  'Física': 710,
  'Matemática': 705,
  'Agronomia': 720,
  'Educação Física': 700,
  'Serviço Social': 680,
  'Marketing': 700,
  'Logística': 680,
  'Gestão de Recursos Humanos': 670,
  'Gastronomia': 680,
  'Cinema e Audiovisual': 720,
  'Moda': 700,
  'Terapia Ocupacional': 725,
  'Fonoaudiologia': 725,
  'Relações Públicas': 710,
  'Engenharia Ambiental': 735,
  'Engenharia de Alimentos': 735,
};

export function getCourseTarget(course: string): AreaTarget {
  const normalized = course.toLowerCase();
  let weights: Record<EnemArea, number> = balanced;
  if (/medicina|odontologia|farmácia|biomedicina|enfermagem|fisioterapia|nutrição|veterinária|biológ|fono|terapia ocupacional/.test(normalized)) weights = health;
  else if (/engenharia|computação|sistemas|dados|matemática|física|química|agronomia|logística/.test(normalized)) weights = quantitative;
  else if (/direito|relações internacionais|história|geografia|letras|pedagogia|serviço social|jornalismo/.test(normalized)) weights = humanities;
  else if (/administração|economia|contábeis|marketing|recursos humanos/.test(normalized)) weights = business;
  else if (/design|arquitetura|cinema|moda|publicidade|relações públicas|gastronomia/.test(normalized)) weights = creative;

  return {
    targetScore: explicitTargets[course] ?? 715,
    weights,
    focusSkills: defaultSkills,
  };
}

export function getInstitutionExam(universityName: string): ExamProfile {
  const n = universityName.toLowerCase();
  if (/usp|universidade de são paulo/.test(n)) return EXAMS.fuvest;
  if (/unicamp|campinas estadual/.test(n)) return EXAMS.unicamp;
  if (/unesp/.test(n)) return EXAMS.unesp;
  if (/uerj/.test(n)) return EXAMS.uerj;
  if (/insper/.test(n)) return EXAMS.insper;
  if (/fgv|fundação getulio vargas/.test(n)) return EXAMS.fgv;
  return EXAMS.enem;
}

export function getInstitutionAdjustment(universityName: string, institutionType?: string | null): number {
  const n = universityName.toLowerCase();
  if (/usp|unicamp|ufrj|ufmg|unb|ufrgs|ufsc|ufpr|ufpe|ufba|uerj|unesp/.test(n)) return 18;
  if (/fgv|insper|einstein|puc-rio|puc-sp|mackenzie/.test(n)) return 10;
  if (institutionType === 'public') return 8;
  return 0;
}

export function estimatedTargetScore(course: string, universityName: string, institutionType?: string | null): number {
  const base = getCourseTarget(course).targetScore;
  return Math.min(835, base + getInstitutionAdjustment(universityName, institutionType));
}

export function daysUntil(date: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${date}T12:00:00`);
  return Math.max(0, Math.ceil((target.getTime() - today.getTime()) / 86400000));
}
