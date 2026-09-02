import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, BarChart3, BookOpenCheck, CheckCircle2, ChevronDown, ClipboardCheck,
  ExternalLink, FileCheck2, Loader2, Save, Target, XCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { mergePracticeQuestions } from '@/lib/supplemental-practice-questions';

type ExamChoice = 'enem' | 'cmmg-medicina' | 'cmmg-effpo';
type ReviewMode = 'answers' | 'errors';
type Answer = 'A' | 'B' | 'C' | 'D' | 'E' | '-';
type Edition = { id: string; year: number; application: string; application_label: string | null };
type Booklet = { id: string; edition_id: string; day: number | null; booklet_code: string | null; color: string | null; question_start: number | null; question_end: number | null; source_pdf_url: string | null; answer_key_url: string | null };
type Item = { id: string; area: string | null; subject: string | null; skill_code: string | null; skill_name: string | null; prompt_text: string | null; explanation: string | null };
type Mapping = { id: string; question_number: number; correct_option: string | null; answer_status: string; foreign_language: string | null; official_exam_items: Item | null };
type Practice = { id: number; exam_id: string; area: string; skill_name: string; prompt: string };
type ReviewRow = { number: number; userAnswer: Answer | null; correctAnswer: Answer | null; status: 'correct' | 'wrong' | 'blank' | 'annulled' | 'unmapped'; area: string; subject: string; skill: string; item: Item | null };
type AreaScore = { area: string; correct: number; total: number };
type RecoveryGroup = { key: string; area: string; subject: string; skill: string; numbers: number[]; practice: Practice[] };
type Analysis = { rows: ReviewRow[]; areaScores: AreaScore[]; groups: RecoveryGroup[]; recognized: number; keyCoverage: number; correct: number; wrong: number; blank: number; annulled: number; valid: number };

const CMMG_MEDICINA_SOURCE = 'https://vestibular.cmmg.edu.br/wp-content/uploads/2026/07/Manual-do-Candidato-Medicina-1_2027.pdf';
const CMMG_EFFPO_SOURCE = 'https://vestibular.cmmg.edu.br/wp-content/uploads/2026/07/Manual-do-Candidato-EFFPO-1_2027.pdf';
const ANSWERS = new Set(['A', 'B', 'C', 'D', 'E', '-', 'X']);
const REASONS = [
  ['conteudo', 'Não sabia o conteúdo'], ['interpretacao', 'Interpretei errado'],
  ['calculo', 'Errei cálculo/procedimento'], ['distracao', 'Desatenção'],
  ['tempo', 'Faltou tempo / deixei em branco'],
] as const;

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const cleanAnswer = (value: string): Answer => value === 'X' ? '-' : value as Answer;

function parseNumberList(raw: string, min: number, max: number) {
  const numbers = new Set<number>();
  raw.split(/[;,\s]+/).filter(Boolean).forEach((token) => {
    const range = token.match(/^(\d+)-(\d+)$/);
    if (range) {
      const start = Math.min(Number(range[1]), Number(range[2]));
      const end = Math.max(Number(range[1]), Number(range[2]));
      for (let number = start; number <= end; number += 1) if (number >= min && number <= max) numbers.add(number);
      return;
    }
    const number = Number(token.replace(/\D/g, ''));
    if (number >= min && number <= max) numbers.add(number);
  });
  return [...numbers].sort((a, b) => a - b);
}

function parseAnswerSheet(raw: string, start: number, end: number) {
  const answers = new Map<number, Answer>();
  const upper = raw.toUpperCase();
  const numbered = [...upper.matchAll(/(?:^|[\s,;|])(\d{1,3})\s*(?:[).:=-]\s*)?([A-EX-])(?=$|[\s,;|])/g)];
  if (numbered.length) {
    numbered.forEach((match) => {
      const number = Number(match[1]);
      if (number >= start && number <= end && ANSWERS.has(match[2])) answers.set(number, cleanAnswer(match[2]));
    });
    return answers;
  }
  const tokens = upper.split(/[\s,;|/]+/).filter((token) => ANSWERS.has(token));
  const sequence = tokens.length > 1 ? tokens : upper.replace(/[^A-EX-]/g, '').split('').filter((token) => ANSWERS.has(token));
  sequence.slice(0, end - start + 1).forEach((answer, index) => answers.set(start + index, cleanAnswer(answer)));
  return answers;
}

