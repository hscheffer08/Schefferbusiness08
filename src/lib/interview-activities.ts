export const interviewActivities = [
  ['Apresentação pessoal', 'Conte sua trajetória em 90 segundos e conecte duas experiências à escolha do curso.', 'Agora apresente a mesma trajetória em 30 segundos, preservando sua mensagem principal.'],
  ['Motivação pela faculdade', 'Explique por que escolheu esta faculdade com dois aspectos públicos que você pesquisou e como pretende aproveitá-los.', 'Além da reputação, o que faria você escolher esta instituição? Relacione sua resposta a uma experiência real.'],
  ['Escolha do curso', 'Qual experiência concreta despertou seu interesse pelo curso e o que você fez para explorar esse interesse?', 'Que dificuldade você espera encontrar no curso e como pretende se preparar para ela?'],
  ['Liderança', 'Conte uma situação em que mobilizou pessoas sem ter autoridade formal. Qual foi sua ação e o resultado?', 'Descreva uma decisão sua como líder que você mudaria hoje. Explique o aprendizado.'],
  ['Colaboração', 'Relate um trabalho em equipe em que sua contribuição fez diferença, distinguindo seu papel do resultado coletivo.', 'Como você reagiria a um integrante que não entrega sua parte? Dê uma resposta prática e respeitosa.'],
  ['Conflito', 'Conte uma discordância real: como ouviu o outro lado, decidiu e preservou a relação?', 'O entrevistador discorda da sua proposta. Reconheça a objeção e defenda seu ponto com uma evidência.'],
  ['Aprendizado com erro', 'Descreva um erro pelo qual você foi responsável, a consequência e o que mudou no seu comportamento.', 'Como você verificou se realmente aprendeu com esse erro? Dê um exemplo posterior.'],
  ['Iniciativa empreendedora', 'Identifique um problema que você tentou resolver: quem enfrentava o problema, o que testou e o que aprendeu?', 'Você tem R$ 100 e uma semana para testar uma ideia. Explique o primeiro experimento e o critério para continuar.'],
  ['Decisão sob incerteza', 'Conte uma decisão tomada com informações incompletas. Quais alternativas e riscos considerou?', 'Uma informação nova contradiz sua proposta. Explique o que você mantém, o que muda e por quê.'],
  ['Ética e responsabilidade', 'Um colega propõe exagerar os resultados de um projeto na apresentação. Como você responde e que alternativa oferece?', 'Você percebe que uma solução beneficia seu grupo e prejudica outro. Como investigaria e decidiria?'],
  ['Autoconhecimento', 'Qual habilidade sua ainda precisa evoluir? Dê um exemplo e descreva o treino que já começou.', 'Conte um feedback difícil que recebeu. O que aceitou, o que questionou e o que fez depois?'],
  ['Contribuição e futuro', 'Como você pretende contribuir para a comunidade da faculdade? Conecte uma ação viável ao que já fez.', 'Onde você gostaria de chegar e qual será seu próximo passo? Explique também como lidará se o plano mudar.'],
].flatMap(([category, first, second], index) => [
  { id: `activity-${index + 1}-a`, category, title: `${category}: construir`, question: first, target: 'Responda em até 90 segundos com contexto, ação própria e reflexão.' },
  { id: `activity-${index + 1}-b`, category, title: `${category}: aprofundar`, question: second, target: 'Responda em até 60 segundos. Seja direto e sustente sua decisão.' },
]);
