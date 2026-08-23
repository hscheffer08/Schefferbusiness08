import { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  User as UserIcon,
  Mail,
  LogOut,
  Edit3,
  Check,
  Trophy,
  Clock,
  TrendingUp,
  Loader2,
  ChevronRight,
  Heart,
  Trash2,
  AlertCircle,
  GraduationCap,
  Shield,
  Users,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { getSavedUniversities, getSharingConsent, saveSharingConsent, revokeSharingConsent, isMinor } from '@/lib/api';
import type { MatchHistoryEntry, SavedUniversity, University, SharingConsent, ConsentScope } from '@/types';

interface ProfileProps {
  onBack: () => void;
  onSelectUniversity: (universityId: string) => void;
  universities: University[];
}

export default function Profile({ onBack, onSelectUniversity, universities }: ProfileProps) {
  const { user, profile, signOut, updateDisplayName, deleteAccount } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [history, setHistory] = useState<MatchHistoryEntry[]>([]);
  const [saved, setSaved] = useState<SavedUniversity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [consent, setConsent] = useState<SharingConsent | null>(null);
  const [consentLoading, setConsentLoading] = useState(false);
  const [editConsent, setEditConsent] = useState(false);
  const [editScope, setEditScope] = useState<ConsentScope>('none');

  const loadData = useCallback(async () => {
    if (!supabase || !user) return;
    setLoading(true);
    const [historyRes, savedRes, consentRes] = await Promise.all([
      supabase.from('match_history').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      getSavedUniversities(),
      getSharingConsent(),
    ]);
    if (historyRes.data) setHistory(historyRes.data as MatchHistoryEntry[]);
    setSaved(savedRes);
    setConsent(consentRes);
    if (consentRes) setEditScope(consentRes.consent_scope);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveName = async () => {
    const { error } = await updateDisplayName(nameInput);
    if (!error) setEditingName(false);
  };

  const handleSignOut = async () => {
    await signOut();
    onBack();
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    const { error } = await deleteAccount();
    if (!error) {
      onBack();
    } else {
      setDeleting(false);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const savedUniversities = saved
    .map((s) => universities.find((u) => u.university_id === s.university_id))
    .filter(Boolean) as University[];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] rounded-full bg-brand-500/15 blur-[130px]" />
        <div className="absolute bottom-0 -right-40 w-[500px] h-[500px] rounded-full bg-accent-500/8 blur-[140px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-ink-400 hover:text-ink-100 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-ink-800 hover:bg-ink-700 text-ink-200 text-sm font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </header>

      <main className="relative z-10 px-6 md:px-12 max-w-3xl mx-auto pb-20">
        {/* Profile card */}
        <div className="glass rounded-2xl border border-ink-800 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <UserIcon className="w-6 h-6 text-ink-950" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Seu nome"
                    autoFocus
                    className="flex-1 px-3 py-2 rounded-lg bg-ink-800 border border-ink-700 text-ink-100 placeholder-ink-600 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-2 rounded-lg bg-brand-500 hover:bg-brand-400 text-ink-950 transition-colors"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-ink-100">
                    {profile?.display_name || 'Usuário'}
                  </h1>
                  <button
                    onClick={() => { setNameInput(profile?.display_name ?? ''); setEditingName(true); }}
                    className="p-1.5 rounded-lg hover:bg-ink-800 text-ink-500 hover:text-ink-300 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-1.5 mt-1 text-sm text-ink-500">
                <Mail className="w-3.5 h-3.5" />
                <span className="truncate">{user?.email}</span>
              </div>
              {profile?.school_year && (
                <div className="flex items-center gap-1.5 mt-1 text-sm text-ink-500">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>{profile.school_year}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
          </div>
        ) : (
          <>
            {/* Saved universities */}
            {savedUniversities.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                  <Heart className="w-5 h-5 text-brand-400" />
                  Minhas faculdades
                </h2>
                <div className="space-y-2">
                  {savedUniversities.map((uni) => (
                    <button
                      key={uni.university_id}
                      onClick={() => onSelectUniversity(uni.university_id)}
                      className="w-full flex items-center justify-between p-4 rounded-2xl glass border border-ink-800 hover:border-ink-600 transition-all text-left group"
                    >
                      <div>
                        <h3 className="font-semibold text-ink-100 text-sm group-hover:text-brand-300 transition-colors">{uni.name}</h3>
                        {uni.location && <p className="text-xs text-ink-500 mt-0.5">{uni.location}</p>}
                      </div>
                      <ChevronRight className="w-5 h-5 text-ink-600 group-hover:text-ink-400 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Match history */}
            <div className="mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-accent-400" />
                Meus matches
              </h2>
            </div>

            {history.length === 0 ? (
              <div className="glass rounded-2xl border border-ink-800 p-8 text-center">
                <Clock className="w-8 h-8 text-ink-600 mx-auto mb-3" />
                <p className="text-ink-400 text-sm">
                  Você ainda não realizou nenhum match. Faça o questionário para ver seus resultados aqui!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const latest = history[0];
                  return (
                    <div className="glass rounded-2xl border border-ink-800 p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-xs text-ink-500">
                          <Clock className="w-3.5 h-3.5" />
                          Último resultado — {formatDate(latest.created_at)}
                        </div>
                        <div
                          className="px-2.5 py-1 rounded-full text-xs font-bold"
                          style={{
                            background: 'rgba(59,130,246,0.15)',
                            color: latest.top_score >= 70 ? '#60a5fa' : '#22d3ee',
                          }}
                        >
                          {latest.top_score}% match
                        </div>
                      </div>

                      <button
                        onClick={() => onSelectUniversity(latest.top_university_id)}
                        className="w-full flex items-center justify-between gap-3 group"
                      >
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-1.5 mb-1">
                            <TrendingUp className="w-3.5 h-3.5 text-brand-400" />
                            <span className="text-xs text-ink-500">Match #1</span>
                          </div>
                          <h3 className="font-semibold text-ink-100 group-hover:text-brand-300 transition-colors">
                            {latest.top_university_name}
                          </h3>
                        </div>
                        <ChevronRight className="w-5 h-5 text-ink-600 group-hover:text-ink-400 transition-colors" />
                      </button>

                      {latest.all_scores.length > 1 && (
                        <div className="mt-3 pt-3 border-t border-ink-800">
                          <div className="flex flex-wrap gap-1.5">
                            {latest.all_scores.slice(0, 7).map((s, i) => (
                              <span
                                key={s.university_id}
                                className={`px-2 py-1 rounded-lg text-xs ${
                                  i === 0
                                    ? 'bg-brand-500/15 text-brand-300 font-medium'
                                    : 'bg-ink-800 text-ink-400'
                                }`}
                              >
                                {s.name}: {s.score}%
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {history.length > 1 && (
                        <div className="mt-3 pt-3 border-t border-ink-800">
                          <p className="text-xs text-ink-600">
                            Você já fez o teste {history.length} vezes. Mostrando apenas o resultado mais recente.
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Privacy & Sharing */}
            <div className="mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-brand-400" />
                Privacidade e compartilhamento
              </h2>
              <div className="glass rounded-2xl border border-ink-800 p-5">
                {!editConsent ? (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-ink-300">Compartilhamento com faculdades</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        consent?.consent_status === 'accepted'
                          ? 'bg-green-500/15 text-green-400'
                          : consent?.consent_status === 'revoked'
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-ink-700 text-ink-400'
                      }`}>
                        {consent?.consent_status === 'accepted' ? 'Ativo' : consent?.consent_status === 'revoked' ? 'Revogado' : 'Privado'}
                      </span>
                    </div>
                    {consent?.consent_status === 'accepted' && (
                      <p className="text-xs text-ink-500 mb-2">
                        Escopo: {consent.consent_scope === 'all_participating' ? 'Todas as faculdades participantes' : consent.consent_scope === 'my_ranking' ? 'Faculdades do meu ranking' : 'Apenas minha faculdade #1'}
                      </p>
                    )}
                    {consent?.consent_given_at && (
                      <p className="text-xs text-ink-600 mb-3">
                        Consentido em {formatDate(consent.consent_given_at)}
                      </p>
                    )}
                    {consent?.requires_guardian_consent && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-400 mb-3">
                        <Lock className="w-3.5 h-3.5" />
                        {consent.guardian_consent_given ? 'Autorização do responsável confirmada' : 'Pendente: autorização do responsável'}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditConsent(true); setEditScope(consent?.consent_scope ?? 'none'); }}
                        className="px-4 py-2 rounded-xl bg-ink-800 hover:bg-ink-700 text-ink-200 text-sm font-medium transition-colors"
                      >
                        Alterar escolha
                      </button>
                      {consent?.consent_status === 'accepted' && (
                        <button
                          onClick={async () => {
                            setConsentLoading(true);
                            const ok = await revokeSharingConsent();
                            if (ok) {
                              const updated = await getSharingConsent();
                              setConsent(updated);
                            }
                            setConsentLoading(false);
                          }}
                          disabled={consentLoading}
                          className="px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {consentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Revogar'}
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-ink-400 mb-2">Escolha o escopo de compartilhamento:</p>
                    {[
                      { value: 'all_participating' as ConsentScope, label: 'Todas as faculdades participantes', icon: <Users className="w-4 h-4" /> },
                      { value: 'my_ranking' as ConsentScope, label: 'Faculdades do meu ranking', icon: <Trophy className="w-4 h-4" /> },
                      { value: 'top_match' as ConsentScope, label: 'Apenas minha faculdade #1', icon: <GraduationCap className="w-4 h-4" /> },
                      { value: 'none' as ConsentScope, label: 'Não compartilhar', icon: <Lock className="w-4 h-4" /> },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setEditScope(opt.value)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                          editScope === opt.value
                            ? 'border-brand-500 bg-brand-500/10'
                            : 'border-ink-700 bg-ink-800/40 hover:border-ink-600'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          editScope === opt.value ? 'border-brand-400 bg-brand-400' : 'border-ink-600'
                        }`}>
                          {editScope === opt.value && <Check className="w-3 h-3 text-ink-950" />}
                        </div>
                        {opt.icon}
                        <span className="text-sm text-ink-200">{opt.label}</span>
                      </button>
                    ))}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={async () => {
                          setConsentLoading(true);
                          const minorFlag = isMinor(profile?.age_range);
                          const result = await saveSharingConsent({
                            consentStatus: editScope === 'none' ? 'declined' : 'accepted',
                            consentScope: editScope,
                            requiresGuardianConsent: minorFlag,
                          });
                          if (result) {
                            setConsent(result);
                            setEditConsent(false);
                          }
                          setConsentLoading(false);
                        }}
                        disabled={consentLoading}
                        className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-ink-950 text-sm font-semibold transition-colors disabled:opacity-50"
                      >
                        {consentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
                      </button>
                      <button
                        onClick={() => setEditConsent(false)}
                        className="px-5 py-2.5 rounded-xl bg-ink-800 text-ink-300 text-sm font-medium hover:bg-ink-700 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Account deletion */}
            <div className="mt-8 pt-6 border-t border-ink-800">
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-2 text-sm text-ink-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir minha conta
                </button>
              ) : (
                <div className="glass rounded-2xl border border-red-500/30 p-5">
                  <div className="flex items-start gap-2 mb-4">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-ink-100 mb-1">Excluir conta</h3>
                      <p className="text-sm text-ink-400">Esta ação é irreversível. Todos os seus dados (perfil, respostas, matches, favoritos) serão permanentemente excluídos.</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 text-sm font-medium hover:bg-red-500/30 transition-colors disabled:opacity-50"
                    >
                      {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      Sim, excluir tudo
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="px-4 py-2.5 rounded-xl bg-ink-800 text-ink-300 text-sm font-medium hover:bg-ink-700 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
