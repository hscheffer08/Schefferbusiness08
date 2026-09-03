alter table public.student_weekly_plan_progress
  add column if not exists plan_key text not null default 'legacy';

alter table public.student_weekly_plan_progress
  drop constraint if exists student_weekly_plan_progress_pkey;

alter table public.student_weekly_plan_progress
  add constraint student_weekly_plan_progress_pkey
  primary key (user_id, exam_id, plan_key, week_start);
