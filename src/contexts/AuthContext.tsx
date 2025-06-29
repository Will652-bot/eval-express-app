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

  // ✅ PHASE 1: Fonction robuste de mise à jour utilisateur SANS latences artificielles
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
          // Continuer avec les données de session de base
          const basicUser = {
            ...session.user,
            role: 'teacher',
            subscription_plan: 'free',
            full_name: session.user.email
          } as User;
          
          setState({
            session,
            user: basicUser,
            loading: false,
          });
          return;
        }

        const newUser = {
          ...session.user,
          role: data.role,
          subscription_plan: data.current_plan,
          full_name: data.full_name,
          pro_subscription_active: data.pro_subscription_active,
          subscription_expires_at: data.subscription_expires_at
        } as User;
        
        console.log('✅ [AuthContext] Utilisateur mis à jour:', newUser.email);
        
        setState({
          session,
          user: newUser,
          loading: false,
        });
      } catch (error) {
        console.error('❌ [AuthContext] Exception mise à jour utilisateur:', error);
        setState({
          session: null,
          user: null,
          loading: false,
        });
      }
    } else {
      console.log('🧹 [AuthContext] Nettoyage état utilisateur');
      setState({
        session: null,
        user: null,
        loading: false,
      });
    }
  };

  // ✅ PHASE 1 CRITIQUE: Écouteur d'authentification UNIQUE et optimisé
  useEffect(() => {
    let mounted = true;
    let authSubscription: any = null;

    console.log('🚀 [AuthContext] Initialisation du listener d\'authentification');

    const initializeAuth = async () => {
      try {
        // ✅ Récupération session initiale IMMÉDIATE
        console.log('🔍 [AuthContext] Récupération session initiale...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ [AuthContext] Erreur session initiale:', error);
          setState({ session: null, user: null, loading: false });
          return;
        }
        
        console.log('📦 [AuthContext] Session initiale:', !!session);
        await updateUserState(session);

        // ✅ UN SEUL écouteur onAuthStateChange
        authSubscription = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (!mounted) return;

            console.log('🔔 [AuthContext] AuthStateChange:', {
              event,
              hasSession: !!newSession,
              userId: newSession?.user?.id || 'N/A'
            });

            // ✅ CORRECTION: Vérifier si on est dans un flux de récupération de mot de passe
            const urlParams = new URLSearchParams(window.location.search);
            const isRecoveryFlow = urlParams.get("type") === "recovery";
            const isResetPasswordPage = window.location.pathname === '/reset-password';

            switch (event) {
              case 'SIGNED_IN':
                console.log('✅ [AuthContext] SIGNED_IN détecté');
                await updateUserState(newSession);
                
                // ✅ REDIRECTION IMMÉDIATE après SIGNED_IN, sauf pour reset password
                if (newSession && window.location.pathname === '/login' && !isRecoveryFlow && !isResetPasswordPage) {
                  console.log('🔄 [AuthContext] Redirection immédiate vers dashboard');
                  window.location.replace('/dashboard');
                }
                break;
                
              case 'SIGNED_OUT':
              case 'USER_DELETED':
                console.log('🚪 [AuthContext] Déconnexion détectée');
                setState({ session: null, user: null, loading: false });
                if (window.location.pathname !== '/login' && 
                    window.location.pathname !== '/reset-password' && 
                    !isRecoveryFlow && 
                    !isResetPasswordPage) {
                  window.location.replace('/login');
                }
                break;
                
              case 'TOKEN_REFRESHED':
                console.log('🔄 [AuthContext] Token rafraîchi');
                await updateUserState(newSession);
                break;
                
              default:
                console.log('🔄 [AuthContext] Autre événement auth:', event);
                await updateUserState(newSession);
            }
          }
        );

      } catch (error) {
        console.error('❌ [AuthContext] Erreur initialisation auth:', error);
        setState({ session: null, user: null, loading: false });
      }
    };

    // ✅ Initialiser l'authentification IMMÉDIATEMENT
    initializeAuth();

    return () => {
      mounted = false;
      if (authSubscription?.data?.subscription) {
        console.log('🧹 [AuthContext] Nettoyage subscription auth');
        authSubscription.data.subscription.unsubscribe();
      }
    };
  }, []); // ✅ CRITIQUE: Tableau de dépendances VIDE

  // ✅ PHASE 3: Fonction signIn optimisée SANS latences
  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 [AuthContext] Tentative connexion:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('❌ [AuthContext] Erreur connexion:', error.message);
        return { error };
      }

      console.log('✅ [AuthContext] Connexion réussie - onAuthStateChange prendra le relais');
      return { error: null };
    } catch (error: any) {
      console.error('❌ [AuthContext] Exception connexion:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 [AuthContext] Déconnexion utilisateur');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ [AuthContext] Erreur déconnexion:', error);
      }
    } catch (error) {
      console.error('❌ [AuthContext] Exception déconnexion:', error);
      setState({ session: null, user: null, loading: false });
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