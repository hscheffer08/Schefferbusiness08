import { generateText } from 'ai';
import { createClient } from '@supabase/supabase-js';

const MODEL='openai/gpt-5.4-mini';
const FALLBACK_MODELS=['openai/gpt-5.4-nano','google/gemini-3.6-flash'];
const FALLBACK_SUPABASE_URL='https://kmognvgnfisdchzffkgh.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6Imttb2dudmduZmlzZGNoemZma2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MzkxNjksImV4cCI6MjEwMjMxNTE2OX0.JarpsXfgv8PplL3Ryvs6iFfEPiv_rnp2Cx5i1I67fCk';

const json=(res:any,status:number,body:unknown)=>{res.setHeader('Cache-Control','no-store');return res.status(status).json(body)};
const trim=(v:unknown,max=6000)=>String(v??'').slice(0,max);
function cleanEnv(v:unknown){return String(v??'').trim().replace(/^["']|["']$/g,'')}
function validUrl(v:string){try{const u=new URL(v.startsWith('http')?v:`https://${v}`);const h=u.hostname.toLowerCase();if(!/^[a-z0-9-]+\.supabase\.co$/i.test(h))return'';if(/(^|\.)x{6,}\.supabase\.co$/i.test(h)||h.includes('your-project')||h.includes('project-id'))return'';return u.origin}catch{return''}}
function config(){const rawUrl=cleanEnv(process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL);const rawKey=cleanEnv(process.env.SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_PUBLISHABLE_KEY);const url=validUrl(rawUrl);return url&&rawKey?{url,key:rawKey}:{url:FALLBACK_SUPABASE_URL,key:FALLBACK_SUPABASE_ANON_KEY}}

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
  const system=`Você é a IA Conectaê Premium, tutor educacional de alta profundidade. Responda em português do Brasil. O aluno é assinante Premium e tem acesso sem limite diário de produto.\n\nSua prioridade é ensinar, não apenas dar a resposta. Para questões objetivas, dê a alternativa correta e explique o raciocínio decisivo; quando for útil, explique por que as distrações mais plausíveis estão erradas. Para matemática, física e química, confira unidades, sinais e ordem de grandeza. Para biologia/genética, separe conceitos próximos. Para linguagens, fundamente no texto. Para humanas, diferencie causa, consequência, contexto e anacronismo.\n\nQuando o aluno pedir plano de estudo, entregue um plano aprofundado, concreto e executável, respeitando exatamente as horas semanais informadas no contexto, com prioridades, sequência, metas de questões/acertos, revisão espaçada e checkpoints. Use dificuldades e desempenho recente para personalizar.\n\nSe a imagem estiver incompleta ou ilegível, peça uma foto melhor em vez de inventar. Faça autochecagem internamente e não exponha cadeia de raciocínio privada.\n\nContexto do aluno: ${JSON.stringify(context&&typeof context==='object'?context:{})}.`;

  const modelMessages:any[]=safe.map((m:any,i:number)=>i===safe.length-1&&m.role==='user'&&typeof imageDataUrl==='string'?{role:'user',content:[{type:'text',text:m.content},{type:'image',image:imageDataUrl}]}:{role:m.role,content:m.content});
  try{
    const r=await generateText({model:MODEL,system,messages:modelMessages,maxOutputTokens:3200,abortSignal:AbortSignal.timeout(60000),providerOptions:{gateway:{models:FALLBACK_MODELS,user:userId,tags:['feature:education-tutor-premium','plan:premium','production-failover']}}} as any);
    const answer=String(r.text||'').trim();if(!answer)return json(res,502,{error:'A resposta ficou incompleta. Tente novamente.'});
    return json(res,200,{answer,educational:true,premium:true,unlimitedDaily:true,remainingQuestions:null,model:(r as any)?.response?.modelId||MODEL});
  }catch(error:any){const status=Number(error?.statusCode||error?.status||0);console.error('premium tutor failed',status,error?.message||error);if(status===429)return json(res,429,{error:'A IA atingiu um limite momentâneo do provedor. Tente novamente em alguns segundos.'});return json(res,502,{error:'A IA Premium ficou temporariamente indisponível. Tente novamente.'})}
}
