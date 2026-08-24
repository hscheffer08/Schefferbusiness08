import { ArrowRight, Sparkles, GraduationCap, Compass, Trophy, BookOpen, FlaskConical, HelpCircle, Shield, FileText, Zap, Clock, BadgeCheck, FileCheck2, LockKeyhole } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { trackEvent, initSessionId } from '@/lib/analytics';
import { useEffect } from 'react';
import type { QuizMode } from '@/types';

interface HomeProps {
  onStart: (mode: QuizMode) => void;
  onProfile: () => void;
  onAuth: () => void;
  onNavigate: (screen: 'howitworks' | 'methodology' | 'faq' | 'privacy' | 'terms' | 'compare' | 'admin' | 'faculty-questionnaire') => void;
}

export default function Home({ onStart, onProfile, onAuth, onNavigate }: HomeProps) {
  const { user, profile } = useAuth();
  const isAdmin = user?.app_metadata?.role === 'admin';

  useEffect(() => {
    initSessionId();
    trackEvent('homepage_view', undefined, user?.id);
  }, [user?.id]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-brand-500/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full bg-accent-500/10 blur-[140px]" />
        <div className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] rounded-full bg-brand-400/10 blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <GraduationCap className="w-5 h-5 text-ink-950" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-lg tracking-tight">
            B-School<span className="text-brand-400"> Fit</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-4 text-sm text-ink-400">
            <button onClick={() => onNavigate('howitworks')} className="hover:text-ink-200 transition-colors">Como funciona</button>
            <button onClick={() => onNavigate('methodology')} className="hover:text-ink-200 transition-colors">Metodologia</button>
            <button onClick={() => onNavigate('compare')} className="hover:text-ink-200 transition-colors">Comparar</button>
            <button onClick={() => onNavigate('faq')} className="hover:text-ink-200 transition-colors">FAQ</button>
          </div>
          <button
            onClick={() => onNavigate('faculty-questionnaire')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 text-violet-200 text-sm font-semibold transition-colors"
            title="Abrir Questionário para as Faculdades"
          >
            <FileCheck2 className="w-4 h-4" />
            <span className="hidden md:inline">Faculdades</span>
          </button>
          {user ? (
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={() => onNavigate('admin')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ink-800 hover:bg-ink-700 text-ink-300 text-sm font-medium transition-colors"
                  title="Painel administrativo"
                >
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Painel</span>
                </button>
              )}
              <button
                onClick={onProfile}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-ink-800 hover:bg-ink-700 text-ink-200 text-sm font-medium transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-ink-950 text-xs font-bold">
                  {(profile?.display_name || user.email || '?')[0].toUpperCase()}
                </div>
                <span className="hidden sm:inline">{profile?.display_name || 'Minha conta'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={onAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-ink-300 hover:text-ink-100 text-sm font-medium transition-colors"
              >
                Entrar
              </button>
              <button
                onClick={onAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-ink-950 text-sm font-semibold transition-colors"
              >
                Criar conta
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-8 pb-24 md:pt-16 md:pb-32 max-w-5xl mx-auto text-center">
        <div className="animate-fade-in inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent-500/30 bg-accent-500/10 text-sm text-accent-300 mb-8">
          <span className="text-base">🎓</span>
          Período de lançamento — gratuito
        </div>

        <h1 className="animate-fade-up font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight text-balance leading-[1.1] mb-6">
          Descubra a faculdade de <span className="gradient-text font-serif italic">Business</span> que combina com seu perfil
        </h1>

        <p className="animate-fade-up text-lg md:text-xl text-ink-400 max-w-2xl mb-10 text-balance leading-relaxed" style={{ animationDelay: '0.1s' }}>
          Escolha sua experiência: faça um Match Rápido em poucos minutos ou crie um Perfil Verificado completo para se conectar com faculdades.
        </p>

        {/* Two-track selection */}
        <div className="animate-fade-up grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl" style={{ animationDelay: '0.2s' }}>
          {/* Match Rápido */}
          <button
            onClick={() => onStart('quick')}
            className="group relative text-left p-6 rounded-2xl border border-brand-500/40 bg-brand-500/5 hover:bg-brand-500/10 hover:border-brand-500/60 transition-all hover:scale-[1.02] active:scale-95 overflow-hidden"
          >
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-brand-500/15 blur-2xl group-hover:bg-brand-500/25 transition-colors" />
            <div className="relative">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-300 text-xs font-medium">
                  <Clock className="w-3 h-3" />
                  ≈ 2–3 min
                </div>
              </div>
              <h3 className="text-xl font-bold text-ink-50 mb-1.5">Match Rápido</h3>
              <p className="text-sm text-ink-400 leading-relaxed mb-4">
                Responda apenas o essencial e descubra quais faculdades mais combinam com seu perfil.
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-400 group-hover:gap-2.5 transition-all">
                Fazer Match Rápido
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </button>

          {/* Perfil Verificado */}
          <button
            onClick={() => onStart('full')}
            className="group relative text-left p-6 rounded-2xl border border-ink-700 bg-ink-800/30 hover:bg-ink-800/50 hover:border-ink-600 transition-all hover:scale-[1.02] active:scale-95 overflow-hidden"
          >
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-accent-500/10 blur-2xl group-hover:bg-accent-500/20 transition-colors" />
            <div className="relative">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-10 h-10 rounded-xl bg-accent-500/15 text-accent-400 flex items-center justify-center">
                  <BadgeCheck className="w-5 h-5" />
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-ink-700 text-ink-400 text-xs font-medium">
                  <Clock className="w-3 h-3" />
                  ≈ 15–20 min
                </div>
              </div>
              <h3 className="text-xl font-bold text-ink-50 mb-1.5">Perfil Verificado</h3>
              <p className="text-sm text-ink-400 leading-relaxed mb-4">
                Um perfil acadêmico completo que poderá ser compartilhado com faculdades somente com sua autorização.
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-400 group-hover:gap-2.5 transition-all">
                Criar Perfil Verificado
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </button>
        </div>

        <button
          onClick={() => onNavigate('faculty-questionnaire')}
          className="animate-fade-up mt-5 w-full max-w-3xl group relative overflow-hidden rounded-2xl border border-violet-500/35 bg-gradient-to-r from-violet-500/10 via-brand-500/5 to-accent-500/10 p-5 md:p-6 text-left hover:border-violet-400/60 transition-all"
          style={{ animationDelay: '0.3s' }}
        >
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/15 text-violet-300 flex items-center justify-center flex-shrink-0">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-ink-50">Questionário para as Faculdades</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-ink-800 text-ink-400 text-[11px] font-medium"><LockKeyhole className="w-3 h-3" /> Requer conta</span>
              </div>
              <p className="text-sm text-ink-400 leading-relaxed">Crie seu dossiê acadêmico com notas, extracurriculares, idiomas, conquistas e comprovantes.</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-300 group-hover:gap-2.5 transition-all">Abrir meu hub <ArrowRight className="w-4 h-4" /></span>
          </div>
        </button>

        <p className="mt-6 text-sm text-ink-500">Gratuito por tempo limitado · Sem documentos para o Match Rápido</p>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-20 w-full max-w-3xl">
          <FeatureCard
            icon={<Compass className="w-5 h-5" />}
            title="Questionário inteligente"
            desc="Perguntas dinâmicas sobre seu perfil acadêmico, comportamental e objetivos"
            delay="0.3s"
          />
          <FeatureCard
            icon={<Sparkles className="w-5 h-5" />}
            title="Match por perfil"
            desc="Algoritmo que compara sua personalidade com cada faculdade"
            delay="0.4s"
          />
          <FeatureCard
            icon={<Trophy className="w-5 h-5" />}
            title="Ranking personalizado"
            desc="Veja quais faculdades têm mais a ver com você"
            delay="0.5s"
          />
        </div>

        {/* Free period notice */}
        <div className="mt-12 max-w-2xl glass rounded-2xl border border-ink-800 p-5 text-left">
          <h3 className="font-semibold text-ink-200 text-sm mb-1.5">🎓 Período de lançamento</h3>
          <p className="text-sm text-ink-400 leading-relaxed">
            Faça seu B-School Fit gratuitamente. O acesso será pago futuramente, pelo valor de R$8.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-ink-800/50 px-6 py-8 md:px-12">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-ink-950" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-sm tracking-tight">B-School Fit</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-ink-500">
              <button onClick={() => onNavigate('howitworks')} className="flex items-center gap-1 hover:text-ink-300 transition-colors">
                <BookOpen className="w-3.5 h-3.5" /> Como funciona
              </button>
              <button onClick={() => onNavigate('methodology')} className="flex items-center gap-1 hover:text-ink-300 transition-colors">
                <FlaskConical className="w-3.5 h-3.5" /> Metodologia
              </button>
              <button onClick={() => onNavigate('faq')} className="flex items-center gap-1 hover:text-ink-300 transition-colors">
                <HelpCircle className="w-3.5 h-3.5" /> FAQ
              </button>
              <button onClick={() => onNavigate('privacy')} className="flex items-center gap-1 hover:text-ink-300 transition-colors">
                <Shield className="w-3.5 h-3.5" /> Privacidade
              </button>
              <button onClick={() => onNavigate('terms')} className="flex items-center gap-1 hover:text-ink-300 transition-colors">
                <FileText className="w-3.5 h-3.5" /> Termos
              </button>
            </div>
          </div>
          <p className="text-center text-xs text-ink-600 mt-4">
            B-School Fit mede compatibilidade de perfil, não chance de aprovação. Feito para estudantes brasileiros.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  delay: string;
}) {
  return (
    <div
      className="animate-fade-up glass rounded-2xl border border-ink-800 p-5 text-left hover:border-brand-700/50 hover:bg-ink-900/70 transition-all"
      style={{ animationDelay: delay }}
    >
      <div className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-400 flex items-center justify-center mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-ink-100 mb-1">{title}</h3>
      <p className="text-sm text-ink-400 leading-relaxed">{desc}</p>
    </div>
  );
}

