import { lazy, Suspense, useEffect, useState } from 'react';
import { BarChart3, BookOpenCheck, BrainCircuit, ChevronLeft, FileText, Home, LayoutGrid, Loader2, LogIn, LogOut, Mic2, ScanLine, Target } from 'lucide-react';
import AdmissionsPlannerV11 from '@/components/AdmissionsPlannerV11';
import CourseDashboard from '@/components/CourseDashboard';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import './admissions-planner-v8.css';

const AdmissionsTargetIntelligence=lazy(()=>import('@/components/AdmissionsTargetIntelligence'));
const EssayPractice=lazy(()=>import('@/components/EssayPractice'));
const EnemVisualPractice=lazy(()=>import('@/components/EnemVisualPractice'));
const OfficialExamReviewV2=lazy(()=>import('@/components/SimulationAndReview'));
const CourseDataProof=lazy(()=>import('@/components/CourseDataProof'));
const AIEducationTutor=lazy(()=>import('@/components/AIEducationTutor'));
const PhaseTrainingLab=lazy(()=>import('@/components/PhaseTrainingLab'));
const StudentStrategyCenter=lazy(()=>import('@/components/StudentStrategyCenter'));
const EmbeddedQuestionBank=lazy(()=>import('@/components/EmbeddedQuestionBank'));

type MainView='inicio'|'plano'|'treinar'|'mais';
type TrainingView='hub'|'questoes'|'simulados'|'fases'|'visual'|'redacao';
type MoreView='hub'|'estrategia'|'metas'|'dados';
type PlannerFocus='course'|'university'|'scores'|null;
const ToolFallback=()=> <div className="grid min-h-[240px] place-items-center text-[#72a5ff]"><Loader2 className="animate-spin" /></div>;

