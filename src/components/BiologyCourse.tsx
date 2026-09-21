import { useEffect, useMemo, useRef, useState } from 'react';
import TutorFormattedContent from './TutorFormattedContent';
import { supabase, ensureFreshSession } from '../lib/supabase';
import {
  ArrowLeft, BookOpen, Dna,
  ExternalLink, FileText, Lightbulb, Search, Target, Sparkles, Send, Loader2, Download
} from 'lucide-react';

type Lesson = {
  title: string;
  key: string;
  material?: string;
  topics: string[];
  tips: string[];
};

type Module = {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
};

type BiologyMaterial = {
  id: string;
  lesson_key: string;
  file_name: string;
  storage_path: string;
  format: 'pdf' | 'pptx';
  mime_type: string;
  size_bytes: number | null;
};

const modules: Module[] = [
  {
    id: 'celula', title: '1. Biologia celular e metabolismo',
    description: 'Estrutura celular, membranas, divisão celular e obtenção de energia.',
    lessons: [
      { title: 'Membrana plasmática e transportes', key: 'membrana-transporte', material: 'Membrana e Transporte.pptx',
        topics: ['mosaico fluido', 'permeabilidade seletiva', 'difusão simples e facilitada', 'osmose', 'transporte ativo', 'endocitose e exocitose'],
        tips: ['Em osmose, acompanhe a água — ela se desloca para o meio de maior concentração efetiva de solutos.', 'Diferencie transporte passivo de ativo pela necessidade de energia e pelo sentido do gradiente.'] },
      { title: 'Metabolismo celular', key: 'metabolismo-celular', material: 'Metabolismo_Celular(Resp_Fot_Ferm_Quim).pptx',
        topics: ['ATP', 'respiração celular', 'glicólise', 'ciclo de Krebs', 'cadeia respiratória', 'fermentação', 'fotossíntese', 'quimiossíntese'],
        tips: ['Compare local, reagentes, produtos e rendimento energético de cada processo.', 'ENEM costuma cobrar metabolismo em contexto de exercício, alimentos, biocombustíveis e ecologia.'] },
      { title: 'Ciclo celular', key: 'ciclo-celular', material: 'Ciclo Celular.pptx',
        topics: ['interfase', 'G1, S e G2', 'mitose', 'meiose', 'crossing-over', 'variabilidade genética', 'aneuploidias'],
        tips: ['Não confunda número de cromossomos com quantidade de DNA.', 'Associe meiose à formação de gametas e variabilidade; mitose a crescimento, renovação e reprodução assexuada.'] },
    ],
  },
  {
    id: 'molecular', title: '2. Genética e biologia molecular',
    description: 'DNA, RNA, expressão gênica, divisão e genética mendeliana.',
    lessons: [
      { title: 'Replicação do DNA', key: 'replicacao-dna', material: 'Replicação do DNA.pptx',
        topics: ['estrutura do DNA', 'replicação semiconservativa', 'helicase', 'DNA polimerase', 'fita líder e tardia', 'fragmentos de Okazaki'],
        tips: ['Lembre que a DNA polimerase sintetiza no sentido 5’ → 3’.', 'Questões frequentemente conectam mutações, replicação e câncer.'] },
      { title: 'Síntese de RNA e expressão gênica', key: 'sintese-rna', material: 'Síntese_RNA.pptx',
        topics: ['transcrição', 'RNA mensageiro', 'RNA transportador', 'RNA ribossômico', 'código genético', 'tradução', 'síntese proteica'],
        tips: ['Separe bem transcrição de tradução: DNA → RNA e RNA → proteína.', 'Treine leitura de códons e anticódons.'] },
      { title: 'Genética mendeliana e cruzamento-teste', key: 'genetica-mendeliana', material: 'HereditariedadeII_Genética_Mendeliana_Cruzamento_Teste.pptx',
        topics: ['genes e alelos', 'dominância e recessividade', 'genótipo e fenótipo', '1ª lei de Mendel', 'probabilidade', 'heredogramas', 'cruzamento-teste'],
        tips: ['Transforme o enunciado em símbolos antes de montar o cruzamento.', 'Use probabilidade em vez de quadrados de Punnett gigantes quando os eventos forem independentes.'] },
    ],
  },
  {
    id: 'humana', title: '3. Histologia e fisiologia humana',
    description: 'Tecidos e funcionamento integrado do organismo humano.',
    lessons: [
      { title: 'Histologia humana', key: 'histologia-humana', material: 'Histologia_humana.pptx',
        topics: ['tecido epitelial', 'conjuntivo', 'adiposo', 'cartilaginoso', 'ósseo', 'sanguíneo', 'muscular', 'nervoso'],
        tips: ['Associe estrutura à função: forma e composição do tecido quase sempre explicam o que ele faz.', 'Compare músculo estriado esquelético, cardíaco e liso.'] },
      { title: 'Sistema digestório', key: 'sistema-digestorio', material: 'Sistema_Digestório.pdf',
        topics: ['trato digestório', 'boca e glândulas salivares', 'faringe e esôfago', 'estômago', 'intestino delgado e grosso', 'digestão mecânica e química', 'enzimas digestivas', 'fígado e bile', 'pâncreas', 'absorção intestinal', 'nutrientes'],
        tips: ['Monte uma tabela: órgão → secreção/enzima → substrato → produto.', 'Bile emulsifica gorduras; não é enzima.', 'A maior parte da digestão química e da absorção ocorre no intestino delgado; relacione vilosidades e microvilosidades ao aumento da superfície.', 'Compare o pH e a atuação enzimática em boca, estômago e intestino para resolver questões contextualizadas.'] },
      { title: 'Sistema respiratório', key: 'sistema-respiratorio', material: 'Sistema_respiratório.pdf',
        topics: ['cavidade nasal', 'faringe, laringe e traqueia', 'brônquios e bronquíolos', 'pulmões', 'alvéolos', 'hematose', 'ventilação pulmonar', 'diafragma', 'hemoglobina', 'transporte de oxigênio e gás carbônico'],
        tips: ['Na hematose, use gradientes de pressão parcial para entender a difusão.', 'Na inspiração, o diafragma contrai e o volume torácico aumenta; na expiração tranquila ocorre o inverso.', 'Relacione a grande área e a pequena espessura dos alvéolos à eficiência das trocas gasosas.', 'Compare exercício, altitude, tabagismo e doenças respiratórias com ventilação, hematose e transporte de gases.'] },
    ],
  },
  {
    id: 'botanica', title: '4. Botânica',
    description: 'Tecidos vegetais, regulação hormonal e respostas das plantas.',
    lessons: [
      { title: 'Histologia vegetal', key: 'histologia-vegetal', material: 'Histologia vegetal.pptx',
        topics: ['meristemas', 'epiderme', 'parênquimas', 'colênquima', 'esclerênquima', 'xilema', 'floema', 'estômatos'],
        tips: ['Xilema: seiva bruta; floema: seiva elaborada.', 'Entenda transpiração e abertura estomática em vez de apenas decorar tecidos.'] },
      { title: 'Fitormônios', key: 'fitormonios', material: 'Fitormônios.pptx',
        topics: ['auxina', 'giberelina', 'citocinina', 'etileno', 'ácido abscísico', 'tropismos', 'dormência', 'amadurecimento'],
        tips: ['Associe cada hormônio a um efeito-chave e depois às interações entre eles.', 'Fototropismo e gravitropismo são temas clássicos de experimento.'] },
    ],
  },
  {
    id: 'diversidade', title: '5. Diversidade dos seres vivos',
    description: 'Microrganismos, fungos, algas, animais e vertebrados.',
    lessons: [
      { title: 'Micro-organismos', key: 'microorganismos', material: 'Microorganismos.pptx',
        topics: ['diversidade microbiana', 'relações ecológicas', 'saúde', 'indústria', 'biotecnologia'],
        tips: ['Não trate “microrganismo” como um único grupo taxonômico.', 'Separe usos benéficos de mecanismos patogênicos.'] },
      { title: 'Bactérias e bacterioses', key: 'bacterias-bacterioses', material: 'Bacterias_Bacterioses(2).pptx',
        topics: ['estrutura bacteriana', 'reprodução', 'conjugação', 'resistência bacteriana', 'antibióticos', 'bacterioses e prevenção'],
        tips: ['Antibióticos não tratam viroses.', 'Resistência surge por seleção de variantes resistentes; o antibiótico não cria a mutação necessária.'] },
      { title: 'Protozoários e protozooses', key: 'protozoarios-protozooses', material: 'Protozoários e Protozooses.pptx',
        topics: ['protozoários', 'ciclos parasitários', 'doença de Chagas', 'malária', 'amebíase', 'leishmaniose', 'prevenção'],
        tips: ['Para cada parasitose, domine agente, vetor/hospedeiro, transmissão e prevenção.', 'Desenhe o ciclo quando houver hospedeiros diferentes.'] },
      { title: 'Algas', key: 'algas', material: 'Algas.pptx',
        topics: ['características', 'grupos', 'fitoplâncton', 'produção primária', 'marés vermelhas', 'importância econômica'],
        tips: ['Relacione algas à produção de oxigênio e às cadeias aquáticas.', 'Cuidado: “alga” reúne linhagens diferentes.'] },
      { title: 'Reino Fungi', key: 'reino-fungi', material: 'Reino Fungi.pptx',
        topics: ['hifas e micélio', 'nutrição por absorção', 'reprodução', 'decomposição', 'micorrizas', 'líquens', 'micoses'],
        tips: ['Fungos são heterótrofos por absorção, não plantas sem clorofila.', 'Fermentação e decomposição aparecem muito em aplicações.'] },
      { title: 'Reino Animalia', key: 'reino-animalia', material: 'Reino_Animalia.pptx',
        topics: ['planos corporais', 'simetria', 'folhetos embrionários', 'celoma', 'protostômios e deuterostômios', 'principais filos'],
        tips: ['Estude comparativamente: novidade evolutiva → grupo em que aparece.', 'Evite decorar listas sem relacionar anatomia, ambiente e evolução.'] },
      { title: 'Vertebrados', key: 'vertebrados', material: 'Vertebrados.pptx',
        topics: ['peixes', 'anfíbios', 'répteis', 'aves', 'mamíferos', 'circulação', 'respiração', 'excreção', 'reprodução'],
        tips: ['Monte uma matriz comparando respiração, circulação, excreta e reprodução.', 'O ovo amniótico é central para a independência reprodutiva da água.'] },
    ],
  },
  {
    id: 'saude', title: '6. Parasitologia, virologia e saúde',
    description: 'Doenças, ciclos, transmissão, prevenção e saúde pública.',
    lessons: [
      { title: 'Verminoses', key: 'verminoses', material: 'Verminoses.pptx',
        topics: ['platelmintos', 'nematódeos', 'esquistossomose', 'teníase', 'cisticercose', 'ascaridíase', 'ancilostomose', 'prevenção'],
        tips: ['Teníase e cisticercose têm o mesmo gênero envolvido, mas vias de infecção diferentes.', 'Saneamento básico é peça central em muitas questões epidemiológicas.'] },
      { title: 'Dengue', key: 'dengue', material: 'Dengue(2).pptx',
        topics: ['vírus da dengue', 'Aedes aegypti', 'ciclo do vetor', 'transmissão', 'sinais de alarme', 'prevenção', 'controle epidemiológico'],
        tips: ['Separe agente etiológico, vetor e hospedeiro.', 'Questões de dengue frequentemente exigem interpretação de campanhas, gráficos e medidas coletivas.'] },
    ],
  },
  {
    id: 'evolucao', title: '7. Evolução',
    description: 'Processos evolutivos e história evolutiva humana.',
    lessons: [
      { title: 'Evolução humana', key: 'evolucao-humana', material: 'Evolução_Humana(1).pptx',
        topics: ['ancestralidade comum', 'hominínios', 'bipedalismo', 'gênero Homo', 'migrações', 'seleção natural', 'evidências evolutivas'],
        tips: ['Evolução humana não é uma escada linear; pense em árvore ramificada.', 'Humanos atuais não descendem dos macacos atuais: compartilhamos ancestrais comuns.'] },
    ],
  },
];

