/*
  # Restrict access to referrals

  1. Problem
     - `select_referrals` was `USING (true)` for every signed-in account, publishing the
       name and email address of every referred person.
     - `update_referrals` was `USING/WITH CHECK (true)` for `anon` and `authenticated`,
       and `delete_referrals` was `USING (true)`, so anyone could flip `is_valid` on any
       row to inflate the referral leaderboard, or delete rows outright.

  2. Changes
     - Add `public.is_admin()`, reading the role from `app_metadata` only (never from the
       user-editable `user_metadata`).
     - Replace SELECT/INSERT/UPDATE/DELETE policies with subject-or-admin scoped ones.
     - Revoke client UPDATE on `is_valid` and derive it from `quiz_completed` in a
       trigger, so the value-carrying column cannot be set directly.

  3. Security
     - A user can still see and progress their own referral row; only an operator can
       read the whole table or delete from it.
*/

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT coalesce(
    ((auth.jwt() -> 'app_metadata') ->> 'role') = 'admin',
    false
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

DROP POLICY IF EXISTS "select_referrals" ON public.referrals;
DROP POLICY IF EXISTS "insert_referrals" ON public.referrals;
DROP POLICY IF EXISTS "update_referrals" ON public.referrals;
DROP POLICY IF EXISTS "delete_referrals" ON public.referrals;

CREATE POLICY "select_own_or_admin_referrals"
  ON public.referrals
  FOR SELECT
  TO authenticated
  USING (referred_user_id = auth.uid() OR public.is_admin());

CREATE POLICY "insert_own_referral"
  ON public.referrals
  FOR INSERT
  TO authenticated
  WITH CHECK (referred_user_id = auth.uid() OR public.is_admin());

CREATE POLICY "update_own_or_admin_referrals"
  ON public.referrals
  FOR UPDATE
  TO authenticated
  USING (referred_user_id = auth.uid() OR public.is_admin())
  WITH CHECK (referred_user_id = auth.uid() OR public.is_admin());

CREATE POLICY "delete_referrals_admin_only"
  ON public.referrals
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- `is_valid` carries the leaderboard value: clients must never write it directly.
REVOKE UPDATE ON public.referrals FROM anon, authenticated;
GRANT UPDATE (referral_source, referred_user_name, referred_user_email,
              quiz_started, quiz_completed, updated_at)
  ON public.referrals TO authenticated;

CREATE OR REPLACE FUNCTION public.sync_referral_is_valid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.is_valid := coalesce(NEW.quiz_completed, false);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS referrals_sync_is_valid ON public.referrals;
CREATE TRIGGER referrals_sync_is_valid
  BEFORE INSERT OR UPDATE ON public.referrals
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_referral_is_valid();
