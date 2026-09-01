import { Loader2, LockKeyhole } from 'lucide-react';
import Auth from '@/components/Auth';
import AdmissionsPlannerV8 from '@/components/AdmissionsPlannerV8';
import PlannerStudyLab from '@/components/PlannerStudyLab';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import './admissions-planner-v8.css';

function Gate({ onBack }: { onBack: () => void }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#020817] flex items-center justify-center text-[#72a5ff]"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!user) {
    return <div className="min-h-screen bg-[radial-gradient(circle_at_70%_0%,rgba(36,108,255,.12),transparent_32%),linear-gradient(180deg,#020817,#041027)] text-white">
      <div className="max-w-2xl mx-auto px-6 pt-12 text-center">
        <div className="inline-flex items-center gap-2 text-sm font-bold text-[#72a5ff]"><LockKeyhole className="w-4 h-4" /> Seu plano fica salvo na sua conta</div>
        <h1 className="mt-5 text-4xl md:text-6xl font-extrabold tracking-[-0.05em]">Entre para continuar de onde parou.</h1>
        <p className="mt-4 text-[#a9bddc] leading-relaxed">Curso, faculdade, acertos atuais, simulados, questões respondidas e evolução ficam vinculados à sua conta para o plano se adaptar com você.</p>
      </div>
      <div className="[&>div]:!bg-transparent [&_h1]:!text-white [&_label]:!text-[#a9bddc] [&_p]:!text-[#a9bddc] [&_input]:!bg-[#081a38] [&_input]:!text-white [&_input]:!border-[#173765] [&_button]:!rounded-[12px]">
        <Auth onBack={onBack} onSuccess={() => {}} onPrivacy={onBack} onTerms={onBack} />
      </div>
    </div>;
  }

  return <><AdmissionsPlannerV8 onBack={onBack} /><PlannerStudyLab /></>;
}

export default function AdmissionsPlannerGate({ onBack }: { onBack: () => void }) {
  return <AuthProvider><Gate onBack={onBack} /></AuthProvider>;
}
