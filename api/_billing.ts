import { createClient } from '@supabase/supabase-js';

const allowedOrigin = 'https://conectaê.app';

export function billingEnabled() {
  return process.env.BILLING_LIVE_ENABLED === 'true';
}
export function serviceClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Configuração de banco incompleta.');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
export async function requireBillingUser(req: any) {
  const header = String(req.headers?.authorization || '');
  if (!header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  if (!token) return null;
  const db = serviceClient();
  const { data, error } = await db.auth.getUser(token);
  if (error || !data?.user?.id || !data.user.email) return null;
  return { user: data.user, db };
}
export function premiumActive(row: any) {
  return Boolean(row && (row.status === 'active' || row.status === 'trialing') &&
    row.current_period_end && new Date(row.current_period_end).getTime() > Date.now());
}
export function serverError(res: any, error: unknown) {
  console.error('Billing request failed', error instanceof Error ? error.message : 'Unknown');
  return res.status(503).json({ error: 'Não foi possível acessar a cobrança agora. Tente novamente.' });
}
export async function stripeRequest(path: string, method: 'GET' | 'POST' = 'GET', form?: URLSearchParams) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret || !/^(sk|rk)_(test|live)_/.test(secret)) throw new Error('Stripe não configurado.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const result = await fetch('https://api.stripe.com/v1/' + path, {
      method,
      headers: {
        Authorization: 'Bearer ' + secret,
        ...(form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
      },
      body: form?.toString(),
      signal: controller.signal,
    });
    const value: any = await result.json().catch(() => null);
    if (!result.ok || !value || value.error) {
      console.error('Stripe API error', result.status, value?.error?.type || 'unknown');
      throw new Error('Stripe API request failed');
    }
    return value;
  } finally {
    clearTimeout(timeout);
  }
}
export function premiumPrice() {
  const id = process.env.STRIPE_PREMIUM_PRICE_ID || '';
  if (!/^price_[a-zA-Z0-9]+$/.test(id)) throw new Error('Preço Premium não configurado.');
  return id;
}
export function origin() { return allowedOrigin; }

const permittedStatus = new Set(['inactive', 'active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete']);
function normalizeStripeStatus(status: string) {
  return permittedStatus.has(status) ? status : 'inactive';
}
function stripePeriodEnd(subscription: any): string | null {
  const seconds = subscription?.current_period_end || subscription?.items?.data?.[0]?.current_period_end;
  return Number.isFinite(Number(seconds)) && Number(seconds) > 0
    ? new Date(Number(seconds) * 1000).toISOString() : null;
}
export async function syncSubscription(id: string, providedUserId?: string) {
  if (!/^sub_[a-zA-Z0-9]+$/.test(id)) throw new Error('Invalid subscription ID');
  const db = serviceClient();
  const sub: any = await stripeRequest('subscriptions/' + encodeURIComponent(id));
  const stripeCustomerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
  if (!stripeCustomerId) throw new Error('Stripe customer missing');
  // Prefer durable provider IDs; subscription metadata is only a first-time bootstrap.
  const { data: bySubscription, error: subLookupError } = await db
    .from('premium_subscriptions').select('user_id').eq('stripe_subscription_id', id).maybeSingle();
  if (subLookupError) throw subLookupError;
  const { data: byCustomer, error: customerLookupError } = await db
    .from('premium_subscriptions').select('user_id').eq('stripe_customer_id', stripeCustomerId).maybeSingle();
  if (customerLookupError) throw customerLookupError;
  const candidate = bySubscription?.user_id || byCustomer?.user_id ||
    providedUserId || sub.metadata?.conectae_user_id;
  if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(String(candidate || ''))) {
    throw new Error('Subscription owner cannot be established');
  }
  if ((bySubscription && bySubscription.user_id !== candidate) ||
      (byCustomer && byCustomer.user_id !== candidate)) throw new Error('Customer owner mismatch');
  const { data: existing, error: existingError } = await db.from('premium_subscriptions')
    .select('stripe_customer_id,stripe_subscription_id').eq('user_id', candidate).maybeSingle();
  if (existingError) throw existingError;
  if (existing?.stripe_customer_id && existing.stripe_customer_id !== stripeCustomerId) {
    throw new Error('User already linked to a different Stripe customer');
  }
  if (existing?.stripe_subscription_id && existing.stripe_subscription_id !== id) {
    const old: any = await stripeRequest('subscriptions/' + encodeURIComponent(existing.stripe_subscription_id)).catch(() => null);
    if (old && (old.status === 'active' || old.status === 'trialing')) throw new Error('Conflicting active subscription');
  }
  const priceId = sub.items?.data?.[0]?.price?.id || null;
  const status = normalizeStripeStatus(sub.status);
  const { error: writeError } = await db.from('premium_subscriptions').upsert({
    user_id: candidate,
    status,
    plan: 'premium_monthly',
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: id,
    stripe_price_id: priceId,
    current_period_end: stripePeriodEnd(sub),
    cancel_at_period_end: Boolean(sub.cancel_at_period_end),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (writeError) throw writeError;
  return { userId: candidate, status };
}
export async function markCanceledSubscription(id: string) {
  const db = serviceClient();
  const { data, error } = await db.from('premium_subscriptions')
    .select('user_id,stripe_subscription_id').eq('stripe_subscription_id', id).maybeSingle();
  if (error) throw error;
  if (!data) return;
  const { error: updateError } = await db.from('premium_subscriptions')
    .update({ status: 'canceled', updated_at: new Date().toISOString() })
    .eq('user_id', data.user_id).eq('stripe_subscription_id', id);
  if (updateError) throw updateError;
}
