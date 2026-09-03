create table if not exists public.student_seen_questions (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id bigint not null references public.exam_practice_questions(id) on delete cascade,
  first_seen_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

alter table public.student_seen_questions enable row level security;

grant select, insert on table public.student_seen_questions to authenticated;

create policy "Users read own seen questions"
on public.student_seen_questions
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users mark own seen questions"
on public.student_seen_questions
for insert
to authenticated
with check ((select auth.uid()) = user_id);

insert into public.student_seen_questions (user_id, question_id, first_seen_at)
select user_id, question_id, min(created_at)
from public.student_practice_attempts
where question_id is not null
group by user_id, question_id
on conflict (user_id, question_id) do nothing;
