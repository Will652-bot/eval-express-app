import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Initialisation Stripe
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

// Serveur Webhook
serve(async (req: Request) => {
  // ✅ Log immédiat
  console.log("[✅ Webhook Stripe] Reçu un appel", req.method);

  const rawBody = await req.text(); // ⚠️ Obligatoire pour vérifier la signature
  const signature = req.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature!, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("❌ Erreur de signature Stripe :", err.message);
    return new Response("Webhook signature invalid", { status: 400 });
  }

  // Initialisation Supabase avec service_role
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
  );

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;

    const user_id = session.client_reference_id;
    const customer_email = session.customer_email;
    const now = new Date();
    const subscription_expires_at = new Date(now.setDate(now.getDate() + 30)).toISOString();

    console.log("🧾 Données session reçues:", {
      user_id,
      email: customer_email,
      expires_at: subscription_expires_at,
    });

    if (!user_id) {
      console.error("❌ Aucune valeur user_id (client_reference_id) reçue.");
      return new Response("Client reference ID manquant", { status: 400 });
    }

    // 🔄 Mise à jour table users
    const { error: updateError } = await supabase
      .from("users")
      .update({
        current_plan: "pro",
        pro_subscription_active: true,
        subscription_start_date: new Date().toISOString(),
        subscription_expires_at: subscription_expires_at,
        stripe_customer_id: session.customer ?? "",
        stripe_subscription_id: session.subscription ?? "",
      })
      .eq("id", user_id);

    if (updateError) {
      console.error("❌ Erreur update user:", updateError);
    } else {
      console.log("✅ Utilisateur mis à jour dans la table users");
    }

    // ➕ Insertion dans table payments
    const { error: insertError } = await supabase
      .from("payments")
      .insert([
        {
          user_id,
          email: customer_email,
          method: "stripe",
          plan_name: "pro",
          status: session.payment_status || "paid",
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent ?? "",
          stripe_customer_id: session.customer ?? "",
          stripe_subscription_id: session.subscription ?? "",
          amount: session.amount_total ? session.amount_total / 100 : 4.99,
          currency: session.currency || "brl",
          plan_expiration_date: subscription_expires_at,
        },
      ]);

    if (insertError) {
      console.error("❌ Erreur insert payment:", insertError);
    } else {
      console.log("✅ Paiement inséré dans Supabase");
    }
  }

  return new Response("✅ Webhook traité avec succès", { status: 200 });
});
