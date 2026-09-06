export default async function handler(req:any,res:any){
  if(req.method!=='GET')return res.status(405).json({error:'Método não permitido.'});
  const page='https://www.bernoulli.com.br/resolve/provas/cmmg-2025-1o-semestre/';
  try{
    const r=await fetch(page,{headers:{'User-Agent':'Mozilla/5.0 ConectaeSourceAudit/1.0'},signal:AbortSignal.timeout(15000)});
    const html=await r.text();
    const needles=['Questão 1','Questão 25','Questão 51','questao-1','question-1','answer-sheet','gabarito','Português','Biologia'];
    const snippets=needles.map(needle=>{const i=html.toLowerCase().indexOf(needle.toLowerCase());return {needle,index:i,snippet:i>=0?html.slice(Math.max(0,i-600),Math.min(html.length,i+1800)):''}});
    const dataAttrs=[...new Set((html.match(/data-[a-z0-9_-]+=["'][^"']{0,300}["']/gi)||[]).filter(x=>/question|quest|answer|exam|prova|id/i.test(x)).slice(0,100))];
    const classes=[...new Set((html.match(/class=["'][^"']+["']/gi)||[]).filter(x=>/question|quest|answer|exam|gabar|prova/i.test(x)).slice(0,100))];
    return res.status(200).json({status:r.status,length:html.length,snippets,dataAttrs,classes});
  }catch(error:any){return res.status(500).json({error:String(error?.message||error)})}
}
