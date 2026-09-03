import { useEffect } from 'react';

const collator = new Intl.Collator('pt-BR', {
  sensitivity: 'base',
  numeric: true,
  ignorePunctuation: true,
});

function normalizedLabel(option: HTMLOptionElement) {
  return (option.label || option.textContent || '').trim();
}

function sortOptions(parent: HTMLSelectElement | HTMLOptGroupElement | HTMLDataListElement) {
  const options = Array.from(parent.children).filter(
    (child): child is HTMLOptionElement => child instanceof HTMLOptionElement,
  );

  if (options.length < 2) return;

  const pinned = options.filter(
    (option) =>
      option.value === '' ||
      option.hasAttribute('data-placeholder') ||
      option.hasAttribute('data-sort-fixed'),
  );
  const sortable = options.filter((option) => !pinned.includes(option));
  const sorted = [...sortable].sort((a, b) => collator.compare(normalizedLabel(a), normalizedLabel(b)));
  const desired = [...pinned, ...sorted];

  if (desired.every((option, index) => options[index] === option)) return;

  const selectedValue = parent instanceof HTMLSelectElement ? parent.value : null;
  desired.forEach((option) => parent.appendChild(option));
  if (parent instanceof HTMLSelectElement && selectedValue !== null) parent.value = selectedValue;
}

function alphabetize(root: ParentNode = document) {
  const selects = Array.from(root.querySelectorAll<HTMLSelectElement>('select:not([data-preserve-order])'));
  const datalists = Array.from(root.querySelectorAll<HTMLDataListElement>('datalist:not([data-preserve-order])'));

  if (root instanceof HTMLSelectElement && !root.hasAttribute('data-preserve-order')) selects.unshift(root);
  if (root instanceof HTMLDataListElement && !root.hasAttribute('data-preserve-order')) datalists.unshift(root);

  selects.forEach((select) => {
    sortOptions(select);
    select.querySelectorAll('optgroup').forEach((group) => sortOptions(group));
  });
  datalists.forEach((datalist) => sortOptions(datalist));
}

export default function AlphabeticalSelectOrder() {
  useEffect(() => {
    alphabetize();

    let scheduled = false;
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        alphabetize();
      });
    };

    const observer = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.type === 'childList' && mutation.addedNodes.length > 0)) {
        schedule();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
