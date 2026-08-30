import type { VocationalCourse } from '@/lib/vocational-data';

export interface VocationalUniversityReference {
  name: string;
  location: string;
  type: 'Pública' | 'Privada';
  strength: string;
  badge: string;
  url: string;
}

export interface VocationalPresentation {
  imageUrl: string;
  imageAlt: string;
  tagline: string;
  universities: VocationalUniversityReference[];
}

const U = {
  usp: { name: 'Universidade de São Paulo (USP)', location: 'São Paulo, SP', type: 'Pública' as const, url: 'https://www5.usp.br/' },
  unicamp: { name: 'Universidade Estadual de Campinas (Unicamp)', location: 'Campinas, SP', type: 'Pública' as const, url: 'https://www.unicamp.br/' },
  unifesp: { name: 'Universidade Federal de São Paulo (Unifesp)', location: 'São Paulo, SP', type: 'Pública' as const, url: 'https://www.unifesp.br/' },
  ufmg: { name: 'Universidade Federal de Minas Gerais (UFMG)', location: 'Belo Horizonte, MG', type: 'Pública' as const, url: 'https://www.ufmg.br/' },
  ufrj: { name: 'Universidade Federal do Rio de Janeiro (UFRJ)', location: 'Rio de Janeiro, RJ', type: 'Pública' as const, url: 'https://ufrj.br/' },
  ufrgs: { name: 'Universidade Federal do Rio Grande do Sul (UFRGS)', location: 'Porto Alegre, RS', type: 'Pública' as const, url: 'https://www.ufrgs.br/' },
  unesp: { name: 'Universidade Estadual Paulista (Unesp)', location: 'São Paulo, SP', type: 'Pública' as const, url: 'https://www2.unesp.br/' },
  ufv: { name: 'Universidade Federal de Viçosa (UFV)', location: 'Viçosa, MG', type: 'Pública' as const, url: 'https://www.ufv.br/' },
  fgv: { name: 'Fundação Getulio Vargas (FGV)', location: 'São Paulo / Rio de Janeiro', type: 'Privada' as const, url: 'https://portal.fgv.br/' },
  insper: { name: 'Insper', location: 'São Paulo, SP', type: 'Privada' as const, url: 'https://www.insper.edu.br/' },
  pucsp: { name: 'PUC-SP', location: 'São Paulo, SP', type: 'Privada' as const, url: 'https://www.pucsp.br/' },
  pucrio: { name: 'PUC-Rio', location: 'Rio de Janeiro, RJ', type: 'Privada' as const, url: 'https://www.puc-rio.br/' },
  mack: { name: 'Universidade Presbiteriana Mackenzie', location: 'São Paulo, SP', type: 'Privada' as const, url: 'https://www.mackenzie.br/' },
  espm: { name: 'ESPM', location: 'São Paulo, SP', type: 'Privada' as const, url: 'https://www.espm.br/' },
  unb: { name: 'Universidade de Brasília (UnB)', location: 'Brasília, DF', type: 'Pública' as const, url: 'https://www.unb.br/' },
  ita: { name: 'Instituto Tecnológico de Aeronáutica (ITA)', location: 'São José dos Campos, SP', type: 'Pública' as const, url: 'https://www.ita.br/' },
};

