import { useState } from 'react';
import { Shield, Check, X, Users, GraduationCap, Trophy, Lock, Info, Loader2, ChevronRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { saveSharingConsent, isMinor } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';
import type { ConsentScope } from '@/types';

interface ConsentStepProps {
  onComplete: () => void;
  onSkip: () => void;
}

const SHARED_DATA_ITEMS = [
  'Nome',
  'Idade / faixa etária',
  'Cidade e estado',
  'Ano escolar',
  'E-mail',
  'Características acadêmicas e extracurriculares do teste',
  'Interesses profissionais',
  'Resultados e dimensões do B-School Fit',
  'Universidades com maior compatibilidade',
];

const NOT_SHARED_ITEMS = [
  'Senha',
  'Dados de pagamento',
  'Informações técnicas de segurança',
  'Dados que não sejam necessários para essa finalidade',
];

const SCOPE_OPTIONS: { value: ConsentScope; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: 'all_participating',
    label: 'Todas as faculdades participantes',
    description: 'Seu perfil poderá ser visto por qualquer faculdade participante do programa.',
    icon: <Users className="w-4 h-4" />,
  },
  {
    value: 'my_ranking',
    label: 'Faculdades do meu ranking',
    description: 'Apenas as faculdades que aparecem no seu ranking poderão ver seu perfil.',
    icon: <Trophy className="w-4 h-4" />,
  },
  {
    value: 'top_match',
    label: 'Apenas minha faculdade #1',
    description: 'Somente a faculdade com maior compatibilidade poderá ver seu perfil.',
    icon: <GraduationCap className="w-4 h-4" />,
  },
];

