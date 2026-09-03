export type ExamId = 'enem' | 'fuvest' | 'insper' | 'link' | 'cmmg';

export type ExamMetric = {
  key: string;
  label: string;
  max: number;
  defaultValue: number;
  unit: 'acertos' | 'pontos' | 'desempenho';
  phase?: string;
};

export type ExamModel = {
  examId: ExamId;
  title: string;
  structure: string;
  metrics: ExamMetric[];
  allowedQuestionAreas: string[];
  officialSource: string;
};

const ENEM_METRICS: ExamMetric[] = [
  { key: 'Linguagens', label: 'Linguagens', max: 45, defaultValue: 28, unit: 'acertos' },
  { key: 'Humanas', label: 'Ciências Humanas', max: 45, defaultValue: 29, unit: 'acertos' },
  { key: 'Natureza', label: 'Ciências da Natureza', max: 45, defaultValue: 24, unit: 'acertos' },
  { key: 'Matemática', label: 'Matemática', max: 45, defaultValue: 26, unit: 'acertos' },
  { key: 'Redação', label: 'Redação', max: 1000, defaultValue: 760, unit: 'pontos' },
];

const CMMG_MEDICINA_METRICS: ExamMetric[] = [
  { key: 'Língua Portuguesa', label: 'Língua Portuguesa', max: 8, defaultValue: 5, unit: 'acertos' },
  { key: 'Literatura', label: 'Literatura', max: 4, defaultValue: 2, unit: 'acertos' },
  { key: 'Inglês', label: 'Língua Estrangeira — Inglês', max: 12, defaultValue: 7, unit: 'acertos' },
  { key: 'Biologia', label: 'Biologia', max: 14, defaultValue: 9, unit: 'acertos' },
  { key: 'Física', label: 'Física', max: 4, defaultValue: 2, unit: 'acertos' },
  { key: 'Química', label: 'Química', max: 8, defaultValue: 5, unit: 'acertos' },
  { key: 'Matemática', label: 'Matemática', max: 10, defaultValue: 6, unit: 'acertos' },
  { key: 'Redação', label: 'Redação', max: 80, defaultValue: 52, unit: 'pontos' },
];

const CMMG_EFFPO_METRICS: ExamMetric[] = [
  { key: 'Linguagens', label: 'Língua Portuguesa + Literatura', max: 15, defaultValue: 9, unit: 'acertos' },
  { key: 'Biologia', label: 'Biologia', max: 15, defaultValue: 9, unit: 'acertos' },
  { key: 'Humanas', label: 'Conhecimentos Gerais', max: 10, defaultValue: 6, unit: 'acertos' },
  { key: 'Redação', label: 'Redação', max: 80, defaultValue: 52, unit: 'pontos' },
];

const INSPER_METRICS: ExamMetric[] = [
  { key: 'Linguagens', label: 'Linguagens e Códigos', max: 15, defaultValue: 9, unit: 'acertos' },
  { key: 'Matemática', label: 'Matemática', max: 15, defaultValue: 9, unit: 'acertos' },
  { key: 'Humanas', label: 'Ciências Humanas', max: 15, defaultValue: 9, unit: 'acertos' },
  { key: 'Natureza', label: 'Ciências da Natureza', max: 15, defaultValue: 9, unit: 'acertos' },
  { key: 'Redação', label: 'Redação dissertativo-argumentativa', max: 100, defaultValue: 65, unit: 'desempenho' },
];

const LINK_METRICS: ExamMetric[] = [
  { key: 'Matemática', label: 'Prova de Matemática', max: 100, defaultValue: 65, unit: 'desempenho' },
  { key: 'Business Case', label: 'Caso de negócios', max: 100, defaultValue: 58, unit: 'desempenho' },
  { key: 'Escrita', label: 'Entrega escrita', max: 100, defaultValue: 68, unit: 'desempenho' },
  { key: 'Oral', label: 'Entregas em vídeo / comunicação oral', max: 100, defaultValue: 70, unit: 'desempenho' },
  { key: 'Portfólio', label: 'PREP / portfólio', max: 100, defaultValue: 62, unit: 'desempenho' },
  { key: 'Entrevista', label: 'Entrevista final', max: 100, defaultValue: 65, unit: 'desempenho' },
];

