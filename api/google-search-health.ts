import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export default async function handler(req:any,res:any){
  if(req.method!=='GET')return res.status(405).json({ok:false});
  try{
    const result=await generateText({
      model:'google/gemini-2.5-flash-lite',
      prompt:'Pesquise no Google a questão FUVEST-Ete 2022 sobre mutação heterozigota BRCA2 e probabilidades de câncer de mama em descendente masculino ou feminino. Responda apenas com uma frase curta dizendo se encontrou resultados relacionados.',
      tools:{google_search:google.tools.googleSearch({})},
      toolChoice:'required',
      maxOutputTokens:300,
      abortSignal:AbortSignal.timeout(45000)
    } as any);
    return res.status(200).json({ok:true,text:String(result.text||'').slice(0,500),sources:Array.isArray((result as any).sources)?(result as any).sources.length:0});
  }catch(error:any){console.error('google search health failed',error?.statusCode||'',error?.message||error);return res.status(500).json({ok:false,status:error?.statusCode||null,error:String(error?.message||error).slice(0,500)});}
}
