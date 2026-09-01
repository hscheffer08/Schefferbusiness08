import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  Compass,
  FileText,
  GraduationCap,
  PlayCircle,
  Sparkles,
  Stars,
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
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-[#070b16] text-ink-50 selection:bg-brand-400/30">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-56 -left-32 w-[620px] h-[620px] rounded-full bg-cyan-500/20 blur-[145px]" />
        <div className="absolute top-[22%] -right-48 w-[620px] h-[620px] rounded-full bg-fuchsia-500/12 blur-[155px]" />
        <div className="absolute bottom-[-280px] left-[35%] w-[700px] h-[700px] rounded-full bg-violet-500/10 blur-[165px]" />
      </div>

      <nav className="relative z-20 px-5 md:px-10 py-5 flex items-center justify-between max-w-[1440px] mx-auto">
        <div className="flex items-center gap-2.5"><div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-300 via-brand-400 to-violet-500 flex items-center justify-center shadow-lg shadow-brand-500/20"><GraduationCap className="w-5 h-5 text-[#07111d]" /></div><span className="font-extrabold text-xl tracking-tight">Conecta<span className="text-cyan-300">ê</span></span></div>
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-ink-300 backdrop-blur-xl"><Stars className="w-3.5 h-3.5 text-amber-300" /> Orientação universitária personalizada</div>
      </nav>

      <main className="relative z-10 max-w-[1320px] mx-auto px-5 md:px-8 pb-24">
        <section className="grid lg:grid-cols-[1.02fr_.98fr] gap-10 lg:gap-14 items-center pt-8 md:pt-14 lg:pt-20">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-200 text-sm font-semibold mb-6"><Sparkles className="w-4 h-4" /> Do curso à aprovação</div>
            <h1 className="text-[44px] sm:text-6xl lg:text-[76px] font-black tracking-[-0.045em] leading-[.96] mb-6">Descubra onde entrar. <span className="bg-gradient-to-r from-cyan-300 via-brand-300 to-fuchsia-300 bg-clip-text text-transparent">E como chegar lá.</span></h1>
            <p className="max-w-2xl text-lg md:text-xl text-ink-300 leading-relaxed mb-8">Escolha o curso, encontre a faculdade que combina com você e transforme sua meta em um plano de estudo adaptativo até a prova.</p>
            <div className="flex flex-wrap gap-2 mb-9">{['50 cursos','1.000 opções','94 habilidades de prova','Plano adaptativo'].map((item,index)=><span key={item} className={`rounded-full border px-3.5 py-2 text-xs font-bold ${index===0?'border-cyan-300/25 bg-cyan-300/10 text-cyan-200':index===1?'border-fuchsia-300/20 bg-fuchsia-300/10 text-fuchsia-200':index===2?'border-amber-300/20 bg-amber-300/10 text-amber-100':'border-violet-300/20 bg-violet-300/10 text-violet-100'}`}>{item}</span>)}</div>

            <div className="grid sm:grid-cols-2 gap-4 max-w-3xl">
              <button className="group rounded-[26px] border border-cyan-300/25 bg-gradient-to-br from-cyan-400/15 via-brand-500/10 to-transparent p-6 text-left hover:-translate-y-1 transition-all"><div className="w-12 h-12 rounded-2xl bg-cyan-300 text-[#06131c] flex items-center justify-center mb-5"><Compass className="w-6 h-6" /></div><div className="text-[11px] font-black tracking-[.15em] text-cyan-200 uppercase mb-2">Ainda explorando</div><h2 className="text-2xl font-black mb-2">Fazer teste vocacional</h2><p className="text-sm text-ink-400 leading-relaxed mb-5">48 perguntas para entender cursos que combinam com interesses, valores, habilidades e estilo de trabalho.</p><span className="inline-flex items-center gap-2 font-bold text-cyan-200">Descobrir meu caminho <ArrowRight className="w-4 h-4" /></span></button>
              <button onClick={() => { setInitialAreaId(null); setOpenAreas(true); }} className="group rounded-[26px] border border-fuchsia-300/20 bg-gradient-to-br from-fuchsia-500/12 via-violet-500/10 to-transparent p-6 text-left hover:-translate-y-1 transition-all"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-300 to-violet-400 text-[#16081d] flex items-center justify-center mb-5"><GraduationCap className="w-6 h-6" /></div><div className="text-[11px] font-black tracking-[.15em] text-fuchsia-200 uppercase mb-2">Já sabe seu curso</div><h2 className="text-2xl font-black mb-2">Encontrar minha faculdade</h2><p className="text-sm text-ink-400 leading-relaxed mb-5">Compare faculdades pelo seu perfil acadêmico, ambiente, carreira e metodologia.</p><span className="inline-flex items-center gap-2 font-bold text-fuchsia-200">Escolher minha faculdade <ArrowRight className="w-4 h-4" /></span></button>
            </div>
          </div>

          <div className="relative min-h-[500px] md:min-h-[590px]">
            <div className="absolute inset-x-8 top-6 bottom-0 rounded-[40px] bg-gradient-to-br from-cyan-400/20 via-brand-500/5 to-fuchsia-500/15 blur-2xl" />
            <div className="absolute left-0 top-0 w-[76%] h-[78%] rounded-[34px] overflow-hidden border border-white/10 shadow-2xl rotate-[-2deg]"><img src={HERO_PHOTO} alt="Estudantes universitários" className="w-full h-full object-cover" referrerPolicy="no-referrer" /><div className="absolute inset-0 bg-gradient-to-t from-[#07101d]/90 via-transparent to-transparent" /><div className="absolute bottom-5 left-5 rounded-full bg-black/40 border border-white/15 px-3 py-1.5 text-[11px] font-bold"><BrainCircuit className="w-3.5 h-3.5 text-cyan-200 inline mr-1" /> Match + aprovação</div></div>
            <div className="absolute right-0 top-[18%] w-[45%] h-[34%] rounded-[28px] overflow-hidden border-4 border-[#070b16] shadow-2xl rotate-[4deg]"><img src={CAMPUS_PHOTO} alt="Campus universitário" className="w-full h-full object-cover" /></div>
            <div className="absolute right-[5%] bottom-[5%] w-[52%] h-[33%] rounded-[28px] overflow-hidden border-4 border-[#070b16] shadow-2xl rotate-[-3deg]"><img src={STUDY_PHOTO} alt="Estudo para vestibular" className="w-full h-full object-cover" /></div>
          </div>
        </section>

        <section className="mt-12 md:mt-16">
          <button onClick={openPlanner} className="group w-full relative overflow-hidden rounded-[34px] border-2 border-amber-300/30 bg-gradient-to-br from-amber-300/[0.12] via-cyan-300/[0.07] to-violet-400/[0.08] p-6 md:p-9 text-left shadow-2xl shadow-black/25 hover:border-amber-200/55 hover:-translate-y-1 transition-all">
            <div className="absolute -right-24 -top-24 w-72 h-72 rounded-full bg-amber-300/10 blur-3xl" />
            <div className="relative grid lg:grid-cols-[1.05fr_.95fr] gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-amber-200"><Target className="w-4 h-4" /> Plano de Aprovação</div>
                <h2 className="mt-4 text-3xl md:text-5xl font-black tracking-tight">Já sabe onde quer entrar? Descubra <span className="text-amber-200">o que precisa fazer toda semana.</span></h2>
                <p className="mt-4 max-w-3xl text-base md:text-lg text-ink-300 leading-relaxed">Escolha faculdade e curso, coloque seus resultados de simulados e marque as matérias em que você é mais forte. O Conectaê calcula metas de acerto, identifica gargalos e recria seu calendário de estudo conforme você melhora.</p>
                <div className="mt-6 inline-flex items-center gap-3 rounded-2xl bg-amber-300 px-5 py-3.5 font-black text-[#171006] text-lg">Montar meu plano agora <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { icon:<CalendarDays className="w-5 h-5" />, title:'Calendário adaptativo', text:'Muda depois de cada simulado e mostra o checkpoint de cada semana.' },
                  { icon:<BookOpen className="w-5 h-5" />, title:'Questões no site', text:'Pratique por prova, área, habilidade e dificuldade, com correção comentada.' },
                  { icon:<PlayCircle className="w-5 h-5" />, title:'Aulas e revisão', text:'Receba buscas de vídeo e materiais oficiais ligados ao foco daquela semana.' },
                  { icon:<FileText className="w-5 h-5" />, title:'PDF de estudo', text:'Gere um PDF da semana com metas, prioridades e questões para fazer offline.' },
                ].map((card)=><div key={card.title} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-200">{card.icon}</div><strong className="block mt-3">{card.title}</strong><p className="mt-1 text-xs leading-relaxed text-ink-400">{card.text}</p></div>)}
              </div>
            </div>
          </button>
        </section>

        <section className="mt-16 grid md:grid-cols-3 gap-4">
          {[
            { icon:<Target className="w-5 h-5" />, label:'Mais do que ranking', title:'Fit com você', text:'Entenda onde seu jeito de aprender e suas prioridades se encaixam melhor.' },
            { icon:<BarChart3 className="w-5 h-5" />, label:'Mais transparência', title:'Metas visíveis', text:'Veja nota-alvo, acertos necessários e quanto falta em cada área.' },
            { icon:<BookOpen className="w-5 h-5" />, label:'Mais profundidade', title:'Prova + habilidade', text:'ENEM, FUVEST, Insper, Link e Ciências Médicas recebem lógica própria de preparação.' },
          ].map((card)=><div key={card.title} className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6"><div className="w-11 h-11 rounded-2xl bg-cyan-300/10 text-cyan-200 flex items-center justify-center mb-4">{card.icon}</div><div className="text-[10px] uppercase tracking-[.16em] font-black text-ink-500">{card.label}</div><h3 className="text-xl font-black mt-2">{card.title}</h3><p className="text-sm leading-relaxed text-ink-400 mt-2">{card.text}</p></div>)}
        </section>
      </main>
    </div>
  );
}
