import { readFileSync, writeFileSync } from 'node:fs';

function patch(path, edits) {
  let source = readFileSync(path, 'utf8');
  for (const [from, to] of edits) {
    if (!source.includes(from)) throw new Error(`Expected text not found in ${path}: ${from.slice(0, 80)}`);
    source = source.replace(from, to);
  }
  writeFileSync(path, source);
}

patch('src/components/InterviewCoachPage.tsx', [
  ["type Institution = 'insper' | 'link';", "type Institution = 'link';"],
  ["  insper: { name: 'Insper', accent: '#ff6047', description: 'Motivação, repertório, maturidade, colaboração e clareza de projeto.', source: 'https://www.insper.edu.br/content/insper-portal/pt/quem-somos/faq-insper.html' },\n", ""],
  ["const [institution, setInstitution] = useState<Institution>('insper');", "const [institution, setInstitution] = useState<Institution>('link');"],
  ["document.title = 'Treino de entrevista para Insper e Link | Conectaê';", "document.title = 'Treino de entrevista para Link School of Business | Conectaê';"],
  ["if (description) description.content = 'Pratique entrevistas de admissão para Insper e Link com 10 perguntas adaptativas, feedback por competência e plano de melhoria.';", "if (description) description.content = 'Pratique a entrevista de admissão da Link School of Business com perguntas adaptativas, feedback por competência e plano de melhoria.';"],
  ["<p className=\"mt-2 text-base text-[#b5c8e3]\">Treinos autorais com correção individual por voz ou texto. Selecione a instituição acima e escolha uma atividade.</p>", "<p className=\"mt-2 text-base text-[#b5c8e3]\">Treinos autorais com correção individual por voz ou texto para a Link School of Business. Escolha uma atividade.</p>"]
]);

patch('api/interview-coach.ts', [
  ["type Institution = 'insper' | 'link';", "type Institution = 'link';"],
  ["function guide(institution: Institution) {\n  return institution === 'insper'\n    ? 'INSPER: treine motivação específica, clareza de projeto, maturidade, colaboração, pensamento analítico, comunicação, autoconhecimento, iniciativa, aprendizado com erro e alinhamento entre experiências e curso.'\n    : 'LINK SCHOOL OF BUSINESS: treine jornada pessoal, iniciativa empreendedora, liderança, aprendizado com erro, resolução de problemas, decisões sob incerteza, colaboração, impacto, autoconhecimento, ambição e fit com uma formação prática em negócios. A página oficial descreve a entrevista como etapa final da Link Journey e enfatiza trajetória, potencial, mindset e objetivos.';\n}", "function guide(_institution: Institution) {\n  return 'LINK SCHOOL OF BUSINESS: treine jornada pessoal, iniciativa empreendedora, liderança, aprendizado com erro, resolução de problemas, decisões sob incerteza, colaboração, impacto, autoconhecimento, ambição e fit com uma formação prática em negócios. A página oficial descreve a entrevista como etapa final da Link Journey e enfatiza trajetória, potencial, mindset e objetivos.';\n}"],
  ["institutions: ['insper', 'link']", "institutions: ['link']"],
  ["const institution: Institution = body.institution === 'link' ? 'link' : 'insper';", "if (body.institution && body.institution !== 'link') return json(res, 400, { error: 'Esta ferramenta de entrevista não é oferecida para o processo seletivo atual do Insper Graduação.' });\n    const institution: Institution = 'link';"]
]);

patch('src/main.tsx', [
  ["if(interviewOpen)updateMeta('Treino de entrevista para Insper e Link | Conectaê','Pratique entrevistas de admissão para Insper e Link com 10 perguntas adaptativas, feedback por competência e plano de melhoria.','/treino-entrevista');", "if(interviewOpen)updateMeta('Treino de entrevista para Link School of Business | Conectaê','Pratique a entrevista de admissão da Link School of Business com perguntas adaptativas, feedback por competência e plano de melhoria.','/treino-entrevista');"]
]);

console.log('Insper removido do fluxo de entrevistas de graduação; Link preservada.');
