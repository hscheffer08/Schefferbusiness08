import { useMemo, useState, useEffect, useCallback, type CSSProperties } from 'react';
import {
  Trophy,
  RotateCcw,
  MapPin,
  TrendingUp,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Share2,
  AlertCircle,
  CheckCircle2,
  Heart,
  GitCompare,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Info,
  BadgeCheck,
  Download,
} from 'lucide-react';
import type { AnswerMap, MatchResult, QuizMode } from '@/types';
import type { DatabaseData } from '@/lib/api';
import { calculateMatches, getQuizScoreBonus, getSubScoreValue, getSubScoreLabel, getStudentProfileAttributes, getCompatibilityBand, COMPATIBILITY_SCALE, COMPATIBILITY_EXPLANATION } from '@/lib/matching-engine';
import { saveMatchHistory, saveFeedback, saveUniversity, unsaveUniversity, isUniversitySaved } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { trackEvent } from '@/lib/analytics';

import ProcessingScreen from '@/components/ProcessingScreen';
import AdmissionsSection from '@/components/AdmissionsSection';

interface ResultsProps {
  answers: AnswerMap;
  dbData: DatabaseData;
  quizMode: QuizMode;
  onRestart: () => void;
  onSelectUniversity: (universityId: string) => void;
  onCompare: () => void;
  onCreateProfile: () => void;
}

const ALL_SUBSCORES = [
  'academic_fit',
  'career_fit',
  'entrepreneurship_fit',
  'cultural_fit',
  'international_fit',
  'learning_style_fit',
];

