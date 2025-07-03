// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, AuthState } from '../types';

// L'interface est simplifiée
interface AuthContextType {
  user: User | null;
  loading: boolean;
  // signIn ne prend plus que l'email
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

  // --- Votre logique updateUserState et useEffect reste identique ---
  const updateUserState = async (session: any) => { /* ... collez votre fonction ici ... */ };
  useEffect(() => { /* ... collez votre fonction ici ... */ }, []);
  // --- Fin de la partie non modifiée ---


  // ✅ NOUVELLE FONCTION signIn POUR LE MAGIC LINK
  const signIn = async (email: string) => {
    try {
      console.log('🪄 [AuthContext] Envoi du Magic Link pour:', email);
      
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          // L'utilisateur sera redirigé ici après avoir cliqué sur le lien
          emailRedirectTo: window.location.origin,
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

  // La fonction signOut reste la même
  const signOut = async () => { /* ... collez votre fonction corrigée ici ... */ };

  // La valeur exposée est mise à jour
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
