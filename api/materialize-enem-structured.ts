import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL='https://kmognvgnfisdchzffkgh.supabase.co';
const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttb2dudmduZmlzZGNoemZma2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MzkxNjksImV4cCI6MjEwMjMxNTE2OX0.JarpsXfgv8PplL3Ryvs6iFfEPiv_rnp2Cx5i1I67fCk';
const supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});

function decodeHtml(s:string){return s.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/gi,' ').replace(/&ndash;|&#8211;/gi,'–').replace(/&mdash;|&#8212;/gi,'—').replace(/&amp;/gi,'&').replace(/&quot;|&#34;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/\s+/g,' ').trim()}
function parseJsonl(raw:string){
  const out:any[]=[];
  for(const line of raw.split(/\r?\n/)){const s=line.trim();if(!s)continue;try{out.push(JSON.parse(s))}catch{/* ignore */}}
  return out;
}
function promptOf(row:any){
  const c=row?.conteudo||{};return [String(c.texto_base||'').trim(),String(c.enunciado||'').trim()].filter(Boolean).join('\n\n').trim();
}
function mappedUpdate(row:any){
  const c=row?.conteudo||{},a=c.alternativas||{},visual=c.metadados_visual||{};
  const prompt=promptOf(row);
  if(prompt.length<10||!a.A||!a.B)return null;
  const imageDescription=String(visual.descricao_imagem||'').trim();
  return {prompt_text:prompt,option_a:String(a.A||'').trim()||null,option_b:String(a.B||'').trim()||null,option_c:String(a.C||'').trim()||null,option_d:String(a.D||'').trim()||null,option_e:String(a.E||'').trim()||null,image_alt:visual.contem_imagem?(imageDescription||'Esta questão contém elemento visual na prova oficial.'):null};
}
async function fetchText(url:string){
  const r=await fetch(url,{headers:{'User-Agent':'Conectae/1.0','Accept':'text/plain,text/html,*/*'},signal:AbortSignal.timeout(30000)});
  if(!r.ok)throw new Error(`Fonte ${r.status}: ${url}`);return r.text();
}
function parseYellowToBlue(html:string){
  const text=decodeHtml(html), map=new Map<number,number>();
  const heads=[...text.matchAll(/\b(9\d|1[0-7]\d|180)\s*[–-]\s*(?:[A-E]|ANL|S\/?A|ANULADA)\b/gi)];
  for(let i=0;i<heads.length;i++){
    const yellow=Number(heads[i][1]);if(yellow<91||yellow>180)continue;
    const start=heads[i].index||0,end=i+1<heads.length?(heads[i+1].index||text.length):text.length;
    const chunk=text.slice(start,end);
    const blue=Number(chunk.match(/Caderno Azul\s+(9\d|1[0-7]\d|180)\b/i)?.[1]);
    if(blue>=91&&blue<=180)map.set(yellow,blue);
  }
  return map;
}
async function saveRows(year:number,day:number,rows:any[],map:Map<number,number>|null){
  const {data,error}=await supabase.from('official_vestibular_question_bank').select('question_id,question_number,prompt_text,option_a,option_b,option_c,option_d,option_e').eq('series_id','enem').eq('year',year).gte('question_number',day===1?1:91).lte('question_number',day===1?90:180).order('question_number');
  if(error)throw error;
  const byNumber=new Map<number,any>(rows.map(r=>[Number(r?.posicao_prova),r]));
  let saved=0,skipped=0;const failures:any[]=[];
  const work=(data||[]).map(async(ref:any)=>{
    const target=Number(ref.question_number);const sourceNumber=day===1?target:map?.get(target);
    if(!sourceNumber){failures.push({question_number:target,error:'Sem equivalência Azul'});return;}
    const source=byNumber.get(sourceNumber);const update=mappedUpdate(source);
    if(!update){failures.push({question_number:target,error:`Conteúdo estruturado incompleto (${sourceNumber})`});return;}
    const already=String(ref.prompt_text||'').trim().length>10&&[ref.option_a,ref.option_b,ref.option_c,ref.option_d,ref.option_e].filter((v:any)=>String(v||'').trim()).length>=2;
    if(already){skipped++;return;}
    const u=await supabase.from('official_exam_items').update(update).eq('id',ref.question_id).select('id').maybeSingle();
    if(u.error||!u.data)failures.push({question_number:target,error:u.error?.message||'Banco não confirmou'});else saved++;
  });
  const batch=12;for(let i=0;i<work.length;i+=batch)await Promise.all(work.slice(i,i+batch));
  return {saved,skipped,failed:failures.length,failures};
}

export default async function handler(req:any,res:any){
  if(req.method!=='GET'&&req.method!=='POST')return res.status(405).json({error:'Método não permitido.'});
  const input=req.method==='POST'?req.body:req.query;const year=Number(input?.year),day=Number(input?.day);
  if(![2024,2025].includes(year)||![1,2].includes(day))return res.status(400).json({error:'Use year=2024|2025 e day=1|2.'});
  try{
    const rawUrl=`https://raw.githubusercontent.com/GustavoDMentz/Simulador-enem/main/data/fused/questoes_enem_${year}_AZUL_D${day}.jsonl`;
    const raw=await fetchText(rawUrl);const rows=parseJsonl(raw);
    if(rows.length<80)throw new Error(`Mirror estruturado incompleto: ${rows.length} questões`);
    let map:Map<number,number>|null=null;
    if(day===2){
      const slug=year===2024?'enem-2024-2o-dia-caderno-amarelo':'enem-2025-2-dia-caderno-amarelo';
      const html=await fetchText(`https://www.bernoulli.com.br/resolve/provas/${slug}/`);map=parseYellowToBlue(html);
      if(map.size<80)throw new Error(`Mapa Amarelo→Azul incompleto: ${map.size}/90`);
    }
    const result=await saveRows(year,day,rows,map);
    res.setHeader('Cache-Control','no-store');return res.status(200).json({year,day,structured_rows:rows.length,mapped:map?.size||90,...result});
  }catch(e:any){console.error('materialize-enem-structured failed',e?.message||e);return res.status(500).json({error:String(e?.message||e)})}
}
