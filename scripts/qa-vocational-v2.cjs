const { VOCATIONAL_QUESTIONS, VOCATIONAL_COURSES, DIMENSION_LABELS, DIMENSION_WEIGHTS } = require('/tmp/qa/out/vocational-data.js');

const dims = Object.keys(DIMENSION_LABELS);

function pickAnswer(question, target) {
  if (question.bipolar) {
    const score = (obj) => {
      let sum = 0, w = 0;
      for (const [d, weight] of Object.entries(obj)) {
        sum += (target[d] ?? 50) * weight;
        w += weight;
      }
      return w ? sum / w : 50;
    };
    const low = score(question.bipolar.lowDimensions);
    const high = score(question.bipolar.highDimensions);
    const delta = high - low;
    if (delta <= -35) return 0;
    if (delta <= -12) return 1;
    if (delta < 12) return 2;
    if (delta < 35) return 3;
    return 4;
  }
  let sum = 0, w = 0;
  for (const [d, weight] of Object.entries(question.dimensions)) {
    sum += (target[d] ?? 50) * weight;
    w += weight;
  }
  const desired = w ? sum / w : 50;
  return Math.max(0, Math.min(4, Math.round(desired / 25)));
}

function calculateProfile(answers) {
  const sums = Object.fromEntries(dims.map(d => [d, 0]));
  const weights = Object.fromEntries(dims.map(d => [d, 0]));
  for (const q of VOCATIONAL_QUESTIONS) {
    const answer = answers[q.id];
    if (q.bipolar) {
      const lowValue = (4 - answer) * 25;
      const highValue = answer * 25;
      for (const [d, wt] of Object.entries(q.bipolar.lowDimensions)) { sums[d] += lowValue * wt; weights[d] += wt; }
      for (const [d, wt] of Object.entries(q.bipolar.highDimensions)) { sums[d] += highValue * wt; weights[d] += wt; }
    } else {
      const normalized = answer * 25;
      for (const [d, wt] of Object.entries(q.dimensions)) { sums[d] += normalized * wt; weights[d] += wt; }
    }
  }
  return Object.fromEntries(dims.map(d => [d, weights[d] ? Math.round(sums[d] / weights[d]) : 50]));
}

function courseScore(profile, course) {
  let fit = 0, tw = 0;
  for (const d of dims) {
    const w = DIMENSION_WEIGHTS[d];
    fit += Math.max(0, 100 - Math.abs(profile[d] - course.profile[d])) * w;
    tw += w;
  }
  return Math.round(fit / tw);
}

const personas = [
  ['Clínico cuidador', {social:95,people_contact:95,health_biology:95,investigative:75,conventional:65,realistic:60,verbal_humanities:55,quantitative:45,technology:25,business:20,enterprising:35,artistic:25}, ['Medicina','Enfermagem','Fonoaudiologia','Terapia Ocupacional','Fisioterapia','Psicologia']],
  ['Tech builder', {technology:100,quantitative:90,investigative:90,realistic:70,conventional:60,business:35,enterprising:40,social:25,people_contact:25,artistic:30,verbal_humanities:25,health_biology:15}, ['Engenharia de Computação','Ciência da Computação','Engenharia de Software','Sistemas de Informação','Análise e Desenvolvimento de Sistemas']],
  ['Jurídico-político', {verbal_humanities:100,enterprising:75,conventional:70,investigative:70,people_contact:65,social:55,business:55,quantitative:30,technology:25,health_biology:10,realistic:20,artistic:45}, ['Direito','Relações Internacionais','Relações Públicas','Jornalismo','História']],
  ['Criativo visual', {artistic:100,realistic:65,verbal_humanities:65,enterprising:55,business:50,people_contact:50,technology:45,investigative:40,social:35,conventional:30,quantitative:20,health_biology:10}, ['Design','Moda','Cinema e Audiovisual','Publicidade e Propaganda','Arquitetura e Urbanismo']],
  ['Líder de negócios', {business:100,enterprising:95,people_contact:75,quantitative:70,conventional:65,verbal_humanities:55,technology:55,social:45,investigative:50,realistic:35,artistic:40,health_biology:10}, ['Administração','Marketing','Ciências Econômicas','Ciências Contábeis','Gestão de Recursos Humanos','Logística']],
  ['Cientista exato', {investigative:100,quantitative:100,technology:70,conventional:65,realistic:50,verbal_humanities:35,artistic:25,business:20,enterprising:20,social:20,people_contact:20,health_biology:35}, ['Matemática','Física','Química','Ciência da Computação','Engenharia Química']],
  ['Ciências da vida', {investigative:95,health_biology:95,realistic:70,quantitative:60,conventional:60,social:45,people_contact:35,technology:45,verbal_humanities:35,business:20,enterprising:20,artistic:25}, ['Ciências Biológicas','Biomedicina','Farmácia','Agronomia','Medicina Veterinária']],
  ['Educação-humanidades', {social:90,verbal_humanities:95,people_contact:85,investigative:60,artistic:55,conventional:50,enterprising:40,business:20,technology:25,quantitative:25,health_biology:20,realistic:25}, ['Pedagogia','Letras','História','Serviço Social','Psicologia']],
];

let failures = 0;
console.log(`Questions: ${VOCATIONAL_QUESTIONS.length}; Courses: ${VOCATIONAL_COURSES.length}`);
for (const [name, target, expected] of personas) {
  const answers = Object.fromEntries(VOCATIONAL_QUESTIONS.map(q => [q.id, pickAnswer(q, target)]));
  const profile = calculateProfile(answers);
  const ranking = VOCATIONAL_COURSES.map(course => ({name: course.name, score: courseScore(profile, course)})).sort((a,b) => b.score-a.score);
  const top5 = ranking.slice(0,5);
  const overlap = top5.filter(x => expected.includes(x.name)).length;
  const topExpected = expected.includes(top5[0].name);
  const mse = dims.reduce((s,d) => s + Math.pow((profile[d] ?? 50) - (target[d] ?? 50), 2), 0) / dims.length;
  console.log(`\n${name}`);
  console.log('Profile:', profile);
  console.log('Top 5:', top5.map(x => `${x.name} ${x.score}`).join(' | '));
  console.log(`Expected overlap: ${overlap}/5; top expected: ${topExpected}; profile RMSE: ${Math.sqrt(mse).toFixed(1)}`);
  if (!topExpected || overlap < 3) failures++;
}
const topWinners = new Set();
for (const [, target] of personas) {
  const answers = Object.fromEntries(VOCATIONAL_QUESTIONS.map(q => [q.id, pickAnswer(q, target)]));
  const profile = calculateProfile(answers);
  const top = VOCATIONAL_COURSES.map(c => ({name:c.name, score:courseScore(profile,c)})).sort((a,b)=>b.score-a.score)[0];
  topWinners.add(top.name);
}
console.log(`\nDistinct top winners: ${topWinners.size}/${personas.length}: ${[...topWinners].join(', ')}`);
if (topWinners.size < 5) failures++;
if (VOCATIONAL_QUESTIONS.length !== 48) failures++;
if (VOCATIONAL_COURSES.length !== 50) failures++;
console.log(`\nQA_RESULT=${failures === 0 ? 'PASS' : 'REVIEW'} failures=${failures}`);
process.exit(failures === 0 ? 0 : 2);
