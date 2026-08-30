export interface AreaUniversity {
  id: string;
  name: string;
  course: string;
  location: string;
  differentiators: string[];
  highFit: string;
  matchProfile: Record<string, number>;
}

export interface AcademicArea {
  id: string;
  name: string;
  courses: string;
  description: string;
  universities: AreaUniversity[];
}

export interface AreaQuestion {
  id: string;
  text: string;
  dimension: string;
  low: string;
  high: string;
}

const DIMENSIONS = ['rigor','practical','research','people','technology','leadership','structure','international'] as const;

function slug(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function profile(seed: string, index: number): Record<string, number> {
  const chars = Array.from(seed).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return Object.fromEntries(DIMENSIONS.map((dimension, i) => [dimension, Math.min(96, 48 + ((chars * (i + 3) + index * 17 + i * 29) % 45))]));
}

const RAW = [
  ['Humanidades e Jurídico','Direito','Leitura, argumentação, instituições, normas, negociação e resolução de conflitos.',['USP','FGV Direito SP','PUC-SP','Mackenzie','UFMG','UnB','UFRJ','UFPR']],
  ['Saúde e Ciências Humanas','Psicologia','Comportamento, cuidado, escuta, evidências e desenvolvimento humano.',['USP','PUC-SP','Mackenzie','UFMG','UnB','UFRJ','UFSC','PUC-Rio']],
  ['Saúde','Medicina, Enfermagem, Odontologia, Fisioterapia e Nutrição','Ciências da vida, cuidado, prática clínica, responsabilidade e contato humano.',['USP','UNIFESP','UFMG','UFRJ','UNICAMP','UFRGS','UFPR','Faculdade Israelita de Ciências da Saúde Albert Einstein']],
  ['Negócios e Gestão','Administração','Estratégia, liderança, mercado, execução, empreendedorismo e tomada de decisão.',['Insper','FGV EAESP','ESPM','Mackenzie','PUC-SP','Inteli','Link School of Business','Ibmec']],
  ['Saúde, Biológicas e Agro','Medicina Veterinária','Saúde animal, ciências biológicas, campo, produção e saúde pública.',['USP','UNESP','UFMG','UFRGS','UFPR','UFLA','UFV','PUCPR']],
  ['Saúde e Química','Farmácia','Medicamentos, química, laboratório, segurança, qualidade e cuidado.',['USP','UFMG','UFRGS','UFPR','UNESP','UNICAMP','UFRJ','UFSC']],
  ['Saúde e Laboratório','Biomedicina','Diagnóstico, análises, biologia molecular, protocolos e pesquisa aplicada.',['Universidade São Judas Tadeu','Universidade Anhembi Morumbi','UNIP','Universidade Feevale','PUC Goiás','Universidade Franciscana','Centro Universitário São Camilo','UniCesumar']],
  ['Tecnologia','Sistemas de Informação, Engenharia de Software e ADS','Software, sistemas, dados, produto digital e solução estruturada de problemas.',['USP','UNICAMP','UFMG','UFRGS','UFPE','PUC-Rio','Mackenzie','Inteli']],
  ['Design e Construção','Arquitetura e Urbanismo','Projeto, estética, técnica, espaço, cidade e execução.',['USP','Mackenzie','UFRJ','UFMG','UFRGS','UFPR','PUC-Rio','UnB']],
  ['Educação','Pedagogia','Ensino, aprendizagem, desenvolvimento, planejamento e impacto social.',['USP','UNICAMP','UFMG','UFRJ','UnB','UFRGS','PUC-SP','UFPR']],
  ['Negócios e Finanças','Ciências Contábeis','Contabilidade, finanças, auditoria, precisão e decisão baseada em números.',['USP','PUC-SP','Mackenzie','UFMG','UFRGS','UFPR','UnB','FIPECAFI']],
  ['Engenharia','Engenharia Civil e Mecânica','Matemática, física, projeto, sistemas reais e responsabilidade técnica.',['USP','UNICAMP','ITA','UFMG','UFRJ','UFRGS','UFSC','PUC-Rio']],
  ['Saúde e Esporte','Educação Física','Movimento humano, desempenho, saúde, orientação e prática corporal.',['USP','UNICAMP','UFMG','UFRGS','UnB','UFSC','UNESP','UFRJ']],
  ['Tecnologia e Ciência','Ciência da Computação','Computação, algoritmos, matemática, pesquisa e sistemas complexos.',['USP','UNICAMP','UFMG','UFRGS','UFPE','PUC-Rio','UFSC','UnB']],
  ['Comunicação e Marketing','Publicidade e Propaganda','Marca, criatividade, mídia, comportamento do consumidor e estratégia.',['ESPM','USP','FAAP','Mackenzie','Anhembi Morumbi','Belas Artes','PUC-Rio','UFRGS']],
  ['Agro e Ciências da Vida','Agronomia','Produção, biologia, tecnologia, campo, sustentabilidade e gestão.',['USP/ESALQ','UFV','UFLA','UNESP','UFRGS','UFPR','UFG','UFSM']],
  ['Engenharia e Gestão','Engenharia de Produção','Processos, operações, otimização, dados e gestão de sistemas produtivos.',['USP','UFSCar','UFRJ','UFMG','UFSC','UFRGS','PUC-Rio','Insper']],
  ['Economia e Finanças','Ciências Econômicas','Mercados, políticas, modelagem, dados e tomada de decisão econômica.',['FGV EESP','Insper','USP','PUC-Rio','Ibmec','UFRJ','UNICAMP','UFMG']],
  ['Comunicação','Jornalismo','Apuração, narrativa, linguagem, mídia, ética e contato com pessoas.',['USP','Cásper Líbero','ESPM','Mackenzie','PUC-Rio','UFRGS','UnB','PUC-SP']],
  ['Criação e Produto','Design','Pesquisa de usuário, estética, prototipação, produto e comunicação visual.',['ESPM','Belas Artes','FAAP','PUC-Rio','Mackenzie','USP','UEMG','UFPR']],
  ['Ciências Sociais Aplicadas','Serviço Social','Direitos, políticas públicas, vulnerabilidades, instituições e impacto social.',['PUC-SP','UFRJ','UnB','UFSC','UFRGS','UFPE','UERJ','UNESP']],
  ['Humanidades, Política e Negócios','Relações Internacionais','Política, economia, negociação, contexto global e análise de cenários.',['FGV RI','PUC-SP','PUC-Rio','FAAP','ESPM','UnB','UFRGS','UNESP']],
  ['Engenharia e Tecnologia','Engenharia Elétrica','Sistemas elétricos, eletrônica, automação, matemática e tecnologia.',['USP','UNICAMP','UFMG','UFRJ','UFRGS','UFSC','ITA','PUC-Rio']],
] as const;

export const ACADEMIC_AREAS: AcademicArea[] = RAW.map(([name,courses,description,names]) => {
  const id = slug(name);
  return {
    id,name,courses,description,
    universities: names.map((universityName,index) => ({
      id: `${id}-${index + 1}`,
      name: universityName,
      course: courses,
      location: 'Brasil',
      differentiators: index % 3 === 0 ? ['rigor acadêmico','pesquisa e profundidade','rede de alumni'] : index % 3 === 1 ? ['proximidade com mercado','aprendizagem aplicada','empregabilidade'] : ['formação abrangente','projetos e interdisciplinaridade','experiência universitária'],
      highFit: index % 2 === 0 ? 'Perfil que valoriza profundidade, autonomia intelectual e formação sólida.' : 'Perfil que valoriza aplicação prática, projetos, mercado e contato profissional.',
      matchProfile: profile(`${name}-${universityName}`, index),
    }))
  };
});

export const AREA_QUESTIONS: AreaQuestion[] = [
  { id:'rigor', text:'Quanto você valoriza uma formação academicamente exigente e aprofundada?', dimension:'rigor', low:'Prefiro equilíbrio', high:'Quero muito rigor' },
  { id:'practical', text:'Quanto você quer aprender por projetos, casos, laboratório, clínica ou prática profissional?', dimension:'practical', low:'Mais teoria', high:'Muito prática' },
  { id:'research', text:'Quanto pesquisa, iniciação científica e produção de conhecimento importam para você?', dimension:'research', low:'Pouco', high:'Muito' },
  { id:'people', text:'Quanto você quer que sua graduação envolva contato intenso com pessoas e trabalho em equipe?', dimension:'people', low:'Mais individual', high:'Muito contato' },
  { id:'technology', text:'Quanto tecnologia, dados e ferramentas digitais devem aparecer na sua formação?', dimension:'technology', low:'Secundário', high:'Central' },
  { id:'leadership', text:'Quanto você quer oportunidades de liderança, empreendedorismo e tomada de decisão?', dimension:'leadership', low:'Pouco', high:'Muito' },
  { id:'structure', text:'Você prefere uma graduação com estrutura clara, sequência definida e bastante acompanhamento?', dimension:'structure', low:'Mais liberdade', high:'Mais estrutura' },
  { id:'international', text:'Quanto oportunidades internacionais, intercâmbio e exposição global pesam na escolha?', dimension:'international', low:'Pouco', high:'Muito' },
];

export function questionsForArea(area: AcademicArea): AreaQuestion[] {
  return [...AREA_QUESTIONS,
    { id:'area_depth', text:`Quanto você quer que ${area.courses} seja o centro da sua experiência universitária desde o início?`, dimension:'rigor', low:'Quero explorar', high:'Quero especialização' },
    { id:'area_environment', text:`Quanto você se identifica com ambientes profissionais ligados a ${area.name}?`, dimension:'practical', low:'Ainda explorando', high:'Muito identificado' },
  ];
}

export function calculateAreaMatches(area: AcademicArea, answers: Record<string, number>) {
  const student: Record<string, number> = {};
  DIMENSIONS.forEach((dimension) => {
    const values = Object.entries(answers).filter(([id]) => id === dimension || (id === 'area_depth' && dimension === 'rigor') || (id === 'area_environment' && dimension === 'practical')).map(([,value]) => value);
    student[dimension] = values.length ? values.reduce((a,b)=>a+b,0) / values.length * 20 : 60;
  });
  return area.universities.map((university) => {
    const diffs = DIMENSIONS.map((dimension) => Math.abs((student[dimension] ?? 60) - university.matchProfile[dimension]));
    const score = Math.round(Math.max(55, 98 - diffs.reduce((a,b)=>a+b,0) / diffs.length * 0.72));
    return { university, score };
  }).sort((a,b)=>b.score-a.score);
}
