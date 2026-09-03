import { generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { google } from '@ai-sdk/google';

const json=(res:any,status:number,body:unknown)=>{res.setHeader('Cache-Control','no-store');return res.status(status).json(body)};
const trim=(value:unknown,max=3000)=>String(value??'').slice(0,max);
type TutorMessage={role:'user'|'assistant';content:string};
type RefSkill={area:string;skill_code:string;skill_name:string;scope:string;diagnostic_tags?:string[];parent_skill_code?:string|null;official_reference?:boolean};
type PlanSkill={area:string;skill_code:string;skill_name:string;diagnostic_tags?:string[]};

const MODEL='openai/gpt-5.4-mini';
const SEARCH_MODEL='google/gemini-2.5-flash-lite';
const FALLBACK_SUPABASE_URL='https://kmognvgnfisdchzffkgh.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6Imttb2dudmduZmlzZGNoemZma2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MzkxNjksImV4cCI6MjEwMjMxNTE2OX0.JarpsXfgv8PplL3Ryvs6iFfEPiv_rnp2Cx5i1I67fCk';

function cleanEnv(v:unknown){return String(v??'').trim().replace(/^["']|["']$/g,'')}
function validUrl(v:string){try{return Boolean(v)&&/\.supabase\.co$/i.test(new URL(v.startsWith('http')?v:`https://${v}`).hostname)}catch{return false}}
function config(){
  const rawUrl=cleanEnv(process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL);
  const rawKey=cleanEnv(process.env.SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
  return{url:validUrl(rawUrl)?new URL(rawUrl.startsWith('http')?rawUrl:`https://${rawUrl}`).origin:FALLBACK_SUPABASE_URL,key:rawKey||FALLBACK_SUPABASE_ANON_KEY};
}
function repairJson(s:string){return s.replace(/\\(?!["\\/bfnrtu])/g,'\\\\')}
function parseJson(raw:string){
  const v=raw.trim().replace(/^```json\s*/i,'').replace(/^```\s*/,'').replace(/```$/,'').trim();
  const a=v.indexOf('{'),b=v.lastIndexOf('}');
  for(const x of [v,a>=0&&b>a?v.slice(a,b+1):'']){if(!x)continue;try{return JSON.parse(x)}catch{}try{return JSON.parse(repairJson(x))}catch{}}
  throw new Error('Resposta estruturada inválida');
}
function tokens(s:string){return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').split(/[^a-z0-9]+/).filter(x=>x.length>2)}
function rankSkills(skills:RefSkill[],query:string,areaHint:string){
  const q=new Set(tokens(query));const area=areaHint.toLowerCase();
  return skills.map(s=>{const hay=tokens(`${s.area} ${s.skill_name} ${s.scope} ${(s.diagnostic_tags||[]).join(' ')}`);let score=area&&s.area.toLowerCase().includes(area)?5:0;for(const t of hay)if(q.has(t))score+=1;return{s,score}}).sort((a,b)=>b.score-a.score).filter((x,i)=>x.score>0||i<18).slice(0,42).map(x=>x.s);
}
function sourceList(value:unknown){if(!Array.isArray(value))return[];return value.slice(0,4).map((s:any)=>({title:trim(s?.title||s?.name||'Fonte consultada',140),url:/^https?:\/\//i.test(String(s?.url||''))?trim(s.url,900):''})).filter((s:any)=>s.url)}
async function sb(url:string,headers:Record<string,string>){return fetch(url,{headers,signal:AbortSignal.timeout(9000)})}

export default async function handler(req:any,res:any){
  if(req.method==='GET')return json(res,200,{ok:true,service:'IA Conectaê',model:MODEL,searchModel:SEARCH_MODEL,costMode:'confidence-based-escalation'});
  if(req.method!=='POST')return json(res,405,{error:'Método não permitido.'});
  try{
    const auth=String(req.headers.authorization||'');if(!auth.startsWith('Bearer '))return json(res,401,{error:'Faça login para conversar com a IA Conectaê.'});
    const cfg=config();if(!cfg.key)return json(res,503,{error:'A configuração educacional está temporariamente indisponível.'});
    const baseHeaders={apikey:cfg.key,Authorization:auth};
    let u:Response;try{u=await sb(`${cfg.url}/auth/v1/user`,baseHeaders)}catch{return json(res,503,{error:'Não foi possível validar sua sessão agora.'})}
    if(!u.ok)return json(res,401,{error:'Sua sessão expirou. Entre novamente.'});const user=await u.json();const userId=String(user?.id||'');if(!userId)return json(res,401,{error:'Sua sessão não pôde ser validada.'});

    const {messages,context,imageDataUrl}=req.body||{};if(!Array.isArray(messages)||!messages.length)return json(res,400,{error:'Escreva sua dúvida.'});
    const safe: TutorMessage[]=messages.slice(-6).map((m:any)=>({role:m?.role==='assistant'?'assistant':'user',content:trim(m?.content,1800)})).filter((m:TutorMessage)=>m.content.trim());
    if(!safe.length)return json(res,400,{error:'Escreva sua dúvida.'});
    if(imageDataUrl!=null&&(typeof imageDataUrl!=='string'||!/^data:image\/(jpeg|png|webp);base64,/i.test(imageDataUrl)))return json(res,400,{error:'Formato de imagem inválido.'});
    if(typeof imageDataUrl==='string'&&imageDataUrl.length>3_600_000)return json(res,413,{error:'A foto ficou grande demais. Recorte a questão e tente novamente.'});

    const c=context&&typeof context==='object'?context:{};const exam=trim(c.exam||'enem',40).toLowerCase();
    try{
      const minute=new Date(Date.now()-60000).toISOString(),day=new Date(Date.now()-86400000).toISOString();
      const [a,b]=await Promise.all([fetch(`${cfg.url}/rest/v1/ai_tutor_usage?select=id&user_id=eq.${userId}&created_at=gte.${encodeURIComponent(minute)}`,{headers:{...baseHeaders,Prefer:'count=exact'}}),fetch(`${cfg.url}/rest/v1/ai_tutor_usage?select=id&user_id=eq.${userId}&created_at=gte.${encodeURIComponent(day)}`,{headers:{...baseHeaders,Prefer:'count=exact'}})]);
      const mc=Number(a.headers.get('content-range')?.split('/')?.[1]||0),dc=Number(b.headers.get('content-range')?.split('/')?.[1]||0);if(mc>=12)return json(res,429,{error:'Aguarde um minuto antes de enviar mais perguntas.'});if(dc>=120)return json(res,429,{error:'Você atingiu o limite diário da IA Conectaê.'});
    }catch{}

    let refs:RefSkill[]=[];let plans:PlanSkill[]=[];
    try{const r=await sb(`${cfg.url}/rest/v1/exam_ai_skill_reference?select=area,skill_code,skill_name,scope,diagnostic_tags,parent_skill_code,official_reference&exam_id=eq.${encodeURIComponent(exam)}`,{...baseHeaders,Accept:'application/json'});if(r.ok)refs=await r.json()}catch{}
    try{const r=await sb(`${cfg.url}/rest/v1/exam_skill_taxonomy?select=area,skill_code,skill_name,diagnostic_tags&exam_id=eq.${encodeURIComponent(exam)}`,{...baseHeaders,Accept:'application/json'});if(r.ok)plans=await r.json()}catch{}

    const latest=safe[safe.length-1]?.content||'';const contextQuestion=trim(c.currentQuestion,1500);const areaHint=trim(c.currentArea,80);const candidates=rankSkills(refs,`${latest} ${contextQuestion} ${trim(c.currentSkill,120)}`,areaHint);
    const student={exam,weeklyHours:trim(c.weeklyHours,12),recentDifficulties:Array.isArray(c.recentDifficulties)?c.recentDifficulties.slice(0,4).map((x:any)=>trim(x,120)):[],recentPerformance:Array.isArray(c.recentPerformance)?c.recentPerformance.slice(0,4).map((x:any)=>trim(x,120)):[],currentQuestion:contextQuestion,currentSkill:trim(c.currentSkill,120),currentArea:areaHint};
    const image=typeof imageDataUrl==='string';
    const explicitLookup=/\b(gabarito|fonte|banca|prova|vestibular|enem|fuvest|cmmg|unicamp|unesp|famerp|famema|ita|ime|quest[aã]o\s*\d+|20\d{2})\b/i.test(latest)||Boolean(contextQuestion);

    const system=`Você é a IA Conectaê, tutor educacional rigoroso e conciso. Responda em português do Brasil.

QUALIDADE INTERNA: desconfie da primeira conclusão. Releia o comando, tente refutar sua resposta, confira sinais, unidades, condicionais, EXCETO/incorreta/respectivamente, dados de gráficos/tabelas, probabilidade condicionada, causalidade e a alternativa escolhida. Faça essa auditoria internamente; não exponha checklist nem cadeia de raciocínio.

SAÍDA PARA O ALUNO: resposta comentada curta. Em objetiva: “Resposta: X) ...” + 2 a 5 frases com o raciocínio decisivo. Mostre contas apenas quando necessárias. Para dúvida conceitual: resposta direta + explicação breve. Só alongue se solicitado.

REGRAS ESSENCIAIS: matemática/física/química devem conferir unidade, sinais e ordem de grandeza; genética deve separar sexo, herança, penetrância e probabilidade conjunta; linguagens devem se apoiar no texto; humanas devem evitar anacronismo e separar causa de consequência. Se faltar dado legível, peça imagem melhor em vez de chutar.

CUSTO E BUSCA: primeiro resolva por conta própria. Defina needs_external_check=true SOMENTE se uma busca externa provavelmente aumentar a confiabilidade: baixa confiança (<0.88), questão identificável por banca/ano/gabarito, fato externo específico, imagem ambígua, ou conflito entre duas interpretações plausíveis. Não peça busca para dúvidas conceituais estáveis nem questões autocontidas resolvidas com alta confiança.

CONTEXTO: ${JSON.stringify(student)}
HABILIDADES CANDIDATAS: ${JSON.stringify(candidates.map(s=>({area:s.area,skill_code:s.skill_code,skill_name:s.skill_name,parent_skill_code:s.parent_skill_code||null})))}
Escolha learning_focus apenas se coincidir exatamente com uma candidata. Não altere o plano; apenas ofereça inclusão após dúvida resolvida.
Retorne APENAS JSON válido: {"answer":"resposta curta","confidence":0.0,"self_check_passed":true,"needs_external_check":false,"resolved_doubt":true,"needs_better_image":false,"learning_focus":{"area":"","skill_code":"","skill_name":"","plan_skill_code":null,"confidence":0.0,"reason":""},"offer_plan":false}`;

    const modelMessages:any[]=safe.map((m,i)=>i===safe.length-1&&m.role==='user'&&image?{role:'user',content:[{type:'text',text:m.content},{type:'image',image:imageDataUrl}]}:{role:m.role,content:m.content});
    let firstRaw='';let firstError:any=null;
    try{const r=await generateText({model:MODEL,system,messages:modelMessages,maxOutputTokens:1500,abortSignal:AbortSignal.timeout(45000),providerOptions:{gateway:{user:userId,tags:['feature:education-tutor',`exam:${exam}`,'cost-optimized-first-pass']}}} as any);firstRaw=String(r.text||'').trim()}catch(e:any){firstError=e}
    if(!firstRaw){const status=Number(firstError?.statusCode||0);if(status===429)return json(res,429,{error:'A IA atingiu o limite momentâneo. Aguarde alguns segundos e tente novamente.'});return json(res,502,{error:'Não foi possível gerar a resposta agora. Tente novamente.'})}
    let first:any;try{first=parseJson(firstRaw)}catch{return json(res,502,{error:'A resposta ficou incompleta. Tente novamente.'})}

    let final=first,searchMode='none',sources:any[]=[];
    const conf=Math.max(0,Math.min(1,Number(first.confidence)||0));
    const shouldSearch=Boolean(first.needs_external_check)||(explicitLookup&&conf<0.94)||(image&&conf<0.88)||first.self_check_passed===false;
    if(shouldSearch){
      try{
        const verifySystem=`Você é o verificador final da IA Conectaê. Pesquise no Google apenas o necessário para verificar esta questão. Compare a fonte encontrada com o enunciado e com a resposta preliminar. Não copie cegamente um site: resolva novamente e corrija se necessário. Prefira fonte oficial da banca/universidade. Responda de forma curta ao aluno e não descreva seu processo interno. Retorne APENAS JSON válido: {"answer":"resposta comentada curta","confidence":0.0,"resolved_doubt":true,"needs_better_image":false,"learning_focus":null,"offer_plan":false,"web_verified":false}.`;
        const verificationPrompt=`Prova ativa: ${exam}.\nPergunta: ${latest}\n${contextQuestion?`Enunciado adicional: ${contextQuestion}\n`:''}Resposta preliminar: ${trim(first.answer,1800)}\nVerifique e corrija se necessário.`;
        const verifyMessages:any[]=[{role:'user',content:image?[{type:'text',text:verificationPrompt},{type:'image',image:imageDataUrl}]:verificationPrompt}];
        const r=await generateText({model:SEARCH_MODEL,system:verifySystem,messages:verifyMessages,maxOutputTokens:1200,abortSignal:AbortSignal.timeout(45000),tools:{google_search:google.tools.googleSearch({})},providerOptions:{gateway:{user:userId,tags:['feature:education-tutor',`exam:${exam}`,'selective-google-verification']}}} as any);
        const found=sourceList((r as any).sources);const parsed=parseJson(String(r.text||''));if(parsed?.answer){final={...first,...parsed};sources=found;searchMode=found.length?'google':'google-no-source'}
      }catch(e:any){console.warn('selective search skipped after failure',e?.statusCode||'',e?.message||e)}
    }

    const answer=trim(final.answer,5000).trim();if(!answer)return json(res,502,{error:'A resposta ficou incompleta. Tente novamente.'});
    let focus=final.learning_focus&&typeof final.learning_focus==='object'?final.learning_focus:first.learning_focus;
    if(focus){const match=candidates.find(s=>s.skill_code===String(focus.skill_code||'')&&s.skill_name===String(focus.skill_name||''));if(!match)focus=null;else{const planCode=String(focus.plan_skill_code||match.parent_skill_code||''),plan=plans.find(s=>s.skill_code===planCode);focus={area:match.area,skill_code:match.skill_code,skill_name:match.skill_name,plan_skill_code:plan?.skill_code||null,plan_skill_name:plan?.skill_name||null,confidence:Math.max(0,Math.min(1,Number(focus.confidence)||conf)),reason:trim(focus.reason,300),official_reference:Boolean(match.official_reference)}}}
    const offerPlan=Boolean(final.offer_plan??first.offer_plan)&&Boolean(focus)&&focus.confidence>=0.68&&Boolean(final.resolved_doubt??first.resolved_doubt);
    fetch(`${cfg.url}/rest/v1/ai_tutor_usage`,{method:'POST',headers:{...baseHeaders,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({user_id:userId,exam_id:exam,has_image:image})}).catch(()=>{});
    return json(res,200,{answer,educational:true,resolvedDoubt:Boolean(final.resolved_doubt??first.resolved_doubt),learningFocus:focus,offerPlan,needsBetterImage:Boolean(final.needs_better_image??first.needs_better_image),model:searchMode==='none'?MODEL:SEARCH_MODEL,searchMode,webVerified:searchMode==='google'&&sources.length>0,sources,costOptimized:true});
  }catch(error:any){console.error('education-tutor failed',error);return json(res,500,{error:'A IA encontrou uma falha inesperada. Tente novamente.'})}
}