const questions = [
  { q: 'Uma hemácia colocada em solução fortemente hipotônica tende a:', a: ['perder água e crenar', 'ganhar água e poder sofrer hemólise', 'manter volume por transporte ativo', 'perder sais sem alterar o volume'], correct: 1, why: 'A água entra por osmose em direção ao meio intracelular relativamente mais concentrado, aumentando o volume celular.' },
  { q: 'Na respiração aeróbia, a maior parte do ATP é formada principalmente durante:', a: ['glicólise', 'fermentação', 'cadeia transportadora de elétrons/fosforilação oxidativa', 'formação de lactato'], correct: 2, why: 'A fosforilação oxidativa utiliza o gradiente de prótons gerado pela cadeia respiratória para produzir a maior fração do ATP.' },
  { q: 'A replicação do DNA é chamada semiconservativa porque:', a: ['apenas metade do DNA é copiada', 'cada molécula-filha conserva uma fita parental', 'metade dos genes não é transcrita', 'uma das fitas é sempre descartada'], correct: 1, why: 'Cada dupla hélice resultante possui uma fita antiga e uma fita recém-sintetizada.' },
  { q: 'Em um cruzamento Aa × Aa, a probabilidade de descendente aa é:', a: ['0%', '25%', '50%', '75%'], correct: 1, why: 'As combinações possíveis são AA, Aa, Aa e aa; portanto, 1/4 é aa.' },
  { q: 'A bile participa da digestão principalmente por:', a: ['hidrolisar proteínas', 'quebrar amido', 'emulsificar lipídios', 'produzir glicose'], correct: 2, why: 'Sais biliares fragmentam grandes gotículas de gordura, aumentando a superfície de contato para lipases.' },
  { q: 'As trocas gasosas entre alvéolos e sangue ocorrem predominantemente por:', a: ['transporte ativo', 'difusão', 'fagocitose', 'osmose de gases'], correct: 1, why: 'O₂ e CO₂ difundem-se conforme seus gradientes de pressão parcial.' },
  { q: 'O tecido vegetal responsável pelo transporte predominante de água e sais minerais é:', a: ['floema', 'xilema', 'epiderme', 'meristema'], correct: 1, why: 'O xilema conduz a chamada seiva bruta, sobretudo das raízes para as partes aéreas.' },
  { q: 'O hormônio vegetal fortemente associado ao amadurecimento de frutos é:', a: ['auxina', 'citocinina', 'etileno', 'giberelina'], correct: 2, why: 'O etileno é um hormônio gasoso importante no amadurecimento e em processos de senescência.' },
  { q: 'O uso inadequado de antibióticos favorece bactérias resistentes porque:', a: ['o antibiótico ensina a bactéria a resistir', 'seleciona variantes resistentes já presentes ou surgidas por mutação', 'transforma vírus em bactérias', 'elimina toda variação genética'], correct: 1, why: 'O antibiótico atua como pressão seletiva; indivíduos resistentes sobrevivem e deixam mais descendentes.' },
  { q: 'Uma medida que combate várias verminoses de transmissão fecal-oral é:', a: ['uso indiscriminado de antibióticos', 'saneamento básico e higiene', 'eliminação de vacinas', 'aumento de água parada'], correct: 1, why: 'Tratamento de água/esgoto e higiene interrompem rotas de contaminação por ovos ou formas infectantes.' },
  { q: 'No controle da dengue, a ação mais diretamente ligada à redução do vetor é:', a: ['eliminar recipientes com água parada', 'usar antibiótico preventivo', 'evitar alimentos crus', 'reduzir consumo de açúcar'], correct: 0, why: 'Aedes aegypti utiliza recipientes com água como criadouros; eliminar esses locais reduz sua reprodução.' },
  { q: 'A principal função biológica da meiose é:', a: ['produzir duas células idênticas', 'reduzir a ploidia e gerar variabilidade', 'duplicar permanentemente o DNA', 'impedir recombinação'], correct: 1, why: 'A meiose forma células haploides e aumenta a variabilidade por segregação independente e recombinação.' },
  { q: 'Fungos obtêm nutrientes principalmente por:', a: ['fotossíntese', 'ingestão e digestão interna', 'absorção após digestão extracelular', 'quimiossíntese obrigatória'], correct: 2, why: 'Fungos secretam enzimas no substrato e absorvem moléculas resultantes da digestão extracelular.' },
  { q: 'Sobre evolução humana, é correto afirmar que:', a: ['humanos descendem dos chimpanzés atuais', 'a evolução ocorreu como uma sequência linear única', 'humanos e outros primatas atuais compartilham ancestrais comuns', 'todas as espécies de Homo viveram em épocas totalmente separadas'], correct: 2, why: 'A evolução é ramificada; espécies atuais podem compartilhar ancestrais sem que uma descenda diretamente da outra.' },
  { q: 'A independência reprodutiva do ambiente aquático nos amniotas está fortemente relacionada:', a: ['ao ovo amniótico', 'às brânquias externas', 'à fecundação exclusivamente externa', 'à ausência de anexos embrionários'], correct: 0, why: 'Âmnio e outros anexos embrionários permitem desenvolvimento protegido fora da água.' },
  {"q": "O RNA mensageiro atua na síntese proteica ao:", "a": ["transportar a informação do DNA até os ribossomos", "duplicar o DNA", "transportar oxigênio", "formar a membrana celular"], "correct": 0, "why": "O RNAm contém códons que orientam a sequência de aminoácidos na tradução."},
  {"q": "Uma característica do tecido epitelial é:", "a": ["células muito afastadas", "células justapostas e pouca matriz extracelular", "ausência de renovação celular", "presença obrigatória de vasos sanguíneos"], "correct": 1, "why": "Os epitélios apresentam células próximas, revestem superfícies e formam glândulas; são avasculares."},
  {"q": "A malária é causada por um protozoário do gênero:", "a": ["Taenia", "Plasmodium", "Aedes", "Ascaris"], "correct": 1, "why": "Plasmodium é o agente da malária; fêmeas de mosquitos Anopheles são vetores."},
  {"q": "Em uma cadeia alimentar aquática, algas fotossintetizantes atuam como:", "a": ["consumidores primários", "decompositores exclusivos", "produtores", "consumidores terciários"], "correct": 2, "why": "Elas convertem energia luminosa em energia química e fixam carbono em matéria orgânica."},
  {"q": "Animais são organismos:", "a": ["procariontes autotróficos", "eucariontes multicelulares heterotróficos", "eucariontes unicelulares", "procariontes multicelulares"], "correct": 1, "why": "A multicelularidade, as células eucarióticas e a heterotrofia caracterizam os animais."},

];

