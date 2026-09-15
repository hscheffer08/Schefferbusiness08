import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { ensureFreshSession, supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types';

const PROFILE_SELECT = 'id, display_name, school_year, city, state, age_range, onboarding_completed, created_at';
const CANONICAL_ORIGIN = 'https://xn--conecta-pya.app';
const PASSWORD_RECOVERY_REDIRECT = `${CANONICAL_ORIGIN}/?auth=recovery`;

function currentAuthReturnUrl(): string {
  if (typeof window === 'undefined') return CANONICAL_ORIGIN;
  const current = new URL(window.location.href);
  current.searchParams.delete('auth'); current.searchParams.delete('code');
  const safeSearch = current.searchParams.toString();
  return `${CANONICAL_ORIGIN}${current.pathname.startsWith('/') ? current.pathname : '/'}${safeSearch ? `?${safeSearch}` : ''}`;
}

interface AuthState {
  user: User | null; session: Session | null; profile: UserProfile | null; loading: boolean;
  signUp: (email:string,password:string,displayName:string)=>Promise<{error:string|null;needsConfirmation?:boolean}>;
  resendConfirmation:(email:string)=>Promise<{error:string|null}>;
  signIn:(email:string,password:string)=>Promise<{error:string|null}>;
  signOut:()=>Promise<void>; resetPassword:(email:string)=>Promise<{error:string|null}>;
  updatePassword:(password:string)=>Promise<{error:string|null}>;
  updateDisplayName:(name:string)=>Promise<{error:string|null}>;
  updateProfile:(fields:Partial<UserProfile>)=>Promise<{error:string|null}>;
  deleteAccount:()=>Promise<{error:string|null}>; refreshProfile:()=>Promise<void>;
}
const AuthContext=createContext<AuthState|null>(null);

function genericAuthError(raw:string){const m=raw.toLowerCase();if(m.includes('email not confirmed'))return 'Confirme seu e-mail antes de entrar.';if(m.includes('rate limit')||m.includes('too many'))return 'Muitas tentativas. Aguarde alguns instantes e tente novamente.';if((m.includes('already')&&m.includes('registered'))||m.includes('user already registered'))return 'Este e-mail já possui uma conta. Entre ou recupere sua senha.';if(m.includes('invalid email'))return 'Digite um e-mail válido.';if(m.includes('password')&&(m.includes('short')||m.includes('least')))return 'A senha não atende aos requisitos mínimos de segurança.';return 'E-mail ou senha inválidos.';}
const metadataDisplayName=(user:User|null|undefined)=>String(user?.user_metadata?.display_name??'').trim().slice(0,120);

export function AuthProvider({children}:{children:ReactNode}){
  const [user,setUser]=useState<User|null>(null); const [session,setSession]=useState<Session|null>(null); const [profile,setProfile]=useState<UserProfile|null>(null); const [loading,setLoading]=useState(true);
  const authVersion=useRef(0);

  const loadProfile=useCallback(async(authUser:User)=>{if(!supabase)return;const fallbackName=metadataDisplayName(authUser);const {data,error}=await supabase.from('user_profiles').select(PROFILE_SELECT).eq('id',authUser.id).maybeSingle();if(error){console.error('loadProfile failed',error);return;}if(data){const currentName=String(data.display_name??'').trim();if(!currentName&&fallbackName){const {data:updated,error:updateError}=await supabase.from('user_profiles').update({display_name:fallbackName}).eq('id',authUser.id).select(PROFILE_SELECT).maybeSingle();if(!updateError&&updated){setProfile(updated as UserProfile);return;}if(updateError)console.error('profile name backfill failed',updateError);}setProfile(data as UserProfile);return;}const {data:newProfile,error:insertError}=await supabase.from('user_profiles').insert({id:authUser.id,...(fallbackName?{display_name:fallbackName}:{})}).select(PROFILE_SELECT).maybeSingle();if(insertError){console.error('profile insert after auth failed',insertError);return;}if(newProfile)setProfile(newProfile as UserProfile);},[]);

  const applySession=useCallback((s:Session|null)=>{setSession(s);setUser(s?.user??null);if(s?.user)void loadProfile(s.user);else setProfile(null);},[loadProfile]);

  useEffect(()=>{if(!supabase){setLoading(false);return;}let cancelled=false;const initialVersion=authVersion.current;
    const {data:authListener}=supabase.auth.onAuthStateChange((_event,s)=>{if(cancelled)return;authVersion.current+=1;applySession(s);setLoading(false);});
    void ensureFreshSession(false).then(s=>{if(cancelled||authVersion.current!==initialVersion)return;applySession(s);}).catch(error=>console.warn('Initial auth session recovery failed',error)).finally(()=>{if(!cancelled&&authVersion.current===initialVersion)setLoading(false);});
    return()=>{cancelled=true;authListener.subscription.unsubscribe();};
  },[applySession]);

  const signUp=useCallback(async(email:string,password:string,displayName:string)=>{if(!supabase)return{error:'Cliente não inicializado'};const normalizedEmail=email.trim().toLowerCase();const cleanName=displayName.trim().replace(/\s+/g,' ').slice(0,120);if(cleanName.length<2)return{error:'Digite seu nome.'};const {data,error}=await supabase.auth.signUp({email:normalizedEmail,password,options:{emailRedirectTo:currentAuthReturnUrl(),data:{display_name:cleanName}}});if(error){const friendly=genericAuthError(error.message);return{error:friendly==='E-mail ou senha inválidos.'?'Não foi possível criar a conta agora. Confira os dados e tente novamente.':friendly};}if(data.session){authVersion.current+=1;applySession(data.session);}return{error:null,needsConfirmation:!data.session};},[applySession]);
  const resendConfirmation=useCallback(async(email:string)=>{if(!supabase)return{error:'Cliente não inicializado'};const normalizedEmail=email.trim().toLowerCase();if(!normalizedEmail)return{error:'Digite seu e-mail.'};const {error}=await supabase.auth.resend({type:'signup',email:normalizedEmail,options:{emailRedirectTo:currentAuthReturnUrl()}});return{error:error?genericAuthError(error.message):null};},[]);
  const signIn=useCallback(async(email:string,password:string)=>{if(!supabase)return{error:'Cliente não inicializado'};const {data,error}=await supabase.auth.signInWithPassword({email:email.trim().toLowerCase(),password});if(error)return{error:genericAuthError(error.message)};if(data.session){authVersion.current+=1;applySession(data.session);}return{error:null};},[applySession]);
  const signOut=useCallback(async()=>{if(!supabase)return;authVersion.current+=1;await supabase.auth.signOut();applySession(null);},[applySession]);
  const resetPassword=useCallback(async(email:string)=>{if(!supabase)return{error:'Cliente não inicializado'};const {error}=await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(),{redirectTo:PASSWORD_RECOVERY_REDIRECT});return{error:error?'Não foi possível enviar o link de recuperação agora. Tente novamente em instantes.':null};},[]);
  const updatePassword=useCallback(async(password:string)=>{if(!supabase)return{error:'Cliente não inicializado'};if(password.length<8)return{error:'A senha deve ter pelo menos 8 caracteres.'};const {error}=await supabase.auth.updateUser({password});return{error:error?'Não foi possível atualizar sua senha. Abra novamente o link de recuperação ou solicite outro.':null};},[]);
  const updateDisplayName=useCallback(async(name:string)=>{if(!supabase||!user)return{error:'Não autenticado'};const cleanName=name.trim().replace(/\s+/g,' ').slice(0,120);if(cleanName.length<2)return{error:'Digite um nome válido.'};const {error}=await supabase.from('user_profiles').update({display_name:cleanName}).eq('id',user.id);if(error)return{error:'Não foi possível salvar seu nome. Tente novamente.'};setProfile(prev=>prev?{...prev,display_name:cleanName}:prev);return{error:null};},[user]);
  const updateProfile=useCallback(async(fields:Partial<UserProfile>)=>{if(!supabase||!user)return{error:'Não autenticado'};const {error}=await supabase.from('user_profiles').update(fields).eq('id',user.id);if(error)return{error:'Não foi possível salvar seu perfil. Tente novamente.'};setProfile(prev=>prev?{...prev,...fields}:prev);return{error:null};},[user]);
  const deleteAccount=useCallback(async()=>{if(!supabase||!user)return{error:'Não autenticado'};const {error}=await supabase.functions.invoke('delete-account',{method:'POST'});if(error)return{error:'Não foi possível excluir sua conta. Tente novamente mais tarde.'};authVersion.current+=1;await supabase.auth.signOut();applySession(null);return{error:null};},[user,applySession]);
  const refreshProfile=useCallback(async()=>{if(user)await loadProfile(user);},[user,loadProfile]);
  return <AuthContext.Provider value={{user,session,profile,loading,signUp,resendConfirmation,signIn,signOut,resetPassword,updatePassword,updateDisplayName,updateProfile,deleteAccount,refreshProfile}}>{children}</AuthContext.Provider>;
}
export function useAuth(){const ctx=useContext(AuthContext);if(!ctx)throw new Error('useAuth must be used within AuthProvider');return ctx;}