export default function ConsentStep({ onComplete, onSkip }: ConsentStepProps) {
  const { profile } = useAuth();
  const [choice, setChoice] = useState<'yes' | 'no' | null>(null);
  const [scope, setScope] = useState<ConsentScope | null>(null);
  const [guardianName, setGuardianName] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minor = isMinor(profile?.age_range);

  const canSubmit = () => {
    if (choice === 'no') return true;
    if (choice === 'yes' && scope) {
      if (minor) {
        return guardianName.trim() !== '' && guardianEmail.trim() !== '';
      }
      return true;
    }
    return false;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;
    setSaving(true);
    setError(null);

    if (choice === 'no') {
      trackEvent('consent_declined', { minor }, null);
      try {
        await saveSharingConsent({
          consentStatus: 'declined',
          consentScope: 'none',
          requiresGuardianConsent: minor,
        });
      } catch {
        // non-critical
      }
      setSaving(false);
      onComplete();
      return;
    }

    if (choice === 'yes' && scope) {
      trackEvent('consent_accepted', { scope, minor }, null);
      const result = await saveSharingConsent({
        consentStatus: 'accepted',
        consentScope: scope,
        requiresGuardianConsent: minor,
        guardianName: minor ? guardianName : undefined,
        guardianEmail: minor ? guardianEmail : undefined,
      });
      setSaving(false);
      if (!result) {
        setError('Não foi possível salvar sua escolha. Tente novamente.');
        return;
      }
      onComplete();
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 left-1/4 w-[500px] h-[500px] rounded-full bg-brand-500/10 blur-[130px]" />
        <div className="absolute bottom-0 -right-40 w-[500px] h-[500px] rounded-full bg-accent-500/8 blur-[140px]" />
      </div>

      <header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-brand-400" />
          <span className="font-bold text-lg tracking-tight">Privacidade</span>
        </div>
        <button
          onClick={onSkip}
          className="text-sm text-ink-500 hover:text-ink-300 transition-colors"
        >
          Pular por agora
        </button>
      </header>

      <main className="relative z-10 px-6 md:px-12 max-w-2xl mx-auto pb-20">
        <div className="animate-fade-up">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-3 text-center">
            Quer ser encontrado pelas faculdades?
          </h1>
          <p className="text-ink-400 text-sm leading-relaxed text-center mb-8 max-w-lg mx-auto">
            Se você autorizar, poderemos compartilhar seu perfil e os resultados do seu B-School Fit
            com faculdades participantes que possam ter interesse no seu perfil.
          </p>

          {/* What gets shared */}
          <div className="glass rounded-2xl border border-ink-800 p-5 md:p-6 mb-4">
            <h2 className="text-sm font-semibold text-ink-300 mb-3 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-green-400" />
              O que pode ser compartilhado
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {SHARED_DATA_ITEMS.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-ink-400">
                  <div className="w-1 h-1 rounded-full bg-green-400 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* What does NOT get shared */}
          <div className="glass rounded-2xl border border-ink-800 p-5 md:p-6 mb-6">
            <h2 className="text-sm font-semibold text-ink-300 mb-3 flex items-center gap-1.5">
              <X className="w-4 h-4 text-red-400" />
              O que nunca será compartilhado
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {NOT_SHARED_ITEMS.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-ink-500">
                  <div className="w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Choice buttons — equal visual weight */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            <button
              onClick={() => setChoice('yes')}
              className={`p-5 rounded-2xl border-2 transition-all text-left ${
                choice === 'yes'
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-ink-700 bg-ink-800/40 hover:border-ink-600'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  choice === 'yes' ? 'border-brand-400 bg-brand-400' : 'border-ink-600'
                }`}>
                  {choice === 'yes' && <Check className="w-3 h-3 text-ink-950" />}
                </div>
                <span className="font-semibold text-ink-100 text-sm">Sim, quero permitir</span>
              </div>
              <p className="text-xs text-ink-500 leading-relaxed pl-7">
                Autorizo meu perfil a ser compartilhado com faculdades participantes
              </p>
            </button>

            <button
              onClick={() => { setChoice('no'); setScope(null); }}
              className={`p-5 rounded-2xl border-2 transition-all text-left ${
                choice === 'no'
                  ? 'border-ink-400 bg-ink-700/40'
                  : 'border-ink-700 bg-ink-800/40 hover:border-ink-600'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  choice === 'no' ? 'border-ink-300 bg-ink-300' : 'border-ink-600'
                }`}>
                  {choice === 'no' && <Check className="w-3 h-3 text-ink-950" />}
                </div>
                <span className="font-semibold text-ink-100 text-sm">Não, prefiro manter privado</span>
              </div>
              <p className="text-xs text-ink-500 leading-relaxed pl-7">
                Meu perfil não será compartilhado com nenhuma faculdade
              </p>
            </button>
          </div>

          {/* Granular scope selection */}
          {choice === 'yes' && (
            <div className="animate-fade-up mb-6">
              <h3 className="text-sm font-semibold text-ink-300 mb-3">Com quem compartilhar?</h3>
              <div className="space-y-2.5">
                {SCOPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setScope(opt.value)}
                    className={`w-full flex items-start gap-3 p-4 rounded-2xl border transition-all text-left ${
                      scope === opt.value
                        ? 'border-brand-500 bg-brand-500/10'
                        : 'border-ink-700 bg-ink-800/40 hover:border-ink-600'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      scope === opt.value ? 'border-brand-400 bg-brand-400' : 'border-ink-600'
                    }`}>
                      {scope === opt.value && <Check className="w-3 h-3 text-ink-950" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {opt.icon}
                        <span className="font-medium text-ink-100 text-sm">{opt.label}</span>
                      </div>
                      <p className="text-xs text-ink-500 leading-relaxed">{opt.description}</p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Guardian consent for minors */}
              {minor && scope && (
                <div className="animate-fade-up mt-4 p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                  <div className="flex items-start gap-2 mb-4">
                    <Lock className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-ink-200 text-sm mb-1">Autorização de responsável</h4>
                      <p className="text-xs text-ink-500 leading-relaxed">
                        Como você é menor de idade, precisamos da autorização de um
                        responsável legal para compartilhar seu perfil. O compartilhamento só
                        será ativado após a confirmação do responsável.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-ink-400 mb-1 block">Nome do responsável</label>
                      <input
                        type="text"
                        value={guardianName}
                        onChange={(e) => setGuardianName(e.target.value)}
                        placeholder="Nome completo do responsável"
                        className="w-full px-3 py-2.5 rounded-lg bg-ink-800 border border-ink-700 text-ink-100 placeholder-ink-600 focus:outline-none focus:border-brand-500 transition-colors text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-ink-400 mb-1 block">E-mail do responsável</label>
                      <input
                        type="email"
                        value={guardianEmail}
                        onChange={(e) => setGuardianEmail(e.target.value)}
                        placeholder="email@exemplo.com"
                        className="w-full px-3 py-2.5 rounded-lg bg-ink-800 border border-ink-700 text-ink-100 placeholder-ink-600 focus:outline-none focus:border-brand-500 transition-colors text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
          )}

          {/* Transparency note */}
          <div className="flex items-start gap-2 mb-6">
            <Info className="w-3.5 h-3.5 text-ink-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-ink-500 leading-relaxed">
              Você poderá mudar essa escolha a qualquer momento em Minha Conta.
              O compartilhamento é opcional e não afeta seus resultados.
            </p>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit() || saving}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base transition-all
              disabled:opacity-40 disabled:cursor-not-allowed
              enabled:bg-brand-500 enabled:hover:bg-brand-400 enabled:text-ink-950 enabled:shadow-xl enabled:shadow-brand-500/20
              bg-ink-800 text-ink-500"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Confirmar e ver meus resultados
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
