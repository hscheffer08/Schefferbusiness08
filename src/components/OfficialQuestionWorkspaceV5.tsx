/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";
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
type Cfg = { id: ExamId; label: string; official: boolean };
type O = {
  question_id: string;
  series_id: string;
  year: number;
  question_number: number;
  area: string | null;
  subject: string | null;
  skill_name: string | null;
  correct_option: string | null;
  source_pdf_url: string | null;
  answer_key_url: string | null;
  prompt_text: string | null;
  option_a: string | null;
  option_b: string | null;
  option_c: string | null;
  option_d: string | null;
  option_e: string | null;
};
type P = {
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
  source_exam_url: string | null;
};
type E = {
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
  source_page?: number;
};
const CFG: Cfg[] = [
  { id: "enem", label: "ENEM", official: true },
  { id: "cmmg", label: "CMMG", official: true },
  { id: "fuvest", label: "FUVEST", official: true },
  { id: "insper", label: "Insper", official: false },
  { id: "link", label: "Link", official: false },
  { id: "ibmec", label: "Ibmec", official: false },
  { id: "einstein", label: "Albert Einstein", official: false },
];
const L = ["A", "B", "C", "D", "E"] as const;
const opt = (q: any, l: string) => q?.[`option_${l.toLowerCase()}`] || null;
const objective = (q: any) => L.filter((l) => Boolean(opt(q, l))).length >= 2;
const valid = (v: any) => /^[A-E]$/.test(String(v || "").toUpperCase());

async function saveAttempt(a: {
  exam: ExamId;
  practice?: P | null;
  official?: O | null;
  selected: string;
  correct: string | null;
  started: number;
  written?: string;
}) {
  if (!supabase) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const p = a.practice,
    o = a.official;
  const area = p?.area || o?.area || o?.subject || "Geral",
    skill = p?.skill_name || o?.skill_name || o?.subject || area;
  const isCorrect = a.correct ? a.selected === a.correct : null;
  const { error } = await supabase.from("student_practice_attempts").insert({
    user_id: user.id,
    exam_id: a.exam,
    question_id: p?.id ?? null,
    area,
    skill_name: skill,
    selected_option: a.selected || null,
    correct: isCorrect,
    duration_seconds: Math.max(1, Math.round((Date.now() - a.started) / 1000)),
    response_text:
      a.written ||
      (o
        ? `Oficial ${o.series_id.toUpperCase()} ${o.year} #${o.question_number}`
        : null),
    error_type: isCorrect === false ? "conteudo" : null,
    error_detail:
      isCorrect === false
        ? `Marcou ${a.selected}; gabarito ${a.correct}.`
        : null,
  });
  if (error) console.warn("practice attempt insert failed", error.message);
  if (p) {
    const seen = await supabase
      .from("student_seen_questions")
      .insert({ user_id: user.id, question_id: p.id });
    if (seen.error && seen.error.code !== "23505")
      console.warn("seen question insert failed", seen.error.message);
  }
  window.dispatchEvent(new CustomEvent("conectae:diagnostic-saved"));
}

