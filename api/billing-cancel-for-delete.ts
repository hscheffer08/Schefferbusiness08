import { enforceRateLimit } from './_rate-limit.js';
import { markCanceledSubscription, requireBillingUser, serverError, stripeRequest } from './_billing.js';

// Called only during explicit account deletion. Stops future charges before user data is removed.
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  try {
    if (!await enforceRateLimit(req, res, { bucket: 'billing-delete', limit: 3, windowSeconds: 3600 })) return;
    const context = await requireBillingUser(req);
    if (!context) return res.status(401).json({ error: 'Autenticação necessária.' });
    const { data, error } = await context.db.from('premium_subscriptions')
      .select('status,stripe_subscription_id,stripe_customer_id')
      .eq('user_id', context.user.id).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(200).json({ safeToDelete: true });
    if (data.stripe_customer_id && !data.stripe_subscription_id) {
      return res.status(409).json({ error: 'Existe uma contratação em processamento. Aguarde a confirmação antes de excluir sua conta.' });
    }
    if (data.stripe_subscription_id) {
      const id = String(data.stripe_subscription_id);
      if (!/^sub_[a-zA-Z0-9]+$/.test(id)) throw new Error('Invalid subscription ID');
      // The Stripe subscription, not possibly stale local status, is authoritative.
      const actual: any = await stripeRequest('subscriptions/' + encodeURIComponent(id));
      if (!['canceled', 'incomplete_expired'].includes(actual.status)) {
        await stripeRequest('subscriptions/' + encodeURIComponent(id), 'DELETE');
      }
      await markCanceledSubscription(id);
    }
    return res.status(200).json({ safeToDelete: true });
  } catch (error) { return serverError(res, error); }
}
