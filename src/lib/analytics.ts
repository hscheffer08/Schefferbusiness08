import { supabase } from '@/lib/supabase';

let anonSessionId: string | null = null;

function getAnonSessionId(): string {
  if (!anonSessionId) {
    anonSessionId = `anon_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    try {
      sessionStorage.setItem('bsf_session_id', anonSessionId);
    } catch {
      // sessionStorage might be unavailable
    }
  }
  return anonSessionId;
}

export function initSessionId(): string {
  try {
    const stored = sessionStorage.getItem('bsf_session_id');
    if (stored) {
      anonSessionId = stored;
      return stored;
    }
  } catch {
    // ignore
  }
  return getAnonSessionId();
}

export function trackEvent(
  eventType: string,
  metadata?: Record<string, unknown>,
  userId?: string | null
): void {
  if (!supabase) return;
  const sessionId = initSessionId();
  try {
    const result = supabase.from('analytics_events').insert({
      event_type: eventType,
      user_id: userId ?? null,
      session_id: sessionId,
      metadata: metadata ?? null,
    });
    Promise.resolve(result).catch(() => {});
  } catch {
    // silently ignore analytics errors
  }
}
