import { readFileSync } from 'node:fs';
import { transpileModule, ModuleKind } from 'typescript';
import vm from 'node:vm';
import assert from 'node:assert/strict';

let source = readFileSync('api/interview-coach.ts', 'utf8')
  .replace(/import .*?;\n/g, '')
  .replace('export default async function handler', 'async function handler');

const calls = [];
let authServiceError = null;
let authConfig = null;

const linkScores = { ingles: null, coragem: 82, capacidadeTrabalho: 76, vontade: 84 };
const feedback = {
  summary: 'Bom exemplo; falta explicar melhor a decisão.',
  strength: 'Há uma ação própria identificável.',
  improvement: 'Falta mostrar o critério da decisão.',
  action: 'Refaça em 60 segundos.',
  detailed: [{
    criterion: 'Coragem',
    evidence: 'organizei',
    impact: 'A decisão ainda fica implícita.',
    how: 'Explique por que escolheu esse caminho.',
    example: 'Eu escolhi X porque...',
    exercise: 'Treine por 5 minutos e grave uma versão de 60 segundos.',
  }],
  structure: { opening: 'Vá direto ao contexto.', development: 'Mostre decisão e ação.', closing: 'Feche com aprendizado.' },
  scores: linkScores,
  coaching_scores: { clareza: 80, especificidade: 72, estrutura: 79, concisao: 75 },
};

function messageText(args) {
  const content = args.messages?.[0]?.content;
  if (typeof content === 'string') return content;
  return Array.isArray(content) ? content.filter(part => part?.type === 'text').map(part => part.text).join('\n') : '';
}

const context = {
  Buffer,
  Output: { json: () => ({ type: 'json' }) },
  URL,
  AbortSignal,
  Date,
  console,
  process: { env: {} },
  createClient: (url, key) => {
    authConfig = { url, key };
    return {
      auth: {
        getUser: async token => ({
          error: authServiceError,
          data: { user: !authServiceError && token === 'valid' ? { id: 'test', app_metadata: {} } : null },
        }),
      },
    };
  },
  fetch: async () => ({ headers: new Headers({ 'content-range': '0-0/0' }), ok: true }),
  generateText: async args => {
    calls.push(args);
    if (args.model.startsWith('google/')) {
      return {
        text: JSON.stringify({
          usable: true,
          transcript: 'Organizei uma equipe e aprendi a dividir responsabilidades.',
          speechObservations: [{ time: '00:10', evidence: 'ritmo estável', impact: 'fala compreensível' }],
          visualTemporalObservations: [{ time: '00:12', evidence: 'mãos entram no quadro', impact: 'gesto acompanha a fala' }],
          pace: 'Regular',
          pauses: 'Pausas curtas',
          fillers: 'Poucas repetições',
          articulation: 'Clara',
          intonation: 'Variada',
          posture: 'Estável',
          gestures: 'Moderados',
          gazeToCamera: 'Predominantemente direcionado à câmera',
          framing: 'Centralizado',
        }),
        response: { modelId: args.model },
      };
    }

    const text = messageText(args);
    const final = text.includes('consolide toda a entrevista');
    return {
      text: JSON.stringify({
        question: 'Tell me about a difficult decision you made.',
        feedback: {
          ...feedback,
          visual_feedback: text.includes('FRAME 1') ? {
            summary: 'Os frames mostram enquadramento consistente.',
            posture: 'Estável nos frames amostrados.',
            gestures: 'Gestos visíveis em alguns frames.',
            gaze: 'Direção aparente do rosto frequentemente voltada à câmera.',
            framing: 'Enquadramento central.',
            frame_findings: [{ time: '10s', evidence: 'rosto centralizado', impact: 'facilita leitura visual', how: 'mantenha o enquadramento' }],
            limitations: 'Frames são amostras, não vídeo contínuo.',
          } : undefined,
        },
        report: final ? {
          overall_score: 81,
          official_criteria: {
            ingles: { score: 78, evidence: 'Respondeu em inglês.', next_step: 'Treinar fluência.' },
            coragem: { score: 82, evidence: 'Defendeu uma posição.', next_step: 'Responder a objeções.' },
            capacidadeTrabalho: { score: 80, evidence: 'Trouxe entrega concreta.', next_step: 'Quantificar esforço quando houver dado real.' },
            vontade: { score: 85, evidence: 'Deu motivos específicos.', next_step: 'Conectar a mais uma experiência.' },
          },
          strongest_points: ['Ação própria'],
          priority_improvements: ['Critério de decisão'],
          pressure_questions: ['Por que eu deveria acreditar que essa decisão foi sua?', 'O que você faria se eu discordasse?', 'Que evidência prova sua disciplina?'],
          seven_day_plan: Array.from({ length: 7 }, (_, i) => 'Dia ' + (i + 1) + ': treinar 10 min'),
          final_tip: 'Use evidências específicas.',
        } : undefined,
      }),
      response: { modelId: args.model },
    };
  },
};

