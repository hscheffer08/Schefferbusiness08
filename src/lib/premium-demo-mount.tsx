import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, BrainCircuit, Crown, FileText, GraduationCap, Lock, Medal, Sparkles, Target, Trophy, UserRound } from 'lucide-react';

function PremiumPage({ onClose }:{ onClose:()=>void }) {
  const fields = [
    ['Nome completo','Seu nome'],
    ['Curso desejado','Ex.: Administração'],
    ['Média escolar','Ex.: 8,4 / 10'],
    ['SAT / ENEM / vestibulares','Informe suas notas'],
    ['Inglês','Nível e certificações'],
    ['Atividades extracurriculares','Liderança, projetos, olimpíadas, trabalho...'],
    ['Preferências de faculdade','Cidade, tamanho, ambiente, orçamento...'],
    ['Objetivos de carreira','O que você quer construir depois da graduação'],
  ];

  return <div className="fixed inset-0 z-[180] overflow-y-auto bg-[#050912] text-ink-50">
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 left-[10%] h-[520px] w-[520px] rounded-full bg-amber-400/10 blur-[150px]" />
      <div className="absolute top-[30%] -right-36 h-[540px] w-[540px] rounded-full bg-violet-500/10 blur-[160px]" />
    </div>

    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#050912]/88 px-5 py-4 backdrop-blur-2xl md:px-10">
      <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-4">
        <button onClick={onClose} className="inline-flex items-center gap-2 text-sm font-bold text-ink-300 hover:text-white"><ArrowLeft className="h-4 w-4"/> Voltar</button>
        <div className="flex items-center gap-2 font-black"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-200 to-amber-400"><Crown className="h-4 w-4 text-[#171006]"/></div>Conectaê <span className="text-amber-200">Premium</span></div>
        <div className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[.14em] text-amber-100">Demo fechada</div>
      </div>
    </header>

    <main className="relative z-10 mx-auto max-w-[1320px] px-5 py-10 md:px-8 md:py-16">
      <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-sm font-bold text-amber-100"><Sparkles className="h-4 w-4"/> Análise individual aprofundada</div>
          <h1 className="max-w-4xl text-5xl font-black leading-[.96] tracking-[-.045em] md:text-7xl">Seus dados viram um <span className="bg-gradient-to-r from-amber-200 via-yellow-300 to-orange-300 bg-clip-text text-transparent">Top 3 pessoal.</span></h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-300">O Premium cruza desempenho acadêmico, provas, perfil, atividades, contexto, preferências e objetivos com o banco do Conectaê para gerar três faculdades com justificativa detalhada.</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {[
              ['1','Dados acadêmicos','Notas, provas e histórico'],
              ['2','Perfil completo','Preferências + trajetória'],
              ['3','Top 3 final','Match explicado faculdade a faculdade'],
            ].map(([n,title,text])=><div key={n} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-amber-300/10 text-sm font-black text-amber-200">{n}</div><div className="font-black">{title}</div><div className="mt-1 text-xs text-ink-500">{text}</div></div>)}
          </div>
        </div>

        <div className="relative rounded-[34px] border border-amber-300/20 bg-gradient-to-br from-amber-300/[0.08] via-white/[0.035] to-violet-400/[0.06] p-6 shadow-2xl shadow-amber-950/20">
          <div className="absolute -right-5 -top-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200/20 bg-[#11121a] shadow-xl"><Lock className="h-5 w-5 text-amber-200"/></div>
          <div className="text-xs font-black uppercase tracking-[.14em] text-amber-200">Preview do relatório</div>
          <div className="mt-5 space-y-3">
            {[
              ['#1','Faculdade ideal','94%','Melhor combinação entre perfil, desempenho e objetivos'],
              ['#2','Segunda melhor opção','91%','Excelente equilíbrio acadêmico e profissional'],
              ['#3','Terceira melhor opção','88%','Forte aderência às suas prioridades pessoais'],
            ].map(([rank,name,score,text])=><div key={rank} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="flex items-start justify-between gap-4"><div><div className="text-[10px] font-black uppercase tracking-[.12em] text-ink-500">{rank}</div><div className="mt-1 font-black blur-[4px] select-none">{name}</div><div className="mt-1 text-xs text-ink-500">{text}</div></div><div className="text-2xl font-black text-amber-200">{score}</div></div></div>)}
          </div>
          <div className="mt-4 rounded-2xl border border-amber-300/15 bg-amber-300/[0.055] p-4 text-sm text-ink-300"><strong className="text-amber-100">Relatório Premium:</strong> forças, riscos, justificativa do Top 3, critérios decisivos e próximos passos de candidatura.</div>
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <div className="mb-2 flex items-center gap-2"><UserRound className="h-5 w-5 text-amber-200"/><h2 className="text-2xl font-black">Seus dados</h2></div>
          <p className="mb-6 text-sm text-ink-500">Esta área está em modo demonstração. Nenhum dado pode ser enviado ainda.</p>
          <div className="grid gap-4 md:grid-cols-2">
            {fields.map(([label,placeholder],index)=><label key={label} className={index>=5?'md:col-span-2':''}><span className="mb-2 block text-xs font-bold text-ink-400">{label}</span>{index>=5?<textarea disabled placeholder={placeholder} className="min-h-[90px] w-full cursor-not-allowed rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-ink-400 outline-none placeholder:text-ink-700"/>:<input disabled placeholder={placeholder} className="w-full cursor-not-allowed rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-ink-400 outline-none placeholder:text-ink-700"/>}</label>)}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 md:p-7"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-200"><BrainCircuit className="h-5 w-5"/></div><h3 className="mt-5 text-xl font-black">Análise mais profunda</h3><p className="mt-2 text-sm leading-relaxed text-ink-500">O Premium não usa apenas respostas de preferência. Ele considera também dados objetivos e evidências do perfil do aluno.</p></div>
          <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-6 md:p-7"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-300/10 text-violet-200"><Target className="h-5 w-5"/></div><h3 className="mt-5 text-xl font-black">Top 3, não lista infinita</h3><p className="mt-2 text-sm leading-relaxed text-ink-500">A entrega final prioriza três opções e explica por que cada uma entrou no ranking pessoal.</p></div>
          <div className="rounded-[30px] border border-amber-300/20 bg-gradient-to-br from-amber-300/[0.08] to-white/[0.02] p-6 md:p-7"><div className="flex items-center justify-between gap-3"><div><div className="text-xs font-black uppercase tracking-[.14em] text-amber-200">Acesso Premium</div><h3 className="mt-2 text-2xl font-black">Em breve</h3></div><Crown className="h-8 w-8 text-amber-200"/></div><p className="mt-3 text-sm text-ink-400">Pagamento e envio de dados estão bloqueados enquanto a versão final é preparada.</p><button disabled className="mt-5 w-full cursor-not-allowed rounded-2xl bg-amber-200 px-5 py-4 font-black text-[#171006] opacity-50"><Lock className="mr-2 inline h-4 w-4"/> Acesso ainda fechado</button></div>
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-4">
        {[
          [GraduationCap,'Perfil acadêmico'],
          [FileText,'Provas e histórico'],
          [Medal,'Extracurriculares'],
          [Trophy,'Resultado Top 3'],
        ].map(([Icon,label])=>{const I=Icon as typeof Trophy;return <div key={String(label)} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-4"><I className="h-4 w-4 text-amber-200"/><span className="text-sm font-bold text-ink-300">{String(label)}</span></div>})}
      </section>
    </main>
  </div>;
}

export default function PremiumDemoMount() {
  const [host,setHost] = useState<HTMLElement|null>(null);
  const [open,setOpen] = useState(false);

  useEffect(()=>{
    const attach = () => {
      if (document.querySelector('[data-conectae-premium-demo]')) return;
      const main = Array.from(document.querySelectorAll('main')).find((el)=>el.textContent?.includes('Seu futuro não cabe em um')) as HTMLElement | undefined;
      if (!main) return;
      const node = document.createElement('div');
      node.dataset.conectaePremiumDemo = 'true';
      node.className = 'mt-8';
      main.insertBefore(node, main.children[1] ?? null);
      setHost(node);
    };
    attach();
    const observer = new MutationObserver(attach);
    observer.observe(document.body,{childList:true,subtree:true});
    return ()=>observer.disconnect();
  },[]);

  const teaser = host ? createPortal(
    <section className="relative overflow-hidden rounded-[30px] border border-amber-300/20 bg-gradient-to-r from-amber-300/[0.08] via-white/[0.035] to-violet-400/[0.07] p-6 md:p-8">
      <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-amber-300/10 blur-3xl"/>
      <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div className="max-w-3xl"><div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[.14em] text-amber-100"><Crown className="h-3.5 w-3.5"/> Demo Premium</div><h2 className="text-2xl font-black md:text-3xl">Envie seus próprios dados. Receba seu Top 3.</h2><p className="mt-2 text-sm leading-relaxed text-ink-400 md:text-base">Uma análise individual com desempenho acadêmico, provas, atividades, preferências e objetivos para chegar às três faculdades que mais fazem sentido para você.</p></div>
        <button onClick={()=>setOpen(true)} className="shrink-0 rounded-2xl border border-amber-200/20 bg-amber-200 px-5 py-3.5 font-black text-[#171006] shadow-xl shadow-amber-950/20 transition-transform hover:-translate-y-0.5">Ver demo Premium</button>
      </div>
    </section>, host) : null;

  return <>{teaser}{open&&<PremiumPage onClose={()=>setOpen(false)}/>}</>;
}
