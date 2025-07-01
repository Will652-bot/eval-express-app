// supabase/functions/stripe-webhook/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://esm.sh/@noble/hashes/hmac";
import { sha256 } from "https://esm.sh/@noble/hashes/sha256";
import { encode as utf8Encode } from "https://deno.land/std@0.168.0/encoding/utf8.ts";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

serve(async (req) => {
  const stripeSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const sig = req.headers.get("stripe-signature")!;
  const rawBody = await req.text();

  const encoder = new TextEncoder();
  const secretBytes = encoder.encode(stripeSecret);
  const bodyBytes = encoder.encode(rawBody);

  const hmac = createHmac(sha256, secretBytes);
  const computedSig = hmac.update(bodyBytes).digest("hex");

  if (!sig.includes(computedSig)) {
    console.error("❌ Signature mismatch - webhook rejected");
    return new Response("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(rawBody);
  console.log("📦 Stripe Event:", event.type);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const customerEmail = session.customer_email;

    if (!customerEmail) {
      console.error("❌ No customer_email found in session");
      return new Response("Missing email", { status: 400 });
    }

    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("id")
      .eq("email", customerEmail)
      .single();

    if (userErr || !user) {
      console.error("❌ User not found:", customerEmail, userErr);
      return new Response("User not found", { status: 404 });
    }

    const newExpiration = new Date();
    newExpiration.setDate(newExpiration.getDate() + 30);

    const { error: updateErr } = await supabase
      .from("users")
      .update({
        current_plan: "pro",
        pro_subscription_active: true,
        subscription_start_date: new Date().toISOString(),
        subscription_expires_at: newExpiration.toISOString(),
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
      })
      .eq("id", user.id);

    if (updateErr) {
      console.error("❌ Failed to update user:", updateErr);
      return new Response("Update failed", { status: 500 });
    }

    const { error: insertErr } = await supabase.from("payments").insert({
      user_id: user.id,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      status: "active",
      amount: session.amount_total / 100,
      currency: session.currency,
      paid_at: new Date().toISOString(),
    });

    if (insertErr) {
      console.error("❌ Failed to insert payment:", insertErr);
      return new Response("Insert failed", { status: 500 });
    }

    console.log("✅ Subscription activated for:", customerEmail);
    return new Response("OK", { status: 200 });
  }

  console.log("ℹ️ Event type not handled:", event.type);
  return new Response("Ignored", { status: 200 });
});
