import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  FileText,
  GraduationCap,
  ListChecks,
  RotateCcw,
  Target,
} from 'lucide-react';
import {
  COMPONENT_ORDER,
  STAGE_META,
  UFMG_CURRICULUM,
  UFMG_NORTEADOR_URL,
  UFMG_YEAR_QUESTIONS,
  type SeriadoArea,
  type SeriadoStage,
} from '@/lib/ufmg-seriado-curriculum';
import { UFMG_OFFICIAL_2025, UFMG_REQUIRED_WORKS } from '@/lib/ufmg-seriado-data';

type AnswerState = Record<string, number>;
type CorrectedState = Record<string, boolean>;
type BankTab = 'oficiais' | 'conteudo' | 'autorais';
type AreaDistribution = { area: SeriadoArea; count: number };

const official2026Url='https://backend.copeve.ufmg.br/uploads/Seriado_2026_Edital_6ac08b0f67.html';
const officialPortal='https://www.ufmg.br/seriadoufmg/';
const cyclePage='https://www.ufmg.br/seriadoufmg/ciclo-2025-2027/';

const stageDistribution:Partial<Record<SeriadoStage,AreaDistribution[]>>={
  etapa1:[
    {area:'Linguagens',count:14},{area:'Matemática',count:9},{area:'Natureza',count:12},{area:'Humanas',count:10},
  ],
  etapa2:[
    {area:'Linguagens',count:14},{area:'Matemática',count:7},{area:'Natureza',count:12},{area:'Humanas',count:12},
  ],
};

const areaStyle:Record<SeriadoArea,string>={
  Linguagens:'border-violet-300/25 bg-violet-300/[.08] text-violet-100',
  Matemática:'border-cyan-300/25 bg-cyan-300/[.08] text-cyan-100',
  Natureza:'border-emerald-300/25 bg-emerald-300/[.08] text-emerald-100',
  Humanas:'border-amber-300/25 bg-amber-300/[.08] text-amber-100',
};

function readJson<T>(key:string,fallback:T):T{
  try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw) as T:fallback}catch{return fallback}
}
function writeJson(key:string,value:unknown){try{localStorage.setItem(key,JSON.stringify(value))}catch{/* noop */}}
function officialArea(question:number):SeriadoArea{
  if(question<=14)return 'Linguagens';
  if(question<=23)return 'Matemática';
  if(question<=35)return 'Natureza';
  return 'Humanas';
}

