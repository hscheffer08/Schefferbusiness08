import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  MapPin,
  GraduationCap,
  Building2,
  Users,
  Award,
  ExternalLink,
  FileText,
  Target,
  Heart,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import type { University, OfficialEvidence, Source, MatchResult } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { saveUniversity, unsaveUniversity, isUniversitySaved } from '@/lib/api';
import { getCompatibilityBand } from '@/lib/matching-engine';
import AdmissionsSection from '@/components/AdmissionsSection';

interface UniversityDetailProps {
  university: University;
  evidence: OfficialEvidence[];
  sources: Source[];
  matchResult: MatchResult | null;
  onBack: () => void;
}

export default function UniversityDetail({
  university,
  evidence,
  sources,
  matchResult,
  onBack,
}: UniversityDetailProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'evidence' | 'sources'>('overview');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (user) isUniversitySaved(university.university_id).then(setIsSaved);
  }, [user, university.university_id]);

  const handleSave = async () => {
    if (!user) return;
    if (isSaved) {
      await unsaveUniversity(university.university_id);
      setIsSaved(false);
    } else {
      await saveUniversity(university.university_id);
      setIsSaved(true);
    }
  };

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
          Voltar ao ranking
        </button>
        <div className="flex items-center gap-2">
          {user && (
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-ink-800 hover:bg-ink-700 text-ink-200 text-sm font-medium transition-colors"
            >
              <Heart className={`w-4 h-4 ${isSaved ? 'fill-brand-400 text-brand-400' : ''}`} />
              {isSaved ? 'Salvo' : 'Salvar'}
            </button>
          )}
          {matchResult && (
            <div className="flex flex-col items-end gap-0.5">
              <div
                className="px-3 py-1.5 rounded-xl text-sm font-bold"
                style={{
                  background: 'rgba(59,130,246,0.15)',
                  color: getCompatibilityBand(matchResult.overallScore).color,
                }}
              >
                {matchResult.overallScore}% match
              </div>
              <span className="text-xs text-ink-500">{getCompatibilityBand(matchResult.overallScore).label}</span>
            </div>
          )}
        </div>
      </header>

      <main className="relative z-10 px-6 md:px-12 max-w-4xl mx-auto pb-20">
        {/* Hero */}
        <div className="animate-fade-up mb-8">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3">
            {university.name}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-ink-400">
            {university.location && (
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {university.location}
              </div>
            )}
            {university.course && (
              <div className="flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" />
                {university.course}
              </div>
            )}
            {university.format && (
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                {university.format}
              </div>
            )}
          </div>
        </div>

        {/* Match analysis */}
        {matchResult && (
          <div className="animate-fade-up glass rounded-2xl border border-ink-800 p-5 md:p-6 mb-6" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-brand-400" />
              Análise de compatibilidade
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-brand-400" />
                  Pontos de match
                </h3>
                <div className="space-y-1.5">
                  {matchResult.topReasons.map((reason, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-ink-300">
                      <span className="text-brand-400 font-bold flex-shrink-0">{i + 1}.</span>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Ponto de atenção
                </h3>
                <p className="text-sm text-ink-300">{matchResult.mismatchPoint}</p>
              </div>
            </div>
          </div>
        )}

        {/* Admissions section */}
        <div className="mb-6">
          <AdmissionsSection university={university} evidence={evidence} sources={sources} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl bg-ink-900/60 border border-ink-800 w-fit">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
            Visão geral
          </TabButton>
          <TabButton active={activeTab === 'evidence'} onClick={() => setActiveTab('evidence')}>
            Evidências ({evidence.length})
          </TabButton>
          <TabButton active={activeTab === 'sources'} onClick={() => setActiveTab('sources')}>
            Fontes ({sources.length})
          </TabButton>
        </div>

        {/* Tab content */}
        {activeTab === 'overview' && (
          <div className="animate-fade-in space-y-4">
            {university.positioning && (
              <InfoCard icon={<Target className="w-4 h-4" />} title="Posicionamento">
                {university.positioning}
              </InfoCard>
            )}
            {university.program_differentiators && (
              <InfoCard icon={<Award className="w-4 h-4" />} title="Diferenciais do programa">
                {university.program_differentiators}
              </InfoCard>
            )}
            {university.admissions && (
              <InfoCard icon={<FileText className="w-4 h-4" />} title="Processo de admissão">
                {university.admissions}
              </InfoCard>
            )}
            {university.values && (
              <InfoCard icon={<Heart className="w-4 h-4" />} title="Valores e competências">
                {university.values}
              </InfoCard>
            )}
            {university.high_fit_student && (
              <InfoCard icon={<Users className="w-4 h-4" />} title="Perfil ideal do aluno">
                {university.high_fit_student}
              </InfoCard>
            )}
            {university.low_fit_student && (
              <InfoCard icon={<AlertTriangle className="w-4 h-4" />} title="Perfil com menor fit">
                {university.low_fit_student}
              </InfoCard>
            )}
            {university.match_rationale && (
              <InfoCard icon={<BookOpen className="w-4 h-4" />} title="Racional de match">
                {university.match_rationale}
              </InfoCard>
            )}
          </div>
        )}

        {activeTab === 'evidence' && (
          <div className="animate-fade-in space-y-3">
            {evidence.length === 0 ? (
              <p className="text-ink-500 text-sm">Nenhuma evidência oficial cadastrada.</p>
            ) : (
              evidence.map((ev) => (
                <div key={ev.evidence_id} className="glass rounded-2xl border border-ink-800 p-5">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="font-semibold text-ink-100">{ev.evidence_name}</h3>
                    {ev.evidence_type && (
                      <span className="flex-shrink-0 px-2.5 py-1 rounded-full bg-brand-500/10 text-brand-300 text-xs font-medium">
                        {ev.evidence_type}
                      </span>
                    )}
                  </div>
                  {ev.summary && <p className="text-sm text-ink-400 leading-relaxed">{ev.summary}</p>}
                  {ev.source_url && (
                    <a
                      href={ev.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-3 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Ver fonte
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'sources' && (
          <div className="animate-fade-in space-y-3">
            {sources.length === 0 ? (
              <p className="text-ink-500 text-sm">Nenhuma fonte cadastrada.</p>
            ) : (
              sources.map((src) => (
                <div key={src.source_id} className="glass rounded-2xl border border-ink-800 p-5">
                  <h3 className="font-semibold text-ink-100 mb-1">{src.source_name}</h3>
                  {src.usage_note && (
                    <p className="text-sm text-ink-400 leading-relaxed mb-3">{src.usage_note}</p>
                  )}
                  {src.url && (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {src.url}
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {university.primary_source_url && (
          <div className="mt-8 text-center">
            <a
              href={university.primary_source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-ink-950 font-semibold transition-all hover:scale-[1.02] active:scale-95"
            >
              Visitar site oficial
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </main>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active
          ? 'bg-brand-500 text-ink-950'
          : 'text-ink-400 hover:text-ink-200'
      }`}
    >
      {children}
    </button>
  );
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="glass rounded-2xl border border-ink-800 p-5">
      <h3 className="flex items-center gap-2 text-xs font-semibold text-ink-400 uppercase tracking-wider mb-2">
        {icon}
        {title}
      </h3>
      <p className="text-sm text-ink-200 leading-relaxed">{children}</p>
    </div>
  );
}
