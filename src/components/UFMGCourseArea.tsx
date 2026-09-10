import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileCheck2,
  GraduationCap,
  ListChecks,
  PlayCircle,
  RotateCcw,
  Target,
  Trophy,
  XCircle,
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
import { UFMG_WORK_GUIDES } from '@/lib/ufmg-seriado-works';

type AnswerState = Record<string, number>;
type CorrectedState = Record<string, boolean>;
type BankTab = 'conteudo' | 'autorais' | 'oficiais';
type AreaDistribution = { area: SeriadoArea; count: number };
type OfficialLanguage = 'ingles' | 'espanhol';

const official2026Url = 'https://backend.copeve.ufmg.br/uploads/Seriado_2026_Edital_6ac08b0f67.html';
const officialPortal = 'https://www.ufmg.br/seriadoufmg/';
const cyclePage = 'https://www.ufmg.br/seriadoufmg/ciclo-2025-2027/';

const stageDistribution: Partial<Record<SeriadoStage, AreaDistribution[]>> = {
  etapa1: [
    { area: 'Linguagens', count: 14 }, { area: 'Matemática', count: 9 }, { area: 'Natureza', count: 12 }, { area: 'Humanas', count: 10 },
  ],
  etapa2: [
    { area: 'Linguagens', count: 14 }, { area: 'Matemática', count: 7 }, { area: 'Natureza', count: 12 }, { area: 'Humanas', count: 12 },
  ],
};

const areaStyle: Record<SeriadoArea, string> = {
  Linguagens: 'border-[#c9b8f4] bg-[#f2edff] text-[#56349a]',
  Matemática: 'border-[#9fc5ff] bg-[#eaf4ff] text-[#244fbe]',
  Natureza: 'border-[#9edfcf] bg-[#e9f8f4] text-[#08745b]',
  Humanas: 'border-[#f0d68f] bg-[#fff7df] text-[#8a5708]',
};

const officialPageMap: Record<number, number> = {
  1: 5, 2: 5, 3: 6, 4: 7, 5: 7, 6: 8, 7: 9, 8: 10, 9: 11, 10: 12, 11: 13,
  15: 22, 16: 22, 17: 23, 18: 24, 19: 25, 20: 25, 21: 25, 22: 26, 23: 26,
  24: 28, 25: 29, 26: 29, 27: 29, 28: 30, 29: 31, 30: 31, 31: 32, 32: 32,
  33: 33, 34: 33, 35: 34, 36: 35, 37: 36, 38: 37, 39: 38, 40: 39, 41: 40,
  42: 40, 43: 42, 44: 43, 45: 44,
};

function readJson<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
}
function writeJson(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ } }
function officialArea(question: number): SeriadoArea {
  if (question <= 14) return 'Linguagens';
  if (question <= 23) return 'Matemática';
  if (question <= 35) return 'Natureza';
  return 'Humanas';
}
function officialPage(question: number, language: OfficialLanguage) {
  if (question === 12) return language === 'ingles' ? 17 : 14;
  if (question === 13) return language === 'ingles' ? 18 : 15;
  if (question === 14) return language === 'ingles' ? 20 : 16;
  return officialPageMap[question] ?? 5;
}

