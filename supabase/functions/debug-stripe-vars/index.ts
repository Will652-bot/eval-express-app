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

  try {
    console.log('🔍 [debug-stripe-vars] Checking Stripe environment variables...');

    // 🔍 Lire et afficher le corps de la requête POST (utile pour debug du StripeButton)
    let receivedBody = {};
    try {
      receivedBody = await req.json();
      console.log("📥 [debug-stripe-vars] Corps de requête reçu:", receivedBody);
    } catch (err) {
      console.warn("⚠️ [debug-stripe-vars] Aucun JSON détecté ou erreur de parsing");
    }

    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization');
    let userInfo = { authenticated: false, id: null, email: null };
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || '';
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || '';
      
      if (supabaseUrl && supabaseAnonKey) {
        try {
          const { createClient } = await import('npm:@supabase/supabase-js@2');
          const supabase = createClient(supabaseUrl, supabaseAnonKey);
          const { data: { user }, error: userError } = await supabase.auth.getUser(token);
          
          if (!userError && user) {
            userInfo = {
              authenticated: true,
              id: user.id,
              email: user.email
            };
          }
        } catch (error) {
          console.error("⚠️ [debug-stripe-vars] Erreur lors de la vérification de l'utilisateur:", error);
        }
      }
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "MISSING";
    const stripePriceId = Deno.env.get("STRIPE_PRICE_ID_PRO") ?? "MISSING";
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "MISSING";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "MISSING";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "MISSING";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "MISSING";

    const isValidStripeKey = stripeSecretKey.startsWith('sk_');
    const isValidPriceId = stripePriceId.startsWith('price_');
    const isValidWebhookSecret = stripeWebhookSecret.startsWith('whsec_');

    let stripeApiTest = null;
    if (stripeSecretKey !== "MISSING" && isValidStripeKey) {
      try {
        const testResponse = await fetch('https://api.stripe.com/v1/account', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${stripeSecretKey}` },
        });
        stripeApiTest = {
          status: testResponse.status,
          success: testResponse.ok,
          message: testResponse.ok ? "✅ Stripe API accessible" : "❌ Stripe API error"
        };
      } catch (error) {
        stripeApiTest = {
          status: 0,
          success: false,
          message: "❌ Network error connecting to Stripe"
        };
      }
    }

    let priceIdTest = null;
    if (stripePriceId !== "MISSING" && isValidPriceId && isValidStripeKey) {
      try {
        const priceResponse = await fetch(`https://api.stripe.com/v1/prices/${stripePriceId}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${stripeSecretKey}` },
        });
        priceIdTest = {
          status: priceResponse.status,
          success: priceResponse.ok,
          message: priceResponse.ok ? "✅ Price ID valid" : "❌ Price ID not found"
        };
      } catch (error) {
        priceIdTest = {
          status: 0,
          success: false,
          message: "❌ Error validating price ID"
        };
      }
    }

    const response = {
      timestamp: new Date().toISOString(),
      environment: "Supabase Edge Function",
      receivedPayload: receivedBody,
      userInfo,
      variables: {
        stripeSecretKey: {
          status: stripeSecretKey !== "MISSING" ? "SET" : "MISSING",
          preview: stripeSecretKey !== "MISSING" ? stripeSecretKey.slice(0, 8) + '...' : "MISSING",
          valid: isValidStripeKey,
          format: stripeSecretKey !== "MISSING" ? (isValidStripeKey ? "✅ Valid sk_ format" : "❌ Invalid format") : "❌ Not set"
        },
        stripePriceId: {
          status: stripePriceId !== "MISSING" ? "SET" : "MISSING",
          value: stripePriceId,
          valid: isValidPriceId,
          format: stripePriceId !== "MISSING" ? (isValidPriceId ? "✅ Valid price_ format" : "❌ Invalid format") : "❌ Not set"
        },
        stripeWebhookSecret: {
          status: stripeWebhookSecret !== "MISSING" ? "SET" : "MISSING",
          preview: stripeWebhookSecret !== "MISSING" ? stripeWebhookSecret.slice(0, 8) + '...' : "MISSING",
          valid: isValidWebhookSecret,
          format: stripeWebhookSecret !== "MISSING" ? (isValidWebhookSecret ? "✅ Valid whsec_ format" : "❌ Invalid format") : "❌ Not set"
        },
        supabaseUrl: {
          status: supabaseUrl !== "MISSING" ? "SET" : "MISSING",
          preview: supabaseUrl !== "MISSING" ? supabaseUrl.slice(0, 30) + '...' : "MISSING"
        },
        supabaseServiceKey: {
          status: supabaseServiceKey !== "MISSING" ? "SET" : "MISSING",
          preview: supabaseServiceKey !== "MISSING" ? supabaseServiceKey.slice(0, 8) + '...' : "MISSING"
        },
        supabaseAnonKey: {
          status: supabaseAnonKey !== "MISSING" ? "SET" : "MISSING",
          preview: supabaseAnonKey !== "MISSING" ? supabaseAnonKey.slice(0, 8) + '...' : "MISSING"
        }
      },
      tests: {
        stripeApiConnectivity: stripeApiTest,
        priceIdValidation: priceIdTest
      },
      summary: {
        allVariablesSet: stripeSecretKey !== "MISSING" && stripePriceId !== "MISSING" && stripeWebhookSecret !== "MISSING",
        allFormatsValid: isValidStripeKey && isValidPriceId && isValidWebhookSecret,
        readyForProduction: stripeSecretKey !== "MISSING" && stripePriceId !== "MISSING" && stripeWebhookSecret !== "MISSING" && isValidStripeKey && isValidPriceId && isValidWebhookSecret
      },
      recommendations: []
    };

    if (stripeSecretKey === "MISSING") response.recommendations.push("❌ Set STRIPE_SECRET_KEY in Supabase secrets");
    else if (!isValidStripeKey) response.recommendations.push("❌ STRIPE_SECRET_KEY should start with 'sk_'");

    if (stripePriceId === "MISSING") response.recommendations.push("❌ Set STRIPE_PRICE_ID_PRO in Supabase secrets");
    else if (!isValidPriceId) response.recommendations.push("❌ STRIPE_PRICE_ID_PRO should start with 'price_'");

    if (stripeWebhookSecret === "MISSING") response.recommendations.push("❌ Set STRIPE_WEBHOOK_SECRET in Supabase secrets");
    else if (!isValidWebhookSecret) response.recommendations.push("❌ STRIPE_WEBHOOK_SECRET should start with 'whsec_'");

    if (response.summary.readyForProduction) {
      response.recommendations.push("✅ All Stripe variables are properly configured!");
    }

    console.log('✅ [debug-stripe-vars] Debug complete');
    return new Response(JSON.stringify(response, null, 2), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error('💥 [debug-stripe-vars] Error:', error);
    return new Response(JSON.stringify({
      error: "Internal server error",
      details: error.message || "Unknown error",
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});