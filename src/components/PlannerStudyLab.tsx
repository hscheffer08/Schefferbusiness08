import { useEffect, useMemo, useState } from 'react';
import { BarChart3, BookOpen, BrainCircuit, Camera, CheckCircle2, ChevronLeft, ChevronRight, FileText, PlayCircle, Sparkles, Target, Upload, X, XCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import './planner-study-lab.css';

type ExamId = 'enem' | 'fuvest' | 'insper' | 'link' | 'cmmg';
type Question = {
  id: number;
  exam_id: ExamId;
  area: string;
  skill_name: string;
  difficulty: number;
  prompt: string;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  option_e: string | null;
  correct_option: string | null;
  explanation: string | null;
  estimated_minutes: number | null;
};
type Skill = { id:number; exam_id:ExamId; area:string; skill_code:string; skill_name:string; importance:number; diagnostic_tags:string[] };
type Attempt = { exam_id:ExamId; area:string; skill_name:string|null; correct:boolean|null; created_at:string };
type Diagnosis = { area:string; skill:Skill|null; confidence:number; accuracy:number|null; attempts:number; weak:boolean; plan:string[]; evidence:string[] };

function normalize(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function overlapScore(text:string, skill:Skill){
  const hay=normalize(text);
  const tokens=[skill.area,skill.skill_name,...(skill.diagnostic_tags||[])].flatMap(x=>normalize(x).split(/[^a-z0-9]+/)).filter(x=>x.length>3);
  return tokens.reduce((sum,t)=>sum+(hay.includes(t)?1:0),0)+(hay.includes(normalize(skill.skill_name))?3:0)+(hay.includes(normalize(skill.area))?2:0);
}
function planFor(area:string,skill:string,accuracy:number|null){
  const acc=accuracy==null?'sem histórico suficiente':`${Math.round(accuracy*100)}% de acerto recente`;
  return [
    `Dia 1 · diagnóstico guiado: 20–30 min de ${skill || area} e 8 questões fáceis/médias sem consulta.`,
    `Dia 2 · teoria curta: revise apenas os conceitos que apareceram nos erros; termine com 10 questões do mesmo assunto.`,
    `Dia 3 · recuperação ativa: refaça as questões erradas sem olhar a resolução e explique o raciocínio em voz alta.`,
    `Dia 5 · transferência: faça 12 questões variadas de ${area}, misturando dificuldade 2–4/5.`,
    `Dia 7 · mini-simulado: bloco cronometrado de 20–30 min. Compare com ${acc} e registre o novo percentual.`
  ];
}

export default function PlannerStudyLab(){
  const [mount,setMount]=useState<HTMLElement|null>(null);
  const [examId,setExamId]=useState<ExamId>('enem');
  const [questions,setQuestions]=useState<Question[]>([]);
  const [skills,setSkills]=useState<Skill[]>([]);
  const [attempts,setAttempts]=useState<Attempt[]>([]);
  const [subject,setSubject]=useState('Todas');
  const [difficulty,setDifficulty]=useState('Todas');
  const [page,setPage]=useState(1);
  const [active,setActive]=useState<Question|null>(null);
  const [selected,setSelected]=useState('');
  const [result,setResult]=useState<boolean|null>(null);
  const [startedAt,setStartedAt]=useState<number|null>(null);
  const [scannerOpen,setScannerOpen]=useState(false);
  const [scannerText,setScannerText]=useState('');
  const [scannerFile,setScannerFile]=useState('');
  const [diagnosis,setDiagnosis]=useState<Diagnosis|null>(null);
  const [diagnosing,setDiagnosing]=useState(false);

  useEffect(()=>{
    const find=()=>{
      const labels=Array.from(document.querySelectorAll('.plan6-sectionlabel')) as HTMLElement[];
      const label=labels.find(el=>normalize(el.textContent||'').includes('banco de questoes'));
      const section=label?.closest('section') as HTMLElement|null;
      if(section){
        const oldFilters=section.querySelector('.plan6-qfilters') as HTMLElement|null;
        const oldGrid=section.querySelector('.plan6-qgrid') as HTMLElement|null;
        if(oldFilters)oldFilters.style.display='none';
        if(oldGrid)oldGrid.style.display='none';
        setMount(section);
      }
      const text=document.body.innerText;
      if(text.includes('Ciências Médicas-MG')) setExamId('cmmg');
      else if(text.includes('FUVEST')) setExamId('fuvest');
      else if(text.includes('Insper')) setExamId('insper');
      else if(text.includes('Link Journey')) setExamId('link');
      else setExamId('enem');
    };
    find();
    const observer=new MutationObserver(find);
    observer.observe(document.body,{childList:true,subtree:true,characterData:true});
    return()=>observer.disconnect();
  },[]);

  useEffect(()=>{let alive=true;(async()=>{
    if(!supabase)return;
    const [{data:q},{data:s},{data:userData}]=await Promise.all([
      supabase.from('exam_practice_questions').select('*').eq('active',true),
      supabase.from('exam_skill_taxonomy').select('*').order('importance',{ascending:false}),
      supabase.auth.getUser(),
    ]);
    if(!alive)return;
    setQuestions((q??[]) as Question[]);setSkills((s??[]) as Skill[]);
    if(userData.user){const{data:a}=await supabase.from('student_practice_attempts').select('exam_id,area,skill_name,correct,created_at').eq('user_id',userData.user.id).order('created_at',{ascending:false}).limit(500);if(alive)setAttempts((a??[]) as Attempt[])}
  })();return()=>{alive=false}},[]);

  useEffect(()=>{setPage(1);setSubject('Todas');setDifficulty('Todas')},[examId]);
  useEffect(()=>{setPage(1)},[subject,difficulty]);

  const examQuestions=useMemo(()=>questions.filter(q=>q.exam_id===examId),[questions,examId]);
  const subjects=useMemo(()=>['Todas',...Array.from(new Set(examQuestions.map(q=>q.area))).sort((a,b)=>a.localeCompare(b,'pt-BR'))],[examQuestions]);
  const filtered=useMemo(()=>examQuestions.filter(q=>(subject==='Todas'||q.area===subject)&&(difficulty==='Todas'||String(q.difficulty)===difficulty)),[examQuestions,subject,difficulty]);
  const pageSize=24;const pages=Math.max(1,Math.ceil(filtered.length/pageSize));const visible=filtered.slice((page-1)*pageSize,page*pageSize);
  const areaStats=useMemo(()=>subjects.filter(s=>s!=='Todas').map(area=>{const rows=attempts.filter(a=>a.exam_id===examId&&normalize(a.area)===normalize(area)&&a.correct!==null);const accuracy=rows.length?rows.filter(a=>a.correct).length/rows.length:null;return{area,total:examQuestions.filter(q=>q.area===area).length,attempts:rows.length,accuracy}}),[subjects,attempts,examId,examQuestions]);

  const openQuestion=(q:Question)=>{setActive(q);setSelected('');setResult(null);setStartedAt(Date.now())};
  const answer=async()=>{
    if(!active||!selected)return;const ok=selected===active.correct_option;setResult(ok);
    if(!supabase)return;const{data}=await supabase.auth.getUser();if(!data.user)return;
    const duration=startedAt?Math.max(1,Math.round((Date.now()-startedAt)/1000)):null;
    await supabase.from('student_practice_attempts').insert({user_id:data.user.id,exam_id:active.exam_id,question_id:active.id,area:active.area,skill_name:active.skill_name,selected_option:selected,correct:ok,duration_seconds:duration});
    setAttempts(v=>[{exam_id:active.exam_id,area:active.area,skill_name:active.skill_name,correct:ok,created_at:new Date().toISOString()},...v]);
  };
  const nextQuestion=()=>{
    const pool=filtered.filter(q=>q.id!==active?.id);if(pool.length)openQuestion(pool[Math.floor(Math.random()*pool.length)]);else setActive(null);
  };

  const diagnose=async()=>{
    const text=scannerText.trim();if(text.length<12)return;setDiagnosing(true);
    const relevant=skills.filter(s=>s.exam_id===examId);const ranked=relevant.map(skill=>({skill,score:overlapScore(text,skill)})).sort((a,b)=>b.score-a.score);const best=ranked[0]?.skill??null;
    const area=best?.area||subjects.find(s=>s!=='Todas'&&normalize(text).includes(normalize(s)))||'Área ainda não identificada';
    const historic=attempts.filter(a=>a.exam_id===examId&&a.correct!==null&&(normalize(a.area)===normalize(area)||(best?.skill_name&&a.skill_name&&normalize(a.skill_name)===normalize(best.skill_name))));
    const accuracy=historic.length?historic.filter(a=>a.correct).length/historic.length:null;
    const score=ranked[0]?.score??0;const confidence=Math.min(96,Math.max(52,52+score*7));
    const weak=accuracy==null?score>1:accuracy<.68;
    const evidence=[
      best?`A questão se aproxima da habilidade “${best.skill_name}”.`:'Ainda não há palavras suficientes para identificar uma habilidade específica.',
      historic.length?`Seu histórico tem ${historic.length} tentativa${historic.length===1?'':'s'} relacionada${historic.length===1?'':'s'} e ${Math.round((accuracy??0)*100)}% de acerto.`:'Ainda não existe histórico suficiente nessa área; este scan cria o primeiro ponto de referência.',
      weak?'A área merece reforço nas próximas sessões.':'O desempenho não indica uma fragilidade forte agora; o plano sugere manutenção e transferência para questões mais difíceis.'
    ];
    const value:Diagnosis={area,skill:best,confidence,accuracy,attempts:historic.length,weak,plan:planFor(area,best?.skill_name||area,accuracy),evidence};setDiagnosis(value);
    if(supabase){const{data}=await supabase.auth.getUser();if(data.user){await supabase.from('student_skill_diagnostics').insert({user_id:data.user.id,exam_id:examId,skill_code:best?.skill_code??null,area,question_text:text,correct:null,confidence:confidence/100,error_type:weak?'dificuldade provável':'monitoramento',diagnosis:{skill_name:best?.skill_name??null,accuracy,attempts:historic.length,weak,plan:value.plan,evidence}})}}
    setDiagnosing(false);
  };

  const handleFile=async(file:File|null)=>{
    if(!file)return;setScannerFile(file.name);
    try{
      const Detector=(window as any).TextDetector;
      if(Detector&&file.type.startsWith('image/')){const bitmap=await createImageBitmap(file);const blocks=await new Detector().detect(bitmap);const text=blocks.map((b:any)=>b.rawValue).join('\n');if(text)setScannerText(text)}
    }catch{}
  };

  const enhancedBank=mount?createPortal(<div className="study-lab-bank">
    <div className="study-lab-toolbar">
      <div><strong>Escolha a matéria</strong><span>{filtered.length} questão{filtered.length===1?'':'ões'} neste filtro</span></div>
      <div className="study-lab-selects"><select value={subject} onChange={e=>setSubject(e.target.value)}>{subjects.map(s=><option key={s}>{s}</option>)}</select><select value={difficulty} onChange={e=>setDifficulty(e.target.value)}><option>Todas</option>{[1,2,3,4,5].map(d=><option key={d} value={d}>Nível {d}/5</option>)}</select></div>
    </div>
    <div className="study-lab-stats">{areaStats.slice(0,8).map(s=><button key={s.area} className={subject===s.area?'active':''} onClick={()=>setSubject(s.area)}><b>{s.area}</b><span>{s.total} questões</span><small>{s.accuracy==null?'sem histórico':`${Math.round(s.accuracy*100)}% de acerto`}</small></button>)}</div>
    <div className="study-lab-grid">{visible.map(q=><button key={q.id} onClick={()=>openQuestion(q)}><span>{q.area} · nível {q.difficulty}/5</span><strong>{q.skill_name}</strong><p>{q.prompt}</p><em>Responder no site</em></button>)}</div>
    <div className="study-lab-pages"><button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}><ChevronLeft size={16}/>Anterior</button><span>Página {page} de {pages}</span><button disabled={page>=pages} onClick={()=>setPage(p=>Math.min(pages,p+1))}>Próxima<ChevronRight size={16}/></button></div>
  </div>,mount):null;

  return <>{enhancedBank}<button className="study-scan-fab" onClick={()=>setScannerOpen(true)}><Camera size={18}/><span>Escanear dificuldade</span></button>
    {scannerOpen&&<div className="study-lab-overlay"><div className="study-lab-modal scanner"><button className="study-lab-close" onClick={()=>setScannerOpen(false)}><X size={19}/></button><div className="study-lab-kicker"><BrainCircuit size={17}/>Diagnóstico de dificuldade</div><h2>Mostre onde você está travando.</h2><p className="study-lab-lead">Envie ou cole uma questão que você achou difícil. O Conectaê identifica a área e a habilidade mais provável, cruza com seu histórico de respostas e monta um plano curto para atacar o ponto fraco.</p><label className="study-upload"><Upload size={18}/><span><b>{scannerFile||'Adicionar foto da questão'}</b><small>Se o navegador conseguir ler o texto da imagem, ele preenche automaticamente. Você também pode colar o enunciado abaixo.</small></span><input type="file" accept="image/*" onChange={e=>handleFile(e.target.files?.[0]??null)}/></label><textarea value={scannerText} onChange={e=>setScannerText(e.target.value)} placeholder="Cole aqui o enunciado, a alternativa que te confundiu ou descreva onde você travou…"/><button className="study-lab-primary" disabled={scannerText.trim().length<12||diagnosing} onClick={diagnose}><Sparkles size={16}/>{diagnosing?'Analisando…':'Identificar dificuldade e montar plano'}</button>{diagnosis&&<div className="study-diagnosis"><div className="study-diagnosis-head"><div><span>Área identificada</span><h3>{diagnosis.area}</h3><p>{diagnosis.skill?.skill_name||'Habilidade ampla'}</p></div><div className="study-score"><b>{diagnosis.confidence}%</b><span>confiança</span></div></div><div className="study-evidence"><strong>O que os dados mostram</strong>{diagnosis.evidence.map((e,i)=><p key={i}><BarChart3 size={15}/>{e}</p>)}</div><div className="study-plan"><strong>Plano de recuperação — 7 dias</strong>{diagnosis.plan.map((p,i)=><div key={i}><span>{i+1}</span><p>{p}</p></div>)}</div><button className="study-lab-secondary" onClick={()=>{setScannerOpen(false);setSubject(diagnosis.area);setPage(1)}}><BookOpen size={16}/>Ir para questões desta área</button></div>}</div></div>}
    {active&&<div className="study-lab-overlay"><div className="study-lab-modal question"><button className="study-lab-close" onClick={()=>setActive(null)}><X size={19}/></button><div className="study-lab-kicker"><FileText size={16}/>{active.area} · nível {active.difficulty}/5</div><h2>{active.skill_name}</h2><p className="study-question-prompt">{active.prompt}</p>{(['A','B','C','D','E'] as const).map(letter=>{const key=`option_${letter.toLowerCase()}` as keyof Question;const value=active[key] as string|null;return value?<button key={letter} className={`study-option ${selected===letter?'selected':''}`} onClick={()=>result===null&&setSelected(letter)}><b>{letter}</b><span>{value}</span></button>:null})}<div className="study-question-actions">{result===null?<button className="study-lab-primary" disabled={!selected} onClick={answer}><CheckCircle2 size={16}/>Responder e ver explicação</button>:<button className="study-lab-primary" onClick={nextQuestion}><PlayCircle size={16}/>Próxima questão</button>}</div>{result!==null&&<div className={`study-feedback ${result?'right':'wrong'}`}><strong>{result?<CheckCircle2 size={18}/>:<XCircle size={18}/>} {result?'Você acertou.':'Resposta incorreta.'}</strong><p>Gabarito: <b>{active.correct_option}</b></p><p>{active.explanation||'A explicação desta questão está sendo revisada. Use o gabarito e retorne ao conceito central antes de avançar.'}</p></div>}</div></div>}
  </>;
}
