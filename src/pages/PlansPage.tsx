import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Check, Crown } from 'lucide-react';
import { StripeButton } from '../components/subscription/StripeButton';
import { ProBadge } from '../components/subscription/ProBadge';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export const PlansPage: React.FC = () => {
  const { user } = useAuth();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'checking' | 'active' | 'inactive'>('checking');

  useEffect(() => {
    // Check if user comes from successful payment
    const urlParams = new URLSearchParams(window.location.search);
    const paymentSuccess = urlParams.get('payment_success');
    
    if (paymentSuccess === 'true' && user?.pro_subscription_active) {
      setShowSuccessMessage(true);
      toast.success('Parabéns! Seu plano Pro está ativo.');
      
      // Clear URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Hide message after 10 seconds
      setTimeout(() => setShowSuccessMessage(false), 10000);
    }
  }, [user]);

  useEffect(() => {
    // ✅ DÉTECTION AUTO DU PASSAGE AU PLAN PRO
    if (!user?.id) return;

    const checkSubscriptionStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('current_plan, pro_subscription_active, subscription_expires_at')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        console.log('📊 [PlansPage] Subscription status:', data);

        if (data?.pro_subscription_active === true || data?.current_plan === 'pro') {
          setSubscriptionStatus('active');
        } else {
          setSubscriptionStatus('inactive');
        }
      } catch (error) {
        console.error('❌ [PlansPage] Error checking subscription:', error);
        setSubscriptionStatus('inactive');
      }
    };

    // Check immediately
    checkSubscriptionStatus();

    // ✅ VÉRIFICATION PÉRIODIQUE DU STATUT PRO
    const interval = setInterval(checkSubscriptionStatus, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [user?.id]);

  // Check if user has active Pro subscription
  const hasActivePro = subscriptionStatus === 'active' || user?.pro_subscription_active === true;

  // Function to format expiration date
  const formatExpirationDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('pt-BR');
    } catch {
      return 'Data não disponível';
    }
  };

  // Loading state while user data is being fetched
  if (!user) {
    return (
      <div className="space-y-6 animate-in">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Planos</h1>
          <p className="mt-1 text-gray-500">
            Carregando informações do usuário...
          </p>
        </div>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 rounded-full border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Planos</h1>
        <p className="mt-1 text-gray-500">
          {hasActivePro 
            ? 'Gerencie sua assinatura Pro'
            : 'Escolha o plano ideal para suas necessidades'
          }
        </p>
      </div>

      {/* Success message for new Pro subscribers */}
      {showSuccessMessage && hasActivePro && (
        <Card className="bg-gradient-to-r from-success-50 to-success-100 border-success-200">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="p-3 bg-success-100 rounded-full">
                <Crown className="h-6 w-6 text-success-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-success-900">
                  🎉 Parabéns! Seu plano Pro está ativo!
                </h3>
                <p className="text-success-700 mt-1">
                  Agora você tem acesso a todas as funcionalidades premium do EvalExpress.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Subscription status indicator */}
      {subscriptionStatus === 'checking' && (
        <Card className="bg-blue-50 border-blue-200">
          <div className="p-4">
            <div className="flex items-center space-x-3">
              <div className="animate-spin h-5 w-5 border-2 border-blue-600 rounded-full border-t-transparent"></div>
              <div>
                <h3 className="text-sm font-medium text-blue-900">
                  Verificando status da assinatura...
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Aguarde enquanto verificamos seu plano atual.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Conditional display based on subscription status */}
      {hasActivePro ? (
        // User with active Pro subscription
        <div className="space-y-6">
          {/* Pro Status Card */}
          <Card className="bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div className="flex items-center space-x-4 mb-4 md:mb-0">
                  <div className="p-4 bg-primary-100 rounded-full">
                    <Crown className="h-8 w-8 text-primary-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Plano Pro Ativo
                    </h2>
                    <p className="text-gray-600 mt-1">
                      Você tem acesso completo a todas as funcionalidades premium
                    </p>
                  </div>
                </div>
                <ProBadge />
              </div>

              {/* Subscription information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-white rounded-lg p-4 border border-primary-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Plano Atual</h3>
                  <p className="text-gray-600">{user.current_plan || 'Pro'}</p>
                </div>
                
                {user.subscription_expires_at && (
                  <div className="bg-white rounded-lg p-4 border border-primary-200">
                    <h3 className="font-semibold text-gray-900 mb-2">Próxima Cobrança</h3>
                    <p className="text-gray-600">
                      {formatExpirationDate(user.subscription_expires_at)}
                    </p>
                  </div>
                )}
              </div>

              {/* Pro Features */}
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Suas Funcionalidades Pro Ativas:
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center text-success-700">
                    <Check className="h-5 w-5 mr-2" />
                    <span>Alunos ilimitados</span>
                  </div>
                  <div className="flex items-center text-success-700">
                    <Check className="h-5 w-5 mr-2" />
                    <span>Exportação em PDF e Excel</span>
                  </div>
                  <div className="flex items-center text-success-700">
                    <Check className="h-5 w-5 mr-2" />
                    <span>Anexos PDF às avaliações</span>
                  </div>
                  <div className="flex items-center text-success-700">
                    <Check className="h-5 w-5 mr-2" />
                    <span>Support prioritário</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Subscription Management */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Gerenciar Assinatura
              </h3>
              <p className="text-gray-600 mb-4">
                Para cancelar ou modificar sua assinatura, entre em contato com nosso suporte.
              </p>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                <Button variant="outline">
                  <a href="mailto:support@evalexpress.com">
                    Contatar Suporte
                  </a>
                </Button>
                <Button variant="ghost">
                  <a href="/dashboard">
                    Ir para Dashboard
                  </a>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        // User without Pro subscription - Show plans
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free Plan */}
          <Card className="relative">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900">Gratuito</h3>
              <p className="mt-2 text-gray-500">Ideal para quem está começando a organizar suas avaliações.</p>
              <p className="mt-8 text-4xl font-bold text-gray-900">R$ 0</p>
              <p className="text-sm text-gray-500">/mês</p>

              <ul className="mt-6 space-y-4">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-500 mt-0.5" />
                  <span className="ml-3 text-gray-700">Até 30 alunos</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-500 mt-0.5" />
                  <span className="ml-3 text-gray-700">Relatórios Básicos e Personalizados</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-500 mt-0.5" />
                  <span className="ml-3 text-gray-700">Suporte por email</span>
                </li>
              </ul>

              <Button className="mt-8 w-full" disabled>
                Plano Atual
              </Button>
            </div>
          </Card>

          {/* Pro Plan */}
          <Card className="relative border-primary-500">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                Popular
              </span>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-2xl font-bold text-gray-900">Pro</h3>
              </div>
              <p className="mt-2 text-gray-500">Para quem busca mais controle, exportação e relatórios avançados.</p>
              <p className="mt-8 text-4xl font-bold text-gray-900">R$ 4,99</p>
              <p className="text-sm text-gray-500">/mês</p>

              <ul className="mt-6 space-y-4">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-500 mt-0.5" />
                  <span className="ml-3 text-gray-700">Todas as features do Plano Gratuito</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-500 mt-0.5" />
                  <span className="ml-3 text-gray-700">Alunos ilimitados</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-500 mt-0.5" />
                  <span className="ml-3 text-gray-700">Suporte prioritário</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-500 mt-0.5" />
                  <span className="ml-3 text-gray-700">Exportação em PDF</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-500 mt-0.5" />
                  <span className="ml-3 text-gray-700">Exportação em MS Excel</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-500 mt-0.5" />
                  <span className="ml-3 text-gray-700">Possibilidade de anexar arquivos PDF às avaliações</span>
                </li>
              </ul>

              <div className="mt-8">
                <StripeButton className="w-full" />
              </div>
            </div>
          </Card>

          {/* Enterprise Plan */}
          <Card className="relative">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900">Empresarial</h3>
              <p className="mt-2 text-gray-500">Para escolas e instituições</p>
              <p className="mt-8 text-4xl font-bold text-gray-900">Sob Consulta</p>
              <p className="text-sm text-gray-500">personalizado</p>

              <ul className="mt-6 space-y-4">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-500 mt-0.5" />
                  <span className="ml-3 text-gray-700">Todas as features do Plano Pro</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-500 mt-0.5" />
                  <span className="ml-3 text-gray-700">API personalizada</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-500 mt-0.5" />
                  <span className="ml-3 text-gray-700">Integração com sistemas</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-primary-500 mt-0.5" />
                  <span className="ml-3 text-gray-700">Suporte 24/7</span>
                </li>
              </ul>

              <Button className="mt-8 w-full">Contatar Vendas</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};