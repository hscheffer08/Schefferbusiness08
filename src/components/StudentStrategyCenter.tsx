import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowRight, BrainCircuit, Clock3, Crosshair, Gauge, Loader2, Microscope, Sparkles, TrendingUp, TriangleAlert } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

 type PracticeAttempt = {
  exam_id:string; area:string; skill_name:string|null; correct:boolean|null; duration_seconds:number|null;
  error_type:string|null; error_detail:string|null; created_at:string;
 };
 type ExamAttempt = { exam_id:string; area:string; correct:number; total:number; duration_minutes:number|null; occurred_at:string; created_at:string };
 type PlanProgress = { exam_id:string; week_start:string; completed_sessions:string[] };

const clamp=(n:number,min=0,max=100)=>Math.max(min,Math.min(max,n));
const pct=(n:number)=>`${Math.round(n)}%`;
const normalize=(v:string)=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const errorLabels:Record<string,string>={
  conteudo:'Conteúdo',interpretacao:'Interpretação',calculo:'Cálculo/procedimento',distracao:'Desatenção',tempo:'Gestão de tempo',estrategia:'Estratégia',outro:'Outro'
};

export default function StudentStrategyCenter(){
  const{user}=useAuth();
  const[practice,setPractice]=useState<PracticeAttempt[]>([]);
  const[exams,setExams]=useState<ExamAttempt[]>([]);
  const[plans,setPlans]=useState<PlanProgress[]>([]);
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState('');
  const[hoursBoost,setHoursBoost]=useState(2);
  const[errorReduction,setErrorReduction]=useState(20);

  useEffect(()=>{let alive=true;(async()=>{
    if(!supabase||!user){setLoading(false);return}
    setLoading(true); setError('');
    const since=new Date(Date.now()-120*86400000).toISOString();
    const sinceDate=since.slice(0,10);
    const[p,e,w]=await Promise.all([
      supabase.from('student_practice_attempts').select('exam_id,area,skill_name,correct,duration_seconds,error_type,error_detail,created_at').eq('user_id',user.id).gte('created_at',since).order('created_at',{ascending:false}).limit(700),
      supabase.from('student_exam_attempts').select('exam_id,area,correct,total,duration_minutes,occurred_at,created_at').eq('user_id',user.id).gte('occurred_at',sinceDate).order('occurred_at',{ascending:false}).limit(300),
      supabase.from('student_weekly_plan_progress').select('exam_id,week_start,completed_sessions').eq('user_id',user.id).gte('week_start',sinceDate).order('week_start',{ascending:false}).limit(100),
    ]);
    if(!alive)return;
    if(p.error&&e.error){setError('Ainda não consegui ler seu histórico de treino.');setLoading(false);return}
    setPractice((p.data??[]) as PracticeAttempt[]); setExams((e.data??[]) as ExamAttempt[]); setPlans((w.data??[]) as PlanProgress[]); setLoading(false);
  })();return()=>{alive=false}},[user]);

  const intelligence=useMemo(()=>{
    const valid=practice.filter(a=>a.correct!==null);
    const correct=valid.filter(a=>a.correct).length;
    const wrong=valid.length-correct;
    const accuracy=valid.length?correct/valid.length*100:0;
    const recent=valid.slice(0,Math.min(25,valid.length));
    const previous=valid.slice(Math.min(25,valid.length),Math.min(50,valid.length));
    const recentAcc=recent.length?recent.filter(a=>a.correct).length/recent.length*100:accuracy;
    const previousAcc=previous.length?previous.filter(a=>a.correct).length/previous.length*100:recentAcc;
    const trend=recentAcc-previousAcc;
    const uniqueSkills=new Set(valid.map(a=>a.skill_name||a.area).filter(Boolean)).size;
    const coverage=clamp(uniqueSkills/12*100);
    const activeDays=new Set(valid.filter(a=>Date.now()-new Date(a.created_at).getTime()<=21*86400000).map(a=>a.created_at.slice(0,10))).size;
    const consistency=clamp(activeDays/8*100);
    const planSessions=plans.reduce((sum,p)=>sum+(p.completed_sessions?.length||0),0);
    const planSignal=clamp(planSessions/18*100);
    const examValid=exams.filter(a=>a.total>0);
    const examAccuracy=examValid.length?examValid.reduce((s,a)=>s+a.correct,0)/examValid.reduce((s,a)=>s+a.total,0)*100:null;
    const performance=examAccuracy===null?accuracy:accuracy*0.55+examAccuracy*0.45;
    const raw=performance*0.52+coverage*0.18+consistency*0.15+planSignal*0.05+clamp(50+trend*2)*0.10;
    const dataConfidence=clamp((valid.length/80)*70+(examValid.length/8)*20+(activeDays/8)*10);
    const readiness=valid.length?Math.round(raw*(dataConfidence/100)+50*(1-dataConfidence/100)):null;

    const groups=new Map<string,{label:string;area:string;attempts:number;correct:number;wrong:number;last:string}>();
    valid.forEach(a=>{const label=a.skill_name?.trim()||a.area;const key=`${normalize(a.area)}::${normalize(label)}`;const g=groups.get(key)||{label,area:a.area,attempts:0,correct:0,wrong:0,last:a.created_at};g.attempts++;if(a.correct)g.correct++;else g.wrong++;if(a.created_at>g.last)g.last=a.created_at;groups.set(key,g)});
    const ranked=[...groups.values()].filter(g=>g.attempts>=2).map(g=>{const acc=g.correct/g.attempts;const volume=Math.min(g.attempts/8,1);const priority=(1-acc)*0.78+volume*0.22;return{...g,acc,priority}}).sort((a,b)=>b.priority-a.priority);
    const weak=ranked[0]||null;
    const strong=[...groups.values()].filter(g=>g.attempts>=3).map(g=>({...g,acc:g.correct/g.attempts})).sort((a,b)=>b.acc-a.acc)[0]||null;

    const errors=new Map<string,number>();
    valid.filter(a=>a.correct===false).forEach(a=>{const k=a.error_type||'nao_classificado';errors.set(k,(errors.get(k)||0)+1)});
    const errorRanking=[...errors.entries()].map(([key,count])=>({key,label:errorLabels[key]||'Não classificado',count,share:wrong?count/wrong*100:0})).sort((a,b)=>b.count-a.count);
    const avoidableKeys=new Set(['distracao','tempo','interpretacao','calculo']);
    const avoidable=errorRanking.filter(e=>avoidableKeys.has(e.key)).reduce((s,e)=>s+e.count,0);
    const counterfactual=valid.length?clamp((correct+avoidable)/valid.length*100):0;
    const durations=valid.map(a=>a.duration_seconds).filter((n):n is number=>typeof n==='number'&&n>0).sort((a,b)=>a-b);
    const medianSeconds=durations.length?durations[Math.floor(durations.length/2)]:null;

    return{valid,correct,wrong,accuracy,recentAcc,trend,uniqueSkills,activeDays,readiness,dataConfidence,weak,strong,errorRanking,avoidable,counterfactual,medianSeconds,examValid,planSessions};
  },[practice,exams,plans]);

  const projected=useMemo(()=>{
    if(intelligence.readiness===null)return null;
    const hourGain=Math.min(hoursBoost*1.4,8);
    const errorGain=Math.min((intelligence.wrong*(errorReduction/100))/Math.max(1,intelligence.valid.length)*100*.35,10);
    return Math.round(clamp(intelligence.readiness+hourGain+errorGain));
  },[hoursBoost,errorReduction,intelligence]);

  const jump=(id:string)=>document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});

  if(loading)return <section id="curso-estrategia" className="scroll-mt-20 bg-[#020817] px-4 py-10 text-white"><div className="mx-auto max-w-[1190px] rounded-[22px] border border-[#173765] bg-[#06152f] p-6"><Loader2 className="animate-spin text-[#72a5ff]"/></div></section>;
  if(error)return <section id="curso-estrategia" className="scroll-mt-20 bg-[#020817] px-4 py-10 text-white"><div className="mx-auto max-w-[1190px] rounded-[22px] border border-[#173765] bg-[#06152f] p-6"><TriangleAlert className="text-amber-300"/><p className="mt-3 text-sm text-[#a9bddc]">{error}</p></div></section>;

  const hasData=intelligence.valid.length>=3;
  const topError=intelligence.errorRanking[0];

  return <section id="curso-estrategia" className="scroll-mt-20 bg-[radial-gradient(circle_at_82%_0%,rgba(36,108,255,.14),transparent_30%),#020817] px-4 py-12 text-white">
    <div className="mx-auto max-w-[1190px]">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div><div className="text-xs font-black uppercase tracking-[.17em] text-[#72a5ff]">Conectaê Intelligence</div><h2 className="mt-2 text-3xl font-black tracking-[-.04em] md:text-5xl">Seu sistema de decisão para passar.</h2><p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#9fb5d4]">O sistema transforma seu histórico em uma decisão prática: onde você está, o que mais derruba seu desempenho e qual ação tem maior retorno agora.</p></div>
        <div className="rounded-2xl border border-[#31588e] bg-[#081d40] px-5 py-4"><div className="text-[10px] font-black uppercase tracking-[.14em] text-[#72a5ff]">Confiança dos dados</div><div className="mt-1 text-2xl font-black">{Math.round(intelligence.dataConfidence)}%</div><div className="text-[11px] text-[#8da5c5]">cresce conforme você treina</div></div>
      </div>

      {!hasData&&<div className="mb-6 rounded-[22px] border border-amber-300/20 bg-amber-300/[.05] p-5"><div className="flex items-start gap-3"><Sparkles className="mt-0.5 text-amber-200" size={20}/><div><strong>Seu gêmeo de aprendizagem ainda está sendo calibrado.</strong><p className="mt-1 text-sm text-[#b8c8df]">Faça pelo menos algumas questões e corrija um simulado. O painel deixa de usar um ponto neutro e passa a refletir seu comportamento real.</p><button onClick={()=>jump('correcao-simulado')} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#246cff] px-4 py-2.5 text-xs font-black">Fazer diagnóstico <ArrowRight size={14}/></button></div></div></div>}

      <div className="grid gap-4 lg:grid-cols-12">
        <article className="rounded-[24px] border border-[#31588e] bg-gradient-to-br from-[#0b2856] to-[#06152f] p-6 lg:col-span-4"><div className="flex items-center justify-between"><div className="text-xs font-black uppercase tracking-[.14em] text-[#72a5ff]">Índice de prontidão</div><Gauge className="text-[#72a5ff]"/></div><div className="mt-5 flex items-end gap-2"><span className="text-6xl font-black tracking-[-.06em]">{intelligence.readiness??'—'}</span><span className="mb-2 text-sm font-bold text-[#8da5c5]">/100</span></div><p className="mt-3 text-sm text-[#a9bddc]">Não é “chance de aprovação”. É um índice interno de preparo baseado em acurácia, cobertura, constância, tendência e simulados.</p><div className="mt-5 grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-black/15 p-3"><b>{intelligence.valid.length}</b><small className="block text-[#8da5c5]">questões</small></div><div className="rounded-xl bg-black/15 p-3"><b>{intelligence.uniqueSkills}</b><small className="block text-[#8da5c5]">habilidades</small></div><div className="rounded-xl bg-black/15 p-3"><b>{intelligence.activeDays}</b><small className="block text-[#8da5c5]">dias ativos</small></div></div></article>

        <article className="rounded-[24px] border border-emerald-300/20 bg-emerald-300/[.05] p-6 lg:col-span-8"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.14em] text-emerald-200"><Crosshair size={16}/>Próximo melhor movimento</div><h3 className="mt-3 text-2xl font-black">{intelligence.weak?`Ataque ${intelligence.weak.label} agora.`:'Faça um diagnóstico curto antes de estudar no escuro.'}</h3>{intelligence.weak?<><p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#bdd4ca]">Você acertou {Math.round(intelligence.weak.acc*100)}% em {intelligence.weak.attempts} tentativas nessa habilidade. O sistema priorizou esse ponto por combinar baixo desempenho com repetição suficiente para reduzir o risco de ser apenas acaso.</p><div className="mt-5 flex flex-wrap gap-2"><button onClick={()=>jump('curso-inicio')} className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-xs font-black text-[#03140d]">Abrir treino direcionado <ArrowRight size={14}/></button><span className="rounded-xl border border-emerald-300/20 px-4 py-3 text-xs font-bold text-emerald-100">Missão sugerida: 8–12 questões</span></div></>:<p className="mt-2 text-sm text-[#bdd4ca]">Sem histórico suficiente, qualquer prioridade seria chute. O sistema evita inventar uma fraqueza antes de ter dados.</p>}</article>

        <article className="rounded-[24px] border border-[#173765] bg-[#06152f] p-6 lg:col-span-7"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.14em] text-[#72a5ff]"><Microscope size={16}/>Autópsia do erro</div><h3 className="mt-3 text-2xl font-black">Descubra por que você perde pontos — não só onde.</h3>{intelligence.wrong>0?<div className="mt-5 space-y-3">{intelligence.errorRanking.slice(0,5).map(e=><div key={e.key}><div className="mb-1 flex justify-between text-xs"><span className="font-bold text-[#c9d8ed]">{e.label}</span><span className="text-[#8da5c5]">{e.count} · {Math.round(e.share)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-[#102c5b]"><div className="h-full rounded-full bg-[#4b8cff]" style={{width:`${Math.max(4,e.share)}%`}}/></div></div>)}</div>:<p className="mt-3 text-sm text-[#9fb5d4]">Quando você classificar os erros na correção de simulados, este painel separa conteúdo, interpretação, cálculo, distração e tempo.</p>}{intelligence.avoidable>0&&<div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/[.05] p-4"><strong className="text-amber-100">Contrafactual:</strong><p className="mt-1 text-sm text-[#d4caa8]">{intelligence.avoidable} erros recentes foram classificados em categorias potencialmente recuperáveis sem aprender conteúdo novo. Se eles não tivessem ocorrido, a acurácia desse histórico iria de {Math.round(intelligence.accuracy)}% para cerca de {Math.round(intelligence.counterfactual)}%.</p></div>}</article>

        <article className="rounded-[24px] border border-[#173765] bg-[#06152f] p-6 lg:col-span-5"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.14em] text-[#72a5ff]"><BrainCircuit size={16}/>Conectaê Twin</div><h3 className="mt-3 text-2xl font-black">Seu padrão, resumido.</h3><div className="mt-4 space-y-3 text-sm leading-relaxed text-[#b7c9e2]"><p><b className="text-white">Desempenho:</b> {hasData?`${Math.round(intelligence.accuracy)}% de acerto no treino recente${intelligence.trend>2?', com tendência de melhora':intelligence.trend<-2?', com queda recente que merece atenção':', relativamente estável'}.`:'ainda sem amostra suficiente.'}</p><p><b className="text-white">Maior risco:</b> {intelligence.weak?`${intelligence.weak.label} (${Math.round(intelligence.weak.acc*100)}% de acerto).`:'ainda não identificado.'}</p><p><b className="text-white">Maior força:</b> {intelligence.strong?`${intelligence.strong.label} (${Math.round(intelligence.strong.acc*100)}% de acerto).`:'ainda não identificada.'}</p><p><b className="text-white">Ritmo:</b> {intelligence.medianSeconds?`mediana de ${Math.round(intelligence.medianSeconds/60*10)/10} min por questão registrada.`:'tempo por questão ainda sem dados suficientes.'}</p>{topError&&<p><b className="text-white">Erro dominante:</b> {topError.label}.</p>}</div></article>

        <article className="rounded-[24px] border border-[#173765] bg-[#06152f] p-6 lg:col-span-12"><div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.14em] text-[#72a5ff]"><TrendingUp size={16}/>Simulador de futuro</div><div className="mt-3 grid gap-6 md:grid-cols-[1fr_1fr_220px] md:items-end"><label className="text-sm font-bold text-[#c5d4e9]">Horas extras por semana: <b className="text-white">+{hoursBoost}h</b><input type="range" min="0" max="6" step="1" value={hoursBoost} onChange={e=>setHoursBoost(Number(e.target.value))} className="mt-3 w-full accent-[#246cff]"/></label><label className="text-sm font-bold text-[#c5d4e9]">Redução de erros evitáveis: <b className="text-white">{errorReduction}%</b><input type="range" min="0" max="60" step="5" value={errorReduction} onChange={e=>setErrorReduction(Number(e.target.value))} className="mt-3 w-full accent-[#246cff]"/></label><div className="rounded-2xl border border-[#31588e] bg-[#0b2856] p-4 text-center"><div className="text-[10px] font-black uppercase text-[#72a5ff]">Prontidão simulada</div><div className="mt-1 text-4xl font-black">{projected??'—'}</div></div></div><p className="mt-4 text-xs leading-relaxed text-[#7891b4]">Cenário exploratório, não previsão garantida. Serve para comparar decisões de estudo usando uma heurística conservadora sobre o seu próprio histórico.</p></article>
      </div>
    </div>
  </section>;
}
