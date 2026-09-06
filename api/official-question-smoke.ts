import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export default async function handler(req:any,res:any){
  if(req.method!=='GET')return res.status(405).json({ok:false});
  const hasDirectKey=Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  try{
    const out=await generateText({
      model:google('gemini-2.5-flash-lite'),
      messages:[{role:'user',content:[
        {type:'text',text:'Leia a prova oficial anexada e confirme se consegue localizar a QUESTÃO 94. Retorne apenas JSON válido: {"found":true|false,"has_options":true|false}. Não forneça o enunciado nem a resposta.'},
        {type:'file',mediaType:'application/pdf',data:'https://download.inep.gov.br/enem/provas_e_gabaritos/2025_PV_impresso_D2_CD5.pdf'}
      ]}],
      maxOutputTokens:100,
      abortSignal:AbortSignal.timeout(60000)
    } as any);
    return res.status(200).json({ok:true,hasDirectKey,text:String(out.text||'').slice(0,300)});
  }catch(error:any){
    return res.status(500).json({ok:false,hasDirectKey,error:String(error?.message||error).slice(0,500)});
  }
}
