import { isEnemScoringModel, type ExamMetric, type ExamModel } from './exam-models.ts';
const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export function goalFor(metric:ExamMetric,model:ExamModel,dataGoal?:number){
  if(Number.isFinite(dataGoal))return clamp(Number(dataGoal),0,metric.max);
  if(Number.isFinite(metric.goal))return clamp(Number(metric.goal),0,metric.max);
  if(isEnemScoringModel(model)){
    const fallback:Record<string,number>={Linguagens:700,Humanas:720,Natureza:760,'Matemática':790,'Redação':880};
    return fallback[metric.key]??Math.round(metric.max*.8);
  }
  if(model.scoreProfile==='component'){
    const pct=metric.unit==='desempenho'?.8:metric.key==='Redação'?.8:.78;
    return Math.max(metric.unit==='acertos'?1:0,Math.round(metric.max*pct));
  }
  const examId=model.examId;
  if(examId==='cmmg'){
    if(metric.key==='Redação')return Math.round(metric.max*.8);
    const pct:Record<string,number>={'Língua Portuguesa':.78,'Literatura':.75,'Inglês':.78,'Biologia':.82,'Física':.75,'Química':.8,'Matemática':.8,'Linguagens':.8,'Conhecimentos Gerais':.75,'Humanas':.75};
    return Math.max(1,Math.round(metric.max*(pct[metric.key]??.78)));
  }
  if(examId==='insper')return metric.key==='Redação'?75:12;
  if(examId==='fgv')return Math.max(1,Math.round(metric.max*.8));
  if(examId==='ibmec'){
    const pct:Record<string,number>={Linguagens:.78,'Matemática':.8,Humanas:.76,'Redação':.78,'Dinâmica':.8};
    return Math.max(1,Math.round(metric.max*(pct[metric.key]??.78)));
  }
  if(examId==='einstein'){
    const pct:Record<string,number>={Linguagens:.8,Humanas:.8,Natureza:.82,'Matemática':.82,Dissertativas:.8,'Redação':.82,MME:.8};
    return Math.max(1,Math.round(metric.max*(pct[metric.key]??.8)));
  }
  if(examId==='fuvest'){
    if(metric.key==='1ª fase')return Math.round(metric.max*.8);
    if(metric.key==='Português'||metric.key==='Redação')return 36;
    return 72;
  }
  if(examId==='link'){
    const target:Record<string,number>={'Matemática':75,'Business Case':82,'Escrita':80,'Oral':80,'Portfólio':78,'Entrevista':80};
    return target[metric.key]??78;
  }
  return Math.max(metric.unit==='acertos'?1:0,Math.round(metric.max*.8));
}

export function enemGoalsFromCutoff(cutoff:number){
  if(cutoff>=815)return {Linguagens:740,Humanas:760,Natureza:820,'Matemática':850,'Redação':930};
  if(cutoff>=800)return {Linguagens:720,Humanas:740,Natureza:800,'Matemática':830,'Redação':910};
  if(cutoff>=780)return {Linguagens:700,Humanas:720,Natureza:770,'Matemática':810,'Redação':890};
  if(cutoff>=760)return {Linguagens:680,Humanas:700,Natureza:750,'Matemática':790,'Redação':870};
  if(cutoff>=740)return {Linguagens:660,Humanas:680,Natureza:730,'Matemática':770,'Redação':850};
  return {Linguagens:640,Humanas:660,Natureza:700,'Matemática':740,'Redação':820};
}


export function componentGoals(model: ExamModel, target: number | null | undefined, overridden = false): Record<string, number> {
  if (target == null || !Number.isFinite(target) || target <= 0) return {};
  const max = model.overall?.max;
  if (model.scoreProfile !== 'component' || !max || !Number.isFinite(max) || (!overridden && model.metrics.some(m => Number.isFinite(m.goal)))) return {};
  const ratio = clamp(target / max, 0, 1);
  return Object.fromEntries(model.metrics.map(m => [m.key, clamp(m.unit === 'acertos' ? Math.max(1, Math.ceil(m.max * ratio)) : Math.round(m.max * ratio * 10) / 10, 0, m.max)]));
}
