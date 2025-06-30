import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Bug, RefreshCw, EyeOff, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export const SignupDebugPanel: React.FC = () => {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [refreshing, setRefreshing] = useState(false);

  // ✅ PHASE 6: Afficher seulement en mode développement ou pour l'admin
  const shouldShow = process.env.NODE_ENV === 'development' || 
                    user?.email === 'wilmic.panama@icloud.com';

  useEffect(() => {
    if (!shouldShow) return;
    loadData();
  }, [shouldShow]);

  // ✅ PHASE 6: Fonction de chargement simplifiée SANS latences
  const loadData = async () => {
    try {
      setRefreshing(true);
      
      // ✅ Test de connexion Supabase simple
      const { error: testError } = await supabase
        .from('users')
        .select('count')
        .limit(1);
      
      if (testError && testError.code !== 'PGRST301') {
        console.error('❌ [DebugPanel] Erreur connexion:', testError);
        setConnectionStatus('error');
      } else {
        setConnectionStatus('connected');
      }

      // ✅ Récupération utilisateur simple
      try {
        const { data: { user: userData } } = await supabase.auth.getUser();
        setCurrentUser(userData);
      } catch (error) {
        console.error('❌ [DebugPanel] Erreur récupération utilisateur:', error);
        setCurrentUser(null);
      }

    } catch (error) {
      console.error('❌ [DebugPanel] Erreur générale:', error);
      setConnectionStatus('error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await loadData();
  };

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="space-y-2">
        {/* ✅ Bouton toggle simplifié */}
        <Button
          onClick={() => setIsVisible(!isVisible)}
          variant="outline"
          size="sm"
          leftIcon={<Bug className="h-4 w-4" />}
          className={`shadow-lg ${
            connectionStatus === 'connected' 
              ? 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200'
              : connectionStatus === 'error'
              ? 'bg-red-100 border-red-300 text-red-800 hover:bg-red-200'
              : 'bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200'
          }`}
        >
          Debug
          {connectionStatus === 'error' && <AlertTriangle className="h-3 w-3 ml-1" />}
        </Button>

        {/* ✅ PHASE 6: Panel de debug nettoyé */}
        {isVisible && (
          <Card className="w-80 bg-gray-900 text-white border-yellow-400 shadow-2xl">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-yellow-400 flex items-center">
                  <Bug className="h-4 w-4 mr-2" />
                  Debug Panel
                </h3>
                <div className="flex space-x-1">
                  <Button
                    onClick={handleRefresh}
                    variant="ghost"
                    size="sm"
                    leftIcon={<RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />}
                    className="text-gray-400 hover:text-white"
                  >
                    Refresh
                  </Button>
                  <Button
                    onClick={() => setIsVisible(false)}
                    variant="ghost"
                    size="sm"
                    leftIcon={<EyeOff className="h-3 w-3" />}
                    className="text-gray-400 hover:text-white"
                  >
                    Hide
                  </Button>
                </div>
              </div>

              {/* ✅ Statut de connexion */}
              <div className="bg-gray-800 rounded p-3 text-xs">
                <h4 className="text-yellow-400 font-medium mb-2">Connexion:</h4>
                <div className="flex items-center justify-between">
                  <span>Supabase:</span>
                  <span className={
                    connectionStatus === 'connected' 
                      ? 'text-green-400 flex items-center'
                      : connectionStatus === 'error'
                      ? 'text-red-400 flex items-center'
                      : 'text-yellow-400 flex items-center'
                  }>
                    {connectionStatus === 'connected' ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connecté
                      </>
                    ) : connectionStatus === 'error' ? (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Erreur
                      </>
                    ) : (
                      '🔄 Vérification...'
                    )}
                  </span>
                </div>
              </div>

              {/* ✅ Statut utilisateur */}
              <div className="bg-gray-800 rounded p-3 text-xs">
                <h4 className="text-yellow-400 font-medium mb-2">Utilisateur:</h4>
                <div className="space-y-1">
                  <div>ID: {currentUser?.id || 'Non connecté'}</div>
                  <div>Email: {currentUser?.email || 'N/A'}</div>
                  <div>Confirmé: {currentUser?.email_confirmed_at ? '✅ Oui' : '❌ Non'}</div>
                  <div className="border-t border-gray-600 pt-2 mt-2">
                    <div>Context: {user?.id ? '✅ Chargé' : '❌ Non chargé'}</div>
                    {user && <div>Role: {user.role}</div>}
                  </div>
                </div>
              </div>

              {/* ✅ Actions rapides */}
              <div className="flex space-x-2 text-xs">
                <Button
                  onClick={() => window.location.href = '/login'}
                  variant="ghost"
                  size="sm"
                  className="text-blue-400 hover:text-blue-300"
                >
                  Test Login
                </Button>
                <Button
                  onClick={() => window.location.href = '/register'}
                  variant="ghost"
                  size="sm"
                  className="text-green-400 hover:text-green-300"
                >
                  Test Signup
                </Button>
              </div>

              {/* ✅ Informations environnement */}
              <div className="text-xs text-gray-500 border-t border-gray-700 pt-2">
                <div>Mode: {process.env.NODE_ENV}</div>
                <div>URL: {window.location.origin}</div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};