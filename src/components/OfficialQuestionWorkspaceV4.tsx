/* eslint-disable @typescript-eslint/no-explicit-any, no-empty */
import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RotateCcw,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  extractOfficialAnswer,
  extractOfficialAnswerRemotely,
  extractOfficialQuestion,
  extractOfficialQuestionRemotely,
  isUsableOfficialQuestion,
  renderOfficialPdfPage,
} from "@/lib/official-pdf-client";
import { isEnemInteractiveQuestion } from "@/lib/enem-official-availability";

type ExamId =
  "enem" | "cmmg" | "fuvest" | "insper" | "link" | "ibmec" | "einstein";
type Mode = "official" | "adapted" | "authorial";
type OfficialRef = {
  question_id: string;
  series_id: string;
  vestibular: string;
  year: number;
  question_number: number;
  area: string | null;
  subject: string | null;
  skill_name: string | null;
  correct_option: string | null;
  source_pdf_url: string | null;
  answer_key_url: string | null;
  source_url: string | null;
  day: number | null;
  booklet_code: string | null;
  color: string | null;
  prompt_text: string | null;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  option_e: string | null;
};
type Practice = {
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
  source_kind: string | null;
  source_exam_year: number | null;
  source_question_number: number | null;
  source_exam_label: string | null;
  source_exam_url: string | null;
  source_answer_url: string | null;
};
type Extracted = {
  found?: boolean;
  prompt: string;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  option_e: string | null;
  correct_option?: string | null;
  needs_source_image: boolean;
  image_note: string | null;
  confidence: number;
  images?: string[];
  option_images?: Record<string, string>;
  source_page?: number;
};
type ExamCfg = { id: ExamId; label: string; officialSeries: boolean };

const EXAMS: ExamCfg[] = [
  { id: "enem", label: "ENEM", officialSeries: true },
  { id: "cmmg", label: "CMMG", officialSeries: true },
  { id: "fuvest", label: "FUVEST", officialSeries: true },
  { id: "insper", label: "Insper", officialSeries: false },
  { id: "link", label: "Link", officialSeries: false },
  { id: "ibmec", label: "Ibmec", officialSeries: false },
  { id: "einstein", label: "Albert Einstein", officialSeries: false },
];
const LETTERS = ["A", "B", "C", "D", "E"] as const;
const option = (source: any, l: (typeof LETTERS)[number]) =>
  (source?.[`option_${l.toLowerCase()}`] as string | null) || null;
const validLetter = (v: unknown) =>
  /^[A-E]$/.test(String(v || "").toUpperCase());
const optionCount = (source: any) =>
  LETTERS.filter((l) => Boolean(option(source, l))).length;
const isObjective = (source: any) => optionCount(source) >= 2;
function semester(q: OfficialRef) {
  const s = `${q.source_pdf_url || ""} ${q.answer_key_url || ""}`;
  if (/(?:2[-_ ]?SEM|2o-SEMESTRE|2026_2)/i.test(s)) return "2º semestre";
  if (/(?:1[-_ ]?SEM|1o-SEMESTRE|2026_1)/i.test(s)) return "1º semestre";
  return "";
}
function edition(q: OfficialRef, label: string) {
  const sem = q.series_id === "cmmg" ? semester(q) : "";
  return `${label} ${q.year}${sem ? ` · ${sem}` : ""} · Questão ${q.question_number}`;
}

