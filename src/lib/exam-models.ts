export type ExamId = 'enem' | 'fuvest' | 'insper' | 'link' | 'fgv' | 'cmmg' | 'ibmec' | 'einstein';

export type ExamMetric = {
  key: string;
  label: string;
  max: number;
  defaultValue: number;
  unit: 'acertos' | 'pontos' | 'desempenho';
  phase?: string;
  weight?: number;
  minimum?: number;
  goal?: number;
  studyArea?: string;
};

export type ExamTarget = {
  value: number;
  max?: number;
  kind?: string;
  year?: number;
  modality?: string;
  label?: string;
  sourceUrl?: string;
  confidence?: string;
};

export type RemoteExamModelRow = {
  university_name: string;
  course_label: string;
  exam_id: string;
  route_key?: string | null;
  route_label?: string | null;
  practice_exam_id?: string | null;
  source_confidence?: string | null;
  cycle_label?: string | null;
  structure_verified?: boolean | null;
  notes?: string | null;
  official_source_url?: string | null;
  model?: Record<string, unknown> | null;
};

export type ExamModel = {
  examId: ExamId;
  title: string;
  structure: string;
  metrics: ExamMetric[];
  allowedQuestionAreas: string[];
  officialSource: string;
  admissionExamId?: string;
  routeKey?: string;
  routeLabel?: string;
  cycleLabel?: string;
  scoreInputHelp?: string;
  sourceConfidence?: string;
  structureVerified?: boolean;
  notes?: string;
  overall?: { method: 'weighted_average' | 'weighted_sum' | 'sum' | 'mean' | 'percentage'; max?: number };
  target?: ExamTarget;
};

