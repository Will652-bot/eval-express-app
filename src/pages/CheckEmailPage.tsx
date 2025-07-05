import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, RefreshCw, ArrowLeft } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export const CheckEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('signup-email');
    if (storedEmail) {
      setEmail(storedEmail);
    } else {
      toast.error('Email não encontrado. Faça o registro novamente.');
    }
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (!email) {
      toast.error('Email não encontrado. Tente se registrar novamente.');
      return;
    }

    if (!canResend) {
      toast.error(`Aguarde ${countdown} segundos antes de reenviar.`);
      return;
    }

    setResendLoading(true);
    setCanResend(false);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify`,
        },
      });

      if (error) {
        console.warn('📧 [CheckEmail] Erro ao reenviar:', error.message);

        if (error.message.includes('over_email_send_rate_limit')) {
          toast.error('Limite de envio excedido. Aguarde alguns minutos.');
          setCountdown(300); // 5 min
        } else {
          toast.error('Erro ao reenviar email. Tente novamente.');
          setCountdown(60);
        }

        return;
      }

      setResendCount((prev) => prev + 1);
      setCountdown(60);
      toast.success(`Email de confirmação reenviado! (${resendCount + 1}ª tentativa)`);
    } catch (error: any) {
      console.error('❌ [CheckEmail] Exception:', error);
      toast.error('Erro inesperado ao reenviar email.');
      setCountdown(60);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Mail className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900">
            Verifique seu Email!
          </h1>
          <p className="mt-2 text-gray-600">
            {email ? (
              <>Enviamos um link de confirmação para <strong>{email}</strong></>
            ) : (
              'Um email de confirmação foi enviado.'
            )}
          </p>
        </div>

        <Card>
          <div className="p-6 space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Mail className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    Próximos passos:
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Verifique sua caixa de entrada (e pasta de spam)</li>
                      <li>Clique no link de confirmação no email</li>
                      <li>Você será redirecionado automaticamente para fazer login</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">
                💡 Dicas importantes:
              </h4>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>O link de confirmação expira em 10 minutos</li>
                <li>Verifique a pasta de spam/lixo eletrônico</li>
                <li>Se não receber, use o botão "Reenviar" abaixo</li>
              </ul>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleResendEmail}
                variant="outline"
                className="w-full"
                isLoading={resendLoading}
                disabled={!canResend || resendLoading}
                leftIcon={<RefreshCw className="h-4 w-4" />}
              >
                {resendLoading
                  ? 'Reenviando...'
                  : !canResend
                    ? `Aguarde ${countdown}s`
                    : `Reenviar email${resendCount > 0 ? ` (${resendCount + 1}ª tentativa)` : ''}`}
              </Button>

              <Button
                onClick={() => navigate('/login')}
                variant="ghost"
                className="w-full"
                leftIcon={<ArrowLeft className="h-4 w-4" />}
              >
                Voltar para Login
              </Button>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                <p>Debug: Email = {email || 'não encontrado'}</p>
                <p>Redirect URL = {window.location.origin}/verify</p>
                <p>Reenvios: {resendCount}</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
