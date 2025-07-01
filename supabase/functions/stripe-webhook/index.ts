import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Initialisation Stripe
const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2022-11-15",
});

// Serveur webhook
serve(async (req: Request) => {
  console.log("[✅ Webhook Stripe] Reçu un appel", req.method);

  const rawBody = await req.text();
  const signature = req.headers.get("stripe-signature");
  const signingSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature!, signingSecret);
    console.log("✅ Signature Stripe vérifiée");
  } catch (err) {
    console.error("❌ Signature Stripe invalide :", err.message);
    return new Response("Invalid signature", { status: 400 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  // 🎯 Cible : Event Stripe de fin de paiement
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;

    const user_id = session.client_reference_id;
    const customer_email = session.customer_email;
    const now = new Date();
    const subscription_expires_at = new Date(now.setMonth(now.getMonth() + 1)).toISOString();

    console.log("🔎 ID utilisateur cible :", user_id);

    // 🔄 Mise à jour de la table users
    const { error: updateError } = await supabase
      .from("users")
      .update({
        current_plan: "pro",
        pro_subscription_active: true,
        subscription_start_date: new Date().toISOString(),
        subscription_expires_at: subscription_expires_at,
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription
      })
      .eq("id", user_id);

    if (updateError) {
      console.error("❌ Échec de la mise à jour de l'utilisateur :", updateError.message);
    } else {
      console.log("✅ Utilisateur mis à jour avec succès !");
    }

    // ➕ Insertion dans la table payments
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
          stripe_payment_intent_id: session.payment_intent || "",
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          amount: session.amount_total ? session.amount_total / 100 : 4.99,
          currency: session.currency || "brl",
          plan_expiration_date: subscription_expires_at,
        }
      ]);

    if (insertError) {
      console.error("❌ Échec de l'insertion du paiement :", insertError.message);
    } else {
      console.log("✅ Paiement enregistré dans Supabase");
    }
  } else {
    console.log("ℹ️ Événement Stripe ignoré :", event.type);
  }

  return new Response("Webhook processed", { status: 200 });
});
