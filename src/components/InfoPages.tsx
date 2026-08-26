import { ArrowLeft, BookOpen, FlaskConical, HelpCircle, FileText, Shield } from 'lucide-react';

type PageType = 'howitworks' | 'methodology' | 'faq' | 'privacy' | 'terms';

interface InfoPagesProps {
  page: PageType;
  onBack: () => void;
}

const PAGE_CONFIG: Record<PageType, { title: string; icon: React.ReactNode }> = {
  howitworks: { title: 'Como funciona', icon: <BookOpen className="w-5 h-5" /> },
  methodology: { title: 'Metodologia', icon: <FlaskConical className="w-5 h-5" /> },
  faq: { title: 'Perguntas frequentes', icon: <HelpCircle className="w-5 h-5" /> },
  privacy: { title: 'Política de Privacidade', icon: <Shield className="w-5 h-5" /> },
  terms: { title: 'Termos de Uso', icon: <FileText className="w-5 h-5" /> },
};

export default function InfoPages({ page, onBack }: InfoPagesProps) {
  const config = PAGE_CONFIG[page];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] rounded-full bg-brand-500/10 blur-[130px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12">
        <button onClick={onBack} className="flex items-center gap-2 text-ink-400 hover:text-ink-100 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <div className="flex items-center gap-2">
          {config.icon}
          <span className="font-bold tracking-tight">{config.title}</span>
        </div>
      </header>

      <main className="relative z-10 px-6 md:px-12 max-w-3xl mx-auto pb-20">
        <div className="animate-fade-up">
          {page === 'howitworks' && <HowItWorks />}
          {page === 'methodology' && <Methodology />}
          {page === 'faq' && <FAQ />}
          {page === 'privacy' && <Privacy />}
          {page === 'terms' && <Terms />}
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl border border-ink-800 p-6 mb-4">
      <h2 className="font-bold text-ink-100 text-lg mb-3">{title}</h2>
      <div className="text-ink-300 text-sm leading-relaxed space-y-3">{children}</div>
    </div>
  );
}

function Step({ num, children }: { num: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-brand-500/15 text-brand-400 flex items-center justify-center text-sm font-bold">{num}</div>
      <div className="pt-0.5">{children}</div>
    </div>
  );
}

function HowItWorks() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Como funciona</h1>
      <Section title="O processo">
        <Step num={1}><p>Você responde ao questionário com perguntas sobre seu perfil acadêmico, comportamental e objetivos.</p></Step>
        <Step num={2}><p>Analisamos dezenas de características do seu perfil usando um algoritmo determinístico.</p></Step>
        <Step num={3}><p>Comparamos seu perfil com dados reais das faculdades disponíveis no Conectaê.</p></Step>
        <Step num={4}><p>Você recebe um ranking personalizado com a porcentagem de compatibilidade de cada faculdade.</p></Step>
      </Section>
      <Section title="Importante">
        <p>O Conectaê mede <strong>compatibilidade de perfil</strong> entre você e cada instituição. Ele <strong>não mede sua chance de aprovação</strong> e não deve ser usado como garantia de admissão.</p>
        <p>O resultado é uma orientação para ajudar você a identificar faculdades que combinam com seu jeito de ser, seus interesses e seus objetivos.</p>
      </Section>
    </>
  );
}

