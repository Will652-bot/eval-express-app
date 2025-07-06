import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

const PaymentSuccessPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!sessionId) {
        navigate('/plans');
        return;
      }

      console.log('🔄 Vérification du statut de l’abonnement Stripe');

      // Forcer le rechargement des infos utilisateur Supabase
      const { error: refreshError } = await refreshUser();

      if (refreshError) {
        console.error('❌ Erreur lors du rafraîchissement de l’utilisateur :', refreshError);
        navigate('/plans');
        return;
      }

      // Attendre une courte latence pour garantir la propagation des updates webhook
      await new Promise((resolve) => setTimeout(resolve, 4000));

      // Recharger le user après propagation
      const { data: refreshedUser, error: userError } = await supabase
        .from('users')
        .select('subscription_expires_at')
        .eq('id', user?.id)
        .single();

      if (userError || !refreshedUser) {
        console.error('❌ Impossible de récupérer les infos utilisateur :', userError);
        navigate('/plans');
        return;
      }

      const expiresAt = refreshedUser.subscription_expires_at
        ? new Date(refreshedUser.subscription_expires_at)
        : null;

      const now = new Date();

      if (!expiresAt || expiresAt < now) {
        console.warn('⏳ Abonnement toujours inactif...');
        navigate('/plans');
      } else {
        console.log('✅ Abonnement actif jusqu’au :', expiresAt.toISOString());
        navigate('/dashboard');
      }
    };

    checkSubscriptionStatus();
  }, [sessionId, user?.id, navigate, refreshUser]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-2xl font-bold mb-2">Processando Pagamento</h1>
      <p className="text-lg text-muted-foreground mb-6">EvalExpress - Plano Pro</p>
      <div className="flex flex-col items-center bg-blue-100 p-6 rounded-lg shadow-lg">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p className="text-blue-700 font-semibold text-lg">Verificando pagamento...</p>
        <p className="text-sm text-blue-800 mt-2">
          Aguarde enquanto confirmamos seu pagamento...
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
