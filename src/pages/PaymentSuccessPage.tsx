import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useUser } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Loader } from "../../components/ui/Loader";

const PaymentSuccessPage = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "success" | "failed">("checking");
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!user?.id) return;

    const checkSubscriptionStatus = async () => {
      try {
        const { data, error } = await supabase
          .from("users")
          .select("pro_subscription_active, subscription_expires_at")
          .eq("id", user.id)
          .single();

        if (error) throw error;

        const isActive = data?.pro_subscription_active;
        const isValidDate = data?.subscription_expires_at
          ? new Date(data.subscription_expires_at) > new Date()
          : false;

        if (isActive && isValidDate) {
          setStatus("success");
          setTimeout(() => navigate("/dashboard"), 2000);
        } else {
          if (attempts < 5) {
            setAttempts((prev) => prev + 1);
            setTimeout(checkSubscriptionStatus, 2000);
          } else {
            setStatus("failed");
          }
        }
      } catch (err) {
        console.error("Erreur lors de la vérification d’abonnement :", err);
        setStatus("failed");
      }
    };

    checkSubscriptionStatus();
  }, [user, attempts, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      {status === "checking" && (
        <>
          <Loader className="w-10 h-10 mb-4" />
          <p className="text-lg font-semibold">Confirmando sua assinatura...</p>
          <p className="text-sm text-muted-foreground">Isso pode levar alguns segundos.</p>
        </>
      )}
      {status === "success" && (
        <>
          <p className="text-lg font-semibold text-green-600">Assinatura confirmada com sucesso!</p>
          <p className="text-sm">Você será redirecionado em instantes...</p>
        </>
      )}
      {status === "failed" && (
        <>
          <p className="text-lg font-semibold text-red-600">Não foi possível confirmar sua assinatura.</p>
          <p className="text-sm">Por favor, entre em contato com o suporte.</p>
        </>
      )}
    </div>
  );
};

export default PaymentSuccessPage;
