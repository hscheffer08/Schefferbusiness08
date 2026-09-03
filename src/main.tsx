import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './App.tsx';
import CourseHome from './components/CourseHome.tsx';
import AdmissionsPlannerGate from './components/AdmissionsPlannerGate.tsx';
import AdmissionsPlannerEntryMount from './lib/admissions-planner-entry-mount.tsx';
import UsCountryMarker from './lib/us-country-marker.tsx';
import UsEnglishMode from './lib/us-english-mode.tsx';
import UsReferralPromoMount from './lib/us-referral-promo-mount.tsx';
import VocationalDemoMount from './lib/vocational-demo-mount.tsx';
import ExpandedHomeMount from './lib/expanded-home-mount.tsx';
import AccountControlsMount from './lib/account-controls-mount.tsx';
import BalancedAreaResultsMount from './lib/balanced-area-results-mount.tsx';
import PremiumDemoMount from './lib/premium-demo-mount.tsx';
import './index.css';
import './lib/balanced-area-results.css';

const params = new URLSearchParams(window.location.search);
const plannerOpen = params.get('planner') === 'aprovacao';
const collegeExperienceOpen =
  params.get('experience') === 'faculdades' ||
  params.get('modo') === 'business' ||
  params.get('questionario') === 'faculdades';

const closePlanner = () => {
  const url = new URL(window.location.href);
  url.searchParams.delete('planner');
  url.searchParams.delete('experience');
  window.location.assign(`${url.pathname}${url.search}${url.hash}`);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {plannerOpen ? (
      <AdmissionsPlannerGate onBack={closePlanner} />
    ) : collegeExperienceOpen ? (
      <>
        <App />
        <UsCountryMarker />
        <UsEnglishMode />
        <UsReferralPromoMount />
        <VocationalDemoMount />
        <ExpandedHomeMount />
        <AdmissionsPlannerEntryMount />
        <AccountControlsMount />
        <BalancedAreaResultsMount />
        <PremiumDemoMount />
      </>
    ) : (
      <CourseHome />
    )}
    <Analytics />
  </StrictMode>
);
