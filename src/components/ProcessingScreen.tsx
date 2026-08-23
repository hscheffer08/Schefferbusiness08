import { useEffect, useState } from 'react';
import { GraduationCap, Sparkles } from 'lucide-react';

interface ProcessingScreenProps {
  onComplete: () => void;
}

const MESSAGES = [
  'Analisando seu perfil...',
  'Comparando suas respostas com 7 B-Schools...',
  'Calculando compatibilidade...',
  'Seu resultado está pronto.',
];

export default function ProcessingScreen({ onComplete }: ProcessingScreenProps) {
  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    MESSAGES.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setCurrentMessage(i);
        if (i === MESSAGES.length - 1) {
          timers.push(setTimeout(() => onComplete(), 800));
        }
      }, i * 900));
    });
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const isLast = currentMessage === MESSAGES.length - 1;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] rounded-full bg-brand-500/15 blur-[130px]" />
        <div className="absolute bottom-0 -right-40 w-[500px] h-[500px] rounded-full bg-accent-500/10 blur-[140px]" />
      </div>

      <div className="relative z-10 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-400 to-brand-600 mb-8 shadow-2xl shadow-brand-500/30">
          {isLast ? (
            <Sparkles className="w-10 h-10 text-ink-950" strokeWidth={2.5} />
          ) : (
            <GraduationCap className="w-10 h-10 text-ink-950" strokeWidth={2.5} />
          )}
        </div>

        <div key={currentMessage} style={{ animation: 'fadeUp 0.4s ease-out' }}>
          <h2 className={`text-2xl md:text-3xl font-bold tracking-tight mb-4 ${isLast ? 'gradient-text font-serif italic' : ''}`}>
            {MESSAGES[currentMessage]}
          </h2>
        </div>

        {!isLast && (
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-brand-400"
                style={{
                  animation: `pulse 1s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
