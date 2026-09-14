import { createClient } from '@supabase/supabase-js';
import { createCanvas, loadImage } from '@napi-rs/canvas';

const SUPABASE_URL=(process.env.SUPABASE_URL||'https://kmognvgnfisdchzffkgh.supabase.co').replace(/\/$/,'');
const KEY=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SECRET_KEY;
const APP=(process.env.CONNECTAE_APP_URL||'https://xn--conecta-pya.app').replace(/\/$/,'');
if(!KEY) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY/SUPABASE_SECRET_KEY');
const db=createClient(SUPABASE_URL,KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const BUCKET='official-question-images';
const cue=/\b(figura|imagem|gr[aá]fico|tabela|mapa|esquema|fotografia|charge|tirinha|diagrama|cartum|quadrinho|ilustra[cç][aã]o|heredograma|circuito|infogr[aá]fico|curva|fluxograma|organograma|planta|desenho)\b/i;
const publicUrl=p=>`${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${p}`;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function fetchBytes(url,timeout=30000){const r=await fetch(url,{headers:{'user-agent':'Mozilla/5.0 ConectaeMaterializer/2.0'},signal:AbortSignal.timeout(timeout)});if(!r.ok)throw new Error(`HTTP ${r.status} ${url}`);return {bytes:new Uint8Array(await r.arrayBuffer()),type:(r.headers.get('content-type')||'application/octet-stream').split(';')[0]};}
async function upload(bytes,type,path){const {error}=await db.storage.from(BUCKET).upload(path,bytes,{contentType:type,cacheControl:'31536000',upsert:true});if(error)throw error;return publicUrl(path);}
function ext(type){return type.includes('jpeg')?'jpg':type.includes('webp')?'webp':type.includes('gif')?'gif':'png'}
async function copyRemote(url,pathBase){if(url.startsWith(`${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`))return url;const {bytes,type}=await fetchBytes(url);if(!type.startsWith('image/'))throw new Error(`not image: ${type}`);return upload(bytes,type,`${pathBase}.${ext(type)}`)}

async function structuredEnem(year,q){if(year<2019||year>2023)return null;const offsets=[0,50,100,150];let found=null;for(const off of offsets){const r=await fetch(`https://api.enem.dev/v1/exams/${year}/questions?limit=50&offset=${off}`,{signal:AbortSignal.timeout(20000)});if(!r.ok)continue;const j=await r.json();const rows=Array.isArray(j?.questions)?j.questions:[];found=rows.find(x=>Number(x?.index)===q&&!x?.language)||rows.find(x=>Number(x?.index)===q);if(found)break;}if(!found)return null;const main=(found.files||[]).map(x=>x?.url||x).filter(x=>typeof x==='string'&&x.startsWith('https://'));const opts={};for(const a of found.alternatives||[]){const l=String(a?.letter||'').toUpperCase();const urls=[a?.file,...(a?.files||[])].map(x=>x?.url||x).filter(x=>typeof x==='string'&&x.startsWith('https://'));if(l&&urls.length)opts[l]=[...new Set(urls)];}return {main:[...new Set(main)],opts};}

async function compositeOptionImages(groups,row){const entries=[];for(const l of ['A','B','C','D','E'])for(const u of groups[l]||[])entries.push([l,u]);if(!entries.length)return null;const loaded=[];for(const [l,u] of entries){try{const {bytes}=await fetchBytes(u);const img=await loadImage(Buffer.from(bytes));loaded.push([l,img]);}catch(e){console.warn('option image load failed',row.series_id,row.year,row.question_number,l,String(e?.message||e));}}
if(!loaded.length)return null;const width=Math.max(...loaded.map(([,i])=>i.width),480);const pad=24,label=42;let height=pad;for(const [,i] of loaded)height+=label+Math.ceil(i.height*Math.min(1,(width-pad*2)/i.width))+pad;const canvas=createCanvas(width,height);const c=canvas.getContext('2d');c.fillStyle='#fff';c.fillRect(0,0,width,height);c.fillStyle='#111';c.font='bold 28px sans-serif';let y=pad;for(const [l,i] of loaded){c.fillText(`${l}`,pad,y+30);y+=label;const scale=Math.min(1,(width-pad*2)/i.width);const w=Math.ceil(i.width*scale),h=Math.ceil(i.height*scale);c.drawImage(i,pad,y,w,h);y+=h+pad;}const buf=await canvas.encode('png');return upload(new Uint8Array(buf),'image/png',`${row.series_id}/${row.year}/q${row.question_number}/options-composite.png`)}

async function renderPersistedPage(row){if(!row.source_pdf_url)return null;const p=Number(row.source_page)>0?`page=${row.source_page}`:`questionNumber=${row.question_number}`;const url=`${APP}/api/render-official-pdf-page?sourceUrl=${encodeURIComponent(row.source_pdf_url)}&${p}`;const {bytes,type}=await fetchBytes(url,60000);if(!type.startsWith('image/'))throw new Error(`renderer returned ${type}`);return upload(bytes,type,`${row.series_id}/${row.year}/q${row.question_number}/official-source-page.${ext(type)}`)}

const rows=[];for(let from=0;;from+=500){const {data,error}=await db.from('official_vestibular_question_bank_v2').select('question_id,series_id,year,question_number,prompt_text,option_a,option_b,option_c,option_d,option_e,image_url,image_alt,source_page,source_pdf_url,images,option_images').order('series_id').order('year').order('question_number').range(from,from+499);if(error)throw error;rows.push(...(data||[]));if(!data||data.length<500)break;}
let visual=0,complete=0,failed=0,skipped=0;const failures=[];
for(const row of rows){const text=[row.prompt_text,row.option_a,row.option_b,row.option_c,row.option_d,row.option_e].filter(Boolean).join(' ');const isVisual=cue.test(text)||row.image_url||row.image_alt||(Array.isArray(row.images)&&row.images.length)||Object.keys(row.option_images||{}).length;if(!isVisual){skipped++;continue;}visual++;
try{let images=Array.isArray(row.images)?row.images.filter(Boolean):[];let optionImages=(row.option_images&&typeof row.option_images==='object')?row.option_images:{};let primary=row.image_url||null;
const e=row.series_id==='enem'?await structuredEnem(Number(row.year),Number(row.question_number)):null;if(e){const savedMain=[];for(let i=0;i<e.main.length;i++)savedMain.push(await copyRemote(e.main[i],`${row.series_id}/${row.year}/q${row.question_number}/question-${i+1}`));const savedOpts={};for(const [l,urls] of Object.entries(e.opts)){savedOpts[l]=[];for(let i=0;i<urls.length;i++)savedOpts[l].push(await copyRemote(urls[i],`${row.series_id}/${row.year}/q${row.question_number}/option-${l}-${i+1}`));}images=[...new Set([...images,...savedMain])];optionImages={...optionImages,...savedOpts};if(!primary&&savedMain[0])primary=savedMain[0];if(!primary&&Object.keys(savedOpts).length)primary=await compositeOptionImages(savedOpts,row);}
if(!primary&&row.image_url)primary=await copyRemote(row.image_url,`${row.series_id}/${row.year}/q${row.question_number}/question-legacy`);
if(!primary&&row.source_pdf_url){primary=await renderPersistedPage(row);images=[...new Set([...images,primary])];}
if(primary&&!images.includes(primary))images.unshift(primary);
if(!primary&&images[0])primary=images[0];
if(!primary&&!Object.keys(optionImages).length)throw new Error('no persisted visual asset produced');
const {error:u}=await db.from('official_exam_items').update({image_url:primary,image_alt:`Elemento visual oficial persistido da questão ${row.question_number}.`,images,option_images:optionImages}).eq('id',row.question_id);if(u)throw u;complete++;console.log('OK',row.series_id,row.year,row.question_number,images.length,Object.keys(optionImages).length);}
catch(e){failed++;failures.push({id:row.question_id,series:row.series_id,year:row.year,q:row.question_number,error:String(e?.message||e).slice(0,220)});console.error('FAIL',row.series_id,row.year,row.question_number,String(e?.message||e));}
await sleep(35);}
console.log(JSON.stringify({rows:rows.length,visual,complete,failed,skipped,failures},null,2));if(failed)process.exitCode=2;
