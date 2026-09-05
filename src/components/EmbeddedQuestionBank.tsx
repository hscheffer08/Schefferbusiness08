import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import AdmissionsPlannerV11 from '@/components/AdmissionsPlannerV11';

export default function EmbeddedQuestionBank({ onBack }: { onBack: () => void }) {
  const rootRef = useRef<HTMLElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stopped = false;
    let tries = 0;
    const maxTries = 80;

    const activateQuestions = () => {
      if (stopped) return;
      tries += 1;
      const root = rootRef.current;
      const buttons = Array.from(root?.querySelectorAll<HTMLButtonElement>('.plan6-tab') ?? []);
      const questionsButton = buttons.find(button => button.textContent?.trim() === 'Questões');
      if (questionsButton) {
        if (!questionsButton.classList.contains('active')) questionsButton.click();
        window.requestAnimationFrame(() => {
          const active = root?.querySelector<HTMLButtonElement>('.plan6-tab.active');
          if (active?.textContent?.trim() === 'Questões') {
            setReady(true);
            window.scrollTo({ top: 0, behavior: 'auto' });
          }
        });
      }
      if (!stopped && tries < maxTries) window.setTimeout(activateQuestions, 75);
    };

    activateQuestions();
    return () => { stopped = true; };
  }, []);

  return (
    <section ref={rootRef} id="curso-questoes" className="relative -mx-4 md:mx-0">
      {!ready && (
        <div className="flex min-h-[240px] items-center justify-center rounded-[20px] border border-[#173765] bg-[#06152f]">
          <div className="flex items-center gap-2 text-sm font-bold text-[#9fb5d4]"><Loader2 size={17} className="animate-spin"/>Abrindo seu banco de questões…</div>
        </div>
      )}
      <div className={ready ? 'block' : 'invisible h-0 overflow-hidden'}>
        <div className="[&_.plan6-top]:!hidden [&_.plan6-hero]:!hidden [&_.plan6-selectors]:!hidden [&_.plan6-tabs]:!hidden [&_.plan6-bottomnav]:!hidden">
          <AdmissionsPlannerV11 onBack={onBack} />
        </div>
      </div>
    </section>
  );
}
