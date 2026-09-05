import type { ExamId } from '@/lib/exam-models';

export type DifficultyLevel = 1 | 2 | 3;
export type DifficultySelection = Record<string, DifficultyLevel>;
export type SkillSubject = { subject:string; area:string; topics:string[] };
export type ExamSkillCatalog = { examId:ExamId; label:string; sourceLabel:string; sourceUrl:string; subjects:SkillSubject[] };

const ENEM:SkillSubject[]=[
 {subject:'Língua Portuguesa e interpretação',area:'Linguagens',topics:['Interpretação, inferência e finalidade do texto','Gêneros e tipologias textuais','Coesão, coerência e progressão temática','Variação linguística e norma-padrão','Funções da linguagem e efeitos de sentido','Argumentação, tese e estratégias persuasivas','Semântica, figuras de linguagem e intertextualidade','Textos multimodais, publicidade, charges e tirinhas']},
 {subject:'Literatura e artes',area:'Linguagens',topics:['Movimentos e estilos literários','Leitura e análise de poesia','Narrativa, narrador, personagens e foco narrativo','Relações entre literatura, sociedade e história','Artes visuais, música, teatro e dança','Patrimônio cultural e diversidade artística']},
 {subject:'Língua estrangeira',area:'Linguagens',topics:['Leitura e compreensão global','Vocabulário em contexto','Inferência e intenção comunicativa','Aspectos culturais e usos sociais da língua']},
 {subject:'Educação Física e cultura corporal',area:'Linguagens',topics:['Esporte, saúde e qualidade de vida','Corpo, identidade e padrões sociais','Práticas corporais e cultura']},
 {subject:'História',area:'Humanas',topics:['Brasil Colônia e escravidão','Brasil Império','República, Era Vargas e ditadura','Democratização e cidadania no Brasil','Antiguidade e mundo medieval','Estados modernos, revoluções e industrialização','Imperialismo, guerras mundiais e Guerra Fria','Movimentos sociais, direitos e memória']},
 {subject:'Geografia',area:'Humanas',topics:['Cartografia e leitura espacial','Geopolítica e relações internacionais','Globalização e redes','Urbanização e problemas urbanos','População, migrações e demografia','Agropecuária e espaço agrário','Indústria, energia e infraestrutura','Clima, relevo, biomas e recursos naturais','Questões ambientais e sustentabilidade']},
 {subject:'Filosofia',area:'Humanas',topics:['Ética e filosofia moral','Filosofia política e poder','Teoria do conhecimento','Filosofia antiga','Filosofia moderna','Filosofia contemporânea']},
 {subject:'Sociologia',area:'Humanas',topics:['Cultura e identidade','Trabalho e estratificação social','Poder, Estado e cidadania','Movimentos sociais','Desigualdade, raça e gênero','Mídia, tecnologia e sociedade']},
 {subject:'Biologia',area:'Natureza',topics:['Citologia e metabolismo celular','Genética e biologia molecular','Evolução','Ecologia e ciclos biogeoquímicos','Fisiologia humana','Botânica','Zoologia','Microbiologia, imunologia e doenças','Biotecnologia e engenharia genética']},
 {subject:'Química',area:'Natureza',topics:['Estrutura atômica e tabela periódica','Ligações e forças intermoleculares','Estequiometria','Soluções e concentração','Termoquímica','Cinética e equilíbrio químico','Ácidos, bases e pH','Eletroquímica','Química orgânica','Química ambiental']},
 {subject:'Física',area:'Natureza',topics:['Cinemática','Dinâmica e leis de Newton','Trabalho, energia e potência','Impulso e quantidade de movimento','Gravitação e hidrostática','Termologia e termodinâmica','Ondulatória e acústica','Óptica','Eletrostática','Circuitos elétricos e eletrodinâmica','Magnetismo e indução']},
 {subject:'Matemática',area:'Matemática',topics:['Razão, proporção, porcentagem e regra de três','Matemática financeira','Funções afim, quadrática, exponencial e logarítmica','Equações, inequações e sistemas','Sequências e progressões','Geometria plana','Geometria espacial','Geometria analítica','Trigonometria','Estatística e leitura de gráficos','Probabilidade','Análise combinatória']},
 {subject:'Redação',area:'Redação',topics:['Compreensão do tema e repertório sociocultural','Tese e projeto de texto','Desenvolvimento de argumentos','Coesão e articulação entre parágrafos','Norma-padrão e precisão linguística','Proposta de intervenção completa e detalhada']},
];