const FUVEST_SECOND_PHASE: Record<string, string[]> = {
  'Administração': ['Geografia', 'História', 'Matemática'],
  'Arquitetura e Urbanismo': ['Física', 'Geografia', 'História'],
  'Biomedicina': ['Biologia', 'Física', 'Matemática', 'Química'],
  'Ciência da Computação': ['Física', 'Matemática'],
  'Ciências Biológicas': ['Biologia', 'Matemática', 'Química'],
  'Ciências Contábeis': ['Geografia', 'História', 'Matemática'],
  'Ciências Econômicas': ['Geografia', 'História', 'Matemática'],
  'Design': ['Física', 'Geografia', 'História'],
  'Direito': ['Geografia', 'História', 'Matemática'],
  'Educação Física': ['Biologia', 'Física', 'História', 'Matemática'],
  'Enfermagem': ['Biologia', 'Geografia', 'Química'],
  'Engenharia Ambiental': ['Física', 'Matemática', 'Química'],
  'Engenharia Civil': ['Física', 'Matemática', 'Química'],
  'Engenharia de Alimentos': ['Física', 'Matemática', 'Química'],
  'Engenharia de Computação': ['Física', 'Matemática', 'Química'],
  'Engenharia de Produção': ['Física', 'Matemática', 'Química'],
  'Engenharia Elétrica': ['Física', 'Matemática', 'Química'],
  'Engenharia Mecânica': ['Física', 'Matemática', 'Química'],
  'Engenharia Química': ['Física', 'Matemática', 'Química'],
  'Farmácia': ['Biologia', 'Física', 'Química'],
  'Física': ['Física', 'Matemática'],
  'Fisioterapia': ['Biologia', 'Física', 'Geografia', 'Química'],
  'Fonoaudiologia': ['Biologia', 'Física', 'Geografia'],
  'Geografia': ['Geografia', 'História'],
  'História': ['Geografia', 'História'],
  'Jornalismo': ['Geografia', 'História'],
  'Letras': ['Geografia', 'História'],
  'Matemática': ['Física', 'Matemática'],
  'Medicina': ['Biologia', 'Física', 'Geografia', 'Química'],
  'Medicina Veterinária': ['Biologia', 'Física', 'Química'],
  'Nutrição': ['Biologia', 'Geografia', 'História', 'Química'],
  'Odontologia': ['Biologia', 'Física', 'Matemática', 'Química'],
  'Pedagogia': ['Geografia', 'História'],
  'Psicologia': ['Biologia', 'História', 'Matemática'],
  'Publicidade e Propaganda': ['Geografia', 'História'],
  'Química': ['Física', 'Matemática', 'Química'],
  'Relações Internacionais': ['Geografia', 'História'],
  'Relações Públicas': ['Geografia', 'História', 'Matemática'],
  'Sistemas de Informação': ['Física', 'Matemática'],
  'Terapia Ocupacional': ['Biologia', 'Geografia', 'História'],
};

const CMMG_EFFPO_COURSES = ['Enfermagem', 'Fisioterapia', 'Fonoaudiologia', 'Odontologia', 'Psicologia'];

const UFMG_VERIFIED_COURSES = new Set([
  'Administração', 'Agronomia', 'Arquitetura e Urbanismo', 'Biomedicina', 'Ciência da Computação',
  'Ciências Biológicas', 'Ciências Contábeis', 'Ciências Econômicas', 'Design', 'Direito',
  'Educação Física', 'Enfermagem', 'Engenharia Ambiental', 'Engenharia Civil', 'Engenharia de Alimentos',
  'Engenharia de Computação', 'Engenharia de Produção', 'Engenharia Elétrica', 'Engenharia Mecânica',
  'Engenharia Química', 'Farmácia', 'Física', 'Fisioterapia', 'Fonoaudiologia', 'Geografia', 'História',
  'Jornalismo', 'Letras', 'Matemática', 'Medicina', 'Medicina Veterinária', 'Nutrição', 'Odontologia',
  'Pedagogia', 'Psicologia', 'Publicidade e Propaganda', 'Química', 'Relações Públicas',
  'Sistemas de Informação', 'Terapia Ocupacional',
]);

export const supportedFuvestCourse = (course: string) => Boolean(FUVEST_SECOND_PHASE[course]);

export function getExamId(university: string): ExamId {
  const name = university.toLowerCase();
  if (name.includes('ciências médicas') || name.includes('ciencias medicas')) return 'cmmg';
  if (name.includes('insper')) return 'insper';
  if (name.includes('link school')) return 'link';
  if (name === 'usp' || name.includes('universidade de são paulo') || name.includes('universidade de sao paulo')) return 'fuvest';
  return 'enem';
}

