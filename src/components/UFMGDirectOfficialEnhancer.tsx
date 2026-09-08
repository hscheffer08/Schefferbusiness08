import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, ExternalLink, Eye, EyeOff, Loader2, XCircle } from 'lucide-react';
import { UFMG_OFFICIAL_2025 } from '@/lib/ufmg-seriado-data';
import { extractUFMGOfficialQuestion, type UFMGDirectOfficialQuestion } from '@/lib/ufmg-official-question-client';

type TargetState = {
  host: HTMLDivElement;
  iframe: HTMLIFrameElement;
  questionNumber: number;
  page: number;
  grid: HTMLElement | null;
  answerPanel: HTMLElement | null;
};

function readChosen(questionNumber: number) {
  try {
    const raw = localStorage.getItem('conectae:ufmg-official-2025-answers');
    const parsed = raw ? JSON.parse(raw) as Record<string, string> : {};
    return parsed[String(questionNumber)] ?? '';
  } catch {
    return '';
  }
}

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

  const grid = leftPanel.parentElement as HTMLElement | null;
  const answerPanel = grid ? [...grid.children].find(child => child !== leftPanel) as HTMLElement | undefined : undefined;
  return { host, iframe, questionNumber, page, grid, answerPanel: answerPanel ?? null };
}

export default function UFMGDirectOfficialEnhancer() {
  const [target, setTarget] = useState<TargetState | null>(null);
  const [question, setQuestion] = useState<UFMGDirectOfficialQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSource, setShowSource] = useState(false);
  const [chosen, setChosen] = useState('');

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('courseArea') !== 'ufmg') return;

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
      const key = `${next.questionNumber}:${next.page}:${next.host.dataset.ufmgDirectQuestionHost}`;
      if (key === lastKey) return;
      lastKey = key;
      setTarget(next);
      setChosen(readChosen(next.questionNumber));
      setShowSource(false);
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['src', 'title'] });
    const timer = window.setInterval(sync, 500);
    return () => {
      observer.disconnect();
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!target) return;
    const { iframe, grid, answerPanel } = target;
    const originalIframeDisplay = iframe.style.display;
    const footer = iframe.nextElementSibling as HTMLElement | null;
    const originalFooterDisplay = footer?.style.display ?? '';
    const originalAnswerDisplay = answerPanel?.style.display ?? '';
    const originalGridTemplate = grid?.style.gridTemplateColumns ?? '';

    iframe.style.display = showSource ? 'block' : 'none';
    if (footer) footer.style.display = showSource ? 'block' : 'none';
    if (answerPanel) answerPanel.style.display = 'none';
    if (grid) grid.style.gridTemplateColumns = 'minmax(0,1fr)';

    return () => {
      iframe.style.display = originalIframeDisplay;
      if (footer) footer.style.display = originalFooterDisplay;
      if (answerPanel) answerPanel.style.display = originalAnswerDisplay;
      if (grid) grid.style.gridTemplateColumns = originalGridTemplate;
    };
  }, [target, showSource]);

  useEffect(() => {
    if (!target) return;
    let cancelled = false;
    setQuestion(null);
    setError('');
    setLoading(true);
    extractUFMGOfficialQuestion(UFMG_OFFICIAL_2025.examUrl, target.questionNumber, target.page)
      .then(result => {
        if (cancelled) return;
        if (!result.found) {
          setError('Não consegui extrair esta questão automaticamente. Você ainda pode ver a página oficial abaixo.');
          setShowSource(true);
          return;
        }
        setQuestion(result);
        if (result.needsSourceImage) setShowSource(true);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Não consegui carregar o texto desta questão agora. A página oficial continua disponível.');
        setShowSource(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [target?.questionNumber, target?.page]);

  const correctLetter = useMemo(() => {
    if (!target) return '';
    return UFMG_OFFICIAL_2025.finalKey[target.questionNumber - 1] ?? '';
  }, [target]);

  if (!target) return null;

  const select = (letter: string) => {
    if (chosen) return;
    const section = target.host.closest('section');
    const answerButtons = section ? [...section.querySelectorAll<HTMLButtonElement>('button')] : [];
    const original = answerButtons.find(button => button.textContent?.trim() === letter && button !== document.activeElement);
    original?.click();
    setChosen(letter);
  };

  const gotRight = Boolean(chosen && chosen === correctLetter);

  return createPortal(
    <div className="bg-[#06152f] p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[.14em] text-emerald-300">Questão diretamente no site</div>
          <div className="mt-1 text-sm font-bold text-[#9fb5d4]">Texto extraído do caderno oficial UFMG 2025 • página {target.page}</div>
        </div>
        <button onClick={() => setShowSource(value => !value)} className="inline-flex items-center gap-2 rounded-xl border border-[#31588e] bg-[#041027] px-3 py-2 text-xs font-black text-[#b9cbe4]">
          {showSource ? <EyeOff size={14}/> : <Eye size={14}/>} {showSource ? 'Ocultar página original' : 'Ver página original'}
        </button>
      </div>

      {loading && <div className="mt-6 flex min-h-48 items-center justify-center rounded-2xl border border-[#173765] bg-[#041027]"><div className="flex items-center gap-3 text-sm font-bold text-[#9fb5d4]"><Loader2 className="animate-spin" size={18}/>Carregando questão oficial…</div></div>}

      {!loading && question?.found && <div className="mt-6">
        <h4 className="text-lg font-bold leading-relaxed text-white md:text-2xl">{question.prompt}</h4>
        <div className="mt-5 grid gap-3">
          {question.options.slice(0, 4).map((option, index) => {
            const letter = String.fromCharCode(65 + index);
            const right = Boolean(chosen) && letter === correctLetter;
            const wrong = Boolean(chosen) && letter === chosen && letter !== correctLetter;
            return <button
              key={letter}
              disabled={Boolean(chosen)}
              onClick={() => select(letter)}
              className={`flex items-start gap-3 rounded-2xl border p-4 text-left text-sm font-bold transition md:text-base ${right ? 'border-emerald-300/55 bg-emerald-300/10 text-emerald-50' : wrong ? 'border-rose-300/55 bg-rose-300/10 text-rose-50' : 'border-[#31588e] bg-[#041027] text-[#d5e2f3] hover:border-[#72a5ff]'}`}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#0b2856] text-sm font-black">{letter}</span>
              <span className="pt-1.5 leading-relaxed">{option}</span>
            </button>;
          })}
        </div>

        {chosen && <div className={`mt-5 rounded-2xl border p-4 ${gotRight ? 'border-emerald-300/25 bg-emerald-300/[.07]' : 'border-rose-300/25 bg-rose-300/[.07]'}`}>
          <div className={`flex items-center gap-2 font-black ${gotRight ? 'text-emerald-300' : 'text-rose-300'}`}>{gotRight ? <CheckCircle2 size={19}/> : <XCircle size={19}/>} {gotRight ? 'Acertou!' : `Errou. Gabarito oficial: ${correctLetter}`}</div>
          <p className="mt-2 text-xs leading-relaxed text-[#a9bddc]">Sua resposta já foi contabilizada no placar da prova. Use a seta de próxima questão no topo.</p>
        </div>}

        {question.needsSourceImage && <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/[.06] p-3 text-xs font-bold leading-relaxed text-amber-100">Esta questão usa figura, gráfico, tabela ou outro elemento visual. A página oficial foi aberta logo abaixo para você ver esse elemento sem sair do site.</div>}
      </div>}

      {!loading && error && <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/[.06] p-4 text-sm leading-relaxed text-amber-100">{error}</div>}

      <div className="mt-4 flex justify-end">
        <a href={`${UFMG_OFFICIAL_2025.examUrl}#page=${target.page}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-black text-[#72a5ff]">Abrir fonte oficial <ExternalLink size={13}/></a>
      </div>
    </div>,
    target.host,
  );
}
