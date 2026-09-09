import { getExamSkillCatalog, topicKey, type DifficultySelection } from './exam-skill-catalog';
import {
  buildRoadmap as buildBaseRoadmap,
  getMilestones,
  type ExamMilestone,
  type RoadmapPriority,
  type RoadmapQuestion,
  type RoadmapSession,
  type RoadmapWeek as BaseRoadmapWeek,
} from './admissions-roadmap';

export { getMilestones };
export type { ExamMilestone, RoadmapPriority, RoadmapQuestion, RoadmapSession };

export type RoadmapWeekFocus = {
  key: string;
  label: string;
  topic: string;
  role: 'principal' | 'secundario' | 'manutencao';
  weight: number;
  minutes: number;
  questionTarget: number;
  reason: string;
};

export type RoadmapWeek = BaseRoadmapWeek & {
  focusMix: RoadmapWeekFocus[];
  balanceSummary: string;
};

type BuildArgs = Parameters<typeof buildBaseRoadmap>[0];
type ScoredPriority = { p: RoadmapPriority; raw: number; manualLevel: number; diagnosticCount: number };

const norm = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const min10 = (value: number) => Math.max(10, Math.round(value / 10) * 10);
const keyOf = (p: RoadmapPriority) => p.metric.key.replace('2ª fase — ', '').replace('2a fase — ', '');

function matchArea(area: string, key: string) {
  const a = norm(area), k = norm(key);
  if (!a || !k) return false;
  if (a === k || a.includes(k) || k.includes(a)) return true;
  if (k === 'natureza') return ['natureza', 'biologia', 'fisica', 'quimica'].some(x => a.includes(x));
  if (k === 'humanas' || k === 'conhecimentos gerais') return ['humanas', 'humanidades', 'historia', 'geografia', 'filosofia', 'sociologia', 'conhecimentos gerais'].some(x => a.includes(x));
  if (k === 'linguagens') return ['linguagens', 'lingua portuguesa', 'portugues', 'literatura', 'ingles'].some(x => a.includes(x));
  if (k === 'dissertativas') return ['dissertativas', 'natureza', 'biologia', 'fisica', 'quimica', 'matematica', 'linguagens', 'humanas'].some(x => a.includes(x));
  if (k === '1ª fase' || k === '1a fase') return true;
  if (k === 'dinamica' || k === 'mme') return a.includes(k);
  if (k === 'oral') return a.includes('oral') || a.includes('comunicacao') || a.includes('entrevista');
  if (k === 'portfolio') return a.includes('prep') || a.includes('portfolio');
  if (k === 'escrita') return a.includes('business case') || a.includes('sprint') || a.includes('escrita');
  if (k === 'matematica') return a.includes('matematica') || a.includes('sprint');
  return false;
}

function eligibleForMix(examId: string, week: BaseRoadmapWeek, priority: RoadmapPriority) {
  const key = norm(keyOf(priority));
  if (examId === 'enem') {
    // Até o 1º dia, todas as áreas precisam continuar vivas. Entre os dois dias,
    // o tempo restante é concentrado em Natureza e Matemática.
    return week.start >= '2026-11-09' ? ['natureza', 'matematica'].includes(key) : ['linguagens', 'humanas', 'natureza', 'matematica', 'redacao'].includes(key);
  }
  if (examId === 'fuvest') return week.phase.includes('2ª') ? key !== '1ª fase' && key !== '1a fase' : key === '1ª fase' || key === '1a fase';
  if (examId === 'einstein') return week.phase.includes('2ª') ? key === 'mme' : key !== 'mme';
  if (examId === 'ibmec') return week.phase.toLowerCase().includes('dinâmica') ? key === 'dinamica' : key !== 'dinamica';
  if (examId === 'link') {
    if (week.phase.includes('PREP')) return ['portfolio', 'oral'].includes(key);
    if (week.phase.includes('Sprint')) return ['matematica', 'business case', 'escrita', 'oral'].includes(key);
    return ['entrevista', 'oral'].includes(key);
  }
  return true;
}

