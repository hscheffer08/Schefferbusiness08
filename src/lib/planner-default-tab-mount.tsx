import { useEffect } from 'react';

function clickPlannerTab() {
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('.plan6-tab'));
  const planButton = tabs.find((button) => button.textContent?.trim() === 'Plano');
  if (!planButton || planButton.classList.contains('active')) return Boolean(planButton);
  planButton.click();
  return true;
}

export default function PlannerDefaultTabMount() {
  useEffect(() => {
    let opened = false;
    const tryOpen = () => {
      if (opened) return;
      opened = clickPlannerTab();
    };

    tryOpen();
    const observer = new MutationObserver(tryOpen);
    observer.observe(document.body, { childList: true, subtree: true });

    const timer = window.setTimeout(() => {
      tryOpen();
      observer.disconnect();
    }, 12000);

    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, []);

  return null;
}