export default function Results({ answers, dbData, quizMode, onRestart, onSelectUniversity, onCompare, onCreateProfile }: ResultsProps) {
  const { user, profile } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [processing, setProcessing] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackRating, setFeedbackRating] = useState<'positive' | 'negative' | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [imgError, setImgError] = useState(false);

  const ranked = useMemo<MatchResult[]>(() => {
    return calculateMatches(
      {
        universities: dbData.universities,
        dimensions: dbData.dimensions,
        culturalAxes: dbData.culturalAxes,
        questions: dbData.questions,
        pillarWeights: dbData.pillarWeights,
        universityDimensionWeights: dbData.universityDimensionWeights,
        universityAxisTargets: dbData.universityAxisTargets,
        questionDimensions: dbData.questionDimensions,
        officialEvidence: dbData.officialEvidence,
        evidenceDimensions: dbData.evidenceDimensions,
      },
      answers,
      getQuizScoreBonus(quizMode)
    );
  }, [answers, dbData, quizMode]);

  const studentProfile = useMemo(() => {
    return getStudentProfileAttributes(
      {
        universities: dbData.universities,
        dimensions: dbData.dimensions,
        culturalAxes: dbData.culturalAxes,
        questions: dbData.questions,
        pillarWeights: dbData.pillarWeights,
        universityDimensionWeights: dbData.universityDimensionWeights,
        universityAxisTargets: dbData.universityAxisTargets,
        questionDimensions: dbData.questionDimensions,
        officialEvidence: dbData.officialEvidence,
        evidenceDimensions: dbData.evidenceDimensions,
      },
      answers
    );
  }, [answers, dbData]);

  useEffect(() => {
    if (user) {
      dbData.universities.forEach(async (uni: { university_id: string }) => {
        const saved = await isUniversitySaved(uni.university_id);
        if (saved) setSavedIds((prev) => new Set(prev).add(uni.university_id));
      });
    }
  }, [user, dbData.universities]);

  const handleProcessingComplete = useCallback(() => {
    setProcessing(false);
    trackEvent('match_completed', { top_university: ranked[0]?.university.name }, user?.id);
    if (user) {
      saveMatchHistory(ranked).catch(() => {});
    }
  }, [ranked, user]);

  const handleSave = async (universityId: string) => {
    if (!user) return;
    if (savedIds.has(universityId)) {
      await unsaveUniversity(universityId);
      setSavedIds((prev) => { const n = new Set(prev); n.delete(universityId); return n; });
    } else {
      await saveUniversity(universityId);
      setSavedIds((prev) => new Set(prev).add(universityId));
      trackEvent('university_saved', { university_id: universityId }, user.id);
    }
  };

  const handleFeedback = (rating: 'positive' | 'negative') => {
    setFeedbackRating(rating);
    saveFeedback(rating, feedbackComment || null).catch(() => {});
    setFeedbackGiven(true);
  };

  const handleShare = async () => {
    const text = `Meu match perfeito em Business é ${ranked[0].university.name} com ${ranked[0].overallScore}% de compatibilidade! Descubra o seu no B-School Fit.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'B-School Fit', text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // user cancelled
    }
  };

  const handleDownloadPDF = async () => {
    setGeneratingPDF(true);
    trackEvent('pdf_downloaded', { top_university: ranked[0]?.university.name }, user?.id);
    try {
      const { generateResultsPDF } = await import('@/lib/pdf-generator');
      generateResultsPDF(ranked, studentProfile, answers, dbData, profile?.display_name ?? user?.email);
    } catch (err) {
      console.error('PDF generation failed', err);
    }
    setGeneratingPDF(false);
  };

  if (processing) {
    return <ProcessingScreen onComplete={handleProcessingComplete} />;
  }

  if (ranked.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  const topMatch = ranked[0];
  const heroImage = topMatch.university.image_url && !imgError ? topMatch.university.image_url : null;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] rounded-full bg-brand-500/15 blur-[130px]" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] rounded-full bg-accent-500/10 blur-[140px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-accent-400" />
          <span className="font-bold text-lg tracking-tight">Seu Ranking</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCompare}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-ink-800 hover:bg-ink-700 text-ink-200 text-sm font-medium transition-colors"
          >
            <GitCompare className="w-4 h-4" />
            <span className="hidden sm:inline">Comparar</span>
          </button>
          <button
            onClick={onRestart}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-ink-800 hover:bg-ink-700 text-ink-200 text-sm font-medium transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Refazer
          </button>
        </div>
      </header>

      {/* Result announcement */}
      <section className="relative z-10 px-6 md:px-12 max-w-4xl mx-auto mb-6 text-center">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1">
          Seu B-School Fit está pronto.
        </h1>
        <p className="text-ink-400 text-sm">Aqui está o ranking das {ranked.length} faculdades que mais combinam com você.</p>
      </section>

      {/* Top match hero with campus photo banner */}
      <section className="relative z-10 px-6 md:px-12 max-w-4xl mx-auto mb-8">
        <div className="relative">
          <FirstPlaceFireworks />
          <div className="animate-fade-up rounded-3xl border border-brand-700/40 overflow-hidden relative">
          {/* Photo banner — visible at top of card */}
          {heroImage ? (
            <div className="relative h-52 md:h-64 w-full overflow-hidden">
              <img
                src={heroImage}
                alt={topMatch.university.name}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
              {/* Only darken bottom edge for text legibility where it meets content */}
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-950 to-transparent" />
              {/* Badge overlaid on photo */}
              <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-500/90 backdrop-blur-sm text-ink-950 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                MATCH #1
              </div>
            </div>
          ) : (
            <div className="relative h-32 w-full bg-gradient-to-br from-brand-600/30 via-ink-900 to-ink-950 flex items-center justify-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-500/20 backdrop-blur-sm text-accent-300 text-xs font-semibold border border-accent-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                MATCH #1
              </div>
            </div>
          )}

          {/* Content section on solid dark background */}
          <div className="relative bg-ink-950 p-6 md:p-10 text-center">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-2 text-white">
              {topMatch.university.name}
            </h2>
            {topMatch.university.location && (
              <div className="flex items-center justify-center gap-1.5 text-ink-400 mb-6">
                <MapPin className="w-4 h-4" />
                <span>{topMatch.university.location}</span>
              </div>
            )}

            <div className="flex flex-col items-center mb-2">
              <ScoreRing score={topMatch.overallScore} />
              <span className="text-sm font-medium mt-3" style={{ color: getCompatibilityBand(topMatch.overallScore).color }}>
                {getCompatibilityBand(topMatch.overallScore).label}
              </span>
              <span className="text-sm text-ink-400 mt-1">de compatibilidade com seu perfil</span>
            </div>

            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="inline-flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink-200 transition-colors mb-6"
            >
              <Info className="w-3.5 h-3.5" />
              O que significa essa porcentagem?
            </button>
            {showExplanation && (
              <div className="max-w-md mx-auto mb-6 p-4 rounded-xl bg-ink-900 border border-ink-700 text-sm text-ink-300 leading-relaxed text-left">
                {COMPATIBILITY_EXPLANATION}
              </div>
            )}

            {topMatch.university.positioning && (
              <p className="text-ink-300 max-w-xl mx-auto leading-relaxed mb-6 text-sm">
                {topMatch.university.positioning}
              </p>
            )}

            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => onSelectUniversity(topMatch.university.university_id)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-ink-950 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-95"
              >
                Ver detalhes
              </button>
              {user && (
                <button
                  onClick={() => handleSave(topMatch.university.university_id)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ink-800 hover:bg-ink-700 text-ink-200 text-sm font-medium transition-colors border border-ink-700"
                >
                  <Heart className={`w-4 h-4 ${savedIds.has(topMatch.university.university_id) ? 'fill-brand-400 text-brand-400' : ''}`} />
                  {savedIds.has(topMatch.university.university_id) ? 'Salvo' : 'Salvar'}
                </button>
              )}
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-ink-800 hover:bg-ink-700 text-ink-200 text-sm font-medium transition-colors border border-ink-700"
              >
                <Share2 className="w-4 h-4" />
                {copied ? 'Copiado!' : 'Compartilhar'}
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={generatingPDF}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-500 hover:bg-accent-400 text-ink-950 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60"
              >
                {generatingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {generatingPDF ? 'Gerando...' : 'Baixar PDF'}
              </button>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* PDF Download banner */}
      <section className="relative z-10 px-6 md:px-12 max-w-4xl mx-auto mb-8">
        <button
          onClick={handleDownloadPDF}
          disabled={generatingPDF}
          className="w-full glass rounded-2xl border border-accent-500/30 bg-accent-500/5 p-5 flex items-center justify-between gap-4 hover:bg-accent-500/10 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent-500/15 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              {generatingPDF ? (
                <Loader2 className="w-6 h-6 text-accent-400 animate-spin" />
              ) : (
                <Download className="w-6 h-6 text-accent-400" />
              )}
            </div>
            <div className="text-left">
              <h3 className="font-bold text-ink-100 text-sm md:text-base">Salvar relatório completo em PDF</h3>
              <p className="text-ink-400 text-xs mt-0.5">Baixe seu ranking, perfil e análise detalhada</p>
            </div>
          </div>
          <div className="text-accent-400 text-sm font-medium flex-shrink-0 hidden sm:block">
            {generatingPDF ? 'Gerando...' : 'Baixar'}
          </div>
        </button>
      </section>

      {/* Admissions info for #1 university only */}
      <section className="relative z-10 px-6 md:px-12 max-w-4xl mx-auto mb-8">
        <AdmissionsSection
          university={topMatch.university}
          evidence={dbData.officialEvidence.filter((e: { university_id: string }) => e.university_id === topMatch.university.university_id)}
          sources={dbData.sources.filter((s: { university_id: string }) => s.university_id === topMatch.university.university_id)}
        />
      </section>

      {/* Compatibility scale */}
      <section className="relative z-10 px-6 md:px-12 max-w-4xl mx-auto mb-8">
        <div className="glass rounded-2xl border border-ink-800 p-5 md:p-6">
          <h2 className="text-sm font-bold text-ink-300 mb-4">Escala de compatibilidade</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {COMPATIBILITY_SCALE.map((band) => (
              <div key={band.range} className="text-center p-2 rounded-lg bg-ink-800/40">
                <div className="text-xs font-bold text-ink-200">{band.range}</div>
                <div className="text-xs text-ink-500 mt-0.5">{band.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Admission disclaimer */}
      <section className="relative z-10 px-6 md:px-12 max-w-4xl mx-auto mb-8">
        <div className="flex items-start gap-2.5 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
          <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-ink-400 leading-relaxed">
            B-School Fit mede compatibilidade, não probabilidade de aprovação. Um match alto não garante admissão, e um match menor não significa que você não possa ser aprovado ou se desenvolver bem naquela instituição.
          </p>
        </div>
      </section>

      {/* Student profile */}
      {studentProfile.length > 0 && (
        <section className="relative z-10 px-6 md:px-12 max-w-4xl mx-auto mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-400" />
            Seu perfil
          </h2>
          <div className="glass rounded-2xl border border-ink-800 p-5 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {studentProfile.map((attr) => (
                <ProfileBar key={attr.name} label={attr.name} value={attr.score} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Full ranking */}
      <section className="relative z-10 px-6 md:px-12 max-w-4xl mx-auto pb-8">
        <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brand-400" />
          Ranking completo
        </h2>

        <div className="space-y-3">
          {ranked.map((result, index) => (
            <RankCard
              key={result.university.university_id}
              result={result}
              rank={index + 1}
              isExpanded={expandedId === result.university.university_id}
              onToggle={() =>
                setExpandedId(
                  expandedId === result.university.university_id
                    ? null
                    : result.university.university_id
                )
              }
              onSelect={() => onSelectUniversity(result.university.university_id)}
              onSave={user ? () => handleSave(result.university.university_id) : undefined}
              isSaved={savedIds.has(result.university.university_id)}
            />
          ))}
        </div>
      </section>

      {/* Feedback */}
      <section className="relative z-10 px-6 md:px-12 max-w-4xl mx-auto pb-8">
        <div className="glass rounded-2xl border border-ink-800 p-6 text-center">
          {!feedbackGiven ? (
            <>
              <h3 className="font-bold text-lg mb-3">Esse resultado fez sentido para você?</h3>
              <div className="flex items-center justify-center gap-4 mb-4">
                <button
                  onClick={() => handleFeedback('positive')}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl border transition-all ${
                    feedbackRating === 'positive'
                      ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                      : 'bg-ink-800 border-ink-700 text-ink-300 hover:border-ink-600'
                  }`}
                >
                  <ThumbsUp className="w-5 h-5" />
                  Sim
                </button>
                <button
                  onClick={() => handleFeedback('negative')}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl border transition-all ${
                    feedbackRating === 'negative'
                      ? 'bg-red-500/20 border-red-500 text-red-300'
                      : 'bg-ink-800 border-ink-700 text-ink-300 hover:border-ink-600'
                  }`}
                >
                  <ThumbsDown className="w-5 h-5" />
                  Não muito
                </button>
              </div>
              <textarea
                value={feedbackComment}
                onChange={(e) => setFeedbackComment(e.target.value)}
                rows={2}
                placeholder="Quer contar por quê? (opcional)"
                className="w-full max-w-md mx-auto p-3 rounded-xl bg-ink-800/50 border border-ink-700 text-ink-100 placeholder-ink-600 focus:outline-none focus:border-brand-500 transition-colors resize-none text-sm"
              />
            </>
          ) : (
            <p className="text-ink-400 text-sm">Obrigado pelo seu feedback!</p>
          )}
        </div>
      </section>

      {/* CTA: Perfil Verificado (only after Match Rápido) */}
      {quizMode === 'quick' && (
        <section className="relative z-10 px-6 md:px-12 max-w-4xl mx-auto pb-8 text-center">
          <div className="glass rounded-2xl border border-accent-500/30 bg-accent-500/5 p-6 md:p-8 overflow-hidden relative">
            <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-accent-500/15 blur-2xl" />
            <div className="relative">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-500/15 text-accent-300 text-xs font-semibold mb-4">
                <BadgeCheck className="w-3.5 h-3.5" />
                Análise completa
              </div>
              <h3 className="font-bold text-xl mb-2">Quer uma análise mais completa?</h3>
              <p className="text-ink-400 text-sm mb-5 max-w-md mx-auto leading-relaxed">
                Crie seu Perfil Verificado para ter uma avaliação muito mais detalhada e, se você quiser, permitir que faculdades conheçam seu perfil.
              </p>
              <button
                onClick={onCreateProfile}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-accent-500 hover:bg-accent-400 text-ink-950 font-semibold transition-all hover:scale-[1.02] active:scale-95"
              >
                <BadgeCheck className="w-4 h-4" />
                Criar Perfil Verificado
              </button>
            </div>
          </div>
        </section>
      )}

      {/* CTA: Refazer */}
      <section className="relative z-10 px-6 md:px-12 max-w-4xl mx-auto pb-16 text-center">
        <div className="glass rounded-2xl border border-ink-800 p-6 md:p-8">
          <h3 className="font-bold text-lg mb-2">Quer refazer o teste?</h3>
          <p className="text-ink-400 text-sm mb-5">
            Seus interesses mudaram ou querem explorar outro perfil? Refaça o questionário.
          </p>
          <button
            onClick={onRestart}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-500 hover:bg-brand-400 text-ink-950 font-semibold transition-all hover:scale-[1.02] active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            Refazer questionário
          </button>
        </div>
      </section>
    </div>
  );
}

const FIREWORK_PARTICLES = [
  { left: '18%', top: '26%', x: '-88px', y: '-62px', color: '#60a5fa', delay: '0s' },
  { left: '18%', top: '26%', x: '-106px', y: '8px', color: '#22d3ee', delay: '0.02s' },
  { left: '18%', top: '26%', x: '-62px', y: '72px', color: '#fbbf24', delay: '0.04s' },
  { left: '18%', top: '26%', x: '4px', y: '92px', color: '#a78bfa', delay: '0.06s' },
  { left: '18%', top: '26%', x: '68px', y: '58px', color: '#34d399', delay: '0.08s' },
  { left: '18%', top: '26%', x: '86px', y: '-18px', color: '#fb7185', delay: '0.1s' },
  { left: '18%', top: '26%', x: '42px', y: '-82px', color: '#fbbf24', delay: '0.12s' },
  { left: '18%', top: '26%', x: '-28px', y: '-98px', color: '#22d3ee', delay: '0.14s' },
  { left: '50%', top: '12%', x: '-96px', y: '-34px', color: '#fbbf24', delay: '0.18s' },
  { left: '50%', top: '12%', x: '-78px', y: '48px', color: '#fb7185', delay: '0.2s' },
  { left: '50%', top: '12%', x: '-12px', y: '88px', color: '#60a5fa', delay: '0.22s' },
  { left: '50%', top: '12%', x: '62px', y: '64px', color: '#34d399', delay: '0.24s' },
  { left: '50%', top: '12%', x: '102px', y: '-2px', color: '#a78bfa', delay: '0.26s' },
  { left: '50%', top: '12%', x: '62px', y: '-72px', color: '#22d3ee', delay: '0.28s' },
  { left: '50%', top: '12%', x: '-8px', y: '-98px', color: '#fb7185', delay: '0.3s' },
  { left: '50%', top: '12%', x: '-74px', y: '-76px', color: '#60a5fa', delay: '0.32s' },
  { left: '82%', top: '26%', x: '-82px', y: '-24px', color: '#34d399', delay: '0.36s' },
  { left: '82%', top: '26%', x: '-58px', y: '64px', color: '#fbbf24', delay: '0.38s' },
  { left: '82%', top: '26%', x: '8px', y: '94px', color: '#22d3ee', delay: '0.4s' },
  { left: '82%', top: '26%', x: '72px', y: '56px', color: '#fb7185', delay: '0.42s' },
  { left: '82%', top: '26%', x: '104px', y: '-10px', color: '#60a5fa', delay: '0.44s' },
  { left: '82%', top: '26%', x: '66px', y: '-76px', color: '#a78bfa', delay: '0.46s' },
  { left: '82%', top: '26%', x: '2px', y: '-100px', color: '#fbbf24', delay: '0.48s' },
  { left: '82%', top: '26%', x: '-62px', y: '-78px', color: '#22d3ee', delay: '0.5s' },
] as const;

function FirstPlaceFireworks() {
  return (
    <div className="pointer-events-none absolute -inset-x-8 -top-16 bottom-0 z-20 overflow-visible" aria-hidden="true">
      {FIREWORK_PARTICLES.map((particle, index) => (
        <span
          key={`${particle.left}-${particle.top}-${index}`}
          className="firework-particle"
          style={{
            left: particle.left,
            top: particle.top,
            color: particle.color,
            backgroundColor: particle.color,
            animationDelay: particle.delay,
            '--firework-x': particle.x,
            '--firework-y': particle.y,
          } as CSSProperties}
        />
      ))}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-32 h-32">
      <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white drop-shadow-lg">{score}%</span>
      </div>
    </div>
  );
}

function ProfileBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-ink-400 w-36 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-ink-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400"
          style={{ width: `${value}%`, transition: 'width 0.8s ease-out' }}
        />
      </div>
      <span className="text-xs text-ink-500 w-8 text-right">{value}</span>
    </div>
  );
}

function RankCard({
  result,
  rank,
  isExpanded,
  onToggle,
  onSelect,
  onSave,
  isSaved,
}: {
  result: MatchResult;
  rank: number;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onSave?: () => void;
  isSaved: boolean;
}) {
  const { university, overallScore } = result;
  const isTop = rank <= 3;
  const rankColor =
    rank === 1 ? 'text-accent-400 bg-accent-500/15' :
    rank === 2 ? 'text-ink-200 bg-ink-700' :
    rank === 3 ? 'text-brand-400 bg-brand-500/15' :
    'text-ink-500 bg-ink-800';

  return (
    <div
      className={`glass rounded-2xl border transition-all overflow-hidden ${
        isTop ? 'border-ink-700' : 'border-ink-800'
      } hover:border-ink-600`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 md:p-5 text-left"
      >
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${rankColor}`}>
          {rank}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-ink-100 truncate">{university.name}</h3>
          {university.location && (
            <div className="flex items-center gap-1.5 text-sm text-ink-500">
              <MapPin className="w-3.5 h-3.5" />
              <span>{university.location}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right">
            <div
              className="font-bold text-lg"
              style={{ color: getCompatibilityBand(overallScore).color }}
            >
              {overallScore}%
            </div>
            <div className="text-xs text-ink-500">{getCompatibilityBand(overallScore).label}</div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-ink-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-ink-500" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="animate-fade-in px-4 md:px-5 pb-5 pt-1">
          {university.positioning && (
            <p className="text-ink-300 text-sm leading-relaxed mb-4">{university.positioning}</p>
          )}

          <div className="mb-4">
            <h4 className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
              Por que combina com você
            </h4>
            <div className="space-y-1.5">
              {result.topReasons.map((reason, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-ink-300">
                  <span className="text-brand-400 font-bold flex-shrink-0">{i + 1}.</span>
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              Pontos para considerar
            </h4>
            <p className="text-sm text-ink-300">{result.mismatchPoint}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 mb-4">
            {ALL_SUBSCORES.map((sub) => {
              const value = getSubScoreValue(result, sub);
              return <SubScoreBar key={sub} label={getSubScoreLabel(sub)} value={value} />;
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={onSelect}
              className="flex-1 min-w-[140px] py-2.5 rounded-xl bg-brand-500/10 border border-brand-700/40 text-brand-300 text-sm font-medium hover:bg-brand-500/20 transition-colors"
            >
              Ver detalhes da faculdade →
            </button>
            {onSave && (
              <button
                onClick={onSave}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-ink-800 border border-ink-700 text-ink-300 text-sm font-medium hover:bg-ink-700 transition-colors"
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-brand-400 text-brand-400' : ''}`} />
                {isSaved ? 'Salvo' : 'Salvar'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SubScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-ink-400 w-36 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-ink-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-400"
          style={{ width: `${value}%`, transition: 'width 0.6s ease-out' }}
        />
      </div>
      <span className="text-xs text-ink-500 w-8 text-right">{value}%</span>
    </div>
  );
}
