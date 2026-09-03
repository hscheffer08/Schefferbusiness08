from pathlib import Path

path = Path('src/components/AdmissionsPlannerV11.tsx')
s = path.read_text()

old = "type SkillDiagnostic={id:string;exam_id:string;area:string;skill_code:string|null;error_type:string|null;error_detail:string|null;diagnosis:{skill_name?:string}|null;created_at:string;evidence_path:string|null};"
new = old + "\ntype AdmissionCutoff={institution:string;exam_id:string;course_label:string;variant:string;year:number;modality:string;target_kind:string;target_value:number;max_value:number|null;confidence:string;source_url:string;notes:string|null};"
assert old in s
s = s.replace(old, new, 1)

old = """function goalFor(metric:ExamMetric,examId:string){
  if(examId==='enem')return metric.key==='Redação'?820:32;
  if(examId==='cmmg'){
    if(metric.key==='Redação')return Math.round(metric.max*.8);
    const pct:Record<string,number>={'Língua Portuguesa':.78,'Literatura':.75,'Inglês':.78,'Biologia':.82,'Física':.75,'Química':.8,'Matemática':.8,'Linguagens':.8,'Conhecimentos Gerais':.75,'Humanas':.75};
    return Math.max(1,Math.round(metric.max*(pct[metric.key]??.78)));
  }
  if(examId==='insper')return metric.key==='Redação'?75:12;
  if(examId==='fuvest'){
    if(metric.key==='1ª fase')return 64;
    if(metric.key==='Português'||metric.key==='Redação')return 36;
    return 72;
  }
  const link:Record<string,number>={'Matemática':75,'Business Case':82,'Escrita':80,'Oral':80,'Portfólio':78,'Entrevista':80};
  return link[metric.key]??78;
}
"""
new = """function goalFor(metric:ExamMetric,examId:string,dataGoal?:number){
  if(Number.isFinite(dataGoal))return clamp(Math.round(dataGoal!),0,metric.max);
  if(examId==='enem'){
    const fallback:Record<string,number>={Linguagens:36,Humanas:37,Natureza:35,'Matemática':37,'Redação':900};
    return fallback[metric.key]??Math.round(metric.max*.8);
  }
  if(examId==='cmmg'){
    if(metric.key==='Redação')return Math.round(metric.max*.8);
    const pct:Record<string,number>={'Língua Portuguesa':.78,'Literatura':.75,'Inglês':.78,'Biologia':.82,'Física':.75,'Química':.8,'Matemática':.8,'Linguagens':.8,'Conhecimentos Gerais':.75,'Humanas':.75};
    return Math.max(1,Math.round(metric.max*(pct[metric.key]??.78)));
  }
  if(examId==='insper')return metric.key==='Redação'?75:12;
  if(examId==='fuvest'){
    if(metric.key==='1ª fase')return Math.round(metric.max*.8);
    if(metric.key==='Português'||metric.key==='Redação')return 36;
    return 72;
  }
  const link:Record<string,number>={'Matemática':75,'Business Case':82,'Escrita':80,'Oral':80,'Portfólio':78,'Entrevista':80};
  return link[metric.key]??78;
}

function enemGoalsFromCutoff(cutoff:number){
  // Faixas de planejamento ancoradas na nota de corte oficial do curso.
  // Para Medicina em ~818 pontos, a meta fica em ~160 acertos totais + redação forte,
  // coerente com resultados reais de aprovados. Não é uma conversão determinística da TRI.
  if(cutoff>=810)return {Linguagens:39,Humanas:40,Natureza:40,'Matemática':41,'Redação':940}; // 160/180
  if(cutoff>=795)return {Linguagens:38,Humanas:39,Natureza:39,'Matemática':40,'Redação':920}; // 156/180
  if(cutoff>=780)return {Linguagens:37,Humanas:38,Natureza:37,'Matemática':39,'Redação':910}; // 151/180
  if(cutoff>=765)return {Linguagens:36,Humanas:37,Natureza:35,'Matemática':38,'Redação':900}; // 146/180
  if(cutoff>=750)return {Linguagens:35,Humanas:36,Natureza:34,'Matemática':37,'Redação':880}; // 142/180
  if(cutoff>=735)return {Linguagens:34,Humanas:35,Natureza:32,'Matemática':36,'Redação':860}; // 137/180
  return {Linguagens:32,Humanas:34,Natureza:30,'Matemática':34,'Redação':840}; // 130/180
}
"""
assert old in s
s = s.replace(old, new, 1)

old = "  const[questionStartedAt,setQuestionStartedAt]=useState<number|null>(null);"
new = old + "\n  const[cutoffs,setCutoffs]=useState<AdmissionCutoff[]>([]);"
assert old in s
s = s.replace(old, new, 1)

