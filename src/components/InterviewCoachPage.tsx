import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BarChart3, Bot, CheckCircle2, Loader2, MessageSquareText, RefreshCcw, Send, Sparkles, Target, Trophy } from 'lucide-react';
import Auth from '@/components/Auth';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

type Institution = 'insper' | 'link';
type Scores = { clareza: number; especificidade: number; autenticidade: number; reflexao: number; aderencia: number };
type Feedback = { summary: string; strength: string; improvement: string; action: string; scores: Scores };
type Turn = { question: string; answer: string; feedback?: string; scores?: Scores };
type Report = { overallScore: number; verdict: string; strongestPoints: string[]; priorityImprovements: string[]; sevenDayPlan: string[]; finalTip: string };
type ApiResult = { error?: string; question?: string; questionNumber?: number; competency?: string; feedback?: Feedback | null; complete?: boolean; report?: Report };

const TOTAL_QUESTIONS = 10;
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
  const progress = report ? 100 : started ? Math.round((questionNumber / TOTAL_QUESTIONS) * 100) : 0;
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
      body: JSON.stringify(payload),
    });
    const data = await response.json() as ApiResult;
    if (!response.ok) throw new Error(data.error || 'Não foi possível continuar agora.');
    return data;
  }

  async function startInterview() {
    if (!user) { setShowAuth(true); return; }
    setBusy(true); setError(''); setFeedback(null); setReport(null); setTurns([]);
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
    if (!clean || clean.length < 20 || busy) return;
    const pendingTurn: Turn = { question, answer: clean };
    const history = [...turns, pendingTurn];
    setBusy(true); setError('');
    try {
      const data = await callApi({ institution, course, phase: 'answer', history });
      setTurns([...turns, { ...pendingTurn, feedback: data.feedback?.summary, scores: data.feedback?.scores }]);
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

  function reset() {
    setStarted(false); setQuestion(''); setQuestionNumber(1); setCompetency(''); setAnswer('');
    setTurns([]); setFeedback(null); setReport(null); setError('');
  }

  if (showAuth) return <Auth onBack={() => setShowAuth(false)} onSuccess={() => setShowAuth(false)} onPrivacy={() => window.location.assign('/privacidade')} onTerms={() => window.location.assign('/termos')} />;

  return (
    <div className="min-h-screen bg-[#020817] text-white font-['Plus_Jakarta_Sans']">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[#246cff]/15 blur-[130px]" />
        <div className="absolute -bottom-52 -left-40 h-[520px] w-[520px] rounded-full bg-[#ff6047]/10 blur-[140px]" />
      </div>
      <header className="relative z-10 border-b border-white/5 bg-[#020817]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <button onClick={() => window.location.assign('/')} className="inline-flex items-center gap-2 text-sm font-bold text-[#9fb5d4] hover:text-white"><ArrowLeft className="h-4 w-4" />Início</button>
          <div className="text-center"><div className="text-lg font-black">Conecta<span className="text-[#72a5ff]">ê</span></div><div className="text-[10px] font-extrabold uppercase tracking-[.17em] text-[#7891b4]">Treino de entrevista</div></div>
          <div className="hidden text-xs font-bold text-[#7891b4] sm:block">10 perguntas · feedback individual</div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-12">
        {!started ? (
          <div className="mx-auto max-w-5xl grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-start">
            <section>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#31588e] bg-[#0b2856] px-3 py-1.5 text-xs font-black text-[#a9c7ef]"><Sparkles className="h-4 w-4" />SIMULAÇÃO ADAPTATIVA</div>
              <h1 className="mt-5 text-4xl font-black leading-[1.02] tracking-[-.05em] md:text-6xl">Treine antes da <span className="text-[#72a5ff]">entrevista.</span></h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-[#a9bddc] md:text-lg">Agora são 10 perguntas adaptativas para aprofundar motivação, liderança, decisões, colaboração, autoconhecimento e contribuição futura.</p>
              <div className="mt-7 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {['10 perguntas com aprofundamento', 'Feedback após cada resposta', 'Relatório final + plano de 7 dias'].map((text, index) => <div key={text} className="flex items-center gap-3 rounded-2xl border border-[#173765] bg-[#06152f] px-4 py-3"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#246cff]/15 text-sm font-black text-[#72a5ff]">{index + 1}</span><span className="text-sm font-bold text-[#c4d4ea]">{text}</span></div>)}
              </div>
            </section>

            <section className="rounded-[28px] border border-[#234576] bg-gradient-to-b from-[#081a38] to-[#051127] p-5 shadow-2xl shadow-black/30 md:p-7">
              <h2 className="text-xl font-black">Para qual entrevista você quer treinar?</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {(Object.keys(institutions) as Institution[]).map((key) => {
                  const item = institutions[key]; const selected = institution === key;
                  return <button key={key} onClick={() => setInstitution(key)} aria-pressed={selected} className={`rounded-2xl border p-4 text-left transition ${selected ? 'border-[#72a5ff] bg-[#0b2856]' : 'border-[#173765] bg-[#041027] hover:border-[#31588e]'}`}><span className="mb-3 block h-1.5 w-10 rounded-full" style={{ background: item.accent }} /><span className="block font-black">{item.name}</span><span className="mt-2 block text-sm leading-relaxed text-[#9fb5d4]">{item.description}</span>{selected && <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-[#8eb7ff]"><CheckCircle2 className="h-4 w-4" />Selecionada</span>}</button>;
                })}
              </div>
              <label className="mt-5 block text-sm font-bold text-[#c4d4ea]" htmlFor="interview-course">Curso pretendido</label>
              <input id="interview-course" value={course} onChange={(event) => setCourse(event.target.value)} maxLength={100} placeholder="Ex.: Administração, Economia, Computação" className="mt-2 min-h-12 w-full rounded-xl border border-[#234576] bg-[#031027] px-4 text-base text-white outline-none placeholder:text-[#607a9f] focus:border-[#72a5ff]" />
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
              <div className="border-b border-[#173765] p-5 md:p-6"><div className="flex items-center justify-between gap-3"><div><div className="text-xs font-black uppercase tracking-[.16em] text-[#72a5ff]">{active.name} · pergunta {questionNumber} de {TOTAL_QUESTIONS}</div><div className="mt-2 text-sm font-bold text-[#8da5c5]">{competency || 'Entrevista adaptativa'}</div></div><Bot className="h-8 w-8 text-[#72a5ff]" /></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-[#102a54]"><div className="h-full rounded-full bg-gradient-to-r from-[#246cff] to-[#72a5ff] transition-all" style={{ width: `${Math.max(10, progress)}%` }} /></div></div>
              <div className="p-5 md:p-7"><div className="rounded-2xl border border-[#234576] bg-[#031027] p-5"><div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[.14em] text-[#8eb7ff]"><MessageSquareText className="h-4 w-4" />Entrevistador</div><h1 className="text-xl font-black leading-snug md:text-3xl">{question}</h1></div><label htmlFor="interview-answer" className="mt-6 block text-sm font-black">Sua resposta</label><p className="mt-1 text-xs text-[#7891b4]">Use uma situação real. Explique seu papel, sua decisão, o resultado e o que aprendeu.</p><textarea ref={textareaRef} id="interview-answer" value={answer} onChange={(event) => setAnswer(event.target.value)} rows={8} maxLength={2400} placeholder="Responda como falaria na entrevista…" className="mt-3 w-full resize-y rounded-2xl border border-[#234576] bg-[#031027] p-4 text-base leading-relaxed text-white outline-none placeholder:text-[#607a9f] focus:border-[#72a5ff]" /><div className="mt-2 flex items-center justify-between gap-3 text-xs text-[#607a9f]"><span>Mínimo de 20 caracteres</span><span>{answer.length}/2400</span></div>{error && <p className="mt-4 rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</p>}<button onClick={sendAnswer} disabled={busy || answer.trim().length < 20} className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#246cff] px-5 font-black transition hover:bg-[#3678ff] disabled:opacity-45">{busy ? <><Loader2 className="h-5 w-5 animate-spin" />Analisando sua resposta…</> : <><Send className="h-5 w-5" />Enviar resposta</>}</button></div>
            </section>
            <aside className="space-y-4"><div className="rounded-[24px] border border-[#234576] bg-[#051127] p-5"><h2 className="font-black">Feedback da última resposta</h2>{feedback ? <><p className="mt-3 text-sm leading-relaxed text-[#b5c8e3]">{feedback.summary}</p><div className="mt-4 rounded-xl bg-emerald-400/[.07] p-3 text-sm"><strong className="text-emerald-200">Funcionou:</strong><span className="mt-1 block text-[#b9d8cd]">{feedback.strength}</span></div><div className="mt-3 rounded-xl bg-amber-400/[.07] p-3 text-sm"><strong className="text-amber-100">Melhore:</strong><span className="mt-1 block text-[#d8ccb0]">{feedback.improvement}</span></div><div className="mt-3 rounded-xl bg-[#0b2856] p-3 text-sm"><strong className="text-[#8eb7ff]">Na próxima:</strong><span className="mt-1 block text-[#c4d4ea]">{feedback.action}</span></div></> : <p className="mt-3 text-sm leading-relaxed text-[#7891b4]">Depois da primeira resposta, você verá pontos fortes e uma correção prática aqui.</p>}</div><div className="rounded-[24px] border border-[#173765] bg-[#041027] p-5"><h2 className="text-sm font-black">Desempenho acumulado</h2><div className="mt-4 space-y-3">{scoreLabels.map(([key, label]) => { const value = averageScores?.[key] || 0; return <div key={key}><div className="mb-1 flex justify-between text-xs font-bold text-[#9fb5d4]"><span>{label}</span><span>{averageScores ? value : '—'}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#102a54]"><div className="h-full rounded-full bg-[#72a5ff] transition-all" style={{ width: `${value}%` }} /></div></div>; })}</div></div></aside>
          </div>
        )}
      </main>
    </div>
  );
}

export default function InterviewCoachPage() {
  return <AuthProvider><InterviewCoach /></AuthProvider>;
}
