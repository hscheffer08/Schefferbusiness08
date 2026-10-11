import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';

export default function CourseSubscriptionGate({ children, onBack }: { children: ReactNode; onBack: () => void }) {
  const { user, session } = useAuth();
  const required = import.meta.env.VITE_COURSE_PAYWALL_ENABLED === 'true' && Date.now() >= Date.parse('2027-01-01T03:00:00Z');
  const [access, setAccess] = useState<'loading' | 'paid' | 'denied'>('loading');
  useEffect(() => {
    if (!required) return;
    if (!session?.access_token) { setAccess('denied'); return; }
    let canceled = false;
    setAccess('loading');
    fetch('/api/billing-status', { headers: { Authorization: 'Bearer ' + session.access_token }, cache: 'no-store' })
      .then(async response => {
        if (!response.ok) throw new Error('Status indisponível');
        return response.json();
      })
      .then(data => { if (!canceled) setAccess(data.premium ? 'paid' : 'denied'); })
      .catch(() => { if (!canceled) setAccess('denied'); });
    return () => { canceled = true; };
  }, [required, session?.access_token]);
  if (!required || access === 'paid') return <>{children}</>;
  return <main className="min-h-screen bg-[#020817] px-5 py-20 text-white">
    <section className="mx-auto max-w-xl rounded-3xl border border-[#254a75] bg-[#071a38] p-8 text-center">
      <h1 className="text-3xl font-black">Curso Conectaê</h1>
      <p className="mt-4 text-slate-300">{access === 'loading' ? 'Verificando assinatura…' :
        'Desde janeiro de 2027, o curso custa R$ 19,99 por mês. O Match de faculdades permanece gratuito.'}</p>
      {access === 'denied' && <button type="button" onClick={() => user
        ? window.dispatchEvent(new Event('conectae:open-premium'))
        : window.location.assign('/?auth=login&next=course')}
        className="mt-7 rounded-xl bg-amber-300 px-6 py-4 font-bold text-[#111827]">
        {user ? 'Ver assinatura' : 'Entrar e assinar'}
      </button>}
      <button type="button" onClick={onBack} className="mt-6 block w-full text-sm text-slate-400">Voltar</button>
    </section>
  </main>;
}
