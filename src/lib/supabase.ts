import { createClient } from '@supabase/supabase-js';

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

const url = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
const anonKey = cleanEnv(
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

if (!url || !anonKey) {
  console.error('Supabase configuration is missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.');
}

const baseClient = url && anonKey
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// These tables enrich the match result, but a policy/schema issue in any one of
// them must never take the whole public site offline. Core tables remain strict.
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

export const supabase = baseClient
  ? new Proxy(baseClient, {
      get(target, prop, receiver) {
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
