import { useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, ExternalLink, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Edition={id:string;series_id:string;year:number;application:string;application_label:string|null;source_url:string|null};
type Booklet={id:string;edition_id:string;day:number|null;booklet_code:string|null;color:string|null;format:string;question_start:number|null;question_end:number|null;source_pdf_url:string|null;answer_key_url:string|null};
type Mapping={id:string;question_number:number;correct_option:string|null;answer_status:string;foreign_language:string|null;official_exam_items:{area:string|null;subject:string|null;skill_name:string|null;prompt_text:string|null;explanation:string|null;image_url:string|null;source_url:string|null}|null};

export default function OfficialExamReview(){
  const[editions,setEditions]=useState<Edition[]>([]);
  const[booklets,setBooklets]=useState<Booklet[]>([]);
  const[year,setYear]=useState(2025);
  const[editionId,setEditionId]=useState('');
  const[bookletId,setBookletId]=useState('');
  const[number,setNumber]=useState(1);
  const[result,setResult]=useState<Mapping|null>(null);
  const[loading,setLoading]=useState(false);

  useEffect(()=>{(async()=>{if(!supabase)return;const{data}=await supabase.from('official_exam_editions').select('id,series_id,year,application,application_label,source_url').eq('series_id','enem').order('year',{ascending:false});const rows=(data??[]) as Edition[];setEditions(rows);const first=rows.find(r=>r.year===2025)??rows[0];if(first){setYear(first.year);setEditionId(first.id)}})()},[]);

  useEffect(()=>{const selected=editions.filter(e=>e.year===year);if(selected.length&&!selected.some(e=>e.id===editionId))setEditionId(selected[0].id)},[year,editions,editionId]);
  useEffect(()=>{(async()=>{if(!supabase||!editionId){setBooklets([]);return}const{data}=await supabase.from('official_exam_booklets').select('id,edition_id,day,booklet_code,color,format,question_start,question_end,source_pdf_url,answer_key_url').eq('edition_id',editionId).order('day').order('booklet_code');const rows=(data??[]) as Booklet[];setBooklets(rows);setBookletId(rows[0]?.id??'');if(rows[0])setNumber(rows[0].question_start??1);setResult(null)})()},[editionId]);

  const yearOptions=useMemo(()=>Array.from(new Set(editions.map(e=>e.year))).sort((a,b)=>b-a),[editions]);
  const applications=useMemo(()=>editions.filter(e=>e.year===year),[editions,year]);
  const selectedBooklet=booklets.find(b=>b.id===bookletId);

  const findQuestion=async()=>{if(!supabase||!bookletId)return;setLoading(true);setResult(null);const{data}=await supabase.from('official_exam_item_booklet_map').select('id,question_number,correct_option,answer_status,foreign_language,official_exam_items(area,subject,skill_name,prompt_text,explanation,image_url,source_url)').eq('booklet_id',bookletId).eq('question_number',number).maybeSingle();setResult((data as unknown as Mapping)??null);setLoading(false)};

  return <section className="max-w-[1180px] mx-auto px-4 md:px-6 py-8 text-white font-['Plus_Jakarta_Sans']">
    <div className="rounded-[20px] border border-[#173765] bg-[#06152f] p-5 md:p-6">
      <div className="flex items-center gap-2 text-xs font-extrabold text-[#72a5ff]"><BookOpenCheck size={16}/>Correção de simulado oficial</div>
      <h2 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-[-.04em]">Qual prova você fez?</h2>
      <p className="mt-2 text-sm text-[#9fb5d4]">Escolha ano, aplicação, dia/cor e número da questão. O banco identifica o item correto mesmo quando a numeração muda entre cadernos.</p>
      <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-3">
        <label className="text-xs text-[#b8cae4]">Ano<select className="mt-1 w-full rounded-xl border border-[#234576] bg-[#081a38] p-3 text-white" value={year} onChange={e=>setYear(Number(e.target.value))}>{yearOptions.map(y=><option key={y}>{y}</option>)}</select></label>
        <label className="text-xs text-[#b8cae4]">Aplicação<select className="mt-1 w-full rounded-xl border border-[#234576] bg-[#081a38] p-3 text-white" value={editionId} onChange={e=>setEditionId(e.target.value)}>{applications.map(e=><option key={e.id} value={e.id}>{e.application_label||e.application}</option>)}</select></label>
        <label className="text-xs text-[#b8cae4]">Caderno / cor<select className="mt-1 w-full rounded-xl border border-[#234576] bg-[#081a38] p-3 text-white" value={bookletId} onChange={e=>{const id=e.target.value;setBookletId(id);const b=booklets.find(x=>x.id===id);if(b)setNumber(b.question_start??1);setResult(null)}}>{booklets.length?booklets.map(b=><option key={b.id} value={b.id}>Dia {b.day} · Caderno {b.booklet_code} · {b.color}</option>):<option value="">Caderno ainda em catalogação</option>}</select></label>
        <label className="text-xs text-[#b8cae4]">Questão<input className="mt-1 w-full rounded-xl border border-[#234576] bg-[#081a38] p-3 text-white" type="number" min={selectedBooklet?.question_start??1} max={selectedBooklet?.question_end??180} value={number} onChange={e=>setNumber(Number(e.target.value))}/></label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={findQuestion} disabled={!bookletId||loading} className="inline-flex items-center gap-2 rounded-xl bg-[#246cff] px-4 py-3 text-sm font-extrabold disabled:opacity-40"><Search size={16}/>{loading?'Buscando…':'Identificar questão'}</button>{selectedBooklet?.source_pdf_url&&<a className="inline-flex items-center gap-2 rounded-xl border border-[#234576] bg-[#081a38] px-4 py-3 text-sm font-bold" href={selectedBooklet.source_pdf_url} target="_blank" rel="noreferrer">Abrir prova oficial <ExternalLink size={15}/></a>}{selectedBooklet?.answer_key_url&&<a className="inline-flex items-center gap-2 rounded-xl border border-[#234576] bg-[#081a38] px-4 py-3 text-sm font-bold" href={selectedBooklet.answer_key_url} target="_blank" rel="noreferrer">Gabarito oficial <ExternalLink size={15}/></a>}</div>
      {result&&<div className="mt-5 rounded-2xl border border-[#234576] bg-[#081a38] p-4"><div className="text-xs font-extrabold text-[#72a5ff]">Questão {result.question_number} · {result.official_exam_items?.area||'Área em classificação'}</div>{result.official_exam_items?.prompt_text&&<p className="mt-3 leading-relaxed">{result.official_exam_items.prompt_text}</p>}<div className="mt-3 text-sm"><b>Gabarito:</b> {result.answer_status==='annulled'?'Anulada':result.correct_option||'em validação'}</div>{result.official_exam_items?.skill_name&&<div className="mt-1 text-sm"><b>Habilidade:</b> {result.official_exam_items.skill_name}</div>}{result.official_exam_items?.explanation&&<div className="mt-3 rounded-xl bg-[#0b2856] p-3 text-sm text-[#d9e6f7]"><b>Explicação:</b> {result.official_exam_items.explanation}</div>}</div>}
      {!result&&bookletId&&<p className="mt-4 text-xs text-[#839ab9]">Se uma questão ainda não estiver indexada, a prova e o gabarito oficiais continuam disponíveis nos botões acima enquanto o catálogo detalhado é preenchido.</p>}
    </div>
  </section>;
}
