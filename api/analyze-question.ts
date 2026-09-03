const json=(res:any,status:number,body:unknown)=>res.status(status).json(body);

function cleanJson(raw:string){
  const trimmed=raw.trim().replace(/^```json\s*/i,'').replace(/```$/,'').trim();
  try{return JSON.parse(trimmed)}catch{}
  const start=trimmed.indexOf('{'),end=trimmed.lastIndexOf('}');
  if(start>=0&&end>start)return JSON.parse(trimmed.slice(start,end+1));
  throw new Error('Resposta da análise não veio em JSON válido.');
}

export default async function handler(req:any,res:any){
  if(req.method!=='POST')return json(res,405,{error:'Método não permitido.'});
  try{
    const auth=String(req.headers.authorization||'');
    if(!auth.startsWith('Bearer '))return json(res,401,{error:'Faça login para analisar a questão.'});

    const supabaseUrl=process.env.VITE_SUPABASE_URL||process.env.SUPABASE_URL;
    const supabaseKey=process.env.VITE_SUPABASE_ANON_KEY||process.env.SUPABASE_ANON_KEY;
    if(!supabaseUrl||!supabaseKey)return json(res,500,{error:'Configuração de autenticação indisponível.'});
    const userCheck=await fetch(`${supabaseUrl}/auth/v1/user`,{headers:{apikey:supabaseKey,Authorization:auth}});
    if(!userCheck.ok)return json(res,401,{error:'Sua sessão expirou. Entre novamente.'});
    const user=await userCheck.json();

    const {imageDataUrl,examId,taxonomy,textHint,areaHint}=req.body||{};
    if(typeof imageDataUrl!=='string'||!imageDataUrl.startsWith('data:image/'))return json(res,400,{error:'Imagem inválida.'});
    if(imageDataUrl.length>6_000_000)return json(res,413,{error:'A foto ficou grande demais após o processamento. Tente recortar apenas a questão.'});
    if(!Array.isArray(taxonomy)||!taxonomy.length)return json(res,400,{error:'Taxonomia da prova não carregada.'});

    const allowed=taxonomy.slice(0,250).map((s:any)=>({area:String(s.area||''),skill_code:String(s.skill_code||''),skill_name:String(s.skill_name||''),diagnostic_tags:Array.isArray(s.diagnostic_tags)?s.diagnostic_tags.slice(0,8):[]}));
    const instruction=`Você é um corretor de vestibulares brasileiros. Analise a FOTO de UMA questão, transcreva o suficiente para entendê-la, resolva a questão e classifique a habilidade usando SOMENTE uma habilidade da taxonomia fornecida.\n\nRegras obrigatórias:\n1. Não classifique só pela área. Escolha a habilidade específica cujo conteúdo e operação cognitiva são realmente necessários para resolver a questão.\n2. skill_code e skill_name devem corresponder exatamente a um item da taxonomia. Se a foto não tiver informação suficiente, use null e explique em uncertainty_reason.\n3. Resolva a questão independentemente de marcações feitas pelo aluno na foto.\n4. Se houver alternativas, informe a letra correta e o texto/valor da alternativa. Se for discursiva, dê a resposta final esperada.\n5. Explique a resolução em passos claros e didáticos, sem pular a justificativa principal.\n6. Se a imagem estiver cortada, ilegível, sem alternativas necessárias ou depender de gráfico/tabela não visível, marque needs_better_photo=true e NÃO invente o gabarito.\n7. confidence deve ser de 0 a 1 e refletir a confiança na habilidade identificada, não apenas na área.\n8. Retorne APENAS JSON válido, sem markdown.\n\nFormato exato:\n{\n  "question_text":"transcrição limpa e concisa",\n  "area":"matéria/área específica",\n  "skill_code":"código exato da taxonomia ou null",\n  "skill_name":"nome exato da taxonomia ou null",\n  "confidence":0.0,\n  "correct_answer":"gabarito (ex.: C — 42) ou resposta discursiva; null se não for possível",\n  "solution_summary":"ideia central da solução",\n  "solution_steps":["passo 1","passo 2"],\n  "common_trap":"erro comum ou pegadinha relevante",\n  "needs_better_photo":false,\n  "uncertainty_reason":null\n}\n\nProva ativa: ${String(examId||'não informada')}\nÁrea sugerida pelo aluno: ${String(areaHint||'Automático')}\nTexto complementar digitado pelo aluno: ${String(textHint||'nenhum')}\nTaxonomia permitida: ${JSON.stringify(allowed)}`;

    const gatewayToken=process.env.AI_GATEWAY_API_KEY||process.env.VERCEL_OIDC_TOKEN;
    if(!gatewayToken)return json(res,503,{error:'A análise inteligente ainda não está habilitada no servidor.'});

    const payload:any={
      model:'openai/gpt-5.5',
      messages:[{role:'user',content:[{type:'text',text:instruction},{type:'image_url',image_url:{url:imageDataUrl,detail:'high'}}]}],
      max_tokens:3000,
      response_format:{type:'json_object'},
    };
    let ai=await fetch('https://ai-gateway.vercel.sh/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${gatewayToken}`,'Content-Type':'application/json','x-vercel-ai-gateway-user-id':String(user.id||'anonymous')},body:JSON.stringify(payload)});
    if(!ai.ok){
      delete payload.response_format;
      ai=await fetch('https://ai-gateway.vercel.sh/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${gatewayToken}`,'Content-Type':'application/json','x-vercel-ai-gateway-user-id':String(user.id||'anonymous')},body:JSON.stringify(payload)});
    }
    if(!ai.ok){const detail=await ai.text();console.error('AI Gateway error',ai.status,detail.slice(0,1200));return json(res,502,{error:'Não consegui analisar essa foto agora. Tente novamente com uma imagem mais nítida.'});}
    const data=await ai.json();
    const raw=data?.choices?.[0]?.message?.content;
    if(typeof raw!=='string')return json(res,502,{error:'A análise não retornou uma correção utilizável.'});
    const parsed=cleanJson(raw);

    const matched=allowed.find((s:any)=>s.skill_code===parsed.skill_code&&s.skill_name===parsed.skill_name);
    if(!matched){parsed.skill_code=null;parsed.skill_name=null;parsed.confidence=Math.min(Number(parsed.confidence)||0,.45);parsed.uncertainty_reason=parsed.uncertainty_reason||'A habilidade retornada não correspondeu exatamente à taxonomia oficial desta prova.';}
    parsed.confidence=Math.max(0,Math.min(1,Number(parsed.confidence)||0));
    parsed.solution_steps=Array.isArray(parsed.solution_steps)?parsed.solution_steps.map(String).slice(0,8):[];
    parsed.needs_better_photo=Boolean(parsed.needs_better_photo);
    return json(res,200,{analysis:parsed});
  }catch(error:any){
    console.error('analyze-question failed',error);
    return json(res,500,{error:error?.message||'Falha ao analisar a questão.'});
  }
}
