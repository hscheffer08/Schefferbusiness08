/* eslint-disable @typescript-eslint/no-explicit-any */
type EnemAlternative={letter?:string;text?:string;file?:string|null;isCorrect?:boolean};
type EnemQuestion={index?:number;year?:number;language?:string|null;context?:string|null;files?:string[];correctAlternative?:string|null;alternativesIntroduction?:string|null;alternatives?:EnemAlternative[]};

const SUPPORTED_YEARS=new Set([2019,2020,2021,2022,2023]);
const PAGE_OFFSETS=[0,50,100,150] as const;

function n(v:unknown,min:number,max:number,fallback:number){const x=Number(v);return Number.isFinite(x)?Math.max(min,Math.min(max,Math.trunc(x))):fallback}
function safeImage(raw:unknown){try{const url=new URL(String(raw||''));return url.protocol==='https:'&&['enem.dev','www.enem.dev'].includes(url.hostname)&&/\.(?:png|jpe?g|webp|gif)$/i.test(url.pathname)?url.toString():''}catch{return''}}
function cleanMarkdown(raw:unknown){return String(raw||'').replace(/!\[[^\]]*\]\([^)]+\)/g,'').replace(/\[([^\]]+)\]\([^)]+\)/g,'$1').replace(/\*\*([^*]+)\*\*/g,'$1').replace(/__([^_]+)__/g,'$1').replace(/\r/g,'').replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim()}

export function normalizeEnemQuestion(question:EnemQuestion){
  const alternatives=(question.alternatives||[]).filter(a=>/^[A-E]$/i.test(String(a.letter||'')));
  const byLetter=Object.fromEntries(alternatives.map(a=>[String(a.letter).toUpperCase(),String(a.text||'').trim()||null]));
  const optionImages=Object.fromEntries(alternatives.map(a=>[String(a.letter).toUpperCase(),safeImage(a.file)]).filter(([,url])=>url));
  const images=(question.files||[]).map(safeImage).filter(Boolean);
  const uniqueImages=[...new Set(images)];
  const prompt=[cleanMarkdown(question.context),cleanMarkdown(question.alternativesIntroduction)].filter(Boolean).join('\n\n');
  const correct=String(question.correctAlternative||alternatives.find(a=>a.isCorrect)?.letter||'').toUpperCase();
  const complete=prompt.length>10&&['A','B','C','D','E'].every(letter=>String(byLetter[letter]||'').trim());
  return {found:complete,prompt:complete?prompt:'',option_a:complete?byLetter.A:null,option_b:complete?byLetter.B:null,option_c:complete?byLetter.C:null,option_d:complete?byLetter.D:null,option_e:complete?byLetter.E:null,correct_option:complete&&/^[A-E]$/.test(correct)?correct:null,images:uniqueImages,option_images:optionImages,needs_source_image:uniqueImages.length>0,image_note:uniqueImages.length?'Os elementos visuais originais aparecem abaixo, na ordem da questão.':null,confidence:complete?1:0,source:'enem-dev-structured-mirror'};
}

async function fetchPage(year:number,offset:number){
  let last='';
  for(let attempt=0;attempt<2;attempt++){
    try{const response=await fetch(`https://api.enem.dev/v1/exams/${year}/questions?limit=50&offset=${offset}`,{headers:{Accept:'application/json','User-Agent':'Conectae/1.0'},signal:AbortSignal.timeout(18000)});const body=await response.text();if(!response.ok){last=`HTTP ${response.status}`;continue}const parsed=JSON.parse(body);if(Array.isArray(parsed?.questions))return parsed.questions as EnemQuestion[];last='resposta sem questões'}catch(error:any){last=String(error?.message||error)}
  }
  throw new Error(`Falha ao consultar o lote ${offset}: ${last}`);
}

export default async function handler(req:any,res:any){
  if(req.method!=='GET')return res.status(405).json({error:'Método não permitido.'});
  const requestedYear=Number(req.query?.year);
  const year=Number.isFinite(requestedYear)?Math.trunc(requestedYear):2023;
  const questionNumber=n(req.query?.question,1,180,1);
  if(!SUPPORTED_YEARS.has(year))return res.status(400).json({found:false,error:'Esta edição usa a extração direta do PDF oficial.'});
  try{
    const settled=await Promise.allSettled(PAGE_OFFSETS.map(offset=>fetchPage(year,offset)));
    const rows=settled.flatMap(result=>result.status==='fulfilled'?result.value:[]);
    const candidates=rows.filter(row=>Number(row.index)===questionNumber);
    const chosen=questionNumber<=5?candidates.find(row=>String(row.language||'').toLowerCase()==='ingles')||candidates.find(row=>!row.language)||candidates[0]:candidates.find(row=>!row.language)||candidates[0];
    if(!chosen)return res.status(404).json({found:false,error:'Questão não localizada com segurança.'});
    const normalized=normalizeEnemQuestion(chosen);if(!normalized.found)return res.status(422).json({found:false,error:'Questão incompleta na fonte estruturada.'});
    res.setHeader('Cache-Control','public, s-maxage=2592000, stale-while-revalidate=7776000');return res.status(200).json(normalized);
  }catch(error:any){console.error('enem-official-questions failed',error?.message||error);return res.status(502).json({found:false,error:'Não consegui carregar esta questão do ENEM agora.'})}
}
