// src/pages/PaymentSuccessPage.tsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

const PaymentSuccessPage: React.FC = () => {
  const { user, fetchUserProfile } = useAuth();
  const [isVerified, setIsVerified] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId || !user) return;

    const interval = setInterval(async () => {
      if (attempts >= 5) {
        clearInterval(interval);
        navigate("/");
        return;
      }

      setAttempts((prev) => prev + 1);

      const { data, error } = await supabase
        .from("users")
        .select("pro_subscription_active, subscription_expires_at")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("❌ Erreur Supabase :", error.message);
        return;
      }

      const now = new Date();
      const expires = data?.subscription_expires_at
        ? new Date(data.subscription_expires_at)
        : null;

      const active = data?.pro_subscription_active && expires && expires > now;

      if (active) {
        setIsVerified(true);
        await fetchUserProfile(); // met à jour l'état global utilisateur
        clearInterval(interval);
        setTimeout(() => navigate("/"), 2000);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [sessionId, user, attempts, fetchUserProfile, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-2xl font-bold mb-4">Processando Pagamento</h1>
      <p className="text-muted-foreground mb-6">EvalExpress – Plano Pro</p>
      <Card className="p-6 max-w-md w-full">
        {isVerified ? (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-green-600">
              Pagamento confirmado!
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Redirecionando para o aplicativo...
            </p>
          </>
        ) : (
          <>
            <div className="flex justify-center items-center mb-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
            </div>
            <p className="text-blue-600 font-medium">Verificando pagamento...</p>
            <p className="text-sm text-muted-foreground mt-2">
              Aguarde enquanto confirmamos seu pagamento...
            </p>
          </>
        )}
      </Card>
    </div>
  );
};

export default PaymentSuccessPage;