export function getExamModel(university: string, course: string): ExamModel {
  const examId = getExamId(university);

  if (examId === 'cmmg') {
    if (CMMG_EFFPO_COURSES.includes(course)) {
      return {
        examId,
        title: `Vestibular Ciências Médicas-MG — ${course}`,
        structure: '40 questões objetivas: 15 de Língua Portuguesa + Literatura, 15 de Biologia e 10 de Conhecimentos Gerais (Geografia, História, Filosofia e Sociologia), mais uma Redação. Não há Inglês, Física, Química ou Matemática neste modelo.',
        metrics: CMMG_EFFPO_METRICS,
        allowedQuestionAreas: ['Linguagens', 'Língua Portuguesa', 'Literatura', 'Biologia', 'Humanas', 'Conhecimentos Gerais', 'Geografia', 'História', 'Filosofia', 'Sociologia', 'Redação'],
        officialSource: 'https://vestibular.cmmg.edu.br/wp-content/uploads/2026/07/Manual-do-Candidato-EFFPO-1_2027.pdf',
      };
    }
    return {
      examId,
      title: 'Vestibular Medicina Ciências Médicas-MG',
      structure: '60 questões objetivas: Português 8, Literatura 4, Inglês 12, Biologia 14, Física 4, Química 8 e Matemática 10, mais uma redação de 80 pontos.',
      metrics: CMMG_MEDICINA_METRICS,
      allowedQuestionAreas: ['Língua Portuguesa', 'Literatura', 'Inglês', 'Linguagens', 'Biologia', 'Física', 'Química', 'Matemática', 'Redação'],
      officialSource: 'https://vestibular.cmmg.edu.br/wp-content/uploads/2026/07/Manual-do-Candidato-Medicina-1_2027.pdf',
    };
  }

  if (examId === 'insper') {
    return {
      examId,
      title: 'Vestibular Insper',
      structure: 'Uma fase: 60 questões objetivas, com 15 de Linguagens, 15 de Matemática, 15 de Ciências Humanas e 15 de Ciências da Natureza, mais uma redação dissertativo-argumentativa.',
      metrics: INSPER_METRICS,
      allowedQuestionAreas: ['Linguagens', 'Matemática', 'Humanas', 'Natureza', 'Redação'],
      officialSource: 'https://www.insper.edu.br/pt/cursos/vestibular',
    };
  }

  if (examId === 'link') {
    return {
      examId,
      title: 'Jornada de admissão Link',
      structure: 'Processo holístico com PREP, Link SPRINT e entrevista. O SPRINT inclui prova de Matemática e caso de negócios com entrega escrita e entregas em vídeo.',
      metrics: LINK_METRICS,
      allowedQuestionAreas: ['Business Case', 'Comunicação', 'Entrevista', 'PREP', 'SPRINT', 'Mindset', 'Matemática'],
      officialSource: 'https://lsb.edu.br/pt-br/adm',
    };
  }

  if (examId === 'fuvest') {
    const specific = FUVEST_SECOND_PHASE[course] ?? [];
    const specificMetrics: ExamMetric[] = specific.map((subject) => ({
      key: `2ª fase — ${subject}`,
      label: `${subject} — 2ª fase`,
      max: 100,
      defaultValue: 60,
      unit: 'desempenho',
      phase: '2ª fase',
    }));
    return {
      examId,
      title: `FUVEST 2027 — ${course}`,
      structure: `1ª fase: 80 questões com todos os componentes do ensino médio. 2ª fase: Português + Redação no 1º dia; no 2º dia, 12 questões específicas de ${specific.join(', ') || 'disciplinas definidas pela carreira'}.`,
      metrics: [
        { key: '1ª fase', label: '1ª fase — prova geral', max: 80, defaultValue: 52, unit: 'acertos', phase: '1ª fase' },
        { key: 'Português', label: 'Português — 2ª fase', max: 50, defaultValue: 30, unit: 'pontos', phase: '2ª fase' },
        { key: 'Redação', label: 'Redação — 2ª fase', max: 50, defaultValue: 31, unit: 'pontos', phase: '2ª fase' },
        ...specificMetrics,
      ],
      allowedQuestionAreas: ['1ª fase', 'Português', 'Redação', ...specific],
      officialSource: 'https://www.fuvest.br/vestibular-da-usp/',
    };
  }

  return {
    examId,
    title: `ENEM / SiSU — ${course} na UFMG`,
    structure: 'ENEM em dois dias: 45 questões de Linguagens, 45 de Ciências Humanas, 45 de Ciências da Natureza, 45 de Matemática e uma Redação de 0 a 1000 pontos. A UFMG usa o ENEM no SiSU; pesos e notas mínimas podem variar por curso.',
    metrics: ENEM_METRICS,
    allowedQuestionAreas: ['Linguagens', 'Humanas', 'Natureza', 'Matemática', 'Redação'],
    officialSource: 'https://www.ufmg.br/sisu/',
  };
}

export function isSupportedInstitutionCourse(university: string, course: string) {
  if (university === 'UFMG') return UFMG_VERIFIED_COURSES.has(course);
  if (university === 'USP') return supportedFuvestCourse(course);
  if (university === 'Faculdade Ciências Médicas de Minas Gerais') return course === 'Medicina' || CMMG_EFFPO_COURSES.includes(course);
  if (university === 'Link School of Business') return course === 'Administração';
  if (university === 'Insper') return ['Administração', 'Ciências Econômicas', 'Direito', 'Ciência da Computação', 'Engenharia de Computação', 'Engenharia de Produção', 'Engenharia Mecânica', 'Engenharia Mecatrônica'].includes(course);
  return false;
}
