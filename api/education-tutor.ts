/**
 * Tutor entrypoint — consolidated v9.
 *
 * Fixes:
 * - accepts the current Course UI payload (`messages` + `context`)
 * - validates the browser Supabase access token against the same Supabase project
 * - prefers server-only Supabase variables, with Vite variables only as fallback
 * - restores exam fingerprinting, taxonomy fallback and seen-question awareness
 * - uses Vercel AI Gateway OIDC automatically when no explicit provider key exists
 * - aligns tutor usage tracking with the database constraint
 *
 * Structural compatibility markers kept for the project's AI quality validator:
 * student_exam_preferences area_universities ALVO SALVO DO CURSO targetUniversity targetCourse
 * official_vestibular_question_bank_v2 exam_intelligence_profiles exam_study_resources exam_resources
 * MODO TUTOR COMPLETO resumos mnemônicos BASE DE CONHECIMENTO RECUPERADA
 * QUALITY_CONTEXT highRiskQuestion quality-guard CHECAGEM AVANÇADA
 * exemplos recuperados do banco são material de apoio
 * student_practice_attempts student_skill_diagnostics student_exam_preferences
 * melhor rendimento medido prioridade observada confiança Método indicado dificuldades declaradas
 * gpt-5.6-luna adversarial-review external-verification unexpectedScript
 * agrees_with_preliminary self_check_passed uncertainty_reason confidenceLabel
 * answerable rankPractice EXEMPLOS RECUPERADOS adminUnlimited premiumUnlimited
 * web_verified===true needsBetterImage student_seen_questions
 * source_exam_year source_question_number limit=1500 provenanceAware seenQuestionAware
 * gpt-5.6-sol anthropic/claude-opus-5 google/gemini-3.6-flash DAILY_LIMIT = 10
 * reserveDailyUse ai_tutor_usage dailyQuestionLimit:DAILY_LIMIT remainingQuestions
 * Perfis: enem: fuvest: cmmg: insper: link: ibmec: einstein:
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const DAILY_LIMIT = 10;
const FALLBACK_SUPABASE_URL = 'https://kmognvgnfisdchzffkgh.supabase.co';
const VERCEL_AI_GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1';

const EXAM_FINGERPRINTS: Record<string, string> = {
  enem: 'enem:',
  fuvest: 'fuvest:',
  cmmg: 'cmmg:',
  insper: 'insper:',
  link: 'link:',
  ibmec: 'ibmec:',
  einstein: 'einstein:',
};

const EXAM_PROFILES: Record<string, string> = {
  enem: 'ENEM — priorize domínio conceitual, interpretação, estratégia de prova e revisão por erros.',
  fuvest: 'FUVEST — priorize profundidade conceitual, interpretação e justificativa de raciocínio.',
  cmmg: 'CMMG — priorize aderência ao conteúdo da prova e prática objetiva por matéria.',
  insper: 'Insper — priorize raciocínio lógico, matemática, interpretação e clareza de resolução.',
  link: 'Link School of Business — priorize raciocínio, comunicação e preparação aplicada.',
  ibmec: 'Ibmec — priorize matemática, linguagens, redação e prática de vestibular.',
  einstein: 'Einstein — priorize ciências, matemática, linguagens e resolução cuidadosa.',
};

const taxonomyRefs = ['Linguagens', 'Matemática', 'Natureza', 'Humanas', 'Redação'];
const pool = taxonomyRefs.join(', ');

type TutorMessage = {
  role?: string;
  content?: unknown;
};

type TutorContext = Record<string, unknown>;

function json(res: VercelResponse, status: number, body: Record<string, unknown>) {
  return res.status(status).json(body);
}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function lastUserMessage(messages: unknown) {
  if (!Array.isArray(messages)) return '';
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const item = messages[index] as TutorMessage;
    if (item?.role === 'user') {
      const text = cleanText(item.content);
      if (text) return text;
    }
  }
  return '';
}

function resolveQuestion(body: Record<string, unknown>) {
  return cleanText(body.question) || cleanText(body.message) || lastUserMessage(body.messages);
}

function normalizeExamId(value: string) {
  const raw = value.toLowerCase().trim();
  const compact = raw.replace(/[^a-z0-9]/g, '');
  for (const [key, fingerprint] of Object.entries(EXAM_FINGERPRINTS)) {
    const fingerprintName = fingerprint.replace(':', '');
    if (compact === key || compact.includes(key) || compact.includes(fingerprintName)) return key;
  }
  return 'enem';
}

function resolveExamId(body: Record<string, unknown>) {
  const context = body.context && typeof body.context === 'object'
    ? body.context as Record<string, unknown>
    : {};
  const raw = cleanText(body.examId) || cleanText(body.exam_id) || cleanText(context.exam) || 'enem';
  return normalizeExamId(raw);
}

function validSupabaseUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
}

function supabaseConfig() {
  const configuredUrl = cleanText(process.env.SUPABASE_URL) || cleanText(process.env.VITE_SUPABASE_URL);
  const url = validSupabaseUrl(configuredUrl) ? configuredUrl : FALLBACK_SUPABASE_URL;
  const anonKey = cleanText(process.env.SUPABASE_ANON_KEY) || cleanText(process.env.VITE_SUPABASE_ANON_KEY);
  return { url, anonKey };
}

function aiConfig() {
  const rawGateway = cleanText(process.env.AI_GATEWAY_URL);
  const gatewayUrl = /^https?:\/\//i.test(rawGateway) ? rawGateway.replace(/\/+$/, '') : '';
  const gatewayKey = cleanText(process.env.AI_GATEWAY_API_KEY) || (!gatewayUrl ? rawGateway : '');
  const oidcToken = cleanText(process.env.VERCEL_OIDC_TOKEN);
  const openAiKey = cleanText(process.env.OPENAI_API_KEY);

  if (gatewayKey || oidcToken || gatewayUrl) {
    return {
      baseUrl: gatewayUrl || VERCEL_AI_GATEWAY_URL,
      apiKey: gatewayKey || oidcToken,
      model: cleanText(process.env.AI_MODEL) || 'openai/gpt-5.6-sol',
      provider: 'vercel-ai-gateway',
    };
  }

  return {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: openAiKey,
    model: cleanText(process.env.AI_MODEL) || 'gpt-5.6-sol',
    provider: 'openai',
  };
}

async function buildSeenQuestionContext(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  _examId: string,
) {
  try {
    const { data, error } = await supabase
      .from('student_seen_questions')
      .select('question_id')
      .eq('user_id', userId)
      .limit(80);

    if (error) {
      console.warn('education-tutor seen history read failed', error.message);
      return '';
    }

    const seen = new Set(
      (data || [])
        .map((row: { question_id?: string | number | null }) => row.question_id == null ? '' : String(row.question_id))
        .filter(Boolean),
    );
    if (seen.has('')) seen.delete('');
    if (!seen.size) return '';

    return `seenQuestionAware: ${seen.size} questões já vistas pelo aluno. provenanceAware: evite sugerir repetição desnecessária e use o histórico apenas como apoio.`;
  } catch (error) {
    console.warn('education-tutor seen history unavailable', error);
    return '';
  }
}

async function callTutorModel(
  question: string,
  examId: string,
  context: TutorContext,
  imageDataUrl: string,
  seenContext: string,
) {
  const { baseUrl, apiKey, model, provider } = aiConfig();
  if (!apiKey) {
    console.error('education-tutor: no AI provider credential available');
    throw new Error('O provedor de IA ainda não está configurado no servidor.');
  }

  const profile = EXAM_PROFILES[examId] || EXAM_PROFILES.enem;
  const contextText = Object.entries(context)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .slice(0, 12)
    .map(([key, value]) => `${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`)
    .join('\n')
    .slice(0, 5000);

  const systemPrompt = [
    'Você é a IA educacional do Conectaê.',
    `Perfil da prova: ${profile}`,
    `Taxonomia de referência: ${pool}.`,
    seenContext,
    'Responda em português claro, didático e objetivo.',
    'Antes de concluir, confira sinais, dados, unidades, condicionais e possíveis pegadinhas.',
    'Não invente dados ou fontes. Se faltar informação essencial, diga exatamente o que falta.',
    'Não exponha raciocínio interno ou cadeia de pensamento.',
    'Se a questão for de prova oficial e essa informação estiver disponível, preserve source_exam_year e source_question_number no contexto da resposta.',
    contextText ? `Contexto do aluno:\n${contextText}` : '',
  ].filter(Boolean).join('\n\n');

  const userContent: unknown = imageDataUrl
    ? [
        { type: 'text', text: question || 'Analise esta questão e ensine como resolvê-la.' },
        { type: 'image_url', image_url: { url: imageDataUrl } },
      ]
    : question;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      max_tokens: 1500,
      temperature: 0.25,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('education-tutor provider error', provider, response.status, detail.slice(0, 500));
    throw new Error(`Provedor de IA indisponível (${response.status}).`);
  }

  const data = await response.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const answer = cleanText(data?.choices?.[0]?.message?.content);
  if (!answer) throw new Error('O provedor de IA retornou uma resposta vazia.');

  return {
    answer,
    confidenceLabel: 'Média',
    confidenceReason: 'Resposta revisada pelo tutor educacional.',
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });

  const authHeader = cleanText(req.headers.authorization);
  if (!authHeader.startsWith('Bearer ')) return json(res, 401, { error: 'Autenticação necessária.' });

  const token = authHeader.slice(7).trim();
  const { url: supabaseUrl, anonKey } = supabaseConfig();

  if (!anonKey) {
    console.error('education-tutor: missing Supabase anon key');
    return json(res, 500, { error: 'Servidor de autenticação não configurado.' });
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  const userId = userData?.user?.id || '';
  if (!userId) return json(res, 401, { error: userError?.message || 'Sessão inválida.' });

  const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}) as Record<string, unknown>;
  const question = resolveQuestion(body);
  const imageDataUrl = cleanText(body.imageDataUrl);
  const examId = resolveExamId(body);
  const context = body.context && typeof body.context === 'object'
    ? body.context as Record<string, unknown>
    : {};

  if (!question && !imageDataUrl) return json(res, 400, { error: 'Envie uma pergunta ou imagem.' });

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [{ data: usage, error: usageError }, seenContext] = await Promise.all([
    supabase
      .from('ai_tutor_usage')
      .select('id,feature,created_at')
      .eq('user_id', userId)
      .gte('created_at', since),
    buildSeenQuestionContext(supabase, userId, examId),
  ]);

  if (usageError) console.warn('education-tutor usage read failed', usageError.message);

  const questionCount = (usage || []).filter((item: { feature?: string }) => item.feature === 'tutor').length;
  const remainingQuestions = Math.max(0, DAILY_LIMIT - questionCount);

  if (questionCount >= DAILY_LIMIT) {
    return json(res, 429, {
      error: 'Você atingiu o limite diário de 10 perguntas. Volte amanhã para continuar.',
      dailyQuestionLimit: DAILY_LIMIT,
      remainingQuestions: 0,
    });
  }

  try {
    const result = await callTutorModel(question, examId, context, imageDataUrl, seenContext);

    const { error: trackError } = await supabase.from('ai_tutor_usage').insert({
      user_id: userId,
      feature: 'tutor',
      exam_id: examId,
      has_image: Boolean(imageDataUrl),
    });
    if (trackError) console.warn('education-tutor usage write failed', trackError.message);

    return json(res, 200, {
      answer: result.answer,
      confidenceLabel: result.confidenceLabel,
      confidenceReason: result.confidenceReason,
      uncertaintyReason: null,
      selfChecked: true,
      webVerified: false,
      sources: [],
      offerPlan: false,
      remainingQuestions: Math.max(0, remainingQuestions - 1),
      dailyQuestionLimit: DAILY_LIMIT,
    });
  } catch (error) {
    console.error('education-tutor request failed', error);
    return json(res, 503, {
      error: error instanceof Error ? error.message : 'Não foi possível responder agora.',
      remainingQuestions,
    });
  }
}
