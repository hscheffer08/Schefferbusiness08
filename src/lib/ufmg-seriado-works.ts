export type UFMGWorkQuizQuestion = {
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};

export type UFMGWorkGuide = {
  title: string;
  author: string;
  type: string;
  summary: string;
  focus: string[];
  videoUrl: string;
  videoLabel: string;
  quiz: UFMGWorkQuizQuestion[];
};

export const UFMG_WORK_GUIDES: Record<string, UFMGWorkGuide> = {
  'O quinze': {
    title: 'O quinze',
    author: 'Rachel de Queiroz',
    type: 'Livro',
    summary: 'Publicado em 1930, o romance acompanha a seca de 1915 no Ceará por dois eixos principais. De um lado, Chico Bento, Cordulina e os filhos enfrentam fome, deslocamento e perda ao abandonar o sertão. De outro, Conceição e Vicente vivem uma relação atravessada por diferenças de projeto de vida e de posição social. A seca não funciona apenas como cenário: ela reorganiza afetos, trabalho, migração e relações de poder. A linguagem enxuta e o olhar social aproximam a obra do romance regionalista da segunda fase modernista.',
    focus: ['seca de 1915 e migração', 'desigualdade social e condição dos retirantes', 'Conceição como figura feminina autônoma', 'regionalismo, linguagem concisa e narrador em 3ª pessoa'],
    videoUrl: 'https://www.youtube.com/watch?v=tXLiMV9UmEs',
    videoLabel: 'O Quinze — resumo do livro (Roleta do Livro)',
    quiz: [
      { prompt: 'Na estrutura do romance, a seca de 1915 atua principalmente como', options: ['um detalhe paisagístico sem efeito sobre o enredo', 'força que reorganiza trajetórias, relações e deslocamentos', 'um elemento fantástico', 'um recurso usado apenas no desfecho'], answer: 1, explanation: 'A seca condiciona a migração, a pobreza, o trabalho e os vínculos afetivos das personagens.' },
      { prompt: 'A trajetória de Chico Bento e sua família evidencia sobretudo', options: ['o conforto da vida urbana', 'a experiência social do retirante diante da fome e da seca', 'a ascensão política de proprietários rurais', 'a vida universitária no início do século XX'], answer: 1, explanation: 'O núcleo de Chico Bento expõe a vulnerabilidade dos retirantes e as consequências sociais da seca.' },
      { prompt: 'Conceição se destaca na obra por', options: ['repetir sem conflito o modelo feminino tradicional', 'representar autonomia intelectual e afetiva em tensão com expectativas sociais', 'ser a proprietária da fazenda de Chico Bento', 'narrar toda a obra em primeira pessoa'], answer: 1, explanation: 'Conceição aparece como uma mulher instruída e autônoma, o que tensiona expectativas de gênero do período.' },
    ],
  },
  'Ideias para adiar o fim do mundo': {
    title: 'Ideias para adiar o fim do mundo',
    author: 'Ailton Krenak',
    type: 'Livro',
    summary: 'A obra reúne falas e reflexões de Ailton Krenak sobre a crise ambiental e sobre a forma moderna de imaginar a humanidade separada da natureza. Krenak questiona a ideia de um modelo único de humanidade, critica a transformação da Terra em recurso e apresenta modos indígenas de relação com rios, montanhas, memória e coletividade. “Adiar o fim do mundo” significa manter viva a capacidade de contar outras histórias, reconhecer diferentes formas de existência e romper com uma relação puramente utilitária com o planeta.',
    focus: ['crítica ao antropocentrismo', 'humanidade não separada da natureza', 'pluralidade de modos de vida', 'narrativa, memória e resistência'],
    videoUrl: 'https://www.youtube.com/watch?v=Rr5IuqyoBu8',
    videoLabel: 'Ideias para adiar o fim do mundo — resumo (Leitura Reflexiva)',
    quiz: [
      { prompt: 'Uma crítica central de Krenak é dirigida à ideia de que', options: ['a natureza e a humanidade estão profundamente conectadas', 'existe uma humanidade universal separada e superior à natureza', 'a diversidade cultural deve ser preservada', 'histórias podem produzir resistência'], answer: 1, explanation: 'Krenak questiona justamente a concepção de humanidade apartada da Terra e colocada acima dos demais seres.' },
      { prompt: '“Adiar o fim do mundo”, no argumento da obra, relaciona-se a', options: ['ignorar a crise ambiental', 'multiplicar histórias e formas de existência que escapem ao modelo dominante', 'acelerar o consumo de recursos', 'substituir diversidade por homogeneidade'], answer: 1, explanation: 'A imagem de adiar o fim envolve preservar a imaginação, a diversidade e outras formas de viver e narrar o mundo.' },
      { prompt: 'A relação com rios e montanhas aparece no livro para reforçar', options: ['uma visão exclusivamente econômica da paisagem', 'uma relação de parentesco, memória e pertencimento com a Terra', 'a irrelevância dos territórios', 'a superioridade da vida urbana'], answer: 1, explanation: 'Krenak mobiliza essas relações para desmontar a separação rígida entre sociedade e natureza.' },
    ],
  },
  Txai: {
    title: 'Txai',
    author: 'Milton Nascimento',
    type: 'Álbum',
    summary: 'Lançado em 1990, Txai nasceu do contato de Milton Nascimento com povos da floresta e com a mobilização em defesa da Amazônia e da Aliança dos Povos da Floresta. O álbum combina canções de Milton com vozes, referências e registros ligados a povos indígenas, além de temas como território, floresta, memória e proteção ambiental. Para a prova, vale ouvir o álbum como obra musical e política: timbres, línguas, vozes e paisagens sonoras constroem um diálogo entre criação artística, diversidade cultural e defesa dos povos da floresta.',
    focus: ['Amazônia e povos da floresta', 'mistura de vozes, timbres e registros culturais', 'arte ligada a território e defesa ambiental', 'escuta do álbum como unidade, não apenas de faixas isoladas'],
    videoUrl: 'https://www.youtube.com/watch?v=qI0nTkQ-utM',
    videoLabel: 'Descobrindo: Milton Nascimento — Txai (canal oficial)',
    quiz: [
      { prompt: 'Em Txai, a dimensão ambiental aparece associada principalmente a', options: ['um discurso abstrato sem relação com povos e territórios', 'território, povos da floresta e defesa da Amazônia', 'um repertório exclusivamente urbano', 'uma narrativa sobre industrialização europeia'], answer: 1, explanation: 'O álbum articula floresta, território, cultura e mobilização em defesa dos povos da Amazônia.' },
      { prompt: 'Ao estudar o álbum para uma prova de Linguagens, é importante observar', options: ['apenas a duração das faixas', 'como vozes, timbres, línguas e sons também produzem sentido', 'somente os títulos das músicas', 'apenas a biografia do cantor'], answer: 1, explanation: 'Uma obra musical é analisada também por seus elementos sonoros e pela maneira como eles constroem significado.' },
      { prompt: 'A presença de diferentes vozes no álbum reforça', options: ['homogeneização cultural', 'pluralidade cultural e diálogo entre repertórios', 'apagamento dos povos da floresta', 'neutralidade política absoluta'], answer: 1, explanation: 'A pluralidade de vozes é parte central da dimensão cultural e política do trabalho.' },
    ],
  },
  'São Bernardo': {
    title: 'São Bernardo',
    author: 'Graciliano Ramos',
    type: 'Livro',
    summary: 'Narrado em primeira pessoa por Paulo Honório, o romance reconstrói a trajetória de um homem pobre que enriquece e se torna proprietário da fazenda São Bernardo. Acostumado a medir tudo pelo valor de posse e produtividade, ele tenta estender essa lógica às relações humanas. O casamento com Madalena expõe o conflito entre seu autoritarismo e a visão mais solidária e crítica dela. O ciúme e o desejo de controle corroem a relação até a tragédia. Ao escrever suas memórias, Paulo Honório começa a perceber a própria solidão e a desumanização produzida por sua forma de viver.',
    focus: ['narrador-personagem Paulo Honório', 'propriedade, poder e reificação das relações', 'conflito entre Paulo Honório e Madalena', 'ciúme, autoritarismo, solidão e autocrítica'],
    videoUrl: 'https://www.youtube.com/watch?v=GNLSTDFe7PY',
    videoLabel: 'São Bernardo, Graciliano Ramos — resumo',
    quiz: [
      { prompt: 'O fato de Paulo Honório narrar a própria história é importante porque', options: ['elimina qualquer subjetividade', 'faz o leitor perceber o mundo pela visão limitada e interessada do protagonista', 'transforma o romance em texto científico', 'impede qualquer reflexão sobre o passado'], answer: 1, explanation: 'A primeira pessoa permite acompanhar tanto as justificativas quanto as contradições do protagonista.' },
      { prompt: 'A relação de Paulo Honório com pessoas e propriedades revela', options: ['uma lógica de posse e controle que invade os vínculos humanos', 'desinteresse por dinheiro e poder', 'recusa completa da propriedade privada desde o início', 'uma vida guiada exclusivamente por solidariedade'], answer: 0, explanation: 'O protagonista frequentemente trata relações humanas com a mesma lógica utilitária usada na administração da fazenda.' },
      { prompt: 'Madalena funciona no romance como', options: ['espelho exato dos valores de Paulo Honório', 'contraponto ético e afetivo ao autoritarismo do protagonista', 'personagem sem função no conflito central', 'narradora principal da obra'], answer: 1, explanation: 'As diferenças entre Madalena e Paulo Honório tornam explícitos os limites morais e afetivos dele.' },
    ],
  },
  'Sobrevivendo ao racismo: memórias, cartas e o cotidiano da discriminação no Brasil': {
    title: 'Sobrevivendo ao racismo: memórias, cartas e o cotidiano da discriminação no Brasil',
    author: 'Luana Tolentino',
    type: 'Livro',
    summary: 'Luana Tolentino combina memória, cartas e episódios do cotidiano para mostrar como o racismo estrutural se manifesta em situações aparentemente comuns. A dimensão autobiográfica aproxima experiências pessoais de questões coletivas: escola, trabalho, linguagem, reconhecimento, violência simbólica e possibilidades de resistência. A obra desloca o racismo do campo da exceção para o funcionamento cotidiano das relações sociais e convida o leitor a observar quem é ouvido, protegido, suspeito, silenciado ou autorizado a ocupar determinados espaços.',
    focus: ['racismo estrutural no cotidiano', 'memória e escrita em primeira pessoa', 'educação, linguagem e reconhecimento', 'resistência, denúncia e transformação social'],
    videoUrl: 'https://www.youtube.com/results?search_query=Sobrevivendo+ao+racismo+Luana+Tolentino',
    videoLabel: 'Vídeos e entrevistas com Luana Tolentino sobre a obra',
    quiz: [
      { prompt: 'O uso de memórias pessoais na obra contribui para', options: ['tratar o racismo como experiência apenas individual', 'ligar experiências concretas a estruturas sociais mais amplas', 'eliminar a dimensão histórica do tema', 'neutralizar a voz da autora'], answer: 1, explanation: 'A experiência pessoal funciona como ponto de entrada para compreender padrões sociais e institucionais.' },
      { prompt: 'A ideia de racismo estrutural implica reconhecer que o racismo', options: ['existe somente em agressões explícitas', 'também se reproduz em rotinas, instituições e desigualdades persistentes', 'depende sempre de intenção individual consciente', 'desaparece quando não há insultos'], answer: 1, explanation: 'O conceito chama atenção para mecanismos sociais que operam além de atos individuais deliberados.' },
      { prompt: 'O subtítulo “memórias, cartas e o cotidiano” indica', options: ['uma única forma narrativa', 'a combinação de registros para discutir experiências e relações sociais', 'um livro exclusivamente acadêmico e impessoal', 'uma narrativa de fantasia'], answer: 1, explanation: 'A variedade de registros aproxima testemunho, reflexão e análise do cotidiano.' },
    ],
  },
  'Balé de pé no chão – a dança afro de Mercedes Baptista': {
    title: 'Balé de pé no chão – a dança afro de Mercedes Baptista',
    author: 'Lilian Solá Santiago e Marianna Monteiro',
    type: 'Documentário',
    summary: 'O documentário reconstrói a trajetória de Mercedes Baptista e sua contribuição decisiva para a dança afro-brasileira. Bailarina de formação erudita e uma das pioneiras negras no Theatro Municipal do Rio de Janeiro, Mercedes articulou técnicas do balé com pesquisas de gestualidades ligadas a tradições afro-brasileiras e criou um repertório próprio. A obra permite discutir corpo, raça, memória, instituições artísticas, apagamentos históricos e a transformação de práticas culturais negras em linguagem cênica reconhecida.',
    focus: ['trajetória de Mercedes Baptista', 'dança afro-brasileira e criação de repertório', 'racismo e acesso às instituições artísticas', 'corpo, memória e patrimônio cultural'],
    videoUrl: 'https://www.youtube.com/results?search_query=Bal%C3%A9+de+P%C3%A9+no+Ch%C3%A3o+Mercedes+Baptista+document%C3%A1rio',
    videoLabel: 'Balé de Pé no Chão — buscar o documentário no YouTube',
    quiz: [
      { prompt: 'A importância de Mercedes Baptista para a dança brasileira está ligada a', options: ['rejeitar qualquer relação entre dança e cultura afro-brasileira', 'criar e sistematizar repertórios de dança afro-brasileira em diálogo com sua formação cênica', 'atuar apenas como crítica de cinema', 'abandonar completamente a dança de palco'], answer: 1, explanation: 'Sua trajetória envolve pesquisa, criação e sistematização de uma linguagem cênica afro-brasileira.' },
      { prompt: 'O documentário permite relacionar dança e racismo porque evidencia', options: ['que instituições artísticas são sempre neutras', 'barreiras de acesso, apagamentos e disputas por reconhecimento', 'que raça não interfere na história cultural brasileira', 'apenas questões técnicas de iluminação'], answer: 1, explanation: 'A trajetória de Mercedes explicita como raça, reconhecimento e instituições artísticas estão conectados.' },
      { prompt: 'Ao tratar o corpo como arquivo cultural, a obra sugere que', options: ['gestos e movimentos podem carregar memória e identidade', 'a dança não produz significado', 'somente textos escritos preservam cultura', 'movimentos corporais são sempre universais e sem contexto'], answer: 0, explanation: 'Gestualidades podem transmitir memória, pertencimento e repertórios históricos.' },
    ],
  },
};
