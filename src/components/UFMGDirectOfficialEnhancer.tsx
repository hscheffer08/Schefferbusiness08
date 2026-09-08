import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, ChevronRight, ExternalLink, Eye, EyeOff, FileCheck2, Loader2, RotateCcw, XCircle } from 'lucide-react';
import { UFMG_OFFICIAL_2025 } from '@/lib/ufmg-seriado-data';
import { getUFMGOfficial2025Question, type UFMGOfficialLanguage, type UFMGOfficialStaticQuestion } from '@/lib/ufmg-official-2025-static';

type TargetState = {
  host: HTMLDivElement;
  iframe: HTMLIFrameElement;
  questionNumber: number;
  page: number;
  grid: HTMLElement | null;
  leftPanel: HTMLElement;
  answerPanel: HTMLElement | null;
  sourceHeader: HTMLElement | null;
  footer: HTMLElement | null;
};

type QuestionPatch = Pick<UFMGOfficialStaticQuestion, 'prompt' | 'options' | 'pages' | 'showSourceByDefault'>;

const PDFJS_MODULE = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs';
const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
const UFMG_CADERNO_S = 'https://backend.copeve.ufmg.br/uploads/Caderno_S_af1b9b2452.pdf';

const QUESTION_PATCHES: Record<number, QuestionPatch> = {
  31: {
    prompt: 'O nosso corpo humano é composto principalmente por água, o que equivale a dizer que em torno de 60% da massa total de um adulto é composta por água. Os demais 40% da nossa composição corporal são formados pelos elementos químicos oxigênio, carbono, hidrogênio, nitrogênio, cálcio e fósforo, em maior proporção, e pelos elementos potássio, enxofre, sódio, cloro e magnésio, numa escala menor; o que proporciona diferenças na composição de cada corpo humano. Existem pessoas que flutuam e outras que afundam quando estão dentro de uma piscina. Dentre muitas opções, o conceito de empuxo é fundamental para entender por que isso acontece. A flutuação de um corpo depende diretamente',
    options: ['das densidades do corpo e do líquido em que o corpo está imerso.', 'da massa do corpo que está imerso e da aceleração da gravidade.', 'da quantidade de corpos que estão imersos juntos no líquido.', 'do volume do corpo e a sua altura em relação ao fundo da piscina.'],
    pages: [32],
    showSourceByDefault: false,
  },
  32: {
    prompt: 'Os processos de separação de misturas são fundamentais para a vida moderna. Eles permitem a purificação de substâncias, além de facilitar o reaproveitamento de materiais e o tratamento de resíduos. Considere as seguintes aplicações que envolvem processos de separação de misturas. I. Produção de sal marinho a partir de água do mar. II. Separação de sedimentos em estações de tratamento de água e esgoto. III. Separação de agregados de diferentes tamanhos na construção civil. IV. Separação do petróleo em diversas frações (querosene, gás de cozinha etc.). O processo de separação de componentes de misturas que não é utilizado nas aplicações descritas é a',
    options: ['destilação.', 'evaporação.', 'flotação.', 'peneiração.'],
    pages: [32],
    showSourceByDefault: false,
  },
  33: {
    prompt: 'A fabricação de pães e bolos envolve processos químicos, físicos e biológicos. Nesses processos de produção dessas massas, é incorreto afirmar que',
    options: ['usar bicarbonato de sódio, como fermento químico, libera as bolhas de gás decorrente da reação dessa substância com os diversos ácidos dos ingredientes.', 'bater as claras em neve é um processo químico que incorpora e gera gás carbônico que aera massas de bolos.', 'utilizar fermento biológico produz bolhas de gás como subproduto do metabolismo dos açúcares da massa.', 'assar pães de fermentação biológica expande as bolhas de gás preexistentes quando se aquece a massa.'],
    pages: [33],
    showSourceByDefault: false,
  },
  34: {
    prompt: 'O desenvolvimento dos modelos atômicos foi fundamental para a compreensão da estrutura da matéria. Cada modelo proposto ao longo da história representou um avanço na forma como os cientistas explicam e entendem o comportamento dos átomos e suas interações. Analise as afirmativas a seguir e assinale (V), diante das verdadeiras, ou (F), diante das falsas. ( ) A luz amarela emitida por uma lâmpada de vapor de sódio pode ser explicada pelo modelo de Bohr. ( ) A presença de íons em substâncias iônicas pode ser explicada usando o modelo de Dalton. ( ) A condutividade elétrica de um metal pode ser explicada usando o modelo de Thomson. ( ) A menor energia de ionização do potássio em relação ao sódio pode ser explicada usando o modelo de Rutherford. A sequência correta é',
    options: ['V, V, F, F.', 'F, F, V, V.', 'F, V, F, V.', 'V, F, V, F.'],
    pages: [33],
    showSourceByDefault: false,
  },
};

