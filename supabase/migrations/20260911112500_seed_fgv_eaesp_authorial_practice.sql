-- FGV EAESP 2027.1 authorial practice bank for the Course of Approval.
-- These are original Conectaê items aligned to the official exam structure; they are NOT official FGV questions.

insert into public.admission_exam_models (
  exam_id, label, institution, exam_date, format_summary, official_source_url,
  official, scoring_model, stages, priorities, updated_at
)
values (
  'fgv',
  'Vestibular FGV EAESP 2027.1',
  'FGV EAESP',
  '2026-10-18',
  'Administração: 1ª fase objetiva com Matemática, Língua Portuguesa, Inglês e Ciências Humanas; 2ª fase discursiva com Matemática e Redação. Nota final com peso 2 para a 1ª fase e peso 3 para a 2ª fase.',
  'https://vestibular.fgv.br/sites/default/files/2026-07/materiais/edital-unificado_01-2027_4.pdf',
  true,
  '{"phase_1_weight":2,"phase_2_weight":3,"scale":"0-10"}'::jsonb,
  '[{"id":"fase1","label":"1ª fase objetiva","areas":["Matemática","Língua Portuguesa","Inglês","Ciências Humanas"]},{"id":"fase2","label":"2ª fase discursiva","areas":["Matemática discursiva","Redação"]}]'::jsonb,
  '{"Matemática":1,"Língua Portuguesa":1,"Inglês":1,"Ciências Humanas":1,"Matemática discursiva":1.2,"Redação":1.2}'::jsonb,
  now()
)
on conflict (exam_id) do update set
  label = excluded.label,
  institution = excluded.institution,
  exam_date = excluded.exam_date,
  format_summary = excluded.format_summary,
  official_source_url = excluded.official_source_url,
  official = excluded.official,
  scoring_model = excluded.scoring_model,
  stages = excluded.stages,
  priorities = excluded.priorities,
  updated_at = now();

