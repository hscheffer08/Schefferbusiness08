-- Required client grants remain constrained by existing row policies.
grant select on public.essay_course_modules,public.essay_correctors to authenticated;
grant select,update on public.essay_submissions to authenticated;
revoke insert on public.essay_submissions from authenticated;
grant insert(user_id,week_key,theme,file_path,file_name,file_type) on public.essay_submissions to authenticated;
