/*
# Revoke EXECUTE on get_admin_traffic_stats from authenticated/anon

## What this does
Removes EXECUTE on get_admin_traffic_stats from anon and authenticated roles.
The function is now called exclusively through the server-side admin-rpc proxy
which uses the service role key.

## Security changes
- REVOKE EXECUTE FROM anon, authenticated
- GRANT EXECUTE TO service_role
*/

REVOKE EXECUTE ON FUNCTION public.get_admin_traffic_stats(timestamp with time zone) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_traffic_stats(timestamp with time zone) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_traffic_stats(timestamp with time zone) TO service_role;
