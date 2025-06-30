import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

interface StripeButtonProps {
  className?: string;
}

export const StripeButton: React.FC<StripeButtonProps> = ({ className }) => {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);

  // Check if user needs Pro subscription
  const needsProSubscription = React.useMemo(() => {
    if (!user) return false;
    
    // If subscription is not active
    if (!user.pro_subscription_active) return true;
    
    // If no expiration date, consider as active (legacy)
    if (!user.subscription_expires_at) return false;
    
    // Check if subscription has expired
    const expirationDate = new Date(user.subscription_expires_at);
    const now = new Date();
    
    return expirationDate <= now;
  }, [user]);

  // Detect Bolt Preview environment
  const isBoltPreview = window.location.hostname.includes('webcontainer-api.io') || 
                       window.location.hostname.includes('bolt.new');

  const handleSubscribe = async () => {
    if (!user?.id || !user?.email) {
      toast.error('Usuário não autenticado ou email não disponível');
      return;
    }

    // Fallback for Bolt Preview environment
    if (isBoltPreview) {
      toast.error('Funcionalidade de pagamento não disponível no ambiente de preview. Acesse a versão deployada para testar pagamentos.');
      console.warn('🚫 [StripeButton] Pagamento bloqueado em modo Preview Bolt');
      return;
    }

    setProcessing(true);
    
    try {
      console.log('🚀 [StripeButton] Iniciando processo de pagamento Stripe...');
      console.log('👤 [StripeButton] Usuário:', { id: user.id, email: user.email });
      
      // Get user session token
      const sessionResult = await supabase.auth.getSession();
      const token = sessionResult.data.session?.access_token;

      if (!token) {
        throw new Error('Token de sessão não encontrado.');
      }
      
      // Use Supabase URL from environment variable
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-link`;
      
      // Send customer email explicitly
      const requestData = {
        customer_email: user.email
      };

      console.log('📤 [StripeButton] Envio dados para Edge Function:', JSON.stringify(requestData));

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      console.log('📥 [StripeButton] Resposta recebida:', response.status, response.statusText);

      if (!response.ok) {
        let errorMessage = 'Erro desconhecido';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || `Erro HTTP ${response.status}`;
          console.error('❌ [StripeButton] Erro API detalhado:', errorData);
        } catch (parseError) {
          console.error('❌ [StripeButton] Erro ao analisar resposta de erro:', parseError);
          errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ [StripeButton] Dados de checkout recebidos:', result);
      
      // Redirect to Stripe URL
      if (!result.url) {
        throw new Error('URL de checkout não recebida');
      }

      console.log('🔄 [StripeButton] Redirecionando para Stripe Checkout...');
      
      // Redirect to Stripe Checkout
      window.location.href = result.url;
      
    } catch (error: any) {
      console.error('❌ [StripeButton] Erro ao criar checkout:', error);
      
      // Specific error messages based on context
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        toast.error('Erro de conectividade. Verifique sua conexão ou tente na versão deployada.');
      } else if (error.message.includes('CORS')) {
        toast.error('Erro de CORS. Esta funcionalidade requer a versão deployada.');
      } else if (error.message.includes('customer_email is required')) {
        toast.error('Erro: Email do cliente não disponível. Verifique sua conta.');
        console.error('❌ [StripeButton] Email problema:', user?.email);
      } else {
        toast.error(`Erro ao iniciar o pagamento: ${error.message || 'Tente novamente.'}`);
      }
    } finally {
      setProcessing(false);
    }
  };

  // Don't show button if user doesn't need Pro subscription
  if (!needsProSubscription) {
    return null;
  }

  return (
    <Button
      onClick={handleSubscribe}
      isLoading={processing}
      leftIcon={<CreditCard className="h-4 w-4" />}
      className={`bg-primary-600 hover:bg-primary-700 text-white ${className}`}
      disabled={processing}
    >
      {processing ? 'Processando...' : 'Assinar Plano Pro – R$ 4,99/mês'}
    </Button>
  );
};

export default StripeButton;