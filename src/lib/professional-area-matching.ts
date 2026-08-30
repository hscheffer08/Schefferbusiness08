import type { AcademicArea, AreaUniversity } from '@/lib/area-match-data';
import { EXTRA_AREA_QUESTIONS } from '@/lib/expanded-course-data';

export interface ProfessionalQuestion {
  id: string;
  text: string;
  dimension: string;
  low: string;
  high: string;
  weight: number;
}

export interface ProfessionalAreaMatch {
  university: AreaUniversity;
  fitScore: number;
  academicFit: number;
  learningFit: number;
  environmentFit: number;
  careerFit: number;
  globalPurposeFit: number;
  dataConfidence: number;
  topReasons: string[];
  caution: string;
}

export const PROFESSIONAL_QUESTIONS: ProfessionalQuestion[] = [
  { id:'rigor', dimension:'rigor', weight:1.25, text:'Quanto você valoriza uma formação academicamente exigente e aprofundada?', low:'Prefiro equilíbrio', high:'Quero muito rigor' },
  { id:'practical', dimension:'practical', weight:1.2, text:'Quanto você quer aprender por projetos, casos, laboratório, clínica, estúdio ou prática profissional?', low:'Mais teoria', high:'Muito prática' },
  { id:'research', dimension:'research', weight:1.0, text:'Quanto pesquisa, iniciação científica e produção de conhecimento importam para você?', low:'Pouco', high:'Muito' },
  { id:'people', dimension:'people', weight:1.0, text:'Quanto você quer que sua graduação envolva contato intenso com pessoas e trabalho em equipe?', low:'Mais individual', high:'Muito contato' },
  { id:'technology', dimension:'technology', weight:1.0, text:'Quanto tecnologia, dados e ferramentas digitais devem aparecer na sua formação?', low:'Secundário', high:'Central' },
  { id:'leadership', dimension:'leadership', weight:0.95, text:'Quanto você quer oportunidades de liderança e tomada de decisão?', low:'Pouco', high:'Muito' },
  { id:'structure', dimension:'structure', weight:0.9, text:'Você prefere uma graduação com estrutura clara, sequência definida e bastante acompanhamento?', low:'Mais liberdade', high:'Mais estrutura' },
  { id:'international', dimension:'international', weight:0.85, text:'Quanto oportunidades internacionais, intercâmbio e exposição global pesam na sua escolha?', low:'Pouco', high:'Muito' },
  { id:'flexibility', dimension:'flexibility', weight:0.8, text:'Quanto você valoriza liberdade para escolher eletivas, trilhas e combinar áreas?', low:'Grade definida', high:'Muita flexibilidade' },
  { id:'faculty', dimension:'faculty', weight:0.85, text:'Quanto é importante ter proximidade com professores, mentoria e facilidade para tirar dúvidas?', low:'Pouco', high:'Essencial' },
  { id:'collaboration', dimension:'collaboration', weight:0.9, text:'Quanto você prefere uma cultura de colaboração e apoio entre estudantes?', low:'Mais independente', high:'Muito colaborativa' },
  { id:'competition', dimension:'competition', weight:0.65, text:'Quanto um ambiente competitivo e de alta cobrança te motiva?', low:'Me desgasta', high:'Me motiva' },
  { id:'campus', dimension:'campus', weight:0.7, text:'Quanto vida universitária, organizações estudantis, eventos e comunidade pesam?', low:'Pouco', high:'Muito' },
  { id:'career', dimension:'career', weight:1.1, text:'Quanto você quer contato com empresas, estágios, recrutamento e projetos profissionais durante a graduação?', low:'Secundário', high:'Prioridade máxima' },
  { id:'entrepreneurship', dimension:'entrepreneurship', weight:0.8, text:'Quanto empreendedorismo, inovação e criação de projetos ou negócios importam para você?', low:'Pouco', high:'Muito' },
  { id:'impact', dimension:'impact', weight:0.7, text:'Quanto você quer extensão, impacto social ou conexão com problemas públicos?', low:'Pouco', high:'Muito' },
];

const TECH_AREAS = new Set(['tecnologia','tecnologia-e-ciencia','engenharia','engenharia-e-gestao','engenharia-e-tecnologia','economia-e-financas','negocios-e-financas']);
const HEALTH_AREAS = new Set(['saude','saude-e-ciencias-humanas','saude-biologicas-e-agro','saude-e-quimica','saude-e-laboratorio','saude-e-esporte']);
const CREATIVE_AREAS = new Set(['criacao-e-produto','design-e-construcao','comunicacao-e-marketing','comunicacao']);
const BUSINESS_AREAS = new Set(['negocios-e-gestao','negocios-e-financas','economia-e-financas','humanidades-politica-e-negocios']);

function clamp(v:number,min=45,max=96){ return Math.max(min, Math.min(max,v)); }
function p(u:AreaUniversity,key:string,fallback:number){ return u.matchProfile[key] ?? fallback; }

