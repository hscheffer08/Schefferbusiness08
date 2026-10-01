create table if not exists public.study_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  subject text not null,
  topic text not null,
  focus text not null,
  summary jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists study_summaries_user_updated_idx
  on public.study_summaries (user_id, updated_at desc);

alter table public.study_summaries enable row level security;

grant select, insert, update, delete on public.study_summaries to authenticated;

drop policy if exists "study_summaries_select_own" on public.study_summaries;
create policy "study_summaries_select_own"
on public.study_summaries for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "study_summaries_insert_own" on public.study_summaries;
create policy "study_summaries_insert_own"
on public.study_summaries for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "study_summaries_update_own" on public.study_summaries;
create policy "study_summaries_update_own"
on public.study_summaries for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "study_summaries_delete_own" on public.study_summaries;
create policy "study_summaries_delete_own"
on public.study_summaries for delete
to authenticated
using ((select auth.uid()) = user_id);
