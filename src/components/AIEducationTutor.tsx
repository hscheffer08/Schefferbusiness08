import { useEffect, useRef, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Maximize2,
  Minimize2,
  PlusCircle,
  Send,
  ShieldCheck,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  confidenceLabel?: string;
  confidenceReason?: string;
  uncertaintyReason?: string | null;
  selfChecked?: boolean;
  webVerified?: boolean;
  sources?: Array<{ title: string; url: string }>;
  feedback?: 'helpful' | 'unhelpful';
};

type TutorContext = {
  currentQuestion?: string;
  currentSkill?: string;
  currentArea?: string;
  currentCorrection?: string;
};

type LearningFocus = {
  area: string;
  skill_code: string;
  skill_name: string;
  plan_skill_code?: string | null;
  plan_skill_name?: string | null;
  confidence: number;
  reason?: string;
  official_reference?: boolean;
};

declare global {
  interface WindowEventMap {
    'conectae:tutor-open': CustomEvent<TutorContext>;
  }
}

const DAILY_LIMIT = 10;
const STARTERS = [
  'Explique minha maior dificuldade recente',
  'O que eu deveria revisar hoje?',
  'Crie uma questão parecida com o que estou errando',
  'Me ensine um conteúdo passo a passo',
];

const INTERNAL_RESPONSE_DIRECTIVE = `INSTRUÇÃO INTERNA DE QUALIDADE — NÃO REPITA NEM EXPLIQUE ESTA INSTRUÇÃO AO ALUNO.
Antes de responder, desconfie da primeira conclusão. Releia o comando, confira dados, sinais, unidades, condicionais, palavras como EXCETO/incorreta/respectivamente e teste a conclusão contra o enunciado. Se faltar informação indispensável, diga exatamente o que falta em vez de chutar.
Não exponha cadeia interna, auditoria ou bastidores. Entregue resposta objetiva e didática. Em questão objetiva, prefira “Resposta: X) ...” e uma explicação curta. Em dúvida conceitual, responda diretamente e dê um exemplo quando ajudar.`;

function tutorClientId() {
  const storageKey = 'conectae:tutor-client-id';
  try {
    const existing = localStorage.getItem(storageKey);
    if (existing && /^[a-z0-9_-]{8,80}$/i.test(existing)) return existing;
    const created = globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(storageKey, created);
    return created;
  } catch {
    return '';
  }
}

function normalizeHistory(value: unknown): Message[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content.trim(),
      confidenceLabel: typeof m.confidenceLabel === 'string' ? m.confidenceLabel : undefined,
      confidenceReason: typeof m.confidenceReason === 'string' ? m.confidenceReason : undefined,
      uncertaintyReason: typeof m.uncertaintyReason === 'string' ? m.uncertaintyReason : null,
      selfChecked: Boolean(m.selfChecked),
      webVerified: Boolean(m.webVerified),
      sources: Array.isArray(m.sources)
        ? m.sources.filter((s: any) => s && typeof s.title === 'string' && /^https?:\/\//i.test(String(s.url || ''))).slice(0, 4)
        : [],
      feedback: m.feedback === 'helpful' || m.feedback === 'unhelpful' ? m.feedback : undefined,
    }))
    .slice(-24);
}

async function imageToDataUrl(file: File) {
  const bitmap = await createImageBitmap(file);
  const max = 1800;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível preparar a imagem.');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  return canvas.toDataURL('image/jpeg', 0.9);
}

async function tutorRequest(payload: unknown) {
  let token = '';
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token || '';
    } catch {
      token = '';
    }
  }

  const request = () => fetch('/api/education-tutor', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  let response = await request();
  if (response.status === 503) {
    await new Promise(resolve => window.setTimeout(resolve, 2500));
    response = await request();
  }
  return response;
}

