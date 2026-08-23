import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Shield, Users, Trophy, TrendingUp, Percent, DollarSign, Loader2, BarChart3, Share2, Gift, FileText, ChevronDown, ChevronRight, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { AdminSettings } from '@/types';
import { getAdminSettings, getConsentStats } from '@/lib/api';
import ReferralAdmin from '@/components/ReferralAdmin';

interface AdminSession {
  session_id: string;
  user_id: string | null;
  email: string | null;
  display_name: string | null;
  completed_at: string | null;
  consent_given: boolean;
  answer_count: number;
}

interface AdminAnswer {
  question_id: string;
  question_text: string | null;
  answer_value: string;
  created_at: string;
}

interface AdminProps {
  onBack: () => void;
}

interface DashboardStats {
  totalVisitors: number;
  totalUsers: number;
  quizzesStarted: number;
  quizzesCompleted: number;
  matchesGenerated: number;
  topUniversities: { name: string; count: number }[];
  recentEvents: { event_type: string; created_at: string }[];
  consentAccepted: number;
  consentDeclined: number;
  consentRevoked: number;
  consentTotal: number;
  consentByScope: { scope: string; count: number }[];
}

type FilterPeriod = 'today' | '7days' | '30days' | 'total';

export default function Admin({ onBack }: AdminProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<FilterPeriod>('30days');
  const [savingSettings, setSavingSettings] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminTab, setAdminTab] = useState<'dashboard' | 'referrals' | 'answers'>('dashboard');

  const loadStats = useCallback(async (p: FilterPeriod) => {
    if (!supabase) return;
    setLoading(true);

    let startDate: string | null = null;
    if (p === 'today') {
      startDate = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
    } else if (p === '7days') {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (p === '30days') {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    }


    const [visitorsRes, usersRes, startedRes, completedRes, matchesRes, topUniRes, recentRes] = await Promise.all([
      startDate
        ? supabase.from('analytics_events').select('session_id', { count: 'exact', head: false }).gte('created_at', startDate)
        : supabase.from('analytics_events').select('session_id', { count: 'exact', head: false }),
      startDate
        ? supabase.from('user_profiles').select('*', { count: 'exact', head: true }).gte('created_at', startDate)
        : supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
      startDate
        ? supabase.from('analytics_events').select('*', { count: 'exact', head: true }).eq('event_type', 'match_started').gte('created_at', startDate)
        : supabase.from('analytics_events').select('*', { count: 'exact', head: true }).eq('event_type', 'match_started'),
      startDate
        ? supabase.from('analytics_events').select('*', { count: 'exact', head: true }).eq('event_type', 'match_completed').gte('created_at', startDate)
        : supabase.from('analytics_events').select('*', { count: 'exact', head: true }).eq('event_type', 'match_completed'),
      startDate
        ? supabase.from('match_history').select('*', { count: 'exact', head: true }).gte('created_at', startDate)
        : supabase.from('match_history').select('*', { count: 'exact', head: true }),
      startDate
        ? supabase.from('match_history').select('top_university_name').gte('created_at', startDate)
        : supabase.from('match_history').select('top_university_name'),
      startDate
        ? supabase.from('analytics_events').select('event_type, created_at').order('created_at', { ascending: false }).limit(20).gte('created_at', startDate)
        : supabase.from('analytics_events').select('event_type, created_at').order('created_at', { ascending: false }).limit(20),
    ]);

    const topUniMap = new Map<string, number>();
    (topUniRes.data ?? []).forEach((row: { top_university_name: string }) => {
      topUniMap.set(row.top_university_name, (topUniMap.get(row.top_university_name) ?? 0) + 1);
    });
    const topUniversities = Array.from(topUniMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);

    const consentStats = await getConsentStats(startDate);

    const uniqueSessions = new Set(
      (visitorsRes.data ?? []).map((row: { session_id: string }) => row.session_id)
    ).size;

    setStats({
      totalVisitors: uniqueSessions,
      totalUsers: usersRes.count ?? 0,
      quizzesStarted: startedRes.count ?? 0,
      quizzesCompleted: completedRes.count ?? 0,
      matchesGenerated: matchesRes.count ?? 0,
      topUniversities,
      recentEvents: recentRes.data ?? [],
      consentAccepted: consentStats.accepted,
      consentDeclined: consentStats.declined,
      consentRevoked: consentStats.revoked,
      consentTotal: consentStats.total,
      consentByScope: consentStats.byScope,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    // Only app_metadata is trusted here. user_metadata is writable by the account
    // holder via the Auth API, so reading a role from it would let anyone self-promote.
    const role = user?.app_metadata?.role as string | undefined;
    if (role !== 'admin') {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    setIsAdmin(true);
    loadStats(period);
    getAdminSettings().then((s) => setSettings(s));
  }, [user, period, loadStats]);

  const handleSaveSettings = async () => {
    if (!supabase || !settings) return;
    setSavingSettings(true);
    const { error } = await supabase
      .from('admin_settings')
      .update({
        payments_enabled: settings.payments_enabled,
        price_brl: settings.price_brl,
        free_period_active: settings.free_period_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1);
    if (!error) setSettings(settings);
    setSavingSettings(false);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <Shield className="w-10 h-10 text-ink-600 mx-auto mb-4" />
          <p className="text-ink-300 text-lg mb-2">Acesso restrito</p>
          <p className="text-ink-500 text-sm mb-6">Você não tem permissão para acessar o painel administrativo.</p>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-ink-950 font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const completionRate = stats && stats.quizzesStarted > 0
    ? Math.round((stats.quizzesCompleted / stats.quizzesStarted) * 100)
    : 0;
  const conversionToSignup = stats && stats.totalVisitors > 0
    ? Math.round((stats.totalUsers / stats.totalVisitors) * 100)
    : 0;
  const conversionToMatch = stats && stats.totalUsers > 0
    ? Math.round((stats.matchesGenerated / stats.totalUsers) * 100)
    : 0;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] rounded-full bg-brand-500/10 blur-[130px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-brand-400" />
          <span className="font-bold text-lg tracking-tight">Painel Admin</span>
        </div>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-ink-800 hover:bg-ink-700 text-ink-200 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Sair
        </button>
      </header>

      {/* Tab switcher */}
      <div className="relative z-10 px-6 md:px-12 max-w-5xl mx-auto mb-6">
        <div className="flex gap-1 p-1 rounded-xl bg-ink-900/60 border border-ink-800 w-fit">
          <button
            onClick={() => setAdminTab('dashboard')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              adminTab === 'dashboard' ? 'bg-brand-500 text-ink-950' : 'text-ink-400 hover:text-ink-200'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setAdminTab('referrals')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              adminTab === 'referrals' ? 'bg-brand-500 text-ink-950' : 'text-ink-400 hover:text-ink-200'
            }`}
          >
            <Gift className="w-4 h-4" />
            Indicações
          </button>
          <button
            onClick={() => setAdminTab('answers')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              adminTab === 'answers' ? 'bg-brand-500 text-ink-950' : 'text-ink-400 hover:text-ink-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Respostas
          </button>
        </div>
      </div>

      <main className="relative z-10 px-6 md:px-12 max-w-5xl mx-auto pb-20">
        {adminTab === 'referrals' ? (
          <ReferralAdmin />
        ) : adminTab === 'answers' ? (
          <AnswersTab />
        ) : (
        <>
        {/* Period filter */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl bg-ink-900/60 border border-ink-800 w-fit">
          {(['today', '7days', '30days', 'total'] as FilterPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                period === p ? 'bg-brand-500 text-ink-950' : 'text-ink-400 hover:text-ink-200'
              }`}
            >
              {p === 'today' ? 'Hoje' : p === '7days' ? '7 dias' : p === '30days' ? '30 dias' : 'Total'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
          </div>
        ) : stats ? (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Visitantes" value={stats.totalVisitors} />
              <StatCard icon={<Users className="w-5 h-5" />} label="Usuários cadastrados" value={stats.totalUsers} />
              <StatCard icon={<BarChart3 className="w-5 h-5" />} label="Questionários iniciados" value={stats.quizzesStarted} />
              <StatCard icon={<Trophy className="w-5 h-5" />} label="Matches gerados" value={stats.matchesGenerated} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <StatCard icon={<Percent className="w-5 h-5" />} label="Taxa de conclusão" value={`${completionRate}%`} />
              <StatCard icon={<Percent className="w-5 h-5" />} label="Conversão visitante → cadastro" value={`${conversionToSignup}%`} />
              <StatCard icon={<Percent className="w-5 h-5" />} label="Conversão cadastro → match" value={`${conversionToMatch}%`} />
            </div>

            {/* Top universities */}
            <div className="glass rounded-2xl border border-ink-800 p-6 mb-8">
              <h3 className="font-bold text-ink-100 mb-4 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-accent-400" />
                Universidades mais frequentes em #1
              </h3>
              {stats.topUniversities.length === 0 ? (
                <p className="text-ink-500 text-sm">Nenhum match gerado ainda.</p>
              ) : (
                <div className="space-y-2">
                  {stats.topUniversities.map((uni, i) => {
                    const maxCount = stats.topUniversities[0].count;
                    return (
                      <div key={uni.name} className="flex items-center gap-3">
                        <span className="text-sm text-ink-500 w-6">{i + 1}.</span>
                        <span className="text-sm text-ink-200 flex-1">{uni.name}</span>
                        <div className="flex-1 h-2 rounded-full bg-ink-800 overflow-hidden max-w-[200px]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400"
                            style={{ width: `${(uni.count / maxCount) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-ink-400 w-8 text-right">{uni.count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Admin settings */}
            {settings && (
              <div className="glass rounded-2xl border border-ink-800 p-6 mb-8">
                <h3 className="font-bold text-ink-100 mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-brand-400" />
                  Configurações de pagamento
                </h3>
                <div className="space-y-4">
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-ink-300">Período gratuito ativo</span>
                    <input
                      type="checkbox"
                      checked={settings.free_period_active}
                      onChange={(e) => setSettings({ ...settings, free_period_active: e.target.checked })}
                      className="w-5 h-5 rounded accent-brand-500"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-ink-300">Pagamentos ativados</span>
                    <input
                      type="checkbox"
                      checked={settings.payments_enabled}
                      onChange={(e) => setSettings({ ...settings, payments_enabled: e.target.checked })}
                      className="w-5 h-5 rounded accent-brand-500"
                    />
                  </label>
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-ink-300">Preço (R$)</span>
                    <input
                      type="number"
                      value={settings.price_brl}
                      onChange={(e) => setSettings({ ...settings, price_brl: Number(e.target.value) })}
                      className="w-24 px-3 py-2 rounded-lg bg-ink-800 border border-ink-700 text-ink-100 focus:outline-none focus:border-brand-500"
                    />
                  </label>
                  <button
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-ink-950 font-semibold text-sm transition-colors disabled:opacity-50"
                  >
                    {savingSettings ? 'Salvando...' : 'Salvar configurações'}
                  </button>
                </div>
              </div>
            )}

            {/* Consent sharing stats */}
            <div className="glass rounded-2xl border border-ink-800 p-6 mb-8">
              <h3 className="font-bold text-ink-100 mb-4 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-brand-400" />
                Compartilhamento com faculdades
              </h3>
              {stats.consentTotal === 0 ? (
                <p className="text-ink-500 text-sm">Nenhum consentimento registrado ainda.</p>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-ink-800/40">
                      <div className="text-2xl font-bold text-green-400">{stats.consentAccepted}</div>
                      <div className="text-xs text-ink-500 mt-1">Aceitaram</div>
                    </div>
                    <div className="p-3 rounded-xl bg-ink-800/40">
                      <div className="text-2xl font-bold text-ink-300">{stats.consentDeclined}</div>
                      <div className="text-xs text-ink-500 mt-1">Recusaram</div>
                    </div>
                    <div className="p-3 rounded-xl bg-ink-800/40">
                      <div className="text-2xl font-bold text-amber-400">{stats.consentRevoked}</div>
                      <div className="text-xs text-ink-500 mt-1">Revogados</div>
                    </div>
                    <div className="p-3 rounded-xl bg-ink-800/40">
                      <div className="text-2xl font-bold text-brand-400">
                        {stats.consentTotal > 0 ? Math.round((stats.consentAccepted / stats.consentTotal) * 100) : 0}%
                      </div>
                      <div className="text-xs text-ink-500 mt-1">Taxa de opt-in</div>
                    </div>
                  </div>
                  {stats.consentByScope.length > 0 && (
                    <div>
                      <p className="text-xs text-ink-500 mb-2">Distribui&ccedil;&atilde;o por escopo:</p>
                      <div className="flex flex-wrap gap-2">
                        {stats.consentByScope.map((s) => (
                          <span key={s.scope} className="px-3 py-1.5 rounded-lg bg-ink-800 text-ink-400 text-xs">
                            {s.scope === 'all_participating' ? 'Todas participantes' : s.scope === 'my_ranking' ? 'Meu ranking' : s.scope === 'top_match' ? 'Faculdade #1' : 'Nenhum'}: {s.count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Recent events */}
            <div className="glass rounded-2xl border border-ink-800 p-6">
              <h3 className="font-bold text-ink-100 mb-4">Eventos recentes</h3>
              {stats.recentEvents.length === 0 ? (
                <p className="text-ink-500 text-sm">Nenhum evento registrado.</p>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {stats.recentEvents.map((ev, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-ink-800/50 last:border-0">
                      <span className="text-ink-300 font-mono text-xs">{ev.event_type}</span>
                      <span className="text-ink-500 text-xs">
                        {new Date(ev.created_at).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
        </>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="glass rounded-2xl border border-ink-800 p-5">
      <div className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-400 flex items-center justify-center mb-3">
        {icon}
      </div>
      <div className="text-2xl font-bold text-ink-100">{value}</div>
      <div className="text-xs text-ink-500 mt-1">{label}</div>
    </div>
  );
}

function AnswersTab() {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<AdminAnswer[]>([]);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.rpc('get_admin_sessions')
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load sessions', error);
          setError('Não foi possível carregar as respostas.');
        } else {
          setSessions((data ?? []) as AdminSession[]);
        }
        setLoading(false);
      });
  }, []);

  const toggleSession = async (sessionId: string) => {
    if (expandedId === sessionId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(sessionId);
    setLoadingAnswers(true);
    setAnswers([]);
    const { data, error } = await supabase!.rpc('get_admin_session_answers', { p_session_id: sessionId });
    if (error) {
      console.error('Failed to load answers', error);
    } else {
      setAnswers((data ?? []) as AdminAnswer[]);
    }
    setLoadingAnswers(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-ink-400">{error}</p>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="glass rounded-2xl border border-ink-800 p-8 text-center">
        <FileText className="w-8 h-8 text-ink-600 mx-auto mb-3" />
        <p className="text-ink-400 text-sm">Nenhuma resposta registrada ainda.</p>
      </div>
    );
  }

  // --- Derived stats ---
  const totalAnswers = sessions.reduce((sum, s) => sum + Number(s.answer_count), 0);
  const consentCount = sessions.filter((s) => s.consent_given).length;
  const consentRate = sessions.length > 0 ? Math.round((consentCount / sessions.length) * 100) : 0;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const sessionsThisWeek = sessions.filter(
    (s) => s.completed_at && new Date(s.completed_at) >= weekAgo
  ).length;

  // Build last-14-days histogram
  const days: { label: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const count = sessions.filter((s) => {
      if (!s.completed_at) return false;
      const d = new Date(s.completed_at);
      return d >= day && d < next;
    }).length;
    days.push({
      label: day.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      count,
    });
  }
  const maxDayCount = Math.max(...days.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Summary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<FileText className="w-5 h-5" />} label="Questionários respondidos" value={sessions.length} />
        <StatCard icon={<BarChart3 className="w-5 h-5" />} label="Total de respostas" value={totalAnswers} />
        <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Últimos 7 dias" value={sessionsThisWeek} />
        <StatCard icon={<Share2 className="w-5 h-5" />} label="Taxa de consentimento" value={`${consentRate}%`} />
      </div>

      {/* 14-day histogram */}
      <div className="glass rounded-2xl border border-ink-800 p-6">
        <h3 className="font-bold text-ink-100 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-brand-400" />
          Respostas nos últimos 14 dias
        </h3>
        <div className="flex items-end gap-1.5 h-40">
          {days.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
              <div className="w-full flex-1 flex items-end">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-brand-600 to-brand-400 transition-all hover:from-brand-500 hover:to-brand-300 relative"
                  style={{ height: `${(d.count / maxDayCount) * 100}%`, minHeight: d.count > 0 ? '8px' : '2px' }}
                >
                  {d.count > 0 && (
                    <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs text-ink-300 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      {d.count}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[10px] text-ink-600 whitespace-nowrap">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Session list */}
      <div>
        <p className="text-sm text-ink-500 mb-4">
          {sessions.length} {sessions.length === 1 ? 'questionário respondido' : 'questionários respondidos'} no total.
          Clique em uma linha para ver as respostas individuais.
        </p>
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.session_id} className="glass rounded-2xl border border-ink-800 overflow-hidden">
              <button
                onClick={() => toggleSession(s.session_id)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-ink-800/30 transition-colors"
              >
                {expandedId === s.session_id ? (
                  <ChevronDown className="w-4 h-4 text-ink-500 flex-shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-ink-500 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {s.email ? (
                      <Mail className="w-3.5 h-3.5 text-ink-600 flex-shrink-0" />
                    ) : null}
                    <span className="text-sm font-medium text-ink-200 truncate">
                      {s.display_name || s.email || 'Anônimo'}
                    </span>
                  </div>
                  <div className="text-xs text-ink-500 mt-0.5">
                    {s.completed_at
                      ? new Date(s.completed_at).toLocaleString('pt-BR')
                      : 'Em andamento'}
                    {' · '}
                    {s.answer_count} {s.answer_count === 1 ? 'resposta' : 'respostas'}
                    {s.consent_given ? ' · Consentiu compartilhamento' : ''}
                  </div>
                </div>
              </button>
              {expandedId === s.session_id && (
                <div className="border-t border-ink-800 px-4 py-3">
                  {loadingAnswers ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
                    </div>
                  ) : answers.length === 0 ? (
                    <p className="text-sm text-ink-500 py-4 text-center">Nenhuma resposta nesta sessão.</p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {answers.map((a) => (
                        <div key={a.question_id} className="py-2 border-b border-ink-800/40 last:border-0">
                          <p className="text-xs text-ink-500 mb-1">{a.question_id}</p>
                          <p className="text-sm text-ink-300 mb-1.5">
                            {a.question_text || '(texto da pergunta indisponível)'}
                          </p>
                          <p className="text-sm text-ink-100 font-medium whitespace-pre-wrap break-words">
                            {a.answer_value || <span className="text-ink-600 italic">Sem resposta</span>}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
