import { enforceRateLimit } from './_rate-limit.js';
import { origin, requireBillingUser, serverError, stripeRequest } from './_billing.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  try {
    if (!await enforceRateLimit(req, res, { bucket: 'billing-portal', limit: 12, windowSeconds: 3600 })) return;
    const context = await requireBillingUser(req);
    if (!context) return res.status(401).json({ error: 'Entre na sua conta para gerenciar a assinatura.' });
    const { data, error } = await context.db.from('premium_subscriptions')
      .select('stripe_customer_id').eq('user_id', context.user.id).maybeSingle();
    if (error) throw error;
    if (!data?.stripe_customer_id) return res.status(404).json({ error: 'Nenhuma assinatura cadastrada para esta conta.' });
    const form = new URLSearchParams({
      customer: data.stripe_customer_id,
      return_url: origin() + '/?billing=manage',
    });
    const session = await stripeRequest('billing_portal/sessions', 'POST', form);
    if (!/^https:\/\/billing\.stripe\.com\//.test(session.url || '')) throw new Error('Invalid portal URL');
    return res.status(200).json({ url: session.url });
  } catch (error) { return serverError(res, error); }
}
