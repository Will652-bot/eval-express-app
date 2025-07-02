// supabase/functions/stripe-webhook/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function verifyStripeSignature(req: Request, body: string): Promise<boolean> {
  // ... (la fonction de vérification reste la même que précédemment)
  const stripeSignature = req.headers.get("Stripe-Signature");
  if (!stripeSignature) { return false; }
  const signingSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
  const encoder = new TextEncoder();
  try {
    const key = await crypto.subtle.importKey("raw", encoder.encode(signingSecret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    const parts = stripeSignature.split(",");
    const timestamp = parts.find(part => part.startsWith("t="))?.split("=")[1];
    const signature = parts.find(part => part.startsWith("v1="))?.split("=")[1];
    if (!timestamp || !signature) { return false; }
    const eventAge = Math.abs(Date.now() / 1000 - parseInt(timestamp));
    if (eventAge > 300) { return false; }
    const signedPayload = `${timestamp}.${body}`;
    const data = encoder.encode(signedPayload);
    const signatureBuffer = new Uint8Array(signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    return await crypto.subtle.verify("HMAC", key, signatureBuffer, data);
  } catch (error) {
    console.error("Erreur durant la vérification crypto:", error);
    return false;
  }
}

serve(async (req) => {
  const body = await req.text();
  if (!await verifyStripeSignature(req, body)) {
    return new Response("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(body);
  console.log("ℹ️ Événement Stripe reçu:", event.type);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Utiliser un switch pour gérer plusieurs types d'événements
  switch (event.type) {
    case 'checkout.session.completed':
    case 'invoice.paid': {
      const session = event.data.object;
      const customerEmail = session.customer_details?.email ?? session.customer_email;

      if (!customerEmail) {
        console.error("❌ Email du client introuvable pour l'événement:", event.type);
        break;
      }
      
      console.log(`Traitement de l'événement '${event.type}' pour ${customerEmail}`);
      
      const { data: user, error: userErr } = await supabase
        .from("users")
        .select("id")
        .eq("email", customerEmail)
        .single();

      if (userErr || !user) {
        console.error(`❌ Utilisateur non trouvé: ${customerEmail}`);
        break;
      }
      
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
        break;
      }

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
      }

      console.log(`✅ Traitement terminé pour ${customerEmail}`);
      break;
    }
    default:
      console.log(`-- Événement ignoré: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
