// supabase/functions/stripe-webhook/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.24.0?target=deno&no-check";

// Initialiser le client Stripe avec la clé secrète
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-06-20",
});

serve(async (req) => {
  // Récupérer la signature de la requête et le corps brut
  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text();

  let event: Stripe.Event;

  try {
    // Vérifier la signature en utilisant le fournisseur de cryptographie de Deno
    // C'est la méthode la plus compatible avec les Edge Functions de Supabase
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get("STRIPE_WEBHOOK_SECRET")!,
      undefined,
      Stripe.createSubtleCryptoProvider()
    );
  } catch (err) {
    console.error(`❌ Erreur de vérification de la signature Stripe: ${err.message}`);
    return new Response(err.message, { status: 400 });
  }
  
  // Créer un client Supabase avec les droits de service pour modifier la base de données
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Gérer l'événement 'checkout.session.completed'
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerEmail = session.customer_details?.email;

    if (!customerEmail) {
      console.error("❌ Email du client manquant dans la session Stripe.");
      return new Response("Email manquant", { status: 400 });
    }

    console.log(`✅ Session de paiement réussie pour: ${customerEmail}`);

    // Trouver l'utilisateur dans votre base de données
    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("id")
      .eq("email", customerEmail)
      .single();

    if (userErr || !user) {
      console.error(`❌ Utilisateur non trouvé dans Supabase: ${customerEmail}`, userErr);
      return new Response("User not found", { status: 404 });
    }

    // Mettre à jour le statut de l'abonnement de l'utilisateur
    const { error: updateErr } = await supabase
      .from("users")
      .update({
        pro_subscription_active: true,
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
      })
      .eq("id", user.id);

    if (updateErr) {
      console.error("❌ Échec de la mise à jour de l'utilisateur:", updateErr);
      return new Response("User update failed", { status: 500 });
    }

    console.log(`✅ Abonnement Pro activé pour: ${customerEmail}`);
  }

  // Confirmer la réception de l'événement à Stripe
  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
