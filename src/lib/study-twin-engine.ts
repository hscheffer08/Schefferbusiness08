export type TwinAttempt = {
  exam_id: string;
  area: string;
  skill_name?: string | null;
  correct: boolean | null;
  created_at?: string | null;
  duration_seconds?: number | null;
};

export type TwinDiagnostic = {
  area: string;
  skill_code?: string | null;
  error_type?: string | null;
  created_at?: string | null;
  diagnosis?: { skill_name?: string; level?: number; subject?: string } | null;
};

export type TwinPriority = {
  metric: { key: string; label: string; max: number; unit?: string };
  current: number;
  goal: number;
  missing: number;
  score: number;
  accuracy?: number | null;
};

export type TwinFocus = {
  key: string;
  label: string;
  area: string;
  status: 'prioridade' | 'forca' | 'manutencao' | 'medir';
  focusScore: number;
  accuracy: number | null;
  rawAccuracy: number | null;
  attempts: number;
  correct: number;
  confidence: 'alta' | 'moderada' | 'baixa';
  declaredDifficulty: number;
  diagnosticCount: number;
  dominantError: string | null;
  minutesPerWeek: number;
  method: string;
  evidence: string;
  successCriterion: string;
};

export type StudyTwin = {
  generatedAt: string;
  examId: string;
  evidenceScore: number;
  evidenceLabel: 'forte' | 'moderada' | 'inicial';
  measuredAttempts: number;
  measuredSkills: number;
  strongest: TwinFocus | null;
  priorities: TwinFocus[];
  maintenance: TwinFocus[];
  dataGaps: TwinFocus[];
  nextActions: string[];
  summary: string;
};

const norm=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const clamp=(value:number,min=0,max=1)=>Math.max(min,Math.min(max,value));

function areaMatches(area:string,key:string){
  const a=norm(area),k=norm(key.replace('2ª fase — ','').replace('2a fase — ',''));
  if(!a||!k)return false;
  if(a===k||a.includes(k)||k.includes(a))return true;
  if(k==='natureza')return ['natureza','biologia','fisica','quimica'].some(x=>a.includes(x));
  if(k==='humanas'||k==='conhecimentos gerais')return ['humanas','humanidades','historia','geografia','filosofia','sociologia','conhecimentos gerais'].some(x=>a.includes(x));
  if(k==='linguagens')return ['linguagens','lingua portuguesa','portugues','literatura','ingles'].some(x=>a.includes(x));
  if(k==='1ª fase')return true;
  if(k==='oral')return a.includes('oral')||a.includes('comunicacao')||a.includes('entrevista');
  if(k==='portfolio')return a.includes('prep')||a.includes('portfolio');
  if(k==='escrita')return a.includes('business case')||a.includes('sprint')||a.includes('escrita');
  if(k==='matematica')return a.includes('matematica')||a.includes('sprint');
  return false;
}

function difficultyForArea(selection:Record<string,number>,area:string){
  const a=norm(area);
  const matched=Object.entries(selection).filter(([key])=>{
    const k=norm(key.replace(/[|:_-]+/g,' '));
    return areaMatches(k,a)||k.includes(a)||a.includes(k);
  }).map(([,level])=>Number(level)||0);
  return matched.length?Math.max(...matched):0;
}

function errorLabel(type:string|null){
  const labels:Record<string,string>={
    conteudo:'conteúdo',interpretacao:'interpretação',tempo:'tempo de prova',calculo:'cálculo/procedimento',distracao:'atenção',estrategia:'estratégia',declared_difficulty:'dificuldade declarada',questao_autoral:'questão autoral'
  };
  return type?labels[type]||type.replace(/_/g,' '):'erro não classificado';
}

