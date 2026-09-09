import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { createClient } from '@supabase/supabase-js';

const GATEWAY_MODELS=['google/gemini-2.5-flash-lite','google/gemini-2.5-flash'] as const;
const DEFAULT_SUPABASE_URL='https://kmognvgnfisdchzffkgh.supabase.co';
const SUPABASE_URL=(process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL||DEFAULT_SUPABASE_URL).replace(/\/$/,'');
const SUPABASE_ANON_KEY=process.env.SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_ANON_KEY||'';
const db=SUPABASE_ANON_KEY?createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}}):null;

function allowedUrl(raw:unknown){
  try{
    const u=new URL(String(raw||''));
    return u.protocol==='https:'&&['download.inep.gov.br','vestibular.cmmg.edu.br','www.fuvest.br','fuvest.br'].includes(u.hostname)&&/\.pdf$/i.test(u.pathname)?u.toString():'';
  }catch{return''}
}
function isInepPdf(sourceUrl:string){try{return new URL(sourceUrl).hostname==='download.inep.gov.br'}catch{return false}}
function parseJson(raw:string){
  const s=raw.trim().replace(/^```json\s*/i,'').replace(/^```\s*/,'').replace(/```$/,'').trim();
  const start=s.indexOf('{');
  if(start<0)return JSON.parse(s);
  let depth=0,inString=false,escaped=false;
  for(let i=start;i<s.length;i++){
    const ch=s[i];
    if(inString){
      if(escaped){escaped=false;continue;}
      if(ch==='\\'){escaped=true;continue;}
      if(ch==='"')inString=false;
      continue;
    }
    if(ch==='"'){inString=true;continue;}
    if(ch==='{')depth++;
    else if(ch==='}'){
      depth--;
      if(depth===0)return JSON.parse(s.slice(start,i+1));
    }
  }
  return JSON.parse(s.slice(start));
}

export function normalizeRequestedQuestion(parsed:any,questionNumber:number){
  const raw=String(parsed?.prompt||'').replace(/\r/g,'').trim();
  const marker=new RegExp(`(?:^|\\n)\\s*0*${questionNumber}\\s*[.)-]\\s+`,'i');
  const found=marker.exec(raw);
  const isolated=found?raw.slice((found.index||0)+found[0].length).trim():raw;
  const lines=isolated.split('\n').map((line)=>line.trim()).filter(Boolean);
  const starts=lines.map((line,index)=>{const m=line.match(/^([A-E])\s*[).:-]\s+(.+)$/i);return m?{index,letter:m[1].toUpperCase(),text:m[2]}:null}).filter(Boolean) as {index:number;letter:string;text:string}[];
  if(starts.length<2)return {...parsed,prompt:isolated};
  const options:Record<string,string|null>={A:null,B:null,C:null,D:null,E:null};
  for(let i=0;i<starts.length;i++){
    const current=starts[i],end=i+1<starts.length?starts[i+1].index:lines.length;
    options[current.letter]=[current.text,...lines.slice(current.index+1,end)].join(' ').trim()||null;
  }
  return {...parsed,prompt:lines.slice(0,starts[0].index).join('\n').trim(),option_a:options.A,option_b:options.B,option_c:options.C,option_d:options.D,option_e:options.E};
}

function normalizeOutputQuestion(parsed:any,questionNumber:number){
  const p=normalizeRequestedQuestion(parsed,questionNumber);
  const optionCount=['option_a','option_b','option_c','option_d','option_e'].filter((key)=>String(p?.[key]||'').trim()).length;
  const found=p?.found!==false&&String(p?.prompt||'').trim().length>10&&optionCount>=2;
  return {
    question_number:questionNumber,
    found,
    prompt:found?String(p.prompt||'').trim():'',
    option_a:found?String(p.option_a||'').trim()||null:null,
    option_b:found?String(p.option_b||'').trim()||null:null,
    option_c:found?String(p.option_c||'').trim()||null:null,
    option_d:found?String(p.option_d||'').trim()||null:null,
    option_e:found?String(p.option_e||'').trim()||null:null,
    needs_source_image:Boolean(p?.needs_source_image),
    image_note:p?.image_note?String(p.image_note).slice(0,500):null,
    source_page:Number.isInteger(Number(p?.source_page))&&Number(p.source_page)>0?Number(p.source_page):undefined,
    confidence:Math.max(0,Math.min(.99,Number(p?.confidence)||0)),
    source:'official-exam-pdf'
  };
}

async function storedEnemQuestion(sourceUrl:string,questionNumber:number){
  if(!db)return null;
  try{
    const {data,error}=await db
      .from('official_vestibular_question_bank_v2')
      .select('prompt_text,option_a,option_b,option_c,option_d,option_e,source_page,image_url,image_alt')
      .eq('series_id','enem')
      .eq('source_pdf_url',sourceUrl)
      .eq('question_number',questionNumber)
      .maybeSingle();
    if(error||!data)return null;
    const prompt=String(data.prompt_text||'').trim();
    const options=[data.option_a,data.option_b,data.option_c,data.option_d,data.option_e];
    if(prompt.length<12||options.filter(Boolean).length<2)return null;
    const visualCue=/\b(figura|imagem|gr[aá]fico|tabela|mapa|esquema|fotografia|charge|tirinha|diagrama|cartum|quadrinho|ilustra[cç][aã]o)\b/i.test([prompt,...options].filter(Boolean).join(' '));
    return {
      question_number:questionNumber,
      found:true,
      prompt,
      option_a:data.option_a||null,
      option_b:data.option_b||null,
      option_c:data.option_c||null,
      option_d:data.option_d||null,
      option_e:data.option_e||null,
      needs_source_image:Boolean(data.image_url||data.image_alt||visualCue),
      image_note:data.image_alt||(visualCue?'Esta questão contém elemento visual da prova oficial.':null),
      source_page:Number.isInteger(Number(data.source_page))&&Number(data.source_page)>0?Number(data.source_page):undefined,
      confidence:1,
      source:'stored-enem-question'
    };
  }catch(error:any){
    console.warn('stored ENEM lookup failed',error?.message||error);
    return null;
  }
}

const reply=(res:any,status:number,body:any)=>{res.setHeader('Cache-Control',status===200?'public, s-maxage=2592000, stale-while-revalidate=7776000':'no-store');return res.status(status).json(body)};

async function generateOnce(model:any,args:{prompt:string;sourceUrl:string;maxOutputTokens:number;timeoutMs:number;exam:string;tag:string},gateway=false){
  return generateText({
    model,
    messages:[{role:'user',content:[{type:'text',text:args.prompt},{type:'file',mediaType:'application/pdf',data:args.sourceUrl}]}],
    maxOutputTokens:args.maxOutputTokens,
    abortSignal:AbortSignal.timeout(args.timeoutMs),
    ...(gateway?{providerOptions:{gateway:{tags:[args.tag,`exam:${args.exam.toLowerCase()||'unknown'}`]}}}:{}),
  } as any);
}

async function runModel(args:{prompt:string;sourceUrl:string;maxOutputTokens:number;timeoutMs:number;exam:string;tag:string}){
  const errors:string[]=[];

  if(process.env.GOOGLE_GENERATIVE_AI_API_KEY){
    for(const directModel of ['gemini-2.5-flash-lite','gemini-2.5-flash'] as const){
      try{
        const out=await generateOnce(google(directModel),args,false);
        if(String(out.text||'').trim())return out;
        errors.push(`google-direct/${directModel}: resposta vazia`);
      }catch(error:any){
        errors.push(`google-direct/${directModel}: ${String(error?.message||error).slice(0,220)}`);
        console.warn('official-question direct model attempt failed',directModel,error?.message||error);
      }
    }
  }

  for(const model of GATEWAY_MODELS){
    try{
      const out=await generateOnce(model,args,true);
      if(String(out.text||'').trim())return out;
      errors.push(`${model}: resposta vazia`);
    }catch(error:any){
      errors.push(`${model}: ${String(error?.message||error).slice(0,220)}`);
      console.warn('official-question gateway model attempt failed',model,error?.message||error);
    }
  }
  throw new Error(`Todos os provedores falharam: ${errors.join(' | ')}`);
}

async function runJson(args:{prompt:string;sourceUrl:string;maxOutputTokens:number;timeoutMs:number;exam:string;tag:string}){
  let lastError:unknown=null;
  for(let attempt=0;attempt<2;attempt++){
    try{
      const out=await runModel({...args,prompt:attempt?`${args.prompt}\nA resposta anterior ficou com JSON inválido. Gere novamente, sem quebras de linha dentro das strings e sem texto fora do objeto JSON.`:args.prompt});
      return parseJson(String(out.text||''));
    }catch(error){lastError=error;console.warn('official-question JSON attempt failed',attempt+1,error instanceof Error?error.message:error)}
  }
  throw lastError;
}

export default async function handler(req:any,res:any){
  if(!['GET','POST'].includes(req.method))return reply(res,405,{error:'Método não permitido.'});
  try{
    const input=req.method==='GET'?req.query:req.body;
    const mode=String(input?.mode||'question');
    const sourceUrl=allowedUrl(input?.sourceUrl);
    const questionNumber=Math.max(1,Math.min(250,Number(input?.questionNumber)||0));
    const fromQuestion=Math.max(1,Math.min(250,Number(input?.fromQuestion)||0));
    const requestedTo=Math.max(1,Math.min(250,Number(input?.toQuestion)||0));
    const toQuestion=Math.min(fromQuestion+7,requestedTo||fromQuestion+7);
    const exam=String(input?.exam||'').slice(0,80);
    const year=Number(input?.year)||null;
    if(!sourceUrl)return reply(res,400,{error:'Fonte oficial inválida.'});

    // INEP blocks/fails intermittently from cloud serverless networks. For ENEM
    // questions already materialized in our structured bank, serve the faithful
    // stored text first and reserve AI/PDF extraction only for genuinely missing rows.
    if(mode==='question'&&isInepPdf(sourceUrl)&&questionNumber){
      const stored=await storedEnemQuestion(sourceUrl,questionNumber);
      if(stored)return reply(res,200,stored);
    }

    if(mode==='batch'){
      if(!fromQuestion||toQuestion<fromQuestion)return reply(res,400,{error:'Intervalo de questões inválido.'});
      const prompt=`Você está lendo uma PROVA OFICIAL${year?` da edição ${year}`:''}${exam?` de ${exam}`:''}. Extraia SOMENTE as questões objetivas de ${fromQuestion} a ${toQuestion}, inclusive.

Regras obrigatórias:
1) Para cada número solicitado, preserve fielmente o enunciado necessário para resolver e as alternativas A, B, C, D e E exatamente como aparecem quando existirem.
2) Não misture textos, alternativas ou imagens de questões diferentes.
3) Inclua textos auxiliares indispensáveis da própria questão. Se uma imagem/gráfico for indispensável e não puder ser convertido com fidelidade, marque needs_source_image=true, descreva em image_note o que precisa ser exibido e informe source_page (página do PDF, começando em 1). Não invente valores.
4) Ignore instruções gerais da prova e qualquer questão fora do intervalo.
5) Não resolva, não indique gabarito e não acrescente explicações.
6) Se um número não puder ser localizado com segurança, devolva found=false para ele.

