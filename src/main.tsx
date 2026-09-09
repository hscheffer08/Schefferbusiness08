import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import CourseHome from './components/CourseHome.tsx';
import AlphabeticalSelectOrder from './lib/alphabetical-select-order.tsx';
import { initAnalyticsTracking } from './lib/analytics.ts';
import './index.css';
import './lib/balanced-area-results.css';

initAnalyticsTracking();

const App = lazy(() => import('./App.tsx'));
const AdmissionsPlannerGate = lazy(() => import('./components/AdmissionsPlannerGate.tsx'));
const PlannerDefaultTabMount = lazy(() => import('./lib/planner-default-tab-mount.tsx'));
const AdmissionsPlannerEntryMount = lazy(() => import('./lib/admissions-planner-entry-mount.tsx'));
const UFMGCourseEntryMount = lazy(() => import('./lib/ufmg-course-entry-mount.tsx'));
const UsCountryMarker = lazy(() => import('./lib/us-country-marker.tsx'));
const UsEnglishMode = lazy(() => import('./lib/us-english-mode.tsx'));
const UsReferralPromoMount = lazy(() => import('./lib/us-referral-promo-mount.tsx'));
const VocationalDemoMount = lazy(() => import('./lib/vocational-demo-mount.tsx'));
const AccountControlsMount = lazy(() => import('./lib/account-controls-mount.tsx'));
const BalancedAreaResultsMount = lazy(() => import('./lib/balanced-area-results-mount.tsx'));
const PremiumDemoMount = lazy(() => import('./lib/premium-demo-mount.tsx'));
const DiscoveryHub = lazy(() => import('./components/DiscoveryHub.tsx'));
const AreaMatchPortal = lazy(() => import('./components/AreaMatchPortal.tsx'));
const VocationalDemoPremium = lazy(() => import('./components/VocationalDemoPremium.tsx'));
const OfficialVestibularBankPage = lazy(() => import('./components/OfficialVestibularBankPage.tsx'));
const UFMGCourseArea = lazy(() => import('./components/UFMGCourseArea.tsx'));
const UFMGDirectOfficialEnhancer = lazy(() => import('./components/UFMGDirectOfficialEnhancer.tsx'));
const InterviewCoachPage = lazy(() => import('./components/InterviewCoachPage.tsx'));
const InfoPages = lazy(() => import('./components/InfoPages.tsx'));

const params = new URLSearchParams(window.location.search);
const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
const interviewOpen = pathname === '/treino-entrevista';
const experienceByPath: Record<string, string> = {
  '/vestibulares-oficiais': 'vestibulares-oficiais',
  '/faculdades': 'faculdades',
  '/vocacional': 'vocacional',
  '/match-faculdades': 'match-faculdades',
};
const plannerOpen = params.get('planner') === 'aprovacao' || pathname === '/planejador-admissao';
const courseArea = params.get('courseArea');
const experienceMode = params.get('experience') ?? experienceByPath[pathname] ?? null;
const legacyCollegeExperienceOpen =
  params.get('modo') === 'business' ||
  params.get('questionario') === 'faculdades' ||
  params.has('ref');

type InfoPage = 'howitworks' | 'methodology' | 'faq' | 'privacy' | 'terms';
const infoPageByPath: Record<string, InfoPage> = {
  '/como-funciona': 'howitworks',
  '/metodologia': 'methodology',
  '/faq': 'faq',
  '/privacidade': 'privacy',
  '/termos': 'terms',
};
const infoPage = infoPageByPath[pathname] ?? null;

function updateMeta(title: string, description: string, canonicalPath: string) {
  document.title = title;
  const descriptionMeta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (descriptionMeta) descriptionMeta.content = description;
  const canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  const canonicalUrl = `https://xn--conecta-pya.app${canonicalPath}`;
  if (canonical) canonical.href = canonicalUrl;
  const values: Array<[string, string]> = [
    ['meta[property="og:title"]', title],
    ['meta[property="og:description"]', description],
    ['meta[property="og:url"]', canonicalUrl],
    ['meta[name="twitter:title"]', title],
    ['meta[name="twitter:description"]', description],
  ];
  for (const [selector, value] of values) {
    const element = document.querySelector<HTMLMetaElement>(selector);
    if (element) element.content = value;
  }
}

if (interviewOpen) {
  updateMeta(
    'Treino de entrevista para Insper e Link | Conectaê',
    'Pratique entrevistas de admissão para Insper e Link com 10 perguntas adaptativas, feedback por competência e plano de melhoria.',
    '/treino-entrevista',
  );
} else if (courseArea === 'ufmg') {
  updateMeta(
    'Seriado UFMG: conteúdo por ano e questões | Conectaê',
    'Estude para o Seriado UFMG em uma área separada do Curso, com conteúdos específicos do 1º, 2º e 3º anos e questões por componente curricular.',
    '/?planner=aprovacao&courseArea=ufmg',
  );
} else if (plannerOpen) {
  updateMeta(
    'Plano de aprovação adaptativo | Conectaê',
    'Monte um plano semanal adaptado à sua faculdade, prova, notas atuais e tempo disponível.',
    '/planejador-admissao',
  );
} else if (experienceMode === 'vestibulares-oficiais') {
  updateMeta(
    'Questões oficiais de vestibulares | Conectaê',
    'Pratique questões oficiais por vestibular, edição, matéria e número, com fonte e gabarito rastreados.',
    '/vestibulares-oficiais',
  );
} else if (experienceMode === 'faculdades' || experienceMode === 'descoberta') {
  updateMeta(
    'Explore cursos e faculdades | Conectaê',
    'Compare opções, descubra áreas profissionais e encontre faculdades compatíveis com o seu perfil.',
    '/faculdades',
  );
} else if (experienceMode === 'vocacional') {
  updateMeta(
    'Teste vocacional | Conectaê',
    'Explore áreas profissionais compatíveis com seus interesses, preferências e objetivos.',
    '/vocacional',
  );
} else if (experienceMode === 'match-faculdades') {
  updateMeta(
    'Match de faculdades | Conectaê',
    'Compare faculdades e encontre opções alinhadas ao seu perfil acadêmico e profissional.',
    '/match-faculdades',
  );
} else if (infoPage) {
  const meta: Record<InfoPage, [string, string]> = {
    howitworks: ['Como funciona | Conectaê', 'Entenda como o Conectaê calcula compatibilidade de perfil com faculdades.'],
    methodology: ['Metodologia | Conectaê', 'Conheça os critérios e a metodologia usados no match de faculdades do Conectaê.'],
    faq: ['Perguntas frequentes | Conectaê', 'Respostas sobre conta, privacidade, match e funcionamento do Conectaê.'],
    privacy: ['Política de Privacidade | Conectaê', 'Saiba como o Conectaê trata, protege e compartilha dados mediante consentimento.'],
    terms: ['Termos de Uso | Conectaê', 'Consulte os termos de uso da plataforma Conectaê.'],
  };
  const [title, description] = meta[infoPage];
  updateMeta(title, description, pathname);
}

