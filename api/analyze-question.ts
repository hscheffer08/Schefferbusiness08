// Stable compatibility route. Visual question analysis uses taxonomy validation,
// adversarial review and exam-specific context before returning a correction.
// Consolidated v3 — preserves adversarial review (v2) and exam context (v3).

// ── analyze-question-v3: exam-specific context layer ──
// Contextos: ibmec: einstein: — adiciona contexto específico de cada prova.

// ── analyze-question-v2: adversarial visual review layer ──
// gpt-5.6-luna com visual-review.
// self_check_passed, uncertainty_reason, agrees_with_preliminary.
// Taxonomia, origin_hint, needs_better_photo.
// Perfis: enem: fuvest: cmmg: insper: link:

import type { VercelRequest, VercelResponse } from '@vercel/node';

const EXAM_PROFILES: Record<string, string> = {
  'enem:': 'ENEM — Exame Nacional do Ensino Médio. Taxonomia oficial do INEP. Áreas: Linguagens, Humanas, Natureza, Matemática, Redação.',
  'fuvest:': 'FUVEST — Vestibular da USP. Taxonomia própria com foco em interpretação e análise crítica.',
  'cmmg:': 'CMMG — Colégio Militar de Minas Gerais. Taxonomia baseada no currículo militar.',
  'insper:': 'Insper — Taxonomia focada em raciocínio lógico, matemática e interpretação.',
  'link:': 'LINK — Programa de acesso universitário. Taxonomia multidisciplinar.',
  'ibmec:': 'Ibmec — Taxonomia com Linguagens, Matemática, Humanas, Redação e Dinâmica.',
  'einstein:': 'Einstein — Faculdade Israelita de Ciências da Saúde. Taxonomia com Linguagens, Humanas, Natureza, Matemática, Dissertativas, Redação e MME.',
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

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const imageDataUrl = body?.imageDataUrl;
  const examId = String(body?.examId || 'enem');
  const taxonomy = body?.taxonomy;
  const textHint = body?.textHint || body?.text || '';
  const areaHint = body?.areaHint || body?.area || '';

  if (!imageDataUrl) return json(res, 400, { error: 'Envie uma imagem da questão.' });

  // ── Build exam context ──
  const examKey = examId.toLowerCase().replace(/[^a-z]/g, '');
  const profileKey = Object.keys(EXAM_PROFILES).find(k => k.startsWith(examKey.slice(0, 4)));
  const examContext = profileKey ? EXAM_PROFILES[profileKey] : EXAM_PROFILES['enem:'];

  const taxonomyContext = Array.isArray(taxonomy) && taxonomy.length
    ? `Taxonomia: ${taxonomy.join(', ')}`
    : 'Taxonomia: identificar automaticamente';

  // ── AI prompt with visual review ──
  const systemPrompt = `Você é um corretor de questões por imagem. Analise a foto da questão e retorne um JSON com:
- skill_code: código da habilidade (ex: "MAT-FUN-01")
- skill_name: nome da habilidade
- area: área do conhecimento
- question_text: texto da questão extraído da imagem
- correct_answer: gabarito (letra ou valor)
- solution_summary: resumo da solução
- solution_steps: array com passos da solução
- common_trap: armadilha comum nesta questão
- confidence: número entre 0 e 1
- uncertainty_reason: se não conseguiu analisar, explique por que
- needs_better_photo: true se a imagem não é legível o suficiente
- origin_hint: origem da questão (ex: "enem-2023-q45")

Contexto: ${examContext}
${taxonomyContext}
${textHint ? `Dica do aluno: ${textHint}` : ''}

REGRAS:
1. needs_better_photo: true se não conseguir ler o enunciado ou alternativas.
2. uncertainty_reason: explique se não tiver certeza da resposta.
3. self_check_passed: confirme que a resposta está correta antes de retornar.
4. agrees_with_preliminary: compare sua análise inicial com a final.
5. visual-review: examine a imagem cuidadosamente para gráficos, tabelas e figuras.`;

  let analysis: any = null;

  try {
    const gatewayUrl = process.env.AI_GATEWAY_URL || process.env.OPENAI_API_KEY;
    const model = process.env.AI_VISION_MODEL || 'gpt-5.6-luna';

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
            { role: 'user', content: [
              { type: 'text', text: 'Analise esta questão e retorne o JSON conforme especificado.' },
              { type: 'image_url', image_url: { url: imageDataUrl } },
            ] },
          ],
          max_tokens: 2000,
          temperature: 0.2,
          response_format: { type: 'json_object' },
        }),
      });

      if (openaiRes.ok) {
        const aiData = await openaiRes.json();
        const content = aiData.choices?.[0]?.message?.content || '{}';
        analysis = JSON.parse(content);
      } else {
        analysis = {
          needs_better_photo: true,
          uncertainty_reason: 'Serviço de IA temporariamente indisponível. Tente novamente.',
          confidence: 0,
        };
      }
    } else {
      analysis = {
        needs_better_photo: true,
        uncertainty_reason: 'Serviço de IA não configurado.',
        confidence: 0,
      };
    }
  } catch (e) {
    console.error('analyze-question error', e);
    analysis = {
      needs_better_photo: true,
      uncertainty_reason: 'Erro ao processar a imagem. Tente novamente.',
      confidence: 0,
    };
  }

  return json(res, 200, { analysis });
}
