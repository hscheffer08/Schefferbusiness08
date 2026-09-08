import { useState } from 'react';
import { Building2, Heart, LogIn, LogOut, Shield, UserRound } from 'lucide-react';
import Auth from '@/components/Auth';
import Admin from '@/components/Admin';
import B2BInsights from '@/components/B2BInsights';
import MyJourney from '@/components/MyJourney';
import InfoPages from '@/components/InfoPages';
import { AuthProvider, useAuth } from '@/lib/auth-context';

type InfoPage = 'privacy' | 'terms' | null;

function AccountControls() {
  const { user, profile, signOut, loading } = useAuth();
  const params = new URLSearchParams(window.location.search);
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  const recoveryRequested = params.get('auth') === 'recovery';
  const [showAuth, setShowAuth] = useState(recoveryRequested);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showB2B, setShowB2B] = useState(false);
  const [showJourney, setShowJourney] = useState(false);
  const [infoPage, setInfoPage] = useState<InfoPage>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const standaloneExperience =
    pathname !== '/' ||
    params.has('planner') ||
    params.has('experience') ||
    params.has('modo') ||
    params.has('questionario') ||
    params.has('ref');

  const finishAuth = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('auth');
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    setShowAuth(false);
  };

  if (standaloneExperience && !recoveryRequested) return null;
  const isAdmin = user?.app_metadata?.role === 'admin';

  if (showAdmin) return <div className="fixed inset-0 z-[140] overflow-y-auto bg-ink-950"><Admin onBack={() => setShowAdmin(false)} /></div>;
  if (showB2B) return <div className="fixed inset-0 z-[140] overflow-y-auto bg-ink-950"><B2BInsights onBack={() => setShowB2B(false)} /></div>;
  if (showJourney) return <div className="fixed inset-0 z-[140] overflow-y-auto bg-ink-950"><MyJourney onBack={() => setShowJourney(false)} /></div>;
  if (infoPage) return <div className="fixed inset-0 z-[140] overflow-y-auto bg-ink-950"><InfoPages page={infoPage} onBack={() => setInfoPage(null)} /></div>;
  if (showAuth) return <div className="fixed inset-0 z-[140] overflow-y-auto bg-ink-950"><Auth initialMode={recoveryRequested ? 'update' : 'login'} onBack={() => setShowAuth(false)} onSuccess={finishAuth} onPrivacy={() => { setShowAuth(false); setInfoPage('privacy'); }} onTerms={() => { setShowAuth(false); setInfoPage('terms'); }} /></div>;
  if (loading) return null;

  return <div className="fixed top-4 right-5 md:right-10 z-[85] flex items-center gap-2">
    {user ? <>
      {isAdmin && <>
        <button type="button" onClick={() => setShowB2B(true)} className="hidden md:inline-flex items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-400/10 px-3.5 py-2 text-sm font-bold text-amber-100 backdrop-blur-xl hover:bg-amber-400/20 transition-colors"><Building2 className="w-4 h-4"/> B2B Insights</button>
        <button type="button" onClick={() => setShowAdmin(true)} className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-400/10 px-3.5 py-2 text-sm font-bold text-amber-100 backdrop-blur-xl hover:bg-amber-400/20 transition-colors"><Shield className="w-4 h-4"/> Painel</button>
      </>}
      <div className="relative">
        <button type="button" onClick={() => setMenuOpen(value => !value)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#0b0904]/90 px-3.5 py-2 text-sm font-semibold text-ink-100 backdrop-blur-xl hover:border-amber-300/25 transition-colors"><span className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-300 to-amber-400 text-[#050505] flex items-center justify-center font-black text-xs">{(profile?.display_name || user.email || '?')[0].toUpperCase()}</span><span className="hidden sm:inline max-w-[150px] truncate">{profile?.display_name || 'Minha conta'}</span></button>
        {menuOpen && <div className="absolute right-0 mt-2 min-w-[235px] rounded-2xl border border-white/10 bg-[#0b0904]/95 p-2 shadow-2xl backdrop-blur-2xl"><div className="px-3 py-2 border-b border-white/5 mb-1"><div className="flex items-center gap-2 text-sm font-semibold text-ink-100"><UserRound className="w-4 h-4 text-amber-300"/> Conta conectada</div><div className="mt-1 text-xs text-ink-500 truncate">{user.email}</div></div><button type="button" onClick={() => {setMenuOpen(false);setShowJourney(true);}} className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-amber-100 hover:bg-white/5"><Heart className="w-4 h-4"/> Minha jornada</button>{isAdmin && <><button type="button" onClick={() => {setMenuOpen(false);setShowB2B(true);}} className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-amber-200 hover:bg-white/5"><Building2 className="w-4 h-4"/> Conectaê University</button><button type="button" onClick={() => {setMenuOpen(false);setShowAdmin(true);}} className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-amber-200 hover:bg-white/5"><Shield className="w-4 h-4"/> Painel administrativo</button></>}<button type="button" onClick={async()=>{setMenuOpen(false);await signOut();}} className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-ink-300 hover:bg-white/5 hover:text-white"><LogOut className="w-4 h-4"/> Sair</button></div>}
      </div>
    </> : <button type="button" onClick={() => setShowAuth(true)} className="inline-flex items-center gap-2 rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-2.5 text-sm font-bold text-amber-100 backdrop-blur-xl shadow-lg shadow-amber-950/20 hover:bg-amber-300/20 hover:border-amber-200/40 transition-all"><LogIn className="w-4 h-4"/> Entrar / Criar conta</button>}
  </div>;
}

export default function AccountControlsMount() { return <AuthProvider><AccountControls /></AuthProvider>; }
