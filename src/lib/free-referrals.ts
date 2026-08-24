import { supabase } from '@/lib/supabase';
import type { Referrer, Referral } from '@/types';

export interface ReferralNameRankingEntry {
  key: string;
  name: string;
  referrer_ids: string[];
  referral_codes: string[];
  total_indications: number;
  quizzes_started: number;
  quizzes_completed: number;
  valid_referrals: number;
}

export function cleanReferralName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function normalizeReferralName(value: string): string {
  return cleanReferralName(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

function referralCodeBase(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 10) || 'INDICACAO';
}

export async function resolveOrCreateReferrer(input: string): Promise<Referrer | null> {
  if (!supabase) return null;

  const cleaned = cleanReferralName(input);
  if (!cleaned) return null;

  // Preserve compatibility with old referral links/codes.
  const { data: byCode } = await supabase
    .from('referrers')
    .select('*')
    .eq('referral_code', cleaned.toUpperCase())
    .eq('is_active', true)
    .maybeSingle();

  if (byCode) return byCode as Referrer;

  const { data: allReferrers, error: readError } = await supabase
    .from('referrers')
    .select('*')
    .eq('is_active', true);

  if (!readError && allReferrers) {
    const normalized = normalizeReferralName(cleaned);
    const existing = (allReferrers as Referrer[]).find(
      (referrer) => normalizeReferralName(referrer.name) === normalized
    );
    if (existing) return existing;
  }

  // This insert is best-effort and mainly keeps compatibility with the legacy
  // code/link referral system. The prize/ranking count itself is recorded in
  // analytics_events, which accepts anonymous and authenticated submissions.
  const base = referralCodeBase(cleaned);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const suffix = `${Date.now().toString(36).slice(-4)}${Math.floor(Math.random() * 90 + 10)}`.toUpperCase();
    const referralCode = `${base.slice(0, 8)}${suffix}`.slice(0, 16);
    const { data, error } = await supabase
      .from('referrers')
      .insert({
        name: cleaned,
        referral_code: referralCode,
        is_active: true,
      })
      .select('*')
      .maybeSingle();

    if (!error && data) return data as Referrer;
  }

  return null;
}

type ReferralSubmissionEvent = {
  user_id: string | null;
  session_id: string | null;
  metadata: { referrer_name?: unknown; mode?: unknown } | null;
  created_at: string;
};

export async function getReferralNameRanking(): Promise<ReferralNameRankingEntry[]> {
  if (!supabase) return [];

  // The completed-quiz event is the source of truth for new indications because
  // analytics_events accepts both anonymous and authenticated inserts. Legacy
  // referral rows are also included, with authenticated users deduplicated.
  const [referrersRes, referralsRes, eventsRes] = await Promise.all([
    supabase.from('referrers').select('*'),
    supabase.from('referrals').select('*'),
    supabase
      .from('analytics_events')
      .select('user_id, session_id, metadata, created_at')
      .eq('event_type', 'referral_submitted'),
  ]);

  if (eventsRes.error) return [];

  const referrers = (referrersRes.data ?? []) as Referrer[];
  const referrals = (referralsRes.data ?? []) as Referral[];
  const events = (eventsRes.data ?? []) as ReferralSubmissionEvent[];
  const referrerById = new Map(referrers.map((r) => [r.id, r]));
  const groups = new Map<string, ReferralNameRankingEntry>();
  const legacyUsersByKey = new Map<string, Set<string>>();

  const ensureGroup = (name: string): ReferralNameRankingEntry => {
    const cleaned = cleanReferralName(name);
    const key = normalizeReferralName(cleaned);
    const existing = groups.get(key);
    if (existing) return existing;
    const created: ReferralNameRankingEntry = {
      key,
      name: cleaned,
      referrer_ids: [],
      referral_codes: [],
      total_indications: 0,
      quizzes_started: 0,
      quizzes_completed: 0,
      valid_referrals: 0,
    };
    groups.set(key, created);
    return created;
  };

  for (const referrer of referrers) {
    const key = normalizeReferralName(referrer.name);
    if (!key) continue;
    const group = ensureGroup(referrer.name);
    if (!group.referrer_ids.includes(referrer.id)) group.referrer_ids.push(referrer.id);
    if (!group.referral_codes.includes(referrer.referral_code)) group.referral_codes.push(referrer.referral_code);
  }

  // Keep previous referral records visible so historical counts are not lost.
  for (const referral of referrals) {
    const referrer = referrerById.get(referral.referrer_id);
    if (!referrer) continue;
    const key = normalizeReferralName(referrer.name);
    if (!key) continue;
    const group = ensureGroup(referrer.name);
    group.total_indications += 1;
    if (referral.quiz_started) group.quizzes_started += 1;
    if (referral.quiz_completed) group.quizzes_completed += 1;
    if (referral.is_valid) group.valid_referrals += 1;
    if (referral.referred_user_id) {
      const users = legacyUsersByKey.get(key) ?? new Set<string>();
      users.add(referral.referred_user_id);
      legacyUsersByKey.set(key, users);
    }
  }

  const seenEventKeys = new Set<string>();
  for (const event of events) {
    const rawName = event.metadata?.referrer_name;
    if (typeof rawName !== 'string') continue;
    const cleaned = cleanReferralName(rawName);
    const key = normalizeReferralName(cleaned);
    if (!key) continue;

    // A browser session should count once even if the completion handler fires twice.
    const eventKey = `${key}:${event.session_id ?? event.user_id ?? event.created_at}`;
    if (seenEventKeys.has(eventKey)) continue;
    seenEventKeys.add(eventKey);

    // If an authenticated user's legacy referral already exists for this same name,
    // do not count the new completion event a second time.
    if (event.user_id && legacyUsersByKey.get(key)?.has(event.user_id)) continue;

    const group = ensureGroup(cleaned);
    group.total_indications += 1;
    group.quizzes_started += 1;
    group.quizzes_completed += 1;
    group.valid_referrals += 1;
  }

  return Array.from(groups.values())
    .filter((entry) => entry.total_indications > 0)
    .sort((a, b) =>
      b.total_indications - a.total_indications ||
      a.name.localeCompare(b.name, 'pt-BR')
    );
}

export async function getReferralsForName(referrerIds: string[]): Promise<Referral[]> {
  if (!supabase || referrerIds.length === 0) return [];
  const { data, error } = await supabase
    .from('referrals')
    .select('*')
    .in('referrer_id', referrerIds)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as Referral[];
}
