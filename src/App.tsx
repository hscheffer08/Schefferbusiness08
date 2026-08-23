import { useState, useEffect, useCallback } from 'react';
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
import { AuthProvider, useAuth } from '@/lib/auth-context';
import type { AnswerMap, Screen, MatchResult, QuizMode } from '@/types';
import { saveSession, saveMatchHistory, clearProgress, getSharingConsent, validateReferralCode, createReferral, updateReferralStatus, findReferralByUser, type DatabaseData } from '@/lib/api';
import { loadDatabaseDataSafe } from '@/lib/safe-database';
import { calculateMatches } from '@/lib/matching-engine';
import { trackEvent } from '@/lib/analytics';

function AppContent() {
  const { user, profile } = useAuth();
  const [screen, setScreen] = useState<Screen>('home');
  const [dbData, setDbData] = useState<DatabaseData | null>(null);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [selectedUniversityId, setSelectedUniversityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConsent, setShowConsent] = useState(false);
  const [quizMode, setQuizMode] = useState<QuizMode>('quick');
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrerId, setReferrerId] = useState<string | null>(null);

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
    if (user && profile && !profile.onboarding_completed) {
      setScreen('onboarding');
    } else {
      setScreen('quiz');
    }
  };

  const handleQuizComplete = useCallback(async (quizAnswers: AnswerMap) => {
    setAnswers(quizAnswers);
    setLoading(true);
    setScreen('results');

    if (dbData) {
      const results = calculateMatches(
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
        quizAnswers
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
        const existingConsent = await getSharingConsent();
        if (!existingConsent) {
          setShowConsent(true);
        }
      }
    }

    setLoading(false);
  }, [dbData, user]);

  const handleRestart = () => {
    setAnswers({});
    setMatchResults([]);
    setSelectedUniversityId(null);
    setShowConsent(false);
    setScreen('home');
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

  const handleBackToHome = () => {
    setSelectedUniversityId(null);
    setScreen('home');
  };

  const handleAuthSuccess = () => {
    setScreen('home');
  };

  const handleOnboardingComplete = () => {
    setScreen('quiz');
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <p className="text-ink-300 text-lg mb-2">Não foi possível carregar os dados.</p>
          <p className="text-ink-500 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-ink-950 font-semibold transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!dbData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (screen === 'home')
    return (
      <Home
        onStart={handleStart}
        onProfile={() => setScreen('profile')}
        onAuth={() => setScreen('auth')}
        onNavigate={(s) => setScreen(s)}
      />
    );

  if (screen === 'auth')
    return <Auth onBack={() => setScreen('home')} onSuccess={handleAuthSuccess} onPrivacy={() => setScreen('privacy')} onTerms={() => setScreen('terms')} />;

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
    return <Quiz questions={dbData.questions} mode={quizMode} onComplete={handleQuizComplete} onBack={() => setScreen('home')} />;

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
          dbData={dbData}
          quizMode={quizMode}
          onRestart={handleRestart}
          onSelectUniversity={handleSelectUniversity}
          onCompare={() => setScreen('compare')}
          onCreateProfile={() => { setQuizMode('full'); setScreen('quiz'); }}
        />
      </>
    );
  }

  if (screen === 'compare')
    return <Comparator dbData={dbData} matchResults={matchResults} onBack={() => setScreen('results')} />;

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

  if (screen === 'howitworks' || screen === 'methodology' || screen === 'faq' || screen === 'privacy' || screen === 'terms')
    return <InfoPages page={screen} onBack={() => setScreen('home')} />;

  return (
    <Home
      onStart={handleStart}
      onProfile={() => setScreen('profile')}
      onAuth={() => setScreen('auth')}
      onNavigate={(s) => setScreen(s)}
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
