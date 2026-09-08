export type UFMGStudentYear = 1 | 2 | 3;
export type UFMGPersonalArea = 'Linguagens' | 'Matemática' | 'Natureza' | 'Humanas';

export type UFMGPersonalSubject = {
  id: string;
  label: string;
  area: UFMGPersonalArea;
  topicsByYear: Record<UFMGStudentYear, string[]>;
};

export const UFMG_YEAR_INFO: Record<UFMGStudentYear, {
  title: string;
  stage: string;
  cycle: string;
  officialFocus: string;
  exam: string;
  format: string;
  notice: string;
}> = {
  1: {
    title: '1º ano do Ensino Médio',
    stage: 'Etapa 1',
    cycle: 'Ciclo 2026–2028',
    officialFocus: 'Conteúdo relacionado ao aprendizado do 1º ano do Ensino Médio.',
    exam: '13 de dezembro de 2026',
    format: '45 objetivas + 1 questão discursiva interdisciplinar',
    notice: 'A prova de 2025 é a referência oficial mais recente e também era de Etapa 1.',
  },
  2: {
    title: '2º ano do Ensino Médio',
    stage: 'Etapa 2',
    cycle: 'Ciclo 2025–2027',
    officialFocus: 'Conteúdo predominantemente do 2º ano, de forma cumulativa: conhecimentos do 1º ano também continuam sendo considerados.',
    exam: '12 de dezembro de 2026',
    format: '45 objetivas + 1 ou 2 questões discursivas interdisciplinares',
    notice: 'Ainda não existe prova oficial de Etapa 2 aplicada: a primeira será em dezembro de 2026. A prova 2025 entra como revisão oficial da base cumulativa do 1º ano.',
  },
  3: {
    title: '3º ano / egresso',
    stage: 'Etapa 3',
    cycle: 'Conteúdo cumulativo',
    officialFocus: 'Conteúdo cumulativo dos três anos do Ensino Médio. No primeiro ciclo, a Etapa 3 será realizada em 2027.',
    exam: 'Etapa 3 do ciclo 2025–2027: 2027',
    format: 'Dia 1: 35 objetivas + redação • Dia 2: até 8 discursivas conforme o curso',
    notice: 'O Dia 2 depende do curso escolhido e terá uma ou duas áreas definidas pela UFMG.',
  },
};

export const UFMG_OFFICIAL_AREA_BLOCKS: Record<UFMGPersonalArea, { questions: string; count: number }> = {
  Linguagens: { questions: 'Questões 01–14', count: 14 },
  Matemática: { questions: 'Questões 15–23', count: 9 },
  Natureza: { questions: 'Questões 24–35', count: 12 },
  Humanas: { questions: 'Questões 36–45', count: 10 },
};

