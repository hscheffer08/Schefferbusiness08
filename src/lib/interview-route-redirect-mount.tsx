import { useEffect } from 'react';

const TARGET_LABELS = new Set(['Outras fases', 'Entrevista', 'Entrevistas']);

export default function InterviewRouteRedirectMount() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest('button');
      if (!button) return;

      const courseRoot = button.closest('.min-h-screen.bg-\[\#020817\]');
      if (!courseRoot) return;

      const label = button.querySelector('strong')?.textContent?.trim() || button.textContent?.trim() || '';
      if (!TARGET_LABELS.has(label)) return;

      if (label === 'Outras fases' || label === 'Entrevista' || label === 'Entrevistas') {
        event.preventDefault();
        event.stopPropagation();
        window.location.assign('/treino-entrevista');
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  return null;
}
