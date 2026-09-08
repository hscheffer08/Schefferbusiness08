import { supabase } from '@/lib/supabase';

const SESSION_KEY = 'bsf_session_id';
const VISITOR_KEY = 'bsf_visitor_id';
const SESSION_STARTED_KEY = 'bsf_session_started';

let anonSessionId: string | null = null;
let anonVisitorId: string | null = null;
let trackingInitialized = false;
let lastTrackedLocation = '';

function createAnonId(prefix: 'anon' | 'visitor'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getAnonSessionId(): string {
  if (anonSessionId) return anonSessionId;

  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored) {
      anonSessionId = stored;
      return stored;
    }
  } catch {
    // sessionStorage might be unavailable
  }

  anonSessionId = createAnonId('anon');
  try {
    sessionStorage.setItem(SESSION_KEY, anonSessionId);
  } catch {
    // sessionStorage might be unavailable
  }
  return anonSessionId;
}

function getAnonVisitorId(): string {
  if (anonVisitorId) return anonVisitorId;

  try {
    const stored = localStorage.getItem(VISITOR_KEY);
    if (stored) {
      anonVisitorId = stored;
      return stored;
    }
  } catch {
    // localStorage might be unavailable
  }

  anonVisitorId = createAnonId('visitor');
  try {
    localStorage.setItem(VISITOR_KEY, anonVisitorId);
  } catch {
    // localStorage might be unavailable
  }
  return anonVisitorId;
}

export function initSessionId(): string {
  return getAnonSessionId();
}

export function initVisitorId(): string {
  return getAnonVisitorId();
}

function getPageMetadata(extra?: Record<string, unknown>): Record<string, unknown> {
  const url = new URL(window.location.href);
  return {
    visitor_id: getAnonVisitorId(),
    path: url.pathname,
    query: url.search || null,
    referrer: document.referrer || null,
    title: document.title || null,
    language: navigator.language || null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
    ...extra,
  };
}

async function resolveAuthenticatedUserId(): Promise<string | null> {
  const client = supabase;
  if (!client) return null;
  try {
    const { data } = await client.auth.getSession();
    return data.session?.user?.id ?? null;
  } catch {
    return null;
  }
}

export function trackEvent(
  eventType: string,
  metadata?: Record<string, unknown>,
  userId?: string | null
): void {
  const client = supabase;
  if (!client) return;

  const sessionId = getAnonSessionId();
  const visitorId = getAnonVisitorId();

  const write = async () => {
    const resolvedUserId = userId === undefined ? await resolveAuthenticatedUserId() : userId;
    try {
      await client.from('analytics_events').insert({
        event_type: eventType,
        user_id: resolvedUserId ?? null,
        session_id: sessionId,
        metadata: {
          visitor_id: visitorId,
          ...(metadata ?? {}),
        },
      });
    } catch {
      // Analytics must never block the product experience.
    }
  };

  void write();
}

function trackSessionStart(): void {
  try {
    if (sessionStorage.getItem(SESSION_STARTED_KEY) === '1') return;
    sessionStorage.setItem(SESSION_STARTED_KEY, '1');
  } catch {
    // If storage is unavailable, recording an extra session_start is preferable to losing analytics.
  }

  trackEvent('session_started', getPageMetadata({
    entry_path: window.location.pathname,
  }));
}

function trackCurrentPageView(): void {
  const locationKey = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (locationKey === lastTrackedLocation) return;
  lastTrackedLocation = locationKey;

  trackEvent('page_view', getPageMetadata());
}

function installNavigationTracking(): void {
  const originalPushState = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  history.pushState = (...args: Parameters<History['pushState']>) => {
    originalPushState(...args);
    queueMicrotask(trackCurrentPageView);
  };

  history.replaceState = (...args: Parameters<History['replaceState']>) => {
    originalReplaceState(...args);
    queueMicrotask(trackCurrentPageView);
  };

  window.addEventListener('popstate', trackCurrentPageView);
  window.addEventListener('hashchange', trackCurrentPageView);
}

export function initAnalyticsTracking(): void {
  if (trackingInitialized || typeof window === 'undefined') return;
  trackingInitialized = true;

  getAnonSessionId();
  getAnonVisitorId();
  trackSessionStart();
  trackCurrentPageView();
  installNavigationTracking();
}
