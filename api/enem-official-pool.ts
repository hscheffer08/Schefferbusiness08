type RawAlt={letter?:string;text?:string;file?:string|null;isCorrect?:boolean};
type RawQuestion={title?:string;index?:number;discipline?:string;language?:string|null;year?:number;context?:string|null;files?:string[];correctAlternative?:string;alternativesIntroduction?:string;alternatives?:RawAlt[]};

const YEARS=[2023,2022];
const OFFSETS=[0,50,100,150];
const AREA_MAP:Record<string,string>={
  'linguagens':'Linguagens',
  'ciencias-humanas':'Humanas',
  'ciências-humanas':'Humanas',
  'ciencias-da-natureza':'Natureza',
  'ciencias-natureza':'Natureza',
  'ciências-da-natureza':'Natureza',
  'matematica':'Matemática',
  'matemática':'Matemática',
};
const AREAS=['Linguagens','Humanas','Natureza','Matemática'];

function areaOf(v:unknown){return AREA_MAP[String(v||'').toLowerCase().trim()]||''}
function cleanText(v:unknown){return String(v||'').replace(/\r/g,'').trim()}
function usable(q:RawQuestion){
  const area=areaOf(q.discipline); if(!area)return false;
  const index=Number(q.index); if(!Number.isInteger(index)||index<1||index>200)return false;
  const correct=String(q.correctAlternative||'').toUpperCase(); if(!/^[A-E]$/.test(correct))return false;
  const alts=(q.alternatives||[]).filter(a=>/^[A-E]$/i.test(String(a.letter||''))&&cleanText(a.text).length>0);
  if(alts.length<5)return false;
  const intro=cleanText(q.alternativesIntroduction),context=cleanText(q.context);
  if(intro.length<8&&context.length<20)return false;
  if(/broken-image\.svg/i.test(context)&&!(q.files||[]).some(x=>x&&!/broken-image\.svg/i.test(x)))return false;
  return true;
}
async function page(year:number,offset:number){
  const url=`https://api.enem.dev/v1/exams/${year}/questions?limit=50&offset=${offset}`;
  const r=await fetch(url,{headers:{Accept:'application/json','User-Agent':'Conectae/1.0'},signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw new Error(`ENEM ${year}/${offset}: HTTP ${r.status}`);
  const data=await r.json(); return Array.isArray(data?.questions)?data.questions as RawQuestion[]:[];
}

export default async function handler(req:any,res:any){
  if(req.method!=='GET')return res.status(405).json({error:'Método não permitido.'});
  try{
    const results=await Promise.all(YEARS.flatMap(year=>OFFSETS.map(offset=>page(year,offset).catch(()=>[]))));
    const raw=results.flat();
    const seen=new Set<string>();
    const byArea:Record<string,any[]>=Object.fromEntries(AREAS.map(a=>[a,[]]));
    for(const q of raw){
      if(!usable(q))continue;
      const area=areaOf(q.discipline); const lang=String(q.language||'').toLowerCase();
      if(area==='Linguagens'&&lang&&lang!=='espanhol')continue;
      const key=`${q.year}:${q.index}:${lang||'base'}`; if(seen.has(key))continue; seen.add(key);
      const alternatives=(q.alternatives||[]).map(a=>({letter:String(a.letter||'').toUpperCase(),text:cleanText(a.text),file:a.file||null})).filter(a=>/^[A-E]$/.test(a.letter)&&a.text);
      const files=[...(q.files||[]),...alternatives.map(a=>a.file).filter(Boolean) as string[]].filter((x,i,a)=>x&&!/broken-image\.svg/i.test(x)&&a.indexOf(x)===i);
      byArea[area].push({
        id:`enem:${q.year}:${q.index}:${lang||'base'}`,
        exam:'ENEM',year:Number(q.year),number:Number(q.index),area,discipline:String(q.discipline||''),language:q.language||null,
        context:cleanText(q.context).replace(/!\[[^\]]*\]\([^)]*\)/g,'').replace(/\*\*/g,'').trim(),
        prompt:cleanText(q.alternativesIntroduction).replace(/\*\*/g,''),
        alternatives,correctOption:String(q.correctAlternative).toUpperCase(),files,
        source:'enem.dev / dados públicos do ENEM',
      });
    }
    for(const area of AREAS){byArea[area].sort((a,b)=>b.year-a.year||a.number-b.number);byArea[area]=byArea[area].slice(0,60)}
    const questions=AREAS.flatMap(a=>byArea[a]); const counts=Object.fromEntries(AREAS.map(a=>[a,byArea[a].length]));
    const guaranteed=AREAS.every(a=>counts[a]>=50);
    res.setHeader('Cache-Control','public, s-maxage=21600, stale-while-revalidate=86400');
    return res.status(guaranteed?200:503).json({guaranteed,counts,questions,years:YEARS});
  }catch(error:any){
    console.error('enem-official-pool failed',error?.message||error);
    return res.status(502).json({error:'Não consegui montar o banco oficial do ENEM.',detail:String(error?.message||error).slice(0,300)});
  }
}
