import { createHmac, timingSafeEqual } from 'node:crypto';
import { markCanceledSubscription, syncSubscription } from './_billing.js';

export const config = { api: { bodyParser: false } };

async function rawBody(req: any) {
  if (Buffer.isBuffer(req.rawBody)) return req.rawBody;
  if (typeof req.rawBody === 'string') return Buffer.from(req.rawBody);
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > 1024 * 1024) throw new Error('Webhook payload too large');
    chunks.push(buffer);
  }
  return Buffer.concat(chunks);
}
export function verifyStripePayload(body: Buffer, signature: string, secret: string) {
  const timestampText = signature.split(',').find(v => v.startsWith('t='))?.slice(2) || '';
  const timestamp = Number(timestampText);
  if (!Number.isSafeInteger(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300) return false;
  const expected = createHmac('sha256', secret).update(timestampText + '.').update(body).digest();
  return signature.split(',').filter(v => v.startsWith('v1=')).some(value => {
    const hex = value.slice(3);
    if (!/^[a-f\d]{64}$/i.test(hex)) return false;
    return timingSafeEqual(expected, Buffer.from(hex, 'hex'));
  });
}
function subscriptionId(value: any): string | null {
  const candidate = value?.subscription || value?.parent?.subscription_details?.subscription;
  const id = typeof candidate === 'string' ? candidate : candidate?.id;
  return /^sub_[a-zA-Z0-9]+$/.test(id || '') ? id : null;
}
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return res.status(503).json({ error: 'Webhook não configurado.' });
  let event: any;
  try {
    const bytes = await rawBody(req);
    const signature = String(req.headers?.['stripe-signature'] || '');
    if (!verifyStripePayload(bytes, signature, secret)) return res.status(400).json({ error: 'Assinatura inválida.' });
    event = JSON.parse(bytes.toString('utf8'));
  } catch { return res.status(400).json({ error: 'Evento inválido.' }); }
  try {
    const object = event?.data?.object || {};
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        // Access is never granted merely because the browser returned from Checkout.
        if (object.mode !== 'subscription') break;
        const id = subscriptionId(object);
        if (id && (object.payment_status === 'paid' || object.payment_status === 'no_payment_required')) {
          await syncSubscription(id, object.client_reference_id || object.metadata?.conectae_user_id);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        if (typeof object.id === 'string') await syncSubscription(object.id);
        break;
      }
      case 'customer.subscription.deleted': {
        if (typeof object.id === 'string') await markCanceledSubscription(object.id);
        break;
      }
      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const id = subscriptionId(object);
        if (id) await syncSubscription(id);
        break;
      }
      default: break;
    }
    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Stripe webhook processing failed:', event?.type, error instanceof Error ? error.message : 'Unknown');
    return res.status(503).json({ error: 'Falha temporária ao sincronizar a assinatura.' });
  }
}
