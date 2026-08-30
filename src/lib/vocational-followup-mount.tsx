import { useEffect, useState } from 'react';
import { ArrowRight, GraduationCap, Sparkles } from 'lucide-react';

const COURSE_TO_AREA: Array<[string, string]> = [
  ['Direito', 'humanidades-e-juridico'],
  ['Psicologia', 'saude-e-ciencias-humanas'],
  ['Enfermagem', 'enfermagem'],
  ['Medicina', 'saude'],
  ['Administração', 'negocios-e-gestao'],
  ['Odontologia', 'odontologia'],
  ['Medicina Veterinária', 'saude-biologicas-e-agro'],
  ['Farmácia', 'saude-e-quimica'],
  ['Biomedicina', 'saude-e-laboratorio'],
  ['Sistemas de Informação', 'tecnologia'],
  ['Engenharia de Software', 'engenharia-de-software'],
  ['Análise e Desenvolvimento de Sistemas', 'ads'],
  ['Arquitetura e Urbanismo', 'design-e-construcao'],
  ['Pedagogia', 'educacao'],
  ['Ciências Contábeis', 'negocios-e-financas'],
  ['Engenharia Civil', 'engenharia'],
  ['Engenharia Mecânica', 'engenharia-mecanica'],
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
  ['Fisioterapia', 'fisioterapia'],
  ['Nutrição', 'nutricao'],
];

function detectTopCourse(): { name: string; areaId: string } | null {
  const bodyText = document.body.innerText;
  const resultStart = Math.max(0, bodyText.indexOf('Seu resultado'));
  const rankingStart = bodyText.indexOf('Ranking completo');
  const resultText = bodyText.slice(resultStart, rankingStart > resultStart ? rankingStart : undefined);

  let best: { name: string; areaId: string; index: number } | null = null;
  for (const [name, areaId] of COURSE_TO_AREA) {
    const index = resultText.indexOf(name);
    if (index >= 0 && (!best || index < best.index)) best = { name, areaId, index };
  }
  return best ? { name: best.name, areaId: best.areaId } : null;
}

export default function VocationalFollowupMount() {
  const [visible, setVisible] = useState(false);
  const [topCourse, setTopCourse] = useState<{ name: string; areaId: string } | null>(null);

  useEffect(() => {
    const detectResults = () => {
      const text = document.body.innerText;
      const showingResults = text.includes('Próximo passo recomendado') && text.includes('Ranking completo');
      setVisible(showingResults);
      setTopCourse(showingResults ? detectTopCourse() : null);
    };
    detectResults();
    const observer = new MutationObserver(detectResults);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  const continueToCollegeMatch = () => {
    window.dispatchEvent(new CustomEvent('conectae:close-vocational'));
    window.dispatchEvent(new CustomEvent('conectae:open-area-match', {
      detail: topCourse ? { areaId: topCourse.areaId } : undefined,
    }));
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[130] md:left-1/2 md:right-auto md:-translate-x-1/2 md:w-[760px]">
      <div className="rounded-[24px] border border-cyan-300/30 bg-[#091321]/95 backdrop-blur-2xl shadow-2xl shadow-cyan-950/30 p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-300 to-brand-500 text-[#06131c] flex items-center justify-center flex-shrink-0 shadow-lg shadow-cyan-950/20"><GraduationCap className="w-6 h-6" /></div>
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[.14em] text-cyan-200 mb-1"><Sparkles className="w-3.5 h-3.5"/> Próximo passo</div>
          <p className="text-base font-black text-ink-50">
            {topCourse ? `Agora encontre a melhor faculdade para ${topCourse.name}` : 'Agora descubra a melhor faculdade para seu curso'}
          </p>
          <p className="text-xs text-ink-400 mt-1 leading-relaxed">
            {topCourse
              ? `Vamos abrir diretamente o questionário de ${topCourse.name} e comparar as 12 opções pelo seu perfil acadêmico, ambiente e objetivos.`
              : 'Continue para o questionário de faculdades e descubra quais instituições têm maior compatibilidade com você.'}
          </p>
        </div>
        <button onClick={continueToCollegeMatch} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 hover:brightness-110 text-[#06131c] font-black px-5 py-3 whitespace-nowrap shadow-lg shadow-cyan-950/20">
          {topCourse ? `Ver faculdades de ${topCourse.name}` : 'Encontrar minha faculdade'} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
