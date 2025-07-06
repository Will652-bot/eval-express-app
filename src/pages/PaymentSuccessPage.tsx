import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const PaymentSuccessPage: React.FC = () => {
  const { user, refetchUser } = useAuth();
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      let tries = 0;

      while (tries < 5) {
        await refetchUser();

        if (user?.pro_subscription_active) {
          toast.success('✅ Pagamento confirmado com sucesso!');
          setChecking(false);
          return navigate('/');
        }

        tries++;
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      setChecking(false);
      toast.error('❌ Pagamento não foi confirmado. Tente novamente mais tarde.');
      navigate('/cancelado');
    };

    checkSubscriptionStatus();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center px-4">
      <h1 className="text-2xl font-bold mb-4">Processando Pagamento</h1>
      <p className="mb-2 text-gray-600">EvalExpress – Plano Pro</p>
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-6 py-8 shadow-md mt-4 max-w-md w-full">
        {checking ? (
          <>
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
            <p className="text-lg font-semibold mt-4 text-blue-700">Verificando pagamento...</p>
            <p className="text-sm text-gray-600 mt-2">
              Aguarde enquanto confirmamos seu pagamento...
            </p>
          </>
        ) : (
          <p className="text-red-500">Erro ao confirmar pagamento. Retornando...</p>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
