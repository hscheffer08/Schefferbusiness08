import { getQuestionOptions, isMultiChoiceQuestion } from '@/lib/question-options';
import { supabase } from '@/lib/supabase';
import type { AnswerMap, FacultyEvidenceCategory, Question } from '@/types';

const QUESTION_CATEGORY: Partial<Record<string, FacultyEvidenceCategory>> = {
  Q01: 'grades',
  Q02: 'grades',
  Q03: 'grades',
  Q04: 'grades',
  Q05: 'grades',
  Q08: 'grades',
  Q06: 'languages',
  Q07: 'languages',
  Q09: 'awards',
  Q10: 'extracurriculars',
  Q11: 'extracurriculars',
  Q12: 'projects',
  Q13: 'projects',
  Q14: 'projects',
  Q15: 'projects',
  Q36: 'projects',
  Q16: 'experience',
  Q17: 'experience',
  Q18: 'experience',
};

const CATEGORY_TITLES: Record<FacultyEvidenceCategory, string> = {
  extracurriculars: 'Extracurriculares do Questionário Completo',
  grades: 'Desempenho acadêmico do Questionário Completo',
  languages: 'Idiomas do Questionário Completo',
  awards: 'Prêmios e conquistas do Questionário Completo',
  projects: 'Projetos do Questionário Completo',
  experience: 'Experiências do Questionário Completo',
};

function formatAnswer(question: Question, rawAnswer: string): string {
  const options = getQuestionOptions(question);
  if (options) {
    const values = isMultiChoiceQuestion(question)
      ? rawAnswer.split(',').map((value) => value.trim()).filter(Boolean)
      : [rawAnswer];
    const labels = values.map((value) => options.find((option) => option.value === value)?.label ?? value);
    return labels.join(', ');
  }

  if (question.response_type === '0–10') return `${rawAnswer}/10`;
  if (question.response_type === '1–5') return `${rawAnswer}/5`;
  return rawAnswer;
}

function buildFacultyProfileRows(answers: AnswerMap, questions: Question[], userId: string) {
  const grouped = new Map<FacultyEvidenceCategory, string[]>();
  const questionById = new Map(questions.map((question) => [question.question_id, question]));

  Object.entries(answers).forEach(([questionId, rawAnswer]) => {
    const category = QUESTION_CATEGORY[questionId];
    const question = questionById.get(questionId);
    const answer = rawAnswer.trim();
    if (!category || !question || !answer) return;

    const current = grouped.get(category) ?? [];
    current.push(`${question.question_text}\n${formatAnswer(question, answer)}`);
    grouped.set(category, current);
  });

  const now = new Date().toISOString();
  return Array.from(grouped.entries()).map(([category, details]) => ({
    user_id: userId,
    category,
    title: CATEGORY_TITLES[category],
    institution: null,
    details: details.join('\n\n'),
    occurred_on: null,
    source: 'full_quiz',
    source_reference: category,
    imported_at: now,
    updated_at: now,
  }));
}

export async function exportFullQuizToFacultyProfile(
  answers: AnswerMap,
  questions: Question[]
): Promise<{ count: number; error: string | null }> {
  if (!supabase) return { count: 0, error: 'Supabase indisponível.' };

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return { count: 0, error: 'Entre na sua conta para exportar.' };

  const rows = buildFacultyProfileRows(answers, questions, userData.user.id);
  if (rows.length === 0) return { count: 0, error: 'Nenhuma informação compatível foi encontrada.' };

  const { error } = await supabase
    .from('faculty_questionnaire_evidence')
    .upsert(rows, { onConflict: 'user_id,source,source_reference' });

  if (error) {
    console.error('Faculty profile export failed', error);
    return { count: 0, error: 'Não foi possível exportar agora.' };
  }

  return { count: rows.length, error: null };
}
