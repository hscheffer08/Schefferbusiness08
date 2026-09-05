-- Keep the question bank honest about provenance.
-- `official` is reserved for exact transcriptions of the published exam item.
-- `official_adapted` is for rewrites/adaptations that preserve the source identity.
-- `authorial` is for Conectae-created practice questions.

alter table public.exam_practice_questions
  add column if not exists source_kind text default 'authorial',
  add column if not exists source_exam_year integer,
  add column if not exists source_question_number integer,
  add column if not exists source_exam_label text,
  add column if not exists source_caderno text,
  add column if not exists source_exam_url text,
  add column if not exists source_answer_url text,
  add column if not exists source_verified_at timestamptz;

update public.exam_practice_questions
set source_kind = 'authorial'
where source_kind is null;

alter table public.exam_practice_questions
  alter column source_kind set default 'authorial';

-- Recreate the validation constraint idempotently so environments cannot accept
-- ambiguous labels such as `real`, `original`, or `verified` without semantics.
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conrelid = 'public.exam_practice_questions'::regclass
      and conname = 'exam_practice_questions_source_kind_check'
  ) then
    alter table public.exam_practice_questions
      drop constraint exam_practice_questions_source_kind_check;
  end if;

  alter table public.exam_practice_questions
    add constraint exam_practice_questions_source_kind_check
    check (source_kind in ('official', 'official_adapted', 'authorial'));
end
$$;

-- The same official source item must not enter the bank twice, even if a second
-- migration attempts to insert it later. Adapted and exact versions share the
-- same source identity on purpose.
create unique index if not exists exam_practice_questions_official_identity_idx
  on public.exam_practice_questions (exam_id, source_exam_label, source_question_number)
  where source_kind in ('official', 'official_adapted')
    and source_exam_label is not null
    and source_question_number is not null;

-- Make the source visible in the current correction UI without changing the
-- official prompt or alternatives. This keeps exact transcriptions exact.
update public.exam_practice_questions
set explanation = regexp_replace(coalesce(explanation, ''), E'\n\nFonte para conferência:.*$', '', 'n')
  || E'\n\nFonte para conferência: '
  || source_basis
  || case when source_exam_url is not null then E'\nProva: ' || source_exam_url else '' end
  || case when source_answer_url is not null then E'\nGabarito: ' || source_answer_url else '' end
where source_kind in ('official', 'official_adapted')
  and source_exam_year is not null
  and source_question_number is not null;
