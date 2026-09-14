// Local/CI administrative helper. Requires SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY).
// It copies already-addressable official question images into Supabase Storage so the app no longer depends on third-party image URLs at render time.
import { createClient } from '@supabase/supabase-js';

const url=(process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL||'https://kmognvgnfisdchzffkgh.supabase.co').replace(/\/$/,'');
const key=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SECRET_KEY;
if(!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SECRET_KEY');
const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const bucket='official-question-images';
const cue=/\b(figura|imagem|gr[aá]fico|tabela|mapa|esquema|fotografia|charge|tirinha|diagrama|cartum|quadrinho|ilustra[cç][aã]o|heredograma|circuito|infogr[aá]fico)\b/i;

async function put(remote,path){
 const r=await fetch(remote,{headers:{'user-agent':'Mozilla/5.0 Conectae/1.0'}}); if(!r.ok) throw new Error(`${r.status} ${remote}`);
 const type=(r.headers.get('content-type')||'image/png').split(';')[0]; if(!type.startsWith('image/')) throw new Error(`not image ${type}`);
 const ext=type.includes('jpeg')?'jpg':type.includes('webp')?'webp':type.includes('gif')?'gif':'png'; const full=`${path}.${ext}`;
 const {error}=await db.storage.from(bucket).upload(full,new Uint8Array(await r.arrayBuffer()),{contentType:type,cacheControl:'31536000',upsert:true}); if(error) throw error;
 return `${url}/storage/v1/object/public/${bucket}/${full}`;
}
async function enem(year,q){
 if(year<2019||year>2023)return null;
 const r=await fetch(`https://api.enem.dev/v1/exams/${year}/questions/${q}`); if(!r.ok)return null; const j=await r.json();
 const images=(j.files||[]).map(x=>x?.url||x).filter(x=>typeof x==='string'&&x.startsWith('https://'));
 const optionImages={}; for(const a of (j.alternatives||[])){const l=String(a.letter||'').toUpperCase(); const f=(a.files||[]).map(x=>x?.url||x).filter(x=>typeof x==='string'&&x.startsWith('https://')); if(l&&f.length)optionImages[l]=f;}
 return {images,optionImages};
}
const {data:rows,error}=await db.from('official_vestibular_question_bank_v2').select('*').order('series_id').order('year').order('question_number'); if(error)throw error;
let saved=0,visual=0,failed=0;
for(const row of rows){
 const txt=[row.prompt_text,row.option_a,row.option_b,row.option_c,row.option_d,row.option_e].filter(Boolean).join(' '); if(!cue.test(txt)&&!row.image_url)continue; visual++;
 try{
  let imgs=row.image_url?[row.image_url]:[], opts={}; const e=row.series_id==='enem'?await enem(+row.year,+row.question_number):null; if(e){imgs=[...new Set([...imgs,...e.images])];opts=e.optionImages;}
  const pi=[]; for(let i=0;i<imgs.length;i++)pi.push(await put(imgs[i],`${row.series_id}/${row.year}/q${row.question_number}/question-${i+1}`));
  const po={}; for(const [letter,urls] of Object.entries(opts)){po[letter]=[];for(let i=0;i<urls.length;i++)po[letter].push(await put(urls[i],`${row.series_id}/${row.year}/q${row.question_number}/option-${letter}-${i+1}`));}
  if(pi[0]){const {error:u}=await db.from('official_vestibular_question_bank_v2').update({image_url:pi[0],image_alt:`Elemento visual oficial da questão ${row.question_number}.`}).eq('question_id',row.question_id); if(u)throw u;}
  const {error:c}=await db.from('official_question_materialized_cache').upsert({series_id:row.series_id,year:row.year,question_number:row.question_number,prompt_text:row.prompt_text,option_a:row.option_a,option_b:row.option_b,option_c:row.option_c,option_d:row.option_d,option_e:row.option_e,images:pi,option_images:po,needs_source_image:pi.length>0||Object.keys(po).length>0,source:'persisted-official-image'},{onConflict:'series_id,year,question_number'}); if(c)throw c;
  if(pi.length||Object.keys(po).length){saved++; console.log('saved',row.series_id,row.year,row.question_number,pi.length,Object.keys(po).length)}
 }catch(e){failed++;console.error('failed',row.series_id,row.year,row.question_number,e.message||e)}
}
console.log(JSON.stringify({visual,saved,failed}));
