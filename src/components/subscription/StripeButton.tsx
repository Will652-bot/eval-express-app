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

  const needsProSubscription = React.useMemo(() => {
    if (!user) return false;
    if (!user.pro_subscription_active) return true;
    if (!user.subscription_expires_at) return false;

    const expirationDate = new Date(user.subscription_expires_at);
    return expirationDate <= new Date();
  }, [user]);

  const isBoltPreview = window.location.hostname.includes('webcontainer-api.io') || 
                        window.location.hostname.includes('bolt.new');

  const handleSubscribe = async () => {
    if (!user?.id || !user?.email) {
      toast.error('Usuário não autenticado ou email não disponível');
      return;
    }

    if (isBoltPreview) {
      toast.error('Pagamento indisponível no ambiente de preview. Use a versão publicada.');
      return;
    }

    setProcessing(true);
    
    try {
      const sessionResult = await supabase.auth.getSession();
      const token = sessionResult.data.session?.access_token;
      if (!token) throw new Error('Token de sessão não encontrado.');

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-link`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customer_email: user.email }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || errorData.details || `Erro HTTP ${response.status}`;
        throw new Error(errorMsg);
      }

      const result = await response.json();
      if (!result.url) throw new Error('URL de checkout não recebida');

      window.location.href = result.url;

    } catch (error: any) {
      console.error('❌ Erro StripeButton:', error);
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        toast.error('Erro de conexão. Verifique sua internet ou use a versão deployada.');
      } else if (error.message.includes('CORS')) {
        toast.error('Erro de CORS. Teste na versão publicada.');
      } else {
        toast.error(`Erro ao iniciar pagamento: ${error.message || 'Tente novamente.'}`);
      }
    } finally {
      setProcessing(false);
    }
  };

  if (!needsProSubscription) return null;

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
