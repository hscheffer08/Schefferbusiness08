import { ArrowRight, BarChart3, BookOpenCheck, Brain, Camera, CheckCircle2, Compass, FileText, GraduationCap, Sparkles, Target, Trophy } from 'lucide-react';

function navigateWith(params: Record<string, string | null>) {
  const url = new URL(window.location.href);
  Object.entries(params).forEach(([key, value]) => {
    if (value === null) url.searchParams.delete(key);
    else url.searchParams.set(key, value);
  });
  window.location.assign(`${url.pathname}${url.search}${url.hash}`);
}

const features = [
  { icon: Target, title: 'Plano de Aprovação', text: 'Transforma sua nota atual, faculdade-alvo e tempo disponível em uma rota semanal até a prova.' },
  { icon: BookOpenCheck, title: 'Questões direcionadas', text: 'Treino por prova, matéria e habilidade, com histórico de acertos e recuperação do que mais derruba sua nota.' },
  { icon: BarChart3, title: 'Correção de simulados', text: 'ENEM 2024 e 2025 com gabarito automático, além de CMMG e diagnóstico por erro.' },
  { icon: FileText, title: 'Redação', text: 'Prática de redação integrada ao mesmo plano para a preparação não ficar fragmentada.' },
  { icon: Camera, title: 'Diagnóstico por foto', text: 'Envie uma dificuldade e transforme o erro em conteúdo de recuperação dentro do seu plano.' },
  { icon: Trophy, title: 'Meta por vestibular', text: 'A estrutura muda conforme ENEM, FUVEST, Insper, Link ou Ciências Médicas-MG.' },
];

