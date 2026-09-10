import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { createClient } from '@supabase/supabase-js';

const MODEL = 'openai/gpt-5.6-sol';
const REVIEW_MODEL = 'anthropic/claude-opus-5';
const SEARCH_MODEL = 'google/gemini-3.6-flash';
const FALLBACK_MODELS = ['anthropic/claude-opus-5', 'google/gemini-3.6-flash', 'openai/gpt-5.6-luna'];
const DAILY_LIMIT = 10;
const FALLBACK_SUPABASE_URL = 'https://kmognvgnfisdchzffkgh.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6Imttb2dudmduZmlzZGNoemZma2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MzkxNjksImV4cCI6MjEwMjMxNTE2OX0.JarpsXfgv8PplL3Ryvs6iFfEPiv_rnp2Cx5i1I67fCk';

type Msg = { role: 'user' | 'assistant'; content: string };
type Practice = {
  id: number; area: string; skill_name: string; difficulty: number; prompt: string;
  option_a?: string; option_b?: string; option_c?: string; option_d?: string; option_e?: string;
  correct_option: string; explanation: string; source_kind?: string; source_exam_year?: number | null;
  source_question_number?: number | null; source_exam_label?: string | null; source_caderno?: string | null;
  source_exam_url?: string | null; source_answer_url?: string | null; source_verified_at?: string | null;
};
type Skill = { area: string; skill_code: string; skill_name: string; parent_skill_code?: string | null; diagnostic_tags?: string[]; scope?: string };

const EXAM_FINGERPRINTS: Record<string, string> = {
  enem: 'ENEM: 180 questões em dois dias + redação. Priorize interpretação, modelagem e aplicação. Em redação, respeite as cinco competências.',
  fuvest: 'FUVEST: diferencie 1ª fase objetiva e 2ª fase discursiva/redação. Exija justificativa adequada à etapa.',
  cmmg: 'FCM-MG/CMMG: não invente formato, pesos, quantidade de questões ou critérios. Use somente contexto confirmado.',
  insper: 'Insper: prova própria com questões objetivas e redação. Não confunda com critérios do ENEM.',
  link: 'Link School of Business: processo holístico. Em business cases, avalie dados, mercado, trade-offs, recomendação e comunicação.',
  ibmec: 'Ibmec: trate o processo seletivo conforme a prova ativa e não invente nota de corte fixa.',
  einstein: 'Albert Einstein/Vunesp: respeite a estrutura da prova ativa e não misture etapas.',
};

