import { useEffect, useState } from 'react';
import { BookOpenCheck, Database, Landmark, ShieldCheck, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type ProofStats = {
  cutoffs: number;
  practice: number;
  booklets: number;
  mappings: number;
  areas: number;
  universityRows: number;
};

const AUDITED_FALLBACK: ProofStats = {
  cutoffs: 35,
  practice: 559,
  booklets: 16,
  mappings: 1480,
  areas: 50,
  universityRows: 1000,
};

const fmt = (value: number) => new Intl.NumberFormat('pt-BR').format(value);

export default function CourseDataProof({ compact = false }: { compact?: boolean }) {
  const [stats, setStats] = useState<ProofStats>(AUDITED_FALLBACK);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!supabase) return;
      try {
        const [cutoffs, practice, booklets, mappings, areas, universityRows] = await Promise.all([
          supabase.from('admission_cutoff_references').select('*', { count: 'exact', head: true }),
          supabase.from('exam_practice_questions').select('*', { count: 'exact', head: true }).eq('active', true),
          supabase.from('official_exam_booklets').select('*', { count: 'exact', head: true }),
          supabase.from('official_exam_item_booklet_map').select('*', { count: 'exact', head: true }),
          supabase.from('academic_areas').select('*', { count: 'exact', head: true }),
          supabase.from('area_universities').select('*', { count: 'exact', head: true }),
        ]);
        const values = [cutoffs, practice, booklets, mappings, areas, universityRows];
        if (values.some((result) => result.error || typeof result.count !== 'number')) return;
        if (!active) return;
        setStats({
          cutoffs: cutoffs.count ?? AUDITED_FALLBACK.cutoffs,
          practice: practice.count ?? AUDITED_FALLBACK.practice,
          booklets: booklets.count ?? AUDITED_FALLBACK.booklets,
          mappings: mappings.count ?? AUDITED_FALLBACK.mappings,
          areas: areas.count ?? AUDITED_FALLBACK.areas,
          universityRows: universityRows.count ?? AUDITED_FALLBACK.universityRows,
        });
        setLive(true);
      } catch {
        // Keep the last audited snapshot if public counting is unavailable.
      }
    })();
    return () => { active = false; };
  }, []);

  const cards = [
    { icon: Landmark, value: fmt(stats.cutoffs), label: 'referências oficiais de corte', detail: 'Metas ancoradas em fontes institucionais, não em números genéricos.' },
    { icon: BookOpenCheck, value: fmt(stats.practice), label: 'questões ativas no treino', detail: 'Banco usado para prática, diagnóstico e recuperação por área.' },
    { icon: Database, value: fmt(stats.mappings), label: 'respostas oficiais mapeadas', detail: `${fmt(stats.booklets)} cadernos oficiais do ENEM 2024/2025 com correção automática.` },
    { icon: Sparkles, value: fmt(stats.universityRows), label: 'combinações curso–faculdade', detail: `${fmt(stats.areas)} áreas/cursos estruturados no catálogo acadêmico.` },
  ];

  if (compact) {
    return (
      <div className="mx-auto max-w-[1240px] px-3 pt-3 md:px-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-[#173765] bg-[#06152f]/85 px-4 py-3 text-[11px] font-bold text-[#9fb5d4] shadow-lg shadow-black/10">
          <span className="inline-flex items-center gap-1.5 text-emerald-200"><ShieldCheck size={14}/>Base de inteligência verificada</span>
          <span>{fmt(stats.cutoffs)} cortes oficiais</span>
          <span>{fmt(stats.mappings)} respostas de gabarito</span>
          <span>{fmt(stats.practice)} questões ativas</span>
          <span className="ml-auto text-[#6f89ad]">{live ? 'dados carregados da base agora' : 'último snapshot auditado'}</span>
        </div>
      </div>
    );
  }

  return (
    <section className="border-y border-white/5 bg-[#030d20]">
      <div className="mx-auto max-w-7xl px-5 py-14 md:px-8 md:py-20">
        <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/[.07] px-3 py-1.5 text-xs font-extrabold text-emerald-200"><ShieldCheck className="h-4 w-4"/>BASE AUDITADA</div>
            <h2 className="mt-5 text-3xl font-black tracking-[-.045em] md:text-5xl">Profundidade que aparece nos dados, não só no design.</h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#9fb5d4] md:text-base">O Curso cruza estrutura de prova, referências oficiais, desempenho do aluno, banco de questões e histórico de erros. Quando um dado não é confiável, o produto deve mostrar incerteza em vez de inventar precisão.</p>
            <div className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-[#6f89ad]"><Database className="h-4 w-4"/>{live ? 'Contagens carregadas da base em tempo real.' : 'Exibindo o último snapshot técnico auditado.'}</div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {cards.map(({ icon: Icon, value, label, detail }) => (
              <article key={label} className="group rounded-[22px] border border-[#173765] bg-gradient-to-b from-[#071a38] to-[#051127] p-5 shadow-xl shadow-black/15 transition duration-300 hover:-translate-y-1 hover:border-[#31588e]">
                <div className="flex items-start justify-between gap-4"><div><div className="text-3xl font-black tracking-[-.04em] text-white">{value}</div><div className="mt-1 text-xs font-extrabold uppercase tracking-[.09em] text-[#72a5ff]">{label}</div></div><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#246cff]/12 text-[#72a5ff]"><Icon className="h-5 w-5"/></span></div>
                <p className="mt-4 text-xs leading-6 text-[#8fa8c9]">{detail}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
