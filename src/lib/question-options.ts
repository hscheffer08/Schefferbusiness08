import type { Question } from '@/types';

export interface ChoiceOption {
  label: string;
  value: string;
  score: number;
}

export function getQuestionOptions(question: Question): ChoiceOption[] | null {
  const map: Record<string, ChoiceOption[]> = {
    Q01: [
      { label: '1º ano do EM', value: '1ano', score: 0 },
      { label: '2º ano do EM', value: '2ano', score: 0 },
      { label: '3º ano do EM', value: '3ano', score: 0 },
      { label: 'Já formado / cursinho', value: 'formado', score: 0 },
    ],
    Q03: [
      { label: 'Matemática / Física', value: 'exatas', score: 85 },
      { label: 'Português / Redação / História', value: 'humanas', score: 65 },
      { label: 'Biologia / Química', value: 'ciencias', score: 70 },
      { label: 'Línguas / Artes', value: 'linguagens', score: 55 },
    ],
    Q06: [
      { label: 'Básico', value: 'basico', score: 20 },
      { label: 'Intermediário', value: 'intermediario', score: 45 },
      { label: 'Avançado', value: 'avancado', score: 70 },
      { label: 'Fluente + certificado', value: 'fluente', score: 95 },
    ],
    Q10: [
      { label: 'Nenhuma relevante', value: 'nenhuma', score: 10 },
      { label: '1 atividade breve', value: '1_breve', score: 35 },
      { label: '1-2 atividades com dedicação', value: '1-2_dedicated', score: 65 },
      { label: '3+ atividades com impacto', value: '3plus_impact', score: 90 },
    ],
    Q12: [
      { label: 'Não', value: 'nao', score: 10 },
      { label: 'Tenho ideia', value: 'ideia', score: 30 },
      { label: 'Comecei algo', value: 'comecei', score: 60 },
      { label: 'Está funcionando', value: 'funcionando', score: 95 },
    ],
    Q19: [
      { label: 'Gosto de planejar cada detalhe antes', value: 'planejo', score: 30 },
      { label: 'Pesquiso bastante antes de começar', value: 'pesquiso', score: 50 },
      { label: 'Prefiro testar rápido e ajustar no caminho', value: 'testo', score: 75 },
      { label: 'Chamo outras pessoas e começamos juntos', value: 'chamo_pessoas', score: 90 },
    ],
    Q20: [
      { label: 'Principalmente com aulas teóricas e leitura', value: 'teoria', score: 20 },
      { label: 'Uma mistura de teoria e prática', value: 'teoria_pratica', score: 55 },
      { label: 'Discutindo cases reais e debatendo', value: 'cases', score: 75 },
      { label: 'Fazendo projetos, colocando a mão na massa', value: 'projetos', score: 95 },
    ],
    Q25: [
      { label: 'Costumo liderar e dividir as tarefas', value: 'lidero', score: 90 },
      { label: 'Colaboro e ajudo onde for preciso', value: 'colaboro', score: 70 },
      { label: 'Executo o que me pedem', value: 'executo', score: 40 },
      { label: 'Prefiro trabalhar sozinho', value: 'solo', score: 20 },
    ],
    Q28: [
      { label: 'Não', value: 'nao', score: 15 },
      { label: 'Talvez', value: 'talvez', score: 55 },
      { label: 'Sim', value: 'sim', score: 90 },
    ],
    Q33: [
      { label: 'Prestígio e marca', value: 'prestigio', score: 95 },
      { label: 'Networking e comunidade', value: 'networking', score: 85 },
      { label: 'Empregabilidade', value: 'empregabilidade', score: 90 },
      { label: 'Aprendizado prático', value: 'pratico', score: 80 },
      { label: 'Internacionalização', value: 'internacional', score: 75 },
      { label: 'Empreendedorismo', value: 'empreender', score: 70 },
      { label: 'Impacto social', value: 'impacto', score: 65 },
      { label: 'Tecnologia e IA', value: 'tech', score: 85 },
    ],
    Q34: [
      { label: 'Quero liderar grandes equipes', value: 'liderar', score: 0 },
      { label: 'Quero empreender e criar', value: 'empreender', score: 0 },
      { label: 'Quero impacto social', value: 'impacto', score: 0 },
      { label: 'Quero excelência acadêmica', value: 'academica', score: 0 },
      { label: 'Quero mercado financeiro', value: 'finance', score: 0 },
      { label: 'Quero experiência global', value: 'global', score: 0 },
    ],
    Q35: [
      { label: 'Tradicional e estruturado', value: 'tradicional', score: 0 },
      { label: 'Inovador e experimental', value: 'inovador', score: 0 },
      { label: 'Competitivo e intenso', value: 'competitivo', score: 0 },
      { label: 'Colaborativo e acolhedor', value: 'colaborativo', score: 0 },
      { label: 'Global e diverso', value: 'global', score: 0 },
      { label: 'Prático e orientado ao mercado', value: 'pratico', score: 0 },
    ],
    Q40: [
      { label: 'Sim', value: 'sim', score: 0 },
      { label: 'Não', value: 'nao', score: 0 },
    ],
    Q41: [
      { label: 'Ninguém, encontrei sozinho', value: 'nenhum', score: 50 },
      { label: 'Instagram / TikTok', value: 'social', score: 50 },
      { label: 'YouTube', value: 'youtube', score: 50 },
      { label: 'Google / busca', value: 'google', score: 50 },
      { label: 'Amigo ou familiar', value: 'amigo', score: 50 },
      { label: 'Escola / cursinho', value: 'escola', score: 50 },
      { label: 'Influenciador ou canal', value: 'influencer', score: 50 },
      { label: 'Outro', value: 'outro', score: 50 },
    ],
  };

  return map[question.question_id] ?? null;
}

