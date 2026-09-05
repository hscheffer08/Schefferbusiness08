import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ExternalLink, Loader2, Search, X, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type ExamId = 'enem' | 'cmmg' | 'fuvest' | 'insper' | 'link';
type Mode = 'official' | 'adapted' | 'authorial';

type OfficialRef = {
  question_id: string;
  vestibular: string;
  year: number;
  question_number: number;
  area: string | null;
  subject: string | null;
  skill_name: string | null;
  correct_option: string | null;
  source_pdf_url: string | null;
  answer_key_url: string | null;
  source_url: string | null;
};

type PracticeQuestion = {
  id: number;
  exam_id: ExamId;
  area: string;
  skill_name: string;
  difficulty: number;
  prompt: string;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  option_e: string | null;
  correct_option: string | null;
  explanation: string | null;
  source_kind: string | null;
  source_exam_year: number | null;
  source_question_number: number | null;
  source_exam_label: string | null;
  source_exam_url: string | null;
  source_answer_url: string | null;
};

type Extracted = {
  prompt: string;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  option_e: string | null;
  needs_source_image: boolean;
  image_note: string | null;
  confidence: number;
};

type ExamConfig = {
  id: ExamId;
  label: string;
  vestibular?: string;
  areas: string[];
};

const EXAMS: ExamConfig[] = [
  { id: 'enem', label: 'ENEM', vestibular: 'ENEM', areas: ['Linguagens', 'Humanas', 'Natureza', 'Matemática'] },
  { id: 'cmmg', label: 'CMMG', vestibular: 'Vestibular Ciências Médicas-MG', areas: ['Linguagens', 'Natureza', 'Matemática'] },
  { id: 'fuvest', label: 'FUVEST', areas: [] },
  { id: 'insper', label: 'Insper', areas: [] },
  { id: 'link', label: 'Link', areas: [] },
];

const LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;

function optionText(source: Extracted | PracticeQuestion | null, letter: typeof LETTERS[number]) {
  if (!source) return null;
  const key = `option_${letter.toLowerCase()}` as 'option_a' | 'option_b' | 'option_c' | 'option_d' | 'option_e';
  return source[key] ?? null;
}

