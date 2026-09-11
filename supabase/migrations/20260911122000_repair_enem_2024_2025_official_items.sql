-- Repairs incomplete ENEM items that were still exposed in the interactive bank.
-- Uses stable booklet/question joins rather than generated item UUIDs.

DO $$
DECLARE
  target_id uuid;
BEGIN
  SELECT i.id INTO target_id
  FROM official_exam_items i
  JOIN official_exam_item_booklet_map m ON m.item_id = i.id
  JOIN official_exam_booklets b ON b.id = m.booklet_id
  WHERE i.series_id='enem' AND i.year=2024 AND b.day=1 AND b.booklet_code='1' AND m.question_number=18
  LIMIT 1;
  IF target_id IS NOT NULL THEN
    UPDATE official_exam_items SET
      prompt_text='Um estudo norte-americano analisou os efeitos da pandemia da covid-19 sobre a saúde mental e a manutenção da atividade física, revelando que um fator está diretamente ligado ao outro. De acordo com os dados, famílias de baixa renda foram mais impactadas pelo ciclo vicioso de falta de motivação e pelo sedentarismo. Diante da necessidade de distanciamento social e do início da quarentena, as opções de espaços seguros para exercícios físicos diminuíram, o que dificultou que as pessoas mantivessem seus níveis de atividade. Os dados evidenciaram que as pessoas mais ativas tinham melhor estado de saúde mental. As pessoas com menor renda tiveram mais dificuldade para manter os níveis de atividade física durante a pandemia, sendo aproximadamente duas vezes menos propensas a continuarem no mesmo ritmo de exercícios de antes da pandemia. Habitantes de áreas urbanas mostraram maior probabilidade de não conseguirem manter os níveis de atividade física semelhantes aos de pessoas que vivem em zonas rurais, onde há mais oportunidades de sair para espaços abertos.\n\nDisponível em: https://revistagalileu.globo.com. Acesso em: 6 dez. 2021 (adaptado).\n\nO texto evidencia a perspectiva ampliada de saúde ao abordar criticamente a pandemia da covid-19 a partir do(a)',
      option_a='busca por espaços para a prática de exercícios físicos.',
      option_b='necessidade de se manter ativo para ter equilíbrio emocional.',
      option_c='distanciamento social e sua vinculação com a prática de atividades físicas.',
      option_d='relação entre os determinantes socioeconômicos e a prática de exercícios.',
      option_e='benefício de morar em áreas rurais para preservar a estabilidade psicológica.',
      image_alt=NULL
    WHERE id=target_id;
  END IF;
END $$;

DO $$
DECLARE target_id uuid;
BEGIN
  SELECT i.id INTO target_id FROM official_exam_items i JOIN official_exam_item_booklet_map m ON m.item_id=i.id JOIN official_exam_booklets b ON b.id=m.booklet_id WHERE i.series_id='enem' AND i.year=2024 AND b.day=2 AND b.booklet_code='5' AND m.question_number=112 LIMIT 1;
  IF target_id IS NOT NULL THEN UPDATE official_exam_items SET
    prompt_text='A nimesulida é um fármaco pouco solúvel em água, utilizado como anti-inflamatório, analgésico e antitérmico. Essa substância pode ser convertida em uma espécie eletricamente carregada, de maior solubilidade em água, mediante o tratamento com uma base de Brönsted-Lowry, isto é, uma espécie química capaz de capturar um próton (H+). Na figura são apresentados os grupamentos presentes na estrutura química da nimesulida.\n\nGONÇALVES, A. A. et al. Contextualizando reações ácido-base de acordo com a teoria protônica de Brönsted-Lowry usando comprimidos de propranolol e nimesulida. Química Nova, n. 3, 2013 (adaptado).\n\nNa estrutura desse fármaco, o grupamento capaz de reagir com a base de Brönsted-Lowry é o grupo',
    option_a='sulfonamida.',option_b='metila.',option_c='fenila.',option_d='nitro.',option_e='éter.',
    image_alt='Estrutura química da nimesulida com os grupamentos funcionais indicados, necessária para responder à questão.' WHERE id=target_id; END IF;
END $$;

