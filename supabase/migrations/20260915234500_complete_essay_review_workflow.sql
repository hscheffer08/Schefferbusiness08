alter table public.essay_submissions
  add column if not exists scores integer[],
  add column if not exists total_score integer,
  add column if not exists reviewer_comment text,
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewer_id uuid references auth.users(id);

alter table public.essay_submissions drop constraint if exists essay_scores_valid;
alter table public.essay_submissions add constraint essay_scores_valid
  check (scores is null or (cardinality(scores)=5 and scores <@ array[0,40,80,120,160,200]::integer[]));

alter table public.essay_submissions drop constraint if exists essay_total_valid;
alter table public.essay_submissions add constraint essay_total_valid
  check (total_score is null or (total_score between 0 and 1000 and total_score % 40 = 0));