function json(res: any, status: number, body: unknown) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  return res.status(status).json(body);
}
function trim(value: unknown, max = 4000) { return String(value ?? '').slice(0, max); }
function clamp(value: unknown, min = 0, max = 0.99) { return Math.max(min, Math.min(max, Number(value) || 0)); }
function list(value: unknown, max = 4) { return Array.isArray(value) ? value.map(v => trim(v, 240).trim()).filter(Boolean).slice(0, max) : []; }
function cleanEnv(value: unknown) { return String(value ?? '').trim().replace(/^["']|["']$/g, ''); }
function unexpectedScript(value: string) { return /[\u0400-\u052f\u0590-\u08ff\u0900-\u109f\u3040-\u30ff\u3400-\u9fff]/u.test(value); }
function sanitizeUnexpectedScript(value: string) {
  return value.replace(/[\u0400-\u052f\u0590-\u08ff\u0900-\u109f\u3040-\u30ff\u3400-\u9fff]+/gu, ' ').replace(/[ \t]{2,}/g, ' ').trim();
}
function parseJson(raw: string) {
  const value = raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
  const start = value.indexOf('{'); const end = value.lastIndexOf('}');
  for (const candidate of [value, start >= 0 && end > start ? value.slice(start, end + 1) : '']) {
    if (!candidate) continue;
    try { return JSON.parse(candidate); } catch {}
  }
  throw new Error('invalid-json');
}
function config() {
  const raw = cleanEnv(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL);
  const key = cleanEnv(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_SUPABASE_ANON_KEY);
  try { const u = new URL(raw.startsWith('http') ? raw : `https://${raw}`); return { url: u.origin, key }; } catch { return { url: FALLBACK_SUPABASE_URL, key: FALLBACK_SUPABASE_ANON_KEY }; }
}
async function verifyToken(url: string, key: string, token: string) {
  if (!token) return '';
  try {
    const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
    const { data, error } = await client.auth.getUser(token);
    return !error && data?.user?.id ? String(data.user.id) : '';
  } catch { return ''; }
}
async function fetchRows(url: string, headers: Record<string, string>) {
  try { const r = await fetch(url, { headers, signal: AbortSignal.timeout(9000) }); if (!r.ok) return []; const d = await r.json(); return Array.isArray(d) ? d : []; } catch { return []; }
}
function spDayWindow() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const year = Number(parts.find(p => p.type === 'year')?.value); const month = Number(parts.find(p => p.type === 'month')?.value); const day = Number(parts.find(p => p.type === 'day')?.value);
  const start = new Date(Date.UTC(year, month - 1, day, 3, 0, 0));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}
async function reserveDailyUse(cfg: { url: string; key: string }, token: string, userId: string, exam: string, hasImage: boolean) {
  const headers = { apikey: cfg.key, Authorization: `Bearer ${token}`, Accept: 'application/json' };
  const { start, end } = spDayWindow();
  const rows = await fetchRows(`${cfg.url}/rest/v1/ai_tutor_usage?select=id&user_id=eq.${encodeURIComponent(userId)}&feature=eq.tutor&created_at=gte.${encodeURIComponent(start)}&created_at=lt.${encodeURIComponent(end)}&limit=${DAILY_LIMIT + 1}`, headers);
  if (rows.length >= DAILY_LIMIT) return { allowed: false, remaining: 0 };
  try {
    const r = await fetch(`${cfg.url}/rest/v1/ai_tutor_usage`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ user_id: userId, exam_id: exam, has_image: hasImage, access_tier: 'premium', feature: 'tutor' }),
      signal: AbortSignal.timeout(9000),
    });
    if (!r.ok) throw new Error(`usage insert ${r.status}`);
  } catch (e) {
    console.error('usage reservation failed', e);
    throw new Error('usage-reservation-failed');
  }
  return { allowed: true, remaining: Math.max(0, DAILY_LIMIT - rows.length - 1) };
}
function tokens(value: string) { return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9]+/).filter(t => t.length > 2); }
function rankPractice(items: Practice[], query: string, area: string, skill: string) {
  const q = new Set(tokens(query));
  return items.map(item => {
    let score = 0; const hay = tokens(`${item.area} ${item.skill_name} ${item.prompt}`);
    if (area && item.area.toLowerCase().includes(area.toLowerCase())) score += 12;
    if (skill && item.skill_name.toLowerCase().includes(skill.toLowerCase())) score += 16;
    for (const t of hay) if (q.has(t)) score += 2;
    if (/^official/.test(item.source_kind || '')) score += 4;
    return { item, score };
  }).sort((a,b) => b.score - a.score || Number(b.item.difficulty) - Number(a.item.difficulty)).slice(0, 6).map(x => x.item);
}
function confidenceLabel(v: number) { return v >= .94 ? 'Alta confiança' : v >= .8 ? 'Confiança moderada' : 'Baixa confiança'; }
function sourceList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 5).map((s: any) => { try { const u = new URL(String(s?.url || '')); return { title: trim(s?.title || u.hostname, 140), url: u.toString() }; } catch { return null; } }).filter(Boolean);
}

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') return json(res, 200, { ok: true, service: 'IA Conectaê Premium', model: MODEL, reviewModel: REVIEW_MODEL, searchModel: SEARCH_MODEL, access: 'authenticated', dailyQuestionLimit: DAILY_LIMIT, supportedExams: Object.keys(EXAM_FINGERPRINTS) });
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });

  try {
    const cfg = config();
    const auth = String(req.headers.authorization || '');
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    const userId = await verifyToken(cfg.url, cfg.key, token);
    if (!userId) return json(res, 401, { error: 'Entre na sua conta para usar a IA. O limite é de 10 usos por dia por usuário.', dailyQuestionLimit: DAILY_LIMIT });

    const body = req.body || {};
    const rawMessages = body.messages;
    const context = body.context && typeof body.context === 'object' ? body.context : {};
    const imageDataUrl = body.imageDataUrl;
    if (!Array.isArray(rawMessages) || !rawMessages.length) return json(res, 400, { error: 'Escreva sua dúvida.' });
    const safe: Msg[] = rawMessages.slice(-12).map((m: any): Msg => ({ role: m?.role === 'assistant' ? 'assistant' : 'user', content: trim(m?.content, 3200) })).filter((m: Msg) => m.content.trim());
    if (!safe.length) return json(res, 400, { error: 'Escreva sua dúvida.' });
    const hasImage = typeof imageDataUrl === 'string';
    if (hasImage && !/^data:image\/(jpeg|png|webp);base64,/i.test(imageDataUrl)) return json(res, 400, { error: 'Formato de imagem inválido.' });
    if (hasImage && imageDataUrl.length > 4_800_000) return json(res, 413, { error: 'A foto ficou grande demais. Recorte apenas a questão.' });

    const exam = trim(context.exam || 'enem', 40).toLowerCase();
    const quota = await reserveDailyUse(cfg, token, userId, exam, hasImage);
    if (!quota.allowed) return json(res, 429, { error: 'Você atingiu o limite de 10 usos da IA hoje. O limite renova à meia-noite.', dailyQuestionLimit: DAILY_LIMIT, remainingQuestions: 0 });

    const latest = safe[safe.length - 1]?.content || '';
    const area = trim(context.currentArea, 80); const currentSkill = trim(context.currentSkill, 150); const contextQuestion = trim(context.currentQuestion, 2600);
    const dbHeaders = { apikey: cfg.key, Authorization: `Bearer ${token}`, Accept: 'application/json' };
    const [practiceRaw, skillsRaw] = await Promise.all([
      fetchRows(`${cfg.url}/rest/v1/exam_practice_questions?select=id,area,skill_name,difficulty,prompt,option_a,option_b,option_c,option_d,option_e,correct_option,explanation,source_kind,source_exam_year,source_question_number,source_exam_label,source_caderno,source_exam_url,source_answer_url,source_verified_at&exam_id=eq.${encodeURIComponent(exam)}&active=is.true&limit=1200`, dbHeaders),
      fetchRows(`${cfg.url}/rest/v1/exam_skill_taxonomy?select=area,skill_code,skill_name,parent_skill_code,diagnostic_tags&exam_id=eq.${encodeURIComponent(exam)}&limit=500`, dbHeaders),
    ]);
    const examples = rankPractice(practiceRaw as Practice[], `${latest} ${contextQuestion}`, area, currentSkill);
    const skills = (skillsRaw as Skill[]).slice(0, 120);
    const retrieved = examples.map(q => ({ id: q.id, area: q.area, skill: q.skill_name, difficulty: q.difficulty, prompt: q.prompt, options: { A:q.option_a,B:q.option_b,C:q.option_c,D:q.option_d,E:q.option_e }, correct: q.correct_option, explanation: q.explanation, source: { kind:q.source_kind, label:q.source_exam_label, year:q.source_exam_year, number:q.source_question_number, verified:Boolean(q.source_verified_at), examUrl:q.source_exam_url, answerUrl:q.source_answer_url } }));

    const system = `Você é a IA Conectaê Premium, tutor educacional brasileiro de altíssima precisão. Responda em português do Brasil. Resolva a questão do zero antes de concluir. Confira cuidadosamente negações (EXCETO/incorreta), unidades, sinais, domínio, causalidade, alternativas e arredondamentos. Não exponha cadeia interna de raciocínio. Se uma imagem estiver ilegível ou faltar informação indispensável, não invente: peça uma imagem melhor. Nunca invente gabarito, ano, número, banca ou fonte. Quando houver questão recuperada oficial, use-a como evidência prioritária. PROVA: ${EXAM_FINGERPRINTS[exam] || 'Use somente o contexto confirmado da prova ativa.'} CONTEXTO: ${JSON.stringify({ area, currentSkill, currentQuestion: contextQuestion, recentDifficulties: list(context.recentDifficulties, 5), recentPerformance: list(context.recentPerformance, 5) })} HABILIDADES: ${JSON.stringify(skills)} QUESTÕES RECUPERADAS: ${JSON.stringify(retrieved)} Retorne SOMENTE JSON válido: {"answer":"explicação didática e objetiva","confidence":0.0,"confidence_reason":"uma frase","self_check_passed":true,"answerable":true,"resolved_doubt":true,"needs_better_image":false,"needs_external_check":false,"uncertainty_reason":null,"assumptions":[],"learning_focus":{"area":"","skill_code":"","skill_name":"","confidence":0.0,"reason":""},"offer_plan":false}`;
    const modelMessages: any[] = safe.map((m, i) => i === safe.length - 1 && m.role === 'user' && hasImage ? { role:'user', content:[{type:'text',text:m.content},{type:'image',image:imageDataUrl}] } : { role:m.role, content:m.content });
    const gateway = { user: userId, tags: ['feature:education-tutor-premium', `exam:${exam}`] };

    let primary: any;
    try {
      const r = await generateText({ model: MODEL, system, messages: modelMessages, maxOutputTokens: 2200, abortSignal: AbortSignal.timeout(55_000), providerOptions: { gateway: { ...gateway, models: FALLBACK_MODELS } } } as any);
      primary = parseJson(String(r.text || ''));
    } catch (e: any) {
      console.error('premium tutor primary', e?.message || e);
      return json(res, 502, { error: 'A IA não conseguiu concluir a resposta agora. Tente novamente em instantes.', remainingQuestions: quota.remaining });
    }

    const explicitLookup = /\b(gabarito|fonte|banca|prova|vestibular|quest[aã]o\s*\d+|20\d{2})\b/i.test(`${latest} ${contextQuestion}`);
    let final = primary; let mode: 'review' | 'search' = 'review'; let sources: any[] = [];

    if (explicitLookup || primary.needs_external_check === true) {
      try {
        const r = await generateText({
          model: SEARCH_MODEL,
          system: 'Você é o verificador factual da IA Conectaê. Busque preferencialmente fonte oficial. Não invente fonte. Retorne apenas JSON com answer, confidence, confidence_reason, self_check_passed, answerable, resolved_doubt, needs_better_image, uncertainty_reason, assumptions, web_verified.',
          messages: [{ role:'user', content: hasImage ? [{type:'text',text:`Prova: ${exam}\nPergunta: ${latest}\nEnunciado: ${contextQuestion}\nResposta preliminar: ${trim(primary.answer,3000)}`},{type:'image',image:imageDataUrl}] : `Prova: ${exam}\nPergunta: ${latest}\nEnunciado: ${contextQuestion}\nResposta preliminar: ${trim(primary.answer,3000)}` }],
          maxOutputTokens: 1700, abortSignal: AbortSignal.timeout(50_000), tools: { google_search: google.tools.googleSearch({}) }, providerOptions: { gateway: { ...gateway, tags:[...gateway.tags,'external-verification'] } }
        } as any);
        const checked = parseJson(String(r.text || '')); const found = sourceList((r as any).sources);
        if (checked?.answer && checked.web_verified === true && found.length) { final = { ...primary, ...checked }; sources = found; mode = 'search'; }
      } catch (e: any) { console.warn('premium tutor search', e?.message || e); }
    }

    if (mode !== 'search') {
      try {
        const r = await generateText({
          model: REVIEW_MODEL,
          system: 'Você é o revisor adversarial final da IA Conectaê. Resolva o problema de forma independente, compare com a resposta preliminar e corrija qualquer erro. Seja rigoroso com alternativas, sinais, unidades, exceções e premissas. Não exponha cadeia interna. Retorne SOMENTE JSON com answer, confidence, confidence_reason, self_check_passed, answerable, resolved_doubt, needs_better_image, uncertainty_reason, assumptions, agrees_with_preliminary.',
          messages: [{ role:'user', content: hasImage ? [{type:'text',text:`Pergunta: ${latest}\nEnunciado: ${contextQuestion}\nPreliminar: ${trim(primary.answer,3200)}`},{type:'image',image:imageDataUrl}] : `Pergunta: ${latest}\nEnunciado: ${contextQuestion}\nPreliminar: ${trim(primary.answer,3200)}` }],
          maxOutputTokens: 1900, abortSignal: AbortSignal.timeout(55_000), providerOptions: { gateway: { ...gateway, models:['openai/gpt-5.6-sol','google/gemini-3.6-flash'], tags:[...gateway.tags,'adversarial-review'] } }
        } as any);
        const reviewed = parseJson(String(r.text || ''));
        if (reviewed?.answer) final = { ...primary, ...reviewed };
      } catch (e: any) { console.warn('premium tutor review', e?.message || e); }
    }

    let answer = trim(final.answer, 7000).trim();
    if (!answer) return json(res, 502, { error: 'A resposta ficou incompleta. Tente novamente.', remainingQuestions: quota.remaining });
    if (unexpectedScript(answer)) answer = sanitizeUnexpectedScript(answer);
    const answerable = Boolean(final.answerable ?? true); const selfChecked = Boolean(final.self_check_passed ?? true); const resolvedDoubt = Boolean(final.resolved_doubt ?? true); const needsBetterImage = Boolean(final.needs_better_image);
    let confidence = clamp(final.confidence ?? primary.confidence);
    if (!answerable || !selfChecked || !resolvedDoubt) confidence = Math.min(confidence, .79);
    if (needsBetterImage) confidence = Math.min(confidence, .55);

    return json(res, 200, {
      answer, educational:true, publicAccess:false, resolvedDoubt, answerable, confidence, confidenceLabel:confidenceLabel(confidence),
      confidenceReason:trim(final.confidence_reason ?? primary.confidence_reason, 320), uncertaintyReason:trim(final.uncertainty_reason ?? primary.uncertainty_reason, 420) || null,
      assumptions:list(final.assumptions ?? primary.assumptions, 4), selfChecked, learningFocus:final.learning_focus ?? primary.learning_focus ?? null,
      offerPlan:Boolean(final.offer_plan ?? primary.offer_plan), needsBetterImage, model:mode === 'search' ? SEARCH_MODEL : REVIEW_MODEL, primaryModel:MODEL,
      reviewModel:REVIEW_MODEL, searchMode:mode, webVerified:mode === 'search' && sources.length > 0, sources, retrievalGrounded:examples.length > 0,
      retrievedExamples:examples.length, dailyQuestionLimit:DAILY_LIMIT, remainingQuestions:quota.remaining, adminUnlimited:false, premiumUnlimited:false,
    });
  } catch (error: any) {
    console.error('education-tutor-public failed', error);
    if (String(error?.message || '').includes('usage-reservation-failed')) return json(res, 503, { error: 'Não consegui validar seu limite diário agora. Tente novamente.' });
    return json(res, 500, { error: 'A IA encontrou uma falha inesperada. Tente novamente.' });
  }
}
