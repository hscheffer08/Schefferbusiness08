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
      className="fixed z-[88] right-4 bottom-4 md:top-24 md:bottom-auto inline-flex items-center gap-3 rounded-2xl border border-[#ffd45e]/35 bg-[#0b0904]/95 px-4 py-3 text-sm font-black text-white shadow-2xl shadow-black/40 backdrop-blur-xl hover:border-[#ffd45e] hover:-translate-y-0.5 transition-all"
      title="Abrir Curso de Aprovação"
    >
      <span className="w-9 h-9 rounded-xl bg-[#ffd45e] text-white inline-flex items-center justify-center shadow-lg shadow-[#ffd45e]/25"><Target className="w-4 h-4" /></span>
      <span className="text-left"><span className="block text-[10px] uppercase tracking-[.14em] text-[#b88408]">Principal</span><span className="block">Curso de Aprovação</span></span>
      <ArrowRight className="w-4 h-4 text-[#ffd45e]" />
    </button>
  );
}
