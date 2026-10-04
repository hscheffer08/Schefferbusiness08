/** Reading shared by questions 1–5, verified in the original CMMG booklet. */
export function officialReadingPage(sourceUrl: string | null | undefined, questionNumber: number) {
  if (!sourceUrl || questionNumber < 1 || questionNumber > 5) return null;
  try {
    const url = new URL(sourceUrl);
    return url.hostname === 'vestibular.cmmg.edu.br' && url.pathname === '/wp-content/uploads/2026/07/CMMG_2-SEM_2026.pdf' ? 3 : null;
  } catch { return null; }
}
