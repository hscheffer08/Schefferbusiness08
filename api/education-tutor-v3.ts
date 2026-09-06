import { createClient } from '@supabase/supabase-js';
import tutorV2 from './education-tutor-v2.js';

type Attempt={area:string;skill_name:string|null;correct:boolean|null;created_at:string;duration_seconds:number|null};
type Diagnostic={area:string;skill_code:string|null;error_type:string|null;diagnosis:{skill_name?:string}|null;created_at:string};

const clean=(v:unknown)=>String(v??'').trim().replace(/^["']|["']$/g,'');
const norm=(v:string)=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const pct=(n:number)=>`${Math.round(n*100)}%`;

function config(){
  const raw=clean(process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL);
  const key=clean(process.env.SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_ANON_KEY||process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
  try{const url=new URL(raw.startsWith('http')?raw:`https://${raw}`);if(key&&/^[a-z0-9-]+\.supabase\.co$/i.test(url.hostname))return{url:url.origin,key}}catch{}
  return null;
}

function confidence(n:number){return n>=12?'alta':n>=5?'moderada':'baixa'}
function method(error:string|null,accuracy:number,n:number){
  if(n<5)return'bloco diagnóstico de 8–12 questões variadas, sem consulta, registrando tempo e causa do erro';
  if(error==='tempo')return'microblocos cronometrados com regra de pular/voltar e revisão dos estouros de tempo';
  if(error==='interpretacao')return'reescrever o comando, destacar evidência/dados e justificar a alternativa antes de marcar';
  if(error==='calculo')return'refazer procedimentos com sinais/unidades explícitos e depois resolver questões progressivas';
  if(error==='distracao')return'checklist de comando, unidade, sinal e palavras como EXCETO/incorreta antes de responder';
  if(error==='estrategia')return'treino misto de escolha de ferramenta: dados → objetivo → modelo → verificação';
  if(accuracy<.58)return'recuperação de base + exemplos explicados pelo aluno + 10–15 questões graduais';
  if(accuracy<.76)return'prática deliberada mista + caderno de erros + repetição espaçada em 48 horas';
  if(accuracy<.88)return'blocos cronometrados e questões difíceis para transformar domínio em consistência';
  return'manutenção espaçada com poucos itens difíceis, preservando tempo para prioridades maiores';
}

async function enrich(req:any){
  const cfg=config();if(!cfg)return;
  const auth=String(req.headers?.authorization||'');if(!auth.startsWith('Bearer '))return;
  const token=auth.slice(7).trim();if(!token)return;
  const exam=String(req.body?.context?.exam||'enem').toLowerCase().slice(0,40);
  const client=createClient(cfg.url,cfg.key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{headers:{Authorization:`Bearer ${token}`}}});
  const{data:userData,error:userError}=await client.auth.getUser(token);const userId=userData.user?.id;if(userError||!userId)return;
  const[{data:attemptRows},{data:diagRows},{data:pref}]=await Promise.all([
    client.from('student_practice_attempts').select('area,skill_name,correct,created_at,duration_seconds').eq('user_id',userId).eq('exam_id',exam).order('created_at',{ascending:false}).limit(180),
    client.from('student_skill_diagnostics').select('area,skill_code,error_type,diagnosis,created_at').eq('user_id',userId).eq('exam_id',exam).order('created_at',{ascending:false}).limit(50),
    client.from('student_exam_preferences').select('weekly_hours,current_scores,difficulty_topics,course_label').eq('user_id',userId).eq('exam_id',exam).maybeSingle(),
  ]);
  const attempts=(attemptRows??[]) as Attempt[], diagnostics=(diagRows??[]) as Diagnostic[];
  const grouped=new Map<string,{area:string;skill:string;ok:number;total:number;seconds:number[];latest:string}>();
  for(const row of attempts){
    if(row.correct===null)continue;
    const skill=row.skill_name||row.area,key=`${norm(row.area)}::${norm(skill)}`;
    const g=grouped.get(key)||{area:row.area,skill,ok:0,total:0,seconds:[],latest:row.created_at};g.total++;if(row.correct)g.ok++;if(Number(row.duration_seconds)>0)g.seconds.push(Number(row.duration_seconds));grouped.set(key,g);
  }
  const rows=[...grouped.values()].map(g=>({...g,accuracy:(g.ok+2)/(g.total+4),raw:g.total?g.ok/g.total:0,avgSeconds:g.seconds.length?Math.round(g.seconds.reduce((a,b)=>a+b,0)/g.seconds.length):null}));
  const reliable=rows.filter(r=>r.total>=5);
  const strongest=[...reliable].sort((a,b)=>b.raw-a.raw||b.total-a.total)[0]||null;
  const weakest=[...rows].filter(r=>r.total>=3).sort((a,b)=>a.accuracy-b.accuracy||b.total-a.total).slice(0,3);
  const errorCounts=new Map<string,Map<string,number>>();
  for(const d of diagnostics){const area=norm(d.area),m=errorCounts.get(area)||new Map<string,number>();if(d.error_type)m.set(d.error_type,(m.get(d.error_type)||0)+1);errorCounts.set(area,m)}
  const declared=Object.entries((pref?.difficulty_topics&&typeof pref.difficulty_topics==='object'?pref.difficulty_topics:{}) as Record<string,number>).sort((a,b)=>Number(b[1])-Number(a[1])).slice(0,6).map(([key,level])=>`${key.replace(/[|:_]+/g,' ')} (nível ${level})`);
  const twin:string[]=[];
  twin.push(`GÊMEO — evidência total: ${attempts.filter(a=>a.correct!==null).length} respostas medidas, ${rows.length} habilidade(s) observadas; horas semanais: ${pref?.weekly_hours??'não informado'}.`);
  if(strongest)twin.push(`GÊMEO — melhor rendimento medido: ${strongest.area} · ${strongest.skill}: ${strongest.ok}/${strongest.total} (${pct(strongest.raw)}), confiança ${confidence(strongest.total)}${strongest.avgSeconds?`, tempo médio ${strongest.avgSeconds}s`:''}. Trate como força a preservar, não como maior destino de horas.`);
  for(const w of weakest){const errors=errorCounts.get(norm(w.area));const dominant=errors?[...errors.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]||null:null;twin.push(`GÊMEO — prioridade observada: ${w.area} · ${w.skill}: ${w.ok}/${w.total} (${pct(w.raw)}), confiança ${confidence(w.total)}${dominant?`, erro dominante ${dominant}`:''}. Método indicado: ${method(dominant,w.accuracy,w.total)}.`)}
  if(declared.length)twin.push(`GÊMEO — dificuldades declaradas pelo aluno: ${declared.join('; ')}. Use como sinal, mas dê mais peso ao desempenho medido quando houver amostra suficiente.`);
  if(rows.every(r=>r.total<5))twin.push('GÊMEO — cautela: ainda não há amostra suficiente para afirmar a melhor área. Recomende blocos diagnósticos antes de conclusões fortes.');
  const priorPerformance=Array.isArray(req.body?.context?.recentPerformance)?req.body.context.recentPerformance:[];
  const priorDifficulties=Array.isArray(req.body?.context?.recentDifficulties)?req.body.context.recentDifficulties:[];
  req.body={...(req.body||{}),context:{...(req.body?.context||{}),weeklyHours:pref?.weekly_hours??req.body?.context?.weeklyHours,currentScores:pref?.current_scores||req.body?.context?.currentScores,courseLabel:pref?.course_label||req.body?.context?.courseLabel,recentPerformance:[...twin,...priorPerformance].slice(0,6),recentDifficulties:[...declared,...priorDifficulties].slice(0,6)}};
}

export default async function handler(req:any,res:any){
  if(req.method==='POST'){
    try{await enrich(req)}catch(error:any){console.warn('study-twin enrichment skipped',error?.message||error)}
  }
  return tutorV2(req,res);
}
