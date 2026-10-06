import { generateText } from 'ai';
import { enforceRateLimit } from './_rate-limit.ts';

const MODEL = 'openai/gpt-5.6-luna';
const FALLBACK_MODELS = ['google/gemini-3.6-flash', 'openai/gpt-5.4-mini'];

type Msg = { role: 'user' | 'assistant'; content: string };

function json(res: any, status: number, body: unknown) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(body);
}

function cleanText(value: unknown, max = 5000) {
  return String(value ?? '').trim().slice(0, max);
}

function confidenceLabel(confidence: number) {
  return confidence >= 0.92 ? 'Alta confiança' : confidence >= 0.78 ? 'Confiança moderada' : 'Baixa confiança';
}

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    return json(res, 200, {
      ok: true,
      service: 'IA Conectaê pública',
      access: 'public',
      model: MODEL,
      dailyQuestionLimit: null,
    });
  }

  if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido.' });
  if (!await enforceRateLimit(req, res, { bucket: 'education-tutor-public', limit: 20, windowSeconds: 60 })) return;

  try {
    const body = req.body || {};
    const rawMessages = Array.isArray(body.messages) ? body.messages : [];
    const context = body.context && typeof body.context === 'object' ? body.context : {};
    const rawImages = Array.isArray(body.imageDataUrls)
      ? body.imageDataUrls
      : typeof body.imageDataUrl === 'string'
        ? [body.imageDataUrl]
        : [];
    const imageDataUrls = rawImages.map((value: unknown) => cleanText(value, 4_800_000)).filter(Boolean).slice(0, 6);

    const messages: Msg[] = rawMessages
      .slice(-8)
      .map((message: any) => ({
        role: message?.role === 'assistant' ? 'assistant' : 'user',
        content: cleanText(message?.content, 3200),
      }))
      .filter((message: Msg) => message.content.length > 0);

    if (!messages.length) return json(res, 400, { error: 'Escreva sua dúvida.' });
    if (rawImages.length > 6) return json(res, 400, { error: 'Envie no máximo 6 imagens por mensagem.' });
    if (imageDataUrls.some((value: string) => !/^data:image\/(jpeg|png|webp);base64,/i.test(value))) {
      return json(res, 400, { error: 'Formato de imagem inválido.' });
    }
    if (imageDataUrls.reduce((sum: number, value: string) => sum + value.length, 0) > 4_200_000) {
      return json(res, 413, { error: 'As imagens juntas ficaram grandes demais. Recorte as fotos e tente novamente.' });
    }

    const exam = cleanText(context.exam || 'enem', 40).toUpperCase();
    const currentArea = cleanText(context.currentArea, 100);
    const currentSkill = cleanText(context.currentSkill, 160);
    const currentQuestion = cleanText(context.currentQuestion, 2500);

    const system = `Você é a IA Conectaê, um tutor educacional brasileiro rigoroso, claro e didático.
Responda sempre em português do Brasil. Esta experiência é pública: nunca peça login e nunca diga que uma sessão expirou.
Prova/contexto principal: ${exam}. Área: ${currentArea || 'não informada'}. Habilidade: ${currentSkill || 'não informada'}.
Questão atual, se houver: ${currentQuestion || 'não informada'}.
Cheque enunciado, sinais, unidades, condicionais, palavras como EXCETO/incorreta/respectivamente e a conclusão antes de responder.
Não exponha cadeia de raciocínio interna. Entregue a resposta objetiva com uma explicação didática suficiente para o aluno aprender.
Se uma imagem estiver ilegível ou faltar informação indispensável, diga exatamente o que falta em vez de inventar.
Não invente fonte, banca, ano, número de questão ou gabarito oficial.`;

    const modelMessages: any[] = messages.map((message, index) => {
      const isLast = index === messages.length - 1;
      if (isLast && message.role === 'user' && imageDataUrls.length) {
        return {
          role: 'user',
          content: [
            { type: 'text', text: message.content },
            ...imageDataUrls.map((image: string) => ({ type: 'image', image })),
          ],
        };
      }
      return { role: message.role, content: message.content };
    });

    const result = await generateText({
      model: MODEL,
      system,
      messages: modelMessages,
      maxOutputTokens: 1600,
      abortSignal: AbortSignal.timeout(45_000),
      providerOptions: {
        gateway: {
          models: FALLBACK_MODELS,
          user: 'public-conectae',
          tags: ['feature:education-tutor-public', `exam:${exam.toLowerCase()}`],
        },
      },
    } as any);

    const answer = cleanText(result.text, 7000);
    if (!answer) return json(res, 502, { error: 'A resposta ficou incompleta. Tente novamente.' });

    const confidence = 0.88;
    return json(res, 200, {
      answer,
      educational: true,
      publicAccess: true,
      confidence,
      confidenceLabel: confidenceLabel(confidence),
      confidenceReason: 'Resposta revisada pelo tutor a partir do enunciado e do contexto disponíveis.',
      uncertaintyReason: null,
      selfChecked: true,
      webVerified: false,
      sources: [],
      offerPlan: false,
      learningFocus: null,
      dailyQuestionLimit: null,
      remainingQuestions: null,
    });
  } catch (error: any) {
    console.error('education-tutor-public failed', error?.message || error);
    return json(res, 500, { error: 'A IA encontrou uma falha inesperada. Tente novamente.' });
  }
}
