import { Loader2, LockKeyhole } from 'lucide-react';
import Auth from '@/components/Auth';
import AdmissionsPlannerV6 from '@/components/AdmissionsPlannerV6';
import { AuthProvider, useAuth } from '@/lib/auth-context';

function Gate({ onBack }: { onBack: () => void }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#f6f4ee] flex items-center justify-center text-[#0f5c49]"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!user) {
    return <div className="min-h-screen bg-[#f6f4ee] text-[#171916]">
      <div className="max-w-2xl mx-auto px-6 pt-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#cddbd4] bg-[#e8f1ed] px-4 py-2 text-xs font-extrabold text-[#0f5c49]"><LockKeyhole className="w-4 h-4" /> SEU PLANO É PESSOAL</div>
        <h1 className="mt-5 font-[Instrument_Serif] text-4xl md:text-6xl font-normal tracking-tight">Entre para continuar de onde parou.</h1>
        <p className="mt-3 text-[#6f726c]">Curso, faculdade, simulados, questões respondidas e evolução ficam vinculados à sua conta para o plano funcionar de verdade.</p>
      </div>
      <div className="[&>div]:!bg-transparent [&_h1]:!text-[#171916] [&_label]:!text-[#6f726c] [&_p]:!text-[#6f726c] [&_input]:!bg-white [&_input]:!text-[#171916] [&_input]:!border-[#dfddd5]">
        <Auth onBack={onBack} onSuccess={() => {}} onPrivacy={onBack} onTerms={onBack} />
      </div>
    </div>;
  }

  return <AdmissionsPlannerV6 onBack={onBack} />;
}

export default function AdmissionsPlannerGate({ onBack }: { onBack: () => void }) {
  return <AuthProvider><Gate onBack={onBack} /></AuthProvider>;
}
