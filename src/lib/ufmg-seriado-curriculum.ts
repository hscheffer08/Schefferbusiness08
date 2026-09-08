export type SeriadoStage='etapa1'|'etapa2'|'etapa3';
export type SeriadoArea='Linguagens'|'Matemática'|'Natureza'|'Humanas';

export type CurriculumComponent={
  stage:SeriadoStage;
  area:SeriadoArea;
  component:string;
  emphasis:string;
  topics:string[];
};

export type SeriadoYearQuestion={
  id:string;
  stage:SeriadoStage;
  area:SeriadoArea;
  component:string;
  topic:string;
  prompt:string;
  options:[string,string,string,string];
  answer:number;
  explanation:string;
};

export const UFMG_NORTEADOR_URL='https://www.ufmg.br/seriadoufmg/wp-content/uploads/2025/11/SeriadoUFMG_DocumentoNorteador_Completo_30102025.pdf';

export const STAGE_META={
  etapa1:{label:'1º ano / Etapa 1',short:'1º ano',note:'Conteúdo da 1ª série do Ensino Médio.'},
  etapa2:{label:'2º ano / Etapa 2',short:'2º ano',note:'Conteúdo da 1ª série e, com maior ênfase, da 2ª série.'},
  etapa3:{label:'3º ano / Etapa 3',short:'3º ano',note:'Conteúdo cumulativo das três séries; no Dia 2 a área depende do curso escolhido.'},
} as const;

const c=(stage:SeriadoStage,area:SeriadoArea,component:string,emphasis:string,topics:string[]):CurriculumComponent=>({stage,area,component,emphasis,topics});

