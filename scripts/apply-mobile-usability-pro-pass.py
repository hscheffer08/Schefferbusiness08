from pathlib import Path


def patch(path: str, old: str, new: str, expected: int = 1) -> None:
    p = Path(path)
    text = p.read_text()
    count = text.count(old)
    if count != expected:
        raise SystemExit(f"{path}: expected {expected} occurrence(s), found {count}: {old[:100]!r}")
    p.write_text(text.replace(old, new))


# Course dashboard: make target editing explicit and mobile-friendly.
patch(
    'src/components/CourseDashboard.tsx',
    "type Props={onOpenPlan:()=>void;onOpenTwin:()=>void;onOpenNotes:()=>void;onOpenTraining:()=>void;};",
    "type Props={onOpenPlan:()=>void;onOpenTwin:()=>void;onOpenNotes:()=>void;onOpenTraining:()=>void;onOpenCourse:()=>void;onOpenUniversity:()=>void;};",
)
patch(
    'src/components/CourseDashboard.tsx',
    "export default function CourseDashboard({onOpenPlan,onOpenTwin,onOpenNotes,onOpenTraining}:Props){",
    "export default function CourseDashboard({onOpenPlan,onOpenTwin,onOpenNotes,onOpenTraining,onOpenCourse,onOpenUniversity}:Props){",
)
patch(
    'src/components/CourseDashboard.tsx',
    'return <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 text-white md:px-6 md:pb-12 md:pt-8">',
    'return <main className="mx-auto w-full max-w-5xl px-4 pb-[calc(9rem+env(safe-area-inset-bottom))] pt-4 text-white md:px-6 md:pb-12 md:pt-8">',
)
patch(
    'src/components/CourseDashboard.tsx',
    '<h1 className="max-w-2xl text-[30px] font-extrabold leading-[1.05] tracking-[-.045em] md:text-5xl">',
    '<h1 className="max-w-2xl text-[28px] font-extrabold leading-[1.04] tracking-[-.045em] sm:text-[32px] md:text-5xl">',
)
patch(
    'src/components/CourseDashboard.tsx',
    '<button type="button" onClick={onOpenNotes} className="group flex min-h-[108px] items-center gap-4 rounded-[20px] border border-[#173765] bg-[#06152f] p-4 text-left transition hover:border-[#315f9f] md:p-5"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#0b2856] text-[#72a5ff]"><GraduationCap size={21}/></span><span className="min-w-0 flex-1"><span className="block text-[11px] font-bold uppercase tracking-[.08em] text-[#7691b5]">Curso</span><strong className="mt-1 block truncate text-lg tracking-[-.02em]">{targetCourse}</strong><span className="mt-1 block text-xs text-[#8ea6c9]">Toque para alterar</span></span><ChevronRight className="shrink-0 text-[#57739b]" size={19}/></button>',
    '<button type="button" onClick={onOpenCourse} className="group flex min-h-[94px] touch-manipulation items-center gap-3.5 rounded-[18px] border border-[#234a7e] bg-[#06152f] p-3.5 text-left transition active:scale-[.99] hover:border-[#315f9f] sm:min-h-[108px] sm:gap-4 sm:rounded-[20px] sm:p-4 md:p-5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#0b2856] text-[#72a5ff] sm:h-11 sm:w-11 sm:rounded-2xl"><GraduationCap size={21}/></span><span className="min-w-0 flex-1"><span className="block text-[11px] font-bold uppercase tracking-[.08em] text-[#7691b5]">Curso</span><strong className="mt-1 block break-words text-[17px] font-extrabold leading-tight tracking-[-.02em] sm:text-lg">{targetCourse}</strong><span className="mt-1 block text-xs font-bold text-[#8bb8ff]">Alterar curso</span></span><ChevronRight className="shrink-0 text-[#72a5ff]" size={19}/></button>',
)
patch(
    'src/components/CourseDashboard.tsx',
    '<button type="button" onClick={onOpenNotes} className="group flex min-h-[108px] items-center gap-4 rounded-[20px] border border-[#173765] bg-[#06152f] p-4 text-left transition hover:border-[#315f9f] md:p-5"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#0b2856] text-[#72a5ff]"><School size={21}/></span><span className="min-w-0 flex-1"><span className="block text-[11px] font-bold uppercase tracking-[.08em] text-[#7691b5]">Faculdade</span><strong className="mt-1 block truncate text-lg tracking-[-.02em]">{targetUniversity}</strong><span className="mt-1 block text-xs text-[#8ea6c9]">Sua meta principal</span></span><ChevronRight className="shrink-0 text-[#57739b]" size={19}/></button>',
    '<button type="button" onClick={onOpenUniversity} className="group flex min-h-[94px] touch-manipulation items-center gap-3.5 rounded-[18px] border border-[#234a7e] bg-[#06152f] p-3.5 text-left transition active:scale-[.99] hover:border-[#315f9f] sm:min-h-[108px] sm:gap-4 sm:rounded-[20px] sm:p-4 md:p-5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-[#0b2856] text-[#72a5ff] sm:h-11 sm:w-11 sm:rounded-2xl"><School size={21}/></span><span className="min-w-0 flex-1"><span className="block text-[11px] font-bold uppercase tracking-[.08em] text-[#7691b5]">Faculdade</span><strong className="mt-1 block break-words text-[17px] font-extrabold leading-tight tracking-[-.02em] sm:text-lg">{targetUniversity}</strong><span className="mt-1 block text-xs font-bold text-[#8bb8ff]">Alterar faculdade</span></span><ChevronRight className="shrink-0 text-[#72a5ff]" size={19}/></button>',
)
patch(
    'src/components/CourseDashboard.tsx',
    'className="rounded-[20px] border border-[#173765] bg-[#06152f] p-4 text-left transition hover:border-[#315f9f] md:p-5"',
    'className="touch-manipulation rounded-[18px] border border-[#173765] bg-[#06152f] p-4 text-left transition active:scale-[.995] hover:border-[#315f9f] sm:rounded-[20px] md:p-5"',
    expected=2,
)
patch(
    'src/components/CourseDashboard.tsx',
    'className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5"',
    'className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5"',
)

