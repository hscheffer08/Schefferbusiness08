import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  Compass,
  FileText,
  GraduationCap,
  PlayCircle,
  Target,
} from 'lucide-react';
import AreaMatchPortal from '@/components/AreaMatchPortal';

const HERO_PHOTO = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=86';
const CAMPUS_PHOTO = 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1000&q=84';
const STUDY_PHOTO = 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=84';

export default function ExpandedHomeMount() {
  const [openAreas, setOpenAreas] = useState(false);
  const [initialAreaId, setInitialAreaId] = useState<string | null>(null);
  const params = new URLSearchParams(window.location.search);
  const legacy = params.get('modo') === 'business';

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ areaId?: string }>).detail;
      setInitialAreaId(detail?.areaId ?? null);
      setOpenAreas(true);
    };
    window.addEventListener('conectae:open-area-match', handler);
    return () => window.removeEventListener('conectae:open-area-match', handler);
  }, []);

  const closeAreas = () => { setOpenAreas(false); setInitialAreaId(null); };
  const openPlanner = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('planner', 'aprovacao');
    window.location.assign(`${url.pathname}${url.search}${url.hash}`);
  };

  if (legacy) return null;
  if (openAreas) return <div className="fixed inset-0 z-[90] overflow-y-auto"><AreaMatchPortal onClose={closeAreas} initialAreaId={initialAreaId} /></div>;

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-[#080d18] text-ink-50 selection:bg-brand-400/30">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-[8%] h-[320px] w-[320px] rounded-full bg-blue-400/[0.08] blur-[110px]" />
        <div className="absolute top-[26%] right-[5%] h-[260px] w-[260px] rounded-full bg-violet-400/[0.06] blur-[100px]" />
      </div>

      <nav className="relative z-20 mx-auto flex max-w-[1380px] items-center justify-between px-5 py-5 md:px-10">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-[11px] bg-[#dbe7fb] text-[#0c1a31]"><GraduationCap className="h-4.5 w-4.5" /></div>
          <span className="text-xl font-extrabold tracking-[-0.03em]">Conecta<span className="text-[#91addf]">ê</span></span>
        </div>
        <div className="hidden text-sm text-ink-400 sm:block">Escolha melhor. Prepare-se melhor.</div>
      </nav>

      <main className="relative z-10 mx-auto max-w-[1260px] px-5 pb-24 md:px-8">
        <section className="grid items-center gap-10 pt-9 md:pt-14 lg:grid-cols-[1.03fr_.97fr] lg:gap-16 lg:pt-16">
          <div>
            <div className="mb-5 text-sm font-semibold text-[#9db5df]">Do curso à aprovação</div>
            <h1 className="mb-6 max-w-[760px] text-[46px] font-black leading-[.98] tracking-[-0.055em] sm:text-6xl lg:text-[74px]">
              Descubra onde entrar. <span className="text-[#aabbe0]">E como chegar lá.</span>
            </h1>
            <p className="mb-8 max-w-2xl text-lg leading-relaxed text-ink-300 md:text-xl">
              Compare faculdades, entenda o seu perfil e transforme uma meta de aprovação em um plano de estudo que acompanha sua evolução.
            </p>

            <div className="mb-9 flex flex-wrap gap-x-6 gap-y-2 border-y border-white/[0.08] py-4 text-sm text-ink-400">
              <span><b className="text-white">50</b> cursos</span>
              <span><b className="text-white">1.000+</b> opções</span>
              <span><b className="text-white">200+</b> questões no plano</span>
              <span><b className="text-white">5</b> provas com lógica própria</span>
            </div>

            <div className="grid max-w-3xl gap-3 sm:grid-cols-2">
              <button className="group border border-white/[0.11] bg-white/[0.045] p-6 text-left hover:border-[#7fa0d9]/45 hover:bg-white/[0.065]">
                <div className="mb-5 flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-[11px] bg-[#dce9fb] text-[#17365d]"><Compass className="h-5 w-5" /></div>
                  <ArrowRight className="h-4 w-4 text-ink-500 transition-transform group-hover:translate-x-0.5" />
                </div>
                <div className="mb-1.5 text-xs font-bold text-[#9db5df]">Ainda explorando</div>
                <h2 className="mb-2 text-2xl font-extrabold tracking-[-0.035em]">Fazer teste vocacional</h2>
                <p className="text-sm leading-relaxed text-ink-400">48 perguntas para entender interesses, habilidades e ambientes em que você tende a render melhor.</p>
              </button>

              <button onClick={() => { setInitialAreaId(null); setOpenAreas(true); }} className="group border border-white/[0.11] bg-white/[0.045] p-6 text-left hover:border-[#b69bd2]/40 hover:bg-white/[0.065]">
                <div className="mb-5 flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-[11px] bg-[#eadff4] text-[#4c3264]"><GraduationCap className="h-5 w-5" /></div>
                  <ArrowRight className="h-4 w-4 text-ink-500 transition-transform group-hover:translate-x-0.5" />
                </div>
                <div className="mb-1.5 text-xs font-bold text-[#c4aed9]">Já sabe o curso</div>
                <h2 className="mb-2 text-2xl font-extrabold tracking-[-0.035em]">Encontrar minha faculdade</h2>
                <p className="text-sm leading-relaxed text-ink-400">Compare faculdades pelo seu perfil acadêmico, ambiente, metodologia e objetivos de carreira.</p>
              </button>
            </div>
          </div>

          <div className="relative min-h-[430px] md:min-h-[540px]">
            <div className="absolute left-0 top-0 h-[82%] w-[79%] overflow-hidden rounded-[22px] border border-white/[0.09] shadow-2xl">
              <img src={HERO_PHOTO} alt="Estudantes universitários" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#08101d]/65 via-transparent to-transparent" />
            </div>
            <div className="absolute right-0 top-[18%] h-[31%] w-[43%] overflow-hidden rounded-[18px] border-[5px] border-[#080d18] shadow-2xl">
              <img src={CAMPUS_PHOTO} alt="Campus universitário" className="h-full w-full object-cover" />
            </div>
            <div className="absolute bottom-[2%] right-[7%] h-[31%] w-[49%] overflow-hidden rounded-[18px] border-[5px] border-[#080d18] shadow-2xl">
              <img src={STUDY_PHOTO} alt="Estudo para vestibular" className="h-full w-full object-cover" />
            </div>
          </div>
        </section>

        <section className="mt-14 md:mt-18">
          <button onClick={openPlanner} className="group w-full overflow-hidden border border-white/[0.1] bg-[#111827] p-6 text-left hover:border-[#d9aa77]/35 md:p-9">
            <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_.95fr]">
              <div>
                <div className="mb-3 flex items-center gap-2 text-xs font-bold text-[#efc79c]"><Target className="h-4 w-4" /> Plano de Aprovação</div>
                <h2 className="text-3xl font-black tracking-[-0.04em] md:text-5xl">Já sabe onde quer entrar? Veja <span className="text-[#efc79c]">o que fazer a cada semana.</span></h2>
                <p className="mt-4 max-w-3xl text-base leading-relaxed text-ink-300 md:text-lg">O plano cruza seu curso, faculdade, simulados, matérias fortes e histórico de questões para organizar o que merece mais tempo agora.</p>
                <div className="mt-6 inline-flex items-center gap-2 rounded-[12px] bg-[#efc79c] px-5 py-3.5 font-extrabold text-[#22170d]">Montar meu plano <ArrowRight className="h-4.5 w-4.5" /></div>
              </div>
              <div className="grid gap-x-7 gap-y-5 sm:grid-cols-2">
                {[
                  { icon:<CalendarDays className="h-4.5 w-4.5" />, title:'Plano semanal', text:'Prioridades, checkpoints e simulados distribuídos até a prova.' },
                  { icon:<BookOpen className="h-4.5 w-4.5" />, title:'Questões no site', text:'Prática por prova e área com gabarito e explicação.' },
                  { icon:<PlayCircle className="h-4.5 w-4.5" />, title:'Provas oficiais', text:'Blocos de ENEM de anos diferentes no ritmo da semana.' },
                  { icon:<FileText className="h-4.5 w-4.5" />, title:'PDF semanal', text:'Roteiro, questões e material para estudar offline.' },
                ].map((card)=><div key={card.title} className="border-t border-white/[0.1] pt-4"><div className="mb-2 flex items-center gap-2 text-[#efc79c]">{card.icon}<strong className="text-sm text-white">{card.title}</strong></div><p className="text-xs leading-relaxed text-ink-400">{card.text}</p></div>)}
              </div>
            </div>
          </button>
        </section>

        <section className="mt-16 grid gap-3 md:grid-cols-3">
          {[
            { icon:<Target className="h-4.5 w-4.5" />, label:'Fit com você', text:'Compare sem transformar uma escolha complexa em um ranking simplista.' },
            { icon:<BarChart3 className="h-4.5 w-4.5" />, label:'Metas visíveis', text:'Entenda onde está, para onde precisa ir e qual área merece prioridade.' },
            { icon:<BookOpen className="h-4.5 w-4.5" />, label:'Preparação real', text:'ENEM, FUVEST, Insper, Link e Ciências Médicas recebem lógica própria.' },
          ].map((card)=><div key={card.label} className="border-t border-white/[0.1] px-1 py-5"><div className="mb-3 text-[#9db5df]">{card.icon}</div><h3 className="text-xl font-extrabold tracking-[-0.03em]">{card.label}</h3><p className="mt-2 text-sm leading-relaxed text-ink-400">{card.text}</p></div>)}
        </section>
      </main>
    </div>
  );
}