export const UFMG_CURRICULUM:CurriculumComponent[]=[
  c('etapa1','Linguagens','Língua Portuguesa e Literaturas','Leitura, gêneros, efeitos de sentido, variação e fundamentos do texto literário.',[
    'Estratégias de leitura: explícito/implícito, tema, fato/opinião, fake news, elementos multissemióticos, intertextualidade e produção textual',
    'Tipos e gêneros: sequências narrativas, descritivas, injuntivas, expositivas e argumentativas; finalidade, composição e circulação',
    'Coesão e coerência; progressão temática; conflito narrativo; tese e argumentos',
    'Estratégias discursivas: humor, ironia, metalinguagem, seleção lexical, pontuação, discurso direto/indireto e paráfrase/paródia',
    'Variação histórica, geográfica e sociocultural; níveis de formalidade e adequação',
    'Texto literário: ficção, verossimilhança, prosa/poesia, conotação/denotação e relações entre literatura, arte e realidade',
  ]),
  c('etapa2','Linguagens','Língua Portuguesa e Literaturas','Aprofundamento da argumentação, norma, diversidade literária e leitura crítica.',[
    'Leitura e produção multimodal/digital com análise de autoria, circulação e posicionamento',
    'Coesão sequencial e referencial; tese, tipos de argumento, progressão e hierarquia de informações',
    'Humor, ironia, metalinguagem, modalização, seleção lexical, pontuação e vozes do discurso',
    'Norma-padrão, norma culta e coloquial; preconceito e racismo linguísticos; adequação situacional',
    'Literatura: procedimentos figurativos, relações com artes e mídias, diversidade autoral brasileira, produções afro-brasileiras e indígenas',
    'Análise linguística em contexto, com relações sintáticas e efeitos de sentido',
  ]),
  c('etapa3','Linguagens','Língua Portuguesa e Literaturas','Síntese crítica, recursos expressivos e domínio formal da escrita.',[
    'Leitura crítica de gêneros complexos e multimodais; intertextualidade, interdiscursividade e argumentação',
    'Figuras de linguagem de palavras, pensamento, sintaxe e som e seus efeitos de sentido',
    'Variação, norma-padrão, adequação e reflexão sociolinguística',
    'Literatura em diálogo com artes e mídias; diversidade de matrizes estéticas e culturais',
    'Sintaxe do período simples e composto e usos normativos da vírgula',
    'Produção escrita em prosa com clareza, coesão, coerência e adequação ao registro formal',
  ]),

  c('etapa1','Linguagens','Língua Inglesa','Compreensão de gêneros, inferência, léxico-gramática e cultura.',[
    'Gêneros informativos, instrucionais, persuasivos, opinativos e artísticos em meios impressos e digitais',
    'Estratégias de leitura, propósito comunicativo e informações explícitas/implícitas',
    'Tempos verbais, pronomes, conjunções, escolhas lexicais e construção de sentido',
    'Coesão e coerência; relações lógico-semânticas; reconhecimento de posição discursiva',
    'Cultura, identidade, variação e práticas sociais em comunidades de língua inglesa',
  ]),
  c('etapa2','Linguagens','Língua Inglesa','Multimodalidade, repertório lexical, persuasão e temas globais.',[
    'Leitura crítica de textos multimodais: imagem, cor, layout, memes, posts, infográficos e vídeos curtos',
    'Idioms, phrasal verbs, collocations, registros formal/informal e coesão lexical',
    'Ironia, persuasão, modalização, apelo emocional, modal verbs e pontos de vista',
    'Temas globais e interculturais; representação de grupos, identidades e culturas',
    'Produção e interpretação de textos com intenção comunicativa e posicionamento explícito',
  ]),
  c('etapa3','Linguagens','Língua Inglesa','Argumentação, identidade, mídia digital e avaliação de fontes.',[
    'Estratégias argumentativas e relações lógico-semânticas em textos opinativos e midiáticos',
    'Modal verbs e conectores como marcas de certeza, dúvida, obrigação, possibilidade e opinião',
    'Representações sociais, estereótipos, silenciamentos, identidade e pertencimento',
    'Fake news, deepfakes, clickbait, sensacionalismo, credibilidade de fontes e autoria',
    'Uso ético da informação e participação crítica em ambientes digitais',
  ]),

  c('etapa1','Linguagens','Língua Espanhola','Leitura, recursos linguísticos, gêneros e diversidade hispânica.',[
    'Compreensão global e específica; explícito/implícito; inferência pelo contexto',
    'Seleção lexical e campos temáticos como saúde, ecologia, política, cultura e sociedade hispânica',
    'Tempos verbais, pronomes, preposições, conjunções, conectores e relações lógico-semânticas',
    'Gêneros e estratégias para informar, persuadir e interagir',
    'Cultura, identidade e variedades do espanhol',
  ]),
  c('etapa2','Linguagens','Língua Espanhola','Discurso, cultura, argumentação e variação linguística.',[
    'Contextos de produção, circulação e recepção e seus efeitos na construção de sentidos',
    'Representações culturais, valores e posicionamentos em temas sociais, culturais e políticos',
    'Argumentação, marcas de subjetividade, polidez e relações de intertextualidade',
    'Variações sociais, regionais e de registro; léxico, expressões idiomáticas e construções morfossintáticas',
    'Textos multimodais e articulação entre linguagem verbal e não verbal',
  ]),
  c('etapa3','Linguagens','Língua Espanhola','Composição textual, multimodalidade e leitura intercultural crítica.',[
    'Progressão, correferência, ordem das informações, reiteração, omissão e macroestrutura semântica',
    'Articulação de ideias e relações lógico-semânticas em textos complexos',
    'Recursos multissemióticos: hiperlinks, tipografia, cores, imagens, espaços e interfaces digitais',
    'Intertextualidade e diálogo entre textos, mídias e discursos',
    'Diversidade linguístico-cultural do mundo hispânico e combate a preconceitos',
  ]),

  c('etapa1','Linguagens','Artes','Elementos constitutivos, meios, suportes e linguagens artísticas.',[
    'Artes Visuais: ponto, linha, forma, cor, textura, volume, plano, tonalidade, profundidade e movimento',
    'Dança: corpo, movimento, espaço e fatores de movimento — tempo, peso, fluência e espaço',
    'Música: som e silêncio; altura, duração, intensidade e timbre',
    'Teatro: corpo, palavra, espaço, gesto e movimento; elementos da cena',
    'Meios, materiais e suportes de criação e circulação das diferentes linguagens',
  ]),
  c('etapa2','Linguagens','Artes','Processos de criação, circuitos artísticos, movimentos e diversidade.',[
    'Processos de criação e produção individual/coletiva nas artes visuais, dança, música e teatro',
    'Profissões, economia criativa, instituições, coletivos, ateliês, estúdios e espaços de circulação',
    'Movimentos e produções artísticas brasileiras, africanas, asiáticas, europeias e globais',
    'Matrizes estéticas e culturais, perspectivas e visões de mundo',
    'Estereótipos, invisibilização e representação de grupos minorizados nas artes',
  ]),
  c('etapa3','Linguagens','Artes','Arte contemporânea, tecnologia, cidadania e patrimônio.',[
    'Arte conceitual, instalações, performances, arte digital, arte urbana e intervenções',
    'Novas tecnologias, plataformas digitais, autoria, imagem, voz e ética no campo artístico',
    'Arte e cidadania: ações artístico-culturais e participação social',
    'Patrimônio material e imaterial, tradições, museus, circuitos, celebrações e comunidades',
    'Conservação, tombamento, pertencimento e valorização do patrimônio artístico-cultural',
  ]),

  c('etapa1','Linguagens','Educação Física','Cultura corporal de movimento em esportes, danças, exercícios, lutas e práticas corporais.',[
    'Esportes de marca, precisão, invasão e técnico-combinatórios',
    'Danças urbanas, populares, contemporâneas, quilombolas e dos povos originários',
    'Ginástica, exercícios, atividades físicas, capacidades físicas, saúde e qualidade de vida',
    'Práticas corporais, inclusão, cooperação, protagonismo e respeito à diversidade',
    'Corpo, mídia, padrões corporais e leitura crítica da cultura do movimento',
  ]),
  c('etapa2','Linguagens','Educação Física','Os objetos são comuns às três etapas; cresce a complexidade da análise e contextualização.',[
    'Classificação, regras, estratégias e dimensões sociais dos esportes',
    'Dança como linguagem cultural, identidade, criação coreográfica e combate ao preconceito',
    'Capacidades físicas, condicionamento, saúde, sedentarismo e qualidade de vida',
    'Práticas corporais em diferentes grupos sociais e contextos históricos',
    'Mídia, consumo, padrões de corpo, lazer e direito às práticas corporais',
  ]),
  c('etapa3','Linguagens','Educação Física','Síntese interdisciplinar dos objetos comuns às três etapas.',[
    'Esporte, saúde e sociedade: rendimento, participação, inclusão e ética',
    'Danças e identidades culturais; patrimônio corporal e diversidade',
    'Atividade física, capacidades físicas, saúde coletiva e estilos de vida',
    'Práticas corporais, lazer, espaço público e cidadania',
    'Corpo, tecnologia, mídia, consumo e discursos sobre saúde e beleza',
  ]),

  c('etapa1','Matemática','Matemática','Fundamentos algébricos, funções e geometria da 1ª série.',[
    'Números reais, divisibilidade, MMC/MDC, razão/proporção, cálculo algébrico, fatoração e notação científica',
    'Sistema Internacional, unidades, conversões, estimativa e imprecisão de medidas',
    'Áreas planas, triângulo retângulo, Pitágoras, relações métricas, seno/cosseno/tangente e proporcionalidade',
    'Conjuntos, intervalos, conceito de função, domínio/imagem, composição, inversa e leitura de gráficos',
    'Funções do 1º e 2º graus, inequações e sistemas; máximo/mínimo e modelagem',
    'Funções exponenciais e logarítmicas, equações, propriedades e gráficos',
  ]),
  c('etapa2','Matemática','Matemática','Matrizes, sequências, finanças, combinatória e probabilidade.',[
    'Matrizes, operações, transposta, inversa, determinantes e sistemas lineares; escalonamento e classificação',
    'Progressões aritméticas: termo geral, soma e relação com função afim',
    'Progressões geométricas: termo geral, somas/produtos e relação com função exponencial',
    'Matemática financeira: porcentagem, juros, valor presente/futuro, taxas, descontos e acréscimos sucessivos',
    'Análise combinatória: princípio fundamental, fatorial, permutações, arranjos e combinações',
    'Probabilidade simples, união, dependência/independência e probabilidade condicional',
  ]),
  c('etapa3','Matemática','Matemática','Estatística, trigonometria e geometrias espacial e analítica.',[
    'Estatística descritiva, gráficos, média/moda/mediana, amplitude, variância, desvio-padrão e amostragem',
    'Trigonometria no triângulo e ciclo; graus/radianos; funções seno/cosseno; leis dos senos e cossenos',
    'Congruência e semelhança de triângulos, isometrias e homotetias',
    'Geometria espacial: prismas, pirâmides, cones, cilindros, esfera, troncos, áreas, volumes e Cavalieri',
    'Geometria analítica: ponto, reta, distância, ponto médio, alinhamento, área de triângulo e equações da reta',
    'Circunferência e posições relativas entre pontos, retas e circunferências',
  ]),

  c('etapa1','Natureza','Biologia','Origem da vida, base química, célula e organização da vida.',[
    'Terra primitiva e hipótese de Oparin sobre origem da vida',
    'Água e biomoléculas orgânicas; importância biológica e estrutura dos seres vivos',
    'Características gerais dos seres vivos e níveis de organização',
    'Célula: estruturas, membranas, metabolismo e processos celulares',
    'Ecologia básica, relações entre organismos e ambiente e fluxo de matéria/energia',
  ]),
  c('etapa2','Natureza','Biologia','Genética, evolução e diversidade biológica.',[
    'Material genético, divisão celular, hereditariedade e expressão da informação genética',
    'Genética mendeliana e relações entre genótipo, fenótipo e ambiente',
    'Ideias de Lamarck e Darwin, seleção natural, adaptação e especiação',
    'Árvores filogenéticas e ancestralidade comum',
    'Microrganismos, algas, plantas e animais: diversidade, complexidade e interação ambiental',
  ]),
  c('etapa3','Natureza','Biologia','Fisiologia humana, imunidade, saúde e integração organismo-ambiente.',[
    'Saúde única, saúde pública, sistema imunológico e doenças infecciosas virais/parasitárias',
    'Sistema nervoso, sensório-motor, urinário e endócrino; homeostase',
    'Nutrição, digestão, circulação, respiração e integração fisiológica',
    'Reprodução, desenvolvimento, sexualidade e saúde',
    'Impactos ambientais e de substâncias sobre o organismo e a saúde coletiva',
  ]),

  c('etapa1','Natureza','Física','Medição, cinemática, dinâmica e hidrostática.',[
    'Grandezas físicas, Sistema Internacional, vetores e análise dimensional',
    'Referencial, posição, deslocamento, tempo, velocidade média/instantânea',
    'MRU, MRUV, queda livre e movimento circular',
    'Leis de Newton; peso, normal, atrito, resistência do ar e plano inclinado',
    'Pressão em sólidos e fluidos; Torricelli, Arquimedes, Pascal e Stevin',
  ]),
  c('etapa2','Natureza','Física','Energia, termologia, óptica e ondas.',[
    'Trabalho, energia cinética/potencial, energia mecânica e conservação',
    'Calor, temperatura, transmissão de calor, transformações gasosas e termodinâmica',
    'Máquinas térmicas, refrigeradores e ciclo de Carnot',
    'Óptica geométrica, reflexão, espelhos, refração, reflexão total, lentes e instrumentos ópticos',
    'Ondas: período, frequência, comprimento, velocidade, reflexão, refração, interferência, ressonância e som',
  ]),
  c('etapa3','Natureza','Física','Eletricidade, magnetismo e aplicações tecnológicas.',[
    'Carga elétrica, eletrização, Lei de Coulomb e campo elétrico',
    'Potencial, diferença de potencial, energia potencial elétrica e equipotenciais',
    'Corrente, resistência, Lei de Ohm, potência e circuitos elétricos',
    'Campo magnético, força magnética e indução eletromagnética',
    'Ondas eletromagnéticas, geração/transmissão de energia e aplicações tecnológicas',
  ]),

  c('etapa1','Natureza','Química','Matéria, estrutura, transformações e estequiometria inicial.',[
    'Propriedades da matéria, substâncias, misturas, separação e transformações físicas/químicas',
    'Modelos atômicos, estrutura do átomo, elementos e organização periódica',
    'Ligações químicas, interações e relação estrutura-propriedade',
    'Reações químicas: evidências e representação por equações',
    'Mol, massa molar, relações massa-quantidade de matéria e leis ponderais',
  ]),
  c('etapa2','Natureza','Química','Soluções, energia, cinética e equilíbrio.',[
    'Soluções, soluto/solvente, saturação, solubilidade e concentração em g/L, mol/L e porcentagem',
    'Diluição e propriedades coligativas: tonoscopia, crioscopia, ebulioscopia e osmose',
    'Termoquímica: calor de reação, entalpia e processos endo/exotérmicos',
    'Cinética química e fatores que alteram a velocidade das reações',
    'Equilíbrio químico, Le Chatelier, constante de equilíbrio, neutralização, pH e pOH',
  ]),
  c('etapa3','Natureza','Química','Eletroquímica e química orgânica.',[
    'NOX, oxidantes/redutores, reações redox e potencial padrão de redução',
    'Pilhas, baterias e células galvânicas; sentido dos elétrons',
    'Eletrólise aquosa/ígnea e corrosão de metais',
    'Carbono, cadeias, fórmulas, funções orgânicas e nomenclatura essencial',
    'Propriedades, reações e aplicações de compostos orgânicos em sociedade e ambiente',
  ]),

  c('etapa1','Humanas','Filosofia','Introdução ao filosofar, áreas e lógica.',[
    'Contextos de surgimento da Filosofia e problematização da narrativa de origem exclusivamente ocidental',
    'Epistemologia, ética, estética, filosofia política e lógica',
    'Atitude filosófica, espanto, formulação de perguntas e argumentação',
    'Diferenças entre conhecimento filosófico, religioso, científico e senso comum',
    'Argumento, validade, falsidade e falácia',
  ]),
  c('etapa2','Humanas','Filosofia','Ética, bioética e filosofia política.',[
    'Aristóteles: virtude, mediania e eudaimonia',
    'Kant: ética do dever; Bentham e Mill: utilitarismo; Nietzsche: crítica à moral tradicional',
    'Ética aplicada: bioética, ética biomédica, ambiental e animal',
    'Platão e justiça; Aristóteles e equidade; Maquiavel e autonomia da política',
    'Estado, poder, justiça, liberdade, igualdade e problemas políticos modernos',
  ]),
  c('etapa3','Humanas','Filosofia','Epistemologia moderna, estética e filosofia da ciência.',[
    'Modernidade, Humanismo, Renascimento, Revolução Científica e Iluminismo',
    'Empirismo de Locke/Hume, racionalismo de Descartes e criticismo de Kant',
    'Epistemologias do Sul, diversidade cultural, povos indígenas, identidade e cuidado com a terra',
    'Estética, arte, cultura e indústria cultural em Adorno e Horkheimer',
    'Filosofia da ciência: demarcação, Popper, falsificabilidade, Kuhn, paradigma e revolução científica',
  ]),

  c('etapa1','Humanas','Geografia','Natureza, cartografia e relações sociedade-espaço.',[
    'Geologia, relevo, dinâmica interna/externa da Terra e riscos naturais',
    'Climatologia: tempo, clima, fatores/elementos, extremos e mudanças climáticas',
    'Clima, vegetação, solos, domínios morfoclimáticos e impactos socioambientais',
    'Recursos naturais, energia, tecnologia e relação natureza-sociedade',
    'Mapas temáticos, gráficos, fotografias, charges, anamorfoses e leitura do espaço geográfico',
  ]),
  c('etapa2','Humanas','Geografia','População, industrialização, urbanização e organização econômica.',[
    'População, migrações, demografia, diversidade e qualidade de vida',
    'Divisão internacional do trabalho, revoluções industriais e cadeias produtivas globais',
    'Tecnologia, fluxos de mercadorias/informações, precarização e desigualdades no trabalho',
    'Industrialização brasileira, urbanização mundial/brasileira, direito à cidade e segregação socioespacial',
    'Impactos socioambientais urbanos, desigualdades sociais, raciais e de gênero',
  ]),
  c('etapa3','Humanas','Geografia','Geopolítica, globalização, territórios e redes.',[
    'Bipolaridade, unipolaridade e multipolaridade; globalização',
    'Territórios estratégicos, focos de tensão e zonas de conflito',
    'Blocos econômicos e parcerias na América Latina, África e Ásia',
    'Formação territorial e regionalizações brasileiras',
    'Redes, fluxos, fronteiras, geopolítica contemporânea e leitura cartográfica crítica',
  ]),

  c('etapa1','Humanas','História','Tempo histórico, fontes, identidades e sociedades antigas/medievais em perspectiva crítica.',[
    'Eventos históricos, permanências/transformações, semelhanças/diferenças e concepções de tempo',
    'Fontes escritas, iconográficas, cartográficas, materiais, arqueológicas e digitais',
    'Memória, cultura, identidades e relações de poder',
    'Crítica a dicotomias como civilizado/bárbaro, cultura/natureza, colonizador/colonizado e história/pré-história',
    'Trabalho, Estado, cidadania, democracia, ambiente, migrações e culturas afrodescendentes/indígenas em longa duração',
  ]),
  c('etapa2','Humanas','História','Mundo moderno, América portuguesa, independências e Brasil imperial.',[
    'Colonização portuguesa na América: política, economia, sociedade e território',
    'Trabalho, escravidão, resistências e relações étnico-raciais',
    'Transferência da Corte, Independência do Brasil e formação dos Estados latino-americanos',
    'Iluminismo, revoluções modernas e Revolução Industrial',
    'Brasil monárquico, crise da monarquia, abolição e pós-abolição',
  ]),
  c('etapa3','Humanas','História','República, mundo contemporâneo, conflitos, direitos e transformações sociais.',[
    'República brasileira, cidadania, autoritarismos, democracia e movimentos sociais',
    'Imperialismos, guerras mundiais, revoluções e Guerra Fria',
    'Descolonização, direitos humanos, relações raciais, gênero e identidades',
    'Trabalho e tecnologia no capitalismo contemporâneo; migrações e globalização',
    'Memória, patrimônio, usos públicos do passado e análise crítica de fontes contemporâneas',
  ]),

  c('etapa1','Humanas','Sociologia','Fundamentos da Sociologia, socialização e desigualdade.',[
    'Contextos de surgimento da Sociologia e leitura crítica da realidade',
    'Estranhamento e desnaturalização de valores, estilos de vida e condutas',
    'Conhecimento sociológico, ciência e senso comum',
    'Desigualdades e seus mecanismos de produção/reprodução',
    'Socialização e instituições: família, escola, trabalho, mídias e religião; indivíduo, agência e estrutura',
  ]),
  c('etapa2','Humanas','Sociologia','Trabalho, cidade/campo, movimentos sociais e desigualdades.',[
    'Industrialização e impactos socioculturais/econômicos',
    'Uso e ocupação do campo e da cidade; agentes, disputas e políticas de Estado',
    'Movimentos sociais urbanos/rurais, de classe e trabalhistas',
    'Modernização, precarização e transformações do trabalho no século XXI',
    'Raça, gênero, classe e geração na estrutura das desigualdades e do trabalho',
  ]),
  c('etapa3','Humanas','Sociologia','Poder, cultura, política e questões sociais contemporâneas.',[
    'Estado, poder, democracia, participação, cidadania e instituições políticas',
    'Cultura, identidade, diferença, indústria cultural e mídias',
    'Estratificação, mobilidade e desigualdades interseccionais',
    'Globalização, redes, tecnologia, consumo e transformações da vida social',
    'Movimentos sociais, direitos, conflitos e ação coletiva contemporânea',
  ]),
];

