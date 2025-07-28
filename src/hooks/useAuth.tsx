
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
  const [profileLoading, setProfileLoading] = useState(false);
  const { logLogin, logLogout, logAuthError } = useAuthAudit();

  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    if (profileLoading) return null;
    
    setProfileLoading(true);
    try {
      console.log('Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }

      if (!data) {
        console.warn('No profile found for user:', userId);
        return null;
      }

      console.log('Profile fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    let sessionTimeout: NodeJS.Timeout;

    const handleAuthStateChange = async (event: string, session: Session | null) => {
      if (!mounted) return;
      
      console.log('Auth state change:', event, session?.user?.id);
      
      // Clear any existing timeout
      if (sessionTimeout) {
        clearTimeout(sessionTimeout);
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user && event !== 'TOKEN_REFRESHED') {
        try {
          const profileData = await fetchProfile(session.user.id);
          if (mounted) {
            setProfile(profileData);
          }
          
          // Log successful login only for actual login events
          if (event === 'SIGNED_IN' && profileData) {
            await logLogin(profileData.email, profileData.role, {
              userId: session.user.id,
              authEvent: event,
              sessionId: session.access_token.slice(-10)
            });
          }
        } catch (error) {
          console.error('Error handling auth state change:', error);
          if (mounted) {
            setProfile(null);
          }
        }
      } else {
        if (mounted) {
          setProfile(null);
        }
        
        // Log logout if user was previously authenticated
        if (event === 'SIGNED_OUT' && user?.email) {
          try {
            await logLogout(user.email);
          } catch (error) {
            console.error('Error logging logout:', error);
          }
        }
      }
      
      // Set loading to false after a short delay to ensure all operations complete
      if (mounted) {
        sessionTimeout = setTimeout(() => {
          if (mounted) {
            setLoading(false);
          }
        }, 100);
      }
    };

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }
        
        if (session) {
          await handleAuthStateChange('INITIAL_SESSION', session);
        } else {
          if (mounted) {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      mounted = false;
      if (sessionTimeout) {
        clearTimeout(sessionTimeout);
      }
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
    await supabase.auth.signOut();
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
