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
  const options = getQuestionOptions(question);
  return options !== null;
}

export function isMultiChoiceQuestion(question: Question): boolean {
  return question.response_type === 'Múltipla escolha';
}

export const MULTI_CHOICE_MAX = 3;

export function isTextQuestion(question: Question): boolean {
  const options = getQuestionOptions(question);
  if (options !== null) return false;
  if (isSliderQuestion(question)) return false;
  return [
    'Texto',
    'Texto estruturado',
    'Links/números/anexos',
  ].includes(question.response_type);
}

export function normalizeAnswerToScore(
  question: Question,
  answer: string
): number {
  if (isSliderQuestion(question)) {
    const val = parseInt(answer, 10);
    if (isNaN(val)) return 50;
    if (question.response_type === '0–10') {
      return Math.max(0, Math.min(100, val * 10));
    }
    return Math.max(0, Math.min(100, val * 20));
  }

  const options = getQuestionOptions(question);
  if (options) {
    if (isMultiChoiceQuestion(question)) {
      const selected = answer.split(',').map((s) => s.trim()).filter(Boolean);
      if (selected.length === 0) return 50;
      const scores = selected
        .map((v) => options.find((o) => o.value === v)?.score)
        .filter((s): s is number => s !== undefined);
      if (scores.length === 0) return 50;
      return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }
    const option = options.find((o) => o.value === answer);
    if (option) return option.score;
  }

  if (isTextQuestion(question)) {
    return scoreTextAnswer(question, answer);
  }

  return 50;
}

function scoreTextAnswer(question: Question, answer: string): number {
  const text = answer.trim();
  if (text.length < 10) return 20;
  if (text.length < 30) return 35;
  if (text.length < 80) return 55;
  if (text.length < 150) return 70;
  if (text.length < 300) return 85;
  return 95;
}
