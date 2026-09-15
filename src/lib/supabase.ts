import { createClient, type Session } from '@supabase/supabase-js';

function cleanEnv(value: string | undefined): string {
  return (value ?? '').trim().replace(/^['"]|['"]$/g, '');
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
const publicFallbackAnonKey = 'sb_publishable_2DCxkYOlTKqsVjDxYg5pxg_pf5YqdTA';
const configuredUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
const configuredAnonKey = cleanEnv(import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
const hasPlaceholder = !configuredUrl || /x{4,}|seu-projeto/i.test(configuredUrl);
const hasPlaceholderKey = !configuredAnonKey || /x{4,}|sua-chave/i.test(configuredAnonKey);
const url = hasPlaceholder ? publicFallbackUrl : configuredUrl;
const anonKey = url === publicFallbackUrl || hasPlaceholderKey ? publicFallbackAnonKey : configuredAnonKey;

if (!url || !anonKey) console.error('Supabase configuration is missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.');

const baseClient = url && anonKey
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: `conectae-auth-${new URL(url).hostname}`,
      },
    })
  : null;

let refreshInFlight: Promise<Session | null> | null = null;

/**
 * Recover the persisted SDK session without rotating the refresh token on every
 * route reload/focus. Supabase already auto-refreshes tokens. We only perform an
 * explicit refresh when the token is genuinely close to expiry.
 */
export async function ensureFreshSession(forceRefresh = false): Promise<Session | null> {
  if (!baseClient) return null;
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const { data, error } = await baseClient.auth.getSession();
    if (error) {
      console.warn('Supabase persisted session lookup failed', error);
      return null;
    }
    const session = data.session;
    if (!session) return null;

    const expiresAt = Number(session.expires_at || 0) * 1000;
    const closeToExpiry = !expiresAt || expiresAt - Date.now() < 90_000;
    if (!forceRefresh && !closeToExpiry) return session;

    const refreshed = await baseClient.auth.refreshSession();
    if (!refreshed.error && refreshed.data.session) return refreshed.data.session;

    // A still-valid persisted access token is preferable to falsely logging the
    // user out because a refresh request temporarily failed.
    if (expiresAt > Date.now() + 15_000) return session;
    console.warn('Supabase session refresh failed', refreshed.error);
    return null;
  })().finally(() => { refreshInFlight = null; });

  return refreshInFlight;
}

// Do not force refresh on pageshow/focus. That used to rotate refresh tokens
// during ordinary full-page navigation and could race the next document load.
export function startGlobalSessionRecovery() {
  if (!baseClient || typeof window === 'undefined') return;
  const recover = () => { void ensureFreshSession(false).catch(error => console.warn('Global auth session recovery failed', error)); };
  window.addEventListener('online', recover, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') recover(); });
}
startGlobalSessionRecovery();

const optionalReferenceTables = new Set([
  'cultural_axes','text_rubrics','pillar_weights','university_dimension_weights','university_axis_targets',
  'question_dimensions','official_evidence','evidence_dimensions','sources',
]);

function wrapOptionalBuilder(builder: any, table: string): any {
  return new Proxy(builder, {
    get(target, prop, receiver) {
      if (prop === 'then') {
        return (resolve: (value: any) => void, reject: (reason?: any) => void) => target.then(
          (result: any) => {
            if (result?.error) {
              console.warn(`Optional Supabase table ${table} is unavailable`, result.error);
              resolve({ ...result, data: [], error: null });
              return;
            }
            resolve(result);
          }, reject
        );
      }
      const value = Reflect.get(target, prop, receiver);
      if (typeof value === 'function') return (...args: any[]) => wrapOptionalBuilder(value.apply(target, args), table);
      return value;
    },
  });
}

// Keep the native Supabase auth object untouched. Auth methods depend on their
// GoTrueClient instance and the SDK is responsible for persistence/refresh.
export const supabase = baseClient
  ? new Proxy(baseClient, {
      get(target, prop, receiver) {
        if (prop === 'from') {
          return (table: string) => {
            const builder = target.from(table);
            return optionalReferenceTables.has(table) ? wrapOptionalBuilder(builder, table) : builder;
          };
        }
        const value = Reflect.get(target, prop, receiver);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    })
  : null;
