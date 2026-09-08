import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Brain,
  CheckCircle2,
  Clock3,
  Eye,
  Gauge,
  Loader2,
  MessageCircleQuestion,
  MousePointerClick,
  Target,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Period = '3hours' | 'today' | '7days' | '30days' | '90days' | 'total';

type TrafficStats = {
  page_views: number;
  visitors: number;
  sessions: number;
  engaged_visitors: number;
  registrations: number;
  active_registered_users: number;
};

type ImpactStats = {
  questions_answered: number;
  questions_correct: number;
  accuracy_pct: number;
  students_practicing: number;
  ai_interactions: number;
  students_using_ai: number;
  ai_feedback_total: number;
  ai_helpful_feedback: number;
  ai_helpful_pct: number;
  plan_weeks_started: number;
  plan_sessions_completed: number;
  students_using_plans: number;
  mock_exams_completed: number;
  tracked_study_minutes: number;
  measurable_improvement_users: number;
  improved_users: number;
  improved_users_pct: number;
  avg_improvement_pp: number;
  questions_per_practicing_student: number;
  breakdown: Array<{ exam_id: string; answered: number; correct: number; accuracy_pct: number }>;
};

const labels: Record<string, string> = {
  enem: 'ENEM',
  cmmg: 'CMMG',
  insper: 'Insper',
  link: 'Link',
  fuvest: 'FUVEST',
  official_exam: 'Provas oficiais',
};

function sinceFor(period: Period): string | null {
  if (period === 'total') return null;
  if (period === '3hours') return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
  if (period === 'today') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return start.toISOString();
  }
  const days = period === '7days' ? 7 : period === '30days' ? 30 : 90;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function MetricCard({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string | number; note?: string }) {
  return (
    <div className="glass rounded-2xl border border-ink-800 p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">{icon}</div>
      <div className="text-2xl font-bold text-ink-100">{value}</div>
      <div className="mt-1 text-xs font-medium text-ink-400">{label}</div>
      {note ? <div className="mt-2 text-[11px] leading-relaxed text-ink-600">{note}</div> : null}
    </div>
  );
}

