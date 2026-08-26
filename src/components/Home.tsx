import { ArrowRight, Sparkles, GraduationCap, Compass, Trophy, BookOpen, FlaskConical, HelpCircle, Shield, FileText, Zap, Clock, LockKeyhole } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { trackEvent, initSessionId } from '@/lib/analytics';
import { useEffect } from 'react';
import type { CountryCode, QuizMode } from '@/types';

interface HomeProps {
  onStart: (mode: QuizMode) => void;
  onProfile: () => void;
  onAuth: () => void;
  country: CountryCode;
  universityCount: number;
  onCountryChange: (country: CountryCode) => void;
  onNavigate: (screen: 'howitworks' | 'methodology' | 'faq' | 'privacy' | 'terms' | 'compare' | 'admin' | 'faculty-questionnaire' | 'vocational-demo') => void;
}

export default function Home({ onStart, onProfile, onAuth, country, universityCount, onCountryChange, onNavigate }: HomeProps) {
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

      <nav className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <GraduationCap className="w-5 h-5 text-ink-950" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-lg tracking-tight">Conecta<span className="text-brand-400">ê</span></span>
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
            disabled={country === 'US'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-semibold transition-colors ${country === 'US' ? 'cursor-not-allowed border-ink-800 bg-ink-900/50 text-ink-600' : 'border-violet-500/40 bg-violet-500/10 hover:bg-violet-500/20 text-violet-200'}`}
            title={country === 'US' ? 'Disponível apenas para faculdades brasileiras' : 'Abrir Questionário para as Faculdades'}
          >
            <FileText className="w-4 h-4" />
            <span className="hidden md:inline">Faculdades</span>
          </button>
          {user ? (
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button onClick={() => onNavigate('admin')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ink-800 hover:bg-ink-700 text-ink-300 text-sm font-medium transition-colors" title="Painel administrativo">
                  <Shield className="w-4 h-4" /><span className="hidden sm:inline">Painel</span>
                </button>
              )}
              <button onClick={onProfile} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-ink-800 hover:bg-ink-700 text-ink-200 text-sm font-medium transition-colors">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-ink-950 text-xs font-bold">{(profile?.display_name || user.email || '?')[0].toUpperCase()}</div>
                <span className="hidden sm:inline">{profile?.display_name || 'Minha conta'}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={onAuth} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-ink-300 hover:text-ink-100 text-sm font-medium transition-colors">Entrar</button>
              <button onClick={onAuth} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-ink-950 text-sm font-semibold transition-colors">Criar conta</button>
            </div>
          )}
        </div>
      </nav>

      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-8 pb-24 md:pt-16 md:pb-32 max-w-5xl mx-auto text-center">
        <div className="animate-fade-in inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent-500/30 bg-accent-500/10 text-sm text-accent-300 mb-8"><span className="text-base">🎓</span>Período de lançamento — gratuito</div>

        <div role="tablist" aria-label="Escolha o país das universidades" className="animate-fade-up mb-7 inline-flex items-center gap-2 rounded-3xl border border-ink-700 bg-ink-900/80 p-2">
          <button role="tab" aria-selected={country === 'BR'} aria-label="Universidades do Brasil" title="Brasil" onClick={() => onCountryChange('BR')} className={`flex h-16 w-20 items-center justify-center rounded-2xl transition-all ${country === 'BR' ? 'scale-105 border-2 border-brand-400 bg-brand-500/20 shadow-lg shadow-brand-500/20' : 'border-2 border-transparent opacity-45 hover:opacity-80'}`}><BrazilFlag /></button>
          <button role="tab" aria-selected={country === 'US'} aria-label="Universidades dos Estados Unidos" title="Estados Unidos" onClick={() => onCountryChange('US')} className={`flex h-16 w-20 items-center justify-center rounded-2xl transition-all ${country === 'US' ? 'scale-105 border-2 border-brand-400 bg-brand-500/20 shadow-lg shadow-brand-500/20' : 'border-2 border-transparent opacity-45 hover:opacity-80'}`}><UnitedStatesFlag /></button>
        </div>

        <h1 className="animate-fade-up font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight text-balance leading-[1.1] mb-6">Descubra a faculdade de <span className="gradient-text font-serif italic">Business</span> {country === 'US' ? 'nos EUA ' : ''}que combina com seu perfil</h1>
        <p className="animate-fade-up text-lg md:text-xl text-ink-400 max-w-2xl mb-10 text-balance leading-relaxed" style={{ animationDelay: '0.1s' }}>
          {country === 'US' ? `Compare seu perfil com ${universityCount} das melhores graduações de Business dos Estados Unidos usando o Match Rápido ou o Questionário Completo.` : `Compare seu perfil com ${universityCount} faculdades brasileiras usando o Match Rápido ou o Questionário Completo.`}
        </p>

        <div className="animate-fade-up grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl" style={{ animationDelay: '0.2s' }}>
          <button onClick={() => onStart('quick')} className="group relative text-left p-6 rounded-2xl border border-brand-500/40 bg-brand-500/5 hover:bg-brand-500/10 hover:border-brand-500/60 transition-all hover:scale-[1.02] active:scale-95 overflow-hidden">
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-brand-500/15 blur-2xl group-hover:bg-brand-500/25 transition-colors" />
            <div className="relative"><div className="flex items-center gap-2.5 mb-3"><div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center"><Zap className="w-5 h-5" /></div><div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-300 text-xs font-medium"><Clock className="w-3 h-3" />≈ 2–3 min</div></div><h3 className="text-xl font-bold text-ink-50 mb-1.5">Match Rápido</h3><p className="text-sm text-ink-400 leading-relaxed mb-4">Responda apenas o essencial e descubra quais faculdades mais combinam com seu perfil.</p><span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-400 group-hover:gap-2.5 transition-all">Fazer Match Rápido<ArrowRight className="w-4 h-4" /></span></div>
          </button>

          <button onClick={() => onStart('full')} className="group relative text-left p-6 rounded-2xl border border-ink-700 bg-ink-800/30 hover:bg-ink-800/50 hover:border-ink-600 transition-all hover:scale-[1.02] active:scale-95 overflow-hidden">
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-accent-500/10 blur-2xl group-hover:bg-accent-500/20 transition-colors" />
            <div className="relative"><div className="flex items-center gap-2.5 mb-3"><div className="w-10 h-10 rounded-xl bg-accent-500/15 text-accent-400 flex items-center justify-center"><BookOpen className="w-5 h-5" /></div><div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-ink-700 text-ink-400 text-xs font-medium"><Clock className="w-3 h-3" />≈ 15–20 min</div></div><h3 className="text-xl font-bold text-ink-50 mb-1.5">Questionário Completo</h3><p className="text-sm text-ink-400 leading-relaxed mb-4">{country === 'BR' ? 'Responda todas as perguntas e, se quiser, leve suas informações para a área das faculdades.' : 'Responda todas as perguntas para receber uma análise mais detalhada do seu perfil.'}</p><span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-400 group-hover:gap-2.5 transition-all">Fazer Questionário Completo<ArrowRight className="w-4 h-4" /></span></div>
          </button>
        </div>

        {country === 'BR' && (
          <button onClick={() => onNavigate('vocational-demo')} className="animate-fade-up mt-5 w-full max-w-3xl group relative overflow-hidden rounded-2xl border border-emerald-500/35 bg-gradient-to-r from-emerald-500/10 via-brand-500/5 to-accent-500/10 p-5 md:p-6 text-left transition-all hover:border-emerald-400/60 hover:scale-[1.01]" style={{ animationDelay: '0.25s' }}>
            <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center flex-shrink-0"><Compass className="w-6 h-6" /></div>
              <div className="flex-1"><div className="flex flex-wrap items-center gap-2 mb-1"><h3 className="text-lg font-bold text-ink-50">Demo de Exploração Vocacional</h3><span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 text-[11px] font-bold">NOVO · DEMO</span></div><p className="text-sm text-ink-400 leading-relaxed">Descubra quais áreas e cursos combinam com seus interesses, aptidões percebidas, valores e estilo de trabalho. 36 perguntas · 30 cursos.</p></div>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-300 group-hover:gap-2.5 transition-all">Fazer teste vocacional <ArrowRight className="w-4 h-4" /></span>
            </div>
          </button>
        )}

        <button onClick={() => onNavigate('faculty-questionnaire')} disabled={country === 'US'} className={`animate-fade-up mt-5 w-full max-w-3xl group relative overflow-hidden rounded-2xl border p-5 md:p-6 text-left transition-all ${country === 'US' ? 'cursor-not-allowed border-ink-800 bg-ink-900/40 opacity-55' : 'border-violet-500/35 bg-gradient-to-r from-violet-500/10 via-brand-500/5 to-accent-500/10 hover:border-violet-400/60'}`} style={{ animationDelay: '0.3s' }}>
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-violet-500/15 text-violet-300 flex items-center justify-center flex-shrink-0"><FileText className="w-6 h-6" /></div><div className="flex-1"><div className="flex flex-wrap items-center gap-2 mb-1"><h3 className="text-lg font-bold text-ink-50">Questionário para as Faculdades</h3><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-ink-800 text-ink-400 text-[11px] font-medium"><LockKeyhole className="w-3 h-3" /> {country === 'US' ? 'Somente Brasil' : 'Requer conta'}</span></div><p className="text-sm text-ink-400 leading-relaxed">{country === 'US' ? 'Este hub exclusivo para relacionamento com faculdades está disponível apenas na experiência brasileira.' : 'Organize notas, extracurriculares, idiomas, conquistas, projetos e experiências em um só lugar.'}</p></div><span className={`inline-flex items-center gap-1.5 text-sm font-semibold transition-all ${country === 'US' ? 'text-ink-600' : 'text-violet-300 group-hover:gap-2.5'}`}>{country === 'US' ? 'Indisponível nos EUA' : 'Abrir meu perfil'} {country === 'BR' ? <ArrowRight className="w-4 h-4" /> : null}</span></div>
        </button>

        <p className="mt-6 text-sm text-ink-500">Gratuito por tempo limitado · Sem documentos obrigatórios</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-20 w-full max-w-3xl">
          <FeatureCard icon={<Compass className="w-5 h-5" />} title="Questionário inteligente" desc="Perguntas dinâmicas sobre seu perfil acadêmico, comportamental e objetivos" delay="0.3s" />
          <FeatureCard icon={<Sparkles className="w-5 h-5" />} title="Match por perfil" desc="Algoritmo que compara sua personalidade com cada faculdade" delay="0.4s" />
          <FeatureCard icon={<Trophy className="w-5 h-5" />} title="Ranking personalizado" desc="Veja quais faculdades têm mais a ver com você" delay="0.5s" />
        </div>

        <div className="mt-12 max-w-2xl glass rounded-2xl border border-ink-800 p-5 text-left"><h3 className="font-semibold text-ink-200 text-sm mb-1.5">🎓 Período de lançamento</h3><p className="text-sm text-ink-400 leading-relaxed">Faça seu match no Conectaê gratuitamente. O acesso será pago futuramente, pelo valor de R$8.</p></div>
      </main>

      <footer className="relative z-10 border-t border-ink-800/50 px-6 py-8 md:px-12">
        <div className="max-w-5xl mx-auto"><div className="flex flex-col sm:flex-row items-center justify-between gap-4"><div className="flex items-center gap-2.5"><div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center"><GraduationCap className="w-4 h-4 text-ink-950" strokeWidth={2.5} /></div><span className="font-bold text-sm tracking-tight">Conectaê</span></div><div className="flex flex-wrap items-center justify-center gap-4 text-xs text-ink-500"><button onClick={() => onNavigate('howitworks')} className="flex items-center gap-1 hover:text-ink-300 transition-colors"><BookOpen className="w-3.5 h-3.5" /> Como funciona</button><button onClick={() => onNavigate('methodology')} className="flex items-center gap-1 hover:text-ink-300 transition-colors"><FlaskConical className="w-3.5 h-3.5" /> Metodologia</button><button onClick={() => onNavigate('faq')} className="flex items-center gap-1 hover:text-ink-300 transition-colors"><HelpCircle className="w-3.5 h-3.5" /> FAQ</button><button onClick={() => onNavigate('privacy')} className="flex items-center gap-1 hover:text-ink-300 transition-colors"><Shield className="w-3.5 h-3.5" /> Privacidade</button><button onClick={() => onNavigate('terms')} className="flex items-center gap-1 hover:text-ink-300 transition-colors"><FileText className="w-3.5 h-3.5" /> Termos</button></div></div><p className="text-center text-xs text-ink-600 mt-4">Conectaê mede compatibilidade de perfil, não chance de aprovação. Feito para estudantes brasileiros.</p></div>
      </footer>
    </div>
  );
}

function BrazilFlag() {
  return <svg aria-hidden="true" focusable="false" viewBox="0 0 28 20" className="h-10 w-14 overflow-hidden rounded-md shadow-md ring-1 ring-white/20"><rect width="28" height="20" fill="#009B3A" /><path d="M14 2.2 25.2 10 14 17.8 2.8 10Z" fill="#FFDF00" /><circle cx="14" cy="10" r="4.25" fill="#002776" /><path d="M9.9 9.15c2.8-.7 5.8-.25 8.25 1.3" fill="none" stroke="#FFFFFF" strokeWidth=".65" /></svg>;
}

function UnitedStatesFlag() {
  return <svg aria-hidden="true" focusable="false" viewBox="0 0 39 26" className="h-10 w-14 overflow-hidden rounded-md shadow-md ring-1 ring-white/20"><rect width="39" height="26" fill="#FFFFFF" />{[0, 4, 8, 12, 16, 20, 24].map((y) => <rect key={y} y={y} width="39" height="2" fill="#B22234" />)}<rect width="15.6" height="14" fill="#3C3B6E" />{Array.from({ length: 9 }, (_, row) => <g key={row}>{Array.from({ length: row % 2 === 0 ? 6 : 5 }, (__, column) => <circle key={column} cx={(row % 2 === 0 ? 1.25 : 2.5) + column * 2.55} cy={0.8 + row * 1.5} r="0.34" fill="#FFFFFF" />)}</g>)}</svg>;
}

function FeatureCard({ icon, title, desc, delay }: { icon: React.ReactNode; title: string; desc: string; delay: string }) {
  return <div className="animate-fade-up glass rounded-2xl border border-ink-800 p-5 text-left hover:border-brand-700/50 hover:bg-ink-900/70 transition-all" style={{ animationDelay: delay }}><div className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-400 flex items-center justify-center mb-3">{icon}</div><h3 className="font-semibold text-ink-100 mb-1">{title}</h3><p className="text-sm text-ink-400 leading-relaxed">{desc}</p></div>;
}