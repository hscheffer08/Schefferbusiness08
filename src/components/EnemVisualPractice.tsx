import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Image as ImageIcon, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import './enem-visual-practice.css';

type VisualQuestion={id:number;area:string;skill_name:string;prompt:string;option_a:string|null;option_b:string|null;option_c:string|null;option_d:string|null;option_e:string|null;correct_option:string|null;explanation:string|null;image_url:string;image_alt:string|null;image_credit:string|null};
const opts=['A','B','C','D','E'] as const;

export default function EnemVisualPractice(){
  const[exam,setExam]=useState(localStorage.getItem('conectae:active-exam')||'enem');
  const[rows,setRows]=useState<VisualQuestion[]>([]);
  const[index,setIndex]=useState(0);
  const[selected,setSelected]=useState('');
  const[checked,setChecked]=useState(false);
  useEffect(()=>{const sync=()=>setExam(localStorage.getItem('conectae:active-exam')||'enem');sync();const t=setInterval(sync,1200);return()=>clearInterval(t)},[]);
  useEffect(()=>{(async()=>{if(!supabase||exam!=='enem'){setRows([]);return}const{data}=await supabase.from('exam_practice_questions').select('id,area,skill_name,prompt,option_a,option_b,option_c,option_d,option_e,correct_option,explanation,image_url,image_alt,image_credit').eq('exam_id','enem').eq('active',true).not('image_url','is',null).limit(40);setRows((data??[]) as VisualQuestion[])})()},[exam]);
  const q=rows[index%Math.max(1,rows.length)];
  const choices=useMemo(()=>q?opts.map(k=>({k,text:q[`option_${k.toLowerCase()}` as keyof VisualQuestion] as string|null})).filter(x=>x.text):[],[q]);
  if(exam!=='enem'||!q)return null;
  const next=()=>{setIndex(v=>(v+1)%rows.length);setSelected('');setChecked(false)};
  return <section className="visualq-wrap"><div className="visualq-head"><span><ImageIcon size={16}/>Questões visuais ENEM</span><h2>Treine leitura de imagem + conteúdo.</h2><p>Questões autorais com fotografias e contexto visual para variar o tipo de estímulo usado no treino.</p></div><div className="visualq-card"><div className="visualq-image"><img src={q.image_url} alt={q.image_alt||'Imagem da questão'}/>{q.image_credit&&<small>{q.image_credit}</small>}</div><div className="visualq-body"><div className="visualq-meta">{q.area} · {q.skill_name}</div><h3>{q.prompt}</h3><div className="visualq-options">{choices.map(o=><button key={o.k} className={selected===o.k?'active':''} disabled={checked} onClick={()=>setSelected(o.k)}><b>{o.k}</b><span>{o.text}</span></button>)}</div>{checked&&<div className={`visualq-feedback ${selected===q.correct_option?'ok':'bad'}`}>{selected===q.correct_option?<CheckCircle2 size={18}/>:<XCircle size={18}/>}<div><strong>{selected===q.correct_option?'Correto':'Revise este ponto'}</strong><p>{q.explanation}</p></div></div>}<div className="visualq-actions"><button disabled={!selected||checked} onClick={()=>setChecked(true)}>Corrigir</button><button className="secondary" onClick={next}>Próxima visual</button></div></div></div></section>;
}
