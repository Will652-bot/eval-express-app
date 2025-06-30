import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, AlertTriangle, ArrowLeft } from 'lucide-react';
import { UpdatePasswordForm } from '../components/auth/UpdatePasswordForm';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isValidReset, setIsValidReset] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        console.log('🔍 [ResetPassword] Vérification du lien de réinitialisation');
        
        // Récupérer le code de l'URL (paramètre 'code')
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        // Vérifier si le code est présent
        if (!code) {
          console.error('❌ [ResetPassword] Code manquant dans l\'URL');
          setErrorMessage('Link de redefinição de senha inválido ou não encontrado');
          setIsValidReset(false);
          setLoading(false);
          return;
        }
        
        console.log('✅ [ResetPassword] Code trouvé dans l\'URL');
        
        // Vérifier le code OTP avec Supabase
        const { data, error } = await supabase.auth.verifyOtp({
          type: 'recovery',
          token: code,
        });
        
        if (error) {
          console.error('❌ [ResetPassword] Erreur vérification OTP:', error.message);
          
          if (error.message.includes('expired')) {
            setErrorMessage('Link de redefinição de senha expirado. Solicite um novo link.');
          } else {
            setErrorMessage('Link de redefinição de senha inválido ou expirado');
          }
          
          setIsValidReset(false);
        } else {
          console.log('✅ [ResetPassword] Code OTP valide, session établie');
          setIsValidReset(true);
        }
      } catch (error: any) {
        console.error('❌ [ResetPassword] Exception:', error.message);
        setErrorMessage('Erro ao processar solicitação de redefinição');
        setIsValidReset(false);
      } finally {
        setLoading(false);
      }
    };

    handlePasswordReset();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent mx-auto"></div>
          <p className="mt-2 text-gray-500">Verificando link de recuperação...</p>
        </div>
      </div>
    );
  }

  if (!isValidReset || errorMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex justify-center">
              <AlertTriangle className="h-12 w-12 text-red-600" />
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
              Link Inválido
            </h1>
            <p className="mt-2 text-gray-600">
              {errorMessage || 'O link de redefinição de senha é inválido ou expirou'}
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
                        <li>O link expirou (válido por 1 hora)</li>
                        <li>O link já foi usado anteriormente</li>
                        <li>O link foi copiado incorretamente</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/request-password-reset')}
                  className="w-full"
                >
                  Solicitar Novo Link
                </Button>
                
                <Button
                  onClick={() => navigate('/login')}
                  variant="outline"
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
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <GraduationCap className="h-12 w-12 text-primary-600" />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
            Redefinir Senha
          </h1>
          <p className="mt-2 text-gray-600">
            Digite sua nova senha para recuperar o acesso à sua conta
          </p>
        </div>

        <Card>
          <UpdatePasswordForm isResetFlow={true} />
        </Card>

        <p className="text-center text-sm text-gray-600">
          Lembrou sua senha?{' '}
          <button
            onClick={() => navigate('/login')}
            className="font-medium text-primary-600 hover:text-primary-700"
          >
            Voltar ao login
          </button>
        </p>
      </div>
    </div>
  );
};