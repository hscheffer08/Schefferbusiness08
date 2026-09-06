function n(v:unknown,min:number,max:number,fallback:number){const x=Number(v);return Number.isFinite(x)?Math.max(min,Math.min(max,Math.trunc(x))):fallback}

export default async function handler(req:any,res:any){
  if(req.method!=='GET')return res.status(405).json({error:'Método não permitido.'});
  const year=n(req.query?.year,2009,2025,2024);
  const limit=n(req.query?.limit,1,100,50);
  const offset=n(req.query?.offset,0,500,0);
  try{
    const url=`https://api.enem.dev/v1/exams/${year}/questions?limit=${limit}&offset=${offset}`;
    const r=await fetch(url,{headers:{Accept:'application/json','User-Agent':'Conectae/1.0'},signal:AbortSignal.timeout(15000)});
    const text=await r.text();
    if(!r.ok)return res.status(502).json({error:`Fonte ENEM respondeu ${r.status}.`});
    const data=JSON.parse(text);
    res.setHeader('Cache-Control','public, s-maxage=21600, stale-while-revalidate=86400');
    return res.status(200).json(data);
  }catch(error:any){
    console.error('enem-official-questions failed',error?.message||error);
    return res.status(502).json({error:'Não consegui carregar as questões do ENEM agora.'});
  }
}
