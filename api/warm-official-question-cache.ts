import { createClient } from '@supabase/supabase-js';
import { extractOfficialQuestionServer } from './_official-pdf-server.js';

const SUPABASE_URL='https://kmognvgnfisdchzffkgh.supabase.co';
const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttb2dudmduZmlzZGNoemZma2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MzkxNjksImV4cCI6MjEwMjMxNTE2OX0.JarpsXfgv8PplL3Ryvs6iFfEPiv_rnp2Cx5i1I67fCk';
const supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const ALLOWED_SERIES=new Set(['enem','cmmg','fuvest']);
const VERSION='2026-09-11-v6';
const CONTROL=/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/;
const CMMG_GARBLED=/~|[a-záéíóúçãõ]{2,}[IKWFXJ]\b|\b(?:pbjbpqob|xK{2,}z|Eaispon[ií]vel|fnicialmente|ganeiro|maulo|kunca|jartin|oKoK)\b/i;

type Ref={question_id:string;series_id:string;year:number;question_number:number;source_pdf_url:string|null;answer_key_url:string|null;correct_option:string|null;prompt_text:string|null;option_a:string|null;option_b:string|null;option_c:string|null;option_d:string|null;option_e:string|null};

function baseUrl(req:any){
  const host=String(req.headers?.['x-forwarded-host']||req.headers?.host||'businessschoolfit.vercel.app');
  const proto=String(req.headers?.['x-forwarded-proto']||'https');
  return `${proto}://${host}`;
}
function usable(q:Ref){
  const options=[q.option_a,q.option_b,q.option_c,q.option_d,q.option_e].filter(v=>String(v||'').trim()).length;
  const content=[q.prompt_text,q.option_a,q.option_b,q.option_c,q.option_d,q.option_e].filter(Boolean).join(' ');
  if(String(q.prompt_text||'').trim().length<=10||options<2)return false;
  if(CONTROL.test(content))return false;
  if(q.series_id==='cmmg'&&CMMG_GARBLED.test(content))return false;
  return true;
}
async function getJson(url:string,init?:RequestInit){
  const r=await fetch(url,{...init,signal:AbortSignal.timeout(75000)});
  const text=await r.text();let data:any={};
  try{data=JSON.parse(text)}catch{throw new Error(`JSON inválido (${r.status})`)}
  if(!r.ok)throw new Error(data?.error||`HTTP ${r.status}`);
  return data;
}
async function extractOne(req:any,q:Ref,allowRemote:boolean){
  const root=baseUrl(req);let d:any=null;const errors:string[]=[];
  if(q.series_id==='enem'&&q.year>=2019&&q.year<=2023){
    try{d=await getJson(`${root}/api/enem-official-questions?year=${q.year}&question=${q.question_number}`)}catch(e:any){errors.push(`structured: ${String(e?.message||e)}`)}
  }
  if(!d?.found&&q.source_pdf_url){
    try{d=await extractOfficialQuestionServer(q.source_pdf_url,q.question_number)}catch(e:any){errors.push(`local: ${String(e?.message||e)}`)}
  }
  if(!d?.found&&allowRemote&&q.source_pdf_url){
    try{d=await getJson(`${root}/api/extract-official-question`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({mode:'question',sourceUrl:q.source_pdf_url,questionNumber:q.question_number,exam:q.series_id.toUpperCase(),year:q.year,extractorVersion:VERSION})})}catch(e:any){errors.push(`remote: ${String(e?.message||e)}`)}
  }
  if(!d?.found||String(d.prompt||'').trim().length<10)throw new Error(errors.join(' | ')||'Extração incompleta');
  const options=[d.option_a,d.option_b,d.option_c,d.option_d,d.option_e].filter((v:any)=>String(v||'').trim()).length;
  const content=[d.prompt,d.option_a,d.option_b,d.option_c,d.option_d,d.option_e].filter(Boolean).join(' ');
  if(options<2)throw new Error('Alternativas incompletas');
  if(CONTROL.test(content))throw new Error('Extração contém caracteres de controle');
  if(q.series_id==='cmmg'&&CMMG_GARBLED.test(content))throw new Error('Extração CMMG corrompida pela fonte do PDF');
  const needsImage=Boolean(d.needs_source_image||d.images?.length||Object.keys(d.option_images||{}).length);
  const imageNote=d.image_note?String(d.image_note).slice(0,500):null;
  const update={prompt_text:String(d.prompt||'').trim(),option_a:d.option_a?String(d.option_a).trim():null,option_b:d.option_b?String(d.option_b).trim():null,option_c:d.option_c?String(d.option_c).trim():null,option_d:d.option_d?String(d.option_d).trim():null,option_e:d.option_e?String(d.option_e).trim():null,source_page:Number.isInteger(Number(d.source_page))&&Number(d.source_page)>0?Number(d.source_page):null,image_url:Array.isArray(d.images)&&d.images[0]?String(d.images[0]):null,image_alt:needsImage?(imageNote||'Esta questão usa um elemento visual da prova oficial.'):null};
  const saved=await supabase.from('official_exam_items').update(update).eq('id',q.question_id).select('id').maybeSingle();
  if(saved.error)throw new Error(`Banco: ${saved.error.message}`);
  if(!saved.data)throw new Error('Banco não confirmou atualização');
  return {question_id:q.question_id,year:q.year,question_number:q.question_number,source:String(d.source||'unknown'),needs_image:needsImage,source_page:update.source_page};
}
async function pool<T,R>(items:T[],size:number,fn:(item:T)=>Promise<R>){
  const out:Array<{ok:true;value:R}|{ok:false;error:string}>=[];let next=0;
  await Promise.all(Array.from({length:Math.min(size,items.length)},async()=>{while(true){const i=next++;if(i>=items.length)return;try{out[i]={ok:true,value:await fn(items[i])}}catch(e:any){out[i]={ok:false,error:String(e?.message||e)}}}}));
  return out;
}