# Course shell: route taps to the exact edit section and enforce a one-row mobile nav.
patch(
    'src/components/AdmissionsPlannerGate.tsx',
    "type MoreView='hub'|'estrategia'|'metas'|'dados';",
    "type MoreView='hub'|'estrategia'|'metas'|'dados';\ntype PlannerFocus='course'|'university'|'scores'|null;",
)
patch(
    'src/components/AdmissionsPlannerGate.tsx',
    "  const [plannerTab,setPlannerTab]=useState<'Hoje'|'Plano'|'Questões'|'Prova'>('Plano');",
    "  const [plannerTab,setPlannerTab]=useState<'Hoje'|'Plano'|'Questões'|'Prova'>('Plano');\n  const [plannerFocus,setPlannerFocus]=useState<PlannerFocus>(null);",
)
old_effect = """  useEffect(()=>{\n    if(view!=='plano')return;\n    let stopped=false;\n    let tries=0;\n    const activate=()=>{\n      if(stopped||tries>=50)return;\n      tries+=1;\n      const buttons=Array.from(document.querySelectorAll<HTMLButtonElement>('#curso-planner .plan6-tab'));\n      const target=buttons.find(button=>button.textContent?.trim()===plannerTab);\n      if(target){\n        if(!target.classList.contains('active'))target.click();\n        if(target.classList.contains('active')){window.scrollTo({top:0,behavior:'smooth'});return;}\n      }\n      window.setTimeout(activate,75);\n    };\n    activate();\n    return()=>{stopped=true};\n  },[view,plannerTab]);"""
new_effect = """  useEffect(()=>{\n    if(view!=='plano')return;\n    let stopped=false;\n    let tries=0;\n    const finishNavigation=()=>{\n      window.setTimeout(()=>{\n        if(stopped)return;\n        const id=plannerFocus==='course'?'course-target-course':plannerFocus==='university'?'course-target-university':plannerFocus==='scores'?'planner-scores':null;\n        const destination=id?document.getElementById(id):null;\n        if(destination){\n          destination.scrollIntoView({top:0,behavior:'smooth',block:'start'} as ScrollIntoViewOptions);\n          destination.classList.remove('course-focus-pulse');\n          void destination.getBoundingClientRect();\n          destination.classList.add('course-focus-pulse');\n          window.setTimeout(()=>destination.classList.remove('course-focus-pulse'),1400);\n        }else{\n          window.scrollTo({top:0,behavior:'smooth'});\n        }\n      },120);\n    };\n    const activate=()=>{\n      if(stopped||tries>=50)return;\n      tries+=1;\n      const buttons=Array.from(document.querySelectorAll<HTMLButtonElement>('#curso-planner .plan6-tab'));\n      const target=buttons.find(button=>button.textContent?.trim()===plannerTab);\n      if(target){\n        if(!target.classList.contains('active'))target.click();\n        if(target.classList.contains('active')){finishNavigation();return;}\n      }\n      window.setTimeout(activate,75);\n    };\n    activate();\n    return()=>{stopped=true};\n  },[view,plannerTab,plannerFocus]);"""
# TypeScript's scrollIntoView does not accept top; keep options standard after textual assembly.
new_effect = new_effect.replace("{top:0,behavior:'smooth',block:'start'} as ScrollIntoViewOptions", "{behavior:'smooth',block:'start'}")
patch('src/components/AdmissionsPlannerGate.tsx', old_effect, new_effect)
patch(
    'src/components/AdmissionsPlannerGate.tsx',
    "  const openPlanner=(tab:'Hoje'|'Plano'|'Questões'|'Prova')=>{setPlannerTab(tab);setView('plano')};",
    "  const openPlanner=(tab:'Hoje'|'Plano'|'Questões'|'Prova',focus:PlannerFocus=null)=>{setPlannerFocus(focus);setPlannerTab(tab);setView('plano')};",
)
patch(
    'src/components/AdmissionsPlannerGate.tsx',
    "  const switchMain=(next:MainView)=>{if(next==='plano')setPlannerTab('Plano');setView(next);if(next==='treinar')setTrainingView('hub');if(next==='mais')setMoreView('hub');window.scrollTo({top:0,behavior:'smooth'})};",
    "  const switchMain=(next:MainView)=>{setPlannerFocus(null);if(next==='plano')setPlannerTab('Plano');setView(next);if(next==='treinar')setTrainingView('hub');if(next==='mais')setMoreView('hub');window.scrollTo({top:0,behavior:'smooth'})};",
)
patch(
    'src/components/AdmissionsPlannerGate.tsx',
    "    {view==='inicio'&&<CourseDashboard onOpenPlan={()=>openPlanner('Plano')} onOpenTwin={()=>openPlanner('Plano')} onOpenNotes={()=>openPlanner('Hoje')} onOpenTraining={()=>openTraining('hub')}/>} ",
    "    {view==='inicio'&&<CourseDashboard onOpenPlan={()=>openPlanner('Plano')} onOpenTwin={()=>openPlanner('Plano')} onOpenNotes={()=>openPlanner('Hoje','scores')} onOpenCourse={()=>openPlanner('Hoje','course')} onOpenUniversity={()=>openPlanner('Hoje','university')} onOpenTraining={()=>openTraining('hub')}/>} ",
)
patch(
    'src/components/AdmissionsPlannerGate.tsx',
    '<nav className="fixed inset-x-0 bottom-0 z-[95] border-t border-[#173765] bg-[#020817]/97 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden"><div className="mx-auto grid max-w-md grid-cols-4 gap-1">',
    '<nav aria-label="Navegação principal do Curso" className="course-mobile-nav fixed inset-x-0 bottom-0 z-[95] border-t border-[#173765] bg-[#020817]/97 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl md:hidden"><div className="course-mobile-nav-grid mx-auto max-w-md gap-1" style={{display:\'grid\',gridTemplateColumns:\'repeat(4,minmax(0,1fr))\'}}>',
)
patch(
    'src/components/AdmissionsPlannerGate.tsx',
    "className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-extrabold ${view===id?'bg-[#0b2856] text-white':'text-[#839abb]'}`}",
    "className={`flex min-h-[54px] min-w-0 w-full touch-manipulation flex-col items-center justify-center gap-1 rounded-xl px-1 text-[10px] font-extrabold transition active:scale-[.97] ${view===id?'bg-[#0b2856] text-white':'text-[#839abb]'}`}",
)
patch(
    'src/components/AdmissionsPlannerGate.tsx',
    '    <Suspense fallback={null}><AIEducationTutor /></Suspense>',
    '    <Suspense fallback={null}><AIEducationTutor mobileDocked /></Suspense>',
)

