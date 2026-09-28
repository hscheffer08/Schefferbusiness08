create or replace function public.get_admin_dashboard_stats(p_since timestamptz default null)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $function$
declare
  v_result jsonb;
begin
  if auth.uid() is null
     or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'not authorized';
  end if;

  with filtered_events as (
    select event_type, session_id, user_id, metadata, created_at
    from public.analytics_events
    where (p_since is null or created_at >= p_since)
      and coalesce(metadata ->> 'automation', 'false') <> 'true'
  ),
  traffic as (
    select
      count(distinct coalesce(nullif(metadata ->> 'visitor_id', ''), session_id))
        filter (where event_type = 'page_view')::bigint as visitors,
      count(*) filter (where event_type = 'page_view')::bigint as page_views,
      count(distinct session_id)
        filter (where event_type in ('page_view', 'session_started'))::bigint as sessions
    from filtered_events
  ),
  funnel as (
    select
      count(*) filter (where event_type = 'match_started')::bigint as match_started,
      count(*) filter (where event_type = 'match_completed')::bigint as match_completed
    from filtered_events
  ),
  registrations as (
    select count(*)::bigint as total
    from auth.users
    where coalesce(is_anonymous, false) = false
      and (p_since is null or created_at >= p_since)
  ),
  top_universities as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object('name', top_university, 'count', occurrences)
        order by occurrences desc, top_university asc
      ),
      '[]'::jsonb
    ) as items
    from (
      select metadata ->> 'top_university' as top_university,
             count(*)::bigint as occurrences
      from filtered_events
      where event_type = 'match_completed'
        and nullif(metadata ->> 'top_university', '') is not null
      group by metadata ->> 'top_university'
      order by occurrences desc
      limit 7
    ) ranked
  ),
  recent_events as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object('event_type', event_type, 'created_at', created_at)
        order by created_at desc
      ),
      '[]'::jsonb
    ) as items
    from (
      select event_type, created_at
      from filtered_events
      order by created_at desc
      limit 20
    ) recent
  ),
  consent_summary as (
    select
      count(*) filter (where consent_status = 'accepted')::bigint as accepted,
      count(*) filter (where consent_status = 'declined')::bigint as declined,
      count(*) filter (where consent_status = 'revoked')::bigint as revoked,
      count(*)::bigint as total
    from public.sharing_consents
    where p_since is null or created_at >= p_since
  ),
  consent_scope as (
    select coalesce(
      jsonb_agg(
        jsonb_build_object('scope', consent_scope, 'count', occurrences)
        order by occurrences desc, consent_scope asc
      ),
      '[]'::jsonb
    ) as items
    from (
      select consent_scope, count(*)::bigint as occurrences
      from public.sharing_consents
      where p_since is null or created_at >= p_since
      group by consent_scope
    ) scopes
  )
  select jsonb_build_object(
    'totalVisitors', t.visitors,
    'pageViews', t.page_views,
    'sessions', t.sessions,
    'totalUsers', r.total,
    'quizzesStarted', f.match_started,
    'quizzesCompleted', f.match_completed,
    'matchesGenerated', f.match_completed,
    'topUniversities', tu.items,
    'recentEvents', re.items,
    'consentAccepted', cs.accepted,
    'consentDeclined', cs.declined,
    'consentRevoked', cs.revoked,
    'consentTotal', cs.total,
    'consentByScope', cscope.items
  )
  into v_result
  from traffic t
  cross join funnel f
  cross join registrations r
  cross join top_universities tu
  cross join recent_events re
  cross join consent_summary cs
  cross join consent_scope cscope;

  return v_result;
end;
$function$;

revoke all on function public.get_admin_dashboard_stats(timestamptz) from public;
revoke all on function public.get_admin_dashboard_stats(timestamptz) from anon;
grant execute on function public.get_admin_dashboard_stats(timestamptz) to authenticated;
