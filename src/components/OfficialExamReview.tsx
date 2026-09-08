import { useEffect, useMemo, useState } from 'react';
import { BookOpenCheck, CheckCircle2, ExternalLink, Search, Sparkles, Video, ListChecks, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Edition={id:string;series_id:string;year:number;application:string;application_label:string|null;source_url:string|null};
type Booklet={id:string;edition_id:string;day:number|null;booklet_code:string|null;color:string|null;format:string;question_start:number|null;question_end:number|null;source_pdf_url:string|null;answer_key_url:string|null};
type OfficialItem={id:string;area:string|null;subject:string|null;skill_code:string|null;skill_name:string|null;prompt_text:string|null;explanation:string|null;image_url:string|null;source_url:string|null};
type Mapping={id:string;item_id?:string;question_number:number;correct_option:string|null;answer_status:string;foreign_language:string|null;official_exam_items:OfficialItem|null};
type Practice={id:number;area:string;skill_name:string;prompt:string;correct_option:string|null;explanation:string|null};
type SkillGroup={key:string;area:string;subject:string;skill:string;count:number;numbers:number[];videoUrl:string;practice:Practice[]};

const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const youtube=(area:string,subject:string,skill:string)=>`https://www.youtube.com/results?search_query=${encodeURIComponent(`${subject||area} ${skill} ENEM aula exercícios`)}`;

function parseQuestionNumbers(raw:string,min:number,max:number){
  const out=new Set<number>();
  raw.split(/[;,\s]+/).filter(Boolean).forEach(token=>{
    const range=token.match(/^(\d+)-(\d+)$/);
    if(range){const a=Number(range[1]),b=Number(range[2]);for(let n=Math.min(a,b);n<=Math.max(a,b)&&out.size<180;n++)if(n>=min&&n<=max)out.add(n);return}
    const n=Number(token.replace(/\D/g,''));if(Number.isFinite(n)&&n>=min&&n<=max)out.add(n);
  });
  return [...out].sort((a,b)=>a-b);
}

export default function OfficialExamReview(){
  const[editions,setEditions]=useState<Edition[]>([]);
  const[booklets,setBooklets]=useState<Booklet[]>([]);
  const[year,setYear]=useState(2025);
  const[editionId,setEditionId]=useState('');
  const[bookletId,setBookletId]=useState('');
  const[number,setNumber]=useState(1);
  const[result,setResult]=useState<Mapping|null>(null);
  const[loading,setLoading]=useState(false);
  const[wrongRaw,setWrongRaw]=useState('');
  const[batchLoading,setBatchLoading]=useState(false);
  const[batchRows,setBatchRows]=useState<Mapping[]>([]);
  const[missingNumbers,setMissingNumbers]=useState<number[]>([]);
  const[skillGroups,setSkillGroups]=useState<SkillGroup[]>([]);
  const[batchMessage,setBatchMessage]=useState('');

  useEffect(()=>{(async()=>{if(!supabase)return;const{data}=await supabase.from('official_exam_editions').select('id,series_id,year,application,application_label,source_url').eq('series_id','enem').order('year',{ascending:false});const rows=(data??[]) as Edition[];setEditions(rows);const first=rows.find(r=>r.year===2025)??rows[0];if(first){setYear(first.year);setEditionId(first.id)}})()},[]);

  useEffect(()=>{const selected=editions.filter(e=>e.year===year);if(selected.length&&!selected.some(e=>e.id===editionId))setEditionId(selected[0].id)},[year,editions,editionId]);
  useEffect(()=>{(async()=>{if(!supabase||!editionId){setBooklets([]);return}const{data}=await supabase.from('official_exam_booklets').select('id,edition_id,day,booklet_code,color,format,question_start,question_end,source_pdf_url,answer_key_url').eq('edition_id',editionId).order('day').order('booklet_code');const rows=(data??[]) as Booklet[];setBooklets(rows);setBookletId(rows[0]?.id??'');if(rows[0])setNumber(rows[0].question_start??1);setResult(null);setBatchRows([]);setSkillGroups([]);setMissingNumbers([]);setBatchMessage('')})()},[editionId]);

  const yearOptions=useMemo(()=>Array.from(new Set(editions.map(e=>e.year))).sort((a,b)=>b-a),[editions]);
  const applications=useMemo(()=>editions.filter(e=>e.year===year),[editions,year]);
  const selectedBooklet=booklets.find(b=>b.id===bookletId);
  const minQ=selectedBooklet?.question_start??1,maxQ=selectedBooklet?.question_end??180;
  const parsedWrong=useMemo(()=>parseQuestionNumbers(wrongRaw,minQ,maxQ),[wrongRaw,minQ,maxQ]);

  const findQuestion=async()=>{if(!supabase||!bookletId)return;setLoading(true);setResult(null);const{data}=await supabase.from('official_exam_item_booklet_map').select('id,item_id,question_number,correct_option,answer_status,foreign_language,official_exam_items(id,area,subject,skill_code,skill_name,prompt_text,explanation,image_url,source_url)').eq('booklet_id',bookletId).eq('question_number',number).maybeSingle();setResult((data as unknown as Mapping)??null);setLoading(false)};

  const analyzeWrongBatch=async()=>{
    if(!supabase||!bookletId||!parsedWrong.length)return;
    setBatchLoading(true);setBatchMessage('');setBatchRows([]);setSkillGroups([]);setMissingNumbers([]);
    try{
      const{data:userData}=await supabase.auth.getUser();if(!userData.user)throw new Error('auth');
      const{data,error}=await supabase.from('official_exam_item_booklet_map').select('id,item_id,question_number,correct_option,answer_status,foreign_language,official_exam_items(id,area,subject,skill_code,skill_name,prompt_text,explanation,image_url,source_url)').eq('booklet_id',bookletId).in('question_number',parsedWrong);
      if(error)throw error;
      const rows=((data??[]) as unknown as Mapping[]).sort((a,b)=>a.question_number-b.question_number);
      const found=new Set(rows.map(r=>r.question_number));
      const missing=parsedWrong.filter(n=>!found.has(n));
      setBatchRows(rows);setMissingNumbers(missing);
      if(!rows.length){setBatchMessage('Essas questões ainda não estão indexadas individualmente no catálogo. O caderno está cadastrado, mas os itens oficiais ainda estão sendo importados.');return}

      const reports=rows.map(r=>({user_id:userData.user!.id,booklet_id:bookletId,item_id:r.official_exam_items?.id??null,question_number:r.question_number,area:r.official_exam_items?.area??null,subject:r.official_exam_items?.subject??null,skill_code:r.official_exam_items?.skill_code??null,skill_name:r.official_exam_items?.skill_name??null,error_type:'simulado_oficial'}));
      await supabase.from('official_exam_error_reports').upsert(reports,{onConflict:'user_id,booklet_id,question_number'});

      const diagnosable=rows.filter(r=>r.official_exam_items?.skill_name||r.official_exam_items?.area);
      if(diagnosable.length){
        await supabase.from('student_skill_diagnostics').insert(diagnosable.map(r=>({
          user_id:userData.user!.id,exam_id:'enem',skill_code:r.official_exam_items?.skill_code??null,area:r.official_exam_items?.area??'ENEM',question_text:`ENEM ${year} · caderno ${selectedBooklet?.booklet_code??''} ${selectedBooklet?.color??''} · questão ${r.question_number}`,correct:false,confidence:1,error_type:'simulado_oficial',error_detail:'Questão informada pelo aluno como errada em simulado oficial',diagnosis:{source:'official_exam_batch',year,booklet_id:bookletId,booklet_code:selectedBooklet?.booklet_code,color:selectedBooklet?.color,question_number:r.question_number,skill_name:r.official_exam_items?.skill_name,subject:r.official_exam_items?.subject,area:r.official_exam_items?.area}
        })));
      }

      const grouped=new Map<string,{area:string;subject:string;skill:string;count:number;numbers:number[]}>();
      rows.forEach(r=>{const item=r.official_exam_items;const area=item?.area||'ENEM';const subject=item?.subject||area;const skill=item?.skill_name||subject;const key=`${normalize(area)}|${normalize(subject)}|${normalize(skill)}`;const g=grouped.get(key)??{area,subject,skill,count:0,numbers:[]};g.count++;g.numbers.push(r.question_number);grouped.set(key,g)});
      const bases=[...grouped.entries()].sort((a,b)=>b[1].count-a[1].count);
      const areas=[...new Set(bases.map(([,g])=>g.area))];
      let practice:Practice[]=[];
      if(areas.length){const{data:p}=await supabase.from('exam_practice_questions').select('id,area,skill_name,prompt,correct_option,explanation').eq('exam_id','enem').eq('active',true).in('area',areas).limit(120);practice=(p??[]) as Practice[]}
      const groups:SkillGroup[]=bases.map(([key,g])=>{
        const exact=practice.filter(p=>normalize(p.skill_name||'').includes(normalize(g.skill))||normalize(g.skill).includes(normalize(p.skill_name||'')));
        const sameArea=practice.filter(p=>normalize(p.area)===normalize(g.area)&&!exact.some(e=>e.id===p.id));
        return{key,...g,videoUrl:youtube(g.area,g.subject,g.skill),practice:[...exact,...sameArea].slice(0,5)};
      });
      setSkillGroups(groups);
      window.dispatchEvent(new CustomEvent('conectae:diagnostic-saved'));
      setBatchMessage(`${rows.length} erro${rows.length===1?'':'s'} identificado${rows.length===1?'':'s'} e enviado${rows.length===1?'':'s'} para o seu Plano. ${missing.length?`${missing.length} questão(ões) ainda aguardam indexação.`:''}`);
    }catch{setBatchMessage('Não foi possível analisar o lote agora. Tente novamente.')}finally{setBatchLoading(false)}
  };

  return <section className="max-w-[1180px] mx-auto px-4 md:px-6 py-8 text-white font-['Plus_Jakarta_Sans']">
    <div className="rounded-[20px] border border-[#173765] bg-[#06152f] p-5 md:p-6">
      <div className="flex items-center gap-2 text-xs font-extrabold text-[#72a5ff]"><BookOpenCheck size={16}/>Correção de simulado oficial</div>
      <h2 className="mt-2 text-2xl md:text-3xl font-extrabold tracking-[-.04em]">Qual prova você fez?</h2>
      <p className="mt-2 text-sm text-[#9fb5d4]">Escolha ano, aplicação e caderno/cor. Você pode localizar uma questão ou informar todas as que errou de uma vez.</p>
      <div className="mt-5 grid grid-cols-1 md:grid-cols-4 gap-3">
        <label className="text-xs text-[#b8cae4]">Ano<select className="mt-1 w-full rounded-xl border border-[#234576] bg-[#081a38] p-3 text-white" value={year} onChange={e=>setYear(Number(e.target.value))}>{yearOptions.map(y=><option key={y}>{y}</option>)}</select></label>
        <label className="text-xs text-[#b8cae4]">Aplicação<select className="mt-1 w-full rounded-xl border border-[#234576] bg-[#081a38] p-3 text-white" value={editionId} onChange={e=>setEditionId(e.target.value)}>{applications.map(e=><option key={e.id} value={e.id}>{e.application_label||e.application}</option>)}</select></label>
        <label className="text-xs text-[#b8cae4]">Caderno / cor<select className="mt-1 w-full rounded-xl border border-[#234576] bg-[#081a38] p-3 text-white" value={bookletId} onChange={e=>{const id=e.target.value;setBookletId(id);const b=booklets.find(x=>x.id===id);if(b)setNumber(b.question_start??1);setResult(null);setBatchRows([]);setSkillGroups([]);setBatchMessage('')}}>{booklets.length?booklets.map(b=><option key={b.id} value={b.id}>Dia {b.day} · Caderno {b.booklet_code} · {b.color}</option>):<option value="">Caderno ainda em catalogação</option>}</select></label>
        <label className="text-xs text-[#b8cae4]">Questão individual<input className="mt-1 w-full rounded-xl border border-[#234576] bg-[#081a38] p-3 text-white" type="number" min={minQ} max={maxQ} value={number} onChange={e=>setNumber(Number(e.target.value))}/></label>
      </div>
      <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={findQuestion} disabled={!bookletId||loading} className="inline-flex items-center gap-2 rounded-xl bg-[#246cff] px-4 py-3 text-sm font-extrabold disabled:opacity-40"><Search size={16}/>{loading?'Buscando…':'Identificar questão'}</button>{selectedBooklet?.source_pdf_url&&<a className="inline-flex items-center gap-2 rounded-xl border border-[#234576] bg-[#081a38] px-4 py-3 text-sm font-bold" href={selectedBooklet.source_pdf_url} target="_blank" rel="noreferrer">Abrir prova oficial <ExternalLink size={15}/></a>}{selectedBooklet?.answer_key_url&&<a className="inline-flex items-center gap-2 rounded-xl border border-[#234576] bg-[#081a38] px-4 py-3 text-sm font-bold" href={selectedBooklet.answer_key_url} target="_blank" rel="noreferrer">Gabarito oficial <ExternalLink size={15}/></a>}</div>
      {result&&<div className="mt-5 rounded-2xl border border-[#234576] bg-[#081a38] p-4"><div className="text-xs font-extrabold text-[#72a5ff]">Questão {result.question_number} · {result.official_exam_items?.area||'Área em classificação'}</div>{result.official_exam_items?.prompt_text&&<p className="mt-3 leading-relaxed">{result.official_exam_items.prompt_text}</p>}<div className="mt-3 text-sm"><b>Gabarito:</b> {result.answer_status==='annulled'?'Anulada':result.correct_option||'em validação'}</div>{result.official_exam_items?.skill_name&&<div className="mt-1 text-sm"><b>Habilidade:</b> {result.official_exam_items.skill_name}</div>}{result.official_exam_items?.explanation&&<div className="mt-3 rounded-xl bg-[#0b2856] p-3 text-sm text-[#d9e6f7]"><b>Explicação:</b> {result.official_exam_items.explanation}</div>}</div>}

      <div className="mt-8 border-t border-[#173765] pt-6">
        <div className="flex items-center gap-2 text-xs font-extrabold text-[#72a5ff]"><ListChecks size={16}/>Erros em lote</div>
        <h3 className="mt-2 text-xl md:text-2xl font-extrabold tracking-[-.03em]">Cole todas as questões que você errou.</h3>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#9fb5d4]">Exemplo: <b className="text-white">12, 37, 84, 102, 146</b>. Também aceita intervalos como <b className="text-white">90-95</b>. O Conectaê cruza cada número com a cor do seu caderno, agrupa os erros por habilidade e cria recuperação específica.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
          <textarea value={wrongRaw} onChange={e=>setWrongRaw(e.target.value)} placeholder="12, 37, 84, 102, 146" className="min-h-[92px] w-full resize-y rounded-xl border border-[#234576] bg-[#081a38] p-3 text-sm text-white outline-none focus:border-[#4b8cff]"/>
          <button type="button" onClick={analyzeWrongBatch} disabled={!bookletId||!parsedWrong.length||batchLoading} className="inline-flex min-h-[52px] items-center justify-center gap-2 self-end rounded-xl bg-[#246cff] px-5 py-3 text-sm font-extrabold disabled:opacity-40"><Sparkles size={16}/>{batchLoading?'Analisando…':`Analisar ${parsedWrong.length||''} erros`}</button>
        </div>
        {parsedWrong.length>0&&<p className="mt-2 text-xs text-[#839ab9]">Questões reconhecidas na entrada: {parsedWrong.join(', ')}</p>}
        {batchMessage&&<div className={`mt-4 flex gap-2 rounded-xl border p-3 text-sm ${batchRows.length?'border-[#255b79] bg-[#09283a] text-[#d9efff]':'border-[#6b4b35] bg-[#281e18] text-[#f0d6c1]'}`}>{batchRows.length?<CheckCircle2 size={17} className="shrink-0"/>:<AlertCircle size={17} className="shrink-0"/>}<span>{batchMessage}</span></div>}
        {missingNumbers.length>0&&<div className="mt-3 text-xs text-[#e4b98f]">Ainda não indexadas neste caderno: {missingNumbers.join(', ')}</div>}

        {skillGroups.length>0&&<div className="mt-6 space-y-4">
          <div><div className="text-xs font-extrabold uppercase tracking-[.08em] text-[#72a5ff]">Diagnóstico do simulado</div><h3 className="mt-1 text-xl font-extrabold">O que você precisa atacar primeiro</h3></div>
          {skillGroups.map((g,i)=><article key={g.key} className="rounded-2xl border border-[#234576] bg-[#081a38] p-4 md:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="text-[11px] font-extrabold uppercase tracking-[.06em] text-[#72a5ff]">Prioridade {i+1} · {g.count} erro{g.count===1?'':'s'}</div><h4 className="mt-1 text-lg font-extrabold">{g.skill}</h4><p className="mt-1 text-xs text-[#9fb5d4]">{g.subject} · {g.area} · questões {g.numbers.join(', ')}</p></div><a href={g.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-[#315a91] bg-[#0b2856] px-3 py-2 text-xs font-extrabold"><Video size={15}/>Vídeos para esta habilidade</a></div>
            <div className="mt-4 rounded-xl bg-[#071a38] p-3"><b className="text-sm">Plano de recuperação</b><p className="mt-1 text-xs leading-relaxed text-[#b8cae4]">Revisar o conceito-base de <b className="text-white">{g.skill}</b>, assistir a uma aula dirigida, resolver pelo menos {Math.max(12,g.count*6)} questões semelhantes e refazer as questões do simulado sem consultar o gabarito.</p></div>
            {g.practice.length>0?<div className="mt-4"><div className="text-xs font-extrabold text-[#8bb8ff]">Questões semelhantes do banco</div><div className="mt-2 grid gap-2">{g.practice.map(p=><details key={p.id} className="rounded-xl border border-[#1d416f] bg-[#06152f] p-3"><summary className="cursor-pointer text-sm font-bold">{p.area} · {p.skill_name}</summary><p className="mt-2 text-sm leading-relaxed text-[#d7e3f3]">{p.prompt}</p>{p.explanation&&<p className="mt-2 text-xs leading-relaxed text-[#9fb5d4]"><b>Correção:</b> {p.explanation}</p>}</details>)}</div></div>:<p className="mt-4 text-xs text-[#839ab9]">O banco ainda está buscando questões autorais equivalentes para esta habilidade.</p>}
          </article>)}
          <div className="rounded-xl border border-[#235c49] bg-[#082b29] p-4 text-sm text-[#d9f8e9]"><b>Plano atualizado:</b> essas dificuldades foram registradas como EXTRAS e entram na priorização do seu cronograma semanal.</div>
        </div>}
      </div>
    </div>
  </section>;
}
