import { useMemo, useState } from 'react';
import {
  ArrowLeft, BookOpen, Brain, CheckCircle2, ChevronDown, ChevronUp, Dna,
  FileText, FlaskConical, Lightbulb, Microscope, Search, Stethoscope, Target
} from 'lucide-react';

type Lesson = {
  title: string;
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

const modules: Module[] = [
  {
    id: 'celula', title: '1. Biologia celular e metabolismo',
    description: 'Estrutura celular, membranas, divisão celular e obtenção de energia.',
    lessons: [
      { title: 'Membrana plasmática e transportes', material: 'Membrana e Transporte.pptx',
        topics: ['mosaico fluido', 'permeabilidade seletiva', 'difusão simples e facilitada', 'osmose', 'transporte ativo', 'endocitose e exocitose'],
        tips: ['Em osmose, acompanhe a água — ela se desloca para o meio de maior concentração efetiva de solutos.', 'Diferencie transporte passivo de ativo pela necessidade de energia e pelo sentido do gradiente.'] },
      { title: 'Metabolismo celular', material: 'Metabolismo_Celular(Resp_Fot_Ferm_Quim).pptx',
        topics: ['ATP', 'respiração celular', 'glicólise', 'ciclo de Krebs', 'cadeia respiratória', 'fermentação', 'fotossíntese', 'quimiossíntese'],
        tips: ['Compare local, reagentes, produtos e rendimento energético de cada processo.', 'ENEM costuma cobrar metabolismo em contexto de exercício, alimentos, biocombustíveis e ecologia.'] },
      { title: 'Ciclo celular', material: 'Ciclo Celular.pptx',
        topics: ['interfase', 'G1, S e G2', 'mitose', 'meiose', 'crossing-over', 'variabilidade genética', 'aneuploidias'],
        tips: ['Não confunda número de cromossomos com quantidade de DNA.', 'Associe meiose à formação de gametas e variabilidade; mitose a crescimento, renovação e reprodução assexuada.'] },
    ],
  },
  {
    id: 'molecular', title: '2. Genética e biologia molecular',
    description: 'DNA, RNA, expressão gênica, divisão e genética mendeliana.',
    lessons: [
      { title: 'Replicação do DNA', material: 'Replicação do DNA.pptx',
        topics: ['estrutura do DNA', 'replicação semiconservativa', 'helicase', 'DNA polimerase', 'fita líder e tardia', 'fragmentos de Okazaki'],
        tips: ['Lembre que a DNA polimerase sintetiza no sentido 5’ → 3’.', 'Questões frequentemente conectam mutações, replicação e câncer.'] },
      { title: 'Síntese de RNA e expressão gênica', material: 'Síntese_RNA.pptx',
        topics: ['transcrição', 'RNA mensageiro', 'RNA transportador', 'RNA ribossômico', 'código genético', 'tradução', 'síntese proteica'],
        tips: ['Separe bem transcrição de tradução: DNA → RNA e RNA → proteína.', 'Treine leitura de códons e anticódons.'] },
      { title: 'Genética mendeliana e cruzamento-teste', material: 'HereditariedadeII_Genética_Mendeliana_Cruzamento_Teste.pptx',
        topics: ['genes e alelos', 'dominância e recessividade', 'genótipo e fenótipo', '1ª lei de Mendel', 'probabilidade', 'heredogramas', 'cruzamento-teste'],
        tips: ['Transforme o enunciado em símbolos antes de montar o cruzamento.', 'Use probabilidade em vez de quadrados de Punnett gigantes quando os eventos forem independentes.'] },
    ],
  },
  {
    id: 'humana', title: '3. Histologia e fisiologia humana',
    description: 'Tecidos e funcionamento integrado do organismo humano.',
    lessons: [
      { title: 'Histologia humana', material: 'Histologia_humana.pptx',
        topics: ['tecido epitelial', 'conjuntivo', 'adiposo', 'cartilaginoso', 'ósseo', 'sanguíneo', 'muscular', 'nervoso'],
        tips: ['Associe estrutura à função: forma e composição do tecido quase sempre explicam o que ele faz.', 'Compare músculo estriado esquelético, cardíaco e liso.'] },
      { title: 'Sistema digestório', material: 'Sistema_Digestório.pptx',
        topics: ['trato digestório', 'digestão mecânica e química', 'enzimas', 'fígado', 'pâncreas', 'bile', 'absorção intestinal', 'nutrientes'],
        tips: ['Monte uma tabela: órgão → secreção/enzima → substrato → produto.', 'Bile emulsifica gorduras; não é enzima.'] },
      { title: 'Sistema respiratório', material: 'Sistema_respiratório.pptx',
        topics: ['vias respiratórias', 'pulmões', 'alvéolos', 'hematose', 'ventilação pulmonar', 'hemoglobina', 'transporte de gases'],
        tips: ['Na hematose, use gradientes de pressão parcial para entender a difusão.', 'Relacione exercício, altitude, tabagismo e doenças respiratórias.'] },
    ],
  },
  {
    id: 'botanica', title: '4. Botânica',
    description: 'Tecidos vegetais, regulação hormonal e respostas das plantas.',
    lessons: [
      { title: 'Histologia vegetal', material: 'Histologia vegetal.pptx',
        topics: ['meristemas', 'epiderme', 'parênquimas', 'colênquima', 'esclerênquima', 'xilema', 'floema', 'estômatos'],
        tips: ['Xilema: seiva bruta; floema: seiva elaborada.', 'Entenda transpiração e abertura estomática em vez de apenas decorar tecidos.'] },
      { title: 'Fitormônios', material: 'Fitormônios.pptx',
        topics: ['auxina', 'giberelina', 'citocinina', 'etileno', 'ácido abscísico', 'tropismos', 'dormência', 'amadurecimento'],
        tips: ['Associe cada hormônio a um efeito-chave e depois às interações entre eles.', 'Fototropismo e gravitropismo são temas clássicos de experimento.'] },
    ],
  },
  {
    id: 'diversidade', title: '5. Diversidade dos seres vivos',
    description: 'Microrganismos, fungos, algas, animais e vertebrados.',
    lessons: [
      { title: 'Micro-organismos', material: 'Microorganismos.pptx',
        topics: ['diversidade microbiana', 'relações ecológicas', 'saúde', 'indústria', 'biotecnologia'],
        tips: ['Não trate “microrganismo” como um único grupo taxonômico.', 'Separe usos benéficos de mecanismos patogênicos.'] },
      { title: 'Bactérias e bacterioses', material: 'Bacterias_Bacterioses.pptx',
        topics: ['estrutura bacteriana', 'reprodução', 'conjugação', 'resistência bacteriana', 'antibióticos', 'bacterioses e prevenção'],
        tips: ['Antibióticos não tratam viroses.', 'Resistência surge por seleção de variantes resistentes; o antibiótico não cria a mutação necessária.'] },
      { title: 'Protozoários e protozooses', material: 'Protozoários e Protozooses.pptx',
        topics: ['protozoários', 'ciclos parasitários', 'doença de Chagas', 'malária', 'amebíase', 'leishmaniose', 'prevenção'],
        tips: ['Para cada parasitose, domine agente, vetor/hospedeiro, transmissão e prevenção.', 'Desenhe o ciclo quando houver hospedeiros diferentes.'] },
      { title: 'Algas', material: 'Algas.pptx',
        topics: ['características', 'grupos', 'fitoplâncton', 'produção primária', 'marés vermelhas', 'importância econômica'],
        tips: ['Relacione algas à produção de oxigênio e às cadeias aquáticas.', 'Cuidado: “alga” reúne linhagens diferentes.'] },
      { title: 'Reino Fungi', material: 'Reino Fungi.pptx',
        topics: ['hifas e micélio', 'nutrição por absorção', 'reprodução', 'decomposição', 'micorrizas', 'líquens', 'micoses'],
        tips: ['Fungos são heterótrofos por absorção, não plantas sem clorofila.', 'Fermentação e decomposição aparecem muito em aplicações.'] },
      { title: 'Reino Animalia', material: 'Reino_Animalia.pptx',
        topics: ['planos corporais', 'simetria', 'folhetos embrionários', 'celoma', 'protostômios e deuterostômios', 'principais filos'],
        tips: ['Estude comparativamente: novidade evolutiva → grupo em que aparece.', 'Evite decorar listas sem relacionar anatomia, ambiente e evolução.'] },
      { title: 'Vertebrados', material: 'Vertebrados.pptx',
        topics: ['peixes', 'anfíbios', 'répteis', 'aves', 'mamíferos', 'circulação', 'respiração', 'excreção', 'reprodução'],
        tips: ['Monte uma matriz comparando respiração, circulação, excreta e reprodução.', 'O ovo amniótico é central para a independência reprodutiva da água.'] },
    ],
  },
  {
    id: 'saude', title: '6. Parasitologia, virologia e saúde',
    description: 'Doenças, ciclos, transmissão, prevenção e saúde pública.',
    lessons: [
      { title: 'Verminoses', material: 'Verminoses.pptx',
        topics: ['platelmintos', 'nematódeos', 'esquistossomose', 'teníase', 'cisticercose', 'ascaridíase', 'ancilostomose', 'prevenção'],
        tips: ['Teníase e cisticercose têm o mesmo gênero envolvido, mas vias de infecção diferentes.', 'Saneamento básico é peça central em muitas questões epidemiológicas.'] },
      { title: 'Dengue', material: 'Dengue.pptx',
        topics: ['vírus da dengue', 'Aedes aegypti', 'ciclo do vetor', 'transmissão', 'sinais de alarme', 'prevenção', 'controle epidemiológico'],
        tips: ['Separe agente etiológico, vetor e hospedeiro.', 'Questões de dengue frequentemente exigem interpretação de campanhas, gráficos e medidas coletivas.'] },
    ],
  },
  {
    id: 'evolucao', title: '7. Evolução',
    description: 'Processos evolutivos e história evolutiva humana.',
    lessons: [
      { title: 'Evolução humana', material: 'Evolução_Humana.pptx',
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
];

const BIOLOGY_PASSWORD = 'cursobiologiacissa';

export default function BiologyCourse() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('biology-course-unlocked') === 'true');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [query, setQuery] = useState('');
  const [openModule, setOpenModule] = useState<string>('celula');
  const [quizOpen, setQuizOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return modules;
    return modules.map(m => ({
      ...m,
      lessons: m.lessons.filter(l =>
        [l.title, l.material ?? '', ...l.topics, ...l.tips].join(' ').toLowerCase().includes(term)
      ),
    })).filter(m => m.title.toLowerCase().includes(term) || m.lessons.length);
  }, [query]);

  const lessonCount = modules.reduce((n, m) => n + m.lessons.length, 0);
  const score = questions.reduce((n, q, i) => n + (answers[i] === q.correct ? 1 : 0), 0);

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
            <input type="password" value={password} onChange={e => { setPassword(e.target.value); setPasswordError(''); }} onKeyDown={e => e.key === 'Enter' && unlock()} placeholder="Senha do curso" autoFocus className="mt-6 w-full rounded-xl border border-[#d7deee] bg-[#f8f9fe] px-4 py-3 font-semibold outline-none focus:border-[#3155e7]" />
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
        <button onClick={() => window.location.assign('/cursos-particulares')} className="mb-7 inline-flex items-center gap-2 font-extrabold text-[#596681] hover:text-[#3155e7]">
          <ArrowLeft className="h-5 w-5" /> Voltar
        </button>

        <section className="overflow-hidden rounded-[32px] bg-[#101a43] p-7 text-white shadow-xl sm:p-10">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10"><Dna className="h-8 w-8" /></div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#9db1ff]">Curso particular • Biologia</p>
              <h1 className="mt-2 text-4xl font-black tracking-[-0.045em] sm:text-6xl">Biologia completa para provas e vestibulares</h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#d5ddff] sm:text-lg">Materiais exclusivos organizados por tema, revisão ativa, pontos de atenção, questões comentadas e estratégia de prova.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl bg-white/10 p-4"><strong className="block text-2xl">{modules.length}</strong><span className="text-xs text-[#d5ddff]">módulos</span></div>
              <div className="rounded-2xl bg-white/10 p-4"><strong className="block text-2xl">{lessonCount}</strong><span className="text-xs text-[#d5ddff]">aulas</span></div>
              <div className="rounded-2xl bg-white/10 p-4"><strong className="block text-2xl">{questions.length}</strong><span className="text-xs text-[#d5ddff]">questões</span></div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#dce3f4] bg-white p-5"><BookOpen className="mb-3 text-[#3155e7]" /><h2 className="font-black">PowerPoints do curso</h2><p className="mt-1 text-sm leading-relaxed text-[#69758f]">Cada aula mostra o arquivo-base enviado para aquele conteúdo, sem misturar matérias.</p></div>
          <div className="rounded-2xl border border-[#dce3f4] bg-white p-5"><Lightbulb className="mb-3 text-[#3155e7]" /><h2 className="font-black">Revisão inteligente</h2><p className="mt-1 text-sm leading-relaxed text-[#69758f]">Pontos essenciais, pegadinhas e conexões que ajudam a interpretar questões.</p></div>
          <div className="rounded-2xl border border-[#dce3f4] bg-white p-5"><Target className="mb-3 text-[#3155e7]" /><h2 className="font-black">Treino comentado</h2><p className="mt-1 text-sm leading-relaxed text-[#69758f]">Questões autorais de revisão com resposta e justificativa imediata.</p></div>
        </section>

        <div className="mt-7 flex items-center gap-3 rounded-2xl border border-[#d7deee] bg-white px-4 py-3">
          <Search className="h-5 w-5 text-[#7a86a0]" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar tema, aula, conceito ou material..." className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-[#9aa4b8]" />
        </div>

        <section className="mt-7">
          <div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.16em] text-[#3155e7]">Trilha completa</p><h2 className="text-3xl font-black">Módulos do curso</h2></div><Microscope className="hidden h-8 w-8 text-[#3155e7] sm:block" /></div>
          <div className="space-y-4">
            {filtered.map(module => {
              const open = openModule === module.id || Boolean(query);
              return <article key={module.id} className="overflow-hidden rounded-[24px] border border-[#d7deee] bg-white shadow-sm">
                <button onClick={() => setOpenModule(openModule === module.id ? '' : module.id)} className="flex w-full items-center justify-between gap-5 p-5 text-left sm:p-6">
                  <div><h3 className="text-xl font-black">{module.title}</h3><p className="mt-1 text-sm text-[#74809a]">{module.description}</p></div>
                  {open ? <ChevronUp className="shrink-0 text-[#3155e7]" /> : <ChevronDown className="shrink-0 text-[#3155e7]" />}
                </button>
                {open && <div className="border-t border-[#edf0f7] p-5 sm:p-6">
                  <div className="grid gap-4 lg:grid-cols-2">
                    {module.lessons.map(lesson => <div key={lesson.title} className="rounded-2xl bg-[#f8f9fe] p-5">
                      <div className="flex items-start gap-3"><div className="rounded-xl bg-[#e9edff] p-2 text-[#3155e7]"><FileText className="h-5 w-5" /></div><div><h4 className="font-black">{lesson.title}</h4>{lesson.material && <p className="mt-1 text-xs font-bold text-[#3155e7]">Material-base: {lesson.material}</p>}</div></div>
                      <p className="mt-4 text-xs font-black uppercase tracking-[0.12em] text-[#69758f]">Domine estes pontos</p>
                      <div className="mt-2 flex flex-wrap gap-2">{lesson.topics.map(t => <span key={t} className="rounded-full border border-[#dce3f4] bg-white px-3 py-1 text-xs font-bold text-[#4e5b77]">{t}</span>)}</div>
                      <div className="mt-4 rounded-xl border border-[#dce3f4] bg-white p-4"><div className="mb-2 flex items-center gap-2 text-sm font-black text-[#3155e7]"><Lightbulb className="h-4 w-4" /> Dicas de prova</div>{lesson.tips.map(t => <p key={t} className="mt-1 text-sm leading-relaxed text-[#596681]">• {t}</p>)}</div>
                    </div>)}
                  </div>
                </div>}
              </article>;
            })}
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-[#d7deee] bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div><div className="flex items-center gap-2 text-[#3155e7]"><Brain className="h-5 w-5" /><span className="text-xs font-black uppercase tracking-[0.14em]">Prática ativa</span></div><h2 className="mt-2 text-2xl font-black">Banco de questões comentadas</h2><p className="mt-2 text-sm text-[#69758f]">Faça primeiro sem consultar o material. Depois use a explicação para revisar o erro.</p></div>
            <button onClick={() => { setQuizOpen(!quizOpen); setSubmitted(false); }} className="rounded-xl bg-[#3155e7] px-5 py-3 text-sm font-black text-white">{quizOpen ? 'Fechar questões' : 'Começar questões'}</button>
          </div>
          {quizOpen && <div className="mt-7 space-y-5">
            {questions.map((q, i) => <div key={q.q} className="rounded-2xl bg-[#f8f9fe] p-5">
              <p className="font-black">{i + 1}. {q.q}</p>
              <div className="mt-3 grid gap-2">{q.a.map((option, j) => <button key={option} onClick={() => !submitted && setAnswers(v => ({ ...v, [i]: j }))} className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${answers[i] === j ? 'border-[#3155e7] bg-[#eef1ff]' : 'border-[#dce3f4] bg-white'}`}>{String.fromCharCode(65 + j)}. {option}</button>)}</div>
              {submitted && <div className={`mt-3 rounded-xl p-4 text-sm leading-relaxed ${answers[i] === q.correct ? 'bg-[#eefbf3] text-[#24613b]' : 'bg-[#fff4f2] text-[#7b342c]'}`}><strong>{answers[i] === q.correct ? 'Correto.' : `Resposta: ${String.fromCharCode(65 + q.correct)}.`}</strong> {q.why}</div>}
            </div>)}
            <button onClick={() => setSubmitted(true)} className="w-full rounded-xl bg-[#101a43] px-5 py-4 font-black text-white">Corrigir questões</button>
            {submitted && <div className="rounded-2xl border border-[#cad5ff] bg-[#eef1ff] p-5 text-center"><CheckCircle2 className="mx-auto mb-2 text-[#3155e7]" /><p className="text-2xl font-black">{score}/{questions.length}</p><p className="text-sm font-semibold text-[#596681]">Use os comentários das questões erradas como roteiro de revisão.</p></div>}
          </div>}
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[24px] bg-[#101a43] p-6 text-white"><FlaskConical className="mb-4 h-7 w-7 text-[#9db1ff]" /><h2 className="text-xl font-black">Método recomendado</h2><p className="mt-3 text-sm leading-relaxed text-[#d5ddff]">1) estude o PowerPoint da aula; 2) feche o material e explique o tema em voz alta; 3) faça questões; 4) registre o motivo de cada erro; 5) revise os erros em 24 h, 7 dias e antes da prova.</p></div>
          <div className="rounded-[24px] border border-[#d7deee] bg-white p-6"><Stethoscope className="mb-4 h-7 w-7 text-[#3155e7]" /><h2 className="text-xl font-black">Como atacar questões de Biologia</h2><p className="mt-3 text-sm leading-relaxed text-[#596681]">Identifique o fenômeno biológico pedido, marque variáveis e relações causais, elimine alternativas absolutas sem suporte e só depois escolha. Em gráficos e experimentos, diferencie correlação de mecanismo causal.</p></div>
        </section>
      </div>
    </main>
  );
}
