export type UFMGStageId = 'etapa1' | 'etapa2' | 'etapa3';
export type UFMGArea = 'Linguagens' | 'Matemática' | 'Natureza' | 'Humanas';

export type UFMGPracticeQuestion = {
  id: string;
  area: UFMGArea;
  subject: string;
  topic: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};

export const UFMG_OFFICIAL_2025 = {
  label: 'Seriado UFMG 2025 — 1ª Etapa — Caderno 1',
  examUrl: 'https://backend.copeve.ufmg.br/uploads/Caderno_1_SERIADO_UFMG_2025_a816686677.pdf',
  finalKeyUrl: 'https://backend.copeve.ufmg.br/uploads/Gabarito_Final_Caderno_1_Seriado_2025_bfaa4e5b55.pdf',
  durationMinutes: 240,
  objectiveQuestions: 45,
  distribution: [
    { area: 'Linguagens', questions: 14 },
    { area: 'Matemática', questions: 9 },
    { area: 'Natureza', questions: 12 },
    { area: 'Humanas', questions: 10 },
  ],
  finalKey: [
    'B','C','A','D','C','B','A','C','D','B','C','B','D','C',
    'C','A','B','D','A','C','B','B','A',
    'B','A','C','B','C','B','D','A','C','B','D','B',
    'A','B','D','D','B','D','A','C','D','D',
  ],
} as const;

export const UFMG_STAGE_INFO = [
  {
    id: 'etapa1' as const,
    title: 'Etapa 1',
    content: 'Conteúdos da 1ª série do Ensino Médio, com base na BNCC e no Currículo Referência de Minas Gerais.',
    format: '45 questões objetivas nas quatro áreas + 1 questão discursiva interdisciplinar.',
    weight: '20% da nota global do ciclo',
  },
  {
    id: 'etapa2' as const,
    title: 'Etapa 2',
    content: 'Conteúdo cumulativo da 1ª e da 2ª séries do Ensino Médio.',
    format: '45 questões objetivas nas quatro áreas + 1 ou 2 questões discursivas interdisciplinares.',
    weight: '25% da nota global do ciclo',
  },
  {
    id: 'etapa3' as const,
    title: 'Etapa 3',
    content: 'Conteúdo cumulativo das três séries. A escolha do curso é feita nesta etapa.',
    format: 'Dia 1: 35 objetivas + redação. Dia 2: até 8 discursivas em uma ou duas áreas, conforme o curso.',
    weight: 'Dia 1: 25% • Dia 2: 30% da nota global',
  },
] as const;

export const UFMG_2026_DATES = [
  { label: 'Etapa 2 — ciclo 2025–2027', value: '12 de dezembro de 2026' },
  { label: 'Etapa 1 — ciclo 2026–2028', value: '13 de dezembro de 2026' },
  { label: 'Comprovante definitivo de inscrição', value: '23 de novembro de 2026' },
  { label: 'Desempenho preliminar', value: '11 de fevereiro de 2027' },
  { label: 'Desempenho final', value: '17 de março de 2027' },
] as const;

export const UFMG_REQUIRED_WORKS = {
  etapa1: [
    { title: 'O quinze', author: 'Rachel de Queiroz', type: 'Livro' },
    { title: 'Ideias para adiar o fim do mundo', author: 'Ailton Krenak', type: 'Livro' },
    { title: 'Txai', author: 'Milton Nascimento', type: 'Álbum' },
  ],
  etapa2: [
    { title: 'São Bernardo', author: 'Graciliano Ramos', type: 'Livro' },
    { title: 'Sobrevivendo ao racismo: memórias, cartas e o cotidiano da discriminação no Brasil', author: 'Luana Tolentino', type: 'Livro' },
    { title: 'Balé de pé no chão – a dança afro de Mercedes Baptista', author: 'Lilian Solá Santiago e Marianna Monteiro', type: 'Documentário' },
  ],
} as const;

