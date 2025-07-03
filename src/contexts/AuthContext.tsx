// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, AuthState } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string) => Promise<{ error: Error | null }>;
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
            console.log('🆕 [AuthContext] Utilisateur non trouvé dans public.users, création automatique');
            
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: session.user.id,
                email: session.user.email,
                role: 'teacher',
                current_plan: 'free'
              });
              
            if (insertError) {
              console.error('❌ [AuthContext] Erreur création utilisateur:', insertError.message);
            } else {
              console.log('✅ [AuthContext] Utilisateur créé avec succès dans public.users');
              
              const { data: newUserData, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();
                
              if (!fetchError && newUserData) {
                const newUser = {
                  ...session.user,
                  role: newUserData.role,
                  subscription_plan: newUserData.current_plan,
                  full_name: newUserData.full_name,
                  pro_subscription_active: newUserData.pro_subscription_active,
                  subscription_expires_at: newUserData.subscription_expires_at,
                  current_plan: newUserData.current_plan
                } as User;
                
                setState({ session, user: newUser, loading: false });
                return;
              }
            }
          }
          
          const basicUser = {
            ...session.user,
            role: 'teacher',
            subscription_plan: 'free',
            full_name: session.user.email,
            current_plan: 'free'
          } as User;
          
          setState({ session, user: basicUser, loading: false });
          return;
        }

        const newUser = {
          ...session.user,
          role: data.role,
          subscription_plan: data.current_plan,
          full_name: data.full_name,
          pro_subscription_active: data.pro_subscription_active,
          subscription_expires_at: data.subscription_expires_at,
          current_plan: data.current_plan
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
    let mounted = true;
    let authSubscription: any = null;

    console.log('🚀 [AuthContext] Initialisation du listener d\'authentification');

    const initializeAuth = async () => {
      try {
        console.log('🔍 [AuthContext] Récupération session initiale...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ [AuthContext] Erreur session initiale:', error);
          setState({ session: null, user: null, loading: false });
          return;
        }
        
        console.log('📦 [AuthContext] Session initiale:', !!session);
        if (mounted) {
          await updateUserState(session);
        }

        authSubscription = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (!mounted) return;

            console.log('🔔 [AuthContext] AuthStateChange:', { event, hasSession: !!newSession });

            switch (event) {
              case 'SIGNED_IN':
              case 'TOKEN_REFRESHED':
                await updateUserState(newSession);
                break;
              case 'SIGNED_OUT':
              case 'USER_DELETED':
                setState({ session: null, user: null, loading: false });
                if (window.location.pathname !== '/login') {
                   window.location.replace('/login');
                }
                break;
              default:
                await updateUserState(newSession);
            }
          }
        );
      } catch (error) {
        console.error('❌ [AuthContext] Erreur initialisation auth:', error);
        if (mounted) {
          setState({ session: null, user: null, loading: false });
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      if (authSubscription?.data?.subscription) {
        console.log('🧹 [AuthContext] Nettoyage subscription auth');
        authSubscription.data.subscription.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string) => {
    try {
      console.log('🪄 [AuthContext] Envoi du Magic Link pour:', email);
      
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        console.error('❌ [AuthContext] Erreur envoi Magic Link:', error.message);
        return { error };
      }

      return { error: null };
    } catch (error: any) {
      console.error('❌ [AuthContext] Exception envoi Magic Link:', error);
      return { error };
    }
  };
  
  const signOut = async () => {
    console.log('🚪 [AuthContext] Tentative de déconnexion...');
    try {
      const { error } = await supabase.auth.signOut();
      if (error && error.name !== 'AuthSessionMissingError') {
        throw error;
      }
    } catch (error) {
      console.error('❌ [AuthContext] Erreur inattendue lors du signOut:', error);
    } finally {
      console.log('Redirecting to /login');
      window.location.replace('/login');
    }
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
