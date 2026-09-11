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
where
  length(trim(coalesce(v.prompt_text,''))) between 20 and 6000
  and (
    (case when nullif(trim(v.option_a),'') is not null then 1 else 0 end) +
    (case when nullif(trim(v.option_b),'') is not null then 1 else 0 end) +
    (case when nullif(trim(v.option_c),'') is not null then 1 else 0 end) +
    (case when nullif(trim(v.option_d),'') is not null then 1 else 0 end) +
    (case when nullif(trim(v.option_e),'') is not null then 1 else 0 end)
  ) >= 4
  and (v.correct_option ~ '^[A-E]$' or v.answer_status='annulled')
  and v.prompt_text !~* 'Ao final da prova, é obrigatória|Declaro que li e estou ciente|CADERNO DE QUEST'
  and (v.prompt_text||' '||coalesce(v.option_a,'')||' '||coalesce(v.option_b,'')||' '||coalesce(v.option_c,'')||' '||coalesce(v.option_d,'')||' '||coalesce(v.option_e,'')) !~ E'[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F]'
  and not (v.series_id='cmmg' and (v.prompt_text||' '||coalesce(v.option_a,'')||' '||coalesce(v.option_b,'')||' '||coalesce(v.option_c,'')||' '||coalesce(v.option_d,'')||' '||coalesce(v.option_e,'')) like '%~%')
  and not (
    (nullif(trim(v.option_a),'') is not null and nullif(trim(v.option_b),'') is not null and trim(v.option_a)=trim(v.option_b)) or
    (nullif(trim(v.option_a),'') is not null and nullif(trim(v.option_c),'') is not null and trim(v.option_a)=trim(v.option_c)) or
    (nullif(trim(v.option_a),'') is not null and nullif(trim(v.option_d),'') is not null and trim(v.option_a)=trim(v.option_d)) or
    (nullif(trim(v.option_a),'') is not null and nullif(trim(v.option_e),'') is not null and trim(v.option_a)=trim(v.option_e)) or
    (nullif(trim(v.option_b),'') is not null and nullif(trim(v.option_c),'') is not null and trim(v.option_b)=trim(v.option_c)) or
    (nullif(trim(v.option_b),'') is not null and nullif(trim(v.option_d),'') is not null and trim(v.option_b)=trim(v.option_d)) or
    (nullif(trim(v.option_b),'') is not null and nullif(trim(v.option_e),'') is not null and trim(v.option_b)=trim(v.option_e)) or
    (nullif(trim(v.option_c),'') is not null and nullif(trim(v.option_d),'') is not null and trim(v.option_c)=trim(v.option_d)) or
    (nullif(trim(v.option_c),'') is not null and nullif(trim(v.option_e),'') is not null and trim(v.option_c)=trim(v.option_e)) or
    (nullif(trim(v.option_d),'') is not null and nullif(trim(v.option_e),'') is not null and trim(v.option_d)=trim(v.option_e))
  )
  and (
    not ((v.prompt_text||' '||coalesce(v.option_a,'')||' '||coalesce(v.option_b,'')||' '||coalesce(v.option_c,'')||' '||coalesce(v.option_d,'')||' '||coalesce(v.option_e,'')) ~* '(figura|imagem|gráfico|grafico|tabela|mapa|charge|tirinha|heredograma|infográfico|infografico|esquema|diagrama|ilustração|ilustracao)')
    or i.image_url is not null
    or (v.series_id <> 'enem' and i.source_page is not null)
  );
