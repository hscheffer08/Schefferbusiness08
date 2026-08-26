import { useEffect, useState } from 'react';
import VocationalDemo from '@/components/VocationalDemo';

export default function VocationalDemoMount() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest('button');
      if (!button) return;
      const text = button.textContent ?? '';
      if (text.includes('Fazer teste vocacional') || text.includes('Demo de Exploração Vocacional')) {
        setOpen(true);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-ink-950">
      <VocationalDemo onBack={() => setOpen(false)} />
    </div>
  );
}