export default async function handler(req:any,res:any){
  if(req.method!=='GET'&&req.method!=='POST')return res.status(405).json({error:'Método não permitido.'});
  const input=req.method==='POST'?req.body:req.query;
  const series=String(input?.series||'enem').toLowerCase();
  if(!ALLOWED_SERIES.has(series))return res.status(400).json({error:'Série inválida.'});
  const offset=Math.max(0,Math.trunc(Number(input?.offset)||0));
  const limit=Math.max(1,Math.min(80,Math.trunc(Number(input?.limit)||30)));
  const concurrency=Math.max(1,Math.min(10,Math.trunc(Number(input?.concurrency)||4)));
  const force=String(input?.force||'')==='1';
  const allowRemote=String(input?.remote||'')==='1';
  try{
    const {data,error}=await supabase.from('official_vestibular_question_bank').select('question_id,series_id,year,question_number,source_pdf_url,answer_key_url,correct_option,prompt_text,option_a,option_b,option_c,option_d,option_e').eq('series_id',series).order('year',{ascending:false}).order('question_number',{ascending:true}).range(offset,offset+limit-1);
    if(error)throw error;
    const refs=(data||[]) as Ref[];
    if(!refs.length)return res.status(200).json({series,offset,limit,processed:0,success:0,failed:0,done:true});
    const pending=force?refs:refs.filter(q=>!usable(q));
    const results=await pool(pending,concurrency,(q)=>extractOne(req,q,allowRemote));
    const success=results.filter(x=>x?.ok).length;
    const failures=results.flatMap((x,i)=>x&&'error' in x?[{question_id:pending[i]?.question_id,year:pending[i]?.year,question_number:pending[i]?.question_number,error:x.error}]:[]);
    const sources=results.flatMap(x=>x&&'value' in x?[x.value.source]:[]).reduce((acc:Record<string,number>,source)=>{acc[source]=(acc[source]||0)+1;return acc},{});
    res.setHeader('Cache-Control','no-store');
    return res.status(200).json({series,offset,limit,rows:refs.length,skipped:refs.length-pending.length,processed:pending.length,success,failed:failures.length,sources,failures,done:refs.length<limit,next_offset:offset+refs.length});
  }catch(e:any){console.error('warm-official-question-cache failed',e?.message||e);return res.status(500).json({error:String(e?.message||e)})}
}