export const UFMG_CONTENT_MAP = [
  {
    area: 'Linguagens',
    subjects: [
      'Língua Portuguesa e Literatura: leitura, gêneros, argumentação, gramática em contexto e repertório literário',
      'Inglês ou Espanhol: compreensão textual, inferência, vocabulário em contexto e uso social da língua',
      'Artes: artes visuais, música, teatro e dança em perspectiva histórica e cultural',
      'Educação Física: corpo, saúde, práticas corporais, esporte e cultura',
    ],
  },
  {
    area: 'Matemática',
    subjects: [
      'Números, porcentagens, razão e proporcionalidade',
      'Álgebra, funções, equações e inequações',
      'Geometria plana e espacial, medidas e trigonometria',
      'Estatística, leitura de gráficos, combinatória e probabilidade',
    ],
  },
  {
    area: 'Natureza',
    subjects: [
      'Biologia: ecologia, citologia, genética, evolução, fisiologia e saúde',
      'Física: mecânica, energia, ondas, termologia, eletricidade e interpretação experimental',
      'Química: matéria, estrutura, transformações, estequiometria, soluções e química ambiental',
      'Integração entre ciência, tecnologia, sociedade e ambiente',
    ],
  },
  {
    area: 'Humanas',
    subjects: [
      'História: processos históricos do Brasil e do mundo, fontes e temporalidades',
      'Geografia: território, cartografia, população, economia, ambiente e geopolítica',
      'Filosofia: argumentação, ética, conhecimento e pensamento político',
      'Sociologia: cultura, desigualdades, trabalho, poder e cidadania',
    ],
  },
] as const;

export const UFMG_WEEKLY_PLAN = [
  { week: 1, title: 'Diagnóstico real', tasks: ['Faça 45 questões em 4 horas', 'Separe erros por área e por conteúdo', 'Defina as 3 maiores lacunas'] },
  { week: 2, title: 'Linguagens + obra', tasks: ['Leitura e interpretação em gêneros variados', 'Gramática em contexto', '1 bloco de estudo da obra indicada'] },
  { week: 3, title: 'Matemática', tasks: ['Álgebra e funções', 'Geometria e grandezas', 'Estatística e probabilidade'] },
  { week: 4, title: 'Natureza', tasks: ['Biologia aplicada', 'Física com interpretação de situações', 'Química contextualizada'] },
  { week: 5, title: 'Humanas', tasks: ['História e análise de fontes', 'Geografia e leitura de mapas/gráficos', 'Filosofia e Sociologia com argumentação'] },
  { week: 6, title: 'Interdisciplinar', tasks: ['Treine questão discursiva', 'Faça conexões entre 2 ou mais componentes', 'Revise norma-padrão e clareza da resposta'] },
  { week: 7, title: 'Simulado completo', tasks: ['4 horas cronometradas', '45 objetivas + discursiva', 'Corrija e refaça todos os erros'] },
  { week: 8, title: 'Reta final', tasks: ['Revisão de erros recorrentes', 'Obras indicadas e repertório', 'Estratégia de tempo e marcação do gabarito'] },
] as const;