export default function OfficialQuestionWorkspaceV4() {
  const [exam, setExam] = useState<ExamId>(() => {
    const s = localStorage.getItem("conectae:active-exam") as ExamId | null;
    return EXAMS.some((x) => x.id === s) ? s! : "enem";
  });
  const [mode, setMode] = useState<Mode>("official");
  const [official, setOfficial] = useState<OfficialRef[]>([]);
  const [practice, setPractice] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);
  const [bankError, setBankError] = useState("");
  const [area, setArea] = useState("Todas");
  const [year, setYear] = useState("Todos");
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(120);
  const [activeOfficial, setActiveOfficial] = useState<OfficialRef | null>(
    null,
  );
  const [activePractice, setActivePractice] = useState<Practice | null>(null);
  const [extracted, setExtracted] = useState<Extracted | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [selected, setSelected] = useState("");
  const [correct, setCorrect] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [written, setWritten] = useState("");
  const cfg = EXAMS.find((x) => x.id === exam)!;

  useEffect(() => {
    localStorage.setItem("conectae:active-exam", exam);
    setArea("Todas");
    setYear("Todos");
    setSearch("");
    setMode(cfg.officialSeries ? "official" : "authorial");
    setVisibleCount(120);
  }, [exam, cfg.officialSeries]);
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!supabase) {
        setLoading(false);
        setBankError("Banco de questões indisponível.");
        return;
      }
      setLoading(true);
      setBankError("");
      const prPromise = supabase
        .from("exam_practice_questions")
        .select(
          "id,exam_id,area,skill_name,difficulty,prompt,option_a,option_b,option_c,option_d,option_e,correct_option,explanation,source_kind,source_exam_year,source_question_number,source_exam_label,source_exam_url,source_answer_url",
        )
        .eq("active", true)
        .eq("exam_id", exam)
        .range(0, 1499);
      let refs: OfficialRef[] = [];
      if (cfg.officialSeries) {
        for (let from = 0; from < 3000; from += 500) {
          const result = await supabase
            .from("official_vestibular_question_bank")
            .select(
              "question_id,series_id,vestibular,year,question_number,area,subject,skill_name,correct_option,source_pdf_url,answer_key_url,source_url,day,booklet_code,color,prompt_text,option_a,option_b,option_c,option_d,option_e",
            )
            .eq("series_id", exam)
            .order("year", { ascending: false })
            .order("question_number", { ascending: true })
            .order("question_id", { ascending: true })
            .range(from, from + 499);
          if (result.error) throw result.error;
          const batch = (result.data ?? []) as OfficialRef[];
          refs.push(...batch);
          if (batch.length < 500) break;
        }
        refs = refs.filter((q) =>
          exam === "enem"
            ? isEnemInteractiveQuestion(q.year, q.question_number)
            : /\.pdf(?:$|\?)/i.test(q.source_pdf_url || ""),
        );
      }
      const pr = await prPromise;
      if (pr.error) throw pr.error;
      if (!alive) return;
      setOfficial(refs);
      setPractice((pr.data ?? []) as Practice[]);
      setLoading(false);
    })().catch((error) => {
      console.error("question bank v4 load failed", error);
      if (alive) {
        setOfficial([]);
        setPractice([]);
        setBankError("Não consegui carregar o banco agora. Tente novamente.");
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [exam, cfg.officialSeries]);

  const adapted = useMemo(
    () => practice.filter((q) => q.source_kind === "official_adapted"),
    [practice],
  );
  const authorial = useMemo(
    () =>
      practice.filter((q) => !q.source_kind || q.source_kind === "authorial"),
    [practice],
  );
  const rows: any[] =
    mode === "official" ? official : mode === "adapted" ? adapted : authorial;
  const availableAreas = useMemo(
    () => [
      "Todas",
      ...Array.from(
        new Set(
          rows
            .map((q: any) => String(q.area || q.subject || "").trim())
            .filter(Boolean),
        ),
      ).sort(),
    ],
    [rows],
  );
  const years = useMemo(
    () => [
      "Todos",
      ...Array.from(
        new Set(
          rows
            .map((q: any) =>
              mode === "official" ? q.year : q.source_exam_year,
            )
            .filter((v: any) => Number.isFinite(v)),
        ),
      )
        .sort((a: any, b: any) => b - a)
        .map(String),
    ],
    [rows, mode],
  );
  const filtered = useMemo(
    () =>
      rows.filter((q: any) => {
        const qa = String(q.area || q.subject || "");
        if (area !== "Todas" && qa !== area) return false;
        const y = mode === "official" ? q.year : q.source_exam_year;
        if (year !== "Todos" && String(y) !== year) return false;
        const t = search.trim().toLowerCase();
        if (!t) return true;
        const h =
          mode === "official"
            ? `${qa} ${q.subject || ""} ${q.skill_name || ""} ${q.question_number} ${q.year}`
            : `${qa} ${q.skill_name || ""} ${q.prompt || ""} ${q.source_question_number || ""}`;
        return h.toLowerCase().includes(t);
      }),
    [rows, area, year, search, mode],
  );
  useEffect(() => setVisibleCount(120), [exam, mode, area, year, search]);
  const modalOpen = Boolean(activeOfficial || activePractice);
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("conectae:question-modal", {
        detail: { open: modalOpen },
      }),
    );
    document.body.style.overflow = modalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
      window.dispatchEvent(
        new CustomEvent("conectae:question-modal", { detail: { open: false } }),
      );
    };
  }, [modalOpen]);

  function reset() {
    setSelected("");
    setCorrect(null);
    setSubmitted(false);
    setAnswering(false);
    setWritten("");
    setExtracted(null);
    setExtractError("");
  }
  function close() {
    setActiveOfficial(null);
    setActivePractice(null);
    reset();
  }
  function askAI() {
    const source = activeOfficial ? extracted : activePractice;
    const prompt = activeOfficial ? extracted?.prompt : activePractice?.prompt;
    if (!prompt) return;
    window.dispatchEvent(
      new CustomEvent("conectae:tutor-open", {
        detail: {
          currentQuestion: prompt,
          currentArea: String(
            activeOfficial?.area ||
              activeOfficial?.subject ||
              activePractice?.area ||
              "",
          ),
          currentSkill: String(
            activeOfficial?.skill_name || activePractice?.skill_name || "",
          ),
          currentCorrection:
            source && submitted
              ? `Resposta esperada: ${correct || activePractice?.explanation || "consulte a fonte oficial"}`
              : "",
        },
      }),
    );
  }
  async function loadOfficial(q: OfficialRef) {
    reset();
    setActiveOfficial(q);
    setActivePractice(null);
    setExtracting(true);
    const key = `conectae:official-v8:${q.question_id}`;
    try {
      const cached = JSON.parse(sessionStorage.getItem(key) || "null");
      if (isUsableOfficialQuestion(cached)) {
        setExtracted(cached);
        return;
      }
    } catch {}
    try {
      let value: Extracted | null = null;
      const stored = {
        found: true,
        prompt: q.prompt_text || "",
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        option_e: q.option_e,
        correct_option: q.correct_option,
        needs_source_image: false,
        image_note: null,
        confidence: 1,
      };
      if (isUsableOfficialQuestion(stored)) value = stored;
      if (
        !value &&
        q.series_id === "enem" &&
        q.year >= 2019 &&
        q.year <= 2023
      ) {
        try {
          const response = await fetch(
            `/api/enem-official-questions?year=${q.year}&question=${q.question_number}`,
          );
          const data = await response.json();
          if (response.ok && isUsableOfficialQuestion(data))
            value = data as Extracted;
        } catch (error) {
          console.warn("structured ENEM extraction failed", error);
        }
      }
      if (
        !value &&
        q.series_id !== "cmmg" &&
        q.source_pdf_url &&
        !/download\.inep\.gov\.br/i.test(q.source_pdf_url)
      ) {
        try {
          const d = await extractOfficialQuestion(
            q.source_pdf_url,
            q.question_number,
          );
          if (isUsableOfficialQuestion(d)) value = d;
        } catch (error) {
          console.warn("local official extraction failed", error);
        }
      }
      if (!value && q.source_pdf_url) {
        try {
          const d = await extractOfficialQuestionRemotely(
            q.source_pdf_url,
            q.question_number,
            q.vestibular || cfg.label,
            q.year,
          );
          if (isUsableOfficialQuestion(d)) value = d;
        } catch (error) {
          console.warn("remote official extraction failed", error);
        }
      }
      if (!value)
        throw new Error(
          "Não consegui carregar esta questão completa agora. Tente novamente em alguns segundos.",
        );
      if (
        value.needs_source_image &&
        !value.images?.length &&
        value.source_page &&
        q.source_pdf_url &&
        !/download\.inep\.gov\.br/i.test(q.source_pdf_url)
      ) {
        try {
          const image = await renderOfficialPdfPage(
            q.source_pdf_url,
            value.source_page,
          );
          if (image) value = { ...value, images: [image] };
        } catch (error) {
          console.warn("official source page rendering failed", error);
        }
      }
      setExtracted(value);
      try {
        sessionStorage.setItem(key, JSON.stringify(value));
      } catch {}
    } catch (e: any) {
      setExtractError(
        e?.message || "Não consegui carregar esta questão completa agora.",
      );
    } finally {
      setExtracting(false);
    }
  }
  function openPractice(q: Practice) {
    reset();
    setActivePractice(q);
    setActiveOfficial(null);
  }
  async function retry() {
    if (activeOfficial) await loadOfficial(activeOfficial);
  }
  async function submitOfficial() {
    if (!activeOfficial || !selected || submitted) return;
    setAnswering(true);
    try {
      let ans =
        extracted?.correct_option?.toUpperCase() ||
        activeOfficial.correct_option?.toUpperCase() ||
        null;
      if (
        !validLetter(ans) &&
        activeOfficial.answer_key_url &&
        activeOfficial.series_id !== "cmmg" &&
        !/download\.inep\.gov\.br/i.test(activeOfficial.answer_key_url)
      ) {
        try {
          ans = await extractOfficialAnswer(
            activeOfficial.answer_key_url,
            activeOfficial.question_number,
          );
        } catch (e) {
          console.warn("local official answer extraction failed", e);
        }
      }
      if (!validLetter(ans) && activeOfficial.answer_key_url) {
        try {
          ans = await extractOfficialAnswerRemotely(
            activeOfficial.answer_key_url,
            activeOfficial.question_number,
            activeOfficial.vestibular || cfg.label,
            activeOfficial.year,
          );
        } catch (e) {
          console.warn("remote official answer extraction failed", e);
        }
      }
      setCorrect(validLetter(ans) ? ans : null);
      setSubmitted(true);
    } finally {
      setAnswering(false);
    }
  }
  async function submitPractice() {
    if (!activePractice || !selected || submitted) return;
    const ans = activePractice.correct_option?.toUpperCase() || null;
    setCorrect(validLetter(ans) ? ans : null);
    setSubmitted(true);
    try {
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      await supabase.from("student_practice_attempts").insert({
        user_id: data.user.id,
        exam_id: activePractice.exam_id,
        question_id: activePractice.id,
        area: activePractice.area,
        skill_name: activePractice.skill_name,
        selected_option: selected,
        correct: validLetter(ans) ? selected === ans : null,
        duration_seconds: null,
      });
    } catch (error) {
      console.warn("practice attempt history skipped", error);
    }
  }
  function revealWritten() {
    if (!activePractice || submitted) return;
    setSubmitted(true);
    setCorrect(null);
  }

  const source: Extracted | Practice | null = activeOfficial
    ? extracted
    : activePractice;
  const prompt = activeOfficial ? extracted?.prompt : activePractice?.prompt;
  const objective = isObjective(source);
  const result = Boolean(submitted && correct && selected === correct);
  const label = activeOfficial
    ? edition(activeOfficial, cfg.label)
    : activePractice
      ? `${cfg.label}${activePractice.source_exam_year ? ` ${activePractice.source_exam_year}` : ""}${activePractice.source_question_number ? ` · Questão ${activePractice.source_question_number}` : ""}`
      : "";

  if (loading)
    return (
      <div className="grid min-h-[260px] place-items-center rounded-2xl border border-[#173765] bg-[#06152f]">
        <div className="flex items-center gap-2 text-sm font-bold text-[#9fb5d4]">
          <Loader2 size={17} className="animate-spin" />
          Carregando questões…
        </div>
      </div>
    );
  return (
    <section className="pb-8">
      <div className="mb-4">
        <div className="text-[11px] font-extrabold uppercase tracking-[.1em] text-[#72a5ff]">
          Banco de questões
        </div>
        <h1 className="mt-1 text-2xl font-extrabold tracking-[-.035em] md:text-3xl">
          Resolva a questão completa aqui.
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-[#93a9c9]">
          Questões oficiais usam o acervo e a fonte real da prova. Questões
          autorais ficam identificadas como “Estilo da prova”. Discursivas abrem
          campo de resposta e modelo esperado, em vez de fingir alternativas.
        </p>
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {EXAMS.map((x) => (
          <button
            type="button"
            key={x.id}
            onClick={() => setExam(x.id)}
            className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-extrabold ${exam === x.id ? "border-[#3479ff] bg-[#246cff] text-white" : "border-[#234576] bg-[#071a38] text-[#a9bddc]"}`}
          >
            {x.label}
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl border border-[#173765] bg-[#06152f] p-2">
        <button
          type="button"
          disabled={!cfg.officialSeries}
          onClick={() => setMode("official")}
          className={`rounded-xl px-2 py-3 text-xs font-extrabold disabled:opacity-35 ${mode === "official" ? "bg-emerald-500/15 text-emerald-200" : "text-[#9fb5d4]"}`}
        >
          Oficiais<span className="block text-lg">{official.length}</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("adapted")}
          className={`rounded-xl px-2 py-3 text-xs font-extrabold ${mode === "adapted" ? "bg-[#0b2856] text-white" : "text-[#9fb5d4]"}`}
        >
          Adaptadas<span className="block text-lg">{adapted.length}</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("authorial")}
          className={`rounded-xl px-2 py-3 text-xs font-extrabold ${mode === "authorial" ? "bg-[#0b2856] text-white" : "text-[#9fb5d4]"}`}
        >
          Estilo da prova
          <span className="block text-lg">{authorial.length}</span>
        </button>
      </div>
      {bankError && (
        <div className="mt-3 rounded-2xl border border-rose-400/30 bg-rose-400/[.06] p-4 text-sm text-rose-100">
          {bankError}
        </div>
      )}
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {availableAreas.map((a) => (
          <button
            type="button"
            key={a}
            onClick={() => setArea(a)}
            className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-bold ${area === a ? "border-[#3479ff] bg-[#123a78] text-white" : "border-[#203d67] bg-[#071a38] text-[#8fa7c9]"}`}
          >
            {a === "Todas" ? "Todas as áreas" : a}
          </button>
        ))}
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
        <label className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6f8ebc]"
            size={16}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conteúdo, matéria, ano ou número"
            className="h-11 w-full rounded-xl border border-[#234576] bg-[#071a38] pl-10 pr-3 text-sm text-white outline-none placeholder:text-[#6680a5]"
          />
        </label>
        {years.length > 1 && (
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="h-11 rounded-xl border border-[#234576] bg-[#071a38] px-3 text-xs font-bold text-white outline-none"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y === "Todos" ? "Todos os anos" : y}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="mt-4 text-xs font-bold text-[#8fa7c9]">
        {filtered.length}{" "}
        {filtered.length === 1 ? "questão encontrada" : "questões encontradas"}
      </div>
      <div className="mt-3 grid gap-2.5 md:grid-cols-2">
        {filtered.slice(0, visibleCount).map((q: any) =>
          mode === "official" ? (
            <button
              type="button"
              key={q.question_id}
              onClick={() => loadOfficial(q)}
              className="rounded-2xl border border-emerald-400/25 bg-[#06152f] p-4 text-left transition hover:border-emerald-300/60"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-emerald-300/10 px-2 py-1 text-[9px] font-black uppercase tracking-wide text-emerald-200">
                  Oficial
                </span>
                <span className="text-[10px] text-[#708bb3]">{q.year}</span>
              </div>
              <div className="mt-3 text-[11px] font-bold text-[#72a5ff]">
                {edition(q, cfg.label)}
              </div>
              <strong className="mt-1.5 block text-sm text-white">
                {q.skill_name || q.subject || q.area || "Questão de prova"}
              </strong>
            </button>
          ) : (
            <button
              type="button"
              key={q.id}
              onClick={() => openPractice(q)}
              className="rounded-2xl border border-[#183965] bg-[#06152f] p-4 text-left transition hover:border-[#3479ff]"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-wide ${q.source_kind === "official_adapted" ? "bg-blue-300/10 text-blue-200" : "bg-[#10294f] text-[#9fb5d4]"}`}
                >
                  {q.source_kind === "official_adapted"
                    ? "Adaptada de prova real"
                    : "Estilo da prova"}
                </span>
                <span className="text-[10px] text-[#708bb3]">
                  nível {q.difficulty}/5
                </span>
              </div>
              <div className="mt-3 text-[11px] font-bold text-[#72a5ff]">
                {cfg.label}
                {q.source_exam_year ? ` ${q.source_exam_year}` : ""} · {q.area}
              </div>
              <strong className="mt-1.5 block text-sm text-white">
                {q.skill_name}
              </strong>
              <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#8fa7c9]">
                {q.prompt}
              </p>
            </button>
          ),
        )}
      </div>
      {visibleCount < filtered.length && (
        <button
          type="button"
          onClick={() => setVisibleCount((v) => v + 120)}
          className="mt-4 min-h-11 w-full rounded-xl border border-[#234576] bg-[#071a38] text-sm font-extrabold text-white"
        >
          Carregar mais
        </button>
      )}
      {!filtered.length && !bankError && (
        <div className="mt-4 rounded-2xl border border-[#173765] bg-[#06152f] p-5 text-sm text-[#9fb5d4]">
          {mode === "official"
            ? "Nenhuma referência oficial interativa disponível com esses filtros."
            : "Nenhuma questão com esses filtros."}
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-[220] overflow-y-auto bg-[#020817] text-white"
          role="dialog"
          aria-modal="true"
          aria-label="Resolver questão"
        >
          <div className="mx-auto min-h-full w-full max-w-3xl px-4 pb-[calc(env(safe-area-inset-bottom)+28px)] pt-[max(12px,env(safe-area-inset-top))] md:px-6">
            <div className="sticky top-0 z-10 -mx-1 flex items-center justify-between gap-3 border-b border-[#173765] bg-[#020817]/97 px-1 py-3 backdrop-blur-xl">
              <div className="min-w-0">
                <div
                  className={`text-[11px] font-black uppercase tracking-wide ${activeOfficial ? "text-emerald-200" : "text-[#72a5ff]"}`}
                >
                  {activeOfficial
                    ? "Questão oficial"
                    : activePractice?.source_kind === "official_adapted"
                      ? "Adaptada de prova real"
                      : "Estilo da prova"}
                </div>
                <div className="truncate text-sm font-extrabold">{label}</div>
              </div>
              <button
                type="button"
                onClick={close}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[#234576] bg-[#071a38]"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>
            <div className="py-5">
              {extracting ? (
                <div className="grid min-h-[260px] place-items-center">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#9fb5d4]">
                    <Loader2 size={17} className="animate-spin" />
                    Carregando da prova oficial…
                  </div>
                </div>
              ) : extractError ? (
                <div className="rounded-2xl border border-rose-400/30 bg-rose-400/[.06] p-5">
                  <strong>Essa questão não abriu corretamente.</strong>
                  <p className="mt-2 text-sm text-[#b8cae4]">{extractError}</p>
                  <button
                    type="button"
                    onClick={retry}
                    className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#246cff] px-4 text-sm font-extrabold"
                  >
                    <RotateCcw size={16} />
                    Tentar novamente
                  </button>
                </div>
              ) : prompt ? (
                <>
                  <div className="text-xs font-bold text-[#72a5ff]">
                    {String(
                      activeOfficial?.area ||
                        activeOfficial?.subject ||
                        activePractice?.area ||
                        "Questão",
                    )}{" "}
                    ·{" "}
                    {String(
                      activeOfficial?.skill_name ||
                        activePractice?.skill_name ||
                        "",
                    )}
                  </div>
                  <h2 className="mt-3 whitespace-pre-line text-lg font-extrabold leading-relaxed md:text-xl">
                    {prompt}
                  </h2>
                  {activeOfficial && extracted?.needs_source_image && (
                    <div className="mt-4 rounded-xl border border-amber-300/25 bg-amber-300/[.06] p-3 text-xs text-amber-100">
                      A questão depende de elemento visual da prova. Use também
                      o PDF oficial abaixo para conferir a figura/tabela
                      original.
                    </div>
                  )}
                  {Array.isArray(extracted?.images) &&
                    extracted!.images!.length > 0 && (
                      <div className="mt-4 grid gap-3">
                        {extracted!.images!.map((src, i) => (
                          <img
                            key={`${src}-${i}`}
                            src={src}
                            alt={`Elemento visual ${i + 1} da questão`}
                            className="max-h-[520px] w-full rounded-xl border border-[#234576] bg-white object-contain"
                          />
                        ))}
                      </div>
                    )}
                  {objective ? (
                    <>
                      <div className="mt-5 grid gap-2.5">
                        {LETTERS.map((letter) => {
                          const text = option(source, letter);
                          if (!text) return null;
                          const chosen = selected === letter;
                          const isCorrect = submitted && letter === correct;
                          const isWrong =
                            submitted &&
                            chosen &&
                            correct &&
                            letter !== correct;
                          return (
                            <button
                              type="button"
                              key={letter}
                              disabled={submitted}
                              onClick={() => setSelected(letter)}
                              className={`flex min-h-14 items-start gap-3 rounded-xl border px-4 py-3 text-left ${isCorrect ? "border-emerald-400 bg-emerald-400/10" : isWrong ? "border-rose-400 bg-rose-400/10" : chosen ? "border-[#3479ff] bg-[#123a78]" : "border-[#234576] bg-[#071a38]"}`}
                            >
                              <strong>{letter}</strong>
                              <span className="text-sm leading-relaxed">
                                {text}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      {!submitted ? (
                        <button
                          type="button"
                          disabled={!selected || answering}
                          onClick={
                            activeOfficial ? submitOfficial : submitPractice
                          }
                          className="mt-5 min-h-12 w-full rounded-xl bg-[#246cff] px-4 text-sm font-extrabold disabled:opacity-40"
                        >
                          {answering
                            ? "Conferindo gabarito…"
                            : "Confirmar resposta"}
                        </button>
                      ) : (
                        <div
                          className={`mt-5 rounded-2xl border p-4 ${correct ? (result ? "border-emerald-400/30 bg-emerald-400/[.07]" : "border-rose-400/30 bg-rose-400/[.07]") : "border-amber-300/30 bg-amber-300/[.07]"}`}
                        >
                          <div className="flex items-center gap-2 font-extrabold">
                            {correct ? (
                              result ? (
                                <CheckCircle2 size={19} />
                              ) : (
                                <XCircle size={19} />
                              )
                            ) : (
                              <CheckCircle2 size={19} />
                            )}{" "}
                            {correct
                              ? result
                                ? "Resposta correta"
                                : "Resposta incorreta"
                              : "Tentativa registrada"}
                          </div>
                          {correct && (
                            <p className="mt-2 text-sm text-[#b8cae4]">
                              Gabarito: <strong>{correct}</strong>
                            </p>
                          )}
                          {!correct && (
                            <p className="mt-2 text-sm text-[#b8cae4]">
                              O gabarito não pôde ser extraído automaticamente
                              desta fonte; confira o gabarito oficial pelo link
                              abaixo.
                            </p>
                          )}
                          {activePractice?.explanation && (
                            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#9fb5d4]">
                              {
                                activePractice.explanation.split(
                                  "\n\nFonte para conferência:",
                                )[0]
                              }
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <label className="mt-5 block">
                        <span className="text-xs font-bold text-[#9fb5d4]">
                          Sua resposta discursiva
                        </span>
                        <textarea
                          value={written}
                          onChange={(e) => setWritten(e.target.value)}
                          disabled={submitted}
                          rows={6}
                          placeholder="Escreva sua resposta antes de conferir o modelo esperado."
                          className="mt-2 w-full rounded-xl border border-[#234576] bg-[#071a38] p-4 text-sm text-white outline-none placeholder:text-[#6680a5]"
                        />
                      </label>
                      {!submitted ? (
                        <button
                          type="button"
                          disabled={!written.trim()}
                          onClick={revealWritten}
                          className="mt-4 min-h-12 w-full rounded-xl bg-[#246cff] px-4 text-sm font-extrabold disabled:opacity-40"
                        >
                          Ver resposta esperada
                        </button>
                      ) : (
                        <div className="mt-5 rounded-2xl border border-emerald-400/25 bg-emerald-400/[.06] p-4">
                          <strong>Resposta esperada / critérios</strong>
                          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#b8cae4]">
                            {activePractice?.explanation ||
                              "Compare sua justificativa com a fonte oficial e peça uma correção à IA."}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={askAI}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0b2856] px-4 text-xs font-extrabold"
                    >
                      <Bot size={15} />
                      Perguntar à IA sobre esta questão
                    </button>
                    {submitted && activeOfficial?.source_pdf_url && (
                      <a
                        href={activeOfficial.source_pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#234576] bg-[#071a38] px-4 text-xs font-bold"
                      >
                        <ExternalLink size={14} />
                        Ver prova oficial
                      </a>
                    )}
                    {submitted && activeOfficial?.answer_key_url && (
                      <a
                        href={activeOfficial.answer_key_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#234576] bg-[#071a38] px-4 text-xs font-bold"
                      >
                        <ExternalLink size={14} />
                        Ver gabarito oficial
                      </a>
                    )}
                    {submitted && activePractice?.source_exam_url && (
                      <a
                        href={activePractice.source_exam_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#234576] bg-[#071a38] px-4 text-xs font-bold"
                      >
                        <ExternalLink size={14} />
                        Conferir fonte
                      </a>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
