/* eslint-disable @typescript-eslint/no-explicit-any */
export type ParsedQuestion={
  found:boolean;
  prompt:string;
  option_a:string|null;
  option_b:string|null;
  option_c:string|null;
  option_d:string|null;
  option_e:string|null;
  needs_source_image:boolean;
  image_note:string|null;
  confidence:number;
  source_page?:number;
};

const BROKEN_GLYPHS=/[\uFFFD\u25A0-\u25FF\uE000-\uF8FF]/g;

/** Rejects partial or font-corrupted PDF text before it reaches the UI. */
export function isUsableOfficialQuestion(value:Partial<ParsedQuestion>|null|undefined){
  if(!value?.found||String(value.prompt||'').trim().length<12)return false;
  const fields=[value.prompt,value.option_a,value.option_b,value.option_c,value.option_d,value.option_e].filter(Boolean).map(String);
  if(fields.slice(1).filter(Boolean).length<2)return false;
  const content=fields.join(' ');
  const broken=(content.match(BROKEN_GLYPHS)||[]).length;
  if(broken>=2||broken/Math.max(content.length,1)>.003)return false;
  if(/\b(?:DVVLQDOH|DOWHUQDWLYD|TXHVWDR|SHUVRQDJHQV|FRUSR|VHUWDR|UHVSRVWD)\b/i.test(content))return false;
  return true;
}

const PDFJS_URL='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs';
const PDFJS_WORKER='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
const SUPABASE_PDF_PROXY='https://kmognvgnfisdchzffkgh.supabase.co/functions/v1/official-pdf-proxy';
let pdfjsPromise:Promise<any>|null=null;

function remoteImport(url:string){
  const importer=new Function('u','return import(u)') as (u:string)=>Promise<any>;
  return importer(url);
}

async function pdfjs(){
  if(!pdfjsPromise){
    pdfjsPromise=remoteImport(PDFJS_URL).then((mod:any)=>{mod.GlobalWorkerOptions.workerSrc=PDFJS_WORKER;return mod;});
  }
  return pdfjsPromise;
}

function clean(s:string){return s.replace(/\s+/g,' ').trim()}
function normalize(s:string){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()}

async function fetchPdfBytes(sourceUrl:string){
  let last='';
  try{
    const parts:Uint8Array[]=[];
    const chunkSize=2*1024*1024;
    let offset=0,total=Infinity;
    while(offset<total){
      const end=offset+chunkSize-1;
      const response=await fetch(`/api/proxy-official-pdf?url=${encodeURIComponent(sourceUrl)}&start=${offset}&end=${end}`,{cache:'force-cache'});
      if(!response.ok){last=`HTTP ${response.status}`;break}
      const bytes=new Uint8Array(await response.arrayBuffer());
      const size=Number(response.headers.get('x-pdf-size'));
      if(Number.isFinite(size)&&size>0)total=size;
      if(!bytes.byteLength){last='arquivo vazio';break}
      parts.push(bytes);offset+=bytes.byteLength;
      if(bytes.byteLength<chunkSize&&total===Infinity)total=offset;
      if(offset>30*1024*1024)throw new Error('PDF oficial grande demais');
    }
    if(parts.length&&offset>=total){
      const merged=new Uint8Array(offset);let cursor=0;
      for(const part of parts){merged.set(part,cursor);cursor+=part.byteLength}
      return merged.buffer;
    }
  }catch(error:any){last=String(error?.message||error)}

  for(const proxied of [`${SUPABASE_PDF_PROXY}?url=${encodeURIComponent(sourceUrl)}`]){
    try{
      const response=await fetch(proxied,{cache:'force-cache'});
      if(!response.ok){last=`HTTP ${response.status}`;continue;}
      const data=await response.arrayBuffer();
      if(data.byteLength>0)return data;
      last='arquivo vazio';
    }catch(error:any){last=String(error?.message||error)}
  }
  throw new Error(`Não consegui acessar o PDF oficial${last?`: ${last}`:''}.`);
}

