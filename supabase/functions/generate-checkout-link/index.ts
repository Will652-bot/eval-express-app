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
  // Handle CORS preflight requests
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
    console.log('🚀 [generate-checkout-link] Starting Stripe checkout creation');

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ [generate-checkout-link] Missing or invalid Authorization header');
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get user information from token
    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || '';
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || '';
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ [generate-checkout-link] Supabase configuration missing');
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      console.error('❌ [generate-checkout-link] User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: "User authentication failed" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('👤 [generate-checkout-link] Authenticated user:', { id: user.id, email: user.email });

    // Use environment variables exclusively
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripePriceId = Deno.env.get("STRIPE_PRICE_ID_PRO");

    if (!stripeSecretKey) {
      console.error('❌ STRIPE_SECRET_KEY missing');
      return new Response(
        JSON.stringify({ error: "Missing Stripe secret key configuration" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!stripePriceId) {
      console.error('❌ STRIPE_PRICE_ID_PRO missing - Required variable in Supabase secrets');
      return new Response(
        JSON.stringify({ error: "Missing Stripe price configuration - STRIPE_PRICE_ID_PRO required" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('✅ Stripe variables loaded:', {
      hasSecretKey: !!stripeSecretKey,
      hasPriceId: !!stripePriceId,
      priceIdPrefix: stripePriceId.substring(0, 8) + '...'
    });

    // Parse request body
    let requestData: CheckoutRequest = {};
    try {
      requestData = await req.json();
      console.log('📥 [generate-checkout-link] Request body:', requestData);
    } catch (error) {
      console.error('❌ [generate-checkout-link] Invalid JSON in request body:', error);
      // Continue with empty requestData
    }

    // Use email from authenticated user if not provided in request
    const customer_email = requestData.customer_email || user.email;

    console.log('📧 [generate-checkout-link] Customer email:', customer_email);

    // Validate input data
    if (!customer_email) {
      console.error('❌ Missing customer_email and no user email available');
      return new Response(
        JSON.stringify({ error: "customer_email is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('💳 [generate-checkout-link] Creating Stripe checkout session...');

    // Redirect URLs to official EvalExpress site
    const successUrl = "https://eval-express-app.netlify.app/payment-success?session_id={CHECKOUT_SESSION_ID}";
    const cancelUrl = "https://eval-express-app.netlify.app/payment-cancel";

    // Use stripePriceId from STRIPE_PRICE_ID_PRO environment variable
    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'subscription',
        'line_items[0][price]': stripePriceId,
        'line_items[0][quantity]': '1',
        'success_url': successUrl,
        'cancel_url': cancelUrl,
        'customer_email': customer_email,
        'allow_promotion_codes': 'true',
        'client_reference_id': user.id,
        'metadata[user_id]': user.id,
        'metadata[user_email]': customer_email,
      }),
    });

    if (!stripeResponse.ok) {
      const errorText = await stripeResponse.text();
      console.error('❌ [generate-checkout-link] Stripe error:', {
        status: stripeResponse.status,
        body: errorText
      });
      
      return new Response(
        JSON.stringify({ 
          error: "Error creating checkout session",
          details: `Status ${stripeResponse.status}: ${errorText}`
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const session = await stripeResponse.json();
    console.log('✅ [generate-checkout-link] Session created:', {
      id: session.id,
      url: session.url
    });

    // JSON response format with URL
    const response: CheckoutResponse = {
      url: session.url,
    };

    console.log('🎉 [generate-checkout-link] Success!');

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error('💥 [generate-checkout-link] Error:', {
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