let pdfPromise: Promise<any> | null = null;

function readChosen(questionNumber: number) {
  try {
    const raw = localStorage.getItem('conectae:ufmg-official-2025-answers');
    const parsed = raw ? JSON.parse(raw) as Record<string, string> : {};
    return parsed[String(questionNumber)] ?? '';
  } catch {
    return '';
  }
}

function activeLanguage(page: number): UFMGOfficialLanguage {
  if (page >= 14 && page <= 16) return 'espanhol';
  if (page >= 17 && page <= 21) return 'ingles';
  try {
    const stored = JSON.parse(localStorage.getItem('conectae:ufmg-official-language') || '"ingles"');
    return stored === 'espanhol' ? 'espanhol' : 'ingles';
  } catch {
    return 'ingles';
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
    const sourceHeader = leftPanel.firstElementChild;
    if (sourceHeader?.nextSibling) leftPanel.insertBefore(host, sourceHeader.nextSibling);
    else leftPanel.appendChild(host);
  }

  const grid = leftPanel.parentElement as HTMLElement | null;
  const answerPanel = grid ? ([...grid.children].find(child => child !== leftPanel) as HTMLElement | undefined) ?? null : null;
  return {
    host,
    iframe,
    questionNumber,
    page,
    grid,
    leftPanel,
    answerPanel,
    sourceHeader: leftPanel.firstElementChild as HTMLElement | null,
    footer: iframe.nextElementSibling as HTMLElement | null,
  };
}

async function getPdfDocument() {
  if (!pdfPromise) {
    pdfPromise = (async () => {
      const pdfjs: any = await import(/* @vite-ignore */ PDFJS_MODULE);
      pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      const source = `/api/proxy-official-pdf?url=${encodeURIComponent(UFMG_OFFICIAL_2025.examUrl)}`;
      return pdfjs.getDocument({ url: source }).promise;
    })().catch(error => {
      pdfPromise = null;
      throw error;
    });
  }
  return pdfPromise;
}

