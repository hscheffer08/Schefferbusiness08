import { useEffect, useState } from 'react';
import VocationalDemoPremium from '@/components/VocationalDemoPremium';

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
    const closeVocational = () => setOpen(false);

    document.addEventListener('click', handleClick);
    window.addEventListener('conectae:close-vocational', closeVocational);
    return () => {
      document.removeEventListener('click', handleClick);
      window.removeEventListener('conectae:close-vocational', closeVocational);
    };
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
      <VocationalDemoPremium onBack={() => setOpen(false)} />
    </div>
  );
}
