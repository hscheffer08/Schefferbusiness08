import { randomBytes } from 'node:crypto';
import { enforceRateLimit } from './_rate-limit.js';
import { billingEnabled, origin, premiumActive, premiumPrice, requireBillingUser, serverError, stripeRequest } from './_billing.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  if (!billingEnabled()) return res.status(503).json({ error: 'Novas assinaturas ainda não estão disponíveis.' });
  try {
    if (!await enforceRateLimit(req, res, { bucket: 'billing-checkout', limit: 6, windowSeconds: 3600 })) return;
    const context = await requireBillingUser(req);
    if (!context) return res.status(401).json({ error: 'Entre na sua conta para assinar.' });
    const { user, db } = context;
    const { data: current, error: readError } = await db.from('premium_subscriptions')
      .select('status,current_period_end,stripe_customer_id').eq('user_id', user.id).maybeSingle();
    if (readError) throw readError;
    if (premiumActive(current)) return res.status(409).json({ error: 'Seu Premium já está ativo. Use Gerenciar assinatura.' });
    const form = new URLSearchParams({
      mode: 'subscription',
      'line_items[0][price]': premiumPrice(),
      'line_items[0][quantity]': '1',
      'client_reference_id': user.id,
      'subscription_data[metadata][conectae_user_id]': user.id,
      success_url: origin() + '/?billing=success',
      cancel_url: origin() + '/?billing=cancel',
      'metadata[conectae_user_id]': user.id,
      integration_identifier: 'conectae-' + [...randomBytes(8)].map(n => String.fromCharCode(97 + n % 26)).join(''),
    });
    if (current?.stripe_customer_id) form.set('customer', current.stripe_customer_id);
    else form.set('customer_email', user.email || '');
    const session = await stripeRequest('checkout/sessions', 'POST', form);
    if (!/^https:\/\/checkout\.stripe\.com\//.test(session.url || '')) throw new Error('Invalid checkout URL');
    return res.status(200).json({ url: session.url });
  } catch (error) { return serverError(res, error); }
}
