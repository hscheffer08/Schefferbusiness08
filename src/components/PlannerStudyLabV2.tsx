import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BrainCircuit, Camera, CheckCircle2, ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import './planner-study-lab.css';

type ErrorReason='conteudo'|'interpretacao'|'tempo'|'calculo'|'distracao'|'estrategia'|'outro';
type Skill={exam_id:string;area:string;skill_code:string;skill_name:string;diagnostic_tags:string[]};
const REASONS:{id:ErrorReason;label:string}[]=[
  {id:'conteudo',label:'Não sabia o conteúdo'},
  {id:'interpretacao',label:'Interpretei errado'},
  {id:'tempo',label:'Faltou tempo'},
  {id:'calculo',label:'Errei cálculo/procedimento'},
  {id:'distracao',label:'Foi distração'},
  {id:'estrategia',label:'Não sabia como começar'},
  {id:'outro',label:'Outro motivo'},
];
const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

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

  useEffect(()=>{const sync=()=>setExamId(localStorage.getItem('conectae:active-exam')||'enem');sync();const t=setInterval(sync,1200);return()=>clearInterval(t)},[]);
  useEffect(()=>{(async()=>{if(!supabase)return;const{data}=await supabase.from('exam_skill_taxonomy').select('exam_id,area,skill_code,skill_name,diagnostic_tags').eq('exam_id',examId);setSkills((data??[]) as Skill[])})()},[examId]);
  useEffect(()=>()=>{if(preview)URL.revokeObjectURL(preview)},[preview]);
  const areas=useMemo(()=>['Automático',...Array.from(new Set(skills.map(s=>s.area))).sort((a,b)=>a.localeCompare(b,'pt-BR'))],[skills]);

  const chooseFile=async(f:File|null)=>{
    if(!f)return;setError('');setSuccess('');
    if(!['image/jpeg','image/png','image/webp'].includes(f.type)){setError('Use uma foto JPG, PNG ou WebP.');return}
    if(f.size>10*1024*1024){setError('A foto precisa ter até 10 MB.');return}
    if(preview)URL.revokeObjectURL(preview);setFile(f);setPreview(URL.createObjectURL(f));
    try{const Detector=(window as any).TextDetector;if(Detector){const bitmap=await createImageBitmap(f);const blocks=await new Detector().detect(bitmap);const extracted=blocks.map((b:any)=>b.rawValue).join('\n').trim();if(extracted.length>8)setText(extracted)}}catch{}
  };
  const clear=()=>{if(preview)URL.revokeObjectURL(preview);setFile(null);setPreview('');setText('');setSuccess('');setError('')};

  const inferSkill=()=>{
    const hay=norm(`${text} ${detail}`);const candidates=area==='Automático'?skills:skills.filter(s=>s.area===area);
    let best:Skill|undefined,score=-1;
    for(const s of candidates){const tokens=[s.skill_name,s.area,...(s.diagnostic_tags||[])].flatMap(v=>norm(v).split(/[^a-z0-9]+/)).filter(t=>t.length>3);const n=tokens.reduce((sum,t)=>sum+(hay.includes(t)?1:0),0)+(hay.includes(norm(s.skill_name))?4:0);if(n>score){score=n;best=s}}
    return best||candidates[0]||skills[0];
  };

  const submit=async()=>{
    if(!file){setError('Tire ou escolha uma foto da questão antes de enviar.');return}
    if(reason===' '){setError('Marque por que essa questão foi difícil.');return}
    if(!supabase)return;setBusy(true);setError('');setSuccess('');
    try{
      const{data:userData}=await supabase.auth.getUser();const user=userData.user;if(!user)throw new Error('Faça login novamente.');
      const ext=(file.name.split('.').pop()||'jpg').replace(/[^a-z0-9]/gi,'').toLowerCase()||'jpg';const path=`${user.id}/scanner/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
      const{error:uploadError}=await supabase.storage.from('student-evidence').upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});if(uploadError)throw uploadError;
      const skill=inferSkill();const finalArea=area==='Automático'?(skill?.area||'Não identificada'):area;
      const{error:insertError}=await supabase.from('student_skill_diagnostics').insert({user_id:user.id,exam_id:examId,skill_code:skill?.skill_code??null,area:finalArea,question_text:text||'[diagnóstico com imagem]',correct:null,confidence:skill?.skill_name?.length?0.75:0.45,error_type:reason,error_detail:detail||null,evidence_path:path,diagnosis:{skill_name:skill?.skill_name??null,error_reason:REASONS.find(r=>r.id===reason)?.label,source:'photo-scanner-v2'}});if(insertError)throw insertError;
      setSuccess(`Dificuldade salva em ${finalArea}${skill?.skill_name?` · ${skill.skill_name}`:''}. Ela entrou como EXTRA no seu Plano.`);window.dispatchEvent(new CustomEvent('conectae:diagnostic-saved'));setFile(null);if(preview)URL.revokeObjectURL(preview);setPreview('');setText('');setDetail('');setReason(' ');
    }catch(e:any){setError(e?.message||'Não foi possível enviar a foto. A imagem continua aqui para você tentar novamente.')}finally{setBusy(false)}
  };

  return <section className="study7-wrap" id="diagnostico-foto"><div className="study7-head"><div><span className="study7-kicker"><BrainCircuit size={15}/>Diagnóstico por foto</span><h2>Uma dificuldade vira uma tarefa extra no seu plano.</h2><p>Tire a foto, diga o que aconteceu e envie. A imagem fica salva de forma privada na sua conta e o Plano cria uma recuperação extra para a habilidade detectada.</p></div></div><div className="study7-scanner-grid"><div className="study7-upload-card">{preview?<><img src={preview} alt="Prévia da questão" className="study7-preview"/><div className="study7-actions"><label className="study7-btn"><ImagePlus size={16}/>Trocar foto<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden onChange={e=>chooseFile(e.target.files?.[0]||null)}/></label><button className="study7-btn" onClick={clear}><Trash2 size={16}/>Remover</button></div><div className="study7-ready"><CheckCircle2 size={16}/>Foto pronta para enviar</div></>:<><Camera size={34}/><h3>Tire uma foto da questão</h3><p>JPG, PNG ou WebP · até 10 MB.</p><label className="study7-btn primary"><Camera size={16}/>Abrir câmera<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" hidden onChange={e=>chooseFile(e.target.files?.[0]||null)}/></label><label className="study7-btn"><Upload size={16}/>Escolher da galeria<input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e=>chooseFile(e.target.files?.[0]||null)}/></label></>}</div><div className="study7-form"><label>Matéria<select value={area} onChange={e=>setArea(e.target.value)}>{areas.map(a=><option key={a}>{a}</option>)}</select></label><div><span className="study7-label">Por que foi difícil?</span><div className="study7-reasons">{REASONS.map(r=><button type="button" key={r.id} className={reason===r.id?'active':''} onClick={()=>setReason(r.id)}>{r.label}</button>)}</div></div><label>O que aconteceu? <span>(opcional)</span><textarea value={detail} onChange={e=>setDetail(e.target.value)} placeholder="Ex.: sabia a fórmula, mas não percebi qual usar; fiquei muito tempo presa na questão..."/></label><label>Texto da questão <span>(opcional; ajuda na identificação)</span><textarea value={text} onChange={e=>setText(e.target.value)} placeholder="No iPhone, se o texto não for lido automaticamente, você pode colar ou escrever um trecho aqui."/></label>{error&&<div className="study7-alert error"><AlertCircle size={16}/>{error}</div>}{success&&<div className="study7-alert success"><CheckCircle2 size={16}/>{success}</div>}<button className="study7-submit" disabled={busy||!file} onClick={submit}>{busy?<Loader2 size={17} className="animate-spin"/>:<Upload size={17}/>}Enviar dificuldade e atualizar plano</button></div></div></section>;
}
