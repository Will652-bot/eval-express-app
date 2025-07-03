// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, AuthState } from '../types';

// L'interface est simplifiée pour le Magic Link
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
          
          if (error.code === 'PGRST116') { // Code pour "No rows returned"
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
                
                setState({
                  session,
                  user: newUser,
                  loading: false,
                });
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
          subscription_expires_at: data.subscription_expires_at,
          current_plan: data.current_plan
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
        await updateUserState(session);

        authSubscription = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (!mounted) return;

            console.log('🔔 [AuthContext] AuthStateChange:', {
              event,
              hasSession: !!newSession,
              userId: newSession?.user?.id || 'N/A'
            });

            const urlParams = new URLSearchParams(window.location.search);
            const isRecoveryFlow = urlParams.get("type") === "recovery";
            const isResetPasswordPage = window.location.pathname === '/reset-password';

            switch (event) {
              case 'SIGNED_IN':
                console.log('✅ [AuthContext] SIGNED_IN détecté');
                await updateUserState(newSession);
                
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
      console.log('🪄 [AuthContext]