async function callExtractionApi(body:Record<string,unknown>){
  const params=new URLSearchParams(Object.entries(body).filter(([,value])=>value!==null&&value!==undefined).map(([key,value])=>[key,String(value)]));
  const response=await fetch(`/api/extract-official-question?${params.toString()}`,{cache:'force-cache'});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(String(data?.error||`HTTP ${response.status}`));
  return data;
}

export async function extractOfficialQuestionRemotely(sourceUrl:string,questionNumber:number,exam:string,year:number):Promise<ParsedQuestion>{
  return callExtractionApi({mode:'question',sourceUrl,questionNumber,exam,year}) as Promise<ParsedQuestion>;
}

export async function extractOfficialAnswerRemotely(sourceUrl:string,questionNumber:number,exam:string,year:number):Promise<string|null>{
  const data=await callExtractionApi({mode:'answer',sourceUrl,questionNumber,exam,year});
  const answer=String(data?.correct_option||'').toUpperCase();
  return /^[A-E]$/.test(answer)?answer:null;
}

async function loadPdf(sourceUrl:string){
  const lib=await pdfjs();
  const data=await fetchPdfBytes(sourceUrl);
  return lib.getDocument({data:new Uint8Array(data),useWorkerFetch:true,isEvalSupported:false}).promise;
}

function pageLines(items:any[]){
  const rows=new Map<number,{x:number;str:string}[]>();
  for(const item of items){
    const str=String(item?.str||'').trim(); if(!str)continue;
    const tr=item?.transform||[]; const x=Number(tr[4]||0),y=Number(tr[5]||0);
    const key=Math.round(y/2)*2;
    if(!rows.has(key))rows.set(key,[]);
    rows.get(key)!.push({x,str});
  }
  return [...rows.entries()].sort((a,b)=>b[0]-a[0]).map(([,parts])=>clean(parts.sort((a,b)=>a.x-b.x).map(p=>p.str).join(' '))).filter(Boolean);
}

export function isQuestionMarker(line:string,n:number){
  const s=normalize(line).replace(/[^A-Z0-9 ]+/g,' ');
  return new RegExp(`\\bQUESTAO\\s+0*${n}\\b`).test(s)
    ||new RegExp(`^\\s*0*${n}\\s*[.)-]\\s+\\S`,'i').test(line);
}

function stripQuestionMarker(line:string,n:number){
  return line
    .replace(new RegExp(`^\\s*QUEST(?:Ã|A)O\\s+0*${n}\\s*[.):-]?\\s*`,'i'),'')
    .replace(new RegExp(`^\\s*0*${n}\\s*[.):-]\\s*`,'i'),'')
    .trim();
}

export function splitOptions(lines:string[]){
  const matches:{i:number;letter:string;rest:string}[]=[];
  for(let i=0;i<lines.length;i++){
    const line=lines[i].trim();
    let m=line.match(/^([A-E])\s*[).:-]?\s+(.+)$/i);
    if(m){matches.push({i,letter:m[1].toUpperCase(),rest:m[2]});continue;}
    m=line.match(/^([A-E])\s*$/i);
    if(m&&i+1<lines.length)matches.push({i,letter:m[1].toUpperCase(),rest:''});
  }
  for(let start=0;start<matches.length;start++){
    const seq:string[]=[]; let last=-1;
    for(let j=start;j<matches.length;j++){
      const want='ABCDE'[seq.length];
      if(matches[j].letter===want){seq.push(want);last=j;if(seq.length===5)break;}
      else if(matches[j].letter==='A'&&seq.length)break;
    }
    if(seq.length<4)continue;
    const chosen=matches.slice(start,last+1).filter((m,idx)=>m.letter==='ABCDE'[idx]);
    if(chosen.length<4)continue;
    const first=chosen[0].i;
    const prompt=clean(lines.slice(0,first).join(' '));
    const opts:Record<string,string|null>={A:null,B:null,C:null,D:null,E:null};
    for(let k=0;k<chosen.length;k++){
      const cur=chosen[k],end=k+1<chosen.length?chosen[k+1].i:lines.length;
      const body=[cur.rest,...lines.slice(cur.i+1,end)].filter(Boolean).join(' ');
      opts[cur.letter]=clean(body);
    }
    return {prompt,opts};
  }
  return null;
}

