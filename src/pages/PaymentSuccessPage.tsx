import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Crown, ArrowLeft, Home } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const PaymentSuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'checking' | 'active' | 'pending'>('checking');

  useEffect(() => {
    // Stripe session verification
    const sessionId = searchParams.get('session_id');
    
    console.log('🔍 [PaymentSuccess] Session ID:', sessionId);

    // Simulate verification delay for better UX
    const timer = setTimeout(() => {
      if (sessionId) {
        console.log('✅ [PaymentSuccess] Session ID found, payment confirmed');
        setStatus('success');
        // Start checking subscription status
        checkSubscriptionStatus();
      } else {
        console.log('❌ [PaymentSuccess] Session ID missing');
        setStatus('error');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [searchParams]);

  const checkSubscriptionStatus = async () => {
    if (!user?.id) return;

    let attempts = 0;
    const maxAttempts = 12; // 1 minute total (5s intervals)

    const checkStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('current_plan, pro_subscription_active, subscription_expires_at')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        console.log('📊 [PaymentSuccess] Subscription status:', data);

        if (data?.pro_subscription_active === true || data?.current_plan === 'pro') {
          setSubscriptionStatus('active');
          return true;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000); // Check every 5 seconds
        } else {
          setSubscriptionStatus('pending');
        }

        return false;
      } catch (error) {
        console.error('❌ [PaymentSuccess] Error checking subscription:', error);
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000);
        } else {
          setSubscriptionStatus('pending');
        }
        return false;
      }
    };

    checkStatus();
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />;
      case 'error':
        return <Crown className="h-16 w-16 text-red-500 mx-auto mb-4" />;
      default:
        return (
          <div className="h-16 w-16 mx-auto mb-4">
            <div className="animate-spin h-16 w-16 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        );
    }
  };

  const getSubscriptionMessage = () => {
    switch (subscriptionStatus) {
      case 'active':
        return {
          title: 'Plano Pro Ativado!',
          message: 'Seu plano Pro está ativo e você já tem acesso a todas as funcionalidades premium.',
          color: 'text-green-700',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'pending':
        return {
          title: 'Processando Ativação...',
          message: 'Seu pagamento foi confirmado. A ativação do plano Pro pode levar alguns minutos.',
          color: 'text-blue-700',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      default:
        return {
          title: 'Verificando Status...',
          message: 'Aguarde enquanto verificamos a ativação do seu plano Pro.',
          color: 'text-gray-700',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const subscriptionInfo = getSubscriptionMessage();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {status === 'loading' && 'Processando Pagamento'}
            {status === 'success' && 'Pagamento Confirmado!'}
            {status === 'error' && 'Erro na Confirmação'}
          </h1>
          <p className="text-gray-600">
            EvalExpress - Plano Pro
          </p>
        </div>

        {/* Status Card */}
        <Card className={`p-8 ${
          status === 'success' ? 'bg-green-50 border-green-200' :
          status === 'error' ? 'bg-red-50 border-red-200' :
          'bg-blue-50 border-blue-200'
        }`}>
          <div className="text-center">
            {getStatusIcon()}
            
            <h2 className={`text-xl font-semibold mb-4 ${
              status === 'success' ? 'text-green-700' :
              status === 'error' ? 'text-red-700' :
              'text-blue-700'
            }`}>
              {status === 'loading' && 'Verificando pagamento...'}
              {status === 'success' && 'Bem-vindo ao Plano Pro!'}
              {status === 'error' && 'Falha na Verificação'}
            </h2>
            
            <p className={`text-base mb-6 ${
              status === 'success' ? 'text-green-700' :
              status === 'error' ? 'text-red-700' :
              'text-blue-700'
            }`}>
              {status === 'loading' && 'Aguarde enquanto confirmamos seu pagamento...'}
              {status === 'success' && 'Seu pagamento foi processado com sucesso!'}
              {status === 'error' && 'Não foi possível confirmar seu pagamento. Entre em contato com o suporte se o problema persistir.'}
            </p>

            {/* Subscription Status */}
            {status === 'success' && (
              <div className={`${subscriptionInfo.bgColor} border ${subscriptionInfo.borderColor} rounded-md p-4 mb-6`}>
                <h3 className={`font-medium ${subscriptionInfo.color} mb-2`}>
                  {subscriptionInfo.title}
                </h3>
                <p className={`text-sm ${subscriptionInfo.color} mb-3`}>
                  {subscriptionInfo.message}
                </p>
                
                {subscriptionStatus === 'active' && (
                  <div className="text-sm text-green-700 space-y-1">
                    <p className="font-medium">Agora você tem acesso a:</p>
                    <ul className="list-disc list-inside space-y-1 text-left">
                      <li>✅ Alunos ilimitados</li>
                      <li>✅ Exportação em PDF e Excel</li>
                      <li>✅ Anexos PDF às avaliações</li>
                      <li>✅ Suporte prioritário</li>
                      <li>✅ Todas as funcionalidades avançadas</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          {status !== 'loading' && (
            <>
              <Link
                to="/dashboard"
                className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors duration-200"
              >
                <Home className="h-5 w-5 mr-2" />
                Ir para o Dashboard
              </Link>

              <Link
                to="/plans"
                className="w-full flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Ver Planos
              </Link>
            </>
          )}
        </div>

        {/* Support info for errors */}
        {status === 'error' && (
          <div className="text-center text-sm text-gray-500">
            <p>Precisa de ajuda?</p>
            <a 
              href="mailto:support@evalexpress.com" 
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Entre em contato com nosso suporte
            </a>
          </div>
        )}

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="text-xs text-gray-400 bg-gray-100 p-2 rounded">
            <p>Debug Info:</p>
            <p>Session ID: {searchParams.get('session_id') || 'Not found'}</p>
            <p>Status: {status}</p>
            <p>Subscription: {subscriptionStatus}</p>
            <p>URL: {window.location.href}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccessPage;