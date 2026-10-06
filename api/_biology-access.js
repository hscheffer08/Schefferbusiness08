import { createHmac, timingSafeEqual } from 'node:crypto';

function secret() {
  return String(process.env.SUPABASE_SERVICE_ROLE_KEY || '');
}

export function issueBiologyAccessToken(hours = 8) {
  const expires = Date.now() + hours * 60 * 60 * 1000;
  const payload = String(expires);
  const signature = createHmac('sha256', secret()).update('biology-course:' + payload).digest('hex');
  return payload + '.' + signature;
}

export function verifyBiologyAccessToken(token) {
  const [expiresRaw, supplied] = String(token || '').split('.');
  const expires = Number(expiresRaw);
  if (!Number.isFinite(expires) || expires <= Date.now() || !supplied || supplied.length !== 64 || !secret()) return false;
  const expected = createHmac('sha256', secret()).update('biology-course:' + expiresRaw).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(supplied, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}
