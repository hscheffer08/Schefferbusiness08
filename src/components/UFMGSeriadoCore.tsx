import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileCheck2,
  FileText,
  GraduationCap,
  ListChecks,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import {
  UFMG_2026_DATES,
  UFMG_AUTHORED_QUESTIONS,
  UFMG_CONTENT_MAP,
  UFMG_DISCURSIVE_PROMPTS,
  UFMG_OFFICIAL_2025,
  UFMG_REQUIRED_WORKS,
  UFMG_STAGE_INFO,
  UFMG_WEEKLY_PLAN,
  type UFMGArea,
  type UFMGStageId,
} from '@/lib/ufmg-seriado-data';

type TabId = 'visao-geral' | 'prova-oficial' | 'treino-autoral' | 'conteudos' | 'plano';

const tabs: Array<{ id: TabId; label: string }> = [
  { id: 'visao-geral', label: 'Como funciona' },
  { id: 'prova-oficial', label: 'Prova oficial 2025' },
  { id: 'treino-autoral', label: 'Questões autorais' },
  { id: 'conteudos', label: 'Conteúdos e obras' },
  { id: 'plano', label: 'Plano de estudo' },
];

const officialPage = 'https://www.ufmg.br/seriadoufmg/';
const official2026Page = 'https://www.ufmg.br/seriadoufmg/prova-2026/';
const officialSchedulePage = 'https://www.ufmg.br/seriadoufmg/cronograma/';

