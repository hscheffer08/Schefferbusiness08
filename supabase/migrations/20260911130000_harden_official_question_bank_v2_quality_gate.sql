create or replace view public.official_vestibular_question_bank_v2 as
select
  v.question_id,
  v.series_id,
  v.vestibular,
  v.institution,
  v.year,
  v.question_number,
  v.area,
  v.subject,
  v.skill_name,
  v.difficulty,
  v.prompt_text,
  v.option_a,
  v.option_b,
  v.option_c,
  v.option_d,
  v.option_e,
  v.correct_option,
  v.answer_status,
  v.foreign_language,
  v.day,
  v.booklet_code,
  v.color,
  v.source_pdf_url,
  v.answer_key_url,
  v.source_url,
  v.source_kind,
  i.image_url,
  i.image_alt,
  i.source_page
from public.official_vestibular_question_bank v
join public.official_exam_items i on i.id::text = v.question_id
where length(trim(coalesce(v.prompt_text,''))) >= 20
  and (
    (case when nullif(trim(v.option_a),'') is not null then 1 else 0 end) +
    (case when nullif(trim(v.option_b),'') is not null then 1 else 0 end) +
    (case when nullif(trim(v.option_c),'') is not null then 1 else 0 end) +
    (case when nullif(trim(v.option_d),'') is not null then 1 else 0 end) +
    (case when nullif(trim(v.option_e),'') is not null then 1 else 0 end)
  ) >= 2
  and length(v.prompt_text) < 8000
  and v.prompt_text !~* 'Ao final da prova, é obrigatória|Declaro que li e estou ciente|CADERNO DE QUEST';
