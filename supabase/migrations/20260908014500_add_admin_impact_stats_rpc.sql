create or replace function public.get_admin_impact_stats(p_since timestamptz default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if auth.uid() is null or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') <> 'admin' then
    raise exception 'not authorized';
  end if;

  with
  practice as (
    select user_id, exam_id, correct, created_at, duration_seconds
    from public.student_practice_attempts
    where p_since is null or created_at >= p_since
  ),
  official_answers as (
    select user_id, 'official_exam'::text as exam_id, correct, created_at, null::integer as duration_seconds
    from public.student_official_exam_answers
    where p_since is null or created_at >= p_since
  ),
  question_events as (
    select * from practice
    union all
    select * from official_answers
  ),
  question_summary as (
    select count(*)::bigint as answered,
      count(*) filter (where correct is true)::bigint as correct,
      count(distinct user_id)::bigint as users
    from question_events
  ),
  ai_summary as (
    select count(*)::bigint as interactions, count(distinct user_id)::bigint as users
    from public.ai_tutor_usage
    where p_since is null or created_at >= p_since
  ),
  ai_feedback_summary as (
    select count(*)::bigint as feedback_total,
      count(*) filter (where helpful is true)::bigint as helpful
    from public.ai_tutor_feedback
    where p_since is null or created_at >= p_since
  ),
  plan_summary as (
    select count(*)::bigint as plan_weeks_started,
      count(distinct user_id)::bigint as users,
      coalesce(sum(cardinality(completed_sessions)), 0)::bigint as sessions_completed
    from public.student_weekly_plan_progress
    where p_since is null or updated_at >= p_since
  ),
  mock_summary as (
    select (
      select count(*) from public.student_official_exam_sessions
      where completed_at is not null and (p_since is null or completed_at >= p_since)
    ) + (
      select count(distinct row(user_id, exam_id, occurred_at))
      from public.student_exam_attempts
      where p_since is null or created_at >= p_since
    ) as completed
  ),
  tracked_seconds as (
    select
      coalesce((select sum(coalesce(duration_seconds,0)) from practice),0)::bigint
      + coalesce((select sum(coalesce(duration_minutes,0) * 60) from public.student_exam_attempts where p_since is null or created_at >= p_since),0)::bigint
      + coalesce((select sum(coalesce(duration_seconds,0)) from public.student_phase_drill_attempts where p_since is null or created_at >= p_since),0)::bigint
      as seconds
  ),
  ranked as (
    select user_id, correct,
      row_number() over (partition by user_id order by created_at asc, id asc) as rn_first,
      row_number() over (partition by user_id order by created_at desc, id desc) as rn_last,
      count(*) over (partition by user_id) as total_attempts
    from public.student_practice_attempts
    where p_since is null or created_at >= p_since
  ),
  user_change as (
    select user_id,
      avg((correct::int)::numeric) filter (where rn_first <= 5) as first5,
      avg((correct::int)::numeric) filter (where rn_last <= 5) as last5
    from ranked
    where total_attempts >= 10
    group by user_id
  ),
  improvement_summary as (
    select count(*)::bigint as measurable_users,
      count(*) filter (where last5 > first5)::bigint as improved_users,
      coalesce(round(avg((last5 - first5) * 100),1),0) as avg_change_pp
    from user_change
  ),
  breakdown as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'exam_id', exam_id,
      'answered', answered,
      'correct', correct,
      'accuracy_pct', case when answered > 0 then round(correct * 100.0 / answered,1) else 0 end
    ) order by answered desc), '[]'::jsonb) as items
    from (
      select exam_id, count(*)::bigint as answered,
        count(*) filter (where correct is true)::bigint as correct
      from question_events
      group by exam_id
    ) x
  )
  select jsonb_build_object(
    'questions_answered', qs.answered,
    'questions_correct', qs.correct,
    'accuracy_pct', case when qs.answered > 0 then round(qs.correct * 100.0 / qs.answered,1) else 0 end,
    'students_practicing', qs.users,
    'ai_interactions', ais.interactions,
    'students_using_ai', ais.users,
    'ai_feedback_total', afs.feedback_total,
    'ai_helpful_feedback', afs.helpful,
    'ai_helpful_pct', case when afs.feedback_total > 0 then round(afs.helpful * 100.0 / afs.feedback_total,1) else 0 end,
    'plan_weeks_started', ps.plan_weeks_started,
    'plan_sessions_completed', ps.sessions_completed,
    'students_using_plans', ps.users,
    'mock_exams_completed', ms.completed,
    'tracked_study_minutes', round(ts.seconds / 60.0),
    'measurable_improvement_users', ims.measurable_users,
    'improved_users', ims.improved_users,
    'improved_users_pct', case when ims.measurable_users > 0 then round(ims.improved_users * 100.0 / ims.measurable_users,1) else 0 end,
    'avg_improvement_pp', ims.avg_change_pp,
    'questions_per_practicing_student', case when qs.users > 0 then round(qs.answered::numeric / qs.users,1) else 0 end,
    'breakdown', b.items
  ) into result
  from question_summary qs
  cross join ai_summary ais
  cross join ai_feedback_summary afs
  cross join plan_summary ps
  cross join mock_summary ms
  cross join tracked_seconds ts
  cross join improvement_summary ims
  cross join breakdown b;

  return result;
end;
$$;

revoke all on function public.get_admin_impact_stats(timestamptz) from public;
revoke all on function public.get_admin_impact_stats(timestamptz) from anon;
grant execute on function public.get_admin_impact_stats(timestamptz) to authenticated;
