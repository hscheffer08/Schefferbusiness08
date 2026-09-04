import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { createClient } from '@supabase/supabase-js';

const json=(res:any,status:number,body:unknown)=>{res.setHeader('Cache-Control','no-store');return res.status(status).json(body)};
const trim=(value:unknown,max=3000)=>String(value??'').slice(0,max);
type TutorMessage={role:'user'|'assistant';content:string};
type RefSkill={area:string;skill_code:string;skill_name:string;scope:string;diagnostic_tags?:string[];parent_skill_code?:string|null;official_reference?:boolean};
type PlanSkill={area:string;skill_code:string;skill_name:string;diagnostic_tags?:string[]};
type PracticeExample={id:number;area:string;skill_name:string;difficulty:number;prompt:string;option_a?:string;option_b?:string;option_c?:string;option_d?:string;option_e?:string;correct_option:string;explanation:string;source_basis:string};

const MODEL='openai/gpt-5.6-luna';
const REVIEW_MODEL='openai/gpt-5.4-mini';
const FALLBACK_MODELS=['openai/gpt-5.4-mini','google/gemini-3.6-flash'];
const SEARCH_MODEL='google/gemini-2.5-flash-lite';
const DAILY_QUESTION_LIMIT=20;
const FALLBACK_SUPABASE_URL='https://kmognvgnfisdchzffkgh.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6Imttb2dudmduZmlzZGNoemZma2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MzkxNjksImV4cCI6MjEwMjMxNTE2OX0.JarpsXfgv8PplL3Ryvs6iFfEPiv_rnp2Cx5i1I67fCk';

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
  if(url&&rawKey)return{url,key:rawKey,source:'env'};
  return{url:FALLBACK_SUPABASE_URL,key:FALLBACK_SUPABASE_ANON_KEY,source:'fallback'};
}
function repairJson(s:string){return s.replace(/\\(?!["\\/bfnrtu])/g,'\\\\')}
function parseJson(raw:string){
  const v=raw.trim().replace(/^```json\s*/i,'').replace(/^```\s*/,'').replace(/```$/,'').trim();
  const a=v.indexOf('{'),b=v.lastIndexOf('}');
  for(const x of [v,a>=0&&b>a?v.slice(a,b+1):'']){
    if(!x)continue;
    try{return JSON.parse(x)}catch{}
    try{return JSON.parse(repairJson(x))}catch{}
  }
  throw new Error('Resposta estruturada inválida');
}
function tokens(s:string){return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').split(/[^a-z0-9]+/).filter(x=>x.length>2)}
function rankSkills(skills:RefSkill[],query:string,areaHint:string){
  const q=new Set(tokens(query));const area=areaHint.toLowerCase();
  return skills.map(s=>{const hay=tokens(`${s.area} ${s.skill_name} ${s.scope} ${(s.diagnostic_tags||[]).join(' ')}`);let score=area&&s.area.toLowerCase().includes(area)?5:0;for(const t of hay)if(q.has(t))score+=1;return{s,score}}).sort((a,b)=>b.score-a.score).filter((x,i)=>x.score>0||i<18).slice(0,42).map(x=>x.s);
}
function rankPractice(items:PracticeExample[],query:string,areaHint:string){
  const q=new Set(tokens(query));const area=areaHint.toLowerCase();
  return items.map(item=>{
    const hay=tokens(`${item.area} ${item.skill_name} ${item.prompt}`);
    let score=area&&item.area.toLowerCase().includes(area)?8:0;
    for(const t of hay)if(q.has(t))score+=1;
    return{item,score};
  }).sort((a,b)=>b.score-a.score||Number(b.item.difficulty||0)-Number(a.item.difficulty||0))
    .filter((x,i)=>x.score>0||i<4).slice(0,4).map(x=>x.item);
}
function sourceList(value:unknown){if(!Array.isArray(value))return[];return value.slice(0,4).map((s:any)=>({title:trim(s?.title||s?.name||'Fonte consultada',140),url:/^https?:\/\//i.test(String(s?.url||''))?trim(s.url,900):''})).filter((s:any)=>s.url)}
function clampConfidence(value:unknown){return Math.max(0,Math.min(.99,Number(value)||0))}
function confidenceLabel(value:number){if(value>=.94)return'Alta confiança';if(value>=.80)return'Confiança moderada';return'Baixa confiança'}
function textList(value:unknown,maxItems=3){return Array.isArray(value)?value.map(v=>trim(v,220).trim()).filter(Boolean).slice(0,maxItems):[]}
function isHardQuestion(value:string){return /\b(exceto|incorreta|respectivamente|necessariamente|sempre|nunca|probabilidade condicional|sem reposi[cç][aã]o|aproxima[cç][aã]o|arredond|contraexemplo|causa|consequ[eê]ncia|gr[aá]fico|tabela|imagem|figura|gabarito|banca|20\d{2})\b/i.test(value)||/[=<>±√^]|\b(sen|cos|log|mol|newton|joule|volt|gen[oó]tipo|fen[oó]tipo)\b/i.test(value)}
function hasUnexpectedScript(value:string){return /[\u0400-\u052f\u0590-\u08ff\u0900-\u109f\u3040-\u30ff\u3400-\u9fff]/u.test(value)}
async function sb(url:string,headers:Record<string,string>){return fetch(url,{headers,signal:AbortSignal.timeout(9000)})}

async function verifyAccessToken(url:string,key:string,token:string){
  const client=createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false,detectSessionInUrl:false}});
  try{
    const {data,error}=await client.auth.getClaims(token);
    const claims=(data as any)?.claims;
    const userId=String(claims?.sub||'');
    const isAdmin=String(claims?.app_metadata?.role||'').toLowerCase()==='admin';
    if(!error&&userId)return{userId,isAdmin,mode:'claims'};
    if(error)console.warn('tutor getClaims rejected token',error.message);
  }catch(error:any){console.warn('tutor getClaims unavailable',error?.message||error)}
  try{
    const {data,error}=await client.auth.getUser(token);
    if(!error&&data?.user?.id)return{userId:String(data.user.id),isAdmin:String(data.user.app_metadata?.role||'').toLowerCase()==='admin',mode:'getUser'};
    return{userId:'',isAdmin:false,mode:'invalid'};
  }catch(error:any){
    console.error('tutor auth verification unavailable',error?.message||error);
    return{userId:'',isAdmin:false,mode:'unavailable'};
  }
}

export default async function handler(req:any,res:any){
  if(req.method==='GET'){
    const cfg=config();
    return json(res,200,{ok:true,service:'IA Conectaê',model:MODEL,fallbackModels:FALLBACK_MODELS,searchModel:SEARCH_MODEL,costMode:'confidence-based-escalation',grounding:'exam-practice-retrieval',dailyQuestionLimit:DAILY_QUESTION_LIMIT,adminAccess:'unlimited',authMode:'supabase-getClaims-app-metadata',supabaseConfig:cfg.source});
  }
  if(req.method!=='POST')return json(res,405,{error:'Método não permitido.'});
  try{
    const auth=String(req.headers.authorization||'');
    if(!auth.startsWith('Bearer '))return json(res,401,{error:'Faça login para conversar com a IA Conectaê.'});
    const token=auth.slice(7).trim();
    if(!token)return json(res,401,{error:'Sua sessão expirou. Entre novamente.'});

    const cfg=config();
    const verified=await verifyAccessToken(cfg.url,cfg.key,token);
    if(!verified.userId){
      if(verified.mode==='unavailable')return json(res,503,{error:'Não foi possível validar sua sessão agora. Tente novamente em alguns segundos.'});
      return json(res,401,{error:'Sua sessão expirou. Entre novamente.'});
    }
    const userId=verified.userId;
    const adminUnlimited=verified.isAdmin===true;
    const baseHeaders={apikey:cfg.key,Authorization:`Bearer ${token}`};

    const {messages,context,imageDataUrl}=req.body||{};
    if(!Array.isArray(messages)||!messages.length)return json(res,400,{error:'Escreva sua dúvida.'});
    const safe:TutorMessage[]=messages.slice(-6).map((m:any):TutorMessage=>({role:m?.role==='assistant'?'assistant':'user',content:trim(m?.content,1800)})).filter((m:TutorMessage)=>m.content.trim());
    if(!safe.length)return json(res,400,{error:'Escreva sua dúvida.'});
    if(imageDataUrl!=null&&(typeof imageDataUrl!=='string'||!/^data:image\/(jpeg|png|webp);base64,/i.test(imageDataUrl)))return json(res,400,{error:'Formato de imagem inválido.'});
    if(typeof imageDataUrl==='string'&&imageDataUrl.length>3_600_000)return json(res,413,{error:'A foto ficou grande demais. Recorte a questão e tente novamente.'});

    const c=context&&typeof context==='object'?context:{};
    const exam=trim(c.exam||'enem',40).toLowerCase();
    let usedToday=0;
    if(!adminUnlimited)try{
      const minute=new Date(Date.now()-60000).toISOString(),day=new Date(Date.now()-86400000).toISOString();
      const [a,b]=await Promise.all([
        fetch(`${cfg.url}/rest/v1/ai_tutor_usage?select=id&user_id=eq.${encodeURIComponent(userId)}&created_at=gte.${encodeURIComponent(minute)}`,{headers:{...baseHeaders,Prefer:'count=exact'},signal:AbortSignal.timeout(8000)}),
        fetch(`${cfg.url}/rest/v1/ai_tutor_usage?select=id&user_id=eq.${encodeURIComponent(userId)}&created_at=gte.${encodeURIComponent(day)}`,{headers:{...baseHeaders,Prefer:'count=exact'},signal:AbortSignal.timeout(8000)})
      ]);
      const mc=Number(a.headers.get('content-range')?.split('/')?.[1]||0),dc=Number(b.headers.get('content-range')?.split('/')?.[1]||0);usedToday=dc;
      if(mc>=8)return json(res,429,{error:'Aguarde um minuto antes de enviar mais perguntas.'});
      if(dc>=DAILY_QUESTION_LIMIT)return json(res,429,{error:`Você atingiu o limite de ${DAILY_QUESTION_LIMIT} perguntas da IA Conectaê hoje. O acesso é renovado automaticamente.`});
    }catch(error){console.warn('tutor usage check unavailable',error)}

    let refs:RefSkill[]=[];let plans:PlanSkill[]=[];let practice:PracticeExample[]=[];
    try{const r=await sb(`${cfg.url}/rest/v1/exam_ai_skill_reference?select=area,skill_code,skill_name,scope,diagnostic_tags,parent_skill_code,official_reference&exam_id=eq.${encodeURIComponent(exam)}`,{...baseHeaders,Accept:'application/json'});if(r.ok)refs=await r.json()}catch(error){console.warn('tutor reference lookup unavailable',error)}
    try{const r=await sb(`${cfg.url}/rest/v1/exam_skill_taxonomy?select=area,skill_code,skill_name,diagnostic_tags&exam_id=eq.${encodeURIComponent(exam)}`,{...baseHeaders,Accept:'application/json'});if(r.ok)plans=await r.json()}catch(error){console.warn('tutor taxonomy lookup unavailable',error)}
    try{const r=await sb(`${cfg.url}/rest/v1/exam_practice_questions?select=id,area,skill_name,difficulty,prompt,option_a,option_b,option_c,option_d,option_e,correct_option,explanation,source_basis&exam_id=eq.${encodeURIComponent(exam)}&active=is.true&limit=500`,{...baseHeaders,Accept:'application/json'});if(r.ok)practice=await r.json()}catch(error){console.warn('tutor practice corpus lookup unavailable',error)}

    const latest=safe[safe.length-1]?.content||'';
    const contextQuestion=trim(c.currentQuestion,1500);const areaHint=trim(c.currentArea,80);
    const candidates=rankSkills(refs,`${latest} ${contextQuestion} ${trim(c.currentSkill,120)}`,areaHint);
    const retrievedExamples=rankPractice(practice,`${latest} ${contextQuestion} ${trim(c.currentSkill,120)}`,areaHint);
    const student={exam,weeklyHours:trim(c.weeklyHours,12),recentDifficulties:Array.isArray(c.recentDifficulties)?c.recentDifficulties.slice(0,4).map((x:any)=>trim(x,120)):[],recentPerformance:Array.isArray(c.recentPerformance)?c.recentPerformance.slice(0,4).map((x:any)=>trim(x,120)):[],currentQuestion:contextQuestion,currentSkill:trim(c.currentSkill,120),currentArea:areaHint};
    const image=typeof imageDataUrl==='string';
    const explicitLookup=/\b(gabarito|fonte|banca|prova|vestibular|enem|fuvest|cmmg|unicamp|unesp|famerp|famema|ita|ime|quest[aã]o\s*\d+|20\d{2})\b/i.test(latest)||Boolean(contextQuestion);

    const system=`Você é a IA Conectaê, tutor educacional rigoroso, claro e intelectualmente honesto. Responda em português do Brasil.

MÉTODO INTERNO OBRIGATÓRIO: trate a primeira conclusão como hipótese, não como resposta final. Resolva; tente encontrar um erro; confira o comando e as palavras EXCETO, incorreta, respectivamente, sempre e nunca; valide sinais, unidades, domínio, ordem de grandeza, alternativas e dados de gráficos/tabelas; use um segundo caminho ou substituição quando possível. Faça tudo internamente, sem expor cadeia de raciocínio.

CERTEZA RESPONSÁVEL: seja firme quando a evidência sustentar a conclusão e nunca invente certeza. confidence nunca pode ser 1. Use 0.94–0.99 apenas quando enunciado e dados forem suficientes e a resposta sobreviver à contrachecagem; 0.80–0.93 quando houver boa sustentação, mas alguma suposição não crítica; 0.60–0.79 quando houver interpretação plausível ou dado parcial; abaixo de 0.60 quando não for seguro concluir. Liste assumptions apenas se elas realmente afetarem o resultado. Se faltar informação, diga exatamente o que falta e peça o complemento em vez de chutar. Se duas respostas forem plausíveis, explique em uma frase o ponto de ambiguidade.

SAÍDA PARA O ALUNO: comece pela conclusão. Em objetiva: “Resposta: X) ...” + 2 a 5 frases com o raciocínio decisivo. Para dúvida conceitual: resposta direta + explicação breve. Mostre contas quando necessárias. Não use linguagem hesitante quando a confiança for alta; não use tom categórico quando ela for baixa. Escreva apenas em português com alfabeto latino e matemática em texto simples, sem delimitadores LaTeX.

REGRAS POR ÁREA: matemática/física/química conferem domínio, unidade, sinais e ordem de grandeza; genética separa sexo, herança, penetrância e probabilidade conjunta; linguagens se apoia no texto; humanas evita anacronismo e separa correlação, causa e consequência.

CUSTO E BUSCA: primeiro resolva por conta própria. Defina needs_external_check=true somente quando a busca puder mudar a resposta: fato atual ou externo, gabarito/banca/ano identificável, baixa confiança, conflito real entre interpretações ou imagem ambígua. Não pesquise conteúdo estável e autocontido resolvido com alta confiança.

CONTEXTO: ${JSON.stringify(student)}
HABILIDADES CANDIDATAS: ${JSON.stringify(candidates.map(s=>({area:s.area,skill_code:s.skill_code,skill_name:s.skill_name,parent_skill_code:s.parent_skill_code||null})))}
BASE RECUPERADA DO BANCO: ${JSON.stringify(retrievedExamples.map(q=>({area:q.area,habilidade:q.skill_name,dificuldade:q.difficulty,enunciado:q.prompt,alternativas:{A:q.option_a,B:q.option_b,C:q.option_c,D:q.option_d,E:q.option_e},gabarito:q.correct_option,explicacao:q.explanation,origem:q.source_basis})))}
Use a base recuperada como exemplos de conteúdo e padrão da prova. Confira o gabarito por resolução independente antes de usá-lo. Itens cuja origem diga “autoral” são simulados alinhados ao exame, nunca questões oficiais. Se o aluno pedir uma questão histórica oficial por ano/número e o enunciado não estiver integralmente no contexto, marque needs_external_check=true e consulte a fonte oficial; não atribua um item autoral à banca.
Escolha learning_focus apenas se coincidir exatamente com uma candidata. Não altere o plano; apenas ofereça inclusão após a dúvida estar resolvida.
Retorne APENAS JSON válido: {"answer":"resposta curta","confidence":0.0,"confidence_reason":"uma frase objetiva, sem cadeia de raciocínio","self_check_passed":true,"needs_external_check":false,"answerable":true,"resolved_doubt":true,"needs_better_image":false,"uncertainty_reason":null,"assumptions":[],"learning_focus":{"area":"","skill_code":"","skill_name":"","plan_skill_code":null,"confidence":0.0,"reason":""},"offer_plan":false}`;

    const modelMessages:any[]=safe.map((m,i)=>i===safe.length-1&&m.role==='user'&&image?{role:'user',content:[{type:'text',text:m.content},{type:'image',image:imageDataUrl}]}:{role:m.role,content:m.content});
    let firstRaw='';let firstError:any=null;
    try{
      const r=await generateText({model:MODEL,system,messages:modelMessages,maxOutputTokens:1500,abortSignal:AbortSignal.timeout(45000),providerOptions:{gateway:{models:FALLBACK_MODELS,user:userId,tags:['feature:education-tutor',`exam:${exam}`,'production-failover']}}} as any);
      firstRaw=String(r.text||'').trim();
    }catch(e:any){firstError=e}
    if(!firstRaw){
      const status=Number(firstError?.statusCode||firstError?.status||0);
      console.error('tutor primary generation failed',status,firstError?.message||firstError);
      if(status===429)return json(res,429,{error:'A IA atingiu o limite momentâneo. Tente novamente em alguns segundos.'});
      return json(res,502,{error:'A IA ficou temporariamente indisponível. Tente novamente em alguns segundos.'});
    }
    let first:any;try{first=parseJson(firstRaw)}catch(error){console.error('tutor parse failed',String(firstRaw).slice(0,500),error);return json(res,502,{error:'A resposta ficou incompleta. Tente novamente.'})}

    let final=first,searchMode='none',sources:any[]=[];
    const conf=clampConfidence(first.confidence);
    const hardQuestion=isHardQuestion(`${latest} ${contextQuestion}`);
    const shouldSearch=Boolean(first.needs_external_check)||(explicitLookup&&conf<0.94)||(image&&conf<0.70);
    const shouldReview=hardQuestion||first.self_check_passed===false||conf<0.80;
    if(shouldSearch){
      try{
        const verifySystem=`Você é o verificador final da IA Conectaê. Pesquise somente o necessário. Compare a melhor fonte disponível com o enunciado e refaça a solução; não copie gabaritos cegamente. Prefira fonte oficial da banca, universidade, órgão público ou publicação primária. Corrija a resposta preliminar quando necessário. Calibre confidence pela evidência encontrada, nunca use 1 e não esconda ambiguidades. Não exponha cadeia de raciocínio. Retorne APENAS JSON válido: {"answer":"resposta comentada curta","confidence":0.0,"confidence_reason":"uma frase","self_check_passed":true,"answerable":true,"resolved_doubt":true,"needs_better_image":false,"uncertainty_reason":null,"assumptions":[],"learning_focus":null,"offer_plan":false,"web_verified":false}.`;
        const verificationPrompt=`Prova ativa: ${exam}.\nPergunta: ${latest}\n${contextQuestion?`Enunciado adicional: ${contextQuestion}\n`:''}Resposta preliminar: ${trim(first.answer,1800)}\nVerifique e corrija se necessário.`;
        const verifyMessages:any[]=[{role:'user',content:image?[{type:'text',text:verificationPrompt},{type:'image',image:imageDataUrl}]:verificationPrompt}];
        const r=await generateText({model:SEARCH_MODEL,system:verifySystem,messages:verifyMessages,maxOutputTokens:1200,abortSignal:AbortSignal.timeout(45000),tools:{google_search:google.tools.googleSearch({})},providerOptions:{gateway:{user:userId,tags:['feature:education-tutor',`exam:${exam}`,'selective-google-verification']}}} as any);
        const found=sourceList((r as any).sources);const parsed=parseJson(String(r.text||''));if(parsed?.answer){final={...first,...parsed};sources=found;searchMode=found.length?'google':'google-no-source'}
      }catch(e:any){console.warn('selective search skipped after failure',e?.statusCode||'',e?.message||e)}
    }
    if(searchMode==='none'&&shouldReview){
      try{
        const reviewSystem=`Você é o revisor adversarial final da IA Conectaê. Ignore a conclusão preliminar e resolva a pergunta do zero. Depois compare os resultados. Em matemática, derive todos os candidatos, aplique restrições de domínio e substitua a resposta no enunciado; testar um palpite não prova inexistência de solução. Em física/química, confira sinais, unidades e ordem de grandeza. Em linguagens/humanas, confira negações, ambiguidades, causalidade e anacronismos. Se faltarem dados, não chute. Não exponha cadeia de raciocínio. Escreva somente em português com alfabeto latino e matemática em texto simples, sem delimitadores LaTeX. Retorne APENAS JSON válido: {"answer":"resposta corrigida e curta","confidence":0.0,"confidence_reason":"uma frase","self_check_passed":true,"answerable":true,"resolved_doubt":true,"needs_better_image":false,"uncertainty_reason":null,"assumptions":[],"agrees_with_preliminary":true}.`;
        const reviewPrompt=`Pergunta: ${latest}\n${contextQuestion?`Enunciado adicional: ${contextQuestion}\n`:''}Resposta preliminar: ${trim(first.answer,1800)}\nResolva independentemente e devolva a resposta final.`;
        const reviewMessages:any[]=[{role:'user',content:image?[{type:'text',text:reviewPrompt},{type:'image',image:imageDataUrl}]:reviewPrompt}];
        const r=await generateText({model:REVIEW_MODEL,system:reviewSystem,messages:reviewMessages,maxOutputTokens:1200,abortSignal:AbortSignal.timeout(45000),providerOptions:{gateway:{models:['google/gemini-3.6-flash'],user:userId,tags:['feature:education-tutor',`exam:${exam}`,'selective-adversarial-review']}}} as any);
        const parsed=parseJson(String(r.text||''));
        if(parsed?.answer){
          const disagreed=parsed.agrees_with_preliminary===false;
          final={...first,...parsed,confidence:disagreed?Math.min(clampConfidence(parsed.confidence),.93):parsed.confidence};
          searchMode='review';
        }
      }catch(e:any){console.warn('adversarial review skipped after failure',e?.statusCode||'',e?.message||e)}
    }

    let answer=trim(final.answer,5000).trim();if(!answer)return json(res,502,{error:'A resposta ficou incompleta. Tente novamente.'});
    if(hasUnexpectedScript(answer)){
      try{
        const cleaned=await generateText({model:REVIEW_MODEL,system:'Reescreva o texto em português do Brasil, usando somente alfabeto latino e matemática em texto simples, sem alterar fatos, números ou conclusão. Não use markdown, LaTeX ou outro alfabeto.',messages:[{role:'user',content:answer}],maxOutputTokens:700,abortSignal:AbortSignal.timeout(30000),providerOptions:{gateway:{models:['google/gemini-3.6-flash'],user:userId,tags:['feature:education-tutor','unexpected-script-repair']}}} as any);
        answer=trim(cleaned.text,5000).trim();
      }catch(e:any){console.warn('unexpected script repair failed',e?.message||e)}
      if(!answer||hasUnexpectedScript(answer))return json(res,502,{error:'A resposta ficou com caracteres inválidos. Tente novamente.'});
    }
    const finalConfidence=clampConfidence(final.confidence??first.confidence);
    const uncertaintyReason=trim(final.uncertainty_reason??first.uncertainty_reason,360).trim()||null;
    const assumptions=textList(final.assumptions??first.assumptions);
    let focus=final.learning_focus&&typeof final.learning_focus==='object'?final.learning_focus:first.learning_focus;
    if(focus){
      const match=candidates.find(s=>s.skill_code===String(focus.skill_code||'')&&s.skill_name===String(focus.skill_name||''));
      if(!match)focus=null;
      else{
        const planCode=String(focus.plan_skill_code||match.parent_skill_code||''),plan=plans.find(s=>s.skill_code===planCode);
        focus={area:match.area,skill_code:match.skill_code,skill_name:match.skill_name,plan_skill_code:plan?.skill_code||null,plan_skill_name:plan?.skill_name||null,confidence:Math.max(0,Math.min(1,Number(focus.confidence)||conf)),reason:trim(focus.reason,300),official_reference:Boolean(match.official_reference)};
      }
    }
    const offerPlan=Boolean(final.offer_plan??first.offer_plan)&&Boolean(focus)&&focus.confidence>=0.68&&Boolean(final.resolved_doubt??first.resolved_doubt);
    fetch(`${cfg.url}/rest/v1/ai_tutor_usage`,{method:'POST',headers:{...baseHeaders,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({user_id:userId,exam_id:exam,has_image:image})}).catch(()=>{});
    return json(res,200,{answer,educational:true,resolvedDoubt:Boolean(final.resolved_doubt??first.resolved_doubt),answerable:Boolean(final.answerable??first.answerable??true),confidence:finalConfidence,confidenceLabel:confidenceLabel(finalConfidence),confidenceReason:trim(final.confidence_reason??first.confidence_reason,260),uncertaintyReason,assumptions,selfChecked:Boolean(final.self_check_passed??first.self_check_passed),learningFocus:focus,offerPlan,needsBetterImage:Boolean(final.needs_better_image??first.needs_better_image),model:searchMode==='google'?SEARCH_MODEL:searchMode==='review'?REVIEW_MODEL:MODEL,searchMode,webVerified:searchMode==='google'&&sources.length>0,sources,costOptimized:true,retrievalGrounded:retrievedExamples.length>0,retrievedExamples:retrievedExamples.length,adminUnlimited,dailyQuestionLimit:adminUnlimited?null:DAILY_QUESTION_LIMIT,remainingQuestions:adminUnlimited?null:Math.max(0,DAILY_QUESTION_LIMIT-usedToday-1)});
  }catch(error:any){console.error('education-tutor failed',error);return json(res,500,{error:'A IA encontrou uma falha inesperada. Tente novamente.'})}
}