old = """    const[{data:a},{data:u},{data:q},{data:userData}]=await Promise.all([
      supabase.from('academic_areas').select('area_id,name,courses').order('name'),
      supabase.from('area_universities').select('area_university_id,area_id,university_name,course_label').order('university_name'),
      supabase.from('exam_practice_questions').select('*').eq('active',true),
      supabase.auth.getUser(),
    ]);"""
new = """    const[{data:a},{data:u},{data:q},{data:userData},{data:cutoffRows}]=await Promise.all([
      supabase.from('academic_areas').select('area_id,name,courses').order('name'),
      supabase.from('area_universities').select('area_university_id,area_id,university_name,course_label').order('university_name'),
      supabase.from('exam_practice_questions').select('*').eq('active',true),
      supabase.auth.getUser(),
      supabase.from('admission_cutoff_references').select('institution,exam_id,course_label,variant,year,modality,target_kind,target_value,max_value,confidence,source_url,notes').order('year',{ascending:false}),
    ]);"""
assert old in s
s = s.replace(old, new, 1)

old = "    setAreas(cleanAreas);setUniversities(cleanUniversities);setQuestions(mergePracticeQuestions((q??[]) as Question[]) as Question[]);"
new = old + "setCutoffs((cutoffRows??[]) as AdmissionCutoff[]);"
assert old in s
s = s.replace(old, new, 1)

old = """  const diagnosis:Priority[]=useMemo(()=>metrics.map(metric=>{
    const current=appliedValues[metric.key]??metric.defaultValue;
    const goal=goalFor(metric,model.examId);"""
new = """  const activeCutoff=useMemo(()=>{
    if(!university)return null;
    return cutoffs
      .filter(c=>normalize(c.institution)===normalize(university.university_name)&&normalize(c.exam_id)===normalize(model.examId)&&normalize(c.course_label)===normalize(course))
      .sort((a,b)=>b.year-a.year||Number(b.target_value)-Number(a.target_value))[0]??null;
  },[cutoffs,university,model.examId,course]);
  const dataGoals=useMemo<Record<string,number>>(()=>{
    if(!activeCutoff)return{};
    if(model.examId==='enem')return enemGoalsFromCutoff(Number(activeCutoff.target_value));
    if(model.examId==='fuvest'){
      const first=metrics.find(m=>m.key==='1ª fase');
      if(!first)return{};
      const historicalMax=Number(activeCutoff.max_value||90);
      const normalized=Math.ceil(Number(activeCutoff.target_value)/Math.max(1,historicalMax)*first.max);
      return{'1ª fase':normalized};
    }
    return{};
  },[activeCutoff,model.examId,metrics]);

  const diagnosis:Priority[]=useMemo(()=>metrics.map(metric=>{
    const current=appliedValues[metric.key]??metric.defaultValue;
    const goal=goalFor(metric,model.examId,dataGoals[metric.key]);"""
assert old in s
s = s.replace(old, new, 1)

old = "  }),[metrics,appliedValues,attempts,model.examId]);"
new = "  }),[metrics,appliedValues,attempts,model.examId,dataGoals]);"
assert old in s
s = s.replace(old, new, 1)

old = """<section className=\"plan6-card span12\"><div className=\"plan6-sectionlabel\">Suas notas</div><h2>{course} · {university?.university_name}</h2><p>Preencha tudo primeiro. O cronograma só muda depois de salvar.</p>{metrics.map(m=>{const current=values[m.key]??m.defaultValue;const step=m.max>100?10:1;const goal=goalFor(m,model.examId);"""
new = """<section className=\"plan6-card span12\"><div className=\"plan6-sectionlabel\">Suas notas</div><h2>{course} · {university?.university_name}</h2><p>Preencha tudo primeiro. O cronograma só muda depois de salvar.</p>{activeCutoff&&<div className=\"plan6-callout blue\" style={{marginBottom:18}}><strong>Meta calibrada com dados reais</strong><p>Referência {activeCutoff.year} · {activeCutoff.modality}: <b>{Number(activeCutoff.target_value).toLocaleString('pt-BR',{maximumFractionDigits:2})}{model.examId==='enem'?' pontos':' acertos'}</b>. {model.examId==='enem'?'Os acertos abaixo são uma meta de planejamento compatível com essa faixa; a TRI pode mudar a nota mesmo com o mesmo número de acertos.':'A meta da 1ª fase é normalizada para o formato atual da prova.'}</p></div>}{metrics.map(m=>{const current=values[m.key]??m.defaultValue;const step=m.max>100?10:1;const goal=goalFor(m,model.examId,dataGoals[m.key]);"""
assert old in s
s = s.replace(old, new, 1)

path.write_text(s)
print('patched AdmissionsPlannerV11.tsx with data-based targets')