DO $$
DECLARE target_id uuid;
BEGIN
  SELECT i.id INTO target_id FROM official_exam_items i JOIN official_exam_item_booklet_map m ON m.item_id=i.id JOIN official_exam_booklets b ON b.id=m.booklet_id WHERE i.series_id='enem' AND i.year=2024 AND b.day=2 AND b.booklet_code='5' AND m.question_number=114 LIMIT 1;
  IF target_id IS NOT NULL THEN UPDATE official_exam_items SET
    prompt_text='Nos automóveis, é importante garantir que o centro de massa (CM) de cada conjunto roda/pneu coincida com o seu centro geométrico. Esse processo é realizado em uma máquina de balanceamento, na qual o conjunto roda e pneu é colocado para girar a uma velocidade de valor constante. Com base nas oscilações medidas, a máquina indica a posição do centro de massa do conjunto, e pequenas peças de chumbo são fixadas em lugares específicos da roda até que as vibrações diminuam. Durante o treinamento de sua equipe, a fim de corrigir a posição do centro de massa indicada pela máquina, um mecânico apresenta o esquema a seguir, com cinco possíveis pontos da roda para posicionar uma peça de chumbo.\n\nEm qual ponto deve ser fixada a peça de chumbo para corrigir a posição do centro de massa desse conjunto roda/pneu?',
    option_a='1',option_b='2',option_c='3',option_d='4',option_e='5',
    image_alt='Esquema da roda com a posição do centro de massa indicada e cinco pontos numerados de 1 a 5 para posicionamento da peça de chumbo.' WHERE id=target_id; END IF;
END $$;

DO $$
DECLARE target_id uuid;
BEGIN
  SELECT i.id INTO target_id FROM official_exam_items i JOIN official_exam_item_booklet_map m ON m.item_id=i.id JOIN official_exam_booklets b ON b.id=m.booklet_id WHERE i.series_id='enem' AND i.year=2024 AND b.day=2 AND b.booklet_code='5' AND m.question_number=118 LIMIT 1;
  IF target_id IS NOT NULL THEN UPDATE official_exam_items SET
    prompt_text='Mirascópio 3D: produtor de ilusão instantânea\n\nO equipamento ilustrado na figura, de dimensões apresentadas no esquema, é composto por dois espelhos côncavos E1 e E2, apoiados um sobre o outro por suas bordas, de tal forma que o vértice de E1 coincide com o foco de E2 e vice-versa. Na abertura circular de E2, é formada uma imagem tridimensional de um objeto posicionado sobre o vértice de E1. Essa imagem é formada a partir dos raios procedentes do objeto, refletidos por E2 e E1, respectivamente, conforme o esquema. Os observadores julgam visualizar o objeto quando estão, de fato, visualizando sua imagem. O efeito só é possível porque as superfícies de ambos os espelhos são de extrema qualidade.\n\nSALZMANN, W. Disponível em: mirascope.com. Acesso em: 27 jun. 2024 (adaptado).\n\nA natureza da imagem formada e a distância vertical entre cada ponto objeto e seu correspondente ponto imagem são',
    option_a='real e 5 cm.',option_b='real e 3,8 cm.',option_c='real e 7,6 cm.',option_d='virtual e 7,6 cm.',option_e='virtual e 3,8 cm.',
    image_alt='Esquema do mirascópio com dois espelhos côncavos E1 e E2, o objeto, a imagem e as dimensões necessárias à resolução.' WHERE id=target_id; END IF;
END $$;

DO $$
DECLARE target_id uuid;
BEGIN
  SELECT i.id INTO target_id FROM official_exam_items i JOIN official_exam_item_booklet_map m ON m.item_id=i.id JOIN official_exam_booklets b ON b.id=m.booklet_id WHERE i.series_id='enem' AND i.year=2024 AND b.day=2 AND b.booklet_code='5' AND m.question_number=124 LIMIT 1;
  IF target_id IS NOT NULL THEN UPDATE official_exam_items SET
    prompt_text='A saúde do professor: acústica arquitetônica\n\nDentre os parâmetros acústicos que afetam a inteligibilidade dos sons emitidos em ambientes fechados, destacam-se o ruído de fundo do ambiente e o decréscimo do nível sonoro com a distância da fonte emissora. Assim, sentar-se no fundo da sala de aula pode prejudicar a aprendizagem dos estudantes, por impedir que eles distingam, com precisão, os sons emitidos, diminuindo a inteligibilidade da fala de seus professores. Considere a situação exemplificada pelo infográfico: à distância de 1 metro, o nível sonoro da fala de um professor é de 60 dB e diminui com a distância. Considere, ainda, que o ruído de fundo nessa sala de aula pode chegar a 45 dB e que, para ser compreendida, o nível sonoro da fala do professor deve estar 5 dB acima desse ruído.\n\nDisponível em: www.ufrrj.br. Acesso em: 2 dez. 2021 (adaptado).\n\nPara um valor máximo do ruído de fundo, a maior distância que um estudante pode estar do professor para que ainda consiga compreender sua fala é mais próxima de',
    option_a='3,0 m.',option_b='4,5 m.',option_c='6,5 m.',option_d='8,0 m.',option_e='9,5 m.',
    image_alt='Infográfico que relaciona a distância do professor ao nível sonoro de sua fala, necessário para determinar a distância máxima de compreensão.' WHERE id=target_id; END IF;
