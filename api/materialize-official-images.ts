import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://kmognvgnfisdchzffkgh.supabase.co').replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
const BUCKET = 'official-question-images';
const db = SERVICE_KEY ? createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } }) : null;

const cue = /\b(figura|imagem|gr[aá]fico|tabela|mapa|esquema|fotografia|charge|tirinha|diagrama|cartum|quadrinho|ilustra[cç][aã]o|heredograma|circuito|infogr[aá]fico)\b/i;
const extFromType = (type:string) => type.includes('jpeg') ? 'jpg' : type.includes('webp') ? 'webp' : type.includes('gif') ? 'gif' : 'png';

async function download(url:string){
  const r = await fetch(url, { headers: { 'user-agent':'Mozilla/5.0 Conectae/1.0' }, signal: AbortSignal.timeout(20000) });
  if(!r.ok) throw new Error(`download ${r.status}`);
  const type = (r.headers.get('content-type') || 'image/png').split(';')[0];
  if(!type.startsWith('image/')) throw new Error(`not-image:${type}`);
  return { bytes: new Uint8Array(await r.arrayBuffer()), type };
}

async function saveImage(url:string, pathBase:string){
  if(!db) throw new Error('missing-service-key');
  const {bytes,type} = await download(url);
  const path = `${pathBase}.${extFromType(type)}`;
  const { error } = await db.storage.from(BUCKET).upload(path, bytes, { contentType:type, cacheControl:'31536000', upsert:true });
  if(error) throw error;
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${path}`;
}

async function getEnemVisual(year:number, q:number){
  if(year < 2019 || year > 2023) return null;
  const r = await fetch(`https://api.enem.dev/v1/exams/${year}/questions/${q}`, { signal: AbortSignal.timeout(15000) });
  if(!r.ok) return null;
  const data:any = await r.json();
  const questionImages:string[] = Array.isArray(data?.files) ? data.files.map((x:any)=>x?.url || x).filter((x:any)=>typeof x==='string' && /^https:\/\//.test(x)) : [];
  const optionImages:Record<string,string[]> = {};
  const alternatives = Array.isArray(data?.alternatives) ? data.alternatives : [];
  for(const alt of alternatives){
    const letter=String(alt?.letter||'').toUpperCase();
    const imgs=(Array.isArray(alt?.files)?alt.files:[]).map((x:any)=>x?.url||x).filter((x:any)=>typeof x==='string'&&/^https:\/\//.test(x));
    if(letter && imgs.length) optionImages[letter]=imgs;
  }
  return {questionImages,optionImages};
}

export default async function handler(req:any,res:any){
  if(req.method!=='POST') return res.status(405).json({error:'POST only'});
  const token=String(req.headers['x-materialize-token']||'');
  if(!process.env.MATERIALIZE_IMAGES_TOKEN || token!==process.env.MATERIALIZE_IMAGES_TOKEN) return res.status(401).json({error:'unauthorized'});
  if(!db) return res.status(500).json({error:'missing Supabase server key'});
  const limit=Math.max(1,Math.min(50,Number(req.body?.limit)||25));
  const offset=Math.max(0,Number(req.body?.offset)||0);
  const {data:rows,error}=await db.from('official_vestibular_question_bank_v2')
    .select('question_id,series_id,year,question_number,prompt_text,option_a,option_b,option_c,option_d,option_e,image_url')
    .order('series_id').order('year').order('question_number').range(offset,offset+limit-1);
  if(error) return res.status(500).json({error:error.message});
  const results:any[]=[];
  for(const row of rows||[]){
    const text=[row.prompt_text,row.option_a,row.option_b,row.option_c,row.option_d,row.option_e].filter(Boolean).join(' ');
    if(!cue.test(text) && !row.image_url){ results.push({id:row.question_id,status:'skip'}); continue; }
    try{
      let main:string[]=[]; let opts:Record<string,string[]>={};
      if(row.image_url && /^https:\/\//.test(row.image_url)) main=[row.image_url];
      if(row.series_id==='enem'){
        const v=await getEnemVisual(Number(row.year),Number(row.question_number));
        if(v){ main=[...new Set([...main,...v.questionImages])]; opts=v.optionImages; }
      }
      const storedMain:string[]=[]; const storedOpts:Record<string,string[]>= {};
      for(let i=0;i<main.length;i++) storedMain.push(await saveImage(main[i], `${row.series_id}/${row.year}/q${row.question_number}/question-${i+1}`));
      for(const [letter,urls] of Object.entries(opts)){
        storedOpts[letter]=[];
        for(let i=0;i<urls.length;i++) storedOpts[letter].push(await saveImage(urls[i], `${row.series_id}/${row.year}/q${row.question_number}/option-${letter}-${i+1}`));
      }
      if(storedMain.length){
        await db.from('official_vestibular_question_bank_v2').update({image_url:storedMain[0], image_alt:`Elemento visual oficial da questão ${row.question_number}.`}).eq('question_id',row.question_id);
      }
      await db.from('official_question_materialized_cache').upsert({series_id:row.series_id,year:row.year,question_number:row.question_number,prompt_text:row.prompt_text,option_a:row.option_a,option_b:row.option_b,option_c:row.option_c,option_d:row.option_d,option_e:row.option_e,images:storedMain,option_images:storedOpts,needs_source_image:storedMain.length>0||Object.keys(storedOpts).length>0,source:'persisted-official-image'}, {onConflict:'series_id,year,question_number'});
      results.push({id:row.question_id,status:(storedMain.length||Object.keys(storedOpts).length)?'saved':'no-direct-image',images:storedMain.length,optionGroups:Object.keys(storedOpts).length});
    }catch(e:any){ results.push({id:row.question_id,status:'error',error:String(e?.message||e).slice(0,180)}); }
  }
  res.status(200).json({offset,limit,count:rows?.length||0,results});
}
