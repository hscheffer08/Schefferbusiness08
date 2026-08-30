import type { VocationalCourse, VocationalDimension } from '@/lib/vocational-data';

const base=(o:Partial<Record<VocationalDimension,number>>):Record<VocationalDimension,number>=>({realistic:30,investigative:35,artistic:25,social:30,enterprising:30,conventional:35,quantitative:35,health_biology:20,verbal_humanities:35,technology:25,people_contact:35,business:30,...o});
const c=(id:string,name:string,area:string,duration:string,summary:string,studies:string[],dayToDay:string[],environments:string[],attention:string,profile:Partial<Record<VocationalDimension,number>>):VocationalCourse=>({id,name,area,duration,summary,studies,dayToDay,environments,attention,profile:base(profile)});

export const EXTRA_VOCATIONAL_COURSES: VocationalCourse[] = [
  c("ciencias-biologicas","Ciências Biológicas","Ciências da Vida","4 anos","Estuda organismos, ecossistemas, genética, evolução e processos biológicos, com forte presença de laboratório e campo.",["Genética","ecologia","zoologia","botânica","biologia celular","evolução"],["realizar experimentos","analisar amostras","coletar dados em campo","interpretar evidências","produzir relatórios científicos"],["laboratórios","universidades","consultorias ambientais","biotecnologia","conservação"],"Pode exigir rotina de laboratório ou campo e, em várias carreiras, pós-graduação para especialização.",{investigative:96, health_biology:94, realistic:65, quantitative:62, conventional:58, technology:52}),
  c("quimica","Química","Ciências Exatas e Laboratório","4 anos","Investiga composição, propriedades e transformações da matéria, combinando teoria, cálculo e experimentação.",["Química orgânica","inorgânica","físico-química","analítica","laboratório","termodinâmica"],["planejar experimentos","operar instrumentos","analisar substâncias","validar resultados","documentar procedimentos"],["laboratórios","indústria","pesquisa","controle de qualidade","meio ambiente"],"Exige atenção rigorosa a segurança, precisão e forte base em química e matemática.",{investigative:97, quantitative:82, realistic:70, conventional:78, technology:58}),
  c("matematica","Matemática","Ciências Exatas","4 anos","Forma para raciocínio abstrato, demonstração, modelagem e resolução de problemas quantitativos complexos.",["Cálculo","álgebra linear","análise","geometria","probabilidade","equações diferenciais"],["resolver problemas abstratos","construir demonstrações","modelar sistemas","ensinar","analisar estruturas matemáticas"],["universidades","escolas","tecnologia","finanças","pesquisa"],"É um curso de alta abstração; gostar de matemática escolar ajuda, mas não substitui interesse por prova e teoria.",{investigative:96, quantitative:100, conventional:62, technology:58, verbal_humanities:42}),
  c("fisica","Física","Ciências Exatas","4 anos","Estuda leis fundamentais da natureza por meio de matemática, experimentação, modelagem e computação.",["Mecânica","eletromagnetismo","termodinâmica","quântica","cálculo","laboratório"],["modelar fenômenos","realizar experimentos","programar simulações","analisar dados","produzir pesquisa"],["universidades","laboratórios","tecnologia","energia","indústria"],"Exige matemática intensa e tolerância a problemas abstratos e de longo prazo.",{investigative:100, quantitative:98, technology:70, realistic:58, conventional:55}),
  c("historia","História","Humanidades","4 anos","Analisa sociedades no tempo por meio de fontes, interpretação crítica, escrita e debate historiográfico.",["História do Brasil","antiga","moderna","contemporânea","teoria da história","metodologia"],["ler fontes","pesquisar arquivos","escrever análises","ensinar","contextualizar eventos"],["escolas","universidades","museus","arquivos","produção cultural"],"Envolve leitura e escrita intensas; muitas trajetórias profissionais dependem de docência, pesquisa ou produção cultural.",{verbal_humanities:100, investigative:82, social:60, artistic:55, conventional:50}),
  c("geografia","Geografia","Humanidades e Território","4 anos","Estuda território, ambiente, população e espaço, integrando análise social, mapas, dados e trabalho de campo.",["Geografia humana","física","cartografia","geoprocessamento","climatologia","urbanização"],["analisar mapas","trabalhar com dados espaciais","realizar campo","interpretar território","produzir diagnósticos"],["escolas","planejamento urbano","meio ambiente","geotecnologia","setor público"],"Combina humanidades e ciência; dependendo da trajetória pode exigir bastante campo, estatística e geoprocessamento.",{verbal_humanities:82, investigative:82, realistic:62, technology:68, quantitative:58, social:55}),
  c("letras","Letras","Linguagem e Humanidades","4 anos","Aprofunda língua, literatura, linguística, leitura, escrita e ensino, com diferentes habilitações.",["Linguística","literatura","gramática","teoria literária","produção textual","línguas"],["analisar textos","escrever","revisar","ensinar","pesquisar linguagem"],["escolas","editoras","comunicação","tradução","pesquisa"],"Exige gosto consistente por leitura, linguagem e escrita; as oportunidades variam bastante conforme a habilitação.",{verbal_humanities:100, artistic:72, investigative:68, social:65, people_contact:58}),
  c("engenharia-quimica","Engenharia Química","Engenharia e Processos","5 anos","Aplica química, física e matemática ao projeto e operação de processos industriais em grande escala.",["Fenômenos de transporte","termodinâmica","operações unitárias","reatores","controle de processos","química"],["dimensionar processos","analisar eficiência","otimizar produção","avaliar segurança","trabalhar com dados"],["indústria química","energia","alimentos","farmacêutica","consultoria"],"Tem carga quantitativa alta e foco mais forte em processos e escala industrial do que em química de bancada.",{quantitative:96, investigative:90, realistic:82, technology:78, conventional:72}),
  c("engenharia-ambiental","Engenharia Ambiental","Engenharia e Sustentabilidade","5 anos","Integra engenharia, ciências ambientais e gestão para resolver problemas de água, resíduos, poluição e sustentabilidade.",["Hidráulica","saneamento","química ambiental","gestão de resíduos","geoprocessamento","licenciamento"],["dimensionar sistemas","monitorar indicadores","analisar impactos","elaborar projetos","trabalhar em campo"],["consultorias","saneamento","indústria","setor público","energia"],"Combina cálculo, legislação, campo e gestão; o cotidiano varia muito entre projeto, operação e licenciamento.",{realistic:82, investigative:86, quantitative:82, technology:72, social:52, conventional:68}),
  c("engenharia-computacao","Engenharia de Computação","Engenharia e Tecnologia","5 anos","Une hardware, software, eletrônica e computação para desenvolver sistemas digitais e embarcados.",["Programação","eletrônica","arquitetura de computadores","sistemas embarcados","redes","cálculo"],["programar","prototipar hardware","integrar sistemas","testar dispositivos","otimizar desempenho"],["tecnologia","indústria","automação","telecom","pesquisa"],"É mais próxima de hardware e eletrônica do que Ciência da Computação e exige carga forte de matemática e física.",{technology:100, quantitative:92, investigative:90, realistic:78, conventional:62}),
  c("engenharia-alimentos","Engenharia de Alimentos","Engenharia e Alimentos","5 anos","Aplica engenharia, química e microbiologia ao processamento, segurança e inovação de alimentos.",["Operações unitárias","microbiologia","química de alimentos","processos térmicos","qualidade","embalagens"],["desenvolver processos","controlar qualidade","otimizar produção","analisar segurança","testar produtos"],["indústria de alimentos","bebidas","qualidade","P&D","consultoria"],"É engenharia de processos aplicada ao setor de alimentos, não um curso de culinária ou nutrição clínica.",{investigative:86, realistic:80, quantitative:82, health_biology:65, conventional:78, technology:68}),
  c("gestao-rh","Gestão de Recursos Humanos","Gestão e Pessoas","2 a 3 anos","Foca recrutamento, desenvolvimento, cultura, remuneração e processos de pessoas nas organizações.",["Recrutamento","treinamento","cargos e salários","legislação trabalhista","cultura","people analytics"],["entrevistar candidatos","organizar processos","analisar indicadores","apoiar lideranças","desenvolver pessoas"],["empresas","consultorias","startups","serviços","RH corporativo"],"É uma formação mais aplicada e curta; posições estratégicas podem exigir experiência e aprofundamento posterior.",{social:86, people_contact:92, business:82, enterprising:76, conventional:72, verbal_humanities:62}),
  c("marketing","Marketing","Negócios e Comunicação","2 a 4 anos","Estuda mercado, consumidor, marca, canais, dados e crescimento para criar e capturar demanda.",["Comportamento do consumidor","branding","mídia","pesquisa de mercado","analytics","estratégia"],["analisar campanhas","pesquisar consumidores","planejar posicionamento","criar estratégias","acompanhar métricas"],["empresas","agências","startups","e-commerce","consultorias"],"Combina criatividade e análise; resultados são cobrados por métricas e o campo muda rapidamente com plataformas e tecnologia.",{business:92, enterprising:88, artistic:78, people_contact:72, technology:72, quantitative:60, verbal_humanities:68}),
  c("logistica","Logística","Operações e Gestão","2 a 4 anos","Planeja fluxos de materiais, estoques, transporte e distribuição com foco em eficiência e nível de serviço.",["Supply chain","estoques","transportes","operações","custos","planejamento"],["planejar rotas","controlar estoques","analisar indicadores","negociar fornecedores","otimizar operações"],["indústria","varejo","e-commerce","transportadoras","centros de distribuição"],"É uma área operacional e orientada a indicadores, com pressão por prazo, custo e confiabilidade.",{conventional:90, quantitative:78, business:80, realistic:68, technology:72, enterprising:62}),
  c("gastronomia","Gastronomia","Alimentos e Hospitalidade","2 a 4 anos","Combina técnica culinária, cultura alimentar, operação, criatividade e gestão de serviços de alimentação.",["Técnicas culinárias","confeitaria","cozinha brasileira","segurança dos alimentos","custos","gestão"],["cozinhar","planejar cardápios","organizar produção","controlar qualidade","liderar equipes"],["restaurantes","hotéis","eventos","empreendedorismo","indústria de alimentos"],"Rotinas podem ser fisicamente intensas, com horários irregulares e alta pressão operacional.",{realistic:95, artistic:85, people_contact:72, business:65, conventional:72, health_biology:48}),
  c("cinema-audiovisual","Cinema e Audiovisual","Comunicação e Criação","4 anos","Integra narrativa, direção, roteiro, imagem, som, produção e linguagem audiovisual.",["Roteiro","direção","fotografia","montagem","som","produção"],["escrever roteiros","filmar","editar","dirigir equipes","produzir projetos"],["produtoras","cinema","streaming","publicidade","conteúdo digital"],"Carreiras são muito baseadas em portfólio, projetos e rede profissional, com renda e rotina potencialmente variáveis.",{artistic:100, verbal_humanities:78, technology:72, people_contact:70, enterprising:62, realistic:55}),
  c("moda","Moda","Criação e Negócios","4 anos","Estuda criação, produto, comportamento, materiais, história, comunicação e negócios da moda.",["Design de moda","modelagem","materiais","história da moda","branding","produção"],["pesquisar tendências","desenvolver coleções","criar produtos","acompanhar fornecedores","construir narrativas de marca"],["marcas","varejo","ateliês","mídia","consultorias"],"É um setor competitivo em que portfólio, repertório, execução e networking pesam muito.",{artistic:100, business:72, enterprising:70, realistic:62, verbal_humanities:62, people_contact:66}),
  c("terapia-ocupacional","Terapia Ocupacional","Saúde e Reabilitação","4 anos","Atua para ampliar autonomia e participação de pessoas em atividades do cotidiano por meio de avaliação e intervenção.",["Anatomia","saúde mental","neurologia","desenvolvimento","atividades humanas","reabilitação"],["avaliar funcionalidade","planejar intervenções","adaptar atividades","acompanhar evolução","trabalhar em equipe multiprofissional"],["hospitais","clínicas","escolas","reabilitação","saúde mental"],"Exige contato humano intenso, criatividade clínica e tolerância a processos de evolução gradual.",{social:98, people_contact:96, health_biology:85, realistic:72, artistic:62, investigative:62}),
  c("fonoaudiologia","Fonoaudiologia","Saúde e Comunicação","4 anos","Estuda comunicação humana, linguagem, voz, audição e deglutição, combinando ciência e atendimento clínico.",["Anatomia","linguagem","audiologia","voz","motricidade orofacial","neurologia"],["avaliar comunicação","aplicar testes","conduzir terapias","acompanhar pacientes","registrar evolução"],["clínicas","hospitais","escolas","audiologia","pesquisa"],"Exige contato próximo com pacientes, atenção a detalhes e acompanhamento terapêutico continuado.",{social:95, people_contact:96, health_biology:85, verbal_humanities:76, investigative:70, conventional:65}),
  c("relacoes-publicas","Relações Públicas","Comunicação e Relações Institucionais","4 anos","Planeja reputação, relacionamento com públicos, comunicação institucional, eventos e gestão de crises.",["Comunicação institucional","reputação","eventos","pesquisa","gestão de crises","planejamento"],["mapear públicos","planejar comunicação","organizar eventos","gerir crises","produzir conteúdo institucional"],["empresas","agências","governo","ONGs","consultorias"],"É uma carreira fortemente relacional, com necessidade de comunicação, organização e capacidade de lidar com pressão reputacional.",{people_contact:92, verbal_humanities:85, enterprising:82, social:75, business:72, conventional:62, artistic:60}),
];

