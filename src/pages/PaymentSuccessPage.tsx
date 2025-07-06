import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import Loader from "../../components/ui/Loader";

const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshSession } = useAuth();
  const [status, setStatus] = useState<"checking" | "success" | "error">("checking");
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!user) {
      setStatus("error");
      return;
    }

    const checkSubscription = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("subscription_expires_at")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Erreur lors de la vérification de la souscription :", error.message);
        setStatus("error");
        return;
      }

      const expiresAt = data?.subscription_expires_at
        ? new Date(data.subscription_expires_at)
        : null;

      const now = new Date();

      if (expiresAt && expiresAt > now) {
        refreshSession(); // Met à jour le contexte utilisateur
        setStatus("success");
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        if (attempts < 5) {
          setTimeout(() => {
            setAttempts((prev) => prev + 1);
            checkSubscription();
          }, 2000);
        } else {
          setStatus("error");
        }
      }
    };

    checkSubscription();
  }, [user, attempts]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      {status === "checking" && (
        <>
          <h1 className="text-2xl font-bold mb-4">Processando Pagamento</h1>
          <p className="text-lg mb-2">Verificando pagamento...</p>
          <Loader />
          <p className="text-sm mt-2 text-gray-600">
            Aguarde enquanto confirmamos seu pagamento...
          </p>
        </>
      )}

      {status === "success" && (
        <>
          <h1 className="text-2xl font-bold text-green-600 mb-2">Pagamento Confirmado!</h1>
          <p className="text-gray-700">Redirecionando para seu painel...</p>
        </>
      )}

      {status === "error" && (
        <>
          <h1 className="text-2xl font-bold text-red-600 mb-2">Erro ao verificar pagamento</h1>
          <p className="text-gray-700">
            Não foi possível confirmar sua assinatura. Por favor, entre em contato com o suporte.
          </p>
          <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => navigate("/planos")}
          >
            Tentar novamente
          </button>
        </>
      )}
    </div>
  );
};

export default PaymentSuccessPage;
