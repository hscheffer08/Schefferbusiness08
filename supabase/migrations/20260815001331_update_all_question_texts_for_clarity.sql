/*
# Rewrite all 40 question texts for clarity + add helper text and scale labels

## Purpose
Improve the wording of every question in the `questions` table to be simpler,
more objective, and easier for a high school student to understand. Add helper
text and custom scale labels where appropriate.

## Important Notes
1. No question IDs are changed.
2. No response types are changed.
3. No blocks are changed.
4. No weights, dimensions, or algorithm logic is affected.
5. Only `question_text`, `helper_text`, `scale_min_label`, `scale_mid_label`,
   and `scale_max_label` are updated.
6. The original meaning of each question is preserved.
*/

-- Q01: School year
UPDATE questions SET
  question_text = 'Em qual ano/série você está?',
  helper_text = 'Isso nos ajuda a entender em que momento da sua trajetória escolar você está.'
WHERE question_id = 'Q01';

-- Q02: Overall GPA (0-10 slider)
UPDATE questions SET
  question_text = 'Qual é a sua média geral aproximada?',
  helper_text = 'Pense na média das suas notas em todas as matérias. Use 0 se ainda não tem notas.',
  scale_min_label = '0 — Minha média é muito baixa',
  scale_mid_label = '5 — Média',
  scale_max_label = '10 — Minha média é muito alta'
WHERE question_id = 'Q02';

-- Q03: Best subjects
UPDATE questions SET
  question_text = 'Quais matérias você vai melhor?',
  helper_text = 'Escolha a área onde você se sai melhor. Se empata em duas, escolha a que mais gosta.'
WHERE question_id = 'Q03';

-- Q04: Math GPA (0-10 slider)
UPDATE questions SET
  question_text = 'Qual é a sua média aproximada em Matemática?',
  helper_text = 'Se não lembra exatamente, dê uma estimativa.',
  scale_min_label = '0 — Vou muito mal',
  scale_mid_label = '5 — Me viro bem',
  scale_max_label = '10 — Vou muito bem'
WHERE question_id = 'Q04';

-- Q05: Portuguese/Writing GPA (0-10 slider)
UPDATE questions SET
  question_text = 'Qual é a sua média aproximada em Português e Redação?',
  helper_text = 'Inclua redação e interpretação de texto.',
  scale_min_label = '0 — Vou muito mal',
  scale_mid_label = '5 — Me viro bem',
  scale_max_label = '10 — Vou muito bem'
WHERE question_id = 'Q05';

-- Q06: English level
UPDATE questions SET
  question_text = 'Qual é o seu nível de inglês?',
  helper_text = 'Seja honesto. Considere leitura, escrita, conversação e compreensão.'
WHERE question_id = 'Q06';

-- Q07: Study in English (1-5 slider)
UPDATE questions SET
  question_text = 'Você toparia cursar grande parte das aulas em inglês?',
  helper_text = 'Algumas faculdades oferecem aulas e materiais em inglês.',
  scale_min_label = '0 — Não quero de jeito nenhum',
  scale_mid_label = '50 — Depende',
  scale_max_label = '100 — Com certeza, adoraria'
WHERE question_id = 'Q07';

-- Q08: Exams
UPDATE questions SET
  question_text = 'Você já fez ENEM, SAT, ACT, IB ou outro exame? Quais foram suas notas?',
  helper_text = 'Se ainda não fez nenhum, pode pular essa pergunta.'
WHERE question_id = 'Q08';

-- Q09: Academic olympiads
UPDATE questions SET
  question_text = 'Você já participou de olimpíadas acadêmicas? Até qual fase chegou?',
  helper_text = 'Inclua olimpíadas de matemática, ciências, astronomia, etc. Se não participou, escreva "não participei".'
WHERE question_id = 'Q09';

-- Q10: Extracurriculars
UPDATE questions SET
  question_text = 'Quantas atividades fora da sala de aula você teve nos últimos anos?',
  helper_text = 'Inclua esportes, voluntariado, grêmio, cursinho, projetos, música, etc.'
WHERE question_id = 'Q10';

-- Q11: Extracurricular details
UPDATE questions SET
  question_text = 'Para cada atividade, descreva: quanto tempo durou, quantas horas por semana, qual era seu papel e o que você alcançou.',
  helper_text = 'Não precisa escrever muito. O importante é dar uma ideia de quanto tempo e qual foi sua participação.'
WHERE question_id = 'Q11';

-- Q12: Entrepreneurial project
UPDATE questions SET
  question_text = 'Você já criou ou tentou criar algo próprio? (projeto, negócio, clube, evento, produto, pesquisa ou conteúdo)',
  helper_text = 'Pode ser qualquer iniciativa que você começou — não precisa ter dado certo.'
WHERE question_id = 'Q12';

-- Q13: Proud project (text)
UPDATE questions SET
  question_text = 'Conte sobre um projeto seu que te deixe orgulhoso. O que você fez de verdade?',
  helper_text = 'Pode ser um projeto escolar, pessoal, esportivo, profissional, social ou empreendedor. Explique o que você fez e qual foi sua participação.'
