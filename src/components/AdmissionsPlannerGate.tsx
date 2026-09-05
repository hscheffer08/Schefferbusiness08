import { useEffect, useState } from 'react';
import { BarChart3, BookOpenCheck, BrainCircuit, ChevronLeft, FileText, Home, LayoutGrid, Loader2, LockKeyhole, LogIn, LogOut, Mic2, ScanLine, Target, UserCheck } from 'lucide-react';
import Auth from '@/components/Auth';
import AdmissionsPlannerV11 from '@/components/AdmissionsPlannerV11';
import AdmissionsTargetIntelligence from '@/components/AdmissionsTargetIntelligence';
import EssayPractice from '@/components/EssayPractice';
import EnemVisualPractice from '@/components/EnemVisualPractice';
import OfficialExamReviewV2 from '@/components/OfficialExamReviewV2';
import CourseDataProof from '@/components/CourseDataProof';
import AIEducationTutor from '@/components/AIEducationTutor';
import PhaseTrainingLab from '@/components/PhaseTrainingLab';
import StudentStrategyCenter from '@/components/StudentStrategyCenter';
import CourseDashboard from '@/components/CourseDashboard';
import EmbeddedQuestionBank from '@/components/EmbeddedQuestionBank';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import './admissions-planner-v8.css';

type MainView='inicio'|'plano'|'treinar'|'mais';
type TrainingView='hub'|'questoes'|'simulados'|'fases'|'visual'|'redacao';
type MoreView='hub'|'estrategia'|'metas'|'dados';