const ref = (university: typeof U[keyof typeof U], strength: string, badge: string): VocationalUniversityReference => ({ ...university, strength, badge });
const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1800&q=84`;

// Fotografias específicas por curso. O fallback por área é usado somente quando o curso não tem imagem própria.
const COURSE_IMAGES: Record<string, string> = {
  medicina: img('photo-1538108149393-fbbd81895907'),
  psicologia: img('photo-1573497620053-ea5300f94f21'),
  enfermagem: img('photo-1551076805-e1869033e561'),
  odontologia: img('photo-1606811971618-4486d14f3f99'),
  fisioterapia: img('photo-1576091160550-2173dba999ef'),
  veterinaria: img('photo-1628009368231-7bb7cfcb0def'),
  farmacia: img('photo-1584308666744-24d5c474f2ae'),
  biomedicina: img('photo-1532187863486-abf9dbad1b69'),
  nutricao: img('photo-1498837167922-ddd27525d352'),
  direito: img('photo-1589829545856-d10d557cf95f'),
  administracao: img('photo-1521737711867-e3b97375f902'),
  contabeis: img('photo-1554224155-6726b3ff858f'),
  economia: img('photo-1611974789855-9c2a0a7236a3'),
  sistemas: img('photo-1515879218367-8466d910aaa4'),
  'ciencia-computacao': img('photo-1555066931-4365d14bab8c'),
  computacao: img('photo-1555066931-4365d14bab8c'),
  software: img('photo-1461749280684-dccba630e2f6'),
  ads: img('photo-1498050108023-c5249f4df085'),
  engcivil: img('photo-1503387762-592deb58ef4e'),
  engmecanica: img('photo-1581092160607-ee22621dd758'),
  engproducao: img('photo-1565793298595-6a879b1d9492'),
  engeletrica: img('photo-1620283085439-39620a1e21c4'),
  arquitetura: img('photo-1503387762-592deb58ef4e'),
  design: img('photo-1513364776144-60967b0f800f'),
  pedagogia: img('photo-1509062522246-3755977927d7'),
  jornalismo: img('photo-1504711434969-e33886168f5c'),
  publicidade: img('photo-1497366754035-f200968a6e72'),
  agronomia: img('photo-1500382017468-9049fed747ef'),
  ri: img('photo-1529107386315-e1a2ed48a620'),
  'relacoes-internacionais': img('photo-1529107386315-e1a2ed48a620'),
  servico_social: img('photo-1559027615-cd4628902d4a'),
  'servico-social': img('photo-1559027615-cd4628902d4a'),
  educacao_fisica: img('photo-1518611012118-696072aa579a'),
  'educacao-fisica': img('photo-1518611012118-696072aa579a'),
};

const AREA_IMAGES = {
  health: img('photo-1576091160399-112ba8d25d1d'),
  law: img('photo-1589829545856-d10d557cf95f'),
  business: img('photo-1521737711867-e3b97375f902'),
  technology: img('photo-1515879218367-8466d910aaa4'),
  engineering: img('photo-1581092160607-ee22621dd758'),
  architecture: img('photo-1497366811353-6870744d04b2'),
  education: img('photo-1509062522246-3755977927d7'),
  science: img('photo-1532187863486-abf9dbad1b69'),
  communication: img('photo-1504711434969-e33886168f5c'),
  agro: img('photo-1500382017468-9049fed747ef'),
  social: img('photo-1521295121783-8a321d551ad2'),
};

function group(course: VocationalCourse) {
  const id = course.id.toLowerCase();
  const name = course.name.toLowerCase();
  const area = course.area.toLowerCase();
  if (id === 'direito' || area.includes('juríd')) return 'law';
  if (['administracao', 'contabeis', 'economia', 'gestao-rh', 'logistica'].includes(id) || area.includes('negócio') || area.includes('finan') || area.includes('gestão')) return 'business';
  if (['sistemas', 'ciencia-computacao', 'computacao', 'software', 'ads'].some((x) => id.includes(x)) || area.includes('tecnolog')) return 'technology';
  if (area.includes('engenharia') || name.includes('engenharia')) return 'engineering';
  if (name.includes('arquitetura') || name.includes('design') || name.includes('moda')) return 'architecture';
  if (name.includes('pedagogia') || area.includes('educa')) return 'education';
  if (name.includes('jornalismo') || name.includes('publicidade') || name.includes('comunicação') || name.includes('marketing') || name.includes('relações públicas') || name.includes('cinema')) return 'communication';
  if (name.includes('relações internacionais') || name.includes('serviço social') || name.includes('história') || name.includes('geografia') || name.includes('letras')) return 'social';
  if (name.includes('veterin') || name.includes('agronom') || name.includes('gastronomia')) return 'agro';
  if (area.includes('saúde') || name.includes('medicina') || name.includes('psicologia') || name.includes('enfermagem') || name.includes('farmácia') || name.includes('nutrição') || name.includes('fisioterapia') || name.includes('odontologia') || name.includes('biomedicina') || name.includes('terapia ocupacional') || name.includes('fonoaudiologia')) return 'health';
  return 'science';
}

function courseImage(course: VocationalCourse, key: string) {
  const id = course.id.toLowerCase();
  const normalizedName = course.name.toLowerCase();
  const direct = COURSE_IMAGES[id];
  if (direct) return direct;
  const matched = Object.entries(COURSE_IMAGES).find(([token]) => normalizedName.includes(token.replaceAll('-', ' ').replaceAll('_', ' ')));
  return matched?.[1] ?? AREA_IMAGES[key as keyof typeof AREA_IMAGES] ?? AREA_IMAGES.science;
}

export function getVocationalPresentation(course: VocationalCourse): VocationalPresentation {
  const key = group(course);
  const imageUrl = courseImage(course, key);

  if (key === 'law') return { imageUrl, imageAlt: `Imagem relacionada ao curso de ${course.name}`, tagline: 'Argumentação, instituições, estratégia e decisões com impacto real.', universities: [ref(U.usp,'Tradição acadêmica, pesquisa e forte formação jurídica','Referência nacional'),ref(U.fgv,'Método aplicado, direito empresarial e conexão com mercado','Forte em mercado'),ref(U.pucsp,'Formação jurídica consolidada e forte tradição humanística','Tradição'),ref(U.ufmg,'Pesquisa, extensão e formação jurídica de alta reputação','Pública de destaque')] };
  if (key === 'business') return { imageUrl, imageAlt: `Imagem relacionada ao curso de ${course.name}`, tagline: 'Estratégia, liderança, análise e decisões que movem organizações.', universities: [ref(U.fgv,'Business, economia, gestão e forte conexão com empresas','Mercado & estratégia'),ref(U.insper,'Formação quantitativa, negócios e proximidade com mercado','Quantitativo'),ref(U.usp,'Base acadêmica robusta em economia, administração e contabilidade','Pesquisa & reputação'),ref(U.pucrio,'Negócios, economia e formação interdisciplinar','Interdisciplinar')] };
  if (key === 'technology') return { imageUrl, imageAlt: `Imagem relacionada ao curso de ${course.name}`, tagline: 'Código, dados, sistemas e construção de soluções digitais.', universities: [ref(U.usp,'Computação, pesquisa e forte ecossistema tecnológico','Pesquisa'),ref(U.unicamp,'Computação e engenharia com alta intensidade científica','Tecnologia'),ref(U.ufmg,'Ciência da computação, pesquisa e formação técnica sólida','Computação'),ref(U.ufrgs,'Computação e engenharia com tradição acadêmica','Pública de destaque')] };
  if (key === 'engineering') return { imageUrl, imageAlt: `Imagem relacionada ao curso de ${course.name}`, tagline: 'Matemática, projeto, execução e resolução de problemas complexos.', universities: [ref(U.usp,'Poli-USP e forte tradição em múltiplas engenharias','Engenharia'),ref(U.unicamp,'Pesquisa aplicada, inovação e formação tecnológica','Inovação'),ref(U.ita,'Alta intensidade quantitativa e excelência tecnológica','Exatas intensas'),ref(U.ufrj,'Engenharia, pesquisa e forte tradição em infraestrutura e indústria','Tradição')] };
  if (key === 'architecture') return { imageUrl, imageAlt: `Imagem relacionada ao curso de ${course.name}`, tagline: 'Criatividade, técnica e visão espacial para transformar ambientes.', universities: [ref(U.usp,'FAU-USP, tradição em arquitetura, urbanismo e pesquisa','Arquitetura'),ref(U.mack,'Forte tradição em arquitetura e conexão com prática profissional','Mercado'),ref(U.ufrj,'Arquitetura, urbanismo e produção acadêmica relevante','Pública de destaque'),ref(U.ufmg,'Formação sólida em arquitetura, urbanismo e projeto','Projeto')] };
  if (key === 'communication') return { imageUrl, imageAlt: `Imagem relacionada ao curso de ${course.name}`, tagline: 'Narrativa, criatividade, estratégia e leitura de cultura e comportamento.', universities: [ref(U.usp,'ECA-USP e forte tradição acadêmica em comunicação','Reputação'),ref(U.espm,'Publicidade, marketing, mídia e forte conexão com mercado','Mercado criativo'),ref(U.pucrio,'Comunicação, design e formação interdisciplinar','Criatividade'),ref(U.ufrj,'Comunicação e produção acadêmica em mídia e cultura','Pública de destaque')] };
  if (key === 'education') return { imageUrl, imageAlt: `Imagem relacionada ao curso de ${course.name}`, tagline: 'Aprendizagem, desenvolvimento humano e impacto por meio da educação.', universities: [ref(U.usp,'Educação, pesquisa e formação docente de alta reputação','Pesquisa'),ref(U.unicamp,'Educação e pesquisa com forte tradição acadêmica','Educação'),ref(U.pucsp,'Formação humanística e tradição em educação e psicologia','Humanidades'),ref(U.ufmg,'Pesquisa, extensão e formação docente consolidada','Pública de destaque')] };
  if (key === 'agro') return { imageUrl, imageAlt: `Imagem relacionada ao curso de ${course.name}`, tagline: 'Ciência da vida, campo, produção e impacto sobre sistemas biológicos.', universities: [ref(U.usp,'ESALQ e forte tradição em ciências agrárias e veterinárias','Agro & pesquisa'),ref(U.unesp,'Veterinária, agrárias e ampla estrutura multicampi','Área animal'),ref(U.ufv,'Referência histórica em ciências agrárias','Ciências agrárias'),ref(U.ufmg,'Veterinária, biológicas e pesquisa aplicada','Pesquisa')] };
  if (key === 'social') return { imageUrl, imageAlt: `Imagem relacionada ao curso de ${course.name}`, tagline: 'Sociedade, instituições, pessoas e problemas públicos complexos.', universities: [ref(U.unb,'Política, relações internacionais e proximidade institucional','Brasília'),ref(U.usp,'Ciências humanas e sociais com forte produção acadêmica','Pesquisa'),ref(U.pucrio,'Relações internacionais e ciências sociais com perfil global','Internacional'),ref(U.fgv,'Políticas públicas, relações internacionais e análise aplicada','Políticas públicas')] };
  if (key === 'health') return { imageUrl, imageAlt: `Imagem específica relacionada ao curso de ${course.name}`, tagline: 'Ciência, responsabilidade e cuidado com pessoas em contextos reais.', universities: [ref(U.usp,'Ampla força em medicina, saúde, psicologia e ciências da vida','Referência nacional'),ref(U.unicamp,'Pesquisa biomédica, saúde e forte estrutura acadêmica','Pesquisa'),ref(U.unifesp,'Instituição historicamente especializada em saúde','Saúde'),ref(U.ufmg,'Medicina, saúde e ciências biológicas com forte reputação','Pública de destaque')] };
  return { imageUrl, imageAlt: `Imagem relacionada ao curso de ${course.name}`, tagline: 'Curiosidade, método e investigação para entender problemas em profundidade.', universities: [ref(U.usp,'Pesquisa e formação científica em ampla variedade de áreas','Pesquisa'),ref(U.unicamp,'Ciência, tecnologia e pesquisa de alta intensidade','Ciência'),ref(U.ufmg,'Pesquisa científica e formação interdisciplinar','Pública de destaque'),ref(U.ufrgs,'Tradição acadêmica em ciências e pesquisa','Pesquisa')] };
}

export const VOCATIONAL_UNIVERSITY_NOTE = 'As instituições abaixo são referências fortes para pesquisa inicial, selecionadas a partir de reputação acadêmica, presença recorrente em rankings por área e força institucional. Não constituem um ranking oficial único nem garantem que sejam as melhores opções para todo estudante.';
