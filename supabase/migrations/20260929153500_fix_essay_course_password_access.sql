-- Persist password-based course access so RLS can return lessons and materials.
-- The browser no longer treats localStorage as authorization.

create or replace function public.redeem_essay_course_access(p_password text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_id uuid := auth.uid();
  v_password_hash constant text := '4097fd1d8435953124d3f836ca2ae42f5dd97168871d5107df2fb7370fbdfb9d';
begin
  if v_user_id is null then
    return false;
  end if;

  if encode(extensions.digest(coalesce(p_password, ''), 'sha256'), 'hex') <> v_password_hash then
    return false;
  end if;

  insert into public.essay_course_access (user_id, access_method, granted_at)
  values (v_user_id, 'password', now())
  on conflict (user_id) do update
    set access_method = excluded.access_method,
        granted_at = excluded.granted_at;

  return true;
end;
$$;

revoke all on function public.redeem_essay_course_access(text) from public;
grant execute on function public.redeem_essay_course_access(text) to authenticated;
