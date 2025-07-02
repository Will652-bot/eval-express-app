// supabase/functions/stripe-webhook/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

async function verifyStripeSignature(req: Request, body: string): Promise<boolean> {
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
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  if (event.type === 'checkout.session.completed' || event.type === 'invoice.paid') {
    const session = event.data.object;
    const customerEmail = session.customer_details?.email ?? session.customer_email;

    if (!customerEmail) {
      return new Response("Email manquant", { status: 400 });
    }
    
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", customerEmail)
      .single();

    if (!user) {
      return new Response("User not found", { status: 404 });
    }
    
    await supabase
      .from("users")
      .update({
        current_plan: "pro",
        pro_subscription_active: true,
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
      })
      .eq("id", user.id);

    // Objet d'insertion final et complet
    const { error: insertErr } = await supabase.from("payments").insert({
      user_id: user.id,
      email: customerEmail,
      plan_name: 'pro',
      status: 'succeeded',
      method: 'stripe', // <-- LA CORRECTION FINALE
      amount: session.amount_total / 100,
      currency: session.currency,
      subscription_id: session.subscription,
      stripe_invoice_id: session.invoice,
      stripe_checkout_session_id: event.type === 'checkout.session.completed' ? session.id : null,
      created_at: new Date(session.created * 1000).toISOString(),
    });

    if (insertErr) {
        console.error("❌ Échec de l'insertion du paiement:", insertErr);
    } else {
        console.log(`✅ Paiement enregistré pour: ${customerEmail}`);
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
});
