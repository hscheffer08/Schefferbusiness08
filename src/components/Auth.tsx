import { useState } from 'react';
import { ArrowLeft, GraduationCap, Loader2, Mail, Lock, User as UserIcon, AlertCircle, CheckCircle2, RefreshCcw, KeyRound } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { trackEvent } from '@/lib/analytics';

interface AuthProps {
  onBack: () => void;
  onSuccess: () => void;
  onPrivacy: () => void;
  onTerms: () => void;
  compact?: boolean;
  initialMode?: Mode;
}

type Mode = 'login' | 'signup' | 'reset' | 'update';
type CompactAccessMethod = 'username' | 'email';

function normalizeCourseUsername(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 32);
}

function courseUsernameEmail(username: string) {
  return `u_${normalizeCourseUsername(username)}@course.conectae.app`;
}

export default function Auth({ onBack, onSuccess, onPrivacy, onTerms, compact = false, initialMode = 'login' }: AuthProps) {
  const { signIn, signUp, resendConfirmation, resetPassword, updatePassword } = useAuth();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [compactAccessMethod, setCompactAccessMethod] = useState<CompactAccessMethod>('username');
  const [compactEmailRecovery, setCompactEmailRecovery] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('conectae:course-username') || '';
  });
  const [rememberUsername, setRememberUsername] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const changeMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setSuccess(null);
    setPassword('');
    setConfirmPassword('');
    if (next !== 'login') setPendingConfirmationEmail(null);
  };

  const changeCompactMethod = (next: CompactAccessMethod) => {
    setCompactAccessMethod(next);
    setCompactEmailRecovery(false);
    setMode('login');
    setPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(null);
  };

  const rememberCourseUsername = (value: string) => {
    if (typeof window === 'undefined') return;
    const normalized = normalizeCourseUsername(value);
    if (rememberUsername && normalized) localStorage.setItem('conectae:course-username', normalized);
    else localStorage.removeItem('conectae:course-username');
  };

  const handleCourseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError('Não foi possível abrir o acesso agora.');
      return;
    }
    setError(null);
    setSuccess(null);
    const normalized = normalizeCourseUsername(username);
    if (normalized.length < 3) {
      setError('Use um usuário com pelo menos 3 caracteres.');
      return;
    }
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error: createError } = await supabase.functions.invoke('course-username-register', {
          body: { username: normalized, password },
        });
        if (createError) {
          const raw = String((createError as any)?.context?.body?.error || (createError as any)?.message || '');
          if (/already|exist|409|registered/i.test(raw)) throw new Error('Esse usuário já existe. Entre com a senha ou escolha outro.');
          throw new Error('Não foi possível criar esse usuário agora. Tente outro nome ou tente novamente.');
        }
        const createdUsername = normalizeCourseUsername(String((data as any)?.username || normalized));
        const { error: loginError } = await supabase.auth.signInWithPassword({ email: courseUsernameEmail(createdUsername), password });
        if (loginError) throw new Error('Usuário criado. Tente entrar agora com o usuário e a senha escolhidos.');
        setUsername(createdUsername);
        rememberCourseUsername(createdUsername);
        trackEvent('signup_started', { method: 'course_username' });
        trackEvent('login_completed', { method: 'course_username' });
        onSuccess();
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email: courseUsernameEmail(normalized), password });
        if (loginError) throw new Error('Usuário ou senha inválidos.');
        rememberCourseUsername(normalized);
        trackEvent('login_completed', { method: 'course_username' });
        onSuccess();
      }
    } catch (err: any) {
      setError(err?.message || 'Não foi possível entrar agora.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompactEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Digite seu e-mail.');
      return;
    }

    setLoading(true);
    try {
      if (compactEmailRecovery) {
        const { error: recoveryError } = await resetPassword(normalizedEmail);
        if (recoveryError) setError(recoveryError);
        else setSuccess('Enviamos um link de recuperação para esse e-mail, se ele estiver cadastrado.');
      } else {
        const { error: loginError } = await signIn(normalizedEmail, password);
        if (loginError) setError(loginError);
        else {
          trackEvent('login_completed', { method: 'legacy_email' });
          onSuccess();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    const courseMode: 'login' | 'signup' = mode === 'signup' ? 'signup' : 'login';
    const usingUsername = compactAccessMethod === 'username';

    return (
      <div className="relative overflow-hidden">
        <main className="relative z-10 px-5 pb-8">
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 mb-3 shadow-lg shadow-brand-500/20">
                {usingUsername ? <KeyRound className="w-5 h-5 text-ink-950" strokeWidth={2.5} /> : <Mail className="w-5 h-5 text-ink-950" strokeWidth={2.5} />}
              </div>
              <h1 className="text-2xl font-bold tracking-tight mb-1">{usingUsername ? (courseMode === 'login' ? 'Entrar no Curso' : 'Criar meu acesso') : (compactEmailRecovery ? 'Recuperar conta antiga' : 'Entrar com e-mail')}</h1>
              <p className="text-sm text-ink-400">{usingUsername ? 'Use seu usuário e senha.' : 'Para contas criadas anteriormente com e-mail.'}</p>
            </div>

            <div className="mb-5 grid grid-cols-2 rounded-xl border border-ink-700 bg-ink-900/60 p-1">
              <button type="button" onClick={() => changeCompactMethod('username')} className={`rounded-lg px-3 py-2.5 text-xs font-bold transition ${usingUsername ? 'bg-brand-500 text-ink-950' : 'text-ink-400 hover:text-ink-100'}`}>Usuário</button>
              <button type="button" onClick={() => changeCompactMethod('email')} className={`rounded-lg px-3 py-2.5 text-xs font-bold transition ${!usingUsername ? 'bg-brand-500 text-ink-950' : 'text-ink-400 hover:text-ink-100'}`}>E-mail · conta antiga</button>
            </div>

            {error && <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-300"><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{error}</span></div>}
            {success && <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-sm text-green-300"><CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{success}</span></div>}

            {usingUsername ? <>
              <form onSubmit={handleCourseSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-ink-400 mb-1.5">Usuário</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="seu_usuario" required autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={32} className="w-full pl-11 pr-4 py-3 rounded-xl bg-ink-800/50 border border-ink-700 text-ink-100 placeholder-ink-600 focus:outline-none focus:border-brand-500 focus:bg-ink-800 transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-ink-400 mb-1.5">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} autoComplete={courseMode === 'login' ? 'current-password' : 'new-password'} className="w-full pl-11 pr-4 py-3 rounded-xl bg-ink-800/50 border border-ink-700 text-ink-100 placeholder-ink-600 focus:outline-none focus:border-brand-500 focus:bg-ink-800 transition-colors" />
                  </div>
                </div>

                {courseMode === 'signup' && <div>
                  <label className="block text-xs font-medium text-ink-400 mb-1.5">Confirmar senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required minLength={8} autoComplete="new-password" className="w-full pl-11 pr-4 py-3 rounded-xl bg-ink-800/50 border border-ink-700 text-ink-100 placeholder-ink-600 focus:outline-none focus:border-brand-500 focus:bg-ink-800 transition-colors" />
                  </div>
                </div>}

                <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-400">
                  <input type="checkbox" checked={rememberUsername} onChange={(e) => setRememberUsername(e.target.checked)} className="h-4 w-4 rounded border-ink-600 bg-ink-800" />
                  Lembrar meu usuário neste aparelho
                </label>

                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-ink-950 font-semibold transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : courseMode === 'login' ? 'Entrar no meu Curso' : 'Criar acesso e entrar'}
                </button>
              </form>

              <p className="mt-3 text-center text-[11px] leading-relaxed text-ink-500">Seu usuário fica lembrado neste aparelho. A senha não é gravada em texto pelo Conectaê.</p>
              <div className="mt-5 text-center text-sm text-ink-400">
                {courseMode === 'login' ? <p>Primeira vez? <button type="button" onClick={() => changeMode('signup')} className="text-brand-400 hover:text-brand-300 font-medium">Criar usuário</button></p> : <p>Já tem usuário? <button type="button" onClick={() => changeMode('login')} className="text-brand-400 hover:text-brand-300 font-medium">Entrar</button></p>}
              </div>
            </> : <>
              <form onSubmit={handleCompactEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-ink-400 mb-1.5">E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required autoComplete="email" className="w-full pl-11 pr-4 py-3 rounded-xl bg-ink-800/50 border border-ink-700 text-ink-100 placeholder-ink-600 focus:outline-none focus:border-brand-500 focus:bg-ink-800 transition-colors" />
                  </div>
                </div>

                {!compactEmailRecovery && <div>
                  <label className="block text-xs font-medium text-ink-400 mb-1.5">Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" className="w-full pl-11 pr-4 py-3 rounded-xl bg-ink-800/50 border border-ink-700 text-ink-100 placeholder-ink-600 focus:outline-none focus:border-brand-500 focus:bg-ink-800 transition-colors" />
                  </div>
                </div>}

                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-ink-950 font-semibold transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : compactEmailRecovery ? 'Enviar link de recuperação' : 'Entrar com minha conta antiga'}
                </button>
              </form>

              <div className="mt-5 text-center space-y-2 text-sm text-ink-400">
                {compactEmailRecovery ? <p>Lembrou a senha? <button type="button" onClick={() => { setCompactEmailRecovery(false); setError(null); setSuccess(null); }} className="text-brand-400 hover:text-brand-300 font-medium">Voltar para entrar</button></p> : <p>Esqueceu a senha? <button type="button" onClick={() => { setCompactEmailRecovery(true); setPassword(''); setError(null); setSuccess(null); }} className="text-brand-400 hover:text-brand-300 font-medium">Recuperar por e-mail</button></p>}
                <p>Não tinha conta antiga? <button type="button" onClick={() => changeCompactMethod('username')} className="text-brand-400 hover:text-brand-300 font-medium">Criar usuário</button></p>
              </div>
            </>}

            <button type="button" onClick={onBack} className="mt-5 w-full text-center text-xs font-semibold text-ink-500 hover:text-ink-300">Voltar</button>
          </div>
        </main>
      </div>
    );
  }

  const handleResend = async () => {
    if (!pendingConfirmationEmail || resending) return;
    setResending(true);
    setError(null);
    const { error: err } = await resendConfirmation(pendingConfirmationEmail);
    if (err) setError(err);
    else setSuccess('E-mail de confirmação reenviado. Confira também a caixa de spam ou promoções.');
    setResending(false);
  };

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
      const cleanName = displayName.trim().replace(/\s+/g, ' ');
      if (cleanName.length < 2) {
        setError('Digite seu nome.');
        setLoading(false);
        return;
      }
      if (password.length < 8) {
        setError('A senha deve ter pelo menos 8 caracteres.');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        setLoading(false);
        return;
      }
      const normalizedEmail = email.trim().toLowerCase();
      const { error: err, needsConfirmation } = await signUp(normalizedEmail, password, cleanName);
      if (err) setError(err);
      else {
        trackEvent('signup_started');
        if (needsConfirmation) {
          setPendingConfirmationEmail(normalizedEmail);
          setSuccess('Conta criada. Abra o e-mail de confirmação e toque no link para ativar sua conta.');
          setPassword('');
          setConfirmPassword('');
          setMode('login');
        } else {
          setSuccess('Conta criada e conectada com sucesso.');
          onSuccess();
        }
      }
    } else if (mode === 'reset') {
      const { error: err } = await resetPassword(email);
      if (err) setError(err);
      else setSuccess('Se houver uma conta com esse e-mail, enviamos um link de recuperação. Ao abrir o link, você poderá definir uma nova senha no Conectaê.');
    } else {
      if (password.length < 8) {
        setError('A nova senha deve ter pelo menos 8 caracteres.');
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        setLoading(false);
        return;
      }
      const { error: err } = await updatePassword(password);
      if (err) setError(err);
      else {
        setPassword('');
        setConfirmPassword('');
        setSuccess('Senha atualizada com sucesso. Você já pode continuar usando sua conta.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 left-1/4 w-[400px] h-[400px] rounded-full bg-brand-500/15 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-accent-500/8 blur-[120px]" />
        </div>
        <header className="relative z-10 px-6 py-6 md:px-12">
          <button onClick={mode === 'update' ? onSuccess : onBack} className="flex items-center gap-2 text-ink-400 hover:text-ink-100 transition-colors text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> {mode === 'update' ? 'Voltar ao site' : 'Voltar ao início'}
          </button>
        </header>
      </>

      <main className="relative z-10 flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 mb-4 shadow-lg shadow-brand-500/20">
              <GraduationCap className="w-7 h-7 text-ink-950" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">
              {mode === 'login' && 'Entrar na sua conta'}
              {mode === 'signup' && 'Criar sua conta'}
              {mode === 'reset' && 'Recuperar senha'}
              {mode === 'update' && 'Definir nova senha'}
            </h1>
            <p className="text-sm text-ink-400">
              {mode === 'login' && 'Acesse seu plano, histórico e evolução'}
              {mode === 'signup' && 'Salve seus resultados e acompanhe seu progresso'}
              {mode === 'reset' && 'Enviaremos um link para seu e-mail'}
              {mode === 'update' && 'Escolha uma nova senha para sua conta'}
            </p>
          </div>

          {error && <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-300"><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{error}</span></div>}
          {success && <div className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-sm text-green-300"><CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{success}</span></div>}

          {pendingConfirmationEmail && mode === 'login' && (
            <div className="mb-4 rounded-xl border border-brand-500/25 bg-brand-500/[0.06] p-3 text-sm text-ink-300">
              <p>Não recebeu a confirmação em <strong className="text-ink-100">{pendingConfirmationEmail}</strong>?</p>
              <button type="button" onClick={handleResend} disabled={resending} className="mt-2 inline-flex items-center gap-1.5 font-semibold text-brand-300 hover:text-brand-200 disabled:opacity-50">
                {resending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                Reenviar e-mail de confirmação
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && <div><label className="block text-xs font-medium text-ink-400 mb-1.5">Nome</label><div className="relative"><UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" /><input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Seu nome" required autoComplete="name" maxLength={120} className="w-full pl-11 pr-4 py-3 rounded-xl bg-ink-800/50 border border-ink-700 text-ink-100 placeholder-ink-600 focus:outline-none focus:border-brand-500 focus:bg-ink-800 transition-colors" /></div></div>}

            {mode !== 'update' && <div><label className="block text-xs font-medium text-ink-400 mb-1.5">E-mail</label><div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required autoComplete="email" className="w-full pl-11 pr-4 py-3 rounded-xl bg-ink-800/50 border border-ink-700 text-ink-100 placeholder-ink-600 focus:outline-none focus:border-brand-500 focus:bg-ink-800 transition-colors" /></div></div>}

            {mode !== 'reset' && <div><label className="block text-xs font-medium text-ink-400 mb-1.5">{mode === 'update' ? 'Nova senha' : 'Senha'}</label><div className="relative"><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={mode === 'login' ? undefined : 8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="w-full pl-11 pr-4 py-3 rounded-xl bg-ink-800/50 border border-ink-700 text-ink-100 placeholder-ink-600 focus:outline-none focus:border-brand-500 focus:bg-ink-800 transition-colors" /></div>{mode !== 'login' && <p className="mt-1.5 text-xs text-ink-600">Use pelo menos 8 caracteres.</p>}</div>}

            {(mode === 'signup' || mode === 'update') && <div><label className="block text-xs font-medium text-ink-400 mb-1.5">Confirmar senha</label><div className="relative"><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-500" /><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required minLength={8} autoComplete="new-password" className="w-full pl-11 pr-4 py-3 rounded-xl bg-ink-800/50 border border-ink-700 text-ink-100 placeholder-ink-600 focus:outline-none focus:border-brand-500 focus:bg-ink-800 transition-colors" /></div></div>}

            {mode === 'update' && success ? (
              <button type="button" onClick={onSuccess} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-ink-950 font-semibold transition-all">Continuar no Conectaê</button>
            ) : (
              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-ink-950 font-semibold transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{mode === 'login' && 'Entrar'}{mode === 'signup' && 'Criar conta'}{mode === 'reset' && 'Enviar link de recuperação'}{mode === 'update' && 'Salvar nova senha'}</>}
              </button>
            )}
          </form>

          {mode === 'signup' && <p className="mt-4 text-center text-xs leading-relaxed text-ink-500">Ao criar sua conta, você concorda com os <button type="button" onClick={onTerms} className="text-brand-400 hover:text-brand-300">Termos de Uso</button> e confirma que leu a <button type="button" onClick={onPrivacy} className="text-brand-400 hover:text-brand-300">Política de Privacidade</button>.</p>}

          <div className="mt-6 text-center space-y-2 text-sm text-ink-400">
            {mode === 'login' && <><p>Não tem conta? <button onClick={() => changeMode('signup')} className="text-brand-400 hover:text-brand-300 font-medium">Criar conta</button></p><p>Esqueceu a senha? <button onClick={() => changeMode('reset')} className="text-brand-400 hover:text-brand-300 font-medium">Recuperar</button></p></>}
            {mode === 'signup' && <p>Já tem conta? <button onClick={() => changeMode('login')} className="text-brand-400 hover:text-brand-300 font-medium">Entrar</button></p>}
            {mode === 'reset' && <p>Lembrou a senha? <button onClick={() => changeMode('login')} className="text-brand-400 hover:text-brand-300 font-medium">Voltar para login</button></p>}
          </div>
        </div>
      </main>
    </div>
  );
}
