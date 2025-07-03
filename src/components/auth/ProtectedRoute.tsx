import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Pendant que le contexte vérifie l'état d'authentification, on n'affiche rien.
  // Cela évite un "flash" de la page de login avant la redirection.
  if (loading) {
    return null; // Ou un composant de chargement global si vous en avez un.
  }

  // Si le chargement est terminé et que l'utilisateur N'EST PAS authentifié,
  // on le redirige de force vers la page de login.
  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Utilisateur non authentifié. Redirection vers /login.');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si l'utilisateur est bien authentifié, on affiche la page demandée.
  return <>{children}</>;
};