function OfficialPdfPage({ page }: { page: number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    let renderTask: any = null;
    setLoading(true);
    setError('');

    (async () => {
      const pdf = await getPdfDocument();
      const pdfPage = await pdf.getPage(page);
      if (cancelled) return;
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) return;
      const base = pdfPage.getViewport({ scale: 1 });
      const cssWidth = Math.max(280, Math.min(900, wrap.clientWidth || 720));
      const pixelRatio = Math.min(1.8, window.devicePixelRatio || 1);
      const viewport = pdfPage.getViewport({ scale: (cssWidth / base.width) * pixelRatio });
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) throw new Error('Canvas indisponível');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${Math.floor(viewport.width / pixelRatio)}px`;
      canvas.style.maxWidth = '100%';
      canvas.style.height = 'auto';
      renderTask = pdfPage.render({ canvasContext: context, viewport });
      await renderTask.promise;
      if (!cancelled) setLoading(false);
    })().catch(() => {
      if (!cancelled) {
        setLoading(false);
        setError('Não consegui renderizar esta página aqui.');
      }
    });

    return () => {
      cancelled = true;
      try { renderTask?.cancel?.(); } catch { /* noop */ }
    };
  }, [page]);

  return <div ref={wrapRef} className="relative overflow-hidden rounded-2xl border border-[#31588e] bg-white">
    {loading && <div className="grid min-h-40 place-items-center bg-[#041027] text-sm font-bold text-[#9fb5d4]"><span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin"/>Carregando página {page}…</span></div>}
    {error && <div className="bg-[#041027] p-4 text-sm text-amber-100">{error} <a href={`${UFMG_OFFICIAL_2025.examUrl}#page=${page}`} target="_blank" rel="noreferrer" className="ml-1 font-black text-[#72a5ff]">Abrir a página oficial</a>.</div>}
    <canvas ref={canvasRef} className={loading || error ? 'hidden' : 'mx-auto block'} aria-label={`Página ${page} do Caderno 1 do Seriado UFMG 2025`} />
  </div>;
}

function patchedQuestion(number: number, language: UFMGOfficialLanguage) {
  const base = getUFMGOfficial2025Question(number, language);
  if (!base) return null;
  const patch = QUESTION_PATCHES[number];
  return patch ? { ...base, ...patch } : base;
}

export default function UFMGDirectOfficialEnhancer() {
  const [target, setTarget] = useState<TargetState | null>(null);
  const [chosen, setChosen] = useState('');
  const [showSource, setShowSource] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('courseArea') !== 'ufmg') return;
    let lastKey = '';
    const sync = () => {
      const next = findTarget();
      if (!next) {
        if (lastKey) { lastKey = ''; setTarget(null); }
        return;
      }
      const key = `${next.questionNumber}:${next.page}`;
      if (key === lastKey) return;
      lastKey = key;
      setTarget(next);
      setChosen(readChosen(next.questionNumber));
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['src', 'title'] });
    const timer = window.setInterval(sync, 450);
    return () => { observer.disconnect(); window.clearInterval(timer); };
  }, []);

  const language = target ? activeLanguage(target.page) : 'ingles';
  const question = useMemo(() => target ? patchedQuestion(target.questionNumber, language) : null, [target?.questionNumber, target?.page, language]);

  useEffect(() => {
    if (!target || !question) return;
    setChosen(readChosen(target.questionNumber));
    setShowSource(question.showSourceByDefault);
  }, [target?.questionNumber, target?.page, question?.showSourceByDefault]);

  useEffect(() => {
    if (!target) return;
    const { iframe, grid, answerPanel, sourceHeader, footer } = target;
    const original = {
      iframe: iframe.style.display,
      grid: grid?.style.gridTemplateColumns ?? '',
      answer: answerPanel?.style.display ?? '',
      header: sourceHeader?.style.display ?? '',
      footer: footer?.style.display ?? '',
      panelBg: target.leftPanel.style.background,
    };
    iframe.style.display = 'none';
    if (footer) footer.style.display = 'none';
    if (sourceHeader) sourceHeader.style.display = 'none';
    if (answerPanel) answerPanel.style.display = 'none';
    if (grid) grid.style.gridTemplateColumns = 'minmax(0,1fr)';
    target.leftPanel.style.background = '#06152f';
    return () => {
      iframe.style.display = original.iframe;
      if (footer) footer.style.display = original.footer;
      if (sourceHeader) sourceHeader.style.display = original.header;
      if (answerPanel) answerPanel.style.display = original.answer;
      if (grid) grid.style.gridTemplateColumns = original.grid;
      target.leftPanel.style.background = original.panelBg;
    };
  }, [target]);

  if (!target || !question) return null;

  const correctLetter = UFMG_OFFICIAL_2025.finalKey[target.questionNumber - 1] ?? '';
  const gotRight = Boolean(chosen && chosen === correctLetter);

  const select = (letter: string) => {
    if (chosen) return;
    const original = [...(target.answerPanel?.querySelectorAll<HTMLButtonElement>('button') ?? [])]
      .find(button => button.textContent?.trim() === letter);
    original?.click();
    setChosen(letter);
  };

  const retry = () => {
    const original = [...(target.answerPanel?.querySelectorAll<HTMLButtonElement>('button') ?? [])]
      .find(button => button.textContent?.includes('Refazer questão'));
    original?.click();
    setChosen('');
  };

  const next = () => {
    const original = [...(target.answerPanel?.querySelectorAll<HTMLButtonElement>('button') ?? [])]
      .find(button => button.textContent?.includes('Próxima questão'));
    original?.click();
  };

  return createPortal(
    <div className="bg-[#06152f] p-4 text-white md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/[.08] px-2.5 py-1 text-[10px] font-black uppercase tracking-[.12em] text-emerald-200"><FileCheck2 size={13}/> Prova antiga oficial · UFMG 2025</div>
          <h3 className="mt-3 text-2xl font-black">Questão {String(target.questionNumber).padStart(2, '0')} de 45</h3>
          <div className="mt-1 text-xs font-bold text-[#9fb5d4]">Caderno 1 · {target.questionNumber >= 12 && target.questionNumber <= 14 ? (language === 'ingles' ? 'Inglês' : 'Espanhol') : 'questão oficial'} · fonte Copeve/UFMG</div>
        </div>
        <button onClick={() => setShowSource(value => !value)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#31588e] bg-[#041027] px-3 py-2 text-xs font-black text-[#c4d4ea]">{showSource ? <EyeOff size={14}/> : <Eye size={14}/>} {showSource ? 'Ocultar original' : 'Ver original'}</button>
      </div>

      <div className="mt-6 rounded-2xl border border-[#173765] bg-[#041027] p-4 md:p-5">
        <div className="text-[10px] font-black uppercase tracking-[.13em] text-[#72a5ff]">Enunciado da prova</div>
        <p className="mt-3 whitespace-pre-line text-base font-bold leading-relaxed text-[#edf4ff] md:text-lg">{question.prompt}</p>
      </div>

      {showSource && <div className="mt-4 space-y-3 rounded-2xl border border-[#31588e] bg-[#041027] p-3 md:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><div className="text-[10px] font-black uppercase tracking-[.12em] text-emerald-300">Reprodução do caderno oficial</div><p className="mt-1 text-xs text-[#9fb5d4]">Use a reprodução principalmente quando houver gráfico, imagem, tabela ou texto-base compartilhado.</p></div><a href={`${UFMG_OFFICIAL_2025.examUrl}#page=${question.pages[0]}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-black text-[#72a5ff]">Abrir PDF <ExternalLink size={13}/></a></div>
        {question.pages.map(page => <OfficialPdfPage key={page} page={page}/>)}
      </div>}

      <div className="mt-5 grid gap-3">
        {question.options.map((option, index) => {
          const letter = String.fromCharCode(65 + index);
          const right = Boolean(chosen) && letter === correctLetter;
          const wrong = Boolean(chosen) && letter === chosen && letter !== correctLetter;
          return <button key={letter} disabled={Boolean(chosen)} onClick={() => select(letter)} className={`flex items-start gap-3 rounded-2xl border p-4 text-left text-sm font-bold leading-relaxed transition md:text-base ${right ? 'border-emerald-300/55 bg-emerald-300/10 text-emerald-50' : wrong ? 'border-rose-300/55 bg-rose-300/10 text-rose-50' : 'border-[#31588e] bg-[#041027] text-[#d5e2f3] hover:border-[#72a5ff]'}`}><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#0b2856] text-sm font-black">{letter}</span><span className="pt-1.5">{option}</span></button>;
        })}
      </div>

      {chosen && <div className={`mt-5 rounded-2xl border p-4 ${gotRight ? 'border-emerald-300/25 bg-emerald-300/[.07]' : 'border-rose-300/25 bg-rose-300/[.07]'}`}>
        <div className={`flex items-center gap-2 font-black ${gotRight ? 'text-emerald-300' : 'text-rose-300'}`}>{gotRight ? <CheckCircle2 size={19}/> : <XCircle size={19}/>} {gotRight ? 'Acertou!' : `Errou. Gabarito oficial: ${correctLetter}`}</div>
        <div className="mt-4 flex flex-wrap gap-2"><button onClick={retry} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#31588e] bg-[#041027] px-3 py-2 text-xs font-black"><RotateCcw size={14}/>Refazer questão</button>{target.questionNumber < 45 && <button onClick={next} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#246cff] px-4 py-2 text-xs font-black">Próxima questão <ChevronRight size={14}/></button>}</div>
      </div>}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#173765] pt-4 text-[11px] leading-relaxed text-[#7691b5]"><span>Fonte: Processo Seletivo SERIADO UFMG 2025 · UFMG/Copeve.</span><div className="flex gap-3"><a href={UFMG_OFFICIAL_2025.examUrl} target="_blank" rel="noreferrer" className="font-black text-[#72a5ff]">Caderno 1</a><a href={UFMG_CADERNO_S} target="_blank" rel="noreferrer" className="font-black text-[#72a5ff]">Caderno S</a></div></div>
    </div>,
    target.host,
  );
}
