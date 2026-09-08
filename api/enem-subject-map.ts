import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

const GATEWAY_MODELS=['google/gemini-2.5-flash-lite','google/gemini-2.5-flash'] as const;
const AREAS={
  Linguagens:{start:1,end:45,subjects:['Língua Portuguesa','Literatura','Artes','Educação Física','Língua Estrangeira','Tecnologias da Comunicação']},
  Humanas:{start:46,end:90,subjects:['História','Geografia','Filosofia','Sociologia']},
  Natureza:{start:91,end:135,subjects:['Biologia','Física','Química']},
  Matemática:{start:136,end:180,subjects:['Matemática']},
} as const;

type Area=keyof typeof AREAS;

function allowedUrl(raw:unknown){
  try{
    const url=new URL(String(raw||''));
    return url.protocol==='https:'&&url.hostname==='download.inep.gov.br'&&/\.pdf$/i.test(url.pathname)?url.toString():'';
  }catch{return''}
}
function parseJson(raw:string){
  const clean=raw.trim().replace(/^```json\s*/i,'').replace(/^```\s*/,'').replace(/```$/,'').trim();
  const a=clean.indexOf('{'),b=clean.lastIndexOf('}');
  return JSON.parse(a>=0&&b>a?clean.slice(a,b+1):clean);
}
async function generateOnce(model:any,args:{prompt:string;sourceUrl:string;timeoutMs:number},gateway=false){
  return generateText({
    model,
    messages:[{role:'user',content:[{type:'text',text:args.prompt},{type:'file',mediaType:'application/pdf',data:args.sourceUrl}]}],
    maxOutputTokens:4200,
    abortSignal:AbortSignal.timeout(args.timeoutMs),
    ...(gateway?{providerOptions:{gateway:{tags:['feature:enem-subject-map']}}}:{}),
  } as any);
}
async function runModel(prompt:string,sourceUrl:string){
  const errors:string[]=[];
  if(process.env.GOOGLE_GENERATIVE_AI_API_KEY){
    for(const direct of ['gemini-2.5-flash-lite','gemini-2.5-flash'] as const){
      try{const out=await generateOnce(google(direct),{prompt,sourceUrl,timeoutMs:70000});if(String(out.text||'').trim())return out.text;errors.push(`direct/${direct}: vazio`)}catch(error:any){errors.push(`direct/${direct}: ${String(error?.message||error).slice(0,180)}`)}
    }
  }
  for(const model of GATEWAY_MODELS){
    try{const out=await generateOnce(model,{prompt,sourceUrl,timeoutMs:70000},true);if(String(out.text||'').trim())return out.text;errors.push(`${model}: vazio`)}catch(error:any){errors.push(`${model}: ${String(error?.message||error).slice(0,180)}`)}
  }
  throw new Error(errors.join(' | '));
}

export default async function handler(req:any,res:any){
  if(req.method!=='GET')return res.status(405).json({error:'Método não permitido.'});
  const year=Math.trunc(Number(req.query?.year));
  const area=String(req.query?.area||'') as Area;
  const sourceUrl=allowedUrl(req.query?.sourceUrl);
  if(year<2019||year>2025||!AREAS[area]||!sourceUrl)return res.status(400).json({error:'Ano, componente ou fonte oficial inválidos.'});

  const cfg=AREAS[area];
  if(area==='Matemática'){
    const subjects=Object.fromEntries(Array.from({length:cfg.end-cfg.start+1},(_,i)=>[String(cfg.start+i),'Matemática']));
    res.setHeader('Cache-Control','public, s-maxage=31536000, stale-while-revalidate=31536000');
    return res.status(200).json({year,area,subjects,source:'deterministic'});
  }

  try{
    const prompt=`Você está lendo o caderno OFICIAL do ENEM ${year}. Classifique cada questão do componente ${area} por sua MATÉRIA ESCOLAR predominante.

Questões a classificar: ${cfg.start} até ${cfg.end}.
Matérias permitidas, e somente estas: ${cfg.subjects.join(', ')}.

Regras obrigatórias:
1) Classifique TODAS as questões de ${cfg.start} a ${cfg.end}, uma única vez cada.
2) Use a matéria central necessária para resolver a questão, não apenas o tema do texto-base.
3) Não invente matérias fora da lista permitida.
4) Em Linguagens, use “Língua Estrangeira” para as questões de idioma estrangeiro; use Literatura quando a competência principal for análise literária; Artes para artes visuais, música, teatro ou dança; Educação Física para práticas corporais/esporte; Tecnologias da Comunicação quando o foco principal for mídia/tecnologia de comunicação; nos demais casos use Língua Portuguesa.
5) Em Humanas, escolha entre História, Geografia, Filosofia e Sociologia pelo conhecimento predominante exigido.
6) Em Natureza, escolha entre Biologia, Física e Química pelo conhecimento predominante exigido.
7) Retorne APENAS JSON válido no formato {"subjects":{"${cfg.start}":"...","${cfg.start+1}":"..."}}. Não inclua explicações.`;
    const raw=await runModel(prompt,sourceUrl);
    const parsed=parseJson(String(raw||''));
    const input=parsed?.subjects&&typeof parsed.subjects==='object'?parsed.subjects:{};
    const allowed=new Set<string>(cfg.subjects as readonly string[]);
    const subjects:Record<string,string>={};
    for(let n=cfg.start;n<=cfg.end;n++){
      const value=String(input[String(n)]||'').trim();
      if(!allowed.has(value))throw new Error(`Classificação inválida na questão ${n}.`);
      subjects[String(n)]=value;
    }
    res.setHeader('Cache-Control','public, s-maxage=31536000, stale-while-revalidate=31536000');
    return res.status(200).json({year,area,subjects,source:'official-pdf-classification'});
  }catch(error:any){
    console.error('enem-subject-map failed',error?.message||error);
    return res.status(503).json({error:'Não consegui organizar as matérias oficiais do ENEM agora.'});
  }
}
