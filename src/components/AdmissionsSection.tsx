import {
  DoorOpen,
  FileText,
  ExternalLink,
  ClipboardList,
  Users,
  Mic,
  Award,
  BookOpen,
  CheckCircle2,
  Info,
} from 'lucide-react';
import type { University, OfficialEvidence, Source } from '@/types';

interface AdmissionsSectionProps {
  university: University;
  evidence: OfficialEvidence[];
  sources: Source[];
}

const ADMISSION_KEYWORDS = [
  { keywords: ['vestibular', 'vestibulares'], label: 'Vestibular próprio', icon: <BookOpen className="w-4 h-4" /> },
  { keywords: ['enem'], label: 'ENEM', icon: <FileText className="w-4 h-4" /> },
  { keywords: ['sat'], label: 'SAT', icon: <FileText className="w-4 h-4" /> },
  { keywords: ['act'], label: 'ACT', icon: <FileText className="w-4 h-4" /> },
  { keywords: ['ib ', 'ib diploma', 'international baccalaureate'], label: 'IB', icon: <FileText className="w-4 h-4" /> },
  { keywords: ['olimpíada', 'olimpiada', 'olimpíadas', 'olimpiadas'], label: 'Olimpíadas', icon: <Award className="w-4 h-4" /> },
  { keywords: ['entrevista'], label: 'Entrevista', icon: <Mic className="w-4 h-4" /> },
  { keywords: ['exame oral', 'oral'], label: 'Exame oral', icon: <Mic className="w-4 h-4" /> },
  { keywords: ['case', 'caso', 'estudo de caso'], label: 'Cases', icon: <ClipboardList className="w-4 h-4" /> },
  { keywords: ['dinâmica', 'dinamica', 'grupo', 'atividade em grupo'], label: 'Dinâmicas de grupo', icon: <Users className="w-4 h-4" /> },
  { keywords: ['redação', 'redacao', 'redacao argumentativa', 'redação argumentativa'], label: 'Redação', icon: <FileText className="w-4 h-4" /> },
  { keywords: ['portfólio', 'portfolio', 'vídeo', 'video'], label: 'Portfólio / Vídeo', icon: <ClipboardList className="w-4 h-4" /> },
  { keywords: ['projeto', 'link pocket', 'experience'], label: 'Projeto prático', icon: <ClipboardList className="w-4 h-4" /> },
];

function findAdmissionSteps(text: string): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();
  for (const { keywords, label } of ADMISSION_KEYWORDS) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        found.add(label);
        break;
      }
    }
  }
  return Array.from(found);
}

export default function AdmissionsSection({ university, evidence, sources }: AdmissionsSectionProps) {
  const allText = [
    university.admissions ?? '',
    ...evidence.map((e) => `${e.evidence_name} ${e.summary ?? ''}`),
  ].join(' ');

  const admissionSteps = findAdmissionSteps(allText);

  const admissionEvidence = evidence.filter((e) => {
    const text = `${e.evidence_name} ${e.summary ?? ''} ${e.evidence_type ?? ''}`.toLowerCase();
    return text.includes('processo') || text.includes('seletivo') || text.includes('admiss') ||
           text.includes('vestibular') || text.includes('exame') || text.includes('entrevista') ||
           text.includes('avalia') || text.includes('journey') || text.includes('experience') ||
           text.includes('oral') || text.includes('redação') || text.includes('redacao') ||
           text.includes('pocket') || text.includes('integrada');
  });

  const admissionSources = sources.filter((s) => {
    const text = `${s.source_name} ${s.usage_note ?? ''}`.toLowerCase();
    return text.includes('processo') || text.includes('seletivo') || text.includes('admiss') ||
           text.includes('vestibular') || text.includes('edital') || text.includes('etapa') ||
           text.includes('journey') || text.includes('admission');
  });

  const hasAnyData = university.admissions || admissionEvidence.length > 0 || admissionSteps.length > 0;

  if (!hasAnyData) {
    return (
      <div className="glass rounded-2xl border border-ink-800 p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <DoorOpen className="w-5 h-5 text-brand-400" />
          Como entrar
        </h2>
        <p className="text-sm text-ink-500">
          As informações sobre o processo seletivo desta instituição ainda não estão documentadas em nossa base. Recomendamos consultar o site oficial diretamente.
        </p>
        {university.primary_source_url && (
          <a
            href={university.primary_source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 text-xs text-brand-400 hover:text-brand-300 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Visitar site oficial
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl border border-ink-800 p-5 md:p-6">
      <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
        <DoorOpen className="w-5 h-5 text-brand-400" />
        Como entrar
      </h2>
      <p className="text-xs text-ink-500 mb-5">
        Informações do processo seletivo de {university.name}. O Conectaê mede compatibilidade de perfil, não garante aprovação.
      </p>

      {/* Detected admission steps */}
      {admissionSteps.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
            Etapas do processo seletivo
          </h3>
          <div className="flex flex-wrap gap-2">
            {admissionSteps.map((step) => {
              const iconEntry = ADMISSION_KEYWORDS.find((a) => a.label === step);
              return (
                <div
                  key={step}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500/10 border border-brand-700/30 text-sm text-brand-300"
                >
                  {iconEntry?.icon}
                  {step}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Admissions text from universities table */}
      {university.admissions && (
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-ink-500" />
            Observações do processo
          </h3>
          <p className="text-sm text-ink-300 leading-relaxed">{university.admissions}</p>
        </div>
      )}

      {/* Admission-related evidence */}
      {admissionEvidence.length > 0 && (
        <div className="mb-5">
          <h3 className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-ink-500" />
            Detalhes do processo seletivo
          </h3>
          <div className="space-y-3">
            {admissionEvidence.map((ev) => (
              <div key={ev.evidence_id} className="p-4 rounded-xl bg-ink-800/40 border border-ink-700/50">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <h4 className="font-semibold text-ink-100 text-sm">{ev.evidence_name}</h4>
                  {ev.evidence_type && (
                    <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-300 text-xs font-medium">
                      {ev.evidence_type}
                    </span>
                  )}
                </div>
                {ev.summary && <p className="text-sm text-ink-400 leading-relaxed">{ev.summary}</p>}
                {ev.source_url && (
                  <a
                    href={ev.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 text-xs text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Ver fonte
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Official link */}
      {university.primary_source_url && (
        <div className="mb-5">
          <a
            href={university.primary_source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500/10 border border-brand-700/40 text-brand-300 text-sm font-semibold hover:bg-brand-500/20 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Site oficial do processo seletivo
          </a>
        </div>
      )}

      {/* Sources */}
      {admissionSources.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-ink-400 uppercase tracking-wider mb-2">
            Fontes utilizadas
          </h3>
          <div className="space-y-1.5">
            {admissionSources.map((src) => (
              <div key={src.source_id} className="flex items-start gap-2">
                <FileText className="w-3.5 h-3.5 text-ink-600 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm text-ink-300">{src.source_name}</span>
                  {src.url && (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-brand-400 hover:text-brand-300 transition-colors mt-0.5"
                    >
                      {src.url}
                    </a>
                  )}
                  {src.usage_note && (
                    <p className="text-xs text-ink-500 mt-0.5">{src.usage_note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
