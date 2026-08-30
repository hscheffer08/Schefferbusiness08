import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './App.tsx';
import UsCountryMarker from './lib/us-country-marker.tsx';
import UsEnglishMode from './lib/us-english-mode.tsx';
import UsReferralPromoMount from './lib/us-referral-promo-mount.tsx';
import VocationalDemoMount from './lib/vocational-demo-mount.tsx';
import ExpandedHomeMount from './lib/expanded-home-mount.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <UsCountryMarker />
    <UsEnglishMode />
    <UsReferralPromoMount />
    <VocationalDemoMount />
    <ExpandedHomeMount />
    <Analytics />
  </StrictMode>
);