const q=(id:string,stage:SeriadoStage,area:SeriadoArea,component:string,topic:string,prompt:string,options:[string,string,string,string],answer:number,explanation:string):SeriadoYearQuestion=>({id,stage,area,component,topic,prompt,options,answer,explanation});

export const UFMG_YEAR_QUESTIONS:SeriadoYearQuestion[]=[
  q('p1-1','etapa1','Linguagens','Língua Portuguesa e Literaturas','Leitura e fato/opinião','Em uma notícia, a frase “a medida é a melhor solução possível” deve ser reconhecida principalmente como',['fato verificável','opinião/avaliação','dado estatístico','citação indireta'],1,'“Melhor” expressa julgamento de valor, não um fato verificável por si só.'),
  q('p1-2','etapa1','Linguagens','Língua Portuguesa e Literaturas','Coesão','Em “A escola criou uma horta. Essa iniciativa aproximou as turmas”, “Essa iniciativa”',['antecipa a horta','retoma a ação anterior','introduz oposição','indica causa externa'],1,'O demonstrativo retoma “criou uma horta” e constrói coesão referencial.'),
  q('p2-1','etapa2','Linguagens','Língua Portuguesa e Literaturas','Argumentação','Um texto afirma uma tese e em seguida apresenta um caso concreto que a sustenta. O caso funciona como',['contra-argumento','argumento por exemplificação','digressão','marcador temporal'],1,'O exemplo concretiza e sustenta a tese.'),
  q('p2-2','etapa2','Linguagens','Língua Portuguesa e Literaturas','Variação linguística','Classificar uma variedade regional como “português errado” ignora',['a existência de regras apenas na escrita','a variação linguística e a adequação aos contextos','a impossibilidade de mudança histórica','a equivalência entre toda situação de fala'],1,'Variedades possuem regularidades; adequação e contexto são centrais para uma análise não preconceituosa.'),
  q('p3-1','etapa3','Linguagens','Língua Portuguesa e Literaturas','Figuras de linguagem','Em “a cidade acordou irritada”, há',['metonímia','personificação','eufemismo','onomatopeia'],1,'Atribui-se à cidade uma ação/estado humano.'),
  q('p3-2','etapa3','Linguagens','Língua Portuguesa e Literaturas','Vírgula','A vírgula é obrigatória em “Quando a aula terminou os estudantes saíram” para',['separar sujeito e verbo','isolar a oração adverbial anteposta','marcar vocativo','separar verbo e complemento'],1,'A oração adverbial temporal anteposta deve ser separada por vírgula.'),

  q('i1-1','etapa1','Linguagens','Língua Inglesa','Purpose','A sign says “Please keep this door closed to save energy.” Its main purpose is to',['entertain visitors','give an instruction with a reason','sell a product','report a past event'],1,'The imperative gives an instruction and “to save energy” explains why.'),
  q('i1-2','etapa1','Linguagens','Língua Inglesa','Inference','“The streets are wet, but the sky is clear now.” It is reasonable to infer that',['it may have rained earlier','it will never rain again','the streets were painted','the sentence is a command'],0,'Wet streets plus a clear sky “now” supports a prior-rain inference.'),
  q('i2-1','etapa2','Linguagens','Língua Inglesa','Modal verbs','In “Governments must protect vulnerable groups”, “must” expresses',['possibility','obligation','past habit','comparison'],1,'Must marks strong obligation.'),
  q('i2-2','etapa2','Linguagens','Língua Inglesa','Multimodality','An ad places a tiny disclaimer under a huge “FREE” headline. Critical reading should consider',['only the headline','how layout creates hierarchy and may reduce attention to conditions','that images never affect meaning','that font size is irrelevant'],1,'Visual hierarchy is part of multimodal meaning-making.'),
  q('i3-1','etapa3','Linguagens','Língua Inglesa','Digital literacy','A headline is designed mainly to provoke clicks and exaggerates what the article actually says. This is best described as',['collocation','clickbait','phrasal verb','passive voice'],1,'Clickbait uses sensational framing to attract clicks.'),
  q('i3-2','etapa3','Linguagens','Língua Inglesa','Source credibility','Before sharing a viral claim, the strongest first step is to',['count likes','check author, date, evidence and independent reliable sources','trust the comments','share it asking if it is true'],1,'Source, evidence and corroboration are core credibility checks.'),

  q('e1-1','etapa1','Linguagens','Língua Espanhola','Conectores','En “No fui a clase porque estaba enfermo”, “porque” introduce una relación de',['causa','oposición','comparación','concesión'],0,'“Porque” introduce la causa.'),
  q('e1-2','etapa1','Linguagens','Língua Espanhola','Inferencia','“Aunque llovía, salimos a caminar.” La oración indica que',['la lluvia impidió la salida','salieron a pesar de la lluvia','no había lluvia','la caminata causó la lluvia'],1,'“Aunque” marca concesión: la acción ocurre pese al obstáculo.'),
  q('e2-1','etapa2','Linguagens','Língua Espanhola','Variedades','Las diferencias entre “computadora”, “ordenador” y “computador” muestran principalmente',['errores gramaticales','variación regional del léxico','ausencia de significado','cambio de tiempo verbal'],1,'Son variantes léxicas usadas en distintas regiones.'),
  q('e2-2','etapa2','Linguagens','Língua Espanhola','Posicionamiento','Un editorial usa “es imprescindible” para presentar una medida. Esa expresión',['elimina todo punto de vista','marca una evaluación fuerte del autor','indica una fecha','solo describe un color'],1,'La construcción marca posicionamiento y necesidad.'),
  q('e3-1','etapa3','Linguagens','Língua Espanhola','Multimodalidad','En una infografía, flechas, colores y tamaños de letra',['no producen sentido','organizan información y orientan la lectura','solo decoran','sustituyen siempre el texto'],1,'Los recursos visuales construyen jerarquía y relaciones entre datos.'),
  q('e3-2','etapa3','Linguagens','Língua Espanhola','Cohesión','La correferencia permite',['evitar toda relación entre frases','retomar referentes y mantener continuidad textual','cambiar de idioma','eliminar conectores'],1,'La correferencia conecta menciones del mismo referente y favorece la cohesión.'),

  q('a1-1','etapa1','Linguagens','Artes','Música','Duas notas com mesma intensidade e duração, mas frequências diferentes, distinguem-se principalmente pela',['altura','textura visual','perspectiva','fluência corporal'],0,'Frequência está diretamente relacionada à altura do som.'),
  q('a1-2','etapa1','Linguagens','Artes','Artes Visuais','Em uma pintura, o uso sistemático de linhas convergentes para um ponto pode produzir sensação de',['profundidade','silêncio','timbre','peso corporal'],0,'Linhas convergentes podem construir perspectiva e profundidade.'),
  q('a2-1','etapa2','Linguagens','Artes','Circuitos artísticos','Um coletivo que cria obras em praça pública evidencia que a circulação da arte',['ocorre apenas em museus','pode ocupar espaços institucionais e não institucionais','depende de venda comercial','elimina a autoria'],1,'A matriz reconhece diversos espaços de criação e circulação.'),
  q('a2-2','etapa2','Linguagens','Artes','Representação','Questionar a ausência histórica de artistas negros em exposições permite discutir',['somente técnica de pintura','invisibilização e legitimação cultural','altura musical','regras esportivas'],1,'A etapa propõe problematizar invisibilizações e deslegitimações.'),
  q('a3-1','etapa3','Linguagens','Artes','Arte contemporânea','Uma instalação que depende da presença do público e do espaço em que é montada exemplifica',['arte contemporânea expandida','apenas retrato acadêmico','notação musical','dança esportiva'],0,'Instalações são linguagem importante da arte contemporânea e podem ser espaciais/interativas.'),
  q('a3-2','etapa3','Linguagens','Artes','Patrimônio','O tombamento de um bem cultural busca principalmente',['apagar usos sociais','reconhecer e proteger valor patrimonial','proibir qualquer estudo','transformá-lo automaticamente em propriedade privada'],1,'Tombamento é instrumento de proteção de bens reconhecidos como patrimônio.'),

  q('f1-1','etapa1','Linguagens','Educação Física','Esportes','Corrida de 100 m é classificada predominantemente como esporte de',['marca','invasão','precisão','técnico-combinatório'],0,'O resultado é comparado por uma marca mensurável, o tempo.'),
  q('f1-2','etapa1','Linguagens','Educação Física','Capacidades físicas','A capacidade associada a sustentar esforço por longo período é principalmente',['resistência','flexibilidade','coordenação fina','equilíbrio estático'],0,'Resistência relaciona-se à manutenção de esforço.'),
  q('f2-1','etapa2','Linguagens','Educação Física','Dança e cultura','Estudar uma dança quilombola no currículo escolar contribui para',['homogeneizar culturas','reconhecer repertórios corporais e identidades diversas','eliminar contexto histórico','tratar dança apenas como exercício'],1,'A dança é linguagem cultural e espaço de reconhecimento da diversidade.'),
  q('f2-2','etapa2','Linguagens','Educação Física','Saúde','Para avaliar saúde, atividade física e exercício físico devem ser diferenciados porque',['são sempre sinônimos','exercício costuma ser planejado/estruturado, enquanto atividade física é conceito mais amplo','atividade física só ocorre em academia','exercício não envolve movimento'],1,'Exercício é uma forma planejada e estruturada de atividade física.'),
  q('f3-1','etapa3','Linguagens','Educação Física','Mídia e corpo','Uma campanha que associa um único padrão corporal a “saúde perfeita” deve ser analisada criticamente porque',['saúde é multidimensional e corpos são diversos','todo corpo deve ter a mesma composição','imagens não influenciam percepções','saúde depende apenas de aparência'],0,'Saúde não se reduz à aparência nem a um padrão corporal único.'),
  q('f3-2','etapa3','Linguagens','Educação Física','Cidadania','Garantir quadras e parques acessíveis em diferentes bairros relaciona práticas corporais ao',['direito ao lazer e ao espaço público','fim da atividade física','treino de alto rendimento apenas','consumo obrigatório'],0,'Acesso equitativo a espaços de lazer e prática corporal é questão de cidadania.'),

  q('m1-1','etapa1','Matemática','Matemática','Função quadrática','A função f(x)=x²-6x+5 atinge seu valor mínimo em x igual a',['-3','3','5','6'],1,'O x do vértice é -b/(2a)=6/2=3.'),
  q('m1-2','etapa1','Matemática','Matemática','Exponencial','Uma população dobra a cada período e começa com 200 indivíduos. Após 3 períodos terá',['600','800','1200','1600'],3,'200·2³=1600.'),
  q('m2-1','etapa2','Matemática','Matemática','PA','Em uma PA de primeiro termo 4 e razão 3, o quinto termo é',['12','15','16','19'],2,'a5=4+(5-1)·3=16.'),
  q('m2-2','etapa2','Matemática','Matemática','Probabilidade','Ao lançar duas moedas justas, a probabilidade de obter exatamente uma cara é',['1/4','1/2','3/4','1'],1,'Há 2 casos favoráveis em 4 equiprováveis: cara-coroa e coroa-cara.'),
  q('m3-1','etapa3','Matemática','Matemática','Estatística','Para os valores 2,4,4,10, a mediana é',['3','4','5','10'],1,'Com quatro valores, a mediana é a média dos dois centrais: (4+4)/2=4.'),
  q('m3-2','etapa3','Matemática','Matemática','Geometria analítica','A distância entre (0,0) e (3,4) é',['4','5','6','7'],1,'Pelo teorema de Pitágoras, √(3²+4²)=5.'),

  q('b1-1','etapa1','Natureza','Biologia','Biomoléculas','A molécula que constitui o principal solvente das reações celulares é',['água','DNA','colesterol','glicogênio'],0,'A água é o principal solvente biológico e meio de muitas reações.'),
  q('b1-2','etapa1','Natureza','Biologia','Origem da vida','A hipótese de Oparin propõe, em linhas gerais, que',['vida surgiu por geração espontânea atual','moléculas orgânicas puderam formar-se e organizar-se gradualmente na Terra primitiva','primeiros seres eram mamíferos','DNA surgiu pronto fora da Terra'],1,'Oparin propôs evolução química gradual em condições primitivas.'),
  q('b2-1','etapa2','Natureza','Biologia','Evolução','Na seleção natural, uma característica tende a aumentar de frequência quando',['é adquirida por esforço e herdada','favorece sucesso reprodutivo em certo ambiente e é herdável','é sempre maior fisicamente','surge porque a espécie precisa'],1,'Seleção atua sobre variação herdável associada a diferenças de sobrevivência/reprodução.'),
  q('b2-2','etapa2','Natureza','Biologia','Filogenia','Em uma árvore filogenética, dois grupos com ancestral comum mais recente são considerados',['mais próximos evolutivamente','obrigatoriamente idênticos','sem relação histórica','mais antigos'],0,'Proximidade filogenética é inferida pelo ancestral comum mais recente.'),
  q('b3-1','etapa3','Natureza','Biologia','Imunologia','Vacinas contribuem para proteção porque',['substituem todos os leucócitos','estimulam memória imunológica específica','eliminam qualquer microrganismo instantaneamente','impedem mutações'],1,'A vacinação favorece resposta adaptativa e células de memória.'),
  q('b3-2','etapa3','Natureza','Biologia','Homeostase','A liberação de insulina após aumento da glicemia é exemplo de',['regulação homeostática','especiação','osmose apenas','mutação induzida'],0,'A resposta hormonal ajuda a manter a glicemia em faixa fisiológica.'),

  q('fi1-1','etapa1','Natureza','Física','Cinemática','Um carro percorre 120 km em 2 h. Sua velocidade média é',['30 km/h','60 km/h','120 km/h','240 km/h'],1,'v=Δs/Δt=120/2=60 km/h.'),
  q('fi1-2','etapa1','Natureza','Física','Empuxo','Um corpo imerso em líquido sofre empuxo igual ao',['peso do fluido deslocado','peso do recipiente','volume do corpo em newtons','dobro da pressão atmosférica'],0,'É o princípio de Arquimedes.'),
  q('fi2-1','etapa2','Natureza','Física','Energia','Sem atrito, na queda de um corpo a energia potencial gravitacional',['converte-se em cinética mantendo a energia mecânica','desaparece','vira massa','aumenta junto com a altura'],0,'Na ausência de dissipação, a energia mecânica se conserva.'),
  q('fi2-2','etapa2','Natureza','Física','Ondas','Se a velocidade de uma onda é 20 m/s e a frequência 5 Hz, o comprimento de onda é',['2 m','4 m','5 m','100 m'],1,'λ=v/f=20/5=4 m.'),
  q('fi3-1','etapa3','Natureza','Física','Lei de Ohm','Um resistor de 10 Ω submetido a 20 V conduz corrente de',['0,5 A','2 A','10 A','200 A'],1,'I=V/R=20/10=2 A.'),
  q('fi3-2','etapa3','Natureza','Física','Eletricidade','Em uma pilha funcionando como fonte, a energia transformada em energia elétrica é originalmente principalmente',['química','nuclear','gravitacional','sonora'],0,'Pilhas convertem energia de reações químicas em energia elétrica.'),

  q('q1-1','etapa1','Natureza','Química','Mol','A massa molar da água H₂O, usando H=1 e O=16 g/mol, é',['16','17','18','32'],2,'2·1+16=18 g/mol.'),
  q('q1-2','etapa1','Natureza','Química','Transformações','Qual é uma evidência típica de reação química?',['mudança de recipiente','formação de gás ou precipitado em contexto compatível','dividir um sólido ao meio','medir a massa'],1,'Formação de novas substâncias pode vir acompanhada de gás, precipitado, mudança de cor etc.'),
  q('q2-1','etapa2','Natureza','Química','Concentração','Uma solução com 20 g de soluto em 2 L tem concentração de',['5 g/L','10 g/L','20 g/L','40 g/L'],1,'C=m/V=20/2=10 g/L.'),
  q('q2-2','etapa2','Natureza','Química','Equilíbrio','Em um equilíbrio gasoso exotérmico, aumentar a temperatura tende a favorecer',['o sentido endotérmico','sempre os produtos','nenhum sentido','apenas a pressão'],0,'Pelo princípio de Le Chatelier, calor adicional favorece o sentido que o consome.'),
  q('q3-1','etapa3','Natureza','Química','Redox','Oxidação corresponde, de modo geral, a',['ganho de elétrons','perda de elétrons','ganho obrigatório de prótons','ausência de mudança de NOX'],1,'Oxidação é perda de elétrons e aumento do NOX.'),
  q('q3-2','etapa3','Natureza','Química','Funções orgânicas','O grupo –OH ligado a carbono saturado caracteriza, em regra, a função',['álcool','cetona','amina','éster'],0,'Álcoois possuem hidroxila ligada a carbono saturado.'),

  q('fl1-1','etapa1','Humanas','Filosofia','Lógica','Um argumento pode ser válido mesmo que',['suas premissas sejam falsas, desde que a conclusão decorra logicamente delas','não tenha conclusão','seja uma pergunta','contenha apenas opinião sem relação'],0,'Validade diz respeito à relação lógica entre premissas e conclusão, não à verdade factual das premissas.'),
  q('fl1-2','etapa1','Humanas','Filosofia','Conhecimento','A atitude filosófica caracteriza-se por',['evitar perguntas','problematizar pressupostos e formular razões','aceitar toda tradição sem exame','substituir ciência por opinião'],1,'Filosofar envolve questionar, conceituar e argumentar.'),
  q('fl2-1','etapa2','Humanas','Filosofia','Ética','Para Kant, o valor moral de uma ação está fortemente ligado a agir',['por dever e segundo princípio universalizável','apenas por prazer','segundo consequências úteis apenas','por tradição local'],0,'A ética kantiana é deontológica e valoriza o dever.'),
  q('fl2-2','etapa2','Humanas','Filosofia','Utilitarismo','Uma decisão utilitarista clássica tende a avaliar principalmente',['as consequências para o bem-estar agregado','a origem aristocrática do agente','a beleza da ação','a antiguidade da regra'],0,'Bentham e Mill avaliam consequências em termos de utilidade/bem-estar.'),
  q('fl3-1','etapa3','Humanas','Filosofia','Popper','Para Popper, uma teoria científica deve ser, em princípio',['imune a testes','falseável por observações possíveis','baseada apenas em autoridade','incapaz de gerar previsões'],1,'Falseabilidade é critério central de demarcação em Popper.'),
  q('fl3-2','etapa3','Humanas','Filosofia','Kuhn','Uma “revolução científica” em Kuhn envolve',['mudança de paradigma','simples acúmulo sem conflito','abandono de evidências','fim da comunidade científica'],0,'Revoluções científicas reorganizam o campo em torno de novo paradigma.'),

  q('g1-1','etapa1','Humanas','Geografia','Clima','Tempo atmosférico difere de clima porque o clima',['é o estado de poucas horas','corresponde a padrões e médias observados por períodos longos','não varia espacialmente','é sinônimo de temperatura'],1,'Clima envolve padrões de longo prazo; tempo é condição momentânea.'),
  q('g1-2','etapa1','Humanas','Geografia','Cartografia','Uma anamorfose altera áreas no mapa para',['representar proporcionalmente uma variável temática','manter sempre a área real','mostrar apenas altitude','eliminar a legenda'],0,'Anamorfoses deformam áreas conforme uma variável escolhida.'),
  q('g2-1','etapa2','Humanas','Geografia','Urbanização','A impermeabilização intensa do solo urbano tende a',['aumentar infiltração','aumentar escoamento superficial e risco de alagamentos','eliminar ilhas de calor','reduzir ocupação urbana automaticamente'],1,'Menor infiltração aumenta o escoamento superficial.'),
  q('g2-2','etapa2','Humanas','Geografia','Trabalho','Cadeias produtivas globais caracterizam-se por',['produção concentrada necessariamente num único país','etapas de produção distribuídas por diferentes territórios e conectadas por fluxos','ausência de transporte','fim da divisão internacional do trabalho'],1,'A produção pode ser fragmentada espacialmente e articulada em redes globais.'),
  q('g3-1','etapa3','Humanas','Geografia','Geopolítica','Bipolaridade na Guerra Fria refere-se principalmente à',['organização do poder global em torno de dois grandes blocos','existência de duas cidades','fim de alianças militares','ausência de conflitos indiretos'],0,'EUA e URSS lideravam blocos concorrentes.'),
  q('g3-2','etapa3','Humanas','Geografia','Globalização','A globalização contemporânea combina',['redução de todos os fluxos','intensificação de fluxos com desigualdades e seletividade territorial','fim das fronteiras políticas','igualdade econômica automática'],1,'Fluxos se intensificam, mas de modo desigual e seletivo.'),

  q('h1-1','etapa1','Humanas','História','Fontes','Uma fotografia histórica deve ser analisada como',['registro neutro e completo','fonte produzida em contexto, com enquadramento, autoria e finalidade','prova que dispensa outras fontes','imagem sem escolhas'],1,'Fontes visuais também são produzidas sob escolhas e contextos.'),
  q('h1-2','etapa1','Humanas','História','Tempo histórico','Identificar permanências e transformações permite',['comparar processos ao longo do tempo sem assumir mudança total','ignorar diferenças','tratar todo evento como idêntico','eliminar contexto'],0,'A análise histórica combina mudança e continuidade.'),
  q('h2-1','etapa2','Humanas','História','Brasil colonial','A escravidão na América portuguesa foi acompanhada por',['ausência total de resistência','múltiplas formas de resistência, negociação e fuga','trabalho apenas assalariado','igualdade jurídica'],1,'A experiência escravista incluiu diversas formas de resistência.'),
  q('h2-2','etapa2','Humanas','História','Revolução Industrial','Uma transformação associada à industrialização foi',['expansão da produção mecanizada e novas relações de trabalho','fim das cidades','desaparecimento do mercado','retorno geral ao feudalismo'],0,'Industrialização ampliou mecanização, fábricas e mudanças laborais/urbanas.'),
  q('h3-1','etapa3','Humanas','História','Guerra Fria','A Guerra Fria foi marcada por',['competição política, militar, tecnológica e ideológica entre blocos','aliança permanente EUA-URSS','ausência de guerras por procuração','fim da corrida espacial'],0,'A disputa ocorreu em várias dimensões e incluiu conflitos indiretos.'),
  q('h3-2','etapa3','Humanas','História','Memória','Disputas sobre monumentos públicos mostram que a memória coletiva',['é fixa e consensual','pode ser objeto de conflito sobre quais passados são valorizados','não tem relação com poder','é igual à prova documental'],1,'Memórias públicas são construídas e disputadas.'),

  q('s1-1','etapa1','Humanas','Sociologia','Socialização','Família e escola são importantes na socialização porque',['transmitem e negociam normas, valores e práticas sociais','eliminam toda autonomia','não têm relação com identidade','substituem todas as outras instituições'],0,'Socialização envolve aprendizagem e negociação de padrões sociais.'),
  q('s1-2','etapa1','Humanas','Sociologia','Estranhamento','“Estranhar” sociologicamente uma prática cotidiana significa',['considerá-la natural e imutável','questionar como ela foi socialmente construída','rejeitar qualquer dado','ignorar contexto'],1,'Estranhamento e desnaturalização ajudam a tornar o familiar objeto de análise.'),
  q('s2-1','etapa2','Humanas','Sociologia','Trabalho','A precarização do trabalho pode envolver',['maior estabilidade obrigatória','insegurança, baixa proteção e vínculos frágeis','eliminação de desigualdades','fim de plataformas digitais'],1,'Precarização está associada a insegurança e menor proteção em diversas configurações laborais.'),
  q('s2-2','etapa2','Humanas','Sociologia','Movimentos sociais','Movimentos sociais são relevantes porque podem',['articular demandas coletivas e disputar direitos/políticas','existir sem atores sociais','eliminar toda divergência','agir apenas fora da esfera pública'],0,'Eles organizam ação coletiva em torno de demandas, identidades e direitos.'),
  q('s3-1','etapa3','Humanas','Sociologia','Poder','Poder social não se reduz à coerção física porque',['também envolve instituições, normas, recursos e produção de legitimidade','só existe no Estado','não afeta decisões','é sempre visível'],0,'Poder pode operar por recursos, regras, autoridade, discursos e instituições.'),
  q('s3-2','etapa3','Humanas','Sociologia','Desigualdade','Uma análise interseccional busca compreender',['apenas renda','como diferentes marcadores, como raça, gênero e classe, podem se combinar','somente escolhas individuais','a eliminação das instituições'],1,'Interseccionalidade observa a articulação entre múltiplos eixos de desigualdade.'),
];

export const COMPONENT_ORDER=[
  'Língua Portuguesa e Literaturas','Língua Inglesa','Língua Espanhola','Artes','Educação Física','Matemática','Biologia','Física','Química','Filosofia','Geografia','História','Sociologia'
] as const;
