import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BrainCircuit, Camera, CheckCircle2, ImagePlus, Loader2, Sparkles, Trash2, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import './planner-study-lab.css';
import './planner-study-lab-v2.css';

type ErrorReason='conteudo'|'interpretacao'|'tempo'|'calculo'|'distracao'|'estrategia'|'outro';
type Skill={exam_id:string;area:string;skill_code:string;skill_name:string;diagnostic_tags:string[]};
type PhotoAnalysis={question_text:string;area:string;skill_code:string|null;skill_name:string|null;confidence:number;correct_answer:string|null;solution_summary:string;solution_steps:string[];common_trap:string|null;needs_better_photo:boolean;uncertainty_reason:string|null};
const REASONS:{id:ErrorReason;label:string}[]=[
  {id:'conteudo',label:'Não sabia o conteúdo'},
  {id:'interpretacao',label:'Interpretei errado'},
  {id:'tempo',label:'Faltou tempo'},
  {id:'calculo',label:'Errei cálculo/procedimento'},
  {id:'distracao',label:'Foi distração'},
  {id:'estrategia',label:'Não sabia como começar'},
  {id:'outro',label:'Outro motivo'},
];

async function compressForAnalysis(file:File){
  const source=await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=()=>reject(r.error);r.readAsDataURL(file)});
  const img=await new Promise<HTMLImageElement>((resolve,reject)=>{const el=new Image();el.onload=()=>resolve(el);el.onerror=()=>reject(new Error('Não foi possível ler a imagem.'));el.src=source});
  const maxSide=1800;const scale=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
  const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Não foi possível preparar a foto.');ctx.drawImage(img,0,0,canvas.width,canvas.height);
  return canvas.toDataURL('image/jpeg',.88);
}

