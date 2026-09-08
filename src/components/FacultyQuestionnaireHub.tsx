import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Award,
  BookOpenCheck,
  BriefcaseBusiness,
  CheckCircle2,
  ExternalLink,
  FileText,
  FolderKanban,
  Languages,
  Loader2,
  Medal,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import type { FacultyEvidence, FacultyEvidenceCategory } from '@/types';

const CATEGORY_CONFIG: Record<FacultyEvidenceCategory, {
  title: string;
  description: string;
  titleLabel: string;
  institutionLabel: string;
  icon: typeof Sparkles;
}> = {
  extracurriculars: {
    title: 'Extracurriculares',
    description: 'Esportes, voluntariado, clubes, olimpíadas e atividades de liderança.',
    titleLabel: 'Nome da atividade',
    institutionLabel: 'Organização, escola ou projeto',
    icon: Sparkles,
  },
  grades: {
    title: 'Notas e desempenho',
    description: 'Boletins, médias, resultados acadêmicos e provas padronizadas.',
    titleLabel: 'Série, disciplina ou avaliação',
    institutionLabel: 'Escola ou instituição',
    icon: BookOpenCheck,
  },
  languages: {
    title: 'Idiomas',
    description: 'Nível de proficiência, cursos e certificados oficiais.',
    titleLabel: 'Idioma e nível',
    institutionLabel: 'Escola ou certificadora',
    icon: Languages,
  },
  awards: {
    title: 'Prêmios e conquistas',
    description: 'Medalhas, reconhecimentos, bolsas e classificações.',
    titleLabel: 'Nome da conquista',
    institutionLabel: 'Instituição responsável',
    icon: Medal,
  },
  projects: {
    title: 'Projetos e portfólio',
    description: 'Projetos autorais, pesquisas, negócios, tecnologia e impacto.',
    titleLabel: 'Nome do projeto',
    institutionLabel: 'Escola, empresa ou iniciativa',
    icon: FolderKanban,
  },
  experience: {
    title: 'Experiências',
    description: 'Estágios, trabalho, shadowing, cursos e experiências práticas.',
    titleLabel: 'Cargo, curso ou experiência',
    institutionLabel: 'Empresa ou instituição',
    icon: BriefcaseBusiness,
  },
};

interface FacultyQuestionnaireHubProps {
  onBack: () => void;
}