export const EXTRA_ACADEMIC_AREAS = [
  ["Biologia e Ciências da Vida","Ciências Biológicas","Ecologia, genética, evolução, laboratório, campo e pesquisa em sistemas vivos.",["USP","UNICAMP","UFMG","UFRJ","UFRGS","UFSC","UNESP","UnB"]],
  ["Química e Ciências Moleculares","Química","Matéria, reações, análise instrumental, laboratório, indústria e pesquisa.",["USP","UNICAMP","UFSCar","UFMG","UFRJ","UFRGS","UFSC","UNESP"]],
  ["Matemática e Modelagem","Matemática","Abstração, demonstração, modelagem, lógica e formação quantitativa profunda.",["USP","UNICAMP","UFMG","UFRJ","UFRGS","UFPE","UnB","UFSCar"]],
  ["Física e Ciência Fundamental","Física","Modelagem matemática, experimentação, computação e investigação das leis da natureza.",["USP","UNICAMP","UFRJ","UFMG","UFRGS","UFSC","UnB","UFSCar"]],
  ["História e Sociedade","História","Fontes, interpretação, historiografia, escrita, cultura e transformação social.",["USP","UNICAMP","UFMG","UFRJ","UFRGS","UnB","PUC-Rio","PUC-SP"]],
  ["Geografia e Território","Geografia","Território, ambiente, cartografia, geotecnologia, população e trabalho de campo.",["USP","UNICAMP","UFMG","UFRJ","UFRGS","UFPR","UnB","UNESP"]],
  ["Linguagem e Literatura","Letras","Língua, linguística, literatura, escrita, tradução, ensino e pesquisa.",["USP","UNICAMP","UFMG","UFRJ","UFRGS","UnB","PUC-SP","PUC-Rio"]],
  ["Engenharia Química e Processos","Engenharia Química","Processos industriais, termodinâmica, reatores, escala, segurança e otimização.",["USP","UNICAMP","UFSCar","UFRJ","UFMG","UFRGS","UFSC","PUC-Rio"]],
  ["Engenharia Ambiental e Sustentabilidade","Engenharia Ambiental","Saneamento, água, resíduos, impactos ambientais, projeto e gestão sustentável.",["USP","UNESP","UFMG","UFRJ","UFSC","UFRGS","UFPR","UnB"]],
  ["Engenharia de Computação","Engenharia de Computação","Hardware, software, eletrônica, sistemas embarcados, automação e computação.",["USP","UNICAMP","UFSCar","UFRGS","UFSC","PUC-Rio","Insper","ITA"]],
  ["Engenharia de Alimentos","Engenharia de Alimentos","Processamento, segurança, microbiologia, qualidade, escala industrial e inovação alimentar.",["UNICAMP","USP","UFV","UFRGS","UFSC","UFLA","UFG","UNESP"]],
  ["Gestão de Pessoas","Gestão de Recursos Humanos","Recrutamento, desenvolvimento, cultura, people analytics e gestão de pessoas.",["Senac SP","Universidade Anhembi Morumbi","UNIP","Estácio","Cruzeiro do Sul Virtual","UniCesumar","Anhanguera","Universidade Positivo"]],
  ["Marketing e Growth","Marketing","Consumidor, marca, mídia, dados, aquisição, posicionamento e estratégia comercial.",["Senac SP","Universidade Anhembi Morumbi","UNIP","Estácio","Cruzeiro do Sul Virtual","UniCesumar","Anhanguera","Universidade Positivo"]],
  ["Logística e Supply Chain","Logística","Estoques, transporte, supply chain, operações, custos, tecnologia e nível de serviço.",["Senac SP","Universidade Anhembi Morumbi","UNIP","Estácio","Cruzeiro do Sul Virtual","UniCesumar","Anhanguera","Universidade Positivo"]],
  ["Gastronomia e Hospitalidade","Gastronomia","Técnica culinária, criatividade, segurança dos alimentos, operação e gestão gastronômica.",["Universidade Anhembi Morumbi","Senac SP","UNIVALI","Universidade Positivo","FMU","Estácio","Universidade Cruzeiro do Sul","PUCRS"]],
  ["Cinema e Audiovisual","Cinema e Audiovisual","Narrativa, roteiro, direção, fotografia, som, montagem, produção e linguagem audiovisual.",["FAAP","ESPM","Universidade Anhembi Morumbi","PUC-Rio","UFF","UFSC","UFPE","UFC"]],
  ["Moda e Indústria Criativa","Moda","Criação, produto, materiais, comportamento, branding, produção e negócios da moda.",["FAAP","Universidade Anhembi Morumbi","Belas Artes","Senac SP","Faculdade Santa Marcelina","UDESC","UFC","UEL"]],
  ["Terapia Ocupacional e Reabilitação","Terapia Ocupacional","Autonomia, atividade humana, saúde, reabilitação, inclusão e cuidado interdisciplinar.",["USP","UFSCar","UFMG","UFRJ","UFPR","UFPE","UnB","UFSM"]],
  ["Fonoaudiologia e Comunicação Humana","Fonoaudiologia","Linguagem, voz, audição, deglutição, avaliação clínica e reabilitação.",["USP","UNIFESP","UFMG","UFRJ","UFSC","UFSM","PUC-SP","UNESP"]],
  ["Relações Públicas e Reputação","Relações Públicas","Reputação, públicos, comunicação institucional, eventos, crise e relacionamento.",["USP","UFRGS","UFPR","PUCRS","FAAP","ESPM","PUC Minas","UNESP"]],
] as const;

