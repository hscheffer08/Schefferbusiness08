export default async function handler(req:any,res:any){
  const url='https://www.bernoulli.com.br/app/uploads/2024/11/2025-CMMG-1-Questao-25.webp';
  try{
    const r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 ConectaeSourceAudit/1.0'},signal:AbortSignal.timeout(15000)});
    if(!r.ok)return res.status(502).json({error:`HTTP ${r.status}`});
    const b=Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type',r.headers.get('content-type')||'image/webp');
    res.setHeader('Cache-Control','no-store');
    return res.status(200).send(b);
  }catch(error:any){return res.status(500).json({error:String(error?.message||error)})}
}
