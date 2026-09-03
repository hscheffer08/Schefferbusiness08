import { generateText } from 'ai';

const MODEL='openai/gpt-5.4-mini';
const FALLBACK_MODELS=['openai/gpt-5.4-nano','google/gemini-3.6-flash'];

export default async function handler(req:any,res:any){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET')return res.status(405).json({ok:false});
  try{
    const result=await generateText({
      model:MODEL,
      prompt:'Responda apenas com a palavra APROVADO.',
      maxOutputTokens:20,
      abortSignal:AbortSignal.timeout(30000),
      providerOptions:{gateway:{models:FALLBACK_MODELS,tags:['temporary-release-check']}}
    } as any);
    return res.status(200).json({ok:true,text:String(result.text||'').trim(),model:(result as any).response?.modelId||MODEL});
  }catch(error:any){
    console.error('temporary AI release check failed',error?.statusCode||'',error?.message||error);
    return res.status(502).json({ok:false,error:String(error?.message||'AI unavailable').slice(0,500)});
  }
}