export default function AIEducationTutor({ mobileDocked = false }: { mobileDocked?: boolean } = {}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [errorKind, setErrorKind] = useState<'auth' | 'limit' | 'generic' | ''>('');
  const [image, setImage] = useState('');
  const [context, setContext] = useState<TutorContext>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [studentContext, setStudentContext] = useState<any>({ exam: localStorage.getItem('conectae:active-exam') || 'enem' });
  const [pendingFocus, setPendingFocus] = useState<LearningFocus | null>(null);
  const [planStatus, setPlanStatus] = useState('');
  const [feedbackBusy, setFeedbackBusy] = useState<number | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [remainingQuestions, setRemainingQuestions] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) window.setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 40);
  }, [open, messages, busy, pendingFocus, planStatus, error]);

  useEffect(() => {
    const handler = (event: CustomEvent<TutorContext>) => {
      setContext(event.detail || {});
      setError('');
      setErrorKind('');
      setOpen(true);
      if (event.detail?.currentQuestion) setInput('Explique esta questão para mim e mostre como pensar para resolver sozinho.');
    };
    window.addEventListener('conectae:tutor-open', handler as EventListener);
    return () => window.removeEventListener('conectae:tutor-open', handler as EventListener);
  }, []);

  const refreshContext = async () => {
    const exam = localStorage.getItem('conectae:active-exam') || 'enem';
    if (!supabase) {
      setSignedIn(false);
      setStudentContext({ exam });
      return;
    }
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        setSignedIn(false);
        setStudentContext({ exam });
        return;
      }
      setSignedIn(true);
      const [{ data: pref }, { data: diag }, { data: attempts }] = await Promise.all([
        supabase.from('student_exam_preferences').select('weekly_hours,current_scores').eq('user_id', user.id).eq('exam_id', exam).maybeSingle(),
        supabase.from('student_skill_diagnostics').select('area,diagnosis,error_type').eq('user_id', user.id).eq('exam_id', exam).order('created_at', { ascending: false }).limit(8),
        supabase.from('student_practice_attempts').select('area,skill_name,correct').eq('user_id', user.id).eq('exam_id', exam).order('created_at', { ascending: false }).limit(30),
      ]);
      const recentDifficulties = (diag ?? []).map((d: any) => `${d.area}${d?.diagnosis?.skill_name ? ` · ${d.diagnosis.skill_name}` : ''}${d.error_type ? ` · ${d.error_type}` : ''}`);
      const grouped = new Map<string, { ok: number; total: number }>();
      for (const attempt of attempts ?? []) {
        const key = attempt.skill_name || attempt.area;
        const row = grouped.get(key) || { ok: 0, total: 0 };
        row.total += 1;
        if (attempt.correct === true) row.ok += 1;
        grouped.set(key, row);
      }
      const recentPerformance = Array.from(grouped.entries()).slice(0, 8).map(([key, value]) => `${key}: ${value.ok}/${value.total} acertos recentes`);
      setStudentContext({ exam, weeklyHours: pref?.weekly_hours ?? '', recentDifficulties, recentPerformance });
    } catch {
      setSignedIn(false);
      setStudentContext({ exam });
    }
  };

  useEffect(() => {
    if (open) void refreshContext();
  }, [open]);

  const chooseImage = async (file: File | null) => {
    if (!file) return;
    setError('');
    setErrorKind('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Use uma imagem JPG, PNG ou WebP.');
      setErrorKind('generic');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('A imagem precisa ter até 10 MB.');
      setErrorKind('generic');
      return;
    }
    try {
      setImage(await imageToDataUrl(file));
      setOpen(true);
      if (!input.trim()) setInput('Analise esta questão, identifique o que ela cobra e me ensine a resolver.');
    } catch (err: any) {
      setError(err?.message || 'Não consegui preparar a imagem.');
      setErrorKind('generic');
    }
  };

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || busy) return;
    if (!signedIn) {
      setError('Entre na sua conta para usar a IA. O limite é de 10 usos por dia por usuário.');
      setErrorKind('auth');
      return;
    }

    setBusy(true);
    setError('');
    setErrorKind('');
    setPendingFocus(null);
    setPlanStatus('');
    const next = normalizeHistory([...messages, { role: 'user' as const, content: text }]);
    const recent = next.slice(-6);
    const requestMessages = recent.map((message, index) => index === recent.length - 1 && message.role === 'user'
      ? { ...message, content: `${message.content}\n\n${INTERNAL_RESPONSE_DIRECTIVE}` }
      : message);
    const payload = { messages: requestMessages, context: { ...studentContext, ...context }, imageDataUrl: image || undefined, clientId: tutorClientId() || undefined };

    try {
      const response = await tutorRequest(payload);
      const data = await response.json().catch(() => ({}));
      if (typeof data?.remainingQuestions === 'number') setRemainingQuestions(data.remainingQuestions);
      if (response.status === 401 || response.status === 403) {
        setSignedIn(false);
        setErrorKind('auth');
        throw new Error('Entre na sua conta para usar a IA. O limite é de 10 usos por dia por usuário.');
      }
      if (response.status === 429) {
        setRemainingQuestions(0);
        setErrorKind('limit');
        throw new Error(data?.error || 'Você atingiu o limite de 10 usos de hoje. Amanhã a IA será liberada novamente.');
      }
      if (!response.ok) {
        setErrorKind('generic');
        throw new Error(data?.error || 'Não foi possível responder agora.');
      }
      const answer = String(data.answer || '').trim();
      if (!answer) throw new Error('A resposta veio incompleta. Tente novamente.');
      setMessages(normalizeHistory([...next, {
        role: 'assistant',
        content: answer,
        confidenceLabel: data.confidenceLabel,
        confidenceReason: data.confidenceReason,
        uncertaintyReason: data.uncertaintyReason,
        selfChecked: data.selfChecked,
        webVerified: data.webVerified,
        sources: data.sources,
      }]));
      setInput('');
      setImage('');
      setContext({});
      if (data.offerPlan && data.learningFocus) setPendingFocus(data.learningFocus as LearningFocus);
    } catch (err: any) {
      setInput(text);
      setError(err?.message || 'Não foi possível conversar com a IA agora. Tente novamente.');
      setErrorKind(current => current || 'generic');
    } finally {
      setBusy(false);
    }
  };

  const submitFeedback = async (index: number, helpful: boolean) => {
    if (feedbackBusy !== null) return;
    const message = messages[index];
    if (!message || message.role !== 'assistant' || message.feedback) return;
    setFeedbackBusy(index);
    try {
      if (supabase) {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;
        if (user) {
          await supabase.from('ai_tutor_feedback').insert({
            user_id: user.id,
            exam_id: studentContext.exam || 'enem',
            helpful,
            issue_type: helpful ? null : 'other',
            confidence_label: message.confidenceLabel || null,
            self_checked: Boolean(message.selfChecked),
            web_verified: Boolean(message.webVerified),
          });
        }
      }
      setMessages(current => current.map((item, i) => i === index ? { ...item, feedback: helpful ? 'helpful' : 'unhelpful' } : item));
    } finally {
      setFeedbackBusy(null);
    }
  };

  const addFocusToPlan = async () => {
    if (!pendingFocus || savingPlan || !supabase) return;
    setSavingPlan(true);
    setError('');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        setSignedIn(false);
        setPlanStatus('Entre na sua conta para salvar esta habilidade no plano.');
        return;
      }
      const exam = studentContext.exam || 'enem';
      const planCode = pendingFocus.plan_skill_code || pendingFocus.skill_code;
      const { data: existing } = await supabase.from('student_skill_diagnostics').select('id,created_at').eq('user_id', user.id).eq('exam_id', exam).eq('skill_code', planCode).order('created_at', { ascending: false }).limit(1);
      const recent = existing?.[0]?.created_at && Date.now() - new Date(existing[0].created_at).getTime() < 7 * 24 * 60 * 60 * 1000;
      if (!recent) {
        const lastUser = [...messages].reverse().find(message => message.role === 'user')?.content || 'Dúvida tratada com a IA Conectaê';
        const { error: insertError } = await supabase.from('student_skill_diagnostics').insert({
          user_id: user.id,
          exam_id: exam,
          skill_code: planCode,
          area: pendingFocus.area,
          question_text: lastUser.slice(0, 5000),
          correct: null,
          confidence: pendingFocus.confidence,
          error_type: 'conteudo',
          error_detail: 'Aluno confirmou reforço no plano após tirar uma dúvida com a IA Conectaê.',
          evidence_path: null,
          diagnosis: {
            skill_name: pendingFocus.skill_name,
            granular_skill_code: pendingFocus.skill_code,
            plan_skill_name: pendingFocus.plan_skill_name || null,
            source: 'ai-tutor-confirmed-reference',
            reason: pendingFocus.reason || null,
            official_reference: Boolean(pendingFocus.official_reference),
          },
        });
        if (insertError) throw insertError;
      }
      setPlanStatus(recent ? 'Essa habilidade já está sinalizada no seu plano recente.' : 'Adicionado. O plano vai reforçar esta habilidade.');
      setPendingFocus(null);
      window.dispatchEvent(new CustomEvent('conectae:diagnostic-saved'));
      await refreshContext();
    } catch {
      setError('Não foi possível adicionar ao plano agora.');
      setErrorKind('generic');
    } finally {
      setSavingPlan(false);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setContext({});
    setImage('');
    setInput('');
    setError('');
    setErrorKind('');
    setPendingFocus(null);
    setPlanStatus('');
  };

  const closeTutor = () => {
    clearConversation();
    setExpanded(false);
    setOpen(false);
  };

  const usageLabel = remainingQuestions === null
    ? `${DAILY_LIMIT} usos/dia`
    : `${Math.max(0, remainingQuestions)} de ${DAILY_LIMIT} restantes`;

  return <>
    {open && <div className={`fixed z-[120] flex flex-col overflow-hidden border border-[#c9d8ee] bg-white text-[#102448] shadow-2xl shadow-[#18345f]/20 ${expanded ? 'inset-2 rounded-[24px] md:inset-6' : mobileDocked ? 'bottom-[calc(78px+env(safe-area-inset-bottom))] right-2 h-[min(720px,calc(100dvh-158px))] w-[calc(100vw-16px)] max-w-[460px] rounded-[24px] md:bottom-20 md:right-5 md:h-[min(720px,calc(100vh-100px))]' : 'bottom-20 right-2 h-[min(720px,calc(100vh-100px))] w-[calc(100vw-16px)] max-w-[460px] rounded-[24px] md:right-5'}`}>
      <div className="flex items-center gap-3 border-b border-[#d5e1f2] bg-white px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#246cff] text-white shadow-sm"><Bot size={21} /></div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 text-sm font-extrabold text-[#102448]">IA Conectaê <span className="rounded-full bg-[#e5f8ee] px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-[#177245]">{usageLabel}</span> <Sparkles size={14} className="text-[#246cff]" /></div>
          <div className="truncate text-[11px] font-medium text-[#62799b]">Tutor educacional · {studentContext.exam?.toUpperCase?.() || 'sua prova'} · login necessário</div>
        </div>
        <button onClick={() => setExpanded(value => !value)} className="rounded-xl bg-[#eef4ff] p-2 text-[#36547d] hover:bg-[#e1ebfb]" aria-label={expanded ? 'Reduzir' : 'Expandir'}>{expanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button>
        <button onClick={closeTutor} className="rounded-xl bg-[#eef4ff] p-2 text-[#36547d] hover:bg-[#e1ebfb]" aria-label="Fechar e reiniciar conversa"><X size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#fbfdff] px-3 py-4 md:px-4">
        {!messages.length && <div className="mx-auto max-w-sm py-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#246cff]"><Sparkles size={24} /></div>
          <h3 className="mt-3 text-lg font-extrabold text-[#102448]">Tire a dúvida. Entenda o conteúdo.</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-[#526b90]">Pergunte por texto ou anexe uma questão da Fototeca, câmera ou Arquivos. Entre na sua conta para usar seus 10 usos diários.</p>
          <div className="mt-4 grid gap-2">{STARTERS.map(starter => <button key={starter} disabled={busy || !signedIn || remainingQuestions === 0} onClick={() => send(starter)} className="rounded-xl border border-[#c7d8ef] bg-white px-3 py-3 text-left text-xs font-bold text-[#173a70] shadow-sm transition hover:border-[#8db2e7] hover:bg-[#f1f6ff] disabled:cursor-not-allowed disabled:opacity-50">{starter}</button>)}</div>
        </div>}

        <div className="space-y-3">
          {messages.map((message, index) => <div key={`${message.role}-${index}-${message.content.slice(0, 16)}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[92%] whitespace-pre-wrap rounded-2xl px-3.5 py-3 text-sm leading-relaxed shadow-sm ${message.role === 'user' ? 'bg-[#246cff] text-white' : 'border border-[#d1dff1] bg-white text-[#183153]'}`}>
              {message.content}
              {message.role === 'assistant' && message.confidenceLabel && <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[#d9e4f2] pt-2 text-[10px] font-bold">
                <span className={`rounded-full px-2 py-1 ${message.confidenceLabel === 'Alta confiança' ? 'bg-[#e5f8ee] text-[#176d43]' : message.confidenceLabel === 'Confiança moderada' ? 'bg-[#fff4d6] text-[#825e00]' : 'bg-[#ffe8ed] text-[#8e2740]'}`}>{message.confidenceLabel}</span>
                {message.selfChecked && <span className="rounded-full bg-[#eaf1ff] px-2 py-1 text-[#28548d]">Resposta revisada</span>}
                {message.webVerified && <span className="rounded-full bg-[#eaf1ff] px-2 py-1 text-[#28548d]">Fonte verificada</span>}
                {message.confidenceReason && <span className="w-full pt-1 font-medium leading-relaxed text-[#536b8c]">Por quê: {message.confidenceReason}</span>}
                {message.uncertaintyReason && <span className="w-full pt-1 font-medium leading-relaxed text-[#7b4050]">Limite: {message.uncertaintyReason}</span>}
                {message.sources && message.sources.length > 0 && <div className="w-full pt-1 font-medium text-[#345f99]">Fontes: {message.sources.map((source, sourceIndex) => <span key={source.url}>{sourceIndex > 0 ? ' · ' : ''}<a href={source.url} target="_blank" rel="noreferrer" className="font-semibold underline decoration-[#8fb1df] underline-offset-2 hover:text-[#123a72]">{source.title}</a></span>)}</div>}
              </div>}
              {message.role === 'assistant' && <div className="mt-3 border-t border-[#d9e4f2] pt-2 text-[10px] text-[#607798]">{message.feedback ? <span className="font-semibold text-[#315785]">Obrigado pelo feedback.</span> : <div className="flex flex-wrap items-center gap-2"><span>Resolveu sua dúvida?</span><button type="button" disabled={feedbackBusy !== null} onClick={() => submitFeedback(index, true)} className="inline-flex items-center gap-1 rounded-lg border border-[#b8dec9] bg-[#f0fbf5] px-2 py-1 font-bold text-[#176d43] disabled:opacity-50"><ThumbsUp size={11} />Sim</button><button type="button" disabled={feedbackBusy !== null} onClick={() => submitFeedback(index, false)} className="inline-flex items-center gap-1 rounded-lg border border-[#e8c0ca] bg-[#fff5f7] px-2 py-1 font-bold text-[#8e2740] disabled:opacity-50"><ThumbsDown size={11} />Não</button>{feedbackBusy === index && <Loader2 size={11} className="animate-spin" />}</div>}</div>}
            </div>
          </div>)}

          {busy && <div className="flex justify-start"><div className="inline-flex items-center gap-2 rounded-2xl border border-[#cbdcf1] bg-white px-3.5 py-3 text-sm font-medium text-[#476486] shadow-sm"><Loader2 size={16} className="animate-spin text-[#246cff]" />Conferindo a questão e validando a resposta…</div></div>}

          {pendingFocus && <div className="rounded-2xl border border-[#b9cfee] bg-[#f4f8ff] p-4"><div className="flex items-start gap-3"><div className="mt-0.5 rounded-xl bg-[#e5efff] p-2 text-[#246cff]"><PlusCircle size={18} /></div><div className="min-w-0 flex-1"><div className="text-sm font-extrabold text-[#17365f]">Quer reforçar isso no seu plano?</div><div className="mt-1 text-xs leading-relaxed text-[#526b90]"><strong className="text-[#183153]">{pendingFocus.area}</strong> · {pendingFocus.skill_name}</div><div className="mt-3 flex flex-wrap gap-2"><button disabled={savingPlan} onClick={addFocusToPlan} className="inline-flex items-center gap-2 rounded-xl bg-[#246cff] px-3 py-2 text-xs font-extrabold text-white disabled:opacity-50">{savingPlan ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}Adicionar ao meu plano</button><button onClick={() => setPendingFocus(null)} className="rounded-xl border border-[#bfd0e7] bg-white px-3 py-2 text-xs font-bold text-[#4a6487]">Agora não</button></div></div></div></div>}

          {planStatus && <div className="flex items-start gap-2 rounded-2xl border border-[#b8dec9] bg-[#effaf4] px-3.5 py-3 text-xs font-medium text-[#195f3e]"><CheckCircle2 size={16} className="mt-0.5 shrink-0" />{planStatus}</div>}
          {error && <div className={`rounded-2xl border px-4 py-3 text-sm leading-relaxed shadow-sm ${errorKind === 'auth' ? 'border-[#1d3f72] bg-[#132f59] text-white' : errorKind === 'limit' ? 'border-[#e0bd68] bg-[#fff7df] text-[#6a4c00]' : 'border-[#efc1cb] bg-[#fff3f5] text-[#7f2238]'}`}><div className="font-semibold">{error}</div>{errorKind === 'auth' && <div className="mt-1 text-xs text-[#d7e7ff]">Faça login no Curso e abra a IA novamente.</div>}{errorKind === 'limit' && <div className="mt-1 text-xs text-[#765a0b]">O limite reinicia no próximo dia.</div>}</div>}
          <div ref={bottomRef} />
        </div>
      </div>

      {image && <div className="border-t border-[#d6e2f2] bg-white px-3 py-2"><div className="flex items-center gap-2"><img src={image} alt="Questão anexada" className="h-14 w-14 rounded-lg border border-[#d9e4f2] object-cover" /><div className="min-w-0 flex-1 text-xs font-medium leading-relaxed text-[#4e678a]"><strong className="text-[#183153]">Questão pronta para análise.</strong> A imagem é descartada ao concluir a resposta ou fechar a IA.</div><button onClick={() => setImage('')} className="rounded-lg bg-[#eef4ff] p-2 text-[#486487] hover:bg-[#e1ebfb]" aria-label="Remover imagem"><Trash2 size={16} /></button></div></div>}

      <div className="border-t border-[#d6e2f2] bg-white p-3">
        <div className="flex items-end gap-2 rounded-2xl border border-[#bfd0e7] bg-white p-2 shadow-sm focus-within:border-[#4d82cc] focus-within:ring-2 focus-within:ring-[#dbe9ff]">
          <label className="shrink-0 cursor-pointer rounded-xl bg-[#eef4ff] p-2 text-[#246cff] hover:bg-[#e1ebfb]" title="Anexar da Fototeca, câmera ou Arquivos"><ImagePlus size={19} /><input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={event => { void chooseImage(event.target.files?.[0] || null); event.currentTarget.value = ''; }} /></label>
          <textarea value={input} onChange={event => { setInput(event.target.value); if (error) { setError(''); setErrorKind(''); } }} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); } }} rows={1} placeholder={signedIn ? 'Digite sua dúvida ou anexe uma questão…' : 'Entre na sua conta para usar a IA'} className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-1 py-2 text-sm font-medium text-[#183153] outline-none placeholder:text-[#7b8fab]" />
          <button onClick={() => void send()} disabled={busy || !input.trim() || !signedIn || remainingQuestions === 0} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#246cff] text-white shadow-sm disabled:cursor-not-allowed disabled:bg-[#c3cee0] disabled:text-[#667b98]" aria-label="Enviar"><Send size={18} /></button>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 text-[10px] font-medium text-[#5f7595]"><span className="inline-flex items-center gap-1"><ShieldCheck size={11} className="text-[#246cff]" />{signedIn ? `${usageLabel} · uso individual e protegido` : 'Login necessário · 10 usos por dia por usuário'}</span>{messages.length > 0 && <button onClick={clearConversation} className="shrink-0 font-bold text-[#365c8b] hover:text-[#173a70]">Limpar conversa</button>}</div>
      </div>
    </div>}

    <button onClick={() => { setError(''); setErrorKind(''); setOpen(true); }} aria-label="Abrir IA Conectaê" className={`fixed z-[119] inline-flex items-center gap-2 rounded-2xl bg-[#246cff] text-sm font-extrabold text-white shadow-xl shadow-[#214b8a]/25 transition hover:bg-[#1f5fe1] ${mobileDocked ? 'bottom-[calc(78px+env(safe-area-inset-bottom))] right-3 h-12 w-12 justify-center p-0 md:bottom-4 md:right-4 md:h-auto md:w-auto md:px-4 md:py-3' : 'bottom-4 right-4 px-4 py-3'}`}><Bot size={18} /><span className={mobileDocked ? 'hidden md:inline' : 'inline'}>IA Conectaê</span></button>
  </>;
}
