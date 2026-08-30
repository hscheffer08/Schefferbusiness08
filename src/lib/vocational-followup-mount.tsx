import { useEffect, useState } from 'react';
import { ArrowRight, GraduationCap } from 'lucide-react';

export default function VocationalFollowupMount() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const detectResults = () => {
      const text = document.body.innerText;
      setVisible(text.includes('Próximo passo recomendado') && text.includes('Ranking completo'));
    };
    detectResults();
    const observer = new MutationObserver(detectResults);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  const continueToCollegeMatch = () => {
    window.dispatchEvent(new CustomEvent('conectae:close-vocational'));
    window.dispatchEvent(new CustomEvent('conectae:open-area-match'));
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[130] md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[680px]">
      <div className="rounded-2xl border border-brand-400/40 bg-ink-950/95 backdrop-blur-xl shadow-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-brand-500/15 text-brand-300 flex items-center justify-center flex-shrink-0"><GraduationCap className="w-5 h-5" /></div>
        <div className="flex-1">
          <p className="text-sm font-bold text-ink-100">Agora descubra onde estudar</p>
          <p className="text-xs text-ink-400 mt-1">Escolha a área do curso recomendado e faça o questionário para encontrar as faculdades com maior fit para você.</p>
        </div>
        <button onClick={continueToCollegeMatch} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-white font-bold px-5 py-3 whitespace-nowrap">Encontrar minha faculdade <ArrowRight className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
