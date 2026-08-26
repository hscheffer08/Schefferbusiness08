import { useEffect } from 'react';

const exactTranslations: Record<string, string> = {
  'Como funciona': 'How it works',
  'Metodologia': 'Methodology',
  'Comparar': 'Compare',
  'Entrar': 'Sign in',
  'Criar conta': 'Create account',
  'Minha conta': 'My account',
  'Faculdades': 'Colleges',
  'Período de lançamento — gratuito': 'Launch period — free',
  'Match Rápido': 'Quick Match',
  'Fazer Match Rápido': 'Start Quick Match',
  'Questionário Completo': 'Full Questionnaire',
  'Fazer Questionário Completo': 'Start Full Questionnaire',
  'Questionário para as Faculdades': 'College Profile',
  'Somente Brasil': 'Brazil only',
  'Requer conta': 'Account required',
  'Indisponível nos EUA': 'Unavailable in the U.S.',
  'Gratuito por tempo limitado · Sem documentos obrigatórios': 'Free for a limited time · No required documents',
  'Questionário inteligente': 'Smart questionnaire',
  'Match por perfil': 'Profile-based matching',
  'Ranking personalizado': 'Personalized ranking',
  'Perguntas dinâmicas sobre seu perfil acadêmico, comportamental e objetivos': 'Dynamic questions about your academic profile, behavior, and goals',
  'Algoritmo que compara sua personalidade com cada faculdade': 'Algorithm that compares your academic profile, goals, preferences, and learning style with each college',
  'Veja quais faculdades têm mais a ver com você': 'See which colleges fit you best',
  'Início': 'Home',
  'Voltar': 'Back',
  'Progresso': 'Progress',
  'Próxima': 'Next',
  'Ver meu ranking': 'See my ranking',
  'Pular esta pergunta': 'Skip this question',
  'Continuar de onde parei': 'Continue where I left off',
  'Começar do zero': 'Start over',
  'Você tem um questionário em andamento': 'You have a questionnaire in progress',
  'Seu ranking': 'Your ranking',
  'Seu Ranking': 'Your Ranking',
  'Ver detalhes': 'View details',
  'Detalhes': 'Details',
  'Refazer questionário': 'Retake questionnaire',
  'Refazer o questionário': 'Retake questionnaire',
  'Novo match': 'New match',
  'Por que combina com você': 'Why it fits you',
  'Ponto de atenção': 'Potential mismatch',
  'Pontos de atenção': 'Potential mismatches',
  'Evidências': 'Evidence',
  'Fontes': 'Sources',
  'Curso': 'Program',
  'Localização': 'Location',
  'Formato': 'Format',
  'Diferenciais': 'Program highlights',
  'Processo seletivo': 'Admissions',
  'Valores': 'Values',
  'Perfil de alto fit': 'High-fit student',
  'Perfil de baixo fit': 'Low-fit student',
  'Fit Acadêmico': 'Academic Fit',
  'Fit de Carreira': 'Career Fit',
  'Fit Empreendedor': 'Entrepreneurship Fit',
  'Fit Cultural': 'Cultural Fit',
  'Fit Internacional': 'International Fit',
  'Fit com Estilo de Aprendizagem': 'Learning Style Fit',
  'Adequação Acadêmica': 'Academic Fit',
  'Fit Comportamental': 'Behavioral Fit',
  'Evidência e Conquistas': 'Evidence & Achievements',
  'Objetivos e Cultura': 'Goals & Culture',
  'Baixa compatibilidade': 'Low compatibility',
  'Compatibilidade moderada': 'Moderate compatibility',
  'Boa compatibilidade': 'Good compatibility',
  'Ótima compatibilidade': 'Very good compatibility',
  'Excelente compatibilidade': 'Excellent compatibility',
  'Compatibilidade excepcional': 'Exceptional compatibility',
  'Baixa': 'Low',
  'Moderada': 'Moderate',
  'Boa': 'Good',
  'Ótima': 'Very good',
  'Excelente': 'Excellent',
  'Excepcional': 'Exceptional',
  'Nenhuma relevante': 'None relevant',
  '1 atividade breve': '1 short activity',
  '1-2 atividades com dedicação': '1–2 sustained activities',
  '3+ atividades com impacto': '3+ activities with impact',
  'Básico': 'Basic',
  'Intermediário': 'Intermediate',
  'Avançado': 'Advanced',
  'Fluente + certificado': 'Fluent + certification',
  'Não': 'No',
  'Talvez': 'Maybe',
  'Sim': 'Yes',
  'Tenho ideia': 'I have an idea',
  'Comecei algo': 'I started something',
  'Está funcionando': 'It is operating',
  'Prestígio e marca': 'Prestige and brand',
  'Networking e comunidade': 'Networking and community',
  'Empregabilidade': 'Employability',
  'Aprendizado prático': 'Hands-on learning',
  'Internacionalização': 'International exposure',
  'Empreendedorismo': 'Entrepreneurship',
  'Impacto social': 'Social impact',
  'Tecnologia e IA': 'Technology and AI',
  'Quero liderar grandes equipes': 'I want to lead large teams',
  'Quero empreender e criar': 'I want to build and create',
  'Quero impacto social': 'I want to create social impact',
  'Quero excelência acadêmica': 'I want academic excellence',
  'Quero mercado financeiro': 'I want a career in finance',
  'Quero experiência global': 'I want a global experience',
  'Tradicional e estruturado': 'Traditional and structured',
  'Inovador e experimental': 'Innovative and experimental',
  'Competitivo e intenso': 'Competitive and intense',
  'Colaborativo e acolhedor': 'Collaborative and supportive',
  'Global e diverso': 'Global and diverse',
  'Prático e orientado ao mercado': 'Practical and market-oriented',
  'Ninguém, encontrei sozinho': 'No one, I found it myself',
  'Google / busca': 'Google / search',
  'Amigo ou familiar': 'Friend or family member',
  'Escola / cursinho': 'School / prep course',
  'Influenciador ou canal': 'Influencer or channel',
  'Outro': 'Other',
  '1º ano do EM': 'High school — 10th grade',
  '2º ano do EM': 'High school — 11th grade',
  '3º ano do EM': 'High school — 12th grade',
  'Já formado / cursinho': 'Graduated / gap or prep year',
  'Matemática / Física': 'Math / Physics',
  'Português / Redação / História': 'Language / Writing / History',
  'Biologia / Química': 'Biology / Chemistry',
  'Línguas / Artes': 'Languages / Arts',
  'Gosto de planejar cada detalhe antes': 'I like to plan every detail first',
  'Pesquiso bastante antes de começar': 'I research extensively before starting',
  'Prefiro testar rápido e ajustar no caminho': 'I prefer to test quickly and adjust along the way',
  'Chamo outras pessoas e começamos juntos': 'I bring other people in and we start together',
  'Principalmente com aulas teóricas e leitura': 'Mostly through lectures, theory, and reading',
  'Uma mistura de teoria e prática': 'A mix of theory and practice',
  'Discutindo cases reais e debatendo': 'Discussing real cases and debating',
  'Fazendo projetos, colocando a mão na massa': 'Building projects and learning by doing',
  'Costumo liderar e dividir as tarefas': 'I usually lead and delegate tasks',
  'Colaboro e ajudo onde for preciso': 'I collaborate and help wherever needed',
  'Executo o que me pedem': 'I execute the tasks assigned to me',
  'Prefiro trabalhar sozinho': 'I prefer to work alone',
};

