export default async function handler(req:any,res:any){
  if(req.method!=='GET')return res.status(405).json({error:'Método não permitido.'});
  const page='https://www.bernoulli.com.br/resolve/provas/cmmg-2025-1o-semestre/';
  try{
    const r=await fetch(page,{headers:{'User-Agent':'Mozilla/5.0 ConectaeSourceAudit/1.0'},signal:AbortSignal.timeout(15000)});
    const html=await r.text();
    const scripts=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m=>m[1]).filter(x=>/answer-sheet|exam-webdoor|wonderkit-bernoulli/i.test(x));
    const findings:any[]=[];
    for(const src of scripts.slice(0,8)){
      try{
        const sr=await fetch(src,{headers:{'User-Agent':'Mozilla/5.0 ConectaeSourceAudit/1.0'},signal:AbortSignal.timeout(10000)});
        const js=await sr.text();
        const urls=[...new Set(js.match(/https?:\/\/[^"'`\s)]+/g)||[])].filter(x=>/bernoulli|azure|api/i.test(x));
        const routes=[...new Set(js.match(/["'`]\/[A-Za-z0-9_?=&${}.:\-/]+["'`]/g)||[])].map(x=>x.slice(1,-1)).filter(x=>/exam|question|quest|answer|prova|gabarito|resolve/i.test(x));
        const azureSnippets=[...js.matchAll(/.{0,140}bernoulliresolve.{0,260}/gi)].map(m=>m[0]).slice(0,10);
        findings.push({src,status:sr.status,length:js.length,urls:urls.slice(0,20),routes:routes.slice(0,40),azureSnippets});
      }catch(error:any){findings.push({src,error:String(error?.message||error)})}
    }
    const htmlSnippets=[...html.matchAll(/.{0,180}bernoulliresolve\.azurewebsites\.net.{0,500}/gi)].map(m=>m[0]).slice(0,10);
    return res.status(200).json({pageStatus:r.status,pageLength:html.length,htmlSnippets,findings});
  }catch(error:any){return res.status(500).json({error:String(error?.message||error)})}
}
