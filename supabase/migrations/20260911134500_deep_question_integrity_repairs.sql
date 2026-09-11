-- Deep audit of official/practice question integrity.
-- Sources: official FUVEST and CMMG definitive answer keys, plus verified ENEM item repairs.

-- 1) FUVEST definitive 1st-phase answer keys (V/V1).
with keys(year,answers) as (values
  (2024,'CCECCCCBDBECBEEAADBCAEEBECDABBBEAABCCEDABDEEBEEDCACCBDCDCDDEAACADAEBCDBACBCDDCBCDBDEDBEADD'),
  (2025,'EBBCACCEDADDBADCCEBEBEDCBEEDCBBEBEEECADCCECCEDCDADBDAACEAADDCDEBCDAABACAADADEBDEDDDBBBAEEB'),
  (2026,'EB*AEEDCCDEDCEBEDECABDDCCACECBBABEBEACBBDAACECDBAEAAEDBADACDCDBCDBADBABEEDCBDEBEECABABCDCC')
), expanded as (
  select year,q,substr(answers,q,1) ans from keys cross join lateral generate_series(1,90) q
), target as (
  select m.item_id,m.booklet_id,e.ans
  from expanded e
  join public.official_exam_editions ed on ed.series_id='fuvest' and ed.year=e.year
  join public.official_exam_booklets b on b.edition_id=ed.id and b.is_official=true
  join public.official_exam_item_booklet_map m on m.booklet_id=b.id and m.question_number=e.q
  where (e.year=2024 and b.booklet_code='ACERVO') or (e.year in (2025,2026) and b.booklet_code='V1')
)
update public.official_exam_item_booklet_map m
set correct_option=case when t.ans='*' then null else t.ans end,
    answer_status=case when t.ans='*' then 'annulled' else 'verified' end
from target t
where m.item_id=t.item_id and m.booklet_id=t.booklet_id;

update public.official_exam_booklets b
set answer_key_url='https://www.fuvest.br/wp-content/uploads/fuvest2024_gabarito_primeira_fase_retificado_2023-11-24.pdf'
from public.official_exam_editions e
where b.edition_id=e.id and e.series_id='fuvest' and e.year=2024 and b.booklet_code='ACERVO';

