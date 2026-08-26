import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BrainCircuit, Check, ChevronDown, ChevronUp, Compass, ExternalLink, FlaskConical, RotateCcw, Sparkles, Target } from 'lucide-react';
import { DIMENSION_LABELS, DIMENSION_WEIGHTS, VOCATIONAL_COURSES, VOCATIONAL_QUESTIONS, VOCATIONAL_SOURCES, type VocationalCourse, type VocationalDimension } from '@/lib/vocational-data';
import { trackEvent } from '@/lib/analytics';

interface VocationalDemoProps {
  onBack: () => void;
}

type Answers = Record<string, number>;
type Phase = 'intro' | 'quiz' | 'results';

const SCALE = [
  { value: 0, label: 'Nada a ver comigo' },
  { value: 1, label: 'Pouco a ver' },
  { value: 2, label: 'Mais ou menos' },
  { value: 3, label: 'Bastante a ver' },
  { value: 4, label: 'Muito a ver comigo' },
];

function calculateProfile(answers: Answers): Record<VocationalDimension, number> {
  const sums = {} as Record<VocationalDimension, number>;
  const weights = {} as Record<VocationalDimension, number>;
  (Object.keys(DIMENSION_LABELS) as VocationalDimension[]).forEach((key) => {
    sums[key] = 0;
    weights[key] = 0;
  });

  VOCATIONAL_QUESTIONS.forEach((question) => {
    const answer = answers[question.id];
    if (answer === undefined) return;
    const normalized = answer * 25;
    (Object.entries(question.dimensions) as [VocationalDimension, number][]).forEach(([dimension, weight]) => {
      sums[dimension] += normalized * weight;
      weights[dimension] += weight;
    });
  });

  const result = {} as Record<VocationalDimension, number>;
  (Object.keys(DIMENSION_LABELS) as VocationalDimension[]).forEach((key) => {
    result[key] = weights[key] ? Math.round(sums[key] / weights[key]) : 50;
  });
  return result;
}

function courseScore(profile: Record<VocationalDimension, number>, course: VocationalCourse): number {
  let weightedFit = 0;
  let totalWeight = 0;
  (Object.keys(DIMENSION_LABELS) as VocationalDimension[]).forEach((dimension) => {
    const weight = DIMENSION_WEIGHTS[dimension];
    const difference = Math.abs(profile[dimension] - course.profile[dimension]);
    weightedFit += Math.max(0, 100 - difference) * weight;
    totalWeight += weight;
  });
  return Math.round(weightedFit / totalWeight);
}

function topAlignedDimensions(profile: Record<VocationalDimension, number>, course: VocationalCourse) {
  return (Object.keys(DIMENSION_LABELS) as VocationalDimension[])
    .map((dimension) => ({
      dimension,
      strength: (profile[dimension] + course.profile[dimension]) / 2,
      distance: Math.abs(profile[dimension] - course.profile[dimension]),
    }))
    .filter((item) => item.strength >= 55)
    .sort((a, b) => (a.distance - b.distance) || (b.strength - a.strength))
    .slice(0, 3);
}

