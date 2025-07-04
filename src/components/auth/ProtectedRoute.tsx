import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // ✅ CORRECTION DE SÉCURITÉ :
  // Tant que le contexte vérifie l'état de l'authentification, on n'affiche rien.
  // Cela empêche l'accès aux pages protégées pendant une fraction de seconde.
  if (loading) {
    return null; // Affiche une page blanche le temps de la vérification.
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