function navigateExperience(experience: string | null) {
  const url = new URL(window.location.href);
  url.pathname = '/';
  url.searchParams.delete('planner');
  url.searchParams.delete('courseArea');
  url.searchParams.delete('modo');
  url.searchParams.delete('questionario');
  if (experience) url.searchParams.set('experience', experience);
  else url.searchParams.delete('experience');
  window.location.assign(`${url.pathname}${url.search}${url.hash}`);
}

const closePlanner = () => {
  const url = new URL(window.location.href);
  url.pathname = '/';
  url.searchParams.delete('planner');
  url.searchParams.delete('courseArea');
  url.searchParams.delete('experience');
  window.location.assign(`${url.pathname}${url.search}${url.hash}`);
};

const backToCourse = () => {
  const url = new URL(window.location.href);
  url.pathname = '/';
  url.searchParams.set('planner', 'aprovacao');
  url.searchParams.delete('courseArea');
  url.searchParams.delete('experience');
  window.location.assign(`${url.pathname}${url.search}${url.hash}`);
};

const openPlanner = () => {
  const url = new URL(window.location.href);
  url.pathname = '/';
  url.searchParams.set('planner', 'aprovacao');
  url.searchParams.delete('courseArea');
  url.searchParams.delete('experience');
  window.location.assign(`${url.pathname}${url.search}${url.hash}`);
};

const loadingFallback = (
  <div className="min-h-screen bg-[#020817] text-white flex items-center justify-center px-6">
    <div className="text-center">
      <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-[#173765] border-t-[#72a5ff]" />
      <p className="mt-4 text-sm font-bold text-[#9fb5d4]">Carregando sua experiência Conectaê…</p>
    </div>
  </div>
);

const knownExperiencePath = Boolean(experienceByPath[pathname]);
const unknownPath = pathname !== '/' && pathname !== '/planejador-admissao' && !knownExperiencePath && !interviewOpen && !infoPage;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={loadingFallback}>
      {infoPage ? (
        <InfoPages page={infoPage} onBack={() => window.location.assign('/')} />
      ) : interviewOpen ? (
        <InterviewCoachPage />
      ) : plannerOpen ? (
        courseArea === 'ufmg' ? (
          <UFMGCourseArea onBack={backToCourse} />
        ) : (
          <>
            <AdmissionsPlannerGate onBack={closePlanner} />
            <PlannerDefaultTabMount />
            <UFMGCourseEntryMount />
          </>
        )
      ) : experienceMode === 'vestibulares-oficiais' ? (
        <OfficialVestibularBankPage onBack={() => navigateExperience(null)} />
      ) : experienceMode === 'faculdades' || experienceMode === 'descoberta' ? (
        <DiscoveryHub
          onBack={() => navigateExperience(null)}
          onOpenVocational={() => navigateExperience('vocacional')}
          onOpenColleges={() => navigateExperience('match-faculdades')}
          onOpenPlanner={openPlanner}
        />
      ) : experienceMode === 'vocacional' ? (
        <VocationalDemoPremium onBack={() => navigateExperience('faculdades')} />
      ) : experienceMode === 'match-faculdades' ? (
        <AreaMatchPortal onClose={() => navigateExperience('faculdades')} />
      ) : legacyCollegeExperienceOpen ? (
        <>
          <App />
          <UsCountryMarker />
          <UsEnglishMode />
          <UsReferralPromoMount />
          <VocationalDemoMount />
          <AdmissionsPlannerEntryMount />
          <BalancedAreaResultsMount />
          <PremiumDemoMount />
        </>
      ) : unknownPath ? (
        <div className="min-h-screen bg-[#020817] text-white flex items-center justify-center px-6">
          <div className="max-w-md text-center">
            <div className="text-sm font-black uppercase tracking-[.15em] text-[#72a5ff]">Página não encontrada</div>
            <h1 className="mt-3 text-4xl font-black">Esse endereço não existe.</h1>
            <p className="mt-3 text-[#9fb5d4]">Volte para o início e continue pelo menu principal do Conectaê.</p>
            <button onClick={() => window.location.assign('/')} className="mt-6 rounded-xl bg-[#246cff] px-5 py-3 text-sm font-black">Ir para o início</button>
          </div>
        </div>
      ) : (
        <CourseHome />
      )}
      <AccountControlsMount />
      <UFMGDirectOfficialEnhancer />
    </Suspense>
    <AlphabeticalSelectOrder />
    <Analytics />
    <SpeedInsights />
  </StrictMode>
);