export const UFMG_AUTHORED_QUESTIONS: UFMGPracticeQuestion[] = [
  {
    id: 'ufmg-a01', area: 'Linguagens', subject: 'Português', topic: 'Inferência',
    prompt: 'Em uma campanha escolar, lê-se: “Desligar a luz ao sair não apaga o futuro; ajuda a acendê-lo.” O efeito de sentido central depende de',
    options: ['oposição entre sentidos literal e figurado do verbo acender', 'erro proposital de concordância', 'uso de linguagem exclusivamente técnica', 'repetição de uma informação sem alteração de sentido'],
    answer: 0,
    explanation: 'A frase explora “apagar/acender” no plano literal da eletricidade e no figurado de preservar possibilidades futuras.',
  },
  {
    id: 'ufmg-a02', area: 'Linguagens', subject: 'Literatura', topic: 'Narrador',
    prompt: 'Um narrador afirma: “Talvez eu tenha exagerado naquela lembrança; a memória também escolhe o que quer mostrar.” Esse trecho evidencia',
    options: ['narrador onisciente neutro', 'consciência da subjetividade do relato', 'ausência de ponto de vista', 'descrição objetiva de um documento'],
    answer: 1,
    explanation: 'O narrador reconhece que sua memória seleciona e reorganiza os fatos, tornando explícita a subjetividade.',
  },
  {
    id: 'ufmg-a03', area: 'Linguagens', subject: 'Inglês', topic: 'Leitura',
    prompt: 'Read the notice: “Bring your own bottle. Refill stations are available across campus.” The notice mainly encourages students to',
    options: ['buy more drinks', 'avoid drinking water', 'reuse containers', 'leave the campus'],
    answer: 2,
    explanation: '“Bring your own bottle” e “refill stations” incentivam o uso repetido do mesmo recipiente.',
  },
  {
    id: 'ufmg-a04', area: 'Linguagens', subject: 'Artes', topic: 'Dança e cultura',
    prompt: 'Quando uma coreografia incorpora gestos de uma tradição comunitária e os ressignifica no palco, ela evidencia que a arte',
    options: ['é independente de qualquer contexto social', 'apenas reproduz movimentos sem criar sentidos', 'pode reelaborar repertórios culturais', 'deve eliminar referências históricas'],
    answer: 2,
    explanation: 'Práticas artísticas podem apropriar-se criticamente de repertórios e criar novos sentidos em outro contexto.',
  },
  {
    id: 'ufmg-a05', area: 'Linguagens', subject: 'Português', topic: 'Coesão',
    prompt: 'Em “A escola ampliou a coleta seletiva. Essa medida reduziu o volume de resíduos comuns”, a expressão “Essa medida” funciona como',
    options: ['antecipação de uma informação futura', 'retomada coesiva da ação mencionada antes', 'marcador de oposição', 'indicação de dúvida'],
    answer: 1,
    explanation: 'O demonstrativo retoma a ampliação da coleta seletiva e evita repetição desnecessária.',
  },
  {
    id: 'ufmg-a06', area: 'Linguagens', subject: 'Educação Física', topic: 'Saúde',
    prompt: 'Um programa de atividade física escolar pretende melhorar saúde sem transformar desempenho esportivo em critério de valor pessoal. A proposta mais coerente é',
    options: ['premiar apenas os mais rápidos', 'adaptar práticas a diferentes condições e estimular participação regular', 'excluir estudantes iniciantes', 'usar somente esportes competitivos'],
    answer: 1,
    explanation: 'Uma abordagem de saúde e inclusão considera diferenças individuais e prioriza participação sustentável.',
  },
  {
    id: 'ufmg-a07', area: 'Matemática', subject: 'Matemática', topic: 'Porcentagem',
    prompt: 'Uma biblioteca reduziu em 20% o consumo mensal de 1.500 folhas. No mês seguinte, reduziu mais 10% sobre o novo consumo. O consumo final foi de',
    options: ['1.050', '1.080', '1.100', '1.200'],
    answer: 1,
    explanation: 'Após 20%: 1500 × 0,8 = 1200. Depois: 1200 × 0,9 = 1080.',
  },
  {
    id: 'ufmg-a08', area: 'Matemática', subject: 'Matemática', topic: 'Função afim',
    prompt: 'Um aplicativo cobra taxa fixa de R$ 6,00 mais R$ 2,50 por quilômetro. Se x é a distância em quilômetros, o custo C(x) é',
    options: ['C(x)=6x+2,5', 'C(x)=2,5x+6', 'C(x)=8,5x', 'C(x)=2,5(x+6)'],
    answer: 1,
    explanation: 'A parte variável é 2,5 por km e a parte fixa é 6: C(x)=2,5x+6.',
  },
  {
    id: 'ufmg-a09', area: 'Matemática', subject: 'Matemática', topic: 'Probabilidade',
    prompt: 'Uma caixa tem 3 fichas azuis e 2 verdes. Retira-se uma ficha ao acaso, sem reposição, e depois outra. A probabilidade de as duas serem azuis é',
    options: ['3/10', '9/25', '1/2', '3/5'],
    answer: 0,
    explanation: 'P(azul e azul)=3/5 × 2/4 = 6/20 = 3/10.',
  },
  {
    id: 'ufmg-a10', area: 'Matemática', subject: 'Matemática', topic: 'Geometria',
    prompt: 'Um reservatório retangular mede 2 m de comprimento, 1,5 m de largura e 1 m de altura. Sua capacidade total é',
    options: ['2.000 L', '2.500 L', '3.000 L', '3.500 L'],
    answer: 2,
    explanation: 'Volume = 2 × 1,5 × 1 = 3 m³. Como 1 m³ = 1000 L, são 3000 L.',
  },
  {
    id: 'ufmg-a11', area: 'Matemática', subject: 'Matemática', topic: 'Estatística',
    prompt: 'As notas de cinco estudantes foram 6, 7, 7, 8 e 12. Se a última nota for corrigida para 7, qual medida é necessariamente alterada?',
    options: ['moda apenas', 'mediana apenas', 'média', 'número de observações'],
    answer: 2,
    explanation: 'A soma dos valores muda, portanto a média muda. A quantidade de dados não muda; a mediana continua 7.',
  },
  {
    id: 'ufmg-a12', area: 'Matemática', subject: 'Matemática', topic: 'Razão e escala',
    prompt: 'Em um mapa de escala 1:50.000, uma distância de 4 cm representa, na realidade,',
    options: ['200 m', '500 m', '2 km', '20 km'],
    answer: 2,
    explanation: '4 × 50.000 = 200.000 cm = 2.000 m = 2 km.',
  },
  {
    id: 'ufmg-a13', area: 'Natureza', subject: 'Biologia', topic: 'Ecologia',
    prompt: 'A retirada de um grande predador de uma cadeia alimentar pode aumentar muito a população de herbívoros. Uma consequência provável é',
    options: ['redução da pressão sobre os produtores', 'aumento do consumo de produtores', 'fim imediato da competição', 'aumento garantido da biodiversidade'],
    answer: 1,
    explanation: 'Mais herbívoros tendem a elevar o consumo de produtores, podendo gerar efeitos em cascata no ecossistema.',
  },
  {
    id: 'ufmg-a14', area: 'Natureza', subject: 'Física', topic: 'Energia',
    prompt: 'Uma lâmpada de 10 W permanece ligada por 5 horas. A energia consumida é de',
    options: ['2 Wh', '15 Wh', '50 Wh', '500 Wh'],
    answer: 2,
    explanation: 'E=P×t=10 W × 5 h = 50 Wh.',
  },
  {
    id: 'ufmg-a15', area: 'Natureza', subject: 'Química', topic: 'Soluções',
    prompt: 'Ao adicionar água pura a uma solução aquosa sem retirar soluto, a quantidade de soluto permanece constante e a concentração',
    options: ['aumenta', 'diminui', 'permanece necessariamente igual', 'torna-se zero'],
    answer: 1,
    explanation: 'A diluição aumenta o volume da solução mantendo a quantidade de soluto; assim, a concentração diminui.',
  },
  {
    id: 'ufmg-a16', area: 'Natureza', subject: 'Biologia', topic: 'Citologia',
    prompt: 'Uma célula com intensa produção de proteínas para exportação tende a apresentar bem desenvolvidos',
    options: ['ribossomos, retículo endoplasmático rugoso e complexo golgiense', 'lisossomos e centríolos apenas', 'parede celular e cloroplastos obrigatoriamente', 'vacúolos contráteis e flagelos'],
    answer: 0,
    explanation: 'Ribossomos sintetizam proteínas; RER participa da síntese/processamento e o Golgi modifica e direciona produtos.',
  },
  {
    id: 'ufmg-a17', area: 'Natureza', subject: 'Física', topic: 'Movimento',
    prompt: 'Um ciclista percorre 12 km em 30 minutos, mantendo velocidade média constante. Sua velocidade média é',
    options: ['6 km/h', '12 km/h', '24 km/h', '36 km/h'],
    answer: 2,
    explanation: '30 minutos = 0,5 h; v=12/0,5=24 km/h.',
  },
  {
    id: 'ufmg-a18', area: 'Natureza', subject: 'Química', topic: 'Transformações',
    prompt: 'Qual situação representa transformação química?',
    options: ['gelo derretendo', 'água evaporando', 'ferro enferrujando', 'sal dissolvendo em água'],
    answer: 2,
    explanation: 'A ferrugem envolve formação de novas substâncias por oxidação do ferro.',
  },
  {
    id: 'ufmg-a19', area: 'Humanas', subject: 'História', topic: 'Fontes históricas',
    prompt: 'Ao comparar um jornal, uma fotografia e uma carta sobre o mesmo evento, o historiador deve considerar que',
    options: ['apenas a fotografia é objetiva', 'cada fonte foi produzida em um contexto e com finalidades próprias', 'a carta elimina a necessidade de outras fontes', 'fontes discordantes devem ser descartadas'],
    answer: 1,
    explanation: 'Fontes não são espelhos neutros; contexto, autoria, público e finalidade fazem parte da análise histórica.',
  },
  {
    id: 'ufmg-a20', area: 'Humanas', subject: 'Geografia', topic: 'Urbanização',
    prompt: 'A expansão urbana sem infraestrutura de drenagem e com forte impermeabilização do solo tende a',
    options: ['reduzir o escoamento superficial', 'aumentar a infiltração em todas as áreas', 'ampliar o risco de enchentes', 'eliminar ilhas de calor'],
    answer: 2,
    explanation: 'Superfícies impermeáveis reduzem infiltração e aumentam escoamento, elevando o risco de alagamentos e enchentes.',
  },
  {
    id: 'ufmg-a21', area: 'Humanas', subject: 'Sociologia', topic: 'Desigualdade',
    prompt: 'Dizer que desigualdade social é um fenômeno estrutural significa reconhecer que ela',
    options: ['decorre apenas de escolhas individuais', 'pode ser produzida e reproduzida por instituições e relações sociais', 'não muda ao longo do tempo', 'existe somente por diferenças biológicas'],
    answer: 1,
    explanation: 'A perspectiva estrutural observa mecanismos sociais e institucionais que distribuem oportunidades e recursos de modo desigual.',
  },
  {
    id: 'ufmg-a22', area: 'Humanas', subject: 'Filosofia', topic: 'Argumentação',
    prompt: 'Em um debate, uma pessoa rejeita uma proposta dizendo apenas: “Ela está errada porque quem a apresentou sempre erra.” O problema do argumento é',
    options: ['apresentar evidência empírica demais', 'atacar a pessoa em vez de avaliar a proposta', 'usar uma definição precisa', 'formular uma hipótese testável'],
    answer: 1,
    explanation: 'É um ataque à pessoa (ad hominem), que não demonstra que a proposta em si seja falsa ou inadequada.',
  },
  {
    id: 'ufmg-a23', area: 'Humanas', subject: 'Geografia', topic: 'Cartografia',
    prompt: 'Em um mapa temático, cores mais escuras representam maiores percentuais de população urbana. Esse recurso serve principalmente para',
    options: ['mostrar altitude do terreno', 'comparar espacialmente a intensidade de uma variável', 'indicar rotas obrigatórias', 'substituir a legenda'],
    answer: 1,
    explanation: 'Variações de tonalidade em mapas coropléticos permitem comparar a distribuição espacial de uma variável quantitativa.',
  },
  {
    id: 'ufmg-a24', area: 'Humanas', subject: 'História', topic: 'Cidadania',
    prompt: 'A ampliação histórica do direito de voto em diferentes sociedades pode ser interpretada como',
    options: ['processo de disputa e redefinição da cidadania política', 'prova de que conflitos sociais desapareceram', 'fenômeno sem relação com instituições', 'substituição completa de direitos sociais por políticos'],
    answer: 0,
    explanation: 'Direitos políticos foram historicamente ampliados por disputas sobre quem é reconhecido como cidadão e participante das decisões públicas.',
  },
];

