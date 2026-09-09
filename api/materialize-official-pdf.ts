/* eslint-disable no-control-regex */
import { createClient } from '@supabase/supabase-js';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const SUPABASE_URL='https://kmognvgnfisdchzffkgh.supabase.co';
const SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imttb2dudmduZmlzZGNoemZma2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MzkxNjksImV4cCI6MjEwMjMxNTE2OX0.JarpsXfgv8PplL3Ryvs6iFfEPiv_rnp2Cx5i1I67fCk';
const supabase=createClient(SUPABASE_URL,SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const ALLOWED_HOSTS=new Set(['download.inep.gov.br','vestibular.cmmg.edu.br','www.fuvest.br','fuvest.br']);

type Ref={question_id:string;series_id:string;year:number;question_number:number;source_pdf_url:string|null};
type Line={page:number;text:string};
type Parsed={question_number:number;prompt:string;option_a:string|null;option_b:string|null;option_c:string|null;option_d:string|null;option_e:string|null;source_page:number;needs_image:boolean};

function allowed(raw:unknown){
  try{const u=new URL(String(raw||''));return u.protocol==='https:'&&ALLOWED_HOSTS.has(u.hostname)&&/\.pdf$/i.test(u.pathname)?u.toString():''}catch{return''}
}
function norm(s:string){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()}
function clean(s:string){return s.replace(new RegExp('[\\u0000-\\u001f]+','g'),' ').replace(/\s+/g,' ').trim()}

function shiftedAscii(raw:string){
  let out='';
  for(const ch of raw){
    const code=ch.charCodeAt(0);
    if(code>=32&&code<=93)out+=String.fromCharCode(code+29);
    else out+=ch;
  }
  return out;
}
function decodeCmmgToken(token:string){
  if(token.length<3)return token;
  const candidate=shiftedAscii(token);
  const bad=[...candidate].filter(ch=>'`^[\\]'.includes(ch)).length;
  const letters=(candidate.match(/[A-Za-zÀ-ÿ]/g)||[]).length;
  const oddChars="$%&'()*+,-./0123456789:;<=>?@[\\]^_";
  const originalOdd=[...token].filter(ch=>oddChars.includes(ch)).length;
  if(bad)return token;
  if(letters/Math.max(candidate.length,1)<.62)return token;
  if(originalOdd>0||/^[A-Z]{4,}$/.test(token))return candidate;
  return token;
}
function decodeCmmg(raw:string){
  const special:Record<string,string>={'¿':'f','À':'ç','È':'É','Ê':'Ê','Ë':'Ë'};
  const mapped=[...raw].map(ch=>special[ch]??ch).join('');
  return mapped.split(/(\s+)/).map(part=>/^\s+$/.test(part)?part:decodeCmmgToken(part)).join('');
}

function questionMarker(line:string){
  const n=norm(line).replace(/[^A-Z0-9 .)-]+/g,' ');
  let m=n.match(/\bQUESTAO\s+0*(\d{1,3})\b/);
  if(m)return Number(m[1]);
  m=line.match(/^\s*0*(\d{1,3})\s*[.)-]\s+\S/);
  return m?Number(m[1]):null;
}
function stripMarker(line:string,n:number){
  return line.replace(new RegExp(`^\\s*QUEST(?:Ã|A)O\\s+0*${n}\\s*[.):-]?\\s*`,'i'),'').replace(new RegExp(`^\\s*0*${n}\\s*[.):-]\\s*`,'i'),'').trim();
}
function optionStart(line:string){
  let m=line.match(/^\s*([A-E])\s*[).:-]\s*(.*)$/i);
  if(m)return {letter:m[1].toUpperCase(),rest:m[2].trim()};
  m=line.match(/^\s*([A-E])\s+(.+)$/i);
  return m?{letter:m[1].toUpperCase(),rest:m[2].trim()}:null;
}
function splitOptions(lines:string[]){
  const starts:{i:number;letter:string;rest:string}[]=[];
  for(let i=0;i<lines.length;i++){const s=optionStart(lines[i]);if(s)starts.push({i,...s});}
  for(let start=0;start<starts.length;start++){
    const chosen:{i:number;letter:string;rest:string}[]=[];
    let wanted=0;
    for(let j=start;j<starts.length;j++){
      const item=starts[j];
      if(item.letter==='ABCDE'[wanted]){chosen.push(item);wanted++;if(wanted===5)break;continue;}
      if(chosen.length&&item.letter==='A')break;
    }
    if(chosen.length<4)continue;
    const prompt=clean(lines.slice(0,chosen[0].i).join(' '));
    const opts:Record<string,string|null>={A:null,B:null,C:null,D:null,E:null};
    for(let k=0;k<chosen.length;k++){
      const cur=chosen[k],end=k+1<chosen.length?chosen[k+1].i:lines.length;
      let body=[cur.rest,...lines.slice(cur.i+1,end)].filter(Boolean).join(' ');
      const cue=body.search(/\b(?:Para responder|Leia o texto|Leia o trecho|As questões|Read the text|The questions|Observe a figura|Considere o texto)\b/i);
      if(k===chosen.length-1&&cue>20)body=body.slice(0,cue);
      opts[cur.letter]=clean(body)||null;
    }
    return {prompt,opts};
  }
  return null;
}
function imageDependent(text:string){return /\b(figura|imagem|gr[aá]fico|tabela|mapa|esquema|fotografia|charge|tirinha|diagrama|imagem a seguir|figura a seguir)\b/i.test(text)}

