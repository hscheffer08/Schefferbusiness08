/*
  # Lock down helper function EXECUTE grants

  1. Problem
     - `sync_referral_is_valid()` is a trigger function but was reachable as an RPC
       endpoint by `anon` and `authenticated`.
     - `is_admin()` and `session_belongs_to_caller()` do not need to be callable
       directly from the Data API.

  2. Changes
     - Revoke EXECUTE on the trigger function from all client roles. Trigger functions do
       not require an EXECUTE grant on the invoking role, so the trigger keeps working.
     - Narrow `is_admin()` to `authenticated` only; anonymous callers are never admins.
     - `session_belongs_to_caller()` keeps its grant because it is evaluated inside RLS
       policy predicates, which run as the querying role. It only returns a boolean
       about the caller's own session and discloses nothing else.
*/

REVOKE ALL ON FUNCTION public.sync_referral_is_valid() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- is_admin() reads only the signed JWT and needs no elevated rights.
ALTER FUNCTION public.is_admin() SECURITY INVOKER;
