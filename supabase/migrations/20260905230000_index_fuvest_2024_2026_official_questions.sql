-- Index FUVEST 2024-2026 first-phase questions by official edition and question number.
-- Full copyrighted statements remain on the official FUVEST archive pages.

with editions(year,url) as (
 values
 (2024,'https://www.fuvest.br/acervo-vestibular-2024/'::text),
 (2025,'https://www.fuvest.br/acervo-vestibular-2025'::text),
 (2026,'https://www.fuvest.br/acervo-vestibular-2026/'::text)
)
insert into public.official_exam_editions(series_id,year,application,application_label,source_url,notes)
select 'fuvest',year,'regular','Vestibular USP '||year,url,'Primeira fase oficial indexada por edição e número; enunciado e gabarito permanecem no acervo FUVEST.'
from editions e
where not exists(select 1 from public.official_exam_editions x where x.series_id='fuvest' and x.year=e.year and x.application='regular');

with editions(year,url) as (
 values
 (2024,'https://www.fuvest.br/acervo-vestibular-2024/'::text),
 (2025,'https://www.fuvest.br/acervo-vestibular-2025'::text),
 (2026,'https://www.fuvest.br/acervo-vestibular-2026/'::text)
)
insert into public.official_exam_booklets(edition_id,day,booklet_code,color,format,language_variant,question_start,question_end,source_pdf_url,answer_key_url,source_item_url,is_official)
select x.id,1,'ACERVO','Versão oficial','impresso',null,1,90,e.url,e.url,e.url,true
from editions e join public.official_exam_editions x on x.series_id='fuvest' and x.year=e.year and x.application='regular'
where not exists(select 1 from public.official_exam_booklets b where b.edition_id=x.id and b.day=1 and b.booklet_code='ACERVO');

with editions(year,url) as (
 values
 (2024,'https://www.fuvest.br/acervo-vestibular-2024/'::text),
 (2025,'https://www.fuvest.br/acervo-vestibular-2025'::text),
 (2026,'https://www.fuvest.br/acervo-vestibular-2026/'::text)
), grid as (select e.year,e.url,gs from editions e cross join generate_series(1,90) gs)
insert into public.official_exam_items(series_id,year,canonical_item_code,area,subject,skill_code,skill_name,difficulty,prompt_text,option_a,option_b,option_c,option_d,option_e,explanation,image_url,image_alt,source_page,source_url)
select 'fuvest',year,'FUVEST-'||year||'-Q'||lpad(gs::text,2,'0'),'Conhecimentos Gerais','1ª fase',null,null,null,null,null,null,null,null,null,
 'Questão oficial FUVEST indexada por edição e número. Consulte o acervo oficial para o enunciado integral e o gabarito.',null,null,null,url
from grid g
where not exists(select 1 from public.official_exam_items i where i.series_id='fuvest' and i.year=g.year and i.canonical_item_code='FUVEST-'||g.year||'-Q'||lpad(g.gs::text,2,'0'));

with years(year) as (values (2024),(2025),(2026))
insert into public.official_exam_item_booklet_map(item_id,booklet_id,question_number,correct_option,answer_status,foreign_language)
select i.id,b.id,substring(i.canonical_item_code from 'Q([0-9]+)$')::int,null,'official_source_linked',null
from public.official_exam_items i join years y on y.year=i.year
join public.official_exam_editions e on e.series_id='fuvest' and e.year=i.year and e.application='regular'
join public.official_exam_booklets b on b.edition_id=e.id and b.booklet_code='ACERVO' and b.day=1
where i.series_id='fuvest' and not exists(select 1 from public.official_exam_item_booklet_map m where m.item_id=i.id and m.booklet_id=b.id);

create or replace view public.official_vestibular_question_bank as
with standard_ranked as (
 select i.id::text as question_id,s.id as series_id,s.name as vestibular,s.institution,i.year,m.question_number,i.area,i.subject,i.skill_name,i.difficulty,
 i.prompt_text,i.option_a,i.option_b,i.option_c,i.option_d,i.option_e,m.correct_option,m.answer_status,m.foreign_language,b.day,b.booklet_code,b.color,b.source_pdf_url,b.answer_key_url,
 coalesce(i.source_url,b.source_pdf_url) as source_url,'official'::text as source_kind,
 row_number() over(partition by i.series_id,i.year,m.question_number,coalesce(m.foreign_language,'') order by
   case when i.series_id='enem' and b.day=1 and b.booklet_code='1' then 0 when i.series_id='enem' and b.day=2 and b.booklet_code='5' then 0 when i.series_id='fuvest' and b.booklet_code='ACERVO' then 0 else 1 end,
   b.booklet_code) as rn
 from public.official_exam_items i
 join public.official_exam_series s on s.id=i.series_id
 join public.official_exam_item_booklet_map m on m.item_id=i.id
 join public.official_exam_booklets b on b.id=m.booklet_id and b.is_official=true
 join public.official_exam_editions e on e.id=b.edition_id and e.application='regular'
 where i.series_id in ('enem','fuvest') and (i.series_id<>'enem' or m.foreign_language is null or m.foreign_language='ingles')
), cmmg_ranked as (
 select i.id::text as question_id,s.id as series_id,s.name as vestibular,s.institution,i.year,m.question_number,i.area,i.subject,
 coalesce(q.skill_name,i.skill_name) as skill_name,coalesce(q.difficulty,i.difficulty) as difficulty,coalesce(q.prompt,i.prompt_text) as prompt_text,
 coalesce(q.option_a,i.option_a) as option_a,coalesce(q.option_b,i.option_b) as option_b,coalesce(q.option_c,i.option_c) as option_c,coalesce(q.option_d,i.option_d) as option_d,coalesce(q.option_e,i.option_e) as option_e,
 coalesce(q.correct_option,m.correct_option) as correct_option,case when q.id is not null then 'verified'::text else m.answer_status end as answer_status,
 null::text as foreign_language,b.day,b.booklet_code,b.color,b.source_pdf_url,b.answer_key_url,coalesce(i.source_url,b.source_pdf_url) as source_url,'official'::text as source_kind
 from public.official_exam_items i
 join public.official_exam_series s on s.id=i.series_id
 join public.official_exam_item_booklet_map m on m.item_id=i.id
 join public.official_exam_booklets b on b.id=m.booklet_id and b.is_official=true
 join public.official_exam_editions e on e.id=b.edition_id
 left join public.exam_practice_questions q on q.exam_id='cmmg' and q.source_kind='official' and q.source_exam_url=b.source_pdf_url and q.source_question_number=m.question_number
 where i.series_id='cmmg'
)
select question_id,series_id,vestibular,institution,year,question_number,area,subject,skill_name,difficulty,prompt_text,option_a,option_b,option_c,option_d,option_e,correct_option,answer_status,foreign_language,day,booklet_code,color,source_pdf_url,answer_key_url,source_url,source_kind
from standard_ranked where rn=1
union all
select question_id,series_id,vestibular,institution,year,question_number,area,subject,skill_name,difficulty,prompt_text,option_a,option_b,option_c,option_d,option_e,correct_option,answer_status,foreign_language,day,booklet_code,color,source_pdf_url,answer_key_url,source_url,source_kind
from cmmg_ranked;

alter view public.official_vestibular_question_bank set (security_invoker=true);
grant select on public.official_vestibular_question_bank to anon, authenticated;
