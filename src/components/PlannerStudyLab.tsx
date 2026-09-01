import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  BrainCircuit,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  FileText,
  ImagePlus,
  PlayCircle,
  Trash2,
  Upload,
  X,
  XCircle,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import './planner-study-lab.css';

type ExamId = 'enem' | 'fuvest' | 'insper' | 'link' | 'cmmg';
type ErrorReason = 'conteudo' | 'interpretacao' | 'tempo' | 'calculo' | 'distracao' | 'estrategia' | 'outro';

type Question = {
  id: number;
  exam_id: ExamId;
  area: string;
  skill_name: string;
  difficulty: number;
  prompt: string;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  option_e: string | null;
  correct_option: string | null;
  explanation: string | null;
};

type Skill = {
  id: number;
  exam_id: ExamId;
  area: string;
  skill_code: string;
  skill_name: string;
  importance: number;
  diagnostic_tags: string[];
};

type Attempt = {
  exam_id: ExamId;
  area: string;
  skill_name: string | null;
  correct: boolean | null;
  created_at: string;
};

type Diagnosis = {
  area: string;
  skillName: string;
  confidence: number;
  accuracy: number | null;
  attempts: number;
  errorReason: string;
  evidence: string[];
  plan: string[];
};

const ERROR_REASONS: { id: ErrorReason; label: string; hint: string }[] = [
  { id: 'conteudo', label: 'Não sabia o conteúdo', hint: 'Faltou conceito, fórmula, regra ou repertório.' },
  { id: 'interpretacao', label: 'Interpretei errado', hint: 'O comando ou o texto foi entendido de forma incorreta.' },
  { id: 'tempo', label: 'Faltou tempo', hint: 'Eu sabia fazer, mas demorei demais ou pulei.' },
  { id: 'calculo', label: 'Errei cálculo/procedimento', hint: 'A ideia estava certa, mas a execução falhou.' },
  { id: 'distracao', label: 'Foi distração', hint: 'Troquei sinal, dado, unidade ou alternativa.' },
  { id: 'estrategia', label: 'Não sabia como começar', hint: 'Conhecia partes, mas não encontrei o caminho.' },
  { id: 'outro', label: 'Outro motivo', hint: 'Explique com suas palavras.' },
];

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function errorLabel(reason: ErrorReason | '') {
  return ERROR_REASONS.find((item) => item.id === reason)?.label ?? 'motivo não informado';
}

function overlapScore(text: string, skill: Skill) {
  const haystack = normalize(text);
  const tokens = [skill.area, skill.skill_name, ...(skill.diagnostic_tags ?? [])]
    .flatMap((value) => normalize(value).split(/[^a-z0-9]+/))
    .filter((value) => value.length > 3);
  return tokens.reduce((sum, token) => sum + (haystack.includes(token) ? 1 : 0), 0)
    + (haystack.includes(normalize(skill.skill_name)) ? 3 : 0)
    + (haystack.includes(normalize(skill.area)) ? 2 : 0);
}

function recoveryPlan(area: string, skill: string, reason: ErrorReason, accuracy: number | null) {
  const base = accuracy == null ? 'sem histórico suficiente' : `${Math.round(accuracy * 100)}% de acerto recente`;
  const firstStep: Record<ErrorReason, string> = {
    conteudo: 'revise o conceito por 20–30 min e produza 5 perguntas de recuperação sem consultar o material',
    interpretacao: 'reescreva o comando da questão em uma frase e destaque dados, restrições e palavras-chave',
    tempo: 'faça um bloco curto com limite de tempo por questão e defina quando pular sem insistir demais',
    calculo: 'refaça o procedimento em etapas e cheque sinal, unidade e ordem de grandeza no final',
    distracao: 'use um checklist de 10 segundos antes de marcar a alternativa',
    estrategia: 'classifique o problema em “o que tenho, o que quero e qual ferramenta conecta os dois”',
    outro: 'descreva em uma frase o que aconteceu e transforme isso em uma regra para a próxima tentativa',
  };

  return [
    `Dia 1 · trate a causa do erro: ${firstStep[reason]}.`,
    `Dia 2 · faça 8 questões fáceis/médias de ${skill || area}, sem consulta.`,
    'Dia 3 · refaça os erros sem olhar a resolução e explique o raciocínio em voz alta.',
    `Dia 5 · resolva 12 questões variadas de ${area}, misturando dificuldade 2–4/5.`,
    `Dia 7 · faça um mini-simulado cronometrado e compare com ${base}.`,
  ];
}