function Methodology() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Metodologia</h1>
      <Section title="O que analisamos">
        <p>O Conectaê avalia seu perfil em várias dimensões:</p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li><strong>Dados acadêmicos</strong> — desempenho, rigor, pensamento analítico</li>
          <li><strong>Perfil comportamental</strong> — liderança, resiliência, colaboração, autonomia</li>
          <li><strong>Objetivos profissionais</strong> — carreira corporativa, empreendedorismo, finanças, impacto social</li>
          <li><strong>Cultura</strong> — estilo de aprendizagem, valores, ambiente desejado</li>
          <li><strong>Estilo de aprendizado</strong> — teórico vs. prático, individual vs. colaborativo</li>
          <li><strong>Evidências e interesses</strong> — conquistas, projetos, experiências</li>
        </ul>
      </Section>
      <Section title="Como o match é calculado">
        <p>Cada resposta é convertida em uma pontuação por dimensão. Essas pontuações são comparadas com o perfil de cada universidade, ponderadas por pilar (acadêmico, comportamental, evidências, objetivos e cultura).</p>
        <p>O resultado final é normalizado de 0 a 100% para cada instituição disponível na plataforma.</p>
        <p>O algoritmo é <strong>determinístico</strong>: as mesmas respostas sempre produzem o mesmo resultado.</p>
      </Section>
      <Section title="Transparência">
        <p>Os pesos específicos de cada universidade não são revelados para evitar manipulação do teste. O questionário é neutro: nenhuma pergunta indica qual faculdade ela favorece.</p>
        <p className="text-brand-400 font-medium">O Conectaê mede compatibilidade de perfil. Ele não mede sua chance de aprovação.</p>
      </Section>
    </>
  );
}

function FAQ() {
  const faqs = [
    { q: 'O que é o Conectaê?', a: 'É uma ferramenta que compara seu perfil com faculdades e mostra quais combinam mais com você.' },
    { q: 'Como o match é calculado?', a: 'Através de um algoritmo determinístico que analisa dezenas de características do seu perfil e as compara com os dados de cada universidade. O resultado é uma porcentagem de compatibilidade de 0 a 100%.' },
    { q: 'O resultado significa que vou ser aprovado?', a: 'Não. O Conectaê mede compatibilidade de perfil, não chance de aprovação. Ele é uma orientação para te ajudar a escolher, não uma garantia.' },
    { q: 'Quais faculdades estão incluídas?', a: 'A plataforma reúne faculdades brasileiras e americanas selecionadas para comparação por perfil, com o banco sendo ampliado continuamente.' },
    { q: 'Quanto custa?', a: 'O Conectaê será gratuito durante os primeiros meses de lançamento. Depois, o acesso ao match completo custará R$8.' },
    { q: 'Por que está gratuito agora?', a: 'Estamos em período de lançamento. Queremos que você experimente e nos ajude a melhorar a ferramenta antes de ativar a cobrança.' },
    { q: 'Minhas informações estão seguras?', a: 'Sim. Seus dados são armazenados com criptografia e protegidos por Row Level Security no Supabase. Cada usuário só acessa seus próprios dados.' },
    { q: 'Posso fazer o teste novamente?', a: 'Sim! Você pode refazer o questionário quantas vezes quiser. Seu histórico de matches fica salvo na sua conta.' },
    { q: 'Posso excluir minha conta e meus dados?', a: 'Sim. Na sua conta, você pode excluir sua conta a qualquer momento. Todos os seus dados associados serão removidos.' },
  ];
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Perguntas frequentes</h1>
      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <details key={i} className="glass rounded-2xl border border-ink-800 p-5 group">
            <summary className="font-semibold text-ink-100 cursor-pointer flex items-center justify-between">
              {faq.q}
              <span className="text-ink-500 group-open:rotate-180 transition-transform">⌄</span>
            </summary>
            <p className="text-ink-400 text-sm mt-3 leading-relaxed">{faq.a}</p>
          </details>
        ))}
      </div>
    </>
  );
}

