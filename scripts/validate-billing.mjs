import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (name) => readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const checkout = read('api/billing-checkout.ts');
const billing = read('api/_billing.ts');
const webhook = read('api/stripe-webhook.ts');
const paywall = read('src/components/CourseSubscriptionGate.tsx');
const offer = read('src/components/CourseOfferPopup.tsx');
const premium = read('src/lib/premium-demo-mount.tsx');
const status = read('api/billing-status.ts');

const newYear = Date.parse('2027-01-01T03:00:00Z');
assert.equal(new Date(newYear).toISOString(), '2027-01-01T03:00:00.000Z');
for (const source of [checkout, paywall, offer, premium]) {
  assert.ok(source.includes('2027-01-01T03:00:00Z'), 'New year cutoff must match in each entrypoint');
}
assert.ok(status.includes(String(newYear)), 'API status must use the same cutoff');
assert.ok(billing.includes("'https://xn--conecta-pya.app'"), 'Stripe origin must be ASCII/punycode');
assert.ok(billing.includes("BILLING_LIVE_ENABLED === 'true'"), 'No checkout without explicit enable flag');

for (const [month, expected] of [[10, 3], [11, 2], [12, 1]]) {
  assert.equal(13 - month, expected, 'Promotional coupon should expire before January');
  assert.equal(1999 - 1000, 999, 'BRL cents must match promotional price');
}
assert.ok(checkout.includes("basePrice.unit_amount !== 1999"), 'Reject wrong regular amount');
assert.ok(checkout.includes("coupon.amount_off !== 1000"), 'Reject wrong promotional discount');
assert.ok(checkout.includes("coupon.duration !== 'repeating'"), 'Coupon must expire after promo period');
assert.ok(checkout.includes("stripeRequest('checkout/sessions', 'POST', form, checkoutKey)"), 'Checkout needs idempotency key');
assert.ok(webhook.includes("verifyStripePayload(bytes, signature, secret)"), 'Webhook must check raw payload signature');
assert.ok(webhook.includes("case 'invoice.payment_failed'"), 'Payment failure must be handled');
assert.ok(billing.includes("priceId !== premiumPrice()"), 'Only configured product may grant access');
assert.ok(paywall.includes("VITE_COURSE_PAYWALL_ENABLED === 'true'"), 'Paywall must be opt-in');
console.log('Billing readiness static checks passed: dates, cents, coupons, origin, signature, entitlements, kill-switch.');