const sentenceTranslations: Record<string, string> = {
  'Em qual ano/série você está?': 'What grade are you currently in?',
  'Qual é a sua média geral aproximada?': 'What is your approximate overall GPA/grade average?',
  'Quais matérias você vai melhor?': 'Which subjects are you strongest in?',
  'Qual é a sua média aproximada em Matemática?': 'What is your approximate Math average?',
  'Qual é a sua média aproximada em Português e Redação?': 'What is your approximate Language and Writing average?',
  'Qual é o seu nível de inglês?': 'What is your English level?',
  'Você toparia cursar grande parte das aulas em inglês?': 'Would you be comfortable taking most of your classes in English?',
  'Você já fez ENEM, SAT, ACT, IB ou outro exame? Quais foram suas notas?': 'Have you taken the SAT, ACT, IB, ENEM, or another standardized exam? What were your scores?',
  'Você já participou de olimpíadas acadêmicas? Até qual fase chegou?': 'Have you participated in academic competitions or olympiads? How far did you advance?',
  'Quantas atividades fora da sala de aula você teve nos últimos anos?': 'How many extracurricular activities have you pursued in recent years?',
  'Qual destas opções melhor descreve sua participação em atividades fora da sala de aula?': 'Which option best describes your extracurricular involvement?',
  'Para cada atividade, descreva: quanto tempo durou, quantas horas por semana, qual era seu papel e o que você alcançou.': 'For each activity, describe how long you did it, hours per week, your role, and what you achieved.',
  'Você já criou ou tentou criar algo próprio? (projeto, negócio, clube, evento, produto, pesquisa ou conteúdo)': 'Have you ever created or tried to create something of your own? (project, business, club, event, product, research, or content)',
  'Conte sobre um projeto seu que te deixe orgulhoso. O que você fez de verdade?': 'Tell us about a project you are proud of. What did you personally do?',
  'Qual foi o maior problema nesse projeto e como você lidou com ele?': 'What was the biggest challenge in that project, and how did you handle it?',
  'Você teria como provar esse projeto? (links, números, fotos, documentos)': 'Could you provide evidence of that project? (links, metrics, photos, documents)',
  'Conte sobre uma situação em que você liderou ou tomou iniciativa sem ninguém ter pedido.': 'Tell us about a time when you led or took initiative without being asked.',
  'Conte sobre uma vez em que você discordou de um grupo. Como você lidou com isso?': 'Tell us about a time when you disagreed with a group. How did you handle it?',
  'Conte sobre um erro ou fracasso importante. O que você fez depois?': 'Tell us about an important mistake or failure. What did you do afterward?',
  'Quando você tem uma ideia nova, qual é o seu estilo?': 'When you have a new idea, what is your usual approach?',
  'Como você prefere aprender?': 'How do you prefer to learn?',
  'Você gosta de problemas que não têm uma única resposta certa?': 'Do you enjoy problems that do not have one single correct answer?',
  'O quanto você gosta de analisar dados e informações antes de tomar uma decisão?': 'How much do you like analyzing data and information before making a decision?',
  'Como você se sente ao apresentar ou fazer um pitch para um grupo?': 'How do you feel about presenting or pitching to a group?',
  'Como você se sai trabalhando sob pressão?': 'How well do you perform under pressure?',
  'Em trabalhos em grupo, qual papel você costuma assumir?': 'In group projects, what role do you usually take?',
  'O quanto fazer contatos e networking é importante para você?': 'How important is networking to you?',
  'O quanto ter experiência internacional é importante para você?': 'How important is international experience to you?',
  'Você toparia morar fora do Brasil durante parte da graduação?': 'Would you be willing to live abroad for part of your undergraduate degree?',
  'Você toparia fazer toda a graduação nos Estados Unidos e morar fora do Brasil?': 'Would you be willing to complete your entire undergraduate degree in the United States?',
  'Você gostaria de criar sua própria empresa no futuro?': 'Would you like to start your own company in the future?',
  'O quanto mercado financeiro e investimentos te interessam?': 'How interested are you in financial markets and investing?',
  'O quanto tecnologia, dados e inteligência artificial te interessam?': 'How interested are you in technology, data, and artificial intelligence?',
  'O quanto impacto social e sustentabilidade te importam?': 'How important are social impact and sustainability to you?',
  'Escolha as 3 coisas mais importantes para você em uma faculdade.': 'Choose the 3 most important things to you in a college.',
  'Qual dessas frases combina mais com você?': 'Which of these statements best describes you?',
  'Qual tipo de ambiente de faculdade mais te anima?': 'What type of college environment excites you most?',
  'Se você recebesse R$100 mil para desenvolver uma ideia, o que você faria?': 'If you received funding to develop an idea, what would you build or pursue?',
  'Sem citar nomes, como seria a faculdade perfeita para você?': 'Without naming specific schools, what would your ideal college be like?',
  'O que você NÃO gostaria de encontrar em uma faculdade?': 'What would you NOT want to find in a college?',
  'Quais cursos ou faculdades você já conhece ou tem curiosidade?': 'Which programs or colleges do you already know or want to learn more about?',
  'Você autoriza o uso anônimo das suas respostas para melhorar o algoritmo?': 'Do you authorize anonymous use of your responses to improve the algorithm?',
  'Quem indicou o Conectaê para você?': 'How did you hear about Conectaê?',
  'Qual o nome de quem te indicou?': 'What is the name of the person who referred you?',
};

