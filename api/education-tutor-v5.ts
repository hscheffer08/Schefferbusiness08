import { createClient } from '@supabase/supabase-js';
import tutorPublic from './education-tutor-public.js';

const FALLBACK_SUPABASE_URL='https://kmognvgnfisdchzffkgh.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6Imttb2dudmduZmlzZGNoemZma2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MzkxNjksImV4cCI6MjEwMjMxNTE2OX0.JarpsXfgv8PplL3Ryvs6iFfEPiv_rnp2Cx5i1I67fCk';
const OFFICIAL_SERIES=new Set(['enem','fuvest','cmmg']);
const STOP=new Set(['para','como','qual','quais','uma','umas','uns','que','por','porque','isso','essa','esse','esta','este','com','sem','dos','das','de','da','do','em','no','na','nos','nas','me','minha','meu','sobre','mais','muito','muita','ser','tem','tenho','aqui','questao','questões','questoes','explique','faca','faça','resumo','dicas']);

const TUTOR_MODE='MODO TUTOR COMPLETO: a IA deve responder tanto questões específicas quanto dúvidas gerais de matéria. Pode ensinar do zero, explicar conceitos, fazer resumos, revisões, mapas mentais em texto, listas de fórmulas, dicas, macetes/mnemônicos, comparações, exemplos, exercícios, quizzes e estratégias de estudo. Não exija que a dúvida venha de uma questão do banco. Quando o pedido for resumo ou revisão, organize por tópicos e destaque o essencial; quando for dica, seja prática; quando for conceito, explique em linguagem adequada ao aluno e dê exemplo; quando for exercício, não chame material autoral de oficial. Use o banco recuperado como contexto, mas complete conteúdos estáveis de ensino médio com conhecimento acadêmico consolidado quando o banco não tiver um trecho suficiente. Para fatos de prova, gabaritos, datas, regras ou informações que possam mudar, mantenha a verificação externa já existente.';

