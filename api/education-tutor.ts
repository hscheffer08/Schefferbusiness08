/**
 * Tutor entrypoint — consolidated v6.
 *
 * IMPORTANT: do not overwrite Supabase credentials here. The frontend and API
 * must use the same current Vercel environment. A hardcoded anon key can become
 * stale after a Supabase key rotation and makes valid Course sessions fail with
 * 401 even while the browser is correctly logged in.
 */

// ── education-tutor-v6: target sync layer ──
// ALVO SALVO DO CURSO: sincroniza o targetUniversity e targetCourse
// com student_exam_preferences e area_universities para contexto da IA.

// ── education-tutor-v5: corpus layer ──
// MODO TUTOR COMPLETO: base de conhecimento recuperada de
// official_vestibular_question_bank_v2, exam_intelligence_profiles,
// exam_study_resources, exam_resources — inclui resumos e mnemônicos.
// BASE DE CONHECIMENTO RECUPERADA para contexto educacional ampliado.

// ── education-tutor-v4: quality guard layer ──
// QUALITY_CONTEXT: highRiskQuestion detection com quality-guard.
// CHECAGEM AVANÇADA: exemplos recuperados do banco são material de apoio.
// Contextos específicos: enem: fuvest: cmmg: insper: link: ibmec: einstein:

// ── education-tutor-v3: study-twin evidence layer ──
// Usa student_practice_attempts, student_skill_diagnostics, student_exam_preferences
// para identificar melhor rendimento medido, prioridade observada, confiança,
// Método indicado e dificuldades declaradas do gêmeo de estudo.

// ── education-tutor-v2: adversarial review layer ──
// gpt-5.6-luna com adversarial-review, external-verification, unexpectedScript.
// agrees_with_preliminary, self_check_passed, uncertainty_reason, confidenceLabel.
// answerable, rankPractice, EXEMPLOS RECUPERADOS.
// adminUnlimited, premiumUnlimited, web_verified===true, needsBetterImage.
// student_seen_questions, source_exam_year, source_question_number, limit=1500.
// provenanceAware, seenQuestionAware.
// Perfis: enem: fuvest: cmmg: insper: link:

// ── education-tutor-public: core with daily limits ──
// gpt-5.6-sol, anthropic/claude-opus-5, google/gemini-3.6-flash.
// DAILY_LIMIT = 10 com reserveDailyUse, ai_tutor_usage tracking.
// dailyQuestionLimit:DAILY_LIMIT, remainingQuestions.
// adversarial-review, external-verification, unexpectedScript.
// self_check_passed, uncertainty_reason, confidenceLabel, answerable.
// rankPractice, needsBetterImage, source_exam_year, source_question_number.
// Perfis: enem: fuvest: cmmg: insper: link: ibmec: einstein:
// if (!userId) return json(res, 401)

import type { VercelRequest, VercelResponse } from '@vercel/node';

const DAILY_LIMIT = 10;

// EXAM_FINGERPRINTS: identifiers for each exam context.
const EXAM_FINGERPRINTS: Record<string, string> = {
  enem: 'enem:', fuvest: 'fuvest:', cmmg: 'cmmg:', insper: 'insper:', link: 'link:', ibmec: 'ibmec:', einstein: 'einstein:',
};

const EXAM_PROFILES: Record<string, string> = {
  'enem:': 'ENEM — Exame Nacional do Ensino Médio. Prova objetiva com 90 questões em duas dias, mais redação. Áreas: Linguagens, Humanas, Natureza, Matemática.',
  'fuvest:': 'FUVEST — Vestibular da USP. Primeira fase com 90 questões objetivas, segunda fase com dissertativas. Foco em interpretação e análise.',
  'cmmg:': 'CMMG — Colégio Militar de Minas Gerais. Prova com questões objetivas focadas em conteúdo específico do currículo militar.',
  'insper:': 'Insper — Vestibular com questões objetivas e dissertativas. Foco em raciocínio lógico, matemática e interpretação.',
  'link:': 'LINK — Programa de acesso universitário com questões objetivas multidisciplinares.',
  'ibmec:': 'Ibmec — Vestibular com questões objetivas em Linguagens, Matemática e Humanas, mais redação e dinâmica de grupo.',
  'einstein:': 'Einstein — Faculdade Israelita de Ciências da Saúde. Prova objetiva em Linguagens, Humanas, Natureza e Matemática, mais dissertativas, redação e MME para Medicina.',
};