Retorne APENAS JSON válido neste formato: {"questions":[{"question_number":${fromQuestion},"found":true,"prompt":"...","option_a":"...","option_b":"...","option_c":"...","option_d":"...","option_e":"...","needs_source_image":false,"image_note":null,"source_page":1,"confidence":0.0}]}. Inclua um objeto para CADA número de ${fromQuestion} a ${toQuestion}.`;
      const parsed=await runJson({prompt,sourceUrl,maxOutputTokens:16000,timeoutMs:90000,exam,tag:'feature:official-question-batch'});
      const raw=Array.isArray(parsed?.questions)?parsed.questions:[];
      const questions=[];
      for(let n=fromQuestion;n<=toQuestion;n++){
        const candidate=raw.find((q:any)=>Number(q?.question_number)===n)||{found:false,prompt:''};
        questions.push(normalizeOutputQuestion(candidate,n));
      }
      return reply(res,200,{questions,from_question:fromQuestion,to_question:toQuestion,source:'official-exam-pdf-batch'});
    }

    if(!questionNumber)return reply(res,400,{error:'Número da questão inválido.'});

    if(mode==='answer'){
      const prompt=`Leia APENAS o gabarito oficial anexado. Localize a questão ${questionNumber}${year?` da edição ${year}`:''}${exam?` de ${exam}`:''}. Retorne somente JSON válido no formato {"correct_option":"A|B|C|D|E|null","confidence":0.0}. Não invente resposta: se a numeração não puder ser localizada com segurança, use null.`;
      const parsed=await runJson({prompt,sourceUrl,maxOutputTokens:300,timeoutMs:45000,exam,tag:'feature:official-question-answer'});
      const option=/^[A-E]$/.test(String(parsed.correct_option||'').toUpperCase())?String(parsed.correct_option).toUpperCase():null;
      return reply(res,200,{correct_option:option,confidence:Math.max(0,Math.min(.99,Number(parsed.confidence)||0)),source:'official-answer-key'});
    }

    const prompt=`Você está lendo uma PROVA OFICIAL. Extraia somente a questão número ${questionNumber}${year?` da edição ${year}`:''}${exam?` de ${exam}`:''}.