async function fetchPdf(url:string){
  const r=await fetch(url,{headers:{'user-agent':'Mozilla/5.0 (compatible; ConectaeMaterializer/1.0)','accept':'application/pdf'},signal:AbortSignal.timeout(45000)});
  if(!r.ok)throw new Error(`PDF HTTP ${r.status}`);
  const b=await r.arrayBuffer();
  if(!b.byteLength||b.byteLength>35*1024*1024)throw new Error('PDF inválido ou grande demais');
  return new Uint8Array(b);
}
async function extractLines(url:string,series:string){
  const pdf=await getDocument({data:await fetchPdf(url),isEvalSupported:false,useSystemFonts:true}).promise;
  const lines:Line[]=[];
  for(let p=1;p<=pdf.numPages;p++){
    const page=await pdf.getPage(p);
    const content=await page.getTextContent();
    const rows=new Map<number,{x:number;str:string}[]>();
    for(const item of content.items as any[]){
      let str=String(item?.str||'').trim();if(!str)continue;
      if(series==='cmmg')str=decodeCmmg(str);
      const tr=item?.transform||[];const x=Number(tr[4]||0),y=Number(tr[5]||0),key=Math.round(y/2)*2;
      if(!rows.has(key))rows.set(key,[]);rows.get(key)!.push({x,str});
    }
    for(const [,parts] of [...rows.entries()].sort((a,b)=>b[0]-a[0])){
      const text=clean(parts.sort((a,b)=>a.x-b.x).map(x=>x.str).join(' '));if(text)lines.push({page:p,text});
    }
  }
  return lines;
}
function contextRanges(lines:Line[]){
  const result:{from:number;to:number;start:number;end:number}[]=[];
  for(let i=0;i<lines.length;i++){
    const t=lines[i].text;
    const m=t.match(/(?:quest[oõ]es|questions)\s+(?:de\s+|from\s+)?0?(\d{1,3})\s+(?:a|to|até|-)\s+0?(\d{1,3})/i);
    if(!m)continue;
    const from=Number(m[1]),to=Number(m[2]);if(!from||!to||to<from||to-from>20)continue;
    let end=i+1;
    while(end<lines.length&&questionMarker(lines[end].text)!==from)end++;
    if(end>i+1)result.push({from,to,start:i,end});
  }
  return result;
}
function parseAll(lines:Line[],refs:Ref[]){
  const markers:{index:number;n:number;page:number}[]=[];
  for(let i=0;i<lines.length;i++){const n=questionMarker(lines[i].text);if(n&&n>=1&&n<=250)markers.push({index:i,n,page:lines[i].page});}
  const byNumber=new Map<number,{index:number;n:number;page:number}>();
  for(const m of markers)if(!byNumber.has(m.n))byNumber.set(m.n,m);
  const ranges=contextRanges(lines);
  const out:Parsed[]=[];
  for(const ref of refs){
    const marker=byNumber.get(ref.question_number);if(!marker)continue;
    const next=markers.find(x=>x.index>marker.index&&x.n===ref.question_number+1)||markers.find(x=>x.index>marker.index);
    const chunk=lines.slice(marker.index,next?next.index:Math.min(lines.length,marker.index+120));
    const first=stripMarker(chunk[0]?.text||'',ref.question_number);
    const bodies=[first,...chunk.slice(1).map(x=>x.text)].filter(Boolean);
    const parsed=splitOptions(bodies);if(!parsed)continue;
    let prompt=parsed.prompt;
    const range=ranges.find(r=>ref.question_number>=r.from&&ref.question_number<=r.to);
    if(range){
      const context=clean(lines.slice(range.start,range.end).map(x=>x.text).join(' '));
      if(context&&context.length<9000&&!prompt.includes(context.slice(0,40)))prompt=clean(`${context} ${prompt}`);
    }
    const options=[parsed.opts.A,parsed.opts.B,parsed.opts.C,parsed.opts.D,parsed.opts.E].filter(Boolean);
    if(prompt.length<8||options.length<4)continue;
    out.push({question_number:ref.question_number,prompt,option_a:parsed.opts.A,option_b:parsed.opts.B,option_c:parsed.opts.C,option_d:parsed.opts.D,option_e:parsed.opts.E,source_page:marker.page,needs_image:imageDependent(`${prompt} ${options.join(' ')}`)});
  }
  return out;
}

