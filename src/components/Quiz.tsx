import { useState, useCallback, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2, Zap, BadgeCheck, SkipForward } from 'lucide-react';
import type { Question, AnswerMap, QuizMode } from '@/types';
import {
  getQuestionOptions,
  isScaleQuestion,
  isNumericQuestion,
  isTextQuestion,
  isChoiceQuestion,
  isSliderQuestion,
  isMultiChoiceQuestion,
  MULTI_CHOICE_MAX,
} from '@/lib/question-options';
import { saveProgress, loadProgress } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { trackEvent } from '@/lib/analytics';

interface QuizProps {
  questions: Question[];
  mode: QuizMode;
  onComplete: (answers: AnswerMap) => void;
  onBack: () => void;
}

export default function Quiz({ questions, mode, onComplete, onBack }: QuizProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [loaded, setLoaded] = useState(false);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);
  const trackedStarted = useRef(false);

  const filteredQuestions = mode === 'quick'
    ? questions.filter((q) => q.is_quick_match)
    : questions;

  const currentQuestion = filteredQuestions[currentStep];
  const totalSteps = filteredQuestions.length;
  const currentValue = answers[currentQuestion?.question_id] ?? '';
  const isRequired = currentQuestion?.is_required ?? true;
  const isAnswered = currentValue !== '';
  const canAdvance = isAnswered || !isRequired;
  const progress = ((currentStep + (isAnswered ? 1 : 0)) / totalSteps) * 100;
  const isLast = currentStep === totalSteps - 1;

  useEffect(() => {
    if (trackedStarted.current) return;
    trackedStarted.current = true;
    trackEvent('match_started', { mode }, user?.id);
  }, [user, mode]);

  useEffect(() => {
    if (loaded || !user) return;
    loadProgress().then((progress) => {
      if (progress && Object.keys(progress.answers).length > 0) {
        setAnswers(progress.answers);
        setCurrentStep(progress.currentStep);
        setHasSavedProgress(true);
      }
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, [user, loaded]);

  const handleAnswer = useCallback((value: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [currentQuestion.question_id]: value };
      if (user) {
        saveProgress(next, currentStep).catch(() => {});
      }
      trackEvent('question_answered', { question_id: currentQuestion.question_id }, user?.id);
      return next;
    });
  }, [currentQuestion, currentStep, user]);

  const goNext = useCallback(() => {
    if (isLast) {
      const referralSource = answers['Q41'];
      const referrerName = answers['Q42']?.trim();
      if (referralSource && referralSource !== 'nenhum') {
        trackEvent('referral_source', { source: referralSource, referrer_name: referrerName || null }, user?.id);
      }
      onComplete(answers);
      return;
    }
    setDirection('forward');
    setCurrentStep((s) => s + 1);
  }, [isLast, answers, onComplete, user]);


  const skipSavedProgress = () => {
    setHasSavedProgress(false);
  };

  const goBack = useCallback(() => {
    if (currentStep === 0) {
      onBack();
      return;
    }
    setDirection('back');
    setCurrentStep((s) => s - 1);
  }, [currentStep, onBack]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && canAdvance) {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [canAdvance, goNext]);

  if (!loaded && user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (hasSavedProgress) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-md">
          <h2 className="text-2xl font-bold tracking-tight mb-3">Você tem um questionário em andamento</h2>
          <p className="text-ink-400 text-sm mb-8">Você estava na pergunta {currentStep + 1} de {totalSteps}. Quer continuar de onde parou ou começar do zero?</p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setHasSavedProgress(false)}
              className="w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-ink-950 font-semibold transition-all"
            >
              Continuar de onde parei
            </button>
            <button
              onClick={skipSavedProgress}
              className="w-full py-3.5 rounded-xl bg-ink-800 hover:bg-ink-700 text-ink-300 font-medium transition-colors"
            >
              Começar do zero
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/4 w-[400px] h-[400px] rounded-full bg-brand-500/15 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-accent-500/8 blur-[120px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12">
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-ink-400 hover:text-ink-100 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          {currentStep === 0 ? 'Início' : 'Voltar'}
        </button>
        <div className="flex items-center gap-2">
          {mode === 'quick' ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-300 text-xs font-medium">
              <Zap className="w-3 h-3" />
              Match Rápido
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent-500/15 text-accent-300 text-xs font-medium">
              <BadgeCheck className="w-3 h-3" />
              Perfil Verificado
            </span>
          )}
          <span className="text-sm font-semibold text-ink-300">
            {currentStep + 1} <span className="text-ink-600">/ {totalSteps}</span>
          </span>
        </div>
      </header>

      <div className="relative z-10 px-6 md:px-12 mb-12">
        <div className="flex justify-between text-xs text-ink-500 mb-2">
          <span>Progresso</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-ink-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pb-16 max-w-2xl mx-auto w-full">
        <div
          key={currentStep}
          className="w-full"
          style={{
            animation: direction === 'forward' ? 'slideIn 0.4s ease-out' : 'fadeUp 0.4s ease-out',
          }}
        >
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-balance text-center mb-2 leading-tight">
            {currentQuestion.question_text}
          </h2>
          {currentQuestion.helper_text && (
            <p className="text-sm text-ink-500 text-center mb-6 max-w-lg mx-auto leading-relaxed">
              {currentQuestion.helper_text}
            </p>
          )}
          <div className="w-full mt-6">
            <QuestionInput
              question={currentQuestion}
              value={currentValue}
              onChange={handleAnswer}
            />
          </div>
        </div>
      </main>

      <footer className="relative z-10 px-6 pb-10 md:px-12 max-w-2xl mx-auto w-full">
        <button
          onClick={goNext}
          disabled={!canAdvance}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-semibold text-base transition-all
            disabled:opacity-40 disabled:cursor-not-allowed
            enabled:bg-brand-500 enabled:hover:bg-brand-400 enabled:text-white enabled:shadow-xl enabled:shadow-brand-500/20 enabled:hover:scale-[1.01] enabled:active:scale-95
            bg-ink-800 text-ink-500"
        >
          {isLast ? (
            <>
              Ver meu ranking
              <Check className="w-5 h-5" />
            </>
          ) : (
            <>
              Próxima
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
        {!isRequired && !isAnswered && (
          <button
            onClick={goNext}
            className="w-full mt-3 py-2.5 rounded-xl text-sm font-medium text-ink-500 hover:text-ink-300 hover:bg-ink-800/50 transition-all flex items-center justify-center gap-1.5"
          >
            Pular esta pergunta
            <SkipForward className="w-4 h-4" />
          </button>
        )}
      </footer>
    </div>
  );
}

