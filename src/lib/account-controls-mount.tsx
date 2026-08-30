import { useState } from 'react';
import { LogIn, LogOut, Shield, UserRound } from 'lucide-react';
import Auth from '@/components/Auth';
import Admin from '@/components/Admin';
import InfoPages from '@/components/InfoPages';
import { AuthProvider, useAuth } from '@/lib/auth-context';

type InfoPage = 'privacy' | 'terms' | null;

function AccountControls() {
  const { user, profile, signOut, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [infoPage, setInfoPage] = useState<InfoPage>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const params = new URLSearchParams(window.location.search);
  if (params.get('modo') === 'business') return null;

  const isAdmin = user?.app_metadata?.role === 'admin';

  if (showAdmin) {
    return (
      <div className="fixed inset-0 z-[140] overflow-y-auto bg-ink-950">
        <Admin onBack={() => setShowAdmin(false)} />
      </div>
    );
  }

  if (infoPage) {
    return (
      <div className="fixed inset-0 z-[140] overflow-y-auto bg-ink-950">
        <InfoPages page={infoPage} onBack={() => setInfoPage(null)} />
      </div>
    );
  }

  if (showAuth) {
    return (
      <div className="fixed inset-0 z-[140] overflow-y-auto bg-ink-950">
        <Auth
          onBack={() => setShowAuth(false)}
          onSuccess={() => setShowAuth(false)}
          onPrivacy={() => { setShowAuth(false); setInfoPage('privacy'); }}
          onTerms={() => { setShowAuth(false); setInfoPage('terms'); }}
        />
      </div>
    );
  }

  if (loading) return null;

  return (
    <div className="fixed top-4 right-5 md:right-10 z-[85] flex items-center gap-2">
      {user ? (
        <>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setShowAdmin(true)}
              className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-violet-300/20 bg-violet-400/10 px-3.5 py-2 text-sm font-bold text-violet-100 backdrop-blur-xl hover:bg-violet-400/20 transition-colors"
              title="Painel administrativo"
            >
              <Shield className="w-4 h-4" />
              Painel
            </button>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#0d1626]/90 px-3.5 py-2 text-sm font-semibold text-ink-100 backdrop-blur-xl hover:border-cyan-300/25 transition-colors"
            >
              <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-300 to-violet-400 text-[#07111d] flex items-center justify-center font-black text-xs">
                {(profile?.display_name || user.email || '?')[0].toUpperCase()}
              </span>
              <span className="hidden sm:inline max-w-[150px] truncate">{profile?.display_name || 'Minha conta'}</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 min-w-[220px] rounded-2xl border border-white/10 bg-[#0b1322]/95 p-2 shadow-2xl backdrop-blur-2xl">
                <div className="px-3 py-2 border-b border-white/5 mb-1">
                  <div className="flex items-center gap-2 text-sm font-semibold text-ink-100"><UserRound className="w-4 h-4 text-cyan-300" /> Conta conectada</div>
                  <div className="mt-1 text-xs text-ink-500 truncate">{user.email}</div>
                </div>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setShowAdmin(true); }}
                    className="sm:hidden w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-violet-200 hover:bg-white/5"
                  >
                    <Shield className="w-4 h-4" /> Painel administrativo
                  </button>
                )}
                <button
                  type="button"
                  onClick={async () => { setMenuOpen(false); await signOut(); }}
                  className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-ink-300 hover:bg-white/5 hover:text-white"
                >
                  <LogOut className="w-4 h-4" /> Sair
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setShowAuth(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-2.5 text-sm font-bold text-cyan-100 backdrop-blur-xl shadow-lg shadow-cyan-950/20 hover:bg-cyan-300/20 hover:border-cyan-200/40 transition-all"
        >
          <LogIn className="w-4 h-4" />
          Entrar / Criar conta
        </button>
      )}
    </div>
  );
}

export default function AccountControlsMount() {
  return (
    <AuthProvider>
      <AccountControls />
    </AuthProvider>
  );
}
