create table if not exists public.student_phase_drill_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  drill_id bigint not null references public.admission_phase_drills(id) on delete cascade,
  exam_id text not null check (exam_id in ('link','insper')),
  phase text not null,
  competency text not null,
  duration_seconds integer,
  notes text,
  pressure_twist text,
  rubric_scores jsonb not null default '{}'::jsonb,
  weighted_score numeric,
  created_at timestamptz not null default now()
);
create index if not exists student_phase_drill_attempts_user_created_idx on public.student_phase_drill_attempts(user_id,created_at desc);
create index if not exists student_phase_drill_attempts_user_exam_idx on public.student_phase_drill_attempts(user_id,exam_id,phase);
alter table public.student_phase_drill_attempts enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='student_phase_drill_attempts' and policyname='phase_attempts_select_own') then
    create policy phase_attempts_select_own on public.student_phase_drill_attempts for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='student_phase_drill_attempts' and policyname='phase_attempts_insert_own') then
    create policy phase_attempts_insert_own on public.student_phase_drill_attempts for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='student_phase_drill_attempts' and policyname='phase_attempts_update_own') then
    create policy phase_attempts_update_own on public.student_phase_drill_attempts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;
grant select,insert,update on public.student_phase_drill_attempts to authenticated;