-- 2) CMMG definitive answer keys. Asterisks are officially annulled items.
with keys(answer_key_url,answers) as (values
  ('https://vestibular.cmmg.edu.br/wp-content/uploads/2023/06/GABARITO_DEFINITIVO_VESTIBULAR_MEDICINA_2021_2.pdf','B*BDACBCABDABCACBABABDABCDADBADCABDADBDCBDCBCDACDBCDBCA'),
  ('https://vestibular.cmmg.edu.br/wp-content/uploads/2023/06/GABARITO-DEFINITIVO-VESTIBULAR-MEDICINA-2022.1.pdf','BCDCBCACDBDABDBCDBADADBACBCADBCADCBCADABCACABCADADBDAD*'),
  ('https://vestibular.cmmg.edu.br/wp-content/uploads/2023/08/125.111-Gabarito-Definitivo-Medicina-1.2023.pdf','BCDACBACABBCBAAACBDCABBBDCDABDAAADD*CCBABDCCAADBB*ABCDA'),
  ('https://vestibular.cmmg.edu.br/wp-content/uploads/2023/08/125.111-Gabarito-Definitivo-Medicina-2.2023.pdf','CABACCBCACCADBCD*ACBABCDBCCDCCBCBCCBCAC*DDBCBBCCACBADBDBDBDC'),
  ('https://vestibular.cmmg.edu.br/wp-content/uploads/2023/11/GABARITO-DEFINITIVO-VESTIBULAR-MEDICINA-2024-1o-SEMESTRE.pdf','ABCCDABADDBCAADCBBABDB*DCBDDCABCCBABDAACAABAA*DBDBCBACCBACBD'),
  ('https://vestibular.cmmg.edu.br/wp-content/uploads/2024/05/GABARITO-DEFINITIVO-VESTIBULAR-MEDICINA-2024-2o-SEMESTRE.pdf','DCACDACBCABABABABCDCABCDCADADCBABDABA*DACBDADBACABADA*DCBBBC'),
  ('https://vestibular.cmmg.edu.br/wp-content/uploads/2024/11/GABARITO-DEFINITIVO-MEDICINA.pdf','ADBDCBABDCACABDBDCDBDCADDACDACADBACDBCCDBCBAC*CDBCCBACD**BAC'),
  ('https://vestibular.cmmg.edu.br/wp-content/uploads/2025/06/GABARITO-DEFINITIVO-VESTIBULAR-MEDICINA-2025-2o-SEMESTRE.pdf','DACBAD*DBDABACDADCDCBCBCCDADCDCBABACABBDBCDCADADADBABC*CACDC'),
  ('https://vestibular.cmmg.edu.br/wp-content/uploads/2026/07/GABARITO-DEFINITIVO-VESTIBULAR-MEDICINA-2026-1o-SEMESTRE.pdf','ADCAAAABADCBACADADBACDBDAD*DBCDCDC*CBCABABDABCBADCBCACBCBABA'),
  ('https://vestibular.cmmg.edu.br/wp-content/uploads/2026/07/GABARITO-DEFINITIVO-VESTIBULAR-MEDICINA-2026-2o-SEMESTRE.pdf','CBDACADCBDADCDCDCDCDBDCBDBCDACDCACDADABCBCBDACACDBCDADABADCB')
), expanded as (
  select answer_key_url,q,substr(answers,q,1) ans
  from keys cross join lateral generate_series(1,length(answers)) q
), target as (
  select m.item_id,m.booklet_id,e.ans
  from expanded e
  join public.official_exam_booklets b on b.answer_key_url=e.answer_key_url and b.is_official=true
  join public.official_exam_item_booklet_map m on m.booklet_id=b.id and m.question_number=e.q
  join public.official_exam_items i on i.id=m.item_id and i.series_id='cmmg'
)
update public.official_exam_item_booklet_map m
set correct_option=case when t.ans='*' then null else t.ans end,
    answer_status=case when t.ans='*' then 'annulled' else 'verified' end
from target t
where m.item_id=t.item_id and m.booklet_id=t.booklet_id;

-- 3) Recover FUVEST option E when PDF extraction appended it to option D.
update public.official_exam_items
set option_e=trim(split_part(option_d,'(E)',2)),
    option_d=trim(split_part(option_d,'(E)',1))
where series_id='fuvest' and option_e is null and option_d like '%(E)%';

-- 4) Verified ENEM repairs that had lost math symbols or duplicated distractors.
update public.official_exam_items i set
  option_a='mL · s · cm²', option_b='mL/s · cm²', option_c='mL/(cm² · s)',
  option_d='(cm² · s)/mL', option_e='cm²/(mL · s)'
from public.official_vestibular_question_bank v
where v.question_id=i.id::text and v.series_id='enem' and v.year=2024 and v.question_number=158;

update public.official_exam_items i set
  option_a='12,50', option_b='20,00', option_c='24,00', option_d='30,00', option_e='37,50'
from public.official_vestibular_question_bank v
where v.question_id=i.id::text and v.series_id='enem' and v.year=2024 and v.question_number=160;

update public.official_exam_items i set
  prompt_text='Em uma empresa é comercializado um produto em embalagens em formato de cilindro circular reto, com raio medindo 3 cm, e altura medindo 15 cm. Essa empresa planeja comercializar o mesmo produto em embalagens em formato de cubo, com capacidade igual a 80% da capacidade da embalagem cilíndrica utilizada atualmente. Use 3 como valor aproximado para π. A medida da aresta da nova embalagem, em centímetro, deve ser',
  option_a='6', option_b='18', option_c='6√6', option_d='6∛6', option_e='3∛12'
