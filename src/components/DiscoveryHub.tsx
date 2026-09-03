import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Compass,
  GraduationCap,
  Layers3,
  Search,
  Sparkles,
  Target,
} from 'lucide-react';

interface Props {
  onBack: () => void;
  onOpenVocational: () => void;
  onOpenColleges: () => void;
  onOpenPlanner: () => void;
}

const proof = [
  'Teste vocacional com 48 perguntas e 50 cursos',
  'Match de faculdades separado por área e curso',
  'Comparação por perfil — não só por ranking',
  'Continuidade direta para o Plano de Aprovação',
];

export default function DiscoveryHub({ onBack, onOpenVocational, onOpenColleges, onOpenPlanner }: Props) {
  return (
    <div className="min-h-screen overflow-hidden bg-[#050916] text-white font-['Plus_Jakarta_Sans']">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-48 -top-52 h-[650px] w-[650px] rounded-full bg-cyan-400/10 blur-[150px]" />
        <div className="absolute right-[-220px] top-[18%] h-[650px] w-[650px] rounded-full bg-violet-500/12 blur-[160px]" />
        <div className="absolute bottom-[-260px] left-[35%] h-[600px] w-[600px] rounded-full bg-[#246cff]/10 blur-[160px]" />
      </div>

      <header className="relative z-20 border-b border-white/[0.07] bg-[#050916]/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-[#92a8c8] transition hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Início
          </button>
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-300 to-[#246cff] shadow-lg shadow-cyan-400/10">
              <GraduationCap className="h-4.5 w-4.5 text-[#06101f]" />
            </span>
            <div className="leading-none">
              <div className="font-black tracking-tight">Conecta<span className="text-cyan-200">ê</span></div>
              <div className="mt-1 text-[9px] font-black uppercase tracking-[.18em] text-[#687f9f]">Descoberta</div>
            </div>
          </div>
          <button onClick={onOpenPlanner} className="inline-flex items-center gap-2 rounded-xl border border-[#2d5c95] bg-[#0a244b] px-3.5 py-2.5 text-xs font-black text-[#cce0ff] transition hover:border-[#72a5ff] hover:bg-[#0d2d5e]">
            <Target className="h-4 w-4" /><span className="hidden sm:inline">Já sei meu objetivo</span><span className="sm:hidden">Meu plano</span>
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-5 pb-24 pt-10 md:px-8 md:pt-16">
        <section className="grid items-center gap-10 lg:grid-cols-[1.02fr_.98fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.07] px-3 py-1.5 text-xs font-black text-cyan-100">
              <Sparkles className="h-4 w-4" /> ENCONTRE O CAMINHO ANTES DE MONTAR O PLANO
            </div>
            <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[.98] tracking-[-.055em] sm:text-5xl md:text-7xl">
              Primeiro descubra <span className="text-cyan-200">o que</span> combina com você. Depois, <span className="text-[#82aaff]">onde.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#a8bad4] md:text-lg">
              Esta área foi criada para quem ainda está decidindo. O teste vocacional identifica cursos compatíveis; o match de faculdades aprofunda a escolha dentro da área selecionada.
            </p>
            <div className="mt-7 grid gap-2 sm:grid-cols-2">
              {proof.map((item) => (
                <div key={item} className="flex items-start gap-2.5 text-sm font-semibold text-[#91a6c3]">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-emerald-300" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative rounded-[30px] border border-white/10 bg-gradient-to-b from-white/[0.055] to-white/[0.025] p-3 shadow-2xl shadow-black/40">
            <div className="rounded-[24px] border border-white/[0.07] bg-[#071020] p-5 md:p-6">
              <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] pb-5">
                <div>
                  <div className="text-[11px] font-black uppercase tracking-[.16em] text-cyan-200">Seu caminho</div>
                  <h2 className="mt-1 text-2xl font-black">Da dúvida até uma decisão.</h2>
                </div>
                <Compass className="h-8 w-8 text-cyan-200" />
              </div>
              <div className="mt-5 space-y-3">
                <Step number="01" icon={<BrainCircuit className="h-5 w-5" />} title="Descubra seus cursos" text="Interesses, valores, aptidões percebidas e estilo de trabalho viram hipóteses concretas de graduação." />
                <Step number="02" icon={<Layers3 className="h-5 w-5" />} title="Escolha uma área" text="Abra a área que fez sentido e veja as faculdades disponíveis para aquele caminho." />
                <Step number="03" icon={<Search className="h-5 w-5" />} title="Faça o match" text="Compare ambiente, carreira, perfil e evidências disponíveis sem depender de um ranking genérico." />
                <Step number="04" icon={<Target className="h-5 w-5" />} title="Transforme em meta" text="Quando decidir, leve o objetivo para o Curso de Aprovação e monte sua rota semanal." />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-14 grid gap-5 lg:grid-cols-2 md:mt-20">
          <button onClick={onOpenVocational} className="group relative overflow-hidden rounded-[28px] border border-cyan-300/20 bg-[radial-gradient(circle_at_85%_10%,rgba(103,232,249,.18),transparent_34%),linear-gradient(135deg,#071b2d,#071020)] p-6 text-left shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-cyan-200/40 md:p-8">
            <div className="absolute right-5 top-5 text-6xl font-black text-white/[0.035]">01</div>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-200"><BrainCircuit className="h-6 w-6" /></span>
            <div className="mt-7 text-xs font-black uppercase tracking-[.16em] text-cyan-200">Ainda não sei meu curso</div>
            <h2 className="mt-2 text-3xl font-black tracking-[-.035em] md:text-4xl">Teste Vocacional</h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#a7bdd6] md:text-base">Uma experiência própria de exploração vocacional, com 48 perguntas, 12 dimensões e 50 cursos. O resultado mostra afinidades e explica por que cada curso apareceu.</p>
            <div className="mt-7 flex flex-wrap gap-2 text-[11px] font-black text-[#a9c8d8]"><Pill>48 perguntas</Pill><Pill>50 cursos</Pill><Pill>Resultado explicado</Pill></div>
            <span className="mt-8 inline-flex items-center gap-2 text-sm font-black text-cyan-100">Começar teste <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
          </button>

          <button onClick={onOpenColleges} className="group relative overflow-hidden rounded-[28px] border border-violet-300/20 bg-[radial-gradient(circle_at_85%_10%,rgba(167,139,250,.20),transparent_34%),linear-gradient(135deg,#15142e,#081020)] p-6 text-left shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-violet-200/40 md:p-8">
            <div className="absolute right-5 top-5 text-6xl font-black text-white/[0.035]">02</div>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-300/15 bg-violet-300/10 text-violet-200"><GraduationCap className="h-6 w-6" /></span>
            <div className="mt-7 text-xs font-black uppercase tracking-[.16em] text-violet-200">Já tenho uma área em mente</div>
            <h2 className="mt-2 text-3xl font-black tracking-[-.035em] md:text-4xl">Encontrar Faculdades</h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#b3b7d7] md:text-base">Escolha seu curso ou área e faça um match específico entre as faculdades disponíveis. A experiência muda conforme a área — não é mais a antiga página genérica de Business.</p>
            <div className="mt-7 flex flex-wrap gap-2 text-[11px] font-black text-[#c4c3df]"><Pill>Por curso</Pill><Pill>Match de perfil</Pill><Pill>Comparação contextual</Pill></div>
            <span className="mt-8 inline-flex items-center gap-2 text-sm font-black text-violet-100">Explorar faculdades <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
          </button>
        </section>
      </main>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5">{children}</span>;
}

function Step({ number, icon, title, text }: { number: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="grid grid-cols-[42px_1fr] gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0d2444] text-cyan-200">{icon}</div>
      <div>
        <div className="text-[10px] font-black uppercase tracking-[.15em] text-[#617999]">{number}</div>
        <div className="mt-0.5 font-black">{title}</div>
        <p className="mt-1 text-xs leading-relaxed text-[#8198b7]">{text}</p>
      </div>
    </div>
  );
}
