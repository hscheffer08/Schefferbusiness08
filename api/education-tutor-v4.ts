import tutorV3 from './education-tutor-v3.js';

const EXAM_CONTEXT:Record<string,string>={
  ibmec:'Ibmec 2027.1: trate o processo como vestibular próprio. Na prova escrita, priorize Linguagens, Matemática, Humanas e Redação conforme o modelo cadastrado; quando o contexto indicar etapa de competências, trate Dinâmica de grupo como avaliação comportamental separada da prova escrita. Não invente nota de corte fixa nem chame questões autorais de oficiais.',
  einstein:'Albert Einstein / Vunesp 2027: trate o Vestibular Unificado Einstein como prova própria. Considere a prova escrita com Linguagens, Humanas, Natureza, Matemática, questões analítico-dissertativas e Redação conforme o modelo cadastrado. Para Medicina, quando o contexto indicar MME, trate Múltiplas Minientrevistas como etapa separada focada em comunicação, ética, empatia, decisão, conflitos e trabalho em equipe. Não invente nota de corte fixa nem chame questões autorais de oficiais.',
};

export default async function handler(req:any,res:any){
  if(req?.method==='GET'){
    res.setHeader('Cache-Control','no-store');
    return res.status(200).json({ok:true,service:'IA Conectaê v4',model:'openai/gpt-5.6-luna',reviewModel:'google/gemini-3.6-flash',searchModel:'google/gemini-2.5-flash-lite',retrieval:'full-active-corpus+skill+area+difficulty+seen-history+provenance+study-twin+exam-context',supportedExams:['enem','fuvest','cmmg','insper','link','ibmec','einstein'],dailyQuestionLimit:20,adminAccess:'unlimited'});
  }
  if(req?.method==='POST'){
    const body=req.body&&typeof req.body==='object'?req.body:{};
    const context=body.context&&typeof body.context==='object'?body.context:{};
    const exam=String(context.exam||'enem').toLowerCase().slice(0,40);
    const directive=EXAM_CONTEXT[exam];
    if(directive){
      const prior=Array.isArray(context.recentPerformance)?context.recentPerformance:[];
      req.body={...body,context:{...context,recentPerformance:[`CONTEXTO OFICIAL DA PROVA ATIVA — ${directive}`,...prior].slice(0,6)}};
    }
  }
  return tutorV3(req,res);
}
