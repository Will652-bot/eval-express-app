// supabase/functions/stripe-webhook/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.24.0?target=deno&deno-std=0.168.0";

// Initialisez le client Stripe avec votre clé secrète.
// La librairie est configurée pour fonctionner dans l'environnement Deno.
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: "2024-06-20",
});

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // 1. Récupération de la signature et du corps de la requête
  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text();

  let event: Stripe.Event;

  try {
    // 2. Vérification de la signature avec la méthode officielle et asynchrone
    // C'est la correction majeure qui résout votre erreur.
    event = await stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!
    );
  } catch (err) {
    console.error("❌ Erreur de vérification de la signature Stripe:", err.message);
    return new Response(err.message, { status: 400 });
  }

  // 3. Gestion de l'événement avec un `switch` pour plus de clarté
  const data = event.data.object as Stripe.Checkout.Session;

  switch (event.type) {
    case "checkout.session.completed": {
      console.log("✅ Session de paiement terminée pour:", data.customer_details?.email);

      const { data: user, error: userErr } = await supabase
        .from("users")
        .select("id")
        .eq("email", data.customer_details?.email)
        .single();

      if (userErr || !user) {
        console.error("❌ Utilisateur non trouvé:", data.customer_details?.email, userErr);
        return new Response("User not found", { status: 404 });
      }

      // Mise à jour de l'utilisateur avec les informations d'abonnement
      const { error: updateErr } = await supabase
        .from("users")
        .update({
          pro_subscription_active: true,
          stripe_customer_id: data.customer,
          stripe_subscription_id: data.subscription,
        })
        .eq("id", user.id);

      if (updateErr) {
        console.error("❌ Échec de la mise à jour de l'utilisateur:", updateErr);
        return new Response("User update failed", { status: 500 });
      }

      console.log("✅ Utilisateur mis à jour avec le statut Pro.");
      break;
    }

    default: {
      console.log(`ℹ️ Événement non géré: ${event.type}`);
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