export default async function handler(req:any,res:any){
  if(req.method!=='GET'&&req.method!=='POST')return res.status(405).json({error:'Método não permitido.'});
  const input=req.method==='POST'?req.body:req.query;
  const series=String(input?.series||'').toLowerCase();
  const sourceUrl=allowed(input?.sourceUrl);
  if(!['enem','cmmg','fuvest'].includes(series)||!sourceUrl)return res.status(400).json({error:'Série ou PDF inválido.'});
  try{
    const q=await supabase.from('official_vestibular_question_bank').select('question_id,series_id,year,question_number,source_pdf_url').eq('series_id',series).eq('source_pdf_url',sourceUrl).order('question_number');
    if(q.error)throw q.error;
    const refs=(q.data||[]) as Ref[];if(!refs.length)return res.status(404).json({error:'Nenhuma questão cadastrada para este PDF.'});
    const lines=await extractLines(sourceUrl,series);
    const parsed=parseAll(lines,refs);
    let saved=0;const failures:any[]=[];
    for(const item of parsed){
      const ref=refs.find(r=>r.question_number===item.question_number);if(!ref)continue;
      const update={prompt_text:item.prompt,option_a:item.option_a,option_b:item.option_b,option_c:item.option_c,option_d:item.option_d,option_e:item.option_e,source_page:item.source_page,image_alt:item.needs_image?'A questão usa elemento visual da prova oficial.':null};
      const r=await supabase.from('official_exam_items').update(update).eq('id',ref.question_id).select('id').maybeSingle();
      if(r.error||!r.data)failures.push({question_number:item.question_number,error:r.error?.message||'update não confirmado'});else saved++;
    }
    res.setHeader('Cache-Control','no-store');
    return res.status(200).json({series,sourceUrl,total_refs:refs.length,parsed:parsed.length,saved,failed:failures.length,failures,questions:parsed.map(x=>({n:x.question_number,page:x.source_page,prompt:x.prompt.slice(0,100),options:[x.option_a,x.option_b,x.option_c,x.option_d,x.option_e].filter(Boolean).length}))});
  }catch(e:any){console.error('materialize-official-pdf failed',e?.message||e);return res.status(500).json({error:String(e?.message||e)});}
}