const helperTranslations: Record<string, string> = {
  'Isso nos ajuda a entender em que momento da sua trajetória escolar você está.': 'This helps us understand where you are in your high school journey.',
  'Pense na média das suas notas em todas as matérias. Use 0 se ainda não tem notas.': 'Think about your average across all subjects. Use 0 if you do not have grades yet.',
  'Escolha a área onde você se sai melhor. Se empata em duas, escolha a que mais gosta.': 'Choose the area where you perform best. If two are tied, choose the one you enjoy more.',
  'Se não lembra exatamente, dê uma estimativa.': 'If you do not remember exactly, give your best estimate.',
  'Inclua redação e interpretação de texto.': 'Include writing and reading comprehension.',
  'Seja honesto. Considere leitura, escrita, conversação e compreensão.': 'Be honest. Consider reading, writing, speaking, and comprehension.',
  'Algumas faculdades oferecem aulas e materiais em inglês.': 'Some colleges offer classes and course materials in English.',
  'Se ainda não fez nenhum, pode pular essa pergunta.': 'If you have not taken any yet, you can skip this question.',
  'Inclua esportes, voluntariado, grêmio, cursinho, projetos, música, etc.': 'Include sports, volunteering, student organizations, projects, music, work, and similar activities.',
  'Depois você poderá detalhar quais atividades fez, por quanto tempo e qual foi seu papel.': 'You can describe the activities, duration, and your role in the next step.',
  'Não existe resposta certa ou errada. Escolha o que mais se parece com você.': 'There is no right or wrong answer. Choose what best describes you.',
  'Pense em como você gosta de estudar e absorver conteúdo.': 'Think about how you like to study and absorb new material.',
  'Pense em debates, cases, dilemas e situações onde há mais de um caminho possível.': 'Think about debates, cases, dilemmas, and situations with more than one reasonable path.',
  'Pense em planilhas, gráficos, pesquisas, comparações — tudo que ajuda a decidir com base em dados.': 'Think about spreadsheets, charts, research, and comparisons—anything that supports data-driven decisions.',
  'Pense em apresentações, palestras, vendas, defesa de ideia — situações em que você fala para um público.': 'Think about presentations, sales, pitches, or any situation where you speak to an audience.',
  'Pense em prazos apertados, datas importantes, situações de alta responsabilidade.': 'Think about tight deadlines, important dates, and high-responsibility situations.',
  'Pense em conhecer gente, manter relacionamentos profissionais, participar de eventos e comunidades.': 'Think about meeting people, maintaining professional relationships, and participating in events and communities.',
  'Pense em intercâmbio, estágio fora, semestres no exterior, cursos internacionais.': 'Think about study abroad, international internships, semesters overseas, and global programs.',
  'Considere distância da família, adaptação cultural, idioma e mudança por quatro anos.': 'Consider distance from family, cultural adaptation, language, and relocating for four years.',
  'Não precisa ter um plano — apenas indique o quanto essa ideia te atrai.': 'You do not need a plan—just indicate how appealing the idea is to you.',
  'Pense em ações, renda fixa, criptomoedas, carreira em bancos ou fundos de investimento.': 'Think about equities, fixed income, crypto, banking, asset management, or investment funds.',
  'Pense em programação, análise de dados, IA, automação, startups de tecnologia.': 'Think about programming, data analysis, AI, automation, and technology startups.',
  'Pense em projetos sociais, meio ambiente, diversidade, inclusão, ESG.': 'Think about social projects, the environment, diversity, inclusion, and ESG.',
  'Selecione até 3 opções que mais importam para você na hora de escolher uma faculdade.': 'Select up to 3 factors that matter most to you when choosing a college.',
  'Não existe resposta certa. Escolha a que mais se parece com o que você quer para o seu futuro.': 'There is no correct answer. Choose the one that best reflects what you want for your future.',
  'Pense no clima geral do campus — como as pessoas são, como as aulas funcionam, o que é valorizado.': 'Think about the overall campus environment—people, classroom style, and what the community values.',
  'Seus dados serão usados apenas de forma anônima para aprimorar a ferramenta. Nada que identifique você será compartilhado.': 'Your responses will only be used anonymously to improve the tool. No personally identifying information will be shared.',
  'Se ninguém te indicou, pode pular essa pergunta.': 'If no one referred you, you can skip this question.',
};

