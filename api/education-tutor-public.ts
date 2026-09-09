import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { createClient } from '@supabase/supabase-js';

const MODEL = 'openai/gpt-5.6-luna';
const REVIEW_MODEL = 'google/gemini-3.6-flash';
const SEARCH_MODEL = 'google/gemini-2.5-flash-lite';
const FALLBACK_MODELS = ['google/gemini-3.6-flash', 'anthropic/claude-fable-5', 'openai/gpt-5.4-mini'];
const DIRECT_MODEL = 'gemini-2.5-flash';
const FALLBACK_SUPABASE_URL = 'https://kmognvgnfisdchzffkgh.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6Imttb2dudmduZmlzZGNoemZma2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MzkxNjksImV4cCI6MjEwMjMxNTE2OX0.JarpsXfgv8PplL3Ryvs6iFfEPiv_rnp2Cx5i1I67fCk';

type Msg = { role: 'user' | 'assistant'; content: string };
type Skill = { area: string; skill_code: string; skill_name: string; scope?: string; diagnostic_tags?: string[]; parent_skill_code?: string | null; official_reference?: boolean };
type Practice = { id: number; area: string; skill_name: string; difficulty: number; prompt: string; option_a?: string; option_b?: string; option_c?: string; option_d?: string; option_e?: string; correct_option: string; explanation: string; source_kind?: string; source_exam_year?: number | null; source_question_number?: number | null; source_exam_label?: string | null; source_caderno?: string | null; source_exam_url?: string | null; source_answer_url?: string | null; source_verified_at?: string | null };

const EXAM_FINGERPRINTS: Record<string, string> = {
  enem: 'ENEM: 180 questões em dois dias + redação. Priorize leitura contextual, modelagem e aplicação. Em redação, use as cinco competências e proposta de intervenção.',
  fuvest: 'FUVEST: 1ª fase objetiva e 2ª fase discursiva/redação. Valorize desenvolvimento, justificativa e aderência à etapa ativa.',
  cmmg: 'FCM-MG/CMMG: não misture quantidade de questões, pesos ou critérios entre modalidades.',
  insper: 'Insper: prova própria com questões objetivas e redação. Não confunda a redação do Insper com o padrão ENEM.',
  link: 'Link School of Business: jornada holística em PREP, SPRINT e entrevista. Em business cases, avalie dados, mercado, trade-offs, recomendação e comunicação.',
  ibmec: 'Ibmec: trate o processo seletivo conforme a prova ativa e não invente nota de corte fixa.',
  einstein: 'Albert Einstein/Vunesp: respeite a estrutura da prova e, em Medicina, trate MME como etapa separada quando aplicável.',
};

function json(res: any, status: number, body: unknown) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(body);
}

function trim(value: unknown, max = 4000) {
  return String(value ?? '').slice(0, max);
}

function clamp(value: unknown, min = 0, max = 0.99) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function cleanEnv(value: unknown) {
  return String(value ?? '').trim().replace(/^["']|["']$/g, '');
}

function placeholder(value: string) {
  return /(?:^|[._-])(x{4,}|placeholder|changeme|seu-projeto|your-project)(?:[._-]|$)/i.test(value);
}

function tokens(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9]+/).filter(token => token.length > 2);
}

function list(value: unknown, max = 4) {
  return Array.isArray(value) ? value.map(item => trim(item, 220).trim()).filter(Boolean).slice(0, max) : [];
}

function confidenceLabel(value: number) {
  return value >= 0.94 ? 'Alta confiança' : value >= 0.8 ? 'Confiança moderada' : 'Baixa confiança';
}

function hard(value: string) {
  return /\b(exceto|incorreta|respectivamente|necessariamente|sempre|nunca|condicional|aproxima[cç][aã]o|arredond|contraexemplo|causa|consequ[eê]ncia|gr[aá]fico|tabela|imagem|figura|gabarito|banca|20\d{2})\b/i.test(value) || /[=<>±√^]/.test(value);
}

function unexpectedScript(value: string) {
  return /[\u0400-\u052f\u0590-\u08ff\u0900-\u109f\u3040-\u30ff\u3400-\u9fff]/u.test(value);
}