export default function PlannerStudyLab() {
  const [mount, setMount] = useState<HTMLElement | null>(null);
  const [examId, setExamId] = useState<ExamId>('enem');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  const [subject, setSubject] = useState('Todas');
  const [difficulty, setDifficulty] = useState('Todas');
  const [page, setPage] = useState(1);

  const [active, setActive] = useState<Question | null>(null);
  const [selected, setSelected] = useState('');
  const [result, setResult] = useState<boolean | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [lastAttemptId, setLastAttemptId] = useState<string | null>(null);
  const [questionErrorReason, setQuestionErrorReason] = useState<ErrorReason | ''>('');
  const [questionErrorSaved, setQuestionErrorSaved] = useState(false);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerText, setScannerText] = useState('');
  const [scannerFile, setScannerFile] = useState<File | null>(null);
  const [scannerPreview, setScannerPreview] = useState('');
  const [scannerSavedPath, setScannerSavedPath] = useState('');
  const [scannerArea, setScannerArea] = useState('Automático');
  const [scannerReason, setScannerReason] = useState<ErrorReason | ''>('');
  const [scannerDetail, setScannerDetail] = useState('');
  const [scannerError, setScannerError] = useState('');
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);

  useEffect(() => {
    const findPlanner = () => {
      const labels = Array.from(document.querySelectorAll('.plan6-sectionlabel')) as HTMLElement[];
      const label = labels.find((node) => normalize(node.textContent ?? '').includes('banco de questoes'));
      const section = label?.closest('section') as HTMLElement | null;
      if (section) {
        const oldFilters = section.querySelector('.plan6-qfilters') as HTMLElement | null;
        const oldGrid = section.querySelector('.plan6-qgrid') as HTMLElement | null;
        if (oldFilters) oldFilters.style.display = 'none';
        if (oldGrid) oldGrid.style.display = 'none';
        setMount(section);
      }

      const text = document.body.innerText;
      if (text.includes('Ciências Médicas-MG')) setExamId('cmmg');
      else if (text.includes('FUVEST')) setExamId('fuvest');
      else if (text.includes('Insper')) setExamId('insper');
      else if (text.includes('Link Journey')) setExamId('link');
      else setExamId('enem');
    };

    findPlanner();
    const observer = new MutationObserver(findPlanner);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!supabase) return;
      const [{ data: q }, { data: s }, { data: userData }] = await Promise.all([
        supabase.from('exam_practice_questions').select('*').eq('active', true),
        supabase.from('exam_skill_taxonomy').select('*').order('importance', { ascending: false }),
        supabase.auth.getUser(),
      ]);
      if (!alive) return;
      setQuestions((q ?? []) as Question[]);
      setSkills((s ?? []) as Skill[]);

      if (userData.user) {
        const { data: a } = await supabase
          .from('student_practice_attempts')
          .select('exam_id,area,skill_name,correct,created_at')
          .eq('user_id', userData.user.id)
          .order('created_at', { ascending: false })
          .limit(500);
        if (alive) setAttempts((a ?? []) as Attempt[]);
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    setPage(1);
    setSubject('Todas');
    setDifficulty('Todas');
  }, [examId]);

  useEffect(() => setPage(1), [subject, difficulty]);

  useEffect(() => {
    return () => {
      if (scannerPreview) URL.revokeObjectURL(scannerPreview);
    };
  }, [scannerPreview]);

  const examQuestions = useMemo(() => questions.filter((q) => q.exam_id === examId), [questions, examId]);
  const subjects = useMemo(
    () => ['Todas', ...Array.from(new Set(examQuestions.map((q) => q.area))).sort((a, b) => a.localeCompare(b, 'pt-BR'))],
    [examQuestions],
  );
  const filtered = useMemo(
    () => examQuestions.filter((q) => (subject === 'Todas' || q.area === subject) && (difficulty === 'Todas' || String(q.difficulty) === difficulty)),
    [examQuestions, subject, difficulty],
  );

  const pageSize = 24;
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize);

  const areaStats = useMemo(() => subjects.filter((item) => item !== 'Todas').map((area) => {
    const rows = attempts.filter((a) => a.exam_id === examId && normalize(a.area) === normalize(area) && a.correct !== null);
    return {
      area,
      total: examQuestions.filter((q) => q.area === area).length,
      accuracy: rows.length ? rows.filter((a) => a.correct).length / rows.length : null,
    };
  }), [subjects, attempts, examId, examQuestions]);

  const openQuestion = (question: Question) => {
    setActive(question);
    setSelected('');
    setResult(null);
    setStartedAt(Date.now());
    setLastAttemptId(null);
    setQuestionErrorReason('');
    setQuestionErrorSaved(false);
  };

  const answer = async () => {
    if (!active || !selected) return;
    const correct = selected === active.correct_option;
    setResult(correct);
    if (!supabase) return;

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const duration = startedAt ? Math.max(1, Math.round((Date.now() - startedAt) / 1000)) : null;
    const { data: inserted } = await supabase
      .from('student_practice_attempts')
      .insert({
        user_id: userData.user.id,
        exam_id: active.exam_id,
        question_id: active.id,
        area: active.area,
        skill_name: active.skill_name,
        selected_option: selected,
        correct,
        duration_seconds: duration,
      })
      .select('id')
      .maybeSingle();

    setLastAttemptId(inserted?.id ?? null);
    setAttempts((current) => [{ exam_id: active.exam_id, area: active.area, skill_name: active.skill_name, correct, created_at: new Date().toISOString() }, ...current]);
  };

  const saveQuestionError = async (reason: ErrorReason) => {
    setQuestionErrorReason(reason);
    setQuestionErrorSaved(false);
    if (!supabase || !lastAttemptId) return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { error } = await supabase
      .from('student_practice_attempts')
      .update({ error_type: reason })
      .eq('id', lastAttemptId)
      .eq('user_id', userData.user.id);
    if (!error) setQuestionErrorSaved(true);
  };

  const nextQuestion = () => {
    const pool = filtered.filter((q) => q.id !== active?.id);
    if (!pool.length) {
      setActive(null);
      return;
    }
    openQuestion(pool[Math.floor(Math.random() * pool.length)]);
  };

  const clearScannerFile = () => {
    if (scannerPreview) URL.revokeObjectURL(scannerPreview);
    setScannerFile(null);
    setScannerPreview('');
    setScannerSavedPath('');
    setScannerError('');
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setDiagnosis(null);
    setScannerError('');

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setScannerError('Use uma foto JPG, PNG ou WebP.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setScannerError('A foto precisa ter até 10 MB.');
      return;
    }

    if (scannerPreview) URL.revokeObjectURL(scannerPreview);
    setScannerFile(file);
    setScannerPreview(URL.createObjectURL(file));
    setScannerSavedPath('');

    try {
      const Detector = (window as unknown as { TextDetector?: new () => { detect: (image: ImageBitmap) => Promise<{ rawValue: string }[]> } }).TextDetector;
      if (Detector) {
        const bitmap = await createImageBitmap(file);
        const blocks = await new Detector().detect(bitmap);
        const text = blocks.map((block) => block.rawValue).join('\n').trim();
        if (text.length > 8) setScannerText(text);
      }
    } catch {
      // Safari/iOS commonly has no TextDetector. The image remains attached and can still be submitted.
    }
  };

  const uploadEvidence = async (userId: string) => {
    if (!supabase || !scannerFile) return '';
    if (scannerSavedPath) return scannerSavedPath;

    const ext = (scannerFile.name.split('.').pop() || 'jpg').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'jpg';
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `${userId}/scanner/${fileName}`;
    const { error } = await supabase.storage
      .from('student-evidence')
      .upload(path, scannerFile, { cacheControl: '3600', upsert: false, contentType: scannerFile.type });
    if (error) throw error;
    setScannerSavedPath(path);
    return path;
  };

  const diagnose = async () => {
    const text = scannerText.trim();
    if (!scannerFile && text.length < 12) {
      setScannerError('Adicione uma foto ou escreva o enunciado para continuar.');
      return;
    }
    if (!scannerReason) {
      setScannerError('Marque por que essa questão foi difícil. Isso deixa o diagnóstico muito melhor.');
      return;
    }

    setDiagnosing(true);
    setScannerError('');

    try {
      const relevantSkills = skills.filter((skill) => skill.exam_id === examId && (scannerArea === 'Automático' || normalize(skill.area) === normalize(scannerArea)));
      const context = [text, scannerArea !== 'Automático' ? scannerArea : '', errorLabel(scannerReason), scannerDetail].filter(Boolean).join(' ');
      const ranked = relevantSkills
        .map((skill) => ({ skill, score: overlapScore(context, skill) }))
        .sort((a, b) => b.score - a.score);
      const best = ranked[0]?.skill ?? null;
      const area = scannerArea !== 'Automático'
        ? scannerArea
        : best?.area || subjects.find((item) => item !== 'Todas' && normalize(context).includes(normalize(item))) || 'Área ainda não identificada';

      const historic = attempts.filter((attempt) =>
        attempt.exam_id === examId
        && attempt.correct !== null
        && (normalize(attempt.area) === normalize(area)
          || Boolean(best?.skill_name && attempt.skill_name && normalize(attempt.skill_name) === normalize(best.skill_name))),
      );
      const accuracy = historic.length ? historic.filter((attempt) => attempt.correct).length / historic.length : null;
      const hasReadableText = text.length >= 12;
      const score = ranked[0]?.score ?? 0;
      const confidence = Math.min(96, Math.max(hasReadableText ? 55 : 42, (hasReadableText ? 55 : 42) + score * 7 + (scannerArea !== 'Automático' ? 10 : 0)));
      const evidence = [
        scannerFile ? 'A foto ficou anexada ao diagnóstico e será salva de forma privada na sua conta.' : 'O diagnóstico foi feito a partir do texto informado.',
        best ? `A questão se aproxima da habilidade “${best.skill_name}”.` : 'Ainda não há informação suficiente para cravar uma habilidade específica.',
        `Você classificou o erro como “${errorLabel(scannerReason)}”.`,
        historic.length ? `Seu histórico nessa área tem ${historic.length} tentativa${historic.length === 1 ? '' : 's'} e ${Math.round((accuracy ?? 0) * 100)}% de acerto.` : 'Ainda não existe histórico suficiente nessa área; este registro cria um novo ponto de referência.',
      ];
      const plan = recoveryPlan(area, best?.skill_name || area, scannerReason, accuracy);

      setDiagnosis({
        area,
        skillName: best?.skill_name || 'Habilidade ampla',
        confidence,
        accuracy,
        attempts: historic.length,
        errorReason: errorLabel(scannerReason),
        evidence,
        plan,
      });

      if (supabase) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const evidencePath = scannerFile ? await uploadEvidence(userData.user.id) : '';
          await supabase.from('student_skill_diagnostics').insert({
            user_id: userData.user.id,
            exam_id: examId,
            skill_code: best?.skill_code ?? null,
            area,
            question_text: text || '[diagnóstico com imagem]',
            correct: null,
            confidence: confidence / 100,
            error_type: scannerReason,
            error_detail: scannerDetail || null,
            evidence_path: evidencePath || null,
            diagnosis: {
              skill_name: best?.skill_name ?? null,
              accuracy,
              attempts: historic.length,
              error_reason: errorLabel(scannerReason),
              plan,
              evidence,
              image_attached: Boolean(scannerFile),
            },
          });
        }
      }
    } catch (error) {
      console.error(error);
      setScannerError('Não consegui concluir o diagnóstico agora. A foto continua selecionada; tente novamente.');
    } finally {
      setDiagnosing(false);
    }
  };

  const enhancedBank = mount ? createPortal(
    <div className="study-lab-bank">
      <div className="study-lab-toolbar">
        <div>
          <strong>Escolha a matéria</strong>
          <span>{filtered.length} questão{filtered.length === 1 ? '' : 'ões'} neste filtro</span>
        </div>
        <div className="study-lab-selects">
          <select value={subject} onChange={(event) => setSubject(event.target.value)}>
            {subjects.map((item) => <option key={item}>{item}</option>)}
          </select>
          <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
            <option>Todas</option>
            {[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>Nível {level}/5</option>)}
          </select>
        </div>
      </div>

      <div className="study-lab-stats">
        {areaStats.slice(0, 8).map((stat) => (
          <button key={stat.area} className={subject === stat.area ? 'active' : ''} onClick={() => setSubject(stat.area)}>
            <b>{stat.area}</b>
            <span>{stat.total} questões</span>
            <small>{stat.accuracy == null ? 'sem histórico' : `${Math.round(stat.accuracy * 100)}% de acerto`}</small>
          </button>
        ))}
      </div>

      <div className="study-lab-grid">
        {visible.map((question) => (
          <button key={question.id} onClick={() => openQuestion(question)}>
            <span>{question.area} · nível {question.difficulty}/5</span>
            <strong>{question.skill_name}</strong>
            <p>{question.prompt}</p>
            <em>Responder no site</em>
          </button>
        ))}
      </div>

      <div className="study-lab-pages">
        <button disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={16}/>Anterior</button>
        <span>Página {page} de {pages}</span>
        <button disabled={page >= pages} onClick={() => setPage((value) => Math.min(pages, value + 1))}>Próxima<ChevronRight size={16}/></button>
      </div>
    </div>,
    mount,
  ) : null;

  return (
    <>
      {enhancedBank}
      <button className="study-scan-fab" onClick={() => setScannerOpen(true)}><Camera size={18}/><span>Diagnosticar dificuldade</span></button>

      {scannerOpen && (
        <div className="study-lab-overlay">
          <div className="study-lab-modal scanner">
            <button className="study-lab-close" onClick={() => setScannerOpen(false)}><X size={19}/></button>
            <div className="study-lab-kicker"><BrainCircuit size={17}/>Diagnóstico de dificuldade</div>
            <h2>Mostre a questão. Entenda por que você errou.</h2>
            <p className="study-lab-lead">A foto vira uma evidência do seu ponto de dificuldade. O Conectaê cruza a questão, o motivo do erro e seu histórico para indicar o que revisar, como treinar e quando testar de novo.</p>

            <div className="study-scan-grid">
              <div>
                <label className={`study-upload ${scannerPreview ? 'has-image' : ''}`}>
                  <ImagePlus size={20}/>
                  <span>
                    <b>{scannerFile ? 'Trocar foto' : 'Tirar foto ou escolher imagem'}</b>
                    <small>JPG, PNG ou WebP · até 10 MB. No celular, você pode abrir a câmera.</small>
                  </span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => handleFile(event.target.files?.[0] ?? null)}/>
                </label>

                {scannerPreview && (
                  <div className="study-image-preview">
                    <img src={scannerPreview} alt="Questão anexada"/>
                    <div>
                      <CheckCircle2 size={16}/>
                      <span>
                        <b>Foto pronta para enviar</b>
                        <small>{scannerFile?.name} · {scannerFile ? `${(scannerFile.size / 1024 / 1024).toFixed(1)} MB` : ''}</small>
                      </span>
                      <button onClick={clearScannerFile} aria-label="Remover foto"><Trash2 size={16}/></button>
                    </div>
                  </div>
                )}
              </div>

              <div className="study-scan-help">
                <Camera size={18}/>
                <strong>A foto não some mais</strong>
                <p>Ela fica visível antes do envio e, ao gerar o diagnóstico, é salva no espaço privado da sua conta.</p>
              </div>
            </div>

            <div className="study-scanner-fields">
              <label>
                <span>Matéria <small>(opcional)</small></span>
                <select value={scannerArea} onChange={(event) => setScannerArea(event.target.value)}>
                  <option>Automático</option>
                  {subjects.filter((item) => item !== 'Todas').map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>

              <label>
                <span>Enunciado ou observação <small>(opcional se houver foto)</small></span>
                <textarea value={scannerText} onChange={(event) => setScannerText(event.target.value)} placeholder="Cole o enunciado ou escreva onde você travou. Em navegadores compatíveis, tentamos extrair o texto da foto automaticamente."/>
              </label>
            </div>

            <div className="study-error-block">
              <strong>Por que essa questão foi difícil?</strong>
              <p>Isso diferencia falta de conteúdo de problema de tempo, interpretação ou execução.</p>
              <div className="study-error-reasons">
                {ERROR_REASONS.map((reason) => (
                  <button key={reason.id} className={scannerReason === reason.id ? 'active' : ''} onClick={() => setScannerReason(reason.id)}>
                    <span>{reason.id === 'tempo' ? <Clock3 size={15}/> : reason.id === 'conteudo' ? <BookOpen size={15}/> : <AlertCircle size={15}/>}</span>
                    <b>{reason.label}</b>
                    <small>{reason.hint}</small>
                  </button>
                ))}
              </div>
              <textarea className="study-error-detail" value={scannerDetail} onChange={(event) => setScannerDetail(event.target.value)} placeholder="Ex.: sabia a fórmula, mas não percebi qual usar; fiquei 5 min presa; confundi duas alternativas…"/>
            </div>

            {scannerError && <div className="study-scan-error"><AlertCircle size={16}/>{scannerError}</div>}

            <button className="study-lab-primary wide" disabled={(!scannerFile && scannerText.trim().length < 12) || !scannerReason || diagnosing} onClick={diagnose}>
              <Upload size={16}/>{diagnosing ? 'Salvando e analisando…' : 'Enviar e montar meu plano de recuperação'}
            </button>

            {diagnosis && (
              <div className="study-diagnosis">
                <div className="study-diagnosis-head">
                  <div>
                    <span>Área identificada</span>
                    <h3>{diagnosis.area}</h3>
                    <p>{diagnosis.skillName} · {diagnosis.errorReason}</p>
                  </div>
                  <div className="study-score"><b>{diagnosis.confidence}%</b><span>confiança</span></div>
                </div>

                <div className="study-evidence">
                  <strong>O que os dados mostram</strong>
                  {diagnosis.evidence.map((item, index) => <p key={index}><BarChart3 size={15}/>{item}</p>)}
                </div>

                <div className="study-plan">
                  <strong>Plano de recuperação — 7 dias</strong>
                  {diagnosis.plan.map((item, index) => <div key={index}><span>{index + 1}</span><p>{item}</p></div>)}
                </div>

                <button className="study-lab-secondary" onClick={() => { setScannerOpen(false); if (subjects.includes(diagnosis.area)) setSubject(diagnosis.area); setPage(1); }}>
                  <BookOpen size={16}/>Treinar essa área agora
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {active && (
        <div className="study-lab-overlay">
          <div className="study-lab-modal question">
            <button className="study-lab-close" onClick={() => setActive(null)}><X size={19}/></button>
            <div className="study-lab-kicker"><FileText size={16}/>{active.area} · nível {active.difficulty}/5</div>
            <h2>{active.skill_name}</h2>
            <p className="study-question-prompt">{active.prompt}</p>

            {(['A', 'B', 'C', 'D', 'E'] as const).map((letter) => {
              const key = `option_${letter.toLowerCase()}` as keyof Question;
              const value = active[key] as string | null;
              if (!value) return null;
              return <button key={letter} className={`study-option ${selected === letter ? 'selected' : ''}`} onClick={() => result === null && setSelected(letter)}><b>{letter}</b><span>{value}</span></button>;
            })}

            <div className="study-question-actions">
              {result === null
                ? <button className="study-lab-primary" disabled={!selected} onClick={answer}><CheckCircle2 size={16}/>Responder e ver explicação</button>
                : <button className="study-lab-primary" onClick={nextQuestion}><PlayCircle size={16}/>Próxima questão</button>}
            </div>

            {result !== null && (
              <div className={`study-feedback ${result ? 'right' : 'wrong'}`}>
                <strong>{result ? <CheckCircle2 size={18}/> : <XCircle size={18}/>} {result ? 'Você acertou.' : 'Resposta incorreta.'}</strong>
                <p>Gabarito: <b>{active.correct_option}</b></p>
                <p>{active.explanation || 'A explicação desta questão está sendo revisada.'}</p>

                {!result && (
                  <div className="study-why-wrong">
                    <strong>O que mais explica esse erro?</strong>
                    <div>
                      {ERROR_REASONS.slice(0, 6).map((reason) => (
                        <button key={reason.id} className={questionErrorReason === reason.id ? 'active' : ''} onClick={() => saveQuestionError(reason.id)}>{reason.label}</button>
                      ))}
                    </div>
                    {questionErrorSaved && <small>Salvo. Esse motivo passa a fazer parte do seu histórico de erros.</small>}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