function QuestionInput({
  question,
  value,
  onChange,
}: {
  question: Question;
  value: string;
  onChange: (value: string) => void;
}) {
  if (isSliderQuestion(question)) {
    return <SliderInput question={question} value={value} onChange={onChange} />;
  }

  if (isMultiChoiceQuestion(question)) {
    const options = getQuestionOptions(question);
    if (!options) return null;
    return <MultiChoiceInput options={options} value={value} onChange={onChange} max={MULTI_CHOICE_MAX} />;
  }

  if (isChoiceQuestion(question)) {
    const options = getQuestionOptions(question);
    if (!options) return null;
    return <ChoiceInput options={options} value={value} onChange={onChange} />;
  }

  if (isTextQuestion(question)) {
    return <TextInput question={question} value={value} onChange={onChange} />;
  }

  return <TextInput question={question} value={value} onChange={onChange} />;
}

function SliderInput({ question, value, onChange }: { question: Question; value: string; onChange: (v: string) => void }) {
  const numValue = value ? parseInt(value, 10) : 50;
  const sliderValue = Math.round(numValue / 5) * 5;
  const clamped = Math.max(0, Math.min(100, sliderValue));
  const pct = clamped;

  const minLabel = question.scale_min_label;
  const midLabel = question.scale_mid_label;
  const maxLabel = question.scale_max_label;

  const interpretation = (v: number): string | null => {
    if (v <= 15) return minLabel?.split(' — ')[1] ?? null;
    if (v <= 40) return minLabel?.split(' — ')[1] ?? null;
    if (v <= 60) return midLabel?.split(' — ')[1] ?? null;
    if (v <= 85) return maxLabel?.split(' — ')[1] ?? null;
    return maxLabel?.split(' — ')[1] ?? null;
  };

  return (
    <div>
      <div className="flex items-center justify-center mb-4">
        <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 border border-brand-700/40 flex items-center justify-center">
          <span className="text-3xl font-bold text-brand-400">{clamped}</span>
        </div>
      </div>

      {interpretation(clamped) && (
        <p className="text-center text-sm text-ink-400 mb-4">
          {interpretation(clamped)}
        </p>
      )}

      <div className="relative px-1">
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={clamped}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-2 rounded-full appearance-none cursor-pointer slider-thumb"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #22d3ee ${pct}%, #1a1f3d ${pct}%, #1a1f3d 100%)`,
          }}
        />
      </div>

      <div className="flex justify-between text-xs text-ink-600 mt-2 px-1">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>

      {(minLabel || maxLabel) && (
        <div className="flex justify-between text-xs text-ink-500 mt-3 px-1 gap-2">
          <span className="text-left max-w-[40%]">{minLabel}</span>
          <span className="text-right max-w-[40%]">{maxLabel}</span>
        </div>
      )}

      {midLabel && (
        <div className="text-center text-xs text-ink-600 mt-1.5">
          {midLabel}
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-1.5 mt-5">
        {[0, 20, 40, 60, 80, 100].map((n) => (
          <button
            key={n}
            onClick={() => onChange(String(n))}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              clamped === n
                ? 'bg-brand-500 text-white'
                : 'bg-ink-800 text-ink-400 hover:bg-ink-700'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function MultiChoiceInput({
  options,
  value,
  onChange,
  max,
}: {
  options: { label: string; value: string; score: number }[];
  value: string;
  onChange: (v: string) => void;
  max: number;
}) {
  const selected = value ? value.split(',').map((s) => s.trim()).filter(Boolean) : [];

  const toggle = (val: string) => {
    if (selected.includes(val)) {
      const next = selected.filter((s) => s !== val);
      onChange(next.join(','));
    } else {
      if (selected.length >= max) return;
      onChange([...selected, val].join(','));
    }
  };

  return (
    <div>
      <div className="space-y-2.5">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);
          const disabled = !isSelected && selected.length >= max;
          return (
            <button
              key={option.value}
              onClick={() => toggle(option.value)}
              disabled={disabled}
              className={`w-full flex items-center gap-3 text-left p-4 rounded-2xl border transition-all ${
                isSelected
                  ? 'bg-brand-500/15 border-brand-500 text-ink-50 shadow-lg shadow-brand-500/10'
                  : disabled
                  ? 'bg-ink-800/30 border-ink-800 text-ink-600 cursor-not-allowed opacity-50'
                  : 'bg-ink-800/50 border-ink-700 text-ink-300 hover:border-ink-600 hover:bg-ink-800'
              }`}
            >
              <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${
                isSelected
                  ? 'border-brand-400 bg-brand-400'
                  : 'border-ink-600'
              }`}>
                {isSelected && <Check className="w-3 h-3 text-ink-950" />}
              </div>
              <span className="font-medium">{option.label}</span>
            </button>
          );
        })}
      </div>
      <p className="text-center text-xs text-ink-500 mt-4">
        {selected.length} de {max} selecionados
      </p>
    </div>
  );
}

function ChoiceInput({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: string; score: number }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2.5">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`w-full text-left p-4 rounded-2xl border transition-all ${
            value === option.value
              ? 'bg-brand-500/15 border-brand-500 text-ink-50 shadow-lg shadow-brand-500/10'
              : 'bg-ink-800/50 border-ink-700 text-ink-300 hover:border-ink-600 hover:bg-ink-800'
          }`}
        >
          <span className="font-medium">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

function TextInput({ question, value, onChange }: { question: Question; value: string; onChange: (v: string) => void }) {
  const placeholder = question.helper_text
    ? question.helper_text
    : 'Digite sua resposta...';
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={5}
      placeholder={placeholder}
      className="w-full p-4 rounded-2xl bg-ink-800/50 border border-ink-700 text-ink-100 placeholder-ink-600 focus:outline-none focus:border-brand-500 focus:bg-ink-800 transition-colors resize-none text-sm leading-relaxed"
    />
  );
}
