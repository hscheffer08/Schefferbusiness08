import { ArrowLeft, Dna } from 'lucide-react';

export default function BiologyCourse() {
  return (
    <main className="min-h-screen bg-[#f6f8ff] px-5 py-8 font-['Plus_Jakarta_Sans'] text-[#111936] sm:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <button
          onClick={() => window.location.assign('/cursos-particulares')}
          className="mb-12 inline-flex items-center gap-2 text-base font-extrabold text-[#596681] transition hover:text-[#3155e7]"
        >
          <ArrowLeft className="h-5 w-5" /> Voltar
        </button>
        <section className="rounded-[28px] border border-[#d7deee] bg-white p-7 shadow-sm sm:p-10">
          <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef1ff] text-[#3155e7]">
            <Dna className="h-7 w-7" />
          </div>
          <p className="mb-2 text-sm font-black uppercase tracking-[0.16em] text-[#3155e7]">Curso exclusivo</p>
          <h1 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">Curso de Biologia</h1>
        </section>
      </div>
    </main>
  );
}
