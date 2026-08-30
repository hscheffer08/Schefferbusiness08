import { useEffect, useState } from 'react';
import { ArrowRight, BarChart3, BookOpen, BrainCircuit, Compass, GraduationCap, Sparkles, Stars, Target } from 'lucide-react';
import AreaMatchPortal from '@/components/AreaMatchPortal';

const HERO_PHOTO = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=86';
const CAMPUS_PHOTO = 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=1000&q=84';
const STUDY_PHOTO = 'https://images.unsplash.com/photo-1781583716707-26ec9170ca0d?auto=format&fit=crop&w=1000&q=84';

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

  const closeAreas = () => {
    setOpenAreas(false);
    setInitialAreaId(null);
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
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-300 via-brand-400 to-violet-500 flex items-center justify-center shadow-lg shadow-brand-500/20"><GraduationCap className="w-5 h-5 text-[#07111d]" /></div>
          <span className="font-extrabold text-xl tracking-tight">Conecta<span className="text-cyan-300">ê</span></span>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-ink-300 backdrop-blur-xl"><Stars className="w-3.5 h-3.5 text-amber-300" /> Orientação universitária personalizada</div>
      </nav>

      <main className="relative z-10 max-w-[1320px] mx-auto px-5 md:px-8 pb-24">
        <section className="grid lg:grid-cols-[1.02fr_.98fr] gap-10 lg:gap-14 items-center pt-8 md:pt-14 lg:pt-20">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-200 text-sm font-semibold mb-6 backdrop-blur"><Sparkles className="w-4 h-4" /> Do curso à faculdade certa</div>
            <h1 className="text-[44px] sm:text-6xl lg:text-[78px] font-black tracking-[-0.045em] leading-[.96] mb-6">Seu futuro não cabe em um <span className="bg-gradient-to-r from-cyan-300 via-brand-300 to-fuchsia-300 bg-clip-text text-transparent">ranking genérico.</span></h1>
            <p className="max-w-2xl text-lg md:text-xl text-ink-300 leading-relaxed mb-8">Descubra o que combina com você e compare faculdades com base em perfil acadêmico, ambiente, carreira, metodologia e evidências do curso.</p>

            <div className="flex flex-wrap gap-2 mb-9">
              {['23 áreas','184 opções','24 dimensões','Match por perfil'].map((item, index) => <span key={item} className={`rounded-full border px-3.5 py-2 text-xs font-bold ${index === 0 ? 'border-cyan-300/25 bg-cyan-300/10 text-cyan-200' : index === 1 ? 'border-fuchsia-300/20 bg-fuchsia-300/10 text-fuchsia-200' : index === 2 ? 'border-amber-300/20 bg-amber-300/10 text-amber-100' : 'border-white/10 bg-white/[0.04] text-ink-300'}`}>{item}</span>)}
            </div>

            <div className="grid sm:grid-cols-2 gap-4 max-w-3xl">
              <button className="group relative overflow-hidden rounded-[26px] border border-cyan-300/25 bg-gradient-to-br from-cyan-400/15 via-brand-500/10 to-transparent p-6 text-left hover:-translate-y-1 hover:border-cyan-200/50 transition-all duration-300 shadow-2xl shadow-cyan-950/20">
                <div className="absolute right-[-22px] top-[-28px] w-28 h-28 rounded-full bg-cyan-300/10 blur-xl" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-300 text-[#06131c] flex items-center justify-center mb-5 shadow-lg shadow-cyan-300/15"><Compass className="w-6 h-6" /></div>
                  <div className="text-[11px] font-black tracking-[.15em] text-cyan-200 uppercase mb-2">Ainda explorando</div>
                  <h2 className="text-2xl font-black mb-2">Fazer teste vocacional</h2>
                  <p className="text-sm text-ink-400 leading-relaxed mb-5">36 perguntas para cruzar interesses, valores, estilo de trabalho e aptidões percebidas.</p>
                  <span className="inline-flex items-center gap-2 font-bold text-cyan-200 group-hover:gap-3 transition-all">Descobrir meu caminho <ArrowRight className="w-4 h-4" /></span>
                </div>
              </button>

              <button onClick={() => { setInitialAreaId(null); setOpenAreas(true); }} className="group relative overflow-hidden rounded-[26px] border border-fuchsia-300/20 bg-gradient-to-br from-fuchsia-500/12 via-violet-500/10 to-transparent p-6 text-left hover:-translate-y-1 hover:border-fuchsia-200/45 transition-all duration-300 shadow-2xl shadow-fuchsia-950/20">
                <div className="absolute right-[-15px] bottom-[-20px] w-28 h-28 rounded-full bg-fuchsia-300/10 blur-xl" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-300 to-violet-400 text-[#16081d] flex items-center justify-center mb-5 shadow-lg shadow-fuchsia-400/15"><GraduationCap className="w-6 h-6" /></div>
                  <div className="text-[11px] font-black tracking-[.15em] text-fuchsia-200 uppercase mb-2">Já sabe seu curso</div>
                  <h2 className="text-2xl font-black mb-2">Encontrar minha faculdade</h2>
                  <p className="text-sm text-ink-400 leading-relaxed mb-5">Compare faculdades pelo seu perfil — não apenas por fama ou ranking.</p>
                  <span className="inline-flex items-center gap-2 font-bold text-fuchsia-200 group-hover:gap-3 transition-all">Escolher minha área <ArrowRight className="w-4 h-4" /></span>
                </div>
              </button>
            </div>
          </div>

          <div className="relative min-h-[520px] md:min-h-[610px]">
            <div className="absolute inset-x-8 top-6 bottom-0 rounded-[40px] bg-gradient-to-br from-cyan-400/20 via-brand-500/5 to-fuchsia-500/15 blur-2xl" />
            <div className="absolute left-0 top-0 w-[76%] h-[78%] rounded-[34px] overflow-hidden border border-white/10 shadow-2xl shadow-black/40 rotate-[-2deg]">
              <img src={HERO_PHOTO} alt="Estudantes universitários reunidos" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07101d]/90 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5"><div className="inline-flex items-center gap-2 rounded-full bg-black/35 border border-white/15 px-3 py-1.5 text-[11px] font-bold backdrop-blur-xl"><BrainCircuit className="w-3.5 h-3.5 text-cyan-200" /> Match baseado em perfil</div></div>
            </div>
            <div className="absolute right-0 top-[18%] w-[45%] h-[34%] rounded-[28px] overflow-hidden border-4 border-[#070b16] shadow-2xl rotate-[4deg]">
              <img src={CAMPUS_PHOTO} alt="Campus universitário" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="absolute right-[5%] bottom-[5%] w-[52%] h-[33%] rounded-[28px] overflow-hidden border-4 border-[#070b16] shadow-2xl rotate-[-3deg]">
              <img src={STUDY_PHOTO} alt="Vida universitária" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="absolute left-[6%] bottom-[5%] rounded-3xl border border-white/10 bg-[#0c1424]/90 backdrop-blur-2xl p-4 shadow-2xl min-w-[175px]">
              <div className="text-[10px] uppercase tracking-[.16em] text-ink-500 font-black">Seu resultado</div>
              <div className="mt-1 flex items-end gap-2"><span className="text-4xl font-black text-cyan-200">91%</span><span className="text-xs text-ink-500 pb-1">fit</span></div>
              <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden"><div className="w-[91%] h-full bg-gradient-to-r from-cyan-300 to-fuchsia-300 rounded-full" /></div>
            </div>
          </div>
        </section>

        <section className="mt-20 md:mt-28 grid md:grid-cols-3 gap-4">
          {[
            { icon:<Target className="w-5 h-5" />, label:'Mais do que ranking', title:'Fit com você', text:'Entenda onde seu jeito de aprender, suas prioridades e seu ambiente ideal se encaixam melhor.', tone:'cyan' },
            { icon:<BarChart3 className="w-5 h-5" />, label:'Mais transparência', title:'Dados separados', text:'Fit, qualidade, carreira e confiança dos dados aparecem como dimensões diferentes.', tone:'fuchsia' },
            { icon:<BookOpen className="w-5 h-5" />, label:'Mais profundidade', title:'Curso + faculdade', text:'O Conectaê olha o programa e a experiência acadêmica, não apenas o nome da instituição.', tone:'amber' },
          ].map((card) => <div key={card.title} className="rounded-[28px] border border-white/10 bg-white/[0.035] p-6 md:p-7 backdrop-blur-sm hover:bg-white/[0.055] hover:-translate-y-1 transition-all duration-300"><div className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-5 ${card.tone==='cyan'?'bg-cyan-300/12 text-cyan-200':card.tone==='fuchsia'?'bg-fuchsia-300/12 text-fuchsia-200':'bg-amber-300/12 text-amber-200'}`}>{card.icon}</div><div className="text-[10px] uppercase tracking-[.16em] font-black text-ink-500 mb-2">{card.label}</div><h3 className="text-xl font-black mb-2">{card.title}</h3><p className="text-sm leading-relaxed text-ink-400">{card.text}</p></div>)}
        </section>

        <section className="mt-16 rounded-[32px] border border-white/10 bg-gradient-to-r from-white/[0.04] via-cyan-400/[0.035] to-fuchsia-400/[0.04] p-6 md:p-8 overflow-hidden relative">
          <div className="absolute -right-20 -top-20 w-60 h-60 rounded-full bg-fuchsia-400/10 blur-3xl" />
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div><div className="text-xs font-black tracking-[.16em] uppercase text-cyan-200 mb-2">Explore por área</div><h2 className="text-2xl md:text-3xl font-black">De Medicina a RI, de Design a Ciência da Computação.</h2></div>
            <div className="flex flex-wrap gap-2 max-w-2xl lg:justify-end">{['Saúde','Tecnologia','Negócios','Engenharias','Humanidades','Comunicação','Design','Educação'].map((area, index)=><span key={area} className={`px-3.5 py-2 rounded-full border text-xs font-bold ${index%4===0?'border-cyan-300/20 bg-cyan-300/10 text-cyan-100':index%4===1?'border-violet-300/20 bg-violet-300/10 text-violet-100':index%4===2?'border-fuchsia-300/20 bg-fuchsia-300/10 text-fuchsia-100':'border-amber-300/20 bg-amber-300/10 text-amber-100'}`}>{area}</span>)}</div>
          </div>
        </section>
      </main>
    </div>
  );
}