export default function OfficialQuestionWorkspaceV2() {
  const [exam, setExam] = useState<ExamId>(() => {
    const saved = localStorage.getItem('conectae:active-exam') as ExamId | null;
    return EXAMS.some((item) => item.id === saved) ? saved! : 'enem';
  });
  const [mode, setMode] = useState<Mode>('official');
  const [official, setOfficial] = useState<OfficialRef[]>([]);
  const [practice, setPractice] = useState<PracticeQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [area, setArea] = useState('Todas');
  const [year, setYear] = useState('Todos');
  const [search, setSearch] = useState('');

  const [activeOfficial, setActiveOfficial] = useState<OfficialRef | null>(null);
  const [activePractice, setActivePractice] = useState<PracticeQuestion | null>(null);
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [selected, setSelected] = useState('');
  const [correct, setCorrect] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [answering, setAnswering] = useState(false);

  const config = EXAMS.find((item) => item.id === exam)!;
  const areasKey = config.areas.join('|');

  useEffect(() => {
    localStorage.setItem('conectae:active-exam', exam);
    setArea('Todas');
    setYear('Todos');
    setSearch('');
    setMode(config.vestibular ? 'official' : 'authorial');
  }, [exam, config.vestibular]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }
      setLoading(true);

      const practicePromise = supabase
        .from('exam_practice_questions')
        .select('id,exam_id,area,skill_name,difficulty,prompt,option_a,option_b,option_c,option_d,option_e,correct_option,explanation,source_kind,source_exam_year,source_question_number,source_exam_label,source_exam_url,source_answer_url')
        .eq('active', true)
        .eq('exam_id', exam)
        .range(0, 1499);

      let refs: OfficialRef[] = [];
      if (config.vestibular) {
        const batches = await Promise.all(
          config.areas.map((examArea) =>
            supabase
              .from('official_vestibular_question_bank')
              .select('question_id,vestibular,year,question_number,area,subject,skill_name,correct_option,source_pdf_url,answer_key_url,source_url')
              .eq('vestibular', config.vestibular!)
              .eq('area', examArea)
              .not('source_pdf_url', 'is', null)
              .order('year', { ascending: false })
              .order('question_number', { ascending: true })
              .limit(60)
          )
        );
        refs = batches.flatMap((batch) => (batch.data ?? []) as OfficialRef[]);
      }

      const practiceResult = await practicePromise;
      if (!alive) return;
      setOfficial(refs);
      setPractice((practiceResult.data ?? []) as PracticeQuestion[]);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [exam, config.vestibular, areasKey]);

  const adapted = useMemo(() => practice.filter((q) => q.source_kind === 'official_adapted'), [practice]);
  const authorial = useMemo(() => practice.filter((q) => !q.source_kind || q.source_kind === 'authorial'), [practice]);
  const officialAreaCounts = useMemo(
    () => Object.fromEntries(config.areas.map((examArea) => [examArea, official.filter((q) => q.area === examArea).length])),
    [official, config.areas]
  );

  const rows = mode === 'official' ? official : mode === 'adapted' ? adapted : authorial;
  const availableAreas = mode === 'official'
    ? config.areas
    : Array.from(new Set((rows as PracticeQuestion[]).map((q) => q.area).filter(Boolean)));

  const years = useMemo(() => {
    const values = rows
      .map((q: OfficialRef | PracticeQuestion) => mode === 'official' ? (q as OfficialRef).year : (q as PracticeQuestion).source_exam_year)
      .filter((value): value is number => Number.isFinite(value));
    return ['Todos', ...Array.from(new Set(values)).sort((a, b) => b - a).map(String)];
  }, [rows, mode]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((raw) => {
      const q = raw as OfficialRef & PracticeQuestion;
      if (area !== 'Todas' && q.area !== area) return false;
      const qYear = mode === 'official' ? q.year : q.source_exam_year;
      if (year !== 'Todos' && String(qYear) !== year) return false;
      if (!term) return true;
      const haystack = mode === 'official'
        ? `${q.area ?? ''} ${q.subject ?? ''} ${q.skill_name ?? ''} questão ${q.question_number} ${q.year}`
        : `${q.area ?? ''} ${q.skill_name ?? ''} ${q.prompt ?? ''} ${q.source_question_number ?? ''}`;
      return haystack.toLowerCase().includes(term);
    });
  }, [rows, area, year, search, mode]);

  const modalOpen = Boolean(activeOfficial || activePractice);
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('conectae:question-modal', { detail: { open: modalOpen } }));
    document.body.style.overflow = modalOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
      window.dispatchEvent(new CustomEvent('conectae:question-modal', { detail: { open: false } }));
    };
  }, [modalOpen]);

  const resetAttempt = () => {
    setSelected('');
    setCorrect(null);
    setSubmitted(false);
    setAnswering(false);
    setExtracted(null);
    setExtractError('');
  };

  const close = () => {
    setActiveOfficial(null);
    setActivePractice(null);
    resetAttempt();
  };

  const authHeaders = async () => {
    const session = await supabase?.auth.getSession();
    const token = session?.data.session?.access_token;
    return token
      ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      : { 'Content-Type': 'application/json' };
  };

  const openOfficial = async (q: OfficialRef) => {
    resetAttempt();
    setActiveOfficial(q);
    setActivePractice(null);
    setExtracting(true);
    const cacheKey = `conectae:official-extract:${q.question_id}`;

    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setExtracted(JSON.parse(cached));
        setExtracting(false);
        return;
      }
    } catch {
      // Session cache is optional.
    }

    try {
      const response = await fetch('/api/extract-official-question', {
        method: 'POST',
        headers: await authHeaders(),
        body: JSON.stringify({
          mode: 'question',
          sourceUrl: q.source_pdf_url,
          questionNumber: q.question_number,
          exam: config.label,
          year: q.year,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.found) throw new Error(data.error || 'Não foi possível localizar essa questão na prova oficial.');

      const value: Extracted = {
        prompt: data.prompt,
        option_a: data.option_a,
        option_b: data.option_b,
        option_c: data.option_c,
        option_d: data.option_d,
        option_e: data.option_e,
        needs_source_image: Boolean(data.needs_source_image),
        image_note: data.image_note || null,
        confidence: Number(data.confidence) || 0,
      };
      setExtracted(value);
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(value));
      } catch {
        // Session cache is optional.
      }
    } catch (error: any) {
      setExtractError(error?.message || 'Não consegui carregar essa questão oficial agora.');
    } finally {
      setExtracting(false);
    }
  };

  const openPractice = (q: PracticeQuestion) => {
    resetAttempt();
    setActivePractice(q);
    setActiveOfficial(null);
  };

  const submitOfficial = async () => {
    if (!activeOfficial || !selected || submitted) return;
    setAnswering(true);
    try {
      let answer = activeOfficial.correct_option?.toUpperCase() || null;
      if (!answer && activeOfficial.answer_key_url) {
        const response = await fetch('/api/extract-official-question', {
          method: 'POST',
          headers: await authHeaders(),
          body: JSON.stringify({
            mode: 'answer',
            sourceUrl: activeOfficial.answer_key_url,
            questionNumber: activeOfficial.question_number,
            exam: config.label,
            year: activeOfficial.year,
          }),
        });
        const data = await response.json();
        if (response.ok && data.correct_option) answer = String(data.correct_option).toUpperCase();
      }
      setCorrect(answer);
      setSubmitted(true);
    } finally {
      setAnswering(false);
    }
  };

  const submitPractice = () => {
    if (!activePractice || !selected || submitted) return;
    setCorrect(activePractice.correct_option?.toUpperCase() || null);
    setSubmitted(true);
  };

  const activeSource: Extracted | PracticeQuestion | null = activeOfficial ? extracted : activePractice;
  const activePrompt = activeOfficial ? extracted?.prompt : activePractice?.prompt;
  const result = Boolean(submitted && correct && selected === correct);

  if (loading) {
    return (
      <div className="grid min-h-[260px] place-items-center rounded-2xl border border-[#173765] bg-[#06152f]">
        <div className="flex items-center gap-2 text-sm font-bold text-[#9fb5d4]"><Loader2 size={17} className="animate-spin" />Carregando banco oficial…</div>
      </div>
    );
  }

  return (
    <section className="pb-8">
      <div className="mb-4">
        <div className="text-[11px] font-extrabold uppercase tracking-[.1em] text-[#72a5ff]">Banco de questões</div>
        <h1 className="mt-1 text-2xl font-extrabold tracking-[-.035em] md:text-3xl">Questões oficiais para resolver aqui.</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#93a9c9]">A questão vem da prova oficial, você responde dentro do Conectaê e o gabarito só aparece depois da tentativa.</p>
      </div>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {EXAMS.map((item) => (
          <button key={item.id} type="button" onClick={() => setExam(item.id)} className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-extrabold ${exam === item.id ? 'border-[#3479ff] bg-[#246cff] text-white' : 'border-[#234576] bg-[#071a38] text-[#a9bddc]'}`}>
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl border border-[#173765] bg-[#06152f] p-2">
        <button type="button" disabled={!config.vestibular} onClick={() => setMode('official')} className={`rounded-xl px-2 py-3 text-xs font-extrabold disabled:opacity-35 ${mode === 'official' ? 'bg-emerald-500/15 text-emerald-200' : 'text-[#9fb5d4]'}`}>
          Oficiais <span className="block text-lg">{official.length}</span>
        </button>
        <button type="button" onClick={() => setMode('adapted')} className={`rounded-xl px-2 py-3 text-xs font-extrabold ${mode === 'adapted' ? 'bg-[#0b2856] text-white' : 'text-[#9fb5d4]'}`}>
          Adaptadas <span className="block text-lg">{adapted.length}</span>
        </button>
        <button type="button" onClick={() => setMode('authorial')} className={`rounded-xl px-2 py-3 text-xs font-extrabold ${mode === 'authorial' ? 'bg-[#0b2856] text-white' : 'text-[#9fb5d4]'}`}>
          Estilo da prova <span className="block text-lg">{authorial.length}</span>
        </button>
      </div>

      {mode === 'official' && config.vestibular && (
        <div className="mt-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/[.05] p-4">
          <div className="font-extrabold">{config.label} · acervo oficial interativo</div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {config.areas.map((examArea) => (
              <button key={examArea} type="button" onClick={() => setArea(examArea)} className={`shrink-0 rounded-xl border px-3 py-2 text-left ${area === examArea ? 'border-emerald-300/50 bg-emerald-300/10' : 'border-[#234576] bg-[#071a38]'}`}>
                <strong className="block text-sm">{examArea}</strong>
                <span className="text-[10px] text-[#9fb5d4]">{officialAreaCounts[examArea] || 0} oficiais</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-[#8fa7c9]">Carregamos 60 itens oficiais por área quando disponíveis — acima da meta mínima de 50. O enunciado e as alternativas são lidos da prova oficial somente quando a questão é aberta.</p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => setArea('Todas')} className={`rounded-lg border px-3 py-2 text-xs font-bold ${area === 'Todas' ? 'border-[#3479ff] bg-[#123a78]' : 'border-[#203d67] bg-[#071a38] text-[#8fa7c9]'}`}>Todas as áreas</button>
        {availableAreas.map((examArea) => (
          <button type="button" key={examArea} onClick={() => setArea(examArea)} className={`rounded-lg border px-3 py-2 text-xs font-bold ${area === examArea ? 'border-[#3479ff] bg-[#123a78]' : 'border-[#203d67] bg-[#071a38] text-[#8fa7c9]'}`}>
            {examArea}
          </button>
        ))}
      </div>

      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6f8ebc]" size={16} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar conteúdo, matéria ou número" className="h-11 w-full rounded-xl border border-[#234576] bg-[#071a38] pl-10 pr-3 text-sm text-white outline-none placeholder:text-[#6680a5]" />
      </div>

      {years.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {years.map((value) => (
            <button type="button" key={value} onClick={() => setYear(value)} className={`shrink-0 rounded-lg border px-3 py-1.5 text-[11px] font-bold ${year === value ? 'border-[#3479ff] bg-[#123a78] text-white' : 'border-[#203d67] bg-[#071a38] text-[#8fa7c9]'}`}>
              {value === 'Todos' ? 'Todos os anos' : value}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 text-xs font-bold text-[#8fa7c9]">{filtered.length} {filtered.length === 1 ? 'questão encontrada' : 'questões encontradas'}</div>

      <div className="mt-3 grid gap-2.5 md:grid-cols-2">
        {filtered.slice(0, 120).map((raw) => {
          if (mode === 'official') {
            const q = raw as OfficialRef;
            return (
              <button type="button" key={q.question_id} onClick={() => openOfficial(q)} className="rounded-2xl border border-emerald-400/20 bg-[#06152f] p-4 text-left transition hover:border-emerald-300/50">
                <div className="flex items-center justify-between"><span className="rounded-full bg-emerald-300/10 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-emerald-200">Oficial</span><span className="text-[10px] text-[#708bb3]">{q.year}</span></div>
                <div className="mt-3 text-[11px] font-bold text-[#72a5ff]">{config.label} {q.year} · Questão {q.question_number}</div>
                <strong className="mt-1.5 block text-sm">{q.skill_name || q.subject || q.area || 'Questão oficial'}</strong>
                <p className="mt-2 text-xs text-[#8fa7c9]">Abrir e responder dentro do site</p>
              </button>
            );
          }

          const q = raw as PracticeQuestion;
          return (
            <button type="button" key={q.id} onClick={() => openPractice(q)} className="rounded-2xl border border-[#183965] bg-[#06152f] p-4 text-left transition hover:border-[#3479ff]">
              <div className="flex items-center justify-between"><span className="rounded-full bg-[#10294f] px-2 py-1 text-[9px] font-black uppercase tracking-wide text-[#9fb5d4]">{mode === 'adapted' ? 'Adaptada de prova real' : 'Estilo da prova'}</span><span className="text-[10px] text-[#708bb3]">nível {q.difficulty}/5</span></div>
              <div className="mt-3 text-[11px] font-bold text-[#72a5ff]">{config.label}{q.source_exam_year ? ` ${q.source_exam_year}` : ''}{q.source_question_number ? ` · Q${q.source_question_number}` : ''} · {q.area}</div>
              <strong className="mt-1.5 block text-sm">{q.skill_name}</strong>
              <p className="mt-2 line-clamp-2 text-xs text-[#8fa7c9]">{q.prompt}</p>
            </button>
          );
        })}
      </div>

      {!filtered.length && <div className="mt-4 rounded-2xl border border-[#173765] bg-[#06152f] p-5 text-sm text-[#9fb5d4]">Nenhuma questão com esses filtros.</div>}

      {modalOpen && (
        <div className="fixed inset-0 z-[220] overflow-y-auto bg-[#020817] text-white" role="dialog" aria-modal="true">
          <div className="mx-auto min-h-full w-full max-w-3xl px-4 pb-[calc(env(safe-area-inset-bottom)+28px)] pt-[max(12px,env(safe-area-inset-top))] md:px-6">
            <div className="sticky top-0 z-10 -mx-1 flex items-center justify-between gap-3 border-b border-[#173765] bg-[#020817]/97 px-1 py-3 backdrop-blur-xl">
              <div>
                <div className={`text-[11px] font-black uppercase tracking-wide ${activeOfficial ? 'text-emerald-200' : 'text-[#72a5ff]'}`}>{activeOfficial ? 'Questão oficial' : mode === 'adapted' ? 'Adaptada de prova real' : 'Estilo da prova'}</div>
                <div className="text-sm font-extrabold">
                  {config.label}
                  {activeOfficial ? ` ${activeOfficial.year} · Questão ${activeOfficial.question_number}` : ''}
                  {!activeOfficial && activePractice?.source_exam_year ? ` ${activePractice.source_exam_year}` : ''}
                  {!activeOfficial && activePractice?.source_question_number ? ` · Questão ${activePractice.source_question_number}` : ''}
                </div>
              </div>
              <button type="button" onClick={close} className="grid h-11 w-11 place-items-center rounded-xl border border-[#234576] bg-[#071a38]" aria-label="Fechar"><X size={20} /></button>
            </div>

            <div className="py-5">
              {extracting && (
                <div className="grid min-h-[260px] place-items-center"><div className="text-center"><Loader2 className="mx-auto animate-spin text-[#72a5ff]" /><p className="mt-3 text-sm text-[#9fb5d4]">Lendo a questão diretamente da prova oficial…</p></div></div>
              )}

              {!extracting && extractError && (
                <div className="rounded-2xl border border-rose-400/25 bg-rose-400/[.06] p-5">
                  <strong>Não consegui carregar essa questão.</strong>
                  <p className="mt-2 text-sm text-[#a9bddc]">{extractError}</p>
                  {activeOfficial?.source_pdf_url && <a href={activeOfficial.source_pdf_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#8bb8ff]"><ExternalLink size={15} />Abrir fonte oficial</a>}
                </div>
              )}

              {!extracting && !extractError && activePrompt && activeSource && (
                <>
                  <div className="text-xs font-bold text-[#72a5ff]">{activeOfficial?.area || activePractice?.area}</div>
                  <h2 className="mt-3 whitespace-pre-line text-lg font-extrabold leading-relaxed md:text-xl">{activePrompt}</h2>

                  {activeOfficial && extracted?.needs_source_image && (
                    <div className="mt-3 rounded-xl border border-amber-300/25 bg-amber-300/[.06] p-3 text-xs text-[#d8cba6]">Esta questão depende de figura ou gráfico. {extracted.image_note || 'Confira a figura na fonte oficial antes de responder.'}</div>
                  )}

                  <div className="mt-5 grid gap-2.5">
                    {LETTERS.map((letter) => {
                      const text = optionText(activeSource, letter);
                      if (!text) return null;
                      const chosen = selected === letter;
                      const isCorrect = submitted && correct === letter;
                      const isWrong = submitted && chosen && correct !== letter;
                      const classes = isCorrect
                        ? 'border-emerald-400 bg-emerald-400/10'
                        : isWrong
                          ? 'border-rose-400 bg-rose-400/10'
                          : chosen
                            ? 'border-[#3479ff] bg-[#123a78]'
                            : 'border-[#234576] bg-[#071a38]';
                      return (
                        <button type="button" key={letter} disabled={submitted} onClick={() => setSelected(letter)} className={`flex min-h-14 items-start gap-3 rounded-xl border px-4 py-3 text-left ${classes}`}>
                          <strong>{letter}</strong><span className="text-sm leading-relaxed">{text}</span>
                        </button>
                      );
                    })}
                  </div>

                  {!submitted ? (
                    <button type="button" disabled={!selected || answering} onClick={activeOfficial ? submitOfficial : submitPractice} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#246cff] px-4 text-sm font-extrabold disabled:opacity-40">
                      {answering && <Loader2 size={16} className="animate-spin" />}Confirmar resposta
                    </button>
                  ) : (
                    <div className={`mt-5 rounded-2xl border p-4 ${correct ? (result ? 'border-emerald-400/30 bg-emerald-400/[.07]' : 'border-rose-400/30 bg-rose-400/[.07]') : 'border-amber-300/25 bg-amber-300/[.05]'}`}>
                      <div className="flex items-center gap-2 font-extrabold">
                        {correct ? (result ? <><CheckCircle2 size={19} />Resposta correta</> : <><XCircle size={19} />Resposta incorreta</>) : 'Resposta registrada'}
                      </div>
                      {correct ? <p className="mt-2 text-sm text-[#b8cae4]">Gabarito oficial: <strong>{correct}</strong>.</p> : <p className="mt-2 text-sm text-[#b8cae4]">Não consegui ler automaticamente a letra do gabarito. A fonte oficial fica disponível abaixo.</p>}
                      {activePractice?.explanation && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[#a9bddc]">{activePractice.explanation}</p>}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(activeOfficial?.source_pdf_url || activePractice?.source_exam_url) && <a href={(activeOfficial?.source_pdf_url || activePractice?.source_exam_url)!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-[#234576] px-3 py-2 text-xs font-bold text-[#8bb8ff]"><ExternalLink size={14} />Conferir prova oficial</a>}
                        {(activeOfficial?.answer_key_url || activePractice?.source_answer_url) && <a href={(activeOfficial?.answer_key_url || activePractice?.source_answer_url)!} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-[#234576] px-3 py-2 text-xs font-bold text-[#8bb8ff]"><ExternalLink size={14} />Gabarito oficial</a>}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
