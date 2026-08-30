from pathlib import Path

DATA = Path('src/lib/vocational-data.ts')
UI = Path('src/components/VocationalDemoPremium.tsx')

data = DATA.read_text()
ui = UI.read_text()

old_iface = """  helper?: string;\n  dimensions: Partial<Record<VocationalDimension, number>>;\n}"""
new_iface = """  helper?: string;\n  dimensions: Partial<Record<VocationalDimension, number>>;\n  bipolar?: {\n    lowLabel: string;\n    highLabel: string;\n    lowDimensions: Partial<Record<VocationalDimension, number>>;\n    highDimensions: Partial<Record<VocationalDimension, number>>;\n  };\n}"""
assert old_iface in data
data = data.replace(old_iface, new_iface, 1)

extra = r"""
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
"""
marker = "  { id: 'V36', group: 'Valores', text: 'Prefiro uma profissão em que meus resultados dependam bastante de iniciativa, comunicação e decisões próprias.', dimensions: { enterprising: 0.7, artistic: 0.2, business: 0.4 } },\n];"
assert marker in data
data = data.replace(marker, marker[:-3] + extra + "];", 1)
DATA.write_text(data)

old_calc = """  VOCATIONAL_QUESTIONS.forEach((question) => {\n    const answer = answers[question.id];\n    if (answer === undefined) return;\n    const normalized = answer * 25;\n    (Object.entries(question.dimensions) as [VocationalDimension, number][]).forEach(([dimension, weight]) => {\n      sums[dimension] += normalized * weight;\n      weights[dimension] += weight;\n    });\n  });"""
new_calc = """  VOCATIONAL_QUESTIONS.forEach((question) => {\n    const answer = answers[question.id];\n    if (answer === undefined) return;\n    if (question.bipolar) {\n      const lowValue = (4 - answer) * 25;\n      const highValue = answer * 25;\n      (Object.entries(question.bipolar.lowDimensions) as [VocationalDimension, number][]).forEach(([dimension, weight]) => {\n        sums[dimension] += lowValue * weight;\n        weights[dimension] += weight;\n      });\n      (Object.entries(question.bipolar.highDimensions) as [VocationalDimension, number][]).forEach(([dimension, weight]) => {\n        sums[dimension] += highValue * weight;\n        weights[dimension] += weight;\n      });\n      return;\n    }\n    const normalized = answer * 25;\n    (Object.entries(question.dimensions) as [VocationalDimension, number][]).forEach(([dimension, weight]) => {\n      sums[dimension] += normalized * weight;\n      weights[dimension] += weight;\n    });\n  });"""
assert old_calc in ui
ui = ui.replace(old_calc, new_calc, 1)

scale_fn = """
function scaleForQuestion(question: (typeof VOCATIONAL_QUESTIONS)[number]) {
  if (!question.bipolar) return SCALE;
  return [
    { value: 0, label: question.bipolar.lowLabel },
    { value: 1, label: 'Mais para a primeira opção' },
    { value: 2, label: 'Equilíbrio entre as duas' },
    { value: 3, label: 'Mais para a segunda opção' },
    { value: 4, label: question.bipolar.highLabel },
  ];
}
"""
anchor = "];\n\nfunction calculateProfile"
assert anchor in ui
ui = ui.replace(anchor, "];\n" + scale_fn + "\nfunction calculateProfile", 1)

old_current = """  const current = VOCATIONAL_QUESTIONS[step];\n  const answered = current ? answers[current.id] !== undefined : false;"""
new_current = """  const current = VOCATIONAL_QUESTIONS[step];\n  const questionScale = current ? scaleForQuestion(current) : SCALE;\n  const answered = current ? answers[current.id] !== undefined : false;"""
assert old_current in ui
ui = ui.replace(old_current, new_current, 1)

ui = ui.replace('title=\"36 perguntas\" text=\"Interesses, estilo de trabalho, aptidões percebidas e valores.\"', 'title=\"48 perguntas\" text=\"Interesses, aptidões percebidas, valores e 12 trade-offs entre famílias de carreira.\"', 1)
ui = ui.replace("<p className=\"text-sm text-ink-500 mb-4\">Quanto esta frase combina com você?</p><div className=\"space-y-2.5\">{SCALE.map", "<p className=\"text-sm text-ink-500 mb-4\">{current.bipolar ? 'Se tiver que escolher, qual lado combina mais com você?' : 'Quanto esta frase combina com você?'}</p><div className=\"space-y-2.5\">{questionScale.map", 1)
UI.write_text(ui)
