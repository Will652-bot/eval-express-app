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
    console.log('🚀 [create-checkout-link] Starting Stripe checkout creation');

    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ [create-checkout-link] Missing or invalid Authorization header');
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
      console.error('❌ [create-checkout-link] Supabase configuration missing');
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
      console.error('❌ [create-checkout-link] User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: "User authentication failed" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('👤 [create-checkout-link] Authenticated user:', { id: user.id, email: user.email });

    // Get Stripe secret key from environment
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error('❌ [create-checkout-link] STRIPE_SECRET_KEY missing');
      return new Response(
        JSON.stringify({ error: "Missing Stripe configuration" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    let requestData: CheckoutRequest = {};
    try {
      requestData = await req.json();
      console.log('📥 [create-checkout-link] Request body:', requestData);
    } catch (error) {
      console.error('❌ [create-checkout-link] Invalid JSON in request body:', error);
      // Continue with empty requestData
    }

    // Use email from authenticated user if not provided in request
    const customer_email = requestData.customer_email || user.email;

    console.log('📧 [create-checkout-link] Customer email:', customer_email);

    // Validate input data
    if (!customer_email) {
      console.error('❌ [create-checkout-link] Missing customer_email and no user email available');
      return new Response(
        JSON.stringify({ error: "customer_email is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('💳 [create-checkout-link] Creating Stripe checkout session...');

    // Get site URL for redirect
    const baseUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://eval-express-app.netlify.app";
    const successUrl = `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/payment-cancel`;

    console.log('🔗 [create-checkout-link] Redirect URLs:', { successUrl, cancelUrl });

    // Use the specific price ID for the Pro plan
    const priceId = "price_1RdwcSK8P5JwbyK0X3m5b6Fk";

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
        'customer_email': customer_email,
        'allow_promotion_codes': 'true',
        'client_reference_id': user.id,
        'metadata[user_id]': user.id,
        'metadata[user_email]': customer_email,
      }),
    });

    if (!stripeResponse.ok) {
      const errorText = await stripeResponse.text();
      console.error('❌ [create-checkout-link] Stripe error:', {
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
    console.log('✅ [create-checkout-link] Session created:', {
      id: session.id,
      url: session.url
    });
    
    // JSON response format with URL
    const response: CheckoutResponse = {
      url: session.url,
    };

    console.log('🎉 [create-checkout-link] Success!');

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error('💥 [create-checkout-link] Error:', {
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