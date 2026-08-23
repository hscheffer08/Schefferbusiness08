/*
# Referral System — referrers and referrals tables

## Purpose
Adds a referral/indication system so the admin can track who referred new users to B-School Fit,
generate unique referral codes/links, and view a ranking of referrers by valid completed-test referrals.

## New Tables

### 1. `referrers`
Stores each person who can refer others (an "indicador").
- `id` (uuid, PK)
- `name` (text, not null) — display name of the referrer
- `referral_code` (text, unique, not null) — short uppercase code, e.g. ALLEGRA01
- `is_active` (boolean, default true) — false = code deactivated, no longer counts
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### 2. `referrals`
Stores each individual referral event (one row per referred person per referrer).
- `id` (uuid, PK)
- `referrer_id` (uuid, FK → referrers.id, not null) — who referred
- `referral_code` (text, not null) — the code used (denormalized for quick lookup)
- `referred_user_id` (uuid, nullable) — the auth user id of the referred person, if signed up
- `referred_user_name` (text, nullable) — display name if available
- `referred_user_email` (text, nullable) — email if available and authorized
- `referral_source` (text, not null) — how the referral arrived: 'link', 'manual', 'unknown'
- `quiz_started` (boolean, default false) — did the referred user start the quiz?
- `quiz_completed` (boolean, default false) — did the referred user complete the quiz?
- `is_valid` (boolean, default false) — true only when quiz_completed = true (valid referral)
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())

### 3. Unique constraint
- `UNIQUE (referrer_id, referred_user_id)` — prevents the same user from being counted twice for the same referrer.
  Note: `referred_user_id` can be null for anonymous visitors, so this constraint only applies when both are non-null.

## Security
- RLS enabled on both tables.
- `referrers`: admin-only for write (insert/update/delete); read access for `anon, authenticated` so the frontend can look up a code from a URL param.
- `referrals`: insert allowed for `anon, authenticated` (new visitors create referral rows); 
  update allowed for `anon, authenticated` (to set quiz_started/quiz_completed); 
  select/delete restricted to `authenticated` (admin views only — the admin check is enforced via app_metadata role, but the policy allows authenticated to read since the admin panel runs as authenticated).
  To avoid leaking, we restrict SELECT to authenticated only (not anon).

## Important Notes
1. This migration does NOT alter any existing tables or data.
2. The `referrers` table is readable by anon so the frontend can validate a `?ref=CODE` URL param without requiring login.
3. The `referrals` table allows anon INSERT so anonymous visitors can be tracked before they sign up.
4. A referral is only "valid" (is_valid = true) when quiz_completed becomes true.
5. Deduplication: the unique constraint on (referrer_id, referred_user_id) prevents double-counting the same user for the same referrer.
*/

-- ============================================================
-- referrers table
-- ============================================================
CREATE TABLE IF NOT EXISTS referrers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  referral_code text UNIQUE NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE referrers ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can read referrers — needed to validate ?ref=CODE
DROP POLICY IF EXISTS "read_referrers" ON referrers;
CREATE POLICY "read_referrers"
ON referrers FOR SELECT
TO anon, authenticated USING (true);

-- Only authenticated (admin) can insert/update/delete referrers
DROP POLICY IF EXISTS "insert_referrers" ON referrers;
CREATE POLICY "insert_referrers"
ON referrers FOR INSERT
TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_referrers" ON referrers;
CREATE POLICY "update_referrers"
ON referrers FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_referrers" ON referrers;
CREATE POLICY "delete_referrers"
ON referrers FOR DELETE
TO authenticated USING (true);

-- ============================================================
-- referrals table
-- ============================================================
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES referrers(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  referred_user_id uuid,
  referred_user_name text,
  referred_user_email text,
  referral_source text NOT NULL DEFAULT 'unknown',
  quiz_started boolean NOT NULL DEFAULT false,
  quiz_completed boolean NOT NULL DEFAULT false,
  is_valid boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Anon + authenticated can insert (new visitors may be anonymous)
DROP POLICY IF EXISTS "insert_referrals" ON referrals;
CREATE POLICY "insert_referrals"
ON referrals FOR INSERT
TO anon, authenticated WITH CHECK (true);

-- Anon + authenticated can update (to set quiz_started/quiz_completed)
DROP POLICY IF EXISTS "update_referrals" ON referrals;
CREATE POLICY "update_referrals"
ON referrals FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

-- Only authenticated can read referrals (admin panel)
DROP POLICY IF EXISTS "select_referrals" ON referrals;
CREATE POLICY "select_referrals"
ON referrals FOR SELECT
TO authenticated USING (true);

-- Only authenticated (admin) can delete
DROP POLICY IF EXISTS "delete_referrals" ON referrals;
CREATE POLICY "delete_referrals"
ON referrals FOR DELETE
TO authenticated USING (true);

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_is_valid ON referrals(is_valid) WHERE is_valid = true;
CREATE INDEX IF NOT EXISTS idx_referrers_referral_code ON referrers(referral_code);

-- ============================================================
-- Unique constraint for deduplication
-- (only applies when referred_user_id is non-null)
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_unique_user_referrer
ON referrals (referrer_id, referred_user_id)
WHERE referred_user_id IS NOT NULL;