const BIOLOGY_PASSWORD = 'cursobiologiacissa';

  const allLessons = modules.flatMap(module => module.lessons.map(lesson => ({ ...lesson, moduleTitle: module.title })));
  const questionMap: Record<string, number[]> = {
    'membrana-transporte':[0], 'metabolismo-celular':[1], 'ciclo-celular':[11],
    'replicacao-dna':[2], 'sintese-rna':[15], 'genetica-mendeliana':[3],
    'histologia-humana':[16], 'sistema-digestorio':[4], 'sistema-respiratorio':[5],
    'histologia-vegetal':[6], 'fitormonios':[7], 'microorganismos':[8],
    'bacterias-bacterioses':[8], 'protozoarios-protozooses':[17], 'algas':[18],
    'reino-fungi':[12], 'reino-animalia':[19], 'vertebrados':[14],
    'verminoses':[9], 'dengue':[10], 'evolucao-humana':[13]
  };

  const topicTerms: Record<string, string[]> = {
    'membrana-transporte':['membrana','osmose','transporte celular'], 'metabolismo-celular':['metabolismo','bioenergética','fermentação','respiração celular'], 'ciclo-celular':['divisão celular','mitose','meiose'],
    'replicacao-dna':['replicação do DNA','DNA'], 'sintese-rna':['RNA','transcrição','expressão gênica'], 'genetica-mendeliana':['genética','hereditariedade','probabilidade genética'],
    'histologia-humana':['histologia humana','tecido epitelial','tecido conjuntivo','tecido muscular','tecido nervoso'], 'sistema-digestorio':['digestório','digestão'], 'sistema-respiratorio':['sistema respiratório','respiratório'],
    'histologia-vegetal':['tecido vegetal','xilema','floema','meristema','estômato'], 'fitormonios':['fitormônio','hormônio vegetal'], 'microorganismos':['microbiologia','micro-organismo'],
    'bacterias-bacterioses':['bactéria','bacteriose','microbiologia'], 'protozoarios-protozooses':['protozoário','protozoose'], 'algas':['alga','fitoplâncton'],
    'reino-fungi':['fungo','fungi'], 'reino-animalia':['animal','zoologia'], 'vertebrados':['vertebrado','anfíbio','mamífero','répteis','peixes','aves'],
    'verminoses':['verminose','helminto','parasita'], 'dengue':['dengue','Aedes'], 'evolucao-humana':['evolução','seleção natural']
  };


