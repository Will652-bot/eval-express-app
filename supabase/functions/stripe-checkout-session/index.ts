import { createClient } from 'npm:@supabase/supabase-js@2';

interface CheckoutSessionRequest {
  priceId: string;
  userId: string;
}

interface CheckoutSessionResponse {
  sessionId: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    console.log('🚀 [stripe-checkout-session] Starting function');

    // Authentication verification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authentication token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ✅ Use environment variables from Supabase secrets
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user via token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "User not authenticated" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const { priceId, userId }: CheckoutSessionRequest = await req.json();

    console.log('📥 [stripe-checkout-session] Data received:', { priceId, userId, userEmail: user.email });

    // Validate data
    if (!priceId || !userId) {
      return new Response(
        JSON.stringify({ error: "priceId and userId are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify user matches
    if (user.id !== userId) {
      return new Response(
        JSON.stringify({ error: "User not authorized" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ✅ Use environment variable for Stripe secret key
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("Missing Stripe secret key");
    }

    console.log('💳 [stripe-checkout-session] Creating Stripe session...');

    // Redirect URLs
    const baseUrl = "https://eval-express-app.netlify.app";
    const successUrl = `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/payment-cancel`;

    // Create Stripe Checkout session
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'subscription',
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        'success_url': successUrl,
        'cancel_url': cancelUrl,
        'customer_email': user.email || '',
        'client_reference_id': userId,
        'metadata[user_id]': userId,
        'metadata[user_email]': user.email || '',
        'allow_promotion_codes': 'true',
      }),
    });

    if (!stripeResponse.ok) {
      const errorText = await stripeResponse.text();
      console.error('❌ [stripe-checkout-session] Stripe error:', {
        status: stripeResponse.status,
        body: errorText
      });
      
      return new Response(
        JSON.stringify({ 
          error: "Error creating payment session",
          details: `Status ${stripeResponse.status}`
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const session = await stripeResponse.json();
    console.log('✅ [stripe-checkout-session] Session created:', {
      id: session.id,
      url: session.url
    });

    // Return session ID
    const response: CheckoutSessionResponse = {
      sessionId: session.id,
    };

    console.log('🎉 [stripe-checkout-session] Success!');

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error('💥 [stripe-checkout-session] Error:', {
      message: error.message,
      stack: error.stack,
    });
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error.message || "Unknown error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});