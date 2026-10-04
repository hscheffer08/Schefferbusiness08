import { officialReadingPage } from '@/lib/official-reading-context';

export default function OfficialReadingContext({ sourceUrl, questionNumber }: { sourceUrl: string | null | undefined; questionNumber: number }) {
  const page = officialReadingPage(sourceUrl, questionNumber);
  if (!page || !sourceUrl) return null;
  const readingUrl = `${sourceUrl.split('#')[0]}#page=${page}&view=FitH`;
  return <section aria-label="Texto-base da questão" className="my-4 space-y-3 rounded-xl border border-slate-400/40 p-4">
    <h3 className="text-lg font-bold">Texto-base para as questões 1 a 5</h3>
    <p className="text-base">Leia a crônica na página 3 do caderno oficial antes de responder.</p>
    <a className="inline-block underline" href={readingUrl} target="_blank" rel="noreferrer">Abrir texto-base na prova oficial</a>
    <iframe title="Texto-base CMMG 2026 — 2º semestre, página 3" src={readingUrl} className="h-[640px] w-full rounded-lg bg-white" loading="lazy" />
    <p className="text-sm">Se o PDF não aparecer neste dispositivo, use o link acima.</p>
  </section>;
}