const FUVEST:SkillSubject[]=[
 {subject:'Português',area:'Português',topics:['Interpretação e análise de textos','Gramática aplicada ao texto','Sintaxe e relações entre orações','Semântica e efeitos de sentido','Gêneros discursivos e argumentação','Produção escrita e organização textual']},
 {subject:'Literatura',area:'Português',topics:['Leituras obrigatórias FUVEST 2027','Análise de prosa','Análise de poesia','Intertextualidade e contexto histórico-literário','Recursos estilísticos e construção de sentido']},
 {subject:'Redação',area:'Redação',topics:['Leitura da coletânea','Recorte temático e tese','Argumentação autoral','Estrutura e progressão','Coesão e domínio da escrita formal']},
 {subject:'Matemática',area:'Matemática',topics:['Álgebra, equações e inequações','Funções e gráficos','Trigonometria','Geometria plana','Geometria espacial','Geometria analítica','Matrizes, sistemas e determinantes','Sequências','Combinatória e probabilidade','Estatística']},
 {subject:'Física',area:'Física',topics:['Mecânica','Gravitação e fluidos','Termologia e termodinâmica','Ondas e óptica','Eletricidade','Magnetismo e indução','Física moderna e interpretação experimental']},
 {subject:'Química',area:'Química',topics:['Estrutura da matéria','Estequiometria','Soluções','Termoquímica','Cinética','Equilíbrio, ácidos e bases','Eletroquímica','Química orgânica','Química ambiental e experimental']},
 {subject:'Biologia',area:'Biologia',topics:['Biologia celular','Genética','Evolução','Ecologia','Fisiologia humana','Botânica','Zoologia','Microbiologia e imunologia','Biotecnologia']},
 {subject:'História',area:'História',topics:['História do Brasil','América','Antiguidade e Medievo','Idade Moderna','Mundo contemporâneo','Cultura, trabalho e movimentos sociais']},
 {subject:'Geografia',area:'Geografia',topics:['Cartografia','Geografia física','População e urbanização','Espaço agrário','Indústria e redes','Geopolítica','Brasil e regionalização','Meio ambiente']},
 {subject:'Filosofia',area:'1ª fase',topics:['Ética','Política','Conhecimento e ciência','Filosofia antiga, moderna e contemporânea']},
 {subject:'Sociologia',area:'1ª fase',topics:['Cultura','Trabalho','Desigualdade','Estado e cidadania','Movimentos sociais']},
 {subject:'Inglês',area:'1ª fase',topics:['Leitura e interpretação','Vocabulário em contexto','Inferência e argumentação']},
];

