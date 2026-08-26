import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  BrainCircuit,
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  ChevronUp,
  Compass,
  ExternalLink,
  FlaskConical,
  GraduationCap,
  MapPin,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  Users,
} from 'lucide-react';
import {
  DIMENSION_LABELS,
  DIMENSION_WEIGHTS,
  VOCATIONAL_COURSES,
  VOCATIONAL_QUESTIONS,
  VOCATIONAL_SOURCES,
  type VocationalCourse,
  type VocationalDimension,
} from '@/lib/vocational-data';
import { getVocationalPresentation, VOCATIONAL_UNIVERSITY_NOTE } from '@/lib/vocational-presentation';
import { trackEvent } from '@/lib/analytics';
import { cleanReferralName } from '@/lib/free-referrals';

interface VocationalDemoProps { onBack: () => void }
type Answers = Record<string, number>;
type Phase = 'intro' | 'quiz' | 'referral' | 'results';

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
  (Object.keys(DIMENSION_LABELS) as VocationalDimension[]).forEach((key) => { sums[key] = 0; weights[key] = 0; });
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
  (Object.keys(DIMENSION_LABELS) as VocationalDimension[]).forEach((key) => { result[key] = weights[key] ? Math.round(sums[key] / weights[key]) : 50; });
  return result;
}

function courseScore(profile: Record<VocationalDimension, number>, course: VocationalCourse): number {
  let weightedFit = 0;
  let totalWeight = 0;
  (Object.keys(DIMENSION_LABELS) as VocationalDimension[]).forEach((dimension) => {
    const weight = DIMENSION_WEIGHTS[dimension];
    weightedFit += Math.max(0, 100 - Math.abs(profile[dimension] - course.profile[dimension])) * weight;
    totalWeight += weight;
  });
  return Math.round(weightedFit / totalWeight);
}

function topAlignedDimensions(profile: Record<VocationalDimension, number>, course: VocationalCourse, limit = 4) {
  return (Object.keys(DIMENSION_LABELS) as VocationalDimension[])
    .map((dimension) => ({ dimension, strength: (profile[dimension] + course.profile[dimension]) / 2, distance: Math.abs(profile[dimension] - course.profile[dimension]) }))
    .filter((item) => item.strength >= 50)
    .sort((a, b) => (a.distance - b.distance) || (b.strength - a.strength))
    .slice(0, limit);
}

