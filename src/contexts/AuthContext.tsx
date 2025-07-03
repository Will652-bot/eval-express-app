import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, AuthState } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    loading: true,
  });

  const updateUserState = async (session: any) => {
    console.log('🔄 [AuthContext] updateUserState - Session:', !!session);
    
    if (session?.user) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.warn('⚠️ [AuthContext] Erreur récupération données utilisateur:', error.message);
          
          if (error.code === 'PGRST116') {
            console.log('🆕 [AuthContext] Utilisateur non trouvé, création...');
            const { error: insertError } = await supabase
              .from('users')
              .insert({ id: session.user.id, email: session.user.email, role: 'teacher', current_plan: 'free' });
            if (insertError) throw insertError;
          } else {
             throw error;
          }
        }

        const userData = data || (await supabase.from('users').select('*').eq('id', session.user.id).single()).data;
        
        const newUser = {
          ...session.user,
          role: userData.role,
          subscription_plan: userData.current_plan,
          full_name: userData.full_name,
          pro_subscription_active: userData.pro_subscription_active,
          subscription_expires_at: userData.subscription_expires_at,
          current_plan: userData.current_plan
        } as User;
        
        console.log('✅ [AuthContext] Utilisateur mis à jour:', newUser.email);
        setState({ session, user: newUser, loading: false });
      } catch (error) {
        console.error('❌ [AuthContext] Exception mise à jour utilisateur:', error);
        setState({ session: null, user: null, loading: false });
      }
    } else {
      console.log('🧹 [AuthContext] Nettoyage état utilisateur');
      setState({ session: null, user: null, loading: false });
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await updateUserState(session);

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔔 [AuthContext] AuthStateChange:', { event, hasSession: !!session });

        // ✅ CORRECTION : Ne pas rediriger si l'événement est PASSWORD_RECOVERY
        if (event === 'PASSWORD_RECOVERY') {
          console.log('🔄 [AuthContext] Événement de récupération de mot de passe détecté. Aucune redirection.');
          // On met à jour l'état pour que l'utilisateur soit temporairement "connecté"
          // et puisse accéder à la page de réinitialisation.
          await updateUserState(session);
          return;
        }

        if (event === 'SIGNED_IN') {
          await updateUserState(session);
          if (session && window.location.pathname === '/login') {
            window.location.replace('/dashboard');
          }
        }

        if (event === 'SIGNED_OUT') {
          setState({ session: null, user: null, loading: false });
          if (window.location.pathname !== '/login') {
            window.location.replace('/login');
          }
        }
      });

      return () => {
        subscription?.unsubscribe();
      };
    };

    initializeAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error || null };
  };
  
  const signOut = async () => {
    await supabase.auth.signOut();
    setState({ session: null, user: null, loading: false });
    window.location.replace('/login');
  };

  const value = {
    user: state.user,
    loading: state.loading,
    signIn,
    signOut,
    isAuthenticated: !!state.user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