export default function BiologyCourse() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('biology-course-unlocked') === 'true');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [query, setQuery] = useState('');
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [materials, setMaterials] = useState<Record<string, BiologyMaterial[]>>({});
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [materialsError, setMaterialsError] = useState('');
  const [materialPreview, setMaterialPreview] = useState<{ url: string; file: BiologyMaterial } | null>(null);
  const [topicQuestions, setTopicQuestions] = useState<any[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{role:'user'|'assistant';content:string}>>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [questionsError, setQuestionsError] = useState('');
  const aiRequest = useRef(0);
  const filtered = useMemo(() => {
    const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const term = normalize(query.trim());
    if (!term) return modules;
    return modules.map(m => ({
      ...m,
      lessons: normalize(m.title).includes(term) ? m.lessons : m.lessons.filter(l =>
        normalize([l.title, l.material ?? '', ...l.topics, ...l.tips].join(' ')).includes(term)
      ),
    })).filter(m => m.lessons.length);
  }, [query]);

  const lessonCount = modules.reduce((n, m) => n + m.lessons.length, 0);

  const currentLesson = allLessons.find(lesson => lesson.key === selectedLesson);
  const currentQuestions = currentLesson ? (questionMap[currentLesson.key] || []).map(i => ({...questions[i], index:i})) : [];
  const currentMaterials = currentLesson ? (materials[currentLesson.key] || []) : [];
  const materialUrl = (file: BiologyMaterial) => supabase
    ? supabase.storage.from('biology-course-materials').getPublicUrl(file.storage_path).data.publicUrl
    : '';

  useEffect(() => {
    if (!unlocked || !supabase) return;
    let active = true;
    setMaterialsLoading(true);
    setMaterialsError('');
    void supabase.from('biology_course_materials')
      .select('id,lesson_key,file_name,storage_path,format,mime_type,size_bytes')
      .order('lesson_key')
      .order('format')
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setMaterialsError('Não foi possível carregar os materiais agora. Tente novamente.');
          setMaterials({});
        } else {
          const grouped: Record<string, BiologyMaterial[]> = {};
          for (const row of (data || []) as BiologyMaterial[]) {
            (grouped[row.lesson_key] ||= []).push(row);
          }
          setMaterials(grouped);
        }
        setMaterialsLoading(false);
      });
    return () => { active = false; };
  }, [unlocked]);

  useEffect(() => {
    setMaterialPreview(null);
  }, [selectedLesson]);

  useEffect(() => {
    aiRequest.current += 1;
    setAiMessages([]); setAiInput(''); setAiError(''); setAiLoading(false);
    setTopicQuestions([]); setQuestionsError(''); setAnswers({}); setSubmitted(false);
    setLoadingQuestions(false);
    if (!unlocked || !currentLesson || !supabase) return;
    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    setLoadingQuestions(true);
    const terms = topicTerms[currentLesson.key] || currentLesson.topics;
    const filters = terms.flatMap(term => [`skill_name.ilike.%${term}%`, `prompt.ilike.%${term}%`]).join(',');
    void (async () => {
      try {
        const { data, error } = await supabase.from('exam_practice_questions')
          .select('id,exam_id,skill_name,difficulty,prompt,option_a,option_b,option_c,option_d,option_e,correct_option,explanation,source_kind,source_exam_year,source_question_number,image_url,image_alt')
          .in('exam_id', ['enem', 'cmmg']).eq('active', true).or(filters)
          .order('id').limit(100).abortSignal(controller.signal);
        if (error) throw error;
        if (!active) return;
        const seen = new Set<string>();
        const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const rows = (data || []).filter(q => {
          const prompt = normalize(q.prompt || '');
          const text = normalize(`${q.skill_name} ${q.prompt}`);
          const matchesTopic = terms.some(term => new RegExp(`(^|[^a-z])${normalize(term)}[a-z]*(?=$|[^a-z])`).test(text));
          const answer = String(q.correct_option || '').trim().toUpperCase();
          const options = [q.option_a, q.option_b, q.option_c, q.option_d, q.option_e];
          if (!prompt || !matchesTopic || !/^[A-E]$/.test(answer) || !options[answer.charCodeAt(0) - 65] || options.filter(Boolean).length < 2 || seen.has(prompt)) return false;
          seen.add(prompt);
          q.correct_option = answer;
          return true;
        }).sort((a, b) => {
          const rank = (x: typeof a) => x.source_kind === 'official' ? 0 : x.source_kind === 'official_adapted' ? 1 : 2;
          return rank(a) - rank(b);
        });
        setTopicQuestions(rows.slice(0, 8));
      } catch {
        if (active) setQuestionsError('Não foi possível carregar o banco de questões. O exercício de revisão continua disponível.');
      } finally {
        window.clearTimeout(timeout);
        if (active) setLoadingQuestions(false);
      }
    })();
    return () => { active = false; controller.abort(); window.clearTimeout(timeout); };
  }, [currentLesson, unlocked]);

  async function askCourseAI(text?: string) {
    const message=(text ?? aiInput).trim();
    if (!message || !currentLesson || !supabase || aiLoading) return;
    const request = ++aiRequest.current;
    const previous=aiMessages;
    setAiMessages(v=>[...v,{role:'user',content:message}]);
    setAiInput(''); setAiError(''); setAiLoading(true);
    try {
      const session = await ensureFreshSession(false);
      if (!session?.access_token) throw new Error('Entre na sua conta do Conectaê para usar o tutor. A senha do curso continua válida.');
      const send = (token: string) => fetch('/api/education-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message, examId: 'enem', context: {
          course: 'Curso de Biologia', lessonTitle: currentLesson.title,
          topics: currentLesson.topics, tips: currentLesson.tips,
          history: previous.slice(-6),
          guidance: 'Priorize esta aula. Exercícios criados são autorais, não oficiais. O conteúdo integral do PDF não foi fornecido.'
        } }),
        signal: AbortSignal.timeout(60000),
      });
      let response = await send(session.access_token);
      if (response.status === 401) {
        const refreshed = await ensureFreshSession(true);
        if (refreshed?.access_token) response = await send(refreshed.access_token);
      }
      const data = await response.json();
      if (request !== aiRequest.current) return;
      if (!response.ok) throw new Error(data?.error || 'Não foi possível consultar o tutor agora.');
      if (!data?.answer) throw new Error(data?.error || 'A IA não respondeu.');
      setAiMessages(v=>[...v,{role:'assistant',content:data.answer}]);
    } catch (e:any) {
      if (request === aiRequest.current) {
        setAiInput(message);
        setAiMessages(previous);
        setAiError(e?.message || 'Não foi possível consultar a IA agora.');
      }
    } finally { if (request === aiRequest.current) setAiLoading(false); }
  }

  if (!unlocked) {
    const unlock = () => {
      if (password === BIOLOGY_PASSWORD) {
        sessionStorage.setItem('biology-course-unlocked', 'true');
        setUnlocked(true);
        setPasswordError('');
      } else {
        setPasswordError('Senha incorreta. Tente novamente.');
      }
    };

    return (
      <main className="min-h-screen bg-[#f6f8ff] px-4 py-7 font-['Plus_Jakarta_Sans'] text-[#111936] sm:px-8">
        <div className="mx-auto flex min-h-[80vh] w-full max-w-lg items-center">
          <section className="w-full rounded-[28px] border border-[#d7deee] bg-white p-7 shadow-xl sm:p-9">
            <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#101a43] text-white"><Dna className="h-8 w-8" /></div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#3155e7]">Curso particular</p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.035em]">Curso de Biologia</h1>
            <p className="mt-2 text-sm leading-relaxed text-[#69758f]">Digite a senha do curso para acessar as aulas, materiais e questões.</p>
            <input aria-label="Senha do curso" type="password" value={password} onChange={e => { setPassword(e.target.value); setPasswordError(''); }} onKeyDown={e => e.key === 'Enter' && unlock()} placeholder="Senha do curso" autoFocus className="mt-6 w-full rounded-xl border border-[#d7deee] bg-[#f8f9fe] px-4 py-3 font-semibold outline-none focus:border-[#3155e7]" />
            {passwordError && <p className="mt-2 text-sm font-bold text-red-600">{passwordError}</p>}
            <button onClick={unlock} className="mt-4 w-full rounded-xl bg-[#3155e7] px-5 py-3 font-black text-white">Entrar no curso</button>
            <button onClick={() => window.location.assign('/cursos-particulares')} className="mt-4 flex w-full items-center justify-center gap-2 text-sm font-extrabold text-[#596681] hover:text-[#3155e7]"><ArrowLeft className="h-4 w-4" /> Voltar</button>
          </section>
        </div>
      </main>
    );
  }


  return (
    <main className="min-h-screen bg-[#f6f8ff] px-4 py-7 font-['Plus_Jakarta_Sans'] text-[#111936] sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <button onClick={() => currentLesson ? setSelectedLesson(null) : window.location.assign('/cursos-particulares')} className="mb-7 inline-flex items-center gap-2 font-extrabold text-[#596681] hover:text-[#3155e7]"><ArrowLeft className="h-5 w-5" /> {currentLesson ? 'Todos os tópicos' : 'Voltar'}</button>
        {!currentLesson ? <>
          <section className="overflow-hidden rounded-[32px] bg-gradient-to-br from-[#eef5ff] to-[#dceaff] p-7 text-[#0b1b4d] shadow-sm ring-1 ring-[#c9daf7] sm:p-10">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#1262c9]">Curso particular • Biologia</p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.045em] sm:text-6xl">Escolha o tópico que quer estudar.</h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#415574] sm:text-lg">Cada assunto tem sua própria aula, material, revisão, dicas e questões específicas.</p>
            <div className="mt-7 grid max-w-xl grid-cols-3 gap-2 text-center"><div className="rounded-2xl bg-white/80 p-4 ring-1 ring-[#c9daf7]"><strong className="block text-2xl">{modules.length}</strong><span className="text-xs text-[#526684]">áreas</span></div><div className="rounded-2xl bg-white/80 p-4 ring-1 ring-[#c9daf7]"><strong className="block text-2xl">{lessonCount}</strong><span className="text-xs text-[#526684]">tópicos</span></div><div className="rounded-2xl bg-white/80 p-4 ring-1 ring-[#c9daf7]"><strong className="block text-2xl">ENEM</strong><span className="text-xs text-[#526684]">+ CMMG</span></div></div>
          </section>
          <div className="mt-7 flex items-center gap-3 rounded-2xl border border-[#d7deee] bg-white px-4 py-3"><Search className="h-5 w-5 text-[#7a86a0]" /><input aria-label="Buscar tópico" value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar um tópico…" className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-[#596681]" /></div>
          <section className="mt-8 space-y-9">{filtered.length === 0 && <p role="status" className="rounded-xl bg-white p-5 text-[#415574]">Nenhum tópico encontrado. Tente outro termo.</p>}{filtered.map(module => <div key={module.id}><div className="mb-4"><p className="text-xs font-black uppercase tracking-[0.14em] text-[#3155e7]">{module.title}</p><p className="mt-1 text-sm text-[#69758f]">{module.description}</p></div><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{module.lessons.map((lesson,index)=><button key={lesson.key} onClick={()=>{setSelectedLesson(lesson.key);setAnswers({});setSubmitted(false);}} className="group rounded-[24px] border border-[#d7deee] bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-[#9fb0ff] hover:shadow-lg"><div className="flex items-start justify-between gap-3"><div className="rounded-xl bg-[#e9edff] p-2 text-[#3155e7]"><FileText className="h-5 w-5"/></div><span className="text-xs font-black text-[#596681]">{String(index+1).padStart(2,'0')}</span></div><h2 className="mt-4 text-lg font-black">{lesson.title}</h2><p className="mt-2 text-sm leading-relaxed text-[#69758f]">{lesson.topics.slice(0,3).join(' • ')}</p><div className="mt-5 flex items-center justify-between border-t border-[#edf0f7] pt-4 text-xs font-black text-[#3155e7]"><span>Material + questões</span><span>Entrar →</span></div></button>)}</div></div>)}</section>
        </> : <>
          <section className="overflow-hidden rounded-[30px] bg-gradient-to-br from-[#eef5ff] to-[#dceaff] p-7 text-[#0b1b4d] shadow-sm ring-1 ring-[#c9daf7] sm:p-9"><p className="text-xs font-black uppercase tracking-[0.16em] text-[#1262c9]">{currentLesson.moduleTitle}</p><h1 className="mt-2 text-3xl font-black sm:text-5xl">{currentLesson.title}</h1><p className="mt-4 max-w-3xl text-[#415574]">Conceitos essenciais, dicas, material da aula e treino do assunto.</p></section>
          <div className="mt-6 grid gap-5 lg:grid-cols-[1.35fr_.65fr]"><div className="space-y-5">
            <section className="rounded-[24px] border border-[#d7deee] bg-white p-6"><p className="text-xs font-black uppercase tracking-[0.14em] text-[#3155e7]">Material da professora</p><h2 className="mt-2 text-xl font-black">Aula original</h2><p className="mt-2 text-sm leading-relaxed text-[#69758f]">Abra o PDF dentro do curso ou baixe o PowerPoint da aula.</p>{materialsLoading&&<p className="mt-4 rounded-xl bg-[#f8f9fe] p-4 text-sm font-bold text-[#596681]">Carregando materiais…</p>}{materialsError&&<p role="alert" className="mt-4 rounded-xl bg-[#fff4f2] p-4 text-sm font-bold text-[#9a3d34]">{materialsError}</p>}<div className="mt-4 space-y-3">{currentMaterials.map(file=>{const url=materialUrl(file);return <div key={file.id} className="flex flex-col gap-3 rounded-2xl border border-[#e0e6f2] bg-[#f8f9fe] p-4 sm:flex-row sm:items-center"><FileText className="h-6 w-6 shrink-0 text-[#3155e7]"/><div className="min-w-0 flex-1"><strong className="block truncate text-sm">{file.file_name}</strong><span className="text-xs text-[#69758f]">{file.format==='pdf'?'PDF':'PowerPoint'}{file.size_bytes?' • '+(file.size_bytes/1024/1024).toFixed(1)+' MB':''}</span></div>{file.format==='pdf'?<button onClick={()=>setMaterialPreview({url,file})} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#3155e7] px-4 py-2.5 text-sm font-black text-white"><ExternalLink className="h-4 w-4"/>Acessar</button>:<a href={url+'?download='+encodeURIComponent(file.file_name)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#cbd6ff] bg-white px-4 py-2.5 text-sm font-black text-[#3155e7]"><Download className="h-4 w-4"/>Baixar PowerPoint</a>}</div>})}</div>{!materialsLoading&&!materialsError&&currentMaterials.length===0&&<p className="mt-4 rounded-xl bg-[#fff8e8] p-4 text-sm font-bold text-[#7c5a18]">Material em preparação para este tópico.</p>}{materialPreview&&<div className="mt-5 overflow-hidden rounded-2xl border border-[#d7deee] bg-white"><div className="flex flex-wrap items-center gap-3 border-b border-[#e8ecf4] p-3"><a href={materialPreview.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-black text-[#3155e7]"><ExternalLink className="h-4 w-4"/>Abrir em outra aba</a><a href={materialPreview.url+'?download='+encodeURIComponent(materialPreview.file.file_name)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-black text-[#3155e7]"><Download className="h-4 w-4"/>Baixar PDF</a><button onClick={()=>setMaterialPreview(null)} className="ml-auto text-xs font-black text-[#69758f]">Fechar</button></div><iframe src={materialPreview.url} title={'Material original: '+materialPreview.file.file_name} className="h-[70vh] min-h-[520px] w-full bg-white"/></div>}</section>
            <section className="rounded-[24px] border border-[#d7deee] bg-white p-6"><p className="text-xs font-black uppercase tracking-[0.14em] text-[#3155e7]">O que dominar</p><div className="mt-4 flex flex-wrap gap-2">{currentLesson.topics.map(t=><span key={t} className="rounded-full border border-[#dce3f4] bg-[#f8f9fe] px-3 py-2 text-xs font-bold text-[#4e5b77]">{t}</span>)}</div></section>
            <section className="rounded-[24px] border border-[#d7deee] bg-white p-6"><div className="flex items-center gap-2 text-[#3155e7]"><Target className="h-5 w-5"/><p className="text-xs font-black uppercase tracking-[0.14em]">Questões do tópico</p></div><h2 className="mt-2 text-2xl font-black">Treino específico</h2><p className="mt-2 text-sm text-[#69758f]">Questões disponíveis para este assunto, com origem identificada. Na ausência de itens do banco, faça o exercício autoral de revisão.</p><div className="mt-5 space-y-5">{questionsError && <p role="status" className="rounded-xl bg-[#fff8e8] p-4 text-sm text-[#7c5a18]">{questionsError}</p>}{loadingQuestions && <p className="rounded-xl bg-[#f8f9fe] p-4 text-sm font-bold text-[#596681]">Carregando questões específicas…</p>}{topicQuestions.map((q:any,localIndex:number)=>{const opts=[q.option_a,q.option_b,q.option_c,q.option_d,q.option_e];const correct='ABCDE'.indexOf(q.correct_option);const key='db-'+q.id;return <div key={key} className="rounded-2xl bg-[#f8f9fe] p-5"><div className="mb-3 flex flex-wrap gap-2"><span className="rounded-full bg-[#e8efff] px-2.5 py-1 text-[10px] font-black uppercase text-[#1769e0]">{q.exam_id.toUpperCase()}</span><span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase text-[#596681]">{q.source_kind==='official'?'Oficial':q.source_kind==='official_adapted'?'Oficial adaptada':'Treino alinhado'}</span>{q.source_exam_year&&<span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-[#596681]">{q.source_exam_year}{q.source_question_number?` • Q${q.source_question_number}`:''}</span>}</div><p className="font-black">{localIndex+1}. {q.prompt}</p>{q.image_url && <img src={q.image_url} alt={q.image_alt || "Imagem da questão"} className="mt-3 max-h-96 max-w-full object-contain" onError={e => { e.currentTarget.alt = "Imagem indisponível. Não responda sem consultar a figura original."; }} />}<div className="mt-3 grid gap-2">{opts.map((option:any,j:number)=>option ? <button key={j} onClick={()=>!submitted&&setAnswers(v=>({...v,[key]:j}))} className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold ${answers[key]===j?'border-[#3155e7] bg-[#eef1ff]':'border-[#dce3f4] bg-white'}`}>{String.fromCharCode(65+j)}. {option}</button> : null)}</div>{submitted&&<div className={`mt-3 rounded-xl p-4 text-sm ${answers[key]===correct?'bg-[#eefbf3] text-[#24613b]':'bg-[#fff4f2] text-[#7b342c]'}`}><strong>{answers[key]===correct?'Correto.':`Resposta: ${String.fromCharCode(65+correct)}.`}</strong> {q.explanation}</div>}</div>})}{topicQuestions.length===0&&!loadingQuestions&&currentQuestions.map(({index,...q},localIndex)=><div key={index} className="rounded-2xl bg-[#f8f9fe] p-5"><p className="mb-2 text-sm font-bold text-[#3155e7]">Revisão autoral • não é questão oficial</p><p className="font-black">{localIndex+1}. {q.q}</p><div className="mt-3 grid gap-2">{q.a.map((option,j)=><button key={option} onClick={()=>!submitted&&setAnswers(v=>({...v,[index]:j}))} className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold ${answers[index]===j?'border-[#3155e7] bg-[#eef1ff]':'border-[#dce3f4] bg-white'}`}>{String.fromCharCode(65+j)}. {option}</button>)}</div>{submitted&&<div className={`mt-3 rounded-xl p-4 text-sm ${answers[index]===q.correct?'bg-[#eefbf3] text-[#24613b]':'bg-[#fff4f2] text-[#7b342c]'}`}><strong>{answers[index]===q.correct?'Correto.':`Resposta: ${String.fromCharCode(65+q.correct)}.`}</strong> {q.why}</div>}</div>)}{!loadingQuestions && (topicQuestions.length>0 || currentQuestions.length>0)&&<button onClick={()=>{if(submitted)setAnswers({});setSubmitted(!submitted);}} className="w-full rounded-xl bg-[#1769e0] px-5 py-4 font-black text-white">{submitted ? 'Tentar novamente' : 'Corrigir questões'}</button>}</div></section>
          </div><aside className="space-y-5"><section className="rounded-[24px] border border-[#d7deee] bg-white p-6"><div className="flex items-center gap-2 text-[#3155e7]"><Lightbulb className="h-5 w-5"/><h2 className="font-black">Dicas de prova</h2></div>{currentLesson.tips.map(t=><p key={t} className="mt-3 text-sm leading-relaxed text-[#596681]">• {t}</p>)}</section><section className="rounded-[24px] border border-[#b8c8ff] bg-gradient-to-br from-[#f3f6ff] to-white p-6 text-[#0b1b4d]"><div className="flex items-center gap-2 text-[#3155e7]"><Sparkles className="h-5 w-5"/><p className="text-xs font-black uppercase tracking-[0.14em]">IA da aula</p></div><h2 className="mt-2 text-xl font-black">Tutor de Biologia</h2><p className="mt-2 text-sm leading-relaxed text-[#596681]">Pergunte sobre <strong>{currentLesson.title}</strong>, peça uma explicação, revisão ou novas questões.</p><div className="mt-4 flex flex-wrap gap-2">{['Explique este tema de forma simples','Faça uma revisão para prova','Crie uma questão estilo ENEM'].map(s=><button key={s} onClick={()=>askCourseAI(s)} disabled={aiLoading} className="rounded-full border border-[#cbd6ff] bg-white px-3 py-2 text-left text-xs font-bold text-[#3155e7] hover:bg-[#eef2ff] disabled:opacity-50">{s}</button>)}</div>{aiMessages.length>0&&<div className="mt-4 max-h-80 space-y-3 overflow-y-auto rounded-2xl bg-white p-3 ring-1 ring-[#e2e7f4]">{aiMessages.map((m,i)=><div key={i} className={`rounded-xl p-3 text-sm leading-relaxed whitespace-pre-wrap ${m.role==='user'?'ml-6 bg-[#3155e7] text-white':'mr-4 bg-[#f4f6fb] text-[#34415e]'}`}>{m.role === 'assistant' ? <TutorFormattedContent content={m.content}/> : m.content}</div>)}{aiLoading&&<div className="flex items-center gap-2 p-3 text-sm font-bold text-[#596681]"><Loader2 className="h-4 w-4 animate-spin"/>Pensando…</div>}</div>}{aiError&&<p className="mt-3 rounded-xl bg-[#fff4f2] p-3 text-xs font-bold text-[#9a3d34]">{aiError}</p>}<div className="mt-4 flex gap-2"><textarea aria-label="Pergunta ao tutor" value={aiInput} onChange={e=>setAiInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();void askCourseAI();}}} placeholder="Tire uma dúvida sobre esta aula…" rows={2} className="min-w-0 flex-1 resize-none rounded-xl border border-[#d7deee] bg-white px-3 py-2 text-sm outline-none focus:border-[#3155e7]"/><button onClick={()=>askCourseAI()} disabled={aiLoading||!aiInput.trim()} aria-label="Enviar pergunta" className="self-stretch rounded-xl bg-[#3155e7] px-4 text-white disabled:opacity-40"><Send className="h-4 w-4"/></button></div></section><section className="rounded-[24px] border border-[#c9daf7] bg-[#eef5ff] p-6 text-[#0b1b4d]"><BookOpen className="mb-3 h-6 w-6 text-[#1769e0]"/><h2 className="font-black">Como estudar esta aula</h2><p className="mt-3 text-sm leading-relaxed text-[#415574]">1. Abra o PDF.<br/>2. Revise os conceitos-chave.<br/>3. Explique o tema sem consultar.<br/>4. Faça as questões.<br/>5. Revise apenas os erros.</p></section></aside></div>
        </>}
      </div>
    </main>
  );
}
