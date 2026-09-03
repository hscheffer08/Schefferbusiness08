import { useState } from 'react';
import { BarChart3, BookOpenCheck, Camera, ClipboardCheck, FileText, Loader2, LockKeyhole, LogIn, LogOut, ScanLine, Target, UserCheck } from 'lucide-react';
import Auth from '@/components/Auth';
import AdmissionsPlannerV11 from '@/components/AdmissionsPlannerV11';
import AdmissionsTargetIntelligence from '@/components/AdmissionsTargetIntelligence';
import PlannerStudyLabV2 from '@/components/PlannerStudyLabV2';
import EssayPractice from '@/components/EssayPractice';
import EnemVisualPractice from '@/components/EnemVisualPractice';
import OfficialExamReviewV2 from '@/components/OfficialExamReviewV2';
import CourseDataProof from '@/components/CourseDataProof';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import './admissions-planner-v8.css';

function Gate({ onBack }: { onBack: () => void }) {
  const { user, loading } = useAuth();
  const [accessConfirmed, setAccessConfirmed] = useState(false);
  const [switchingAccount, setSwitchingAccount] = useState(false);

  if (loading) {
    return <div className="min-h-screen bg-[#020817] flex items-center justify-center text-[#72a5ff]"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  const signOut = async () => {
    try { await supabase?.auth.signOut(); }
    finally { window.location.reload(); }
  };

  const useAnotherAccount = async () => {
    setSwitchingAccount(true);
    try { await supabase?.auth.signOut(); }
    finally { window.location.reload(); }
  };

  if (!user) {
    return <div className="min-h-screen bg-[radial-gradient(circle_at_70%_0%,rgba(36,108,255,.12),transparent_32%),linear-gradient(180deg,#020817,#041027)] text-white flex flex-col">
      <div className="w-full max-w-xl mx-auto px-5 pt-8 md:pt-10 text-center">
        <div className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-[#72a5ff]"><LockKeyhole className="w-4 h-4" /> CURSO DE APROVAÇÃO</div>
        <h1 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-[-0.045em] leading-[1.02]">Entre para abrir seu Curso.</h1>
        <p className="mt-3 text-sm md:text-base text-[#a9bddc] leading-relaxed">Seu curso, faculdade-alvo, notas, questões, simulados, redações, dificuldades e evolução ficam vinculados à sua conta.</p>
      </div>
      <div className="w-full max-w-xl mx-auto mt-5 md:mt-6 px-1 [&_h1]:!text-white [&_label]:!text-[#b8cae4] [&_p]:!text-[#9fb5d4] [&_input]:!bg-[#081a38] [&_input]:!text-white [&_input]:!border-[#173765] [&_button]:!rounded-[12px]">
        <Auth compact onBack={onBack} onSuccess={() => {}} onPrivacy={onBack} onTerms={onBack} />
      </div>
    </div>;
  }

  if (!accessConfirmed) {
    return <div className="min-h-screen bg-[radial-gradient(circle_at_60%_0%,rgba(36,108,255,.14),transparent_35%),linear-gradient(180deg,#020817,#041027)] text-white flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-lg rounded-[24px] border border-[#173765] bg-[#06152f] p-6 md:p-8 shadow-2xl">
        <div className="inline-flex items-center gap-2 text-xs font-extrabold text-[#72a5ff]"><UserCheck size={16}/>CURSO DE APROVAÇÃO</div>
        <h1 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-[-.04em]">Continue de onde você parou.</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#a9bddc]">Confirme sua conta para carregar o plano, histórico e diagnósticos corretos. Nenhum dado de outro aluno entra no seu Curso.</p>
        <div className="mt-5 rounded-2xl border border-[#234576] bg-[#081a38] p-4"><div className="text-xs text-[#839ab9]">Conta conectada</div><div className="mt-1 break-all font-bold">{user.email}</div></div>
        <button type="button" onClick={()=>setAccessConfirmed(true)} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#246cff] px-4 text-sm font-extrabold"><LogIn size={17}/>Entrar no meu Curso</button>
        <button type="button" onClick={useAnotherAccount} disabled={switchingAccount} className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#234576] bg-[#081a38] px-4 text-sm font-bold disabled:opacity-50">{switchingAccount?<Loader2 size={16} className="animate-spin"/>:<LogOut size={16}/>}Entrar com outra conta</button>
        <button type="button" onClick={onBack} className="mt-3 w-full text-xs font-bold text-[#8da5c5]">Voltar à página inicial</button>
      </div>
    </div>;
  }

  const jump = (id:string) => document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'});
  const navItems = [
    ['curso-inicio', 'Meu plano', Target],
    ['curso-metas', 'Metas', BarChart3],
    ['correcao-simulado', 'Simulados', ClipboardCheck],
    ['curso-laboratorio', 'Estudo', BookOpenCheck],
    ['curso-visual', 'Questões visuais', ScanLine],
    ['curso-redacao', 'Redação', FileText],
  ] as const;

  return <div className="relative min-h-screen bg-[#020817]">
    <div className="sticky top-0 z-[92] border-b border-[#173765] bg-[#020817]/95 text-white shadow-xl shadow-black/10 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1240px] items-center gap-3 px-3 py-2.5 md:px-6">
        <button type="button" onClick={()=>jump('curso-inicio')} className="mr-1 flex shrink-0 items-center gap-2 rounded-xl px-2 py-1.5 font-extrabold"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#246cff] text-sm">C</span><span className="hidden sm:block">Curso</span></button>
        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {navItems.map(([id,label,Icon])=><button key={id} type="button" onClick={()=>jump(id)} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-[#9fb5d4] transition hover:bg-[#0b2856] hover:text-white"><Icon size={14}/>{label}</button>)}
        </nav>
        <button type="button" onClick={signOut} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#234576] bg-[#071a38] px-3 py-2 text-xs font-bold text-white hover:bg-[#0c2857]" aria-label="Sair da conta"><LogOut className="w-4 h-4" /><span className="hidden md:inline">Sair</span></button>
      </div>
    </div>

    <CourseDataProof compact />

    <div className="fixed bottom-[76px] right-3 z-[85] flex flex-col gap-2 md:bottom-5 md:right-5">
      <button type="button" onClick={()=>jump('correcao-simulado')} className="inline-flex items-center gap-2 rounded-xl border border-[#31588e] bg-[#0b2856]/95 px-3 py-3 text-xs font-extrabold text-white shadow-xl backdrop-blur"><ClipboardCheck size={16}/>Corrigir simulado</button>
      <button type="button" onClick={()=>jump('diagnostico-foto')} className="inline-flex items-center gap-2 rounded-xl bg-[#246cff] px-3 py-3 text-xs font-extrabold text-white shadow-xl"><Camera size={16}/>Enviar foto</button>
    </div>

    <section id="curso-inicio" className="scroll-mt-16"><AdmissionsPlannerV11 onBack={onBack} /></section>
    <section id="curso-metas" className="scroll-mt-16"><AdmissionsTargetIntelligence /></section>
    <OfficialExamReviewV2 />
    <section id="curso-laboratorio" className="scroll-mt-16"><PlannerStudyLabV2 /></section>
    <section id="curso-visual" className="scroll-mt-16"><EnemVisualPractice /></section>
    <section id="curso-redacao" className="scroll-mt-16"><EssayPractice /></section>
  </div>;
}

export default function AdmissionsPlannerGate({ onBack }: { onBack: () => void }) {
  return <AuthProvider><Gate onBack={onBack} /></AuthProvider>;
}
