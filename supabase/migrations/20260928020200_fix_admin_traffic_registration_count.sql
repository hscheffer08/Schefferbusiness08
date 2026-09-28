create or replace function public.get_admin_traffic_stats(p_since timestamptz default null)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_result jsonb;
  v_registrations bigint;
begin
  if auth.uid() is null or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'not authorized';
  end if;

  with filtered as (
    select * from public.analytics_events
    where (p_since is null or created_at >= p_since)
      and coalesce(metadata ->> 'automation', 'false') <> 'true'
  ), traffic as (
    select
      count(*) filter (where event_type='page_view')::bigint as page_views,
      count(distinct coalesce(nullif(metadata->>'visitor_id',''),session_id)) filter (where event_type='page_view')::bigint as visitors,
      count(distinct session_id) filter (where event_type in ('page_view','session_started'))::bigint as sessions
    from filtered
  ), real_use as (
    select
      count(distinct coalesce(nullif(metadata->>'visitor_id',''),session_id)) filter (where event_type not in ('page_view','session_started','homepage_view'))::bigint as engaged_visitors,
      count(distinct user_id) filter (where user_id is not null and event_type not in ('page_view','session_started','homepage_view'))::bigint as active_registered_users,
      count(*) filter (where event_type='login_completed')::bigint as logins,
      count(*) filter (where event_type='match_started')::bigint as matches_started,
      count(*) filter (where event_type='match_completed')::bigint as matches_completed,
      count(*) filter (where event_type='vocational_demo_started')::bigint as vocational_started,
      count(*) filter (where event_type='vocational_demo_completed')::bigint as vocational_completed,
      count(*) filter (where event_type='referral_submitted')::bigint as referrals
    from filtered
  )
  select jsonb_build_object(
    'page_views',t.page_views,
    'visitors',t.visitors,
    'sessions',t.sessions,
    'pages_per_session',case when t.sessions>0 then round(t.page_views::numeric/t.sessions,2) else 0 end,
    'engaged_visitors',r.engaged_visitors,
    'active_registered_users',r.active_registered_users,
    'logins',r.logins,
    'matches_started',r.matches_started,
    'matches_completed',r.matches_completed,
    'vocational_started',r.vocational_started,
    'vocational_completed',r.vocational_completed,
    'referrals',r.referrals,
    'traffic_tracking_since',(select min(created_at) from public.analytics_events where event_type='page_view')
  ) into v_result from traffic t cross join real_use r;

  select count(*) into v_registrations
  from auth.users
  where coalesce(is_anonymous, false) = false
    and (p_since is null or created_at >= p_since);

  return v_result || jsonb_build_object('registrations',v_registrations);
end;
$function$;