export function isScaleQuestion(question: Question): boolean {
  return question.response_type === '1–5';
}

export function isNumericQuestion(question: Question): boolean {
  return question.response_type === '0–10';
}

export function isSliderQuestion(question: Question): boolean {
  return isScaleQuestion(question) || isNumericQuestion(question);
}

export function isChoiceQuestion(question: Question): boolean {
  return getQuestionOptions(question) !== null;
}

export function isMultiChoiceQuestion(question: Question): boolean {
  return question.response_type === 'Múltipla escolha';
}

export const MULTI_CHOICE_MAX = 3;

export function isTextQuestion(question: Question): boolean {
  if (getQuestionOptions(question) !== null) return false;
  if (isSliderQuestion(question)) return false;
  return ['Texto', 'Texto estruturado', 'Links/números/anexos'].includes(question.response_type);
}

export function normalizeAnswerToScore(question: Question, answer: string): number {
  if (isSliderQuestion(question)) {
    const val = Number(answer);
    if (!Number.isFinite(val)) return 50;

    // The current UI uses a 0–100 slider for attitudinal questions, while
    // academic grade questions may arrive either as 0–10 or already normalized.
    if (question.response_type === '0–10') {
      return clamp(val <= 10 ? val * 10 : val);
    }
    return clamp(val <= 5 ? val * 20 : val);
  }

  const options = getQuestionOptions(question);
  if (options) {
    if (isMultiChoiceQuestion(question)) {
      const selected = answer.split(',').map((s) => s.trim()).filter(Boolean);
      if (selected.length === 0) return 50;
      const scores = selected
        .map((value) => options.find((option) => option.value === value)?.score)
        .filter((score): score is number => score !== undefined);
      if (scores.length === 0) return 50;
      return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    }
    const option = options.find((item) => item.value === answer);
    if (option) return option.score;
  }

  if (isTextQuestion(question)) return scoreTextAnswer(question, answer);
  return 50;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function hasAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function signalCount(text: string, groups: string[][]): number {
  return groups.reduce((count, group) => count + (hasAny(text, group) ? 1 : 0), 0);
}

function hasMetric(text: string): boolean {
  return /\b\d+(?:[.,]\d+)?\s*(?:%|pessoas?|usuarios?|clientes?|reais?|r\$|horas?|meses?|anos?|seguidores?|vendas?|inscritos?|participantes?)?\b/i.test(text);
}

function genericTextScore(text: string): number {
  if (text.length < 5) return 15;
  if (text.length < 20) return 28;
  let score = 40;
  if (text.length >= 50) score += 10;
  if (text.length >= 100) score += 10;
  if (text.length >= 180) score += 8;
  if (hasMetric(text)) score += 8;
  if (hasAny(text, ['porque', 'por isso', 'entao', 'resultado', 'aprendi', 'decidi', 'percebi'])) score += 6;
  return clamp(Math.min(score, 88));
}

function scoreTextAnswer(question: Question, rawAnswer: string): number {
  const raw = rawAnswer.trim();
  const text = normalizeText(raw);
  if (!text) return 20;
  if (/^(nao|nenhum|nenhuma|nunca|nao participei|nao tenho)$/.test(text)) return 15;

  switch (question.question_id) {
    case 'Q08': {
      const numbers = [...raw.matchAll(/\d+(?:[.,]\d+)?/g)].map((m) => Number(m[0].replace(',', '.')));
      const max = numbers.length ? Math.max(...numbers) : 0;
      if (text.includes('sat')) {
        if (max >= 1500) return 98;
        if (max >= 1450) return 94;
        if (max >= 1350) return 86;
        if (max >= 1250) return 76;
        if (max > 0) return 62;
      }
      if (text.includes('enem')) {
        if (max >= 800) return 96;
        if (max >= 750) return 88;
        if (max >= 700) return 80;
        if (max >= 650) return 70;
        if (max > 0) return 58;
      }
      if (text.includes('act')) {
        if (max >= 33) return 96;
        if (max >= 30) return 86;
        if (max >= 27) return 76;
        if (max > 0) return 62;
      }
      if (text.includes('ib')) {
        if (max >= 38) return 96;
        if (max >= 34) return 86;
        if (max >= 30) return 76;
        if (max > 0) return 62;
      }
      return genericTextScore(text);
    }

    case 'Q09': {
      if (hasAny(text, ['internacional', 'mundial'])) return 100;
      if (hasAny(text, ['ouro', 'gold'])) return 97;
      if (hasAny(text, ['prata', 'silver'])) return 91;
      if (hasAny(text, ['bronze'])) return 86;
      if (hasAny(text, ['final', 'finalista', 'semifinal', 'segunda fase', '2a fase', '3a fase'])) return 74;
      if (hasAny(text, ['participei', 'olimpiada', 'obm', 'oba', 'obq', 'obf', 'canguru'])) return 50;
      return genericTextScore(text);
    }

    case 'Q11': {
      let score = 28;
      score += signalCount(text, [
        ['mes', 'ano', 'semestre', 'desde'],
        ['hora por semana', 'horas por semana', 'h/semana', 'semanal'],
        ['liderei', 'lider', 'presidente', 'capitao', 'coordenei', 'organizei'],
        ['criei', 'desenvolvi', 'produzi', 'implementei', 'fundei'],
        ['resultado', 'impacto', 'alcanc', 'melhor', 'aument', 'reduz', 'ganhei', 'premio'],
      ]) * 10;
      if (hasMetric(raw)) score += 12;
      if (raw.length > 180) score += 8;
      return clamp(score);
    }

    case 'Q13': {
      let score = 24;
      score += signalCount(text, [
        ['criei', 'fundei', 'idealizei', 'iniciei', 'desenvolvi'],
        ['liderei', 'coordenei', 'organizei', 'gerenciei'],
        ['testei', 'lancei', 'implementei', 'construi', 'produzi', 'executei'],
        ['usuarios', 'clientes', 'participantes', 'vendas', 'receita', 'seguidores', 'impacto', 'resultado'],
        ['aprendi', 'melhorei', 'cresceu', 'evoluiu', 'consegui'],
      ]) * 11;
      if (hasMetric(raw)) score += 12;
      if (raw.length > 180) score += 6;
      return clamp(score);
    }

    case 'Q14': {
      let score = 24;
      score += signalCount(text, [
        ['problema', 'dificuldade', 'desafio', 'erro', 'falha'],
        ['analisei', 'entendi', 'investiguei', 'pesquisei', 'identifiquei'],
        ['mudei', 'ajustei', 'testei', 'tentei', 'implementei', 'resolvi'],
        ['resultado', 'funcionou', 'melhorou', 'conseguimos', 'consegui'],
        ['aprendi', 'percebi', 'feedback', 'depois'],
      ]) * 12;
      if (hasMetric(raw)) score += 8;
      return clamp(score);
    }

    case 'Q15': {
      let score = 35;
      score += signalCount(text, [
        ['link', 'site', 'github', 'portfolio', 'instagram', 'youtube'],
        ['foto', 'video', 'documento', 'certificado', 'arquivo'],
        ['numero', 'metrica', 'usuarios', 'clientes', 'receita', 'vendas', 'resultado'],
      ]) * 18;
      if (hasMetric(raw)) score += 10;
      return clamp(score);
    }

    case 'Q16': {
      let score = 24;
      score += signalCount(text, [
        ['lider', 'liderei', 'coordenei', 'organizei', 'capitao', 'presidente'],
        ['iniciativa', 'propus', 'comecei', 'criei', 'decidi'],
        ['equipe', 'grupo', 'pessoas', 'time'],
        ['deleguei', 'dividi', 'comuniquei', 'combinei', 'mobilizei'],
        ['resultado', 'entregamos', 'conseguimos', 'melhorou', 'alcancamos'],
      ]) * 12;
      if (hasMetric(raw)) score += 9;
      return clamp(score);
    }

    case 'Q17': {
      let score = 24;
      score += signalCount(text, [
        ['discord', 'conflito', 'opiniao diferente'],
        ['ouvi', 'escutei', 'entendi', 'perguntei'],
        ['argument', 'dados', 'evidencia', 'expliquei'],
        ['acordo', 'consenso', 'negoci', 'cedi', 'meio termo'],
        ['resultado', 'decidimos', 'resolvemos', 'funcionou'],
      ]) * 12;
      return clamp(score);
    }

    case 'Q18': {
      let score = 24;
      score += signalCount(text, [
        ['errei', 'fracassei', 'falhei', 'perdi', 'nao consegui'],
        ['entendi', 'refleti', 'percebi', 'feedback'],
        ['mudei', 'corrigi', 'ajustei', 'tentei novamente', 'recomecei'],
        ['aprendi', 'melhorei', 'evolui'],
        ['resultado', 'depois consegui', 'funcionou', 'superei'],
      ]) * 12;
      return clamp(score);
    }

    case 'Q36':
    case 'Q37':
    case 'Q38':
      return genericTextScore(text);

    default:
      return genericTextScore(text);
  }
}