export default function OfficialQuestionWorkspaceV5() {
  const [exam, setExam] = useState<ExamId>(() => {
      const x = localStorage.getItem("conectae:active-exam") as ExamId | null;
      return CFG.some((c) => c.id === x) ? x! : "enem";
    }),
    [mode, setMode] = useState<Mode>("official");
  const [official, setOfficial] = useState<O[]>([]),
    [practice, setPractice] = useState<P[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const [area, setArea] = useState("Todas"),
    [search, setSearch] = useState(""),
    [year, setYear] = useState("Todos"),
    [shown, setShown] = useState(100);
  const [ao, setAo] = useState<O | null>(null),
    [ap, setAp] = useState<P | null>(null),
    [ext, setExt] = useState<E | null>(null),
    [extracting, setExtracting] = useState(false),
    [extractError, setExtractError] = useState("");
  const [selected, setSelected] = useState(""),
    [correct, setCorrect] = useState<string | null>(null),
    [submitted, setSubmitted] = useState(false),
    [answering, setAnswering] = useState(false),
    [written, setWritten] = useState("");
  const started = useRef(Date.now());
  const cfg = CFG.find((c) => c.id === exam)!;
  useEffect(() => {
    localStorage.setItem("conectae:active-exam", exam);
    setArea("Todas");
    setSearch("");
    setYear("Todos");
    setMode(cfg.official ? "official" : "authorial");
  }, [exam, cfg.official]);
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!supabase) {
        setLoading(false);
        setError("Banco indisponível.");
        return;
      }
      setLoading(true);
      setError("");
      const pp = supabase
        .from("exam_practice_questions")
        .select(
          "id,exam_id,area,skill_name,difficulty,prompt,option_a,option_b,option_c,option_d,option_e,correct_option,explanation,source_kind,source_exam_year,source_question_number,source_exam_url",
        )
        .eq("active", true)
        .eq("exam_id", exam)
        .range(0, 1499);
      let refs: O[] = [];
      if (cfg.official) {
        for (let from = 0; from < 2500; from += 500) {
          const r = await supabase
            .from("official_vestibular_question_bank")
            .select(
              "question_id,series_id,year,question_number,area,subject,skill_name,correct_option,source_pdf_url,answer_key_url,prompt_text,option_a,option_b,option_c,option_d,option_e",
            )
            .eq("series_id", exam)
            .order("year", { ascending: false })
            .order("question_number", { ascending: true })
            .range(from, from + 499);
          if (r.error) throw r.error;
          const b = (r.data ?? []) as O[];
          refs.push(...b);
          if (b.length < 500) break;
        }
        refs = refs.filter((q) =>
          exam === "enem"
            ? isEnemInteractiveQuestion(q.year, q.question_number)
            : /\.pdf(?:$|\?)/i.test(q.source_pdf_url || ""),
        );
      }
      const pr = await pp;
      if (pr.error) throw pr.error;
      if (!alive) return;
      setOfficial(refs);
      setPractice((pr.data ?? []) as P[]);
      setLoading(false);
    })().catch((e) => {
      console.error(e);
      if (alive) {
        setError("Não consegui carregar o banco agora.");
        setOfficial([]);
        setPractice([]);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [exam, cfg.official]);
  const adapted = useMemo(
      () => practice.filter((q) => q.source_kind === "official_adapted"),
      [practice],
    ),
    authorial = useMemo(
      () =>
        practice.filter((q) => !q.source_kind || q.source_kind === "authorial"),
      [practice],
    );
  const rows: any[] =
    mode === "official" ? official : mode === "adapted" ? adapted : authorial;
  const areas = useMemo(
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
            .filter((x: any) => Number.isFinite(x)),
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
        return (
          !t ||
          `${qa} ${q.skill_name || ""} ${q.subject || ""} ${q.prompt || ""} ${q.question_number || q.source_question_number || ""} ${y || ""}`
            .toLowerCase()
            .includes(t)
        );
      }),
    [rows, area, year, search, mode],
  );
  useEffect(() => setShown(100), [exam, mode, area, year, search]);
  const reset = () => {
    setSelected("");
    setCorrect(null);
    setSubmitted(false);
    setWritten("");
    setExt(null);
    setExtractError("");
    started.current = Date.now();
  };
  const close = () => {
    setAo(null);
    setAp(null);
    reset();
  };
  async function openOfficial(q: O) {
    reset();
    setAo(q);
    setAp(null);
    setExtracting(true);
    const key = `conectae:official-v8:${q.question_id}`;
    try {
      try {
        const cached = JSON.parse(sessionStorage.getItem(key) || "null");
        if (isUsableOfficialQuestion(cached)) {
          setExt(cached);
          return;
        }
      } catch {}
      let v: E | null = null;
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
      if (isUsableOfficialQuestion(stored)) v = stored;
      if (!v && q.series_id === "enem" && q.year >= 2019 && q.year <= 2023) {
        try {
          const r = await fetch(
            `/api/enem-official-questions?year=${q.year}&question=${q.question_number}`,
          );
          const d = await r.json();
          if (r.ok && isUsableOfficialQuestion(d)) v = d;
        } catch (e) {
          console.warn("structured ENEM extraction failed", e);
        }
      }
      if (
        !v &&
        q.series_id !== "cmmg" &&
        q.source_pdf_url &&
        !/download\.inep\.gov\.br/i.test(q.source_pdf_url)
      ) {
        try {
          const d = await extractOfficialQuestion(
            q.source_pdf_url,
            q.question_number,
          );
          if (isUsableOfficialQuestion(d)) v = d;
        } catch (e) {
          console.warn("local official extraction failed", e);
        }
      }
      if (!v && q.source_pdf_url) {
        try {
          const d = await extractOfficialQuestionRemotely(
            q.source_pdf_url,
            q.question_number,
            cfg.label,
            q.year,
          );
          if (isUsableOfficialQuestion(d)) v = d;
        } catch (e) {
          console.warn("remote official extraction failed", e);
        }
      }
      if (!v)
        throw new Error(
          "Não consegui carregar esta questão completa agora. Tente novamente em alguns segundos.",
        );
      if (
        v.needs_source_image &&
        !v.images?.length &&
        v.source_page &&
        q.source_pdf_url &&
        !/download\.inep\.gov\.br/i.test(q.source_pdf_url)
      ) {
        try {
          const image = await renderOfficialPdfPage(
            q.source_pdf_url,
            v.source_page,
          );
          if (image) v = { ...v, images: [image] };
        } catch (e) {
          console.warn("official source page rendering failed", e);
        }
      }
      setExt(v);
      try {
        sessionStorage.setItem(key, JSON.stringify(v));
      } catch {}
    } catch (e: any) {
      setExtractError(
        e?.message || "Não consegui carregar esta questão completa agora.",
      );
    } finally {
      setExtracting(false);
    }
  }
  const openPractice = (q: P) => {
    reset();
    setAp(q);
    setAo(null);
  };
  async function submitPractice() {
    if (!ap || submitted) return;
    if (objective(ap)) {
      if (!selected) return;
      const ans = valid(ap.correct_option)
        ? String(ap.correct_option).toUpperCase()
        : null;
      setCorrect(ans);
      setSubmitted(true);
      await saveAttempt({
        exam,
        practice: ap,
        selected,
        correct: ans,
        started: started.current,
      });
    } else {
      if (!written.trim()) return;
      setSubmitted(true);
      await saveAttempt({
        exam,
        practice: ap,
        selected: "",
        correct: null,
        started: started.current,
        written,
      });
    }
  }
  async function submitOfficial() {
    if (!ao || !selected || submitted) return;
    setAnswering(true);
    try {
      let ans = valid(ext?.correct_option)
        ? String(ext!.correct_option).toUpperCase()
        : valid(ao.correct_option)
          ? String(ao.correct_option).toUpperCase()
          : null;
      if (
        !ans &&
        ao.answer_key_url &&
        ao.series_id !== "cmmg" &&
        !/download\.inep\.gov\.br/i.test(ao.answer_key_url)
      ) {
        try {
          ans = await extractOfficialAnswer(
            ao.answer_key_url,
            ao.question_number,
          );
        } catch (e) {
          console.warn("local official answer extraction failed", e);
        }
      }
      if (!ans && ao.answer_key_url) {
        try {
          ans = await extractOfficialAnswerRemotely(
            ao.answer_key_url,
            ao.question_number,
            cfg.label,
            ao.year,
          );
        } catch (e) {
          console.warn("remote official answer extraction failed", e);
        }
      }
      setCorrect(valid(ans) ? ans : null);
      setSubmitted(true);
      await saveAttempt({
        exam,
        official: ao,
        selected,
        correct: valid(ans) ? ans : null,
        started: started.current,
      });
    } finally {
      setAnswering(false);
    }
  }
  function askAI() {
    const prompt = ao ? ext?.prompt : ap?.prompt;
    if (!prompt) return;
    window.dispatchEvent(
      new CustomEvent("conectae:tutor-open", {
        detail: {
          currentQuestion: prompt,
          currentArea: ao?.area || ap?.area || "",
          currentSkill: ao?.skill_name || ao?.subject || ap?.skill_name || "",
          currentCorrection: submitted
            ? correct
              ? `Aluno marcou ${selected}; gabarito ${correct}.`
              : ap?.explanation || "Tentativa registrada."
            : "",
        },
      }),
    );
  }
  const modal = Boolean(ao || ap),
    source: any = ao ? ext : ap,
    prompt = ao ? ext?.prompt : ap?.prompt,
    isObj = objective(source),
    ok = Boolean(submitted && correct && selected === correct);
  useEffect(() => {
    document.body.style.overflow = modal ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modal]);
  if (loading)
    return (
      <div className="grid min-h-[260px] place-items-center rounded-2xl border border-[#173765] bg-[#06152f]">
        <span className="flex items-center gap-2 text-sm font-bold text-[#9fb5d4]">
          <Loader2 size={17} className="animate-spin" />
          Carregando questões…
        </span>
      </div>
    );
  return (
    <section className="pb-8">
      <div className="mb-4">
        <div className="text-[11px] font-extrabold uppercase tracking-[.1em] text-[#72a5ff]">
          Banco de questões
        </div>
        <h1 className="mt-1 text-2xl font-extrabold md:text-3xl">
          Questões que realmente alimentam seu plano.
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-[#93a9c9]">
          Cada resposta fica registrada no seu histórico. A IA e o plano
          adaptativo usam seus acertos e erros; questões oficiais só recebem
          esse rótulo quando a fonte real é carregável.
        </p>
      </div>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
        {CFG.map((c) => (
          <button
            key={c.id}
            onClick={() => setExam(c.id)}
            className={`shrink-0 rounded-xl border px-4 py-2.5 text-sm font-extrabold ${exam === c.id ? "border-[#3479ff] bg-[#246cff]" : "border-[#234576] bg-[#071a38] text-[#a9bddc]"}`}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl border border-[#173765] bg-[#06152f] p-2">
        <button
          disabled={!cfg.official}
          onClick={() => setMode("official")}
          className={`rounded-xl px-2 py-3 text-xs font-extrabold disabled:opacity-35 ${mode === "official" ? "bg-emerald-500/15 text-emerald-200" : "text-[#9fb5d4]"}`}
        >
          Oficiais<span className="block text-lg">{official.length}</span>
        </button>
        <button
          onClick={() => setMode("adapted")}
          className={`rounded-xl px-2 py-3 text-xs font-extrabold ${mode === "adapted" ? "bg-[#0b2856]" : "text-[#9fb5d4]"}`}
        >
          Adaptadas<span className="block text-lg">{adapted.length}</span>
        </button>
        <button
          onClick={() => setMode("authorial")}
          className={`rounded-xl px-2 py-3 text-xs font-extrabold ${mode === "authorial" ? "bg-[#0b2856]" : "text-[#9fb5d4]"}`}
        >
          Estilo da prova
          <span className="block text-lg">{authorial.length}</span>
        </button>
      </div>
      {error && (
        <div className="mt-3 rounded-xl border border-rose-400/30 bg-rose-400/[.06] p-3 text-sm text-rose-100">
          {error}
        </div>
      )}
      <div className="mt-3 flex gap-2 overflow-x-auto">
        {areas.map((a) => (
          <button
            key={a}
            onClick={() => setArea(a)}
            className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-bold ${area === a ? "border-[#3479ff] bg-[#123a78]" : "border-[#203d67] bg-[#071a38] text-[#8fa7c9]"}`}
          >
            {a}
          </button>
        ))}
      </div>
      <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
        <label className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6f8ebc]"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conteúdo, matéria, ano ou número"
            className="h-11 w-full rounded-xl border border-[#234576] bg-[#071a38] pl-10 pr-3 text-sm text-white outline-none"
          />
        </label>
        {years.length > 1 && (
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="h-11 rounded-xl border border-[#234576] bg-[#071a38] px-3 text-xs font-bold text-white"
          >
            {years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        )}
      </div>
      <div className="mt-4 text-xs font-bold text-[#8fa7c9]">
        {filtered.length} questões encontradas
      </div>
      <div className="mt-3 grid gap-2.5 md:grid-cols-2">
        {filtered.slice(0, shown).map((q: any) =>
          mode === "official" ? (
            <button
              key={q.question_id}
              onClick={() => openOfficial(q)}
              className="rounded-2xl border border-emerald-400/25 bg-[#06152f] p-4 text-left"
            >
              <span className="rounded-full bg-emerald-300/10 px-2 py-1 text-[9px] font-black text-emerald-200">
                OFICIAL
              </span>
              <div className="mt-3 text-xs font-bold text-[#72a5ff]">
                {cfg.label} {q.year} · questão {q.question_number}
              </div>
              <strong className="mt-2 block text-sm">
                {q.skill_name || q.subject || q.area}
              </strong>
            </button>
          ) : (
            <button
              key={q.id}
              onClick={() => openPractice(q)}
              className="rounded-2xl border border-[#183965] bg-[#06152f] p-4 text-left"
            >
              <span className="text-[10px] text-[#708bb3]">
                nível {q.difficulty}/5
              </span>
              <strong className="mt-2 block text-sm">{q.skill_name}</strong>
              <p className="mt-2 line-clamp-2 text-xs text-[#8fa7c9]">
                {q.prompt}
              </p>
            </button>
          ),
        )}
      </div>
      {shown < filtered.length && (
        <button
          onClick={() => setShown((v) => v + 100)}
          className="mt-4 min-h-11 w-full rounded-xl border border-[#3479ff] bg-[#0b2856] text-sm font-extrabold"
        >
          Carregar mais
        </button>
      )}
      {modal && (
        <div className="fixed inset-0 z-[220] overflow-y-auto bg-[#020817] text-white">
          <div className="mx-auto min-h-full w-full max-w-3xl px-4 pb-8 pt-3">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#173765] bg-[#020817]/95 py-3">
              <strong>{cfg.label}</strong>
              <button
                onClick={close}
                className="grid h-11 w-11 place-items-center rounded-xl border border-[#234576]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="py-5">
              {extracting ? (
                <div className="grid min-h-[240px] place-items-center">
                  <Loader2 className="animate-spin" />
                </div>
              ) : extractError ? (
                <div className="rounded-xl border border-rose-400/30 p-4">
                  <p>{extractError}</p>
                  <button
                    onClick={() => ao && openOfficial(ao)}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#246cff] px-4 py-3 text-sm font-bold"
                  >
                    <RotateCcw size={15} />
                    Tentar novamente
                  </button>
                </div>
              ) : prompt && source ? (
                <>
                  <div className="text-xs font-bold text-[#72a5ff]">
                    {ao?.area || ap?.area} ·{" "}
                    {ao?.skill_name || ao?.subject || ap?.skill_name}
                  </div>
                  <h2 className="mt-3 whitespace-pre-line text-lg font-extrabold leading-relaxed">
                    {prompt}
                  </h2>
                  {Array.isArray(ext?.images) && ext.images.length > 0 && (
                    <div className="mt-4 grid gap-3">
                      {ext.images.map((src, i) => (
                        <img
                          key={`${src}-${i}`}
                          src={src}
                          alt={`Elemento visual ${i + 1} da questão`}
                          className="max-h-[520px] w-full rounded-xl border border-[#234576] bg-white object-contain"
                        />
                      ))}
                    </div>
                  )}
                  {ext?.needs_source_image && (
                    <div className="mt-3 rounded-xl border border-amber-300/25 bg-amber-300/[.06] p-3 text-xs text-amber-100">
                      {ext.image_note ||
                        "Confira também o elemento visual na prova oficial."}
                    </div>
                  )}
                  {isObj ? (
                    <div className="mt-5 grid gap-2.5">
                      {L.map((l) => {
                        const t = opt(source, l);
                        if (!t) return null;
                        const chosen = selected === l,
                          c = submitted && correct === l,
                          w = submitted && chosen && correct !== l;
                        return (
                          <button
                            key={l}
                            disabled={submitted}
                            onClick={() => setSelected(l)}
                            className={`flex min-h-14 gap-3 rounded-xl border px-4 py-3 text-left ${c ? "border-emerald-400 bg-emerald-400/10" : w ? "border-rose-400 bg-rose-400/10" : chosen ? "border-[#3479ff] bg-[#123a78]" : "border-[#234576] bg-[#071a38]"}`}
                          >
                            <strong>{l}</strong>
                            <span>{t}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <textarea
                      rows={6}
                      value={written}
                      onChange={(e) => setWritten(e.target.value)}
                      disabled={submitted}
                      placeholder="Escreva sua resposta"
                      className="mt-5 w-full rounded-xl border border-[#234576] bg-[#071a38] p-4"
                    />
                  )}
                  {!submitted ? (
                    <button
                      disabled={isObj ? !selected : !written.trim()}
                      onClick={ao ? submitOfficial : submitPractice}
                      className="mt-5 min-h-12 w-full rounded-xl bg-[#246cff] text-sm font-extrabold disabled:opacity-40"
                    >
                      {answering ? "Conferindo…" : "Confirmar resposta"}
                    </button>
                  ) : (
                    <div
                      className={`mt-5 rounded-xl border p-4 ${correct ? (ok ? "border-emerald-400/30" : "border-rose-400/30") : "border-amber-300/30"}`}
                    >
                      <div className="flex items-center gap-2 font-extrabold">
                        {correct ? (
                          ok ? (
                            <CheckCircle2 size={18} />
                          ) : (
                            <XCircle size={18} />
                          )
                        ) : (
                          <CheckCircle2 size={18} />
                        )}{" "}
                        {correct
                          ? ok
                            ? "Resposta correta"
                            : "Resposta incorreta"
                          : "Tentativa registrada"}
                      </div>
                      {correct && (
                        <p className="mt-2 text-sm">
                          Gabarito: <strong>{correct}</strong>
                        </p>
                      )}
                      {ap?.explanation && (
                        <p className="mt-2 whitespace-pre-line text-sm text-[#a9bddc]">
                          {ap.explanation}
                        </p>
                      )}
                    </div>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={askAI}
                      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0b2856] px-4 text-xs font-extrabold"
                    >
                      <Bot size={15} />
                      Perguntar à IA
                    </button>
                    {ao?.source_pdf_url && (
                      <a
                        href={ao.source_pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#234576] px-4 text-xs font-bold"
                      >
                        <ExternalLink size={14} />
                        Fonte oficial
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
