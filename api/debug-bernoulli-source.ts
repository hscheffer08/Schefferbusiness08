export default async function handler(req:any,res:any){
  if(req.method!=='GET')return res.status(405).json({error:'Método não permitido.'});
  const url='https://www.bernoulli.com.br/resolve/provas/cmmg-2025-1o-semestre/';
  try{
    const r=await fetch(url,{headers:{'User-Agent':'Mozilla/5.0 ConectaeSourceAudit/1.0'},signal:AbortSignal.timeout(15000)});
    const html=await r.text();
    const scripts=[...html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)].map(m=>m[1]).slice(0,30);
    const endpoints=[...new Set((html.match(/https?:[^"'<>\s]+/g)||[]).filter(x=>/api|ajax|json|resolve|question|questao/i.test(x)).slice(0,50))];
    const wp=html.includes('wp-content');
    const rest=html.match(/https?:\/\/[^"']+wp-json[^"']*/gi)||[];
    const ajax=html.match(/[^"']*admin-ajax[^"']*/gi)||[];
    const markers=['__NEXT_DATA__','wpApiSettings','admin-ajax.php','questao','question','gabarito'].filter(x=>html.toLowerCase().includes(x.toLowerCase()));
    return res.status(200).json({status:r.status,length:html.length,wp,scripts,endpoints,rest:rest.slice(0,10),ajax:ajax.slice(0,10),markers});
  }catch(error:any){return res.status(500).json({error:String(error?.message||error)})}
}
