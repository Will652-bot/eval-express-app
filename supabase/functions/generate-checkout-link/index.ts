import { createClient } from 'npm:@supabase/supabase-js@2';

interface CheckoutRequest {
  customer_email?: string;
}

interface CheckoutResponse {
  url: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "User authentication failed" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let requestData: CheckoutRequest = {};
    try {
      requestData = await req.json();
    } catch (_) {}

    const customer_email = requestData.customer_email || user.email;
    if (!customer_email) {
      return new Response(
        JSON.stringify({ error: "customer_email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = Deno.env.get("APP_BASE_URL") || "https://evalexpress-app.netlify.app";
    const successUrl = `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/payment-cancel`;

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    const priceId = "price_1RdwcSK8P5JwbyK0X3m5b6Fk";

    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "mode": "subscription",
        "line_items[0][price]": priceId,
        "line_items[0][quantity]": "1",
        "success_url": successUrl,
        "cancel_url": cancelUrl,
        "customer_email": customer_email,
        "allow_promotion_codes": "true",
        "client_reference_id": user.id,
        "metadata[user_id]": user.id,
        "metadata[user_email]": customer_email,
        "subscription_data[metadata][user_id]": user.id,
        "subscription_data[metadata][user_email]": customer_email,
        "expand[]": "subscription",
        "expand[]": "customer"
      }),
    });

    if (!stripeResponse.ok) {
      const errorText = await stripeResponse.text();
      return new Response(
        JSON.stringify({ 
          error: "Error creating checkout session",
          details: `Status ${stripeResponse.status}: ${errorText}`
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const session = await stripeResponse.json();
    const response: CheckoutResponse = { url: session.url };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
