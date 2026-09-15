-- Fix 1: get_admin_impact_stats had search_path = '' (empty string) which allows
-- temp object shadowing. Set to 'public, pg_temp' for safe resolution.
CREATE OR REPLACE FUNCTION public.get_admin_impact_stats(p_since timestamptz default null)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', pg_temp
AS $$
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

REVOKE ALL ON FUNCTION public.get_admin_impact_stats(timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_admin_impact_stats(timestamptz) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_admin_impact_stats(timestamptz) TO authenticated;

-- Fix 2: get_admin_sessions and get_admin_session_answers had search_path = 'public'
-- but missing pg_temp, allowing temp object shadowing. Add pg_temp.
CREATE OR REPLACE FUNCTION public.get_admin_sessions()
RETURNS TABLE(
  session_id uuid,
  user_id uuid,
  email text,
  display_name text,
  completed_at timestamp with time zone,
  consent_given boolean,
  answer_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', pg_temp
AS $function$
BEGIN
  IF ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) <> 'admin' THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  RETURN QUERY
  SELECT
    s.id,
    s.user_id,
    u.email::text,
    p.display_name,
    s.completed_at,
    s.consent_given,
    (SELECT count(*) FROM student_answers a WHERE a.session_id = s.id)
  FROM student_sessions s
  LEFT JOIN auth.users u ON u.id = s.user_id
  LEFT JOIN user_profiles p ON p.id = s.user_id
  ORDER BY s.completed_at DESC NULLS LAST;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_admin_session_answers(p_session_id uuid)
RETURNS TABLE (
  question_id text,
  question_text text,
  answer_value text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', pg_temp
AS $$
BEGIN
  IF ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text) <> 'admin' THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  RETURN QUERY
  SELECT
    a.question_id,
    q.question_text,
    a.answer_value,
    a.created_at
  FROM student_answers a
  LEFT JOIN questions q ON q.question_id = a.question_id
  WHERE a.session_id = p_session_id
  ORDER BY a.question_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_admin_sessions() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_admin_session_answers(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_sessions() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_session_answers(uuid) TO authenticated;

-- Fix 3: Block users from updating verification_status on faculty_questionnaire_evidence.
-- Revoke UPDATE on that column from authenticated, grant UPDATE only on the
-- non-verification columns.
REVOKE UPDATE ON public.faculty_questionnaire_evidence FROM authenticated;
GRANT UPDATE (
  category, title, institution, details, occurred_on, file_path, file_name,
  mime_type, file_size, updated_at
) ON public.faculty_questionnaire_evidence TO authenticated;
