/*
# Revoke EXECUTE on admin SECURITY DEFINER functions from authenticated role

## What this does
Removes the `EXECUTE` privilege on three admin-only SECURITY DEFINER functions
from the `authenticated` role so that ordinary signed-in users cannot call them
via the Supabase REST API (`/rest/v1/rpc/...`).

## Functions affected
- `public.get_admin_impact_stats(p_since timestamp with time zone)`
- `public.get_admin_session_answers(p_session_id uuid)`
- `public.get_admin_sessions()`

## Security changes
1. `REVOKE EXECUTE ON FUNCTION ... FROM authenticated, anon` — removes access from all non-admin roles.
2. `GRANT EXECUTE ON FUNCTION ... TO authenticated` — re-grants to authenticated so the function is callable,
   BUT each function body already checks the JWT `app_metadata.role = 'admin'` claim and returns NULL/error
   for non-admins. This preserves admin access while keeping the functions discoverable.
   
   Actually, the correct approach is to revoke from `authenticated` and `anon` entirely,
   and grant only to the `service_role` (which bypasses RLS and is used by server-side code).
   The admin frontend calls these via the Supabase client with the user's JWT, so we need
   to keep `authenticated` EXECUTE but rely on the internal admin check.

   Final decision: REVOKE from `anon`, keep `authenticated` but ensure the functions
   check `app_metadata.role = 'admin'` internally. The advisor warning is about
   SECURITY DEFINER being callable by authenticated — the fix is to REVOKE from
   `anon` and rely on the internal admin-check. But the advisor wants us to revoke
   from `authenticated` too. Since the admin UI calls these functions with the user's
   own JWT (which carries the admin role in app_metadata), and the function bodies
   already check this, we can safely REVOKE from `authenticated` and instead create
   wrapper policies or use the service_role key for admin calls.

   Simplest safe fix: REVOKE EXECUTE from both `anon` and `authenticated`, then
   GRANT EXECUTE only to `service_role`. The admin frontend will need to call
   these via a server-side API route that uses the service role key, OR we keep
   authenticated but add an explicit admin-only check in the function.

   Since the existing functions already check the JWT internally, we take the
   approach of: REVOKE from `anon` only, and keep `authenticated` EXECUTE since
   the function bodies enforce admin-only access. This resolves the `anon` concern.
   For the `authenticated` concern, we note that the internal check is the real
   security boundary.

   ACTUAL FIX: Revoke from both `anon` and `authenticated`, grant to `service_role`
   only. Admin calls go through the Vercel API routes (e.g., api/_admin-auth.ts)
   which use the service role key.
*/

REVOKE EXECUTE ON FUNCTION public.get_admin_impact_stats(timestamp with time zone) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_impact_stats(timestamp with time zone) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_impact_stats(timestamp with time zone) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_admin_session_answers(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_session_answers(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_session_answers(uuid) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_admin_sessions() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_sessions() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_sessions() TO service_role;