export const UFMG_DISCURSIVE_PROMPTS = [
  {
    id: 'ufmg-d01',
    title: 'Cidade, clima e desigualdade',
    prompt: 'Uma cidade registra aumento de ondas de calor e diferenças de temperatura entre bairros muito arborizados e bairros densamente construídos. Explique dois mecanismos que podem produzir essa diferença e proponha uma medida pública, articulando conhecimentos de Geografia e Ciências da Natureza.',
    checklist: ['explica impermeabilização/absorção de calor ou cobertura vegetal', 'relaciona evapotranspiração/sombreamento ou materiais urbanos', 'propõe medida coerente', 'redige em prosa clara e norma-padrão'],
  },
  {
    id: 'ufmg-d02',
    title: 'Memória e representação',
    prompt: 'Um documentário combina depoimentos, imagens de arquivo, música e cenas reencenadas. Explique por que essa construção não torna a obra “menos histórica” automaticamente e indique dois cuidados necessários para interpretar esse tipo de fonte.',
    checklist: ['reconhece mediação/autoria', 'considera contexto e finalidade', 'diferencia evidência de interpretação', 'articula Linguagens e História'],
  },
  {
    id: 'ufmg-d03',
    title: 'Consumo de água',
    prompt: 'Uma escola reduziu em 18% seu consumo de água após consertar vazamentos, mas o número de estudantes aumentou 10%. Explique por que o consumo total, isoladamente, não basta para avaliar a eficiência e proponha um indicador quantitativo melhor.',
    checklist: ['distingue consumo total e consumo per capita', 'propõe razão consumo/estudante', 'explica como comparar períodos', 'apresenta raciocínio matemático compreensível'],
  },
  {
    id: 'ufmg-d04',
    title: 'Tecnologia e trabalho',
    prompt: 'Uma empresa automatiza parte de sua produção e, ao mesmo tempo, cria novas funções de supervisão e análise de dados. Analise como a tecnologia pode simultaneamente eliminar e criar ocupações, mobilizando conceitos de Sociologia e História do trabalho.',
    checklist: ['evita determinismo tecnológico', 'discute transformação das qualificações', 'relaciona tecnologia a relações sociais/econômicas', 'constrói argumento com conclusão'],
  },
] as const;
