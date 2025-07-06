import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader } from '../components/ui/Loader';
import { CheckCircle } from 'lucide-react';

const PaymentSuccessPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 5;

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!user) return;

      await refreshUser();
      const updatedUser = await refreshUser(); // refetch again

      if (updatedUser?.pro_subscription_active) {
        setConfirmed(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    };

    const intervalId = setInterval(() => {
      if (attempts >= maxAttempts) {
        clearInterval(intervalId);
        console.warn('⏱️ Limite de tentatives atteinte');
        return;
      }
      setAttempts((prev) => prev + 1);
      checkSubscriptionStatus();
    }, 2000);

    return () => clearInterval(intervalId);
  }, [user, attempts, navigate, refreshUser]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-green-50 text-green-900 p-4 text-center">
      {confirmed ? (
        <>
          <CheckCircle className="w-20 h-20 text-green-600 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Pagamento confirmado!</h1>
          <p className="text-md">Sua assinatura Pro foi ativada. Redirecionando...</p>
        </>
      ) : attempts >= maxAttempts ? (
        <>
          <h1 className="text-xl font-bold text-red-600 mb-2">Estamos processando...</h1>
          <p className="text-sm mb-4">O pagamento foi realizado, mas não conseguimos confirmar a ativação da sua conta Pro. Tente novamente mais tarde.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Ir para o Dashboard
          </button>
        </>
      ) : (
        <>
          <Loader />
          <p className="text-md mt-4">Confirmando o pagamento...</p>
        </>
      )}
    </div>
  );
};

export default PaymentSuccessPage;
