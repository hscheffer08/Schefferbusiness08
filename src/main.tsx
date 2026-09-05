import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import CourseHome from './components/CourseHome.tsx';
import AlphabeticalSelectOrder from './lib/alphabetical-select-order.tsx';
import './index.css';
import './lib/balanced-area-results.css';

const App = lazy(() => import('./App.tsx'));
const AdmissionsPlannerGate = lazy(() => import('./components/AdmissionsPlannerGate.tsx'));
const PlannerDefaultTabMount = lazy(() => import('./lib/planner-default-tab-mount.tsx'));
const AdmissionsPlannerEntryMount = lazy(() => import('./lib/admissions-planner-entry-mount.tsx'));
const UsCountryMarker = lazy(() => import('./lib/us-country-marker.tsx'));
const UsEnglishMode = lazy(() => import('./lib/us-english-mode.tsx'));
const UsReferralPromoMount = lazy(() => import('./lib/us-referral-promo-mount.tsx'));
const VocationalDemoMount = lazy(() => import('./lib/vocational-demo-mount.tsx'));
const ExpandedHomeMount = lazy(() => import('./lib/expanded-home-mount.tsx'));
const AccountControlsMount = lazy(() => import('./lib/account-controls-mount.tsx'));
const BalancedAreaResultsMount = lazy(() => import('./lib/balanced-area-results-mount.tsx'));
const PremiumDemoMount = lazy(() => import('./lib/premium-demo-mount.tsx'));
const DiscoveryHub = lazy(() => import('./components/DiscoveryHub.tsx'));
const AreaMatchPortal = lazy(() => import('./components/AreaMatchPortal.tsx'));
const VocationalDemoPremium = lazy(() => import('./components/VocationalDemoPremium.tsx'));
const OfficialVestibularBankPage = lazy(() => import('./components/OfficialVestibularBankPage.tsx'));

const params = new URLSearchParams(window.location.search);
const plannerOpen = params.get('planner') === 'aprovacao';
const experienceMode = params.get('experience');
const legacyCollegeExperienceOpen =
  params.get('modo') === 'business' ||
  params.get('questionario') === 'faculdades' ||
  params.has('ref');

function navigateExperience(experience: string | null) {
  const url = new URL(window.location.href);
  url.searchParams.delete('planner');
  url.searchParams.delete('modo');
  url.searchParams.delete('questionario');
  if (experience) url.searchParams.set('experience', experience);
  else url.searchParams.delete('experience');
  window.location.assign(`${url.pathname}${url.search}${url.hash}`);
}

const closePlanner = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete('planner');
  url.searchParams.delete('experience');
  window.location.assign(`${url.pathname}${url.search}${url.hash}`);
};

const openPlanner = () => {
  const url = new URL(window.location.href);
  url.searchParams.set('planner', 'aprovacao');
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={loadingFallback}>
      {plannerOpen ? (
        <>
          <AdmissionsPlannerGate onBack={closePlanner} />
          <PlannerDefaultTabMount />
        </>
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
          <ExpandedHomeMount />
          <AdmissionsPlannerEntryMount />
          <BalancedAreaResultsMount />
          <PremiumDemoMount />
        </>
      ) : (
        <CourseHome />
      )}
      <AccountControlsMount />
    </Suspense>
    <AlphabeticalSelectOrder />
    <Analytics />
  </StrictMode>
);
