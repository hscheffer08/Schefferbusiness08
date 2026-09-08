import { useEffect, useMemo, useState } from 'react';
import { BrainCircuit, CalendarDays, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type MockQuestion={
  id:number;
  exam_id:string;
  area:string;
  skill_name:string;
  prompt:string;
  correct_option:string|null;
};

type MockRow={q:MockQuestion;selected:string|null;ok:boolean};

type Props={
  examId:string;
  examLabel:string;
  rows:MockRow[];
  elapsed:number;
  seed:number;
};

type Weakness={
  key:string;
  area:string;
  skill:string;
  correct:number;
  total:number;
  wrong:number;
  accuracy:number;
};

export default function PostMockTwinAdaptation({examId,examLabel,rows,elapsed,seed}:Props){
  const[historySaved,setHistorySaved]=useState(false);
  const[weeklyHours,setWeeklyHours]=useState<number|null>(null);
  const[hasMatchingPlan,setHasMatchingPlan]=useState(false);
  const[adapting,setAdapting]=useState(false);
  const[adapted,setAdapted]=useState(false);
  const[dismissed,setDismissed]=useState(false);
  const[message,setMessage]=useState('');

  const weaknesses=useMemo<Weakness[]>(()=>{
    const grouped=new Map<string,Weakness>();
    rows.forEach(row=>{
      const area=row.q.area||'Área não identificada';
      const skill=row.q.skill_name||area;
      const key=`${area}::${skill}`;
      const current=grouped.get(key)||{key,area,skill,correct:0,total:0,wrong:0,accuracy:0};
      current.total+=1;
      if(row.ok)current.correct+=1;
      else current.wrong+=1;
      current.accuracy=current.total?current.correct/current.total:0;
      grouped.set(key,current);
    });
    return [...grouped.values()]
      .filter(item=>item.wrong>0)
      .sort((a,b)=>a.accuracy-b.accuracy||b.wrong-a.wrong||b.total-a.total)
      .slice(0,4);
  },[rows]);

  useEffect(()=>{
    let alive=true;
    (async()=>{
      if(!supabase||!rows.length)return;
      const{data:{user}}=await supabase.auth.getUser();
      if(!user||!alive)return;
      const prefResult=await supabase.from('student_exam_preferences')
        .select('weekly_hours')
        .eq('user_id',user.id)
        .eq('exam_id',examId)
        .maybeSingle();
      if(alive){
        setHasMatchingPlan(Boolean(prefResult.data));
        setWeeklyHours(prefResult.data?.weekly_hours!=null?Number(prefResult.data.weekly_hours):null);
      }
      const questionSignature=rows.map(row=>row.q.id).join('-');
      const saveKey=`conectae:mock-history:${user.id}:${examId}:${seed}:${questionSignature}`;
      if(sessionStorage.getItem(saveKey)){if(alive)setHistorySaved(true);return;}
      const averageSeconds=rows.length?Math.max(1,Math.round(elapsed/rows.length)):null;
      const payload=rows.map(row=>({
        user_id:user.id,
        exam_id:examId,
        question_id:row.q.id,
        area:row.q.area,
        skill_name:row.q.skill_name,
        selected_option:row.selected,
        correct:row.ok,
        duration_seconds:averageSeconds,
        error_type:row.ok?null:'simulado',
        error_detail:row.ok?null:`Erro medido no simulado ${examLabel}`,
      }));
      const{error}=await supabase.from('student_practice_attempts').insert(payload);
      if(!error){
        sessionStorage.setItem(saveKey,'1');
        if(alive)setHistorySaved(true);
        window.dispatchEvent(new CustomEvent('conectae:mock-finished',{detail:{examId,seed}}));
      }
    })().catch(()=>{});
    return()=>{alive=false};
  },[elapsed,examId,examLabel,rows,seed]);

  const adaptPlan=async()=>{
    if(!supabase||adapting||adapted)return;
    setAdapting(true);setMessage('');
    try{
      const{data:{user}}=await supabase.auth.getUser();
      if(!user)throw new Error('login');
      if(!weaknesses.length){setAdapted(true);setMessage('Seu resultado não mostrou uma fraqueza clara para redistribuir o plano. O gêmeo vai usar este simulado como evidência de manutenção.');return;}
      const adaptKey=`conectae:mock-adapt:${user.id}:${examId}:${seed}`;
      if(!sessionStorage.getItem(adaptKey)){
        const payload=weaknesses.slice(0,3).map(item=>({
          user_id:user.id,
          exam_id:examId,
          skill_code:null,
          area:item.area,
          question_text:`Diagnóstico agregado do simulado ${examLabel}: ${item.skill}`,
          correct:false,
          confidence:Math.min(1,Math.max(.55,item.total/6)),
          error_type:'simulado',
          error_detail:`${item.correct}/${item.total} acertos (${Math.round(item.accuracy*100)}%); ${item.wrong} erro(s).`,
          diagnosis:{
            source:'mixed_mock',
            skill_name:item.skill,
            mock_accuracy:item.accuracy,
            correct:item.correct,
            total:item.total,
            wrong:item.wrong,
            seed,
            accepted_for_weekly_plan:true,
          },
        }));
        const{error}=await supabase.from('student_skill_diagnostics').insert(payload);
        if(error)throw error;
        sessionStorage.setItem(adaptKey,'1');
      }
      const pref=await supabase.from('student_exam_preferences')
        .select('exam_id')
        .eq('user_id',user.id)
        .eq('exam_id',examId)
        .maybeSingle();
      if(pref.data){
        await supabase.from('student_exam_preferences')
          .update({updated_at:new Date().toISOString()})
          .eq('user_id',user.id)
          .eq('exam_id',examId);
        setHasMatchingPlan(true);
      }
      setAdapted(true);
      window.dispatchEvent(new CustomEvent('conectae:diagnostic-saved',{detail:{examId,source:'mixed_mock_accepted'}}));
      setMessage(pref.data
        ?'Plano recalibrado: as próximas semanas vão dar mais peso às fraquezas deste simulado sem aumentar sua carga horária.'
        :'Fraquezas salvas no gêmeo. Ao criar ou abrir um plano deste vestibular, elas entrarão automaticamente na distribuição semanal.');
    }catch{
      setMessage('O gêmeo entendeu o resultado, mas não conseguiu salvar a adaptação agora. Tente novamente.');
    }finally{setAdapting(false)}
  };

  const openPlan=()=>{
    const url=new URL(window.location.href);
    url.searchParams.set('planner','aprovacao');
    url.searchParams.delete('experience');
    url.searchParams.delete('modo');
    window.location.assign(`${url.pathname}${url.search}${url.hash}`);
  };

  const weakest=weaknesses[0];
  const hourText=weeklyHours!=null?`${weeklyHours}h/semana`:'o mesmo tempo semanal já definido';

  return <section className="mt-5 rounded-[22px] border border-amber-300/25 bg-amber-300/[.06] p-5">
    <div className="flex items-start gap-3">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-300/10 text-amber-200"><BrainCircuit size={22}/></span>
      <div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[.12em] text-amber-200"><Sparkles size={13}/>Gêmeo de estudos + IA</div>
        <h3 className="mt-1 text-xl font-black">Seu simulado já virou diagnóstico.</h3>
        <p className="mt-2 text-sm leading-relaxed text-[#e0aa18]">{historySaved?'As respostas já entraram no histórico que alimenta o gêmeo e a IA.':'Estou enviando cada resposta para o histórico do gêmeo.'} {weakest?`O sinal mais fraco agora é ${weakest.area} — ${weakest.skill}, com ${weakest.correct}/${weakest.total} acertos neste recorte.`:'Não apareceu uma fraqueza clara neste simulado.'}</p>
      </div>
    </div>

    {weaknesses.length>0&&<div className="mt-4 grid gap-2 md:grid-cols-2">{weaknesses.slice(0,4).map(item=><div key={item.key} className="rounded-xl border border-white/10 bg-[#0b0904] px-3 py-3"><div className="text-[10px] font-extrabold uppercase tracking-wide text-[#b88408]">{item.area}</div><div className="mt-1 text-sm font-extrabold">{item.skill}</div><div className="mt-1 text-xs text-[#e0aa18]">{item.correct}/{item.total} acertos · {Math.round(item.accuracy*100)}%</div></div>)}</div>}

    {!adapted&&!dismissed&&<div className="mt-4 rounded-2xl border border-[#6f4f08] bg-[#0b0904] p-4">
      <strong className="block text-base">Quer adaptar seu plano semanal com base neste simulado?</strong>
      <p className="mt-1 text-xs leading-relaxed text-[#e0aa18]">Se você aceitar, o gêmeo redistribui prioridade para essas fraquezas dentro de <b>{hourText}</b>. Nada muda sozinho e nenhuma hora extra é criada.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={adaptPlan} disabled={adapting} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#ffd45e] px-4 text-xs font-extrabold text-white disabled:opacity-50">{adapting?<Loader2 size={15} className="animate-spin"/>:<CalendarDays size={15}/>}Sim, adaptar meu plano</button>
        <button type="button" onClick={()=>setDismissed(true)} className="min-h-11 rounded-xl border border-[#241904] px-4 text-xs font-extrabold text-[#e0aa18]">Não agora</button>
      </div>
    </div>}

    {dismissed&&<div className="mt-4 rounded-xl border border-[#241904] bg-[#0b0904] p-3 text-xs leading-relaxed text-[#e0aa18]">Plano mantido como está. O desempenho do simulado continua no histórico e ajuda a IA a entender sua evolução.</div>}
    {adapted&&<div className="mt-4 rounded-xl border border-amber-300/25 bg-amber-300/[.06] p-4"><div className="flex items-center gap-2 font-extrabold text-amber-200"><CheckCircle2 size={17}/>Adaptação aceita</div><p className="mt-2 text-xs leading-relaxed text-[#e0aa18]">{message}</p>{hasMatchingPlan&&<button type="button" onClick={openPlan} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-400 px-4 text-xs font-extrabold text-[#0b0904]"><CalendarDays size={15}/>Ver meu plano adaptado</button>}</div>}
    {!adapted&&message&&<div className="mt-3 text-xs text-amber-100">{message}</div>}
  </section>;
}
