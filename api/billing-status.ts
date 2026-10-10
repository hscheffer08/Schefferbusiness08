import { premiumActive, requireBillingUser, serverError } from './_billing.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' });
  res.setHeader('Cache-Control', 'private, no-store');
  try {
    const context = await requireBillingUser(req);
    if (!context) return res.status(401).json({ error: 'Autenticação necessária.' });
    const { data, error } = await context.db.from('premium_subscriptions')
      .select('status,current_period_end,cancel_at_period_end,stripe_customer_id')
      .eq('user_id', context.user.id).maybeSingle();
    if (error) throw error;
    return res.status(200).json({
      premium: premiumActive(data),
      status: data?.status || 'inactive',
      currentPeriodEnd: data?.current_period_end || null,
      cancelAtPeriodEnd: Boolean(data?.cancel_at_period_end),
      hasCustomer: Boolean(data?.stripe_customer_id),
    });
  } catch (error) { return serverError(res, error); }
}