function methodFor(input:{accuracy:number|null;attempts:number;dominantError:string|null;declaredDifficulty:number}){
  const {accuracy,attempts,dominantError,declaredDifficulty}=input;
  if(attempts<3)return 'Faça primeiro um bloco diagnóstico de 8–12 questões variadas, sem consulta, marcando tempo e tipo de erro. Só depois aumente ou reduza o foco.';
  if(dominantError==='tempo')return 'Use microblocos cronometrados, regra de pular/voltar e revisão dos itens em que o tempo estourou. Treine velocidade sem sacrificar a precisão.';
  if(dominantError==='interpretacao')return 'Antes de resolver, reescreva o comando em uma frase, destaque dados/restrições e a evidência decisiva. Depois faça questões mistas e justifique por que as alternativas erradas falham.';
  if(dominantError==='calculo')return 'Refaça o procedimento em etapas curtas, com unidades e sinais explícitos; depois use questões progressivas e encerre com um bloco sem consulta.';
  if(dominantError==='distracao')return 'Use um checklist de 10 segundos: comando, unidade, sinal, EXCETO/incorreta e resposta pedida. Faça blocos curtos com conferência final obrigatória.';
  if(dominantError==='estrategia')return 'Treine identificação de ferramenta: “o que tenho → o que preciso → qual modelo resolve”. Misture tipos de questão para evitar decorar um único caminho.';
  if(accuracy!==null&&accuracy<.58)return 'Reconstrua a base: conceito em recuperação ativa, 2–3 exemplos resolvidos com explicação própria e 10–15 questões graduais antes de cronometrar.';
  if(accuracy!==null&&accuracy<.76)return 'Faça prática deliberada mista: 12–18 questões, caderno de erros por causa, revisão espaçada em 48 h e novo bloco com questões diferentes.';
  if(accuracy!==null&&accuracy<.88)return 'Transforme domínio em consistência: blocos cronometrados, questões de nível alto e revisão apenas dos erros e hesitações.';
  if(declaredDifficulty>=2)return 'Seu desempenho está bom, mas a sensação de dificuldade ainda é alta. Faça manutenção com questões espaçadas e registre confiança/tempo para confirmar domínio real.';
  return 'Mantenha com recuperação espaçada e poucos itens difíceis. Não gaste tempo excessivo aqui enquanto houver prioridades de maior retorno.';
}

function confidenceFor(attempts:number):'alta'|'moderada'|'baixa'{
  if(attempts>=12)return'alta';
  if(attempts>=5)return'moderada';
  return'baixa';
}

function recencyWeight(iso?:string|null){
  if(!iso)return .55;
  const age=(Date.now()-new Date(iso).getTime())/86400000;
  if(age<=7)return 1;
  if(age<=21)return .85;
  if(age<=60)return .7;
  return .55;
}

