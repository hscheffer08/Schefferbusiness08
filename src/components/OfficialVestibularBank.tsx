import { useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, ExternalLink, Loader2, Search, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type OfficialQuestion={
  question_id:string;
  series_id:string;
  vestibular:string;
  institution:string;
  year:number;
  question_number:number;
  area:string|null;
  subject:string|null;
  skill_name:string|null;
  difficulty:number|null;
  prompt_text:string|null;
  option_a:string|null;
  option_b:string|null;
  option_c:string|null;
  option_d:string|null;
  option_e:string|null;
  correct_option:string|null;
  answer_status:string|null;
  foreign_language:string|null;
  day:number|null;
  booklet_code:string|null;
  color:string|null;
  source_pdf_url:string|null;
  answer_key_url:string|null;
  source_url:string|null;
  source_kind:string;
};

const ALL='Todos';

export default function OfficialVestibularBank(){
  const[rows,setRows]=useState<OfficialQuestion[]>([]);
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState('');
  const[exam,setExam]=useState(ALL);
  const[year,setYear]=useState(ALL);
  const[area,setArea]=useState(ALL);
  const[search,setSearch]=useState('');

  useEffect(()=>{let alive=true;(async()=>{
    if(!supabase){setError('Banco indisponível.');setLoading(false);return}
    const{data,error:loadError}=await supabase
      .from('official_vestibular_question_bank')
      .select('*')
      .order('year',{ascending:false})
      .order('question_number',{ascending:true})
      .limit(1000);
    if(!alive)return;
    if(loadError){setError('Não foi possível carregar as questões oficiais agora.');setLoading(false);return}
    setRows((data??[]) as OfficialQuestion[]);
    setLoading(false);
  })();return()=>{alive=false}},[]);

  const exams=useMemo(()=>[ALL,...Array.from(new Set(rows.map(r=>r.vestibular)))],[rows]);
  const years=useMemo(()=>[ALL,...Array.from(new Set(rows.map(r=>String(r.year)))).sort((a,b)=>Number(b)-Number(a))],[rows]);
  const areas=useMemo(()=>[ALL,...Array.from(new Set(rows.map(r=>r.area).filter(Boolean) as string[])).sort()],[rows]);
  const filtered=useMemo(()=>rows.filter(r=>{
    if(exam!==ALL&&r.vestibular!==exam)return false;
    if(year!==ALL&&String(r.year)!==year)return false;
    if(area!==ALL&&r.area!==area)return false;
    const q=search.trim().toLowerCase();
    if(!q)return true;
    return `${r.vestibular} ${r.institution} ${r.year} ${r.question_number} ${r.area??''} ${r.subject??''} ${r.skill_name??''}`.toLowerCase().includes(q);
  }),[rows,exam,year,area,search]);

  const exactCount=rows.filter(r=>r.source_kind==='official').length;
  const examsCount=new Set(rows.map(r=>r.vestibular)).size;

  if(loading)return <section className="plan6-card span12"><div style={{display:'flex',alignItems:'center',gap:10}}><Loader2 className="animate-spin" size={18}/><strong>Carregando questões oficiais...</strong></div></section>;
  if(error)return <section className="plan6-card span12"><strong>{error}</strong></section>;

  return <section className="plan6-card span12">
    <div className="plan6-sectionlabel"><ShieldCheck size={14} style={{display:'inline',marginRight:6}}/>Área especial · vestibulares oficiais</div>
    <h2>{exactCount} questões oficiais indexadas</h2>
    <p>Banco separado por vestibular, ano e área. Só entram aqui itens com procedência oficial; questões autorais ou adaptadas ficam fora desta área.</p>
    <div className="plan6-strengths" style={{marginTop:12}}>
      <span className="plan6-chip active">{examsCount} vestibulares/fontes</span>
      <span className="plan6-chip active">{new Set(rows.map(r=>r.year)).size} edições</span>
      <span className="plan6-chip active">fonte e gabarito rastreados</span>
    </div>

    <div className="plan6-qfilters" style={{marginTop:18}}>
      <select className="plan6-chip" value={exam} onChange={e=>setExam(e.target.value)}>{exams.map(v=><option key={v}>{v}</option>)}</select>
      <select className="plan6-chip" value={year} onChange={e=>setYear(e.target.value)}>{years.map(v=><option key={v}>{v}</option>)}</select>
      <select className="plan6-chip" value={area} onChange={e=>setArea(e.target.value)}>{areas.map(v=><option key={v}>{v}</option>)}</select>
      <label className="plan6-chip" style={{display:'flex',alignItems:'center',gap:7}}><Search size={14}/><input aria-label="Buscar questão oficial" value={search} onChange={e=>setSearch(e.target.value)} placeholder="nº, área ou vestibular" style={{border:0,outline:'none',background:'transparent',minWidth:170}}/></label>
    </div>

    <div style={{margin:'14px 0 10px',fontSize:14}}><b>{filtered.length}</b> questões neste filtro.</div>
    <div className="plan6-qgrid">
      {filtered.map(q=><article className="plan6-qitem" key={q.question_id} style={{cursor:'default'}}>
        <div className="plan6-qtop"><span>{q.vestibular} · {q.year}</span><span>Questão {q.question_number}</span></div>
        <strong>{q.area||q.subject||'Questão oficial'}</strong>
        <p>{q.prompt_text?`${q.prompt_text.slice(0,220)}${q.prompt_text.length>220?'…':''}`:'Enunciado integral disponível no caderno oficial. O banco mantém aqui a referência verificada para evitar republicar ou alterar o texto da prova.'}</p>
        <div className="plan6-actions" style={{marginTop:10}}>
          {(q.source_pdf_url||q.source_url)&&<a className="plan6-btn primary" href={q.source_pdf_url||q.source_url||'#'} target="_blank" rel="noreferrer"><BookOpenCheck size={14}/>Abrir prova oficial</a>}
          {q.answer_key_url&&<a className="plan6-btn" href={q.answer_key_url} target="_blank" rel="noreferrer"><ExternalLink size={14}/>Gabarito oficial</a>}
        </div>
        {q.correct_option&&<div className="plan6-statmeta" style={{marginTop:9}}>Gabarito verificado: <b>{q.correct_option}</b></div>}
      </article>)}
    </div>
  </section>;
}
