import analyzeV2 from './analyze-question-v2.js';

const EXAM_CONTEXT:Record<string,string>={
  ibmec:'Vestibular Ibmec 2027.1: classifique dentro da taxonomia Ibmec ativa; diferencie prova escrita de Dinâmica de grupo e não aplique critérios ENEM à redação.',
  einstein:'Vestibular Unificado Albert Einstein/Vunesp 2027: classifique dentro da taxonomia Einstein ativa; diferencie objetivas, questões analítico-dissertativas, Redação e, em Medicina, MME. Não trate MME como questão objetiva.',
};

export default async function handler(req:any,res:any){
  if(req?.method==='POST'){
    const body=req.body&&typeof req.body==='object'?req.body:{};
    const exam=String(body.examId||'enem').toLowerCase().slice(0,40);
    const extra=EXAM_CONTEXT[exam];
    if(extra)req.body={...body,textHint:`${extra}${body.textHint?`\n${String(body.textHint).slice(0,1800)}`:''}`};
  }
  return analyzeV2(req,res);
}
