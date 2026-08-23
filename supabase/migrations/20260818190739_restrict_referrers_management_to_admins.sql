/*
  # Restrict referrer code management to admins

  1. Problem
     - `insert_referrers`, `update_referrers` and `delete_referrers` were all
       unconditional for the `authenticated` role, so any account could mint referral
       codes, rename referrers, or deactivate every code and break referral-link
       validation.

  2. Changes
     - Replace the three write policies with admin-only equivalents.
     - Leave the public SELECT policy in place: `validateReferralCode` needs it so a
       visitor arriving on a referral link can be recognised before signing in.

  3. Security
     - Write access now requires `app_metadata.role = 'admin'`, which only a project
       operator can set. Reads are unchanged.
*/

DROP POLICY IF EXISTS "insert_referrers" ON public.referrers;
DROP POLICY IF EXISTS "update_referrers" ON public.referrers;
DROP POLICY IF EXISTS "delete_referrers" ON public.referrers;

CREATE POLICY "insert_referrers_admin_only"
  ON public.referrers
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "update_referrers_admin_only"
  ON public.referrers
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "delete_referrers_admin_only"
  ON public.referrers
  FOR DELETE
  TO authenticated
  USING (public.is_admin());