export function sanitizeUnexpectedScript(value: string) {
  return value
    .replace(/[\u0400-\u052f\u0590-\u08ff\u0900-\u109f\u3040-\u30ff\u3400-\u9fff]+/gu, ' ')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/ *\n */g, '\n')
    .trim();
}

function parseJson(raw: string) {
  const value = raw.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
  const start = value.indexOf('{');
  const end = value.lastIndexOf('}');
  for (const candidate of [value, start >= 0 && end > start ? value.slice(start, end + 1) : '']) {
    if (!candidate) continue;
    try { return JSON.parse(candidate); } catch {}
    try { return JSON.parse(candidate.replace(/\\(?!["\\/bfnrtu])/g, '\\\\')); } catch {}
  }
  throw new Error('invalid-json');
}

function config() {
  const raw = cleanEnv(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL);
  const key = cleanEnv(process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || FALLBACK_SUPABASE_ANON_KEY);
  try {
    const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    if (key && !placeholder(key) && !placeholder(url.hostname) && /^[a-z0-9-]+\.supabase\.co$/i.test(url.hostname)) return { url: url.origin, key };
  } catch {}
  return { url: FALLBACK_SUPABASE_URL, key: FALLBACK_SUPABASE_ANON_KEY };
}

function anonymousClientId(value: unknown) {
  const id = trim(value, 80).trim();
  return /^[a-z0-9_-]{8,80}$/i.test(id) ? id : '';
}

async function fetchJson(url: string, headers: Record<string, string>): Promise<any[]> {
  try {
    const response = await fetch(url, { headers, signal: AbortSignal.timeout(9000) });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function verifyToken(url: string, key: string, token: string) {
  if (!token) return { userId: '' };
  const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
  try {
    const { data, error } = await client.auth.getUser(token);
    if (!error && data?.user?.id) return { userId: String(data.user.id) };
  } catch {}
  return { userId: '' };
}

function rankSkills(skills: Skill[], query: string, area: string, currentSkill: string) {
  const queryTokens = new Set(tokens(query));
  const areaLower = area.toLowerCase();
  const skillLower = currentSkill.toLowerCase();
  return skills
    .map(skill => {
      let score = 0;
      const haystack = tokens(`${skill.area} ${skill.skill_code} ${skill.skill_name} ${skill.scope || ''} ${(skill.diagnostic_tags || []).join(' ')}`);
      if (areaLower && skill.area.toLowerCase().includes(areaLower)) score += 10;
      if (skillLower && skill.skill_name.toLowerCase().includes(skillLower)) score += 14;
      for (const token of haystack) if (queryTokens.has(token)) score += 2;
      return { skill, score };
    })
    .sort((a, b) => b.score - a.score)
    .filter((row, index) => row.score > 0 || index < 18)
    .slice(0, 32)
    .map(row => row.skill);
}

function rankPractice(items: Practice[], query: string, area: string, currentSkill: string, seen: Set<number>) {
  const queryTokens = new Set(tokens(query));
  const areaLower = area.toLowerCase();
  const skillLower = currentSkill.toLowerCase();
  return items
    .map(item => {
      let score = 0;
      const haystack = tokens(`${item.area} ${item.skill_name} ${item.prompt}`);
      if (areaLower && item.area.toLowerCase().includes(areaLower)) score += 12;
      if (skillLower && item.skill_name.toLowerCase().includes(skillLower)) score += 18;
      for (const token of haystack) if (queryTokens.has(token)) score += 2;
      if (item.source_kind === 'official' || item.source_kind === 'official_adapted') score += 1.5;
      if (seen.has(Number(item.id))) score -= 18;
      return { item, score };
    })
    .sort((a, b) => b.score - a.score || Number(b.item.difficulty || 0) - Number(a.item.difficulty || 0))
    .filter((row, index) => row.score > 0 || index < 10)
    .slice(0, 5)
    .map(row => row.item);
}

function provenance(question: Practice) {
  return {
    kind: question.source_kind || 'legacy',
    label: question.source_exam_label || null,
    year: question.source_exam_year || null,
    number: question.source_question_number || null,
    caderno: question.source_caderno || null,
    verified: Boolean(question.source_verified_at),
    examUrl: question.source_exam_url || null,
    answerUrl: question.source_answer_url || null,
    official: question.source_kind === 'official' || question.source_kind === 'official_adapted',
  };
}

function sourceList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 4).map((source: any) => {
    try {
      const url = new URL(String(source?.url || ''));
      return { title: trim(source?.title || url.hostname, 140), url: url.toString() };
    } catch {
      return null;
    }
  }).filter(Boolean);
}

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') return json(res, 200, {
    ok: true,
    service: 'IA Conectaê pública',
    model: MODEL,
    reviewModel: REVIEW_MODEL,
    searchModel: SEARCH_MODEL,
    access: 'public',
    dailyQuestionLimit: null,
    supportedExams: Object.keys(EXAM_FINGERPRINTS),
  });
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });

  try {
    const cfg = config();
    const auth = String(req.headers.authorization || '');
    const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
    const verified = await verifyToken(cfg.url, cfg.key, token);
    const userId = verified.userId;
    const dbToken = userId && token ? token : cfg.key;
    const headers = { apikey: cfg.key, Authorization: `Bearer ${dbToken}`, Accept: 'application/json' };

    const body = req.body || {};
    const rawMessages = body.messages;
    const context = body.context && typeof body.context === 'object' ? body.context : {};
    const imageDataUrl = body.imageDataUrl;
    const clientId = anonymousClientId(body.clientId);
    if (!Array.isArray(rawMessages) || !rawMessages.length) return json(res, 400, { error: 'Escreva sua dúvida.' });

    const safe: Msg[] = rawMessages
      .slice(-10)
      .map((message: any): Msg => ({ role: message?.role === 'assistant' ? 'assistant' : 'user', content: trim(message?.content, 2600) }))
      .filter((message: Msg) => message.content.trim().length > 0);
    if (!safe.length) return json(res, 400, { error: 'Escreva sua dúvida.' });

    const hasImage = typeof imageDataUrl === 'string';
    if (hasImage && !/^data:image\/(jpeg|png|webp);base64,/i.test(imageDataUrl)) return json(res, 400, { error: 'Formato de imagem inválido.' });
    if (hasImage && imageDataUrl.length > 4_800_000) return json(res, 413, { error: 'A foto ficou grande demais. Recorte apenas a questão.' });

    const exam = trim(context.exam || 'enem', 40).toLowerCase();
    const latest = safe[safe.length - 1]?.content || '';
    const area = trim(context.currentArea, 80);
    const currentSkill = trim(context.currentSkill, 150);
    const contextQuestion = trim(context.currentQuestion, 2200);

    const [refsRaw, skillsRaw, practiceRaw, seenRows] = await Promise.all([
      fetchJson(`${cfg.url}/rest/v1/exam_ai_skill_reference?select=area,skill_code,skill_name,scope,diagnostic_tags,parent_skill_code,official_reference&exam_id=eq.${encodeURIComponent(exam)}`, headers),
      fetchJson(`${cfg.url}/rest/v1/exam_skill_taxonomy?select=area,skill_code,skill_name,diagnostic_tags&exam_id=eq.${encodeURIComponent(exam)}`, headers),
      fetchJson(`${cfg.url}/rest/v1/exam_practice_questions?select=id,area,skill_name,difficulty,prompt,option_a,option_b,option_c,option_d,option_e,correct_option,explanation,source_kind,source_exam_year,source_question_number,source_exam_label,source_caderno,source_exam_url,source_answer_url,source_verified_at&exam_id=eq.${encodeURIComponent(exam)}&active=is.true&limit=1200`, headers),
      userId ? fetchJson(`${cfg.url}/rest/v1/student_seen_questions?select=question_id&user_id=eq.${encodeURIComponent(userId)}&limit=1200`, headers) : Promise.resolve([]),
    ]);

    const refs = refsRaw as Skill[];
    const skills = skillsRaw as Skill[];
    const practice = practiceRaw as Practice[];
    const seen = new Set<number>(seenRows.map((row: any) => Number(row.question_id)));
    const taxonomyRefs: Skill[] = skills.map(skill => ({ ...skill, scope: `Habilidade da taxonomia ${exam}: ${skill.skill_name}`, official_reference: false }));
    const pool = [...refs, ...taxonomyRefs.filter(skill => !refs.some(reference => reference.skill_code === skill.skill_code))];
    const candidates = rankSkills(pool, `${latest} ${contextQuestion}`, area, currentSkill);
    const examples = rankPractice(practice, `${latest} ${contextQuestion}`, area, currentSkill, seen);
    const student = {
      exam,
      weeklyHours: trim(context.weeklyHours, 12),
      recentDifficulties: list(context.recentDifficulties, 6),
      recentPerformance: list(context.recentPerformance, 6),
      currentQuestion: contextQuestion,
      currentSkill,
      area,
    };
    const examplesSafe = examples.map(question => ({
      id: question.id,
      area: question.area,
      skill: question.skill_name,
      difficulty: question.difficulty,
      prompt: question.prompt,
      options: { A: question.option_a, B: question.option_b, C: question.option_c, D: question.option_d, E: question.option_e },
      answer: question.correct_option,
      explanation: question.explanation,
      provenance: provenance(question),
    }));

    const system = `Você é a IA Conectaê, tutor educacional brasileiro rigoroso, didático e intelectualmente honesto. Responda em português do Brasil usando apenas alfabeto latino, algarismos e símbolos matemáticos usuais. A IA é pública: não peça login e nunca fale em sessão expirada. Releia o comando e confira EXCETO/incorreta/sempre/nunca, domínio, sinais, unidades, causalidade e alternativas. Não exponha cadeia interna. Se faltar informação indispensável em uma imagem, diga o que falta e não invente. PROVA: ${EXAM_FINGERPRINTS[exam] || 'Use a taxonomia da prova ativa quando houver contexto.'} Nunca invente ano, número, banca ou fonte. CONTEXTO DO ALUNO: ${JSON.stringify(student)} HABILIDADES CANDIDATAS: ${JSON.stringify(candidates.map(skill => ({ area: skill.area, skill_code: skill.skill_code, skill_name: skill.skill_name, parent_skill_code: skill.parent_skill_code || null })))} EXEMPLOS RECUPERADOS: ${JSON.stringify(examplesSafe)} Retorne APENAS JSON válido: {"answer":"resposta curta e didática","confidence":0.0,"confidence_reason":"uma frase objetiva","self_check_passed":true,"needs_external_check":false,"answerable":true,"resolved_doubt":true,"needs_better_image":false,"uncertainty_reason":null,"assumptions":[],"learning_focus":{"area":"","skill_code":"","skill_name":"","plan_skill_code":null,"confidence":0.0,"reason":""},"offer_plan":false}`;

    const modelMessages: any[] = safe.map((message, index) => index === safe.length - 1 && message.role === 'user' && hasImage
      ? { role: 'user', content: [{ type: 'text', text: message.content }, { type: 'image', image: imageDataUrl }] }
      : { role: message.role, content: message.content });

    const gatewayUser = userId || (clientId ? `anon-${clientId}` : undefined);
    let raw = '';
    let primaryModel = MODEL;
    let primaryError = '';
    if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      try {
        raw = String((await generateText({
          model: google(DIRECT_MODEL),
          system,
          messages: modelMessages,
          maxOutputTokens: 1700,
          abortSignal: AbortSignal.timeout(45_000),
        } as any)).text || '');
        if (raw) primaryModel = `google/${DIRECT_MODEL}`;
      } catch (error: any) {
        primaryError = String(error?.message || error);
        console.warn('public tutor direct Google', primaryError.slice(0, 300));
      }
    }
    try {
      if (!raw) {
        raw = String((await generateText({
          model: MODEL,
          system,
          messages: modelMessages,
          maxOutputTokens: 1700,
          abortSignal: AbortSignal.timeout(45_000),
          providerOptions: { gateway: { models: FALLBACK_MODELS, ...(gatewayUser ? { user: gatewayUser } : {}), tags: ['feature:education-tutor-public', `exam:${exam}`] } },
        } as any)).text || '');
        if (raw) primaryModel = MODEL;
      }
    } catch (error: any) {
      primaryError = String(error?.message || error);
      console.error('public tutor primary', primaryError);
    }
    if (!raw) {
      const limited = /rate[- ]limit|too many requests|\b429\b/i.test(primaryError);
      return json(res, limited ? 429 : 502, { error: limited ? 'A IA recebeu muitas solicitações agora. Aguarde alguns segundos e tente novamente.' : 'A IA ficou temporariamente indisponível. Tente novamente.' });
    }

    let first: any;
    try { first = parseJson(raw); } catch { return json(res, 502, { error: 'A resposta ficou incompleta. Tente novamente.' }); }

    let final: any = first;
    let mode: 'primary' | 'search' | 'review' = 'primary';
    let sources: any[] = [];
    const baseConfidence = clamp(first.confidence);
    const explicitLookup = /\b(gabarito|fonte|banca|prova|vestibular|quest[aã]o\s*\d+|20\d{2})\b/i.test(`${latest} ${contextQuestion}`);
    const shouldSearch = Boolean(first.needs_external_check) || (explicitLookup && baseConfidence < 0.95) || (hasImage && baseConfidence < 0.72);
    const shouldReview = hard(`${latest} ${contextQuestion}`) || first.self_check_passed === false || baseConfidence < 0.84;

    if (shouldSearch) {
      try {
        const result = await generateText({
          model: SEARCH_MODEL,
          system: 'Você é o verificador externo. Prefira fonte oficial. web_verified=true apenas com fonte que sustente a conclusão. Não exponha cadeia interna. Retorne JSON com answer, confidence, confidence_reason, self_check_passed, answerable, resolved_doubt, needs_better_image, uncertainty_reason, assumptions e web_verified.',
          messages: [{ role: 'user', content: hasImage ? [{ type: 'text', text: `Prova: ${exam}\nPergunta: ${latest}\nEnunciado: ${contextQuestion}\nPreliminar: ${trim(first.answer, 2200)}` }, { type: 'image', image: imageDataUrl }] : `Prova: ${exam}\nPergunta: ${latest}\nEnunciado: ${contextQuestion}\nPreliminar: ${trim(first.answer, 2200)}` }],
          maxOutputTokens: 1300,
          abortSignal: AbortSignal.timeout(45_000),
          tools: { google_search: google.tools.googleSearch({}) },
          providerOptions: { gateway: { user: gatewayUser, tags: ['feature:education-tutor-public', 'external-verification'] } },
        } as any);
        const parsed: any = parseJson(String(result.text || ''));
        const found = sourceList((result as any).sources);
        if (parsed?.answer && parsed.web_verified === true && found.length) {
          final = { ...first, ...parsed };
          sources = found;
          mode = 'search';
        }
      } catch (error: any) {
        console.warn('public tutor search', error?.message || error);
      }
    }

    if (mode === 'primary' && shouldReview) {
      try {
        const result = await generateText({
          model: REVIEW_MODEL,
          system: 'Você é o revisor adversarial final. Resolva do zero e compare com a preliminar. Não exponha cadeia interna. Retorne JSON com answer, confidence, confidence_reason, self_check_passed, answerable, resolved_doubt, needs_better_image, uncertainty_reason, assumptions e agrees_with_preliminary.',
          messages: [{ role: 'user', content: hasImage ? [{ type: 'text', text: `Pergunta: ${latest}\nEnunciado: ${contextQuestion}\nPreliminar: ${trim(first.answer, 2200)}` }, { type: 'image', image: imageDataUrl }] : `Pergunta: ${latest}\nEnunciado: ${contextQuestion}\nPreliminar: ${trim(first.answer, 2200)}` }],
          maxOutputTokens: 1300,
          abortSignal: AbortSignal.timeout(45_000),
          providerOptions: { gateway: { models: ['openai/gpt-5.4-mini'], user: gatewayUser, tags: ['feature:education-tutor-public', 'adversarial-review'] } },
        } as any);
        const parsed: any = parseJson(String(result.text || ''));
        if (parsed?.answer) {
          final = { ...first, ...parsed };
          if (parsed.agrees_with_preliminary === false) {
            final.confidence = Math.min(clamp(parsed.confidence), 0.79);
            final.uncertainty_reason = parsed.uncertainty_reason || 'A revisão independente divergiu da primeira solução e a resposta foi corrigida.';
          }
          mode = 'review';
        }
      } catch (error: any) {
        console.warn('public tutor review', error?.message || error);
      }
    }

    let answer = trim(final.answer, 6000).trim();
    if (!answer) return json(res, 502, { error: 'A resposta ficou incompleta. Tente novamente.' });
    if (unexpectedScript(answer)) {
      const originalAnswer = answer;
      try {
        answer = trim((await generateText({
          model: REVIEW_MODEL,
          system: 'Reescreva em português do Brasil usando apenas alfabeto latino e matemática em texto simples, sem mudar fatos, números ou conclusão.',
          messages: [{ role: 'user', content: answer }],
          maxOutputTokens: 800,
          abortSignal: AbortSignal.timeout(25_000),
          providerOptions: { gateway: { models: ['anthropic/claude-fable-5', 'openai/gpt-5.4-mini'], ...(gatewayUser ? { user: gatewayUser } : {}), tags: ['feature:education-tutor-public', 'script-repair'] } },
        } as any)).text, 6000);
      } catch (error: any) {
        console.warn('public tutor script repair', String(error?.message || error).slice(0, 300));
      }
      if (!answer || unexpectedScript(answer)) answer = sanitizeUnexpectedScript(answer || originalAnswer);
      if (!answer) answer = 'Não consegui ler a resposta com segurança. Reenvie a foto com a questão centralizada e mais próxima.';
      final.confidence = Math.min(clamp(final.confidence), 0.79);
      final.uncertainty_reason = final.uncertainty_reason || 'A resposta original continha caracteres incompatíveis e foi normalizada automaticamente.';
    }

    const answerable = Boolean(final.answerable ?? true);
    const selfChecked = Boolean(final.self_check_passed);
    const resolvedDoubt = Boolean(final.resolved_doubt);
    const needsBetterImage = Boolean(final.needs_better_image);
    let confidence = clamp(final.confidence ?? first.confidence);
    if (!answerable || !selfChecked || !resolvedDoubt) confidence = Math.min(confidence, 0.79);
    if (needsBetterImage) confidence = Math.min(confidence, 0.55);

    let focus: any = final.learning_focus && typeof final.learning_focus === 'object' ? final.learning_focus : first.learning_focus;
    if (focus) {
      const matched = candidates.find(skill => skill.skill_code === String(focus.skill_code || '') && skill.skill_name === String(focus.skill_name || ''));
      if (!matched) focus = null;
      else {
        const parentCode = String(focus.plan_skill_code || matched.parent_skill_code || '');
        const parent = skills.find(skill => skill.skill_code === parentCode);
        focus = {
          area: matched.area,
          skill_code: matched.skill_code,
          skill_name: matched.skill_name,
          plan_skill_code: parent?.skill_code || null,
          plan_skill_name: parent?.skill_name || null,
          confidence: clamp(focus.confidence || confidence),
          reason: trim(focus.reason, 320),
          official_reference: Boolean(matched.official_reference),
        };
      }
    }

    const offerPlan = Boolean(userId) && Boolean(final.offer_plan ?? first.offer_plan) && Boolean(focus) && Number(focus?.confidence) >= 0.68 && resolvedDoubt;
    return json(res, 200, {
      answer,
      educational: true,
      publicAccess: true,
      resolvedDoubt,
      answerable,
      confidence,
      confidenceLabel: confidenceLabel(confidence),
      confidenceReason: trim(final.confidence_reason ?? first.confidence_reason, 300),
      uncertaintyReason: trim(final.uncertainty_reason ?? first.uncertainty_reason, 400) || null,
      assumptions: list(final.assumptions ?? first.assumptions, 4),
      selfChecked,
      learningFocus: focus,
      offerPlan,
      needsBetterImage,
      model: mode === 'search' ? SEARCH_MODEL : mode === 'review' ? REVIEW_MODEL : primaryModel,
      searchMode: mode,
      webVerified: mode === 'search' && sources.length > 0,
      sources,
      retrievalGrounded: examples.length > 0,
      retrievedExamples: examples.length,
      adminUnlimited: false,
      premiumUnlimited: false,
      dailyQuestionLimit: null,
      remainingQuestions: null,
    });
  } catch (error: any) {
    console.error('education-tutor-public failed', error);
    return json(res, 500, { error: 'A IA encontrou uma falha inesperada. Tente novamente.' });
  }
}
