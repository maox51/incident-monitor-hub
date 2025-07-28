
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useAuthAudit } from './usePageAudit';

type AppRole = Database['public']['Enums']['app_role'];

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isMonitor: boolean;
  isSupervisorMonitoreo: boolean;
  isRRHH: boolean;
  isSupervisorSalas: boolean;
  isFinanzas: boolean;
  isMantenimiento: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithUsername: (username: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  validatePassword: (password: string) => { isValid: boolean; errors: string[] };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { logLogin, logLogout, logAuthError } = useAuthAudit();

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
        return;
      }

      console.log('Profile fetched:', data);
      setProfile(data);
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      
      console.log('Initial session:', session);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth state change:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch profile primero
          await fetchProfile(session.user.id);
          
          // Log successful login después de obtener el perfil
          if (event === 'SIGNED_IN') {
            setTimeout(async () => {
              try {
                const { data: profileData } = await supabase
                  .from('profiles')
                  .select('email, role')
                  .eq('id', session.user.id)
                  .single();
                
                if (profileData) {
                  console.log(`Usuario autenticado: ${profileData.email} con rol: ${profileData.role}`);
                  await logLogin(profileData.email, profileData.role, {
                    userId: session.user.id,
                    authEvent: event,
                    sessionId: session.access_token.slice(-10) // Últimos 10 caracteres para identificar sesión
                  });
                } else {
                  console.warn('No se encontró perfil para el usuario autenticado');
                  await logLogin(session.user.email || 'unknown', 'unknown', {
                    userId: session.user.id,
                    authEvent: event,
                    profileNotFound: true
                  });
                }
              } catch (error) {
                console.error('Error logging login audit:', error);
                // Intentar logging básico como fallback
                await logLogin(session.user.email || 'unknown', 'unknown', {
                  userId: session.user.id,
                  authEvent: event,
                  error: 'profile_fetch_failed'
                });
              }
            }, 100);
          }
        } else {
          // Log logout si el usuario estaba previamente autenticado
          if (event === 'SIGNED_OUT' && user?.email) {
            try {
              await logLogout(user.email);
            } catch (error) {
              console.error('Error logging logout audit:', error);
            }
          }
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const validatePassword = (password: string) => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Debe contener al menos una letra mayúscula');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Debe contener al menos una letra minúscula');
    }
    if (!/\d/.test(password)) {
      errors.push('Debe contener al menos un número');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Debe contener al menos un carácter especial');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        await logAuthError(error.message, email);
      }
      
      return { error };
    } catch (error: any) {
      await logAuthError(error?.message || 'Unknown error', email);
      return { error };
    }
  };

  const signInWithUsername = async (username: string, password: string) => {
    try {
      // Buscar el usuario por nombre completo o email
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .or(`full_name.ilike.%${username}%,email.ilike.%${username}%`)
        .limit(1);

      if (profileError || !profiles || profiles.length === 0) {
        await logAuthError('Usuario no encontrado', username);
        return { error: { message: 'Usuario no encontrado' } };
      }

      const email = profiles[0].email;
      return await signIn(email, password);
    } catch (error: any) {
      await logAuthError(error?.message || 'Unknown error', username);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return { error: { message: passwordValidation.errors.join('. ') } };
      }

      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName
          }
        }
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    const currentEmail = user?.email || profile?.email;
    await supabase.auth.signOut();
    
    // The logout will be logged automatically by the auth state change listener
    setProfile(null);
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error('No user logged in') };
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (!error && profile) {
        setProfile({ ...profile, ...updates });
      }

      return { error };
    } catch (error) {
      return { error };
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (error) {
      return { error };
    }
  };

  const isAdmin = profile?.role === 'admin';
  const isMonitor = profile?.role === 'monitor';
  const isSupervisorMonitoreo = profile?.role === 'supervisor_monitoreo';
  const isRRHH = profile?.role === 'rrhh';
  const isSupervisorSalas = profile?.role === 'supervisor_salas';
  const isFinanzas = profile?.role === 'finanzas';
  const isMantenimiento = profile?.role === 'mantenimiento';

  const value = {
    user,
    session,
    profile,
    loading,
    isAdmin,
    isMonitor,
    isSupervisorMonitoreo,
    isRRHH,
    isSupervisorSalas,
    isFinanzas,
    isMantenimiento,
    signIn,
    signInWithUsername,
    signUp,
    signOut,
    updateProfile,
    resetPassword,
    validatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