function clean(v:unknown){return String(v??'').trim().replace(/^["']|["']$/g,'')}
function placeholder(v:string){return /(?:^|[._-])(x{4,}|placeholder|changeme|seu-projeto|your-project)(?:[._-]|$)/i.test(v)}
function clip(v:unknown,n:number){return String(v??'').replace(/\s+/g,' ').trim().slice(0,n)}
function config(){
  const raw=clean(process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL||FALLBACK_SUPABASE_URL);
  const key=clean(process.env.SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_PUBLISHABLE_KEY||FALLBACK_SUPABASE_ANON_KEY);
  try{
    const u=new URL(raw.startsWith('http')?raw:`https://${raw}`);
    if(key&&!placeholder(key)&&!placeholder(u.hostname)&&/^[a-z0-9-]+\.supabase\.co$/i.test(u.hostname))return{url:u.origin,key};
  }catch{}
  return{url:FALLBACK_SUPABASE_URL,key:FALLBACK_SUPABASE_ANON_KEY};
}
function words(text:string){
  const raw=(text.toLowerCase().match(/[\p{L}\p{N}]+/gu)||[]).filter(x=>x.length>=4&&!STOP.has(x));
  return [...new Set(raw)].slice(0,5);
}
function score(text:string,terms:string[]){
  const h=text.toLowerCase();let s=0;
  for(const t of terms)if(h.includes(t.toLowerCase()))s+=t.length>=7?3:2;
  return s;
}
function requestMode(text:string){
  if(/\b(resum|revis[aã]o|revisar|fichamento|mapa mental)\b/i.test(text))return'resumo/revisão';
  if(/\b(dica|macete|mnem[oô]nic|memor|decore|estrat[eé]gia)\b/i.test(text))return'dicas/memorização';
  if(/\b(quiz|exerc[ií]cio|quest[aã]o parecida|trein|simulado)\b/i.test(text))return'prática';
  if(/\b(explique|entender|conceito|o que [eé]|como funciona|por que)\b/i.test(text))return'explicação conceitual';
  return'resolução/orientação';
}

async function enrich(req:any){
  const body=req.body&&typeof req.body==='object'?req.body:{};
  const context=body.context&&typeof body.context==='object'?body.context:{};
  const messages=Array.isArray(body.messages)?body.messages:[];
  const latest=String(messages[messages.length-1]?.content||'');
  const currentQuestion=String(context.currentQuestion||'');
  const exam=String(context.exam||'enem').toLowerCase().slice(0,40);
  const auth=String(req.headers?.authorization||'');
  const cfg=config();
  if(!auth.startsWith('Bearer ')){
    req.body={...body,context:{...context,currentQuestion:`${currentQuestion}\n\n[ORIENTAÇÃO DO TUTOR]\n${TUTOR_MODE}`.slice(0,2200)}};
    return;
  }
  const token=auth.slice(7).trim();
  const client=createClient(cfg.url,cfg.key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{headers:{Authorization:`Bearer ${token}`}}});
  const queryText=`${latest} ${currentQuestion} ${context.currentArea||''} ${context.currentSkill||''}`;
  const terms=words(queryText);
  const profilePromise=client.from('exam_intelligence_profiles').select('exam_id,label,institution,exam_date,format_summary,official_source_url,official,scoring_model,stages,priorities').eq('exam_id',exam).maybeSingle();
  const studyPromise=client.from('exam_study_resources').select('area,skill_name,resource_type,title,url,search_query,description,official,priority').eq('exam_id',exam).eq('active',true).order('priority',{ascending:false}).limit(24);
  const resourcesPromise=client.from('exam_resources').select('resource_type,year,label,url,official,metadata').eq('exam_id',exam).limit(16);
  const officialPromises=OFFICIAL_SERIES.has(exam)&&terms.length
    ? terms.slice(0,4).map(term=>client.from('official_vestibular_question_bank_v2').select('question_id,vestibular,institution,year,question_number,area,subject,skill_name,difficulty,prompt_text,option_a,option_b,option_c,option_d,option_e,correct_option,answer_status,source_pdf_url,answer_key_url,source_url,source_kind').eq('series_id',exam).or(`subject.ilike.%${term}%,skill_name.ilike.%${term}%,prompt_text.ilike.%${term}%`).limit(10))
    : [];
  const [profileResult,studyResult,resourcesResult,officialResults]=await Promise.all([
    profilePromise,
    studyPromise,
    resourcesPromise,
    Promise.all(officialPromises),
  ]);
  const profile=(profileResult as any)?.data||null;
  const study=Array.isArray((studyResult as any)?.data)?(studyResult as any).data:[];
  const resources=Array.isArray((resourcesResult as any)?.data)?(resourcesResult as any).data:[];
  const officialMap=new Map<string,any>();
  for(const result of officialResults as any[]){for(const row of result?.data||[])officialMap.set(String(row.question_id),row)}
  const official=[...officialMap.values()].map(row=>({...row,_score:score(`${row.subject||''} ${row.skill_name||''} ${row.prompt_text||''}`,terms)})).sort((a,b)=>b._score-a._score||Number(b.year||0)-Number(a.year||0)).slice(0,4);
  const rankedStudy=study.map((row:any)=>({...row,_score:score(`${row.area||''} ${row.skill_name||''} ${row.title||''} ${row.description||''} ${row.search_query||''}`,terms)+Number(row.priority||0)/20})).sort((a:any,b:any)=>b._score-a._score).slice(0,4);
  const lines:string[]=[];
  lines.push(`[BASE DE CONHECIMENTO RECUPERADA DO CONECTAÊ · modo ${requestMode(queryText)}]`);
  if(profile)lines.push(`Prova ativa: ${clip(profile.label||exam,90)}. ${clip(profile.format_summary,360)}`);
  if(rankedStudy.length)lines.push(`Materiais relacionados: ${rankedStudy.map((r:any)=>`${clip(r.title,85)}${r.skill_name?` (${clip(r.skill_name,60)})`:''}${r.description?`: ${clip(r.description,150)}`:''}`).join(' | ')}`);
  if(resources.length)lines.push(`Referências da prova: ${resources.slice(0,4).map((r:any)=>`${clip(r.label,90)}${r.year?` ${r.year}`:''}${r.official?' [oficial]':''}`).join(' | ')}`);
  if(official.length)lines.push(`Questões oficiais relacionadas no banco: ${official.map((q:any)=>`${q.vestibular||exam} ${q.year||''}${q.question_number?` Q${q.question_number}`:''} · ${clip(q.subject||q.area,55)} · ${clip(q.skill_name,70)} · enunciado: ${clip(q.prompt_text,280)}${q.correct_option?` · gabarito cadastrado: ${q.correct_option}`:''}`).join(' || ')}`);
  if(!profile&&!rankedStudy.length&&!resources.length&&!official.length)lines.push('Nenhum trecho específico do banco foi recuperado para este pedido. Responda normalmente com conhecimento acadêmico consolidado e deixe claro quando um dado de prova exigir fonte atualizada.');
  lines.push(`[ORIENTAÇÃO DO TUTOR] ${TUTOR_MODE}`);
  const knowledge=lines.join('\n');
  const questionBase=currentQuestion.trim();
  const reserved=Math.max(420,2200-Math.min(questionBase.length,1700)-4);
  const merged=questionBase?`${questionBase.slice(0,2200-reserved-2)}\n\n${knowledge.slice(0,reserved)}`:knowledge.slice(0,2200);
  req.body={...body,context:{...context,currentQuestion:merged}};
}

export default async function handler(req:any,res:any){
  if(req?.method==='GET'){
    res.setHeader('Cache-Control','no-store');
    return res.status(200).json({
      ok:true,
      service:'IA Conectaê v5',
      model:'openai/gpt-5.6-luna',
      reviewModel:'google/gemini-3.6-flash',
      searchModel:'google/gemini-2.5-flash-lite',
      retrieval:'practice+taxonomy+skill-reference+official-question-bank+exam-profile+study-resources+exam-resources+student-context+web-verification',
      capabilities:['resolver questões','explicar matérias','resumos','revisões','dicas e mnemônicos','exemplos','exercícios e quizzes','estratégia de estudo','análise de imagem'],
      supportedExams:['enem','fuvest','cmmg','insper','link','ibmec','einstein'],
      publicAccess:true,
      dailyQuestionLimit:null,
      loginRequired:false,
    });
  }
  if(req?.method==='POST'){
    try{await enrich(req)}catch(error:any){console.warn('full-corpus enrichment skipped',error?.message||error)}
  }
  return tutorPublic(req,res);
}