END $$;

DO $$
DECLARE target_id uuid;
BEGIN
  SELECT i.id INTO target_id FROM official_exam_items i JOIN official_exam_item_booklet_map m ON m.item_id=i.id JOIN official_exam_booklets b ON b.id=m.booklet_id WHERE i.series_id='enem' AND i.year=2025 AND b.day=2 AND b.booklet_code='5' AND m.question_number=147 LIMIT 1;
  IF target_id IS NOT NULL THEN UPDATE official_exam_items SET image_alt='Plano cartesiano com o quadrado STUV; V e T indicam as posições fixas dos vilões e S a posição inicial do herói.' WHERE id=target_id; END IF;
END $$;

DO $$
DECLARE target_id uuid;
BEGIN
  SELECT i.id INTO target_id FROM official_exam_items i JOIN official_exam_item_booklet_map m ON m.item_id=i.id JOIN official_exam_booklets b ON b.id=m.booklet_id WHERE i.series_id='enem' AND i.year=2025 AND b.day=2 AND b.booklet_code='5' AND m.question_number=164 LIMIT 1;
  IF target_id IS NOT NULL THEN UPDATE official_exam_items SET
    prompt_text='O cortisol é um hormônio produzido pelas glândulas adrenais e pode ser considerado um importante marcador do estresse fisiológico. Em um estudo desenvolvido com enfermeiros, foi verificado que a concentração de cortisol salivar em um dia de trabalho, denotada por T, era, em média, 1,59 vezes a concentração de cortisol salivar em um dia de folga, denotada por F.\n\nROCHA, M. C. P. et al. Estresse em enfermeiros: o uso do cortisol salivar no dia de trabalho e de folga. Rev. Esc. Enferm. USP, n. 5, 2013 (adaptado).\n\nNesse estudo, a relação obtida entre T e F foi',
    option_a='T = 1,59 + F',option_b='F = 1,59 + T',option_c='T/F = 1,59',option_d='F/T = 1,59',option_e='F · T = 1,59',image_alt=NULL WHERE id=target_id; END IF;
END $$;

DO $$
DECLARE target_id uuid;
BEGIN
  SELECT i.id INTO target_id FROM official_exam_items i JOIN official_exam_item_booklet_map m ON m.item_id=i.id JOIN official_exam_booklets b ON b.id=m.booklet_id WHERE i.series_id='enem' AND i.year=2025 AND b.day=2 AND b.booklet_code='5' AND m.question_number=165 LIMIT 1;
  IF target_id IS NOT NULL THEN UPDATE official_exam_items SET
    prompt_text='Um estacionamento possui 120 vagas para veículos, e todas essas vagas estão ocupadas. Cada cliente paga uma mensalidade para utilizar uma vaga, que é calculada com base nas despesas mensais do estacionamento e no lucro pretendido. As despesas mensais do estacionamento são: R$ 14 240,00 com manutenção mais R$ 36,00 de seguro por veículo. O lucro do estacionamento é determinado pela diferença do valor arrecadado com as mensalidades pelas despesas efetuadas.\n\nA partir do mês seguinte, o valor do seguro por veículo aumentará em 20%, e as despesas com manutenção permanecerão sem alterações. Com isso, o dono do estacionamento reajustará as mensalidades para obter um lucro mensal de R$ 10 000,00. Apesar desse reajuste, todas as vagas continuarão ocupadas.\n\nO valor, em real, da mensalidade reajustada será',
    option_a='185,60.',option_b='226,09.',option_c='245,20.',option_d='268,93.',option_e='285,60.',image_alt=NULL WHERE id=target_id; END IF;
END $$;

DO $$
DECLARE target_id uuid;
BEGIN
  SELECT i.id INTO target_id FROM official_exam_items i JOIN official_exam_item_booklet_map m ON m.item_id=i.id JOIN official_exam_booklets b ON b.id=m.booklet_id WHERE i.series_id='enem' AND i.year=2025 AND b.day=2 AND b.booklet_code='5' AND m.question_number=166 LIMIT 1;
  IF target_id IS NOT NULL THEN UPDATE official_exam_items SET
    prompt_text='O dono de uma sorveteria armazena sorvete em potes de 20 000 cm³. Ele serve o sorvete em taças, em porções de 250 mL.\n\nA quantidade de taças que ele consegue servir a partir de um pote cheio de sorvete é',
    option_a='5.',option_b='8.',option_c='50.',option_d='80.',option_e='800.',image_alt=NULL WHERE id=target_id; END IF;
END $$;
