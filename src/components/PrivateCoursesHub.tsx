import { ArrowLeft, BookOpen, Dna, FilePenLine } from 'lucide-react';

export default function PrivateCoursesHub() {
  return (
    <main className="min-h-screen bg-[#f6f8ff] px-5 py-8 font-['Plus_Jakarta_Sans'] text-[#111936] sm:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <button
          onClick={() => window.location.assign('/')}
          className="mb-12 inline-flex items-center gap-2 text-base font-extrabold text-[#596681] transition hover:text-[#3155e7]"
        >
          <ArrowLeft className="h-5 w-5" /> Voltar
        </button>

        <section className="rounded-[28px] border border-[#d7deee] bg-white p-7 shadow-sm sm:p-10">
          <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef1ff] text-[#3155e7]">
            <BookOpen className="h-7 w-7" />
          </div>
          <p className="mb-2 text-sm font-black uppercase tracking-[0.16em] text-[#3155e7]">Cursos exclusivos</p>
          <h1 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">Cursos Particulares</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-[#6f7b96]">Escolha o curso que você quer acessar.</p>

          <div className="mt-9 grid gap-4 sm:grid-cols-2">
            <button
              onClick={() => window.location.assign('/curso-redacao')}
              className="group rounded-2xl border border-[#d7deee] p-6 text-left transition hover:-translate-y-0.5 hover:border-[#9eafff] hover:shadow-md"
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#eef1ff] text-[#3155e7]">
                <FilePenLine className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-black">Curso de Redação ENEM</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#7b86a0]">Aulas exclusivas e correção individual com especialista.</p>
              <span className="mt-5 inline-block text-sm font-black text-[#3155e7]">Acessar curso →</span>
            </button>

            <button
              onClick={() => window.location.assign('/curso-biologia')}
              className="group rounded-2xl border border-[#d7deee] p-6 text-left transition hover:-translate-y-0.5 hover:border-[#9eafff] hover:shadow-md"
            >
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#eef1ff] text-[#3155e7]">
                <Dna className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-black">Curso de Biologia</h2>
              <p className="mt-2 text-sm leading-relaxed text-[#7b86a0]">Novo curso particular.</p>
              <span className="mt-5 inline-block text-sm font-black text-[#3155e7]">Acessar curso →</span>
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
