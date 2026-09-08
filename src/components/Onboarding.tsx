import { useState } from 'react';
import { ArrowRight, GraduationCap, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { trackEvent } from '@/lib/analytics';

interface OnboardingProps {
  onComplete: () => void;
}

const SCHOOL_YEARS = [
  '1º ano do Ensino Médio',
  '2º ano do Ensino Médio',
  '3º ano do Ensino Médio',
  'Pré-vestibular / Cursinho',
  'Ensino Superior (incompleto)',
  'Outro',
];

const AGE_RANGES = [
  'Menos de 15 anos',
  '15-16 anos',
  '17-18 anos',
  '21 ou mais',
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const { user, profile, updateProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(profile?.display_name ?? '');
  const [schoolYear, setSchoolYear] = useState(profile?.school_year ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [state, setState] = useState(profile?.state ?? '');
  const [ageRange, setAgeRange] = useState(profile?.age_range ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const email = user?.email ?? '';

  const steps = [
    { label: 'Como podemos te chamar?', value: name, set: setName, type: 'text' as const, placeholder: 'Seu nome' },
    { label: 'Em qual ano/série você está?', value: schoolYear, set: setSchoolYear, type: 'select' as const, options: SCHOOL_YEARS },
    { label: 'Qual sua cidade?', value: city, set: setCity, type: 'text' as const, placeholder: 'São Paulo' },
    { label: 'Qual seu estado?', value: state, set: setState, type: 'text' as const, placeholder: 'SP' },
    { label: 'Qual sua faixa etária?', value: ageRange, set: setAgeRange, type: 'select' as const, options: AGE_RANGES },
  ];

  const handleNext = async () => {
    setError(null);
    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    const { error: err } = await updateProfile({
      display_name: name,
      school_year: schoolYear,
      city,
      state,
      age_range: ageRange,
      onboarding_completed: true,
    });
    if (err) {
      setError(err);
      setLoading(false);
      return;
    }
    trackEvent('signup_completed', { onboarding: true }, user?.id);
    setLoading(false);
    onComplete();
  };

  const currentStep = steps[step];
  const isLast = step === steps.length - 1;
  const canProceed = currentStep.value.trim() !== '';

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/4 w-[400px] h-[400px] rounded-full bg-brand-500/15 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-accent-500/8 blur-[120px]" />
      </div>

      <header className="relative z-10 flex items-center gap-2.5 px-6 py-6 md:px-12">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
          <GraduationCap className="w-5 h-5 text-ink-950" strokeWidth={2.5} />
        </div>
        <span className="font-bold text-lg tracking-tight">
          Conecta<span className="text-brand-400">ê</span>
        </span>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-16 max-w-xl mx-auto w-full">
        <div className="w-full mb-6">
          <div className="flex justify-between text-xs text-ink-500 mb-2">
            <span>Configuração rápida</span>
            <span>{step + 1} / {steps.length}</span>
          </div>
          <div className="h-1.5 rounded-full bg-ink-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400 transition-all duration-500"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        <div key={step} className="w-full" style={{ animation: 'fadeUp 0.4s ease-out' }}>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-2">
            {currentStep.label}
          </h2>
          {step === 0 && email && (
            <p className="text-ink-500 text-center mb-8 text-sm">
              Seu e-mail: <span className="text-ink-300">{email}</span>
            </p>
          )}

          <div className="mt-8">
            {currentStep.type === 'text' ? (
              <input
                type="text"
                value={currentStep.value}
                onChange={(e) => currentStep.set(e.target.value)}
                placeholder={'placeholder' in currentStep ? currentStep.placeholder : ''}
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter' && canProceed) handleNext(); }}
                className="w-full px-5 py-4 rounded-2xl bg-ink-800/50 border border-ink-700 text-ink-100 placeholder-ink-600 focus:outline-none focus:border-brand-500 focus:bg-ink-800 transition-colors text-lg text-center"
              />
            ) : (
              <div className="space-y-2.5">
                {'options' in currentStep && currentStep.options?.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => currentStep.set(opt)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all ${
                      currentStep.value === opt
                        ? 'bg-brand-500/15 border-brand-500 text-ink-50 shadow-lg shadow-brand-500/10'
                        : 'bg-ink-800/50 border-ink-700 text-ink-300 hover:border-ink-600 hover:bg-ink-800'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm mt-4">{error}</p>
        )}

        <button
          onClick={handleNext}
          disabled={!canProceed || loading}
          className="w-full mt-10 flex items-center justify-center gap-2.5 py-4 rounded-2xl font-semibold text-base transition-all
            disabled:opacity-40 disabled:cursor-not-allowed
            enabled:bg-brand-500 enabled:hover:bg-brand-400 enabled:text-ink-950 enabled:shadow-xl enabled:shadow-brand-500/20 enabled:hover:scale-[1.01] enabled:active:scale-95
            bg-ink-800 text-ink-500"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {isLast ? 'Tudo pronto. Vamos começar!' : 'Continuar'}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        {isLast && (
          <p className="text-ink-500 text-sm mt-4 text-center">
            Tudo pronto. Vamos descobrir qual faculdade mais combina com você.
          </p>
        )}
      </main>
    </div>
  );
}
