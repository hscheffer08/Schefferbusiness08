type ParsedQuestion={
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
};

const PDFJS_URL='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs';
const PDFJS_WORKER='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
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

async function loadPdf(sourceUrl:string){
  const lib=await pdfjs();
  const proxied=`/api/proxy-official-pdf?url=${encodeURIComponent(sourceUrl)}`;
  const response=await fetch(proxied,{cache:'force-cache'});
  if(!response.ok)throw new Error('Não consegui acessar o PDF oficial.');
  const data=await response.arrayBuffer();
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

function isQuestionMarker(line:string,n:number){
  const s=normalize(line).replace(/[^A-Z0-9 ]+/g,' ');
  return new RegExp(`\\bQUESTAO\\s+0*${n}\\b`).test(s)||new RegExp(`^0*${n}\\s*$`).test(s);
}

function splitOptions(lines:string[]){
  const matches:{i:number;letter:string;rest:string}[]=[];
  for(let i=0;i<lines.length;i++){
    const line=lines[i].trim();
    let m=line.match(/^([A-E])\s*[).:\-]?\s+(.+)$/i);
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

export async function extractOfficialQuestion(sourceUrl:string,questionNumber:number):Promise<ParsedQuestion>{
  const pdf=await loadPdf(sourceUrl);
  const collected:string[]=[]; let started=false; let pagesAfterStart=0;
  for(let p=1;p<=pdf.numPages;p++){
    const page=await pdf.getPage(p); const content=await page.getTextContent(); const lines=pageLines(content.items||[]);
    for(const line of lines){
      if(!started){if(isQuestionMarker(line,questionNumber)){started=true;collected.push(line);}continue;}
      if(isQuestionMarker(line,questionNumber+1)){
        const parsed=splitOptions(collected.slice(1));
        if(parsed){
          const imageDependent=/\b(figura|imagem|grafico|gráfico|tabela|mapa|esquema|fotografia|charge|tirinha)\b/i.test(parsed.prompt);
          return {found:true,prompt:parsed.prompt,...Object.fromEntries(['a','b','c','d','e'].map(l=>[`option_${l}`,parsed.opts[l.toUpperCase()]||null])) as any,needs_source_image:imageDependent,image_note:imageDependent?'A questão menciona elemento visual da prova oficial.':'',confidence:.92};
        }
        return {found:false,prompt:'',option_a:null,option_b:null,option_c:null,option_d:null,option_e:null,needs_source_image:false,image_note:null,confidence:0};
      }
      collected.push(line);
    }
    if(started&&++pagesAfterStart>=3)break;
  }
  if(started){
    const parsed=splitOptions(collected.slice(1));
    if(parsed){
      const imageDependent=/\b(figura|imagem|grafico|gráfico|tabela|mapa|esquema|fotografia|charge|tirinha)\b/i.test(parsed.prompt);
      return {found:true,prompt:parsed.prompt,...Object.fromEntries(['a','b','c','d','e'].map(l=>[`option_${l}`,parsed.opts[l.toUpperCase()]||null])) as any,needs_source_image:imageDependent,image_note:imageDependent?'A questão menciona elemento visual da prova oficial.':'',confidence:.88};
    }
  }
  return {found:false,prompt:'',option_a:null,option_b:null,option_c:null,option_d:null,option_e:null,needs_source_image:false,image_note:null,confidence:0};
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