function examConfig(exam: ExamChoice) {
  if (exam === 'cmmg-medicina') return { examId: 'cmmg', label: 'CMMG — Medicina', year: 2027, start: 1, end: 56, source: CMMG_MEDICINA_SOURCE };
  if (exam === 'cmmg-effpo') return { examId: 'cmmg', label: 'CMMG — EFFPO', year: 2027, start: 1, end: 40, source: CMMG_EFFPO_SOURCE };
  return { examId: 'enem', label: 'ENEM', year: 2025, start: 1, end: 180, source: '' };
}

function inferredArea(exam: ExamChoice, number: number) {
  if (exam === 'enem') {
    if (number <= 45) return 'Linguagens';
    if (number <= 90) return 'Humanas';
    if (number <= 135) return 'Natureza';
    return 'Matemática';
  }
  if (exam === 'cmmg-effpo') {
    if (number <= 15) return 'Linguagens';
    if (number <= 30) return 'Biologia';
    return 'Conhecimentos Gerais';
  }
  if (number <= 8) return 'Língua Portuguesa';
  if (number <= 12) return 'Literatura';
  if (number <= 24) return 'Inglês';
  if (number <= 38) return 'Biologia';
  if (number <= 42) return 'Física';
  if (number <= 50) return 'Química';
  return 'Matemática';
}

function practiceScore(question: Practice, group: Pick<RecoveryGroup, 'area' | 'skill'>) {
  const areaMatch = normalize(question.area) === normalize(group.area) ? 5 : 0;
  const wanted = new Set(normalize(group.skill).split(/\W+/).filter((word) => word.length > 3));
  const words = new Set(normalize(question.skill_name).split(/\W+/));
  return areaMatch + [...wanted].filter((word) => words.has(word)).length;
}