export default function CourseHome() {
  const openCourse = () => navigateWith({ planner: 'aprovacao', experience: null });
  const openCollegeTools = () => navigateWith({ experience: 'faculdades', planner: null });

  return (
    <div className="min-h-screen overflow-hidden bg-[#020817] text-white font-['Plus_Jakarta_Sans']">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-40 -top-40 h-[560px] w-[560px] rounded-full bg-[#246cff]/20 blur-[140px]" />
        <div className="absolute right-[-180px] top-[20%] h-[620px] w-[620px] rounded-full bg-cyan-400/10 blur-[150px]" />
      </div>

      <header className="relative z-10 border-b border-white/5 bg-[#020817]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 md:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#246cff] shadow-lg shadow-[#246cff]/25"><GraduationCap className="h-5 w-5" /></span>
            <div><div className="text-lg font-black tracking-tight">Conecta<span className="text-[#72a5ff]">ê</span></div><div className="text-[10px] font-bold uppercase tracking-[.18em] text-[#7891b4]">Curso de aprovação</div></div>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-bold text-[#9fb5d4] md:flex">
            <button onClick={openCourse} className="text-white">Curso</button>
            <button onClick={openCollegeTools} className="transition hover:text-white">Faculdades</button>
            <button onClick={openCollegeTools} className="transition hover:text-white">Teste vocacional</button>
          </nav>
          <button onClick={openCourse} className="rounded-xl bg-[#246cff] px-4 py-2.5 text-sm font-extrabold shadow-lg shadow-[#246cff]/20 transition hover:bg-[#3678ff]">Entrar no Curso</button>
        </div>
      </header>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-7xl gap-10 px-5 pb-16 pt-14 md:grid-cols-[1.1fr_.9fr] md:px-8 md:pb-24 md:pt-20">
          <div className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[.07] px-3 py-1.5 text-xs font-extrabold text-emerald-200"><Sparkles className="h-4 w-4" />GRATUITO POR TEMPO LIMITADO</div>
            <h1 className="max-w-4xl text-4xl font-black leading-[.98] tracking-[-.055em] sm:text-5xl md:text-7xl">Seu curso inteiro organizado para <span className="text-[#72a5ff]">passar.</span></h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#a9bddc] md:text-xl">Escolha o curso e a faculdade que você quer. O Conectaê transforma suas notas, seus erros e o tempo até a prova em um plano adaptativo com estudo, questões, simulados e revisão.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button onClick={openCourse} className="group inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#246cff] px-6 text-base font-black shadow-2xl shadow-[#246cff]/25 transition hover:-translate-y-0.5 hover:bg-[#3678ff]">Abrir meu Curso <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" /></button>
              <button onClick={openCollegeTools} className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-[#234576] bg-[#071a38] px-6 text-sm font-extrabold text-[#c4d4ea] transition hover:border-[#72a5ff] hover:text-white"><Compass className="h-5 w-5" />Ainda não sei meu curso/faculdade</button>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-[#8da5c5]">
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-300" />Plano salvo na sua conta</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-300" />Metas por prova</span>
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-300" />Histórico de desempenho</span>
            </div>
          </div>

          <div className="relative rounded-[28px] border border-[#173765] bg-gradient-to-b from-[#081a38] to-[#051127] p-5 shadow-2xl shadow-black/40 md:p-7">
            <div className="flex items-center justify-between gap-3"><div><div className="text-xs font-extrabold uppercase tracking-[.16em] text-[#72a5ff]">Seu painel</div><h2 className="mt-1 text-2xl font-black">Uma rotina que se adapta.</h2></div><Brain className="h-9 w-9 text-[#72a5ff]" /></div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#234576] bg-[#06152f] p-4"><div className="text-xs font-bold text-[#839ab9]">1. Defina seu alvo</div><div className="mt-2 text-lg font-black">Curso + faculdade</div><p className="mt-1 text-xs leading-relaxed text-[#9fb5d4]">A prova e as metas mudam automaticamente.</p></div>
              <div className="rounded-2xl border border-[#234576] bg-[#06152f] p-4"><div className="text-xs font-bold text-[#839ab9]">2. Informe seu nível</div><div className="mt-2 text-lg font-black">Notas atuais</div><p className="mt-1 text-xs leading-relaxed text-[#9fb5d4]">O sistema calcula o gap até a meta.</p></div>
              <div className="rounded-2xl border border-[#234576] bg-[#06152f] p-4"><div className="text-xs font-bold text-[#839ab9]">3. Estude</div><div className="mt-2 text-lg font-black">Semana por semana</div><p className="mt-1 text-xs leading-relaxed text-[#9fb5d4]">Conteúdo, questões e checkpoints no mesmo lugar.</p></div>
              <div className="rounded-2xl border border-[#234576] bg-[#06152f] p-4"><div className="text-xs font-bold text-[#839ab9]">4. Recalcule</div><div className="mt-2 text-lg font-black">Erros viram prioridade</div><p className="mt-1 text-xs leading-relaxed text-[#9fb5d4]">Simulados e dificuldades alimentam a recuperação.</p></div>
            </div>
            <button onClick={openCourse} className="mt-5 flex w-full items-center justify-between rounded-2xl border border-[#31588e] bg-[#0b2856] px-4 py-4 text-left transition hover:border-[#72a5ff]"><span><span className="block text-xs font-bold text-[#8da5c5]">COMEÇAR AGORA</span><span className="mt-0.5 block font-black">Montar meu plano de aprovação</span></span><ArrowRight className="h-5 w-5 text-[#72a5ff]" /></button>
          </div>
        </section>

        <section className="border-y border-white/5 bg-[#041027]/75">
          <div className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
            <div className="max-w-3xl"><div className="text-xs font-extrabold uppercase tracking-[.18em] text-[#72a5ff]">Tudo conectado</div><h2 className="mt-3 text-3xl font-black tracking-[-.04em] md:text-5xl">Não é só um cronograma. É o ambiente inteiro de preparação.</h2><p className="mt-4 text-[#9fb5d4]">Nada das funções já existentes foi removido. Elas passam a trabalhar como partes do Curso, em vez de parecerem produtos separados.</p></div>
            <div className="mt-9 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{features.map(({ icon: Icon, title, text }) => <article key={title} className="rounded-[22px] border border-[#173765] bg-[#06152f] p-5 transition hover:-translate-y-1 hover:border-[#31588e]"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#246cff]/15 text-[#72a5ff]"><Icon className="h-5 w-5" /></span><h3 className="mt-4 text-lg font-black">{title}</h3><p className="mt-2 text-sm leading-relaxed text-[#9fb5d4]">{text}</p></article>)}</div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
          <div className="grid gap-4 md:grid-cols-2">
            <button onClick={openCourse} className="group rounded-[26px] border border-[#31588e] bg-gradient-to-br from-[#0b2856] to-[#06152f] p-6 text-left transition hover:-translate-y-1 hover:border-[#72a5ff] md:p-8"><Target className="h-7 w-7 text-[#72a5ff]" /><div className="mt-6 text-xs font-black uppercase tracking-[.15em] text-[#72a5ff]">Principal</div><h3 className="mt-2 text-3xl font-black tracking-tight">Curso de Aprovação</h3><p className="mt-3 max-w-xl text-sm leading-relaxed text-[#a9bddc]">Para quem já tem um objetivo e quer transformar esse objetivo em execução diária.</p><span className="mt-6 inline-flex items-center gap-2 font-black">Entrar no Curso <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></button>
            <button onClick={openCollegeTools} className="group rounded-[26px] border border-[#173765] bg-[#051127] p-6 text-left transition hover:-translate-y-1 hover:border-[#31588e] md:p-8"><Compass className="h-7 w-7 text-cyan-300" /><div className="mt-6 text-xs font-black uppercase tracking-[.15em] text-[#839ab9]">Complementar</div><h3 className="mt-2 text-3xl font-black tracking-tight">Explorar cursos e faculdades</h3><p className="mt-3 max-w-xl text-sm leading-relaxed text-[#9fb5d4]">Teste vocacional, match de faculdades, comparação e perfil continuam disponíveis para quem ainda está decidindo.</p><span className="mt-6 inline-flex items-center gap-2 font-black text-cyan-200">Explorar opções <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></button>
          </div>
        </section>
      </main>
    </div>
  );
}
