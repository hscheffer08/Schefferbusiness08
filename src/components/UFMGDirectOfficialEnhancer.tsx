import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, FileCheck2 } from 'lucide-react';
import { UFMG_OFFICIAL_2025 } from '@/lib/ufmg-seriado-data';

type TargetState = {
  host: HTMLDivElement;
  iframe: HTMLIFrameElement;
  questionNumber: number;
  page: number;
  grid: HTMLElement | null;
};

function findTarget(): TargetState | null {
  const iframe = [...document.querySelectorAll<HTMLIFrameElement>('iframe')]
    .find(item => /^Questão \d+ do Seriado UFMG 2025$/.test(item.title));
  if (!iframe) return null;

  const match = iframe.title.match(/Questão (\d+) do Seriado UFMG 2025/);
  if (!match) return null;
  const questionNumber = Number(match[1]);
  const pageMatch = iframe.src.match(/[?#&]page=(\d+)/);
  const page = pageMatch ? Number(pageMatch[1]) : 1;
  const leftPanel = iframe.parentElement as HTMLElement | null;
  if (!leftPanel) return null;

  let host = leftPanel.querySelector<HTMLDivElement>('[data-ufmg-direct-question-host="true"]');
  if (!host) {
    host = document.createElement('div');
    host.dataset.ufmgDirectQuestionHost = 'true';
    const header = leftPanel.firstElementChild;
    if (header?.nextSibling) leftPanel.insertBefore(host, header.nextSibling);
    else leftPanel.appendChild(host);
  }

  return {
    host,
    iframe,
    questionNumber,
    page,
    grid: leftPanel.parentElement as HTMLElement | null,
  };
}

export default function UFMGDirectOfficialEnhancer() {
  const [target, setTarget] = useState<TargetState | null>(null);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('courseArea') !== 'ufmg') return;

    const media = window.matchMedia('(max-width: 767px)');
    const onMedia = () => setIsMobile(media.matches);
    media.addEventListener?.('change', onMedia);

    let lastKey = '';
    const sync = () => {
      const next = findTarget();
      if (!next) {
        if (lastKey) {
          lastKey = '';
          setTarget(null);
        }
        return;
      }
      const key = `${next.questionNumber}:${next.page}`;
      if (key === lastKey) return;
      lastKey = key;
      setTarget(next);
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['src', 'title'] });
    const timer = window.setInterval(sync, 500);
    return () => {
      observer.disconnect();
      window.clearInterval(timer);
      media.removeEventListener?.('change', onMedia);
    };
  }, []);

  useEffect(() => {
    if (!target) return;
    const { iframe, grid } = target;
    const footer = iframe.nextElementSibling as HTMLElement | null;
    const originalIframeDisplay = iframe.style.display;
    const originalFooterDisplay = footer?.style.display ?? '';
    const originalGridTemplate = grid?.style.gridTemplateColumns ?? '';

    if (isMobile) {
      iframe.style.display = 'none';
      if (footer) footer.style.display = 'none';
      if (grid) grid.style.gridTemplateColumns = 'minmax(0,1fr)';
    }

    return () => {
      iframe.style.display = originalIframeDisplay;
      if (footer) footer.style.display = originalFooterDisplay;
      if (grid) grid.style.gridTemplateColumns = originalGridTemplate;
    };
  }, [target, isMobile]);

  if (!target) return null;

  return createPortal(
    <div className="border-b border-[#173765] bg-[#06152f] p-4 md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/[.08] px-2.5 py-1 text-[10px] font-black uppercase tracking-[.12em] text-emerald-200">
            <FileCheck2 size={13}/> Prova antiga oficial
          </div>
          <div className="mt-2 text-lg font-black text-white">UFMG 2025 • Questão {String(target.questionNumber).padStart(2, '0')}</div>
          <p className="mt-1 text-xs leading-relaxed text-[#9fb5d4]">
            Enunciado original no caderno da UFMG, página {target.page}. Responda no próprio Conectaê e o resultado entra no seu placar.
          </p>
        </div>
        <a
          href={`${UFMG_OFFICIAL_2025.examUrl}#page=${target.page}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-xs font-black text-[#02120b]"
        >
          Abrir enunciado oficial <ExternalLink size={14}/>
        </a>
      </div>
      {isMobile && <div className="mt-3 rounded-xl border border-[#31588e] bg-[#041027] p-3 text-xs font-bold leading-relaxed text-[#b9cbe4]">
        No celular, o PDF embutido foi removido porque alguns navegadores — especialmente o do Instagram — exibem uma tela branca. O botão acima abre diretamente a página correta.
      </div>}
    </div>,
    target.host,
  );
}
