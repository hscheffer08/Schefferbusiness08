import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileCheck2,
  GraduationCap,
  ListChecks,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import UFMGSeriadoCore from './UFMGSeriadoCore';
import { UFMG_OFFICIAL_2025 } from '@/lib/ufmg-seriado-data';
import {
  UFMG_OFFICIAL_AREA_BLOCKS,
  UFMG_PERSONAL_SUBJECTS,
  UFMG_WORKS_BY_YEAR,
  UFMG_YEAR_INFO,
  type UFMGPersonalArea,
  type UFMGStudentYear,
} from '@/lib/ufmg-seriado-personalization';

type SavedProfile = {
  year: UFMGStudentYear;
  targetScore: number;
  weeklyHours: number;
  grades: Record<string, number>;
};

const storageKey = 'conectae:ufmg-personal-profile-v1';

const areaQuestionShare: Record<UFMGPersonalArea, number> = {
  Linguagens: 14,
  Matemática: 9,
  Natureza: 12,
  Humanas: 10,
};

function makeDefaultGrades() {
  return Object.fromEntries(UFMG_PERSONAL_SUBJECTS.map((subject) => [subject.id, 7])) as Record<string, number>;
}

function readProfile(): SavedProfile | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedProfile;
    if (![1, 2, 3].includes(parsed.year)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function openExternal(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

function priorityLabel(grade: number, targetScore: number) {
  if (grade <= 5 || targetScore >= 90) return 'Prioridade alta';
  if (grade <= 7) return 'Prioridade média';
  return 'Manutenção';
}

export default function UFMGSeriadoHub({ onBack }: { onBack: () => void }) {
  const saved = useMemo(() => readProfile(), []);
  const [showCore, setShowCore] = useState(false);
  const [year, setYear] = useState<UFMGStudentYear>(saved?.year ?? 1);
  const [targetScore, setTargetScore] = useState(saved?.targetScore ?? 80);
  const [weeklyHours, setWeeklyHours] = useState(saved?.weeklyHours ?? 8);
  const [grades, setGrades] = useState<Record<string, number>>(() => ({ ...makeDefaultGrades(), ...(saved?.grades ?? {}) }));
  const [generated, setGenerated] = useState(Boolean(saved));

  const yearInfo = UFMG_YEAR_INFO[year];
  const works = UFMG_WORKS_BY_YEAR[year] ?? [];

  const priorities = useMemo(() => {
    const scored = UFMG_PERSONAL_SUBJECTS.map((subject) => {
      const grade = clamp(grades[subject.id] ?? 7, 0, 10);
      const gradeGap = 10 - grade;
      const areaWeight = areaQuestionShare[subject.area] / 14;
      const ambition = targetScore / 100;
      const score = gradeGap * 2.2 + areaWeight * 1.2 + ambition;
      return { ...subject, grade, score };
    }).sort((a, b) => b.score - a.score);

    const top = scored.slice(0, 6);
    const needTotal = top.reduce((sum, item) => sum + Math.max(1, 10 - item.grade), 0);
    return top.map((item) => ({
      ...item,
      hours: Math.max(0.5, (weeklyHours * Math.max(1, 10 - item.grade)) / needTotal),
    }));
  }, [grades, targetScore, weeklyHours]);

  const areaPriorities = useMemo(() => {
    const areas: UFMGPersonalArea[] = ['Linguagens', 'Matemática', 'Natureza', 'Humanas'];
    return areas
      .map((area) => {
        const subjects = UFMG_PERSONAL_SUBJECTS.filter((subject) => subject.area === area);
        const avg = subjects.reduce((sum, subject) => sum + (grades[subject.id] ?? 7), 0) / subjects.length;
        return { area, avg };
      })
      .sort((a, b) => a.avg - b.avg);
  }, [grades]);

  const saveAndGenerate = () => {
    const profile: SavedProfile = {
      year,
      targetScore: clamp(targetScore, 0, 100),
      weeklyHours: clamp(weeklyHours, 1, 40),
      grades,
    };
    localStorage.setItem(storageKey, JSON.stringify(profile));
    setTargetScore(profile.targetScore);
    setWeeklyHours(profile.weeklyHours);
    setGenerated(true);
  };

  const reset = () => {
    localStorage.removeItem(storageKey);
    setYear(1);
    setTargetScore(80);
    setWeeklyHours(8);
    setGrades(makeDefaultGrades());
    setGenerated(false);
  };

  if (showCore) {
    return <UFMGSeriadoCore onBack={() => setShowCore(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#020817] text-white font-['Plus_Jakarta_Sans']">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[#020817]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 md:px-8">
          <button onClick={onBack} className="inline-flex items-center gap-2 rounded-xl border border-[#173765] bg-[#06152f] px-3 py-2 text-sm font-extrabold text-[#c4d4ea] hover:border-[#31588e]">
            <ArrowLeft className="h-4 w-4" /> Voltar ao curso
          </button>
          <div className="text-center">
            <div className="text-xs font-black uppercase tracking-[.16em] text-[#72a5ff]">Conectaê • Curso</div>
            <div className="text-base font-black md:text-lg">Seriado UFMG</div>
          </div>
          <button onClick={() => setShowCore(true)} className="rounded-xl bg-[#246cff] px-3 py-2 text-xs font-black hover:bg-[#3678ff] md:text-sm">
            Banco completo
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-7 px-4 py-8 md:px-8 md:py-12">
        <section className="overflow-hidden rounded-[30px] border border-[#173765] bg-gradient-to-br from-[#0b2856] via-[#071a38] to-[#06152f] p-6 md:p-9">
          <div className="grid gap-7 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs font-black text-emerald-200">
                <Sparkles className="h-4 w-4" /> Plano personalizado para o Seriado UFMG
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-[-.05em] md:text-6xl">
                Seu ano, sua nota-meta e suas dificuldades viram uma <span className="text-[#72a5ff]">rota de estudo.</span>
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#b4c6df] md:text-lg">
                A Etapa 1 e a Etapa 2 não usam o mesmo foco: a primeira trabalha o 1º ano; a segunda é cumulativa, mas avança predominantemente sobre o 2º ano. O plano abaixo muda conteúdos e prioridades conforme a etapa.
              </p>
            </div>
            <div className="rounded-2xl border border-[#31588e] bg-[#041027]/80 p-5">
              <div className="text-xs font-black uppercase tracking-[.14em] text-[#72a5ff]">Referência oficial mais recente</div>
              <div className="mt-2 text-xl font-black">Prova UFMG 2025 • Etapa 1</div>
              <div className="mt-2 text-sm leading-relaxed text-[#a9bddc]">45 objetivas + 1 discursiva • 4 horas. É a última prova oficial disponível antes das provas de dezembro de 2026.</div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => openExternal(UFMG_OFFICIAL_2025.examUrl)} className="inline-flex items-center gap-2 rounded-xl bg-[#246cff] px-3 py-2 text-xs font-black"><FileCheck2 className="h-4 w-4" /> Abrir prova</button>
                <button onClick={() => setShowCore(true)} className="inline-flex items-center gap-2 rounded-xl border border-[#31588e] bg-[#071a38] px-3 py-2 text-xs font-black text-[#c4d4ea]"><ListChecks className="h-4 w-4" /> Fazer com correção</button>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[#173765] bg-[#06152f] p-5 md:p-7">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[.14em] text-[#72a5ff]">1. Sua etapa</div>
              <h2 className="mt-1 text-2xl font-black">Em qual ano você está?</h2>
            </div>
            <div className="text-xs font-bold text-[#839ab9]">Isso muda o conteúdo recomendado.</div>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {([1, 2, 3] as UFMGStudentYear[]).map((value) => {
              const info = UFMG_YEAR_INFO[value];
              const active = year === value;
              return (
                <button
                  key={value}
                  onClick={() => { setYear(value); setGenerated(false); }}
                  className={`rounded-2xl border p-4 text-left transition ${active ? 'border-[#72a5ff] bg-[#246cff]/15' : 'border-[#173765] bg-[#041027] hover:border-[#31588e]'}`}
                >
                  <div className="flex items-center justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#246cff]/15 text-[#72a5ff]"><GraduationCap className="h-5 w-5" /></span><span className="text-xs font-black text-[#72a5ff]">{info.stage}</span></div>
                  <div className="mt-3 font-black">{info.title}</div>
                  <div className="mt-1 text-xs leading-relaxed text-[#9fb5d4]">{info.officialFocus}</div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-[#173765] bg-[#041027] p-4"><div className="text-xs font-bold text-[#839ab9]">Ciclo</div><div className="mt-1 font-black">{yearInfo.cycle}</div></div>
            <div className="rounded-2xl border border-[#173765] bg-[#041027] p-4"><div className="text-xs font-bold text-[#839ab9]">Prova</div><div className="mt-1 font-black">{yearInfo.exam}</div></div>
            <div className="rounded-2xl border border-[#173765] bg-[#041027] p-4"><div className="text-xs font-bold text-[#839ab9]">Formato</div><div className="mt-1 text-sm font-black leading-relaxed">{yearInfo.format}</div></div>
          </div>
          <p className="mt-4 rounded-xl border border-amber-300/15 bg-amber-300/[.05] p-3 text-xs leading-relaxed text-amber-100">{yearInfo.notice}</p>
        </section>

        <section className="grid gap-5 lg:grid-cols-[.75fr_1.25fr]">
          <div className="rounded-[28px] border border-[#173765] bg-[#06152f] p-5 md:p-7">
            <div className="text-xs font-black uppercase tracking-[.14em] text-[#72a5ff]">2. Meta</div>
            <h2 className="mt-1 text-2xl font-black">Qual nota você busca?</h2>
            <label className="mt-5 block text-sm font-bold text-[#a9bddc]">Nota-meta da etapa (0–100)</label>
            <div className="mt-2 flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={targetScore}
                onChange={(event) => { setTargetScore(Number(event.target.value)); setGenerated(false); }}
                className="w-full accent-[#246cff]"
              />
              <input
                type="number"
                min="0"
                max="100"
                value={targetScore}
                onChange={(event) => { setTargetScore(clamp(Number(event.target.value) || 0, 0, 100)); setGenerated(false); }}
                className="w-20 rounded-xl border border-[#31588e] bg-[#041027] px-3 py-2 text-center font-black outline-none focus:border-[#72a5ff]"
              />
            </div>
            {year === 1 && <p className="mt-3 text-xs leading-relaxed text-[#839ab9]">Na Etapa 1 de 2025, 45 objetivas + discursiva somavam 49 pontos brutos e eram convertidos para 0–100. Sua meta de {targetScore} equivale a cerca de {(targetScore * 49 / 100).toFixed(1)} pontos brutos naquele formato.</p>}

            <label className="mt-6 block text-sm font-bold text-[#a9bddc]">Horas de estudo por semana</label>
            <div className="mt-2 flex items-center gap-3">
              <input type="range" min="1" max="40" value={weeklyHours} onChange={(event) => { setWeeklyHours(Number(event.target.value)); setGenerated(false); }} className="w-full accent-[#246cff]" />
              <div className="min-w-20 rounded-xl border border-[#31588e] bg-[#041027] px-3 py-2 text-center font-black">{weeklyHours}h</div>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#173765] bg-[#06152f] p-5 md:p-7">
            <div className="flex items-end justify-between gap-3">
              <div><div className="text-xs font-black uppercase tracking-[.14em] text-[#72a5ff]">3. Notas atuais</div><h2 className="mt-1 text-2xl font-black">Como você está em cada matéria?</h2></div>
              <div className="text-xs font-bold text-[#839ab9]">0 a 10</div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {UFMG_PERSONAL_SUBJECTS.map((subject) => (
                <label key={subject.id} className="rounded-2xl border border-[#173765] bg-[#041027] p-3">
                  <div className="flex items-center justify-between gap-2"><span className="text-sm font-black">{subject.label}</span><span className="text-[10px] font-bold text-[#839ab9]">{subject.area}</span></div>
                  <div className="mt-3 flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.5"
                      value={grades[subject.id] ?? 7}
                      onChange={(event) => { setGrades((current) => ({ ...current, [subject.id]: Number(event.target.value) })); setGenerated(false); }}
                      className="w-full accent-[#246cff]"
                    />
                    <span className="w-8 text-right text-sm font-black text-[#72a5ff]">{(grades[subject.id] ?? 7).toFixed(1)}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-[24px] border border-[#31588e] bg-[#0b2856] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><div className="font-black">Pronto para montar a rota?</div><div className="mt-1 text-sm text-[#a9bddc]">O site cruza sua etapa, nota-meta, notas escolares e o peso das áreas na última prova oficial.</div></div>
          <div className="flex gap-2">
            {saved && <button onClick={reset} className="rounded-xl border border-[#31588e] bg-[#041027] p-3 text-[#a9bddc]" title="Limpar perfil"><RotateCcw className="h-4 w-4" /></button>}
            <button onClick={saveAndGenerate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#246cff] px-5 py-3 text-sm font-black shadow-lg shadow-[#246cff]/20 hover:bg-[#3678ff]"><Target className="h-4 w-4" /> Gerar meu plano</button>
          </div>
        </section>

        {generated && (
          <>
            <section className="rounded-[30px] border border-emerald-300/20 bg-emerald-300/[.06] p-6 md:p-8">
              <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.14em] text-emerald-200"><CheckCircle2 className="h-4 w-4" /> Plano gerado</div>
                  <h2 className="mt-2 text-3xl font-black">Meta {targetScore}/100 • {yearInfo.stage}</h2>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#b4c6df]">Comece pelas matérias abaixo. Quanto menor sua nota atual e maior o peso da área na prova, mais tempo ela recebe no plano.</p>
                </div>
                <div className="rounded-2xl border border-emerald-300/20 bg-[#041027] px-5 py-4"><div className="text-xs font-bold text-[#839ab9]">Carga semanal</div><div className="mt-1 text-3xl font-black text-emerald-200">{weeklyHours}h</div></div>
              </div>
            </section>

            <section>
              <div className="mb-4"><div className="text-xs font-black uppercase tracking-[.14em] text-[#72a5ff]">Sua ordem de prioridade</div><h2 className="mt-1 text-3xl font-black">O que estudar primeiro</h2></div>
              <div className="grid gap-4 lg:grid-cols-2">
                {priorities.map((item, index) => (
                  <article key={item.id} className="rounded-[24px] border border-[#173765] bg-[#06152f] p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#246cff] text-lg font-black">{index + 1}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2"><h3 className="text-xl font-black">{item.label}</h3><span className="rounded-full border border-[#31588e] px-2 py-1 text-[10px] font-black text-[#a9c7ef]">{item.area}</span></div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs font-bold text-[#9fb5d4]"><span>Nota atual: {item.grade.toFixed(1)}</span><span>•</span><span>{priorityLabel(item.grade, targetScore)}</span><span>•</span><span className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {item.hours.toFixed(1)}h/semana</span></div>
                        <div className="mt-4 rounded-2xl bg-[#041027] p-4">
                          <div className="text-[11px] font-black uppercase tracking-[.12em] text-[#72a5ff]">Conteúdo específico para {yearInfo.stage}</div>
                          <ul className="mt-3 space-y-2">{item.topicsByYear[year].map((topic) => <li key={topic} className="flex gap-2 text-sm leading-relaxed text-[#b4c6df]"><Target className="mt-0.5 h-4 w-4 shrink-0 text-[#72a5ff]" />{topic}</li>)}</ul>
                        </div>
                        <div className="mt-3 rounded-xl border border-emerald-300/15 bg-emerald-300/[.05] p-3 text-xs leading-relaxed text-emerald-100">
                          Prova oficial 2025 para diagnosticar essa área: <strong>{UFMG_OFFICIAL_AREA_BLOCKS[item.area].questions}</strong>. {year === 2 ? 'Use esse bloco para revisar a base do 1º ano, que continua valendo na Etapa 2.' : ''}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
              <div className="rounded-[28px] border border-[#173765] bg-[#06152f] p-6">
                <div className="flex items-center gap-3"><Trophy className="h-6 w-6 text-[#72a5ff]" /><div><div className="text-xs font-black uppercase tracking-[.12em] text-[#72a5ff]">Banco da última prova</div><h2 className="mt-1 text-2xl font-black">Treino oficial 2025 por área</h2></div></div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {areaPriorities.map(({ area, avg }) => (
                    <div key={area} className="rounded-2xl border border-[#173765] bg-[#041027] p-4">
                      <div className="flex items-center justify-between"><span className="font-black">{area}</span><span className="text-xs font-black text-[#72a5ff]">média {avg.toFixed(1)}</span></div>
                      <div className="mt-2 text-sm text-[#a9bddc]">{UFMG_OFFICIAL_AREA_BLOCKS[area].questions} • {UFMG_OFFICIAL_AREA_BLOCKS[area].count} questões</div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button onClick={() => setShowCore(true)} className="inline-flex items-center gap-2 rounded-xl bg-[#246cff] px-4 py-3 text-sm font-black"><ListChecks className="h-4 w-4" /> Fazer prova com gabarito interativo</button>
                  <button onClick={() => openExternal(UFMG_OFFICIAL_2025.finalKeyUrl)} className="inline-flex items-center gap-2 rounded-xl border border-[#31588e] bg-[#041027] px-4 py-3 text-sm font-black text-[#c4d4ea]">Gabarito final <ExternalLink className="h-4 w-4" /></button>
                </div>
              </div>

              <div className="rounded-[28px] border border-[#173765] bg-[#06152f] p-6">
                <div className="flex items-center gap-3"><BookOpen className="h-6 w-6 text-amber-200" /><div><div className="text-xs font-black uppercase tracking-[.12em] text-amber-200">Obras de 2026</div><h2 className="mt-1 text-2xl font-black">{yearInfo.stage}</h2></div></div>
                {works.length > 0 ? (
                  <div className="mt-5 space-y-3">{works.map((work) => <div key={work.title} className="rounded-2xl border border-amber-300/10 bg-[#041027] p-4"><div className="text-[10px] font-black uppercase tracking-[.12em] text-amber-200">{work.type}</div><div className="mt-1 font-black">{work.title}</div><div className="mt-1 text-sm text-[#9fb5d4]">{work.creator}</div></div>)}</div>
                ) : (
                  <p className="mt-5 rounded-2xl bg-[#041027] p-4 text-sm leading-relaxed text-[#a9bddc]">Para a Etapa 3, acompanhe as obras e áreas específicas publicadas pela UFMG para o ciclo correspondente.</p>
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-[#173765] bg-[#06152f] p-6 md:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div><div className="text-xs font-black uppercase tracking-[.14em] text-[#72a5ff]">Próximo passo</div><h2 className="mt-1 text-3xl font-black">Use o banco completo do Seriado</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#a9bddc]">Lá estão a prova oficial 2025 incorporada, folha de respostas, correção automática, questões autorais, discursivas, obras e plano de 8 semanas.</p></div>
                <button onClick={() => setShowCore(true)} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#246cff] px-6 py-4 text-sm font-black"><ListChecks className="h-5 w-5" /> Abrir preparação completa</button>
              </div>
            </section>

            <p className="pb-3 text-center text-xs leading-relaxed text-[#637b9c]">A UFMG organiza o Documento Norteador por competências e habilidades de cada etapa. O Conectaê transforma essa progressão em frentes de estudo; não apresenta uma lista de capítulos como se fosse uma divisão oficial rígida por escola.</p>
          </>
        )}
      </main>
    </div>
  );
}
