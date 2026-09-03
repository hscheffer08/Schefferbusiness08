drop policy if exists students_read_own_weekly_progress on public.student_weekly_plan_progress;
drop policy if exists students_insert_own_weekly_progress on public.student_weekly_plan_progress;
drop policy if exists students_update_own_weekly_progress on public.student_weekly_plan_progress;

create policy students_read_own_weekly_progress
on public.student_weekly_plan_progress
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy students_insert_own_weekly_progress
on public.student_weekly_plan_progress
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy students_update_own_weekly_progress
on public.student_weekly_plan_progress
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
