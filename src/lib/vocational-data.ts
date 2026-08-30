import { EXTRA_VOCATIONAL_COURSES } from '@/lib/expanded-course-data';
export type VocationalDimension =
  | 'realistic'
  | 'investigative'
  | 'artistic'
  | 'social'
  | 'enterprising'
  | 'conventional'
  | 'quantitative'
  | 'health_biology'
  | 'verbal_humanities'
  | 'technology'
  | 'people_contact'
  | 'business';

export interface VocationalQuestion {
  id: string;
  group: string;
  text: string;
  helper?: string;
  dimensions: Partial<Record<VocationalDimension, number>>;
  bipolar?: {
    lowLabel: string;
    highLabel: string;
    lowDimensions: Partial<Record<VocationalDimension, number>>;
    highDimensions: Partial<Record<VocationalDimension, number>>;
  };
}

export interface VocationalCourse {
  id: string;
  name: string;
  area: string;
  duration: string;
  summary: string;
  studies: string[];
  dayToDay: string[];
  environments: string[];
  attention: string;
  regulation?: string;
  profile: Record<VocationalDimension, number>;
}

export const DIMENSION_LABELS: Record<VocationalDimension, string> = {
  realistic: 'Prático & mão na massa',
  investigative: 'Investigação & análise',
  artistic: 'Criatividade & expressão',
  social: 'Cuidado & desenvolvimento de pessoas',
  enterprising: 'Liderança & influência',
  conventional: 'Organização & precisão',
  quantitative: 'Raciocínio quantitativo',
  health_biology: 'Saúde & ciências da vida',
  verbal_humanities: 'Linguagem & humanidades',
  technology: 'Tecnologia & sistemas',
  people_contact: 'Contato humano intenso',
  business: 'Negócios & estratégia',
};

export const DIMENSION_WEIGHTS: Record<VocationalDimension, number> = {
  realistic: 1.2,
  investigative: 1.25,
  artistic: 1.15,
  social: 1.2,
  enterprising: 1.15,
  conventional: 1,
  quantitative: 1.2,
  health_biology: 1.2,
  verbal_humanities: 1.05,
  technology: 1.15,
  people_contact: 1,
  business: 1.05,
};

