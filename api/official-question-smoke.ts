export default async function handler(req:any,res:any){
  if(req.method!=='GET')return res.status(405).json({ok:false});
  const source='https://download.inep.gov.br/enem/provas_e_gabaritos/2025_PV_impresso_D2_CD5.pdf';
  const proxy=`https://kmognvgnfisdchzffkgh.supabase.co/functions/v1/official-pdf-proxy?url=${encodeURIComponent(source)}`;
  try{
    const r=await fetch(proxy,{signal:AbortSignal.timeout(30000)});
    const type=r.headers.get('content-type')||'';
    const bytes=Buffer.from(await r.arrayBuffer());
    return res.status(r.ok&&bytes.length>1000?200:500).json({ok:r.ok&&bytes.length>1000,status:r.status,type,bytes:bytes.length});
  }catch(error:any){
    return res.status(500).json({ok:false,error:String(error?.message||error).slice(0,500)});
  }
}