export default function UFMGCourseArea({onBack}:{onBack:()=>void}){
  const [stage,setStage]=useState<SeriadoStage>(()=>readJson<SeriadoStage>('conectae:ufmg-course-stage','etapa1'));
  const [tab,setTab]=useState<BankTab>('oficiais');
  const [area,setArea]=useState<'Todas'|SeriadoArea>('Todas');
  const [component,setComponent]=useState<string>('Todos');
  const [answers,setAnswers]=useState<AnswerState>(()=>readJson<AnswerState>('conectae:ufmg-year-answers',{}));
  const [corrected,setCorrected]=useState<CorrectedState>(()=>readJson<CorrectedState>('conectae:ufmg-year-corrected',{}));
  const [showAllTopics,setShowAllTopics]=useState(false);
  const [officialAnswers,setOfficialAnswers]=useState<Record<number,string>>(()=>readJson<Record<number,string>>('conectae:ufmg-official-2025-answers',{}));
  const [officialCorrected,setOfficialCorrected]=useState(false);

  const stageCurriculum=useMemo(()=>UFMG_CURRICULUM.filter(item=>item.stage===stage),[stage]);
  const availableComponents=useMemo(()=>COMPONENT_ORDER.filter(name=>stageCurriculum.some(item=>item.component===name)),[stageCurriculum]);
  const visibleCurriculum=useMemo(()=>stageCurriculum.filter(item=>(area==='Todas'||item.area===area)&&(component==='Todos'||item.component===component)),[stageCurriculum,area,component]);
  const visibleQuestions=useMemo(()=>UFMG_YEAR_QUESTIONS.filter(question=>question.stage===stage&&(area==='Todas'||question.area===area)&&(component==='Todos'||question.component===component)),[stage,area,component]);
  const stageQuestions=useMemo(()=>UFMG_YEAR_QUESTIONS.filter(question=>question.stage===stage),[stage]);
  const answeredCount=stageQuestions.filter(question=>answers[question.id]!==undefined).length;
  const correctedCount=stageQuestions.filter(question=>corrected[question.id]).length;
  const correctCount=stageQuestions.filter(question=>corrected[question.id]&&answers[question.id]===question.answer).length;
  const distribution=stageDistribution[stage];
  const stageWorks=stage==='etapa1'?UFMG_REQUIRED_WORKS.etapa1:stage==='etapa2'?UFMG_REQUIRED_WORKS.etapa2:[];
  const officialScore=UFMG_OFFICIAL_2025.finalKey.reduce((sum,key,index)=>sum+(officialAnswers[index+1]===key?1:0),0);
  const officialAnswered=Object.keys(officialAnswers).length;
  const officialByArea=useMemo(()=>{
    const result:Record<SeriadoArea,{correct:number;total:number}>={
      Linguagens:{correct:0,total:14},Matemática:{correct:0,total:9},Natureza:{correct:0,total:12},Humanas:{correct:0,total:10},
    };
    UFMG_OFFICIAL_2025.finalKey.forEach((key,index)=>{const q=index+1;const a=officialArea(q);if(officialAnswers[q]===key)result[a].correct+=1});
    return result;
  },[officialAnswers]);

  const chooseStage=(next:SeriadoStage)=>{
    setStage(next);setArea('Todas');setComponent('Todos');setShowAllTopics(false);setOfficialCorrected(false);
    setTab(next==='etapa1'?'oficiais':'conteudo');
    writeJson('conectae:ufmg-course-stage',next);window.scrollTo({top:0,behavior:'smooth'});
  };
  const selectAnswer=(id:string,value:number)=>{
    const next={...answers,[id]:value};setAnswers(next);writeJson('conectae:ufmg-year-answers',next);
    if(corrected[id]){const nextCorrected={...corrected,[id]:false};setCorrected(nextCorrected);writeJson('conectae:ufmg-year-corrected',nextCorrected)}
  };
  const correctQuestion=(id:string)=>{const next={...corrected,[id]:true};setCorrected(next);writeJson('conectae:ufmg-year-corrected',next)};
  const resetStage=()=>{
    const ids=new Set(stageQuestions.map(question=>question.id));
    const nextAnswers=Object.fromEntries(Object.entries(answers).filter(([id])=>!ids.has(id)));
    const nextCorrected=Object.fromEntries(Object.entries(corrected).filter(([id])=>!ids.has(id)));
    setAnswers(nextAnswers);setCorrected(nextCorrected);writeJson('conectae:ufmg-year-answers',nextAnswers);writeJson('conectae:ufmg-year-corrected',nextCorrected);
  };
  const chooseOfficial=(question:number,letter:string)=>{
    const next={...officialAnswers,[question]:letter};setOfficialAnswers(next);writeJson('conectae:ufmg-official-2025-answers',next);setOfficialCorrected(false);
  };
  const resetOfficial=()=>{setOfficialAnswers({});setOfficialCorrected(false);writeJson('conectae:ufmg-official-2025-answers',{})};

  return <div className="min-h-screen bg-[#020817] text-white font-['Plus_Jakarta_Sans']">
    <header className="sticky top-0 z-40 border-b border-[#173765] bg-[#020817]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3 px-4 py-3 md:px-6">
        <button onClick={onBack} className="inline-flex items-center gap-2 rounded-xl border border-[#234576] bg-[#071a38] px-3 py-2 text-xs font-extrabold text-[#d1deef] hover:border-[#72a5ff]"><ArrowLeft size={16}/>Voltar ao Curso</button>
        <div className="min-w-0 text-center"><div className="text-[10px] font-black uppercase tracking-[.16em] text-[#72a5ff]">Área separada do Curso</div><div className="truncate text-base font-black">Seriado UFMG</div></div>
        <a href={officialPortal} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-[#246cff] px-3 py-2 text-xs font-black">UFMG <ExternalLink size={14}/></a>
      </div>
      <div className="mx-auto flex max-w-[1180px] gap-2 overflow-x-auto px-4 pb-2 md:px-6">
        {(['etapa1','etapa2','etapa3'] as SeriadoStage[]).map(id=><button key={id} onClick={()=>chooseStage(id)} className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-black transition ${stage===id?'bg-[#246cff] text-white':'border border-[#173765] bg-[#06152f] text-[#9fb5d4]'}`}>{STAGE_META[id].label}</button>)}
      </div>
      <div className="mx-auto flex max-w-[1180px] gap-2 overflow-x-auto px-4 pb-3 md:px-6">
        {([
          ['oficiais','Questões oficiais',FileCheck2],
          ['conteudo','Conteúdo do ano',BookOpen],
          ['autorais','Questões autorais',ListChecks],
        ] as const).map(([id,label,Icon])=><button key={id} onClick={()=>setTab(id)} className={`inline-flex whitespace-nowrap items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black ${tab===id?'bg-white text-[#020817]':'border border-[#173765] bg-[#06152f] text-[#9fb5d4]'}`}><Icon size={14}/>{label}</button>)}
      </div>
    </header>

    <main className="mx-auto w-full max-w-[1180px] space-y-6 px-4 pb-24 pt-6 md:px-6 md:pb-12 md:pt-9">
      <section className="overflow-hidden rounded-[28px] border border-[#173765] bg-[radial-gradient(circle_at_85%_0%,rgba(36,108,255,.23),transparent_32%),linear-gradient(145deg,#081a38,#06152f)] p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#31588e] bg-[#0b2856] px-3 py-1.5 text-xs font-black text-[#9fc0ff]"><GraduationCap size={15}/>{STAGE_META[stage].label}</div>
            <h1 className="mt-4 text-3xl font-black tracking-[-.045em] md:text-5xl">Seriado UFMG <span className="text-[#72a5ff]">{STAGE_META[stage].short}</span></h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#a9bddc] md:text-base">{STAGE_META[stage].note}</p>
            {stage==='etapa2'&&<p className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/[.07] p-3 text-xs font-bold leading-relaxed text-amber-100">A Etapa 2 é cumulativa: cobra conteúdos da 1ª e da 2ª séries, com maior ênfase nos conteúdos da 2ª série.</p>}
            {stage==='etapa3'&&<p className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/[.07] p-3 text-xs font-bold leading-relaxed text-amber-100">A Etapa 3 acumula as três séries. No 2º dia, a área das discursivas depende do curso de graduação escolhido.</p>}
          </div>
          <div className="rounded-2xl border border-[#234576] bg-[#041027]/85 p-5">
            <div className="text-[10px] font-black uppercase tracking-[.13em] text-[#7691b5]">Banco desta etapa</div>
            <div className="mt-2 text-2xl font-black">{stage==='etapa1'?'45 oficiais + autorais':'Autorais por componente'}</div>
            <p className="mt-2 text-xs leading-relaxed text-[#9fb5d4]">As oficiais ficam em uma aba própria e nunca são misturadas com as questões criadas pelo Conectaê.</p>
          </div>
        </div>
      </section>

      {tab==='oficiais'&&<>
        {stage==='etapa1'?<>
          <section className="rounded-[26px] border border-emerald-300/20 bg-emerald-300/[.06] p-5 md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div><div className="text-[10px] font-black uppercase tracking-[.14em] text-emerald-200">QUESTÕES OFICIAIS UFMG</div><h2 className="mt-1 text-3xl font-black">Prova real de 2025 • Etapa 1</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#b4c6df]">Este é o caderno oficial aplicado pela UFMG. Resolva no PDF e marque suas respostas ao lado; a correção usa o gabarito final oficial.</p></div>
              <div className="flex flex-wrap gap-2"><a href={UFMG_OFFICIAL_2025.examUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-black text-[#02120b]"><FileText size={15}/>Abrir caderno oficial</a><a href={UFMG_OFFICIAL_2025.finalKeyUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/30 bg-[#041027] px-4 py-2.5 text-xs font-black text-emerald-100"><FileCheck2 size={15}/>Gabarito final</a></div>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
            <div className="overflow-hidden rounded-[24px] border border-[#173765] bg-white">
              <div className="flex items-center justify-between bg-[#071a38] px-4 py-3 text-white"><div className="text-sm font-black">Caderno oficial UFMG 2025</div><div className="text-xs font-bold text-[#9fb5d4]">45 objetivas + 1 discursiva • 4h</div></div>
              <iframe title="Caderno oficial Seriado UFMG 2025" src={UFMG_OFFICIAL_2025.examUrl} className="h-[70vh] min-h-[620px] w-full bg-white"/>
            </div>

            <div className="space-y-4">
              <div className="rounded-[24px] border border-[#173765] bg-[#06152f] p-5">
                <div className="flex items-center justify-between"><div><div className="text-[10px] font-black uppercase tracking-[.13em] text-[#72a5ff]">Folha de respostas oficial</div><h3 className="mt-1 text-xl font-black">{officialAnswered}/45 marcadas</h3></div><button onClick={resetOfficial} className="rounded-xl border border-[#31588e] bg-[#041027] p-2 text-[#9fb5d4]" aria-label="Zerar respostas oficiais"><RotateCcw size={16}/></button></div>
                <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-9 xl:grid-cols-5 2xl:grid-cols-9">
                  {Array.from({length:45},(_,index)=>index+1).map(number=><div key={number} className="rounded-xl border border-[#173765] bg-[#041027] p-2 text-center"><div className="mb-1.5 text-[10px] font-black text-[#839ab9]">{number}</div><div className="flex justify-center gap-1">{['A','B','C','D'].map(letter=>{const selected=officialAnswers[number]===letter;const right=officialCorrected&&UFMG_OFFICIAL_2025.finalKey[number-1]===letter;const wrong=officialCorrected&&selected&&!right;return <button key={letter} onClick={()=>chooseOfficial(number,letter)} className={`grid h-6 w-6 place-items-center rounded-md text-[10px] font-black ${right?'bg-emerald-500 text-white':wrong?'bg-rose-500 text-white':selected?'bg-[#246cff] text-white':'bg-[#0b2856] text-[#a9bddc]'}`}>{letter}</button>})}</div></div>)}
                </div>
                <button onClick={()=>setOfficialCorrected(true)} className="mt-5 w-full rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-black text-[#02120b]">Corrigir pelo gabarito final UFMG</button>
              </div>

              {officialCorrected&&<div className="rounded-[24px] border border-emerald-300/20 bg-emerald-300/[.06] p-5"><div className="flex items-end justify-between"><div><div className="text-[10px] font-black uppercase tracking-[.13em] text-emerald-200">Resultado oficial objetivo</div><div className="mt-1 text-4xl font-black">{officialScore}/45</div></div><div className="text-2xl font-black text-emerald-200">{Math.round((officialScore/45)*100)}%</div></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{(Object.entries(officialByArea) as Array<[SeriadoArea,{correct:number;total:number}]>).map(([name,value])=><div key={name} className="rounded-xl bg-[#041027] p-3"><div className="text-[10px] font-bold text-[#839ab9]">{name}</div><div className="mt-1 font-black">{value.correct}/{value.total}</div></div>)}</div><p className="mt-4 text-xs leading-relaxed text-[#9fb5d4]">A questão discursiva é corrigida separadamente. O resultado acima considera apenas as 45 objetivas.</p></div>}
            </div>
          </section>
        </>:<section className="rounded-[26px] border border-amber-300/20 bg-amber-300/[.06] p-6 md:p-8"><div className="text-[10px] font-black uppercase tracking-[.14em] text-amber-200">Ainda não existe caderno oficial desta etapa</div><h2 className="mt-2 text-3xl font-black">{stage==='etapa2'?'A primeira prova oficial da Etapa 2 será aplicada em 12/12/2026.':'A primeira prova oficial da Etapa 3 será aplicada em 2027.'}</h2><p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#b4c6df]">Não vou rotular questões simuladas como oficiais. Enquanto a UFMG não publica o caderno dessa etapa, o curso mostra a matriz oficial e questões autorais separadas.</p><div className="mt-5 flex flex-wrap gap-2"><a href={cyclePage} target="_blank" rel="noreferrer" className="rounded-xl bg-[#246cff] px-4 py-2.5 text-xs font-black">Ver ciclo oficial UFMG</a><button onClick={()=>setTab('autorais')} className="rounded-xl border border-[#31588e] bg-[#071a38] px-4 py-2.5 text-xs font-black">Ir para questões autorais</button></div></section>}
      </>}

      {tab==='conteudo'&&<>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {distribution?distribution.map(item=><article key={item.area} className={`rounded-[22px] border p-5 ${areaStyle[item.area]}`}><div className="text-xs font-black uppercase tracking-[.12em]">{item.area}</div><div className="mt-2 text-3xl font-black">{item.count}</div><div className="mt-1 text-xs opacity-80">questões objetivas no edital 2026 desta etapa</div></article>):<article className="rounded-[22px] border border-[#173765] bg-[#06152f] p-5 md:col-span-2 xl:col-span-4"><div className="text-xs font-black uppercase tracking-[.12em] text-[#72a5ff]">Formato da Etapa 3</div><div className="mt-2 text-xl font-black">Dia 1: 35 objetivas + redação • Dia 2: até 8 discursivas</div><p className="mt-2 text-sm text-[#9fb5d4]">As questões discursivas do 2º dia incidem sobre uma ou duas áreas, de acordo com o curso escolhido.</p></article>}
        </section>

        <section className="rounded-[26px] border border-[#173765] bg-[#06152f] p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="text-[10px] font-black uppercase tracking-[.14em] text-[#72a5ff]">Filtrar o conteúdo</div><h2 className="mt-1 text-2xl font-black">Escolha área e componente</h2></div><div className="flex flex-wrap gap-2">{(['Todas','Linguagens','Matemática','Natureza','Humanas'] as const).map(value=><button key={value} onClick={()=>{setArea(value);setComponent('Todos')}} className={`rounded-full px-3 py-2 text-xs font-black ${area===value?'bg-[#246cff]':'border border-[#31588e] bg-[#041027] text-[#a9bddc]'}`}>{value}</button>)}</div></div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1"><button onClick={()=>setComponent('Todos')} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black ${component==='Todos'?'bg-white text-[#020817]':'border border-[#173765] bg-[#041027] text-[#a9bddc]'}`}>Todos os componentes</button>{availableComponents.filter(name=>area==='Todas'||stageCurriculum.some(item=>item.component===name&&item.area===area)).map(name=><button key={name} onClick={()=>setComponent(name)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black ${component===name?'bg-white text-[#020817]':'border border-[#173765] bg-[#041027] text-[#a9bddc]'}`}>{name}</button>)}</div>
        </section>

        <section><div className="flex items-end justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-[.14em] text-[#72a5ff]">Matriz por componente</div><h2 className="mt-1 text-3xl font-black">O que estudar no {STAGE_META[stage].short}</h2></div><a href={UFMG_NORTEADOR_URL} target="_blank" rel="noreferrer" className="hidden items-center gap-1.5 text-xs font-black text-[#72a5ff] md:inline-flex">Documento Norteador <ExternalLink size={14}/></a></div><div className="mt-4 grid gap-4 lg:grid-cols-2">{visibleCurriculum.map(item=><article key={`${item.stage}-${item.component}`} className="rounded-[24px] border border-[#173765] bg-[#06152f] p-5 md:p-6"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${areaStyle[item.area]}`}>{item.area}</span><span className="text-xs font-black text-[#7691b5]">{STAGE_META[item.stage].short}</span></div><h3 className="mt-3 text-xl font-black">{item.component}</h3><p className="mt-2 text-sm leading-relaxed text-[#a9bddc]">{item.emphasis}</p><ul className="mt-4 space-y-2.5">{item.topics.slice(0,showAllTopics?item.topics.length:4).map(topic=><li key={topic} className="flex gap-2 text-sm leading-relaxed text-[#c4d4ea]"><ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[#72a5ff]"/>{topic}</li>)}</ul></article>)}</div>{visibleCurriculum.some(item=>item.topics.length>4)&&<button onClick={()=>setShowAllTopics(value=>!value)} className="mt-4 rounded-xl border border-[#31588e] bg-[#071a38] px-4 py-2.5 text-xs font-black text-[#c4d4ea]">{showAllTopics?'Resumir tópicos':'Mostrar todos os tópicos'}</button>}</section>

        {stageWorks.length>0&&<section className="rounded-[26px] border border-amber-300/15 bg-amber-300/[.05] p-5 md:p-6"><div className="flex items-center gap-2 text-amber-200"><BookOpen size={20}/><div className="text-xs font-black uppercase tracking-[.13em]">Obras indicadas</div></div><div className="mt-4 grid gap-3 md:grid-cols-3">{stageWorks.map(work=><article key={work.title} className="rounded-2xl border border-amber-200/10 bg-[#041027] p-4"><div className="text-[10px] font-black uppercase text-amber-200">{work.type}</div><div className="mt-2 font-black">{work.title}</div><div className="mt-1 text-xs text-[#9fb5d4]">{work.author}</div></article>)}</div></section>}
      </>}

      {tab==='autorais'&&<>
        <section className="rounded-[26px] border border-[#173765] bg-[#06152f] p-5 md:p-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="text-[10px] font-black uppercase tracking-[.14em] text-[#72a5ff]">Filtrar questões autorais</div><h2 className="mt-1 text-2xl font-black">Escolha área e componente</h2></div><div className="flex flex-wrap gap-2">{(['Todas','Linguagens','Matemática','Natureza','Humanas'] as const).map(value=><button key={value} onClick={()=>{setArea(value);setComponent('Todos')}} className={`rounded-full px-3 py-2 text-xs font-black ${area===value?'bg-[#246cff]':'border border-[#31588e] bg-[#041027] text-[#a9bddc]'}`}>{value}</button>)}</div></div><div className="mt-4 flex gap-2 overflow-x-auto pb-1"><button onClick={()=>setComponent('Todos')} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black ${component==='Todos'?'bg-white text-[#020817]':'border border-[#173765] bg-[#041027] text-[#a9bddc]'}`}>Todos os componentes</button>{availableComponents.filter(name=>area==='Todas'||stageCurriculum.some(item=>item.component===name&&item.area===area)).map(name=><button key={name} onClick={()=>setComponent(name)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black ${component===name?'bg-white text-[#020817]':'border border-[#173765] bg-[#041027] text-[#a9bddc]'}`}>{name}</button>)}</div></section>

        <section><div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="text-[10px] font-black uppercase tracking-[.14em] text-emerald-300">Banco autoral por ano</div><h2 className="mt-1 text-3xl font-black">Questões de {component==='Todos'?'todos os componentes':component}</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#9fb5d4]">São questões inéditas do Conectaê, separadas por ano e alinhadas à matriz oficial. Não são questões oficiais da UFMG.</p></div><div className="flex items-center gap-3"><div className="text-xs font-bold text-[#839ab9]">{answeredCount}/{stageQuestions.length} respondidas</div><button onClick={resetStage} className="inline-flex items-center gap-2 rounded-xl border border-[#31588e] bg-[#071a38] px-3 py-2 text-xs font-black text-[#a9bddc]"><RotateCcw size={14}/>Zerar</button></div></div><div className="mt-5 space-y-4">{visibleQuestions.map(question=>{const selected=answers[question.id];const isCorrected=Boolean(corrected[question.id]);const gotRight=selected===question.answer;return <article key={question.id} className="rounded-[24px] border border-[#173765] bg-[#06152f] p-5 md:p-6"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${areaStyle[question.area]}`}>{question.area}</span><span className="rounded-full border border-[#31588e] bg-[#071a38] px-2.5 py-1 text-[10px] font-black text-[#b9cbe4]">{question.component}</span><span className="text-[10px] font-bold text-[#7691b5]">{question.topic}</span></div><h3 className="mt-4 text-base font-bold leading-relaxed md:text-lg">{question.prompt}</h3><div className="mt-4 grid gap-2">{question.options.map((option,index)=>{const picked=selected===index;const right=isCorrected&&index===question.answer;const wrong=isCorrected&&picked&&!right;return <button key={`${question.id}-${index}`} onClick={()=>selectAnswer(question.id,index)} className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left text-sm transition ${right?'border-emerald-300/50 bg-emerald-300/10 text-emerald-50':wrong?'border-rose-300/50 bg-rose-300/10 text-rose-50':picked?'border-[#72a5ff] bg-[#246cff]/15':'border-[#173765] bg-[#041027] text-[#c4d4ea] hover:border-[#31588e]'}`}><span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#0b2856] text-xs font-black">{String.fromCharCode(65+index)}</span><span className="pt-1">{option}</span></button>})}</div><div className="mt-4 flex flex-wrap items-center gap-3"><button disabled={selected===undefined} onClick={()=>correctQuestion(question.id)} className="rounded-xl bg-[#246cff] px-4 py-2.5 text-xs font-black disabled:opacity-40">Corrigir</button>{isCorrected&&<span className={`inline-flex items-center gap-1.5 text-sm font-black ${gotRight?'text-emerald-300':'text-rose-300'}`}>{gotRight&&<CheckCircle2 size={15}/>} {gotRight?'Acertou':`Correta: ${String.fromCharCode(65+question.answer)}`}</span>}</div>{isCorrected&&<div className="mt-4 rounded-xl border border-[#173765] bg-[#041027] p-4 text-sm leading-relaxed text-[#b4c6df]"><strong className="text-white">Explicação: </strong>{question.explanation}</div>}</article>})}</div></section>
      </>}

      <section className="grid gap-4 lg:grid-cols-3">
        <a href={UFMG_NORTEADOR_URL} target="_blank" rel="noreferrer" className="rounded-[22px] border border-[#31588e] bg-[#0b2856] p-5"><Target className="text-[#72a5ff]"/><div className="mt-4 font-black">Documento Norteador completo</div><p className="mt-1 text-xs leading-relaxed text-[#a9bddc]">Matriz oficial das Etapas 1, 2 e 3 usada como referência para esta área.</p></a>
        <a href={official2026Url} target="_blank" rel="noreferrer" className="rounded-[22px] border border-[#173765] bg-[#06152f] p-5"><FileCheck2 className="text-emerald-300"/><div className="mt-4 font-black">Edital 2026</div><p className="mt-1 text-xs leading-relaxed text-[#a9bddc]">Formato, distribuição de questões, pontuação e regras das Etapas 1 e 2 em 2026.</p></a>
        <a href={cyclePage} target="_blank" rel="noreferrer" className="rounded-[22px] border border-[#173765] bg-[#06152f] p-5"><ListChecks className="text-amber-200"/><div className="mt-4 font-black">Ciclo 2025–2027</div><p className="mt-1 text-xs leading-relaxed text-[#a9bddc]">Calendário, estrutura das três etapas e acesso às provas oficiais publicadas.</p></a>
      </section>
    </main>
  </div>;
}