function parsedResult(parsed:{prompt:string;opts:Record<string,string|null>},confidence:number,sourcePage:number):ParsedQuestion{
  const imageDependent=/\b(figura|imagem|grafico|gráfico|tabela|mapa|esquema|fotografia|charge|tirinha|texto anterior)\b/i.test(parsed.prompt);
  return {
    found:true,
    prompt:parsed.prompt,
    option_a:parsed.opts.A||null,
    option_b:parsed.opts.B||null,
    option_c:parsed.opts.C||null,
    option_d:parsed.opts.D||null,
    option_e:parsed.opts.E||null,
    needs_source_image:imageDependent,
    image_note:imageDependent?'A questão menciona elemento visual da prova oficial.':'',
    confidence,
    source_page:sourcePage,
  };
}

export async function extractOfficialQuestion(sourceUrl:string,questionNumber:number):Promise<ParsedQuestion>{
  const pdf=await loadPdf(sourceUrl);
  const collected:string[]=[]; let started=false; let pagesAfterStart=0;
  let sourcePage=1;
  for(let p=1;p<=pdf.numPages;p++){
    const page=await pdf.getPage(p); const content=await page.getTextContent(); const lines=pageLines(content.items||[]);
    for(const line of lines){
      if(!started){if(isQuestionMarker(line,questionNumber)){started=true;sourcePage=p;const remainder=stripQuestionMarker(line,questionNumber);if(remainder)collected.push(remainder);}continue;}
      if(isQuestionMarker(line,questionNumber+1)){
        const parsed=splitOptions(collected);
        if(parsed){const result=parsedResult(parsed,.92,sourcePage);if(isUsableOfficialQuestion(result))return result;}
        return {found:false,prompt:'',option_a:null,option_b:null,option_c:null,option_d:null,option_e:null,needs_source_image:false,image_note:null,confidence:0};
      }
      collected.push(line);
    }
    if(started&&++pagesAfterStart>=3)break;
  }
  if(started){const parsed=splitOptions(collected);if(parsed){const result=parsedResult(parsed,.88,sourcePage);if(isUsableOfficialQuestion(result))return result;}}
  return {found:false,prompt:'',option_a:null,option_b:null,option_c:null,option_d:null,option_e:null,needs_source_image:false,image_note:null,confidence:0};
}

export async function renderOfficialPdfPage(sourceUrl:string,pageNumber:number):Promise<string|null>{
  if(typeof document==='undefined'||!Number.isFinite(pageNumber)||pageNumber<1)return null;
  const pdf=await loadPdf(sourceUrl);
  if(pageNumber>pdf.numPages)return null;
  const page=await pdf.getPage(pageNumber);
  const viewport=page.getViewport({scale:1.5});
  const canvas=document.createElement('canvas');
  canvas.width=Math.ceil(viewport.width);
  canvas.height=Math.ceil(viewport.height);
  const context=canvas.getContext('2d',{alpha:false});
  if(!context)return null;
  await page.render({canvasContext:context,viewport}).promise;
  return canvas.toDataURL('image/jpeg',.9);
}

export async function extractOfficialAnswer(sourceUrl:string,questionNumber:number):Promise<string|null>{
  const pdf=await loadPdf(sourceUrl);
  const flat:string[]=[];
  for(let p=1;p<=pdf.numPages;p++){
    const page=await pdf.getPage(p); const content=await page.getTextContent();
    for(const line of pageLines(content.items||[]))flat.push(...line.split(/\s+/).filter(Boolean));
  }
  for(let i=0;i<flat.length-1;i++){
    if(Number(flat[i].replace(/\D/g,''))===questionNumber){
      for(let j=i+1;j<Math.min(i+5,flat.length);j++){
        const v=flat[j].replace(/[^A-E]/gi,'').toUpperCase(); if(/^[A-E]$/.test(v))return v;
      }
    }
  }
  return null;
}
