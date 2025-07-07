import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { UpdatePasswordForm } from '../components/auth/UpdatePasswordForm';
import { Card } from '../components/ui/Card';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export const UpdatePasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isResetFlow, setIsResetFlow] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        // ✅ CORRECTION CRITIQUE: Extraire les paramètres du fragment d'URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        // ✅ DEBUG: Logs en mode développement
        if (process.env.NODE_ENV === 'development') {
          console.log('UpdatePasswordPage - URL params:', { 
            type, 
            hasAccessToken: !!accessToken, 
            hasRefreshToken: !!refreshToken,
            fullHash: window.location.hash
          });
        }

        // ✅ CORRECTION CRITIQUE: Détecter spécifiquement le type 'recovery'
        if (type === 'recovery' && accessToken && refreshToken) {
          console.log('Password recovery flow detected - setting session');
          setIsResetFlow(true);
          
          // ✅ CORRECTION: Établir la session avec les tokens de récupération
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            console.error('Error setting recovery session:', error);
            setSessionError('Link de redefinição de senha inválido ou expirado');
            toast.error('Link de redefinição de senha inválido ou expirado');
            
            // ✅ FALLBACK: Rediriger vers login après 3 secondes
            setTimeout(() => {
              navigate('/login');
            }, 3000);
            return;
          }

          if (process.env.NODE_ENV === 'development') {
            console.log('Recovery session established successfully:', data);
          }

          // ✅ NOUVEAU: Attendre confirmation de la session via listener
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (process.env.NODE_ENV === 'development') {
              console.log('Auth state change:', event, !!session);
            }

            if (event === 'SIGNED_IN' && session) {
              console.log('Session confirmed - enabling password reset');
              setLoading(false);
              subscription.unsubscribe();
            } else if (event === 'SIGNED_OUT') {
              console.log('Session lost during recovery');
              setSessionError('Sessão perdida durante a recuperação');
              setLoading(false);
              subscription.unsubscribe();
            }
          });

          // ✅ FALLBACK: Timeout de sécurité
          setTimeout(() => {
            if (loading) {
              console.log('Session establishment timeout - forcing completion');
              subscription.unsubscribe();
              setLoading(false);
            }
          }, 10000); // 10 secondes maximum

          return;
        }

        // ✅ CORRECTION: Si pas de tokens de récupération, vérifier session normale
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);
          setSessionError('Erro de autenticação');
          toast.error('Erro de autenticação');
          setTimeout(() => {
            navigate('/login');
          }, 3000);
          return;
        }

        if (!session) {
          setSessionError('Você precisa estar logado para alterar sua senha');
          toast.error('Você precisa estar logado para alterar sua senha');
          setTimeout(() => {
            navigate('/login');
          }, 3000);
          return;
        }

        // Mode normal (utilisateur connecté qui veut changer sa senha)
        console.log('Normal password change mode');
        setIsResetFlow(false);
        setLoading(false);
      } catch (error) {
        console.error('Reset handling error:', error);
        setSessionError('Erro ao processar solicitação');
        toast.error('Erro ao processar solicitação');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    handlePasswordReset();
  }, [navigate, loading]);

  // ✅ CORRECTION: Timeout de sécurité pour éviter le blocage
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('Forcing loading to stop after timeout');
        setLoading(false);
        // Si on force l'arrêt et qu'il y a type=recovery dans l'URL, assumer le mode recovery
        if (window.location.hash.includes('type=recovery')) {
          setIsResetFlow(true);
        }
      }
    }, 15000); // 15 secondes maximum

    return () => clearTimeout(timeoutId);
  }, [loading]);

  // ✅ NOUVEAU: Bouton de réessai en cas d'erreur
  const handleRetry = () => {
    setSessionError(null);
    setLoading(true);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent mx-auto"></div>
          <p className="mt-2 text-gray-500">
            {isResetFlow ? 'Configurando sessão de recuperação...' : 'Verificando autenticação...'}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            Isso pode levar alguns segundos
          </p>
        </div>
      </div>
    );
  }

  // ✅ NOUVEAU: Écran d'erreur avec option de réessai
  if (sessionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex justify-center">
              <GraduationCap className="h-12 w-12 text-red-600" />
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
              Erro de Autenticação
            </h1>
            <p className="mt-2 text-gray-600">
              {sessionError}
            </p>
          </div>

          <Card>
            <div className="p-6 text-center space-y-4">
              <p className="text-sm text-gray-600">
                {isResetFlow 
                  ? 'O link de recuperação pode estar expirado ou inválido.'
                  : 'Houve um problema ao verificar sua autenticação.'
                }
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={handleRetry}
                  className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors"
                >
                  Tentar Novamente
                </button>
                
                <button
                  onClick={() => navigate('/reset-password')}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Solicitar Novo Link
                </button>
                
                <button
                  onClick={() => navigate('/login')}
                  className="w-full text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Voltar ao Login
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <GraduationCap className="h-12 w-12 text-primary-600" />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
            {isResetFlow ? 'Redefinir Senha' : 'Alterar Senha'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isResetFlow 
              ? 'Digite sua nova senha para recuperar o acesso à sua conta'
              : 'Digite sua senha atual e a nova senha'
            }
          </p>
        </div>

        <Card>
          <UpdatePasswordForm isResetFlow={isResetFlow} />
        </Card>

        {/* ✅ NOUVEAU: Lien de retour adaptatif */}
        {isResetFlow && (
          <p className="text-center text-sm text-gray-600">
            Lembrou sua senha?{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-medium text-primary-600 hover:text-primary-700"
            >
              Voltar ao login
            </button>
          </p>
        )}
      </div>
    </div>
  );
};