export default function VocationalDemo({ onBack }: VocationalDemoProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [showAll, setShowAll] = useState(false);

  const profile = useMemo(() => calculateProfile(answers), [answers]);
  const ranking = useMemo(
    () => VOCATIONAL_COURSES
      .map((course) => ({ course, score: courseScore(profile, course) }))
      .sort((a, b) => b.score - a.score),
    [profile]
  );

  const current = VOCATIONAL_QUESTIONS[step];
  const answered = current ? answers[current.id] !== undefined : false;
  const progress = ((step + (answered ? 1 : 0)) / VOCATIONAL_QUESTIONS.length) * 100;

  const start = () => {
    setPhase('quiz');
    trackEvent('vocational_demo_started', { question_count: VOCATIONAL_QUESTIONS.length, course_count: VOCATIONAL_COURSES.length });
  };

  const selectAnswer = (value: number) => {
    setAnswers((prev) => ({ ...prev, [current.id]: value }));
  };

  const next = () => {
    if (!answered) return;
    if (step === VOCATIONAL_QUESTIONS.length - 1) {
      setPhase('results');
      trackEvent('vocational_demo_completed', { top_course: ranking[0]?.course.name, top_score: ranking[0]?.score });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setStep((value) => value + 1);
  };

  const previous = () => {
    if (step === 0) {
      setPhase('intro');
      return;
    }
    setStep((value) => value - 1);
  };

  const restart = () => {
    setAnswers({});
    setStep(0);
    setShowAll(false);
    setPhase('intro');
  };

  if (phase === 'intro') {
    return (
      <div className="min-h-screen relative overflow-hidden px-6 py-8 md:py-12">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-brand-500/15 blur-[130px]" />
          <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-accent-500/10 blur-[130px]" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto">
          <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-ink-400 hover:text-ink-100 transition-colors mb-10">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-sm font-semibold mb-5">
              <Sparkles className="w-4 h-4" /> DEMO · Brasil
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-5">
              Exploração <span className="gradient-text font-serif italic">Vocacional</span>
            </h1>
            <p className="text-lg md:text-xl text-ink-400 leading-relaxed mb-8">
              Um questionário exploratório que cruza seus interesses, aptidões percebidas, valores e preferências de ambiente com uma base de 30 cursos de alta procura e relevância no Brasil.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <InfoCard icon={<Compass className="w-5 h-5" />} title="36 perguntas" text="Interesses, estilo de trabalho, aptidões percebidas e valores profissionais." />
            <InfoCard icon={<BrainCircuit className="w-5 h-5" />} title="12 dimensões" text="Inclui a lógica RIASEC/Holland e sinais acadêmicos e ocupacionais adicionais." />
            <InfoCard icon={<Target className="w-5 h-5" />} title="30 cursos" text="Saúde, negócios, tecnologia, engenharia, comunicação, educação e humanidades." />
          </div>

          <div className="glass rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5 mb-8 max-w-4xl">
            <h2 className="font-bold text-amber-200 mb-2">Importante: isto não é um teste psicológico</h2>
            <p className="text-sm text-ink-300 leading-relaxed">
              Esta ferramenta é uma demo de exploração educacional. No Brasil, testes psicológicos e avaliação psicológica são atividades regulamentadas e o uso profissional de testes psicológicos é privativo de psicólogas(os). O resultado abaixo não diagnostica personalidade, aptidão, saúde mental nem determina qual profissão você “deve” escolher.
            </p>
          </div>

          <div className="glass rounded-2xl border border-ink-800 p-6 md:p-7 max-w-4xl mb-8">
            <div className="flex items-center gap-2 mb-4">
              <FlaskConical className="w-5 h-5 text-accent-400" />
              <h2 className="font-bold text-lg">Como a demo foi construída</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-3 text-sm text-ink-400 leading-relaxed">
              <p><strong className="text-ink-200">Interesses:</strong> atividades e temas que naturalmente atraem sua atenção.</p>
              <p><strong className="text-ink-200">Autoeficácia percebida:</strong> em quais tipos de tarefa você sente maior facilidade ou confiança.</p>
              <p><strong className="text-ink-200">Valores:</strong> impacto, liderança, especialização, criatividade, estabilidade e outros motivadores.</p>
              <p><strong className="text-ink-200">Ambiente:</strong> intensidade de contato humano, prática, tecnologia, precisão e análise.</p>
            </div>
          </div>

          <button onClick={start} className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-brand-500 hover:bg-brand-400 text-white font-bold shadow-xl shadow-brand-500/20 transition-all hover:scale-[1.01] active:scale-95">
            Começar a Demo Vocacional <ArrowRight className="w-5 h-5" />
          </button>

          <div className="mt-12 border-t border-ink-800 pt-7">
            <p className="text-xs uppercase tracking-widest text-ink-600 font-bold mb-3">Bases consultadas</p>
            <div className="flex flex-wrap gap-2">
              {VOCATIONAL_SOURCES.map((source) => (
                <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ink-900 border border-ink-800 text-xs text-ink-400 hover:text-ink-200 hover:border-ink-700 transition-colors">
                  {source.label} <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'quiz' && current) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden">
        <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12">
          <button onClick={previous} className="inline-flex items-center gap-2 text-sm text-ink-400 hover:text-ink-100 transition-colors">
            <ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Introdução' : 'Voltar'}
          </button>
          <span className="text-sm text-ink-500">{step + 1} / {VOCATIONAL_QUESTIONS.length}</span>
        </header>

        <div className="px-6 md:px-12 mb-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-between text-xs text-ink-500 mb-2"><span>{current.group}</span><span>{Math.round(progress)}%</span></div>
            <div className="h-1.5 bg-ink-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-brand-500 to-accent-400 transition-all" style={{ width: `${progress}%` }} /></div>
          </div>
        </div>

        <main className="relative z-10 flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-2xl animate-fade-up" key={current.id}>
            <span className="inline-flex px-3 py-1 rounded-full bg-ink-800 text-xs text-ink-400 mb-4">{current.group}</span>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight mb-3">{current.text}</h1>
            {current.helper && <p className="text-sm text-ink-500 mb-6">{current.helper}</p>}
            <p className="text-sm text-ink-500 mb-4">Quanto esta frase combina com você?</p>
            <div className="space-y-2.5">
              {SCALE.map((option) => {
                const active = answers[current.id] === option.value;
                return (
                  <button key={option.value} onClick={() => selectAnswer(option.value)} className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${active ? 'border-brand-400 bg-brand-500/15 text-ink-50' : 'border-ink-800 bg-ink-900/50 hover:border-ink-700 hover:bg-ink-900 text-ink-300'}`}>
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${active ? 'bg-brand-500 text-white' : 'bg-ink-800 text-ink-400'}`}>{option.value + 1}</span>
                    <span className="font-medium flex-1">{option.label}</span>
                    {active && <Check className="w-5 h-5 text-brand-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </main>

        <footer className="relative z-10 px-6 pb-10">
          <div className="max-w-2xl mx-auto">
            <button onClick={next} disabled={!answered} className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-2xl bg-brand-500 hover:bg-brand-400 disabled:bg-ink-800 disabled:text-ink-600 disabled:cursor-not-allowed text-white font-bold transition-all">
              {step === VOCATIONAL_QUESTIONS.length - 1 ? 'Ver meus cursos' : 'Próxima'} <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </footer>
      </div>
    );
  }

  const topDimensions = (Object.entries(profile) as [VocationalDimension, number][]).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const visibleRanking = showAll ? ranking : ranking.slice(0, 5);

  return (
    <div className="min-h-screen px-6 py-8 md:py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-8">
          <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-ink-400 hover:text-ink-100"><ArrowLeft className="w-4 h-4" /> Início</button>
          <button onClick={restart} className="inline-flex items-center gap-2 text-sm text-ink-400 hover:text-ink-100"><RotateCcw className="w-4 h-4" /> Refazer</button>
        </div>

        <div className="max-w-3xl mb-10">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-sm font-semibold mb-4"><Sparkles className="w-4 h-4" /> Resultado da Demo</span>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Seu mapa de interesses aponta para...</h1>
          <p className="text-ink-400 text-lg leading-relaxed">Este ranking compara seu padrão de respostas com 30 perfis de curso. Use-o para gerar hipóteses, pesquisar grades curriculares e conversar com estudantes/profissionais — não como uma sentença definitiva.</p>
        </div>

        <div className="grid lg:grid-cols-[0.9fr_1.4fr] gap-6 mb-10">
          <section className="glass rounded-2xl border border-ink-800 p-6">
            <h2 className="font-bold text-lg mb-5">Seus sinais mais fortes</h2>
            <div className="space-y-4">
              {topDimensions.map(([dimension, value]) => (
                <div key={dimension}>
                  <div className="flex justify-between gap-3 text-sm mb-1.5"><span className="text-ink-300">{DIMENSION_LABELS[dimension]}</span><span className="font-bold text-ink-200">{value}</span></div>
                  <div className="h-2 rounded-full bg-ink-800 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400" style={{ width: `${value}%` }} /></div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-brand-500/35 bg-gradient-to-br from-brand-500/10 via-ink-900 to-accent-500/5 p-6 md:p-7">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div><p className="text-xs uppercase tracking-widest text-brand-300 font-bold mb-1">#1 maior compatibilidade exploratória</p><h2 className="text-2xl md:text-3xl font-bold">{ranking[0].course.name}</h2><p className="text-sm text-ink-400 mt-1">{ranking[0].course.area} · {ranking[0].course.duration}</p></div>
              <div className="w-20 h-20 rounded-2xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center"><span className="text-2xl font-extrabold text-brand-300">{ranking[0].score}%</span></div>
            </div>
            <p className="text-ink-300 leading-relaxed mb-5">{ranking[0].course.summary}</p>
            <div className="flex flex-wrap gap-2">
              {topAlignedDimensions(profile, ranking[0].course).map(({ dimension }) => <span key={dimension} className="px-3 py-1.5 rounded-full bg-ink-800 text-xs text-ink-300">{DIMENSION_LABELS[dimension]}</span>)}
            </div>
          </section>
        </div>

        <section className="mb-10">
          <div className="flex items-end justify-between gap-4 mb-5"><div><p className="text-xs uppercase tracking-widest text-ink-600 font-bold">Ranking</p><h2 className="text-2xl font-bold">Cursos mais alinhados</h2></div><span className="text-xs text-ink-600">Base: {VOCATIONAL_COURSES.length} cursos</span></div>
          <div className="space-y-4">
            {visibleRanking.map(({ course, score }, index) => <CourseCard key={course.id} course={course} score={score} rank={index + 1} profile={profile} />)}
          </div>
          <button onClick={() => setShowAll((value) => !value)} className="mt-5 w-full py-3 rounded-xl border border-ink-800 bg-ink-900 hover:border-ink-700 text-sm font-semibold text-ink-300 inline-flex items-center justify-center gap-2">
            {showAll ? <>Mostrar apenas Top 5 <ChevronUp className="w-4 h-4" /></> : <>Ver ranking completo dos 30 cursos <ChevronDown className="w-4 h-4" /></>}
          </button>
        </section>

        <section className="glass rounded-2xl border border-ink-800 p-6 mb-8">
          <h2 className="font-bold text-lg mb-3">Como usar este resultado de forma inteligente</h2>
          <p className="text-sm text-ink-400 leading-relaxed">Compare os 3–5 primeiros cursos, abra as grades curriculares de universidades diferentes, observe quais matérias aparecem repetidamente, converse com alunos e profissionais, e procure experiências pequenas antes de decidir: curso de férias, projeto, voluntariado, shadowing, evento, visita a laboratório ou conversa informacional. A escolha profissional também depende de contexto familiar, financeiro, geográfico e de oportunidades — fatores que um questionário online não captura completamente.</p>
        </section>

        <div className="flex flex-wrap gap-2">
          {VOCATIONAL_SOURCES.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ink-900 border border-ink-800 text-xs text-ink-500 hover:text-ink-300">{source.label}<ExternalLink className="w-3 h-3" /></a>)}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="glass rounded-2xl border border-ink-800 p-5"><div className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-400 flex items-center justify-center mb-3">{icon}</div><h3 className="font-bold mb-1">{title}</h3><p className="text-sm text-ink-400 leading-relaxed">{text}</p></div>;
}

function CourseCard({ course, score, rank, profile }: { course: VocationalCourse; score: number; rank: number; profile: Record<VocationalDimension, number> }) {
  const [open, setOpen] = useState(rank <= 3);
  const aligned = topAlignedDimensions(profile, course);
  return (
    <article className="glass rounded-2xl border border-ink-800 overflow-hidden">
      <button onClick={() => setOpen((value) => !value)} className="w-full p-5 md:p-6 flex items-center gap-4 text-left hover:bg-ink-900/50 transition-colors">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-extrabold ${rank <= 3 ? 'bg-brand-500/15 text-brand-300' : 'bg-ink-800 text-ink-400'}`}>{rank}</div>
        <div className="flex-1 min-w-0"><h3 className="font-bold text-lg">{course.name}</h3><p className="text-sm text-ink-500">{course.area} · {course.duration}</p></div>
        <div className="text-right"><div className="text-xl font-extrabold text-brand-300">{score}%</div><span className="text-[11px] text-ink-600">compatibilidade</span></div>
        {open ? <ChevronUp className="w-5 h-5 text-ink-500" /> : <ChevronDown className="w-5 h-5 text-ink-500" />}
      </button>
      {open && <div className="border-t border-ink-800 p-5 md:p-6">
        <p className="text-ink-300 leading-relaxed mb-5">{course.summary}</p>
        <div className="flex flex-wrap gap-2 mb-6">{aligned.map(({ dimension }) => <span key={dimension} className="px-3 py-1.5 rounded-full bg-brand-500/10 text-brand-300 text-xs">{DIMENSION_LABELS[dimension]}</span>)}</div>
        <div className="grid md:grid-cols-3 gap-5 text-sm">
          <div><h4 className="font-bold text-ink-200 mb-2">O que você estuda</h4><ul className="space-y-1.5 text-ink-400">{course.studies.map((item) => <li key={item}>• {item}</li>)}</ul></div>
          <div><h4 className="font-bold text-ink-200 mb-2">Rotina típica</h4><ul className="space-y-1.5 text-ink-400">{course.dayToDay.map((item) => <li key={item}>• {item}</li>)}</ul></div>
          <div><h4 className="font-bold text-ink-200 mb-2">Onde pode aparecer</h4><ul className="space-y-1.5 text-ink-400">{course.environments.map((item) => <li key={item}>• {item}</li>)}</ul></div>
        </div>
        <div className="mt-5 rounded-xl bg-ink-900 border border-ink-800 p-4"><p className="text-xs uppercase tracking-wider text-ink-600 font-bold mb-1">Realidade para considerar</p><p className="text-sm text-ink-400 leading-relaxed">{course.attention}</p>{course.regulation && <p className="text-sm text-ink-500 mt-2">{course.regulation}</p>}</div>
      </div>}
    </article>
  );
}
