import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types';

const PROFILE_SELECT = 'id, display_name, school_year, city, state, age_range, onboarding_completed, created_at';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updateDisplayName: (name: string) => Promise<{ error: string | null }>;
  updateProfile: (fields: Partial<UserProfile>) => Promise<{ error: string | null }>;
  deleteAccount: () => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/**
 * Provider error messages leak whether an address already has an account and expose
 * internal detail. Map them onto a small set of generic messages instead.
 */
function genericAuthError(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes('email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar.';
  }
  if (m.includes('rate limit') || m.includes('too many')) {
    return 'Muitas tentativas. Aguarde alguns instantes e tente novamente.';
  }
  if (m.includes('password') && m.includes('short')) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }
  return 'E-mail ou senha inválidos.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid: string) => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('user_profiles')
      .select(PROFILE_SELECT)
      .eq('id', uid)
      .maybeSingle();

    if (error) return;
    if (data) {
      setProfile(data as UserProfile);
    } else {
      const { data: newProfile } = await supabase
        .from('user_profiles')
        .insert({ id: uid })
        .select(PROFILE_SELECT)
        .maybeSingle();
      if (newProfile) setProfile(newProfile as UserProfile);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadProfile(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, s) => {
      (async () => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          await loadProfile(s.user.id);
        } else {
          setProfile(null);
        }
      })();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    if (!supabase) return { error: 'Cliente não inicializado' };
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      // Never distinguish "already registered" from a fresh signup: that difference is
      // all an attacker needs to enumerate accounts. Only genuinely non-revealing
      // errors (rate limiting, weak password) are surfaced.
      const m = error.message.toLowerCase();
      if (m.includes('rate limit') || m.includes('too many') || m.includes('password')) {
        return { error: genericAuthError(error.message) };
      }
      return { error: null };
    }
    if (data.user) {
      await supabase.from('user_profiles').upsert({
        id: data.user.id,
        display_name: displayName,
      });
    }
    return { error: null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: 'Cliente não inicializado' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
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
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    // A failure here (including "user not found") must not tell the caller whether the
    // address is registered. Only rate limiting is worth reporting.
    if (error && /rate limit|too many/i.test(error.message)) {
      return { error: genericAuthError(error.message) };
    }
    return { error: null };
  }, []);

  const updateDisplayName = useCallback(async (name: string) => {
    if (!supabase || !user) return { error: 'Não autenticado' };
    const { error } = await supabase
      .from('user_profiles')
      .update({ display_name: name })
      .eq('id', user.id);
    if (error) {
      console.error('updateDisplayName failed', error);
      return { error: 'Não foi possível salvar seu nome. Tente novamente.' };
    }
    setProfile((prev) => prev ? { ...prev, display_name: name } : prev);
    return { error: null };
  }, [user]);

  const updateProfile = useCallback(async (fields: Partial<UserProfile>) => {
    if (!supabase || !user) return { error: 'Não autenticado' };
    const { error } = await supabase
      .from('user_profiles')
      .update(fields)
      .eq('id', user.id);
    if (error) {
      console.error('updateProfile failed', error);
      return { error: 'Não foi possível salvar seu perfil. Tente novamente.' };
    }
    setProfile((prev) => prev ? { ...prev, ...fields } : prev);
    return { error: null };
  }, [user]);

  const deleteAccount = useCallback(async () => {
    if (!supabase || !user) return { error: 'Não autenticado' };

    // Deleting an auth account requires the service-role key, which must never reach
    // the browser. The edge function verifies the caller's token and deletes only the
    // account that token belongs to.
    const { error } = await supabase.functions.invoke('delete-account', {
      method: 'POST',
    });

    if (error) {
      console.error('deleteAccount failed', error);
      return { error: 'Não foi possível excluir sua conta. Tente novamente mais tarde.' };
    }

    await supabase.auth.signOut();
    setProfile(null);
    return { error: null };
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id);
  }, [user, loadProfile]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updateDisplayName,
        updateProfile,
        deleteAccount,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
