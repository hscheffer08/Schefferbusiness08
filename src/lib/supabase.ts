import { createClient, type Session } from '@supabase/supabase-js';

function cleanEnv(value: string | undefined): string {
  return (value ?? '')
    .trim()
    .replace(/^['"]|['"]$/g, '');
}

function normalizeSupabaseUrl(value: string | undefined): string {
  const raw = cleanEnv(value);
  if (!raw) return '';

  try {
    const parsed = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return raw.replace(/\/+$/, '');
  }
}

const CANONICAL_ORIGIN = 'https://xn--conecta-pya.app';
const LEGACY_PRODUCTION_HOSTS = new Set([
  'businessschoolfit.vercel.app',
  'schefferbusiness08.vercel.app',
  'businessschoolfit-henrique-0176.vercel.app',
  'www.xn--conecta-pya.app',
]);

function normalizeProductionOrigin() {
  if (typeof window === 'undefined') return;
  const host = window.location.hostname.toLowerCase();
  if (!LEGACY_PRODUCTION_HOSTS.has(host)) return;
  const target = `${CANONICAL_ORIGIN}${window.location.pathname}${window.location.search}${window.location.hash}`;
  window.location.replace(target);
}

normalizeProductionOrigin();

const publicFallbackUrl = 'https://kmognvgnfisdchzffkgh.supabase.co';
const publicFallbackAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6Imttb2dudmduZmlzZGNoemZma2doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3MzkxNjksImV4cCI6MjEwMjMxNTE2OX0.JarpsXfgv8PplL3Ryvs6iFfEPiv_rnp2Cx5i1I67fCk';

const configuredUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
const configuredAnonKey = cleanEnv(
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

const hasPlaceholder = !configuredUrl || /x{4,}|seu-projeto/i.test(configuredUrl);
const hasPlaceholderKey = !configuredAnonKey || /x{4,}|sua-chave/i.test(configuredAnonKey);
const url = hasPlaceholder ? publicFallbackUrl : configuredUrl;
const anonKey = hasPlaceholderKey ? publicFallbackAnonKey : configuredAnonKey;

if (!url || !anonKey) {
  console.error('Supabase configuration is missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.');
}

const baseClient = url && anonKey
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : null;

let refreshInFlight: Promise<Session | null> | null = null;
let recoveryStarted = false;

const wait = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));

async function refreshSessionSafely(session: Session): Promise<Session | null> {
  if (!baseClient) return null;

  const attempt = async () => {
    const implicit = await baseClient.auth.refreshSession();
    if (!implicit.error && implicit.data.session) return implicit.data.session;

    if (session.refresh_token) {
      const explicit = await baseClient.auth.refreshSession({ refresh_token: session.refresh_token });
      if (!explicit.error && explicit.data.session) return explicit.data.session;
    }
    return null;
  };

  try {
    const first = await attempt();
    if (first) return first;
  } catch (error) {
    console.warn('Supabase session refresh attempt failed', error);
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) return session;

  try {
    await wait(500);
    return await attempt();
  } catch (error) {
    console.warn('Supabase session refresh retry failed', error);
    return null;
  }
}

export async function ensureFreshSession(forceRefresh = false): Promise<Session | null> {
  if (!baseClient) return null;
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const current = await baseClient.auth.getSession();
    const session = current.data.session;
    if (!session) return null;

    const expiresAt = Number(session.expires_at || 0) * 1000;
    const shouldRefresh = forceRefresh || !expiresAt || expiresAt - Date.now() < 10 * 60 * 1000;
    if (!shouldRefresh) return session;

    const refreshed = await refreshSessionSafely(session);
    if (refreshed) return refreshed;

    if (!forceRefresh && expiresAt - Date.now() > 2 * 60 * 1000) return session;
    return null;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

export function startGlobalSessionRecovery() {
  if (!baseClient || recoveryStarted || typeof window === 'undefined') return;
  recoveryStarted = true;

  const recover = (force = false) => {
    void ensureFreshSession(force).catch(error => {
      console.warn('Global auth session recovery failed', error);
    });
  };

  recover(false);

  window.addEventListener('focus', () => recover(true), { passive: true });
  window.addEventListener('pageshow', () => recover(true), { passive: true });
  window.addEventListener('online', () => recover(true), { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') recover(true);
  });

  window.setInterval(() => {
    if (document.visibilityState === 'visible') recover(false);
  }, 4 * 60 * 1000);
}

startGlobalSessionRecovery();

const optionalReferenceTables = new Set([
  'cultural_axes',
  'text_rubrics',
  'pillar_weights',
  'university_dimension_weights',
  'university_axis_targets',
  'question_dimensions',
  'official_evidence',
  'evidence_dimensions',
  'sources',
]);

function wrapOptionalBuilder(builder: any, table: string): any {
  return new Proxy(builder, {
    get(target, prop, receiver) {
      if (prop === 'then') {
        return (resolve: (value: any) => void, reject: (reason?: any) => void) =>
          target.then(
            (result: any) => {
              if (result?.error) {
                console.warn(`Optional Supabase table ${table} is unavailable`, result.error);
                resolve({ ...result, data: [], error: null });
                return;
              }
              resolve(result);
            },
            reject
          );
      }

      const value = Reflect.get(target, prop, receiver);
      if (typeof value === 'function') {
        return (...args: any[]) => wrapOptionalBuilder(value.apply(target, args), table);
      }
      return value;
    },
  });
}

const authWithFreshSession = baseClient
  ? new Proxy(baseClient.auth, {
      get(target, prop, receiver) {
        if (prop === 'getSession') {
          return async () => {
            try {
              const session = await ensureFreshSession(false);
              return { data: { session }, error: null };
            } catch (error: any) {
              console.warn('Fresh auth session lookup failed', error);
              return { data: { session: null }, error };
            }
          };
        }
        return Reflect.get(target, prop, receiver);
      },
    })
  : null;

export const supabase = baseClient
  ? new Proxy(baseClient, {
      get(target, prop, receiver) {
        if (prop === 'auth') return authWithFreshSession;
        if (prop === 'from') {
          return (table: string) => {
            const builder = target.from(table);
            return optionalReferenceTables.has(table)
              ? wrapOptionalBuilder(builder, table)
              : builder;
          };
        }
        return Reflect.get(target, prop, receiver);
      },
    })
  : null;
