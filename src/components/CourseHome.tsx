import {
  ArrowRight,
  BookOpenCheck,
  Brain,
  Camera,
  Check,
  Compass,
  FileText,
  GraduationCap,
  MessageSquareText,
  Sparkles,
  Target,
} from 'lucide-react';

function navigateWith(params: Record<string, string | null>) {
  const url = new URL(window.location.href);
  Object.entries(params).forEach(([key, value]) => {
    if (value === null) url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  });
  window.location.assign(`${url.pathname}${url.search}${url.hash}`);
}

const benefits = [
  { icon: Target, title: 'Plano sob medida', text: 'Metas semanais construídas a partir da sua prova, nota e rotina.' },
  { icon: BookOpenCheck, title: 'Questões certas', text: 'Treino direcionado aos conteúdos que mais impactam o seu resultado.' },
  { icon: Brain, title: 'Revisão inteligente', text: 'Seus erros viram prioridades no próximo ciclo de estudos.' },
  { icon: Camera, title: 'Dúvidas por foto', text: 'Envie uma questão e transforme a dificuldade em prática.' },
];

export default function CourseHome() {
  const openCourse = () => navigateWith({ planner: 'aprovacao', experience: null });
  const openCollegeTools = () => navigateWith({ experience: 'faculdades', planner: null });
  const openOfficialBank = () => navigateWith({ experience: 'vestibulares-oficiais', planner: null });
  const openInterview = () => window.location.assign('/treino-entrevista');

  return (
    <div className="min-h-screen overflow-hidden bg-[#f6f8ff] font-['Plus_Jakarta_Sans'] text-[#101a36]">
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <div className="absolute -left-44 -top-52 h-[520px] w-[520px] rounded-full bg-[#5170ff]/15 blur-[130px]" />
        <div className="absolute -right-48 top-24 h-[540px] w-[540px] rounded-full bg-[#8b5cf6]/10 blur-[150px]" />
      </div>

      <header className="relative z-20 border-b border-[#dfe5f4] bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-5 px-5 py-4 md:px-8">
          <button onClick={() => window.location.assign('/')} className="flex items-center gap-3 text-left" aria-label="Ir para o início">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3155e7] text-white shadow-[0_8px_24px_rgba(49,85,231,.24)]">
              <GraduationCap className="h-5 w-5" strokeWidth={2.4} />
            </span>
            <span className="text-lg font-black tracking-[-.035em]">Conecta<span className="text-[#3155e7]">ê</span></span>
          </button>

          <nav className="hidden items-center gap-7 text-sm font-bold text-[#596681] lg:flex" aria-label="Navegação principal">
            <button onClick={openCourse} className="text-[#172344]">Curso</button>
            <button onClick={openOfficialBank} className="hover:text-[#3155e7]">Questões</button>
            <button onClick={openInterview} className="hover:text-[#3155e7]">Entrevistas</button>
            <button onClick={openCollegeTools} className="hover:text-[#3155e7]">Cursos e faculdades</button>
          </nav>

          <button onClick={openCourse} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#172344] px-4 text-sm font-extrabold text-white shadow-sm hover:bg-[#3155e7]">
            Começar <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-14 md:px-8 md:pb-24 md:pt-20 lg:grid-cols-[1.08fr_.92fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#cdd7ff] bg-white px-3 py-1.5 text-xs font-extrabold text-[#3155e7] shadow-sm">
              <Sparkles className="h-4 w-4" /> GRATUITO POR TEMPO LIMITADO
            </div>

            <h1 className="mt-6 max-w-3xl text-4xl font-black leading-[1.02] tracking-[-.052em] sm:text-5xl md:text-6xl">
              Um plano claro para chegar à sua <span className="text-[#3155e7]">aprovação.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-[#596681] md:text-lg">
              Escolha sua meta. O Conectaê organiza o que estudar, quais questões fazer e quando revisar — tudo em uma rotina que se adapta ao seu desempenho.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={openCourse} className="group inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#3155e7] px-6 text-base font-black text-white shadow-[0_14px_34px_rgba(49,85,231,.25)] hover:-translate-y-0.5 hover:bg-[#2747c9]">
                Montar meu plano <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
              <button onClick={openCollegeTools} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-[#d7deee] bg-white px-6 text-sm font-extrabold text-[#273552] shadow-sm hover:border-[#9eafff] hover:text-[#3155e7]">
                <Compass className="h-5 w-5" /> Ainda estou escolhendo
              </button>
            </div>

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-[#66738c]">
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-[#3155e7]" />Plano adaptativo</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-[#3155e7]" />Questões oficiais</span>
              <span className="inline-flex items-center gap-1.5"><Check className="h-4 w-4 text-[#3155e7]" />Progresso salvo</span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-3 rounded-[32px] bg-gradient-to-br from-[#3155e7]/12 to-[#8b5cf6]/10 blur-xl" aria-hidden="true" />
            <div className="relative rounded-[28px] border border-[#d9e0f1] bg-white p-5 shadow-[0_26px_70px_rgba(25,45,95,.12)] md:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-extrabold uppercase tracking-[.15em] text-[#66738c]">Seu plano da semana</div>
                  <h2 className="mt-2 text-2xl font-black tracking-[-.035em]">Rumo à sua meta</h2>
                </div>
                <span className="rounded-xl bg-[#eef1ff] p-2.5 text-[#3155e7]"><Target className="h-5 w-5" /></span>
              </div>

              <div className="mt-7 rounded-2xl bg-[#f3f5fb] p-4">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span>Progresso semanal</span><span className="text-[#3155e7]">68%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#dfe4f0]">
                  <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-[#3155e7] to-[#6c57e8]" />
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {[
                  ['Hoje', 'Matemática · Funções', '12 questões'],
                  ['Amanhã', 'Linguagens · Interpretação', 'Revisão curta'],
                  ['Sexta', 'Simulado direcionado', 'Checkpoint'],
                ].map(([day, title, detail], index) => (
                  <div key={day} className="flex items-center gap-3 rounded-2xl border border-[#e2e7f2] p-3.5">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${index === 0 ? 'bg-[#3155e7] text-white' : 'bg-[#eef1f7] text-[#66738c]'}`}>{index + 1}</span>
                    <span className="min-w-0 flex-1"><span className="block text-xs font-bold text-[#7a869e]">{day}</span><span className="block truncate text-sm font-extrabold text-[#172344]">{title}</span></span>
                    <span className="hidden text-xs font-bold text-[#7a869e] sm:block">{detail}</span>
                  </div>
                ))}
              </div>

              <button onClick={openCourse} className="mt-5 flex w-full items-center justify-between rounded-2xl bg-[#172344] px-4 py-4 text-left text-white hover:bg-[#3155e7]">
                <span><span className="block text-xs font-bold text-white/60">PRÓXIMO PASSO</span><span className="mt-0.5 block font-black">Criar meu plano</span></span>
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>

        <section className="border-y border-[#e0e5f1] bg-white/75">
          <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-[.16em] text-[#3155e7]">Escolha seu caminho</div>
                <h2 className="mt-3 max-w-2xl text-3xl font-black tracking-[-.04em] md:text-4xl">Tudo o que você precisa, sem complicar.</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-[#66738c]">Entre direto na ferramenta certa para o momento em que você está.</p>
            </div>

            <div className="mt-9 grid gap-4 md:grid-cols-3">
              <button onClick={openCourse} className="group rounded-[24px] bg-[#3155e7] p-6 text-left text-white shadow-[0_16px_36px_rgba(49,85,231,.2)] hover:-translate-y-1 hover:bg-[#2747c9]">
                <Target className="h-7 w-7" /><h3 className="mt-8 text-xl font-black">Plano de aprovação</h3><p className="mt-2 text-sm leading-6 text-white/75">Para quem já sabe onde quer chegar e precisa organizar a execução.</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-black">Começar <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
              </button>
              <button onClick={openOfficialBank} className="group rounded-[24px] border border-[#dbe2f0] bg-[#f8f9fd] p-6 text-left hover:-translate-y-1 hover:border-[#aebcff]">
                <BookOpenCheck className="h-7 w-7 text-[#3155e7]" /><h3 className="mt-8 text-xl font-black">Questões oficiais</h3><p className="mt-2 text-sm leading-6 text-[#66738c]">Pratique por prova, edição e matéria com a fonte sempre visível.</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[#3155e7]">Abrir banco <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
              </button>
              <button onClick={openCollegeTools} className="group rounded-[24px] border border-[#dbe2f0] bg-[#f8f9fd] p-6 text-left hover:-translate-y-1 hover:border-[#aebcff]">
                <Compass className="h-7 w-7 text-[#6c57e8]" /><h3 className="mt-8 text-xl font-black">Descobrir opções</h3><p className="mt-2 text-sm leading-6 text-[#66738c]">Explore cursos, compare faculdades e faça o teste vocacional.</p><span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[#6c57e8]">Explorar <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
              </button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-20">
          <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
            <div>
              <div className="text-xs font-extrabold uppercase tracking-[.16em] text-[#3155e7]">Feito para evoluir com você</div>
              <h2 className="mt-3 text-3xl font-black tracking-[-.04em] md:text-4xl">Menos improviso. Mais direção.</h2>
              <p className="mt-4 max-w-md text-base leading-7 text-[#66738c]">Cada atividade alimenta o seu próximo passo, para o estudo não virar uma lista solta de tarefas.</p>
            </div>
            <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
              {benefits.map(({ icon: Icon, title, text }) => (
                <article key={title} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e9edff] text-[#3155e7]"><Icon className="h-5 w-5" /></span>
                  <div><h3 className="font-black text-[#172344]">{title}</h3><p className="mt-1 text-sm leading-6 text-[#66738c]">{text}</p></div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-[#e0e5f1] bg-white/60 px-5 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-[#66738c] sm:flex-row">
          <span className="font-black text-[#172344]">Conectaê</span>
          <div className="flex flex-wrap justify-center gap-5 font-semibold">
            <button onClick={openOfficialBank} className="hover:text-[#3155e7]">Questões</button>
            <button onClick={openInterview} className="inline-flex items-center gap-1.5 hover:text-[#3155e7]"><MessageSquareText className="h-4 w-4" /> Entrevistas</button>
            <button onClick={openCollegeTools} className="inline-flex items-center gap-1.5 hover:text-[#3155e7]"><FileText className="h-4 w-4" /> Faculdades</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