export default function VocationalDemoPremium({ onBack }: VocationalDemoProps) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [referrerName, setReferrerName] = useState('');
  const [showAll, setShowAll] = useState(false);
  const profile = useMemo(() => calculateProfile(answers), [answers]);
  const ranking = useMemo(() => VOCATIONAL_COURSES.map((course) => ({ course, score: courseScore(profile, course) })).sort((a, b) => b.score - a.score), [profile]);
  const current = VOCATIONAL_QUESTIONS[step];
  const answered = current ? answers[current.id] !== undefined : false;
  const progress = ((step + (answered ? 1 : 0)) / VOCATIONAL_QUESTIONS.length) * 100;

  const start = () => { setPhase('quiz'); trackEvent('vocational_demo_started', { question_count: VOCATIONAL_QUESTIONS.length, course_count: VOCATIONAL_COURSES.length }); };
  const next = () => {
    if (!answered) return;
    if (step === VOCATIONAL_QUESTIONS.length - 1) {
      setPhase('referral');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else setStep((value) => value + 1);
  };
  const finish = (includeReferral = true) => {
    const cleanedName = includeReferral ? cleanReferralName(referrerName) : '';
    if (cleanedName) {
      trackEvent('referral_submitted', { referrer_name: cleanedName, mode: 'vocational' });
    }
    trackEvent('vocational_demo_completed', { top_course: ranking[0]?.course.name, top_score: ranking[0]?.score });
    setPhase('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const previous = () => step === 0 ? setPhase('intro') : setStep((value) => value - 1);
  const restart = () => { setAnswers({}); setReferrerName(''); setStep(0); setShowAll(false); setPhase('intro'); };

  if (phase === 'intro') return (
    <div className="min-h-screen relative overflow-hidden px-6 py-8 md:py-12">
      <div className="absolute inset-0 pointer-events-none overflow-hidden"><div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-brand-500/15 blur-[130px]" /><div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-accent-500/10 blur-[130px]" /></div>
      <div className="relative z-10 max-w-5xl mx-auto">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-ink-400 hover:text-ink-100 mb-10"><ArrowLeft className="w-4 h-4" /> Voltar</button>
        <div className="max-w-3xl"><div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-sm font-semibold mb-5"><Sparkles className="w-4 h-4" /> DEMO · Brasil</div><h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-5">Exploração <span className="gradient-text font-serif italic">Vocacional</span></h1><p className="text-lg md:text-xl text-ink-400 leading-relaxed mb-8">Cruze interesses, aptidões percebidas, valores e preferências de ambiente com uma base de 30 cursos relevantes no Brasil.</p></div>
        <div className="grid md:grid-cols-3 gap-4 mb-8"><InfoCard icon={<Compass className="w-5 h-5" />} title="36 perguntas" text="Interesses, estilo de trabalho, aptidões percebidas e valores." /><InfoCard icon={<BrainCircuit className="w-5 h-5" />} title="12 dimensões" text="RIASEC/Holland combinado a sinais acadêmicos e ocupacionais." /><InfoCard icon={<Target className="w-5 h-5" />} title="30 cursos" text="Saúde, negócios, tecnologia, engenharia, comunicação e humanidades." /></div>
        <div className="glass rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5 mb-8 max-w-4xl"><h2 className="font-bold text-amber-200 mb-2">Ferramenta de exploração, não teste psicológico</h2><p className="text-sm text-ink-300 leading-relaxed">A demo não diagnostica personalidade ou aptidão e não substitui orientação profissional com psicóloga(o). Ela serve para gerar hipóteses de cursos a pesquisar.</p></div>
        <div className="glass rounded-2xl border border-ink-800 p-6 md:p-7 max-w-4xl mb-8"><div className="flex items-center gap-2 mb-4"><FlaskConical className="w-5 h-5 text-accent-400" /><h2 className="font-bold text-lg">O que entra na análise</h2></div><div className="grid md:grid-cols-2 gap-x-8 gap-y-3 text-sm text-ink-400"><p><strong className="text-ink-200">Interesses:</strong> temas e atividades que atraem sua atenção.</p><p><strong className="text-ink-200">Autoeficácia percebida:</strong> tarefas em que você sente maior confiança.</p><p><strong className="text-ink-200">Valores:</strong> impacto, liderança, criatividade e especialização.</p><p><strong className="text-ink-200">Ambiente:</strong> pessoas, tecnologia, prática, análise e precisão.</p></div></div>
        <button onClick={start} className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-brand-500 hover:bg-brand-400 text-white font-bold shadow-xl shadow-brand-500/20 transition-all">Começar a Demo Vocacional <ArrowRight className="w-5 h-5" /></button>
      </div>
    </div>
  );

  if (phase === 'quiz' && current) return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12"><button onClick={previous} className="inline-flex items-center gap-2 text-sm text-ink-400 hover:text-ink-100"><ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Introdução' : 'Voltar'}</button><span className="text-sm text-ink-500">{step + 1} / {VOCATIONAL_QUESTIONS.length}</span></header>
      <div className="px-6 md:px-12 mb-8"><div className="max-w-2xl mx-auto"><div className="flex justify-between text-xs text-ink-500 mb-2"><span>{current.group}</span><span>{Math.round(progress)}%</span></div><div className="h-1.5 bg-ink-800 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-brand-500 to-accent-400 transition-all" style={{ width: `${progress}%` }} /></div></div></div>
      <main className="relative z-10 flex-1 flex items-center justify-center px-6 pb-12"><div className="w-full max-w-2xl animate-fade-up" key={current.id}><span className="inline-flex px-3 py-1 rounded-full bg-ink-800 text-xs text-ink-400 mb-4">{current.group}</span><h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight mb-3">{current.text}</h1>{current.helper && <p className="text-sm text-ink-500 mb-6">{current.helper}</p>}<p className="text-sm text-ink-500 mb-4">Quanto esta frase combina com você?</p><div className="space-y-2.5">{SCALE.map((option) => { const active = answers[current.id] === option.value; return <button key={option.value} onClick={() => setAnswers((prev) => ({ ...prev, [current.id]: option.value }))} className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${active ? 'border-brand-400 bg-brand-500/15 text-ink-50' : 'border-ink-800 bg-ink-900/50 hover:border-ink-700 text-ink-300'}`}><span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold ${active ? 'bg-brand-500 text-white' : 'bg-ink-800 text-ink-400'}`}>{option.value + 1}</span><span className="font-medium flex-1">{option.label}</span>{active && <Check className="w-5 h-5 text-brand-400" />}</button>; })}</div></div></main>
      <footer className="relative z-10 px-6 pb-10"><div className="max-w-2xl mx-auto"><button onClick={next} disabled={!answered} className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-2xl bg-brand-500 hover:bg-brand-400 disabled:bg-ink-800 disabled:text-ink-600 text-white font-bold">{step === VOCATIONAL_QUESTIONS.length - 1 ? 'Ver meus cursos' : 'Próxima'} <ArrowRight className="w-5 h-5" /></button></div></footer>
    </div>
  );

  if (phase === 'referral') return (
    <div className="min-h-screen flex flex-col relative overflow-hidden px-6 py-8 md:py-12">
      <div className="absolute inset-0 pointer-events-none overflow-hidden"><div className="absolute -top-40 left-1/4 h-[500px] w-[500px] rounded-full bg-brand-500/15 blur-[130px]" /><div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-accent-500/10 blur-[130px]" /></div>
      <div className="relative z-10 w-full max-w-2xl mx-auto">
        <button type="button" onClick={() => setPhase('quiz')} className="inline-flex items-center gap-2 text-sm text-ink-400 hover:text-ink-100 mb-10"><ArrowLeft className="w-4 h-4" /> Voltar</button>
        <div className="glass rounded-3xl border border-ink-800 p-6 md:p-9">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-sm font-semibold mb-5"><Users className="w-4 h-4" /> Indicação opcional</div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">Quem indicou o Conectaê para você?</h1>
          <p className="text-ink-400 leading-relaxed mb-7">Digite apenas o nome e sobrenome. A pessoa não precisa ter cadastro: nomes equivalentes serão agrupados automaticamente no painel administrativo.</p>
          <label htmlFor="vocational-referrer" className="block text-sm font-semibold text-ink-200 mb-2">Nome de quem indicou</label>
          <input
            id="vocational-referrer"
            type="text"
            value={referrerName}
            onChange={(event) => setReferrerName(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter') finish(); }}
            placeholder="Ex.: João Silva"
            autoComplete="name"
            autoFocus
            className="w-full px-5 py-4 rounded-2xl bg-ink-800/50 border border-ink-700 text-ink-100 placeholder-ink-600 focus:outline-none focus:border-brand-500 focus:bg-ink-800 transition-colors text-lg"
          />
          <button type="button" onClick={() => finish()} className="w-full mt-6 inline-flex items-center justify-center gap-2 py-4 rounded-2xl bg-brand-500 hover:bg-brand-400 text-white font-bold shadow-xl shadow-brand-500/20 transition-all">Ver meus cursos <ArrowRight className="w-5 h-5" /></button>
          <button type="button" onClick={() => finish(false)} className="w-full mt-3 py-3 text-sm text-ink-500 hover:text-ink-300 transition-colors">Prefiro não informar</button>
        </div>
      </div>
    </div>
  );

  const top = ranking[0];
  const presentation = getVocationalPresentation(top.course);
  const topDimensions = (Object.entries(profile) as [VocationalDimension, number][]).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const alternatives = ranking.slice(1, 5);
  const visibleRanking = showAll ? ranking : ranking.slice(0, 7);

  return (
    <div className="min-h-screen pb-16">
      <div className="max-w-7xl mx-auto px-5 md:px-8 pt-6">
        <div className="flex items-center justify-between gap-4 mb-6"><button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-ink-400 hover:text-white"><ArrowLeft className="w-4 h-4" /> Início</button><button onClick={restart} className="inline-flex items-center gap-2 text-sm text-ink-400 hover:text-white"><RotateCcw className="w-4 h-4" /> Refazer</button></div>

        <section className="relative overflow-hidden rounded-[28px] border border-white/10 min-h-[470px] md:min-h-[560px] mb-8 shadow-2xl shadow-black/30">
          <img src={presentation.imageUrl} alt={presentation.imageAlt} className="absolute inset-0 h-full w-full object-cover" loading="eager" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/88 to-ink-950/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent" />
          <div className="relative z-10 flex min-h-[470px] md:min-h-[560px] items-end p-7 md:p-12">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 mb-4"><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1.5 text-xs font-bold backdrop-blur"><Trophy className="w-4 h-4 text-amber-300" /> SEU CURSO #1</span><span className="rounded-full bg-brand-500/20 border border-brand-400/30 px-3 py-1.5 text-xs font-bold text-brand-200">{top.score}% de compatibilidade</span></div>
              <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight mb-3">{top.course.name}</h1>
              <p className="text-lg md:text-2xl text-ink-200 font-medium mb-3">{presentation.tagline}</p>
              <p className="text-sm md:text-base text-ink-300 max-w-2xl leading-relaxed mb-5">{top.course.summary}</p>
              <div className="flex flex-wrap gap-2">{topAlignedDimensions(profile, top.course, 5).map(({ dimension }) => <span key={dimension} className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-ink-100 backdrop-blur">{DIMENSION_LABELS[dimension]}</span>)}</div>
            </div>
          </div>
          <div className="absolute right-6 top-6 md:right-10 md:top-10 rounded-3xl border border-white/15 bg-black/25 px-5 py-4 backdrop-blur-xl text-center"><div className="text-4xl md:text-5xl font-black text-white">{top.score}%</div><div className="text-[10px] uppercase tracking-widest text-ink-300 mt-1">compatibilidade</div></div>
        </section>

        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-6 mb-8">
          <section className="glass rounded-3xl border border-ink-800 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6"><div className="w-11 h-11 rounded-2xl bg-brand-500/15 text-brand-300 flex items-center justify-center"><BrainCircuit className="w-5 h-5" /></div><div><p className="text-xs uppercase tracking-widest text-ink-600 font-bold">Seu perfil</p><h2 className="text-xl font-bold">Dimensões que mais pesaram</h2></div></div>
            <div className="space-y-4">{topDimensions.map(([dimension, value]) => <div key={dimension}><div className="flex justify-between gap-4 text-sm mb-1.5"><span className="text-ink-300">{DIMENSION_LABELS[dimension]}</span><span className="font-bold text-ink-100">{value}%</span></div><div className="h-2.5 rounded-full bg-ink-800 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400" style={{ width: `${value}%` }} /></div></div>)}</div>
          </section>

          <section className="grid sm:grid-cols-2 gap-4">
            <DetailCard icon={<BookOpen className="w-5 h-5" />} title="O que você vai estudar" items={top.course.studies.slice(0, 5)} />
            <DetailCard icon={<Briefcase className="w-5 h-5" />} title="Como é a rotina" items={top.course.dayToDay.slice(0, 5)} />
            <DetailCard icon={<Building2 className="w-5 h-5" />} title="Onde você pode atuar" items={top.course.environments.slice(0, 5)} />
            <div className="glass rounded-2xl border border-amber-500/20 p-5"><div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-300 flex items-center justify-center mb-3"><AlertTriangle className="w-5 h-5" /></div><h3 className="font-bold mb-2">Realidade para considerar</h3><p className="text-sm text-ink-400 leading-relaxed">{top.course.attention}</p><p className="text-xs text-ink-600 mt-3">Duração típica: {top.course.duration}</p></div>
          </section>
        </div>

        <section className="mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-5"><div><div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-brand-300 font-bold mb-2"><GraduationCap className="w-4 h-4" /> Onde pesquisar</div><h2 className="text-2xl md:text-3xl font-bold">Faculdades fortes para {top.course.name}</h2></div><p className="max-w-xl text-xs text-ink-600 leading-relaxed">{VOCATIONAL_UNIVERSITY_NOTE}</p></div>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">{presentation.universities.map((university) => <a key={university.name} href={university.url} target="_blank" rel="noreferrer" className="group glass rounded-2xl border border-ink-800 p-5 hover:border-brand-500/45 hover:-translate-y-1 transition-all"><div className="flex justify-between gap-3 mb-4"><div className="w-11 h-11 rounded-xl bg-brand-500/15 text-brand-300 flex items-center justify-center"><GraduationCap className="w-5 h-5" /></div><ExternalLink className="w-4 h-4 text-ink-700 group-hover:text-brand-300" /></div><span className="inline-flex rounded-full bg-ink-800 px-2.5 py-1 text-[10px] font-bold text-ink-300 mb-3">{university.badge}</span><h3 className="font-bold text-base mb-1">{university.name}</h3><p className="flex items-center gap-1 text-xs text-ink-500 mb-3"><MapPin className="w-3 h-3" /> {university.location} · {university.type}</p><p className="text-sm text-ink-400 leading-relaxed">{university.strength}</p></a>)}</div>
          <p className="mt-4 text-xs text-ink-600">Referência metodológica externa: QS World University Rankings by Subject 2026, complementada por força institucional e adequação da área no Brasil. Sempre confira o curso específico e o campus.</p>
        </section>

        <section className="mb-10">
          <div className="mb-5"><p className="text-xs uppercase tracking-widest text-ink-600 font-bold">Não pare no primeiro</p><h2 className="text-2xl md:text-3xl font-bold">Outros cursos muito parecidos com você</h2></div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">{alternatives.map(({ course, score }, index) => { const p = getVocationalPresentation(course); return <div key={course.id} className="relative min-h-[280px] overflow-hidden rounded-2xl border border-ink-800 group"><img src={p.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" referrerPolicy="no-referrer" /><div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/65 to-transparent" /><div className="relative z-10 h-full min-h-[280px] flex flex-col justify-end p-5"><span className="text-xs font-bold text-brand-300 mb-2">#{index + 2} · {score}%</span><h3 className="text-xl font-bold mb-1">{course.name}</h3><p className="text-xs text-ink-300">{course.area}</p></div></div>; })}</div>
        </section>

        <section className="mb-10">
          <div className="flex items-end justify-between gap-4 mb-5"><div><p className="text-xs uppercase tracking-widest text-ink-600 font-bold">Ranking completo</p><h2 className="text-2xl font-bold">Compare suas alternativas</h2></div><span className="text-xs text-ink-600">{VOCATIONAL_COURSES.length} cursos</span></div>
          <div className="space-y-3">{visibleRanking.map(({ course, score }, index) => <CourseRow key={course.id} course={course} score={score} rank={index + 1} profile={profile} />)}</div>
          <button onClick={() => setShowAll((value) => !value)} className="mt-5 w-full py-3 rounded-xl border border-ink-800 bg-ink-900 hover:border-ink-700 text-sm font-semibold text-ink-300 inline-flex items-center justify-center gap-2">{showAll ? <>Mostrar Top 7 <ChevronUp className="w-4 h-4" /></> : <>Ver os 30 cursos <ChevronDown className="w-4 h-4" /></>}</button>
        </section>

        <section className="glass rounded-2xl border border-ink-800 p-6 mb-7"><h2 className="font-bold text-lg mb-3">Próximo passo recomendado</h2><p className="text-sm text-ink-400 leading-relaxed">Compare principalmente os quatro primeiros cursos. Abra grades curriculares, visite páginas oficiais, converse com alunos e profissionais e procure experiências pequenas antes de decidir. O percentual indica semelhança de perfil nesta demo — não garantia de satisfação, desempenho ou aprovação.</p></section>
        <div className="flex flex-wrap gap-2">{VOCATIONAL_SOURCES.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-ink-900 border border-ink-800 text-xs text-ink-500 hover:text-ink-300">{source.label}<ExternalLink className="w-3 h-3" /></a>)}</div>
      </div>
    </div>
  );
}

function InfoCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return <div className="glass rounded-2xl border border-ink-800 p-5"><div className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-400 flex items-center justify-center mb-3">{icon}</div><h3 className="font-bold mb-1">{title}</h3><p className="text-sm text-ink-400 leading-relaxed">{text}</p></div>;
}

function DetailCard({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return <div className="glass rounded-2xl border border-ink-800 p-5"><div className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-300 flex items-center justify-center mb-3">{icon}</div><h3 className="font-bold mb-3">{title}</h3><ul className="space-y-2 text-sm text-ink-400">{items.map((item) => <li key={item} className="flex gap-2"><span className="text-brand-400">•</span><span>{item}</span></li>)}</ul></div>;
}

function CourseRow({ course, score, rank, profile }: { course: VocationalCourse; score: number; rank: number; profile: Record<VocationalDimension, number> }) {
  const [open, setOpen] = useState(false);
  const presentation = getVocationalPresentation(course);
  return <article className="glass rounded-2xl border border-ink-800 overflow-hidden"><button onClick={() => setOpen((value) => !value)} className="w-full p-4 md:p-5 flex items-center gap-4 text-left hover:bg-ink-900/50"><div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold ${rank <= 3 ? 'bg-brand-500/15 text-brand-300' : 'bg-ink-800 text-ink-400'}`}>{rank}</div><div className="flex-1 min-w-0"><h3 className="font-bold">{course.name}</h3><p className="text-xs text-ink-500">{course.area} · {course.duration}</p></div><div className="text-right"><div className="text-lg font-extrabold text-brand-300">{score}%</div><span className="text-[10px] text-ink-600">compatibilidade</span></div>{open ? <ChevronUp className="w-4 h-4 text-ink-500" /> : <ChevronDown className="w-4 h-4 text-ink-500" />}</button>{open && <div className="border-t border-ink-800 p-5 grid md:grid-cols-[180px_1fr] gap-5"><img src={presentation.imageUrl} alt="" className="w-full h-36 md:h-full object-cover rounded-xl" loading="lazy" referrerPolicy="no-referrer" /><div><p className="text-sm text-ink-300 leading-relaxed mb-4">{course.summary}</p><div className="flex flex-wrap gap-2 mb-4">{topAlignedDimensions(profile, course, 4).map(({ dimension }) => <span key={dimension} className="px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-300 text-[11px]">{DIMENSION_LABELS[dimension]}</span>)}</div><p className="text-xs text-ink-500"><strong className="text-ink-300">Atenção:</strong> {course.attention}</p></div></div>}</article>;
}
