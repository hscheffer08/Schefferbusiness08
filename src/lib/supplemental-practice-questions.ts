export type SupplementalPracticeQuestion = {
  id: number;
  exam_id: 'enem' | 'cmmg';
  area: string;
  skill_name: string;
  difficulty: number;
  prompt: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string;
  correct_option: 'A' | 'B' | 'C' | 'D' | 'E';
  explanation: string;
  estimated_minutes: number;
  source_basis: string;
  active: true;
};

type RawQuestion = Omit<SupplementalPracticeQuestion, 'id' | 'source_basis' | 'active'>;

const raw: RawQuestion[] = [
  {
    exam_id: 'enem', area: 'Matemática', skill_name: 'Porcentagem sucessiva', difficulty: 3, estimated_minutes: 2,
    prompt: 'Uma tarifa de R$ 80 recebe aumento de 15% e, no mês seguinte, desconto de 10% sobre o novo valor. Qual é a tarifa final?',
    option_a: 'R$ 81,20', option_b: 'R$ 82,00', option_c: 'R$ 82,80', option_d: 'R$ 84,00', option_e: 'R$ 85,20', correct_option: 'C',
    explanation: 'Os percentuais são aplicados sucessivamente: 80 × 1,15 × 0,90 = 82,80. Somar 15% e subtrair 10% diretamente daria um resultado incorreto.',
  },
  {
    exam_id: 'enem', area: 'Matemática', skill_name: 'Escala cartográfica', difficulty: 2, estimated_minutes: 2,
    prompt: 'Em um mapa de escala 1:250 000, a distância entre duas cidades mede 6 cm. A distância real entre elas é',
    option_a: '1,5 km', option_b: '15 km', option_c: '25 km', option_d: '150 km', option_e: '1 500 km', correct_option: 'B',
    explanation: 'Cada centímetro representa 250 000 cm, isto é, 2,5 km. Logo, 6 × 2,5 = 15 km.',
  },
  {
    exam_id: 'enem', area: 'Matemática', skill_name: 'Mediana e leitura de dados', difficulty: 2, estimated_minutes: 2,
    prompt: 'Os tempos, em minutos, de cinco atendimentos foram 12, 7, 15, 9 e 22. A mediana desses tempos é',
    option_a: '9', option_b: '12', option_c: '13', option_d: '15', option_e: '22', correct_option: 'B',
    explanation: 'Ordenando os valores, temos 7, 9, 12, 15 e 22. O termo central é 12.',
  },
  {
    exam_id: 'enem', area: 'Matemática', skill_name: 'Probabilidade sem reposição', difficulty: 4, estimated_minutes: 3,
    prompt: 'Uma urna contém 3 bolas azuis e 2 verdes. Duas bolas são retiradas ao acaso, sem reposição. A probabilidade de ambas serem azuis é',
    option_a: '1/5', option_b: '3/10', option_c: '2/5', option_d: '1/2', option_e: '3/5', correct_option: 'B',
    explanation: 'A probabilidade é (3/5) × (2/4) = 6/20 = 3/10.',
  },
  {
    exam_id: 'enem', area: 'Matemática', skill_name: 'Função afim', difficulty: 3, estimated_minutes: 2,
    prompt: 'Um aplicativo cobra taxa fixa de R$ 6 mais R$ 2,50 por quilômetro. Uma corrida de R$ 31 corresponde a quantos quilômetros?',
    option_a: '8', option_b: '9', option_c: '10', option_d: '11', option_e: '12', correct_option: 'C',
    explanation: 'Pela equação 6 + 2,5x = 31, temos 2,5x = 25 e x = 10.',
  },
  {
    exam_id: 'enem', area: 'Matemática', skill_name: 'Geometria espacial', difficulty: 3, estimated_minutes: 3,
    prompt: 'Um reservatório cilíndrico tem raio interno de 2 m e altura útil de 3 m. Usando π = 3, o volume máximo é',
    option_a: '12 m³', option_b: '18 m³', option_c: '24 m³', option_d: '36 m³', option_e: '48 m³', correct_option: 'D',
    explanation: 'O volume do cilindro é πr²h = 3 × 2² × 3 = 36 m³.',
  },
  {
    exam_id: 'enem', area: 'Natureza', skill_name: 'Ecologia e eutrofização', difficulty: 3, estimated_minutes: 2,
    prompt: 'O lançamento contínuo de esgoto rico em nutrientes em uma lagoa pode provocar proliferação de algas e, depois, mortandade de peixes. A causa imediata mais provável da mortandade é',
    option_a: 'o aumento permanente do pH pela fotossíntese', option_b: 'a redução do oxigênio dissolvido pela decomposição', option_c: 'a transformação da água doce em salgada', option_d: 'o bloqueio completo da luz pelas margens', option_e: 'a diminuição da atividade bacteriana', correct_option: 'B',
    explanation: 'A matéria orgânica e as algas mortas intensificam a decomposição, processo que consome oxigênio dissolvido e pode causar hipóxia.',
  },
  {
    exam_id: 'enem', area: 'Natureza', skill_name: 'Fisiologia endócrina', difficulty: 3, estimated_minutes: 2,
    prompt: 'Após uma refeição rica em carboidratos, a elevação da glicemia estimula a liberação de um hormônio que favorece a entrada de glicose nas células. Esse hormônio é',
    option_a: 'adrenalina', option_b: 'glucagon', option_c: 'insulina', option_d: 'tiroxina', option_e: 'testosterona', correct_option: 'C',
    explanation: 'A insulina reduz a glicemia ao favorecer a captação celular e o armazenamento de glicose, especialmente como glicogênio.',
  },
  {
    exam_id: 'enem', area: 'Natureza', skill_name: 'Soluções e concentração', difficulty: 3, estimated_minutes: 3,
    prompt: 'Para preparar 500 mL de uma solução a 20 g/L, a massa de soluto necessária é',
    option_a: '2 g', option_b: '5 g', option_c: '10 g', option_d: '20 g', option_e: '40 g', correct_option: 'C',
    explanation: 'Como 500 mL = 0,5 L, a massa é 20 g/L × 0,5 L = 10 g.',
  },
  {
    exam_id: 'enem', area: 'Natureza', skill_name: 'Potência elétrica', difficulty: 3, estimated_minutes: 3,
    prompt: 'Um chuveiro de 5 500 W permanece ligado por 12 minutos. A energia consumida, em kWh, é',
    option_a: '0,55', option_b: '0,92', option_c: '1,10', option_d: '5,50', option_e: '66,0', correct_option: 'C',
    explanation: '5 500 W = 5,5 kW e 12 min = 0,2 h. Logo, E = 5,5 × 0,2 = 1,1 kWh.',
  },
  {
    exam_id: 'enem', area: 'Natureza', skill_name: 'Seleção natural e resistência', difficulty: 3, estimated_minutes: 2,
    prompt: 'O uso inadequado de antibióticos favorece o aumento de bactérias resistentes porque',
    option_a: 'o antibiótico ensina cada bactéria a se defender', option_b: 'as bactérias resistentes sobrevivem e deixam mais descendentes', option_c: 'todas as bactérias sofrem a mesma mutação dirigida', option_d: 'o medicamento transforma vírus em bactérias', option_e: 'as bactérias sensíveis passam a produzir anticorpos', correct_option: 'B',
    explanation: 'Variantes resistentes preexistentes ou surgidas ao acaso têm vantagem seletiva na presença do antibiótico e aumentam sua frequência.',
  },
  {
    exam_id: 'enem', area: 'Natureza', skill_name: 'Circuitos elétricos', difficulty: 4, estimated_minutes: 3,
    prompt: 'Dois resistores idênticos são ligados em paralelo a uma bateria ideal. Em comparação com apenas um resistor ligado à mesma bateria, a resistência equivalente e a corrente total serão, respectivamente,',
    option_a: 'maior e menor', option_b: 'maior e igual', option_c: 'igual e igual', option_d: 'menor e maior', option_e: 'menor e menor', correct_option: 'D',
    explanation: 'Em paralelo, a resistência equivalente de dois resistores iguais é R/2. Mantida a tensão, a corrente total aumenta pela relação I = V/Req.',
  },
  {
    exam_id: 'enem', area: 'Humanas', skill_name: 'Urbanização brasileira', difficulty: 3, estimated_minutes: 2,
    prompt: 'A expansão de moradias em áreas periféricas distantes dos empregos, combinada à oferta insuficiente de transporte coletivo, tende a produzir',
    option_a: 'redução da segregação socioespacial', option_b: 'eliminação dos movimentos pendulares', option_c: 'aumento do tempo diário de deslocamento', option_d: 'homogeneização do preço da terra', option_e: 'desconcentração imediata dos serviços', correct_option: 'C',
    explanation: 'A separação espacial entre moradia e emprego intensifica os deslocamentos pendulares e aumenta o tempo gasto no transporte.',
  },
  {
    exam_id: 'enem', area: 'Humanas', skill_name: 'Cidadania e Constituição de 1988', difficulty: 2, estimated_minutes: 2,
    prompt: 'A Constituição brasileira de 1988 ficou conhecida como “Constituição Cidadã” principalmente por',
    option_a: 'abolir a separação entre os Poderes', option_b: 'ampliar direitos civis, políticos e sociais', option_c: 'restringir o voto aos proprietários', option_d: 'substituir eleições por indicações', option_e: 'eliminar a autonomia dos estados', correct_option: 'B',
    explanation: 'A Constituição de 1988 consolidou a redemocratização e ampliou garantias e direitos de cidadania.',
  },
  {
    exam_id: 'enem', area: 'Humanas', skill_name: 'Transição demográfica', difficulty: 3, estimated_minutes: 2,
    prompt: 'Em uma população que apresenta queda sustentada da fecundidade e aumento da expectativa de vida, espera-se, no longo prazo,',
    option_a: 'rejuvenescimento acelerado da estrutura etária', option_b: 'aumento relativo da população idosa', option_c: 'crescimento indefinido da mortalidade infantil', option_d: 'fim da migração interna', option_e: 'redução automática da urbanização', correct_option: 'B',
    explanation: 'Menos nascimentos e maior longevidade elevam a participação relativa das faixas etárias mais velhas.',
  },
  {
    exam_id: 'enem', area: 'Humanas', skill_name: 'Ética kantiana', difficulty: 4, estimated_minutes: 3,
    prompt: 'Uma ação praticada apenas porque sua regra poderia valer para todas as pessoas, independentemente da vantagem pessoal, aproxima-se da ética de',
    option_a: 'Epicuro', option_b: 'Maquiavel', option_c: 'Kant', option_d: 'Nietzsche', option_e: 'Hobbes', correct_option: 'C',
    explanation: 'A universalização da máxima da ação é central ao imperativo categórico de Kant.',
  },
  {
    exam_id: 'enem', area: 'Humanas', skill_name: 'Sociologia do trabalho', difficulty: 3, estimated_minutes: 2,
    prompt: 'A organização do trabalho baseada em tarefas fragmentadas, controle rígido do tempo e linha de montagem é associada principalmente ao',
    option_a: 'mercantilismo', option_b: 'fordismo', option_c: 'feudalismo', option_d: 'anarquismo', option_e: 'keynesianismo rural', correct_option: 'B',
    explanation: 'O fordismo articulou produção em massa, linha de montagem e forte padronização das tarefas.',
  },
  {
    exam_id: 'enem', area: 'Humanas', skill_name: 'Abolição e pós-abolição', difficulty: 4, estimated_minutes: 3,
    prompt: 'A abolição legal da escravidão em 1888 não eliminou a desigualdade racial no Brasil porque foi realizada sem',
    option_a: 'expansão das exportações de café', option_b: 'políticas amplas de inclusão econômica e acesso à terra', option_c: 'participação de movimentos abolicionistas', option_d: 'mudança na forma de governo no ano seguinte', option_e: 'entrada de trabalhadores imigrantes', correct_option: 'B',
    explanation: 'A liberdade jurídica não foi acompanhada por medidas estruturais de reparação, escolarização, trabalho e acesso à terra.',
  },
  {
    exam_id: 'enem', area: 'Linguagens', skill_name: 'Funções da linguagem', difficulty: 3, estimated_minutes: 2,
    prompt: 'Em um aviso com a frase “Desligue a luz ao sair”, predomina a função da linguagem voltada a influenciar o comportamento do destinatário. Trata-se da função',
    option_a: 'emotiva', option_b: 'fática', option_c: 'metalinguística', option_d: 'conativa', option_e: 'poética', correct_option: 'D',
    explanation: 'O imperativo e o foco no destinatário caracterizam a função conativa ou apelativa.',
  },
  {
    exam_id: 'enem', area: 'Linguagens', skill_name: 'Variação linguística', difficulty: 2, estimated_minutes: 2,
    prompt: 'Em uma entrevista, um falante emprega uma variedade regional de português plenamente compreendida em sua comunidade. Do ponto de vista sociolinguístico, esse uso deve ser entendido como',
    option_a: 'ausência completa de regras', option_b: 'erro que impede qualquer comunicação', option_c: 'variação legítima ligada ao contexto social', option_d: 'prova de incapacidade de aprendizagem', option_e: 'substituição obrigatória da norma escrita', correct_option: 'C',
    explanation: 'Variedades linguísticas têm regras próprias e cumprem funções comunicativas; adequação depende da situação de uso.',
  },
  {
    exam_id: 'enem', area: 'Linguagens', skill_name: 'Coesão referencial', difficulty: 3, estimated_minutes: 2,
    prompt: 'Na frase “Marina entregou o relatório a Paula porque ela viajaria”, o principal problema de clareza decorre de',
    option_a: 'erro de concordância nominal', option_b: 'ambiguidade do pronome “ela”', option_c: 'ausência de sujeito em todas as orações', option_d: 'uso inadequado do tempo verbal', option_e: 'repetição obrigatória do objeto direto', correct_option: 'B',
    explanation: 'O pronome “ela” pode retomar Marina ou Paula, gerando ambiguidade referencial.',
  },
  {
    exam_id: 'enem', area: 'Linguagens', skill_name: 'Modernismo brasileiro', difficulty: 3, estimated_minutes: 2,
    prompt: 'A primeira fase do Modernismo brasileiro caracterizou-se, entre outros aspectos, pela',
    option_a: 'defesa exclusiva de modelos clássicos portugueses', option_b: 'experimentação formal e revisão crítica da identidade nacional', option_c: 'rejeição de qualquer linguagem cotidiana', option_d: 'retomada integral da estética árcade', option_e: 'proibição do humor e da paródia', correct_option: 'B',
    explanation: 'Os modernistas de 1922 buscaram ruptura estética, linguagem mais livre e releitura crítica do Brasil.',
  },
  {
    exam_id: 'enem', area: 'Linguagens', skill_name: 'Leitura de campanha pública', difficulty: 3, estimated_minutes: 2,
    prompt: 'Uma campanha combina a imagem de uma torneira pingando com a frase “Cada gota conta”. A relação entre os elementos verbal e visual serve para',
    option_a: 'negar o desperdício representado', option_b: 'reforçar a mensagem de economia de água', option_c: 'substituir o tema ambiental por humor', option_d: 'eliminar a função persuasiva', option_e: 'apresentar dados estatísticos completos', correct_option: 'B',
    explanation: 'A imagem concretiza a situação de desperdício e a frase sintetiza o apelo persuasivo da campanha.',
  },
  {
    exam_id: 'enem', area: 'Linguagens', skill_name: 'Compreensão em língua inglesa', difficulty: 3, estimated_minutes: 2,
    prompt: 'Read the notice: “Library users must return borrowed laptops before the building closes.” According to the notice, users are required to',
    option_a: 'buy a laptop from the library', option_b: 'use laptops only at home', option_c: 'return the equipment before closing time', option_d: 'close the building after use', option_e: 'borrow books instead of laptops', correct_option: 'C',
    explanation: 'The expression “must return” states an obligation to give the borrowed laptops back before the library closes.',
  },
  {
    exam_id: 'cmmg', area: 'Biologia', skill_name: 'Genética mendeliana', difficulty: 3, estimated_minutes: 2,
    prompt: 'Em um cruzamento Aa × Aa, considerando dominância completa e ausência de seleção, a probabilidade de um descendente apresentar o fenótipo recessivo é',
    option_a: '0%', option_b: '25%', option_c: '50%', option_d: '75%', option_e: '100%', correct_option: 'B',
    explanation: 'O cruzamento gera a proporção genotípica 1 AA : 2 Aa : 1 aa. Apenas aa expressa o fenótipo recessivo.',
  },
  {
    exam_id: 'cmmg', area: 'Biologia', skill_name: 'Imunologia e vacinação', difficulty: 4, estimated_minutes: 3,
    prompt: 'A dose de reforço de uma vacina busca principalmente',
    option_a: 'substituir permanentemente os leucócitos', option_b: 'reativar células de memória e ampliar a resposta específica', option_c: 'produzir antibióticos no plasma', option_d: 'eliminar a imunidade celular', option_e: 'impedir qualquer mutação do patógeno', correct_option: 'B',
    explanation: 'O reencontro com o antígeno ativa linfócitos de memória, produzindo resposta secundária mais rápida e intensa.',
  },
  {
    exam_id: 'cmmg', area: 'Biologia', skill_name: 'Fisiologia renal', difficulty: 4, estimated_minutes: 3,
    prompt: 'Em uma pessoa desidratada, o aumento da liberação de ADH contribui para',
    option_a: 'menor reabsorção de água nos rins', option_b: 'maior volume de urina diluída', option_c: 'maior reabsorção de água e urina mais concentrada', option_d: 'interrupção da filtração glomerular', option_e: 'eliminação obrigatória de glicose na urina', correct_option: 'C',
    explanation: 'O ADH aumenta a permeabilidade dos ductos coletores à água, favorecendo sua reabsorção e concentrando a urina.',
  },
  {
    exam_id: 'cmmg', area: 'Biologia', skill_name: 'Respiração celular', difficulty: 3, estimated_minutes: 2,
    prompt: 'Na respiração aeróbia, a maior parte do ATP é produzida durante',
    option_a: 'a glicólise no citosol', option_b: 'o ciclo de Calvin', option_c: 'a cadeia transportadora de elétrons', option_d: 'a fermentação lática', option_e: 'a duplicação do DNA', correct_option: 'C',
    explanation: 'A fosforilação oxidativa associada à cadeia respiratória gera a maior parcela do ATP da respiração aeróbia.',
  },
  {
    exam_id: 'cmmg', area: 'Biologia', skill_name: 'Ecologia de populações', difficulty: 3, estimated_minutes: 2,
    prompt: 'Quando uma população cresce e se aproxima da capacidade de suporte do ambiente, espera-se que',
    option_a: 'os recursos se tornem ilimitados', option_b: 'a resistência ambiental reduza a taxa de crescimento', option_c: 'a competição intraespecífica desapareça', option_d: 'a mortalidade seja sempre zero', option_e: 'o crescimento permaneça exponencial indefinidamente', correct_option: 'B',
    explanation: 'Perto da capacidade de suporte, limitação de recursos, competição e outros fatores reduzem o crescimento populacional.',
  },
  {
    exam_id: 'cmmg', area: 'Biologia', skill_name: 'Síntese proteica', difficulty: 4, estimated_minutes: 3,
    prompt: 'Durante a tradução, a correspondência entre os códons do RNA mensageiro e os aminoácidos é mediada diretamente pelo',
    option_a: 'RNA transportador', option_b: 'DNA polimerase', option_c: 'centríolo', option_d: 'lisossomo', option_e: 'complexo golgiense', correct_option: 'A',
    explanation: 'Cada RNAt apresenta um anticódon complementar ao códon e transporta o aminoácido correspondente.',
  },
  {
    exam_id: 'cmmg', area: 'Biologia', skill_name: 'Evolução e especiação', difficulty: 4, estimated_minutes: 3,
    prompt: 'O isolamento geográfico prolongado entre duas populações de uma mesma espécie pode favorecer a especiação porque',
    option_a: 'impede qualquer mutação', option_b: 'aumenta o fluxo gênico entre as populações', option_c: 'permite o acúmulo independente de diferenças genéticas', option_d: 'torna os ambientes necessariamente idênticos', option_e: 'elimina a ação da seleção natural', correct_option: 'C',
    explanation: 'Com fluxo gênico reduzido, mutação, deriva e seleção podem diferenciar as populações até surgir isolamento reprodutivo.',
  },
  {
    exam_id: 'cmmg', area: 'Biologia', skill_name: 'Sistema circulatório', difficulty: 3, estimated_minutes: 2,
    prompt: 'No coração humano, a válvula localizada entre o átrio esquerdo e o ventrículo esquerdo é a',
    option_a: 'tricúspide', option_b: 'pulmonar', option_c: 'aórtica', option_d: 'mitral', option_e: 'semilunar direita', correct_option: 'D',
    explanation: 'A válvula atrioventricular esquerda é a mitral ou bicúspide.',
  },
  {
    exam_id: 'cmmg', area: 'Química', skill_name: 'Estequiometria', difficulty: 4, estimated_minutes: 3,
    prompt: 'Na reação 2 H₂ + O₂ → 2 H₂O, quantos mols de água são formados a partir de 3 mols de O₂, com H₂ em excesso?',
    option_a: '1 mol', option_b: '2 mol', option_c: '3 mol', option_d: '6 mol', option_e: '9 mol', correct_option: 'D',
    explanation: 'A proporção é 1 mol de O₂ para 2 mol de H₂O. Assim, 3 mol de O₂ formam 6 mol de água.',
  },
  {
    exam_id: 'cmmg', area: 'Química', skill_name: 'pH e soluções', difficulty: 3, estimated_minutes: 2,
    prompt: 'Uma solução aquosa apresenta [H⁺] = 1 × 10⁻³ mol/L. Seu pH é',
    option_a: '1', option_b: '3', option_c: '7', option_d: '10', option_e: '11', correct_option: 'B',
    explanation: 'pH = −log[H⁺] = −log(10⁻³) = 3.',
  },
  {
    exam_id: 'cmmg', area: 'Química', skill_name: 'Ligações intermoleculares', difficulty: 3, estimated_minutes: 2,
    prompt: 'A temperatura de ebulição relativamente alta da água, quando comparada à de moléculas de massa semelhante, está relacionada principalmente às',
    option_a: 'ligações iônicas entre moléculas', option_b: 'pontes de hidrogênio', option_c: 'ligações metálicas', option_d: 'reações nucleares', option_e: 'forças gravitacionais', correct_option: 'B',
    explanation: 'As pontes de hidrogênio são interações intermoleculares intensas e exigem mais energia para serem rompidas.',
  },
  {
    exam_id: 'cmmg', area: 'Química', skill_name: 'Oxirredução', difficulty: 4, estimated_minutes: 3,
    prompt: 'Em uma pilha em funcionamento espontâneo, ocorre',
    option_a: 'oxidação no cátodo', option_b: 'redução no ânodo', option_c: 'oxidação no ânodo e redução no cátodo', option_d: 'redução nos dois eletrodos', option_e: 'ausência de fluxo de elétrons', correct_option: 'C',
    explanation: 'Por definição, a oxidação ocorre no ânodo e a redução no cátodo; os elétrons fluem do ânodo ao cátodo.',
  },
  {
    exam_id: 'cmmg', area: 'Química', skill_name: 'Química orgânica', difficulty: 3, estimated_minutes: 2,
    prompt: 'O grupo funcional característico dos ácidos carboxílicos é',
    option_a: '–OH ligado a carbono saturado', option_b: '–CHO', option_c: '–COOH', option_d: '–NH₂', option_e: '–O–', correct_option: 'C',
    explanation: 'Ácidos carboxílicos apresentam o grupo carboxila, representado por –COOH.',
  },
  {
    exam_id: 'cmmg', area: 'Física', skill_name: 'Cinemática', difficulty: 3, estimated_minutes: 2,
    prompt: 'Um carro percorre 120 km em 2 horas, mantendo velocidade média constante. Sua velocidade média é',
    option_a: '40 km/h', option_b: '50 km/h', option_c: '60 km/h', option_d: '80 km/h', option_e: '240 km/h', correct_option: 'C',
    explanation: 'Velocidade média é distância dividida pelo tempo: 120/2 = 60 km/h.',
  },
  {
    exam_id: 'cmmg', area: 'Física', skill_name: 'Dinâmica', difficulty: 3, estimated_minutes: 2,
    prompt: 'Uma força resultante de 12 N atua sobre um corpo de massa 3 kg. Desprezando outras variações, a aceleração do corpo é',
    option_a: '0,25 m/s²', option_b: '4 m/s²', option_c: '9 m/s²', option_d: '15 m/s²', option_e: '36 m/s²', correct_option: 'B',
    explanation: 'Pela segunda lei de Newton, a = F/m = 12/3 = 4 m/s².',
  },
  {
    exam_id: 'cmmg', area: 'Física', skill_name: 'Óptica geométrica', difficulty: 3, estimated_minutes: 2,
    prompt: 'Uma imagem formada por um espelho plano é',
    option_a: 'real, invertida e menor', option_b: 'virtual, direita e do mesmo tamanho', option_c: 'real, direita e maior', option_d: 'virtual, invertida e menor', option_e: 'sempre projetável em uma tela', correct_option: 'B',
    explanation: 'O espelho plano forma imagem virtual, direita, simétrica e com o mesmo tamanho do objeto.',
  },
  {
    exam_id: 'cmmg', area: 'Física', skill_name: 'Calorimetria', difficulty: 4, estimated_minutes: 3,
    prompt: 'Para aquecer 200 g de água de 20 °C para 30 °C, usando c = 1 cal/(g·°C), a quantidade de calor necessária é',
    option_a: '20 cal', option_b: '200 cal', option_c: '1 000 cal', option_d: '2 000 cal', option_e: '6 000 cal', correct_option: 'D',
    explanation: 'Q = mcΔT = 200 × 1 × 10 = 2 000 cal.',
  },
  {
    exam_id: 'cmmg', area: 'Matemática', skill_name: 'Equação do segundo grau', difficulty: 3, estimated_minutes: 3,
    prompt: 'As raízes da equação x² − 5x + 6 = 0 são',
    option_a: '−3 e −2', option_b: '−2 e 3', option_c: '1 e 6', option_d: '2 e 3', option_e: '3 e 5', correct_option: 'D',
    explanation: 'Fatorando, x² − 5x + 6 = (x − 2)(x − 3), logo x = 2 ou x = 3.',
  },
  {
    exam_id: 'cmmg', area: 'Matemática', skill_name: 'Progressão aritmética', difficulty: 3, estimated_minutes: 2,
    prompt: 'Em uma progressão aritmética de primeiro termo 5 e razão 3, o décimo termo é',
    option_a: '27', option_b: '30', option_c: '32', option_d: '35', option_e: '38', correct_option: 'C',
    explanation: 'a₁₀ = a₁ + 9r = 5 + 9 × 3 = 32.',
  },
  {
    exam_id: 'cmmg', area: 'Matemática', skill_name: 'Análise combinatória', difficulty: 4, estimated_minutes: 3,
    prompt: 'Uma comissão de 2 pessoas será escolhida entre 5 candidatos. Quantas comissões diferentes podem ser formadas?',
    option_a: '5', option_b: '8', option_c: '10', option_d: '15', option_e: '20', correct_option: 'C',
    explanation: 'A ordem não importa: C(5,2) = 5!/(2!3!) = 10.',
  },
  {
    exam_id: 'cmmg', area: 'Matemática', skill_name: 'Trigonometria', difficulty: 3, estimated_minutes: 2,
    prompt: 'Em um triângulo retângulo, um ângulo agudo θ tem cateto oposto 3 e hipotenusa 5. O valor de sen θ é',
    option_a: '2/5', option_b: '3/5', option_c: '4/5', option_d: '3/4', option_e: '5/3', correct_option: 'B',
    explanation: 'Seno é a razão entre cateto oposto e hipotenusa: sen θ = 3/5.',
  },
  {
    exam_id: 'cmmg', area: 'Matemática', skill_name: 'Logaritmos', difficulty: 4, estimated_minutes: 3,
    prompt: 'Se log₂ x = 5, então x é igual a',
    option_a: '10', option_b: '16', option_c: '25', option_d: '32', option_e: '64', correct_option: 'D',
    explanation: 'Pela definição de logaritmo, log₂x = 5 equivale a x = 2⁵ = 32.',
  },
  {
    exam_id: 'cmmg', area: 'Língua Portuguesa', skill_name: 'Concordância verbal', difficulty: 3, estimated_minutes: 2,
    prompt: 'Assinale a frase de acordo com a norma-padrão.',
    option_a: 'Fazem dois anos que estudo aqui.', option_b: 'Houveram muitas dúvidas na reunião.', option_c: 'Devem existir boas alternativas.', option_d: 'Existe muitas soluções possíveis.', option_e: 'Tratam-se de questões urgentes.', correct_option: 'C',
    explanation: 'Em “devem existir”, o auxiliar concorda com “boas alternativas”. “Fazer” temporal e “haver” existencial são impessoais.',
  },
  {
    exam_id: 'cmmg', area: 'Língua Portuguesa', skill_name: 'Regência e crase', difficulty: 4, estimated_minutes: 3,
    prompt: 'Assinale a alternativa em que o emprego da crase está correto.',
    option_a: 'Entreguei o relatório à ela.', option_b: 'Chegamos à Belo Horizonte cedo.', option_c: 'Refiro-me àquela pesquisa.', option_d: 'O atendimento ocorre de segunda à sexta.', option_e: 'Começou à estudar ontem.', correct_option: 'C',
    explanation: 'O verbo “referir-se” exige preposição a, que se funde ao a inicial do pronome demonstrativo “aquela”.',
  },
  {
    exam_id: 'cmmg', area: 'Língua Portuguesa', skill_name: 'Pontuação', difficulty: 3, estimated_minutes: 2,
    prompt: 'Assinale a frase corretamente pontuada.',
    option_a: 'Os candidatos que estudaram, passaram.', option_b: 'Durante a prova mantenha a calma.', option_c: 'Durante a prova, mantenha a calma.', option_d: 'A coordenadora explicou, o regulamento.', option_e: 'Biologia química, e física serão cobradas.', correct_option: 'C',
    explanation: 'O adjunto adverbial deslocado “Durante a prova” pode ser separado por vírgula. As demais opções separam indevidamente termos essenciais ou coordenados.',
  },
  {
    exam_id: 'cmmg', area: 'Língua Portuguesa', skill_name: 'Coerência textual', difficulty: 3, estimated_minutes: 2,
    prompt: 'Em “Embora estivesse cansada, continuou a revisão”, a conjunção destacada estabelece relação de',
    option_a: 'causa', option_b: 'concessão', option_c: 'conclusão', option_d: 'finalidade', option_e: 'proporção', correct_option: 'B',
    explanation: '“Embora” introduz uma concessão: o cansaço poderia impedir a ação, mas ela continuou.',
  },
  {
    exam_id: 'cmmg', area: 'Literatura', skill_name: 'Realismo brasileiro', difficulty: 3, estimated_minutes: 2,
    prompt: 'No Realismo brasileiro, é frequente a presença de',
    option_a: 'idealização absoluta do herói romântico', option_b: 'análise psicológica e crítica das relações sociais', option_c: 'exclusão de conflitos morais', option_d: 'imitação obrigatória da epopeia clássica', option_e: 'recusa da ironia narrativa', correct_option: 'B',
    explanation: 'O Realismo privilegia observação crítica, análise psicológica e questionamento das convenções sociais.',
  },
  {
    exam_id: 'cmmg', area: 'Literatura', skill_name: 'Gêneros literários', difficulty: 2, estimated_minutes: 2,
    prompt: 'O gênero lírico caracteriza-se principalmente pela',
    option_a: 'expressão de uma voz subjetiva', option_b: 'presença obrigatória de narrador onisciente', option_c: 'representação exclusiva por atores', option_d: 'descrição científica de fenômenos', option_e: 'ausência de recursos sonoros', correct_option: 'A',
    explanation: 'No gênero lírico, predomina a expressão subjetiva do eu lírico, frequentemente por meio de ritmo e imagens poéticas.',
  },
  {
    exam_id: 'cmmg', area: 'Literatura', skill_name: 'Romantismo brasileiro', difficulty: 3, estimated_minutes: 2,
    prompt: 'Uma característica marcante da primeira geração romântica brasileira é o',
    option_a: 'indianismo associado à construção nacional', option_b: 'cientificismo determinista', option_c: 'culto exclusivo à objetividade', option_d: 'experimentalismo concretista', option_e: 'retorno ao teatro medieval português', correct_option: 'A',
    explanation: 'A primeira geração romântica valorizou nacionalismo, natureza e figura idealizada do indígena.',
  },
  {
    exam_id: 'cmmg', area: 'Inglês', skill_name: 'Reading comprehension', difficulty: 3, estimated_minutes: 2,
    prompt: 'Read: “Regular physical activity can improve sleep quality, but intense exercise immediately before bedtime may affect some people differently.” The sentence indicates that exercise',
    option_a: 'always prevents sleep', option_b: 'has no relation to sleep', option_c: 'may improve sleep, with individual differences near bedtime', option_d: 'must only be done at night', option_e: 'affects every person in exactly the same way', correct_option: 'C',
    explanation: 'The text states a general benefit and then adds a qualification: late intense exercise may affect individuals differently.',
  },
  {
    exam_id: 'cmmg', area: 'Inglês', skill_name: 'Reference words', difficulty: 3, estimated_minutes: 2,
    prompt: 'In “The researchers published the results after they checked the data”, the word “they” refers to',
    option_a: 'the results', option_b: 'the researchers', option_c: 'the data', option_d: 'the publication', option_e: 'the readers', correct_option: 'B',
    explanation: '“They” is the plural subject that refers back to “the researchers”.',
  },
  {
    exam_id: 'cmmg', area: 'Inglês', skill_name: 'Connectors', difficulty: 3, estimated_minutes: 2,
    prompt: 'Choose the connector that best completes the sentence: “The treatment was effective; _____, continued monitoring was necessary.”',
    option_a: 'therefore', option_b: 'however', option_c: 'because', option_d: 'for example', option_e: 'similarly', correct_option: 'B',
    explanation: '“However” introduces the contrast between effectiveness and the continued need for monitoring.',
  },
  {
    exam_id: 'cmmg', area: 'Inglês', skill_name: 'Modal verbs', difficulty: 2, estimated_minutes: 2,
    prompt: 'In a hospital notice, “Visitors must sanitize their hands” expresses',
    option_a: 'a past habit', option_b: 'an obligation', option_c: 'an impossible event', option_d: 'a personal preference', option_e: 'a comparison', correct_option: 'B',
    explanation: 'In this context, “must” expresses a rule or strong obligation.',
  },
  {
    exam_id: 'cmmg', area: 'Conhecimentos Gerais', skill_name: 'Geografia — mudanças climáticas', difficulty: 3, estimated_minutes: 2,
    prompt: 'O aumento da concentração atmosférica de gases de efeito estufa intensifica o aquecimento global porque esses gases',
    option_a: 'impedem toda radiação solar de chegar à Terra', option_b: 'retêm parte da radiação infravermelha emitida pela superfície', option_c: 'eliminam o vapor de água da atmosfera', option_d: 'transformam oceanos em continentes', option_e: 'interrompem a circulação dos ventos', correct_option: 'B',
    explanation: 'Gases de efeito estufa absorvem e reemitem radiação infravermelha, reduzindo a perda de calor para o espaço.',
  },
  {
    exam_id: 'cmmg', area: 'Conhecimentos Gerais', skill_name: 'Geografia — globalização', difficulty: 3, estimated_minutes: 2,
    prompt: 'A fragmentação internacional da produção ocorre quando',
    option_a: 'todas as etapas produtivas se concentram em um único bairro', option_b: 'diferentes etapas de uma cadeia são distribuídas entre países', option_c: 'o comércio exterior deixa de existir', option_d: 'as empresas abandonam redes logísticas', option_e: 'a tecnologia impede fluxos financeiros', correct_option: 'B',
    explanation: 'Cadeias globais de valor distribuem pesquisa, componentes, montagem e serviços entre diferentes territórios.',
  },
  {
    exam_id: 'cmmg', area: 'Conhecimentos Gerais', skill_name: 'História — Era Vargas', difficulty: 3, estimated_minutes: 2,
    prompt: 'A Consolidação das Leis do Trabalho, criada em 1943, relaciona-se à estratégia varguista de',
    option_a: 'eliminar toda regulação estatal do trabalho', option_b: 'incorporar demandas trabalhistas sob mediação do Estado', option_c: 'proibir a urbanização brasileira', option_d: 'restaurar a monarquia', option_e: 'extinguir os sindicatos oficialmente reconhecidos', correct_option: 'B',
    explanation: 'A legislação social ampliou direitos, ao mesmo tempo em que o Estado regulava e controlava a organização sindical.',
  },
  {
    exam_id: 'cmmg', area: 'Conhecimentos Gerais', skill_name: 'História — Guerra Fria', difficulty: 3, estimated_minutes: 2,
    prompt: 'A Guerra Fria foi marcada principalmente pela',
    option_a: 'aliança militar permanente entre EUA e URSS', option_b: 'disputa política, econômica e ideológica entre dois blocos', option_c: 'ausência de conflitos indiretos', option_d: 'unificação imediata da Alemanha após 1945', option_e: 'extinção das armas nucleares', correct_option: 'B',
    explanation: 'Estados Unidos e União Soviética lideraram blocos rivais e disputaram influência sem confronto militar direto generalizado entre si.',
  },
  {
    exam_id: 'cmmg', area: 'Conhecimentos Gerais', skill_name: 'Filosofia — teoria do conhecimento', difficulty: 4, estimated_minutes: 3,
    prompt: 'A dúvida metódica de Descartes tem como finalidade',
    option_a: 'provar que nenhum conhecimento é possível', option_b: 'buscar uma base indubitável para o conhecimento', option_c: 'substituir a razão apenas pela tradição', option_d: 'negar a existência do pensamento', option_e: 'defender os sentidos como sempre infalíveis', correct_option: 'B',
    explanation: 'Descartes usa a dúvida como método para encontrar uma certeza resistente a toda dúvida, expressa no cogito.',
  },
  {
    exam_id: 'cmmg', area: 'Conhecimentos Gerais', skill_name: 'Filosofia — ética aristotélica', difficulty: 4, estimated_minutes: 3,
    prompt: 'Para Aristóteles, a virtude moral é desenvolvida principalmente por meio',
    option_a: 'do hábito orientado pela razão', option_b: 'da recusa de toda vida em comunidade', option_c: 'da satisfação de qualquer desejo imediato', option_d: 'de uma regra matemática única', option_e: 'do abandono da prudência', correct_option: 'A',
    explanation: 'A virtude é adquirida pela prática habitual de ações equilibradas, guiadas pela razão prática e pela prudência.',
  },
  {
    exam_id: 'cmmg', area: 'Conhecimentos Gerais', skill_name: 'Sociologia — socialização', difficulty: 2, estimated_minutes: 2,
    prompt: 'O processo pelo qual indivíduos aprendem normas, valores e papéis de sua sociedade é chamado de',
    option_a: 'estratificação geológica', option_b: 'socialização', option_c: 'secularização obrigatória', option_d: 'seleção natural', option_e: 'inflação', correct_option: 'B',
    explanation: 'Socialização é o aprendizado, ao longo da vida, de referências culturais e formas de participação social.',
  },
  {
    exam_id: 'cmmg', area: 'Conhecimentos Gerais', skill_name: 'Sociologia — desigualdade', difficulty: 3, estimated_minutes: 2,
    prompt: 'A expressão “mobilidade social” descreve',
    option_a: 'apenas deslocamentos de uma cidade para outra', option_b: 'mudanças de posição de indivíduos ou grupos na estrutura social', option_c: 'o fim automático das classes sociais', option_d: 'somente o crescimento populacional', option_e: 'a circulação de mercadorias sem pessoas', correct_option: 'B',
    explanation: 'Mobilidade social refere-se à passagem entre posições ou estratos sociais, podendo ser ascendente ou descendente.',
  },
];

export const SUPPLEMENTAL_PRACTICE_QUESTIONS: SupplementalPracticeQuestion[] = raw.map((question, index) => ({
  ...question,
  id: -10_000 - index,
  source_basis: 'Conectaê autoral v2',
  active: true,
}));

const fingerprint = (question: Pick<SupplementalPracticeQuestion, 'prompt'>) =>
  question.prompt.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\W+/g, ' ').trim();

export function mergePracticeQuestions<T extends { prompt: string }>(remote: T[]): (T | SupplementalPracticeQuestion)[] {
  const seen = new Set(remote.map(fingerprint));
  return [
    ...remote,
    ...SUPPLEMENTAL_PRACTICE_QUESTIONS.filter((question) => !seen.has(fingerprint(question))),
  ];
}

export const isSupplementalQuestion = (id: number) => id < 0;