vm.createContext(context);
vm.runInContext(transpileModule(source + '\nglobalThis.handler = handler;', {
  compilerOptions: { module: ModuleKind.None, target: 9 },
}).outputText, context);

async function request(body, token = 'valid', method = 'POST') {
  const response = {
    statusCode: 0,
    body: null,
    setHeader() {},
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  await context.handler({ method, headers: { authorization: token ? 'Bearer ' + token : '' }, body }, response);
  return response;
}

const status = await request({}, '', 'GET');
assert.equal(status.body.voice, true);
assert.equal(status.body.videoFrames, true);
assert.equal(status.body.linkOfficialMinutes, 20);
assert.equal(JSON.stringify(status.body.linkOfficialCriteria), JSON.stringify(['ingles', 'coragem', 'capacidadeTrabalho', 'vontade']));

assert.equal((await request({}, '')).statusCode, 401);
assert.equal((await request({}, 'invalid')).statusCode, 401);
assert.equal((await request({ phase: 'answer', history: [] })).statusCode, 400);

context.process.env.SUPABASE_URL = 'https://xxxxxxxxxxxx.supabase.co';
await request({ phase: 'start' });
assert.equal(authConfig.url, 'https://kmognvgnfisdchzffkgh.supabase.co');
assert.ok(authConfig.key.startsWith('sb_publishable_'));

authServiceError = { name: 'AuthRetryableFetchError', status: 0 };
assert.equal((await request({ phase: 'start' })).statusCode, 503);
authServiceError = { name: 'AuthApiError', status: 401 };
assert.equal((await request({ phase: 'start' })).statusCode, 401);
authServiceError = null;
delete context.process.env.SUPABASE_URL;

const callsBeforeStart = calls.length;
const start = await request({ phase: 'start', interviewMode: 'official', candidateContext: { portfolio: 'Projeto de empreendedorismo.' } });
assert.equal(start.statusCode, 200);
assert.equal(start.body.questionNumber, 1);
assert.equal(start.body.language, 'pt');
assert.equal(start.body.competency, 'Vontade de estar aqui');
assert.equal(calls.length, callsBeforeStart);

const history = [{ question: 'Conte uma experiência', answer: 'Organizei uma equipe e aprendi a dividir responsabilidades.', language: 'pt' }];
const typed = await request({ phase: 'answer', totalQuestions: 1, interviewMode: 'activity', history });
assert.equal(typed.body.complete, true);
assert.equal(typed.body.report.sevenDayPlan.length, 7);
assert.equal(typed.body.report.pressureQuestions.length, 3);
assert.equal(typed.body.voice, null);
assert.equal(typed.body.feedback.scores.coragem, 82);

const twoTurns = [
  history[0],
  { question: 'Aprofunde seu portfólio', answer: 'Eu trabalhei semanalmente e entreguei o protótipo no prazo.', language: 'pt' },
];
const englishTurn = await request({ phase: 'answer', interviewMode: 'official', history: twoTurns, elapsedSeconds: 300 });
assert.equal(englishTurn.statusCode, 200);
assert.equal(englishTurn.body.language, 'en');
assert.equal(englishTurn.body.complete, false);

const audio = { data: Buffer.alloc(200).toString('base64'), duration: 20, mediaType: 'audio/webm' };
const spoken = await request({ phase: 'answer', interviewMode: 'quick', history, audio });
assert.equal(spoken.statusCode, 200);
assert.ok(spoken.body.voice.transcript.includes('Organizei'));
assert.equal(spoken.body.voice.framesAnalyzed, 0);

const frameData = Buffer.alloc(300).toString('base64');
const video = {
  data: Buffer.alloc(600).toString('base64'),
  duration: 45,
  mediaType: 'video/webm',
  frames: [
    { data: frameData, mediaType: 'image/jpeg', time: 4.5 },
    { data: frameData, mediaType: 'image/jpeg', time: 22.5 },
    { data: frameData, mediaType: 'image/jpeg', time: 40.5 },
  ],
};
const videoResult = await request({ phase: 'answer', interviewMode: 'quick', history, audio: video });
assert.equal(videoResult.statusCode, 200);
assert.equal(videoResult.body.voice.framesAnalyzed, 3);
assert.ok(videoResult.body.feedback.visual);
const lastAstraCall = [...calls].reverse().find(call => call.model === 'openai/gpt-6-astra');
assert.ok(Array.isArray(lastAstraCall.messages[0].content));
assert.equal(lastAstraCall.messages[0].content.filter(part => part.type === 'image').length, 3);
assert.equal(lastAstraCall.providerOptions.openai.reasoningEffort, 'high');
assert.equal(lastAstraCall.providerOptions.gateway.models, undefined);
assert.ok(lastAstraCall.system.includes('Respeito, Coragem, Responsabilidade e Simplicidade'));
assert.ok(lastAstraCall.system.includes('Postura, gestos, direção do olhar e enquadramento são coaching de comunicação, não critérios oficiais'));
assert.ok(lastAstraCall.output);

assert.equal((await request({ phase: 'answer', history, audio: { ...audio, duration: 181 } })).statusCode, 400);
assert.equal((await request({ phase: 'answer', history, audio: { ...video, duration: 91 } })).statusCode, 400);
assert.equal((await request({ phase: 'answer', history, audio: { ...audio, mediaType: 'text/html' } })).statusCode, 400);

const officialHistory = Array.from({ length: 6 }, (_, i) => ({
  question: 'Pergunta ' + (i + 1),
  answer: 'Resposta suficientemente longa e concreta número ' + (i + 1) + '.',
  language: i === 2 || i === 3 ? 'en' : 'pt',
}));
const timedFinal = await request({ phase: 'answer', interviewMode: 'official', history: officialHistory, elapsedSeconds: 1085 });
assert.equal(timedFinal.body.complete, true);
assert.equal(timedFinal.body.report.officialCriteria.ingles.score, 78);

const pageSource = readFileSync('src/components/InterviewCoachPage.tsx', 'utf8');
const recorderSource = readFileSync('src/components/InterviewRecorder.tsx', 'utf8');
assert.ok(pageSource.includes('if (showAuth) return'));
assert.ok(!pageSource.includes('if (showAuth || !user || !session) return'));
assert.ok(pageSource.includes('A Link publica os critérios e seus pesos, mas não uma escala oficial de 0 a 100'));
assert.ok(pageSource.includes('não atribui índice ao critério oficial de Inglês'));
assert.ok(recorderSource.includes('Prévia ao vivo da câmera'));
assert.ok(!pageSource.includes('Feedback Astra'));
assert.ok(!recorderSource.includes('O Astra cruza'));

console.log('PASS: Link 2027.1 rubric, timed official mode, English segment, Portfolio context, Astra-only final reasoning, evidence-gated scoring, public reviewer landing, live video preview and multi-frame visual review.');
