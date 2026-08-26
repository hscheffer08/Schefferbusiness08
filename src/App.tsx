import { useState, useEffect, useCallback, useMemo } from 'react';
import { Loader2 } from 'lucide-react';
import Home from '@/components/Home';
import Quiz from '@/components/Quiz';
import Results from '@/components/Results';
import UniversityDetail from '@/components/UniversityDetail';
import Auth from '@/components/Auth';
import Profile from '@/components/Profile';
import Onboarding from '@/components/Onboarding';
import Comparator from '@/components/Comparator';
import Admin from '@/components/Admin';
import InfoPages from '@/components/InfoPages';
import ConsentStep from '@/components/ConsentStep';
import FacultyQuestionnaireHub from '@/components/FacultyQuestionnaireHub';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import type { AnswerMap, Screen, MatchResult, QuizMode, CountryCode } from '@/types';
import { saveSession, saveMatchHistory, clearProgress, getSharingConsent, validateReferralCode, createReferral, updateReferralStatus, findReferralByUser, type DatabaseData } from '@/lib/api';
import { loadDatabaseDataSafe } from '@/lib/safe-database';
import { calculateMatches, getQuizScoreBonus } from '@/lib/matching-engine';
import { exportFullQuizToFacultyProfile } from '@/lib/faculty-profile';
import { trackEvent } from '@/lib/analytics';

const isFacultyQuestionnaireLink = () =>
  new URLSearchParams(window.location.search).get('questionario') === 'faculdades';

function filterDatabaseByCountry(data: DatabaseData, country: CountryCode): DatabaseData {
  const universities = data.universities.filter((university) => university.country_code === country);
  const universityIds = new Set(universities.map((university) => university.university_id));
  const officialEvidence = data.officialEvidence.filter((item) => universityIds.has(item.university_id));
  const evidenceIds = new Set(officialEvidence.map((item) => item.evidence_id));
  const questions = country === 'US'
    ? data.questions.map((question) =>
        question.question_id === 'Q28'
          ? {
              ...question,
              question_text: 'Você toparia fazer toda a graduação nos Estados Unidos e morar fora do Brasil?',
              helper_text: 'Considere distância da família, adaptação cultural, idioma e mudança por quatro anos.',
            }
          : question
      )
    : data.questions;

  return {
    ...data,
    universities,
    questions,
    universityDimensionWeights: data.universityDimensionWeights.filter((item) => universityIds.has(item.university_id)),
    universityAxisTargets: data.universityAxisTargets.filter((item) => universityIds.has(item.university_id)),
    officialEvidence,
    evidenceDimensions: data.evidenceDimensions.filter((item) => evidenceIds.has(item.evidence_id)),
    sources: data.sources.filter((item) => universityIds.has(item.university_id)),
  };
}