export default function OfficialExamReviewV2() {
  const initialExam = localStorage.getItem('conectae:active-exam') === 'cmmg' ? 'cmmg-medicina' : 'enem';
  const [exam, setExam] = useState<ExamChoice>(initialExam);
  const [mode, setMode] = useState<ReviewMode>('answers');
  const [editions, setEditions] = useState<Edition[]>([]);
  const [booklets, setBooklets] = useState<Booklet[]>([]);
  const [year, setYear] = useState(2025);
  const [editionId, setEditionId] = useState('');
  const [bookletId, setBookletId] = useState('');
  const [language, setLanguage] = useState('ingles');
  const [answerRaw, setAnswerRaw] = useState('');
  const [officialKeyRaw, setOfficialKeyRaw] = useState('');
  const [wrongRaw, setWrongRaw] = useState('');
  const [practice, setPractice] = useState<Practice[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [reasons, setReasons] = useState<Record<number, string>>({});
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const config = examConfig(exam);
  const isEnem = exam === 'enem';
  const availableYears = useMemo(() => [...new Set(editions.map((edition) => edition.year))].sort((a, b) => b - a), [editions]);
  const availableEditions = useMemo(() => editions.filter((edition) => edition.year === year), [editions, year]);
  const booklet = booklets.find((item) => item.id === bookletId) ?? null;
  const start = isEnem ? booklet?.question_start ?? 1 : config.start;
  const end = isEnem ? booklet?.question_end ?? 180 : config.end;
  const recognizedAnswers = useMemo(() => parseAnswerSheet(answerRaw, start, end).size, [answerRaw, start, end]);
  const recognizedKey = useMemo(() => parseAnswerSheet(officialKeyRaw, start, end).size, [officialKeyRaw, start, end]);
  const wrongNumbers = useMemo(() => parseNumberList(wrongRaw, start, end), [wrongRaw, start, end]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!supabase) return;
      const { data } = await supabase.from('official_exam_editions').select('id,year,application,application_label').eq('series_id', 'enem').order('year', { ascending: false });
      if (!active) return;
      const rows = (data ?? []) as Edition[];
      setEditions(rows);
      const first = rows.find((edition) => edition.year === 2025) ?? rows[0];
      if (first) { setYear(first.year); setEditionId(first.id); }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!isEnem) return;
    const options = editions.filter((edition) => edition.year === year);
    if (options.length && !options.some((edition) => edition.id === editionId)) setEditionId(options[0].id);
  }, [editionId, editions, isEnem, year]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!supabase || !isEnem || !editionId) { setBooklets([]); setBookletId(''); return; }
      const { data } = await supabase.from('official_exam_booklets').select('id,edition_id,day,booklet_code,color,question_start,question_end,source_pdf_url,answer_key_url').eq('edition_id', editionId).order('day').order('booklet_code');
      if (!active) return;
      const rows = (data ?? []) as Booklet[];
      setBooklets(rows);
      setBookletId(rows[0]?.id ?? '');
    })();
    return () => { active = false; };
  }, [editionId, isEnem]);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!supabase) return;
      const { data } = await supabase.from('exam_practice_questions').select('id,exam_id,area,skill_name,prompt').eq('exam_id', config.examId).eq('active', true).limit(700);
      if (!active) return;
      setPractice(mergePracticeQuestions((data ?? []) as Practice[]).filter((question) => question.exam_id === config.examId) as Practice[]);
    })();
    setAnalysis(null); setMessage(''); setAnswerRaw(''); setOfficialKeyRaw(''); setWrongRaw(''); setReasons({});
    if (!isEnem) setYear(config.year);
    return () => { active = false; };
  }, [config.examId, config.year, exam, isEnem]);

  async function loadMappings() {
    if (!supabase) return [] as Mapping[];
    if (!isEnem) {
      const key = parseAnswerSheet(officialKeyRaw, start, end);
      return [...key.entries()].map(([number, answer]) => ({
        id: `manual-${number}`, question_number: number,
        correct_option: answer === '-' ? null : answer,
        answer_status: answer === '-' ? 'annulled' : 'official_manual',
        foreign_language: null, official_exam_items: null,
      }));
    }
    if (!bookletId) return [];
    const { data, error } = await supabase.from('official_exam_item_booklet_map')
      .select('id,question_number,correct_option,answer_status,foreign_language,official_exam_items(id,area,subject,skill_code,skill_name,prompt_text,explanation)')
      .eq('booklet_id', bookletId).order('question_number');
    if (error) throw error;
    const rows = (data ?? []) as unknown as Mapping[];
    const selected = new Map<number, Mapping>();
    rows.forEach((row) => {
      const languageName = normalize(row.foreign_language ?? '');
      const acceptedLanguage = language === 'ingles'
        ? ['ingles', 'english', 'en'].includes(languageName)
        : ['espanhol', 'spanish', 'es'].includes(languageName);
      if (row.foreign_language && !acceptedLanguage) return;
      selected.set(row.question_number, row);
    });
    return [...selected.values()].sort((a, b) => a.question_number - b.question_number);
  }

  const runAnalysis = async () => {
    setBusy(true); setAnalysis(null); setMessage(''); setReasons({});
    try {
      const mappings = await loadMappings();
      const mappingByNumber = new Map(mappings.map((mapping) => [mapping.question_number, mapping]));
      const userAnswers = parseAnswerSheet(answerRaw, start, end);
      const selectedNumbers = mode === 'answers' ? [...new Set([...mappings.map((mapping) => mapping.question_number), ...userAnswers.keys()])].sort((a, b) => a - b) : wrongNumbers;
      if (mode === 'answers' && !userAnswers.size) throw new Error('answers');
      if (mode === 'errors' && !wrongNumbers.length) throw new Error('errors');
      if (mode === 'answers' && !mappings.length) throw new Error('key');

      const rows: ReviewRow[] = selectedNumbers.map((number) => {
        const mapping = mappingByNumber.get(number) ?? null;
        const userAnswer = mode === 'errors' ? null : userAnswers.get(number) ?? '-';
        const correctAnswer = mapping?.correct_option && ANSWERS.has(mapping.correct_option.toUpperCase()) ? cleanAnswer(mapping.correct_option.toUpperCase()) : null;
        const item = mapping?.official_exam_items ?? null;
        const area = item?.area || inferredArea(exam, number);
        const subject = item?.subject || area;
        const skill = item?.skill_name || subject;
        let status: ReviewRow['status'] = 'unmapped';
        if (mode === 'errors') status = 'wrong';
        else if (mapping?.answer_status === 'annulled') status = 'annulled';
        else if (!mapping || !correctAnswer) status = 'unmapped';
        else if (userAnswer === '-') status = 'blank';
        else status = userAnswer === correctAnswer ? 'correct' : 'wrong';
        return { number, userAnswer, correctAnswer, status, area, subject, skill, item };
      });

      const areaMap = new Map<string, AreaScore>();
      rows.filter((row) => ['correct', 'wrong', 'blank'].includes(row.status)).forEach((row) => {
        const score = areaMap.get(row.area) ?? { area: row.area, correct: 0, total: 0 };
        score.total += 1;
        if (row.status === 'correct') score.correct += 1;
        areaMap.set(row.area, score);
      });
      const groupMap = new Map<string, Omit<RecoveryGroup, 'practice'>>();
      rows.filter((row) => row.status === 'wrong' || row.status === 'blank').forEach((row) => {
        const key = `${normalize(row.area)}|${normalize(row.skill)}`;
        const group = groupMap.get(key) ?? { key, area: row.area, subject: row.subject, skill: row.skill, numbers: [] };
        group.numbers.push(row.number); groupMap.set(key, group);
      });
      const groups = [...groupMap.values()].map((group) => ({
        ...group,
        practice: [...practice].sort((a, b) => practiceScore(b, group) - practiceScore(a, group)).filter((question) => practiceScore(question, group) > 0).slice(0, 8),
      })).sort((a, b) => b.numbers.length - a.numbers.length);
      const validRows = rows.filter((row) => ['correct', 'wrong', 'blank'].includes(row.status));
      const next: Analysis = {
        rows, areaScores: [...areaMap.values()].sort((a, b) => (a.correct / Math.max(1, a.total)) - (b.correct / Math.max(1, b.total))), groups,
        recognized: mode === 'answers' ? userAnswers.size : wrongNumbers.length,
        keyCoverage: mappings.length, correct: rows.filter((row) => row.status === 'correct').length,
        wrong: rows.filter((row) => row.status === 'wrong').length,
        blank: rows.filter((row) => row.status === 'blank').length,
        annulled: rows.filter((row) => row.status === 'annulled').length, valid: validRows.length,
      };
      setAnalysis(next);
      setReasons(Object.fromEntries(rows.filter((row) => row.status === 'wrong' || row.status === 'blank').map((row) => [row.number, row.status === 'blank' ? 'tempo' : 'conteudo'])));
      if (rows.some((row) => row.status === 'unmapped')) setMessage('Algumas questões não têm gabarito ou indexação suficiente. Elas aparecem como “sem correção” e não entram no percentual.');
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      if (code === 'answers') setMessage('Cole suas respostas para iniciar a correção.');
      else if (code === 'errors') setMessage('Informe pelo menos um número de questão errada.');
      else if (code === 'key') setMessage(isEnem ? 'O gabarito deste caderno ainda não está indexado.' : 'Cole também o gabarito oficial da CMMG.');
      else setMessage('Não foi possível corrigir agora. Confira os dados e tente novamente.');
    } finally { setBusy(false); }
  };

  const saveDiagnosis = async () => {
    if (!supabase || !analysis) return;
    const mistakes = analysis.rows.filter((row) => row.status === 'wrong' || row.status === 'blank');
    setSaving(true); setMessage('');
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw new Error('login');
      if (mistakes.length) {
        const { error } = await supabase.from('student_skill_diagnostics').insert(mistakes.map((row) => ({
          user_id: data.user!.id, exam_id: config.examId, skill_code: row.item?.skill_code ?? null, area: row.area,
          question_text: `${config.label} ${year} · questão ${row.number}`, correct: false,
          confidence: row.item?.skill_name ? 1 : 0.65,
          error_type: reasons[row.number] ?? (row.status === 'blank' ? 'tempo' : 'conteudo'),
          error_detail: `Resposta ${row.userAnswer ?? 'não informada'} · gabarito ${row.correctAnswer ?? 'não indexado'}`,
          diagnosis: { source: isEnem ? 'official_exam_review_v3' : 'manual_official_key_review_v3', question_number: row.number, skill_name: row.skill, subject: row.subject, year, exam_model: exam },
        })));
        if (error) throw error;
      }
      if (analysis.areaScores.length) {
        const { error } = await supabase.from('student_exam_attempts').insert(analysis.areaScores.map((score) => ({
          user_id: data.user!.id, exam_id: config.examId, exam_year: year, area: score.area,
          correct: score.correct, total: score.total, score: null, occurred_at: new Date().toISOString().slice(0, 10),
          metadata: { source: 'exam_review_v3', exam_model: exam, raw_accuracy: Math.round(score.correct / Math.max(1, score.total) * 100) },
        })));
        if (error) throw error;
      }
      if (isEnem && bookletId && mistakes.length) {
        const reports = mistakes.filter((row) => row.item).map((row) => ({
          user_id: data.user!.id, booklet_id: bookletId, item_id: row.item!.id, question_number: row.number,
          area: row.area, subject: row.subject, skill_code: row.item!.skill_code, skill_name: row.item!.skill_name,
          error_type: reasons[row.number] ?? 'conteudo',
        }));
        if (reports.length) await supabase.from('official_exam_error_reports').upsert(reports, { onConflict: 'user_id,booklet_id,question_number' });
      }
      window.dispatchEvent(new CustomEvent('conectae:diagnostic-saved'));
      setMessage(`Diagnóstico salvo: ${mistakes.length} erro(s) e ${analysis.areaScores.length} resultado(s) por área enviados ao seu Plano.`);
    } catch { setMessage('Não foi possível salvar o diagnóstico agora. Tente novamente.'); }
    finally { setSaving(false); }
  };

  const accuracy = analysis?.valid ? Math.round(analysis.correct / analysis.valid * 100) : 0;
  const officialSource = isEnem ? booklet?.source_pdf_url : config.source;
  const officialKeySource = isEnem ? booklet?.answer_key_url : config.source;

  return <section id="correcao-simulado" className="max-w-[1180px] mx-auto px-4 md:px-6 py-8 text-white font-['Plus_Jakarta_Sans'] scroll-mt-24">
    <div className="rounded-[24px] border border-[#173765] bg-[#06152f] p-5 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><div className="flex items-center gap-2 text-xs font-extrabold text-[#72a5ff]"><BookOpenCheck size={16}/>CORREÇÃO COMPLETA</div><h2 className="mt-2 text-2xl md:text-4xl font-extrabold tracking-[-.04em]">Corrija ENEM ou CMMG de verdade.</h2><p className="mt-2 max-w-3xl text-sm text-[#9fb5d4]">Compare respostas com o gabarito, veja acertos por matéria, classifique cada erro e envie uma recuperação precisa para o seu Plano.</p></div>
        <div className="rounded-2xl border border-[#234576] bg-[#081a38] px-4 py-3"><div className="text-2xl font-extrabold text-[#72a5ff]">{practice.length}</div><div className="text-[11px] font-bold text-[#9fb5d4]">QUESTÕES DE TREINO DISPONÍVEIS</div></div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        <label className="text-xs font-bold text-[#b8cae4]">Prova<select value={exam} onChange={(event) => setExam(event.target.value as ExamChoice)} className="mt-1 w-full rounded-xl border border-[#234576] bg-[#081a38] p-3 text-white"><option value="enem">ENEM oficial</option><option value="cmmg-medicina">CMMG — Medicina (56 objetivas)</option><option value="cmmg-effpo">CMMG — EFFPO (40 objetivas)</option></select></label>
        {isEnem ? <><label className="text-xs font-bold text-[#b8cae4]">Ano<select value={year} onChange={(event) => setYear(Number(event.target.value))} className="mt-1 w-full rounded-xl border border-[#234576] bg-[#081a38] p-3 text-white">{availableYears.map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-xs font-bold text-[#b8cae4]">Aplicação<select value={editionId} onChange={(event) => setEditionId(event.target.value)} className="mt-1 w-full rounded-xl border border-[#234576] bg-[#081a38] p-3 text-white">{availableEditions.map((edition) => <option key={edition.id} value={edition.id}>{edition.application_label || edition.application}</option>)}</select></label></> : <label className="text-xs font-bold text-[#b8cae4]">Ano<input type="number" value={year} onChange={(event) => setYear(Number(event.target.value))} className="mt-1 w-full rounded-xl border border-[#234576] bg-[#081a38] p-3 text-white"/></label>}
      </div>
      {isEnem && <div className="mt-3 grid gap-3 md:grid-cols-2"><label className="text-xs font-bold text-[#b8cae4]">Dia e caderno<select value={bookletId} onChange={(event) => setBookletId(event.target.value)} className="mt-1 w-full rounded-xl border border-[#234576] bg-[#081a38] p-3 text-white">{booklets.length ? booklets.map((item) => <option key={item.id} value={item.id}>Dia {item.day} · {item.color} · caderno {item.booklet_code}</option>) : <option value="">Caderno ainda não indexado</option>}</select></label><label className="text-xs font-bold text-[#b8cae4]">Língua estrangeira<select value={language} onChange={(event) => setLanguage(event.target.value)} className="mt-1 w-full rounded-xl border border-[#234576] bg-[#081a38] p-3 text-white"><option value="ingles">Inglês</option><option value="espanhol">Espanhol</option></select></label></div>}

      <div className="mt-6 flex flex-wrap gap-2">{([['answers', 'Tenho minhas respostas'], ['errors', 'Só sei quais errei']] as [ReviewMode, string][]).map(([value, label]) => <button key={value} onClick={() => setMode(value)} className={`rounded-xl border px-4 py-2.5 text-sm font-extrabold ${mode === value ? 'border-[#72a5ff] bg-[#246cff] text-white' : 'border-[#234576] bg-[#081a38] text-[#b8cae4]'}`}>{label}</button>)}</div>

      {mode === 'answers' ? <div className={`mt-4 grid gap-4 ${isEnem ? '' : 'lg:grid-cols-2'}`}>
        {!isEnem && <label className="text-xs font-bold text-[#b8cae4]">Gabarito oficial<textarea value={officialKeyRaw} onChange={(event) => setOfficialKeyRaw(event.target.value)} className="mt-2 min-h-[128px] w-full rounded-xl border border-[#234576] bg-[#081a38] p-3 text-white" placeholder="Cole a sequência oficial: ABCDE... ou 1-A, 2-C, 3-B..."/><span className="mt-1 block font-normal text-[#839ab9]">{recognizedKey}/{end - start + 1} respostas do gabarito reconhecidas</span></label>}
        <label className="text-xs font-bold text-[#b8cae4]">Suas respostas<textarea value={answerRaw} onChange={(event) => setAnswerRaw(event.target.value)} className="mt-2 min-h-[128px] w-full rounded-xl border border-[#234576] bg-[#081a38] p-3 text-white" placeholder="Cole a sequência: ABCDE... ou 1-A, 2-C, 3-B... Use - para branco."/><span className="mt-1 block font-normal text-[#839ab9]">{recognizedAnswers}/{end - start + 1} respostas reconhecidas · questões {start}–{end}</span></label>
      </div> : <label className="mt-4 block text-xs font-bold text-[#b8cae4]">Questões erradas<textarea value={wrongRaw} onChange={(event) => setWrongRaw(event.target.value)} className="mt-2 min-h-[100px] w-full rounded-xl border border-[#234576] bg-[#081a38] p-3 text-white" placeholder="Ex.: 12, 37, 84, 102 ou 90-95"/><span className="mt-1 block font-normal text-[#839ab9]">{wrongNumbers.length} número(s) reconhecido(s)</span></label>}

      <div className="mt-4 flex flex-wrap gap-2"><button onClick={runAnalysis} disabled={busy || (isEnem && !bookletId)} className="inline-flex items-center gap-2 rounded-xl bg-[#246cff] px-5 py-3 text-sm font-extrabold disabled:opacity-40">{busy ? <Loader2 size={16} className="animate-spin"/> : <ClipboardCheck size={16}/>}Corrigir agora</button>{officialSource && <a href={officialSource} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-[#234576] px-4 py-3 text-sm font-bold">Abrir prova/manual oficial <ExternalLink size={15}/></a>}{officialKeySource && <a href={officialKeySource} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-[#234576] px-4 py-3 text-sm font-bold">Conferir fonte do gabarito <ExternalLink size={15}/></a>}</div>
      {message && <div className="mt-4 flex gap-2 rounded-xl border border-[#234576] bg-[#081a38] p-3 text-sm text-[#b8cae4]"><AlertCircle size={17} className="shrink-0 text-[#72a5ff]"/>{message}</div>}

      {analysis && <div className="mt-7 border-t border-[#173765] pt-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5"><div className="col-span-2 rounded-2xl border border-[#31588e] bg-[#0b2856] p-4 md:col-span-1"><BarChart3 className="text-[#72a5ff]" size={20}/><div className="mt-2 text-3xl font-extrabold">{mode === 'answers' ? `${accuracy}%` : '—'}</div><div className="text-xs text-[#9fb5d4]">{isEnem ? 'ACERTO BRUTO, SEM TRI' : 'ACERTO OBJETIVO'}</div></div>{[[CheckCircle2, analysis.correct, 'Acertos', 'text-emerald-300'], [XCircle, analysis.wrong, 'Erros', 'text-red-300'], [FileCheck2, analysis.blank, 'Em branco', 'text-amber-200'], [Target, analysis.annulled, 'Anuladas', 'text-violet-200']].map(([Icon, value, label, color]) => { const I = Icon as typeof CheckCircle2; return <div key={String(label)} className="rounded-2xl border border-[#234576] bg-[#081a38] p-4"><I size={18} className={String(color)}/><div className="mt-2 text-2xl font-extrabold">{String(value)}</div><div className="text-xs text-[#9fb5d4]">{String(label)}</div></div>; })}</div>
        {isEnem && mode === 'answers' && <p className="mt-3 text-xs leading-relaxed text-[#839ab9]">A quantidade de acertos é exata para o gabarito selecionado. A nota TRI não é estimada: ela depende dos parâmetros dos itens e da coerência do padrão de respostas, não apenas do total de acertos.</p>}

        {analysis.areaScores.length > 0 && <div className="mt-6"><h3 className="text-lg font-extrabold">Desempenho por matéria</h3><div className="mt-3 grid gap-3 md:grid-cols-2">{analysis.areaScores.map((score) => { const percent = Math.round(score.correct / Math.max(1, score.total) * 100); return <div key={score.area} className="rounded-2xl border border-[#234576] bg-[#081a38] p-4"><div className="flex justify-between gap-3"><strong>{score.area}</strong><span className={percent < 60 ? 'text-amber-200' : 'text-emerald-300'}>{score.correct}/{score.total} · {percent}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#06152f]"><span className="block h-full rounded-full bg-[#246cff]" style={{ width: `${percent}%` }}/></div></div>; })}</div></div>}

        {analysis.groups.length > 0 && <div className="mt-7"><div className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-xl font-extrabold">Mapa dos erros</h3><p className="mt-1 text-sm text-[#9fb5d4]">Os pontos mais repetidos aparecem primeiro. A habilidade só é afirmada quando a questão está indexada; caso contrário, usamos apenas a matéria.</p></div><button onClick={saveDiagnosis} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-sm font-extrabold text-[#06152f] disabled:opacity-50">{saving ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>}Salvar diagnóstico no Plano</button></div>
          <div className="mt-4 grid gap-3">{analysis.groups.map((group, index) => <article key={group.key} className="rounded-2xl border border-[#234576] bg-[#081a38] p-4 md:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-xs font-extrabold text-[#72a5ff]">PRIORIDADE {index + 1} · {group.numbers.length} ERRO(S)</div><h4 className="mt-1 text-lg font-extrabold">{group.area} · {group.skill}</h4><p className="mt-1 text-xs text-[#9fb5d4]">Questões {group.numbers.join(', ')}</p></div><div className="rounded-xl border border-[#31588e] bg-[#0b2856] px-3 py-2 text-xs font-bold">{group.practice.length} semelhantes no banco</div></div><div className="mt-4 grid gap-2 md:grid-cols-3"><div className="rounded-xl border border-[#234576] p-3 text-xs"><b className="text-white">Hoje:</b> refaça as questões sem olhar o gabarito.</div><div className="rounded-xl border border-[#234576] p-3 text-xs"><b className="text-white">Em 7 dias:</b> resolva {Math.max(10, group.numbers.length * 5)} semelhantes.</div><div className="rounded-xl border border-[#234576] p-3 text-xs"><b className="text-white">Em 30 dias:</b> faça novo bloco cronometrado.</div></div></article>)}</div>
        </div>}

        {analysis.rows.some((row) => row.status === 'wrong' || row.status === 'blank') && <details className="mt-6 rounded-2xl border border-[#234576] bg-[#081a38] p-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-extrabold">Classificar a causa de cada erro <ChevronDown size={18}/></summary><p className="mt-2 text-xs text-[#9fb5d4]">Isso muda a recuperação enviada ao Plano: conteúdo, interpretação, cálculo, desatenção ou tempo.</p><div className="mt-4 grid gap-2">{analysis.rows.filter((row) => row.status === 'wrong' || row.status === 'blank').map((row) => <label key={row.number} className="grid gap-2 rounded-xl border border-[#234576] p-3 text-xs md:grid-cols-[1fr_240px] md:items-center"><span><b>Questão {row.number}</b> · {row.area} · {row.skill}</span><select value={reasons[row.number] ?? 'conteudo'} onChange={(event) => setReasons((current) => ({ ...current, [row.number]: event.target.value }))} className="rounded-lg border border-[#31588e] bg-[#06152f] p-2 text-white">{REASONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>)}</div></details>}
      </div>}
    </div>
  </section>;
}