const partialTranslations: Array<[RegExp, string]> = [
  [/Descubra a faculdade de Business nos EUA que combina com seu perfil/g, 'Discover the U.S. business school that fits your profile'],
  [/Compare seu perfil com (\d+) das melhores graduações de Business dos Estados Unidos usando o Match Rápido ou o Questionário Completo\./g, 'Compare your profile with $1 leading U.S. undergraduate business programs using Quick Match or the Full Questionnaire.'],
  [/Responda apenas o essencial e descubra quais faculdades mais combinam com seu perfil\./g, 'Answer the essentials and discover which colleges fit your profile best.'],
  [/Responda todas as perguntas para receber uma análise mais detalhada do seu perfil\./g, 'Answer all questions to receive a more detailed analysis of your profile.'],
  [/Este hub exclusivo para relacionamento com faculdades está disponível apenas na experiência brasileira\./g, 'This college-profile hub is available only in the Brazil experience.'],
  [/Você estava na pergunta (\d+) de (\d+)\. Quer continuar de onde parou ou começar do zero\?/g, 'You were on question $1 of $2. Would you like to continue where you left off or start over?'],
  [/Seu perfil atual apresenta menos pontos de alinhamento com as características priorizadas por esta instituição\./g, 'Your current profile has fewer points of alignment with this institution’s priorities.'],
  [/Seu perfil tem alguns pontos de alinhamento com esta instituição\./g, 'Your profile has some meaningful alignment with this institution.'],
  [/Seu perfil apresenta alinhamento relevante com esta instituição\./g, 'Your profile shows meaningful alignment with this institution.'],
  [/Seu perfil tem um match claramente forte com esta instituição\./g, 'Your profile shows a clearly strong match with this institution.'],
  [/Seu perfil apresenta alinhamento muito alto com esta instituição\./g, 'Your profile shows very high alignment with this institution.'],
  [/Seu perfil apresenta alinhamento extremamente alto em praticamente todos os principais pilares avaliados\./g, 'Your profile shows exceptionally high alignment across nearly all major dimensions evaluated.'],
  [/O percentual representa o quanto seu perfil acadêmico, seus objetivos, preferências, estilo de aprendizagem e características pessoais se alinham ao perfil desta faculdade\. Ele não representa sua chance de aprovação\./g, 'The percentage represents how closely your academic profile, goals, preferences, learning style, and personal characteristics align with this college. It does not represent your chance of admission.'],
];