function AppContent() {
  const { user, profile } = useAuth();
  const [screen, setScreen] = useState<Screen>(() =>
    isFacultyQuestionnaireLink() ? 'faculty-questionnaire' : 'home'
  );
  const [countryCode, setCountryCode] = useState<CountryCode>('BR');
  const [dbData, setDbData] = useState<DatabaseData | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [selectedUniversityId, setSelectedUniversityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [quizMode, setQuizMode] = useState<QuizMode>('quick');
  const [facultyExportStatus, setFacultyExportStatus] = useState<'idle' | 'exporting' | 'success' | 'error'>('idle');
  const [pendingFacultyExport, setPendingFacultyExport] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrerId, setReferrerId] = useState<string | null>(null);
  const [authDestination, setAuthDestination] = useState<Screen | null>(() =>
    isFacultyQuestionnaireLink() ? 'faculty-questionnaire' : null
  );
  const marketData = useMemo(
    () => (dbData ? filterDatabaseByCountry(dbData, countryCode) : null),
    [dbData, countryCode]
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      const code = ref.toUpperCase();
      setReferralCode(code);
      validateReferralCode(code).then((r) => {
        if (r) setReferrerId(r.id);
      });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await loadDatabaseDataSafe();
        if (!cancelled) {
          setDbData(data);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to load data', err);
        if (!cancelled) setError('Não foi possível carregar os dados agora. Tente novamente em instantes.');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleStart = (mode: QuizMode) => {
    setQuizMode(mode);
    setFacultyExportStatus('idle');
    setPendingFacultyExport(false);
    if (user && profile && !profile.onboarding_completed) {
      setScreen('onboarding');
    } else {
      setScreen('quiz');
    }
  };

  const handleQuizComplete = useCallback(async (quizAnswers: AnswerMap) => {
    setAnswers(quizAnswers);
    setFacultyExportStatus('idle');
    setPendingFacultyExport(false);
    setLoading(true);
    setScreen('results');

    if (marketData) {
      const results = calculateMatches(
        {
          universities: marketData.universities,
          dimensions: marketData.dimensions,
          culturalAxes: marketData.culturalAxes,
          questions: marketData.questions,
          pillarWeights: marketData.pillarWeights,
          universityDimensionWeights: marketData.universityDimensionWeights,
          universityAxisTargets: marketData.universityAxisTargets,
          questionDimensions: marketData.questionDimensions,
          officialEvidence: marketData.officialEvidence,
          evidenceDimensions: marketData.evidenceDimensions,
        },
        quizAnswers,
        getQuizScoreBonus(quizMode)
      );
      setMatchResults(results);

      const consent = quizAnswers['Q40'] === 'sim';
      saveSession(quizAnswers, consent).catch(() => {});

      if (user) {
        saveMatchHistory(results).catch(() => {});
        clearProgress().catch(() => {});
        findReferralByUser(user.id).then((ref) => {
          if (ref && !ref.quiz_completed) {
            updateReferralStatus({ referralId: ref.id, quizStarted: true, quizCompleted: true });
          } else if (ref && !ref.quiz_started) {
            updateReferralStatus({ referralId: ref.id, quizStarted: true });
          }
        }).catch(() => {});
        if (quizMode === 'full' && countryCode === 'BR') {
          const existingConsent = await getSharingConsent();
          if (!existingConsent) {
            setShowConsent(true);
          }
        }
      }
    }

    setLoading(false);
  }, [countryCode, marketData, quizMode, user]);

  const handleRestart = () => {
    setAnswers({});
    setMatchResults([]);
    setSelectedUniversityId(null);
    setShowConsent(false);
    setFacultyExportStatus('idle');
    setPendingFacultyExport(false);
    setScreen('home');
  };

  const handleCountryChange = (country: CountryCode) => {
    setCountryCode(country);
    setAnswers({});
    setMatchResults([]);
    setSelectedUniversityId(null);
    setShowConsent(false);
    setFacultyExportStatus('idle');
    setPendingFacultyExport(false);
  };

  const handleSelectUniversity = (universityId: string) => {
    setSelectedUniversityId(universityId);
    setScreen('detail');
    trackEvent('university_viewed', { university_id: universityId }, user?.id);
  };

  const handleBackToResults = () => {
    setSelectedUniversityId(null);
    setScreen('results');
  };

  const clearFacultyQuestionnaireLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('questionario');
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  };

  const handleBackToHome = () => {
    setSelectedUniversityId(null);
    clearFacultyQuestionnaireLink();
    setScreen('home');
  };

  const handleAuthSuccess = () => {
    setScreen(authDestination ?? 'home');
    setAuthDestination(null);
  };

  const performFacultyExport = useCallback(async () => {
    if (!user || !marketData || quizMode !== 'full' || countryCode !== 'BR') return;

    setFacultyExportStatus('exporting');
    const result = await exportFullQuizToFacultyProfile(answers, marketData.questions);
    if (result.error) {
      setFacultyExportStatus('error');
      trackEvent('faculty_profile_export_failed', { reason: result.error }, user.id);
      return;
    }

    setFacultyExportStatus('success');
    trackEvent('faculty_profile_exported', { sections: result.count }, user.id);
  }, [answers, countryCode, marketData, quizMode, user]);

  const handleExportToFaculty = useCallback(() => {
    if (!user) {
      setPendingFacultyExport(true);
      setAuthDestination('results');
      setScreen('auth');
      return;
    }
    void performFacultyExport();
  }, [performFacultyExport, user]);

  useEffect(() => {
    if (!pendingFacultyExport || !user || screen !== 'results') return;
    setPendingFacultyExport(false);
    void performFacultyExport();
  }, [pendingFacultyExport, performFacultyExport, screen, user]);

  const handleFacultyQuestionnaireAccess = () => {
    if (countryCode === 'US') return;
    const url = new URL(window.location.href);
    url.searchParams.set('questionario', 'faculdades');
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    if (user) {
      setScreen('faculty-questionnaire');
    } else {
      setAuthDestination('faculty-questionnaire');
      setScreen('auth');
    }
  };

  const handleOnboardingCompleteWithReferral = async (selectedReferrerCode: string | null, selectedReferrerId: string | null) => {
    if (selectedReferrerCode && selectedReferrerId) {
      try {
        const existing = user ? await findReferralByUser(user.id) : null;
        if (!existing) {
          await createReferral({
            referralCode: selectedReferrerCode,
            referrerId: selectedReferrerId,
            referredUserId: user?.id ?? null,
            referredUserName: user?.email ?? null,
            referralSource: 'manual',
          });
        }
      } catch { /* ignore */ }
    } else if (referralCode && referrerId) {
      try {
        const existing = user ? await findReferralByUser(user.id) : null;
        if (!existing) {
          await createReferral({
            referralCode,
            referrerId,
            referredUserId: user?.id ?? null,
            referredUserName: user?.email ?? null,
            referralSource: 'link',
          });
        }
      } catch { /* ignore */ }
    }
    setScreen('quiz');
  };

  if (!dbData && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (screen === 'home')
    return (
      <Home
        country={countryCode}
        universityCount={marketData?.universities.length ?? 0}
        onCountryChange={handleCountryChange}
        onStart={handleStart}
        onProfile={() => setScreen(user ? 'profile' : 'auth')}
        onAuth={() => setScreen('auth')}
        onNavigate={(s) => s === 'faculty-questionnaire' ? handleFacultyQuestionnaireAccess() : setScreen(s)}
      />
    );

  if (screen === 'auth')
    return <Auth onBack={() => { setPendingFacultyExport(false); setAuthDestination(null); handleBackToHome(); }} onSuccess={handleAuthSuccess} onPrivacy={() => setScreen('privacy')} onTerms={() => setScreen('terms')} />;

  if (screen === 'howitworks' || screen === 'methodology' || screen === 'faq' || screen === 'privacy' || screen === 'terms')
    return <InfoPages page={screen} onBack={handleBackToHome} />;

  if (screen === 'faculty-questionnaire') {
    if (!user) {
      return (
        <Auth
          onBack={() => {
            setAuthDestination(null);
            handleBackToHome();
          }}
          onSuccess={handleAuthSuccess}
          onPrivacy={() => setScreen('privacy')}
          onTerms={() => setScreen('terms')}
        />
      );
    }
    return <FacultyQuestionnaireHub onBack={handleBackToHome} />;
  }

  if (error || !dbData || !marketData) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-ink-300 text-lg mb-2">Não foi possível carregar os dados.</p>
          <p className="text-ink-500 text-sm mb-4">{error ?? 'Tente novamente em instantes.'}</p>
          <button onClick={() => window.location.reload()} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-ink-950 font-semibold transition-colors">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (screen === 'onboarding')
    return (
      <Onboarding
        onComplete={handleOnboardingCompleteWithReferral}
        preselectedReferralCode={referralCode}
      />
    );

  if (screen === 'profile')
    return <Profile onBack={() => setScreen('home')} onSelectUniversity={handleSelectUniversity} universities={dbData.universities} />;

  if (screen === 'quiz')
    return <Quiz questions={marketData.questions} mode={quizMode} onComplete={handleQuizComplete} onBack={() => setScreen('home')} />;

  if (screen === 'consent')
    return (
      <ConsentStep
        onComplete={() => { setShowConsent(false); setScreen('results'); }}
        onSkip={() => { setShowConsent(false); setScreen('results'); }}
      />
    );

  if (screen === 'results') {
    if (loading && matchResults.length === 0) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
        </div>
      );
    }
    return (
      <>
        {showConsent && (
          <ConsentStep
            onComplete={() => setShowConsent(false)}
            onSkip={() => setShowConsent(false)}
          />
        )}
        <Results
          answers={answers}
          dbData={marketData}
          quizMode={quizMode}
          onRestart={handleRestart}
          onSelectUniversity={handleSelectUniversity}
          onCompare={() => setScreen('compare')}
          onCreateProfile={() => { setQuizMode('full'); setFacultyExportStatus('idle'); setScreen('quiz'); }}
          facultyExportAvailable={countryCode === 'BR'}
          facultyExportStatus={facultyExportStatus}
          onExportToFaculty={handleExportToFaculty}
          onOpenFacultyProfile={handleFacultyQuestionnaireAccess}
        />
      </>
    );
  }

  if (screen === 'compare')
    return <Comparator dbData={marketData} matchResults={matchResults} onBack={() => setScreen('results')} />;

  if (screen === 'detail' && selectedUniversityId) {
    const university = dbData.universities.find((u) => u.university_id === selectedUniversityId);
    if (!university) return null;
    const evidence = dbData.officialEvidence.filter((e) => e.university_id === selectedUniversityId);
    const sources = dbData.sources.filter((s) => s.university_id === selectedUniversityId);
    const matchResult = matchResults.find((r) => r.university.university_id === selectedUniversityId) ?? null;

    return (
      <UniversityDetail
        university={university}
        evidence={evidence}
        sources={sources}
        matchResult={matchResult}
        onBack={matchResults.length > 0 ? handleBackToResults : handleBackToHome}
      />
    );
  }

  if (screen === 'admin')
    return <Admin onBack={() => setScreen('home')} />;

  return (
    <Home
      country={countryCode}
      universityCount={marketData.universities.length}
      onCountryChange={handleCountryChange}
      onStart={handleStart}
      onProfile={() => setScreen(user ? 'profile' : 'auth')}
      onAuth={() => setScreen('auth')}
      onNavigate={(s) => s === 'faculty-questionnaire' ? handleFacultyQuestionnaireAccess() : setScreen(s)}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-ink-950">
        <AppContent />
      </div>
    </AuthProvider>
  );
}