function openExternal(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

function areaForOfficialQuestion(question: number): UFMGArea {
  if (question <= 14) return 'Linguagens';
  if (question <= 23) return 'Matemática';
  if (question <= 35) return 'Natureza';
  return 'Humanas';
}

const areaBadge: Record<UFMGArea, string> = {
  Linguagens: 'border-violet-300/20 bg-violet-300/10 text-violet-100',
  Matemática: 'border-cyan-300/20 bg-cyan-300/10 text-cyan-100',
  Natureza: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100',
  Humanas: 'border-amber-300/20 bg-amber-300/10 text-amber-100',
};

export default function UFMGSeriadoHub({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<TabId>('visao-geral');
  const [stage, setStage] = useState<UFMGStageId>('etapa1');
  const [officialAnswers, setOfficialAnswers] = useState<Record<number, string>>({});
  const [officialCorrected, setOfficialCorrected] = useState(false);
  const [areaFilter, setAreaFilter] = useState<'Todas' | UFMGArea>('Todas');
  const [authoredAnswers, setAuthoredAnswers] = useState<Record<string, number>>({});
  const [authoredCorrected, setAuthoredCorrected] = useState<Record<string, boolean>>({});
  const [completedWeeks, setCompletedWeeks] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('conectae:ufmg-weeks') ?? '[]') as number[];
    } catch {
      return [];
    }
  });

  const officialScore = useMemo(
    () => UFMG_OFFICIAL_2025.finalKey.reduce((total, answer, index) => total + (officialAnswers[index + 1] === answer ? 1 : 0), 0),
    [officialAnswers],
  );

  const officialByArea = useMemo(() => {
    const result: Record<UFMGArea, { correct: number; total: number }> = {
      Linguagens: { correct: 0, total: 14 },
      Matemática: { correct: 0, total: 9 },
      Natureza: { correct: 0, total: 12 },
      Humanas: { correct: 0, total: 10 },
    };
    UFMG_OFFICIAL_2025.finalKey.forEach((answer, index) => {
      const area = areaForOfficialQuestion(index + 1);
      if (officialAnswers[index + 1] === answer) result[area].correct += 1;
    });
    return result;
  }, [officialAnswers]);

  const filteredAuthored = useMemo(
    () => (areaFilter === 'Todas' ? UFMG_AUTHORED_QUESTIONS : UFMG_AUTHORED_QUESTIONS.filter((q) => q.area === areaFilter)),
    [areaFilter],
  );

  const authoredAnswered = Object.keys(authoredAnswers).length;
  const authoredCorrect = UFMG_AUTHORED_QUESTIONS.reduce(
    (total, question) => total + (authoredCorrected[question.id] && authoredAnswers[question.id] === question.answer ? 1 : 0),
    0,
  );

  const toggleWeek = (week: number) => {
    const next = completedWeeks.includes(week)
      ? completedWeeks.filter((value) => value !== week)
      : [...completedWeeks, week];
    setCompletedWeeks(next);
    localStorage.setItem('conectae:ufmg-weeks', JSON.stringify(next));
  };

  const resetOfficial = () => {
    setOfficialAnswers({});
    setOfficialCorrected(false);
  };

  const requiredWorks = stage === 'etapa2' ? UFMG_REQUIRED_WORKS.etapa2 : UFMG_REQUIRED_WORKS.etapa1;

  return (
    <div className="min-h-screen bg-[#020817] text-white font-['Plus_Jakarta_Sans']">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#020817]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-8">
          <button onClick={onBack} className="inline-flex items-center gap-2 rounded-xl border border-[#173765] bg-[#06152f] px-3 py-2 text-sm font-extrabold text-[#c4d4ea] hover:border-[#31588e]">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
          <div className="min-w-0 text-center">
            <div className="text-xs font-black uppercase tracking-[.16em] text-[#72a5ff]">Conectaê • Curso</div>
            <div className="truncate text-base font-black md:text-lg">Seriado UFMG</div>
          </div>
          <button onClick={() => openExternal(officialPage)} className="inline-flex items-center gap-2 rounded-xl bg-[#246cff] px-3 py-2 text-xs font-black hover:bg-[#3678ff] md:text-sm">
            UFMG <ExternalLink className="h-4 w-4" />
          </button>
        </div>
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3 md:px-8">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs font-extrabold transition md:text-sm ${tab === item.id ? 'bg-[#246cff] text-white' : 'border border-[#173765] bg-[#06152f] text-[#9fb5d4] hover:text-white'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        {tab === 'visao-geral' && (
          <div className="space-y-8">
            <section className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
              <div className="rounded-[28px] border border-[#173765] bg-gradient-to-br from-[#0b2856] to-[#06152f] p-6 md:p-8">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-black text-emerald-200">
                  <Sparkles className="h-4 w-4" /> Preparação completa adicionada ao curso
                </div>
                <h1 className="mt-5 text-4xl font-black tracking-[-.05em] md:text-6xl">Treine para o <span className="text-[#72a5ff]">Seriado UFMG.</span></h1>
                <p className="mt-5 max-w-3xl text-base leading-relaxed text-[#b4c6df] md:text-lg">
                  Estrutura das três etapas, prova oficial mais recente, gabarito interativo, treino autoral, questão discursiva, conteúdos, obras e plano de estudo no mesmo lugar.
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <button onClick={() => setTab('prova-oficial')} className="inline-flex items-center gap-2 rounded-2xl bg-[#246cff] px-5 py-3 text-sm font-black hover:bg-[#3678ff]">
                    <FileCheck2 className="h-5 w-5" /> Fazer prova oficial 2025
                  </button>
                  <button onClick={() => setTab('treino-autoral')} className="inline-flex items-center gap-2 rounded-2xl border border-[#31588e] bg-[#06152f] px-5 py-3 text-sm font-black hover:border-[#72a5ff]">
                    <ListChecks className="h-5 w-5" /> Treinar questões autorais
                  </button>
                </div>
              </div>
              <div className="rounded-[28px] border border-[#173765] bg-[#06152f] p-6 md:p-7">
                <div className="flex items-center gap-3"><CalendarDays className="h-6 w-6 text-[#72a5ff]" /><h2 className="text-xl font-black">Datas 2026</h2></div>
                <div className="mt-5 space-y-3">
                  {UFMG_2026_DATES.map((date) => (
                    <div key={date.label} className="rounded-2xl border border-[#173765] bg-[#041027] p-4">
                      <div className="text-xs font-bold text-[#839ab9]">{date.label}</div>
                      <div className="mt-1 font-black">{date.value}</div>
                    </div>
                  ))}
                </div>
                <button onClick={() => openExternal(officialSchedulePage)} className="mt-4 inline-flex items-center gap-2 text-sm font-black text-[#72a5ff]">Ver cronograma oficial <ExternalLink className="h-4 w-4" /></button>
              </div>
            </section>

            <section>
              <div className="flex items-end justify-between gap-4"><div><div className="text-xs font-black uppercase tracking-[.16em] text-[#72a5ff]">Formato oficial</div><h2 className="mt-2 text-3xl font-black">As três etapas</h2></div><button onClick={() => openExternal(official2026Page)} className="hidden items-center gap-2 text-sm font-black text-[#72a5ff] md:inline-flex">Fonte UFMG <ExternalLink className="h-4 w-4" /></button></div>
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                {UFMG_STAGE_INFO.map((item) => (
                  <article key={item.id} className="rounded-[24px] border border-[#173765] bg-[#06152f] p-5">
                    <div className="flex items-center justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#246cff]/15 text-[#72a5ff]"><GraduationCap className="h-5 w-5" /></span><span className="rounded-full border border-[#31588e] px-2.5 py-1 text-[11px] font-black text-[#a9c7ef]">{item.weight}</span></div>
                    <h3 className="mt-4 text-2xl font-black">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#9fb5d4]">{item.content}</p>
                    <div className="mt-4 rounded-xl bg-[#041027] p-3 text-sm leading-relaxed text-[#c4d4ea]">{item.format}</div>
                  </article>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] border border-emerald-300/15 bg-emerald-300/[.05] p-6 md:p-8">
              <div className="grid gap-5 md:grid-cols-3">
                <div><div className="text-4xl font-black text-emerald-200">30%</div><div className="mt-1 text-sm font-bold text-[#a9bddc]">das vagas iniciais por curso serão destinadas ao Seriado a partir do ingresso de 2028.</div></div>
                <div><div className="text-4xl font-black text-emerald-200">3 anos</div><div className="mt-1 text-sm font-bold text-[#a9bddc]">com uma etapa por ano e conteúdo progressivamente cumulativo.</div></div>
                <div><div className="text-4xl font-black text-emerald-200">0 corte</div><div className="mt-1 text-sm font-bold text-[#a9bddc]">não há nota mínima na Etapa 1 para poder seguir para as etapas seguintes.</div></div>
              </div>
            </section>
          </div>
        )}

        {tab === 'prova-oficial' && (
          <div className="space-y-6">
            <section className="rounded-[28px] border border-[#173765] bg-[#06152f] p-5 md:p-7">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-xs font-black uppercase tracking-[.16em] text-emerald-300">Última prova oficial disponível</div>
                  <h1 className="mt-2 text-3xl font-black">{UFMG_OFFICIAL_2025.label}</h1>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-[#a9bddc]">
                    <span className="rounded-full border border-[#31588e] px-3 py-1.5">45 objetivas</span>
                    <span className="rounded-full border border-[#31588e] px-3 py-1.5">1 discursiva</span>
                    <span className="rounded-full border border-[#31588e] px-3 py-1.5">4 horas</span>
                    <span className="rounded-full border border-[#31588e] px-3 py-1.5">4 alternativas por questão</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => openExternal(UFMG_OFFICIAL_2025.examUrl)} className="inline-flex items-center gap-2 rounded-xl bg-[#246cff] px-4 py-3 text-sm font-black"><FileText className="h-4 w-4" /> Abrir caderno oficial</button>
                  <button onClick={() => openExternal(UFMG_OFFICIAL_2025.finalKeyUrl)} className="inline-flex items-center gap-2 rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-3 text-sm font-black text-emerald-100"><FileCheck2 className="h-4 w-4" /> Gabarito final UFMG</button>
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
              <div className="overflow-hidden rounded-[24px] border border-[#173765] bg-white">
                <div className="flex items-center justify-between bg-[#071a38] px-4 py-3 text-white"><div className="text-sm font-black">Caderno oficial UFMG</div><div className="inline-flex items-center gap-1 text-xs font-bold text-[#a9bddc]"><Clock3 className="h-4 w-4" /> Meta: 4h</div></div>
                <iframe title="Prova oficial Seriado UFMG 2025" src={UFMG_OFFICIAL_2025.examUrl} className="h-[72vh] min-h-[620px] w-full bg-white" />
              </div>

              <div className="space-y-4">
                <div className="rounded-[24px] border border-[#173765] bg-[#06152f] p-5">
                  <div className="flex items-center justify-between gap-3"><div><div className="text-xs font-black uppercase tracking-[.14em] text-[#72a5ff]">Folha de respostas</div><h2 className="mt-1 text-xl font-black">Marque enquanto resolve</h2></div><button onClick={resetOfficial} className="rounded-xl border border-[#31588e] p-2 text-[#9fb5d4] hover:text-white"><RotateCcw className="h-4 w-4" /></button></div>
                  <div className="mt-5 grid grid-cols-5 gap-2 sm:grid-cols-9 xl:grid-cols-5 2xl:grid-cols-9">
                    {Array.from({ length: 45 }, (_, index) => index + 1).map((number) => (
                      <div key={number} className="rounded-xl border border-[#173765] bg-[#041027] p-2 text-center">
                        <div className="mb-1.5 text-[10px] font-black text-[#839ab9]">{number}</div>
                        <div className="flex justify-center gap-1">
                          {['A','B','C','D'].map((letter) => {
                            const selected = officialAnswers[number] === letter;
                            const correct = officialCorrected && UFMG_OFFICIAL_2025.finalKey[number - 1] === letter;
                            const wrong = officialCorrected && selected && !correct;
                            return (
                              <button
                                key={letter}
                                onClick={() => { setOfficialAnswers((current) => ({ ...current, [number]: letter })); setOfficialCorrected(false); }}
                                className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-black transition ${correct ? 'bg-emerald-500 text-white' : wrong ? 'bg-rose-500 text-white' : selected ? 'bg-[#246cff] text-white' : 'bg-[#0a2045] text-[#a9bddc] hover:bg-[#123266]'}`}
                              >
                                {letter}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setOfficialCorrected(true)} className="mt-5 w-full rounded-2xl bg-emerald-500 px-4 py-3.5 text-sm font-black text-[#02120b] hover:bg-emerald-400">Corrigir pelo gabarito final</button>
                </div>

                {officialCorrected && (
                  <div className="rounded-[24px] border border-emerald-300/20 bg-emerald-300/[.07] p-5">
                    <div className="flex items-end justify-between"><div><div className="text-xs font-black uppercase tracking-[.14em] text-emerald-200">Objetivas</div><div className="mt-1 text-4xl font-black">{officialScore}/45</div></div><div className="text-2xl font-black text-emerald-200">{Math.round((officialScore / 45) * 100)}%</div></div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-2">
                      {(Object.entries(officialByArea) as Array<[UFMGArea, { correct: number; total: number }]>).map(([area, score]) => (
                        <div key={area} className="rounded-xl bg-[#041027] p-3"><div className="text-xs font-bold text-[#839ab9]">{area}</div><div className="mt-1 font-black">{score.correct}/{score.total} • {Math.round((score.correct / score.total) * 100)}%</div></div>
                      ))}
                    </div>
                    <p className="mt-4 text-xs leading-relaxed text-[#a9bddc]">A questão discursiva da Etapa 1 vale 4 pontos na prova original. O total bruto de 49 pontos é convertido pela UFMG para a escala de 0 a 100.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {tab === 'treino-autoral' && (
          <div className="space-y-6">
            <section className="rounded-[28px] border border-[#173765] bg-gradient-to-br from-[#0b2856] to-[#06152f] p-6 md:p-8">
              <div className="text-xs font-black uppercase tracking-[.16em] text-[#72a5ff]">Banco autoral Conectaê</div>
              <h1 className="mt-2 text-4xl font-black tracking-tight">24 questões + 4 discursivas</h1>
              <p className="mt-3 max-w-3xl text-[#b4c6df]">Questões inéditas alinhadas às quatro áreas e ao foco interdisciplinar do Seriado. As questões abaixo não são questões oficiais da UFMG.</p>
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {(['Todas','Linguagens','Matemática','Natureza','Humanas'] as const).map((area) => (
                  <button key={area} onClick={() => setAreaFilter(area)} className={`rounded-full px-3 py-2 text-xs font-black ${areaFilter === area ? 'bg-[#246cff] text-white' : 'border border-[#31588e] bg-[#06152f] text-[#a9bddc]'}`}>{area}</button>
                ))}
                <span className="ml-auto text-xs font-bold text-[#9fb5d4]">Respondidas: {authoredAnswered}/24 • Corretas já corrigidas: {authoredCorrect}</span>
              </div>
            </section>

            <div className="space-y-4">
              {filteredAuthored.map((question, index) => {
                const selected = authoredAnswers[question.id];
                const corrected = authoredCorrected[question.id] ?? false;
                const correct = selected === question.answer;
                return (
                  <article key={question.id} className="rounded-[24px] border border-[#173765] bg-[#06152f] p-5 md:p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${areaBadge[question.area]}`}>{question.area}</span>
                      <span className="text-xs font-bold text-[#839ab9]">{question.subject} • {question.topic}</span>
                      <span className="ml-auto text-xs font-black text-[#637b9c]">Q{String(UFMG_AUTHORED_QUESTIONS.indexOf(question) + 1).padStart(2, '0')}</span>
                    </div>
                    <h2 className="mt-4 text-base font-bold leading-relaxed md:text-lg">{question.prompt}</h2>
                    <div className="mt-4 grid gap-2">
                      {question.options.map((option, optionIndex) => {
                        const isSelected = selected === optionIndex;
                        const isAnswer = corrected && optionIndex === question.answer;
                        const isWrong = corrected && isSelected && optionIndex !== question.answer;
                        return (
                          <button
                            key={`${question.id}-${optionIndex}`}
                            onClick={() => { setAuthoredAnswers((current) => ({ ...current, [question.id]: optionIndex })); setAuthoredCorrected((current) => ({ ...current, [question.id]: false })); }}
                            className={`flex items-start gap-3 rounded-2xl border p-3.5 text-left text-sm transition ${isAnswer ? 'border-emerald-300/50 bg-emerald-300/10 text-emerald-50' : isWrong ? 'border-rose-300/40 bg-rose-300/10 text-rose-50' : isSelected ? 'border-[#72a5ff] bg-[#246cff]/15 text-white' : 'border-[#173765] bg-[#041027] text-[#c4d4ea] hover:border-[#31588e]'}`}
                          >
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0b2856] font-black">{String.fromCharCode(65 + optionIndex)}</span>
                            <span className="pt-1">{option}</span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <button disabled={selected === undefined} onClick={() => setAuthoredCorrected((current) => ({ ...current, [question.id]: true }))} className="rounded-xl bg-[#246cff] px-4 py-2.5 text-xs font-black disabled:cursor-not-allowed disabled:opacity-40">Corrigir questão</button>
                      {corrected && <span className={`inline-flex items-center gap-1.5 text-sm font-black ${correct ? 'text-emerald-300' : 'text-rose-300'}`}>{correct ? <CheckCircle2 className="h-4 w-4" /> : null}{correct ? 'Acertou' : `Resposta correta: ${String.fromCharCode(65 + question.answer)}`}</span>}
                    </div>
                    {corrected && <div className="mt-4 rounded-xl border border-[#173765] bg-[#041027] p-4 text-sm leading-relaxed text-[#b4c6df]"><span className="font-black text-white">Explicação: </span>{question.explanation}</div>}
                  </article>
                );
              })}
            </div>

            <section>
              <div className="mb-4"><div className="text-xs font-black uppercase tracking-[.16em] text-[#72a5ff]">Treino aberto</div><h2 className="mt-2 text-3xl font-black">Questões discursivas interdisciplinares</h2></div>
              <div className="grid gap-4 lg:grid-cols-2">
                {UFMG_DISCURSIVE_PROMPTS.map((question) => (
                  <article key={question.id} className="rounded-[24px] border border-[#173765] bg-[#06152f] p-5">
                    <div className="text-xs font-black text-[#72a5ff]">{question.id.toUpperCase()}</div>
                    <h3 className="mt-2 text-xl font-black">{question.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#c4d4ea]">{question.prompt}</p>
                    <div className="mt-4 rounded-2xl bg-[#041027] p-4"><div className="text-xs font-black uppercase tracking-[.12em] text-[#839ab9]">Checklist de autocorreção</div><ul className="mt-3 space-y-2">{question.checklist.map((item) => <li key={item} className="flex gap-2 text-xs leading-relaxed text-[#a9bddc]"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />{item}</li>)}</ul></div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        )}

        {tab === 'conteudos' && (
          <div className="space-y-7">
            <section className="rounded-[28px] border border-[#173765] bg-[#06152f] p-6 md:p-8">
              <div className="text-xs font-black uppercase tracking-[.16em] text-[#72a5ff]">Matriz de estudo</div>
              <h1 className="mt-2 text-4xl font-black">O que estudar</h1>
              <p className="mt-3 max-w-3xl text-[#a9bddc]">O Seriado se apoia na BNCC e no Currículo Referência de Minas Gerais. A Etapa 2 é cumulativa da 1ª e 2ª séries; a Etapa 3 acumula as três séries.</p>
              <div className="mt-5 flex flex-wrap gap-2">{UFMG_STAGE_INFO.map((item) => <button key={item.id} onClick={() => setStage(item.id)} className={`rounded-xl px-4 py-2 text-sm font-black ${stage === item.id ? 'bg-[#246cff]' : 'border border-[#31588e] bg-[#041027] text-[#a9bddc]'}`}>{item.title}</button>)}</div>
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
              {UFMG_CONTENT_MAP.map((group) => (
                <article key={group.area} className="rounded-[24px] border border-[#173765] bg-[#06152f] p-5 md:p-6">
                  <div className="flex items-center gap-3"><span className={`rounded-full border px-3 py-1 text-xs font-black ${areaBadge[group.area as UFMGArea]}`}>{group.area}</span></div>
                  <ul className="mt-4 space-y-3">{group.subjects.map((subject) => <li key={subject} className="flex gap-3 text-sm leading-relaxed text-[#b4c6df]"><ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[#72a5ff]" />{subject}</li>)}</ul>
                </article>
              ))}
            </div>

            {stage !== 'etapa3' && (
              <section className="rounded-[28px] border border-amber-300/15 bg-amber-300/[.05] p-6 md:p-8">
                <div className="flex items-center gap-3"><BookOpen className="h-6 w-6 text-amber-200" /><div><div className="text-xs font-black uppercase tracking-[.14em] text-amber-200">Obras indicadas para 2026</div><h2 className="mt-1 text-2xl font-black">{stage === 'etapa1' ? 'Etapa 1 • ciclo 2026–2028' : 'Etapa 2 • ciclo 2025–2027'}</h2></div></div>
                <div className="mt-5 grid gap-3 lg:grid-cols-3">{requiredWorks.map((work) => <article key={work.title} className="rounded-2xl border border-amber-200/10 bg-[#041027] p-4"><div className="text-[11px] font-black uppercase tracking-[.12em] text-amber-200">{work.type}</div><div className="mt-2 font-black">{work.title}</div><div className="mt-1 text-sm text-[#9fb5d4]">{work.author}</div></article>)}</div>
                <p className="mt-4 text-xs leading-relaxed text-[#9fb5d4]">A UFMG não define previamente uma quantidade fixa de questões sobre as obras. O estudo deve priorizar compreensão, contexto, linguagem, temas e relações interdisciplinares.</p>
              </section>
            )}

            {stage === 'etapa3' && (
              <section className="rounded-[28px] border border-[#173765] bg-[#06152f] p-6 md:p-8">
                <div className="text-xs font-black uppercase tracking-[.14em] text-[#72a5ff]">Atenção na Etapa 3</div>
                <h2 className="mt-2 text-2xl font-black">O segundo dia depende do curso escolhido</h2>
                <p className="mt-3 text-sm leading-relaxed text-[#b4c6df]">A preparação final precisa priorizar a uma ou duas áreas definidas para o curso. O Dia 2 terá até 8 questões discursivas e vale 30% da nota global, o maior peso individual do ciclo.</p>
              </section>
            )}
          </div>
        )}

        {tab === 'plano' && (
          <div className="space-y-6">
            <section className="rounded-[28px] border border-[#173765] bg-gradient-to-br from-[#0b2856] to-[#06152f] p-6 md:p-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div><div className="text-xs font-black uppercase tracking-[.16em] text-[#72a5ff]">Reta de preparação</div><h1 className="mt-2 text-4xl font-black">Plano de 8 semanas</h1><p className="mt-3 max-w-2xl text-[#b4c6df]">Use como ciclo-base e repita com nível maior de dificuldade. As semanas marcadas ficam salvas neste dispositivo.</p></div>
                <div className="rounded-2xl border border-[#31588e] bg-[#041027] px-5 py-4"><div className="text-xs font-bold text-[#839ab9]">Progresso</div><div className="mt-1 text-3xl font-black">{completedWeeks.length}/8</div></div>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-[#041027]"><div className="h-full rounded-full bg-[#246cff] transition-all" style={{ width: `${(completedWeeks.length / 8) * 100}%` }} /></div>
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
              {UFMG_WEEKLY_PLAN.map((item) => {
                const done = completedWeeks.includes(item.week);
                return (
                  <article key={item.week} className={`rounded-[24px] border p-5 transition ${done ? 'border-emerald-300/30 bg-emerald-300/[.06]' : 'border-[#173765] bg-[#06152f]'}`}>
                    <div className="flex items-start gap-4">
                      <button onClick={() => toggleWeek(item.week)} className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${done ? 'border-emerald-300/40 bg-emerald-400 text-[#02120b]' : 'border-[#31588e] bg-[#041027] text-[#72a5ff]'}`}>{done ? <CheckCircle2 className="h-5 w-5" /> : <span className="font-black">{item.week}</span>}</button>
                      <div className="min-w-0"><div className="text-xs font-black uppercase tracking-[.12em] text-[#839ab9]">Semana {item.week}</div><h2 className="mt-1 text-xl font-black">{item.title}</h2><ul className="mt-3 space-y-2">{item.tasks.map((task) => <li key={task} className="flex gap-2 text-sm text-[#b4c6df]"><Target className="mt-0.5 h-4 w-4 shrink-0 text-[#72a5ff]" />{task}</li>)}</ul></div>
                    </div>
                  </article>
                );
              })}
            </div>

            <section className="grid gap-4 md:grid-cols-3">
              <button onClick={() => setTab('prova-oficial')} className="rounded-[24px] border border-[#31588e] bg-[#0b2856] p-5 text-left"><Trophy className="h-6 w-6 text-[#72a5ff]" /><div className="mt-4 font-black">Simulado oficial</div><div className="mt-1 text-sm text-[#a9bddc]">Use a prova real de 2025 como diagnóstico e simulado de 4 horas.</div></button>
              <button onClick={() => setTab('treino-autoral')} className="rounded-[24px] border border-[#173765] bg-[#06152f] p-5 text-left"><ListChecks className="h-6 w-6 text-emerald-300" /><div className="mt-4 font-black">Blocos de questões</div><div className="mt-1 text-sm text-[#a9bddc]">Treine por área, corrija na hora e registre os erros que precisam voltar ao plano.</div></button>
              <button onClick={() => setTab('conteudos')} className="rounded-[24px] border border-[#173765] bg-[#06152f] p-5 text-left"><BookOpen className="h-6 w-6 text-amber-200" /><div className="mt-4 font-black">Conteúdo + obras</div><div className="mt-1 text-sm text-[#a9bddc]">Confira a matriz por área e as obras indicadas para a etapa de 2026.</div></button>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
