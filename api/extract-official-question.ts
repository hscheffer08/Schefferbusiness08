import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

const GATEWAY_MODELS=['google/gemini-2.5-flash-lite','google/gemini-2.5-flash'] as const;

function allowedUrl(raw:unknown){
  try{
    const u=new URL(String(raw||''));
    return u.protocol==='https:'&&['download.inep.gov.br','vestibular.cmmg.edu.br'].includes(u.hostname)&&/\.pdf$/i.test(u.pathname)?u.toString():'';
  }catch{return''}
}
function parseJson(raw:string){
  const s=raw.trim().replace(/^```json\s*/i,'').replace(/^```\s*/,'').replace(/```$/,'').trim();
  const a=s.indexOf('{'),b=s.lastIndexOf('}');
  return JSON.parse(a>=0&&b>a?s.slice(a,b+1):s);
}
const reply=(res:any,status:number,body:any)=>{res.setHeader('Cache-Control','no-store');return res.status(status).json(body)};

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

export default async function handler(req:any,res:any){
  if(req.method!=='POST')return reply(res,405,{error:'Método não permitido.'});
  try{
    const mode=String(req.body?.mode||'question');
    const sourceUrl=allowedUrl(req.body?.sourceUrl);
    const questionNumber=Math.max(1,Math.min(250,Number(req.body?.questionNumber)||0));
    const exam=String(req.body?.exam||'').slice(0,80);
    const year=Number(req.body?.year)||null;
    if(!sourceUrl||!questionNumber)return reply(res,400,{error:'Fonte oficial ou número da questão inválido.'});

    if(mode==='answer'){
      const prompt=`Leia APENAS o gabarito oficial anexado. Localize a questão ${questionNumber}${year?` da edição ${year}`:''}${exam?` de ${exam}`:''}. Retorne somente JSON válido no formato {"correct_option":"A|B|C|D|E|null","confidence":0.0}. Não invente resposta: se a numeração não puder ser localizada com segurança, use null.`;
      const out=await runModel({prompt,sourceUrl,maxOutputTokens:300,timeoutMs:45000,exam,tag:'feature:official-question-answer'});
      const parsed=parseJson(String(out.text||''));
      const option=/^[A-E]$/.test(String(parsed.correct_option||'').toUpperCase())?String(parsed.correct_option).toUpperCase():null;
      return reply(res,200,{correct_option:option,confidence:Math.max(0,Math.min(.99,Number(parsed.confidence)||0)),source:'official-answer-key'});
    }

    const prompt=`Você está lendo uma PROVA OFICIAL. Extraia somente a questão número ${questionNumber}${year?` da edição ${year}`:''}${exam?` de ${exam}`:''}.

Regras obrigatórias:
1) Preserve fielmente o sentido e os dados da questão; não resolva e não indique o gabarito.
2) Retorne o enunciado necessário para resolver e as alternativas A, B, C, D e E exatamente como aparecem quando existirem.
3) Inclua textos auxiliares indispensáveis da própria questão (títulos de tabela, legenda, descrição textual curta de figura). Se uma imagem/gráfico for indispensável e não puder ser convertido com fidelidade, marque needs_source_image=true e descreva em image_note o que precisa ser exibido; não invente valores.
4) Ignore instruções gerais da prova e outras questões.
5) Se não localizar a questão com segurança, found=false.
6) Não inclua resposta correta, comentário ou solução.

Retorne APENAS JSON válido: {"found":true,"prompt":"...","option_a":"...","option_b":"...","option_c":"...","option_d":"...","option_e":"...","needs_source_image":false,"image_note":null,"confidence":0.0}.`;
    const out=await runModel({prompt,sourceUrl,maxOutputTokens:2600,timeoutMs:60000,exam,tag:'feature:official-question-extract'});
    const p=parseJson(String(out.text||''));
    const optionCount=['option_a','option_b','option_c','option_d','option_e'].filter((key)=>String(p[key]||'').trim()).length;
    const found=p.found!==false&&String(p.prompt||'').trim().length>10&&optionCount>=2;
    return reply(res,200,{
      found,
      prompt:found?String(p.prompt||'').trim():'',
      option_a:found?String(p.option_a||'').trim()||null:null,
      option_b:found?String(p.option_b||'').trim()||null:null,
      option_c:found?String(p.option_c||'').trim()||null:null,
      option_d:found?String(p.option_d||'').trim()||null:null,
      option_e:found?String(p.option_e||'').trim()||null:null,
      needs_source_image:Boolean(p.needs_source_image),
      image_note:p.image_note?String(p.image_note).slice(0,500):null,
      confidence:Math.max(0,Math.min(.99,Number(p.confidence)||0)),
      source:'official-exam-pdf'
    });
  }catch(error:any){
    console.error('extract-official-question failed',error?.message||error);
    return reply(res,503,{error:'A questão oficial está temporariamente indisponível. Tente novamente em alguns segundos.'});
  }
}
