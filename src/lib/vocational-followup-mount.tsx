import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, GraduationCap, Sparkles } from 'lucide-react';

const COURSE_TO_AREA: Array<[string, string]> = [
  ['Direito', 'humanidades-e-juridico'],
  ['Psicologia', 'saude-e-ciencias-humanas'],
  ['Enfermagem', 'saude'],
  ['Medicina', 'saude'],
  ['Administração', 'negocios-e-gestao'],
  ['Odontologia', 'saude'],
  ['Medicina Veterinária', 'saude-biologicas-e-agro'],
  ['Farmácia', 'saude-e-quimica'],
  ['Biomedicina', 'saude-e-laboratorio'],
  ['Sistemas de Informação', 'tecnologia'],
  ['Engenharia de Software', 'tecnologia'],
  ['Análise e Desenvolvimento de Sistemas', 'tecnologia'],
  ['Arquitetura e Urbanismo', 'design-e-construcao'],
  ['Pedagogia', 'educacao'],
  ['Ciências Contábeis', 'negocios-e-financas'],
  ['Engenharia Civil', 'engenharia'],
  ['Engenharia Mecânica', 'engenharia'],
  ['Educação Física', 'saude-e-esporte'],
  ['Ciência da Computação', 'tecnologia-e-ciencia'],
  ['Publicidade e Propaganda', 'comunicacao-e-marketing'],
  ['Agronomia', 'agro-e-ciencias-da-vida'],
  ['Engenharia de Produção', 'engenharia-e-gestao'],
  ['Ciências Econômicas', 'economia-e-financas'],
  ['Jornalismo', 'comunicacao'],
  ['Design', 'criacao-e-produto'],
  ['Serviço Social', 'ciencias-sociais-aplicadas'],
  ['Relações Internacionais', 'humanidades-politica-e-negocios'],
  ['Engenharia Elétrica', 'engenharia-e-tecnologia'],
  ['Fisioterapia', 'saude'],
  ['Nutrição', 'saude'],
];

function detectTopCourse(): { name: string; areaId: string } | null {
  const bodyText = document.body.innerText;
  const heroStart = bodyText.indexOf('SEU CURSO #1');
  const rankingStart = bodyText.indexOf('Ranking completo');
  const resultStart = heroStart >= 0 ? heroStart : 0;
  const resultText = bodyText.slice(resultStart, rankingStart > resultStart ? rankingStart : undefined);

  let best: { name: string; areaId: string; index: number } | null = null;
  for (const [name, areaId] of COURSE_TO_AREA) {
    const index = resultText.indexOf(name);
    if (index >= 0 && (!best || index < best.index)) best = { name, areaId, index };
  }
  return best ? { name: best.name, areaId: best.areaId } : null;
}

function findResultHero(): HTMLElement | null {
  const marker = Array.from(document.querySelectorAll('span,div')).find((node) => node.textContent?.trim() === 'SEU CURSO #1');
  return marker?.closest('section') as HTMLElement | null;
}

function findDimensionsCard(): HTMLElement | null {
  const heading = Array.from(document.querySelectorAll('h2')).find((node) => node.textContent?.includes('Dimensões que mais pesaram'));
  return heading?.closest('section') as HTMLElement | null;
}