function scoreSignals(args: BuildArgs, p: RoadmapPriority, catalog: ReturnType<typeof getExamSkillCatalog>): ScoredPriority {
  const key = keyOf(p);
  const difficultyTopics: DifficultySelection = args.difficultyTopics ?? {};
  const matchingTopics = catalog.subjects.flatMap(subject => subject.topics.map(topic => ({
    subject: subject.subject,
    area: subject.area,
    topic,
    level: Number(difficultyTopics[topicKey(subject.subject, topic)] ?? 0),
  }))).filter(row => row.level > 0 && (matchArea(row.area, key) || matchArea(row.subject, key)));
  const manualLevel = matchingTopics.reduce((sum, row) => sum + row.level, 0);
  const diagnosticCount = (args.diagnostics ?? []).filter(d => matchArea(d.area, key)).length;
  const accuracyNeed = p.accuracy == null ? .22 : Math.max(0, 1 - p.accuracy);
  const boost = 1 + Math.min(.72, manualLevel * .08) + Math.min(.42, diagnosticCount * .11) + accuracyNeed * .22;
  return { p, raw: Math.max(.055, p.score) * boost, manualLevel, diagnosticCount };
}

function topicFor(args: BuildArgs, scored: ScoredPriority, catalog: ReturnType<typeof getExamSkillCatalog>, rotation: number, baseWeek: BaseRoadmapWeek) {
  const key = keyOf(scored.p);
  if (norm(baseWeek.focusKey) === norm(key) && baseWeek.topic) return baseWeek.topic;
  const difficultyTopics: DifficultySelection = args.difficultyTopics ?? {};
  const manual = catalog.subjects.flatMap(subject => subject.topics.map(topic => ({
    subject: subject.subject,
    area: subject.area,
    topic,
    level: Number(difficultyTopics[topicKey(subject.subject, topic)] ?? 0),
  }))).filter(row => row.level > 0 && (matchArea(row.area, key) || matchArea(row.subject, key))).sort((a, b) => b.level - a.level);
  if (manual.length) return manual[rotation % Math.min(4, manual.length)].topic;
  const diagnostics = (args.diagnostics ?? []).filter(d => matchArea(d.area, key)).map(d => d.skill).filter(Boolean);
  if (diagnostics.length) return diagnostics[rotation % diagnostics.length];
  const official = catalog.subjects.filter(subject => matchArea(subject.area, key) || matchArea(subject.subject, key)).flatMap(subject => subject.topics);
  if (official.length) return official[rotation % official.length];
  return `${scored.p.metric.label}: revisão dirigida e questões`;
}

function chooseMix(candidates: ScoredPriority[], usage: Map<string, number>, previousPrimary: string) {
  if (!candidates.length) return [] as ScoredPriority[];
  const rawRank = [...candidates].sort((a, b) => b.raw - a.raw);
  const secondRaw = rawRank[1]?.raw ?? 0;
  const dominant = rawRank.length === 1 || rawRank[0].raw >= Math.max(.01, secondRaw) * 1.65;
  const primary = [...candidates].sort((a, b) => {
    const adjusted = (row: ScoredPriority) => {
      const key = norm(keyOf(row.p));
      const used = usage.get(key) ?? 0;
      const repeatPenalty = key === previousPrimary ? (dominant && key === norm(keyOf(rawRank[0].p)) ? .94 : .68) : 1;
      return row.raw * repeatPenalty / (1 + used * .18);
    };
    return adjusted(b) - adjusted(a);
  })[0];
  const remaining = candidates.filter(row => row !== primary);
  const secondary = [...remaining].sort((a, b) => {
    const adjusted = (row: ScoredPriority) => row.raw / (1 + (usage.get(norm(keyOf(row.p))) ?? 0) * .15);
    return adjusted(b) - adjusted(a);
  })[0];
  const rest = remaining.filter(row => row !== secondary);
  const maintenance = [...rest].sort((a, b) => {
    const value = (row: ScoredPriority) => {
      const used = usage.get(norm(keyOf(row.p))) ?? 0;
      const accuracy = row.p.accuracy ?? .58;
      return (accuracy * .35 + row.raw * .65) / (1 + used * .28);
    };
    return value(b) - value(a);
  })[0];
  return [primary, secondary, maintenance].filter(Boolean) as ScoredPriority[];
}

