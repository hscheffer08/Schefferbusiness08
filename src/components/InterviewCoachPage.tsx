import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BarChart3, Bot, CheckCircle2, Clock, FileText, Languages, Loader2, MessageSquareText, RefreshCcw, Send, Sparkles, Target, Trophy, Video } from 'lucide-react';
import InterviewRecorder, { type InterviewAudio } from '@/components/InterviewRecorder';
import './interview-coach.css';
import { interviewActivities } from '@/lib/interview-activities';
import Auth from '@/components/Auth';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { ensureFreshSession } from '@/lib/supabase';

type Institution = 'link' | 'espm';
type InterviewMode = 'quick' | 'official' | 'intensive' | 'activity';
type Language = 'pt' | 'en';
type Scores = Record<string, number | null>;
type Detail = { criterion: string; evidence: string; impact: string; how: string; example: string; exercise: string };
type VisualFinding = { time: string; evidence: string; impact: string; how: string };
type VisualFeedback = { summary: string; posture: string; gestures: string; gaze: string; framing: string; frameFindings: VisualFinding[]; limitations: string };
type VoiceObservation = { time: string; evidence: string; impact: string; exercise?: string };
type Voice = {
  mediaKind?: 'audio' | 'video';
  transcript: string;
  duration: number;
  framesAnalyzed?: number;
  pace: string;
  pauses: string;
  fillers: string;
  articulation: string;
  intonation: string;
  limitations: string;
  observations: VoiceObservation[];
  visualObservations?: VoiceObservation[];
  posture?: string;
  gestures?: string;
  gazeToCamera?: string;
  framing?: string;
  visualLimitations?: string;
};
type Feedback = {
  detailed?: Detail[];
  structure?: { opening: string; development: string; closing: string };
  summary: string;
  strength: string;
  improvement: string;
  action: string;
  scores: Scores;
  coachingScores?: Scores;
  visual?: VisualFeedback | null;
};
type Turn = {
  question: string;
  answer: string;
  language: Language;
  feedback?: string;
  scores?: Scores;
  fullFeedback?: Feedback;
  voice?: Voice | null;
  delivery?: string;
};
type CriterionReport = { score: number | null; evidence: string; nextStep: string };
type Report = {
  overallScore: number | null;
  scoreLabel?: string;
  verdict: string;
  officialCriteria?: Record<string, CriterionReport> | null;
  strongestPoints: string[];
  priorityImprovements: string[];
  pressureQuestions?: string[];
  sevenDayPlan: string[];
  finalTip: string;
  elapsedSeconds?: number;
};
type ApiResult = {
  voice?: Voice;
  model?: string;
  error?: string;
  question?: string;
  questionNumber?: number;
  competency?: string;
  feedback?: Feedback | null;
  complete?: boolean;
  report?: Report;
  language?: Language;
  questionStyle?: string;
  targetMinutes?: number | null;
};

const LINK_MANUAL = 'https://linkschool.lsb.edu.br/hubfs/JORNADA%2027.1/Manual%20do%20Candidato%202027.1.pdf';

const institutions = {
  link: {
    name: 'Link School of Business',
    accent: '#72a5ff',
    description: 'Simulação 2027.1 com Inglês, Coragem, Capacidade de Trabalho e Vontade de Estar Aqui.',
    source: LINK_MANUAL,
  },
  espm: {
    name: 'ESPM',
    accent: '#ff6047',
    description: 'Entrevista 2027.1: inovação e criatividade, articulação conceitual, repertório, comunicação oral e solução de problemas.',
    source: 'https://www.espm.br/cursos-de-graduacao/processos-seletivos/vestibular/',
  },
};

const linkScoreLabels: Array<[string, string]> = [
  ['ingles', 'Inglês'],
  ['coragem', 'Coragem'],
  ['capacidadeTrabalho', 'Capacidade de trabalho'],
  ['vontade', 'Vontade de estar aqui'],
];
const espmScoreLabels: Array<[string, string]> = [
  ['clareza', 'Clareza'],
  ['especificidade', 'Exemplos concretos'],
  ['autenticidade', 'Autenticidade'],
  ['reflexao', 'Reflexão'],
  ['aderencia', 'Aderência'],
];
const coachingLabels: Array<[string, string]> = [
  ['clareza', 'Clareza'],
  ['especificidade', 'Especificidade'],
  ['estrutura', 'Estrutura'],
  ['concisao', 'Concisão'],
];

function totalForMode(mode: InterviewMode, institution: Institution) {
  if (mode === 'activity') return 1;
  if (mode === 'quick') return 5;
  if (mode === 'intensive') return 15;
  return institution === 'link' ? 12 : 10;
}

function formatClock(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  return Math.floor(safe / 60) + ':' + String(safe % 60).padStart(2, '0');
}

function scoreText(value: number | null | undefined) {
  return typeof value === 'number' ? String(value) : '—';
}