function applyRelativeDimensionDisplay() {
  const card = findDimensionsCard();
  if (!card || card.dataset.relativeProfileApplied === 'true') return;

  const percentageNodes = Array.from(card.querySelectorAll('span')).filter((node) => /^\d{1,3}%$/.test(node.textContent?.trim() ?? ''));
  if (percentageNodes.length < 2) return;

  const raw = percentageNodes.map((node) => Number((node.textContent ?? '').replace('%', '')));
  const min = Math.min(...raw);
  const max = Math.max(...raw);
  const spread = Math.max(1, max - min);

  const ranked = raw
    .map((value, index) => ({ value, index }))
    .sort((a, b) => b.value - a.value || a.index - b.index);
  const rankByIndex = new Map(ranked.map((item, rank) => [item.index, rank]));

  percentageNodes.forEach((node, index) => {
    const value = raw[index];
    const rank = rankByIndex.get(index) ?? index;
    const rangeComponent = 60 + ((value - min) / spread) * 32;
    const display = Math.max(50, Math.min(94, Math.round(rangeComponent - rank * 1.7)));

    node.textContent = `${display}%`;
    const row = node.parentElement?.parentElement;
    const barFill = row?.querySelector<HTMLElement>('[style*="width"]');
    if (barFill) barFill.style.width = `${display}%`;
  });

  const label = card.querySelector('p');
  if (label && label.textContent?.trim().toLowerCase() === 'seu perfil') label.textContent = 'Seu perfil relativo';

  const heading = Array.from(card.querySelectorAll('h2')).find((node) => node.textContent?.includes('Dimensões que mais pesaram'));
  if (heading && !card.querySelector('[data-relative-note="true"]')) {
    const note = document.createElement('p');
    note.dataset.relativeNote = 'true';
    note.className = 'text-xs text-ink-500 mt-2 leading-relaxed';
    note.textContent = 'Os percentuais mostram a força relativa de cada dimensão dentro do seu perfil, evitando empates artificiais em 100%.';
    heading.parentElement?.appendChild(note);
  }

  card.dataset.relativeProfileApplied = 'true';
}

export default function VocationalFollowupMount() {
  const [visible, setVisible] = useState(false);
  const [topCourse, setTopCourse] = useState<{ name: string; areaId: string } | null>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const detectResults = () => {
      const text = document.body.innerText;
      const showingResults = text.includes('Próximo passo recomendado') && text.includes('Ranking completo') && text.includes('SEU CURSO #1');
      setVisible(showingResults);
      setTopCourse(showingResults ? detectTopCourse() : null);

      if (showingResults) {
        applyRelativeDimensionDisplay();
        const hero = findResultHero();
        if (hero) {
          let target = document.getElementById('vocational-college-match-anchor');
          if (!target) {
            target = document.createElement('div');
            target.id = 'vocational-college-match-anchor';
            hero.insertAdjacentElement('afterend', target);
          }
          setAnchor(target);
        }
      } else {
        setAnchor(null);
      }
    };

    detectResults();
    const observer = new MutationObserver(detectResults);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  const ctaCopy = useMemo(() => {
    if (!topCourse) {
      return {
        title: 'Agora descubra qual faculdade combina mais com você',
        description: 'Continue para o questionário de faculdades e compare instituições pelo seu perfil acadêmico, ambiente, objetivos e preferências.',
        button: 'Encontrar minha faculdade',
      };
    }
    return {
      title: `Agora descubra qual faculdade combina mais com você em ${topCourse.name}`,
      description: 'Seu curso já está definido. Responda ao questionário específico da área e compare as faculdades mais alinhadas ao seu perfil, metodologia, ambiente e objetivos.',
      button: `Ver faculdades de ${topCourse.name}`,
    };
  }, [topCourse]);

  if (!visible || !anchor) return null;

  const continueToCollegeMatch = () => {
    window.dispatchEvent(new CustomEvent('conectae:close-vocational'));
    window.dispatchEvent(new CustomEvent('conectae:open-area-match', {
      detail: topCourse ? { areaId: topCourse.areaId } : undefined,
    }));
  };

  return createPortal(
    <section className="max-w-7xl mx-auto px-5 md:px-8 mt-5 mb-8">
      <div className="relative overflow-hidden rounded-[28px] border border-cyan-300/25 bg-gradient-to-r from-cyan-400/10 via-brand-500/10 to-violet-500/10 p-6 md:p-8 shadow-xl shadow-cyan-950/10">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-300/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-300 to-brand-400 text-[#06131c] flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-950/20"><GraduationCap className="w-6 h-6" /></div>
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[.14em] text-cyan-200 mb-2"><Sparkles className="w-3.5 h-3.5" /> Seu próximo passo</div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-ink-50 mb-2">{ctaCopy.title}</h2>
            <p className="text-sm md:text-base text-ink-300 leading-relaxed max-w-3xl">{ctaCopy.description}</p>
          </div>
          <button onClick={continueToCollegeMatch} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 hover:brightness-110 text-[#06131c] font-black px-6 py-4 whitespace-nowrap shadow-lg shadow-cyan-950/20 transition-all hover:scale-[1.01] active:scale-95">{ctaCopy.button} <ArrowRight className="w-5 h-5" /></button>
        </div>
      </div>
    </section>,
    anchor
  );
}
