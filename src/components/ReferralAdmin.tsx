import { useState, useEffect, useCallback } from 'react';
import { Check, Download, Users, ChevronRight, Loader2 } from 'lucide-react';
import {
  getReferralNameRanking,
  getReferralsForName,
  type ReferralNameRankingEntry,
} from '@/lib/free-referrals';
import type { Referral } from '@/types';

export default function ReferralAdmin() {
  const [ranking, setRanking] = useState<ReferralNameRankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ReferralNameRankingEntry | null>(null);
  const [selectedReferrals, setSelectedReferrals] = useState<Referral[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setRanking(await getReferralNameRanking());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openDetails = async (entry: ReferralNameRankingEntry) => {
    if (selected?.key === entry.key) {
      setSelected(null);
      setSelectedReferrals([]);
      return;
    }
    setSelected(entry);
    setDetailsLoading(true);
    setSelectedReferrals(await getReferralsForName(entry.referrer_ids));
    setDetailsLoading(false);
  };

  const handleExportCSV = () => {
    const headers = ['Posicao', 'Nome e sobrenome', 'Indicacoes', 'Iniciaram', 'Concluiram', 'Validas'];
    const rows = ranking.map((entry, index) => [
      index + 1,
      entry.name,
      entry.total_indications,
      entry.quizzes_started,
      entry.quizzes_completed,
      entry.valid_referrals,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'indicacoes-por-nome.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl border border-ink-800 p-6">
        <h3 className="font-bold text-ink-100 mb-2 flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-400" />
          Indicações por nome
        </h3>
        <p className="text-ink-500 text-sm">
          Qualquer nome e sobrenome digitado pelos usuários conta automaticamente, sem cadastro prévio do indicador.
        </p>
      </div>

      <div className="glass rounded-2xl border border-ink-800 p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="font-bold text-ink-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-accent-400" />
            Ranking de Indicações
          </h3>
          <button
            onClick={handleExportCSV}
            disabled={ranking.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ink-800 hover:bg-ink-700 text-ink-200 text-sm font-medium transition-colors disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>

        {ranking.length === 0 ? (
          <p className="text-ink-500 text-sm">Nenhuma indicação registrada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-ink-500 text-xs border-b border-ink-800">
                  <th className="text-left py-3 px-2">#</th>
                  <th className="text-left py-3 px-2">Nome e sobrenome</th>
                  <th className="text-center py-3 px-2">Indicações</th>
                  <th className="text-center py-3 px-2">Iniciaram</th>
                  <th className="text-center py-3 px-2">Concluíram</th>
                  <th className="text-center py-3 px-2">Válidas</th>
                  <th className="text-center py-3 px-2">Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((entry, index) => (
                  <tr
                    key={entry.key}
                    className="border-b border-ink-800/50 hover:bg-ink-800/30 transition-colors"
                  >
                    <td className="py-3 px-2 text-ink-500 font-mono">{index + 1}</td>
                    <td className="py-3 px-2 text-ink-100 font-medium">{entry.name}</td>
                    <td className="py-3 px-2 text-center text-brand-400 font-bold text-base">{entry.total_indications}</td>
                    <td className="py-3 px-2 text-center text-ink-300">{entry.quizzes_started}</td>
                    <td className="py-3 px-2 text-center text-ink-300">{entry.quizzes_completed}</td>
                    <td className="py-3 px-2 text-center text-ink-300">{entry.valid_referrals}</td>
                    <td className="py-3 px-2 text-center">
                      <button
                        onClick={() => openDetails(entry)}
                        className="p-1.5 rounded-lg bg-ink-800 hover:bg-ink-700 text-ink-300 transition-colors"
                        title="Ver detalhes"
                      >
                        <ChevronRight className={`w-4 h-4 transition-transform ${selected?.key === entry.key ? 'rotate-90' : ''}`} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div className="glass rounded-2xl border border-ink-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-ink-100">Indicações de {selected.name}</h3>
              <p className="text-ink-500 text-sm mt-1">
                {selected.total_indications} indicação{selected.total_indications === 1 ? '' : 'ões'} no total.
              </p>
            </div>
            <button
              onClick={() => { setSelected(null); setSelectedReferrals([]); }}
              className="text-ink-500 hover:text-ink-300 text-sm transition-colors"
            >
              Fechar
            </button>
          </div>

          {detailsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-brand-400" />
            </div>
          ) : selectedReferrals.length === 0 ? (
            <p className="text-ink-500 text-sm">Nenhuma indicação encontrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-ink-500 text-xs border-b border-ink-800">
                    <th className="text-left py-2 px-2">Usuário</th>
                    <th className="text-center py-2 px-2">Iniciou</th>
                    <th className="text-center py-2 px-2">Concluiu</th>
                    <th className="text-center py-2 px-2">Válida</th>
                    <th className="text-left py-2 px-2">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReferrals.map((referral) => (
                    <tr key={referral.id} className="border-b border-ink-800/50">
                      <td className="py-2 px-2 text-ink-300">{referral.referred_user_name ?? 'Anônimo'}</td>
                      <td className="py-2 px-2 text-center">
                        {referral.quiz_started ? <Check className="w-3.5 h-3.5 text-green-400 mx-auto" /> : <span className="text-ink-600">—</span>}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {referral.quiz_completed ? <Check className="w-3.5 h-3.5 text-green-400 mx-auto" /> : <span className="text-ink-600">—</span>}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {referral.is_valid ? <Check className="w-3.5 h-3.5 text-brand-400 mx-auto" /> : <span className="text-ink-600">—</span>}
                      </td>
                      <td className="py-2 px-2 text-ink-500 text-xs">
                        {new Date(referral.created_at).toLocaleDateString('pt-BR')}
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
