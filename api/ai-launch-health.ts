import { generateText } from 'ai';

export default async function handler(_req:any,res:any){
  res.setHeader('Cache-Control','no-store');
  try{
    const { text } = await generateText({
      model:'openai/gpt-5.6-sol',
      prompt:'Responda apenas OK.',
    });
    return res.status(200).json({ok:text.trim()==='OK',model:'openai/gpt-5.6-sol'});
  }catch(error:any){
    console.error('ai launch health failed',error?.statusCode||'',error?.message||error);
    return res.status(503).json({ok:false,status:error?.statusCode||null,reason:String(error?.message||error).slice(0,240)});
  }
}
