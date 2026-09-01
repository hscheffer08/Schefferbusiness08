import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, ExternalLink, Target } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import './admissions-target-intelligence.css';

type Cutoff={institution:string;exam_id:string;course_label:string;variant:string;year:number;modality:string;target_kind:string;target_value:number;max_value:number|null;source_url:string;source_label:string;confidence:string;notes:string|null};
type Calibration={area:string;target_score:number;median_correct:number;total_questions:number;source_url:string;source_kind:string;method_note:string};
type Preference={exam_id:string;course_label:string|null;selected_university_id:number|null;updated_at:string};

type AreaEstimate={area:string;score:number;correct:number;low:number;high:number};

const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();

function interpolate(rows:Calibration[],score:number){
  const sorted=[...rows].sort((a,b)=>a.target_score-b.target_score);
  if(!sorted.length)return 0;
  if(score<=sorted[0].target_score)return sorted[0].median_correct;
  if(score>=sorted[sorted.length-1].target_score)return sorted[sorted.length-1].median_correct;
  const upper=sorted.find(r=>r.target_score>=score)!;
  const lower=[...sorted].reverse().find(r=>r.target_score<=score)!;
  if(upper.target_score===lower.target_score)return upper.median_correct;
  const t=(score-lower.target_score)/(upper.target_score-lower.target_score);
  return lower.median_correct+(upper.median_correct-lower.median_correct)*t;
}

export default function AdmissionsTargetIntelligence(){
  const[pref,setPref]=useState<Preference|null>(null);
  const[institution,setInstitution]=useState('');
  const[cutoffs,setCutoffs]=useState<Cutoff[]>([]);
  const[calibration,setCalibration]=useState<Calibration[]>([]);

  useEffect(()=>{let alive=true;(async()=>{
    if(!supabase)return;
    const{data:userData}=await supabase.auth.getUser();
    if(!userData.user)return;
    const{data:p}=await supabase.from('student_exam_preferences').select('exam_id,course_label,selected_university_id,updated_at').eq('user_id',userData.user.id).order('updated_at',{ascending:false}).limit(1).maybeSingle();
    if(!alive||!p)return;
    setPref(p as Preference);
    if(p.selected_university_id){
      const{data:u}=await supabase.from('area_universities').select('university_name').eq('area_university_id',p.selected_university_id).maybeSingle();
      if(alive)setInstitution(u?.university_name??'');
    }
    const[{data:c},{data:t}]=await Promise.all([
      supabase.from('admission_cutoff_references').select('*').order('year',{ascending:false}),
      supabase.from('enem_tri_empirical_calibration').select('*').eq('exam_year',2025).order('target_score'),
    ]);
    if(alive){setCutoffs((c??[]) as Cutoff[]);setCalibration((t??[]) as Calibration[])}
  })();
  const sync=()=>window.dispatchEvent(new Event('conectae:target-refresh'));
  window.addEventListener('conectae:target-refresh',sync,{once:true});
  return()=>{alive=false;window.removeEventListener('conectae:target-refresh',sync)}} ,[]);

  const active=useMemo(()=>{
    if(!pref||!institution||!pref.course_label)return null;
    const rows=cutoffs.filter(c=>norm(c.institution)===norm(institution)&&norm(c.exam_id)===norm(pref.exam_id)&&norm(c.course_label)===norm(pref.course_label!));
    return rows.sort((a,b)=>b.year-a.year||b.target_value-a.target_value)[0]??null;
  },[pref,institution,cutoffs]);

  const estimates=useMemo<AreaEstimate[]>(()=>{
    if(!active||active.exam_id!=='enem'||!calibration.length)return[];
    const base=Math.min(800,Math.max(500,Number(active.target_value)));
    return ['Linguagens','Humanas','Natureza','Matemática'].map(area=>{
      const rows=calibration.filter(r=>r.area===area);
      const correct=interpolate(rows,base);
      const rounded=Math.max(1,Math.min(45,Math.round(correct)));
      return{area,score:Math.round(base),correct:rounded,low:Math.max(1,rounded-2),high:Math.min(45,rounded+2)};
    });
  },[active,calibration]);

  if(!pref||!institution)return null;

  return <section className="target13-wrap" id="meta-aprovacao-dados">
    <div className="target13-head"><div><span className="target13-kicker"><Target size={15}/>Meta baseada em dados</span><h2>Quanto você precisa mirar — com fonte e margem de incerteza.</h2><p>O sistema cruza a referência oficial disponível para o curso com uma aproximação empírica do ENEM. Corte passado não garante aprovação futura.</p></div><BarChart3 size={28}/></div>
    {!active?<div className="target13-empty"><AlertTriangle size={18}/><div><strong>Ainda não há corte oficial específico cadastrado para {institution} · {pref.course_label}.</strong><p>O plano continua usando metas de segurança da prova, mas não apresenta um corte inventado.</p></div></div>:<>
      <div className="target13-summary"><div><span>Referência oficial {active.year} · {active.modality}</span><strong>{Number(active.target_value).toLocaleString('pt-BR',{maximumFractionDigits:2})}{active.exam_id==='fuvest'?' acertos':' pontos'}</strong><small>{active.variant||active.target_kind}</small></div><div className="target13-note"><strong>Como usar</strong><p>{active.notes||'Use como referência histórica, com margem de segurança.'}</p><a href={active.source_url} target="_blank" rel="noreferrer">Fonte oficial <ExternalLink size={13}/></a></div></div>
      {active.exam_id==='enem'&&<div className="target13-tri"><div className="target13-warning"><AlertTriangle size={17}/><p><b>Acertos são uma aproximação.</b> A TRI considera quais itens foram acertados e a coerência do padrão de respostas. Não existe conversão oficial “X acertos = Y pontos”. As faixas abaixo são referência de planejamento a partir dos microdados, não promessa de nota.</p></div><div className="target13-cards">{estimates.map(e=><article key={e.area}><span>{e.area}</span><strong>{e.low}–{e.high}</strong><small>acertos de 45 · centro ≈ {e.correct}</small></article>)}</div><p className="target13-caption">Equivalência por área se aquela área individual precisasse ficar próxima de {Math.round(Math.min(800,Number(active.target_value)))} pontos. Na média final, uma área forte e a redação podem compensar outra mais baixa.</p></div>}
      {active.exam_id==='fuvest'&&<div className="target13-warning"><AlertTriangle size={17}/><p><b>FUVEST:</b> este número é o corte oficial da 1ª fase da edição indicada. A aprovação final depende também da 2ª fase e das específicas do curso.</p></div>}
    </>}
  </section>;
}