WHERE question_id = 'Q13';

-- Q14: Biggest problem in project (text)
UPDATE questions SET
  question_text = 'Qual foi o maior problema nesse projeto e como você lidou com ele?',
  helper_text = 'Todo projeto tem dificuldades. O importante é como você reagiu — não se preocupe se não resolveu tudo.'
WHERE question_id = 'Q14';

-- Q15: Evidence for project
UPDATE questions SET
  question_text = 'Você teria como provar esse projeto? (links, números, fotos, documentos)',
  helper_text = 'Não precisa enviar agora. Apenas indique que tipo de comprovação você teria.'
WHERE question_id = 'Q15';

-- Q16: Leadership situation (text)
UPDATE questions SET
  question_text = 'Conte sobre uma situação em que você liderou ou tomou iniciativa sem ninguém ter pedido.',
  helper_text = 'Não precisa ter sido um cargo formal. Pode ser uma situação em que você organizou pessoas, tomou a frente ou ajudou um grupo a chegar a um resultado.'
WHERE question_id = 'Q16';

-- Q17: Disagreement situation (text)
UPDATE questions SET
  question_text = 'Conte sobre uma vez em que você discordou de um grupo. Como você lidou com isso?',
  helper_text = 'O importante é como você se comportou, não se você estava certo ou errado.'
WHERE question_id = 'Q17';

-- Q18: Failure story (text)
UPDATE questions SET
  question_text = 'Conte sobre um erro ou fracasso importante. O que você fez depois?',
  helper_text = 'Errar é normal. O que importa é o que você aprendeu e fez a seguir.'
WHERE question_id = 'Q18';

-- Q19: Idea execution style
UPDATE questions SET
  question_text = 'Quando você tem uma ideia nova, qual é o seu estilo?',
  helper_text = 'Não existe resposta certa ou errada. Escolha o que mais se parece com você.'
WHERE question_id = 'Q19';

-- Q20: Learning preference
UPDATE questions SET
  question_text = 'Como você prefere aprender?',
  helper_text = 'Pense em como você gosta de estudar e absorver conteúdo.'
WHERE question_id = 'Q20';

-- Q21: Open-ended problems (1-5 slider)
UPDATE questions SET
  question_text = 'Você gosta de problemas que não têm uma única resposta certa?',
  helper_text = 'Pense em debates, cases, dilemas e situações onde há mais de um caminho possível.',
  scale_min_label = '0 — Evito esse tipo de situação',
  scale_mid_label = '50 — Às vezes',
  scale_max_label = '100 — Adoro esse tipo de desafio'
WHERE question_id = 'Q21';

-- Q22: Data analysis before deciding (1-5 slider)
UPDATE questions SET
  question_text = 'O quanto você gosta de analisar dados e informações antes de tomar uma decisão?',
  helper_text = 'Pense em planilhas, gráficos, pesquisas, comparações — tudo que ajuda a decidir com base em dados.',
  scale_min_label = '0 — Prefiro decidir no instinto',
  scale_mid_label = '50 — Depende da situação',
  scale_max_label = '100 — Adoro analisar antes de decidir'
WHERE question_id = 'Q22';

-- Q23: Presenting/pitching (1-5 slider)
UPDATE questions SET
  question_text = 'Como você se sente ao apresentar ou fazer um pitch para um grupo?',
  helper_text = 'Pense em apresentações, palestras, vendas, defesa de ideia — situações em que você fala para um público.',
  scale_min_label = '0 — Detesto falar em público',
  scale_mid_label = '50 — Não amo, mas me viro',
  scale_max_label = '100 — Adoro apresentar'
WHERE question_id = 'Q23';

-- Q24: Working under pressure (1-5 slider)
UPDATE questions SET
  question_text = 'Como você se sai trabalhando sob pressão?',
  helper_text = 'Pense em prazos apertados, datas importantes, situações de alta responsabilidade.',
  scale_min_label = '0 — Me paraliso ou erro muito',
  scale_mid_label = '50 — Me viro, mas prefiro sem pressão',
  scale_max_label = '100 — Rendo mais sob pressão'
WHERE question_id = 'Q24';

-- Q25: Group work role
UPDATE questions SET
  question_text = 'Em trabalhos em grupo, qual papel você costuma assumir?',
  helper_text = 'Não existe resposta melhor ou pior. Escolha o que mais se parece com você.'
WHERE question_id = 'Q25';

-- Q26: Networking importance (1-5 slider)
UPDATE questions SET
  question_text = 'O quanto fazer contatos e networking é importante para você?',
  helper_text = 'Pense em conhecer gente, manter relacionamentos profissionais, participar de eventos e comunidades.',
  scale_min_label = '0 — Não me importo com isso',
  scale_mid_label = '50 — É legal, mas não é prioridade',
  scale_max_label = '100 — É muito importante para mim'
WHERE question_id = 'Q26';

