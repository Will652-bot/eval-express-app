import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.5.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2022-11-15",
});

serve(async (req: Request) => {
  const signature = req.headers.get("stripe-signature");
  const signingSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

  let event;
  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, signature!, signingSecret);
  } catch (err) {
    console.error("⚠️  Error verifying Stripe webhook signature:", err.message);
    return new Response("Webhook signature verification failed", { status: 400 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const user_id = session.client_reference_id;
    const customer_email = session.customer_email;
    const now = new Date();
    const subscription_expires_at = new Date(now.setMonth(now.getMonth() + 1)).toISOString();

    console.log("🔁 Stripe session completed for user:", user_id);

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
      console.error("❌ Failed to update user:", updateError);
    } else {
      console.log("✅ User updated with subscription_expires_at");
    }

    const { error: insertError } = await supabase.from("payments").insert([
      {
        user_id,
        email: customer_email,
        method: "stripe",
        plan_name: "pro",
        status: "paid",
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent,
        stripe_customer_id: session.customer,
        stripe_subscription_id: session.subscription,
        amount: session.amount_total ? session.amount_total / 100 : 4.99,
        currency: session.currency || "brl",
        plan_expiration_date: subscription_expires_at
      },
    ]);

    if (insertError) {
      console.error("❌ Failed to insert into payments:", insertError);
    } else {
      console.log("✅ Payment record inserted successfully");
    }
  }

  return new Response("Webhook processed", { status: 200 });
});