with seed(area, skill_name, difficulty, prompt, option_a, option_b, option_c, option_d, option_e, correct_option, explanation) as (
  values
  ('Matemática','Função afim e margem',2,'Uma empresa vende um produto por R$ 80. O custo variável unitário é R$ 50 e o custo fixo mensal é R$ 18.000. Quantas unidades precisam ser vendidas para que o lucro mensal seja exatamente zero?','400','500','600','700','900','C','A margem de contribuição é 80 - 50 = 30 reais por unidade. No ponto de equilíbrio, 30q = 18.000, então q = 600.'),
  ('Matemática','Porcentagem composta',2,'Uma receita cresce 20% em um ano e, no ano seguinte, cai 10% sobre o valor já reajustado. Em relação ao valor inicial, a variação acumulada é de:','queda de 8%','aumento de 8%','aumento de 10%','aumento de 12%','aumento de 18%','B','O fator acumulado é 1,20 × 0,90 = 1,08. Portanto, o valor final é 8% maior que o inicial.'),
  ('Matemática','Probabilidade condicional',3,'Em um processo seletivo, 60% dos candidatos estudaram em escola pública. Entre eles, 25% falam uma segunda língua. Entre os demais candidatos, 40% falam uma segunda língua. Qual é a probabilidade de um candidato escolhido ao acaso falar uma segunda língua?','25%','31%','34%','40%','65%','B','P = 0,60×0,25 + 0,40×0,40 = 0,15 + 0,16 = 0,31, ou 31%.'),
  ('Matemática','Sistemas lineares',3,'Dois planos de assinatura cobram, respectivamente, A(x)=40+6x e B(x)=70+3x, em reais, para x unidades de uso. A partir de quantas unidades o plano B passa a ser estritamente mais barato que o plano A?','8','9','10','11','12','D','70+3x < 40+6x implica 30 < 3x, logo x > 10. A menor quantidade inteira é 11.'),
  ('Matemática','Otimização quadrática',4,'O lucro diário de uma operação, em milhares de reais, é L(x)=-2x²+40x-72, em que x representa dezenas de unidades vendidas. Para qual valor de x o lucro é máximo?','8','9','10','11','12','C','O máximo de uma parábola côncava ocorre no vértice: x=-b/(2a)=-40/(2·-2)=10.'),
  ('Língua Portuguesa','Tese e evidência',2,'Em um texto argumentativo, qual alternativa apresenta uma relação adequada entre tese e evidência?','A evidência deve apenas repetir a tese com outras palavras.','A tese pode ser sustentada por dados, exemplos ou relações causais pertinentes.','A evidência substitui a necessidade de uma conclusão.','A tese deve ser sempre uma pergunta.','A evidência precisa ser uma opinião do autor.','B','Uma evidência relevante acrescenta suporte verificável ou raciocínio ao argumento; não é mera repetição da tese.'),
  ('Língua Portuguesa','Coesão referencial',2,'Na frase “A empresa revisou sua estratégia. Essa decisão reduziu custos”, a expressão “Essa decisão” funciona principalmente como:','marcador de oposição','referência anafórica ao ato de revisar a estratégia','exemplo de ambiguidade obrigatória','conector temporal','vocativo','B','“Essa decisão” retoma uma informação apresentada na oração anterior, estabelecendo coesão referencial.'),
  ('Língua Portuguesa','Inferência',3,'Leia: “A expansão foi rápida, mas a margem caiu pelo terceiro trimestre seguido.” A conclusão mais bem sustentada é:','crescimento de receita garante crescimento de lucro','a empresa necessariamente está insolvente','crescer em escala não implica, por si só, melhora de rentabilidade','a margem caiu porque a receita diminuiu','a expansão deve ser encerrada imediatamente','C','O contraste mostra que expansão e rentabilidade podem caminhar em direções diferentes; as demais opções extrapolam o enunciado.'),
  ('Língua Portuguesa','Valor semântico do conector',2,'Em “Embora a demanda tenha crescido, a empresa adiou o investimento”, o termo “Embora” introduz ideia de:','causa','conclusão','concessão','finalidade','condição','C','“Embora” é uma conjunção concessiva: apresenta um fato que poderia levar a outra expectativa, sem impedir o resultado principal.'),
  ('Inglês','Reading inference',2,'Read: “The company cut prices, yet its market share remained unchanged.” Which inference is best supported?','Lower prices always reduce market share.','The price cut did not, by itself, increase market share.','The company stopped selling the product.','Competitors raised their prices.','Demand doubled immediately.','B','The sentence states that market share stayed unchanged despite the price cut. The other options are not supported.'),
  ('Inglês','Connector meaning',2,'In the sentence “Revenue increased whereas operating profit declined,” the word “whereas” expresses:','cause','contrast','time sequence','purpose','condition','B','“Whereas” contrasts two facts: revenue rose while operating profit fell.'),
  ('Inglês','Vocabulary in context',2,'In a business article, “to curb inflation” most nearly means to:','accelerate inflation','measure inflation','limit or restrain inflation','ignore inflation','forecast inflation precisely','C','“To curb” means to control, limit or restrain something.'),
  ('Inglês','Main idea',3,'Read: “Remote work widened the talent pool, but firms also reported new coordination costs. The productivity effect therefore depends on how teams redesign routines.” What is the main idea?','Remote work always raises productivity.','Remote work always lowers productivity.','The effect of remote work depends partly on organizational adaptation.','Coordination costs disappear in remote teams.','Talent pools become smaller with remote work.','C','The passage explicitly presents benefits and costs and concludes that outcomes depend on how routines are redesigned.'),
  ('Ciências Humanas','Geopolítica e cadeias globais',3,'Quando uma empresa diversifica fornecedores entre vários países para reduzir o impacto de choques geopolíticos, ela busca principalmente:','aumentar a concentração produtiva','eliminar todos os custos logísticos','reduzir risco de dependência de uma única origem','substituir estoques por tarifas','fixar a taxa de câmbio','C','Diversificar origens diminui a exposição a interrupções concentradas em um único país ou fornecedor.'),
  ('Ciências Humanas','Política econômica',3,'Em termos gerais, uma elevação da taxa básica de juros tende, no curto prazo, a:','estimular o crédito e elevar a demanda agregada','encarecer o crédito e moderar a demanda agregada','reduzir automaticamente todos os preços','eliminar o desemprego','aumentar necessariamente o gasto público','B','Juros maiores encarecem o financiamento e tendem a reduzir consumo e investimento financiados, moderando a demanda.'),
  ('Ciências Humanas','Urbanização',2,'A expansão urbana sem infraestrutura proporcional tende a intensificar qual problema?','redução automática da desigualdade socioespacial','pressão sobre mobilidade, saneamento e habitação','desaparecimento da periferização','queda inevitável da densidade demográfica','eliminação de deslocamentos pendulares','B','O crescimento urbano descoordenado pressiona serviços e infraestrutura e pode agravar desigualdades territoriais.'),
  ('Ciências Humanas','Comércio internacional',3,'Uma desvalorização da moeda doméstica, mantidas as demais condições, tende a tornar:','exportações domésticas mais caras para estrangeiros','importações mais baratas para residentes','exportações domésticas relativamente mais baratas para estrangeiros','todos os preços internacionais invariáveis em moeda doméstica','o comércio exterior impossível','C','Com a moeda doméstica mais barata, compradores estrangeiros tendem a pagar relativamente menos por bens precificados nessa moeda.'),
  ('Ciências Humanas','História econômica',3,'A industrialização por substituição de importações, adotada em diferentes momentos na América Latina, buscava principalmente:','ampliar a dependência de manufaturas importadas','produzir internamente bens antes importados','abolir o setor industrial','eliminar a participação do Estado na economia','substituir exportações por importações','B','A estratégia buscava desenvolver capacidade industrial doméstica para reduzir a dependência de bens manufaturados importados.'),
  ('Matemática discursiva','Modelagem e justificativa',4,'Em uma questão discursiva de matemática, qual resposta demonstra melhor o raciocínio exigido pela banca?','apresentar apenas o resultado final','listar fórmulas sem relacioná-las ao problema','definir variáveis, montar o modelo, desenvolver os cálculos e concluir no contexto','copiar os dados do enunciado sem operar com eles','dar uma estimativa sem justificar','C','Uma solução discursiva forte torna o raciocínio verificável: define grandezas, explicita relações, calcula e interpreta o resultado.'),
  ('Matemática discursiva','Análise de ponto de equilíbrio',4,'Uma empresa tem receita R(q)=90q e custo C(q)=30.000+60q. Em uma solução discursiva, qual equação deve ser resolvida para encontrar o ponto de equilíbrio?','90q=60q','90q=30.000','90q=30.000+60q','30.000q=150','90+q=30.000+60','C','No ponto de equilíbrio, receita e custo total são iguais: R(q)=C(q), portanto 90q=30.000+60q.'),
  ('Matemática discursiva','Interpretação de derivada',4,'Se C(q) representa o custo total e C''(q)=18 em determinado nível de produção, a interpretação econômica mais adequada é:','o custo total é sempre R$ 18','o custo médio é exatamente R$ 18','próximo desse ponto, uma unidade adicional aumenta o custo total em aproximadamente R$ 18','a receita cresce R$ 18','o lucro é máximo','C','A derivada do custo em relação à quantidade é o custo marginal: aproxima a variação do custo total por unidade adicional.'),
  ('Redação','Construção de tese',3,'Qual tese é mais adequada para iniciar uma redação argumentativa sobre inteligência artificial e trabalho?','A inteligência artificial existe.','Tecnologia é um assunto importante.','A difusão da IA pode elevar produtividade, mas exige qualificação profissional e mecanismos de transição para reduzir custos sociais.','Muitas pessoas usam computadores.','O futuro é imprevisível, então não há o que discutir.','C','A alternativa C apresenta posição clara, tensão analítica e dois eixos que podem ser desenvolvidos ao longo do texto.'),
  ('Redação','Repertório produtivo',3,'Em uma redação, um dado ou referência externa é produtivo quando:','aparece sem relação com a tese','é usado apenas para aumentar o tamanho do texto','é explicado e conectado ao argumento desenvolvido','substitui a necessidade de raciocínio','é sempre uma citação longa','C','Repertório produtivo não é decorativo: precisa ser interpretado e funcionar como evidência ou enquadramento do argumento.'),
  ('Redação','Coerência argumentativa',3,'Um parágrafo defende que ganhos de produtividade não se distribuem automaticamente. Qual continuação é mais coerente?','Logo, toda inovação deve ser proibida.','Por isso, políticas de qualificação e competição podem influenciar como esses ganhos chegam a trabalhadores e consumidores.','Portanto, produtividade e distribuição são conceitos idênticos.','Assim, não existe relação entre tecnologia e economia.','Consequentemente, qualquer dado empírico é irrelevante.','B','A alternativa B mantém a tese e desenvolve uma consequência plausível sem saltos lógicos.'),
  ('Redação','Conclusão',3,'Qual conclusão fecha melhor um texto que discutiu crescimento econômico com baixa produtividade?','Repetir literalmente a introdução.','Introduzir um tema totalmente novo.','Retomar a tese e sintetizar como investimento, inovação e capital humano se conectam ao problema discutido.','Encerrar apenas com uma pergunta retórica.','Afirmar que o problema não tem solução possível.','C','Uma boa conclusão retoma o núcleo argumentativo e amarra as relações já desenvolvidas, sem abrir um assunto desconectado.')
)
insert into public.exam_practice_questions (
  exam_id, area, skill_name, difficulty, prompt,
  option_a, option_b, option_c, option_d, option_e,
  correct_option, explanation, estimated_minutes, source_basis, active,
  source_kind, source_exam_year, source_exam_label, source_exam_url, source_verified_at
)
select
  'fgv', area, skill_name, difficulty, prompt,
  option_a, option_b, option_c, option_d, option_e,
  correct_option, explanation,
  case when area in ('Matemática discursiva','Redação') then 5 else 3 end,
  'Questão autoral Conectaê alinhada à estrutura do Vestibular FGV EAESP 2027.1; não reproduz questão oficial da FGV.',
  true,
  'authorial',
  2027,
  'FGV EAESP 2027.1 · treino autoral Conectaê',
  'https://vestibular.fgv.br/sites/default/files/2026-07/materiais/edital-unificado_01-2027_4.pdf',
  now()
from seed s
where not exists (
  select 1 from public.exam_practice_questions q
  where q.exam_id='fgv' and q.prompt=s.prompt
);
