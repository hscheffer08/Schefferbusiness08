from pathlib import Path

path = Path('src/components/PlannerStudyLab.tsx')
text = path.read_text(encoding='utf-8')


def replace_once(old: str, new: str) -> None:
    global text
    if old not in text:
        raise SystemExit(f'Expected fragment not found:\n{old[:240]}')
    text = text.replace(old, new, 1)


replace_once(
"""type Attempt = {
  exam_id: ExamId;
  area: string;
  skill_name: string | null;
  correct: boolean | null;
  created_at: string;
};""",
"""type Attempt = {
  question_id: number | null;
  exam_id: ExamId;
  area: string;
  skill_name: string | null;
  correct: boolean | null;
  created_at: string;
};""",
)

replace_once(
"""  const [skills, setSkills] = useState<Skill[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);""",
"""  const [skills, setSkills] = useState<Skill[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [seenQuestionIds, setSeenQuestionIds] = useState<number[]>([]);""",
)

replace_once(
"""      if (userData.user) {
        const { data: a } = await supabase
          .from('student_practice_attempts')
          .select('exam_id,area,skill_name,correct,created_at')
          .eq('user_id', userData.user.id)
          .order('created_at', { ascending: false })
          .limit(500);
        if (alive) setAttempts((a ?? []) as Attempt[]);
      }""",
"""      if (userData.user) {
        const [{ data: a }, { data: seen }] = await Promise.all([
          supabase
            .from('student_practice_attempts')
            .select('question_id,exam_id,area,skill_name,correct,created_at')
            .eq('user_id', userData.user.id)
            .order('created_at', { ascending: false })
            .limit(1000),
          supabase
            .from('student_seen_questions')
            .select('question_id')
            .eq('user_id', userData.user.id)
            .order('first_seen_at', { ascending: false })
            .limit(1000),
        ]);
        if (alive) {
          setAttempts((a ?? []) as Attempt[]);
          setSeenQuestionIds((seen ?? []).map((row) => Number(row.question_id)).filter(Number.isFinite));
        }
      }""",
)

replace_once(
"""  const filtered = useMemo(
    () => examQuestions.filter((q) => (subject === 'Todas' || q.area === subject) && (difficulty === 'Todas' || String(q.difficulty) === difficulty)),
    [examQuestions, subject, difficulty],
  );""",
"""  const seenQuestionSet = useMemo(() => new Set(seenQuestionIds), [seenQuestionIds]);
  const filtered = useMemo(
    () => examQuestions.filter((q) => !seenQuestionSet.has(q.id) && (subject === 'Todas' || q.area === subject) && (difficulty === 'Todas' || String(q.difficulty) === difficulty)),
    [examQuestions, seenQuestionSet, subject, difficulty],
  );""",
)

replace_once(
"""  const openQuestion = (question: Question) => {
    setActive(question);""",
"""  const markQuestionSeen = async (questionId: number) => {
    setSeenQuestionIds((current) => current.includes(questionId) ? current : [...current, questionId]);
    if (!supabase) return;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { error } = await supabase
      .from('student_seen_questions')
      .upsert(
        { user_id: userData.user.id, question_id: questionId },
        { onConflict: 'user_id,question_id', ignoreDuplicates: true },
      );
    if (error) console.error('Could not persist seen question', error);
  };

  const openQuestion = (question: Question) => {
    void markQuestionSeen(question.id);
    setActive(question);""",
)

replace_once(
"""    setLastAttemptId(inserted?.id ?? null);
    setAttempts((current) => [{ exam_id: active.exam_id, area: active.area, skill_name: active.skill_name, correct, created_at: new Date().toISOString() }, ...current]);""",
"""    setLastAttemptId(inserted?.id ?? null);
    setAttempts((current) => [{ question_id: active.id, exam_id: active.exam_id, area: active.area, skill_name: active.skill_name, correct, created_at: new Date().toISOString() }, ...current]);
    await markQuestionSeen(active.id);""",
)

replace_once(
"""  const nextQuestion = () => {
    const pool = filtered.filter((q) => q.id !== active?.id);""",
"""  const nextQuestion = () => {
    const pool = filtered.filter((q) => q.id !== active?.id && !seenQuestionSet.has(q.id));""",
)

replace_once(
"""          <span>{filtered.length} questão{filtered.length === 1 ? '' : 'ões'} neste filtro</span>""",
"""          <span>{filtered.length} questão{filtered.length === 1 ? '' : 'ões'} inédita{filtered.length === 1 ? '' : 's'} neste filtro</span>""",
)

replace_once(
"""      <div className=\"study-lab-grid\">
        {visible.map((question) => (""",
"""      <div className=\"study-lab-grid\">
        {visible.length === 0 && (
          <div className=\"study-lab-empty\">
            <CheckCircle2 size={20}/>
            <strong>Você já viu todas as questões deste filtro.</strong>
            <p>Troque a matéria ou a dificuldade. O Conectaê não vai repetir uma questão já vista nesta conta.</p>
          </div>
        )}
        {visible.map((question) => (""",
)

path.write_text(text, encoding='utf-8')
print('Applied per-user practice question deduplication')
