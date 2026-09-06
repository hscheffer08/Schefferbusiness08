import tutorV3 from './education-tutor-v3.js';

const EXAM_CONTEXT:Record<string,string>={
  ibmec:'IBmec 2027.1: trate o processo como vestibular próprio. Na prova escrita, priorize Linguagens, Matemática, Humanas e Redação conforme o modelo cadastrado; quando o contexto indicar etapa de competências, trate Dinâmica de grupo como avaliação comportamental separada da prova escrita. Não invente nota de corte fixa nem chame questões autorais de oficiais.',
  einstein:'Albert Einstein / Vunesp 2027: trate o Vestibular Unificado Einstein como prova própria. Considere a prova escrita com Linguagens, Humanas, Natureza, Matemática, questões analítico-dissertativas e Redação conforme o modelo cadastrado. Para Medicina, quando o contexto indicar MME, trate Múltiplas Minientrevistas como etapa separada focada em comunicação, ética, empatia, decisão, conflitos e trabalho em equipe. Não invente nota de corte fixa nem chame questões autorais de oficiais.',
};

export default async function handler(req:any,res:any){
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
