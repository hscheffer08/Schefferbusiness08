import { useEffect, useState } from 'react';

const STORAGE_KEY = 'bschoolfit-country';

export default function UsCountryMarker() {
  const [isUs, setIsUs] = useState(() => sessionStorage.getItem(STORAGE_KEY) === 'US');

  useEffect(() => {
    const sync = () => {
      const usButton = document.querySelector('button[aria-label="Universidades dos Estados Unidos"]');
      const brButton = document.querySelector('button[aria-label="Universidades do Brasil"]');
      if (usButton?.getAttribute('aria-selected') === 'true') {
        sessionStorage.setItem(STORAGE_KEY, 'US');
        setIsUs(true);
      } else if (brButton?.getAttribute('aria-selected') === 'true') {
        sessionStorage.setItem(STORAGE_KEY, 'BR');
        setIsUs(false);
      }
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-selected'] });
    return () => observer.disconnect();
  }, []);

  return (
    <button
      type="button"
      aria-label="Universidades dos Estados Unidos"
      aria-selected={isUs}
      tabIndex={-1}
      className="hidden"
      data-language-marker="US"
    />
  );
}