const INSPER:SkillSubject[]=[
 {subject:'Língua Portuguesa',area:'Linguagens',topics:['Funcionamento social da língua, variação e registro','Morfologia e formação de palavras','Sintaxe, pontuação e relações de sentido','Coesão, coerência e progressão textual','Gêneros, intertextualidade e textos multimodais','Literatura brasileira, portuguesa, africana e indígena']},
 {subject:'Matemática: números e álgebra',area:'Matemática',topics:['Conjuntos numéricos, razão e proporcionalidade','Porcentagem e matemática financeira','Sequências e progressões','Equações, inequações e sistemas','Funções afim, quadrática, exponencial e logarítmica','Trigonometria e funções trigonométricas']},
 {subject:'Matemática: dados e espaço',area:'Matemática',topics:['Análise combinatória e princípios de contagem','Probabilidade simples e condicional','Geometria plana e semelhança','Geometria espacial e medidas','Estatística, boxplot, variância e desvio padrão','Leitura de tabelas, gráficos e algoritmos']},
 {subject:'Biologia',area:'Natureza',topics:['Citologia, metabolismo e divisão celular','Genética, biologia molecular e biotecnologia','Evolução e diversidade da vida','Ecologia, ciclos e impactos ambientais','Fisiologia, imunidade e saúde']},
 {subject:'Física',area:'Natureza',topics:['Cinemática, dinâmica e energia','Gravitação, fluidos e termodinâmica','Ondas, acústica e óptica','Eletricidade, circuitos e magnetismo','Física moderna e interpretação experimental']},
 {subject:'Química',area:'Natureza',topics:['Estrutura da matéria, ligações e propriedades','Estequiometria, gases e soluções','Termoquímica, cinética e equilíbrio','Ácidos, bases e eletroquímica','Química orgânica e ambiental']},
 {subject:'História',area:'Humanas',topics:['Brasil colonial, escravidão e independência','Brasil Império, República e cidadania','Revoluções, industrialização e imperialismo','Guerras mundiais, Guerra Fria e mundo contemporâneo']},
 {subject:'Geografia',area:'Humanas',topics:['Cartografia, território e leitura espacial','População, migrações e urbanização','Economia, redes, energia e espaço agrário','Geopolítica, globalização e relações internacionais','Clima, biomas, recursos e sustentabilidade']},
 {subject:'Sociologia',area:'Humanas',topics:['Cultura, identidade e socialização','Trabalho, desigualdade, raça e gênero','Poder, Estado, cidadania e movimentos sociais','Mídia, tecnologia e sociedade']},
 {subject:'Redação dissertativo-argumentativa',area:'Redação',topics:['Recorte do tema e tese explícita','Projeto de texto e progressão argumentativa','Argumentos, evidências e repertório produtivo','Coerência global e coesão entre partes','Norma-padrão, registro e precisão linguística','Revisão pelos quatro critérios oficiais do Insper']},
];

const CMMG_MED:SkillSubject[]=[
 {subject:'Língua Portuguesa',area:'Língua Portuguesa',topics:['Interpretação de textos','Semântica e efeitos de sentido','Morfossintaxe','Concordância, regência e crase','Coesão e coerência']},
 {subject:'Literatura',area:'Literatura',topics:['Obra literária obrigatória do processo vigente','Interpretação literária','Gêneros e recursos estilísticos','Contexto histórico-literário']},
 {subject:'Inglês',area:'Inglês',topics:['Compreensão textual','Vocabulário em contexto','Inferência','Estruturas linguísticas aplicadas à leitura']},
 {subject:'Biologia',area:'Biologia',topics:['Citologia','Genética e biologia molecular','Ecologia','Evolução','Fisiologia humana','Microbiologia e imunologia','Botânica e zoologia','Biotecnologia']},
 {subject:'Física',area:'Física',topics:['Mecânica','Energia','Termologia','Ondas e óptica','Eletricidade']},
 {subject:'Química',area:'Química',topics:['Estrutura da matéria','Estequiometria','Soluções','Termoquímica','Equilíbrio e pH','Eletroquímica','Química orgânica']},
 {subject:'Matemática',area:'Matemática',topics:['Aritmética e proporcionalidade','Álgebra e funções','Geometria','Trigonometria','Probabilidade e combinatória','Estatística']},
 {subject:'Redação',area:'Redação',topics:['Tema e repertório','Tese','Argumentação','Coesão','Norma-padrão']},
];

const CMMG_EFFPO:SkillSubject[]=[
 {subject:'Língua Portuguesa',area:'Linguagens',topics:['Interpretação','Gramática em contexto','Semântica','Coesão e argumentação']},
 {subject:'Literatura',area:'Linguagens',topics:['Obra literária obrigatória','Interpretação literária','Recursos estilísticos']},
 {subject:'Biologia',area:'Biologia',topics:['Citologia','Genética','Ecologia','Evolução','Fisiologia humana','Microbiologia e imunologia']},
 {subject:'História',area:'Humanas',topics:['Brasil','Mundo moderno e contemporâneo','Cidadania e movimentos sociais']},
 {subject:'Geografia',area:'Humanas',topics:['Geopolítica','População e urbanização','Meio ambiente','Economia e território']},
 {subject:'Filosofia e Sociologia',area:'Humanas',topics:['Ética e política','Cultura e identidade','Trabalho e desigualdade','Cidadania']},
 {subject:'Redação',area:'Redação',topics:['Tema','Tese','Argumentação','Coesão','Norma-padrão']},
];

