import tutorV3 from './education-tutor-v3.js';

const EXAM_CONTEXT:Record<string,string>={
  ibmec:'Ibmec 2027.1: trate o processo como vestibular próprio. Na prova escrita, priorize Linguagens, Matemática, Humanas e Redação conforme o modelo cadastrado; quando o contexto indicar etapa de competências, trate Dinâmica de grupo como avaliação comportamental separada da prova escrita. Não invente nota de corte fixa nem chame questões autorais de oficiais.',
  einstein:'Albert Einstein / Vunesp 2027: trate o Vestibular Unificado Einstein como prova própria. Considere a prova escrita com Linguagens, Humanas, Natureza, Matemática, questões analítico-dissertativas e Redação conforme o modelo cadastrado. Para Medicina, quando o contexto indicar MME, trate Múltiplas Minientrevistas como etapa separada focada em comunicação, ética, empatia, decisão, conflitos e trabalho em equipe. Não invente nota de corte fixa nem chame questões autorais de oficiais.',
};

const QUALITY_CONTEXT='REGRA DE QUALIDADE: exemplos recuperados do banco são material de apoio, não autoridade. Resolva a dúvida de forma independente e use o exemplo apenas se enunciado, gabarito e explicação forem coerentes. Não confie no rótulo de dificuldade para decidir se algo está correto. Se faltar alternativa, figura, dado, convenção ou contexto indispensável, declare a limitação em vez de completar por suposição. Em dúvida conceitual, explique a ideia central e depois mostre como aplicá-la; em questão objetiva, confira a alternativa escolhida contra o enunciado antes de responder.';

function highRiskQuestion(text:string){
  const normalized=String(text||'').toLowerCase();
  const topic=/\b(logarit|probabil|combinat|binomial|bayes|matriz|determinante|fun[cç][aã]o|par[aá]bola|geometr|trigonom|vetor|estequiometr|equil[ií]brio|eletro|circuit|termodin|gen[eé]tic|heran[cç]a|penetr[aâ]ncia|cinem[aá]tic|din[aâ]mic|hidrost|intertext|infer[eê]ncia|ambig|causalidade|correla[cç][aã]o|anacron|argumenta[cç][aã]o)\b/i.test(normalized);
  const reasoning=/\b(prove|demonstre|justifique|explique por que|por que|compare|analise|deduza|determine)\b/i.test(normalized);
  const quantitative=(normalized.match(/\d/g)||[]).length>=5;
  return topic||reasoning||quantitative||normalized.length>=420;
}

export default async function handler(req:any,res:any){
  if(req?.method==='GET'){
    res.setHeader('Cache-Control','no-store');
    return res.status(200).json({ok:true,service:'IA Conectaê v4',model:'openai/gpt-5.6-luna',reviewModel:'google/gemini-3.6-flash',searchModel:'google/gemini-2.5-flash-lite',retrieval:'full-active-corpus+skill+area+difficulty+seen-history+provenance+study-twin+exam-context+quality-guard',supportedExams:['enem','fuvest','cmmg','insper','link','ibmec','einstein'],dailyQuestionLimit:20,adminAccess:'unlimited'});
  }
  if(req?.method==='POST'){
    const body=req.body&&typeof req.body==='object'?req.body:{};
    const context=body.context&&typeof body.context==='object'?body.context:{};
    const exam=String(context.exam||'enem').toLowerCase().slice(0,40);
    const directive=EXAM_CONTEXT[exam];
    const messages=Array.isArray(body.messages)?body.messages:[];
    const latest=String(messages[messages.length-1]?.content||'');
    const prior=Array.isArray(context.recentPerformance)?context.recentPerformance:[];
    const qualityItems=[QUALITY_CONTEXT];
    if(directive)qualityItems.unshift(`CONTEXTO OFICIAL DA PROVA ATIVA — ${directive}`);
    const currentQuestion=String(context.currentQuestion||'');
    const reviewMarker=highRiskQuestion(`${latest} ${currentQuestion}`)
      ? '\n[CHECAGEM AVANÇADA: trate como questão de alta complexidade; verifique domínio, sinais, unidades, causalidade, contraexemplo e consistência da conclusão.]'
      : '';
    req.body={...body,context:{...context,currentQuestion:`${currentQuestion}${reviewMarker}`.slice(0,2200),recentPerformance:[...qualityItems,...prior].slice(0,6)}};
  }
  return tutorV3(req,res);
}