export default function UFMGCourseArea({ onBack }: { onBack: () => void }) {
  const [stage, setStage] = useState<SeriadoStage>(() => readJson<SeriadoStage>('conectae:ufmg-course-stage', 'etapa1'));
  const [tab, setTab] = useState<BankTab>('conteudo');
  const [area, setArea] = useState<'Todas' | SeriadoArea>('Todas');
  const [component, setComponent] = useState<string>('Todos');
  const [answers, setAnswers] = useState<AnswerState>(() => readJson<AnswerState>('conectae:ufmg-year-answers', {}));
  const [corrected, setCorrected] = useState<CorrectedState>(() => readJson<CorrectedState>('conectae:ufmg-year-corrected', {}));
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [authoredIndex, setAuthoredIndex] = useState(0);
  const [officialAnswers, setOfficialAnswers] = useState<Record<number, string>>(() => readJson<Record<number, string>>('conectae:ufmg-official-2025-answers', {}));
  const [officialCurrent, setOfficialCurrent] = useState(1);
  const [officialLanguage, setOfficialLanguage] = useState<OfficialLanguage>(() => readJson<OfficialLanguage>('conectae:ufmg-official-language', 'ingles'));
  const [selectedWork, setSelectedWork] = useState(0);
  const [workAnswers, setWorkAnswers] = useState<Record<string, number>>(() => readJson<Record<string, number>>('conectae:ufmg-work-answers', {}));

  const stageCurriculum = useMemo(() => UFMG_CURRICULUM.filter(item => item.stage === stage), [stage]);
  const availableComponents = useMemo(() => COMPONENT_ORDER.filter(name => stageCurriculum.some(item => item.component === name)), [stageCurriculum]);
  const visibleCurriculum = useMemo(() => stageCurriculum.filter(item => (area === 'Todas' || item.area === area) && (component === 'Todos' || item.component === component)), [stageCurriculum, area, component]);
  const visibleQuestions = useMemo(() => UFMG_YEAR_QUESTIONS.filter(question => question.stage === stage && (area === 'Todas' || question.area === area) && (component === 'Todos' || question.component === component)), [stage, area, component]);
  const stageQuestions = useMemo(() => UFMG_YEAR_QUESTIONS.filter(question => question.stage === stage), [stage]);
  const distribution = stageDistribution[stage];
  const stageWorks = stage === 'etapa1' ? UFMG_REQUIRED_WORKS.etapa1 : stage === 'etapa2' ? UFMG_REQUIRED_WORKS.etapa2 : [];
  const activeWork = stageWorks[selectedWork] ? UFMG_WORK_GUIDES[stageWorks[selectedWork].title] : null;
  const activeAuthored = visibleQuestions[Math.min(authoredIndex, Math.max(visibleQuestions.length - 1, 0))];

  const answeredCount = stageQuestions.filter(question => answers[question.id] !== undefined).length;
  const correctCount = stageQuestions.filter(question => corrected[question.id] && answers[question.id] === question.answer).length;
  const officialScore = UFMG_OFFICIAL_2025.finalKey.reduce((sum, key, index) => sum + (officialAnswers[index + 1] === key ? 1 : 0), 0);
  const officialAnswered = Object.keys(officialAnswers).length;
  const officialFinished = officialAnswered === 45;
  const officialPercent = Math.round((officialScore / 45) * 100);
  const officialByArea = useMemo(() => {
    const result: Record<SeriadoArea, { correct: number; answered: number; total: number }> = {
      Linguagens: { correct: 0, answered: 0, total: 14 }, Matemática: { correct: 0, answered: 0, total: 9 }, Natureza: { correct: 0, answered: 0, total: 12 }, Humanas: { correct: 0, answered: 0, total: 10 },
    };
    UFMG_OFFICIAL_2025.finalKey.forEach((key, index) => {
      const q = index + 1; const a = officialArea(q);
      if (officialAnswers[q]) result[a].answered += 1;
      if (officialAnswers[q] === key) result[a].correct += 1;
    });
    return result;
  }, [officialAnswers]);

  const chooseStage = (next: SeriadoStage) => {
    setStage(next); setArea('Todas'); setComponent('Todos'); setShowAllTopics(false); setAuthoredIndex(0); setSelectedWork(0); setTab('conteudo');
    writeJson('conectae:ufmg-course-stage', next); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const chooseAuthorAnswer = (id: string, value: number) => {
    if (corrected[id]) return;
    const nextAnswers = { ...answers, [id]: value };
    const nextCorrected = { ...corrected, [id]: true };
    setAnswers(nextAnswers); setCorrected(nextCorrected);
    writeJson('conectae:ufmg-year-answers', nextAnswers); writeJson('conectae:ufmg-year-corrected', nextCorrected);
  };

  const retryAuthored = (id: string) => {
    const nextAnswers = { ...answers }; const nextCorrected = { ...corrected };
    delete nextAnswers[id]; delete nextCorrected[id];
    setAnswers(nextAnswers); setCorrected(nextCorrected);
    writeJson('conectae:ufmg-year-answers', nextAnswers); writeJson('conectae:ufmg-year-corrected', nextCorrected);
  };

  const resetStage = () => {
    const ids = new Set(stageQuestions.map(question => question.id));
    const nextAnswers = Object.fromEntries(Object.entries(answers).filter(([id]) => !ids.has(id)));
    const nextCorrected = Object.fromEntries(Object.entries(corrected).filter(([id]) => !ids.has(id)));
    setAnswers(nextAnswers); setCorrected(nextCorrected); setAuthoredIndex(0);
    writeJson('conectae:ufmg-year-answers', nextAnswers); writeJson('conectae:ufmg-year-corrected', nextCorrected);
  };

  const chooseOfficial = (question: number, letter: string) => {
    if (officialAnswers[question]) return;
    const next = { ...officialAnswers, [question]: letter };
    setOfficialAnswers(next); writeJson('conectae:ufmg-official-2025-answers', next);
  };
  const retryOfficial = (question: number) => {
    const next = { ...officialAnswers }; delete next[question]; setOfficialAnswers(next); writeJson('conectae:ufmg-official-2025-answers', next);
  };
  const resetOfficial = () => { setOfficialAnswers({}); setOfficialCurrent(1); writeJson('conectae:ufmg-official-2025-answers', {}); };

  const chooseWorkAnswer = (workTitle: string, questionIndex: number, value: number) => {
    const key = `${workTitle}:${questionIndex}`;
    if (workAnswers[key] !== undefined) return;
    const next = { ...workAnswers, [key]: value };
    setWorkAnswers(next); writeJson('conectae:ufmg-work-answers', next);
  };

  const setFilterArea = (value: 'Todas' | SeriadoArea) => { setArea(value); setComponent('Todos'); setAuthoredIndex(0); };
  const setFilterComponent = (value: string) => { setComponent(value); setAuthoredIndex(0); };

  return <div className="min-h-screen bg-[#020817] text-[#172344] font-['Plus_Jakarta_Sans']">
    <header className="sticky top-0 z-40 border-b border-[#173765] bg-[#020817]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3 px-4 py-3 md:px-6">
        <button onClick={onBack} className="inline-flex items-center gap-2 rounded-xl border border-[#234576] bg-[#071a38] px-3 py-2 text-xs font-extrabold text-[#d1deef] hover:border-[#72a5ff]"><ArrowLeft size={16}/>Voltar ao Curso</button>
        <div className="min-w-0 text-center"><div className="text-[10px] font-black uppercase tracking-[.16em] text-[#72a5ff]">Dentro do Curso</div><div className="truncate text-base font-black">Seriado UFMG</div></div>
        <a href={officialPortal} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-[#246cff] px-3 py-2 text-xs font-black">UFMG <ExternalLink size={14}/></a>
      </div>
      <div className="mx-auto flex max-w-[1180px] gap-2 overflow-x-auto px-4 pb-2 md:px-6">
        {(['etapa1', 'etapa2', 'etapa3'] as SeriadoStage[]).map(id => <button key={id} onClick={() => chooseStage(id)} className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-black transition ${stage === id ? 'bg-[#246cff] text-white' : 'border border-[#173765] bg-[#06152f] text-[#9fb5d4]'}`}>{STAGE_META[id].label}</button>)}
      </div>
      <div className="mx-auto flex max-w-[1180px] gap-2 overflow-x-auto px-4 pb-3 md:px-6">
        {([
          ['conteudo', 'Conteúdo do ano', BookOpen],
          ['autorais', 'Treino por questão', ListChecks],
          ['oficiais', 'Prova oficial 2025', FileCheck2],
        ] as const).map(([id, label, Icon]) => <button key={id} onClick={() => setTab(id)} className={`inline-flex whitespace-nowrap items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black ${tab === id ? 'bg-white text-[#020817]' : 'border border-[#173765] bg-[#06152f] text-[#9fb5d4]'}`}><Icon size={14}/>{label}</button>)}
      </div>
    </header>

    <main className="mx-auto w-full max-w-[1180px] space-y-6 px-4 pb-24 pt-6 md:px-6 md:pb-12 md:pt-9">
      <section className="overflow-hidden rounded-[28px] border border-[#173765] bg-[radial-gradient(circle_at_85%_0%,rgba(36,108,255,.23),transparent_32%),linear-gradient(145deg,#081a38,#06152f)] p-6 md:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#547fbd] bg-[#12376f] px-3 py-1.5 text-xs font-black text-[#d9e6ff]"><GraduationCap size={15}/>{STAGE_META[stage].label}</div>
            <h1 className="mt-4 text-3xl font-black tracking-[-.045em] text-[#f7faff] md:text-5xl">Seriado UFMG <span className="text-[#8fb4ff]">{STAGE_META[stage].short}</span></h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#c3d2e8] md:text-base">{STAGE_META[stage].note}</p>
            {stage === 'etapa2' && <p className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/[.07] p-3 text-xs font-bold leading-relaxed text-[#ffe2a3]">A Etapa 2 é cumulativa: cobra conteúdos da 1ª e da 2ª séries, com maior ênfase nos conteúdos da 2ª série.</p>}
            {stage === 'etapa3' && <p className="mt-3 rounded-xl border border-amber-300/20 bg-amber-300/[.07] p-3 text-xs font-bold leading-relaxed text-[#ffe2a3]">A Etapa 3 acumula as três séries. No 2º dia, a área das discursivas depende do curso de graduação escolhido.</p>}
          </div>
          <div className="rounded-2xl border border-[#234576] bg-[#041027]/85 p-5">
            <div className="text-[10px] font-black uppercase tracking-[.13em] text-[#7691b5]">Ordem recomendada</div>
            <div className="mt-2 text-2xl font-black">1. Conteúdo → 2. Treino → 3. Prova real</div>
            <p className="mt-2 text-xs leading-relaxed text-[#9fb5d4]">O conteúdo do seu ano é agora a parte principal. A prova oficial ficou por último para medir o que você consolidou.</p>
          </div>
        </div>
      </section>

      {tab === 'conteudo' && <>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {distribution ? distribution.map(item => <article key={item.area} className={`rounded-[22px] border p-5 ${areaStyle[item.area]}`}><div className="text-xs font-black uppercase tracking-[.12em]">{item.area}</div><div className="mt-2 text-3xl font-black">{item.count}</div><div className="mt-1 text-xs opacity-80">questões objetivas previstas no formato desta etapa</div></article>) : <article className="rounded-[22px] border border-[#173765] bg-[#06152f] p-5 md:col-span-2 xl:col-span-4"><div className="text-xs font-black uppercase tracking-[.12em] text-[#72a5ff]">Formato da Etapa 3</div><div className="mt-2 text-xl font-black">Dia 1: 35 objetivas + redação • Dia 2: até 8 discursivas</div><p className="mt-2 text-sm text-[#9fb5d4]">As questões discursivas do 2º dia incidem sobre uma ou duas áreas, de acordo com o curso escolhido.</p></article>}
        </section>

        <section className="rounded-[26px] border border-[#173765] bg-[#06152f] p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="text-[10px] font-black uppercase tracking-[.14em] text-[#72a5ff]">Seu conteúdo primeiro</div><h2 className="mt-1 text-2xl font-black">Escolha área e componente</h2></div><div className="flex flex-wrap gap-2">{(['Todas', 'Linguagens', 'Matemática', 'Natureza', 'Humanas'] as const).map(value => <button key={value} onClick={() => setFilterArea(value)} className={`rounded-full px-3 py-2 text-xs font-black ${area === value ? 'bg-[#246cff]' : 'border border-[#31588e] bg-[#041027] text-[#a9bddc]'}`}>{value}</button>)}</div></div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1"><button onClick={() => setFilterComponent('Todos')} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black ${component === 'Todos' ? 'bg-white text-[#020817]' : 'border border-[#173765] bg-[#041027] text-[#a9bddc]'}`}>Todos os componentes</button>{availableComponents.filter(name => area === 'Todas' || stageCurriculum.some(item => item.component === name && item.area === area)).map(name => <button key={name} onClick={() => setFilterComponent(name)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black ${component === name ? 'bg-white text-[#020817]' : 'border border-[#173765] bg-[#041027] text-[#a9bddc]'}`}>{name}</button>)}</div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-[.14em] text-[#72a5ff]">Matriz por componente</div><h2 className="mt-1 text-3xl font-black">O que estudar no {STAGE_META[stage].short}</h2></div><a href={UFMG_NORTEADOR_URL} target="_blank" rel="noreferrer" className="hidden items-center gap-1.5 text-xs font-black text-[#72a5ff] md:inline-flex">Documento Norteador <ExternalLink size={14}/></a></div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">{visibleCurriculum.map(item => <article key={`${item.stage}-${item.component}`} className="rounded-[24px] border border-[#173765] bg-[#06152f] p-5 md:p-6"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${areaStyle[item.area]}`}>{item.area}</span><span className="text-xs font-black text-[#7691b5]">{STAGE_META[item.stage].short}</span></div><h3 className="mt-3 text-xl font-black">{item.component}</h3><p className="mt-2 text-sm leading-relaxed text-[#a9bddc]">{item.emphasis}</p><ul className="mt-4 space-y-2.5">{item.topics.slice(0, showAllTopics ? item.topics.length : 4).map(topic => <li key={topic} className="flex gap-2 text-sm leading-relaxed text-[#c4d4ea]"><ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[#72a5ff]" />{topic}</li>)}</ul></article>)}</div>
          {visibleCurriculum.some(item => item.topics.length > 4) && <button onClick={() => setShowAllTopics(value => !value)} className="mt-4 rounded-xl border border-[#31588e] bg-[#071a38] px-4 py-2.5 text-xs font-black text-[#c4d4ea]">{showAllTopics ? 'Resumir tópicos' : 'Mostrar todos os tópicos'}</button>}
        </section>

        {stageWorks.length > 0 && <section className="rounded-[28px] border border-amber-300/20 bg-amber-300/[.05] p-5 md:p-7">
          <div className="flex items-center gap-2 text-amber-200"><BookOpen size={20}/><div className="text-xs font-black uppercase tracking-[.13em]">Obras indicadas — estudo guiado</div></div>
          <h2 className="mt-2 text-3xl font-black">Não é só listar a obra: estude por ela.</h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#b4c6df]">Resumo escrito, pontos que merecem atenção, vídeo de apoio e perguntas para conferir se você realmente entendeu.</p>
          <div className="mt-5 flex gap-2 overflow-x-auto pb-2">{stageWorks.map((work, index) => <button key={work.title} onClick={() => setSelectedWork(index)} className={`min-w-[220px] rounded-2xl border p-4 text-left transition ${selectedWork === index ? 'border-amber-200/45 bg-amber-200/10' : 'border-[#31588e] bg-[#041027]'}`}><div className="text-[10px] font-black uppercase text-amber-200">{work.type}</div><div className="mt-1 font-black">{work.title}</div><div className="mt-1 text-xs text-[#9fb5d4]">{work.author}</div></button>)}</div>

          {activeWork && <div className="mt-4 rounded-[24px] border border-amber-200/15 bg-[#041027] p-5 md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"><div><div className="text-[10px] font-black uppercase tracking-[.12em] text-amber-200">{activeWork.type}</div><h3 className="mt-1 text-2xl font-black">{activeWork.title}</h3><p className="mt-1 text-sm font-bold text-[#9fb5d4]">{activeWork.author}</p></div><a href={activeWork.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-xs font-black text-white"><PlayCircle size={16}/>Ver vídeo no YouTube</a></div>
            <div className="mt-5 rounded-2xl border border-[#173765] bg-[#06152f] p-4"><div className="text-xs font-black uppercase tracking-[.12em] text-[#72a5ff]">Resumo escrito</div><p className="mt-2 text-sm leading-relaxed text-[#c4d4ea]">{activeWork.summary}</p></div>
            <div className="mt-4 grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
              <div className="rounded-2xl border border-[#173765] bg-[#06152f] p-4"><div className="text-xs font-black uppercase tracking-[.12em] text-amber-200">O que revisar</div><ul className="mt-3 space-y-2">{activeWork.focus.map(point => <li key={point} className="flex gap-2 text-sm text-[#c4d4ea]"><ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />{point}</li>)}</ul><a href={activeWork.videoUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-xs font-black text-red-300"><PlayCircle size={15}/>{activeWork.videoLabel}</a></div>
              <div className="rounded-2xl border border-[#173765] bg-[#06152f] p-4"><div className="text-xs font-black uppercase tracking-[.12em] text-emerald-300">Perguntas sobre a obra</div><div className="mt-3 space-y-5">{activeWork.quiz.map((question, qIndex) => { const key = `${activeWork.title}:${qIndex}`; const selected = workAnswers[key]; const done = selected !== undefined; const right = selected === question.answer; return <div key={key} className="rounded-xl border border-[#173765] bg-[#041027] p-4"><div className="text-sm font-bold leading-relaxed">{qIndex + 1}. {question.prompt}</div><div className="mt-3 grid gap-2">{question.options.map((option, optionIndex) => <button key={option} disabled={done} onClick={() => chooseWorkAnswer(activeWork.title, qIndex, optionIndex)} className={`rounded-xl border px-3 py-2.5 text-left text-xs font-bold ${done && optionIndex === question.answer ? 'border-emerald-300/50 bg-emerald-300/10 text-emerald-100' : done && selected === optionIndex ? 'border-rose-300/50 bg-rose-300/10 text-rose-100' : 'border-[#31588e] bg-[#071a38] text-[#c4d4ea]'}`}>{String.fromCharCode(65 + optionIndex)}. {option}</button>)}</div>{done && <div className={`mt-3 text-xs font-black ${right ? 'text-emerald-300' : 'text-rose-300'}`}>{right ? '✓ Acertou.' : `✕ Correta: ${String.fromCharCode(65 + question.answer)}.`} <span className="font-medium text-[#9fb5d4]">{question.explanation}</span></div>}</div>; })}</div></div>
            </div>
          </div>}
        </section>}
      </>}

      {tab === 'autorais' && <>
        <section className="rounded-[26px] border border-[#173765] bg-[#06152f] p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="text-[10px] font-black uppercase tracking-[.14em] text-[#72a5ff]">Treino uma por uma</div><h2 className="mt-1 text-2xl font-black">Leia, responda e veja o gabarito na hora</h2></div><div className="flex flex-wrap gap-2">{(['Todas', 'Linguagens', 'Matemática', 'Natureza', 'Humanas'] as const).map(value => <button key={value} onClick={() => setFilterArea(value)} className={`rounded-full px-3 py-2 text-xs font-black ${area === value ? 'bg-[#246cff]' : 'border border-[#31588e] bg-[#041027] text-[#a9bddc]'}`}>{value}</button>)}</div></div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1"><button onClick={() => setFilterComponent('Todos')} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black ${component === 'Todos' ? 'bg-white text-[#020817]' : 'border border-[#173765] bg-[#041027] text-[#a9bddc]'}`}>Todos os componentes</button>{availableComponents.filter(name => area === 'Todas' || stageCurriculum.some(item => item.component === name && item.area === area)).map(name => <button key={name} onClick={() => setFilterComponent(name)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black ${component === name ? 'bg-white text-[#020817]' : 'border border-[#173765] bg-[#041027] text-[#a9bddc]'}`}>{name}</button>)}</div>
        </section>

        <section className="rounded-[28px] border border-[#173765] bg-[#06152f] p-5 md:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><div className="text-[10px] font-black uppercase tracking-[.14em] text-emerald-300">Seu desempenho autoral</div><div className="mt-1 text-xl font-black">{correctCount} acertos em {answeredCount} respondidas</div></div><button onClick={resetStage} className="inline-flex items-center gap-2 rounded-xl border border-[#31588e] bg-[#071a38] px-3 py-2 text-xs font-black text-[#a9bddc]"><RotateCcw size={14}/>Zerar etapa</button></div>
          {activeAuthored ? (() => { const selected = answers[activeAuthored.id]; const done = Boolean(corrected[activeAuthored.id]); const gotRight = selected === activeAuthored.answer; return <div className="mt-5"><div className="mb-4 flex items-center justify-between gap-3"><button disabled={authoredIndex === 0} onClick={() => setAuthoredIndex(index => Math.max(0, index - 1))} className="rounded-xl border border-[#31588e] bg-[#041027] p-2 disabled:opacity-30"><ChevronLeft size={18}/></button><div className="text-center"><div className="text-xs font-black text-[#72a5ff]">Questão {Math.min(authoredIndex + 1, visibleQuestions.length)} de {visibleQuestions.length}</div><div className="mt-1 h-1.5 w-44 overflow-hidden rounded-full bg-[#0b2856]"><div className="h-full bg-[#246cff]" style={{ width: `${visibleQuestions.length ? ((authoredIndex + 1) / visibleQuestions.length) * 100 : 0}%` }}/></div></div><button disabled={authoredIndex >= visibleQuestions.length - 1} onClick={() => setAuthoredIndex(index => Math.min(visibleQuestions.length - 1, index + 1))} className="rounded-xl border border-[#31588e] bg-[#041027] p-2 disabled:opacity-30"><ChevronRight size={18}/></button></div>
            <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${areaStyle[activeAuthored.area]}`}>{activeAuthored.area}</span><span className="rounded-full border border-[#31588e] bg-[#071a38] px-2.5 py-1 text-[10px] font-black text-[#b9cbe4]">{activeAuthored.component}</span><span className="text-[10px] font-bold text-[#7691b5]">{activeAuthored.topic}</span></div>
            <h3 className="mt-4 text-lg font-bold leading-relaxed md:text-2xl">{activeAuthored.prompt}</h3>
            <div className="mt-5 grid gap-3">{activeAuthored.options.map((option, index) => { const right = done && index === activeAuthored.answer; const wrong = done && selected === index && !right; return <button key={`${activeAuthored.id}-${index}`} disabled={done} onClick={() => chooseAuthorAnswer(activeAuthored.id, index)} className={`flex items-start gap-3 rounded-2xl border p-4 text-left text-sm font-bold transition ${right ? 'border-emerald-300/50 bg-emerald-300/10 text-[#08745b]' : wrong ? 'border-rose-300/50 bg-rose-300/10 text-[#a61b46]' : 'border-[#31588e] bg-[#041027] text-[#c4d4ea] hover:border-[#72a5ff]'}`}><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#0b2856] text-xs font-black">{String.fromCharCode(65 + index)}</span><span className="pt-1.5">{option}</span></button>; })}</div>
            {done && <div className={`mt-5 rounded-2xl border p-4 ${gotRight ? 'border-emerald-300/25 bg-emerald-300/[.07]' : 'border-rose-300/25 bg-rose-300/[.07]'}`}><div className={`flex items-center gap-2 text-base font-black ${gotRight ? 'text-emerald-300' : 'text-rose-300'}`}>{gotRight ? <CheckCircle2 size={19}/> : <XCircle size={19}/>} {gotRight ? 'Resposta correta' : `Você errou. Gabarito: ${String.fromCharCode(65 + activeAuthored.answer)}`}</div><p className="mt-2 text-sm leading-relaxed text-[#c4d4ea]">{activeAuthored.explanation}</p><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => retryAuthored(activeAuthored.id)} className="rounded-xl border border-[#31588e] bg-[#041027] px-3 py-2 text-xs font-black">Refazer</button>{authoredIndex < visibleQuestions.length - 1 && <button onClick={() => setAuthoredIndex(index => index + 1)} className="inline-flex items-center gap-2 rounded-xl bg-[#246cff] px-4 py-2 text-xs font-black">Próxima <ArrowRight size={14}/></button>}</div></div>}
          </div>; })() : <div className="mt-5 rounded-2xl border border-[#31588e] bg-[#041027] p-5 text-sm text-[#9fb5d4]">Nenhuma questão encontrada neste filtro.</div>}
        </section>
      </>}

      {tab === 'oficiais' && <>
        {stage === 'etapa1' ? <>
          <section className="rounded-[26px] border border-emerald-300/20 bg-emerald-300/[.06] p-5 md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><div className="text-[10px] font-black uppercase tracking-[.14em] text-emerald-200">ÚLTIMA ETAPA DO ESTUDO</div><h2 className="mt-1 text-3xl font-black">Prova oficial UFMG 2025 • uma questão por vez</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#b4c6df]">Abra a página da questão, responda A–D e receba o gabarito imediatamente. Cada resposta entra no seu total de acertos e erros; ao concluir as 45, o site calcula sua média final.</p></div><button onClick={resetOfficial} className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-300/30 bg-[#041027] px-4 py-2.5 text-xs font-black text-emerald-100"><RotateCcw size={15}/>Zerar prova</button></div>
          </section>

          {officialFinished && <section className="rounded-[28px] border border-emerald-300/35 bg-[radial-gradient(circle_at_85%_0%,rgba(52,211,153,.2),transparent_35%),#06152f] p-6 md:p-8"><div className="grid gap-5 lg:grid-cols-[.7fr_1.3fr] lg:items-center"><div><div className="text-[10px] font-black uppercase tracking-[.14em] text-emerald-300">Resultado final</div><div className="mt-2 flex items-end gap-3"><div className="text-6xl font-black text-emerald-300">{officialPercent}%</div><div className="pb-2 text-sm font-black text-[#9fb5d4]">{officialScore}/45 acertos</div></div><div className="mt-3 text-sm text-[#c4d4ea]">Média final calculada com o gabarito oficial da prova de 2025.</div></div><div className="grid gap-3 sm:grid-cols-2">{(Object.keys(officialByArea) as SeriadoArea[]).map(item => <div key={item} className="rounded-2xl border border-[#31588e] bg-[#041027] p-4"><div className="text-xs font-black text-[#9fb5d4]">{item}</div><div className="mt-1 text-2xl font-black">{officialByArea[item].correct}/{officialByArea[item].total}</div></div>)}</div></div></section>}

          <section className="rounded-[28px] border border-[#173765] bg-[#06152f] p-5 md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-[.14em] text-[#72a5ff]">Questão oficial</div><h3 className="mt-1 text-2xl font-black">Questão {String(officialCurrent).padStart(2, '0')} de 45</h3><div className="mt-2 text-xs font-bold text-[#9fb5d4]">{officialArea(officialCurrent)} • {officialAnswered}/45 respondidas • {officialScore} acertos até agora</div></div><div className="flex items-center gap-2"><button disabled={officialCurrent === 1} onClick={() => setOfficialCurrent(value => Math.max(1, value - 1))} className="rounded-xl border border-[#31588e] bg-[#041027] p-2.5 disabled:opacity-30"><ChevronLeft size={18}/></button><button disabled={officialCurrent === 45} onClick={() => setOfficialCurrent(value => Math.min(45, value + 1))} className="rounded-xl border border-[#31588e] bg-[#041027] p-2.5 disabled:opacity-30"><ChevronRight size={18}/></button></div></div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#0b2856]"><div className="h-full bg-[#246cff]" style={{ width: `${(officialAnswered / 45) * 100}%` }}/></div>

            {officialCurrent >= 12 && officialCurrent <= 14 && <div className="mt-5 rounded-2xl border border-amber-300/20 bg-amber-300/[.06] p-4"><div className="text-xs font-black text-amber-200">Língua estrangeira escolhida</div><div className="mt-3 flex gap-2"><button onClick={() => { setOfficialLanguage('ingles'); writeJson('conectae:ufmg-official-language', 'ingles'); }} className={`rounded-xl px-4 py-2 text-xs font-black ${officialLanguage === 'ingles' ? 'bg-[#246cff]' : 'border border-[#31588e] bg-[#041027]'}`}>Inglês</button><button onClick={() => { setOfficialLanguage('espanhol'); writeJson('conectae:ufmg-official-language', 'espanhol'); }} className={`rounded-xl px-4 py-2 text-xs font-black ${officialLanguage === 'espanhol' ? 'bg-[#246cff]' : 'border border-[#31588e] bg-[#041027]'}`}>Espanhol</button></div></div>}

            <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
              <div className="overflow-hidden rounded-[22px] border border-[#31588e] bg-white">
                <div className="flex items-center justify-between gap-3 bg-[#071a38] px-4 py-3 text-white"><div><div className="text-xs font-black">Caderno oficial • página {officialPage(officialCurrent, officialLanguage)}</div><div className="text-[10px] text-[#9fb5d4]">A página abre diretamente no trecho em que está a questão.</div></div><a href={`${UFMG_OFFICIAL_2025.examUrl}#page=${officialPage(officialCurrent, officialLanguage)}`} target="_blank" rel="noreferrer" className="rounded-lg bg-emerald-400 px-3 py-2 text-[10px] font-black text-[#02120b]">Abrir tela cheia</a></div>
                <iframe title={`Questão ${officialCurrent} do Seriado UFMG 2025`} src={`${UFMG_OFFICIAL_2025.examUrl}#page=${officialPage(officialCurrent, officialLanguage)}&zoom=page-width`} className="h-[62vh] min-h-[520px] w-full bg-white" />
                <div className="border-t border-[#dbe4f0] bg-[#f8fafc] p-3 text-center text-xs font-bold text-[#475569]">Se o PDF não aparecer no navegador do Instagram, toque em “Abrir tela cheia”.</div>
              </div>

              <div className="rounded-[22px] border border-[#31588e] bg-[#041027] p-5">
                <div className="text-[10px] font-black uppercase tracking-[.13em] text-[#72a5ff]">Sua resposta</div><h4 className="mt-1 text-xl font-black">Marque assim que terminar de ler</h4><div className="mt-5 grid grid-cols-2 gap-3">{['A', 'B', 'C', 'D'].map(letter => { const chosen = officialAnswers[officialCurrent]; const done = Boolean(chosen); const correctLetter = UFMG_OFFICIAL_2025.finalKey[officialCurrent - 1]; const right = done && letter === correctLetter; const wrong = done && chosen === letter && letter !== correctLetter; return <button key={letter} disabled={done} onClick={() => chooseOfficial(officialCurrent, letter)} className={`min-h-16 rounded-2xl border text-lg font-black transition ${right ? 'border-emerald-300/60 bg-emerald-300/15 text-emerald-200' : wrong ? 'border-rose-300/60 bg-rose-300/15 text-rose-200' : 'border-[#31588e] bg-[#071a38] text-[#c4d4ea] hover:border-[#72a5ff]'}`}>{letter}</button>; })}</div>
                {officialAnswers[officialCurrent] && (() => { const chosen = officialAnswers[officialCurrent]; const correctLetter = UFMG_OFFICIAL_2025.finalKey[officialCurrent - 1]; const gotRight = chosen === correctLetter; return <div className={`mt-5 rounded-2xl border p-4 ${gotRight ? 'border-emerald-300/25 bg-emerald-300/[.07]' : 'border-rose-300/25 bg-rose-300/[.07]'}`}><div className={`flex items-center gap-2 text-base font-black ${gotRight ? 'text-emerald-300' : 'text-rose-300'}`}>{gotRight ? <CheckCircle2 size={19}/> : <XCircle size={19}/>} {gotRight ? 'Acertou!' : `Errou. Gabarito oficial: ${correctLetter}`}</div><div className="mt-2 text-xs text-[#9fb5d4]">Placar atual: {officialScore} acertos e {officialAnswered - officialScore} erros em {officialAnswered} respondidas.</div><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => retryOfficial(officialCurrent)} className="rounded-xl border border-[#31588e] bg-[#041027] px-3 py-2 text-xs font-black">Refazer questão</button>{officialCurrent < 45 && <button onClick={() => setOfficialCurrent(value => value + 1)} className="inline-flex items-center gap-2 rounded-xl bg-[#246cff] px-4 py-2 text-xs font-black">Próxima questão <ArrowRight size={14}/></button>}</div></div>; })()}
                <a href={UFMG_OFFICIAL_2025.finalKeyUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-xs font-black text-emerald-300">Conferir gabarito final oficial <ExternalLink size={14}/></a>
              </div>
            </div>
          </section>
        </> : <section className="rounded-[28px] border border-[#173765] bg-[#06152f] p-6"><div className="text-[10px] font-black uppercase tracking-[.14em] text-[#72a5ff]">Provas oficiais</div><h2 className="mt-2 text-2xl font-black">Esta etapa ainda não tem caderno oficial anterior equivalente disponível no banco.</h2><p className="mt-2 text-sm leading-relaxed text-[#9fb5d4]">Enquanto isso, use o conteúdo do ano e o treino autoral. Quando a UFMG publicar a prova correspondente, ela entra aqui no mesmo formato questão por questão.</p></section>}
      </>}

      <section className="grid gap-4 lg:grid-cols-3">
        <a href={UFMG_NORTEADOR_URL} target="_blank" rel="noreferrer" className="rounded-[22px] border border-[#31588e] bg-[#0b2856] p-5"><Target className="text-[#72a5ff]"/><div className="mt-4 font-black">Documento Norteador completo</div><p className="mt-1 text-xs leading-relaxed text-[#a9bddc]">Matriz oficial das Etapas 1, 2 e 3 usada como referência para esta área.</p></a>
        <a href={official2026Url} target="_blank" rel="noreferrer" className="rounded-[22px] border border-[#173765] bg-[#06152f] p-5"><FileCheck2 className="text-emerald-300"/><div className="mt-4 font-black">Edital 2026</div><p className="mt-1 text-xs leading-relaxed text-[#a9bddc]">Formato, distribuição de questões, pontuação e regras das Etapas 1 e 2 em 2026.</p></a>
        <a href={cyclePage} target="_blank" rel="noreferrer" className="rounded-[22px] border border-[#173765] bg-[#06152f] p-5"><Trophy className="text-amber-200"/><div className="mt-4 font-black">Ciclo 2025–2027</div><p className="mt-1 text-xs leading-relaxed text-[#a9bddc]">Calendário, estrutura das três etapas e acesso às provas oficiais publicadas.</p></a>
      </section>
    </main>
  </div>;
}