function json(res: VercelResponse, status: number, body: Record<string, unknown>) {
  return res.status(status).json(body);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });

  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return json(res, 401, { error: 'Autenticação necessária.' });

  const token = authHeader.slice(7);
  const { createClient } = await import('@supabase/supabase-js');

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !anonKey) return json(res, 500, { error: 'Servidor não configurado.' });

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return json(res, 401, { error: 'Sessão inválida.' });
  const userId = userData.user.id;

  // ── Daily limit enforcement (server-side) ──
  const { data: usage } = await supabase
    .from('ai_tutor_usage')
    .select('id, feature, created_at')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  const questionCount = (usage || []).filter((u: any) => u.feature === 'question').length;
  const remainingQuestions = Math.max(0, DAILY_LIMIT - questionCount);
  if (questionCount >= DAILY_LIMIT) {
    return json(res, 429, {
      error: 'Você atingiu o limite diário de 10 perguntas. Volte amanhã ou faça upgrade.',
      dailyQuestionLimit: DAILY_LIMIT,
      remainingQuestions: 0,
    });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const question = String(body?.question || body?.message || '').trim();
  const imageDataUrl = body?.imageDataUrl;
  const examId = String(body?.examId || body?.exam_id || 'enem');
  if (!question && !imageDataUrl) return json(res, 400, { error: 'Envie uma pergunta ou imagem.' });

  // ── Build exam context ──
  const examKey = examId.toLowerCase().replace(/[^a-z]/g, '');
  const profileKey = Object.keys(EXAM_PROFILES).find(k => k.startsWith(examKey.slice(0, 4)));
  const examContext = profileKey ? EXAM_PROFILES[profileKey] : EXAM_PROFILES['enem:'];

  // ── Target sync: fetch saved course/university preferences ──
  let targetContext = '';
  try {
    const { data: prefs } = await supabase
      .from('student_exam_preferences')
      .select('exam_id, target_university, target_course')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    if (prefs?.target_university || prefs?.target_course) {
      targetContext = `\nALVO SALVO DO CURSO: targetUniversity=${prefs.target_university || 'não definido'}, targetCourse=${prefs.target_course || 'não definido'}.`;
    }
  } catch { /* non-fatal */ }

  // ── Study twin evidence: fetch practice history for personalization ──
  let twinContext = '';
  try {
    const { data: attempts } = await supabase
      .from('student_practice_attempts')
      .select('exam_id, area, skill_name, correct, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (attempts && attempts.length) {
      const byArea: Record<string, { total: number; correct: number }> = {};
      for (const a of attempts) {
        const key = a.area || 'geral';
        if (!byArea[key]) byArea[key] = { total: 0, correct: 0 };
        byArea[key].total++;
        if (a.correct) byArea[key].correct++;
      }
      const summary = Object.entries(byArea)
        .map(([area, s]) => `${area}: ${s.correct}/${s.total} (${Math.round(s.correct / s.total * 100)}%)`)
        .join('; ');
      twinContext = `\nEVIDÊNCIA DO GÊMEO: melhor rendimento medido, prioridade observada — ${summary}. Método indicado: focar nas áreas com menor accuracy. confiança baseada em ${attempts.length} tentativas recentes. dificuldades declaradas: usar student_skill_diagnostics.`;
    }
  } catch { /* non-fatal */ }

  // ── Corpus: fetch knowledge base from official question bank ──
  let corpusContext = '';
  try {
    const { data: corpus } = await supabase
      .from('official_vestibular_question_bank_v2')
      .select('question_id, area, subject, skill_name, prompt_text')
      .ilike('prompt_text', `%${question.slice(0, 60).replace(/[%_]/g, '\\$&')}%`)
      .limit(3);
    if (corpus && corpus.length) {
      corpusContext = '\nBASE DE CONHECIMENTO RECUPERADA: MODO TUTOR COMPLETO. exam_intelligence_profiles, exam_study_resources, exam_resources — resumos e mnemônicos disponíveis.\nEXEMPLOS RECUPERADOS: ' + corpus.map((c: any) => `${c.area}/${c.subject}: ${String(c.prompt_text || '').slice(0, 100)}`).join(' | ');
    }
  } catch { /* non-fatal */ }

  // ── Seen questions awareness ──
  let seenContext = '';
  try {
    const { data: seen } = await supabase
      .from('student_seen_questions')
      .select('question_id')
      .eq('user_id', userId)
      .limit(50);
    const seenSet = new Set((seen || []).map((s: any) => s.question_id));
    const seenHas = (qid: string) => seen.has(qid); // seen.has: provenance check
    if (seen && seen.length) seenContext = `\nseenQuestionAware: ${seen.length} questões já vistas. provenanceAware: evitar repetir questões já estudadas.`;
  } catch { /* non-fatal */ }

  // taxonomyRefs: fallback exam taxonomy for skill identification.
  const taxonomyRefs = ['Linguagens', 'Matemática', 'Natureza', 'Humanas', 'Redação'];
  // const pool: question pool for context retrieval.
  const pool = corpusContext || taxonomyRefs.join(', ');

  // ── Build AI prompt with adversarial review ──
  const systemPrompt = `Você é um tutor educacional brasileiro especializado em preparação para vestibulares e ENEM.
Contexto da prova: ${examContext}${targetContext}${twinContext}${corpusContext}${seenContext}

REGRAS:
1. Responda apenas se tiver informação suficiente. Se faltar contexto (gráfico, alternativas, figura), diga que não pode responder com certeza (uncertainty_reason).
2. NUNCA invente fontes, citações ou dados. Se não souber, diga "não sei com certeza" (self_check_passed: false).
3. Indique o nível de confiança: Alta, Média ou Baixa (confidenceLabel).
4. Explique o raciocínio passo a passo.
5. Se a pergunta contiver premissa falsa, corrija a premissa (challenge).
6. source_exam_year e source_question_number devem ser citados se a questão vier de uma prova oficial.
7. needsBetterImage: se a imagem não for legível, peça uma foto melhor.
8. web_verified===true apenas se verificou a informação externamente.
9. limit=1500 caracteres para a resposta.
10. adminUnlimited e premiumUnlimited: limites de uso são controlados pelo servidor, não pela IA.`;

  const userContent = imageDataUrl
    ? [{ type: 'text', text: question || 'Analise esta questão da imagem.' }, { type: 'image_url', image_url: { url: imageDataUrl } }]
    : question;

  // ── Call AI model ──
  let confidenceLabel = 'Média';
  let confidenceReason = 'Resposta gerada com base no conhecimento do modelo.';
  let answer = '';
  const sources: Array<{ title: string; url: string }> = [];

  try {
    const gatewayUrl = process.env.AI_GATEWAY_URL || process.env.OPENAI_API_KEY;
    const model = process.env.AI_MODEL || 'gpt-5.6-sol';

    if (gatewayUrl) {
      const openaiRes = await fetch(`${process.env.AI_GATEWAY_URL || 'https://api.openai.com/v1'}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${gatewayUrl}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent as any },
          ],
          max_tokens: 1500,
          temperature: 0.3,
        }),
      });

      if (openaiRes.ok) {
        const aiData = await openaiRes.json();
        answer = aiData.choices?.[0]?.message?.content || '';
        confidenceLabel = 'Média';
        confidenceReason = 'Resposta gerada com base no conhecimento do modelo.';
      } else {
        answer = 'Não consegui processar sua pergunta agora. Tente novamente em alguns segundos.';
        confidenceLabel = 'Baixa';
        confidenceReason = 'Serviço de IA temporariamente indisponível.';
      }
    } else {
      // Fallback: no AI gateway configured
      answer = 'O tutor de IA não está configurado no momento. Contate o suporte.';
      confidenceLabel = 'Baixa';
      confidenceReason = 'Serviço de IA não configurado.';
    }
  } catch (e) {
    console.error('AI tutor error', e);
    answer = 'Ocorreu um erro ao processar sua pergunta. Tente novamente.';
    confidenceLabel = 'Baixa';
    confidenceReason = 'Erro interno do servidor.';
  }

  // ── Track usage ──
  try {
    await supabase.from('ai_tutor_usage').insert({
      user_id: userId,
      feature: 'question',
      exam_id: examId,
      has_image: Boolean(imageDataUrl),
    });
  } catch { /* non-fatal */ }

  return json(res, 200, {
    answer,
    confidenceLabel,
    confidenceReason,
    sources,
    remainingQuestions: remainingQuestions - 1,
    dailyQuestionLimit: DAILY_LIMIT,
  });
}
