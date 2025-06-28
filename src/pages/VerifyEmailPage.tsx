import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, CheckCircle, AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState<'success' | 'error' | 'processing'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // ✅ PHASE 4: Extraire les paramètres de l'URL IMMÉDIATEMENT
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');
        const error = hashParams.get('error');
        const errorCode = hashParams.get('error_code');

        console.log('🔍 [VerifyEmail] Paramètres URL:', {
          type, 
          hasAccessToken: !!accessToken, 
          hasRefreshToken: !!refreshToken,
          error,
          errorCode
        });

        // ✅ PHASE 4: Gestion spécifique de otp_expired
        if (error === 'access_denied' && errorCode === 'otp_expired') {
          console.log('⏰ [VerifyEmail] OTP expiré détecté');
          setErrorMessage('Seu link de verificação expirou. Solicite um novo link de confirmação.');
          setVerificationStatus('error');
          setLoading(false);
          return;
        }

        // Autres erreurs dans l'URL
        if (error) {
          console.log('❌ [VerifyEmail] Erreur dans URL:', error);
          setErrorMessage(`Erro na verificação: ${error}`);
          setVerificationStatus('error');
          setLoading(false);
          return;
        }

        // ✅ Vérifier que c'est bien une vérification d'email
        if (type === 'signup' && accessToken && refreshToken) {
          console.log('📧 [VerifyEmail] Flux de vérification détecté');
          
          // ✅ PHASE 4: Établir la session IMMÉDIATEMENT
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError) {
            console.error('❌ [VerifyEmail] Erreur session:', sessionError.message);
            setErrorMessage('Link de verificação inválido ou expirado');
            setVerificationStatus('error');
            setLoading(false);
            return;
          }

          if (data.user) {
            const email = data.user.email || '';
            setUserEmail(email);

            console.log('✅ [VerifyEmail] Vérification réussie:', {
              user_id: data.user.id,
              email: data.user.email,
              confirmed_at: data.user.email_confirmed_at
            });
            
            // ✅ Insérer l'utilisateur dans la table users si nécessaire
            try {
              const { error: insertError } = await supabase
                .from('users')
                .insert({
                  id: data.user.id,
                  email: data.user.email,
                  role: 'teacher',
                  subscription_plan: 'free'
                });

              if (insertError && !insertError.message.includes('duplicate key')) {
                console.warn('⚠️ [VerifyEmail] Erreur insertion users:', insertError.message);
              }
            } catch (insertErr: any) {
              console.warn('⚠️ [VerifyEmail] Exception insertion users:', insertErr.message);
            }

            setVerificationStatus('success');
            toast.success('Email verificado com sucesso! Redirecionando...');
            
            // ✅ PHASE 4: Redirection IMMÉDIATE vers login
            setTimeout(() => {
              navigate('/login');
            }, 2000);
            return;
          }
        }

        // Si pas de tokens valides ou type incorrect
        console.log('❌ [VerifyEmail] Paramètres de vérification invalides');
        setErrorMessage('Link de verificação inválido ou não encontrado');
        setVerificationStatus('error');
        
      } catch (error: any) {
        console.error('❌ [VerifyEmail] Exception vérification:', error);
        setErrorMessage('Erro ao processar verificação de email');
        setVerificationStatus('error');
      } finally {
        setLoading(false);
      }
    };

    handleEmailVerification();
  }, [navigate]);

  // ✅ PHASE 4: Fonction de retry pour les cas d'échec
  const handleRetryVerification = async () => {
    setRetryCount(prev => prev + 1);
    setLoading(true);
    setVerificationStatus('processing');
    setErrorMessage(null);

    // Relancer le processus de vérification
    window.location.reload();
  };

  const handleRequestNewLink = () => {
    // Rediriger vers check-email pour demander un nouveau lien
    navigate('/check-email');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent mx-auto"></div>
          <p className="mt-2 text-gray-500">Verificando seu email...</p>
          {retryCount > 0 && (
            <p className="mt-1 text-xs text-gray-400">Tentativa {retryCount + 1}</p>
          )}
        </div>
      </div>
    );
  }

  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
              Email Verificado!
            </h1>
            <p className="mt-2 text-gray-600">
              Sua conta foi confirmada com sucesso
            </p>
            {userEmail && (
              <p className="mt-1 text-sm text-gray-500">{userEmail}</p>
            )}
          </div>

          <Card>
            <div className="p-6 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Conta ativada com sucesso!
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>Você será redirecionado para a página de login em alguns segundos...</p>
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => navigate('/login')}
                className="w-full"
              >
                Ir para Login
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ✅ PHASE 4: État d'erreur avec options de récupération
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <AlertTriangle className="h-12 w-12 text-red-600" />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
            Verificação Falhou
          </h1>
          <p className="mt-2 text-gray-600">
            {errorMessage || 'Não foi possível verificar seu email'}
          </p>
        </div>

        <Card>
          <div className="p-6 space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Possíveis causas:
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>O link de verificação expirou (válido por 10 minutos)</li>
                      <li>O link já foi usado anteriormente</li>
                      <li>O link foi copiado incorretamente</li>
                      <li>Problema temporário de conectividade</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleRequestNewLink}
                className="w-full"
                leftIcon={<RefreshCw className="h-4 w-4" />}
              >
                Solicitar Novo Link de Verificação
              </Button>
              
              {retryCount < 2 && (
                <Button
                  onClick={handleRetryVerification}
                  variant="outline"
                  className="w-full"
                >
                  Tentar Novamente {retryCount > 0 && `(${retryCount + 1}ª tentativa)`}
                </Button>
              )}
              
              <Button
                onClick={() => navigate('/login')}
                variant="ghost"
                className="w-full"
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Voltar ao Login
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};