export default function PlannerStudyLabV2(){
  const[examId,setExamId]=useState(localStorage.getItem('conectae:active-exam')||'enem');
  const[skills,setSkills]=useState<Skill[]>([]);
  const[file,setFile]=useState<File|null>(null);
  const[preview,setPreview]=useState('');
  const[text,setText]=useState('');
  const[area,setArea]=useState('Automático');
  const[reason,setReason]=useState<ErrorReason|' '>(' ');
  const[detail,setDetail]=useState('');
  const[busy,setBusy]=useState(false);
  const[error,setError]=useState('');
  const[success,setSuccess]=useState('');
  const[analysis,setAnalysis]=useState<PhotoAnalysis|null>(null);

  useEffect(()=>{const sync=()=>setExamId(localStorage.getItem('conectae:active-exam')||'enem');sync();const t=setInterval(sync,1200);return()=>clearInterval(t)},[]);
  useEffect(()=>{(async()=>{if(!supabase)return;const{data}=await supabase.from('exam_skill_taxonomy').select('exam_id,area,skill_code,skill_name,diagnostic_tags').eq('exam_id',examId);setSkills((data??[]) as Skill[])})()},[examId]);
  useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview)},[preview]);
  const areas=useMemo(()=>['Automático',...Array.from(new Set(skills.map(s=>s.area))).sort((a,b)=>a.localeCompare(b,'pt-BR'))],[skills]);

  const chooseFile=async(f:File|null)=>{
    if(!f)return;setError('');setSuccess('');setAnalysis(null);
    if(!['image/jpeg','image/png','image/webp'].includes(f.type)){setError('Use uma foto JPG, PNG ou WebP.');return}
    if(f.size>10*1024*1024){setError('A foto precisa ter até 10 MB.');return}
    if(preview)URL.revokeObjectURL(preview);setFile(f);setPreview(URL.createObjectURL(f));
    try{const Detector=(window as any).TextDetector;if(Detector){const bitmap=await createImageBitmap(f);const blocks=await new Detector().detect(bitmap);const extracted=blocks.map((b:any)=>b.rawValue).join('\n').trim();if(extracted.length>8)setText(extracted)}}catch{}
  };
  const clear=()=>{if(preview)URL.revokeObjectURL(preview);setFile(null);setPreview('');setText('');setSuccess('');setError('');setAnalysis(null)};

  const submit=async()=>{
    if(!file){setError('Tire ou escolha uma foto da questão antes de enviar.');return}
    if(!supabase)return;setBusy(true);setError('');setSuccess('');setAnalysis(null);
    try{
      const{data:sessionData}=await supabase.auth.getSession();const token=sessionData.session?.access_token;if(!token)throw new Error('Faça login novamente.');
      const imageDataUrl=await compressForAnalysis(file);
      const aiResponse=await fetch('/api/analyze-question',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({imageDataUrl,examId,taxonomy:skills,textHint:text,areaHint:area})});
      const aiPayload=await aiResponse.json().catch(()=>({}));if(!aiResponse.ok)throw new Error(aiPayload?.error||'Não foi possível analisar a questão.');
      const result=aiPayload.analysis as PhotoAnalysis;setAnalysis(result);
      if(result.needs_better_photo){setError(result.uncertainty_reason||'A foto não mostra informação suficiente para corrigir com segurança. Tire outra foto incluindo o enunciado, gráfico e todas as alternativas.');return}

      const{data:userData}=await supabase.auth.getUser();const user=userData.user;if(!user)throw new Error('Faça login novamente.');
      const ext=(file.name.split('.').pop()||'jpg').replace(/[^a-z0-9]/gi,'').toLowerCase()||'jpg';const path=`${user.id}/scanner/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
      const{error:uploadError}=await supabase.storage.from('student-evidence').upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});if(uploadError)throw uploadError;
      const finalArea=result.area|| (area==='Automático'?'Não identificada':area);
      const chosenReason=reason===' '?'outro':reason;
      const{error:insertError}=await supabase.from('student_skill_diagnostics').insert({user_id:user.id,exam_id:examId,skill_code:result.skill_code,area:finalArea,question_text:result.question_text||text||'[diagnóstico com imagem]',correct:null,confidence:result.confidence,error_type:chosenReason,error_detail:detail||null,evidence_path:path,diagnosis:{skill_name:result.skill_name,error_reason:REASONS.find(r=>r.id===chosenReason)?.label,source:'photo-scanner-ai-v3',correct_answer:result.correct_answer,solution_summary:result.solution_summary,solution_steps:result.solution_steps,common_trap:result.common_trap,uncertainty_reason:result.uncertainty_reason}});if(insertError)throw insertError;
      setText(result.question_text||text);setSuccess(`Questão corrigida e diagnóstico salvo em ${finalArea}${result.skill_name?` · ${result.skill_name}`:''}. O Plano foi atualizado com essa habilidade.`);window.dispatchEvent(new CustomEvent('conectae:diagnostic-saved'));
    }catch(e:any){setError(e?.message||'Não foi possível analisar a foto. A imagem continua aqui para você tentar novamente.')}finally{setBusy(false)}
  };

  return <section className="study7-wrap" id="diagnostico-foto"><div className="study7-head"><div><span className="study7-kicker"><BrainCircuit size={15}/>Correção por foto</span><h2>Envie uma questão: o Conectaê identifica a habilidade, dá o gabarito e explica a resolução.</h2><p>A análise usa a taxonomia da prova ativa para chegar à habilidade específica. Depois da correção, a dificuldade também entra no seu Plano.</p></div></div><div className="study7-scanner-grid"><div className="study7-upload-card">{preview?<><img src={preview} alt="Prévia da questão" className="study7-preview"/><div className="study7-actions"><label className="study7-btn"><ImagePlus size={16}/>Trocar foto<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden onChange={e=>chooseFile(e.target.files?.[0]||null)}/></label><button className="study7-btn" onClick={clear}><Trash2 size={16}/>Remover</button></div><div className="study7-ready"><CheckCircle2 size={16}/>Foto pronta para analisar</div></>:<><Camera size={34}/><h3>Tire uma foto da questão inteira</h3><p>Inclua enunciado, gráfico/tabela e todas as alternativas. JPG, PNG ou WebP · até 10 MB.</p><label className="study7-btn primary"><Camera size={16}/>Abrir câmera<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden onChange={e=>chooseFile(e.target.files?.[0]||null)}/></label><label className="study7-btn"><Upload size={16}/>Escolher da galeria<input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e=>chooseFile(e.target.files?.[0]||null)}/></label></>}</div><div className="study7-form"><label>Matéria <span>(opcional)</span><select value={area} onChange={e=>setArea(e.target.value)}>{areas.map(a=><option key={a}>{a}</option>)}</select></label><div><span className="study7-label">Por que foi difícil? <span>(opcional; melhora o plano)</span></span><div className="study7-reasons">{REASONS.map(r=><button type="button" key={r.id} className={reason===r.id?'active':''} onClick={()=>setReason(r.id)}>{r.label}</button>)}</div></div><label>O que aconteceu? <span>(opcional)</span><textarea value={detail} onChange={e=>setDetail(e.target.value)} placeholder="Ex.: sabia a fórmula, mas não percebi qual usar..."/></label><label>Texto da questão <span>(opcional; só como complemento)</span><textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Se algum trecho estiver difícil de ler na foto, você pode escrevê-lo aqui."/></label>{error&&<div className="study7-alert error"><AlertCircle size={16}/>{error}</div>}{success&&<div className="study7-alert success"><CheckCircle2 size={16}/>{success}</div>}<button className="study7-submit" disabled={busy||!file||!skills.length} onClick={submit}>{busy?<Loader2 size={17} className="animate-spin"/>:<Sparkles size={17}/>}Analisar, corrigir e atualizar plano</button></div></div>{analysis&&!analysis.needs_better_photo&&<div className="study7-correction" style={{marginTop:20,display:'grid',gap:14}}><div className="study7-head"><div><span className="study7-kicker"><CheckCircle2 size={15}/>Correção da questão</span><h2>{analysis.skill_name||'Habilidade ainda não identificada com segurança'}</h2><p><strong>{analysis.area}</strong>{analysis.skill_name?` · confiança ${Math.round(analysis.confidence*100)}%`:''}</p></div></div><div className="study7-form"><div className="study7-alert success"><CheckCircle2 size={16}/><div><strong>Gabarito: </strong>{analysis.correct_answer||'Não foi possível determinar com segurança.'}</div></div>{analysis.solution_summary&&<div><span className="study7-label">Ideia central</span><p>{analysis.solution_summary}</p></div>}{analysis.solution_steps?.length>0&&<div><span className="study7-label">Resolução passo a passo</span><ol style={{paddingLeft:22,display:'grid',gap:8}}>{analysis.solution_steps.map((step,i)=><li key={i}>{step}</li>)}</ol></div>}{analysis.common_trap&&<div className="study7-alert"><AlertCircle size={16}/><div><strong>Pegadinha/erro comum: </strong>{analysis.common_trap}</div></div>}{analysis.uncertainty_reason&&<div className="study7-alert"><AlertCircle size={16}/>{analysis.uncertainty_reason}</div>}</div></div>}</section>;
}