export default function FacultyQuestionnaireHub({ onBack }: FacultyQuestionnaireHubProps) {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<FacultyEvidenceCategory | null>(null);
  const [items, setItems] = useState<FacultyEvidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [institution, setInstitution] = useState('');
  const [details, setDetails] = useState('');
  const [occurredOn, setOccurredOn] = useState('');

  useEffect(() => {
    let active = true;
    if (!supabase || !user) {
      setLoading(false);
      return;
    }

    supabase
      .from('faculty_questionnaire_evidence')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error: loadError }) => {
        if (!active) return;
        if (loadError) {
          setError('Não foi possível carregar seu questionário agora.');
        } else {
          setItems((data ?? []) as FacultyEvidence[]);
        }
        setLoading(false);
      });

    return () => { active = false; };
  }, [user]);

  const counts = useMemo(() => {
    const result = {} as Record<FacultyEvidenceCategory, number>;
    (Object.keys(CATEGORY_CONFIG) as FacultyEvidenceCategory[]).forEach((category) => {
      result[category] = items.filter((item) => item.category === category).length;
    });
    return result;
  }, [items]);

  const completedCategories = Object.values(counts).filter((count) => count > 0).length;

  const resetForm = () => {
    setTitle('');
    setInstitution('');
    setDetails('');
    setOccurredOn('');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!supabase || !user || !selectedCategory || title.trim().length < 2) {
      setError('Preencha o título da informação.');
      return;
    }

    setSaving(true);
    const { data, error: insertError } = await supabase
      .from('faculty_questionnaire_evidence')
      .insert({
        user_id: user.id,
        category: selectedCategory,
        title: title.trim(),
        institution: institution.trim() || null,
        details: details.trim() || null,
        occurred_on: occurredOn || null,
        source: 'manual',
      })
      .select('*')
      .single();

    if (insertError || !data) {
      setError('Não foi possível salvar as informações. Tente novamente.');
      setSaving(false);
      return;
    }

    setItems((current) => [data as FacultyEvidence, ...current]);
    setSuccess('Informação salva no seu perfil.');
    resetForm();
    setSaving(false);
  };

  const openEvidence = async (item: FacultyEvidence) => {
    if (!supabase || !item.file_path) return;
    const { data, error: signedUrlError } = await supabase.storage
      .from('student-evidence')
      .createSignedUrl(item.file_path, 60);
    if (signedUrlError || !data?.signedUrl) {
      setError('Não foi possível abrir o anexo.');
      return;
    }
    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] rounded-full bg-brand-500/15 blur-[130px]" />
        <div className="absolute bottom-0 -right-40 w-[500px] h-[500px] rounded-full bg-accent-500/10 blur-[140px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12">
        <button onClick={onBack} className="flex items-center gap-2 text-ink-400 hover:text-ink-100 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="flex items-center gap-2 text-sm text-ink-300">
          <ShieldCheck className="w-4 h-4 text-accent-400" /> Área privada
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 pb-20">
        <section className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold mb-4">
            <FileText className="w-4 h-4" /> Questionário para as Faculdades
          </div>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight max-w-3xl">
            Construa seu perfil acadêmico, no seu ritmo.
          </h1>
          <p className="mt-3 text-ink-400 max-w-2xl leading-relaxed">
            Escolha quais informações deseja adicionar. Não é necessário enviar comprovantes, e tudo fica privado até você autorizar o compartilhamento.
          </p>
        </section>

        <section className="glass rounded-2xl border border-ink-800 p-5 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-ink-100">Progresso do seu hub</p>
              <p className="text-sm text-ink-400">{completedCategories} de 6 categorias preenchidas · {items.length} registros</p>
            </div>
            <div className="w-full sm:w-64 h-2 rounded-full bg-ink-800 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-500 to-accent-400 transition-all" style={{ width: `${(completedCategories / 6) * 100}%` }} />
            </div>
          </div>
        </section>

        {error && <div role="alert" className="mb-5 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm">{error}</div>}
        {success && <div className="mb-5 flex items-center gap-2 p-4 rounded-xl border border-green-500/30 bg-green-500/10 text-green-300 text-sm"><CheckCircle2 className="w-4 h-4" />{success}</div>}

        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand-400" /></div>
        ) : !selectedCategory ? (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Object.entries(CATEGORY_CONFIG) as [FacultyEvidenceCategory, typeof CATEGORY_CONFIG[FacultyEvidenceCategory]][]).map(([category, config]) => {
              const Icon = config.icon;
              return (
                <button key={category} onClick={() => { setSelectedCategory(category); setError(null); setSuccess(null); }} className="glass text-left p-5 rounded-2xl border border-ink-800 hover:border-brand-500/50 hover:bg-ink-800/60 transition-all group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-11 h-11 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center group-hover:bg-brand-500/20"><Icon className="w-5 h-5" /></div>
                    <span className="text-xs text-ink-500">{counts[category]} registro{counts[category] === 1 ? '' : 's'}</span>
                  </div>
                  <h2 className="mt-4 font-bold text-ink-100">{config.title}</h2>
                  <p className="mt-1 text-sm text-ink-400 leading-relaxed">{config.description}</p>
                </button>
              );
            })}
          </section>
        ) : (
          <CategoryPanel
            category={selectedCategory}
            items={items.filter((item) => item.category === selectedCategory)}
            title={title}
            institution={institution}
            details={details}
            occurredOn={occurredOn}
            saving={saving}
            onTitle={setTitle}
            onInstitution={setInstitution}
            onDetails={setDetails}
            onOccurredOn={setOccurredOn}
            onSubmit={handleSubmit}
            onClose={() => { setSelectedCategory(null); resetForm(); setError(null); setSuccess(null); }}
            onOpenEvidence={openEvidence}
          />
        )}
      </main>
    </div>
  );
}