function Privacy() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Política de Privacidade</h1>
      <Section title="Coleta de dados">
        <p>O Conectaê coleta apenas os dados necessários para calcular seu match de perfil: nome, e-mail, ano escolar, cidade, estado, faixa etária e respostas do questionário.</p>
        <p>Não coletamos dados sensíveis desnecessários. Nunca compartilhamos seus dados com terceiros.</p>
      </Section>
      <Section title="Armazenamento e segurança">
        <p>Seus dados são armazenados no Supabase com criptografia e protegidos por Row Level Security (RLS). Cada usuário só pode acessar seus próprios dados — nenhum usuário pode ver dados de outro.</p>
      </Section>
      <Section title="Seus direitos (LGPD)">
        <p>Você tem o direito de:</p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Acessar seus dados a qualquer momento</li>
          <li>Editar suas informações de perfil</li>
          <li>Solicitar a exclusão da sua conta e de todos os dados associados</li>
          <li>Solicitar a portabilidade dos seus dados</li>
        </ul>
        <p>Para exercer qualquer desses direitos, basta acessar sua conta ou entrar em contato.</p>
      </Section>
      <Section title="Consentimento">
        <p>Ao criar uma conta e responder ao questionário, você consente com o tratamento dos seus dados para os fins descritos nesta política.</p>
      </Section>
      <Section title="Compartilhamento com instituições de ensino">
        <p>O Conectaê oferece um recurso <strong>opcional</strong> de compartilhamento do seu perfil com faculdades participantes. Este recurso é totalmente voluntário e nenhuma funcionalidade da plataforma é bloqueada se você não autorizar.</p>
        <p><strong>Quais informações podem ser compartilhadas:</strong></p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Nome</li>
          <li>Idade / faixa etária</li>
          <li>Cidade e estado</li>
          <li>Ano escolar</li>
          <li>E-mail</li>
          <li>Características acadêmicas e extracurriculares informadas no teste</li>
          <li>Interesses profissionais</li>
          <li>Resultados e dimensões do Conectaê</li>
          <li>Universidades com maior compatibilidade</li>
        </ul>
        <p><strong>Para qual finalidade:</strong> Permitir que faculdades identifiquem estudantes cujo perfil tenha afinidade com a instituição, para fins de orientação, comunicação e recrutamento.</p>
        <p><strong>Com quais tipos de instituições:</strong> Exclusivamente com faculdades participantes do programa, previamente cadastradas e autorizadas pela equipe do Conectaê.</p>
        <p><strong>O que nunca é compartilhado:</strong> Senha, dados de pagamento, informações técnicas de segurança ou qualquer dado que não seja necessário para essa finalidade.</p>
        <p><strong>Como retirar a autorização:</strong> A qualquer momento, em "Minha Conta" &gt; "Privacidade e compartilhamento", você pode alterar sua escolha ou revogar o consentimento. A revogação interrompe novos compartilhamentos imediatamente.</p>
        <p><strong>Menores de idade:</strong> Para estudantes menores de 18 anos, o compartilhamento só é ativado após a autorização de um responsável legal. O sistema solicita o nome e e-mail do responsável no momento do consentimento.</p>
        <p className="text-brand-400 font-medium">O compartilhamento é opcional. Você não precisa autorizá-lo para usar a plataforma, fazer o teste ou ver seus resultados.</p>
      </Section>
    </>
  );
}

function Terms() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Termos de Uso</h1>
      <Section title="Sobre o serviço">
        <p>O Conectaê é uma ferramenta de orientação que mede compatibilidade de perfil entre estudantes e faculdades. O resultado não é uma garantia de aprovação, admissão ou sucesso acadêmico.</p>
      </Section>
      <Section title="Uso responsável">
        <p>Você concorda em fornecer informações verdadeiras e em não tentar manipular o resultado do questionário. O algoritmo é determinístico e neutro, projetado para refletir seu perfil real.</p>
      </Section>
      <Section title="Privacidade">
        <p>Seus dados são tratados conforme nossa Política de Privacidade e a LGPD. Você pode excluir sua conta a qualquer momento.</p>
      </Section>
      <Section title="Limitação de responsabilidade">
        <p>O Conectaê é uma ferramenta de orientação. As decisões sobre qual faculdade buscar, como se preparar e onde se inscrever são de sua responsabilidade. Não nos responsabilizamos por decisões tomadas com base nos resultados.</p>
      </Section>
    </>
  );
}