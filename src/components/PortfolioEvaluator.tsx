import { useEffect, useRef, useState } from 'react';
import { FileText, Loader2, Plus, Trash2 } from 'lucide-react';
import Auth from '@/components/Auth';
import { useAuth } from '@/lib/auth-context';
import { ensureFreshSession } from '@/lib/supabase';
import { PORTFOLIO_CATEGORIES, PORTFOLIO_CRITERIA, PORTFOLIO_SOURCES, cleanPortfolio, portfolioInterviewContext, type PortfolioActivity, type PortfolioInput, type PortfolioReport } from '@/lib/link-portfolio';

const blank = (): PortfolioActivity => ({ title: '', category: PORTFOLIO_CATEGORIES[0], period: '', role: '', actions: '', challenge: '', results: '', learning: '', evidence: '' });
const fieldClass = 'mt-2 w-full rounded-xl border border-[#234576] bg-white p-3 text-base outline-none';
const cardClass = 'rounded-2xl border border-[#234576] bg-white p-5 md:p-7';
const fields: { key: keyof PortfolioActivity; label: string; hint: string; max: number }[] = [
  { key: 'period', label: 'Período e dedicação', hint: 'Quando começou, duração, frequência e horas aproximadas. Indique se está em andamento.', max: 240 },
  { key: 'role', label: 'Seu papel e a ajuda que recebeu', hint: 'O que era sua responsabilidade? Quem orientou ou participou? Diferencie sua atuação da equipe.', max: 800 },
  { key: 'actions', label: 'O que você fez, concretamente *', hint: 'Descreva decisões, tarefas e entregas. Mínimo de 30 caracteres.', max: 1600 },
  { key: 'challenge', label: 'O que tornou isso difícil?', hint: 'Problema técnico, disciplina, negociação, incerteza, recursos limitados. O que você precisou aprender?', max: 1600 },
  { key: 'results', label: 'Resultados e limites', hint: 'O que mudou? Informe período e origem das métricas. Resultado qualitativo ou tentativa que falhou também vale.', max: 1600 },
  { key: 'learning', label: 'Aprendizado e evolução', hint: 'Qual erro, feedback ou teste mudou sua maneira de agir? O que faria diferente?', max: 1600 },
  { key: 'evidence', label: 'Evidências disponíveis', hint: 'Descreva registros, entregas ou comprovantes. Links são apenas referências; a IA não os acessa.', max: 1600 },
];