from public.official_vestibular_question_bank v
where v.question_id=i.id::text and v.series_id='enem' and v.year=2024 and v.question_number=180;

update public.official_exam_items i set
  option_a='A, E, O e S.', option_b='D, E, F e G.', option_c='D, H, R e V.', option_d='R, L, B e X.', option_e='X, B, L e P.'
from public.official_vestibular_question_bank v
where v.question_id=i.id::text and v.series_id='enem' and v.year=2021 and v.question_number=147;

update public.official_exam_items i set
  option_a='Metano.', option_b='Metanol.', option_c='Éter metílico.', option_d='Ácido etanoico.', option_e='Anidrido etanoico.'
from public.official_vestibular_question_bank v
where v.question_id=i.id::text and v.series_id='enem' and v.year=2019 and v.question_number=124;

-- 5) Remove duplicated distractors found in active seeded practice questions.
update public.exam_practice_questions set option_d=case id
  when 1351 then '1453' when 1356 then '1348' when 890 then '1453' when 895 then '1348'
  when 897 then '1838' when 898 then '1768' when 911 then '1520' when 923 then '1170'
  else option_d end
where id in (1351,1356,890,895,897,898,911,923);

-- 6) Production quality gate: only complete, gradable and structurally coherent official items are exposed.
create or replace view public.official_vestibular_question_bank_v2 as
select
  v.question_id,v.series_id,v.vestibular,v.institution,v.year,v.question_number,
  v.area,v.subject,v.skill_name,v.difficulty,v.prompt_text,
  v.option_a,v.option_b,v.option_c,v.option_d,v.option_e,
  v.correct_option,v.answer_status,v.foreign_language,v.day,v.booklet_code,v.color,
  v.source_pdf_url,v.answer_key_url,v.source_url,v.source_kind,
  i.image_url,i.image_alt,i.source_page
from public.official_vestibular_question_bank v
join public.official_exam_items i on i.id::text=v.question_id
where length(trim(coalesce(v.prompt_text,'')))>=20
  and v.correct_option ~ '^[A-E]$'
  and length(v.prompt_text)<8000
  and v.prompt_text !~* 'Ao final da prova, é obrigatória|Declaro que li e estou ciente|CADERNO DE QUEST'
  and concat_ws(' ',v.prompt_text,v.option_a,v.option_b,v.option_c,v.option_d,v.option_e) !~ '[\x00-\x08\x0B\x0C\x0E-\x1F]'
  and (
    (v.series_id='cmmg' and cardinality(array_remove(array[v.option_a,v.option_b,v.option_c,v.option_d,v.option_e],null))=4)
    or (v.series_id in ('enem','fuvest') and cardinality(array_remove(array[v.option_a,v.option_b,v.option_c,v.option_d,v.option_e],null))=5)
  )
  and (
    v.series_id<>'cmmg'
    or (
      concat_ws(' ',v.prompt_text,v.option_a,v.option_b,v.option_c,v.option_d,v.option_e) !~ '~'
      and concat_ws(' ',v.prompt_text,v.option_a,v.option_b,v.option_c,v.option_d,v.option_e) !~ '[[:lower:]áéíóúçãõ]{2,}[IKWFXJ]\M'
      and concat_ws(' ',v.prompt_text,v.option_a,v.option_b,v.option_c,v.option_d,v.option_e) !~* '\m(pbjbpqob|xK{2,}z|Eaispon[ií]vel|fnicialmente|ganeiro|maulo|kunca|jartin|oKoK)\M'
      and (
        trim(v.prompt_text) !~ '^0*[0-9]{1,3}[. )-]'
        or ((regexp_match(trim(v.prompt_text),'^0*([0-9]{1,3})[. )-]'))[1])::int=v.question_number
      )
    )
  );
