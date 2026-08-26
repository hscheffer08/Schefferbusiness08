/*
# Create sharing_consents table for university profile sharing consent

## Purpose
Stores the student's consent (or refusal) to share their Conectaê profile
and match results with participating universities. This is an OPTIONAL feature —
the student can always see their results regardless of their choice here.

## New Tables
- `sharing_consents`
  - `id` (uuid, PK)
  - `user_id` (uuid, NOT NULL, FK → auth.users, owner of the consent)
  - `consent_status` (text: 'accepted' | 'declined' | 'revoked', default 'declined')
  - `consent_scope` (text: 'all_participating' | 'my_ranking' | 'top_match' | 'none', default 'none')
  - `consent_given_at` (timestamptz, when consent was first given)
  - `consent_revoked_at` (timestamptz, when consent was revoked, if applicable)
  - `privacy_policy_version` (text, default '1.0', version of privacy policy the user consented to)
  - `requires_guardian_consent` (boolean, default false — true when user is a minor)
  - `guardian_consent_given` (boolean, default false)
  - `guardian_consent_given_at` (timestamptz, when guardian consent was obtained)
  - `guardian_name` (text, nullable — name of legal guardian if applicable)
  - `guardian_email` (text, nullable — email of legal guardian for verification)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

## Security
- RLS enabled on `sharing_consents`.
- Owner-scoped CRUD: each authenticated user can only read/modify their own consent record.
- No public access — this table is strictly per-user.

## Important Notes
1. This table does NOT send any data to universities. It only stores the consent state.
2. Actual data sharing with universities remains DISABLED until explicitly authorized by the project owner.
3. For minors (under 18), `requires_guardian_consent` is set to true and sharing is blocked until
   `guardian_consent_given` becomes true.
4. The `privacy_policy_version` field tracks which version of the privacy policy the user agreed to,
   enabling future re-consent flows if the policy changes.
*/

CREATE TABLE IF NOT EXISTS sharing_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_status text NOT NULL DEFAULT 'declined' CHECK (consent_status IN ('accepted', 'declined', 'revoked')),
  consent_scope text NOT NULL DEFAULT 'none' CHECK (consent_scope IN ('all_participating', 'my_ranking', 'top_match', 'none')),
  consent_given_at timestamptz,
  consent_revoked_at timestamptz,
  privacy_policy_version text NOT NULL DEFAULT '1.0',
  requires_guardian_consent boolean NOT NULL DEFAULT false,
  guardian_consent_given boolean NOT NULL DEFAULT false,
  guardian_consent_given_at timestamptz,
  guardian_name text,
  guardian_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE sharing_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_consent" ON sharing_consents;
CREATE POLICY "select_own_consent" ON sharing_consents
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_consent" ON sharing_consents;
CREATE POLICY "insert_own_consent" ON sharing_consents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_consent" ON sharing_consents;
CREATE POLICY "update_own_consent" ON sharing_consents
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_consent" ON sharing_consents;
CREATE POLICY "delete_own_consent" ON sharing_consents
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_sharing_consents_user_id ON sharing_consents(user_id);
CREATE INDEX IF NOT EXISTS idx_sharing_consents_status ON sharing_consents(consent_status);