export const VOCATIONAL_QUESTIONS: VocationalQuestion[] = [
  { id: 'V01', group: 'Interesses', text: 'Eu gosto de consertar, montar, construir ou entender como coisas físicas funcionam.', dimensions: { realistic: 1 } },
  { id: 'V02', group: 'Interesses', text: 'Eu me imagino trabalhando com equipamentos, obras, campo, máquinas ou atividades práticas.', dimensions: { realistic: 1 } },
  { id: 'V03', group: 'Interesses', text: 'Gosto de investigar por que algo acontece e chegar à causa de um problema.', dimensions: { investigative: 1 } },
  { id: 'V04', group: 'Interesses', text: 'Sinto curiosidade por ciência, pesquisa, hipóteses e explicações profundas.', dimensions: { investigative: 1 } },
  { id: 'V05', group: 'Interesses', text: 'Gosto de criar ideias, imagens, textos, conceitos ou experiências originais.', dimensions: { artistic: 1 } },
  { id: 'V06', group: 'Interesses', text: 'Prefiro tarefas em que posso usar criatividade em vez de seguir uma fórmula única.', dimensions: { artistic: 1 } },
  { id: 'V07', group: 'Interesses', text: 'Sinto satisfação em ensinar, orientar, acolher ou ajudar alguém a evoluir.', dimensions: { social: 1, people_contact: 0.5 } },
  { id: 'V08', group: 'Interesses', text: 'Eu teria energia para passar boa parte do dia conversando e trabalhando diretamente com pessoas.', dimensions: { social: 0.5, people_contact: 1 } },
  { id: 'V09', group: 'Interesses', text: 'Gosto de liderar, negociar, convencer, vender uma ideia ou mobilizar pessoas.', dimensions: { enterprising: 1, business: 0.4 } },
  { id: 'V10', group: 'Interesses', text: 'Tenho vontade de tomar decisões que mexem com resultados, dinheiro, estratégia ou crescimento.', dimensions: { enterprising: 0.7, business: 1 } },
  { id: 'V11', group: 'Interesses', text: 'Gosto de organizar informações, conferir detalhes e deixar processos funcionando sem erro.', dimensions: { conventional: 1 } },
  { id: 'V12', group: 'Interesses', text: 'Eu me sinto confortável seguindo padrões, regras, métodos e rotinas quando eles são importantes.', dimensions: { conventional: 1 } },

  { id: 'V13', group: 'Aptidões percebidas', text: 'Matemática, lógica, estatística ou problemas numéricos costumam fazer sentido para mim.', dimensions: { quantitative: 1 } },
  { id: 'V14', group: 'Aptidões percebidas', text: 'Eu gosto de trabalhar com números para chegar a uma decisão objetiva.', dimensions: { quantitative: 1, conventional: 0.3 } },
  { id: 'V15', group: 'Aptidões percebidas', text: 'Biologia, anatomia, química ou temas ligados ao corpo e à vida me interessam.', dimensions: { health_biology: 1, investigative: 0.3 } },
  { id: 'V16', group: 'Aptidões percebidas', text: 'Consigo me imaginar estudando assuntos de saúde com bastante profundidade e responsabilidade.', dimensions: { health_biology: 1 } },
  { id: 'V17', group: 'Aptidões percebidas', text: 'Leitura, escrita, argumentação, interpretação e debate são pontos fortes ou prazerosos para mim.', dimensions: { verbal_humanities: 1 } },
  { id: 'V18', group: 'Aptidões percebidas', text: 'Tenho interesse em sociedade, história, política, cultura, leis ou comportamento humano.', dimensions: { verbal_humanities: 1, social: 0.3 } },
  { id: 'V19', group: 'Aptidões percebidas', text: 'Programação, sistemas, inteligência artificial, dados ou produtos digitais me atraem.', dimensions: { technology: 1, investigative: 0.4 } },
  { id: 'V20', group: 'Aptidões percebidas', text: 'Gosto de entender processos digitais e pensar em como a tecnologia pode resolver problemas.', dimensions: { technology: 1, realistic: 0.2 } },

  { id: 'V21', group: 'Ambiente de trabalho', text: 'Eu prefiro problemas complexos que exigem análise antes de agir.', dimensions: { investigative: 0.8, quantitative: 0.3 } },
  { id: 'V22', group: 'Ambiente de trabalho', text: 'Prefiro produzir algo concreto e ver o resultado do meu trabalho no mundo real.', dimensions: { realistic: 0.8 } },
  { id: 'V23', group: 'Ambiente de trabalho', text: 'Eu gostaria de trabalhar em um ambiente de atendimento, cuidado ou acompanhamento de pessoas.', dimensions: { social: 0.8, people_contact: 1 } },
  { id: 'V24', group: 'Ambiente de trabalho', text: 'Um ambiente competitivo, de metas e decisões rápidas pode me motivar.', dimensions: { enterprising: 0.9, business: 0.5 } },
  { id: 'V25', group: 'Ambiente de trabalho', text: 'Eu valorizo bastante precisão, documentação e baixa margem para erro.', dimensions: { conventional: 0.9 } },
  { id: 'V26', group: 'Ambiente de trabalho', text: 'Eu gostaria de ter liberdade para propor soluções autorais e experimentar caminhos diferentes.', dimensions: { artistic: 0.8, enterprising: 0.2 } },
  { id: 'V27', group: 'Ambiente de trabalho', text: 'Eu me vejo usando computador e ferramentas digitais como parte central da minha profissão.', dimensions: { technology: 0.9 } },
  { id: 'V28', group: 'Ambiente de trabalho', text: 'Eu toparia trabalhar em laboratório, hospital, clínica, campo biológico ou ambiente de saúde.', dimensions: { health_biology: 0.8, realistic: 0.3 } },

  { id: 'V29', group: 'Valores', text: 'Para mim, ter impacto direto na vida e no bem-estar das pessoas é muito importante.', dimensions: { social: 0.9, people_contact: 0.5 } },
  { id: 'V30', group: 'Valores', text: 'Quero uma carreira em que eu possa liderar projetos, organizações ou meu próprio negócio.', dimensions: { enterprising: 0.8, business: 0.8 } },
  { id: 'V31', group: 'Valores', text: 'Gosto da ideia de trabalhar com decisões baseadas em evidências, dados e análise.', dimensions: { investigative: 0.6, quantitative: 0.7 } },
  { id: 'V32', group: 'Valores', text: 'Quero que criatividade e comunicação sejam partes relevantes da minha carreira.', dimensions: { artistic: 0.7, verbal_humanities: 0.6 } },
  { id: 'V33', group: 'Valores', text: 'Tenho interesse real em gestão, mercado, finanças, estratégia ou funcionamento de empresas.', dimensions: { business: 1, enterprising: 0.4 } },
  { id: 'V34', group: 'Valores', text: 'Eu gosto da ideia de dominar um campo técnico difícil e me tornar especialista nele.', dimensions: { investigative: 0.7, conventional: 0.3 } },
  { id: 'V35', group: 'Valores', text: 'Eu aceitaria uma formação longa e exigente se a profissão tivesse muito significado para mim.', dimensions: { investigative: 0.4, health_biology: 0.3, conventional: 0.2 } },
  { id: 'V36', group: 'Valores', text: 'Prefiro uma profissão em que meus resultados dependam bastante de iniciativa, comunicação e decisões próprias.', dimensions: { enterprising: 0.7, artistic: 0.2, business: 0.4 } },
  { id: 'V37', group: 'Trade-offs', text: 'Se tivesse que escolher uma rotina principal, qual lado combina mais com você?', helper: 'Não existe lado melhor: escolha o que você sustentaria por anos.', dimensions: {}, bipolar: { lowLabel: 'Escutar, orientar e compreender pessoas', highLabel: 'Analisar sistemas e resolver problemas técnicos', lowDimensions: { social: 1, people_contact: 0.8, verbal_humanities: 0.3 }, highDimensions: { investigative: 0.7, technology: 0.8, quantitative: 0.4 } } },
  { id: 'V38', group: 'Trade-offs', text: 'Em qual tipo de problema você teria mais vontade de mergulhar?', dimensions: {}, bipolar: { lowLabel: 'Corpo, saúde e funcionamento da vida', highLabel: 'Máquinas, software e sistemas tecnológicos', lowDimensions: { health_biology: 1, social: 0.3, investigative: 0.4 }, highDimensions: { technology: 1, realistic: 0.5, investigative: 0.4 } } },
  { id: 'V39', group: 'Trade-offs', text: 'Ao produzir algo importante, qual resultado te atrai mais?', dimensions: {}, bipolar: { lowLabel: 'Uma ideia, narrativa ou solução visual original', highLabel: 'Um modelo, processo ou decisão numericamente consistente', lowDimensions: { artistic: 1, verbal_humanities: 0.5 }, highDimensions: { quantitative: 0.9, conventional: 0.6, investigative: 0.4 } } },
  { id: 'V40', group: 'Trade-offs', text: 'Qual tipo de desafio parece mais estimulante?', dimensions: {}, bipolar: { lowLabel: 'Interpretar regras, conflitos, argumentos e instituições', highLabel: 'Construir produtos, estruturas ou sistemas que funcionem', lowDimensions: { verbal_humanities: 0.9, enterprising: 0.5, conventional: 0.4 }, highDimensions: { realistic: 0.8, technology: 0.7, investigative: 0.4 } } },
  { id: 'V41', group: 'Trade-offs', text: 'Se você tivesse uma tarde livre para um projeto, qual escolheria?', dimensions: {}, bipolar: { lowLabel: 'Investigar uma pergunta difícil sem resposta óbvia', highLabel: 'Criar uma estratégia para crescer um negócio ou projeto', lowDimensions: { investigative: 1, quantitative: 0.4 }, highDimensions: { business: 1, enterprising: 0.8 } } },
  { id: 'V42', group: 'Trade-offs', text: 'Qual impacto profissional te parece mais natural?', dimensions: {}, bipolar: { lowLabel: 'Cuidar ou acompanhar diretamente uma pessoa', highLabel: 'Organizar operações para muitas pessoas funcionarem melhor', lowDimensions: { social: 1, people_contact: 0.9, health_biology: 0.3 }, highDimensions: { conventional: 0.8, business: 0.6, enterprising: 0.4 } } },
  { id: 'V43', group: 'Trade-offs', text: 'Qual ambiente você escolheria para passar boa parte da semana?', dimensions: {}, bipolar: { lowLabel: 'Campo, natureza, laboratório físico ou operação', highLabel: 'Computador, produto digital, dados ou sistemas', lowDimensions: { realistic: 0.9, health_biology: 0.4, investigative: 0.3 }, highDimensions: { technology: 1, quantitative: 0.4, investigative: 0.3 } } },
  { id: 'V44', group: 'Trade-offs', text: 'Qual papel você assumiria com mais facilidade em um grupo?', dimensions: {}, bipolar: { lowLabel: 'Ensinar, desenvolver e apoiar as pessoas', highLabel: 'Negociar, liderar e cobrar resultado', lowDimensions: { social: 1, verbal_humanities: 0.4, people_contact: 0.5 }, highDimensions: { enterprising: 1, business: 0.7, people_contact: 0.4 } } },
  { id: 'V45', group: 'Trade-offs', text: 'Em um projeto criativo, qual parte mais te chama?', dimensions: {}, bipolar: { lowLabel: 'Forma, estética, material e experiência visual', highLabel: 'Mensagem, público, reputação e persuasão', lowDimensions: { artistic: 1, realistic: 0.4 }, highDimensions: { verbal_humanities: 0.7, enterprising: 0.6, people_contact: 0.5, business: 0.3 } } },
  { id: 'V46', group: 'Trade-offs', text: 'Qual estilo de trabalho parece mais sustentável para você?', dimensions: {}, bipolar: { lowLabel: 'Precisão técnica, método e baixa margem para erro', highLabel: 'Autoria, experimentação e caminhos menos definidos', lowDimensions: { conventional: 1, investigative: 0.5, quantitative: 0.3 }, highDimensions: { artistic: 0.9, enterprising: 0.4 } } },
  { id: 'V47', group: 'Trade-offs', text: 'Pensando na formação, qual lado te atrai mais?', dimensions: {}, bipolar: { lowLabel: 'Aprofundar teoria e especialização mesmo demorando mais', highLabel: 'Entrar cedo em projetos aplicados e no mercado', lowDimensions: { investigative: 0.8, quantitative: 0.4, conventional: 0.3 }, highDimensions: { business: 0.6, realistic: 0.5, enterprising: 0.5 } } },
  { id: 'V48', group: 'Trade-offs', text: 'Quando pensa em impacto, onde você se vê mais?', dimensions: {}, bipolar: { lowLabel: 'Mudando a trajetória de indivíduos diretamente', highLabel: 'Mudando organizações, políticas ou sistemas em escala', lowDimensions: { social: 0.9, people_contact: 0.8 }, highDimensions: { enterprising: 0.6, business: 0.5, verbal_humanities: 0.5, investigative: 0.3 } } },
];