function FeedbackPanel({ feedback, voice, institution }: { feedback: Feedback | null; voice: Voice | null; institution: Institution }) {
  if (!feedback && !voice) return null;
  const scoreLabels = institution === 'link' ? linkScoreLabels : espmScoreLabels;

  return <section className="space-y-5 rounded-[24px] border border-[#234576] bg-[#06152f] p-5">
    {feedback && <>
      <div>
        <div className="text-xs font-black uppercase tracking-[.14em] text-[#72a5ff]">Feedback por IA</div>
        <p className="mt-2 text-base leading-relaxed text-[#d6e5f8]">{feedback.summary}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {scoreLabels.map(([key, label]) => <div key={key} className="rounded-xl border border-[#234576] bg-[#031027] p-4">
          <div className="text-xs font-bold text-[#8da5c5]">{label}</div>
          <div className="mt-1 text-2xl font-black">{scoreText(feedback.scores?.[key])}{typeof feedback.scores?.[key] === "number" ? <span className="ml-1 text-xs font-bold text-[#7891b4]">/100 treino</span> : null}</div>
        </div>)}
      </div>
      {institution === 'link' && <p className="text-xs leading-relaxed text-[#7891b4]">Os números acima são índices de treino do Conectaê. A Link publica os critérios e seus pesos, mas não uma escala oficial de 0 a 100 por critério.</p>}

      {feedback.coachingScores && <div>
        <div className="mb-2 text-xs font-black uppercase tracking-[.12em] text-[#8da5c5]">Métricas secundárias de coaching</div>
        <div className="grid gap-2 sm:grid-cols-4">
          {coachingLabels.map(([key, label]) => <div key={key} className="rounded-xl bg-[#0b2856] p-3 text-sm">
            <div className="text-[#9fb5d4]">{label}</div>
            <div className="mt-1 font-black">{scoreText(feedback.coachingScores?.[key])}</div>
          </div>)}
        </div>
      </div>}

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-emerald-400/[.06] p-4"><strong className="block text-emerald-200">Ponto forte</strong><p className="mt-2 text-sm text-[#c4d4ea]">{feedback.strength}</p></div>
        <div className="rounded-xl bg-amber-400/[.06] p-4"><strong className="block text-amber-100">Principal ajuste</strong><p className="mt-2 text-sm text-[#c4d4ea]">{feedback.improvement}</p></div>
        <div className="rounded-xl bg-[#0b2856] p-4"><strong className="block text-[#bcd4ff]">Próxima ação</strong><p className="mt-2 text-sm text-[#c4d4ea]">{feedback.action}</p></div>
      </div>

      {!!feedback.detailed?.length && <div>
        <h3 className="font-black">Análise do conteúdo</h3>
        <div className="mt-3 space-y-3">
          {feedback.detailed.map((item, index) => <article key={index} className="rounded-xl border border-[#234576] bg-[#031027] p-4">
            <div className="font-black text-[#8eb7ff]">{item.criterion}</div>
            {[['Evidência', item.evidence], ['Impacto', item.impact], ['Como corrigir', item.how], ['Exemplo fiel', item.example], ['Exercício', item.exercise]].map(([label, value]) => value && <p key={label} className="mt-3 text-sm leading-relaxed text-[#c4d4ea]"><strong className="block text-white">{label}</strong>{value}</p>)}
          </article>)}
        </div>
      </div>}

      {feedback.structure && <div className="rounded-xl bg-[#0b2856] p-4">
        <h3 className="font-black">Estrutura da resposta</h3>
        {[['Abertura', feedback.structure.opening], ['Desenvolvimento', feedback.structure.development], ['Fechamento', feedback.structure.closing]].map(([label, value]) => value && <p key={label} className="mt-3 text-sm text-[#c4d4ea]"><strong>{label}: </strong>{value}</p>)}
      </div>}

      {feedback.visual && <div className="rounded-2xl border border-[#31588e] bg-[#071a38] p-5">
        <div className="flex items-center gap-2 font-black"><Video className="h-5 w-5 text-[#72a5ff]" />Leitura visual por múltiplos frames</div>
        <p className="mt-2 text-sm leading-relaxed text-[#b5c8e3]">{feedback.visual.summary}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[['Postura observável', feedback.visual.posture], ['Gestos', feedback.visual.gestures], ['Direção do olhar', feedback.visual.gaze], ['Enquadramento', feedback.visual.framing]].map(([label, value]) => <div key={label} className="rounded-xl bg-[#031027] p-4 text-sm"><strong className="block mb-2">{label}</strong>{value || 'Sem evidência suficiente.'}</div>)}
        </div>
        {!!feedback.visual.frameFindings?.length && <div className="mt-4 space-y-2">
          {feedback.visual.frameFindings.map((item, index) => <div key={index} className="rounded-xl border border-[#234576] p-3 text-sm">
            <strong>{item.time}</strong>
            <p className="mt-1">{item.evidence}</p>
            <p className="mt-1 text-[#9fb5d4]">{item.impact}</p>
            <p className="mt-1"><strong>Treine assim: </strong>{item.how}</p>
          </div>)}
        </div>}
        {feedback.visual.limitations && <p className="mt-3 text-xs text-[#8da5c5]">{feedback.visual.limitations}</p>}
      </div>}
    </>}

    {voice ? <div className="space-y-4">
      <div>
        <h3 className="text-lg font-black">Análise da fala</h3>
        <p className="text-sm text-[#b5c8e3]">A fala é analisada por evidências observáveis; as estimativas não são medições clínicas nem avaliação de personalidade.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {[['Ritmo', voice.pace], ['Pausas', voice.pauses], ['Vícios e repetições', voice.fillers], ['Dicção e inteligibilidade', voice.articulation], ['Entonação', voice.intonation]].map(([label, value]) => <p key={label} className="rounded-xl bg-[#0b2856] p-4 text-sm"><strong className="block mb-2">{label}</strong>{value || 'Não foi possível avaliar.'}</p>)}
      </div>
      {!!voice.observations?.length && voice.observations.map((item, index) => <div key={index} className="rounded-xl border border-[#31588e] p-4 text-sm"><p className="font-bold">{item.time}</p><p className="mt-2">{item.evidence}</p><p className="mt-2 text-[#b5c8e3]">{item.impact}</p></div>)}

      {voice.mediaKind === 'video' && <div>
        <h3 className="font-black">Leitura temporal do vídeo</h3>
        <p className="mt-1 text-sm text-[#9fb5d4]">{voice.framesAnalyzed || 0} frames independentes foram analisados pela IA, além da leitura temporal do vídeo.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {[['Postura ao longo do vídeo', voice.posture], ['Gestos ao longo do vídeo', voice.gestures], ['Direção aparente do olhar', voice.gazeToCamera], ['Enquadramento', voice.framing]].map(([label, value]) => <p key={label} className="rounded-xl bg-[#0b2856] p-4 text-sm"><strong className="block mb-2">{label}</strong>{value || 'Não foi possível avaliar.'}</p>)}
        </div>
        {!!voice.visualObservations?.length && <div className="mt-3 space-y-2">
          {voice.visualObservations.map((item, index) => <div key={index} className="rounded-xl border border-[#234576] p-3 text-sm"><strong>{item.time}</strong><p className="mt-1">{item.evidence}</p><p className="mt-1 text-[#9fb5d4]">{item.impact}</p></div>)}
        </div>}
        {voice.visualLimitations && <p className="mt-3 text-xs text-[#8da5c5]">{voice.visualLimitations}</p>}
      </div>}

      {voice.limitations && <p className="text-xs text-[#8da5c5]">{voice.limitations}</p>}
      <details><summary className="cursor-pointer font-bold">Ver transcrição</summary><p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{voice.transcript}</p></details>
    </div> : feedback && <p className="text-sm text-[#b5c8e3]">Resposta por texto: fala, postura, gestos e direção do olhar não foram avaliados.</p>}
  </section>;
}