function Gate({ onBack }: { onBack: () => void }) {
  const { user, loading } = useAuth();
  const [view,setView]=useState<MainView>('inicio');
  const [trainingView,setTrainingView]=useState<TrainingView>('hub');
  const [moreView,setMoreView]=useState<MoreView>('hub');
  const [plannerTab,setPlannerTab]=useState<'Hoje'|'Plano'|'Questões'|'Prova'>('Plano');
  const [plannerFocus,setPlannerFocus]=useState<PlannerFocus>(null);

  useEffect(()=>{
    if(view!=='plano')return;
    let stopped=false; let tries=0;
    const finishNavigation=()=>{window.setTimeout(()=>{if(stopped)return;const id=plannerFocus==='course'?'course-target-course':plannerFocus==='university'?'course-target-university':plannerFocus==='scores'?'planner-scores':null;const destination=id?document.getElementById(id):null;if(destination){destination.scrollIntoView({behavior:'smooth',block:'start'});destination.classList.remove('course-focus-pulse');void destination.getBoundingClientRect();destination.classList.add('course-focus-pulse');window.setTimeout(()=>destination.classList.remove('course-focus-pulse'),1400);}else{window.scrollTo({top:0,behavior:'smooth'});}},120);};
    const activate=()=>{if(stopped||tries>=50)return;tries+=1;const buttons=Array.from(document.querySelectorAll<HTMLButtonElement>('#curso-planner .plan6-tab'));const target=buttons.find(button=>button.textContent?.trim()===plannerTab);if(target){if(!target.classList.contains('active'))target.click();if(target.classList.contains('active')){finishNavigation();return;}}window.setTimeout(activate,75);};
    activate(); return()=>{stopped=true};
  },[view,plannerTab,plannerFocus]);

  if (loading) return <div className="min-h-screen bg-[#020817] flex items-center justify-center text-[#72a5ff]"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  const openAccount = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('auth', 'login');
    url.searchParams.set('next', 'course');
    window.location.assign(`${url.pathname}${url.search}${url.hash}`);
  };
  const signOut = async () => { try { await supabase?.auth.signOut(); } finally { window.location.assign('/'); } };
  const openPlanner=(tab:'Hoje'|'Plano'|'Questões'|'Prova',focus:PlannerFocus=null)=>{setPlannerFocus(focus);setPlannerTab(tab);setView('plano')};
  const openTraining=(next:TrainingView='hub')=>{setTrainingView(next);setView('treinar');window.scrollTo({top:0})};
  const openMore=(next:MoreView='hub')=>{setMoreView(next);setView('mais');window.scrollTo({top:0})};
  const switchMain=(next:MainView)=>{setPlannerFocus(null);if(next==='plano')setPlannerTab('Plano');setView(next);if(next==='treinar')setTrainingView('hub');if(next==='mais')setMoreView('hub');window.scrollTo({top:0,behavior:'smooth'})};
  const topNav:[MainView,string,typeof Home][]=[['inicio','Início',Home],['plano','Plano',Target],['treinar','Treinar',BookOpenCheck],['mais','Mais',LayoutGrid]];

  return <div className="min-h-screen bg-[#020817] text-white"><header className="sticky top-0 z-[92] border-b border-[#173765] bg-[#020817]/95 backdrop-blur-xl"><div className="mx-auto flex max-w-[1180px] items-center gap-2 px-3 py-2.5 md:px-6"><button type="button" onClick={()=>switchMain('inicio')} className="mr-1 flex shrink-0 items-center gap-2 rounded-xl px-1.5 py-1 font-extrabold"><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#246cff] text-sm">C</span><span className="hidden lg:block">Curso</span></button><nav className="hidden min-w-0 flex-1 items-center gap-1 md:flex">{topNav.map(([id,label,Icon])=><button key={id} type="button" onClick={()=>switchMain(id)} className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition ${view===id?'bg-[#0b2856] text-white':'text-[#9fb5d4] hover:bg-[#081d40] hover:text-white'}`}><Icon size={14}/>{label}</button>)}</nav><div className="min-w-0 flex-1 md:hidden"><div className="truncate text-sm font-extrabold">{view==='inicio'?'Meu Curso':view==='plano'?'Meu plano':view==='treinar'?'Treinar':'Mais recursos'}</div></div>{user?<button type="button" onClick={signOut} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#234576] bg-[#071a38] px-3 py-2 text-xs font-bold text-white" aria-label="Sair da conta"><LogOut className="w-4 h-4" /><span className="hidden md:inline">Sair</span></button>:<button type="button" onClick={openAccount} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[#72a5ff]/35 bg-[#0b2856] px-3 py-2 text-xs font-bold text-white"><LogIn className="w-4 h-4" /><span className="hidden sm:inline">Salvar progresso</span><span className="sm:hidden">Entrar</span></button>}</div></header>{!user&&<div className="border-b border-[#173765] bg-[#071a38]"><div className="mx-auto flex max-w-[1180px] flex-col gap-2 px-4 py-3 text-xs text-[#b8c9e2] sm:flex-row sm:items-center sm:justify-between md:px-6"><span>Você pode usar o curso sem conta. Criar uma conta ajuda a salvar e sincronizar seu progresso entre dispositivos.</span><button type="button" onClick={openAccount} className="shrink-0 font-extrabold text-[#8bb8ff]">Entrar / criar conta</button></div></div>}
    {view==='inicio'&&<CourseDashboard onOpenPlan={()=>openPlanner('Plano')} onOpenTwin={()=>openPlanner('Plano')} onOpenNotes={()=>openPlanner('Hoje','scores')} onOpenCourse={()=>openPlanner('Hoje','course')} onOpenUniversity={()=>openPlanner('Hoje','university')} onOpenTraining={()=>openTraining('hub')}/>} 
    {view==='plano'&&<section id="curso-planner" className="[&_.plan6-bottomnav]:!hidden"><AdmissionsPlannerV11 onBack={()=>switchMain('inicio')} /></section>}
    {view==='treinar'&&<main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 md:px-6 md:pb-12 md:pt-8">{trainingView==='hub'?<><div className="mb-5"><div className="text-[11px] font-extrabold uppercase tracking-[.1em] text-[#72a5ff]">Treinar</div><h1 className="mt-2 text-3xl font-extrabold tracking-[-.04em]">Escolha o tipo de treino.</h1><p className="mt-2 text-sm text-[#9fb5d4]">Uma escolha por vez, sem misturar ferramentas na mesma tela.</p></div><div className="grid gap-3 md:grid-cols-2">{[['questoes','Questões','Pratique por matéria e conteúdo no banco de questões.',BookOpenCheck],['simulados','Simulados e correção','Faça provas e transforme erros em prioridades.',BarChart3],['fases','Outras fases','Entrevista, oral, PREP, SPRINT e etapas específicas.',Mic2],['visual','Questões por foto','Envie uma questão ou dificuldade visual para a IA.',ScanLine],['redacao','Redação','Treine texto e acompanhe a evolução dentro do Curso.',FileText]].map(([id,title,text,Icon])=><button key={String(id)} type="button" onClick={()=>openTraining(id as TrainingView)} className="flex min-h-[116px] items-center gap-4 rounded-[20px] border border-[#173765] bg-[#06152f] p-4 text-left transition hover:border-[#31588e]"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#0b2856] text-[#72a5ff]"><Icon size={21}/></span><span><strong className="block text-lg">{String(title)}</strong><span className="mt-1 block text-xs leading-relaxed text-[#8ea6c9]">{String(text)}</span></span></button>)}</div></>:<><button type="button" onClick={()=>setTrainingView('hub')} className="mb-4 inline-flex items-center gap-1.5 text-xs font-extrabold text-[#8bb8ff]"><ChevronLeft size={15}/>Todos os treinos</button><Suspense fallback={<ToolFallback/>}>{trainingView==='questoes'&&<EmbeddedQuestionBank/>}{trainingView==='simulados'&&<OfficialExamReviewV2/>}{trainingView==='fases'&&<PhaseTrainingLab/>}{trainingView==='visual'&&<EnemVisualPractice/>}{trainingView==='redacao'&&<EssayPractice/>}</Suspense></>}</main>}
    {view==='mais'&&<main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 md:px-6 md:pb-12 md:pt-8">{moreView==='hub'?<><div className="mb-5"><div className="text-[11px] font-extrabold uppercase tracking-[.1em] text-[#72a5ff]">Mais recursos</div><h1 className="mt-2 text-3xl font-extrabold tracking-[-.04em]">Tudo tem um lugar claro.</h1><p className="mt-2 text-sm text-[#9fb5d4]">Recursos de apoio ficam aqui para não competir com o que você precisa fazer todos os dias.</p></div><div className="grid gap-3 md:grid-cols-2">{[['estrategia','Estratégia','Descubra o próximo melhor movimento do seu plano.',BrainCircuit],['metas','Metas de aprovação','Veja distância até a meta e referências por vestibular.',Target],['dados','Fontes e dados','Entenda de onde vêm notas de corte, estruturas e referências.',BookOpenCheck]].map(([id,title,text,Icon])=><button key={String(id)} type="button" onClick={()=>openMore(id as MoreView)} className="flex min-h-[116px] items-center gap-4 rounded-[20px] border border-[#173765] bg-[#06152f] p-4 text-left transition hover:border-[#31588e]"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#0b2856] text-[#72a5ff]"><Icon size={21}/></span><span><strong className="block text-lg">{String(title)}</strong><span className="mt-1 block text-xs leading-relaxed text-[#8ea6c9]">{String(text)}</span></span></button>)}</div></>:<><button type="button" onClick={()=>setMoreView('hub')} className="mb-4 inline-flex items-center gap-1.5 text-xs font-extrabold text-[#8bb8ff]"><ChevronLeft size={15}/>Mais recursos</button><Suspense fallback={<ToolFallback/>}>{moreView==='estrategia'&&<StudentStrategyCenter/>}{moreView==='metas'&&<AdmissionsTargetIntelligence/>}{moreView==='dados'&&<CourseDataProof/>}</Suspense></>}</main>}
    <nav aria-label="Navegação principal do Curso" className="course-mobile-nav fixed inset-x-0 bottom-0 z-[95] border-t border-[#173765] bg-[#020817]/97 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl md:hidden"><div className="course-mobile-nav-grid mx-auto max-w-md gap-1" style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))'}}>{topNav.map(([id,label,Icon])=><button key={id} type="button" onClick={()=>switchMain(id)} className={`flex min-h-[54px] min-w-0 w-full touch-manipulation flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-extrabold transition active:scale-[.97] ${view===id?'bg-[#0b2856] text-white':'text-[#839abb]'}`}><Icon size={18}/><span>{label}</span></button>)}</div></nav><Suspense fallback={null}><AIEducationTutor mobileDocked /></Suspense>
  </div>;
}

export default function AdmissionsPlannerGate({ onBack }: { onBack: () => void }) { return <Gate onBack={onBack} />; }
