import { generateText } from 'ai';
export default async function handler(req:any,res:any){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET')return res.status(405).json({ok:false});
  try{
    const result=await generateText({model:'openai/gpt-5.6-sol',prompt:'Responda somente: OK',maxOutputTokens:8,abortSignal:AbortSignal.timeout(30000)} as any);
    return res.status(200).json({ok:String(result.text||'').toUpperCase().includes('OK')});
  }catch(error:any){
    console.error('ai launch health failed',error?.statusCode||'',error?.message||error);
    return res.status(503).json({ok:false,status:Number(error?.statusCode||0),reason:String(error?.message||'gateway unavailable').slice(0,180)});
  }
}
