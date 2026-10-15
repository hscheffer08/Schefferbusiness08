import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

/** Reuse the root session; never mount course tools before authentication. */
export default function CourseAccountGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center bg-ink-950 text-brand-400" role="status"><Loader2 className="h-8 w-8 animate-spin" aria-label="Verificando sua conta" /></div>;
  if (!user || user.is_anonymous) {
    const url = new URL(window.location.href);
    url.searchParams.set('auth', 'login');
    url.searchParams.set('next', 'course');
    return <main className="min-h-screen grid place-items-center bg-ink-950 px-6 text-ink-100"><div className="max-w-md text-center">
      <h1 className="text-3xl font-bold">Entre na sua conta para acessar o curso</h1>
      <p className="mt-4 text-ink-400">Crie sua conta ou entre para acessar seu plano, questões, IA e resumos.</p>
      <a href={`${url.pathname}${url.search}${url.hash}`} className="mt-6 inline-flex rounded-xl bg-brand-500 px-6 py-3 font-bold text-ink-950">Entrar / criar conta</a>
      <a href="/" className="mt-5 block text-sm text-ink-400">Voltar ao início</a>
    </div></main>;
  }
  return <>{children}</>;
}
