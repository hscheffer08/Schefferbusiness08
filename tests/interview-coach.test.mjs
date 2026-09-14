import { readFileSync } from 'node:fs';
import { transpileModule, ModuleKind } from 'typescript';
import vm from 'node:vm';
import assert from 'node:assert/strict';
let source = readFileSync('api/interview-coach.ts', 'utf8').replace(/import .*?;\n/g, '').replace('export default async function handler', 'async function handler');
const calls = [];
let authServiceError = null;
let authConfig = null;
const feedback = { summary: 'Bom exemplo; falta explicar a decisão.', detailed: [{ criterion: 'Decisão', evidence: 'organizei', how: 'Explique por quê.' }], scores: { clareza: 80 } };
const context = { Buffer, URL, AbortSignal, Date, console, process: { env: {} },
  createClient: (url, key) => { authConfig = { url, key }; return { auth: { getUser: async token => ({ error: authServiceError, data: { user: !authServiceError && token === 'valid' ? { id: 'test', app_metadata: {} } : null } }) } }; },
  fetch: async () => ({ headers: new Headers({ 'content-range': '0-0/0' }), ok: true }),
  generateText: async args => {
    calls.push(args);
    if (args.model.startsWith('google/')) return { text: JSON.stringify({ usable: true, transcript: 'Organizei uma equipe e aprendi a dividir responsabilidades.', observations: [], pace: 'Regular' }) };
    const final = args.messages[0].content.includes('consolide');
    return { text: JSON.stringify({ question: 'O que você aprendeu?', feedback, report: final ? { overall_score: 78, seven_day_plan: Array.from({length: 7}, (_, i) => `Dia ${i+1}: treinar`) } : undefined }), response: { modelId: args.model } };
  },
};
vm.createContext(context);
vm.runInContext(transpileModule(source + '\nglobalThis.handler = handler;', { compilerOptions: { module: ModuleKind.None, target: 9 } }).outputText, context);
async function request(body, token = 'valid', method = 'POST') {
  const response = { statusCode: 0, body: null, setHeader() {}, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
  await context.handler({ method, headers: { authorization: token ? `Bearer ${token}` : '' }, body }, response);
  return response;
}
assert.equal((await request({}, '', 'GET')).body.voice, true);
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
const start = await request({ phase: 'start', totalQuestions: 5 });
assert.equal(start.statusCode, 200); assert.equal(start.body.model, 'openai/gpt-6-astra');
const history = [{ question: 'Conte uma experiência', answer: 'Organizei uma equipe e aprendi a dividir responsabilidades.' }];
const typed = await request({ phase: 'answer', totalQuestions: 1, history });
assert.equal(typed.body.complete, true); assert.equal(typed.body.report.sevenDayPlan.length, 7); assert.equal(typed.body.voice, null);
const audio = { data: Buffer.alloc(200).toString('base64'), duration: 20, mediaType: 'audio/webm' };
const spoken = await request({ phase: 'answer', totalQuestions: 5, history, audio });
assert.equal(spoken.statusCode, 200); assert.ok(spoken.body.voice.transcript.includes('Organizei'));
assert.ok(calls.at(-1).messages[0].content.includes('Regular'));
assert.equal((await request({ phase: 'answer', history, audio: { ...audio, duration: 181 } })).statusCode, 400);
assert.equal((await request({ phase: 'answer', history, audio: { ...audio, mediaType: 'text/html' } })).statusCode, 400);
assert.equal((await request({ phase: 'answer', totalQuestions: 1, history: [...history, ...history] })).statusCode, 400);
console.log('PASS: auth, session lengths, final report, text-only, audio pipeline, MIME/duration/history validation (mocked providers).');
