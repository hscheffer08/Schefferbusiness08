import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Crown, Lock } from 'lucide-react';
import { useAuth } from './auth-context';

const SHOW_PREMIUM = true;
const PRICE = Date.now() < Date.parse('2027-01-01T03:00:00Z') ? 'R$ 9,99' : 'R$ 19,99';

type BillingStatus = {
  premium: boolean;
  checkoutEnabled: boolean;
  hasCustomer: boolean;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

function PremiumPage({ onClose }: { onClose: () => void }) {
  const { user, session } = useAuth();
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(Boolean(session?.access_token));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session?.access_token) { setLoading(false); setBilling(null); return; }
    let cancelled = false;
    setLoading(true);
    fetch('/api/billing-status', { headers: { Authorization: `Bearer ${session.access_token}` }, cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) throw new Error('Não foi possível verificar a assinatura.');
        return await res.json();
      })
      .then((value) => { if (!cancelled) setBilling(value as BillingStatus); })
      .catch(() => { if (!cancelled) setError('Não foi possível verificar sua assinatura. Tente novamente.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [session?.access_token]);

  const goToBilling = async (action: 'checkout' | 'portal') => {
    if (!session?.access_token || busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await fetch(action === 'checkout' ? '/api/billing-checkout' : '/api/billing-portal', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await result.json();
      if (!result.ok || typeof data?.url !== 'string') throw new Error(data?.error || 'Falha ao abrir a assinatura.');
      const url = new URL(data.url);
      if (url.protocol !== 'https:' || !['checkout.stripe.com', 'billing.stripe.com'].includes(url.hostname)) {
        throw new Error('O destino de pagamento não é confiável.');
      }
      window.location.assign(url.href);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível prosseguir.');
      setBusy(false);
    }
  };

  const hasPremium = Boolean(billing?.premium);
  const canBuy = Boolean(billing?.checkoutEnabled);
  return <div role="dialog" aria-modal="true" aria-label="Conectaê Premium"
    className="fixed inset-0 z-[180] overflow-y-auto bg-[#030817] text-white">
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#030817]/95 px-5 py-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
        <button onClick={onClose} className="inline-flex items-center gap-2 text-sm font-bold text-slate-300"><ArrowLeft className="h-4 w-4"/>Voltar</button>
        <div className="flex items-center gap-2 font-black"><Crown className="h-5 w-5 text-amber-300"/>Conectaê Premium</div>
        <span className="text-sm font-bold text-amber-200">{PRICE}/mês</span>
      </div>
    </header>
    <main className="mx-auto max-w-5xl px-5 py-12">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.2em] text-amber-300">Mais profundidade, quando precisar</p>
          <h1 className="mt-5 text-4xl font-black tracking-tight md:text-5xl">Seu estudo, em outro nível.</h1>
          <p className="mt-5 text-slate-300">O plano gratuito continua disponível. O Premium será opcional e contará com recursos adicionais de IA e estudo personalizado, conforme a oferta exibida na contratação.</p>
          <div className="mt-6 space-y-3 text-sm text-slate-200">
            {['IA sem limite diário de perguntas (com limites de segurança)','Planos de estudo aprofundados','Simulados e análise avançada de desempenho','Gerenciamento e cancelamento online'].map(item =>
              <p key={item} className="flex gap-2"><CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300"/>{item}</p>
            )}
          </div>
        </div>
        <section className="rounded-[28px] border border-amber-300/20 bg-white/[.05] p-7">
          <h2 className="text-lg font-black">Conectaê Premium</h2>
          <p className="mt-4 text-4xl font-black">{PRICE}<span className="text-base font-normal text-slate-400"> / mês</span></p>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">Assinatura mensal com renovação automática. Cancelável no portal, sem multa por cancelar a renovação.</p>
          {hasPremium && <p className="mt-5 rounded-xl border border-emerald-700/40 p-3 text-sm text-emerald-200">
            Seu Premium está ativo{billing?.cancelAtPeriodEnd ? ' e será encerrado ao final do ciclo.' : '.'}
          </p>}
          {error && <p role="alert" className="mt-5 text-sm text-red-300">{error}</p>}
          <button
            type="button"
            disabled={busy || (Boolean(user) && (loading || (!hasPremium && !canBuy)))}
            onClick={() => {
              if (!user) { window.location.assign('/?auth=login&next=course'); return; }
              void goToBilling(hasPremium ? 'portal' : 'checkout');
            }}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-300 px-5 py-4 text-sm font-black text-[#171006] disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? 'Verificando seu plano…' : busy ? 'Abrindo ambiente seguro…' :
              hasPremium ? 'Gerenciar assinatura' :
              !user ? 'Entrar para conhecer a assinatura' :
              !canBuy ? <><Lock className="h-4 w-4"/> Contratação ainda não liberada</> : 'Assinar Premium'}
          </button>
          <p className="mt-4 text-xs leading-relaxed text-slate-400">Antes de contratar, confira os <a href="/termos" className="underline">Termos de Uso</a> e a <a href="/privacidade" className="underline">Política de Privacidade</a>. Pagamentos são processados pelo Stripe, sem armazenamento dos dados de cartão no Conectaê.</p>
        </section>
      </div>
    </main>
  </div>;
}

export default function PremiumDemoMount() {
  const [open, setOpen] = useState(() => new URLSearchParams(window.location.search).has('billing'));
  if (!SHOW_PREMIUM) return null;
  return <>
    <button type="button" onClick={() => setOpen(true)}
      className="fixed bottom-[88px] right-5 z-[90] md:bottom-5 rounded-full border border-amber-300/40 bg-[#111b30] px-5 py-3 text-sm font-black text-amber-200 shadow-xl hover:bg-[#1c2a47]">
      <Crown className="mr-2 inline h-4 w-4"/>Premium
    </button>
    {open && <PremiumPage onClose={() => setOpen(false)}/>}
  </>;
}
