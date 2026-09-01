import { Loader2, LockKeyhole } from 'lucide-react';
import Auth from '@/components/Auth';
import AdmissionsPlannerV7 from '@/components/AdmissionsPlannerV7';
import { AuthProvider, useAuth } from '@/lib/auth-context';

function Gate({ onBack }: { onBack: () => void }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center text-[#4f6fae]"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!user) {
    return <div className="min-h-screen bg-gradient-to-b from-[#f7f9fc] to-[#f1f4f9] text-[#172033]">
      <div className="max-w-2xl mx-auto px-6 pt-12 text-center">
        <div className="inline-flex items-center gap-2 text-sm font-bold text-[#536fa8]"><LockKeyhole className="w-4 h-4" /> Seu plano fica salvo na sua conta</div>
        <h1 className="mt-5 font-[Instrument_Serif] text-4xl md:text-6xl font-normal tracking-[-0.03em]">Entre para continuar de onde parou.</h1>
        <p className="mt-4 text-[#6f7888] leading-relaxed">Curso, faculdade, simulados, questões respondidas e evolução ficam vinculados à sua conta para o plano se adaptar com você.</p>
      </div>
      <div className="[&>div]:!bg-transparent [&_h1]:!text-[#172033] [&_label]:!text-[#667184] [&_p]:!text-[#6f7888] [&_input]:!bg-white [&_input]:!text-[#172033] [&_input]:!border-[#dfe5ee] [&_button]:!rounded-[12px]">
        <Auth onBack={onBack} onSuccess={() => {}} onPrivacy={onBack} onTerms={onBack} />
      </div>
    </div>;
  }

  return <AdmissionsPlannerV7 onBack={onBack} />;
}

export default function AdmissionsPlannerGate({ onBack }: { onBack: () => void }) {
  return <AuthProvider><Gate onBack={onBack} /></AuthProvider>;
}