# Planner: give mobile shell stable destinations and clearer save semantics.
patch(
    'src/components/AdmissionsPlannerV11.tsx',
    '<section className="plan6-selectors"><div className="plan6-field"><label>Curso</label><select',
    '<section id="course-target-settings" className="plan6-selectors"><div id="course-target-course" className="plan6-field"><label>Curso</label><select',
)
patch(
    'src/components/AdmissionsPlannerV11.tsx',
    '</select></div><div className="plan6-field"><label>Faculdade</label><select value={selectedUniversity}',
    '</select></div><div id="course-target-university" className="plan6-field"><label>Faculdade</label><select value={selectedUniversity}',
)
patch(
    'src/components/AdmissionsPlannerV11.tsx',
    'Salvar notas e atualizar meu plano</button></section>',
    'Salvar curso, faculdade e atualizar plano</button></section>',
)
patch(
    'src/components/AdmissionsPlannerV11.tsx',
    '<section className="plan6-card span12"><div className="plan6-sectionlabel">Suas notas</div>',
    '<section id="planner-scores" className="plan6-card span12"><div className="plan6-sectionlabel">Suas notas</div>',
)

# Tutor: dock above the Course mobile nav instead of covering it.
patch(
    'src/components/AIEducationTutor.tsx',
    'export default function AIEducationTutor(){',
    'export default function AIEducationTutor({mobileDocked=false}:{mobileDocked?:boolean}={}){',
)
patch(
    'src/components/AIEducationTutor.tsx',
    "${expanded?'inset-2 md:inset-6 rounded-[22px]':'bottom-20 right-2 w-[calc(100vw-16px)] max-w-[460px] h-[min(720px,calc(100vh-100px))] rounded-[22px] md:right-5'}",
    "${expanded?'inset-2 md:inset-6 rounded-[22px]':mobileDocked?'bottom-[calc(78px+env(safe-area-inset-bottom))] right-2 w-[calc(100vw-16px)] max-w-[460px] h-[min(720px,calc(100dvh-158px))] rounded-[22px] md:bottom-20 md:right-5 md:h-[min(720px,calc(100vh-100px))]':'bottom-20 right-2 w-[calc(100vw-16px)] max-w-[460px] h-[min(720px,calc(100vh-100px))] rounded-[22px] md:right-5'}",
)
patch(
    'src/components/AIEducationTutor.tsx',
    '<button onClick={()=>{setError(\'\');setOpen(true)}} className="fixed bottom-4 right-4 z-[119] inline-flex items-center gap-2 rounded-2xl bg-[#246cff] px-4 py-3 text-sm font-extrabold text-white shadow-xl shadow-black/30 hover:bg-[#2d75ff]"><Bot size={18}/>IA Conectaê</button>',
    '<button onClick={()=>{setError(\'\');setOpen(true)}} aria-label="Abrir IA Conectaê" className={`fixed z-[119] inline-flex items-center gap-2 rounded-2xl bg-[#246cff] text-sm font-extrabold text-white shadow-xl shadow-black/30 transition hover:bg-[#2d75ff] ${mobileDocked?\'bottom-[calc(78px+env(safe-area-inset-bottom))] right-3 h-12 w-12 justify-center p-0 md:bottom-4 md:right-4 md:h-auto md:w-auto md:px-4 md:py-3\':\'bottom-4 right-4 px-4 py-3\'}`}><Bot size={18}/><span className={mobileDocked?\'hidden md:inline\':\'inline\'}>IA Conectaê</span></button>',
)