function Gate({ onBack }: { onBack: () => void }) {
  const { user, loading } = useAuth();
  const [accessConfirmed, setAccessConfirmed] = useState(false);
  const [switchingAccount, setSwitchingAccount] = useState(false);
  const [view,setView]=useState<MainView>('inicio');
  const [trainingView,setTrainingView]=useState<TrainingView>('hub');
  const [moreView,setMoreView]=useState<MoreView>('hub');
  const [plannerTab,setPlannerTab]=useState<'Hoje'|'Plano'|'Questões'|'Prova'>('Hoje');

  useEffect(()=>{
    if(view!=='plano')return;
    let stopped=false;
    let tries=0;
    const activate=()=>{
      if(stopped||tries>=50)return;
      tries+=1;
      const buttons=Array.from(document.querySelectorAll<HTMLButtonElement>('#curso-planner .plan6-tab'));
      const target=buttons.find(button=>button.textContent?.trim()===plannerTab);
      if(target){
        if(!target.classList.contains('active'))target.click();
        if(target.classList.contains('active')){window.scrollTo({top:0,behavior:'smooth'});return;}
      }
      window.setTimeout(activate,75);
    };
    activate();
    return()=>{stopped=true};
  },[view,plannerTab]);

  if (loading) return <div className="min-h-screen bg-[#020817] flex items-center justify-center text-[#72a5ff]"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  const signOut = async () => { try { await supabase?.auth.signOut(); } finally { window.location.reload(); } };
  const useAnotherAccount = async () => { setSwitchingAccount(true); try { await supabase?.auth.signOut(); } finally { window.location.reload(); } };

  if (!user) return <div className="min-h-screen bg-[radial-gradient(circle_at_70%_0%,rgba(36,108,255,.12),transparent_32%),linear-gradient(180deg,#020817,#041027)] text-white flex flex-col">
    <div className="w-full max-w-xl mx-auto px-5 pt-8 md:pt-10 text-center"><div className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-[#72a5ff]"><LockKeyhole className="w-4 h-4" /> CURSO DE APROVAÇÃO</div><h1 className="mt-4 text-3xl md:text-5xl font-extrabold tracking-[-0.045em] leading-[1.02]">Entre para abrir seu Curso.</h1><p className="mt-3 text-sm md:text-base text-[#a9bddc] leading-relaxed">Curso-alvo, faculdade, notas, gêmeo de estudos e todo o seu progresso ficam salvos na sua conta.</p></div>
    <div className="w-full max-w-xl mx-auto mt-5 md:mt-6 px-1 [&_h1]:!text-white [&_label]:!text-[#b8cae4] [&_p]:!text-[#9fb5d4] [&_input]:!bg-[#081a38] [&_input]:!text-white [&_input]:!border-[#173765] [&_button]:!rounded-[12px]"><Auth compact onBack={onBack} onSuccess={() => {}} onPrivacy={onBack} onTerms={onBack} /></div>
  </div>;

  if (!accessConfirmed) return <div className="min-h-screen bg-[radial-gradient(circle_at_60%_0%,rgba(36,108,255,.14),transparent_35%),linear-gradient(180deg,#020817,#041027)] text-white flex items-center justify-center px-5 py-10"><div className="w-full max-w-lg rounded-[24px] border border-[#173765] bg-[#06152f] p-6 md:p-8 shadow-2xl"><div className="inline-flex items-center gap-2 text-xs font-extrabold text-[#72a5ff]"><UserCheck size={16}/>CURSO DE APROVAÇÃO</div><h1 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-[-.04em]">Continue de onde você parou.</h1><p className="mt-3 text-sm leading-relaxed text-[#a9bddc]">Ao entrar, você vê primeiro seu curso, faculdade, últimas notas e gêmeo de estudos.</p><div className="mt-5 rounded-2xl border border-[#234576] bg-[#081a38] p-4"><div className="text-xs text-[#839ab9]">Conta conectada</div><div className="mt-1 break-all font-bold">{user.email}</div></div><button type="button" onClick={()=>setAccessConfirmed(true)} className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#246cff] px-4 text-sm font-extrabold"><LogIn size={17}/>Entrar no meu Curso</button><button type="button" onClick={useAnotherAccount} disabled={switchingAccount} className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#234576] bg-[#081a38] px-4 text-sm font-bold disabled:opacity-50">{switchingAccount?<Loader2 size={16} className="animate-spin"/>:<LogOut size={16}/>}Entrar com outra conta</button><button type="button" onClick={onBack} className="mt-3 w-full text-xs font-bold text-[#8da5c5]">Voltar à página inicial</button></div></div>;

  const openPlanner=(tab:'Hoje'|'Plano'|'Questões'|'Prova')=>{setPlannerTab(tab);setView('plano')};
  const openTraining=(next:TrainingView='hub')=>{setTrainingView(next);setView('treinar');window.scrollTo({top:0})};
  const openMore=(next:MoreView='hub')=>{setMoreView(next);setView('mais');window.scrollTo({top:0})};
  const switchMain=(next:MainView)=>{setView(next);if(next==='treinar')setTrainingView('hub');if(next==='mais')setMoreView('hub');window.scrollTo({top:0,behavior:'smooth'})};

  const topNav:[MainView,string,typeof Home][]=[['inicio','Início',Home],['plano','Plano',Target],['treinar','Treinar',BookOpenCheck],['mais','Mais',LayoutGrid]];

  return <div className="min-h-screen bg-[#020817] text-white">
    <header className="sticky top-0 z-[92] border-b border-[#173765] bg-[#020817]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1180px] items-center gap-2 px-3 py-2.5 md:px-6">
        <button type="button" onClick={()=>switchMain('inicio')} className="mr-1 flex shrink-0 items-center gap-2 rounded-xl px-1.5 py-1 font-extrabold"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#246cff] text-sm">C</span><span className="hidden lg:block">Curso</span></button>
        <nav className="hidden min-w-0 flex-1 items-center gap-1 md:flex">{topNav.map(([id,label,Icon])=><button key={id} type="button" onClick={()=>switchMain(id)} className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${view===id?'bg-[#0b2856] text-white':'text-[#9fb5d4] hover:bg-[#081d40] hover:text-white'}`}><Icon size={14}/>{label}</button>)}</nav>
        <div className="min-w-0 flex-1 md:hidden"><div className="truncate text-sm font-extrabold">{view==='inicio'?'Meu Curso':view==='plano'?'Meu plano':view==='treinar'?'Treinar':'Mais recursos'}</div></div>
        <button type="button" onClick={signOut} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#234576] bg-[#071a38] px-3 py-2 text-xs font-bold text-white" aria-label="Sair da conta"><LogOut className="w-4 h-4" /><span className="hidden md:inline">Sair</span></button>
      </div>
    </header>

    {view==='inicio'&&<CourseDashboard onOpenPlan={()=>openPlanner('Plano')} onOpenTwin={()=>openPlanner('Plano')} onOpenNotes={()=>openPlanner('Hoje')} onOpenTraining={()=>openTraining('hub')}/>} 

    {view==='plano'&&<section id="curso-planner" className="[&_.plan6-bottomnav]:!hidden"><AdmissionsPlannerV11 onBack={()=>switchMain('inicio')} /></section>}

    {view==='treinar'&&<main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 md:px-6 md:pb-12 md:pt-8">
      {trainingView==='hub'?<><div className="mb-5"><div className="text-[11px] font-extrabold uppercase tracking-[.1em] text-[#72a5ff]">Treinar</div><h1 className="mt-2 text-3xl font-extrabold tracking-[-.04em]">Escolha o tipo de treino.</h1><p className="mt-2 text-sm text-[#9fb5d4]">Uma escolha por vez, sem misturar ferramentas na mesma tela.</p></div><div className="grid gap-3 md:grid-cols-2">{[
        ['questoes','Questões','Pratique por matéria e conteúdo no banco de questões.',BookOpenCheck],['simulados','Simulados e correção','Faça provas e transforme erros em prioridades.',BarChart3],['fases','Outras fases','Entrevista, oral, PREP, SPRINT e etapas específicas.',Mic2],['visual','Questões por foto','Envie uma questão ou dificuldade visual para a IA.',ScanLine],['redacao','Redação','Treine texto e acompanhe a evolução dentro do Curso.',FileText]
      ].map(([id,title,text,Icon])=><button key={String(id)} type="button" onClick={()=>openTraining(id as TrainingView)} className="flex min-h-[116px] items-center gap-4 rounded-[20px] border border-[#173765] bg-[#06152f] p-4 text-left transition hover:border-[#31588e]"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#0b2856] text-[#72a5ff]"><Icon size={21}/></span><span><strong className="block text-lg">{String(title)}</strong><span className="mt-1 block text-xs leading-relaxed text-[#8ea6c9]">{String(text)}</span></span></button>)}</div></>:<><button type="button" onClick={()=>setTrainingView('hub')} className="mb-4 inline-flex items-center gap-1.5 text-xs font-extrabold text-[#8bb8ff]"><ChevronLeft size={15}/>Todos os treinos</button>{trainingView==='questoes'&&<EmbeddedQuestionBank/>} {trainingView==='simulados'&&<OfficialExamReviewV2/>}{trainingView==='fases'&&<PhaseTrainingLab/>}{trainingView==='visual'&&<EnemVisualPractice/>}{trainingView==='redacao'&&<EssayPractice/>}</>}
    </main>}

    {view==='mais'&&<main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 md:px-6 md:pb-12 md:pt-8">
      {moreView==='hub'?<><div className="mb-5"><div className="text-[11px] font-extrabold uppercase tracking-[.1em] text-[#72a5ff]">Mais recursos</div><h1 className="mt-2 text-3xl font-extrabold tracking-[-.04em]">Tudo tem um lugar claro.</h1><p className="mt-2 text-sm text-[#9fb5d4]">Recursos de apoio ficam aqui para não competir com o que você precisa fazer todos os dias.</p></div><div className="grid gap-3 md:grid-cols-2">{[
        ['estrategia','Estratégia','Descubra o próximo melhor movimento do seu plano.',BrainCircuit],['metas','Metas de aprovação','Veja distância até a meta e referências por vestibular.',Target],['dados','Fontes e dados','Entenda de onde vêm notas de corte, estruturas e referências.',BookOpenCheck]
      ].map(([id,title,text,Icon])=><button key={String(id)} type="button" onClick={()=>openMore(id as MoreView)} className="flex min-h-[116px] items-center gap-4 rounded-[20px] border border-[#173765] bg-[#06152f] p-4 text-left transition hover:border-[#31588e]"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#0b2856] text-[#72a5ff]"><Icon size={21}/></span><span><strong className="block text-lg">{String(title)}</strong><span className="mt-1 block text-xs leading-relaxed text-[#8ea6c9]">{String(text)}</span></span></button>)}</div></>:<><button type="button" onClick={()=>setMoreView('hub')} className="mb-4 inline-flex items-center gap-1.5 text-xs font-extrabold text-[#8bb8ff]"><ChevronLeft size={15}/>Mais recursos</button>{moreView==='estrategia'&&<StudentStrategyCenter/>}{moreView==='metas'&&<AdmissionsTargetIntelligence/>}{moreView==='dados'&&<CourseDataProof/>}</>}
    </main>}

    <nav className="fixed inset-x-0 bottom-0 z-[95] border-t border-[#173765] bg-[#020817]/97 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden"><div className="mx-auto grid max-w-md grid-cols-4 gap-1">{topNav.map(([id,label,Icon])=><button key={id} type="button" onClick={()=>switchMain(id)} className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-extrabold ${view===id?'bg-[#0b2856] text-white':'text-[#839abb]'}`}><Icon size={18}/><span>{label}</span></button>)}</div></nav>
    <AIEducationTutor />
  </div>;
}

export default function AdmissionsPlannerGate({ onBack }: { onBack: () => void }) { return <AuthProvider><Gate onBack={onBack} /></AuthProvider>; }