export const EXTRA_AREA_QUESTIONS: Record<string,{id:string;text:string;dimension:string;low:string;high:string;}[]> = {
  "biologia-e-ciencias-da-vida":[
    {id:"bio_lab",text:"Quanto você quer uma graduação com laboratório frequente, microscopia e experimentação?",dimension:"practical",low:"Pouco laboratório",high:"Muito laboratório"},
    {id:"bio_field",text:"Quanto trabalho de campo, ecologia e contato direto com ambientes naturais atraem você?",dimension:"practical",low:"Prefiro laboratório/teoria",high:"Muito campo"},
    {id:"bio_research",text:"Quanto você valoriza iniciação científica e possibilidade de seguir para pesquisa ou pós-graduação?",dimension:"research",low:"Pouco",high:"É prioridade"},
  ],
  "quimica-e-ciencias-moleculares":[
    {id:"qui_lab",text:"Quanto você quer passar tempo em laboratório realizando análises e experimentos químicos?",dimension:"practical",low:"Pouco",high:"Muito"},
    {id:"qui_precision",text:"Quanto você se identifica com ambientes de alta precisão, protocolos e controle de qualidade?",dimension:"structure",low:"Prefiro flexibilidade",high:"Muito"},
    {id:"qui_industry",text:"Quanto a conexão com indústria, materiais, fármacos e processos produtivos importa?",dimension:"technology",low:"Pouco",high:"Muito"},
  ],
  "matematica-e-modelagem":[
    {id:"mat_abstract",text:"Quanto você gosta de demonstrações, abstração e problemas sem aplicação imediata?",dimension:"rigor",low:"Prefiro aplicação",high:"Gosto muito"},
    {id:"mat_research",text:"Quanto você quer contato com pesquisa matemática e formação teórica profunda?",dimension:"research",low:"Pouco",high:"Muito"},
    {id:"mat_flex",text:"Quanto valoriza liberdade para combinar matemática com computação, finanças ou docência?",dimension:"international",low:"Pouco",high:"Muito"},
  ],
  "fisica-e-ciencia-fundamental":[
    {id:"fis_theory",text:"Quanto você busca uma formação fortemente teórica e matemática?",dimension:"rigor",low:"Mais aplicada",high:"Muito teórica"},
    {id:"fis_lab",text:"Quanto laboratórios, instrumentação e experimentação física atraem você?",dimension:"practical",low:"Pouco",high:"Muito"},
    {id:"fis_research",text:"Quanto pesquisa científica e possibilidade de pós-graduação importam?",dimension:"research",low:"Pouco",high:"Muito"},
  ],
  "historia-e-sociedade":[
    {id:"his_sources",text:"Quanto você quer trabalhar intensamente com fontes, leitura e escrita acadêmica?",dimension:"rigor",low:"Moderado",high:"Muito"},
    {id:"his_research",text:"Quanto arquivos, pesquisa histórica e produção de conhecimento atraem você?",dimension:"research",low:"Pouco",high:"Muito"},
    {id:"his_public",text:"Quanto extensão, museus, patrimônio e projetos com a sociedade importam?",dimension:"people",low:"Pouco",high:"Muito"},
  ],
  "geografia-e-territorio":[
    {id:"geo_field",text:"Quanto trabalho de campo e observação direta do território importam?",dimension:"practical",low:"Pouco",high:"Muito"},
    {id:"geo_gis",text:"Quanto geoprocessamento, mapas digitais, satélites e dados espaciais atraem você?",dimension:"technology",low:"Pouco",high:"Muito"},
    {id:"geo_public",text:"Quanto planejamento urbano, políticas territoriais e impacto público pesam?",dimension:"people",low:"Pouco",high:"Muito"},
  ],
  "linguagem-e-literatura":[
    {id:"let_read",text:"Quanto você deseja uma graduação com leitura e escrita intensas?",dimension:"rigor",low:"Moderado",high:"Muito"},
    {id:"let_languages",text:"Quanto idiomas, linguística, tradução ou estudos da linguagem atraem você?",dimension:"international",low:"Pouco",high:"Muito"},
    {id:"let_teaching",text:"Quanto a possibilidade de ensinar, mediar leitura ou trabalhar com pessoas importa?",dimension:"people",low:"Pouco",high:"Muito"},
  ],
  "engenharia-quimica-e-processos":[
    {id:"eq_process",text:"Quanto você quer trabalhar com processos industriais, escala e otimização?",dimension:"practical",low:"Pouco",high:"Muito"},
    {id:"eq_math",text:"Quanto rigor quantitativo e modelagem de processos você procura?",dimension:"rigor",low:"Moderado",high:"Muito"},
    {id:"eq_industry",text:"Quanto laboratórios-piloto, indústria e tecnologia de processos importam?",dimension:"technology",low:"Pouco",high:"Muito"},
  ],
  "engenharia-ambiental-e-sustentabilidade":[
    {id:"ea_field",text:"Quanto campo, saneamento, água e projetos ambientais práticos atraem você?",dimension:"practical",low:"Pouco",high:"Muito"},
    {id:"ea_impact",text:"Quanto impacto socioambiental e políticas de sustentabilidade importam?",dimension:"people",low:"Pouco",high:"Muito"},
    {id:"ea_tech",text:"Quanto sensores, modelagem, geotecnologia e dados ambientais pesam?",dimension:"technology",low:"Pouco",high:"Muito"},
  ],
  "engenharia-de-computacao":[
    {id:"ec_hw",text:"Quanto você quer trabalhar com hardware, eletrônica e sistemas embarcados, além de software?",dimension:"technology",low:"Pouco",high:"Muito"},
    {id:"ec_lab",text:"Quanto laboratórios, prototipagem e construção de sistemas físicos atraem você?",dimension:"practical",low:"Pouco",high:"Muito"},
    {id:"ec_math",text:"Quanto você aceita uma formação pesada em cálculo, física e fundamentos de engenharia?",dimension:"rigor",low:"Moderado",high:"Muito"},
  ],
  "engenharia-de-alimentos":[
    {id:"eal_process",text:"Quanto processos industriais e produção em escala de alimentos atraem você?",dimension:"practical",low:"Pouco",high:"Muito"},
    {id:"eal_lab",text:"Quanto microbiologia, controle de qualidade e laboratório importam?",dimension:"research",low:"Pouco",high:"Muito"},
    {id:"eal_industry",text:"Quanto conexão com indústria, P&D e inovação em alimentos pesa?",dimension:"technology",low:"Pouco",high:"Muito"},
  ],
  "gestao-de-pessoas":[
    {id:"rh_people",text:"Quanto você quer uma rotina centrada em entrevistas, desenvolvimento e relações humanas?",dimension:"people",low:"Pouco",high:"Muito"},
    {id:"rh_data",text:"Quanto people analytics, indicadores e tecnologia de RH atraem você?",dimension:"technology",low:"Pouco",high:"Muito"},
    {id:"rh_lead",text:"Quanto você quer atuar próximo a lideranças e decisões de cultura organizacional?",dimension:"leadership",low:"Pouco",high:"Muito"},
  ],
  "marketing-e-growth":[
    {id:"mkt_creative",text:"Quanto marca, conteúdo, comunicação e criação de campanhas atraem você?",dimension:"practical",low:"Pouco",high:"Muito"},
    {id:"mkt_data",text:"Quanto dados, performance, CRM e testes de crescimento importam?",dimension:"technology",low:"Pouco",high:"Muito"},
    {id:"mkt_market",text:"Quanto contato com empresas, projetos reais e mercado pesa na escolha?",dimension:"leadership",low:"Pouco",high:"Muito"},
  ],
  "logistica-e-supply-chain":[
    {id:"log_ops",text:"Quanto você quer aprender por casos e projetos de operações reais?",dimension:"practical",low:"Pouco",high:"Muito"},
    {id:"log_data",text:"Quanto tecnologia, ERP, dados e otimização de rotas/estoques atraem você?",dimension:"technology",low:"Pouco",high:"Muito"},
    {id:"log_struct",text:"Quanto você se identifica com ambientes estruturados, metas e processos bem definidos?",dimension:"structure",low:"Pouco",high:"Muito"},
  ],
  "gastronomia-e-hospitalidade":[
    {id:"gas_kitchen",text:"Quanto prática de cozinha, técnica e produção presencial são essenciais para você?",dimension:"practical",low:"Pouco",high:"Muito"},
    {id:"gas_business",text:"Quanto gestão de restaurante, custos e empreendedorismo gastronômico importam?",dimension:"leadership",low:"Pouco",high:"Muito"},
    {id:"gas_people",text:"Quanto atendimento, equipe e hospitalidade pesam na experiência que você quer?",dimension:"people",low:"Pouco",high:"Muito"},
  ],
  "cinema-e-audiovisual":[
    {id:"cin_production",text:"Quanto você quer produzir filmes e projetos desde cedo, com equipamentos e sets?",dimension:"practical",low:"Pouco",high:"Muito"},
    {id:"cin_tech",text:"Quanto fotografia, edição, som e tecnologia audiovisual atraem você?",dimension:"technology",low:"Pouco",high:"Muito"},
    {id:"cin_network",text:"Quanto projetos colaborativos e conexão com a indústria audiovisual importam?",dimension:"people",low:"Pouco",high:"Muito"},
  ],
  "moda-e-industria-criativa":[
    {id:"mod_studio",text:"Quanto ateliê, modelagem, materiais e desenvolvimento de produto importam?",dimension:"practical",low:"Pouco",high:"Muito"},
    {id:"mod_business",text:"Quanto branding, varejo, negócios e empreendedorismo de moda atraem você?",dimension:"leadership",low:"Pouco",high:"Muito"},
    {id:"mod_global",text:"Quanto intercâmbio, repertório internacional e conexão com a indústria global pesam?",dimension:"international",low:"Pouco",high:"Muito"},
  ],
  "terapia-ocupacional-e-reabilitacao":[
    {id:"to_clinic",text:"Quanto prática clínica e contato direto com pacientes importam?",dimension:"practical",low:"Pouco",high:"Muito"},
    {id:"to_people",text:"Quanto você quer uma formação centrada em cuidado, inclusão e autonomia das pessoas?",dimension:"people",low:"Pouco",high:"Muito"},
    {id:"to_inter",text:"Quanto integração com hospitais, equipes multiprofissionais e estágios pesa?",dimension:"structure",low:"Pouco",high:"Muito"},
  ],
  "fonoaudiologia-e-comunicacao-humana":[
    {id:"fono_clinic",text:"Quanto prática clínica em linguagem, voz, audição e deglutição importa?",dimension:"practical",low:"Pouco",high:"Muito"},
    {id:"fono_people",text:"Quanto contato próximo e acompanhamento longitudinal de pacientes atraem você?",dimension:"people",low:"Pouco",high:"Muito"},
    {id:"fono_research",text:"Quanto laboratório, audiologia, pesquisa e tecnologia clínica pesam?",dimension:"research",low:"Pouco",high:"Muito"},
  ],
  "relacoes-publicas-e-reputacao":[
    {id:"rp_projects",text:"Quanto você quer projetos reais de comunicação institucional, eventos e reputação?",dimension:"practical",low:"Pouco",high:"Muito"},
    {id:"rp_people",text:"Quanto relacionamento com diferentes públicos e networking importam?",dimension:"people",low:"Pouco",high:"Muito"},
    {id:"rp_crisis",text:"Quanto gestão de crise, estratégia e tomada de decisão comunicacional atraem você?",dimension:"leadership",low:"Pouco",high:"Muito"},
  ],
};