import { useEffect, useRef, useState } from 'react';
import { Bot, CheckCircle2, ImagePlus, Loader2, Maximize2, Minimize2, PlusCircle, RotateCcw, Send, ShieldCheck, Sparkles, ThumbsDown, ThumbsUp, Trash2, X } from 'lucide-react';
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
  const clean = value
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
    }));
  const deduped: Message[] = [];
  for (const message of clean) {
    const previous = deduped[deduped.length - 1];
    if (previous && previous.role === message.role && previous.content === message.content) continue;
    deduped.push(message);
  }
  return deduped.slice(-24);
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
  const request = async (token?: string) => fetch('/api/education-tutor', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  let token = '';
  if (supabase) {
    try {
      const { data } = await supabase.auth.getSession();
      token = data.session?.access_token || '';
    } catch {
      token = '';
    }
  }

  const response = await request(token || undefined);
  if (response.status === 401 && token) return request();
  return response;
}

export default function AIEducationTutor({ mobileDocked = false }: { mobileDocked?: boolean } = {}) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [image, setImage] = useState('');
  const [context, setContext] = useState<TutorContext>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [studentContext, setStudentContext] = useState<any>({ exam: localStorage.getItem('conectae:active-exam') || 'enem' });
  const [pendingFocus, setPendingFocus] = useState<LearningFocus | null>(null);
  const [planStatus, setPlanStatus] = useState('');
  const [feedbackBusy, setFeedbackBusy] = useState<number | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) window.setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 40);
  }, [open, messages, busy, pendingFocus, planStatus, error]);

  useEffect(() => {
    const handler = (event: CustomEvent<TutorContext>) => {
      setContext(event.detail || {});
      setError('');
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
    setPlanStatus('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Use uma imagem JPG, PNG ou WebP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('A imagem precisa ter até 10 MB.');
      return;
    }
    try {
      setImage(await imageToDataUrl(file));
      setOpen(true);
      if (!input.trim()) setInput('Analise esta questão, identifique o que ela cobra e me ensine a resolver.');
    } catch (err: any) {
      setError(err?.message || 'Não consegui preparar a imagem.');
    }
  };

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || busy) return;
    setBusy(true);
    setError('');
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
      if (!response.ok) throw new Error(data?.error || 'Não foi possível responder agora.');
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
    if (!pendingFocus || savingPlan) return;
    if (!supabase) {
      setPlanStatus('Entre no Curso com seu usuário para salvar esta habilidade no plano.');
      setPendingFocus(null);
      return;
    }
    setSavingPlan(true);
    setError('');
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;
      if (!user) {
        setSignedIn(false);
        setPlanStatus('A IA continua liberada. Para salvar esta habilidade no seu plano, entre no Curso com seu usuário.');
        setPendingFocus(null);
        return;
      }
      setSignedIn(true);
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
      setError('Não foi possível adicionar ao plano agora. A IA continua disponível normalmente.');
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
    setPendingFocus(null);
    setPlanStatus('');
  };

  const closeTutor = () => {
    clearConversation();
    setExpanded(false);
    setOpen(false);
  };

  return <>
    {open && <div className={`fixed z-[120] flex flex-col overflow-hidden border border-[#234576] bg-[#041027] text-white shadow-2xl shadow-black/50 ${expanded ? 'inset-2 md:inset-6 rounded-[22px]' : mobileDocked ? 'bottom-[calc(78px+env(safe-area-inset-bottom))] right-2 w-[calc(100vw-16px)] max-w-[460px] h-[min(720px,calc(100dvh-158px))] rounded-[22px] md:bottom-20 md:right-5 md:h-[min(720px,calc(100vh-100px))]' : 'bottom-20 right-2 w-[calc(100vw-16px)] max-w-[460px] h-[min(720px,calc(100vh-100px))] rounded-[22px] md:right-5'}`}>
      <div className="flex items-center gap-3 border-b border-[#173765] bg-[#06162f] px-4 py-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#246cff]"><Bot size={21} /></div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-sm font-extrabold">IA Conectaê <span className="rounded-full bg-emerald-300/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-emerald-200">Acesso livre</span> <Sparkles size={14} className="text-[#72a5ff]" /></div>
          <div className="truncate text-[11px] text-[#8ea8ca]">Tutor educacional · {studentContext.exam?.toUpperCase?.() || 'sua prova'} · liberada para todos</div>
        </div>
        <button onClick={() => setExpanded(value => !value)} className="rounded-lg p-2 text-[#9fb5d4] hover:bg-[#102a54]" aria-label={expanded ? 'Reduzir' : 'Expandir'}>{expanded ? <Minimize2 size={17} /> : <Maximize2 size={17} />}</button>
        <button onClick={closeTutor} className="rounded-lg p-2 text-[#9fb5d4] hover:bg-[#102a54]" aria-label="Fechar e reiniciar conversa"><X size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 md:px-4">
        {!messages.length && <div className="mx-auto max-w-sm py-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0c2a5c] text-[#72a5ff]"><Sparkles size={27} /></div>
          <h3 className="mt-4 text-xl font-extrabold">Tire a dúvida. Entenda o conteúdo.</h3>
          <p className="mt-2 text-sm leading-relaxed text-[#9fb5d4]">Pergunte por texto ou anexe uma questão da Fototeca, câmera ou Arquivos. Não é necessário entrar em uma conta para usar a IA.</p>
          <div className="mt-5 grid gap-2">{STARTERS.map(starter => <button key={starter} disabled={busy} onClick={() => send(starter)} className="rounded-xl border border-[#234576] bg-[#071a38] px-3 py-2.5 text-left text-xs font-bold text-[#c6d7ee] hover:border-[#3f72b8] hover:bg-[#0a2550] disabled:opacity-50">{starter}</button>)}</div>
        </div>}

        <div className="space-y-3">
          {messages.map((message, index) => <div key={`${message.role}-${index}-${message.content.slice(0, 16)}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[92%] whitespace-pre-wrap rounded-2xl px-3.5 py-3 text-sm leading-relaxed ${message.role === 'user' ? 'bg-[#246cff] text-white' : 'border border-[#193a68] bg-[#071a38] text-[#dce9fa]'}`}>
              {message.content}
              {message.role === 'assistant' && message.confidenceLabel && <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[#193a68] pt-2 text-[10px] font-bold">
                <span className={`rounded-full px-2 py-1 ${message.confidenceLabel === 'Alta confiança' ? 'bg-emerald-400/10 text-emerald-200' : message.confidenceLabel === 'Confiança moderada' ? 'bg-amber-400/10 text-amber-200' : 'bg-rose-400/10 text-rose-200'}`}>{message.confidenceLabel}</span>
                {message.selfChecked && <span className="rounded-full bg-[#12315f] px-2 py-1 text-[#a9c7ef]">Resposta revisada</span>}
                {message.webVerified && <span className="rounded-full bg-[#12315f] px-2 py-1 text-[#a9c7ef]">Fonte verificada</span>}
                {message.confidenceReason && <span className="w-full pt-1 font-medium leading-relaxed text-[#a9bddc]">Por quê: {message.confidenceReason}</span>}
                {message.uncertaintyReason && <span className="w-full pt-1 font-medium leading-relaxed text-[#d9b7c1]">Limite: {message.uncertaintyReason}</span>}
                {message.sources && message.sources.length > 0 && <div className="w-full pt-1 font-medium text-[#a9c7ef]">Fontes: {message.sources.map((source, sourceIndex) => <span key={source.url}>{sourceIndex > 0 ? ' · ' : ''}<a href={source.url} target="_blank" rel="noreferrer" className="underline decoration-[#4d82cc] underline-offset-2 hover:text-white">{source.title}</a></span>)}</div>}
              </div>}
              {message.role === 'assistant' && <div className="mt-3 border-t border-[#193a68] pt-2 text-[10px] text-[#8ea8ca]">{message.feedback ? <span className="font-semibold text-[#a9c7ef]">Obrigado pelo feedback.</span> : <div className="flex items-center gap-2"><span>Resolveu sua dúvida?</span><button type="button" disabled={feedbackBusy !== null} onClick={() => submitFeedback(index, true)} className="inline-flex items-center gap-1 rounded-lg border border-emerald-400/20 px-2 py-1 font-bold text-emerald-200 hover:bg-emerald-400/10 disabled:opacity-50"><ThumbsUp size={11} />Sim</button><button type="button" disabled={feedbackBusy !== null} onClick={() => submitFeedback(index, false)} className="inline-flex items-center gap-1 rounded-lg border border-rose-400/20 px-2 py-1 font-bold text-rose-200 hover:bg-rose-400/10 disabled:opacity-50"><ThumbsDown size={11} />Não</button>{feedbackBusy === index && <Loader2 size={11} className="animate-spin" />}</div>}</div>}
            </div>
          </div>)}

          {busy && <div className="flex justify-start"><div className="inline-flex items-center gap-2 rounded-2xl border border-[#193a68] bg-[#071a38] px-3.5 py-3 text-sm text-[#9fb5d4]"><Loader2 size={16} className="animate-spin" />Conferindo a questão e validando a resposta…</div></div>}

          {pendingFocus && <div className="rounded-2xl border border-[#2d5f9d] bg-[#071a38] p-4"><div className="flex items-start gap-3"><div className="mt-0.5 rounded-xl bg-[#0c2a5c] p-2 text-[#8eb7ff]"><PlusCircle size={18} /></div><div className="min-w-0 flex-1"><div className="text-sm font-extrabold">Quer reforçar isso no seu plano?</div><div className="mt-1 text-xs leading-relaxed text-[#9fb5d4]"><strong className="text-white">{pendingFocus.area}</strong> · {pendingFocus.skill_name}</div><div className="mt-3 flex flex-wrap gap-2"><button disabled={savingPlan} onClick={addFocusToPlan} className="inline-flex items-center gap-2 rounded-xl bg-[#246cff] px-3 py-2 text-xs font-extrabold disabled:opacity-50">{savingPlan ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}{signedIn ? 'Adicionar ao meu plano' : 'Entrar no Curso para salvar'}</button><button onClick={() => setPendingFocus(null)} className="rounded-xl border border-[#234576] px-3 py-2 text-xs font-bold text-[#a9bddc]">Agora não</button></div></div></div></div>}

          {planStatus && <div className="flex items-start gap-2 rounded-2xl border border-[#245c4c] bg-[#07241e] px-3.5 py-3 text-xs text-[#bcebd8]"><CheckCircle2 size={16} className="mt-0.5 shrink-0" />{planStatus}</div>}
          {error && <div className="rounded-2xl border border-[#65354a] bg-[#2d1020] px-3.5 py-3 text-xs leading-relaxed text-[#ffd0da]"><div>{error}</div><button disabled={busy} onClick={() => send()} className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-[#8c4b66] px-2.5 py-1.5 font-bold text-white disabled:opacity-50"><RotateCcw size={13} />Tentar novamente</button></div>}
          <div ref={bottomRef} />
        </div>
      </div>

      {image && <div className="border-t border-[#173765] bg-[#06162f] px-3 py-2"><div className="flex items-center gap-2"><img src={image} alt="Questão anexada" className="h-14 w-14 rounded-lg object-cover" /><div className="min-w-0 flex-1 text-xs text-[#a9bddc]">Questão pronta para análise. A imagem é descartada ao concluir a resposta ou fechar a IA.</div><button onClick={() => setImage('')} className="rounded-lg p-2 text-[#9fb5d4] hover:bg-[#102a54]" aria-label="Remover imagem"><Trash2 size={16} /></button></div></div>}

      <div className="border-t border-[#173765] bg-[#06162f] p-3">
        <div className="flex items-end gap-2 rounded-2xl border border-[#234576] bg-[#031027] p-2 focus-within:border-[#4d82cc]">
          <label className="shrink-0 cursor-pointer rounded-xl p-2 text-[#8eb7ff] hover:bg-[#102a54]" title="Anexar da Fototeca, câmera ou Arquivos"><ImagePlus size={19} /><input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={event => { void chooseImage(event.target.files?.[0] || null); event.currentTarget.value = ''; }} /></label>
          <textarea value={input} onChange={event => { setInput(event.target.value); if (error) setError(''); }} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); } }} rows={1} placeholder="Digite sua dúvida ou anexe uma questão…" className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-1 py-2 text-sm text-white outline-none placeholder:text-[#607a9f]" />
          <button onClick={() => void send()} disabled={busy || !input.trim()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#246cff] disabled:opacity-40" aria-label="Enviar"><Send size={18} /></button>
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-[#607a9f]"><span className="inline-flex items-center gap-1"><ShieldCheck size={11} />IA liberada para todos · login só é necessário para salvar no plano.</span>{messages.length > 0 && <button onClick={clearConversation} className="shrink-0 hover:text-white">Limpar conversa</button>}</div>
      </div>
    </div>}

    <button onClick={() => { setError(''); setOpen(true); }} aria-label="Abrir IA Conectaê" className={`fixed z-[119] inline-flex items-center gap-2 rounded-2xl bg-[#246cff] text-sm font-extrabold text-white shadow-xl shadow-black/30 transition hover:bg-[#2d75ff] ${mobileDocked ? 'bottom-[calc(78px+env(safe-area-inset-bottom))] right-3 h-12 w-12 justify-center p-0 md:bottom-4 md:right-4 md:h-auto md:w-auto md:px-4 md:py-3' : 'bottom-4 right-4 px-4 py-3'}`}><Bot size={18} /><span className={mobileDocked ? 'hidden md:inline' : 'inline'}>IA Conectaê</span></button>
  </>;
}