export function buildStudyTwin(input:{
  examId:string;
  priorities:TwinPriority[];
  attempts:TwinAttempt[];
  diagnostics:TwinDiagnostic[];
  difficultyTopics:Record<string,number>;
  weeklyHours:number;
}):StudyTwin{
  const attempts=input.attempts.filter(a=>a.exam_id===input.examId&&a.correct!==null);
  const weeklyMinutes=Math.max(180,Math.round(input.weeklyHours*60));
  const focusRows=input.priorities.map(priority=>{
    const areaAttempts=attempts.filter(a=>areaMatches(a.area,priority.metric.key));
    const correct=areaAttempts.filter(a=>a.correct===true).length;
    const total=areaAttempts.length;
    const rawAccuracy=total?correct/total:null;
    // Beta(2,2) smoothing prevents tiny samples from looking like certainty.
    const accuracy=total?(correct+2)/(total+4):null;
    const recentFactor=areaAttempts.length?Math.max(...areaAttempts.map(a=>recencyWeight(a.created_at))):.55;
    const relatedDiagnostics=input.diagnostics.filter(d=>areaMatches(d.area,priority.metric.key));
    const errors=new Map<string,number>();
    for(const d of relatedDiagnostics){if(d.error_type)errors.set(d.error_type,(errors.get(d.error_type)||0)+1)}
    const dominantError=[...errors.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]||null;
    const declaredDifficulty=difficultyForArea(input.difficultyTopics,priority.metric.key);
    const gapNorm=clamp(priority.missing/Math.max(1,priority.metric.max));
    const errorNeed=accuracy===null?.52:1-accuracy;
    const sampleConfidence=clamp(total/12);
    const diagnosticNeed=clamp(relatedDiagnostics.length/5);
    const declaredNeed=declaredDifficulty/3;
    const focusScore=clamp((gapNorm*.34)+(errorNeed*.31)+(declaredNeed*.16)+(diagnosticNeed*.11)+((1-sampleConfidence)*.05)+(recentFactor*.03));
    return {priority,areaAttempts,correct,total,rawAccuracy,accuracy,recentFactor,relatedDiagnostics,dominantError,declaredDifficulty,focusScore};
  });

  const needRows=[...focusRows].sort((a,b)=>b.focusScore-a.focusScore);
  const allocatable=weeklyMinutes*.82;
  const scoreTotal=needRows.reduce((sum,row)=>sum+Math.max(.08,row.focusScore),0)||1;
  const maintenanceBudget=weeklyMinutes-allocatable;

  const focuses:TwinFocus[]=needRows.map((row,index)=>{
    const confidence=confidenceFor(row.total);
    const minutes=Math.max(20,Math.round((allocatable*Math.max(.08,row.focusScore)/scoreTotal)/10)*10);
    const gap=row.priority.missing;
    const evidenceParts:string[]=[];
    if(row.total)evidenceParts.push(`${row.correct}/${row.total} acertos medidos (${Math.round((row.rawAccuracy||0)*100)}%)`);
    else evidenceParts.push('sem amostra suficiente de questões respondidas');
    if(gap>0)evidenceParts.push(`faltam ${gap} ${row.priority.metric.unit==='acertos'?'acertos':'pontos'} para a meta`);
    if(row.declaredDifficulty)evidenceParts.push(`dificuldade declarada nível ${row.declaredDifficulty}`);
    if(row.relatedDiagnostics.length)evidenceParts.push(`${row.relatedDiagnostics.length} diagnóstico(s), com maior incidência em ${errorLabel(row.dominantError)}`);
    let status:TwinFocus['status']='prioridade';
    if(row.total<3)status='medir';
    else if((row.accuracy||0)>=.86&&gap===0&&row.declaredDifficulty<2)status='forca';
    else if(index>2&&row.focusScore<.34)status='manutencao';
    const targetAccuracy=row.accuracy===null?70:Math.min(92,Math.max(72,Math.round(row.accuracy*100+10)));
    return {
      key:row.priority.metric.key,label:row.priority.metric.label,area:row.priority.metric.key,status,focusScore:Math.round(row.focusScore*100),accuracy:row.accuracy,rawAccuracy:row.rawAccuracy,
      attempts:row.total,correct:row.correct,confidence,declaredDifficulty:row.declaredDifficulty,diagnosticCount:row.relatedDiagnostics.length,dominantError:row.dominantError,
      minutesPerWeek:minutes,method:methodFor({accuracy:row.accuracy,attempts:row.total,dominantError:row.dominantError,declaredDifficulty:row.declaredDifficulty}),
      evidence:evidenceParts.join(' · '),successCriterion:row.total<3?`Concluir pelo menos 8 questões diagnósticas e então recalcular o gêmeo.`:`Atingir ≥ ${targetAccuracy}% em dois blocos diferentes, com tempo estável e sem repetir o mesmo tipo de erro.`
    };
  });

  const strongest=[...focuses].filter(f=>f.attempts>=5).sort((a,b)=>((b.rawAccuracy||0)-(a.rawAccuracy||0))||(b.attempts-a.attempts))[0]||null;
  const priorityList=focuses.filter(f=>f.status==='prioridade'||f.status==='medir').slice(0,4);
  const maintenance=focuses.filter(f=>f.status==='forca'||f.status==='manutencao').slice(0,3).map((focus,index)=>({...focus,minutesPerWeek:Math.max(20,Math.round((maintenanceBudget/Math.max(1,Math.min(3,focuses.length)))/10)*10+(index===0?0:0))}));
  const dataGaps=focuses.filter(f=>f.attempts<5).slice(0,4);
  const measuredSkills=new Set(attempts.map(a=>norm(a.skill_name||a.area))).size;
  const evidenceScore=Math.round(clamp((Math.min(1,attempts.length/60)*.55)+(Math.min(1,measuredSkills/12)*.25)+(Math.min(1,input.diagnostics.length/10)*.12)+(Object.keys(input.difficultyTopics).length? .08:0))*100);
  const evidenceLabel:StudyTwin['evidenceLabel']=evidenceScore>=72?'forte':evidenceScore>=42?'moderada':'inicial';
  const nextActions=priorityList.slice(0,3).map(f=>`${f.label}: ${f.minutesPerWeek} min/semana — ${f.method}`);
  if(strongest)nextActions.push(`${strongest.label}: preserve a força com manutenção curta; não roube horas das prioridades.`);
  const summary=strongest
    ? `Seu melhor rendimento medido está em ${strongest.label} (${strongest.correct}/${strongest.attempts}). O maior retorno agora tende a vir de ${priorityList[0]?.label||'consolidar as áreas ainda pouco medidas'}.`
    : `Ainda não há amostra suficiente para cravar sua melhor área. O gêmeo está em modo diagnóstico e vai ganhar precisão a cada bloco respondido.`;

  return {generatedAt:new Date().toISOString(),examId:input.examId,evidenceScore,evidenceLabel,measuredAttempts:attempts.length,measuredSkills,strongest,priorities:priorityList,maintenance,dataGaps,nextActions,summary};
}