export default function AdminImpact() {
  const [period, setPeriod] = useState<Period>('today');
  const [stats, setStats] = useState<ImpactStats | null>(null);
  const [traffic, setTraffic] = useState<TrafficStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!supabase) return;
      setLoading(true);
      setError(null);
      const since = sinceFor(period);
      const [impactResult, trafficResult] = await Promise.all([
        supabase.rpc('get_admin_impact_stats', { p_since: since }),
        supabase.rpc('get_admin_traffic_stats', { p_since: since }),
      ]);
      if (!active) return;

      if (impactResult.error || trafficResult.error) {
        console.error('Failed to load admin analytics', impactResult.error ?? trafficResult.error);
        setError('Não foi possível carregar as métricas administrativas.');
        setStats(null);
        setTraffic(null);
      } else {
        setStats(impactResult.data as ImpactStats);
        setTraffic(trafficResult.data as unknown as TrafficStats);
      }
      setLoading(false);
    })();
    return () => { active = false; };
  }, [period]);

  const studyHours = useMemo(() => stats ? Math.round((stats.tracked_study_minutes / 60) * 10) / 10 : 0, [stats]);
  const engagementRate = useMemo(
    () => traffic && traffic.visitors > 0 ? Math.round((traffic.engaged_visitors / traffic.visitors) * 100) : 0,
    [traffic],
  );
  const signupRate = useMemo(
    () => traffic && traffic.visitors > 0 ? Math.round((traffic.registrations / traffic.visitors) * 100) : 0,
    [traffic],
  );

  return (
    <section>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-brand-400">
            <TrendingUp className="h-4 w-4" /> Analytics e impacto
          </div>
          <h2 className="text-2xl font-black tracking-tight text-ink-50">Tráfego, uso real e impacto do Conectaê</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-500">
            Visitantes e sessões vêm do rastreamento próprio do Conectaê. Uso real exclui simples pageviews e abertura de sessão.
          </p>
        </div>
        <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-ink-800 bg-ink-900/60 p-1">
          {(['3hours', 'today', '7days', '30days', '90days', 'total'] as Period[]).map((item) => (
            <button key={item} onClick={() => setPeriod(item)} className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${period === item ? 'bg-brand-500 text-ink-950' : 'text-ink-400 hover:text-ink-200'}`}>
              {item === '3hours' ? '3 horas' : item === 'today' ? 'Hoje' : item === '7days' ? '7 dias' : item === '30days' ? '30 dias' : item === '90days' ? '90 dias' : 'Total'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand-400" /></div>
      ) : error || !stats || !traffic ? (
        <div className="glass rounded-2xl border border-amber-500/25 p-6 text-sm text-amber-300">{error ?? 'Sem dados disponíveis.'}</div>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-200">
            <Activity className="h-4 w-4 text-brand-400" /> Tráfego e funil
          </div>
          <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <MetricCard icon={<Users className="h-5 w-5" />} label="Visitantes únicos" value={traffic.visitors.toLocaleString('pt-BR')} note="Pessoa anônima persistente neste navegador" />
            <MetricCard icon={<Activity className="h-5 w-5" />} label="Sessões" value={traffic.sessions.toLocaleString('pt-BR')} note="Nova sessão por aba/sessão de navegação" />
            <MetricCard icon={<Eye className="h-5 w-5" />} label="Visualizações" value={traffic.page_views.toLocaleString('pt-BR')} note="Pageviews internos registrados" />
            <MetricCard icon={<MousePointerClick className="h-5 w-5" />} label="Interagiram" value={traffic.engaged_visitors.toLocaleString('pt-BR')} note="Fizeram algo além de apenas abrir o site" />
            <MetricCard icon={<UserPlus className="h-5 w-5" />} label="Novos cadastros" value={traffic.registrations.toLocaleString('pt-BR')} note={`${signupRate}% dos visitantes no período`} />
            <MetricCard icon={<CheckCircle2 className="h-5 w-5" />} label="Cadastrados ativos" value={traffic.active_registered_users.toLocaleString('pt-BR')} note="Logados com ação real registrada" />
          </div>

          <div className="mb-8 rounded-2xl border border-brand-500/20 bg-brand-500/5 p-4 text-sm text-ink-400">
            <strong className="text-ink-200">Engajamento real:</strong> {engagementRate}% dos visitantes fizeram alguma ação rastreada além de abrir/navegar pelo site.
          </div>

          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-ink-200">
            <TrendingUp className="h-4 w-4 text-brand-400" /> Aprendizagem e uso do produto
          </div>
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricCard icon={<BarChart3 className="h-5 w-5" />} label="Questões respondidas" value={stats.questions_answered.toLocaleString('pt-BR')} note={`${stats.students_practicing} aluno(s) praticando`} />
            <MetricCard icon={<CheckCircle2 className="h-5 w-5" />} label="Questões acertadas" value={stats.questions_correct.toLocaleString('pt-BR')} note={`${stats.accuracy_pct}% de acerto geral`} />
            <MetricCard icon={<MessageCircleQuestion className="h-5 w-5" />} label="Interações com a IA" value={stats.ai_interactions.toLocaleString('pt-BR')} note={`${stats.students_using_ai} aluno(s) usaram a IA`} />
            <MetricCard icon={<Target className="h-5 w-5" />} label="Sessões do plano concluídas" value={stats.plan_sessions_completed.toLocaleString('pt-BR')} note={`${stats.plan_weeks_started} semana(s) de plano iniciadas`} />
            <MetricCard icon={<Gauge className="h-5 w-5" />} label="Precisão média" value={`${stats.accuracy_pct}%`} note={`${stats.questions_per_practicing_student} questões por aluno praticante`} />
            <MetricCard icon={<Brain className="h-5 w-5" />} label="Ajuda da IA avaliada como útil" value={stats.ai_feedback_total ? `${stats.ai_helpful_pct}%` : '—'} note={stats.ai_feedback_total ? `${stats.ai_helpful_feedback} de ${stats.ai_feedback_total} avaliações` : 'Ainda sem feedback suficiente'} />
            <MetricCard icon={<Clock3 className="h-5 w-5" />} label="Horas de estudo rastreadas" value={studyHours.toLocaleString('pt-BR')} note="Somente atividades com duração registrada" />
            <MetricCard icon={<Users className="h-5 w-5" />} label="Simulados/resultados concluídos" value={stats.mock_exams_completed.toLocaleString('pt-BR')} note="Provas oficiais + resultados de simulados registrados" />
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-2">
            <div className="glass rounded-2xl border border-ink-800 p-6">
              <h3 className="mb-2 flex items-center gap-2 font-bold text-ink-100"><TrendingUp className="h-5 w-5 text-amber-400" /> Evolução mensurável</h3>
              {stats.measurable_improvement_users > 0 ? (
                <>
                  <div className="mt-5 text-4xl font-black text-ink-50">{stats.improved_users_pct}%</div>
                  <p className="mt-1 text-sm text-ink-400">dos alunos com pelo menos 10 questões melhoraram entre as 5 primeiras e as 5 últimas tentativas.</p>
                  <div className="mt-4 rounded-xl bg-ink-800/50 p-4">
                    <div className="text-xs uppercase tracking-wider text-ink-500">Variação média da amostra</div>
                    <div className={`mt-1 text-xl font-bold ${stats.avg_improvement_pp >= 0 ? 'text-amber-400' : 'text-amber-400'}`}>{stats.avg_improvement_pp > 0 ? '+' : ''}{stats.avg_improvement_pp} p.p.</div>
                    <div className="mt-1 text-xs text-ink-600">Amostra: {stats.measurable_improvement_users} aluno(s)</div>
                  </div>
                </>
              ) : (
                <p className="mt-4 text-sm leading-relaxed text-ink-500">Ainda não há alunos com 10+ tentativas no período. A métrica aparecerá automaticamente quando houver amostra suficiente.</p>
              )}
            </div>

            <div className="glass rounded-2xl border border-ink-800 p-6">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-ink-100"><BarChart3 className="h-5 w-5 text-brand-400" /> Desempenho por prova</h3>
              {stats.breakdown.length === 0 ? <p className="text-sm text-ink-500">Nenhuma questão rastreada no período.</p> : (
                <div className="space-y-4">
                  {stats.breakdown.slice(0, 8).map((item) => (
                    <div key={item.exam_id}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold text-ink-200">{labels[item.exam_id] ?? item.exam_id.toUpperCase()}</span>
                        <span className="text-ink-500">{item.answered} questões · {item.accuracy_pct}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-ink-800"><div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400" style={{ width: `${Math.max(0, Math.min(100, item.accuracy_pct))}%` }} /></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-brand-500/20 bg-brand-500/5 p-5 text-sm leading-relaxed text-ink-400">
            <strong className="text-ink-200">Como ler:</strong> “Interagiram” exclui pageviews e abertura de sessão. “Interações com IA” não significa automaticamente “dúvidas resolvidas”; o indicador de utilidade só usa feedback explícito do aluno. “Evolução” só aparece com amostra mínima de 10 questões por aluno.
          </div>
        </>
      )}
    </section>
  );
}