Regras obrigatórias:
1) Preserve fielmente o sentido e os dados da questão; não resolva e não indique o gabarito.
2) Retorne o enunciado necessário para resolver e as alternativas A, B, C, D e E exatamente como aparecem quando existirem.
3) Inclua textos auxiliares indispensáveis da própria questão (títulos de tabela, legenda, descrição textual curta de figura). Se uma imagem/gráfico for indispensável e não puder ser convertido com fidelidade, marque needs_source_image=true, descreva em image_note o que precisa ser exibido e informe source_page (número da página do PDF, começando em 1); não invente valores.
4) Ignore instruções gerais da prova e outras questões.
5) Se não localizar a questão com segurança, found=false.
6) Não inclua resposta correta, comentário ou solução.

Retorne APENAS JSON válido: {"found":true,"prompt":"...","option_a":"...","option_b":"...","option_c":"...","option_d":"...","option_e":"...","needs_source_image":false,"image_note":null,"source_page":1,"confidence":0.0}.`;
    const generated=await runJson({prompt,sourceUrl,maxOutputTokens:2600,timeoutMs:60000,exam,tag:'feature:official-question-extract'});
    return reply(res,200,normalizeOutputQuestion(generated,questionNumber));
  }catch(error:any){
    console.error('extract-official-question failed',error?.message||error);
    return reply(res,503,{error:'A questão oficial está temporariamente indisponível. Tente novamente em alguns segundos.'});
  }
}