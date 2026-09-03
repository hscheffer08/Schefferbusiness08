import { ArrowRight, Target } from 'lucide-react';

export default function AdmissionsPlannerEntryMount() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('modo') === 'business' || params.get('planner') === 'aprovacao') return null;

  const open = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('planner', 'aprovacao');
    url.searchParams.delete('experience');
    window.location.assign(`${url.pathname}${url.search}${url.hash}`);
  };

  return (
    <button
      onClick={open}
      className="fixed z-[88] right-4 bottom-4 md:top-24 md:bottom-auto inline-flex items-center gap-3 rounded-2xl border border-[#72a5ff]/35 bg-[#071a38]/95 px-4 py-3 text-sm font-black text-white shadow-2xl shadow-black/40 backdrop-blur-xl hover:border-[#72a5ff] hover:-translate-y-0.5 transition-all"
      title="Abrir Curso de Aprovação"
    >
      <span className="w-9 h-9 rounded-xl bg-[#246cff] text-white inline-flex items-center justify-center shadow-lg shadow-[#246cff]/25"><Target className="w-4 h-4" /></span>
      <span className="text-left"><span className="block text-[10px] uppercase tracking-[.14em] text-[#8da5c5]">Principal</span><span className="block">Curso de Aprovação</span></span>
      <ArrowRight className="w-4 h-4 text-[#72a5ff]" />
    </button>
  );
}
