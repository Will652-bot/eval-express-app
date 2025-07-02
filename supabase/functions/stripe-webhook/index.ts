// supabase/functions/stripe-webhook/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Vérifie la signature d'un webhook Stripe en utilisant les API natives de Deno (Web Crypto).
 * C'est la méthode la plus robuste pour les environnements Deno.
 * @param req La requête entrante.
 * @param body Le corps brut de la requête sous forme de chaîne de caractères.
 * @returns Une promesse qui se résout en `true` si la signature est valide, sinon `false`.
 */
async function verifyStripeSignature(req: Request, body: string): Promise<boolean> {
  const stripeSignature = req.headers.get("Stripe-Signature");
  if (!stripeSignature) {
    console.error("Stripe-Signature header manquant.");
    return false;
  }

  const signingSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
  const encoder = new TextEncoder();
  
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(signingSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const parts = stripeSignature.split(",");
    const timestamp = parts.find(part => part.startsWith("t="))?.split("=")[1];
    const signature = parts.find(part => part.startsWith("v1="))?.split("=")[1];

    if (!timestamp || !signature) {
      console.error("Timestamp ou signature manquants dans le header.");
      return false;
    }
    
    // Vérifier que le timestamp n'est pas trop ancien (ex: 5 minutes) pour éviter les attaques par rejeu
    const eventAge = Math.abs(Date.now() / 1000 - parseInt(timestamp));
    if (eventAge > 300) {
        console.error("Timestamp du webhook trop ancien. Rejet.");
        return false;
    }

    const signedPayload = `${timestamp}.${body}`;
    const data = encoder.encode(signedPayload);
    
    // Convertir la signature hexadécimale en ArrayBuffer pour la vérification
    const signatureBuffer = new Uint8Array(signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

    return await crypto.subtle.verify("HMAC", key, signatureBuffer, data);
  } catch (error) {
    console.error("Erreur durant la vérification crypto:", error);
    return false;
  }
}

// --- Serveur principal de la fonction ---
serve(async (req) => {
  const body = await req.text();
  const signatureIsValid = await verifyStripeSignature(req, body);

  if (!signatureIsValid) {
    console.error("❌ La vérification de la signature a échoué. Rejet de la requête.");
    return new Response("Invalid signature", { status: 400 });
  }

  console.log("✅ Signature vérifiée avec succès.");
  const event = JSON.parse(body);

  if (event.type === "checkout.session.completed") {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const session = event.data.object;
    const customerEmail = session.customer_details?.email;

    if (!customerEmail) {
      console.error("❌ Email du client manquant.");
      return new Response("Email manquant", { status: 400 });
    }

    console.log(`Traitement du paiement pour: ${customerEmail}`);
    
    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("id")
      .eq("email", customerEmail)
      .single();

    if (userErr || !user) {
      console.error(`❌ Utilisateur non trouvé: ${customerEmail}`);
      return new Response("User not found", { status: 404 });
    }
    
    // Mise à jour de la table 'users' avec toutes les informations
    const { error: updateErr } = await supabase
      .from("users")
      .update({
        current_plan: "pro",
        pro_subscription_active: true,
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
      })
      .eq("id", user.id);

    if (updateErr) {
      console.error("❌ Échec de la mise à jour de l'utilisateur:", updateErr);
      return new Response("Update failed", { status: 500 });
    }

    // Insertion dans la table 'payments'
    const { error: insertErr } = await supabase.from("payments").insert({
      user_id: user.id,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      status: "succeeded",
      amount: session.amount_total / 100,
      currency: session.currency,
      paid_at: new Date(session.created * 1000).toISOString(),
    });

    if (insertErr) {
        console.error("❌ Échec de l'insertion du paiement:", insertErr);
        // Ne pas bloquer le succès global juste pour l'historique des paiements
    }

    console.log(`✅ Abonnement Pro et paiement enregistrés pour: ${customerEmail}`);
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
