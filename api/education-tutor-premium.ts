import { generateText } from 'ai';
import { createClient } from '@supabase/supabase-js';

const MODEL='openai/gpt-5.6-luna';
const FALLBACK_MODELS=['openai/gpt-5.4-mini','google/gemini-3.6-flash'];
const FALLBACK_SUPABASE_URL='https://kmognvgnfisdchzffkgh.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6Imttb2dudmduZmlzZGNoemZma2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MzkxNjksImV4cCI6MjEwMjMxNTE2OX0.JarpsXfgv8PplL3Ryvs6iFfEPiv_rnp2Cx5i1I67fCk';

const json=(res:any,status:number,body:unknown)=>{res.setHeader('Cache-Control','no-store');return res.status(status).json(body)};
const trim=(v:unknown,max=6000)=>String(v??'').slice(0,max);
function cleanEnv(v:unknown){return String(v??'').trim().replace(/^["']|["']$/g,'')}
function validUrl(v:string){try{const u=new URL(v.startsWith('http')?v:`https://${v}`);const h=u.hostname.toLowerCase();if(!/^[a-z0-9-]+\.supabase\.co$/i.test(h))return'';if(/(^|\.)x{6,}\.supabase\.co$/i.test(h)||h.includes('your-project')||h.includes('project-id'))return'';return u.origin}catch{return''}}
function config(){const rawUrl=cleanEnv(process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL);const rawKey=cleanEnv(process.env.SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_PUBLISHABLE_KEY);const url=validUrl(rawUrl);return url&&rawKey?{url,key:rawKey}:{url:FALLBACK_SUPABASE_URL,key:FALLBACK_SUPABASE_ANON_KEY}}
function parseJson(raw:string){const v=raw.trim().replace(/^\`\`\`json\s*/i,'').replace(/^\`\`\`\s*/,'').replace(/\`\`\`$/,'').trim();const a=v.indexOf('{'),b=v.lastIndexOf('}');for(const x of [v,a>=0&&b>a?v.slice(a,b+1):'']){if(!x)continue;try{return JSON.parse(x)}catch{}}return null}
function confidenceLabel(value:number){if(value>=.94)return'Alta confiança';if(value>=.80)return'Confiança moderada';return'Baixa confiança'}

async function verify(url:string,key:string,token:string){
  const client=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}});
  try{const{data,error}=await client.auth.getClaims(token);const id=String((data as any)?.claims?.sub||'');if(!error&&id)return id}catch{}
  try{const{data,error}=await client.auth.getUser(token);if(!error&&data?.user?.id)return String(data.user.id)}catch{}
  return'';
}

async function premiumStatus(url:string,key:string,token:string,userId:string){
  try{
    const r=await fetch(`${url}/rest/v1/premium_subscriptions?select=status,current_period_end,cancel_at_period_end&user_id=eq.${encodeURIComponent(userId)}&limit=1`,{headers:{apikey:key,Authorization:`Bearer ${token}`,Accept:'application/json'},signal:AbortSignal.timeout(8000)});
    if(!r.ok)return false;
    const rows=await r.json();const row=rows?.[0];if(!row)return false;
    if(!['active','trialing'].includes(String(row.status||'')))return false;
    return !row.current_period_end||new Date(row.current_period_end).getTime()>Date.now();
  }catch{return false}
}

export default async function handler(req:any,res:any){
  if(req.method==='GET')return json(res,200,{ok:true,service:'IA Conectaê Premium',model:MODEL,unlimitedDaily:true});
  if(req.method!=='POST')return json(res,405,{error:'Método não permitido.'});
  const auth=String(req.headers.authorization||'');if(!auth.startsWith('Bearer '))return json(res,401,{error:'Faça login para usar a IA Premium.'});
  const token=auth.slice(7).trim();const cfg=config();const userId=await verify(cfg.url,cfg.key,token);if(!userId)return json(res,401,{error:'Sua sessão expirou. Entre novamente.'});
  if(!(await premiumStatus(cfg.url,cfg.key,token,userId)))return json(res,403,{error:'A IA ilimitada é exclusiva para assinantes Conectaê Premium.'});

  const {messages,context,imageDataUrl}=req.body||{};
  if(!Array.isArray(messages)||!messages.length)return json(res,400,{error:'Escreva sua dúvida.'});
  if(imageDataUrl!=null&&(typeof imageDataUrl!=='string'||!/^data:image\/(jpeg|png|webp);base64,/i.test(imageDataUrl)))return json(res,400,{error:'Formato de imagem inválido.'});
  if(typeof imageDataUrl==='string'&&imageDataUrl.length>3_600_000)return json(res,413,{error:'A foto ficou grande demais. Recorte a questão e tente novamente.'});

  const safe=messages.slice(-10).map((m:any)=>({role:m?.role==='assistant'?'assistant':'user',content:trim(m?.content,2600)})).filter((m:any)=>m.content.trim());
  const system=`Você é a IA Conectaê Premium, tutor educacional de alta profundidade. Responda em português do Brasil.

Antes de responder, trate a primeira conclusão como hipótese: resolva, tente refutá-la, confira comando, domínio, sinais, unidades, ordem de grandeza, alternativas, condicionais, gráficos e possíveis anacronismos. Use um segundo caminho quando possível. Essa auditoria é interna; não exponha cadeia de raciocínio.

Seja firme quando a resposta sobreviver à checagem e explícito quando faltar informação. confidence nunca pode ser 1: use 0.94–0.99 para conclusão bem determinada e checada; 0.80–0.93 para boa sustentação com pequena suposição; 0.60–0.79 para interpretação plausível; abaixo de 0.60 quando não for seguro concluir. Não chute dados ausentes.

Ensine, não apenas dê o resultado. Em objetivas, informe alternativa e raciocínio decisivo; explique distrações apenas quando isso ajudar. Em planos, respeite exatamente as horas semanais do contexto e entregue prioridades, sequência, metas, revisão espaçada e checkpoints.

Contexto do aluno: ${JSON.stringify(context&&typeof context==='object'?context:{})}.
Retorne APENAS JSON válido: {"answer":"resposta didática","confidence":0.0,"confidence_reason":"uma frase","self_check_passed":true,"answerable":true,"uncertainty_reason":null,"assumptions":[]}`;

  const modelMessages:any[]=safe.map((m:any,i:number)=>i===safe.length-1&&m.role==='user'&&typeof imageDataUrl==='string'?{role:'user',content:[{type:'text',text:m.content},{type:'image',image:imageDataUrl}]}:{role:m.role,content:m.content});
  try{
    const r=await generateText({model:MODEL,system,messages:modelMessages,maxOutputTokens:3200,abortSignal:AbortSignal.timeout(60000),providerOptions:{gateway:{models:FALLBACK_MODELS,user:userId,tags:['feature:education-tutor-premium','plan:premium','production-failover']}}} as any);
    const raw=String(r.text||'').trim();if(!raw)return json(res,502,{error:'A resposta ficou incompleta. Tente novamente.'});
    const parsed=parseJson(raw);const answer=String(parsed?.answer||raw).trim();const confidence=Math.max(0,Math.min(.99,Number(parsed?.confidence)||0));
    return json(res,200,{answer,educational:true,premium:true,unlimitedDaily:true,remainingQuestions:null,confidence,confidenceLabel:confidenceLabel(confidence),confidenceReason:trim(parsed?.confidence_reason,260),selfChecked:Boolean(parsed?.self_check_passed),answerable:Boolean(parsed?.answerable??true),uncertaintyReason:trim(parsed?.uncertainty_reason,360)||null,assumptions:Array.isArray(parsed?.assumptions)?parsed.assumptions.map((x:any)=>trim(x,220)).filter(Boolean).slice(0,3):[],model:(r as any)?.response?.modelId||MODEL});
  }catch(error:any){const status=Number(error?.statusCode||error?.status||0);console.error('premium tutor failed',status,error?.message||error);if(status===429)return json(res,429,{error:'A IA atingiu um limite momentâneo do provedor. Tente novamente em alguns segundos.'});return json(res,502,{error:'A IA Premium ficou temporariamente indisponível. Tente novamente.'})}
}