function InterviewCoach() {
  const { user, session, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [institution, setInstitution] = useState<Institution>('link');
  const [course, setCourse] = useState('Administração');
  const [interviewMode, setInterviewMode] = useState<InterviewMode>('official');
  const [candidateContext, setCandidateContext] = useState({ portfolio: '', prepVideo: '', businessCase: '', whyLink: '' });
  const [audio, setAudio] = useState<InterviewAudio | null>(null);
  const [recording, setRecording] = useState(false);
  const [voice, setVoice] = useState<Voice | null>(null);
  const [activityFilter, setActivityFilter] = useState('Todas');
  const [started, setStarted] = useState(false);
  const [question, setQuestion] = useState('');
  const [questionNumber, setQuestionNumber] = useState(1);
  const [questionLanguage, setQuestionLanguage] = useState<Language>('pt');
  const [questionStyle, setQuestionStyle] = useState('standard');
  const [competency, setCompetency] = useState('');
  const [answer, setAnswer] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const startedAt = useRef<number | null>(null);
  const aiPausedMs = useRef(0);
  const active = institutions[institution];
  const scoreLabels = institution === 'link' ? linkScoreLabels : espmScoreLabels;
  const totalQuestions = totalForMode(interviewMode, institution);

  const currentElapsed = () => startedAt.current ? Math.max(0, Math.floor((Date.now() - startedAt.current - aiPausedMs.current) / 1000)) : 0;

  useEffect(() => {
    document.title = 'Treino de entrevistas Link e ESPM | Conectaê';
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) description.content = 'Pratique a entrevista da Link 2027.1 com critérios oficiais, inglês, Portfolio, vídeo em múltiplos frames e feedback por IA.';
  }, []);

  useEffect(() => {
    if (!started || report) return;
    const id = window.setInterval(() => setElapsed(currentElapsed()), 1000);
    return () => window.clearInterval(id);
  }, [started, report]);

  const averageScores = useMemo(() => {
    const result: Scores = {};
    scoreLabels.forEach(([key]) => {
      const values = turns.map(turn => turn.scores?.[key]).filter((value): value is number => typeof value === 'number');
      result[key] = values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;
    });
    return result;
  }, [turns, scoreLabels]);

  const progress = report
    ? 100
    : institution === 'link' && interviewMode === 'official'
      ? Math.min(96, Math.round((elapsed / 1200) * 100))
      : started ? Math.round((questionNumber / totalQuestions) * 100) : 0;

  async function callApi(payload: Record<string, unknown>) {
    const requireLogin = () => {
      setShowAuth(true);
      return new Error('Entre na sua conta para continuar a entrevista.');
    };
    const currentSession = await ensureFreshSession();
    if (!currentSession?.access_token) throw requireLogin();

    const request = (token: string) => fetch('/api/interview-coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({
        ...payload,
        totalQuestions,
        interviewMode,
        candidateContext: institution === 'link' ? candidateContext : undefined,
      }),
      signal: AbortSignal.timeout(payload.audio ? 210_000 : 120_000),
    }).catch((requestError: unknown) => {
      if (requestError instanceof Error && (requestError.name === 'TimeoutError' || requestError.name === 'AbortError')) {
        throw new Error('A análise demorou mais que o esperado. Sua resposta foi preservada. Tente enviar novamente.');
      }
      throw requestError;
    });

    let response = await request(currentSession.access_token);
    if (response.status === 401) {
      const refreshed = await ensureFreshSession(true);
      if (!refreshed?.access_token) throw requireLogin();
      response = await request(refreshed.access_token);
      if (response.status === 401) throw requireLogin();
    }
    const data = await response.json() as ApiResult;
    if (!response.ok) throw new Error(data.error || 'Não foi possível continuar agora.');
    return data;
  }

  async function startInterview() {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setBusy(true);
    setError('');
    setFeedback(null);
    setReport(null);
    setTurns([]);
    setAudio(null);
    setVoice(null);
    setAnswer('');
    startedAt.current = null;
    aiPausedMs.current = 0;
    setElapsed(0);

    try {
      const data = await callApi({ institution, course: institution === 'link' ? 'Administração' : course, phase: 'start', history: [], elapsedSeconds: 0 });
      setQuestion(data.question || '');
      setQuestionNumber(data.questionNumber || 1);
      setQuestionLanguage(data.language || 'pt');
      setQuestionStyle(data.questionStyle || 'standard');
      setCompetency(data.competency || '');
      setStarted(true);
      startedAt.current = Date.now();
      requestAnimationFrame(() => textareaRef.current?.focus());
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'Não foi possível iniciar.');
    } finally {
      setBusy(false);
    }
  }

  async function sendAnswer() {
    const clean = answer.trim();
    if ((!audio && clean.length < 20) || busy || recording) return;

    const pendingTurn: Turn = {
      question,
      answer: audio ? '[Resposta em mídia: transcrição pendente]' : clean,
      language: questionLanguage,
    };
    const history = [...turns, pendingTurn];
    const practiceElapsed = currentElapsed();
    const requestStarted = Date.now();

    setBusy(true);
    setError('');
    try {
      const data = await callApi({
        institution,
        course: institution === 'link' ? 'Administração' : course,
        phase: 'answer',
        history,
        audio,
        elapsedSeconds: practiceElapsed,
      });
      aiPausedMs.current += Date.now() - requestStarted;
      setElapsed(currentElapsed());

      const completedTurn: Turn = {
        ...pendingTurn,
        answer: data.voice?.transcript || pendingTurn.answer,
        feedback: data.feedback?.summary,
        scores: data.feedback?.scores,
        fullFeedback: data.feedback || undefined,
        voice: data.voice,
        delivery: data.voice ? JSON.stringify({ ...data.voice, transcript: undefined }) : undefined,
      };
      setTurns([...turns, completedTurn]);
      setVoice(data.voice || null);
      setAudio(null);
      setFeedback(data.feedback || null);
      setAnswer('');

      if (data.complete && data.report) {
        setReport(data.report);
      } else {
        setQuestion(data.question || '');
        setQuestionNumber(data.questionNumber || questionNumber + 1);
        setQuestionLanguage(data.language || 'pt');
        setQuestionStyle(data.questionStyle || 'standard');
        setCompetency(data.competency || '');
        requestAnimationFrame(() => textareaRef.current?.focus());
      }
    } catch (sendError) {
      aiPausedMs.current += Date.now() - requestStarted;
      setElapsed(currentElapsed());
      setError(sendError instanceof Error ? sendError.message : 'Não foi possível analisar a resposta.');
    } finally {
      setBusy(false);
    }
  }

  function clearSession() {
    setStarted(false);
    setQuestion('');
    setQuestionNumber(1);
    setQuestionLanguage('pt');
    setQuestionStyle('standard');
    setCompetency('');
    setAnswer('');
    setTurns([]);
    setFeedback(null);
    setReport(null);
    setError('');
    setAudio(null);
    setVoice(null);
    setElapsed(0);
    startedAt.current = null;
    aiPausedMs.current = 0;
  }

  function reset() {
    clearSession();
    setInterviewMode('official');
  }

  function startActivity(id: string) {
    if (!user) {
      setShowAuth(true);
      return;
    }
    const item = interviewActivities.find(row => row.id === id);
    if (!item) return;
    clearSession();
    setInstitution('link');
    setInterviewMode('activity');
    setQuestion(item.question);
    setQuestionLanguage(item.language);
    setQuestionStyle(item.title.toLowerCase().includes('pressão') || item.title.toLowerCase().includes('objeção') ? 'pressure' : 'standard');
    setCompetency(item.category);
    setStarted(true);
    startedAt.current = Date.now();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center gap-3 bg-[#f6f8ff] text-slate-700" role="status"><Loader2 className="h-5 w-5 animate-spin" />Verificando seu acesso…</div>;

  if (showAuth) return <div className="min-h-screen bg-[#f6f8ff] py-10">
    <p className="mx-auto mb-4 max-w-md px-5 text-center text-slate-700">Entre na sua conta para iniciar o treino. A apresentação e os critérios podem ser consultados sem login.</p>
    <Auth compact onBack={() => setShowAuth(false)} onSuccess={() => { setShowAuth(false); setError(''); }} onPrivacy={() => window.location.assign('/privacidade')} onTerms={() => window.location.assign('/termos')} />
  </div>;

  const filteredActivities = activityFilter === 'Todas' ? interviewActivities : interviewActivities.filter(item => item.category === activityFilter);
  const filters = ['Todas', ...Array.from(new Set(interviewActivities.map(item => item.category)))];

  return <div className="interview-page min-h-screen bg-[#020817] text-white font-['Plus_Jakarta_Sans']">
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full bg-[#246cff]/15 blur-[130px]" />
      <div className="absolute -bottom-52 -left-40 h-[520px] w-[520px] rounded-full bg-[#ff6047]/10 blur-[140px]" />
    </div>

    <header className="relative z-10 border-b border-white/5 bg-[#020817]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
        <button onClick={() => window.location.assign('/')} className="inline-flex items-center gap-2 text-sm font-bold text-[#9fb5d4] hover:text-white"><ArrowLeft className="h-4 w-4" />Início</button>
        <div className="text-center"><div className="text-lg font-black">Conecta<span className="text-[#72a5ff]">ê</span></div><div className="text-[10px] font-extrabold uppercase tracking-[.17em] text-[#7891b4]">Treino de entrevista</div></div>
        {user && session
          ? <div className="hidden text-xs font-bold text-[#7891b4] sm:block">IA multimodal · voz + vídeo + frames</div>
          : <button onClick={() => setShowAuth(true)} className="rounded-xl border border-[#31588e] px-3 py-2 text-xs font-black text-[#c5d9f4] hover:border-[#72a5ff]">Entrar para praticar</button>}
      </div>
    </header>

    <main className="relative z-10 mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-12">
      {!started ? <div className="space-y-12">
        <div className="mx-auto max-w-6xl grid gap-8 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <section>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#31588e] bg-[#0b2856] px-3 py-1.5 text-xs font-black text-[#a9c7ef]"><Sparkles className="h-4 w-4" />SIMULAÇÃO ADAPTATIVA COM IA MULTIMODAL</div>
            <h1 className="mt-5 text-4xl font-black leading-[1.02] tracking-[-.05em] md:text-6xl">Treine como será a <span className="text-[#72a5ff]">entrevista.</span></h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-[#a9bddc] md:text-lg">Na Link 2027.1, o modo oficial simula aproximadamente 20 minutos, usa seu Portfolio, inclui uma parte em inglês e avalia os quatro critérios publicados pela instituição.</p>

            <div className="mt-7 grid gap-3">
              {[
                ['Critérios oficiais', 'Inglês · Coragem · Capacidade de Trabalho · Vontade de Estar Aqui'],
                ['Vídeo em múltiplos frames', 'Até 7 recortes distribuídos pela resposta, cruzados com fala e conteúdo'],
                ['Aprofundamento adaptativo', 'A IA faz follow-ups desafiadores, aprofunda o Portfolio e cobra evidência concreta'],
              ].map(([title, text], index) => <div key={title} className="rounded-2xl border border-[#173765] bg-[#06152f] p-4"><div className="flex items-start gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#246cff]/15 text-sm font-black text-[#72a5ff]">{index + 1}</span><div><div className="font-black">{title}</div><div className="mt-1 text-sm leading-relaxed text-[#9fb5d4]">{text}</div></div></div></div>)}
            </div>
          </section>

          <section className="rounded-[28px] border border-[#234576] bg-gradient-to-b from-[#081a38] to-[#051127] p-5 shadow-2xl shadow-black/30 md:p-7">
            <h2 className="text-xl font-black">Qual entrevista você quer treinar?</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {(Object.keys(institutions) as Institution[]).map(key => {
                const item = institutions[key];
                const selected = institution === key;
                return <button key={key} disabled={busy} onClick={() => { setInstitution(key); if (key === 'link') setInterviewMode('official'); }} aria-pressed={selected} className={'rounded-2xl border p-4 text-left transition ' + (selected ? 'border-[#72a5ff] bg-[#0b2856]' : 'border-[#173765] bg-[#041027] hover:border-[#31588e]')}>
                  <span className="mb-3 block h-1.5 w-10 rounded-full" style={{ background: item.accent }} />
                  <span className="block font-black">{item.name}</span>
                  <span className="mt-2 block text-sm leading-relaxed text-[#9fb5d4]">{item.description}</span>
                  {selected && <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-black text-[#8eb7ff]"><CheckCircle2 className="h-4 w-4" />Selecionada</span>}
                </button>;
              })}
            </div>

            {institution === 'link' ? <>
              <div className="mt-5 rounded-2xl border border-[#31588e] bg-[#031027] p-4">
                <div className="flex items-center gap-2 font-black"><Clock className="h-4 w-4 text-[#72a5ff]" />Modo do treino</div>
                <div className="mt-3 grid gap-2">
                  {[
                    ['quick', 'Treino rápido', '5 perguntas · inclui inglês'],
                    ['official', 'Simulação Link 2027.1', '~20 min · Portfolio · inglês · aprofundamento adaptativo'],
                    ['intensive', 'Treino intensivo', '15 perguntas · aprofundamento máximo'],
                  ].map(([value, title, description]) => <button key={value} type="button" onClick={() => setInterviewMode(value as InterviewMode)} className={'rounded-xl border p-3 text-left ' + (interviewMode === value ? 'border-[#72a5ff] bg-[#0b2856]' : 'border-[#173765]')}>
                    <span className="font-black">{title}</span><span className="ml-2 text-xs text-[#8da5c5]">{description}</span>
                  </button>)}
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-[#234576] bg-[#041027] p-4">
                <div className="flex items-center gap-2 font-black"><FileText className="h-4 w-4 text-[#72a5ff]" />Contexto da sua Jornada Link</div>
                <p className="mt-2 text-xs leading-relaxed text-[#8da5c5]">O Link Portfolio é explicitamente citado no Manual 2027.1 como material de referência da entrevista. PREP e Business Case são campos opcionais aqui apenas para simular consistência com etapas anteriores. Nada é inventado quando um campo fica vazio.</p>

                <label className="mt-4 block text-sm font-bold" htmlFor="portfolio">Link Portfolio</label>
                <textarea id="portfolio" value={candidateContext.portfolio} onChange={event => setCandidateContext(value => ({ ...value, portfolio: event.target.value }))} rows={4} maxLength={7000} placeholder="Cole ou resuma experiências, projetos, esportes, competições, empreendedorismo, cursos, voluntariado, estágios e resultados." className="mt-2 w-full rounded-xl border border-[#234576] bg-[#020817] p-3 text-sm text-white outline-none focus:border-[#72a5ff]" />

                <label className="mt-4 block text-sm font-bold" htmlFor="prep-video">Resumo do vídeo do PREP</label>
                <textarea id="prep-video" value={candidateContext.prepVideo} onChange={event => setCandidateContext(value => ({ ...value, prepVideo: event.target.value }))} rows={3} maxLength={3500} placeholder="Opcional: resuma o que você apresentou sobre trajetória, motivação e objetivos para testar consistência." className="mt-2 w-full rounded-xl border border-[#234576] bg-[#020817] p-3 text-sm text-white outline-none focus:border-[#72a5ff]" />

                <label className="mt-4 block text-sm font-bold" htmlFor="business-case">Resumo do Business Case / Link Sprint</label>
                <textarea id="business-case" value={candidateContext.businessCase} onChange={event => setCandidateContext(value => ({ ...value, businessCase: event.target.value }))} rows={3} maxLength={5000} placeholder="Opcional: plano inicial, decisões, execução, evolução e resultado para testar consistência." className="mt-2 w-full rounded-xl border border-[#234576] bg-[#020817] p-3 text-sm text-white outline-none focus:border-[#72a5ff]" />

                <label className="mt-4 block text-sm font-bold" htmlFor="why-link">Suas anotações de “por que Link?”</label>
                <textarea id="why-link" value={candidateContext.whyLink} onChange={event => setCandidateContext(value => ({ ...value, whyLink: event.target.value }))} rows={2} maxLength={2500} placeholder="Opcional. A IA vai testar se os motivos são específicos da Link ou genéricos." className="mt-2 w-full rounded-xl border border-[#234576] bg-[#020817] p-3 text-sm text-white outline-none focus:border-[#72a5ff]" />
              </div>
            </> : <>
              <label className="mt-5 block text-sm font-bold text-[#c4d4ea]" htmlFor="interview-course">Curso pretendido</label>
              <input id="interview-course" disabled={busy} value={course} onChange={event => setCourse(event.target.value)} maxLength={100} placeholder="Ex.: Administração, Economia, Comunicação" className="mt-2 min-h-12 w-full rounded-xl border border-[#234576] bg-[#031027] px-4 text-base text-white outline-none placeholder:text-[#607a9f] focus:border-[#72a5ff]" />
            </>}

            {error && <p className="mt-4 rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</p>}
            <button onClick={startInterview} disabled={busy || loading || (institution !== 'link' && !course.trim())} className="mt-5 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#246cff] px-5 font-black transition hover:bg-[#3678ff] disabled:opacity-50">
              {busy ? <><Loader2 className="h-5 w-5 animate-spin" />Preparando entrevista…</> : <>Começar entrevista <ArrowRight className="h-5 w-5" /></>}
            </button>
            <p className="mt-4 text-xs leading-relaxed text-[#7891b4]">Treino independente. Na Link, a referência é o Manual do Candidato 2027.1; não reproduz perguntas sigilosas nem garante aprovação. <a href={active.source} target="_blank" rel="noreferrer" className="text-[#8eb7ff] underline underline-offset-2">Ver fonte oficial</a>.</p>
          </section>
        </div>

        {institution === 'link' && <section className="mx-auto max-w-6xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div><div className="text-xs font-black uppercase tracking-[.15em] text-[#72a5ff]">24 atividades focadas na Link</div><h2 className="mt-2 text-2xl font-black md:text-3xl">Treine um critério isoladamente.</h2></div>
            <div className="flex flex-wrap gap-2">{filters.map(filter => <button key={filter} onClick={() => setActivityFilter(filter)} className={'rounded-full px-3 py-2 text-xs font-black ' + (activityFilter === filter ? 'bg-[#246cff] text-white' : 'border border-[#234576] bg-[#06152f] text-[#9fb5d4]')}>{filter}</button>)}</div>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredActivities.map(item => <button key={item.id} onClick={() => startActivity(item.id)} className="rounded-2xl border border-[#173765] bg-[#06152f] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#72a5ff]">
              <div className="flex items-center justify-between gap-3"><span className="text-xs font-black uppercase tracking-[.12em] text-[#72a5ff]">{item.category}</span>{item.language === 'en' && <span className="inline-flex items-center gap-1 rounded-full bg-[#0b2856] px-2 py-1 text-[10px] font-black"><Languages className="h-3 w-3" />EN</span>}</div>
              <div className="mt-3 font-black">{item.title}</div>
              <p className="mt-2 text-sm leading-relaxed text-[#9fb5d4]">{item.question}</p>
              <p className="mt-3 text-xs text-[#7891b4]">{item.target}</p>
            </button>)}
          </div>
        </section>}
      </div> : report ? <div className="mx-auto max-w-5xl">
        <section className="overflow-hidden rounded-[30px] border border-[#31588e] bg-[#06152f] shadow-2xl shadow-black/30">
          <div className="grid gap-7 bg-gradient-to-br from-[#0b2856] to-[#071a38] p-6 md:grid-cols-[auto_1fr] md:p-9">
            <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full border-4 border-[#72a5ff] bg-[#031027] text-center">
              <span className="text-4xl font-black">{scoreText(report.overallScore)}</span>
              <span className="mt-1 px-2 text-[10px] font-bold leading-tight text-[#8da5c5]">{report.scoreLabel || 'Índice de preparação'}</span>
            </div>
            <div><div className="text-xs font-black uppercase tracking-[.16em] text-[#72a5ff]">{interviewMode === "activity" ? "Treino focalizado" : "Relatório final"} · {active.name}</div><h1 className="mt-2 text-3xl font-black md:text-5xl">{interviewMode === "activity" ? "Atividade concluída" : "Entrevista concluída"}</h1><p className="mt-3 max-w-2xl leading-relaxed text-[#b5c8e3]">{report.verdict}</p>{institution === 'link' && <p className="mt-3 text-xs text-[#7891b4]">Quando disponível, este índice é calculado com peso igual entre os quatro critérios oficiais. Se faltar evidência em algum deles, o sistema não calcula um total. Não é nota oficial nem previsão de aprovação.</p>}</div>
          </div>

          <div className="space-y-5 p-6 md:p-9">
            {institution === 'link' && report.officialCriteria && <div>
              <h2 className="font-black">Quatro critérios oficiais da Link 2027.1</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {linkScoreLabels.map(([key, label]) => {
                  const row = report.officialCriteria?.[key];
                  return <div key={key} className="rounded-2xl border border-[#234576] bg-[#031027] p-5">
                    <div className="flex items-center justify-between gap-4"><strong>{label}</strong><span className="text-2xl font-black text-[#8eb7ff]">{scoreText(row?.score)}</span></div>
                    <p className="mt-3 text-sm leading-relaxed text-[#c4d4ea]">{row?.evidence}</p>
                    <p className="mt-3 text-sm text-[#9fb5d4]"><strong className="text-white">Próximo passo: </strong>{row?.nextStep}</p>
                  </div>;
                })}
              </div>
            </div>}

            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[.06] p-5"><h2 className="flex items-center gap-2 font-black text-emerald-200"><Trophy className="h-5 w-5" />Pontos mais fortes</h2><ul className="mt-4 space-y-3 text-sm text-[#c4d4ea]">{report.strongestPoints.map(item => <li key={item} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />{item}</li>)}</ul></div>
              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/[.06] p-5"><h2 className="flex items-center gap-2 font-black text-amber-100"><Target className="h-5 w-5" />Prioridades de melhoria</h2><ul className="mt-4 space-y-3 text-sm text-[#c4d4ea]">{report.priorityImprovements.map(item => <li key={item} className="flex gap-2"><ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />{item}</li>)}</ul></div>
            </div>

            {!!report.pressureQuestions?.length && <div className="rounded-2xl border border-[#31588e] bg-[#071a38] p-5">
              <h2 className="font-black">3 perguntas de aprofundamento para o próximo treino</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-3">{report.pressureQuestions.map((item, index) => <div key={item} className="rounded-xl bg-[#031027] p-4 text-sm"><span className="text-xs font-black text-[#72a5ff]">APROFUNDAMENTO {index + 1}</span><p className="mt-2 leading-relaxed">{item}</p></div>)}</div>
            </div>}

            <div className="rounded-2xl border border-[#234576] bg-[#041027] p-5">
              <h2 className="flex items-center gap-2 font-black"><BarChart3 className="h-5 w-5 text-[#72a5ff]" />Plano de 7 dias</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-2">{report.sevenDayPlan.map((item, index) => <div key={item + String(index)} className="flex gap-3 rounded-xl border border-[#173765] bg-[#06152f] p-3 text-sm text-[#b5c8e3]"><span className="font-black text-[#72a5ff]">{index + 1}</span>{item.replace(/^dia\s*\d+\s*[:.-]?\s*/i, '')}</div>)}</div>
              <p className="mt-5 rounded-xl bg-[#0b2856] px-4 py-3 text-sm font-bold text-[#d6e5f8]">{report.finalTip}</p>
            </div>
          </div>
        </section>

        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <button onClick={reset} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#246cff] px-5 font-black"><RefreshCcw className="h-4 w-4" />Treinar novamente</button>
          <button onClick={() => window.location.assign('/')} className="min-h-12 rounded-xl border border-[#31588e] px-5 font-bold text-[#b5c8e3]">Voltar ao início</button>
        </div>
      </div> : <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-[28px] border border-[#234576] bg-[#06152f] shadow-2xl shadow-black/25">
          <div className="border-b border-[#173765] p-5 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-black uppercase tracking-[.16em] text-[#72a5ff]">
                  {active.name} · pergunta {questionNumber}{institution === 'link' && interviewMode === 'official' ? '' : ' de ' + totalQuestions}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm font-bold text-[#8da5c5]">
                  <span>{competency || 'Entrevista adaptativa'}</span>
                  {questionLanguage === 'en' && <span className="inline-flex items-center gap-1 rounded-full bg-[#123268] px-2 py-1 text-[10px] text-white"><Languages className="h-3 w-3" />RESPONDA EM INGLÊS</span>}
                  {questionStyle === 'pressure' && <span className="rounded-full bg-amber-400/10 px-2 py-1 text-[10px] text-amber-100">FOLLOW-UP DESAFIADOR</span>}
                </div>
              </div>
              <Bot className="h-8 w-8 shrink-0 text-[#72a5ff]" />
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#102a54]"><div className="h-full rounded-full bg-gradient-to-r from-[#246cff] to-[#72a5ff] transition-all" style={{ width: Math.max(6, progress) + '%' }} /></div>
            {institution === 'link' && interviewMode === 'official' && <div className="mt-3 flex items-center gap-2 text-xs font-bold text-[#8da5c5]"><Clock className="h-4 w-4" />{formatClock(elapsed)} de ~20:00 · o relógio pausa enquanto a IA processa</div>}
          </div>

          <div className="p-5 md:p-7">
            <div className="rounded-2xl border border-[#234576] bg-[#031027] p-5">
              <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[.14em] text-[#8eb7ff]"><MessageSquareText className="h-4 w-4" />Entrevistador</div>
              <h1 className="text-xl font-black leading-snug md:text-3xl">{question}</h1>
            </div>

            <InterviewRecorder key={questionNumber + '-' + questionLanguage} disabled={busy} onChange={setAudio} onRecording={setRecording} />
            <label htmlFor="interview-answer" className="mt-6 block text-sm font-black">Resposta por texto <span className="font-medium text-[#7891b4]">(alternativa)</span></label>
            <p className="mt-1 text-xs text-[#7891b4]">{questionLanguage === 'en' ? 'Responda em inglês. Sem áudio ou vídeo, a IA pode comentar gramática e vocabulário, mas não atribui índice ao critério oficial de Inglês.' : interviewMode === 'official' ? 'A simulação oficial foi pensada para resposta falada. Use texto apenas como alternativa de acessibilidade ou contingência.' : 'Use uma situação real. Para análise de fala e postura, prefira áudio ou vídeo.'}</p>
            <textarea ref={textareaRef} id="interview-answer" disabled={busy || recording || !!audio} value={answer} onChange={event => setAnswer(event.target.value)} rows={8} maxLength={10000} placeholder={questionLanguage === 'en' ? 'Answer as you would in the real interview…' : 'Responda como falaria na entrevista…'} className="mt-2 w-full resize-y rounded-2xl border border-[#234576] bg-[#031027] p-4 text-base leading-relaxed text-white outline-none placeholder:text-[#607a9f] focus:border-[#72a5ff]" />

            {error && <p className="mt-4 rounded-xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">{error}</p>}
            <button onClick={sendAnswer} disabled={busy || recording || (!audio && answer.trim().length < 20)} className="mt-4 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-[#246cff] px-5 font-black disabled:opacity-50">
              {busy ? <><Loader2 className="h-5 w-5 animate-spin" />IA analisando conteúdo, fala e frames…</> : <><Send className="h-5 w-5" />Enviar resposta</>}
            </button>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-[24px] border border-[#234576] bg-[#06152f] p-5">
            <div className="text-xs font-black uppercase tracking-[.14em] text-[#72a5ff]">{institution === 'link' ? 'Critérios oficiais · índices de treino' : 'Média da sessão'}</div>
            <div className="mt-4 space-y-3">
              {scoreLabels.map(([key, label]) => <div key={key} className="flex items-center justify-between gap-3 rounded-xl bg-[#031027] px-4 py-3 text-sm"><span>{label}</span><strong>{scoreText(averageScores[key])}</strong></div>)}
            </div>
            {institution === 'link' && <p className="mt-4 text-xs leading-relaxed text-[#7891b4]">Os quatro critérios têm o mesmo peso no Manual 2027.1. As notas aqui são apenas feedback de preparação do Conectaê.</p>}
          </div>

          <div className="rounded-[24px] border border-[#234576] bg-[#06152f] p-5">
            <div className="flex items-center gap-2 font-black"><Languages className="h-4 w-4 text-[#72a5ff]" />Formato da simulação</div>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#9fb5d4]">
              {institution === 'link' ? <>
                <li>• Parte obrigatória do treino em inglês.</li>
                <li>• Perguntas ancoradas no Portfolio, PREP e Business Case quando fornecidos.</li>
                <li>• Follow-ups desafiadores para testar defesa de ideias.</li>
                <li>• Modo oficial guiado por tempo, não por “10 perguntas fixas”.</li>
              </> : <li>• Perguntas adaptativas com feedback por resposta.</li>}
            </ul>
          </div>
        </aside>

        <div className="lg:col-span-2"><FeedbackPanel feedback={feedback} voice={voice} institution={institution} /></div>
      </div>}
    </main>
  </div>;
}

export default function InterviewCoachPage() {
  return <AuthProvider><InterviewCoach /></AuthProvider>;
}
