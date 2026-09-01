import { Target } from 'lucide-react';

export default function AdmissionsPlannerEntryMount() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('modo') === 'business' || params.get('planner') === 'aprovacao') return null;

  const open = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('planner', 'aprovacao');
    window.location.assign(`${url.pathname}${url.search}${url.hash}`);
  };

  return (
    <button
      onClick={open}
      className="fixed z-[88] right-5 bottom-5 md:top-24 md:bottom-auto inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-[#0b1525]/95 px-4 py-3 text-sm font-black text-cyan-100 shadow-2xl shadow-black/30 backdrop-blur-xl hover:border-cyan-200/60 hover:-translate-y-0.5 transition-all"
      title="Abrir Plano de Aprovação"
    >
      <span className="w-8 h-8 rounded-full bg-cyan-300 text-[#07111d] inline-flex items-center justify-center"><Target className="w-4 h-4" /></span>
      <span>Plano de Aprovação</span>
    </button>
  );
}
