import { useState } from 'react';
import { ArrowLeft, GitCompare, X, Check, MapPin } from 'lucide-react';
import type { MatchResult, University } from '@/types';
import type { DatabaseData } from '@/lib/api';
import { getSubScoreValue, getSubScoreLabel } from '@/lib/matching-engine';

const SUBSCORES = ['academic_fit', 'career_fit', 'entrepreneurship_fit', 'cultural_fit', 'international_fit'];

interface ComparatorProps {
  dbData: DatabaseData;
  matchResults: MatchResult[];
  onBack: () => void;
}

export default function Comparator({ dbData, matchResults, onBack }: ComparatorProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [maxSelect] = useState(3);

  const universities: University[] = dbData.universities;
  const scoreMap = new Map<string, MatchResult>(matchResults.map((r: MatchResult) => [r.university.university_id, r]));

  const toggleSelect = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < maxSelect ? [...prev, id] : prev
    );
  };

  const selectedUniversities = selected
    .map((id) => universities.find((u: University) => u.university_id === id))
    .filter(Boolean) as University[];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] rounded-full bg-brand-500/15 blur-[130px]" />
        <div className="absolute bottom-0 -right-40 w-[500px] h-[500px] rounded-full bg-accent-500/10 blur-[140px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-ink-400 hover:text-ink-100 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <div className="flex items-center gap-2">
          <GitCompare className="w-5 h-5 text-brand-400" />
          <span className="font-bold text-lg tracking-tight">Comparar faculdades</span>
        </div>
      </header>

      <main className="relative z-10 px-6 md:px-12 max-w-5xl mx-auto pb-20">
        <p className="text-ink-400 text-sm mb-6">
          Selecione 2 ou 3 faculdades para comparar lado a lado. {selected.length} de {maxSelect} selecionadas.
        </p>

        {universities.length === 0 && (
          <div role="alert" className="glass rounded-2xl border border-amber-500/30 p-6 text-center">
            <p className="font-semibold text-ink-100 mb-2">As faculdades não puderam ser carregadas.</p>
            <p className="text-sm text-ink-400 mb-4">Tente novamente em alguns instantes.</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-xl bg-brand-500 text-ink-950 font-semibold">
              Tentar novamente
            </button>
          </div>
        )}

        {selected.length < 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {universities.map((uni: University) => {
              const isSelected = selected.includes(uni.university_id);
              const result = scoreMap.get(uni.university_id);
              return (
                <button
                  key={uni.university_id}
                  onClick={() => toggleSelect(uni.university_id)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-brand-500/15 border-brand-500'
                      : 'glass border-ink-800 hover:border-ink-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-ink-100 text-sm">{uni.name}</h3>
                    {isSelected ? (
                      <Check className="w-4 h-4 text-brand-400" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-ink-600" />
                    )}
                  </div>
                  {result && (
                    <span className="text-xs text-brand-400 font-medium">{result.overallScore}% match</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {selected.length >= 2 && (
          <>
            <div className="flex flex-wrap gap-2 mb-6">
              {selected.map((id) => {
                const uni = universities.find((u: University) => u.university_id === id);
                return (
                  <button
                    key={id}
                    onClick={() => toggleSelect(id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-500/15 text-brand-300 text-sm font-medium"
                  >
                    {uni?.name}
                    <X className="w-3.5 h-3.5" />
                  </button>
                );
              })}
              {selected.length < maxSelect && (
                <span className="text-sm text-ink-500 self-center">Selecione mais uma se quiser</span>
              )}
            </div>

            <div className="glass rounded-2xl border border-ink-800 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-ink-800">
                    <th className="text-left p-4 text-xs font-semibold text-ink-400 uppercase tracking-wider">Critério</th>
                    {selectedUniversities.map((uni) => (
                      <th key={uni.university_id} className="text-left p-4 min-w-[160px]">
                        <div className="font-semibold text-ink-100 text-sm">{uni.name}</div>
                        {uni.location && (
                          <div className="flex items-center gap-1 text-xs text-ink-500 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {uni.location}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <ComparisonRow label="Match geral">
                    {selectedUniversities.map((uni) => {
                      const result = scoreMap.get(uni.university_id);
                      return (
                        <td key={uni.university_id} className="p-4">
                          <span className="text-lg font-bold text-brand-400">{result?.overallScore ?? '—'}%</span>
                        </td>
                      );
                    })}
                  </ComparisonRow>
                  {SUBSCORES.map((key) => (
                    <ComparisonRow key={key} label={getSubScoreLabel(key)}>
                      {selectedUniversities.map((uni) => {
                        const result = scoreMap.get(uni.university_id);
                        const val = result ? getSubScoreValue(result, key) : null;
                        return (
                          <td key={uni.university_id} className="p-4">
                            {val !== null ? (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full bg-ink-800 overflow-hidden min-w-[60px]">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400"
                                    style={{ width: `${val}%` }}
                                  />
                                </div>
                                <span className="text-sm text-ink-300">{val}%</span>
                              </div>
                            ) : '—'}
                          </td>
                        );
                      })}
                    </ComparisonRow>
                  ))}
                  <ComparisonRow label="Localização">
                    {selectedUniversities.map((uni) => (
                      <td key={uni.university_id} className="p-4 text-sm text-ink-300">{uni.location ?? '—'}</td>
                    ))}
                  </ComparisonRow>
                  <ComparisonRow label="Formato">
                    {selectedUniversities.map((uni) => (
                      <td key={uni.university_id} className="p-4 text-sm text-ink-300">{uni.format ?? '—'}</td>
                    ))}
                  </ComparisonRow>
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function ComparisonRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr className="border-b border-ink-800/50 last:border-0">
      <td className="p-4 text-sm text-ink-400 font-medium whitespace-nowrap">{label}</td>
      {children}
    </tr>
  );
}