export const UFMG_PERSONAL_SUBJECTS: UFMGPersonalSubject[] = [
  {
    id: 'portugues', label: 'Português e Literatura', area: 'Linguagens',
    topicsByYear: {
      1: ['Leitura e inferência em diferentes gêneros', 'Coesão, tempos verbais e gramática em contexto', 'Variação linguística e efeitos de sentido', 'Narrativa, poesia e leitura das obras da Etapa 1'],
      2: ['Argumentação e leitura crítica', 'Intertextualidade, multissemiose e efeitos estilísticos', 'Análise linguística em textos mais complexos', 'Literatura em perspectiva histórica e social + obras da Etapa 2', 'Revisão cumulativa dos fundamentos da Etapa 1'],
      3: ['Síntese crítica e interpretação de alta complexidade', 'Literatura brasileira em perspectiva cumulativa', 'Argumentação, repertório e produção escrita', 'Revisão integrada das habilidades das Etapas 1 e 2'],
    },
  },
  {
    id: 'lingua-estrangeira', label: 'Inglês / Espanhol', area: 'Linguagens',
    topicsByYear: {
      1: ['Compreensão leitora', 'Informações explícitas e inferência', 'Gêneros e propósitos comunicativos', 'Vocabulário e pistas linguísticas/culturais'],
      2: ['Posicionamento crítico em práticas de linguagem', 'Multiletramentos e textos multimodais', 'Relações de poder e repertórios socioculturais', 'Análise discursiva + revisão das estratégias de leitura da Etapa 1'],
      3: ['Leitura autônoma de textos complexos', 'Análise crítica de discurso e interculturalidade', 'Uso acadêmico/social da língua', 'Integração cumulativa das estratégias das etapas anteriores'],
    },
  },
  {
    id: 'artes', label: 'Artes', area: 'Linguagens',
    topicsByYear: {
      1: ['Leitura de obras e linguagens artísticas', 'Elementos de artes visuais, música, teatro e dança', 'Contexto histórico e cultural', 'Relações com as obras obrigatórias da Etapa 1'],
      2: ['Análise crítica de processos artísticos', 'Produção, circulação e recepção da arte', 'Identidade, diversidade e memória', 'Relações interdisciplinares com as obras da Etapa 2', 'Retomada do repertório da Etapa 1'],
      3: ['Comparação entre linguagens e movimentos', 'Arte, política, tecnologia e sociedade', 'Leitura crítica cumulativa de repertórios', 'Integração com questões discursivas'],
    },
  },
  {
    id: 'educacao-fisica', label: 'Educação Física', area: 'Linguagens',
    topicsByYear: {
      1: ['Cultura corporal', 'Saúde e práticas corporais', 'Esporte, jogos, danças e inclusão', 'Corpo e qualidade de vida'],
      2: ['Leitura crítica do esporte e da mídia', 'Corpo, saúde e padrões sociais', 'Diversidade, inclusão e práticas corporais', 'Autonomia e participação social + revisão da Etapa 1'],
      3: ['Práticas corporais e cidadania', 'Saúde coletiva e cultura', 'Análise crítica de discursos sobre corpo e desempenho', 'Revisão cumulativa'],
    },
  },
  {
    id: 'matematica', label: 'Matemática', area: 'Matemática',
    topicsByYear: {
      1: ['Razão, proporção, porcentagem e escalas', 'Álgebra, equações e leitura de funções', 'Geometria, grandezas e medidas', 'Estatística, gráficos e probabilidade básica'],
      2: ['Modelagem com funções e relações algébricas', 'Geometria e trigonometria em problemas', 'Sequências, crescimento e matemática financeira', 'Estatística e probabilidade com interpretação', 'Revisão cumulativa dos fundamentos da Etapa 1'],
      3: ['Modelagem e funções em alta complexidade', 'Geometria analítica/espacial e trigonometria', 'Probabilidade, combinatória e estatística', 'Revisão cumulativa e estratégia de resolução'],
    },
  },
  {
    id: 'biologia', label: 'Biologia', area: 'Natureza',
    topicsByYear: {
      1: ['Organização da vida e citologia', 'Ecologia e relações ambientais', 'Saúde e funcionamento dos seres vivos', 'Leitura de dados, experimentos e evidências'],
      2: ['Genética, hereditariedade e variabilidade', 'Evolução e diversidade biológica', 'Fisiologia e regulação', 'Ecologia em maior integração', 'Revisão cumulativa de citologia e bases da Etapa 1'],
      3: ['Genética, evolução, ecologia e fisiologia integradas', 'Biotecnologia e saúde', 'Análise experimental e interpretação de evidências', 'Revisão cumulativa'],
    },
  },
  {
    id: 'fisica', label: 'Física', area: 'Natureza',
    topicsByYear: {
      1: ['Movimento, forças e energia', 'Grandezas, unidades e leitura de gráficos', 'Termologia e fenômenos cotidianos', 'Raciocínio experimental'],
      2: ['Ondas, óptica e fenômenos periódicos', 'Eletricidade e circuitos', 'Energia e conservação em sistemas', 'Modelagem matemática de situações físicas', 'Revisão cumulativa de mecânica da Etapa 1'],
      3: ['Mecânica, termologia, ondas e eletricidade integradas', 'Eletromagnetismo e aplicações', 'Modelagem e interpretação experimental', 'Revisão cumulativa'],
    },
  },
  {
    id: 'quimica', label: 'Química', area: 'Natureza',
    topicsByYear: {
      1: ['Matéria, estrutura e propriedades', 'Transformações químicas', 'Tabela periódica e ligações em contexto', 'Proporções, soluções e leitura experimental'],
      2: ['Estequiometria e relações quantitativas', 'Soluções, concentração e transformações', 'Termoquímica/cinética/equilíbrio em abordagem contextual', 'Química ambiental', 'Revisão cumulativa da estrutura da matéria da Etapa 1'],
      3: ['Química orgânica e transformações', 'Equilíbrio, eletroquímica e energia', 'Química ambiental e tecnológica', 'Revisão cumulativa e interpretação experimental'],
    },
  },
  {
    id: 'historia', label: 'História', area: 'Humanas',
    topicsByYear: {
      1: ['Tempo histórico e análise de fontes', 'Formações sociais e políticas', 'Mundos antigo, medieval e moderno em perspectiva crítica', 'Processos iniciais da formação do Brasil'],
      2: ['Estado, cidadania e transformações políticas', 'Revoluções, industrialização e mundo do trabalho', 'Brasil Império/República em articulação histórica', 'Relações de poder e desigualdade', 'Revisão cumulativa da Etapa 1'],
      3: ['Brasil e mundo contemporâneo', 'Democracia, autoritarismo e direitos', 'Conflitos, globalização e memória', 'Revisão cumulativa com análise de fontes'],
    },
  },
  {
    id: 'geografia', label: 'Geografia', area: 'Humanas',
    topicsByYear: {
      1: ['Cartografia e leitura espacial', 'Território, paisagem e lugar', 'População e dinâmica socioespacial', 'Ambiente, clima e recursos naturais'],
      2: ['Urbanização e redes', 'Economia, trabalho e industrialização', 'Questão agrária e uso do território', 'Geopolítica e fluxos', 'Revisão cumulativa de cartografia e ambiente'],
      3: ['Globalização e geopolítica', 'Brasil: território, economia e desigualdades', 'Crise climática e transição energética', 'Revisão cumulativa com mapas, gráficos e dados'],
    },
  },
  {
    id: 'filosofia', label: 'Filosofia', area: 'Humanas',
    topicsByYear: {
      1: ['Argumentação e construção do conhecimento', 'Ética e reflexão sobre a ação', 'Filosofia política introdutória', 'Leitura de conceitos e textos filosóficos'],
      2: ['Teorias do conhecimento e ciência', 'Ética aplicada e dilemas contemporâneos', 'Estado, liberdade, justiça e poder', 'Comparação de argumentos + revisão da Etapa 1'],
      3: ['Filosofia contemporânea', 'Ética, política e tecnologia', 'Análise de argumentos complexos', 'Revisão cumulativa'],
    },
  },
  {
    id: 'sociologia', label: 'Sociologia', area: 'Humanas',
    topicsByYear: {
      1: ['Cultura e socialização', 'Identidade e diversidade', 'Instituições sociais', 'Desigualdades e cidadania'],
      2: ['Trabalho, classes e estratificação', 'Poder, Estado e participação política', 'Movimentos sociais, raça, gênero e desigualdades', 'Mídia e sociedade + revisão da Etapa 1'],
      3: ['Globalização, tecnologia e transformações do trabalho', 'Democracia, direitos e conflitos sociais', 'Análise de dados e fenômenos sociais', 'Revisão cumulativa'],
    },
  },
];

export const UFMG_WORKS_BY_YEAR: Partial<Record<UFMGStudentYear, Array<{ title: string; creator: string; type: string }>>> = {
  1: [
    { title: 'O quinze', creator: 'Rachel de Queiroz', type: 'Livro' },
    { title: 'Ideias para adiar o fim do mundo', creator: 'Ailton Krenak', type: 'Livro' },
    { title: 'Txai', creator: 'Milton Nascimento', type: 'Álbum' },
  ],
  2: [
    { title: 'São Bernardo', creator: 'Graciliano Ramos', type: 'Livro' },
    { title: 'Sobrevivendo ao racismo: memórias, cartas e o cotidiano da discriminação no Brasil', creator: 'Luana Tolentino', type: 'Livro' },
    { title: 'Balé de pé no chão – a dança afro de Mercedes Baptista', creator: 'Lilian Solá Santiago e Marianna Monteiro', type: 'Documentário' },
  ],
};
