import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, BookOpenCheck, GraduationCap, ListChecks } from 'lucide-react';

const hostId='conectae-ufmg-course-entry';

function openUFMGCourseArea(){
  const url=new URL(window.location.href);
  url.searchParams.set('planner','aprovacao');
  url.searchParams.set('courseArea','ufmg');
  url.searchParams.delete('experience');
  window.location.assign(`${url.pathname}${url.search}${url.hash}`);
}

function findCourseHeader(){
  return Array.from(document.querySelectorAll<HTMLElement>('main header')).find(header=>header.textContent?.includes('Seu curso de aprovação'))??null;
}

export default function UFMGCourseEntryMount(){
  const[host,setHost]=useState<HTMLElement|null>(null);

  useEffect(()=>{
    let stopped=false;
    const attach=()=>{
      if(stopped)return;
      const header=findCourseHeader();
      if(!header){setHost(null);return}
      let target=document.getElementById(hostId) as HTMLElement|null;
      if(!target){
        target=document.createElement('section');
        target.id=hostId;
        target.setAttribute('aria-label','Seriado UFMG');
        header.insertAdjacentElement('afterend',target);
      }
      setHost(target);
    };
    attach();
    const observer=new MutationObserver(attach);
    observer.observe(document.body,{childList:true,subtree:true});
    return()=>{stopped=true;observer.disconnect();document.getElementById(hostId)?.remove()};
  },[]);

  if(!host)return null;
  return createPortal(
    <button type="button" onClick={openUFMGCourseArea} className="mb-5 flex w-full touch-manipulation items-center gap-4 rounded-[22px] border border-[#31588e] bg-[linear-gradient(135deg,#0b2856,#06152f)] p-4 text-left shadow-xl shadow-black/10 transition hover:border-[#72a5ff] md:mb-7 md:p-5">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#246cff] text-white shadow-lg shadow-[#246cff]/20"><GraduationCap size={23}/></span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2"><strong className="text-lg font-extrabold tracking-[-.02em]">Seriado UFMG</strong><span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[.08em] text-emerald-200">Área separada</span></span>
        <span className="mt-1 block text-xs leading-relaxed text-[#a9bddc]">1º, 2º e 3º anos separados • conteúdo oficial por componente • questões próprias de cada ano.</span>
        <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-bold text-[#8fb2e3]"><span className="inline-flex items-center gap-1"><BookOpenCheck size={12}/>13 componentes</span><span className="inline-flex items-center gap-1"><ListChecks size={12}/>78 questões por ano/componente</span></span>
      </span>
      <ArrowRight className="shrink-0 text-[#72a5ff]" size={20}/>
    </button>,
    host,
  );
}