const ENEM_METRICS: ExamMetric[] = [
  { key: 'Linguagens', label: 'Linguagens', max: 1000, defaultValue: 620, unit: 'pontos', weight: 1, studyArea: 'Linguagens' },
  { key: 'Humanas', label: 'Ciências Humanas', max: 1000, defaultValue: 640, unit: 'pontos', weight: 1, studyArea: 'Humanas' },
  { key: 'Natureza', label: 'Ciências da Natureza', max: 1000, defaultValue: 610, unit: 'pontos', weight: 1, studyArea: 'Natureza' },
  { key: 'Matemática', label: 'Matemática', max: 1000, defaultValue: 650, unit: 'pontos', weight: 1, studyArea: 'Matemática' },
  { key: 'Redação', label: 'Redação', max: 1000, defaultValue: 800, unit: 'pontos', weight: 1, studyArea: 'Redação' },
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

const IBMEC_METRICS: ExamMetric[] = [
  { key: 'Linguagens', label: 'Português + Literatura + Inglês', max: 25, defaultValue: 15, unit: 'acertos' },
  { key: 'Matemática', label: 'Matemática e Raciocínio Lógico', max: 15, defaultValue: 9, unit: 'acertos' },
  { key: 'Humanas', label: 'História + Geografia', max: 10, defaultValue: 6, unit: 'acertos' },
  { key: 'Redação', label: 'Redação', max: 100, defaultValue: 65, unit: 'desempenho' },
  { key: 'Dinâmica', label: 'Dinâmica / competências socioemocionais', max: 100, defaultValue: 65, unit: 'desempenho' },
];

const EINSTEIN_BASE_METRICS: ExamMetric[] = [
  { key: 'Linguagens', label: 'Português (10) + Inglês (5)', max: 15, defaultValue: 9, unit: 'acertos', phase: 'prova escrita' },
  { key: 'Humanas', label: 'História (5) + Geografia (5)', max: 10, defaultValue: 6, unit: 'acertos', phase: 'prova escrita' },
  { key: 'Natureza', label: 'Biologia + Química + Física', max: 15, defaultValue: 9, unit: 'acertos', phase: 'prova escrita' },
  { key: 'Matemática', label: 'Matemática', max: 10, defaultValue: 6, unit: 'acertos', phase: 'prova escrita' },
  { key: 'Dissertativas', label: '5 questões analítico-dissertativas', max: 30, defaultValue: 18, unit: 'pontos', phase: 'prova escrita' },
  { key: 'Redação', label: 'Redação', max: 20, defaultValue: 12, unit: 'pontos', phase: 'prova escrita' },
];

const LINK_METRICS: ExamMetric[] = [
  { key: 'Matemática', label: 'Prova de Matemática', max: 100, defaultValue: 65, unit: 'desempenho' },
  { key: 'Business Case', label: 'Caso de negócios', max: 100, defaultValue: 58, unit: 'desempenho' },
  { key: 'Escrita', label: 'Entrega escrita', max: 100, defaultValue: 68, unit: 'desempenho' },
  { key: 'Oral', label: 'Entregas em vídeo / comunicação oral', max: 100, defaultValue: 70, unit: 'desempenho' },
  { key: 'Portfólio', label: 'PREP / portfólio', max: 100, defaultValue: 62, unit: 'desempenho' },
  { key: 'Entrevista', label: 'Entrevista final', max: 100, defaultValue: 65, unit: 'desempenho' },
];

const FGV_ADMIN_METRICS: ExamMetric[] = [
  { key: 'Matemática objetiva', label: 'Matemática — 1ª fase', max: 10, defaultValue: 6, unit: 'desempenho', phase: '1ª fase' },
  { key: 'Língua Portuguesa', label: 'Língua Portuguesa — 1ª fase', max: 10, defaultValue: 6, unit: 'desempenho', phase: '1ª fase' },
  { key: 'Inglês', label: 'Inglês — 1ª fase', max: 10, defaultValue: 6, unit: 'desempenho', phase: '1ª fase' },
  { key: 'Ciências Humanas', label: 'Ciências Humanas — 1ª fase', max: 10, defaultValue: 6, unit: 'desempenho', phase: '1ª fase' },
  { key: 'Matemática discursiva', label: 'Matemática discursiva — 2ª fase', max: 10, defaultValue: 6, unit: 'desempenho', phase: '2ª fase' },
  { key: 'Redação', label: 'Redação — 2ª fase', max: 10, defaultValue: 6, unit: 'desempenho', phase: '2ª fase' },
];

const FGV_AP_METRICS: ExamMetric[] = [
  { key: 'Matemática objetiva', label: 'Matemática — 1ª fase', max: 10, defaultValue: 6, unit: 'desempenho', phase: '1ª fase' },
  { key: 'Língua Portuguesa', label: 'Língua Portuguesa — 1ª fase', max: 10, defaultValue: 6, unit: 'desempenho', phase: '1ª fase' },
  { key: 'Inglês', label: 'Inglês — 1ª fase', max: 10, defaultValue: 6, unit: 'desempenho', phase: '1ª fase' },
  { key: 'Ciências Humanas', label: 'Ciências Humanas — 1ª fase', max: 10, defaultValue: 6, unit: 'desempenho', phase: '1ª fase' },
  { key: 'Ciências Humanas discursiva', label: 'Ciências Humanas discursiva — 2ª fase', max: 10, defaultValue: 6, unit: 'desempenho', phase: '2ª fase' },
  { key: 'Redação', label: 'Redação — 2ª fase', max: 10, defaultValue: 6, unit: 'desempenho', phase: '2ª fase' },
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

export const SITE_PLANNER_COURSES = [
  'Administração','Agronomia','Análise e Desenvolvimento de Sistemas','Arquitetura e Urbanismo','Biomedicina',
  'Ciência da Computação','Ciências Biológicas','Ciências Contábeis','Ciências Econômicas','Cinema e Audiovisual',
  'Design','Direito','Educação Física','Enfermagem','Engenharia Ambiental','Engenharia Biomédica','Engenharia Civil',
  'Engenharia de Alimentos','Engenharia de Computação','Engenharia de Produção','Engenharia de Software','Engenharia Elétrica',
  'Engenharia Mecânica','Engenharia Química','Farmácia','Física','Fisioterapia','Fonoaudiologia','Gastronomia','Geografia',
  'Gestão de Recursos Humanos','História','Jornalismo','Letras','Logística','Marketing','Matemática','Medicina',
  'Medicina Veterinária','Moda','Nutrição','Odontologia','Pedagogia','Psicologia','Publicidade e Propaganda','Química',
  'Relações Internacionais','Relações Públicas','Serviço Social','Sistemas de Informação','Terapia Ocupacional',
] as const;
const SITE_PLANNER_COURSE_SET = new Set<string>(SITE_PLANNER_COURSES);

const CMMG_EFFPO_COURSES = ['Enfermagem', 'Fisioterapia', 'Fonoaudiologia', 'Odontologia', 'Psicologia'];
const IBMEC_VERIFIED_COURSES = new Set(['Administração','Análise e Desenvolvimento de Sistemas','Arquitetura e Urbanismo','Ciências Contábeis','Ciências Econômicas','Publicidade e Propaganda','Direito','Engenharia Civil','Engenharia de Computação','Engenharia de Produção','Engenharia de Software','Relações Internacionais']);
const EINSTEIN_VERIFIED_COURSES = new Set(['Administração','Enfermagem','Engenharia Biomédica','Fisioterapia','Medicina','Nutrição','Odontologia','Psicologia']);
const FGV_VERIFIED_COURSES = new Set(['Administração','Administração Pública']);
const INSPER_VERIFIED_COURSES = new Set(['Administração','Ciências Econômicas','Direito','Ciência da Computação','Engenharia de Computação','Engenharia de Produção','Engenharia Mecânica','Engenharia Mecatrônica']);

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

export type SupportedPlannerInstitution = { university:string; courses:string[] };

export function getSupportedPlannerCourseMatrix():SupportedPlannerInstitution[] {
  return [
    {university:'ENEM — plano geral',courses:[...SITE_PLANNER_COURSES]},
    {university:'UFMG',courses:[...UFMG_VERIFIED_COURSES]},
    {university:'USP',courses:Object.keys(FUVEST_SECOND_PHASE)},
    {university:'Faculdade Ciências Médicas de Minas Gerais',courses:['Medicina',...CMMG_EFFPO_COURSES]},
    {university:'Faculdade Israelita de Ciências da Saúde Albert Einstein',courses:[...EINSTEIN_VERIFIED_COURSES]},
    {university:'Ibmec',courses:[...IBMEC_VERIFIED_COURSES]},
    {university:'Link School of Business',courses:['Administração']},
    {university:'Insper',courses:[...INSPER_VERIFIED_COURSES]},
    {university:'FGV EAESP',courses:[...FGV_VERIFIED_COURSES]},
  ];
}


const CORE_EXAM_IDS = new Set<ExamId>(['enem','fuvest','insper','link','fgv','cmmg','ibmec','einstein']);

function asCoreExamId(value: unknown, fallback: ExamId): ExamId {
  return typeof value === 'string' && CORE_EXAM_IDS.has(value as ExamId) ? value as ExamId : fallback;
}

function numberOr(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function mergeRemoteExamModel(base: ExamModel, row?: RemoteExamModelRow | null): ExamModel {
  if (!row) return base;
  const raw = row.model && typeof row.model === 'object' ? row.model as Record<string, unknown> : {};
  const rawComponents = Array.isArray(raw.components) ? raw.components as Array<Record<string, unknown>> : [];
  const metrics: ExamMetric[] = rawComponents.length ? rawComponents.map((component, index) => {
    const baseMetric = base.metrics.find(metric => metric.key === component.key) ?? base.metrics[index];
    const unitRaw = String(component.unit ?? baseMetric?.unit ?? 'pontos');
    const unit: ExamMetric['unit'] = unitRaw === 'acertos' || unitRaw === 'desempenho' ? unitRaw : 'pontos';
    const max = Math.max(1, numberOr(component.max, baseMetric?.max ?? 100));
    const rawDefault = numberOr(component.defaultValue ?? component.default_value, baseMetric?.defaultValue ?? Math.round(max * .65));
    return {
      key: String(component.key ?? baseMetric?.key ?? `Componente ${index + 1}`),
      label: String(component.label ?? component.key ?? baseMetric?.label ?? `Componente ${index + 1}`),
      max,
      defaultValue: Math.max(0, Math.min(max, rawDefault)),
      unit,
      phase: component.phase ? String(component.phase) : baseMetric?.phase,
      weight: Number.isFinite(Number(component.weight)) ? Number(component.weight) : baseMetric?.weight,
      minimum: Number.isFinite(Number(component.minimum ?? component.min)) ? Number(component.minimum ?? component.min) : undefined,
      goal: Number.isFinite(Number(component.goal)) ? Number(component.goal) : undefined,
      studyArea: component.studyArea || component.study_area ? String(component.studyArea ?? component.study_area) : baseMetric?.studyArea,
    };
  }) : base.metrics;

  const rawOverall = raw.overall && typeof raw.overall === 'object' ? raw.overall as Record<string, unknown> : null;
  const methodRaw = String(rawOverall?.method ?? '');
  const overall = ['weighted_average','weighted_sum','sum','mean','percentage'].includes(methodRaw)
    ? { method: methodRaw as NonNullable<ExamModel['overall']>['method'], max: Number.isFinite(Number(rawOverall?.max)) ? Number(rawOverall?.max) : undefined }
    : base.overall;

  const rawTarget = raw.target && typeof raw.target === 'object' ? raw.target as Record<string, unknown> : null;
  const targetValue = Number(rawTarget?.value);
  const target = Number.isFinite(targetValue) ? {
    value: targetValue,
    max: Number.isFinite(Number(rawTarget?.max)) ? Number(rawTarget?.max) : undefined,
    kind: rawTarget?.kind ? String(rawTarget.kind) : undefined,
    year: Number.isFinite(Number(rawTarget?.year)) ? Number(rawTarget?.year) : undefined,
    modality: rawTarget?.modality ? String(rawTarget.modality) : undefined,
    label: rawTarget?.label ? String(rawTarget.label) : undefined,
    sourceUrl: rawTarget?.sourceUrl || rawTarget?.source_url ? String(rawTarget.sourceUrl ?? rawTarget.source_url) : undefined,
    confidence: rawTarget?.confidence ? String(rawTarget.confidence) : undefined,
  } : base.target;

  const practiceExamId = asCoreExamId(row.practice_exam_id, base.examId);
  const allowedQuestionAreas = Array.isArray(raw.allowedQuestionAreas ?? raw.allowed_question_areas)
    ? (raw.allowedQuestionAreas ?? raw.allowed_question_areas as unknown[]).map(String)
    : metrics.map(metric => metric.studyArea ?? metric.key);

  return {
    ...base,
    examId: practiceExamId,
    admissionExamId: row.exam_id || base.admissionExamId || base.examId,
    routeKey: row.route_key || base.routeKey || 'primary',
    routeLabel: row.route_label || (raw.routeLabel ? String(raw.routeLabel) : base.routeLabel),
    cycleLabel: row.cycle_label || (raw.cycleLabel ? String(raw.cycleLabel) : base.cycleLabel),
    sourceConfidence: row.source_confidence || base.sourceConfidence,
    structureVerified: row.structure_verified ?? base.structureVerified,
    notes: row.notes || (raw.notes ? String(raw.notes) : base.notes),
    title: raw.title ? String(raw.title) : base.title,
    structure: raw.structure ? String(raw.structure) : base.structure,
    scoreInputHelp: raw.scoreInputHelp || raw.score_input_help ? String(raw.scoreInputHelp ?? raw.score_input_help) : base.scoreInputHelp,
    officialSource: row.official_source_url || (raw.officialSource ? String(raw.officialSource) : base.officialSource),
    metrics,
    allowedQuestionAreas,
    overall,
    target,
  };
}

export function calculateExamScore(model: ExamModel, values: Record<string, number>) {
  const rows = model.metrics.map(metric => ({
    metric,
    value: Math.max(0, Math.min(metric.max, Number(values[metric.key] ?? metric.defaultValue))),
    weight: Number.isFinite(Number(metric.weight)) && Number(metric.weight) > 0 ? Number(metric.weight) : 1,
  }));
  if (!rows.length) return 0;
  const method = model.overall?.method ?? 'mean';
  if (method === 'weighted_average') {
    const totalWeight = rows.reduce((sum, row) => sum + row.weight, 0) || 1;
    return rows.reduce((sum, row) => sum + row.value * row.weight, 0) / totalWeight;
  }
  if (method === 'weighted_sum') return rows.reduce((sum, row) => sum + row.value * row.weight, 0);
  if (method === 'sum') return rows.reduce((sum, row) => sum + row.value, 0);
  if (method === 'percentage') {
    const earned = rows.reduce((sum, row) => sum + row.value * row.weight, 0);
    const possible = rows.reduce((sum, row) => sum + row.metric.max * row.weight, 0) || 1;
    return earned / possible * (model.overall?.max ?? 100);
  }
  return rows.reduce((sum, row) => sum + row.value, 0) / rows.length;
}

export function normalizeStoredScores(model: ExamModel, stored: Record<string, number> | null | undefined) {
  const source = stored && typeof stored === 'object' ? stored : {};
  const next: Record<string, number> = {};
  for (const metric of model.metrics) {
    const raw = Number(source[metric.key]);
    const legacyEnemAcertos = model.examId === 'enem' && metric.key !== 'Redação' && metric.max === 1000 && Number.isFinite(raw) && raw >= 0 && raw <= 45;
    next[metric.key] = Number.isFinite(raw) && !legacyEnemAcertos
      ? Math.max(0, Math.min(metric.max, raw))
      : metric.defaultValue;
  }
  return next;
}

export const supportedFuvestCourse = (course: string) => Boolean(FUVEST_SECOND_PHASE[course]);

export function getExamId(university: string): ExamId {
  const name = university.toLowerCase();
  if (name.includes('ciências médicas') || name.includes('ciencias medicas')) return 'cmmg';
  if (name.includes('albert einstein') || name.includes('israelita de ciências da saúde') || name.includes('israelita de ciencias da saude')) return 'einstein';
  if (name.includes('ibmec')) return 'ibmec';
  if (name.includes('insper')) return 'insper';
  if (name.includes('link school')) return 'link';
  if (name === 'fgv' || name.includes('fgv eaesp') || name.includes('fundação getulio vargas') || name.includes('fundacao getulio vargas')) return 'fgv';
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

  if (examId === 'einstein') {
    const medicine = course === 'Medicina';
    return {
      examId,
      title: `Vestibular Unificado Einstein 2027 — ${course}`,
      structure: `Prova escrita em 11/10/2026, com 50 objetivas (Português 10, Inglês 5, História 5, Geografia 5, Biologia 5, Química 5, Física 5 e Matemática 10), 5 questões analítico-dissertativas e 1 redação.${medicine?' Para Medicina, há uma 2ª fase com Múltiplas Minientrevistas (MME).':''}`,
      metrics: medicine ? [...EINSTEIN_BASE_METRICS,{key:'MME',label:'Múltiplas Minientrevistas (MME)',max:100,defaultValue:65,unit:'desempenho',phase:'2ª fase'}] : EINSTEIN_BASE_METRICS,
      allowedQuestionAreas: ['Linguagens','Língua Portuguesa','Inglês','Humanas','História','Geografia','Natureza','Biologia','Química','Física','Matemática','Dissertativas','Redação','MME'],
      officialSource: 'https://www.vunesp.com.br/FEAE2602',
    };
  }

  if (examId === 'ibmec') {
    return {
      examId,
      title: `Vestibular Ibmec 2027.1 — ${course}`,
      structure: 'Vestibular com 50 questões objetivas e redação, seguido por dinâmica/avaliação de competências conforme a unidade e o processo vigente. A prova objetiva trabalha Língua Portuguesa, Literatura, Língua Inglesa, Matemática e Raciocínio Lógico, História e Geografia. O Ibmec também oferece ingresso via ENEM e certificações internacionais.',
      metrics: IBMEC_METRICS,
      allowedQuestionAreas: ['Linguagens','Língua Portuguesa','Literatura','Inglês','Matemática','Humanas','História','Geografia','Redação','Dinâmica'],
      officialSource: 'https://www.ibmec.br/estude-no-ibmec/formas-de-ingresso/vestibular',
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

  if (examId === 'fgv') {
    const publicAdministration = course === 'Administração Pública';
    return {
      examId,
      title: `Vestibular FGV EAESP 2027.1 — ${course}`,
      structure: publicAdministration
        ? 'Duas fases no mesmo dia. 1ª fase objetiva: Matemática, Língua Portuguesa, Inglês e Ciências Humanas (Atualidades, História e Geografia). 2ª fase discursiva: Ciências Humanas (História e Geografia) e Redação. A nota final combina a 1ª fase com peso 2 e a 2ª fase com peso 3.'
        : 'Duas fases no mesmo dia. 1ª fase objetiva: Matemática, Língua Portuguesa, Inglês e Ciências Humanas (Atualidades, História e Geografia). 2ª fase discursiva: Matemática e Redação. Cada prova objetiva é convertida para nota de 0 a 10; a nota final combina a 1ª fase com peso 2 e a 2ª fase com peso 3.',
      metrics: publicAdministration ? FGV_AP_METRICS : FGV_ADMIN_METRICS,
      allowedQuestionAreas: publicAdministration
        ? ['Matemática','Língua Portuguesa','Português','Inglês','Humanas','Ciências Humanas','Atualidades','História','Geografia','Ciências Humanas discursiva','Redação']
        : ['Matemática','Matemática discursiva','Língua Portuguesa','Português','Inglês','Humanas','Ciências Humanas','Atualidades','História','Geografia','Redação'],
      officialSource: 'https://vestibular.fgv.br/sites/default/files/2026-07/materiais/edital-unificado_01-2027_4.pdf',
    };
  }

  if (examId === 'fuvest') {
    const specific = FUVEST_SECOND_PHASE[course] ?? [];
    const specificMetrics: ExamMetric[] = specific.length
      ? specific.map((subject) => ({
          key: `2ª fase — ${subject}`,
          label: `${subject} — 2ª fase`,
          max: 100,
          defaultValue: 60,
          unit: 'desempenho',
          phase: '2ª fase',
        }))
      : [{
          key: '2ª fase — Específicas da carreira',
          label: 'Disciplinas específicas da carreira — 2ª fase',
          max: 100,
          defaultValue: 60,
          unit: 'desempenho' as const,
          phase: '2ª fase',
        }];
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
      allowedQuestionAreas: ['1ª fase', 'Português', 'Redação', ...(specific.length?specific:['Específicas da carreira'])],
      officialSource: 'https://www.fuvest.br/vestibular-da-usp/',
    };
  }

  const ufmg = university === 'UFMG';
  const genericInstitution = university && university !== 'ENEM — plano geral' ? university : null;
  return {
    examId,
    admissionExamId: 'enem',
    routeKey: 'primary',
    routeLabel: ufmg ? 'ENEM / SiSU' : 'Plano geral ENEM',
    title: ufmg ? `ENEM / SiSU — ${course} na UFMG` : genericInstitution ? `${course} · ${genericInstitution} — plano geral ENEM` : `ENEM 2026 — plano geral para ${course}`,
    structure: ufmg
      ? 'Informe as cinco notas do seu boletim do ENEM, de 0 a 1000. A classificação do SiSU usa as notas e os pesos definidos para o curso; o plano prioriza as áreas de maior peso e maior distância da meta.'
      : genericInstitution
        ? `Esta faculdade já está disponível como meta, mas o Conectaê ainda não possui um modelo institucional verificado do processo seletivo de ${genericInstitution}. Enquanto isso, o cronograma usa as cinco notas do ENEM como referência geral e não finge reproduzir um vestibular específico.`
        : 'Informe as cinco notas do seu boletim do ENEM, de 0 a 1000. O plano usa essas notas para distribuir o estudo entre Linguagens, Humanas, Natureza, Matemática e Redação.',
    scoreInputHelp: 'Digite exatamente as cinco notas do seu boletim do ENEM (0–1000), não o número de acertos.',
    metrics: ENEM_METRICS,
    allowedQuestionAreas: ['Linguagens', 'Humanas', 'Natureza', 'Matemática', 'Redação'],
    officialSource: ufmg ? 'https://www.ufmg.br/sisu/' : 'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem',
    overall: { method: 'weighted_average' as const, max: 1000 },
  };
}

export function isSupportedInstitutionCourse(university: string, course: string) {
  if (university === 'ENEM — plano geral') return SITE_PLANNER_COURSE_SET.has(course);
  if (university === 'UFMG') return UFMG_VERIFIED_COURSES.has(course);
  if (university === 'USP') return supportedFuvestCourse(course);
  if (university === 'Faculdade Ciências Médicas de Minas Gerais') return course === 'Medicina' || CMMG_EFFPO_COURSES.includes(course);
  if (university === 'Faculdade Israelita de Ciências da Saúde Albert Einstein') return EINSTEIN_VERIFIED_COURSES.has(course);
  if (university === 'Ibmec') return IBMEC_VERIFIED_COURSES.has(course);
  if (university === 'Link School of Business') return course === 'Administração';
  if (university === 'Insper') return INSPER_VERIFIED_COURSES.has(course);
  if (getExamId(university) === 'fgv') return FGV_VERIFIED_COURSES.has(course);
  // Other catalog institutions can still be selected in the approval course.
  // Until a dedicated institutional exam model is verified, they use the clearly
  // labeled generic ENEM study model rather than disappearing from the selector.
  return SITE_PLANNER_COURSE_SET.has(course);
}
