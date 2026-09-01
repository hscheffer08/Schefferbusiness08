import { Loader2, LockKeyhole } from 'lucide-react';
import Auth from '@/components/Auth';
import AdmissionsPlannerIntelligenceV4 from '@/components/AdmissionsPlannerIntelligenceV4';
import { AuthProvider, useAuth } from '@/lib/auth-context';

function Gate({ onBack }: { onBack: () => void }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#070b16] flex items-center justify-center text-cyan-200"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!user) {
    return <div className="min-h-screen bg-[#070b16] text-white">
      <div className="max-w-2xl mx-auto px-6 pt-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-black text-cyan-100"><LockKeyhole className="w-4 h-4" /> ÁREA PERSONALIZADA</div>
        <h1 className="mt-5 text-3xl md:text-5xl font-black tracking-tight">Entre para abrir seu Plano de Aprovação</h1>
        <p className="mt-3 text-ink-400">O login é obrigatório porque curso, faculdade, simulados, matérias fortes, questões respondidas e evolução ficam vinculados à sua conta.</p>
      </div>
      <Auth onBack={onBack} onSuccess={() => {}} onPrivacy={onBack} onTerms={onBack} />
    </div>;
  }

  return <AdmissionsPlannerIntelligenceV4 onBack={onBack} />;
}

export default function AdmissionsPlannerGate({ onBack }: { onBack: () => void }) {
  return <AuthProvider><Gate onBack={onBack} /></AuthProvider>;
}
