import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen } from 'lucide-react';

export default function EssayHomeEntryMount() {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const find = () => {
      const buttons = [...document.querySelectorAll<HTMLButtonElement>('button')];
      const anchor = buttons.find((button) => button.textContent?.includes('Ainda estou escolhendo'));
      const parent = anchor?.parentElement;
      if (!parent || !parent.closest('main')) return;

      const oldButtons = [...parent.querySelectorAll<HTMLButtonElement>('button')].filter(
        (button) => button.textContent?.trim() === 'Curso de Redação ENEM' || button.textContent?.trim() === 'Cursos Particulares'
      );
      oldButtons.forEach((button) => {
        if (!button.hasAttribute('data-private-courses-home-entry')) button.remove();
      });

      setHost(parent);
    };

    find();
    const observer = new MutationObserver(find);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  if (!host) return null;
  if (host.querySelector('[data-private-courses-home-entry]')) return null;

  return createPortal(
    <button
      data-private-courses-home-entry
      onClick={() => window.location.assign('/cursos-particulares')}
      className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-[#d7deee] bg-white px-6 text-sm font-extrabold text-[#273552] shadow-sm hover:border-[#9eafff] hover:text-[#3155e7]"
    >
      <BookOpen className="h-5 w-5 text-[#3155e7]" />
      <span>Cursos Particulares</span>
    </button>,
    host
  );
}
