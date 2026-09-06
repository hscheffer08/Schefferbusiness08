alter table public.premium_subscriptions add column if not exists trial_started_at timestamptz;

create or replace function public.start_premium_trial()
returns public.premium_subscriptions
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  existing public.premium_subscriptions;
  result public.premium_subscriptions;
begin
  if uid is null then raise exception 'not authenticated'; end if;
  select * into existing from public.premium_subscriptions where user_id = uid;

  if existing.user_id is not null then
    if existing.status in ('active','trialing') and (existing.current_period_end is null or existing.current_period_end > now()) then
      return existing;
    end if;
    if existing.trial_started_at is not null then
      raise exception 'trial already used';
    end if;
  end if;

  insert into public.premium_subscriptions(user_id,status,plan,current_period_end,cancel_at_period_end,trial_started_at,updated_at)
  values(uid,'trialing','premium_monthly',now()+interval '14 days',false,now(),now())
  on conflict(user_id) do update set
    status='trialing',
    plan='premium_monthly',
    current_period_end=now()+interval '14 days',
    cancel_at_period_end=false,
    trial_started_at=coalesce(public.premium_subscriptions.trial_started_at,now()),
    updated_at=now()
  returning * into result;
  return result;
end;
$$;

revoke all on function public.start_premium_trial() from public;
grant execute on function public.start_premium_trial() to authenticated;