-- Q27: International experience (1-5 slider)
UPDATE questions SET
  question_text = 'O quanto ter experiência internacional é importante para você?',
  helper_text = 'Pense em intercâmbio, estágio fora, semestres no exterior, cursos internacionais.',
  scale_min_label = '0 — Não me interessa',
  scale_mid_label = '50 — Seria legal, mas não é essencial',
  scale_max_label = '100 — É muito importante para mim'
WHERE question_id = 'Q27';

-- Q28: Living abroad
UPDATE questions SET
  question_text = 'Você toparia morar fora do Brasil durante parte da graduação?',
  helper_text = 'Algumas faculdades oferecem programas de intercâmbio ou dupla diplomação.'
WHERE question_id = 'Q28';

-- Q29: Creating own company (1-5 slider)
UPDATE questions SET
  question_text = 'Você gostaria de criar sua própria empresa no futuro?',
  helper_text = 'Não precisa ter um plano — apenas indique o quanto essa ideia te atrai.',
  scale_min_label = '0 — Não me interessa',
  scale_mid_label = '50 — Talvez um dia',
  scale_max_label = '100 — Com certeza quero'
WHERE question_id = 'Q29';

-- Q30: Finance/investments interest (1-5 slider)
UPDATE questions SET
  question_text = 'O quanto mercado financeiro e investimentos te interessam?',
  helper_text = 'Pense em ações, renda fixa, criptomoedas, carreira em bancos ou fundos de investimento.',
  scale_min_label = '0 — Não me interessa',
  scale_mid_label = '50 — Tenho curiosidade',
  scale_max_label = '100 — Me interessa muito'
WHERE question_id = 'Q30';

-- Q31: Technology/AI interest (1-5 slider)
UPDATE questions SET
  question_text = 'O quanto tecnologia, dados e inteligência artificial te interessam?',
  helper_text = 'Pense em programação, análise de dados, IA, automação, startups de tecnologia.',
  scale_min_label = '0 — Não me interessa',
  scale_mid_label = '50 — Tenho curiosidade',
  scale_max_label = '100 — Me interessa muito'
WHERE question_id = 'Q31';

-- Q32: Social impact interest (1-5 slider)
UPDATE questions SET
  question_text = 'O quanto impacto social e sustentabilidade te importam?',
  helper_text = 'Pense em projetos sociais, meio ambiente, diversidade, inclusão, ESG.',
  scale_min_label = '0 — Não é prioridade',
  scale_mid_label = '50 — É importante, mas não é o principal',
  scale_max_label = '100 — É uma prioridade para mim'
WHERE question_id = 'Q32';

-- Q33: College priorities
UPDATE questions SET
  question_text = 'Escolha as 3 coisas mais importantes para você em uma faculdade.',
  helper_text = 'Selecione até 3 opções que mais importam para você na hora de escolher uma faculdade.'
WHERE question_id = 'Q33';

-- Q34: Self-description
UPDATE questions SET
  question_text = 'Qual dessas frases combina mais com você?',
  helper_text = 'Não existe resposta certa. Escolha a que mais se parece com o que você quer para o seu futuro.'
WHERE question_id = 'Q34';

-- Q35: Preferred environment
UPDATE questions SET
  question_text = 'Qual tipo de ambiente de faculdade mais te anima?',
  helper_text = 'Pense no clima geral do campus — como as pessoas são, como as aulas funcionam, o que é valorizado.'
WHERE question_id = 'Q35';

-- Q36: R$100k idea (text)
UPDATE questions SET
  question_text = 'Se você recebesse R$100 mil para desenvolver uma ideia, o que você faria?',
  helper_text = 'Pode ser um negócio, um projeto social, uma pesquisa, um app, uma iniciativa — qualquer coisa. Não precisa ser realista, apenas descreva o que te empolga.'
WHERE question_id = 'Q36';

-- Q37: Dream college (text)
UPDATE questions SET
  question_text = 'Sem citar nomes, como seria a faculdade perfeita para você?',
  helper_text = 'Descreva o que você procura: tamanho, estilo de aula, tipos de aluno, valores, oportunidades — o que for importante para você.'
WHERE question_id = 'Q37';

-- Q38: Dealbreakers (text)
UPDATE questions SET
  question_text = 'O que você NÃO gostaria de encontrar em uma faculdade?',
  helper_text = 'Pense em coisas que te afastariam de uma instituição — estilo de ensino, ambiente, valores, estrutura, etc.'
WHERE question_id = 'Q38';

-- Q39: Known colleges (text)
UPDATE questions SET
  question_text = 'Quais cursos ou faculdades você já conhece ou tem curiosidade?',
  helper_text = 'Pode citar nomes, áreas ou tipos de curso. Se não conhece nenhuma, pode pular.'
WHERE question_id = 'Q39';

-- Q40: Anonymous data usage
UPDATE questions SET
  question_text = 'Você autoriza o uso anônimo das suas respostas para melhorar o algoritmo?',
  helper_text = 'Seus dados serão usados apenas de forma anônima para aprimorar a ferramenta. Nada que identifique você será compartilhado.'
WHERE question_id = 'Q40';