function translateText(text: string, toEnglish: boolean): string {
  const trimmed = text.trim();
  if (!trimmed) return text;

  const all = { ...exactTranslations, ...sentenceTranslations, ...helperTranslations };
  if (toEnglish) {
    const exact = all[trimmed];
    if (exact) return text.replace(trimmed, exact);
    let output = text;
    for (const [pattern, replacement] of partialTranslations) output = output.replace(pattern, replacement);
    return output;
  }

  const reverse = Object.fromEntries(Object.entries(all).map(([pt, en]) => [en, pt]));
  const exact = reverse[trimmed];
  if (exact) return text.replace(trimmed, exact);
  return text;
}

function isUsSelected(): boolean {
  const usButton = document.querySelector('button[aria-label="Universidades dos Estados Unidos"]');
  return usButton?.getAttribute('aria-selected') === 'true';
}

function translateDocument(toEnglish: boolean) {
  document.documentElement.lang = toEnglish ? 'en-US' : 'pt-BR';
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    const parent = current.parentElement;
    if (parent && !['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'OPTION'].includes(parent.tagName) && !parent.isContentEditable) {
      nodes.push(current as Text);
    }
    current = walker.nextNode();
  }

  nodes.forEach((node) => {
    const next = translateText(node.nodeValue ?? '', toEnglish);
    if (next !== node.nodeValue) node.nodeValue = next;
  });

  document.querySelectorAll<HTMLElement>('[title],[aria-label],input[placeholder],textarea[placeholder]').forEach((el) => {
    for (const attr of ['title', 'aria-label', 'placeholder']) {
      const value = el.getAttribute(attr);
      if (!value) continue;
      const next = translateText(value, toEnglish);
      if (next !== value) el.setAttribute(attr, next);
    }
  });
}

export default function UsEnglishMode() {
  useEffect(() => {
    let lastMode: boolean | null = null;
    let scheduled = false;

    const apply = () => {
      scheduled = false;
      const english = isUsSelected();
      if (lastMode !== english || english) translateDocument(english);
      lastMode = english;
    };

    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(apply);
    };

    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['aria-selected'],
    });
    return () => observer.disconnect();
  }, []);

  return null;
}
