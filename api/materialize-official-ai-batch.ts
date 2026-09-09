import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL='https://kmognvgnfisdchzffkgh.supabase.co';
const SUPABASE_ANON_KEY=process.env.SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_ANON_KEY||'';
const supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const ALLOWED_HOSTS=new Set(['download.inep.gov.br','vestibular.cmmg.edu.br','www.fuvest.br','fuvest.br']);
function allowed(raw:unknown){try{const u=new URL(String(raw||''));return u.protocol==='https:'&&ALLOWED_HOSTS.has(u.hostname)&&/\.pdf$/i.test(u.pathname)?u.toString():''}catch{return''}}
function root(req:any){const host=String(req.headers?.['x-forwarded-host']||req.headers?.host||'businessschoolfit.vercel.app');return `https://${host}`}
function usable(q:any){return q?.found!==false&&String(q?.prompt||'').trim().length>10&&['option_a','option_b','option_c','option_d','option_e'].filter(k=>String(q?.[k]||'').trim()).length>=2}
async function extract(req:any,args:Record<string,string>){const params=new URLSearchParams({...args,nonce:`${Date.now()}-${Math.random()}`});const r=await fetch(`${root(req)}/api/extract-official-question?${params}`,{signal:AbortSignal.timeout(110000)});const text=await r.text();let payload:any={};try{payload=JSON.parse(text)}catch{throw new Error(`Resposta inválida da extração (${r.status})`)}if(!r.ok)throw new Error(payload?.error||`Extração HTTP ${r.status}`);return payload;}
async function save(ref:any,q:any){const update={prompt_text:String(q.prompt).trim(),option_a:q.option_a?String(q.option_a).trim():null,option_b:q.option_b?String(q.option_b).trim():null,option_c:q.option_c?String(q.option_c).trim():null,option_d:q.option_d?String(q.option_d).trim():null,option_e:q.option_e?String(q.option_e).trim():null,source_page:Number.isInteger(Number(q.source_page))&&Number(q.source_page)>0?Number(q.source_page):null,image_alt:q.needs_source_image?String(q.image_note||'Esta questão usa um elemento visual da prova oficial.').slice(0,500):null};const u=await supabase.from('official_exam_items').update(update).eq('id',ref.question_id).select('id').maybeSingle();if(u.error||!u.data)throw new Error(u.error?.message||'Banco não confirmou atualização');}
export default async function handler(req:any,res:any){
  if(req.method!=='GET'&&req.method!=='POST')return res.status(405).json({error:'Método não permitido.'});
  const input=req.method==='POST'?req.body:req.query,series=String(input?.series||'').toLowerCase(),sourceUrl=allowed(input?.sourceUrl),from=Math.max(1,Math.min(250,Math.trunc(Number(input?.from)||0))),requestedTo=Math.max(from,Math.min(250,Math.trunc(Number(input?.to)||from+3))),to=Math.min(from+3,requestedTo);
  if(!['enem','cmmg','fuvest'].includes(series)||!sourceUrl||!from)return res.status(400).json({error:'Parâmetros inválidos.'});
  if(!SUPABASE_ANON_KEY)return res.status(500).json({error:'Supabase key ausente no ambiente.'});
  try{
    const refs=await supabase.from('official_vestibular_question_bank').select('question_id,series_id,year,question_number,source_pdf_url,prompt_text,option_a,option_b,option_c,option_d,option_e').eq('series_id',series).eq('source_pdf_url',sourceUrl).gte('question_number',from).lte('question_number',to).order('question_number');if(refs.error)throw refs.error;const rows=(refs.data||[]) as any[];
    if(!rows.length)return res.status(404).json({error:'Nenhuma questão encontrada nesse intervalo.'});const pending=rows.filter(q=>!usable({found:true,prompt:q.prompt_text,option_a:q.option_a,option_b:q.option_b,option_c:q.option_c,option_d:q.option_d,option_e:q.option_e}));if(!pending.length)return res.status(200).json({series,from,to,skipped:rows.length,saved:0,failed:0,done:true});
    const year=rows[0]?.year;let questions:any[]=[];try{const p=await extract(req,{mode:'batch',sourceUrl,fromQuestion:String(from),toQuestion:String(to),exam:series.toUpperCase(),year:String(year||'')});questions=Array.isArray(p?.questions)?p.questions:[]}catch(e:any){console.warn('batch extraction failed',e?.message||e)}
    let saved=0;const failures:any[]=[];
    for(const ref of pending){let q=questions.find((x:any)=>Number(x?.question_number)===Number(ref.question_number));if(!usable(q)){try{q=await extract(req,{mode:'question',sourceUrl,questionNumber:String(ref.question_number),exam:series.toUpperCase(),year:String(ref.year||year||'')})}catch(e:any){failures.push({question_number:ref.question_number,error:String(e?.message||e).slice(0,240)});continue;}}
      if(!usable(q)){failures.push({question_number:ref.question_number,error:'Questão não extraída com segurança'});continue;}try{await save(ref,q);saved++}catch(e:any){failures.push({question_number:ref.question_number,error:String(e?.message||e).slice(0,240)})}}
    res.setHeader('Cache-Control','no-store');return res.status(200).json({series,from,to,pending:pending.length,saved,failed:failures.length,failures});
  }catch(e:any){console.error('materialize-official-ai-batch failed',e?.message||e);return res.status(500).json({error:String(e?.message||e)});}
}
