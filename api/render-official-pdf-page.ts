import { createCanvas } from '@napi-rs/canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { WorkerMessageHandler } from 'pdfjs-dist/legacy/build/pdf.worker.mjs';

(globalThis as any).pdfjsWorker={WorkerMessageHandler};

const OFFICIAL_HOSTS=new Set(['download.inep.gov.br','vestibular.cmmg.edu.br','www.fuvest.br','fuvest.br','backend.copeve.ufmg.br']);
const SUPABASE_URL=(process.env.SUPABASE_URL||'https://kmognvgnfisdchzffkgh.supabase.co').replace(/\/$/,'');
const SUPABASE_ANON_KEY=process.env.SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_ANON_KEY||'';
const PROXY=`${SUPABASE_URL}/functions/v1/official-pdf-proxy`;

function allowed(raw:unknown){try{const u=new URL(String(raw||''));return u.protocol==='https:'&&OFFICIAL_HOSTS.has(u.hostname)&&/\.pdf$/i.test(u.pathname)?u.toString():''}catch{return''}}
async function fetchPdf(sourceUrl:string){
  const headers={'User-Agent':'Mozilla/5.0 Conectae/1.0','Accept':'application/pdf,application/octet-stream;q=0.9,*/*;q=0.8'};
  try{const r=await fetch(sourceUrl,{headers,redirect:'follow',signal:AbortSignal.timeout(15000)});if(r.ok){const b=await r.arrayBuffer();if(b.byteLength>4&&String.fromCharCode(...new Uint8Array(b,0,5))==='%PDF-')return b;}}catch{}
  const r=await fetch(`${PROXY}?url=${encodeURIComponent(sourceUrl)}`,{headers:{...headers,...(SUPABASE_ANON_KEY?{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`}:{})},signal:AbortSignal.timeout(20000)});
  if(!r.ok)throw new Error(`PDF HTTP ${r.status}`);const b=await r.arrayBuffer();if(b.byteLength<5||String.fromCharCode(...new Uint8Array(b,0,5))!=='%PDF-')throw new Error('invalid-pdf');return b;
}

class CanvasFactory{
  create(width:number,height:number){const canvas:any=createCanvas(Math.ceil(width),Math.ceil(height));return{canvas,context:canvas.getContext('2d')}}
  reset(target:any,width:number,height:number){target.canvas.width=Math.ceil(width);target.canvas.height=Math.ceil(height)}
  destroy(target:any){target.canvas.width=0;target.canvas.height=0;target.canvas=null;target.context=null}
}

export default async function handler(req:any,res:any){
  if(!['GET','HEAD'].includes(req.method))return res.status(405).json({error:'Método não permitido.'});
  const sourceUrl=allowed(req.query?.sourceUrl);const pageNumber=Number(req.query?.page);
  if(!sourceUrl||!Number.isInteger(pageNumber)||pageNumber<1||pageNumber>200)return res.status(400).json({error:'Fonte ou página inválida.'});
  try{
    const bytes=await fetchPdf(sourceUrl);const pdf=await getDocument({data:new Uint8Array(bytes),isEvalSupported:false,useSystemFonts:true,disableFontFace:false}).promise;
    if(pageNumber>pdf.numPages)return res.status(404).json({error:'Página inexistente.'});
    const page=await pdf.getPage(pageNumber);const viewport=page.getViewport({scale:1.65});const factory:any=new CanvasFactory();const target=factory.create(viewport.width,viewport.height);
    target.context.fillStyle='#ffffff';target.context.fillRect(0,0,target.canvas.width,target.canvas.height);
    await page.render({canvasContext:target.context,viewport,canvasFactory:factory}).promise;
    const buffer=await target.canvas.encode('jpeg',88);
    res.setHeader('Content-Type','image/jpeg');res.setHeader('Cache-Control','public, max-age=86400, s-maxage=31536000, stale-while-revalidate=31536000');
    if(req.method==='HEAD')return res.status(200).end();return res.status(200).send(Buffer.from(buffer));
  }catch(error:any){console.error('render-official-pdf-page failed',String(error?.message||error));return res.status(502).json({error:'Não consegui renderizar esta página oficial.'});}
}