const base = (overrides: Partial<Record<VocationalDimension, number>>): Record<VocationalDimension, number> => ({
  realistic: 30,
  investigative: 35,
  artistic: 25,
  social: 30,
  enterprising: 30,
  conventional: 35,
  quantitative: 35,
  health_biology: 20,
  verbal_humanities: 35,
  technology: 25,
  people_contact: 35,
  business: 30,
  ...overrides,
});

const c = (
  id: string,
  name: string,
  area: string,
  duration: string,
  summary: string,
  studies: string[],
  dayToDay: string[],
  environments: string[],
  attention: string,
  profile: Partial<Record<VocationalDimension, number>>,
  regulation?: string,
): VocationalCourse => ({ id, name, area, duration, summary, studies, dayToDay, environments, attention, regulation, profile: base(profile) });

const BASE_VOCATIONAL_COURSES: VocationalCourse[] = [
  c('direito','Direito','Humanidades e Jurídico','5 anos','Formação voltada à interpretação de normas, argumentação, conflitos, instituições e tomada de decisão jurídica.',['Direito constitucional','civil','penal','trabalhista','processual','teoria do direito'],['ler e interpretar casos','redigir peças e pareceres','negociar','argumentar','pesquisar jurisprudência'],['escritórios','empresas','setor público','tribunais','consultoria'],'Exige leitura intensa, escrita precisa, tolerância a conflito e atualização constante.',{ verbal_humanities:95, enterprising:75, conventional:72, investigative:65, people_contact:65, business:55 },'Para advogar, é necessário cumprir os requisitos profissionais aplicáveis, incluindo aprovação no Exame da OAB.'),
  c('psicologia','Psicologia','Saúde e Ciências Humanas','5 anos','Estuda comportamento, processos mentais, relações humanas e diferentes formas de avaliação e intervenção psicológica.',['Psicologia social','desenvolvimento','clínica','organizacional','neurociências','métodos de pesquisa'],['escutar e entrevistar','avaliar contextos','planejar intervenções','produzir registros','trabalhar com indivíduos e grupos'],['clínicas','hospitais','escolas','empresas','serviços públicos','pesquisa'],'Contato humano, ética, escuta qualificada e estudo contínuo são centrais; a realidade profissional varia muito por área.',{ social:95, people_contact:92, investigative:72, verbal_humanities:78, health_biology:55, conventional:55 },'O exercício profissional é regulamentado e atividades privativas devem observar as regras do Sistema Conselhos de Psicologia.'),
  c('enfermagem','Enfermagem','Saúde','5 anos','Forma profissionais para cuidado integral, gestão do cuidado, prevenção, assistência e coordenação de equipes de saúde.',['Anatomia','fisiologia','farmacologia','saúde coletiva','clínica e cirúrgica'],['acompanhar pacientes','executar e supervisionar cuidados','registrar informações','educar em saúde','coordenar rotinas'],['hospitais','UBS','clínicas','urgência','saúde coletiva'],'Pode envolver plantões, pressão, contato com sofrimento e alta responsabilidade operacional.',{ social:92, health_biology:95, people_contact:95, realistic:72, conventional:70, investigative:58 }),
  c('medicina','Medicina','Saúde','6 anos ou mais, além de possíveis especializações','Integra ciência biomédica, raciocínio clínico, comunicação e cuidado para prevenção, diagnóstico e tratamento.',['Anatomia','fisiologia','patologia','farmacologia','clínica','cirurgia','saúde coletiva'],['avaliar pacientes','formular hipóteses','solicitar e interpretar exames','tomar decisões clínicas','acompanhar tratamentos'],['hospitais','clínicas','UBS','laboratórios','pesquisa'],'Formação longa, carga intensa, decisões de alto impacto, contato com doença e necessidade de atualização permanente.',{ investigative:95, health_biology:100, social:88, people_contact:92, conventional:78, realistic:62, quantitative:58 }),
  c('administracao','Administração','Negócios e Gestão','4 anos','Formação generalista em estratégia, finanças, marketing, operações, pessoas e tomada de decisão organizacional.',['Estratégia','finanças','marketing','operações','economia','gestão de pessoas'],['analisar resultados','planejar','liderar projetos','negociar','organizar recursos','tomar decisões'],['empresas','startups','consultorias','terceiro setor','setor público'],'É ampla e exige construir diferenciais por experiência, estágio, networking e especialização.',{ business:98, enterprising:90, people_contact:70, quantitative:62, conventional:65, social:52, verbal_humanities:55 }),
  c('odontologia','Odontologia','Saúde','5 anos','Combina saúde, diagnóstico, prevenção e procedimentos clínicos focados no sistema estomatognático.',['Anatomia','patologia','dentística','cirurgia','periodontia','prótese'],['examinar','diagnosticar','realizar procedimentos','planejar tratamentos','atender pacientes'],['consultórios','clínicas','hospitais','saúde pública'],'Exige destreza manual, precisão, contato próximo com pacientes e investimento em atualização/equipamentos em algumas trajetórias.',{ health_biology:92, realistic:90, conventional:80, people_contact:78, investigative:70, social:68 }),
  c('fisioterapia','Fisioterapia','Saúde','5 anos','Estuda movimento humano, funcionalidade, prevenção e reabilitação em diferentes ciclos de vida e condições de saúde.',['Anatomia','cinesiologia','biomecânica','neurologia','ortopedia','cardiorrespiratória'],['avaliar movimento','definir objetivos terapêuticos','aplicar exercícios e técnicas','acompanhar evolução'],['clínicas','hospitais','centros esportivos','domicílios','reabilitação'],'Contato físico e humano frequente, acompanhamento longitudinal e necessidade de adaptação a perfis variados de paciente.',{ social:90, health_biology:90, people_contact:92, realistic:78, investigative:65 }),
  c('veterinaria','Medicina Veterinária','Saúde, Biológicas e Agro','5 anos','Abrange saúde animal, clínica, cirurgia, produção, inspeção, saúde pública e interfaces entre animais, humanos e ambiente.',['Anatomia animal','patologia','clínica','cirurgia','produção animal','saúde pública'],['examinar animais','diagnosticar','tratar','realizar procedimentos','atuar em produção e inspeção'],['clínicas','fazendas','laboratórios','indústria','setor público'],'Pode envolver sangue, sofrimento animal, trabalho de campo, plantões e decisões emocionalmente difíceis.',{ health_biology:98, realistic:88, investigative:78, social:58, people_contact:55, conventional:58 }),
  c('farmacia','Farmácia','Saúde e Química','5 anos','Integra medicamentos, análises, química, cuidado em saúde, produção e segurança terapêutica.',['Química','bioquímica','farmacologia','toxicologia','tecnologia farmacêutica','análises clínicas'],['analisar substâncias','orientar uso de medicamentos','controlar qualidade','atuar em laboratório','acompanhar processos'],['farmácias','hospitais','laboratórios','indústria','vigilância'],'Demanda precisão, responsabilidade técnica e afinidade com química/biologia; áreas de atuação são bastante diversas.',{ health_biology:88, investigative:88, conventional:90, realistic:60, people_contact:52, quantitative:55 }),
  c('biomedicina','Biomedicina','Saúde e Laboratório','4 anos','Foco em mecanismos biológicos de doenças, análises laboratoriais, diagnóstico e diferentes tecnologias biomédicas.',['Bioquímica','microbiologia','imunologia','genética','patologia','análises clínicas'],['processar amostras','operar técnicas laboratoriais','interpretar resultados','controlar qualidade','pesquisar'],['laboratórios','hospitais','pesquisa','indústria','diagnóstico'],'É mais laboratorial e analítica em muitas habilitações; exige atenção a protocolos e biossegurança.',{ investigative:94, health_biology:96, conventional:82, realistic:65, quantitative:50 }),
  c('sistemas','Sistemas de Informação','Tecnologia','4 anos','Combina computação, dados e compreensão de processos organizacionais para projetar e gerir sistemas de informação.',['Programação','bancos de dados','engenharia de software','gestão de TI','negócios','dados'],['desenvolver soluções','analisar requisitos','modelar dados','integrar sistemas','conectar tecnologia e negócio'],['empresas de tecnologia','bancos','consultorias','startups','departamentos de TI'],'Exige aprendizado contínuo e tolerância a mudança tecnológica; costuma combinar trabalho técnico com interação com negócio.',{ technology:98, investigative:85, quantitative:72, business:70, conventional:60, enterprising:52 }),
  c('arquitetura','Arquitetura e Urbanismo','Design e Construção','5 anos','Integra projeto, estética, técnica, espaço, cidade e necessidades humanas para conceber ambientes construídos.',['Projeto','desenho','história da arquitetura','urbanismo','estruturas','conforto ambiental'],['criar projetos','representar ideias','compatibilizar restrições','apresentar propostas','acompanhar execução'],['escritórios','construtoras','urbanismo','design','setor público'],'Une criatividade e técnica; prazos, revisões, softwares e conciliação entre cliente, legislação e viabilidade fazem parte da rotina.',{ artistic:95, realistic:78, investigative:62, technology:58, people_contact:58, conventional:55 }),
  c('pedagogia','Pedagogia','Educação','4 anos','Formação voltada ao ensino, aprendizagem, desenvolvimento, gestão educacional e práticas pedagógicas.',['Didática','alfabetização','psicologia da educação','currículo','políticas educacionais'],['planejar aulas','ensinar','avaliar aprendizagem','acompanhar estudantes','coordenar processos educacionais'],['escolas','projetos sociais','editoras','gestão educacional'],'Exige paciência, comunicação, planejamento e forte contato humano; condições de trabalho variam por rede e função.',{ social:98, people_contact:95, verbal_humanities:82, artistic:58, conventional:55 }),
  c('nutricao','Nutrição','Saúde','4 a 5 anos','Estuda alimentação, metabolismo e cuidado nutricional em saúde individual, coletiva e produção de alimentos.',['Bioquímica','fisiologia','dietoterapia','avaliação nutricional','saúde coletiva','alimentos'],['avaliar hábitos','planejar condutas','orientar pessoas','acompanhar indicadores','atuar em produção de refeições'],['clínicas','hospitais','academias','indústria','saúde pública'],'Combina ciência e comunicação; exige lidar com mudança de comportamento e evidências que evoluem rapidamente.',{ health_biology:92, social:78, people_contact:82, investigative:62, conventional:58 }),
  c('contabeis','Ciências Contábeis','Negócios e Finanças','4 anos','Forma para mensuração, registro, análise e comunicação de informações patrimoniais, financeiras e fiscais.',['Contabilidade financeira','custos','tributos','auditoria','controladoria','finanças'],['fechar demonstrações','analisar números','garantir conformidade','auditar','apoiar decisões'],['empresas','escritórios contábeis','auditoria','bancos','consultoria'],'Alta necessidade de precisão, atualização normativa e rotina com prazos; tecnologia vem automatizando tarefas repetitivas.',{ conventional:98, quantitative:88, business:82, investigative:62, technology:48 }),
  c('engcivil','Engenharia Civil','Engenharia','5 anos','Aplica matemática, física e gestão à concepção, dimensionamento e execução de obras e infraestrutura.',['Cálculo','física','estruturas','geotecnia','hidráulica','materiais','gestão de obras'],['dimensionar','planejar obras','orçar','vistoriar','resolver problemas técnicos','coordenar equipes'],['obras','construtoras','projetos','infraestrutura','consultorias'],'Combina escritório e campo; responsabilidade técnica, segurança, custos, prazo e coordenação de muitos agentes são centrais.',{ realistic:95, quantitative:92, investigative:82, conventional:75, enterprising:58, technology:55 }),
  c('edfisica','Educação Física','Saúde e Esporte','4 anos','Estuda movimento humano, exercício, desempenho, saúde e práticas corporais em diferentes contextos.',['Fisiologia do exercício','biomecânica','treinamento','aprendizagem motora','saúde'],['prescrever exercícios','orientar grupos','avaliar desempenho','ensinar movimentos','planejar treinos'],['academias','escolas','clubes','clínicas','esporte'],'Rotina pode ser fisicamente ativa e muito relacional; horários e formatos de trabalho variam bastante.',{ realistic:82, social:85, people_contact:92, health_biology:72, enterprising:48 }),
  c('computacao','Ciência da Computação','Tecnologia e Ciência','4 anos','Formação científica em computação: algoritmos, software, sistemas, dados, inteligência artificial e fundamentos matemáticos.',['Algoritmos','estruturas de dados','matemática discreta','arquitetura de computadores','IA','sistemas'],['programar','modelar problemas','testar soluções','pesquisar','otimizar sistemas'],['tecnologia','pesquisa','fintechs','startups','indústria'],'Requer abstração, lógica e aprendizado contínuo; nem toda função é programação, mas base técnica costuma ser intensa.',{ technology:100, investigative:95, quantitative:88, conventional:55, realistic:45 }),
  c('publicidade','Publicidade e Propaganda','Comunicação e Marketing','4 anos','Combina estratégia de marca, comportamento do consumidor, criatividade, mídia e produção de comunicação.',['Criação','planejamento','mídia','marketing','pesquisa de consumidor','produção'],['criar campanhas','escrever briefings','analisar público','apresentar ideias','planejar mídia','produzir conteúdo'],['agências','marcas','startups','produtoras','mídia'],'Prazos curtos, feedback frequente e necessidade de atualização cultural/digital são comuns.',{ artistic:95, enterprising:78, verbal_humanities:82, business:72, people_contact:68, technology:52 }),
  c('engmecanica','Engenharia Mecânica','Engenharia','5 anos','Aplica física, matemática e projeto a máquinas, energia, materiais e sistemas mecânicos.',['Cálculo','física','termodinâmica','mecânica dos sólidos','materiais','projeto'],['dimensionar sistemas','simular','projetar componentes','testar','otimizar processos'],['indústria','energia','automotivo','projetos','manutenção'],'Formação quantitativa intensa e forte interface com sistemas físicos e industriais.',{ realistic:98, quantitative:94, investigative:88, conventional:68, technology:65 }),
  c('agronomia','Agronomia','Agro e Ciências da Vida','5 anos','Integra produção vegetal, solos, clima, tecnologia, gestão e sustentabilidade do sistema agropecuário.',['Solos','fitotecnia','entomologia','economia rural','irrigação','mecanização'],['visitar áreas','analisar produção','recomendar manejo','planejar safras','usar dados e tecnologia'],['fazendas','cooperativas','agtechs','indústria','consultoria'],'Pode envolver trabalho de campo, deslocamentos, sazonalidade e decisões dependentes de clima e mercado.',{ realistic:92, health_biology:78, investigative:76, quantitative:62, technology:58, business:55 }),
  c('engproducao','Engenharia de Produção','Engenharia e Gestão','5 anos','Combina engenharia, estatística e gestão para melhorar processos, produtividade, qualidade, logística e operações.',['Cálculo','estatística','pesquisa operacional','qualidade','logística','economia'],['mapear processos','otimizar operações','analisar dados','planejar capacidade','gerir projetos'],['indústria','consultoria','varejo','logística','serviços','tecnologia'],'Perfil híbrido: exige conforto com números e capacidade de entender pessoas, processos e negócio.',{ quantitative:88, investigative:80, business:82, conventional:78, enterprising:65, technology:55, realistic:58 }),
  c('economia','Ciências Econômicas','Economia e Finanças','4 anos','Estuda decisões econômicas, mercados, políticas públicas e fenômenos sociais com forte base analítica.',['Microeconomia','macroeconomia','econometria','estatística','história econômica','finanças'],['analisar dados','modelar cenários','produzir estudos','avaliar políticas','acompanhar mercados'],['bancos','consultorias','governo','pesquisa','empresas'],'Matemática e estatística têm peso relevante em muitos cursos; também exige interpretação institucional e histórica.',{ quantitative:92, investigative:92, business:78, verbal_humanities:68, conventional:55 }),
  c('engsoftware','Engenharia de Software','Tecnologia','4 anos','Foco no processo completo de criação de software confiável: requisitos, arquitetura, desenvolvimento, testes e evolução.',['Programação','arquitetura','testes','requisitos','DevOps','gestão de projetos'],['desenvolver','revisar código','testar','desenhar arquitetura','colaborar com produto'],['empresas de tecnologia','startups','fintechs','consultorias'],'Exige trabalho em equipe, disciplina de engenharia e atualização constante de ferramentas e práticas.',{ technology:100, investigative:88, quantitative:75, conventional:72, realistic:48, business:48 }),
  c('ads','Análise e Desenvolvimento de Sistemas','Tecnologia','2 a 3 anos','Tecnólogo com foco aplicado em desenvolvimento, bancos de dados, análise de requisitos e construção de sistemas.',['Programação','banco de dados','web','engenharia de software','análise de sistemas'],['programar','testar','integrar APIs','modelar dados','entender requisitos'],['software houses','startups','TI corporativa','serviços digitais'],'Formação mais curta e aplicada, mas empregabilidade depende fortemente de prática, portfólio e atualização técnica.',{ technology:98, investigative:78, realistic:55, quantitative:68, conventional:62 }),
  c('jornalismo','Jornalismo','Comunicação','4 anos','Forma para apuração, verificação, narrativa e produção de informação de interesse público em múltiplas plataformas.',['Reportagem','redação','ética','audiovisual','dados','teorias da comunicação'],['entrevistar','apurar','checar fatos','escrever','editar','produzir conteúdo'],['redações','veículos digitais','TV','rádio','assessorias','projetos independentes'],'Prazos, exposição a temas difíceis e necessidade de checagem rigorosa fazem parte da profissão.',{ verbal_humanities:98, artistic:75, social:62, investigative:80, people_contact:75, enterprising:50 }),
  c('design','Design','Criação e Produto','4 anos','Integra pesquisa de usuário, estética, comunicação e solução de problemas para criar produtos, serviços e experiências.',['Projeto','tipografia','ergonomia','pesquisa','prototipação','história do design'],['pesquisar usuários','prototipar','criar interfaces/peças','testar soluções','apresentar conceitos'],['estúdios','tecnologia','agências','indústria','consultoria'],'Feedback, portfólio e iteração são centrais; áreas de design têm rotinas e ferramentas muito diferentes.',{ artistic:100, investigative:65, technology:62, people_contact:55, realistic:48, enterprising:48 }),
  c('servicosocial','Serviço Social','Ciências Sociais Aplicadas','4 anos','Atua sobre direitos, políticas sociais, vulnerabilidades e acesso a serviços, articulando pessoas e instituições.',['Políticas sociais','sociologia','direito social','ética','planejamento social'],['acolher demandas','orientar direitos','articular rede de serviços','produzir relatórios','planejar ações sociais'],['assistência social','saúde','justiça','ONGs','empresas','setor público'],'Exige contato com vulnerabilidade social, compreensão institucional e capacidade de lidar com limites de recursos.',{ social:100, people_contact:92, verbal_humanities:88, conventional:55, investigative:52 }),
  c('ri','Relações Internacionais','Humanidades, Política e Negócios','4 anos','Estuda política internacional, economia, direito, história, negociação e relações entre atores globais.',['Política internacional','economia','direito internacional','história','negociação','comércio exterior'],['analisar cenários','pesquisar','redigir briefings','negociar','acompanhar temas internacionais'],['empresas','consultorias','governo','organizações internacionais','comércio exterior'],'É uma formação ampla: diferenciação costuma exigir idiomas, estágio, especialização temática e construção de rede.',{ verbal_humanities:95, investigative:78, enterprising:65, business:65, social:55, people_contact:58 }),
  c('engeletrica','Engenharia Elétrica','Engenharia e Tecnologia','5 anos','Aplica matemática e física a sistemas elétricos, eletrônicos, energia, automação e telecomunicações.',['Cálculo','circuitos','eletrônica','controle','sistemas de potência','sinais'],['projetar sistemas','simular','testar equipamentos','analisar falhas','acompanhar instalações'],['energia','indústria','automação','telecom','projetos'],'Alta carga de matemática e física; segurança e responsabilidade técnica são críticas.',{ realistic:90, quantitative:98, investigative:92, technology:90, conventional:70 }),
];

export const VOCATIONAL_SOURCES = [
  { label: 'INEP — Censo da Educação Superior', url: 'https://www.gov.br/inep/pt-br/areas-de-atuacao/pesquisas-estatisticas-e-indicadores/censo-da-educacao-superior' },
  { label: 'Instituto Semesp — Mapa do Ensino Superior 2025', url: 'https://www.semesp.org.br/mapa/edicao-15/brasil/' },
  { label: 'CFP / SATEPSI — diretrizes de avaliação psicológica', url: 'https://satepsi.cfp.org.br/' },
  { label: 'MEC — Catálogo Nacional de Cursos Superiores de Tecnologia', url: 'https://cncst.mec.gov.br/' },
  { label: 'MTE — Classificação Brasileira de Ocupações', url: 'https://www.gov.br/trabalho-e-emprego/pt-br/servicos/trabalhador/mais-acoes/classificacao-brasileira-de-ocupacoes' },
];

export const VOCATIONAL_COURSES: VocationalCourse[] = [...BASE_VOCATIONAL_COURSES, ...EXTRA_VOCATIONAL_COURSES];

