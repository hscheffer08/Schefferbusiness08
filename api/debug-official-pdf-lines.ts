import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

function allowed(raw:unknown){
  try{const u=new URL(String(raw||''));return u.protocol==='https:'&&['download.inep.gov.br','vestibular.cmmg.edu.br','www.fuvest.br','fuvest.br'].includes(u.hostname)&&/\.pdf$/i.test(u.pathname)?u.toString():''}catch{return''}
}
export default async function handler(req:any,res:any){
  if(req.method!=='GET')return res.status(405).json({error:'Método não permitido.'});
  const sourceUrl=allowed(req.query?.url);const pageNumber=Math.max(1,Math.min(20,Number(req.query?.page)||2));
  if(!sourceUrl)return res.status(400).json({error:'URL inválida'});
  try{
    const r=await fetch(sourceUrl,{redirect:'follow',headers:{'User-Agent':'Mozilla/5.0','Accept':'application/pdf'},signal:AbortSignal.timeout(30000)});
    if(!r.ok)throw new Error(`PDF HTTP ${r.status}`);
    const pdf=await getDocument({data:new Uint8Array(await r.arrayBuffer()),isEvalSupported:false,useSystemFonts:true,disableFontFace:false}).promise;
    const page=await pdf.getPage(Math.min(pageNumber,pdf.numPages));const content=await page.getTextContent();
    const rows=(content as any).items.map((item:any)=>({str:String(item?.str||''),x:Number(item?.transform?.[4]||0),y:Number(item?.transform?.[5]||0)})).filter((x:any)=>x.str.trim());
    return res.status(200).json({page:pageNumber,pages:pdf.numPages,items:rows.slice(0,1000)});
  }catch(e:any){return res.status(500).json({error:String(e?.message||e)});}
}