export default function PortfolioEvaluator({ onUseInInterview }: { onUseInInterview: (context: string) => void }) {
  const { user } = useAuth();
  const [input, setInput] = useState<PortfolioInput>({ activities: [blank()], context: '', academic: '', documentText: '', documentName: '', motivation: '' });
  const [report, setReport] = useState<PortfolioReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState('');
  const [showAuth, setShowAuth] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  useEffect(() => () => abort.current?.abort(), []);
  function change(next: Partial<PortfolioInput>) { setInput(v => ({ ...v, ...next })); setReport(null); setError(''); }
  function activity(index: number, key: keyof PortfolioActivity, value: string) {
    change({ activities: input.activities.map((a, i) => i === index ? { ...a, [key]: value } : a) });
  }
  async function readDocument(file?: File) {
    if (!file) return;
    setReading(true); setError(''); setReport(null);
    try {
      if (file.size > 8 * 1024 * 1024) throw new Error('Use um arquivo de até 8 MB.');
      let extracted = '';
      if (/\.pdf$/i.test(file.name)) {
        const pdfjs = await import('pdfjs-dist/build/pdf.mjs');
        const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
        pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
        const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false });
        try {
          const doc = await task.promise;
          if (doc.numPages > 30) throw new Error('Use um PDF de até 30 páginas.');
          for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const content = await page.getTextContent();
            extracted += `\n[Página ${i}]\n` + content.items.map((item: any) => typeof item.str === 'string' ? item.str : '').join(' ');
          }
          if (extracted.replace(/\[Página \d+\]/g, '').trim().length < 40) throw new Error('Este PDF não tem texto legível. Cole a transcrição dos comprovantes no campo abaixo. Imagens não são analisadas.');
        } finally { await task.destroy(); }
      } else if (/\.txt$/i.test(file.name)) extracted = await file.text();
      else throw new Error('Use PDF com texto selecionável ou arquivo TXT.');
      if (extracted.length > 30000) throw new Error('O documento excede 30 mil caracteres. Separe os trechos relevantes em um arquivo menor.');
      change({ documentText: extracted.trim(), documentName: file.name });
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível ler o arquivo.'); }
    finally { setReading(false); }
  }
  async function evaluate() {
    if (!user) { setShowAuth(true); return; }
    setError(''); setReport(null);
    let data: PortfolioInput;
    try { data = cleanPortfolio(input); }
    catch (err) { setError(err instanceof Error ? err.message : 'Confira os campos.'); return; }
    setBusy(true);
    const controller = new AbortController(); abort.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 210000);
    try {
      const session = await ensureFreshSession();
      if (!session?.access_token) { setShowAuth(true); throw new Error('Entre novamente. Seu formulário foi mantido.'); }
      const response = await fetch('/api/interview-coach', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token }, body: JSON.stringify({ phase: 'portfolio', institution: 'link', portfolio: data }), signal: controller.signal });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.report) { if (response.status === 401) setShowAuth(true); throw new Error(result?.error || 'Não foi possível concluir a análise. Tente novamente.'); }
      setReport(result.report);
      window.setTimeout(() => reportRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (err) { setError(controller.signal.aborted ? 'Análise interrompida. Seus dados continuam no formulário para tentar novamente.' : err instanceof Error ? err.message : 'Falha ao avaliar. Tente novamente.'); }
    finally { window.clearTimeout(timeout); abort.current = null; setBusy(false); }
  }
  function handoff() {
    const context = portfolioInterviewContext(input);
    if (context.length > 7000) { setError('Para usar na entrevista, resuma as experiências até que o conjunto tenha no máximo 7 mil caracteres. A avaliação completa permanece aqui.'); return; }
    onUseInInterview(context);
  }
  return <section className="mx-auto max-w-6xl space-y-6" aria-label="Avaliador de portfólio Link">
    <div><div className="text-sm font-bold text-[#245be5]">LINK · PREPARAÇÃO 2027.1</div><h1 className="mt-2 text-3xl font-black md:text-4xl">O que sua trajetória demonstra?</h1><p className="mt-3 max-w-3xl text-base leading-relaxed">Receba uma análise das experiências, da dificuldade real e das evidências do seu portfólio, com perguntas de aprofundamento e próximos passos.</p></div>
    <details className={cardClass}>
      <summary className="cursor-pointer font-bold">O que a Link cobra e como avaliamos</summary>
      <p className="mt-4">O portfólio vale 10 pontos na Jornada 2027.1. O manual publica quatro critérios: {PORTFOLIO_CRITERIA.join(', ').toLowerCase()}. Ele também orienta a entrevista.</p>
      <p className="mt-3">A Link não publica pesos internos nem uma tabela de pontos por atividade. Nossa escala de 0 a 4 mede preparação; a média, quando todos os critérios são avaliáveis, vira um índice de 0 a 100. Os pesos iguais são do Conectaê. Não é nota oficial nem chance de aprovação.</p>
      <p className="mt-3">Dificuldade, autonomia, continuidade, impacto e aprendizado são análises complementares. Uma ação local bem executada pode ser exigente; título de cargo, curso caro, quantidade de certificados e viagem não recebem bônus. Sem evidência suficiente, o resultado é “não avaliável”.</p>
      <p className="mt-3">Não é necessário ter todas as categorias. Exames como SAT e IB são opcionais, sem pontuação adicional separada. Confira no manual o histórico escolar correspondente à sua etapa de estudos.</p>
      <p className="mt-3 text-sm">Pesquisa consultada em 27/09/2026 · Graduação no Brasil.</p>
      <ul className="mt-3 space-y-2">{PORTFOLIO_SOURCES.map(s => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer" className="underline">{s.title}</a></li>)}</ul>
    </details>
    {showAuth && <div className={cardClass}><p className="mb-4">Entre para avaliar. Seu formulário continua nesta página.</p><Auth compact onBack={() => setShowAuth(false)} onSuccess={() => { setShowAuth(false); setError(''); }} onPrivacy={() => window.open('/privacidade')} onTerms={() => window.open('/termos')} /></div>}
    <form onSubmit={event => { event.preventDefault(); void evaluate(); }}>
      <fieldset disabled={busy || reading} className="space-y-6">
        <div className={cardClass}><h2 className="text-xl font-black">1. Suas experiências</h2><p className="mt-2">Escolha até 8 para analisar por vez. Esse limite é do treino, não da Link. Descreva o que aconteceu, mesmo que o resultado tenha sido diferente do planejado.</p></div>
        {input.activities.map((a, index) => <article className={cardClass} key={index}>
          <div className="flex items-center justify-between gap-3"><h3 className="text-lg font-bold">Experiência {index + 1}</h3>{input.activities.length > 1 && <button type="button" onClick={() => change({ activities: input.activities.filter((_, i) => i !== index) })} className="flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm" aria-label={`Remover experiência ${index + 1}`}><Trash2 size={16} />Remover</button>}</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2"><label className="block font-bold" htmlFor={`activity-${index}-title`}>Título *<input id={`activity-${index}-title`} required maxLength={160} value={a.title} onChange={e => activity(index, 'title', e.target.value)} className={fieldClass} placeholder="Ex.: organizei uma feira de trocas na escola" /></label><label className="block font-bold" htmlFor={`activity-${index}-category`}>Tipo<select id={`activity-${index}-category`} value={a.category} onChange={e => activity(index, 'category', e.target.value)} className={fieldClass}>{PORTFOLIO_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label></div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">{fields.map(f => <label className="block" key={f.key} htmlFor={`activity-${index}-${f.key}`}><span className="font-bold">{f.label}</span><textarea id={`activity-${index}-${f.key}`} rows={3} required={f.key === 'actions'} minLength={f.key === 'actions' ? 30 : undefined} maxLength={f.max} value={a[f.key]} onChange={e => activity(index, f.key, e.target.value)} className={fieldClass} placeholder={f.hint} /></label>)}</div>
        </article>)}
        {input.activities.length < 8 && <button type="button" onClick={() => change({ activities: [...input.activities, blank()] })} className="inline-flex min-h-12 items-center gap-2 rounded-xl border px-5 font-bold"><Plus size={18} />Adicionar experiência</button>}
        <div className={cardClass}><h2 className="text-xl font-black">2. Contexto e documentos</h2><p className="mt-2">Campos opcionais. Inclua apenas dados necessários e remova CPF, endereço e informações de terceiros. Nada é enviado à Link. O texto será enviado à IA somente ao avaliar.</p>
          <label htmlFor="portfolio-context" className="mt-5 block font-bold">Condições em que você realizou as atividades<textarea id="portfolio-context" className={fieldClass} rows={3} maxLength={3000} value={input.context} onChange={e => change({ context: e.target.value })} placeholder="Tempo disponível, responsabilidades, recursos e ajuda recebida. Não precisa informar renda ou dados sensíveis." /></label>
          <label htmlFor="portfolio-academic" className="mt-4 block font-bold">Etapa escolar e documentação disponível<textarea id="portfolio-academic" className={fieldClass} rows={2} maxLength={3000} value={input.academic} onChange={e => change({ academic: e.target.value })} placeholder="Ex.: curso o 3º ano e tenho histórico do 2º. Certificações e exames, se desejar, com escala e ano." /></label>
          <label htmlFor="portfolio-motivation" className="mt-4 block font-bold">O que você quer desenvolver na Link?<textarea id="portfolio-motivation" className={fieldClass} rows={2} maxLength={2000} value={input.motivation} onChange={e => change({ motivation: e.target.value })} placeholder="Opcional: ajuda a preparar perguntas para a entrevista." /></label>
          <label htmlFor="portfolio-file" className="mt-5 block font-bold">Importar comprovantes ou portfólio em PDF/TXT<input id="portfolio-file" type="file" accept=".pdf,.txt" className="mt-2 block w-full text-base" onChange={e => { void readDocument(e.target.files?.[0]); e.target.value = ''; }} /></label>
          <p className="mt-2 text-sm">Até 8 MB, 30 páginas e 30 mil caracteres. Apenas texto é lido; fotos e layout não são avaliados. Importar substitui o texto abaixo. Você pode revisá-lo antes do envio.</p>
          {input.documentName && <p className="mt-2 text-sm">Arquivo lido: {input.documentName}</p>}
          <label htmlFor="portfolio-documents" className="mt-4 block font-bold">Conteúdo textual dos documentos<textarea id="portfolio-documents" className={fieldClass} rows={6} maxLength={30000} value={input.documentText} onChange={e => change({ documentText: e.target.value, documentName: '' })} placeholder="Cole trechos relevantes com identificação do documento, data e experiência correspondente. A IA compara o texto, mas não autentica documentos." /></label>
          <p className="mt-2 text-sm">{input.documentText.length.toLocaleString('pt-BR')} / 30.000 caracteres. Sem conteúdo documental, a consistência fica não avaliável.</p>
        </div>
        <button type="submit" className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl bg-[#246cff] px-6 font-bold" disabled={busy || reading}>{busy || reading ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}{reading ? 'Lendo documento…' : busy ? 'Avaliando experiências e evidências…' : user ? 'Avaliar meu portfólio' : 'Entrar e avaliar meu portfólio'}</button>
      </fieldset>
    </form>
    {busy && <div role="status"><p>A análise pode levar até 3 minutos. Mantenha esta página aberta.</p><button type="button" className="mt-2 min-h-11 underline" onClick={() => abort.current?.abort()}>Cancelar análise</button></div>}
    {error && <p role="alert" className="rounded-xl border p-4">{error}</p>}
    <div ref={reportRef} className="scroll-mt-24" aria-live="polite">{report && <div className="space-y-5">
      <section className={cardClass}><h2 className="text-2xl font-black">Avaliação do portfólio</h2><p className="mt-3 leading-relaxed">{report.summary}</p><p className="mt-4 font-bold">{report.readiness === null ? 'Índice geral não calculado: há critérios não avaliáveis.' : `Índice preparatório Conectaê: ${report.readiness}/100`}</p><p className="mt-2 text-sm">Escala interna, sem equivalência à nota da Link ou à probabilidade de aprovação.</p><p className="mt-3">{report.confidence}</p></section>
      <div className="grid gap-4 md:grid-cols-2">{report.criteria.map(c => <article key={c.name} className={cardClass}><h3 className="text-lg font-bold">{c.name} · {c.level === null ? 'Não avaliável' : `${c.level}/4`}</h3>{c.excerpt && <blockquote className="mt-3 border-l-4 pl-3 text-sm">“{c.excerpt}”</blockquote>}<p className="mt-3">{c.reasoning}</p><p className="mt-3"><strong>Próximo passo:</strong> {c.nextStep}</p></article>)}</div>
      <section className={cardClass}><h2 className="text-xl font-black">Exigência e contribuição real</h2><p className="mt-2 text-sm">Análise complementar do Conectaê. Dificuldade não equivale a pontos oficiais.</p><div className="mt-5 space-y-6">{report.activities.map(a => <article key={a.index} className="border-t pt-5"><h3 className="text-lg font-bold">{a.title}</h3>{[['Dificuldade', a.difficulty], ['Sua contribuição', a.contribution], ['Impacto', a.impact], ['O que comprovar', a.evidenceGap], ['Pergunta difícil', a.question]].map(([label, value]) => <p key={label} className="mt-3"><strong>{label}:</strong> {value}</p>)}</article>)}</div></section>
      <div className="grid gap-4 md:grid-cols-2">{[['Pontos fortes', report.strengths], ['Lacunas prioritárias', report.gaps]] .map(([title, values]) => <section key={title as string} className={cardClass}><h2 className="text-xl font-bold">{title as string}</h2><ul className="mt-4 list-disc space-y-3 pl-5">{(values as string[]).map((v, i) => <li key={i}>{v}</li>)}</ul></section>)}</div>
      <section className={cardClass}><h2 className="text-xl font-black">Como fortalecer seu portfólio</h2><div className="mt-4 space-y-5">{report.suggestions.map((s, i) => <article key={i} className="border-t pt-4"><h3 className="font-bold">{s.title}</h3><p className="mt-2">{s.why}</p><p className="mt-2"><strong>Como fazer:</strong> {s.steps}</p><p className="mt-2"><strong>O que registrar:</strong> {s.evidence}</p><p className="mt-2"><strong>Esforço estimado:</strong> {s.effort}</p></article>)}</div></section>
      <section className={cardClass}><h2 className="text-xl font-black">Prepare-se para defender sua trajetória</h2><ol className="mt-4 list-decimal space-y-3 pl-5">{report.questions.map((q, i) => <li key={i}>{q}</li>)}</ol><button type="button" onClick={handoff} className="mt-5 min-h-12 rounded-xl bg-[#246cff] px-5 font-bold">Usar estas experiências na entrevista</button><p className="mt-3 text-sm">Transfere seu relato, sem transformar a avaliação em fatos. Revise o contexto antes de iniciar. Versão {report.version}.</p></section>
    </div>}</div>
  </section>;
}
