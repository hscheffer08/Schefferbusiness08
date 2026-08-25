import { ArrowLeft, ArrowUpRight, Building2, GraduationCap, MapPin, Trophy } from 'lucide-react';

interface USAUniversitiesProps {
  onBack: () => void;
}

const universities = [
  { rank: '1º (empate)', university: 'University of Pennsylvania', school: 'The Wharton School', location: 'Philadelphia, Pennsylvania', program: 'Bachelor of Science in Economics', url: 'https://undergrad.wharton.upenn.edu/' },
  { rank: '1º (empate)', university: 'Massachusetts Institute of Technology', school: 'MIT Sloan School of Management', location: 'Cambridge, Massachusetts', program: 'Bachelor of Science in Management', url: 'https://mitsloan.mit.edu/undergrad' },
  { rank: '3º', university: 'University of California, Berkeley', school: 'Haas School of Business', location: 'Berkeley, California', program: 'Spieker Undergraduate Business Program', url: 'https://haas.berkeley.edu/undergrad/' },
  { rank: '4º', university: 'University of Michigan — Ann Arbor', school: 'Stephen M. Ross School of Business', location: 'Ann Arbor, Michigan', program: 'Bachelor of Business Administration', url: 'https://michiganross.umich.edu/undergraduate/bba' },
  { rank: '5º', university: 'New York University', school: 'Leonard N. Stern School of Business', location: 'New York, New York', program: 'BS in Business', url: 'https://www.stern.nyu.edu/programs-admissions/undergraduate' },
  { rank: '6º (empate)', university: 'University of Texas at Austin', school: 'McCombs School of Business', location: 'Austin, Texas', program: 'Bachelor of Business Administration', url: 'https://www.mccombs.utexas.edu/undergraduate/' },
  { rank: '6º (empate)', university: 'Carnegie Mellon University', school: 'Tepper School of Business', location: 'Pittsburgh, Pennsylvania', program: 'Undergraduate Business Administration', url: 'https://www.cmu.edu/tepper/programs/undergraduate-business/' },
  { rank: '8º (empate)', university: 'Cornell University', school: 'Charles H. Dyson School of Applied Economics and Management', location: 'Ithaca, New York', program: 'BS in Applied Economics and Management', url: 'https://dyson.cornell.edu/programs/undergraduate/' },
  { rank: '8º (empate)', university: 'Indiana University Bloomington', school: 'Kelley School of Business', location: 'Bloomington, Indiana', program: 'Undergraduate Business Program', url: 'https://kelley.iu.edu/programs/undergrad/index.html' },
  { rank: '8º (empate)', university: 'University of North Carolina at Chapel Hill', school: 'Kenan-Flagler Business School', location: 'Chapel Hill, North Carolina', program: 'Undergraduate Business Program', url: 'https://www.kenan-flagler.unc.edu/programs/undergraduate-business/' },
  { rank: '8º (empate)', university: 'University of Southern California', school: 'Marshall School of Business', location: 'Los Angeles, California', program: 'Bachelor of Science in Business Administration', url: 'https://www.marshall.usc.edu/programs/undergraduate-programs' },
];

export default function USAUniversities({ onBack }: USAUniversitiesProps) {
  return (
    <div className="min-h-screen bg-ink-950">
      <header className="sticky top-0 z-20 border-b border-ink-800/80 bg-ink-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-medium text-ink-300 transition-colors hover:text-ink-50">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600">
              <GraduationCap className="h-4 w-4 text-ink-950" strokeWidth={2.5} />
            </div>
            <span className="font-bold">B-School <span className="text-brand-400">Fit</span></span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="mb-10 max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-sm text-brand-300">
            <span aria-hidden="true">🇺🇸</span>
            Estados Unidos
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-ink-50 md:text-5xl">As 11 melhores graduações de Business dos EUA</h1>
          <p className="text-lg leading-relaxed text-ink-400">
            Seleção baseada no ranking 2026 de programas de Business undergraduate da U.S. News. Os empates explicam por que o Top 10 reúne 11 universidades.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {universities.map((item) => (
            <article key={item.school} className="group rounded-2xl border border-ink-800 bg-ink-900/60 p-6 transition-all hover:-translate-y-0.5 hover:border-brand-500/40 hover:bg-ink-900">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-accent-500/10 px-2.5 py-1 text-xs font-semibold text-accent-300">
                  <Trophy className="h-3.5 w-3.5" />
                  {item.rank}
                </div>
                <span className="text-2xl" aria-hidden="true">🇺🇸</span>
              </div>
              <h2 className="mb-1 text-xl font-bold text-ink-50">{item.school}</h2>
              <p className="mb-4 text-sm font-medium text-brand-300">{item.university}</p>
              <div className="space-y-2 text-sm text-ink-400">
                <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" />{item.location}</p>
                <p className="flex items-start gap-2"><Building2 className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" />{item.program}</p>
              </div>
              <a href={item.url} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-400 transition-colors hover:text-brand-300">
                Ver site oficial
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-ink-800 bg-ink-900/40 p-5 text-sm leading-relaxed text-ink-400">
          Esta lista apresenta programas de graduação. Ela não altera o Match das faculdades brasileiras e não representa chance de aprovação.
        </div>
      </main>
    </div>
  );
}