# Mobile CSS: safe areas, 16px native selects, explicit single-row nav, focus feedback.
css = Path('src/components/admissions-planner-v8.css')
css.write_text(css.read_text() + r'''

/* Course mobile usability hardening */
@keyframes course-focus-pulse{0%,100%{box-shadow:0 0 0 0 rgba(75,140,255,0)}35%{box-shadow:0 0 0 4px rgba(75,140,255,.22)}}
.course-focus-pulse{animation:course-focus-pulse 1.25s ease-out}
@media(max-width:767px){
  #curso-planner #course-target-course,#curso-planner #course-target-university,#curso-planner #planner-scores{scroll-margin-top:78px}
  #curso-planner .plan6-selectors{margin:4px 0 10px!important;padding:14px!important;border:1px solid rgba(75,140,255,.25)!important;border-radius:18px!important;background:linear-gradient(180deg,rgba(11,40,86,.68),rgba(6,21,48,.88))!important;gap:12px!important}
  #curso-planner .plan6-field label{margin-bottom:6px!important;font-size:12px!important;color:#9dbcf0!important}
  #curso-planner .plan6-field select{min-height:52px!important;font-size:16px!important;padding-left:13px!important;padding-right:36px!important;touch-action:manipulation}
  #curso-planner .plan6-save{min-height:52px!important;font-size:13px!important;line-height:1.25!important;padding:0 14px!important}
  .course-mobile-nav{min-height:64px;overflow:visible}
  .course-mobile-nav-grid{width:100%;grid-template-columns:repeat(4,minmax(0,1fr))!important}
  .course-mobile-nav-grid>button{width:100%!important;max-width:none!important;min-width:0!important;margin:0!important}
}
''')

# Respect iPhone safe areas when running as an installed/web app.
patch(
    'index.html',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />',
)

# Vercel Pro: collect real-user Core Web Vitals with Speed Insights.
patch(
    'src/main.tsx',
    "import { Analytics } from '@vercel/analytics/react';",
    "import { Analytics } from '@vercel/analytics/react';\nimport { SpeedInsights } from '@vercel/speed-insights/react';",
)
patch(
    'src/main.tsx',
    '    <Analytics />\n  </StrictMode>',
    '    <Analytics />\n    <SpeedInsights />\n  </StrictMode>',
)

# Permanently guard the mobile UX assumptions in the build.
package = Path('package.json')
text = package.read_text()
text = text.replace(
    '"build": "npm run lint && npm run validate:planner-auth',
    '"build": "npm run lint && npm run validate:mobile-ux && npm run validate:planner-auth',
)
text = text.replace(
    '"validate:planner-auth": "node scripts/validate-planner-auth.mjs",',
    '"validate:mobile-ux": "node scripts/validate-mobile-course-ux.mjs",\n    "validate:planner-auth": "node scripts/validate-planner-auth.mjs",',
)
package.write_text(text)

print('Mobile usability + Vercel Pro pass applied.')
