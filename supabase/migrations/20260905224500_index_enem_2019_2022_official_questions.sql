-- Index official ENEM 2019-2022 by year and question number without republishing the prompt.
-- The official INEP archive remains the source of truth for the full statement and answer key.

with years(year) as (values (2019),(2020),(2021),(2022)), editions as (
  select e.id,e.year from public.official_exam_editions e join years y on y.year=e.year
  where e.series_id='enem' and e.application='regular'
)
insert into public.official_exam_booklets(edition_id,day,booklet_code,color,format,language_variant,question_start,question_end,source_pdf_url,answer_key_url,source_item_url,is_official)
select id,1,'ARQUIVO','Arquivo oficial','impresso','ingles',1,90,
 'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos',
 'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos',
 'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos',true
from editions e where not exists(select 1 from public.official_exam_booklets b where b.edition_id=e.id and b.day=1 and b.booklet_code='ARQUIVO');

with years(year) as (values (2019),(2020),(2021),(2022)), editions as (
  select e.id,e.year from public.official_exam_editions e join years y on y.year=e.year
  where e.series_id='enem' and e.application='regular'
)
insert into public.official_exam_booklets(edition_id,day,booklet_code,color,format,language_variant,question_start,question_end,source_pdf_url,answer_key_url,source_item_url,is_official)
select id,2,'ARQUIVO','Arquivo oficial','impresso',null,91,180,
 'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos',
 'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos',
 'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos',true
from editions e where not exists(select 1 from public.official_exam_booklets b where b.edition_id=e.id and b.day=2 and b.booklet_code='ARQUIVO');

with years(year) as (values (2019),(2020),(2021),(2022)), grid as (select y.year,gs from years y cross join generate_series(1,180) gs)
insert into public.official_exam_items(series_id,year,canonical_item_code,area,subject,skill_code,skill_name,difficulty,prompt_text,option_a,option_b,option_c,option_d,option_e,explanation,image_url,image_alt,source_page,source_url)
select 'enem',year,'ENEM-'||year||'-Q'||lpad(gs::text,3,'0'),
 case when gs between 1 and 45 then 'Linguagens' when gs between 46 and 90 then 'Humanas' when gs between 91 and 135 then 'Natureza' else 'Matemática' end,
 case when gs between 1 and 45 then 'Linguagens' when gs between 46 and 90 then 'Humanas' when gs between 91 and 135 then 'Natureza' else 'Matemática' end,
 null,null,null,null,null,null,null,null,null,'Questão oficial ENEM indexada por edição e número. Consulte o arquivo oficial do INEP para o enunciado integral e o gabarito.',null,null,null,
 'https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos'
from grid g where not exists(select 1 from public.official_exam_items i where i.series_id='enem' and i.year=g.year and i.canonical_item_code='ENEM-'||g.year||'-Q'||lpad(g.gs::text,3,'0'));

with years(year) as (values (2019),(2020),(2021),(2022))
insert into public.official_exam_item_booklet_map(item_id,booklet_id,question_number,correct_option,answer_status,foreign_language)
select i.id,b.id,substring(i.canonical_item_code from 'Q([0-9]+)$')::int,null,'official_source_linked',case when substring(i.canonical_item_code from 'Q([0-9]+)$')::int between 1 and 5 then 'ingles' else null end
from public.official_exam_items i join years y on y.year=i.year
join public.official_exam_editions e on e.series_id='enem' and e.year=i.year and e.application='regular'
join public.official_exam_booklets b on b.edition_id=e.id and b.booklet_code='ARQUIVO' and b.day=case when substring(i.canonical_item_code from 'Q([0-9]+)$')::int<=90 then 1 else 2 end
where i.series_id='enem' and not exists(select 1 from public.official_exam_item_booklet_map m where m.item_id=i.id and m.booklet_id=b.id);