function weightsFor(selected: ScoredPriority[]) {
  if (selected.length <= 1) return [1];
  if (selected.length === 2) return [.62, .38];
  const ratio = selected[0].raw / Math.max(.01, selected[1].raw);
  if (ratio >= 2.1) return [.60, .25, .15];
  if (ratio >= 1.5) return [.56, .29, .15];
  return [.50, .30, .20];
}

function allocateExact(total: number, weights: number[]) {
  if (!weights.length) return [];
  if (weights.length === 1) return [total];
  const values: number[] = [];
  let left = total;
  weights.forEach((weight, index) => {
    if (index === weights.length - 1) { values.push(left); return; }
    const remainingSlots = weights.length - index - 1;
    const proposed = min10(total * weight);
    const maxAllowed = Math.max(10, left - remainingSlots * 10);
    const minutes = Math.min(maxAllowed, proposed);
    values.push(minutes);
    left -= minutes;
  });
  return values;
}

function questionCounts(total: number, weights: number[]) {
  if (!total || !weights.length) return weights.map(() => 0);
  const raw = weights.map(w => Math.floor(total * w));
  let remainder = total - raw.reduce((sum, value) => sum + value, 0);
  for (let i = 0; remainder > 0; i = (i + 1) % raw.length) { raw[i] += 1; remainder -= 1; }
  return raw;
}

function mixedQuestionIds(args: BuildArgs, mixes: RoadmapWeekFocus[], weekIndex: number) {
  const result: number[] = [];
  const seen = new Set<number>();
  for (const focus of mixes) {
    const pool = args.questions.filter(q => matchArea(q.area, focus.key));
    if (!pool.length) continue;
    const desired = Math.min(focus.questionTarget, 30 - result.length);
    for (let i = 0; i < desired && result.length < 30; i++) {
      const q = pool[(weekIndex * 11 + i) % pool.length];
      if (!seen.has(q.id)) { seen.add(q.id); result.push(q.id); }
    }
  }
  return result;
}

function reasonFor(row: ScoredPriority, role: RoadmapWeekFocus['role']) {
  const parts: string[] = [];
  if (role === 'principal') parts.push('maior retorno esperado nesta semana');
  else if (role === 'secundario') parts.push('segunda prioridade para evitar estudo estreito');
  else parts.push('manutenção/variedade para preservar cobertura');
  if (row.p.accuracy != null) parts.push(`${Math.round(row.p.accuracy * 100)}% de acerto recente`);
  if (row.p.missing > 0) parts.push(`distância até a meta: ${row.p.missing}`);
  if (row.manualLevel > 0) parts.push('dificuldade declarada');
  if (row.diagnosticCount > 0) parts.push(`${row.diagnosticCount} diagnóstico(s) recente(s)`);
  return parts.join(' · ');
}

