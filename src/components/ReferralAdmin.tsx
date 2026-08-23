import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Copy, Check, Power, Download, Users, Link2, ChevronRight, Loader2,
} from 'lucide-react';
import {
  getAllReferrers, createReferrer, updateReferrer, getAllReferrals,
  getReferralRanking, buildReferralLink, exportReferralRankingCSV,
} from '@/lib/api';
import type { Referrer, Referral, ReferralRankingEntry } from '@/types';

export default function ReferralAdmin() {
  const [ranking, setRanking] = useState<ReferralRankingEntry[]>([]);
  const [referrers, setReferrers] = useState<Referrer[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedReferrer, setSelectedReferrer] = useState<ReferralRankingEntry | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const [rank, refs, allReferrals] = await Promise.all([
      getReferralRanking(),
      getAllReferrers(),
      getAllReferrals(),
    ]);
    setRanking(rank);
    setReferrers(refs);
    setReferrals(allReferrals);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const created = await createReferrer(newName.trim());
    if (created) {
      setNewName('');
      await load();
    }
    setCreating(false);
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    await updateReferrer(id, { is_active: !current });
    await load();
  };

  const handleSaveName = async (id: string) => {
    if (!editName.trim()) return;
    await updateReferrer(id, { name: editName.trim() });
    setEditingId(null);
    setEditName('');
    await load();
  };

  const handleCopyLink = (code: string) => {
    const link = buildReferralLink(code);
    navigator.clipboard.writeText(link).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleExportCSV = () => {
    const csv = exportReferralRankingCSV(ranking);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ranking-indicacoes.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedReferrals = selectedReferrer
    ? referrals.filter((r) => r.referral_code === selectedReferrer.referral_code)
    : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create new referrer */}
      <div className="glass rounded-2xl border border-ink-800 p-6">
        <h3 className="font-bold text-ink-100 mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-brand-400" />
          Novo indicador
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome do indicador"
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
            className="flex-1 px-4 py-3 rounded-xl bg-ink-800/50 border border-ink-700 text-ink-100 placeholder-ink-600 focus:outline-none focus:border-brand-500 transition-colors"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="px-5 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-ink-950 font-semibold text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Criar
          </button>
        </div>
      </div>

      {/* Ranking table */}
      <div className="glass rounded-2xl border border-ink-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-ink-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-accent-400" />
            Ranking de Indicações
          </h3>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ink-800 hover:bg-ink-700 text-ink-200 text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>

        {ranking.length === 0 ? (
          <p className="text-ink-500 text-sm">Nenhum indicador cadastrado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-ink-500 text-xs border-b border-ink-800">
                  <th className="text-left py-3 px-2">#</th>
                  <th className="text-left py-3 px-2">Indicador</th>
                  <th className="text-left py-3 px-2">Código</th>
                  <th className="text-center py-3 px-2">Acessos</th>
                  <th className="text-center py-3 px-2">Iniciados</th>
                  <th className="text-center py-3 px-2">Concluídos</th>
                  <th className="text-center py-3 px-2">Válidas</th>
                  <th className="text-center py-3 px-2">Conv.</th>
                  <th className="text-center py-3 px-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((entry, i) => (
                  <tr
                    key={entry.referrer_id}
                    className="border-b border-ink-800/50 hover:bg-ink-800/30 transition-colors"
                  >
                    <td className="py-3 px-2 text-ink-500 font-mono">{i + 1}</td>
                    <td className="py-3 px-2 text-ink-200">
                      {editingId === entry.referrer_id ? (
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(entry.referrer_id); }}
                            className="px-2 py-1 rounded-lg bg-ink-800 border border-ink-700 text-ink-100 text-xs focus:outline-none focus:border-brand-500 w-32"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveName(entry.referrer_id)}
                            className="px-2 py-1 rounded-lg bg-brand-500 text-ink-950 text-xs font-semibold"
                          >
                            OK
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setEditingId(entry.referrer_id); setEditName(entry.name); }}
                          className="hover:text-brand-400 transition-colors"
                        >
                          {entry.name}
                        </button>
                      )}
                      {!entry.is_active && (
                        <span className="ml-2 text-xs text-red-400">(inativo)</span>
                      )}
                    </td>
                    <td className="py-3 px-2 text-ink-400 font-mono text-xs">{entry.referral_code}</td>
                    <td className="py-3 px-2 text-center text-ink-300">{entry.total_accesses}</td>
                    <td className="py-3 px-2 text-center text-ink-300">{entry.quizzes_started}</td>
                    <td className="py-3 px-2 text-center text-ink-300">{entry.quizzes_completed}</td>
                    <td className="py-3 px-2 text-center text-brand-400 font-semibold">{entry.valid_referrals}</td>
                    <td className="py-3 px-2 text-center text-ink-400 text-xs">{entry.conversion_rate}%</td>
                    <td className="py-3 px-2">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleCopyLink(entry.referral_code)}
                          title="Copiar link de indicação"
                          className="p-1.5 rounded-lg bg-ink-800 hover:bg-ink-700 text-ink-300 transition-colors"
                        >
                          {copiedCode === entry.referral_code ? (
                            <Check className="w-3.5 h-3.5 text-green-400" />
                          ) : (
                            <Link2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleToggleActive(entry.referrer_id, entry.is_active)}
                          title={entry.is_active ? 'Desativar' : 'Ativar'}
                          className="p-1.5 rounded-lg bg-ink-800 hover:bg-ink-700 text-ink-300 transition-colors"
                        >
                          <Power className={`w-3.5 h-3.5 ${entry.is_active ? 'text-green-400' : 'text-red-400'}`} />
                        </button>
                        <button
                          onClick={() => setSelectedReferrer(selectedReferrer?.referrer_id === entry.referrer_id ? null : entry)}
                          title="Ver indicados"
                          className="p-1.5 rounded-lg bg-ink-800 hover:bg-ink-700 text-ink-300 transition-colors"
                        >
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${selectedReferrer?.referrer_id === entry.referrer_id ? 'rotate-90' : ''}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected referrer details */}
      {selectedReferrer && (
        <div className="glass rounded-2xl border border-ink-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-ink-100">
              Indicados por {selectedReferrer.name} ({selectedReferrer.referral_code})
            </h3>
            <button
              onClick={() => setSelectedReferrer(null)}
              className="text-ink-500 hover:text-ink-300 text-sm transition-colors"
            >
              Fechar
            </button>
          </div>

          {/* Referral link */}
          <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-ink-800/40 border border-ink-700">
            <span className="text-xs text-ink-500 flex-shrink-0">Link:</span>
            <code className="text-xs text-ink-300 flex-1 truncate">
              {buildReferralLink(selectedReferrer.referral_code)}
            </code>
            <button
              onClick={() => handleCopyLink(selectedReferrer.referral_code)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-500/15 text-brand-300 text-xs font-medium hover:bg-brand-500/25 transition-colors flex-shrink-0"
            >
              {copiedCode === selectedReferrer.referral_code ? (
                <><Check className="w-3 h-3" /> Copiado</>
              ) : (
                <><Copy className="w-3 h-3" /> Copiar</>
              )}
            </button>
          </div>

          {selectedReferrals.length === 0 ? (
            <p className="text-ink-500 text-sm">Nenhuma indicação registrada ainda.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-ink-500 text-xs border-b border-ink-800">
                    <th className="text-left py-2 px-2">Nome / E-mail</th>
                    <th className="text-left py-2 px-2">Origem</th>
                    <th className="text-center py-2 px-2">Iniciou</th>
                    <th className="text-center py-2 px-2">Concluiu</th>
                    <th className="text-center py-2 px-2">Válida</th>
                    <th className="text-left py-2 px-2">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReferrals.map((ref) => (
                    <tr key={ref.id} className="border-b border-ink-800/50">
                      <td className="py-2 px-2 text-ink-300">
                        {ref.referred_user_name ?? 'Anônimo'}
                      </td>
                      <td className="py-2 px-2 text-ink-400 text-xs">
                        {ref.referral_source === 'link' ? 'Link' : ref.referral_source === 'manual' ? 'Manual' : '—'}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {ref.quiz_started ? <Check className="w-3.5 h-3.5 text-green-400 mx-auto" /> : <span className="text-ink-600">—</span>}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {ref.quiz_completed ? <Check className="w-3.5 h-3.5 text-green-400 mx-auto" /> : <span className="text-ink-600">—</span>}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {ref.is_valid ? <Check className="w-3.5 h-3.5 text-brand-400 mx-auto" /> : <span className="text-ink-600">—</span>}
                      </td>
                      <td className="py-2 px-2 text-ink-500 text-xs">
                        {new Date(ref.created_at).toLocaleDateString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
