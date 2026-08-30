import { useEffect, useState } from 'react';
import { ArrowRight, Compass, GraduationCap, Sparkles } from 'lucide-react';
import AreaMatchPortal from '@/components/AreaMatchPortal';

export default function ExpandedHomeMount() {
  const [openAreas, setOpenAreas] = useState(false);
  const params = new URLSearchParams(window.location.search);
  const legacy = params.get('modo') === 'business';

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ areaId?: string }>).detail;
      if (detail?.areaId) setOpenAreas(true);
    };
    window.addEventListener('conectae:open-area-match', handler);
    return () => window.removeEventListener('conectae:open-area-match', handler);
  }, []);

  if (legacy) return null;
  if (openAreas) return <div className="fixed inset-0 z-[90] overflow-y-auto"><AreaMatchPortal onClose={() => setOpenAreas(false)} /></div>;

  return (
    <div className="fixed inset-0 z-[80] overflow-y-auto bg-ink-950 text-ink-50">
      <div className="absolute inset-0 overflow-hidden pointer-events-none"><div className="absolute -top-48 -left-48 w-[520px] h-[520px] rounded-full bg-brand-500/20 blur-[130px]"/><div className="absolute top-1/3 -right-48 w-[560px] h-[560px] rounded-full bg-accent-500/10 blur-[140px]"/></div>
      <nav className="relative z-10 px-6 md:px-12 py-6 flex items-center justify-between"><div className="flex items-center gap-2.5"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-ink-950"/></div><span className="font-bold text-xl">Conecta<span className="text-brand-400">ê</span></span></div><span className="text-xs md:text-sm text-ink-500">Orientação universitária personalizada</span></nav>
      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-12 md:pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-300 text-sm mb-7"><Sparkles className="w-4 h-4"/> Do curso à faculdade certa</div>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6">Descubra o que estudar.<br/><span className="gradient-text">Depois, onde estudar.</span></h1>
        <p className="max-w-2xl mx-auto text-lg md:text-xl text-ink-400 mb-12">Comece pelo teste vocacional ou, se você já sabe sua área, vá direto para o questionário que encontra as faculdades com maior compatibilidade com o seu perfil.</p>
        <div className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto text-left">
          <button className="group rounded-3xl border border-brand-500/40 bg-brand-500/5 p-7 md:p-8 hover:bg-brand-500/10 hover:border-brand-400/60 transition-all"><div className="w-12 h-12 rounded-2xl bg-brand-500/15 text-brand-300 flex items-center justify-center mb-5"><Compass className="w-6 h-6"/></div><div className="text-xs font-bold tracking-wider text-brand-300 uppercase mb-2">Ainda não sei meu curso</div><h2 className="text-2xl font-bold mb-3">Fazer teste vocacional</h2><p className="text-ink-400 mb-6">Descubra as áreas e cursos que mais combinam com seus interesses, aptidões, valores e estilo de trabalho.</p><span className="inline-flex items-center gap-2 font-semibold text-brand-300 group-hover:gap-3 transition-all">Começar teste <ArrowRight className="w-4 h-4"/></span></button>
          <button onClick={() => setOpenAreas(true)} className="group rounded-3xl border border-ink-700 bg-ink-900/60 p-7 md:p-8 hover:border-accent-500/50 hover:bg-ink-900 transition-all"><div className="w-12 h-12 rounded-2xl bg-accent-500/10 text-accent-300 flex items-center justify-center mb-5"><GraduationCap className="w-6 h-6"/></div><div className="text-xs font-bold tracking-wider text-accent-300 uppercase mb-2">Já sabe seu curso</div><h2 className="text-2xl font-bold mb-3">Descubra a melhor faculdade</h2><p className="text-ink-400 mb-6">Escolha uma das 23 áreas do teste vocacional e responda um questionário específico para receber seu ranking personalizado.</p><span className="inline-flex items-center gap-2 font-semibold text-accent-300 group-hover:gap-3 transition-all">Escolher minha área <ArrowRight className="w-4 h-4"/></span></button>
        </div>
        <p className="mt-8 text-sm text-ink-500">Business continua disponível como a trilha “Negócios e Gestão”.</p>
      </main>
    </div>
  );
}
