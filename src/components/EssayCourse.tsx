import { useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, FileText, LockKeyhole, Upload, CheckCircle2 } from 'lucide-react';

const competencies = [
  'Competência 1 · Domínio da modalidade escrita formal',
  'Competência 2 · Compreensão do tema e repertório',
  'Competência 3 · Seleção e organização dos argumentos',
  'Competência 4 · Coesão e mecanismos linguísticos',
  'Competência 5 · Proposta de intervenção',
];
const scoreOptions = [0, 40, 80, 120, 160, 200];

export default function EssayCourse() {
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('conectae-essay-course') === 'ok');
  const [error, setError] = useState('');
  const [scores, setScores] = useState<number[]>([0, 0, 0, 0, 0]);
  const total = useMemo(() => scores.reduce((sum, score) => sum + score, 0), [scores]);

  const enter = () => {
    if (password.trim() !== 'cursoredacao1000') {
      setError('Senha incorreta.');
      return;
    }
    sessionStorage.setItem('conectae-essay-course', 'ok');
    setUnlocked(true);
    setError('');
  };

  if (!unlocked) return (
    <div className="min-h-screen bg-[#f6f8ff] px-5 py-8 font-['Plus_Jakarta_Sans'] text-[#101a36]">
      <button onClick={() => window.location.assign('/')} className="inline-flex items-center gap-2 text-sm font-extrabold text-[#596681]"><ArrowLeft className="h-4 w-4"/>Voltar</button>
      <div className="mx-auto mt-16 max-w-md rounded-[28px] border border-[#dbe2f0] bg-white p-7 shadow-[0_24px_70px_rgba(25,45,95,.12)]">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef1ff] text-[#3155e7]"><LockKeyhole className="h-6 w-6"/></div>
        <p className="mt-6 text-xs font-black uppercase tracking-[.15em] text-[#3155e7]">Curso exclusivo</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-.04em]">Curso de Redação ENEM</h1>
        <p className="mt-3 text-sm leading-6 text-[#66738c]">Conteúdo profissional e correção individual de redação.</p>
        <label className="mt-7 block text-sm font-extrabold">Senha de acesso</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&enter()} placeholder="Digite sua senha" className="mt-2 w-full rounded-2xl border border-[#d7deee] bg-[#f8f9fd] px-4 py-3.5 outline-none focus:border-[#3155e7]"/>
        {error && <p className="mt-2 text-sm font-bold text-red-600">{error}</p>}
        <button onClick={enter} className="mt-4 w-full rounded-2xl bg-[#3155e7] px-5 py-3.5 font-black text-white">Entrar</button>
        <p className="mt-2 text-center text-[10px] leading-4 text-[#8a94a8]">Para adquirir, entre em contato com @redacaocomhellen</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f6f8ff] font-['Plus_Jakarta_Sans'] text-[#101a36]">
      <header className="border-b border-[#dfe5f4] bg-white/90"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4"><button onClick={()=>window.location.assign('/')} className="inline-flex items-center gap-2 text-sm font-black"><ArrowLeft className="h-4 w-4"/>Conectaê</button><span className="text-sm font-black text-[#3155e7]">Redação ENEM</span></div></header>
      <main className="mx-auto max-w-6xl px-5 py-10">
        <p className="text-xs font-black uppercase tracking-[.15em] text-[#3155e7]">Curso profissional</p><h1 className="mt-2 text-4xl font-black tracking-[-.045em]">Redação nota 1000, passo a passo.</h1><p className="mt-3 max-w-2xl text-[#66738c]">Aulas exclusivas, materiais da corretora e uma redação por semana para correção.</p>
        <div className="mt-9 grid gap-5 lg:grid-cols-2">
          <section className="rounded-[26px] border border-[#dbe2f0] bg-white p-6"><div className="flex items-center gap-3"><BookOpen className="h-6 w-6 text-[#3155e7]"/><h2 className="text-xl font-black">Materiais do curso</h2></div><div className="mt-5 space-y-3">{['Estrutura da redação ENEM','Introdução e repertório','Desenvolvimento e argumentação','Coesão e projeto de texto','Conclusão e proposta de intervenção'].map((title,i)=><div key={title} className="flex items-center justify-between rounded-2xl bg-[#f6f8ff] p-4"><span><span className="block text-xs font-bold text-[#8a94a8]">MÓDULO {i+1}</span><span className="font-extrabold">{title}</span></span><FileText className="h-5 w-5 text-[#3155e7]"/></div>)}</div><p className="mt-4 text-xs text-[#8a94a8]">Os PowerPoints exclusivos serão adicionados a cada módulo.</p></section>
          <section className="rounded-[26px] border border-[#dbe2f0] bg-white p-6"><div className="flex items-center gap-3"><Upload className="h-6 w-6 text-[#3155e7]"/><h2 className="text-xl font-black">Enviar redação da semana</h2></div><p className="mt-3 text-sm leading-6 text-[#66738c]">Envie uma foto ou arquivo da sua redação para correção individual.</p><label className="mt-6 flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#bfcaf0] bg-[#f8f9fd] p-6 text-center"><Upload className="h-7 w-7 text-[#3155e7]"/><span className="mt-3 font-black">Selecionar redação</span><span className="mt-1 text-xs text-[#8a94a8]">Imagem ou PDF</span><input className="hidden" type="file" accept="image/*,.pdf"/></label><p className="mt-3 text-xs text-[#8a94a8]">Limite do curso: 1 envio por semana. O armazenamento definitivo será vinculado à conta do aluno.</p></section>
        </div>
        <section className="mt-5 rounded-[26px] border border-[#dbe2f0] bg-white p-6"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[.12em] text-[#3155e7]">Painel de correção</p><h2 className="mt-1 text-2xl font-black">5 competências oficiais</h2></div><div className="rounded-2xl bg-[#172344] px-5 py-3 text-white"><span className="text-xs font-bold text-white/60">NOTA TOTAL</span><span className="ml-3 text-2xl font-black">{total}/1000</span></div></div><div className="mt-6 grid gap-3">{competencies.map((name,i)=><div key={name} className="rounded-2xl bg-[#f6f8ff] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><span className="text-sm font-extrabold">{name}</span><select value={scores[i]} onChange={e=>setScores(s=>s.map((v,j)=>j===i?Number(e.target.value):v))} className="rounded-xl border border-[#d7deee] bg-white px-3 py-2 text-sm font-black">{scoreOptions.map(v=><option key={v} value={v}>{v} pontos</option>)}</select></div></div>)}</div><div className="mt-5 flex items-center gap-2 rounded-2xl bg-[#eef8f2] p-4 text-sm font-bold text-[#27724a]"><CheckCircle2 className="h-5 w-5"/>Escala configurada de 0 a 200, em intervalos de 40 pontos.</div></section>
      </main>
    </div>
  );
}