export function buildRoadmap(args: BuildArgs) {
  const base = buildBaseRoadmap(args);
  const catalog = getExamSkillCatalog(args.model.examId, args.course);
  const usage = new Map<string, number>();
  let previousPrimary = '';
  const weeks: RoadmapWeek[] = base.weeks.map((week, weekIndex) => {
    let candidates = args.priorities.filter(p => eligibleForMix(args.model.examId, week, p)).map(p => scoreSignals(args, p, catalog));
    if (!candidates.length) candidates = args.priorities.map(p => scoreSignals(args, p, catalog));
    const selected = chooseMix(candidates, usage, previousPrimary);
    if (!selected.length) return { ...week, focusMix: [], balanceSummary: 'Sem prioridades suficientes para distribuir.' };
    const weights = weightsFor(selected);
    const mockSession = week.sessionPlan.find(s => s.label === 'Medir') ?? week.sessionPlan[week.sessionPlan.length - 1];
    const mockMinutes = mockSession ? Math.max(0, mockSession.minutes) : 0;
    const directedMinutes = Math.max(0, week.totalPlannedMinutes - mockMinutes);
    const directedAllocations = allocateExact(directedMinutes, weights);
    const counts = questionCounts(week.questionTarget, weights);
    const roles: RoadmapWeekFocus['role'][] = ['principal', 'secundario', 'manutencao'];
    const focusMix: RoadmapWeekFocus[] = selected.map((row, index) => ({
      key: keyOf(row.p),
      label: row.p.metric.label,
      topic: topicFor(args, row, catalog, (usage.get(norm(keyOf(row.p))) ?? 0) + weekIndex, week),
      role: roles[index],
      weight: weights[index],
      minutes: directedAllocations[index] ?? 0,
      questionTarget: counts[index] ?? 0,
      reason: reasonFor(row, roles[index]),
    }));

    for (const focus of focusMix) usage.set(norm(focus.key), (usage.get(norm(focus.key)) ?? 0) + 1);
    previousPrimary = norm(focusMix[0].key);

    if (focusMix.length === 1) return {
      ...week,
      focusMix,
      balanceSummary: `Etapa específica: 100% do tempo dirigido em ${focusMix[0].label}; o bloco de medição continua separado.`,
    };

    const focusSessions: RoadmapSession[] = focusMix.map(focus => ({
      label: `${focus.role === 'principal' ? 'Foco principal' : focus.role === 'secundario' ? 'Foco secundário' : 'Manutenção'} · ${focus.label}`,
      minutes: focus.minutes,
      task: focus.questionTarget > 0
        ? `Estudar ${focus.topic}, aplicar em aproximadamente ${focus.questionTarget} questões e corrigir os erros antes de encerrar o bloco.`
        : `Treinar ${focus.topic} com execução prática, feedback por critérios e uma segunda tentativa corrigida.`,
      proof: focus.questionTarget > 0
        ? `Explicar o conceito sem consulta e registrar assunto + causa + correção de cada erro do bloco de ${focus.label}.`
        : `Registrar evidência do desempenho, principal falha e uma ação concreta para a próxima tentativa.`,
    }));
    const sessionPlan = mockSession ? [...focusSessions, { ...mockSession }] : focusSessions;
    const measured = sessionPlan.reduce((sum, session) => sum + session.minutes, 0);
    if (sessionPlan.length && measured !== week.totalPlannedMinutes) sessionPlan[sessionPlan.length - 1].minutes += week.totalPlannedMinutes - measured;

    const mixText = focusMix.map(f => `${f.label} ${Math.round(f.weight * 100)}%`).join(' · ');
    const questionSkills = Array.from(new Set(focusMix.flatMap(focus => args.questions.filter(q => matchArea(q.area, focus.key)).map(q => q.skill_name).filter(Boolean)))).slice(0, 8);
    const studyChecklist = focusMix.flatMap(focus => [
      `${focus.role === 'principal' ? 'Foco principal' : focus.role === 'secundario' ? 'Foco secundário' : 'Manutenção'} — ${focus.label}: ${focus.topic}.`,
    ]);
    const questionIds = mixedQuestionIds(args, focusMix, weekIndex);
    const balanceSummary = `Tempo dirigido: ${mixText}. O simulado/checkpoint permanece misto e não rouba horas do orçamento semanal.`;
    const rationale = `${balanceSummary} A distribuição considera distância até a meta, desempenho recente, dificuldades declaradas e diagnósticos; uma área pode continuar como foco principal quando a necessidade é claramente maior, mas não monopoliza a semana.`;
    const successCriteria = [
      `Passar por ${focusMix.length} frentes nesta semana, preservando o foco principal sem abandonar as demais.`,
      ...focusMix.map(f => `${f.label}: concluir o bloco de ${f.minutes} min em ${f.topic}${f.questionTarget ? ` e corrigir cerca de ${f.questionTarget} questões` : ''}.`),
      `Concluir o bloco de medição e usar o resultado para recalibrar a próxima semana.`,
      `Manter o total em ${week.hours}h; nenhuma dificuldade cria horas escondidas.`,
    ];
    return {
      ...week,
      focusKey: focusMix[0].key,
      focusLabel: `${focusMix[0].label} (foco) + equilíbrio em ${focusMix.slice(1).map(f => f.label).join(' + ')}`,
      topic: focusMix[0].topic,
      target: sessionPlan.map(s => `${s.label}: ${s.task} (${s.minutes} min)`).join(' • '),
      questionIds,
      questionSkills,
      studyChecklist,
      sessionPlan,
      rationale,
      evidenceLabel: 'Equilíbrio adaptativo: nota/meta + desempenho recente + dificuldades declaradas + diagnósticos + cobertura semanal',
      successCriteria,
      focusMix,
      balanceSummary,
    };
  });

  return { ...base, weeks };
}
