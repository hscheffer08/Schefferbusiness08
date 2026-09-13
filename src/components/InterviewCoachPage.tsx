import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BarChart3, Bot, CheckCircle2, Loader2, MessageSquareText, RefreshCcw, Send, Sparkles, Target, Trophy } from 'lucide-react';
import InterviewRecorder, { type InterviewAudio } from '@/components/InterviewRecorder';
import './interview-coach.css';
import { interviewActivities } from '@/lib/interview-activities';
import Auth from '@/components/Auth';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

type Institution = 'insper' | 'link';
type Scores = { clareza: number; especificidade: number; autenticidade: number; reflexao: number; aderencia: number };
type Detail = { criterion: string; evidence: string; impact: string; how: string; example: string; exercise: string };
type Voice = { transcript: string; duration: number; pace: string; pauses: string; fillers: string; articulation: string; intonation: string; limitations: string; observations: { time: string; evidence: string; impact: string; exercise: string }[] };
type Feedback = { detailed?: Detail[]; structure?: { opening: string; development: string; closing: string }; summary: string; strength: string; improvement: string; action: string; scores: Scores };
type Turn = { question: string; answer: string; feedback?: string; scores?: Scores; fullFeedback?: Feedback; voice?: Voice | null; delivery?: string };
type Report = { overallScore: number; verdict: string; strongestPoints: string[]; priorityImprovements: string[]; sevenDayPlan: string[]; finalTip: string };
type ApiResult = { voice?: Voice; model?: string; error?: string; question?: string; questionNumber?: number; competency?: string; feedback?: Feedback | null; complete?: boolean; report?: Report };


const institutions = {
  insper: { name: 'Insper', accent: '#ff6047', description: 'Motivação, repertório, maturidade, colaboração e clareza de projeto.', source: 'https://www.insper.edu.br/content/insper-portal/pt/quem-somos/faq-insper.html' },
  link: { name: 'Link School of Business', accent: '#72a5ff', description: 'Jornada, iniciativa, liderança, decisões, impacto e visão empreendedora.', source: 'https://lsb.edu.br/processo-seletivo' },
};
const scoreLabels: Array<[keyof Scores, string]> = [['clareza', 'Clareza'], ['especificidade', 'Exemplos concretos'], ['autenticidade', 'Autenticidade'], ['reflexao', 'Reflexão'], ['aderencia', 'Aderência']];

