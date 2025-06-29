import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  // ✅ PHASE 2: ProtectedRoute simplifié - dépendant uniquement de AuthContext
  console.log('🛡️ [ProtectedRoute] État:', { isAuthenticated, loading, hasUser: !!user });

  // ✅ Écran de chargement simple SANS timeout artificiel
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary-500 rounded-full border-t-transparent mx-auto"></div>
          <p className="mt-2 text-gray-500">Carregando...</p>
          <p className="mt-1 text-xs text-gray-400">Verificando autenticação</p>
        </div>
      </div>
    );
  }

  // ✅ PHASE 2: Redirection simple si non authentifié
  if (!isAuthenticated) {
    console.log('🚫 [ProtectedRoute] Redirection vers login');
    return <Navigate to="/login" replace />;
  }

  console.log('✅ [ProtectedRoute] Utilisateur authentifié, rendu enfants');
  return <>{children}</>;
};