function expandedProfile(area: AcademicArea, u: AreaUniversity) {
  const premiumResearch = /USP|UNICAMP|UFMG|UFRJ|UFRGS|UnB|UNESP|UFSC|UFPE|UFPR|ITA/.test(u.name);
  const marketLed = /FGV|Insper|ESPM|Ibmec|Mackenzie|Inteli|Link|FAAP|Cásper|FIPECAFI/.test(u.name);
  const values: Record<string, number> = {
    rigor:p(u,'rigor',72), practical:p(u,'practical',68), research:p(u,'research',65), people:p(u,'people',64), technology:p(u,'technology',62), leadership:p(u,'leadership',63), structure:p(u,'structure',67), international:p(u,'international',60),
    flexibility: premiumResearch ? 77 : 68,
    faculty: marketLed ? 78 : 68,
    collaboration: 72,
    competition: marketLed ? 79 : premiumResearch ? 75 : 66,
    campus: premiumResearch ? 82 : 70,
    career: marketLed ? 88 : 72,
    entrepreneurship: /Insper|Inteli|Link|FGV|ESPM/.test(u.name) ? 88 : 62,
    impact: premiumResearch ? 82 : 68,
  };
  if (TECH_AREAS.has(area.id)) { values.technology += 12; values.rigor += 6; values.research += 5; }
  if (HEALTH_AREAS.has(area.id)) { values.practical += 10; values.people += 10; values.structure += 5; values.research += 4; }
  if (CREATIVE_AREAS.has(area.id)) { values.practical += 8; values.flexibility += 9; values.technology += 4; }
  if (BUSINESS_AREAS.has(area.id)) { values.career += 9; values.leadership += 8; values.entrepreneurship += 8; values.international += 4; }
  Object.keys(values).forEach(k => values[k] = clamp(values[k]));
  return values;
}

function areaWeight(area: AcademicArea, dimension: string, base: number) {
  let weight = base;
  if (TECH_AREAS.has(area.id) && ['rigor','technology','research'].includes(dimension)) weight *= 1.18;
  if (HEALTH_AREAS.has(area.id) && ['practical','people','structure','research'].includes(dimension)) weight *= 1.18;
  if (CREATIVE_AREAS.has(area.id) && ['practical','flexibility','technology'].includes(dimension)) weight *= 1.16;
  if (BUSINESS_AREAS.has(area.id) && ['career','leadership','entrepreneurship','international'].includes(dimension)) weight *= 1.16;
  return weight;
}

function weightedFit(area:AcademicArea, profile:Record<string,number>, answers:Record<string,number>, dims:string[]) {
  let sum=0, weightSum=0;
  for (const q of PROFESSIONAL_QUESTIONS.filter(q=>dims.includes(q.dimension))) {
    const target=(answers[q.id] ?? 3)*20;
    const w=areaWeight(area,q.dimension,q.weight);
    const similarity=Math.max(0,100-Math.abs(target-profile[q.dimension]));
    sum += similarity*w; weightSum += w;
  }
  return weightSum ? Math.round(sum/weightSum) : 70;
}

export function professionalQuestionsForArea(area: AcademicArea): ProfessionalQuestion[] {
  return [...PROFESSIONAL_QUESTIONS,
    { id:'quantitative', dimension:'quantitative', weight:0.9, text:`Quanto você quer que ${area.courses} exija raciocínio quantitativo, matemática, estatística ou análise de dados?`, low:'Pouco quantitativo', high:'Muito quantitativo' },
    { id:'theory', dimension:'theory', weight:0.8, text:`Quanto você valoriza fundamentos teóricos e compreensão conceitual profunda em ${area.courses}?`, low:'Mais aplicação', high:'Muita teoria' },
    ...(EXTRA_AREA_QUESTIONS[area.id] ?? []).map((q) => ({ ...q, weight: 1.05 })),
  ];
}

export function calculateProfessionalAreaMatches(area: AcademicArea, answers: Record<string, number>): ProfessionalAreaMatch[] {
  return area.universities.map((university,index) => {
    const profile=expandedProfile(area,university);
    const academicFit=weightedFit(area,profile,answers,['rigor','research','flexibility','faculty']);
    const learningFit=weightedFit(area,profile,answers,['practical','technology','structure']);
    const environmentFit=weightedFit(area,profile,answers,['people','collaboration','competition','campus']);
    const careerFit=weightedFit(area,profile,answers,['career','leadership','entrepreneurship']);
    const globalPurposeFit=weightedFit(area,profile,answers,['international','impact']);
    const raw=Math.round(academicFit*.28+learningFit*.24+environmentFit*.18+careerFit*.20+globalPurposeFit*.10);
    const fitScore=Math.min(96,Math.max(58,raw));
    const reasons=[
      ['Acadêmico',academicFit],['Aprendizagem',learningFit],['Ambiente',environmentFit],['Carreira',careerFit],['Global/impacto',globalPurposeFit]
    ].sort((a,b)=>(b[1] as number)-(a[1] as number)).slice(0,2).map(([name,score])=>`${name}: ${score}% de aderência`);
    const dataConfidence = index < 3 ? 58 : 48;
    return { university, fitScore, academicFit, learningFit, environmentFit, careerFit, globalPurposeFit, dataConfidence, topReasons:reasons, caution:'Compatibilidade de perfil. Qualidade regulatória, indicadores oficiais e chance de admissão devem aparecer em eixos separados.' };
  }).sort((a,b)=>b.fitScore-a.fitScore);
}
