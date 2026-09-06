import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CheckCircle2, Loader2, LockKeyhole, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

type Subscription = {
  status: string;
  current_period_end: string | null;
  trial_started_at?: string | null;
};

export default function PremiumFeatureGate({
  children,
  feature,
  description,
}: {
  children: ReactNode;
  feature: string;
  description: string;
}) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = useMemo(() => {
    const appRole = String(user?.app_metadata?.role || '').toLowerCase();
    const userRole = String(user?.user_metadata?.role || '').toLowerCase();
    return appRole === 'admin' || userRole === 'admin';
  }, [user]);

  const load = useCallback(async () => {
    if (!supabase || !user) { setLoading(false); return; }
    if (isAdmin) { setLoading(false); return; }
    const { data } = await supabase
      .from('premium_subscriptions')
      .select('status,current_period_end,trial_started_at')
      .eq('user_id', user.id)
      .maybeSingle();
    setSubscription((data as Subscription | null) ?? null);
    setLoading(false);
  }, [user, isAdmin]);

  useEffect(() => { void load(); }, [load]);

  const hasAccess = useMemo(() => {
    if (isAdmin) return true;
    if (!subscription) return false;
    if (!['active', 'trialing'].includes(subscription.status)) return false;
    if (!subscription.current_period_end) return subscription.status === 'active';
    return new Date(subscription.current_period_end).getTime() > Date.now();
  }, [isAdmin, subscription]);

  const trialUsed = Boolean(subscription?.trial_started_at);

  const startTrial = async () => {
    if (!supabase || !user || starting) return;
    setStarting(true); setError(null);
    const { data, error: rpcError } = await supabase.rpc('start_premium_trial');
    if (rpcError) {
      setError(trialUsed ? 'Seu período gratuito já foi usado.' : 'Não foi possível iniciar agora. Tente novamente.');
      setStarting(false);
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (row) setSubscription(row as Subscription);
    else await load();
    setStarting(false);
  };

  if (loading) return <div className="min-h-[360px] grid place-items-center"><Loader2 className="animate-spin text-[#72a5ff]" /></div>;
  if (hasAccess) return <>{children}</>;

  return <div className="relative min-h-[560px] overflow-hidden rounded-[24px] border border-[#1d3c6d] bg-[#05142d]">
    <div aria-hidden className="absolute inset-0 select-none overflow-hidden opacity-55 blur-[7px] pointer-events-none">
      <div className="p-5 md:p-7">
        <div className="h-8 w-52 rounded-lg bg-[#183b70]" />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[1,2,3,4].map((n)=><div key={n} className="rounded-2xl border border-[#24456f] bg-[#0a2247] p-4"><div className="h-4 w-28 rounded bg-[#31588e]"/><div className="mt-3 h-3 w-full rounded bg-[#173765]"/><div className="mt-2 h-3 w-4/5 rounded bg-[#173765]"/><div className="mt-5 h-24 rounded-xl bg-[#102f5f]"/></div>)}
        </div>
      </div>
    </div>
    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,8,23,.2),rgba(2,8,23,.92)_54%,#020817)]" />
    <div className="relative z-10 mx-auto flex min-h-[560px] max-w-xl flex-col items-center justify-center px-6 py-10 text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-[#31588e] bg-[#0b2856] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#9fc1ff]"><Sparkles size={14}/>Recurso avançado</div>
      <div className="mt-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#12366c] text-[#8ab4ff]"><LockKeyhole size={26}/></div>
      <h2 className="mt-4 text-3xl font-extrabold tracking-[-.04em]">{feature}</h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-[#a8bddb]">{description}</p>
      <div className="mt-5 w-full rounded-2xl border border-[#234576] bg-[#071a38]/95 p-4 text-left">
        {['Acesso completo por 14 dias','Sem cartão de crédito','Você decide depois se quer continuar'].map((x)=><div key={x} className="flex items-center gap-2 py-1.5 text-sm text-[#d5e3f7]"><CheckCircle2 size={16} className="text-[#72a5ff]"/>{x}</div>)}
      </div>
      {!trialUsed ? <button type="button" onClick={startTrial} disabled={starting} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#246cff] px-5 text-sm font-extrabold text-white disabled:opacity-60">{starting?<Loader2 size={17} className="animate-spin"/>:<Sparkles size={17}/>}Experimentar 14 dias grátis</button> : <div className="mt-5 w-full rounded-xl border border-[#4d3c24] bg-[#251d10] px-4 py-3 text-sm font-bold text-[#ffd79a]">Seu período gratuito terminou. A assinatura paga será liberada em breve.</div>}
      <div className="mt-2 text-xs text-[#7f96b6]">Nenhum cartão será solicitado agora.</div>
      {error&&<div className="mt-3 text-xs font-bold text-[#ff9b9b]">{error}</div>}
    </div>
  </div>;
}