interface CategoryPanelProps {
  category: FacultyEvidenceCategory;
  items: FacultyEvidence[];
  title: string;
  institution: string;
  details: string;
  occurredOn: string;
  saving: boolean;
  onTitle: (value: string) => void;
  onInstitution: (value: string) => void;
  onDetails: (value: string) => void;
  onOccurredOn: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onClose: () => void;
  onOpenEvidence: (item: FacultyEvidence) => void;
}

function CategoryPanel(props: CategoryPanelProps) {
  const config = CATEGORY_CONFIG[props.category];
  const Icon = config.icon;
  return (
    <section>
      <button onClick={props.onClose} className="mb-5 text-sm text-brand-400 hover:text-brand-300">← Todas as categorias</button>
      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_.95fr] gap-6">
        <form onSubmit={props.onSubmit} className="glass rounded-2xl border border-ink-800 p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2"><Icon className="w-6 h-6 text-brand-400" /><div><h2 className="text-xl font-bold">{config.title}</h2><p className="text-sm text-ink-400">Adicione uma informação por vez.</p></div></div>
          <Field label={config.titleLabel}><input required minLength={2} maxLength={160} value={props.title} onChange={(e) => props.onTitle(e.target.value)} className="field" /></Field>
          <Field label={config.institutionLabel}><input maxLength={160} value={props.institution} onChange={(e) => props.onInstitution(e.target.value)} className="field" /></Field>
          <Field label="Data ou período (opcional)"><input type="date" value={props.occurredOn} onChange={(e) => props.onOccurredOn(e.target.value)} className="field" /></Field>
          <Field label="Detalhes"><textarea rows={4} maxLength={1200} value={props.details} onChange={(e) => props.onDetails(e.target.value)} placeholder="Conte o contexto, resultado, carga horária ou outras informações relevantes." className="field resize-none" /></Field>
          <button type="submit" disabled={props.saving} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-brand-500 hover:bg-brand-400 text-ink-950 font-semibold disabled:opacity-50">
            {props.saving ? <><Loader2 className="w-5 h-5 animate-spin" /> Salvando...</> : <><FileText className="w-5 h-5" /> Salvar informação</>}
          </button>
        </form>

        <div className="space-y-3">
          <div className="flex items-center justify-between"><h3 className="font-bold text-ink-100">Informações adicionadas</h3><span className="text-xs text-ink-500">{props.items.length}</span></div>
          {props.items.length === 0 ? (
            <div className="glass rounded-2xl border border-ink-800 p-8 text-center"><Award className="w-8 h-8 text-ink-600 mx-auto mb-3" /><p className="text-sm text-ink-400">Nenhuma informação nesta categoria ainda.</p></div>
          ) : props.items.map((item) => (
            <article key={item.id} className="glass rounded-2xl border border-ink-800 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-semibold text-ink-100">{item.title}</h4>
                  {item.institution && <p className="text-sm text-ink-400 mt-0.5">{item.institution}</p>}
                </div>
                {item.source === 'full_quiz' && <span className="px-2 py-1 rounded-full bg-brand-500/10 text-brand-300 text-[11px] font-semibold">Importado</span>}
              </div>
              {item.details && <p className="mt-3 text-sm text-ink-400 whitespace-pre-line line-clamp-6">{item.details}</p>}
              {item.file_path && (
                <button type="button" onClick={() => props.onOpenEvidence(item)} className="mt-3 inline-flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300"><ExternalLink className="w-3.5 h-3.5" /> Ver anexo existente</button>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="block text-xs font-medium text-ink-400 mb-1.5">{label}</span>{children}</label>;
}
