import { Loader2, LockKeyhole, LogOut } from 'lucide-react';
import Auth from '@/components/Auth';
import AdmissionsPlannerV11 from '@/components/AdmissionsPlannerV11';
import PlannerStudyLabV2 from '@/components/PlannerStudyLabV2';
import EssayPractice from '@/components/EssayPractice';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import './admissions-planner-v8.css';

function Gate({ onBack }: { onBack: () => void }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-[#020817] flex items-center justify-center text-[#72a5ff]"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (!user) {
    return <div className="min-h-screen bg-[radial-gradient(circle_at_70%_0%,rgba(36,108,255,.12),transparent_32%),linear-gradient(180deg,#020817,#041027)] text-white flex flex-col">
      <div className="w-full max-w-xl mx-auto px-5 pt-8 md:pt-10 text-center">
        <div className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-[#72a5ff]"><LockKeyhole className="w-4 h-4" /> Seu plano fica salvo na sua conta</div>
        <h1 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-[-0.045em] leading-[1.02]">Entre para abrir seu Plano de Aprovação.</h1>
        <p className="mt-3 text-sm md:text-base text-[#a9bddc] leading-relaxed">Curso, faculdade, notas, questões, fotos de dificuldade e evolução ficam vinculados à sua conta.</p>
      </div>
      <div className="w-full max-w-xl mx-auto mt-5 md:mt-6 px-1 [&_h1]:!text-white [&_label]:!text-[#b8cae4] [&_p]:!text-[#9fb5d4] [&_input]:!bg-[#081a38] [&_input]:!text-white [&_input]:!border-[#173765] [&_button]:!rounded-[12px]">
        <Auth compact onBack={onBack} onSuccess={() => {}} onPrivacy={onBack} onTerms={onBack} />
      </div>
    </div>;
  }

  const signOut = async () => {
    try { await supabase?.auth.signOut(); }
    finally { window.location.reload(); }
  };

  return <div className="relative">
    <button type="button" onClick={signOut} className="fixed top-3 right-3 z-[80] inline-flex items-center gap-2 rounded-xl border border-[#234576] bg-[#071a38]/95 px-3 py-2 text-xs font-bold text-white shadow-lg backdrop-blur hover:bg-[#0c2857]" aria-label="Sair da conta"><LogOut className="w-4 h-4" /> Sair</button>
    <AdmissionsPlannerV11 onBack={onBack} />
    <PlannerStudyLabV2 />
    <EssayPractice />
  </div>;
}

export default function AdmissionsPlannerGate({ onBack }: { onBack: () => void }) {
  return <AuthProvider><Gate onBack={onBack} /></AuthProvider>;
}
