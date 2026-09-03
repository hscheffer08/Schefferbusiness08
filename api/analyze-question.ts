const json=(res:any,status:number,body:unknown)=>{res.setHeader('Cache-Control','no-store');return res.status(status).json(body)};
const FALLBACK_SUPABASE_URL='https://kmognvgnfisdchzffkgh.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6Imttb2dudmduZmlzZGNoemZma2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MzkxNjksImV4cCI6MjEwMjMxNTE2OX0.JarpsXfgv8PplL3Ryvs6iFfEPiv_rnp2Cx5i1I67fCk';
const AI_MODEL='openai/gpt-5.4-mini';
const AI_FALLBACK_MODELS=['openai/gpt-5.4-nano','google/gemini-3.6-flash'];

function cleanEnv(v:unknown){return String(v??'').trim().replace(/^["']|["']$/g,'')}
function normalizeSupabaseUrl(v:string){
  try{
    if(!v)return'';
    const u=new URL(v.startsWith('http')?v:`https://${v}`);
    const host=u.hostname.toLowerCase();
    if(!/^[a-z0-9-]+\.supabase\.co$/i.test(host))return'';
    if(/(^|\.)x{6,}\.supabase\.co$/i.test(host)||host.includes('your-project')||host.includes('project-id'))return'';
    return u.origin;
  }catch{return''}
}
function config(){
  const rawUrl=cleanEnv(process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL);
  const rawKey=cleanEnv(process.env.SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
  const url=normalizeSupabaseUrl(rawUrl);
  if(url&&rawKey)return{url,key:rawKey};
  return{url:FALLBACK_SUPABASE_URL,key:FALLBACK_SUPABASE_ANON_KEY};
}
function repairJson(s:string){return s.replace(/\\(?!["\\/bfnrtu])/g,'\\\\')}
function cleanJson(raw:string){
  const trimmed=raw.trim().replace(/^```json\s*/i,'').replace(/^```\s*/,'').replace(/```$/,'').trim();
  const start=trimmed.indexOf('{'),end=trimmed.lastIndexOf('}');
  for(const candidate of [trimmed,start>=0&&end>start?trimmed.slice(start,end+1):'']){
    if(!candidate)continue;
    try{return JSON.parse(candidate)}catch{}
    try{return JSON.parse(repairJson(candidate))}catch{}
  }
  throw new Error('Resposta da análise não veio em JSON válido.');
}

export default async function handler(req:any,res:any){
  if(req.method!=='POST')return json(res,405,{error:'Método não permitido.'});
  try{
    const auth=String(req.headers.authorization||'');
    if(!auth.startsWith('Bearer '))return json(res,401,{error:'Faça login para analisar a questão.'});

    const cfg=config();
    const userCheck=await fetch(`${cfg.url}/auth/v1/user`,{headers:{apikey:cfg.key,Authorization:auth},signal:AbortSignal.timeout(10000)});
    if(!userCheck.ok)return json(res,401,{error:'Sua sessão expirou. Entre novamente.'});
    const user=await userCheck.json();

    const {imageDataUrl,examId,taxonomy,textHint,areaHint}=req.body||{};
    if(typeof imageDataUrl!=='string'||!/^data:image\/(jpeg|png|webp);base64,/i.test(imageDataUrl))return json(res,400,{error:'Imagem inválida. Use JPG, PNG ou WebP.'});
    if(imageDataUrl.length>6_000_000)return json(res,413,{error:'A foto ficou grande demais após o processamento. Tente recortar apenas a questão.'});
    if(!Array.isArray(taxonomy)||!taxonomy.length)return json(res,400,{error:'Taxonomia da prova não carregada.'});

    const allowed=taxonomy.slice(0,250).map((s:any)=>({area:String(s.area||''),skill_code:String(s.skill_code||''),skill_name:String(s.skill_name||''),diagnostic_tags:Array.isArray(s.diagnostic_tags)?s.diagnostic_tags.slice(0,8):[]}));
    const instruction=`Você é um corretor de vestibulares brasileiros. Analise a FOTO de UMA questão, transcreva o suficiente para entendê-la, resolva a questão e classifique a habilidade usando SOMENTE uma habilidade da taxonomia fornecida.\n\nRegras obrigatórias:\n1. Não classifique só pela área. Escolha a habilidade específica cujo conteúdo e operação cognitiva são realmente necessários para resolver a questão.\n2. skill_code e skill_name devem corresponder exatamente a um item da taxonomia. Se a foto não tiver informação suficiente, use null e explique em uncertainty_reason.\n3. Resolva a questão independentemente de marcações feitas pelo aluno na foto.\n4. Se houver alternativas, informe a letra correta e o texto/valor da alternativa. Se for discursiva, dê a resposta final esperada.\n5. Explique a resolução em passos claros e didáticos, sem pular a justificativa principal.\n6. Se a imagem estiver cortada, ilegível, sem alternativas necessárias ou depender de gráfico/tabela não visível, marque needs_better_photo=true e NÃO invente o gabarito.\n7. confidence deve ser de 0 a 1 e refletir a confiança na habilidade identificada, não apenas na área.\n8. Antes de responder, confira internamente sinais, unidades, alternativas, condicionais, EXCETO/incorreta e dados do gráfico/tabela.\n9. Retorne APENAS JSON válido, sem markdown.\n\nFormato exato:\n{\n  "question_text":"transcrição limpa e concisa",\n  "area":"matéria/área específica",\n  "skill_code":"código exato da taxonomia ou null",\n  "skill_name":"nome exato da taxonomia ou null",\n  "confidence":0.0,\n  "correct_answer":"gabarito (ex.: C — 42) ou resposta discursiva; null se não for possível",\n  "solution_summary":"ideia central da solução",\n  "solution_steps":["passo 1","passo 2"],\n  "common_trap":"erro comum ou pegadinha relevante",\n  "needs_better_photo":false,\n  "uncertainty_reason":null\n}\n\nProva ativa: ${String(examId||'não informada')}\nÁrea sugerida pelo aluno: ${String(areaHint||'Automático')}\nTexto complementar digitado pelo aluno: ${String(textHint||'nenhum')}\nTaxonomia permitida: ${JSON.stringify(allowed)}`;

    const gatewayToken=process.env.AI_GATEWAY_API_KEY||process.env.VERCEL_OIDC_TOKEN;
    if(!gatewayToken)return json(res,503,{error:'A análise inteligente ainda não está habilitada no servidor.'});

    const payload:any={
      model:AI_MODEL,
      models:AI_FALLBACK_MODELS,
      messages:[{role:'user',content:[{type:'text',text:instruction},{type:'image_url',image_url:{url:imageDataUrl,detail:'high'}}]}],
      max_tokens:3000,
      response_format:{type:'json_object'},
      providerOptions:{gateway:{user:String(user.id||'anonymous'),tags:['feature:question-analysis','production-failover']}},
    };
    const headers={Authorization:`Bearer ${gatewayToken}`,'Content-Type':'application/json','x-vercel-ai-gateway-user-id':String(user.id||'anonymous')};
    let ai=await fetch('https://ai-gateway.vercel.sh/v1/chat/completions',{method:'POST',headers,body:JSON.stringify(payload),signal:AbortSignal.timeout(55000)});
    if(!ai.ok){
      const firstDetail=await ai.text();
      console.warn('AI Gateway structured response failed',ai.status,firstDetail.slice(0,800));
      delete payload.response_format;
      ai=await fetch('https://ai-gateway.vercel.sh/v1/chat/completions',{method:'POST',headers,body:JSON.stringify(payload),signal:AbortSignal.timeout(55000)});
    }
    if(!ai.ok){const detail=await ai.text();console.error('AI Gateway error',ai.status,detail.slice(0,1200));return json(res,502,{error:'Não consegui analisar essa foto agora. Tente novamente em alguns segundos.'});}
    const data=await ai.json();
    const raw=data?.choices?.[0]?.message?.content;
    if(typeof raw!=='string')return json(res,502,{error:'A análise não retornou uma correção utilizável.'});
    const parsed=cleanJson(raw);

    const matched=allowed.find((s:any)=>s.skill_code===parsed.skill_code&&s.skill_name===parsed.skill_name);
    if(!matched){parsed.skill_code=null;parsed.skill_name=null;parsed.confidence=Math.min(Number(parsed.confidence)||0,.45);parsed.uncertainty_reason=parsed.uncertainty_reason||'A habilidade retornada não correspondeu exatamente à taxonomia oficial desta prova.';}
    parsed.confidence=Math.max(0,Math.min(1,Number(parsed.confidence)||0));
    parsed.solution_steps=Array.isArray(parsed.solution_steps)?parsed.solution_steps.map(String).slice(0,8):[];
    parsed.needs_better_photo=Boolean(parsed.needs_better_photo);
    return json(res,200,{analysis:parsed,model:data?.model||AI_MODEL,failoverEnabled:true});
  }catch(error:any){
    console.error('analyze-question failed',error);
    return json(res,500,{error:'Falha ao analisar a questão. Tente novamente.'});
  }
}
