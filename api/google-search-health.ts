import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export default async function handler(req:any,res:any){
  if(req.method!=='GET')return res.status(405).json({ok:false});
  try{
    const result=await generateText({
      model:'google/gemini-2.5-flash-lite',
      prompt:'Use obrigatoriamente o Google Search antes de responder. Pesquise a questão FUVEST-Ete 2022 sobre mutação heterozigota BRCA2 e probabilidades de câncer de mama em descendente masculino ou feminino. Diga em uma frase o que encontrou e não responda sem pesquisar.',
      tools:{google_search:google.tools.googleSearch({})},
      maxOutputTokens:500,
      abortSignal:AbortSignal.timeout(45000)
    } as any);
    const sources=Array.isArray((result as any).sources)?(result as any).sources:[];
    return res.status(200).json({ok:true,text:String(result.text||'').slice(0,700),sources:sources.length,sourceUrls:sources.slice(0,3).map((s:any)=>s?.url||'')});
  }catch(error:any){console.error('google search health failed',error?.statusCode||'',error?.message||error);return res.status(500).json({ok:false,status:error?.statusCode||null,error:String(error?.message||error).slice(0,500)});}
}
