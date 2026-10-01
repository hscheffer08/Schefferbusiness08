-- Expand the approval-course university catalog, with an emphasis on Medicine.
-- Institutional rows without a dedicated verified exam model intentionally fall back
-- to the clearly labelled generic ENEM study plan in src/lib/exam-models.ts.

insert into public.area_universities
  (area_id, university_name, course_label, country_code, institution_type, campus, source_url, official_course_url, evidence_status, admissions_summary, data_confidence, last_reviewed)
values
  ('saude','UFBA','Medicina','BR','public','Salvador - BA','https://www.ufba.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.85,current_date),
  ('saude','UFPE','Medicina','BR','public','Recife - PE','https://www.ufpe.br/','https://www.ufpe.br/medicina-bacharelado','course_source_verified','Processo seletivo conforme edital vigente da instituição.',0.90,current_date),
  ('saude','UFC','Medicina','BR','public','Fortaleza - CE','https://www.ufc.br/','https://www.medicina.ufc.br/sobre-o-curso-medicina/','course_source_verified','Processo seletivo conforme edital vigente da instituição.',0.95,current_date),
  ('saude','UFRN','Medicina','BR','public','Natal - RN','https://www.ufrn.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.85,current_date),
  ('saude','UFPB','Medicina','BR','public','João Pessoa - PB','https://www.ufpb.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.85,current_date),
  ('saude','UFAL','Medicina','BR','public','Maceió - AL','https://ufal.br/','https://famed.ufal.br/pt-br/graduacao/medicina','course_source_verified','Processo seletivo conforme edital vigente da instituição.',0.95,current_date),
  ('saude','UFS','Medicina','BR','public','Aracaju - SE','https://www.ufs.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.85,current_date),
  ('saude','UFES','Medicina','BR','public','Vitória - ES','https://www.ufes.br/','https://medicina.ufes.br/pt-br/forma-de-ingresso','course_source_verified','Ingresso e regras conforme informações oficiais e edital vigente.',0.95,current_date),
  ('saude','UFJF','Medicina','BR','public','Juiz de Fora - MG','https://www.ufjf.br/','https://www2.ufjf.br/ufjf/ensino/graduacao/medicina/','course_source_verified','Ingresso conforme modalidades e edital vigente da instituição.',0.95,current_date),
  ('saude','UFU','Medicina','BR','public','Uberlândia - MG','https://ufu.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.85,current_date),
  ('saude','UFTM','Medicina','BR','public','Uberaba - MG','https://www.uftm.edu.br/','https://www.uftm.edu.br/medicina','course_source_verified','Processo seletivo conforme edital vigente da instituição.',0.95,current_date),
  ('saude','UFSJ','Medicina','BR','public','Minas Gerais','https://www.ufsj.edu.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.85,current_date),
  ('saude','UFMS','Medicina','BR','public','Campo Grande - MS','https://www.ufms.br/','https://graduacao.ufms.br/cursos/1002','course_source_verified','Processo seletivo conforme edital vigente da instituição.',0.95,current_date),
  ('saude','UFGD','Medicina','BR','public','Dourados - MS','https://www.ufgd.edu.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.85,current_date),
  ('saude','UFMA','Medicina','BR','public','São Luís - MA','https://portalpadrao.ufma.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.85,current_date),
  ('saude','UFPI','Medicina','BR','public','Teresina - PI','https://ufpi.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.85,current_date),
  ('saude','UFPA','Medicina','BR','public','Belém - PA','https://ufpa.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.85,current_date),
  ('saude','UFAM','Medicina','BR','public','Manaus - AM','https://www.ufam.edu.br/','https://fm.ufam.edu.br/graduacao/sobre-o-curso.html','course_source_verified','Processo seletivo conforme edital vigente da instituição.',0.95,current_date),
  ('saude','UNIRIO','Medicina','BR','public','Rio de Janeiro - RJ','https://www.unirio.br/','https://www.unirio.br/conselhossuperiores/prograd/cursos-de-graduacao','course_source_verified','Processo seletivo conforme edital vigente da instituição.',0.95,current_date),
  ('saude','UERJ','Medicina','BR','public','Rio de Janeiro - RJ','https://www.uerj.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.85,current_date),
  ('saude','Faculdade de Medicina de São José do Rio Preto (FAMERP)','Medicina','BR','public','São José do Rio Preto - SP','https://www.famerp.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.90,current_date),
  ('saude','Faculdade de Medicina de Marília (FAMEMA)','Medicina','BR','public','Marília - SP','https://www.famema.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.90,current_date),
  ('saude','UEL','Medicina','BR','public','Londrina - PR','https://www.uel.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.90,current_date),
  ('saude','UEM','Medicina','BR','public','Maringá - PR','https://www.uem.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.90,current_date),
  ('saude','UEPG','Medicina','BR','public','Ponta Grossa - PR','https://www.uepg.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.90,current_date),
  ('saude','Faculdade de Ciências Médicas da Santa Casa de São Paulo','Medicina','BR','private','São Paulo - SP','https://fcmsantacasasp.edu.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.90,current_date),
  ('saude','PUC Goiás','Medicina','BR','private','Goiânia - GO','https://www.pucgoias.edu.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.90,current_date),
  ('saude','PUCPR','Medicina','BR','private','Curitiba - PR','https://www.pucpr.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.90,current_date),
  ('saude','Universidade de Fortaleza (UNIFOR)','Medicina','BR','private','Fortaleza - CE','https://unifor.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.90,current_date),
  ('saude','UNICHRISTUS','Medicina','BR','private','Fortaleza - CE','https://www.unichristus.edu.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.90,current_date),
  ('saude','UNIFENAS','Medicina','BR','private','Alfenas - MG','https://www.unifenas.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.90,current_date),
  ('saude','SUPREMA','Medicina','BR','private','Juiz de Fora - MG','https://www.suprema.edu.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.90,current_date),
  ('saude','FASEH','Medicina','BR','private','Vespasiano - MG','https://www.faseh.edu.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.90,current_date),
  ('saude','Universidade Positivo','Medicina','BR','private','Curitiba - PR','https://www.up.edu.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.90,current_date),
  ('saude','Universidade de Caxias do Sul (UCS)','Medicina','BR','private','Caxias do Sul - RS','https://www.ucs.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.90,current_date),
  ('saude','UNIVALI','Medicina','BR','private','Itajaí - SC','https://www.univali.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.90,current_date),
  ('saude','Escola Bahiana de Medicina e Saúde Pública','Medicina','BR','private','Salvador - BA','https://www.bahiana.edu.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.90,current_date),
  ('saude','Faculdade Pernambucana de Saúde (FPS)','Medicina','BR','private','Recife - PE','https://fps.edu.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.90,current_date),
  ('saude','Centro Universitário do Estado do Pará (CESUPA)','Medicina','BR','private','Belém - PA','https://www.cesupa.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.90,current_date),
  ('saude','Universidade Tiradentes (UNIT)','Medicina','BR','private','Aracaju - SE','https://www.unit.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.90,current_date),
  ('saude','FAMINAS','Medicina','BR','private','Minas Gerais','https://www.faminas.edu.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.90,current_date),
  ('saude','Universidade de Vassouras','Medicina','BR','private','Vassouras - RJ','https://universidadedevassouras.edu.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.90,current_date),
  ('saude','UniEVANGÉLICA','Medicina','BR','private','Anápolis - GO','https://www4.unievangelica.edu.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.90,current_date),
  ('saude','Centro Universitário de Patos de Minas (UNIPAM)','Medicina','BR','private','Patos de Minas - MG','https://unipam.edu.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.90,current_date),
  ('saude','UNAERP','Medicina','BR','private','Ribeirão Preto - SP','https://www.unaerp.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.90,current_date),
  ('saude','Universidade Católica de Brasília (UCB)','Medicina','BR','private','Brasília - DF','https://ucb.catolica.edu.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.90,current_date),
  ('saude','Centro Universitário de Brasília (CEUB)','Medicina','BR','private','Brasília - DF','https://www.uniceub.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.90,current_date),
  ('saude','Universidade São Francisco (USF)','Medicina','BR','private','Bragança Paulista - SP','https://www.usf.edu.br/',null,'institution_source_verified_course_pending','Processo seletivo conforme edital vigente da instituição.',0.90,current_date)
on conflict (area_id, university_name) do update
set course_label = excluded.course_label,
    country_code = excluded.country_code,
    institution_type = excluded.institution_type,
    campus = excluded.campus,
    source_url = excluded.source_url,
    official_course_url = coalesce(excluded.official_course_url, public.area_universities.official_course_url),
    evidence_status = case
      when excluded.evidence_status='course_source_verified' then excluded.evidence_status
      else public.area_universities.evidence_status
    end,
    admissions_summary = excluded.admissions_summary,
    data_confidence = greatest(coalesce(public.area_universities.data_confidence,0), excluded.data_confidence),
    last_reviewed = current_date;
