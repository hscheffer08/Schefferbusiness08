import { useState } from 'react';
import { ArrowLeft, GraduationCap, Loader2, Mail, Lock, User as UserIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { trackEvent } from '@/lib/analytics';

interface AuthProps {
  onBack: () => void;
  onSuccess: () => void;
  onPrivacy: () => void;
  onTerms: () => void;
}

type Mode = 'login' | 'signup' | 'reset';

export default function Auth({ onBack, onSuccess, onPrivacy, onTerms }: AuthProps) {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    if (mode === 'login') {
      const { error: err } = await signIn(email, password);
      if (err) setError(err);
      else { trackEvent('login_completed', undefined, undefined); onSuccess(); }
    } else if (mode === 'signup') {
      if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.');
        setLoading(false);
        return;
      }
      const { error: err } = await signUp(email, password, displayName);
      if (err) setError(err);
      else {
        // Same wording whether or not the address was already registered, so the form
        // cannot be used to discover which emails have accounts.
        trackEvent('signup_started');
        setSuccess('Tudo certo! Se este e-mail ainda não tiver conta, ela foi criada. Faça login para continuar.');
        setMode('login');
      }
    } else if (mode === 'reset') {
      const { error: err } = await resetPassword(email);
      if (err) setError(err);
      else setSuccess('Se houver uma conta com esse e-mail, enviamos um link de recuperação.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/4 w-[400px] h-[400px] rounded-full bg-brand-500/15 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-accent-500/8 blur-[120px]" />
      </div>

      <header className="relative z-10 px-6 py-6 md:px-12">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-ink-400 hover:text-ink-100 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </button>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 mb-4 shadow-lg shadow-brand-500/20">
              <GraduationCap className="w-7 h-7 text-ink-950" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">
              {mode === 'login' && 'Entrar na sua conta'}
              {mode === 'signup' && 'Criar sua conta'}
              {mode === 'reset' && 'Recuperar senha'}
            </h1>
            <p className="text-sm text-ink-400">
              {mode === 'login' && 'Acesse seu perfil e histórico de matches'}
              {mode === 'signup' && 'Salve seus resultados e acompanhe seu progresso'}
              {mode === 'reset' && 'Enviaremos um link para seu e-mail'}
            </p>
          </div>

          {error && (
            <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-sm text-green-300">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-medium text-ink-400 mb-1.5">Nome</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Seu nome"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-ink-800/50 border border-ink-700 text-ink-100 placeholder-ink-600 focus:outline-none focus:border-brand-500 focus:bg-ink-800 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-ink-400 mb-1.5">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-ink-800/50 border border-ink-700 text-ink-100 placeholder-ink-600 focus:outline-none focus:border-brand-500 focus:bg-ink-800 transition-colors"
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <label className="block text-xs font-medium text-ink-400 mb-1.5">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-ink-800/50 border border-ink-700 text-ink-100 placeholder-ink-600 focus:outline-none focus:border-brand-500 focus:bg-ink-800 transition-colors"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-ink-950 font-semibold transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === 'login' && 'Entrar'}
                  {mode === 'signup' && 'Criar conta'}
                  {mode === 'reset' && 'Enviar link de recuperação'}
                </>
              )}
            </button>
          </form>

          {mode === 'signup' && (
            <p className="mt-4 text-center text-xs leading-relaxed text-ink-500">
              Ao criar sua conta, você concorda com os{' '}
              <button type="button" onClick={onTerms} className="text-brand-400 hover:text-brand-300">Termos de Uso</button>
              {' '}e confirma que leu a{' '}
              <button type="button" onClick={onPrivacy} className="text-brand-400 hover:text-brand-300">Política de Privacidade</button>.
            </p>
          )}

          <div className="mt-6 text-center space-y-2 text-sm text-ink-400">
            {mode === 'login' && (
              <>
                <p>
                  Não tem conta?{' '}
                  <button onClick={() => { setMode('signup'); setError(null); setSuccess(null); }} className="text-brand-400 hover:text-brand-300 font-medium">
                    Criar conta
                  </button>
                </p>
                <p>
                  Esqueceu a senha?{' '}
                  <button onClick={() => { setMode('reset'); setError(null); setSuccess(null); }} className="text-brand-400 hover:text-brand-300 font-medium">
                    Recuperar
                  </button>
                </p>
              </>
            )}
            {mode === 'signup' && (
              <p>
                Já tem conta?{' '}
                <button onClick={() => { setMode('login'); setError(null); setSuccess(null); }} className="text-brand-400 hover:text-brand-300 font-medium">
                  Entrar
                </button>
              </p>
            )}
            {mode === 'reset' && (
              <p>
                Lembrou a senha?{' '}
                <button onClick={() => { setMode('login'); setError(null); setSuccess(null); }} className="text-brand-400 hover:text-brand-300 font-medium">
                  Voltar para login
                </button>
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
