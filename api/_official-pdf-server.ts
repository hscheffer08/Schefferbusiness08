import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const docs=new Map<string,Promise<string[][]>>();
const BROKEN=/[\uFFFD\u25A0-\u25FF\uE000-\uF8FF]/g;

function clean(s:string){return s.replace(/\s+/g,' ').trim()}
function norm(s:string){return s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase()}
function allowed(raw:string){
  try{
    const u=new URL(raw);
    if(u.protocol!=='https:')return false;
    return ['download.inep.gov.br','vestibular.cmmg.edu.br','www.fuvest.br','fuvest.br'].includes(u.hostname)&&/\.pdf$/i.test(u.pathname);
  }catch{return false}
}
function linesFromItems(items:any[]){
  const rows=new Map<number,{x:number;str:string}[]>();
  for(const item of items){
    const str=String(item?.str||'').trim();if(!str)continue;
    const tr=item?.transform||[];const x=Number(tr[4]||0),y=Number(tr[5]||0);
    const key=Math.round(y/2)*2;
    if(!rows.has(key))rows.set(key,[]);
    rows.get(key)!.push({x,str});
  }
  return [...rows.entries()].sort((a,b)=>b[0]-a[0]).map(([,parts])=>clean(parts.sort((a,b)=>a.x-b.x).map(p=>p.str).join(' '))).filter(Boolean);
}
async function load(sourceUrl:string){
  if(!allowed(sourceUrl))throw new Error('Fonte oficial inválida');
  let cached=docs.get(sourceUrl);if(cached)return cached;
  cached=(async()=>{
    const r=await fetch(sourceUrl,{redirect:'follow',headers:{'User-Agent':'Mozilla/5.0 (compatible; ConectaeOfficialReader/2.0)',Accept:'application/pdf,*/*;q=0.8'},signal:AbortSignal.timeout(30000)});
    if(!r.ok)throw new Error(`PDF HTTP ${r.status}`);
    const buffer=await r.arrayBuffer();
    if(!buffer.byteLength||buffer.byteLength>35*1024*1024)throw new Error('PDF inválido ou grande demais');
    const pdf=await getDocument({data:new Uint8Array(buffer),isEvalSupported:false,useSystemFonts:true,disableFontFace:false}).promise;
    const pages:string[][]=[];
    for(let p=1;p<=pdf.numPages;p++){
      const page=await pdf.getPage(p);const content=await page.getTextContent();
      pages.push(linesFromItems((content as any).items||[]));
    }
    return pages;
  })();
  docs.set(sourceUrl,cached);
  try{return await cached}catch(e){docs.delete(sourceUrl);throw e}
}

function marker(line:string,n:number){
  const s=norm(line).replace(/[^A-Z0-9 ]+/g,' ');
  return new RegExp(`\\bQUEST(?:AO|A0)\\s+0*${n}\\b`).test(s)
    ||new RegExp(`^\\s*0*${n}\\s*[.)-]\\s+\\S`,'i').test(line)
    ||new RegExp(`^\\s*0*${n}\\s*$`).test(line);
}
function stripMarker(line:string,n:number){
  return line.replace(new RegExp(`^\\s*QUEST(?:Ã|A)O\\s+0*${n}\\s*[.):-]?\\s*`,'i'),'')
    .replace(new RegExp(`^\\s*0*${n}\\s*[.):-]?\\s*`,'i'),'').trim();
}
function splitOptions(lines:string[]){
  const hits:{i:number;letter:string;rest:string}[]=[];
  for(let i=0;i<lines.length;i++){
    const line=lines[i].trim();
    let m=line.match(/^([A-E])\s*[).:\-]\s*(.*)$/i);
    if(!m)m=line.match(/^([A-E])\s+(.+)$/i);
    if(m)hits.push({i,letter:m[1].toUpperCase(),rest:m[2]||''});
  }
  for(let start=0;start<hits.length;start++){
    if(hits[start].letter!=='A')continue;
    const chosen:{i:number;letter:string;rest:string}[]=[];
    let cursor=start;
    for(const want of ['A','B','C','D','E']){
      while(cursor<hits.length&&hits[cursor].letter!==want){
        if(hits[cursor].letter==='A'&&want!=='A')break;
        cursor++;
      }
      if(cursor>=hits.length||hits[cursor].letter!==want)break;
      chosen.push(hits[cursor]);cursor++;
    }
    if(chosen.length<4)continue;
    const first=chosen[0].i;
    const opts:Record<string,string|null>={A:null,B:null,C:null,D:null,E:null};
    for(let k=0;k<chosen.length;k++){
      const cur=chosen[k],end=k+1<chosen.length?chosen[k+1].i:lines.length;
      opts[cur.letter]=clean([cur.rest,...lines.slice(cur.i+1,end)].filter(Boolean).join(' '))||null;
    }
    return {prompt:clean(lines.slice(0,first).join(' ')),opts};
  }
  return null;
}
function usable(prompt:string,opts:Record<string,string|null>){
  if(prompt.length<12)return false;
  const fields=[prompt,opts.A,opts.B,opts.C,opts.D,opts.E].filter(Boolean).map(String);
  if(fields.slice(1).length<4)return false;
  const content=fields.join(' '),broken=(content.match(BROKEN)||[]).length;
  if(broken>=2||broken/Math.max(content.length,1)>.003)return false;
  if(/\b(?:DVVLQDOH|DOWHUQDWLYD|TXHVWDR|SHUVRQDJHQV|FRUSR|VHUWDR|UHVSRVWD)\b/i.test(content))return false;
  return true;
}

export async function extractOfficialQuestionServer(sourceUrl:string,questionNumber:number){
  const pages=await load(sourceUrl);
  const collected:string[]=[];let started=false,sourcePage=1,pagesAfter=0;
  for(let p=0;p<pages.length;p++){
    for(const line of pages[p]){
      if(!started){
        if(marker(line,questionNumber)){started=true;sourcePage=p+1;const rest=stripMarker(line,questionNumber);if(rest)collected.push(rest)}
        continue;
      }
      if(marker(line,questionNumber+1)){
        const parsed=splitOptions(collected);
        if(parsed&&usable(parsed.prompt,parsed.opts))return {found:true,prompt:parsed.prompt,option_a:parsed.opts.A,option_b:parsed.opts.B,option_c:parsed.opts.C,option_d:parsed.opts.D,option_e:parsed.opts.E,needs_source_image:/\b(figura|imagem|gr[aá]fico|tabela|mapa|esquema|fotografia|charge|tirinha|texto anterior)\b/i.test(parsed.prompt),image_note:null,source_page:sourcePage,confidence:.94,source:'official-pdf-server'};
        return {found:false};
      }
      collected.push(line);
    }
    if(started&&++pagesAfter>=4)break;
  }
  if(started){
    const parsed=splitOptions(collected);
    if(parsed&&usable(parsed.prompt,parsed.opts))return {found:true,prompt:parsed.prompt,option_a:parsed.opts.A,option_b:parsed.opts.B,option_c:parsed.opts.C,option_d:parsed.opts.D,option_e:parsed.opts.E,needs_source_image:/\b(figura|imagem|gr[aá]fico|tabela|mapa|esquema|fotografia|charge|tirinha|texto anterior)\b/i.test(parsed.prompt),image_note:null,source_page:sourcePage,confidence:.9,source:'official-pdf-server'};
  }
  return {found:false};
}