const LINK:SkillSubject[]=[
 {subject:'PREP: trajetória acadêmica',area:'Portfólio',topics:['Evidências de desempenho e curiosidade acadêmica','Seleção de projetos, iniciativas e experiências','Contexto, ação, resultado e aprendizado','Impacto demonstrado com métricas e evidências','Coerência entre trajetória, ambição e propósito']},
 {subject:'PREP: vídeo de apresentação',area:'Oral',topics:['Roteiro com gancho, evidência e fechamento','Storytelling pessoal sem respostas genéricas','Clareza, presença, ritmo e linguagem corporal','Autenticidade, concisão e gestão do tempo']},
 {subject:'SPRINT: matemática',area:'Matemática',topics:['Razão, proporção, porcentagem e taxas','Álgebra, equações e funções','Probabilidade e estatística aplicada','Leitura de tabelas, gráficos e indicadores','Estimativas, lógica e resolução sob tempo']},
 {subject:'SPRINT: business case',area:'Business Case',topics:['Definição do problema e separação entre causa e sintoma','Hipóteses, árvore de problemas e priorização','Cliente, mercado, concorrência e posicionamento','Receita, custos, margem e unit economics','Análise de dados, trade-offs e riscos','Criatividade com viabilidade e impacto','Experimentos, implementação e indicadores','Recomendação final baseada em evidências']},
 {subject:'SPRINT: entrega escrita',area:'Escrita',topics:['Síntese executiva e resposta ao comando','Estrutura lógica e progressão','Argumentação baseada em dados','Trade-offs, riscos e próximos passos','Clareza, precisão e revisão final']},
 {subject:'SPRINT: entrega em vídeo',area:'Oral',topics:['Pitch com problema, análise e recomendação','Seleção de dados para sustentar a decisão','Comunicação oral clara e persuasiva','Presença, ritmo e gestão do tempo','Resposta a objeções e defesa de escolhas']},
 {subject:'Entrevista de fit',area:'Entrevista',topics:['Motivação específica para a Link','Perguntas comportamentais no formato STAR','Liderança, iniciativa e trabalho em equipe','Fracasso, feedback, aprendizado e autoconhecimento','Ética, impacto e alinhamento com a missão','Prontidão para comunicação em inglês']},
];

export function getExamSkillCatalog(examId:ExamId, course?:string):ExamSkillCatalog{
 if(examId==='enem')return{examId,label:'Matriz ENEM 2026',sourceLabel:'Inep — Matrizes de Referência ENEM 2026',sourceUrl:'https://www.gov.br/inep/pt-br/centrais-de-conteudo/acervo-linha-editorial/publicacoes-institucionais/avaliacoes-e-exames-da-educacao-basica/matrizes-de-referencia-enem',subjects:ENEM};
 if(examId==='fuvest')return{examId,label:'Programa FUVEST 2027',sourceLabel:'FUVEST — Programa e Guia de Provas 2027',sourceUrl:'https://www.fuvest.br/vestibular-da-usp/',subjects:FUVEST};
 if(examId==='insper')return{examId,label:'Vestibular Insper 2027.1',sourceLabel:'Insper — Vestibular e conteúdos programáticos',sourceUrl:'https://www.insper.edu.br/pt/cursos/vestibular',subjects:INSPER};
 if(examId==='cmmg'){const effpo=['Enfermagem','Fisioterapia','Fonoaudiologia','Odontologia','Psicologia'].includes(course||'');return{examId,label:'Vestibular FCM-MG 2027.1',sourceLabel:'FCM-MG — Manual do Candidato e conteúdo programático',sourceUrl:'https://vestibular.cmmg.edu.br/',subjects:effpo?CMMG_EFFPO:CMMG_MED};}
 return{examId,label:'Jornada Link',sourceLabel:'Link School of Business — Jornada de admissão',sourceUrl:'https://lsb.edu.br/pt-br/adm',subjects:LINK};
}

export const topicKey=(subject:string,topic:string)=>`${subject}::${topic}`;