function InterviewCoach() {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [institution, setInstitution] = useState<Institution>('insper');
  const [course, setCourse] = useState('Administração');
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [audio, setAudio] = useState<InterviewAudio | null>(null);
  const [recording, setRecording] = useState(false);
  const [voice, setVoice] = useState<Voice | null>(null);
  const [activityFilter, setActivityFilter] = useState('Todas');
  const [started, setStarted] = useState(false);
  const [question, setQuestion] = useState('');
  const [questionNumber, setQuestionNumber] = useState(1);
  const [competency, setCompetency] = useState('');
  const [answer, setAnswer] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const active = institutions[institution];
  const progress = report ? 100 : started ? Math.round((questionNumber / totalQuestions) * 100) : 0;
  const averageScores = useMemo(() => {
    const rows = turns.flatMap((turn) => turn.scores ? [turn.scores] : []);
    if (!rows.length) return null;
    return Object.fromEntries(scoreLabels.map(([key]) => [key, Math.round(rows.reduce((sum, row) => sum + row[key], 0) / rows.length)])) as Scores;
  }, [turns]);

  useEffect(() => {
    document.title = 'Treino de entrevista para Insper e Link | Conectaê';
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) description.content = 'Pratique entrevistas de admissão para Insper e Link com 10 perguntas adaptativas, feedback por competência e plano de melhoria.';
  }, []);

  async function callApi(payload: Record<string, unknown>) {
    const session = await supabase?.auth.getSession();
    const token = session?.data.session?.access_token;
    if (!token) throw new Error('Entre na sua conta para usar a entrevista com IA.');
    const response = await fetch('/api/interview-coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...payload, totalQuestions }),
      signal: AbortSignal.timeout(230_000),
    });
    const data = await response.json() as ApiResult;
    if (!response.ok) throw new Error(data.error || 'Não foi possível continuar agora.');
    return data;
  }

  async function startInterview() {
    if (!user) { setShowAuth(true); return; }
    setBusy(true); setError(''); setFeedback(null); setReport(null); setTurns([]); setAudio(null); setVoice(null); setAnswer('');
    try {
      const data = await callApi({ institution, course, phase: 'start', history: [] });
      setQuestion(data.question || '');
      setQuestionNumber(data.questionNumber || 1);
      setCompetency(data.competency || '');
      setStarted(true);
      requestAnimationFrame(() => textareaRef.current?.focus());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível iniciar.');
    } finally {
      setBusy(false);
    }
  }

  async function sendAnswer() {
    const clean = answer.trim();
    if ((!audio && clean.length < 20) || busy || recording) return;
    const pendingTurn: Turn = { question, answer: audio ? '[Resposta em áudio: transcrição pendente]' : clean };
    const history = [...turns, pendingTurn];
    setBusy(true); setError('');
    try {
      const data = await callApi({ institution, course, phase: 'answer', history, audio });
      setTurns([...turns, { ...pendingTurn, answer: data.voice?.transcript || pendingTurn.answer, feedback: data.feedback?.summary, scores: data.feedback?.scores, fullFeedback: data.feedback || undefined, voice: data.voice, delivery: data.voice ? JSON.stringify({ ...data.voice, transcript: undefined }) : undefined }]);
      setVoice(data.voice || null); setAudio(null);
      setFeedback(data.feedback || null);
      setAnswer('');
      if (data.complete && data.report) {
        setReport(data.report);
      } else {
        setQuestion(data.question || '');
        setQuestionNumber(data.questionNumber || questionNumber + 1);
        setCompetency(data.competency || '');
        requestAnimationFrame(() => textareaRef.current?.focus());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível analisar a resposta.');
    } finally {
      setBusy(false);
    }
  }

  function startActivity(id: string) {
    if (!user) { setShowAuth(true); return; }
    const item = interviewActivities.find(row => row.id === id);
    if (!item) return;
    reset(); setTotalQuestions(1); setQuestion(item.question); setCompetency(item.category); setStarted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function reset() {
    setStarted(false); setQuestion(''); setQuestionNumber(1); setCompetency(''); setAnswer('');
    setTurns([]); setFeedback(null); setReport(null); setError(''); setAudio(null); setVoice(null); setTotalQuestions(10);
  }

  if (showAuth) return <div className="min-h-screen bg-[#f6f8ff] py-10"><Auth compact onBack={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} onPrivacy={() => window.location.assign('/privacidade')} onTerms={() => window.location.assign('/termos')} /></div>;

  return (
    <div className="interview-page min-h-screen bg-[#020817] text-white font-['Plus_Jakarta_Sans']">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[#246cff]/15 blur-[130px]" />
        <div className="absolute -bottom-52 -left-40 h-[520px] w-[520px] rounded-full bg-[#ff6047]/10 blur-[140px]" />
      </div>
      <header className="relative z-10 border-b border-white/5 bg-[#020817]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <button onClick={() => window.location.assign('/')} className="inline-flex items-center gap-2 text-sm font-bold text-[#9fb5d4] hover:text-white"><ArrowLeft className="h-4 w-4" />Início</button>
          <div className="text-center"><div className="text-lg font-black">Conecta<span className="text-[#72a5ff]">ê</span></div><div className="text-[10px] font-extrabold uppercase tracking-[.17em] text-[#7891b4]">Treino de entrevista</div></div>
          <div className="hidden text-xs font-bold text-[#7891b4] sm:block">Voz + texto · análise aprofundada</div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-12">
        {!started ? (
          <div className="mx-auto max-w-5xl grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
            <section>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#31588e] bg-[#0b2856] px-3 py-1.5 text-xs font-black text-[#a9c7ef]"><Sparkles className="h-4 w-4" />SIMULAÇÃO ADAPTATIVA</div>
              <h1 className="mt-5 text-4xl font-black leading-[1.02] tracking-[-.05em] md:text-6xl">Treine antes da <span className="text-[#72a5ff]">entrevista.</span></h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#a9bddc] md:text-lg">Responda por voz ou texto e descubra o que melhorar, com exemplos da sua resposta, exercícios e um plano de ação individual.</p>
              <div className="mt-7 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {['5, 10 ou 15 perguntas adaptativas', 'Gravação e análise da fala', '24 atividades + plano de 7 dias'].map((text, index) => <div key={text} className="flex items-center gap-3 rounded-2xl border border-[#173765] bg-[#06152f] px-4 py-3"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#246cff]/15 text-sm font-black text-[#72a5ff]">{index + 1}</span><span className="text-sm font-bold text-[#c4d4ea]">{text}</span></div>)}
              </div>
            </section>

            <section className="rounded-[28px] border border-[#234576] bg-gradient-to-b from-[#081a38] to-[#051127] p-5 shadow-2xl shadow-black/30 md:p-7">
              <h2 className="text-xl font-black">Para qual entrevista você quer treinar?</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {(Object.keys(institutions) as Institution[]).map((key) => {
                  const item = institutions[key]; const selected = institution === key;
                  return <button key={key} disabled={busy} onClick={() => setInstitution(key)} aria-pressed={selected} className={`rounded-2xl border p-4 text-left transition ${selected ? 'border-[#72a5ff] bg-[#0b2856]' : 'border-[#173765] bg-[#041027] hover:border-[#31588e]'}`}><span className="mb-3 block h-1.5 w-10 rounded-full" style={{ background: item.accent }} /><span className="block font-black">{item.name}</span><span className="mt-2 block text-sm leading-relaxed text-[#9fb5d4]">{item.description}</span>{selected && <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-[#8eb7ff]"><CheckCircle2 className="h-4 w-4" />Selecionada</span>}</button>;
                })}
              </div>
              <label className="mt-5 block text-sm font-bold text-[#c4d4ea]" htmlFor="interview-course">Curso pretendido</label>
              <input id="interview-course" disabled={busy} value={course} onChange={(event) => setCourse(event.target.value)} maxLength={100} placeholder="Ex.: Administração, Economia, Computação" className="mt-2 min-h-12 w-full rounded-xl border border-[#234576] bg-[#031027] px-4 text-base text-white outline-none placeholder:text-[#607a9f] focus:border-[#72a5ff]" />
              <label className="mt-5 block text-sm font-bold" htmlFor="interview-length">Duração do treino</label>
              <select id="interview-length" disabled={busy} value={totalQuestions} onChange={event => setTotalQuestions(Number(event.target.value))} className="mt-2 min-h-12 w-full rounded-xl border border-[#31588e] bg-[#031027] px-4 text-white">
                <option value={5}>5 perguntas · treino rápido</option><option value={10}>10 perguntas · entrevista completa</option><option value={15}>15 perguntas · aprofundamento</option>
              </select>
              {error && <p className="mt-4 rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</p>}
              <button onClick={startInterview} disabled={busy || loading || !course.trim()} className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#246cff] px-5 font-black transition hover:bg-[#3678ff] disabled:opacity-50">{busy ? <><Loader2 className="h-5 w-5 animate-spin" />Preparando entrevista…</> : <>Começar entrevista <ArrowRight className="h-5 w-5" /></>}</button>
              <p className="mt-4 text-xs leading-relaxed text-[#7891b4]">Treino independente, baseado em competências observáveis e informações públicas. Não reproduz perguntas sigilosas nem garante aprovação. <a href={active.source} target="_blank" rel="noreferrer" className="text-[#8eb7ff] underline underline-offset-2">Ver fonte oficial</a>.</p>
            </section>
          </div>
        ) : report ? (
          <div className="mx-auto max-w-5xl">
            <section className="overflow-hidden rounded-[30px] border border-[#31588e] bg-[#06152f] shadow-2xl shadow-black/30">
              <div className="grid gap-7 bg-gradient-to-br from-[#0b2856] to-[#071a38] p-6 md:grid-cols-[auto_1fr] md:p-9"><div className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-4 border-[#72a5ff] bg-[#031027]"><span className="text-4xl font-black">{report.overallScore}</span><span className="text-xs font-bold text-[#8da5c5]">de 100</span></div><div><div className="text-xs font-black uppercase tracking-[.16em] text-[#72a5ff]">Relatório final · {active.name}</div><h1 className="mt-2 text-3xl font-black md:text-5xl">Entrevista concluída</h1><p className="mt-3 max-w-2xl leading-relaxed text-[#b5c8e3]">{report.verdict}</p></div></div>
              <div className="grid gap-5 p-6 md:grid-cols-2 md:p-9">
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[.06] p-5"><h2 className="flex items-center gap-2 font-black text-emerald-200"><Trophy className="h-5 w-5" />Pontos mais fortes</h2><ul className="mt-4 space-y-3 text-sm text-[#c4d4ea]">{report.strongestPoints.map((item) => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />{item}</li>)}</ul></div>
                <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[.06] p-5"><h2 className="flex items-center gap-2 font-black text-amber-100"><Target className="h-5 w-5" />Prioridades de melhoria</h2><ul className="mt-4 space-y-3 text-sm text-[#c4d4ea]">{report.priorityImprovements.map((item) => <li key={item} className="flex gap-2"><ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />{item}</li>)}</ul></div>
                <div className="md:col-span-2 rounded-2xl border border-[#234576] bg-[#041027] p-5"><h2 className="flex items-center gap-2 font-black"><BarChart3 className="h-5 w-5 text-[#72a5ff]" />Plano de 7 dias</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{report.sevenDayPlan.map((item, index) => <div key={`${item}-${index}`} className="flex gap-3 rounded-xl border border-[#173765] bg-[#06152f] p-3 text-sm text-[#b5c8e3]"><span className="font-black text-[#72a5ff]">{index + 1}</span>{item.replace(/^dia\s*\d+\s*[:.-]?\s*/i, '')}</div>)}</div><p className="mt-5 rounded-xl bg-[#0b2856] px-4 py-3 text-sm font-bold text-[#d6e5f8]">{report.finalTip}</p></div>
              </div>
            </section>
            <div className="mt-5 flex flex-wrap justify-center gap-3"><button onClick={reset} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#246cff] px-5 font-black"><RefreshCcw className="h-4 w-4" />Treinar novamente</button><button onClick={() => window.location.assign('/')} className="min-h-12 rounded-xl border border-[#31588e] px-5 font-bold text-[#b5c8e3]">Voltar ao início</button></div>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
            <section className="rounded-[28px] border border-[#234576] bg-[#06152f] shadow-2xl shadow-black/25">
              <div className="border-b border-[#173765] p-5 md:p-6"><div className="flex items-center justify-between gap-3"><div><div className="text-xs font-black uppercase tracking-[.16em] text-[#72a5ff]">{active.name} · pergunta {questionNumber} de {totalQuestions}</div><div className="mt-2 text-sm font-bold text-[#8da5c5]">{competency || 'Entrevista adaptativa'}</div></div><Bot className="h-8 w-8 text-[#72a5ff]" /></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-[#102a54]"><div className="h-full rounded-full bg-gradient-to-r from-[#246cff] to-[#72a5ff] transition-all" style={{ width: `${Math.max(10, progress)}%` }} /></div></div>
              <div className="p-5 md:p-7"><div className="rounded-2xl border border-[#234576] bg-[#031027] p-5"><div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[.14em] text-[#8eb7ff]"><MessageSquareText className="h-4 w-4" />Entrevistador</div><h1 className="text-xl font-black leading-snug md:text-3xl">{question}</h1></div><InterviewRecorder key={questionNumber} disabled={busy} onChange={setAudio} onRecording={setRecording} /><label htmlFor="interview-answer" className="mt-6 block text-sm font-black">Sua resposta por texto</label><p className="mt-1 text-xs text-[#7891b4]">Use uma situação real. Se gravar, a IA avaliará o áudio; descarte a gravação para enviar por texto.</p><textarea ref={textareaRef} id="interview-answer" disabled={busy || recording || !!audio} value={answer} onChange={(event) => setAnswer(event.target.value)} rows={8} maxLength={8000} placeholder="Responda como falaria na entrevista…" className="mt-3 w-full resize-y rounded-2xl border border-[#234576] bg-[#031027] p-4 text-base leading-relaxed text-white outline-none placeholder:text-[#607a9f] focus:border-[#72a5ff]" /><div className="mt-2 flex items-center justify-between gap-3 text-xs text-[#607a9f]"><span>{audio ? 'Áudio pronto para análise' : 'Mínimo de 20 caracteres'}</span><span>{answer.length}/8000</span></div>{error && <p className="mt-4 rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</p>}<button onClick={sendAnswer} disabled={busy || recording || (!audio && answer.trim().length < 20)} className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#246cff] px-5 font-black transition hover:bg-[#3678ff] disabled:opacity-45">{busy ? <><Loader2 className="h-5 w-5 animate-spin" />Analisando sua resposta…</> : <><Send className="h-5 w-5" />Enviar resposta</>}</button></div>
            </section>
            <aside className="space-y-4"><div className="rounded-[24px] border border-[#234576] bg-[#051127] p-5"><h2 className="font-black">Feedback da última resposta</h2>{feedback ? <><p className="mt-3 text-sm leading-relaxed text-[#b5c8e3]">{feedback.summary}</p><div className="mt-4 rounded-xl bg-emerald-400/[.07] p-3 text-sm"><strong className="text-emerald-200">Funcionou:</strong><span className="mt-1 block text-[#b9d8cd]">{feedback.strength}</span></div><div className="mt-3 rounded-xl bg-amber-400/[.07] p-3 text-sm"><strong className="text-amber-100">Melhore:</strong><span className="mt-1 block text-[#d8ccb0]">{feedback.improvement}</span></div><div className="mt-3 rounded-xl bg-[#0b2856] p-3 text-sm"><strong className="text-[#8eb7ff]">Na próxima:</strong><span className="mt-1 block text-[#c4d4ea]">{feedback.action}</span></div></> : <p className="mt-3 text-sm leading-relaxed text-[#7891b4]">Depois da primeira resposta, você verá pontos fortes e uma correção prática aqui.</p>}</div><div className="rounded-[24px] border border-[#173765] bg-[#041027] p-5"><h2 className="text-sm font-black">Desempenho acumulado</h2><div className="mt-4 space-y-3">{scoreLabels.map(([key, label]) => { const value = averageScores?.[key] || 0; return <div key={key}><div className="mb-1 flex justify-between text-xs font-bold text-[#9fb5d4]"><span>{label}</span><span>{averageScores ? value : '—'}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#102a54]"><div className="h-full rounded-full bg-[#72a5ff] transition-all" style={{ width: `${value}%` }} /></div></div>; })}</div></div></aside>
            {feedback && <div className="lg:col-span-2"><DetailedFeedback feedback={feedback} voice={voice} /></div>}
          </div>
        )}
        {!started && <section className="mx-auto mt-10 max-w-5xl">
          <h2 className="text-2xl font-black">24 atividades para praticar</h2>
          <p className="mt-2 text-base text-[#b5c8e3]">Treinos autorais com correção individual por voz ou texto. Selecione a instituição acima e escolha uma atividade.</p>
          <label htmlFor="activity-filter" className="mt-4 block text-sm">Competência</label>
          <select id="activity-filter" value={activityFilter} onChange={event => setActivityFilter(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[#31588e] bg-[#031027] px-4">
            {['Todas', ...new Set(interviewActivities.map(item => item.category))].map(category => <option key={category}>{category}</option>)}
          </select>
          <div className="mt-5 grid gap-4 md:grid-cols-2">{interviewActivities.filter(item => activityFilter === 'Todas' || item.category === activityFilter).map(item => <article key={item.id} className="rounded-2xl border border-[#234576] bg-[#06152f] p-5">
            <h3 className="font-bold text-[#a9c7ef]">{item.title}</h3><p className="mt-3 text-base leading-relaxed">{item.question}</p><p className="mt-3 text-sm text-[#b5c8e3]">{item.target}</p><button disabled={busy || loading} onClick={() => startActivity(item.id)} className="mt-4 min-h-12 rounded-xl bg-[#246cff] px-4 font-bold disabled:opacity-50">Praticar com IA</button>
          </article>)}</div>
        </section>}
        {turns.length > 0 && <section className="mx-auto mt-8 max-w-5xl"><h2 className="mb-4 text-xl font-black">Respostas e análises desta sessão</h2><p className="mb-4 text-sm text-[#b5c8e3]">Disponíveis enquanto esta página estiver aberta. Os marcadores de áudio são aproximados.</p>{turns.map((turn, index) => <details key={index} className="mb-3 rounded-2xl border border-[#234576] bg-[#06152f] p-5"><summary className="cursor-pointer font-bold">{index + 1}. {turn.question}</summary><p className="mt-4 whitespace-pre-wrap leading-relaxed text-[#c4d4ea]">{turn.answer}</p>{turn.fullFeedback && <DetailedFeedback feedback={turn.fullFeedback} voice={turn.voice || null} />}</details>)}</section>}
      </main>
    </div>
  );
}

function DetailedFeedback({ feedback, voice }: { feedback: Feedback; voice: Voice | null }) {
  return <section className="mt-5 space-y-4 rounded-2xl border border-[#234576] bg-[#051127] p-5 md:p-7">
    <h2 className="text-xl font-black">O que melhorar e como treinar</h2>
    <div className="grid gap-4 md:grid-cols-2">{feedback.detailed?.map((item, index) => <article key={index} className="rounded-xl border border-[#31588e] bg-[#031027] p-4"><h3 className="font-bold text-[#8eb7ff]">{item.criterion}</h3>{[['Evidência', item.evidence], ['Por que importa', item.impact], ['Como melhorar', item.how], ['Exemplo de reformulação', item.example], ['Exercício', item.exercise]].map(([label, value]) => value && <p key={label} className="mt-3 text-base leading-relaxed text-[#c4d4ea]"><strong className="block text-white">{label}</strong>{value}</p>)}</article>)}</div>
    {feedback.structure && <div className="rounded-xl bg-[#0b2856] p-4"><h3 className="font-bold">Estrutura da resposta</h3>{[['Abertura', feedback.structure.opening], ['Desenvolvimento', feedback.structure.development], ['Fechamento', feedback.structure.closing]].map(([label, value]) => value && <p key={label} className="mt-3 text-base text-[#c4d4ea]"><strong>{label}: </strong>{value}</p>)}</div>}
    {voice ? <div className="space-y-4"><h3 className="text-lg font-bold">Análise da fala</h3><p className="text-sm text-[#b5c8e3]">Observações estimadas pela IA. Não são medições exatas nem avaliação de personalidade.</p><div className="grid gap-3 md:grid-cols-2">{[['Ritmo', voice.pace], ['Pausas', voice.pauses], ['Vícios e repetições', voice.fillers], ['Dicção e inteligibilidade', voice.articulation], ['Entonação', voice.intonation]].map(([label, value]) => <p key={label} className="rounded-xl bg-[#0b2856] p-4 text-base"><strong className="block mb-2">{label}</strong>{value || 'Não foi possível avaliar.'}</p>)}</div>{voice.observations.map((item, index) => <div key={index} className="rounded-xl border border-[#31588e] p-4"><p className="font-bold">{item.time}</p><p className="mt-2">{item.evidence}</p><p className="mt-2 text-[#b5c8e3]">{item.impact}</p><p className="mt-2"><strong>Treine assim: </strong>{item.exercise}</p></div>)}<p className="text-sm text-[#b5c8e3]">{voice.limitations}</p><details><summary className="cursor-pointer font-bold">Ver transcrição</summary><p className="mt-3 whitespace-pre-wrap text-base leading-relaxed">{voice.transcript}</p></details></div> : <p className="text-sm text-[#b5c8e3]">Resposta por texto: ritmo, pausas, dicção e entonação não foram avaliados.</p>}
  </section>;
}

export default function InterviewCoachPage() {
  return <AuthProvider><InterviewCoach /></AuthProvider>;
}
