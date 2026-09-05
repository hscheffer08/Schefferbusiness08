-- Canonical official vestibular bank.
-- 2023 ENEM entries intentionally store verified provenance/index metadata only.
-- Full prompt/alternatives stay null until individually transcribed and checked.

insert into public.official_exam_booklets (
  edition_id, day, booklet_code, color, format, language_variant,
  question_start, question_end, source_pdf_url, answer_key_url, source_item_url, is_official
)
select e.id, 1, '1', 'Azul', 'impresso', 'ingles', 1, 90,
       'https://download.inep.gov.br/enem/provas_e_gabaritos/2023_PV_impresso_D1_CD1.pdf',
       'https://download.inep.gov.br/enem/provas_e_gabaritos/2023_GB_impresso_D1_CD1.pdf',
       'https://download.inep.gov.br/enem/provas_e_gabaritos/', true
from public.official_exam_editions e
where e.series_id='enem' and e.year=2023 and e.application='regular'
  and not exists (
    select 1 from public.official_exam_booklets b
    where b.edition_id=e.id and b.day=1 and b.booklet_code='1'
  );

insert into public.official_exam_booklets (
  edition_id, day, booklet_code, color, format, language_variant,
  question_start, question_end, source_pdf_url, answer_key_url, source_item_url, is_official
)
select e.id, 2, '5', 'Amarelo', 'impresso', null, 91, 180,
       'https://download.inep.gov.br/enem/provas_e_gabaritos/2023_PV_impresso_D2_CD5.pdf',
       'https://download.inep.gov.br/enem/provas_e_gabaritos/2023_GB_impresso_D2_CD5.pdf',
       'https://download.inep.gov.br/enem/provas_e_gabaritos/', true
from public.official_exam_editions e
where e.series_id='enem' and e.year=2023 and e.application='regular'
  and not exists (
    select 1 from public.official_exam_booklets b
    where b.edition_id=e.id and b.day=2 and b.booklet_code='5'
  );

insert into public.official_exam_items (
  series_id, year, canonical_item_code, area, subject, skill_code, skill_name,
  difficulty, prompt_text, option_a, option_b, option_c, option_d, option_e,
  explanation, image_url, image_alt, source_page, source_url
)
select
  'enem', 2023,
  'ENEM-2023-Q' || lpad(gs::text,3,'0'),
  case when gs between 1 and 45 then 'Linguagens'
       when gs between 46 and 90 then 'Humanas'
       when gs between 91 and 135 then 'Natureza'
       else 'Matemática' end,
  case when gs between 1 and 45 then 'Linguagens'
       when gs between 46 and 90 then 'Humanas'
       when gs between 91 and 135 then 'Natureza'
       else 'Matemática' end,
  null, null, null,
  null, null, null, null, null, null,
  'Questão oficial indexada. Abra a prova oficial para consultar o enunciado integral e o gabarito oficial.',
  null, null, null,
  case when gs <= 90
       then 'https://download.inep.gov.br/enem/provas_e_gabaritos/2023_PV_impresso_D1_CD1.pdf'
       else 'https://download.inep.gov.br/enem/provas_e_gabaritos/2023_PV_impresso_D2_CD5.pdf' end
from generate_series(1,180) gs
where not exists (
  select 1 from public.official_exam_items i
  where i.series_id='enem' and i.year=2023
    and i.canonical_item_code='ENEM-2023-Q' || lpad(gs::text,3,'0')
);

insert into public.official_exam_item_booklet_map (
  item_id, booklet_id, question_number, correct_option, answer_status, foreign_language
)
select i.id, b.id,
       substring(i.canonical_item_code from 'Q([0-9]+)$')::int,
       null,
       'official_source_linked',
       case when substring(i.canonical_item_code from 'Q([0-9]+)$')::int between 1 and 5 then 'ingles' else null end
from public.official_exam_items i
join public.official_exam_editions e on e.series_id='enem' and e.year=2023 and e.application='regular'
join public.official_exam_booklets b on b.edition_id=e.id
  and b.day=case when substring(i.canonical_item_code from 'Q([0-9]+)$')::int <= 90 then 1 else 2 end
  and b.booklet_code=case when substring(i.canonical_item_code from 'Q([0-9]+)$')::int <= 90 then '1' else '5' end
where i.series_id='enem' and i.year=2023
  and not exists (
    select 1 from public.official_exam_item_booklet_map m
    where m.item_id=i.id and m.booklet_id=b.id
  );

create or replace view public.official_vestibular_question_bank as
with enem_ranked as (
  select
    i.id as question_id,
    s.id as series_id,
    s.name as vestibular,
    s.institution,
    i.year,
    m.question_number,
    i.area,
    i.subject,
    i.skill_name,
    i.difficulty,
    i.prompt_text,
    i.option_a,i.option_b,i.option_c,i.option_d,i.option_e,
    m.correct_option,
    m.answer_status,
    m.foreign_language,
    b.day,
    b.booklet_code,
    b.color,
    b.source_pdf_url,
    b.answer_key_url,
    coalesce(i.source_url,b.source_pdf_url) as source_url,
    'official'::text as source_kind,
    row_number() over (
      partition by i.year,m.question_number,coalesce(m.foreign_language,'')
      order by case when b.day=1 and b.booklet_code='1' then 0
                    when b.day=2 and b.booklet_code='5' then 0 else 1 end,
               b.booklet_code
    ) as rn
  from public.official_exam_items i
  join public.official_exam_series s on s.id=i.series_id
  join public.official_exam_item_booklet_map m on m.item_id=i.id
  join public.official_exam_booklets b on b.id=m.booklet_id and b.is_official=true
  join public.official_exam_editions e on e.id=b.edition_id and e.application='regular'
  where i.series_id='enem'
    and (m.foreign_language is null or m.foreign_language='ingles')
), cmmg_exact as (
  select
    ('practice-'||q.id)::text as question_id_text,
    'cmmg'::text as series_id,
    'Vestibular Ciências Médicas-MG'::text as vestibular,
    'Faculdade Ciências Médicas de Minas Gerais'::text as institution,
    q.source_exam_year as year,
    q.source_question_number as question_number,
    q.area,
    q.skill_name as subject,
    q.skill_name,
    q.difficulty,
    q.prompt as prompt_text,
    q.option_a,q.option_b,q.option_c,q.option_d,q.option_e,
    q.correct_option,
    'verified'::text as answer_status,
    null::text as foreign_language,
    null::integer as day,
    q.source_caderno as booklet_code,
    null::text as color,
    q.source_exam_url as source_pdf_url,
    q.source_answer_url as answer_key_url,
    q.source_exam_url as source_url,
    q.source_kind
  from public.exam_practice_questions q
  where q.source_kind='official'
)
select
  question_id::text, series_id, vestibular, institution, year, question_number,
  area, subject, skill_name, difficulty, prompt_text,
  option_a,option_b,option_c,option_d,option_e,
  correct_option,answer_status,foreign_language,day,booklet_code,color,
  source_pdf_url,answer_key_url,source_url,source_kind
from enem_ranked where rn=1
union all
select * from cmmg_exact;

grant select on public.official_vestibular_question_bank to anon, authenticated;
