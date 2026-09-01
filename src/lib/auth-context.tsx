import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types';

const PROFILE_SELECT = 'id, display_name, school_year, city, state, age_range, onboarding_completed, created_at';
const CANONICAL_ORIGIN = 'https://businessschoolfit.vercel.app';
const PLANNER_REDIRECT = `${CANONICAL_ORIGIN}/?planner=aprovacao`;

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null; needsConfirmation?: boolean }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updateDisplayName: (name: string) => Promise<{ error: string | null }>;
  updateProfile: (fields: Partial<UserProfile>) => Promise<{ error: string | null }>;
  deleteAccount: () => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

function genericAuthError(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Muitas tentativas. Aguarde alguns instantes e tente novamente.';
  if ((m.includes('already') && m.includes('registered')) || m.includes('user already registered')) return 'Este e-mail já possui uma conta. Entre ou recupere sua senha.';
  if (m.includes('invalid email')) return 'Digite um e-mail válido.';
  if (m.includes('password') && (m.includes('short') || m.includes('least'))) return 'A senha deve ter pelo menos 6 caracteres.';
  return 'E-mail ou senha inválidos.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid: string) => {
    if (!supabase) return;
    const { data, error } = await supabase.from('user_profiles').select(PROFILE_SELECT).eq('id', uid).maybeSingle();
    if (error) return;
    if (data) setProfile(data as UserProfile);
    else {
      const { data: newProfile } = await supabase.from('user_profiles').insert({ id: uid }).select(PROFILE_SELECT).maybeSingle();
      if (newProfile) setProfile(newProfile as UserProfile);
    }
  }, []);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s); setUser(s?.user ?? null);
      if (s?.user) loadProfile(s.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, s) => {
      (async () => {
        setSession(s); setUser(s?.user ?? null);
        if (s?.user) await loadProfile(s.user.id);
        else setProfile(null);
      })();
    });
    return () => authListener.subscription.unsubscribe();
  }, [loadProfile]);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    if (!supabase) return { error: 'Cliente não inicializado' };
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: PLANNER_REDIRECT,
        data: { display_name: displayName.trim() },
      },
    });
    if (error) {
      const friendly = genericAuthError(error.message);
      console.error('signUp failed', error);
      return { error: friendly === 'E-mail ou senha inválidos.' ? 'Não foi possível criar a conta agora. Confira os dados e tente novamente.' : friendly };
    }
    if (data.user) {
      const { error: profileError } = await supabase.from('user_profiles').upsert({ id: data.user.id, display_name: displayName.trim() });
      if (profileError) console.error('profile upsert after signUp failed', profileError);
    }
    return { error: null, needsConfirmation: !data.session };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: 'Cliente não inicializado' };
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error) return { error: genericAuthError(error.message) };
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) return { error: 'Cliente não inicializado' };
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: PLANNER_REDIRECT });
    if (error) {
      console.error('resetPassword failed', error);
      const friendly = genericAuthError(error.message);
      return { error: friendly === 'E-mail ou senha inválidos.' ? 'Não foi possível enviar o link de recuperação agora. Tente novamente em instantes.' : friendly };
    }
    return { error: null };
  }, []);

  const updateDisplayName = useCallback(async (name: string) => {
    if (!supabase || !user) return { error: 'Não autenticado' };
    const { error } = await supabase.from('user_profiles').update({ display_name: name }).eq('id', user.id);
    if (error) { console.error('updateDisplayName failed', error); return { error: 'Não foi possível salvar seu nome. Tente novamente.' }; }
    setProfile((prev) => prev ? { ...prev, display_name: name } : prev);
    return { error: null };
  }, [user]);

  const updateProfile = useCallback(async (fields: Partial<UserProfile>) => {
    if (!supabase || !user) return { error: 'Não autenticado' };
    const { error } = await supabase.from('user_profiles').update(fields).eq('id', user.id);
    if (error) { console.error('updateProfile failed', error); return { error: 'Não foi possível salvar seu perfil. Tente novamente.' }; }
    setProfile((prev) => prev ? { ...prev, ...fields } : prev);
    return { error: null };
  }, [user]);

  const deleteAccount = useCallback(async () => {
    if (!supabase || !user) return { error: 'Não autenticado' };
    const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
    if (error) { console.error('deleteAccount failed', error); return { error: 'Não foi possível excluir sua conta. Tente novamente mais tarde.' }; }
    await supabase.auth.signOut(); setProfile(null); return { error: null };
  }, [user]);

  const refreshProfile = useCallback(async () => { if (user) await loadProfile(user.id); }, [user, loadProfile]);

  return <AuthContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut, resetPassword, updateDisplayName, updateProfile, deleteAccount, refreshProfile }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
