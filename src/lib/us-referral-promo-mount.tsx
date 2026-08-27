import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Gift, Users } from 'lucide-react';

const COUNTRY_STORAGE_KEY = 'conectae-country';
const PORTAL_ID = 'conectae-us-referral-promo';

function isUsSelected() {
  const usButton = document.querySelector('button[aria-label="Universidades dos Estados Unidos"]');
  return usButton?.getAttribute('aria-selected') === 'true' || sessionStorage.getItem(COUNTRY_STORAGE_KEY) === 'US';
}

function findQuizCardsContainer(): HTMLElement | null {
  const main = document.querySelector('main');
  if (!main) return null;

  const buttons = Array.from(main.querySelectorAll('button'));
  const quickMatchButton = buttons.find((button) => {
    const text = button.textContent ?? '';
    return text.includes('Match Rápido') || text.includes('Quick Match');
  });

  if (!quickMatchButton) return null;
  return quickMatchButton.parentElement;
}

export default function UsReferralPromoMount() {
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sync = () => {
      const usSelected = isUsSelected();
      setVisible(usSelected);

      if (!usSelected) {
        document.getElementById(PORTAL_ID)?.remove();
        setTarget(null);
        return;
      }

      const cards = findQuizCardsContainer();
      if (!cards) return;

      let portal = document.getElementById(PORTAL_ID) as HTMLElement | null;
      if (!portal) {
        portal = document.createElement('div');
        portal.id = PORTAL_ID;
        portal.className = 'w-full max-w-3xl';
        cards.insertAdjacentElement('afterend', portal);
      }
      setTarget(portal);
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-selected'],
    });

    return () => {
      observer.disconnect();
      document.getElementById(PORTAL_ID)?.remove();
    };
  }, []);

  if (!visible || !target) return null;

  return createPortal(
    <div className="animate-fade-up mt-5 w-full rounded-2xl border border-brand-500/30 bg-brand-500/5 p-5 md:p-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-brand-500/15 text-brand-300 flex items-center justify-center flex-shrink-0">
          <Users className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-base md:text-lg font-bold text-ink-50">Refer friends and earn R$300</h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-ink-800 text-ink-400 text-[11px] font-medium">
              <Gift className="w-3 h-3" /> Referral challenge
            </span>
          </div>
          <p className="text-sm text-ink-400 leading-relaxed">
            Share Conectaê. At the end of either the Quick Match or Full Questionnaire, your friend can enter the full name of the person who referred them. The person with the most registered referrals wins R$300.
          </p>
        </div>
      </div>
    </div>,
    target
  );
}
