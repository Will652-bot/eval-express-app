import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@12.14.0';

interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      customer_email?: string;
      customer_details?: {
        email: string;
      };
      client_reference_id?: string;
      metadata?: {
        user_id?: string;
        user_email?: string;
      };
      subscription?: string;
      amount_total?: number;
      currency?: string;
      customer?: string;
    };
  };
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Stripe-Signature",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    console.error('❌ [stripe-webhook] Method not allowed:', req.method);
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    console.log('🚀 [stripe-webhook] Webhook received');

    // Use environment variables from Supabase secrets
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeSecretKey || !stripeWebhookSecret) {
      console.error('❌ [stripe-webhook] Stripe configuration not found');
      return new Response(
        JSON.stringify({ error: "Webhook configuration not found" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ [stripe-webhook] Supabase variables not configured');
      return new Response(
        JSON.stringify({ error: "Database configuration not found" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Read request body
    const rawBody = await req.text();
    const signature = req.headers.get("Stripe-Signature");

    console.log('📥 [stripe-webhook] Data received:', {
      hasSignature: !!signature,
      bodyLength: rawBody.length
    });

    // Verify webhook signature
    if (!signature) {
      console.error('❌ [stripe-webhook] Missing signature');
      return new Response(
        JSON.stringify({ error: "Missing webhook signature" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2022-11-15',
    });

    // Verify signature
    let event: StripeEvent;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        stripeWebhookSecret
      ) as unknown as StripeEvent;
    } catch (err) {
      console.error('❌ [stripe-webhook] Invalid signature:', err.message);
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('✅ [stripe-webhook] Signature verified successfully');
    console.log('📊 [stripe-webhook] Event received:', {
      type: event.type,
      objectId: event.data?.object?.id
    });

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      
      // Extract user information
      const userEmail = session.customer_email || session.customer_details?.email;
      const userId = session.client_reference_id || session.metadata?.user_id;
      
      if (!userEmail) {
        console.error('❌ [stripe-webhook] User email not found in session');
        return new Response(
          JSON.stringify({ error: "User email not found in webhook" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log('👤 [stripe-webhook] Processing payment for:', {
        email: userEmail,
        userId: userId || 'Not provided'
      });

      // Initialize Supabase client
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Find user by email if userId not provided
      let targetUserId = userId;
      if (!targetUserId) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', userEmail)
          .single();

        if (userError || !userData) {
          console.error('❌ [stripe-webhook] User not found:', userEmail);
          return new Response(
            JSON.stringify({ error: "User not found in database" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        targetUserId = userData.id;
      }

      // Calculate expiration date (30 days from now)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);

      // Update user subscription
      const { error: updateError } = await supabase
        .from('users')
        .update({
          current_plan: 'pro',
          pro_subscription_active: true,
          subscription_start_date: new Date().toISOString(),
          subscription_expires_at: expirationDate.toISOString(),
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetUserId);

      if (updateError) {
        console.error('❌ [stripe-webhook] Error updating user:', updateError);
        return new Response(
          JSON.stringify({ error: "Error updating user subscription" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log('✅ [stripe-webhook] Pro subscription activated for:', {
        userId: targetUserId,
        email: userEmail,
        expiresAt: expirationDate.toISOString()
      });

      // Create payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          user_id: targetUserId,
          email: userEmail,
          method: 'stripe',
          plan_name: 'pro',
          status: 'paid',
          stripe_checkout_session_id: session.id,
          stripe_invoice_id: null,
          amount: session.amount_total ? session.amount_total / 100 : 4.99,
          currency: session.currency || 'brl',
          subscription_id: session.subscription,
          plan_expiration_date: expirationDate.toISOString()
        });

      if (paymentError) {
        console.error('❌ [stripe-webhook] Error creating payment record:', paymentError);
        // Don't fail the webhook for this, user subscription is already updated
        console.log('⚠️ [stripe-webhook] Continuing despite payment record error');
      } else {
        console.log('✅ [stripe-webhook] Payment record created');
      }

      // Success response
      return new Response(
        JSON.stringify({
          success: true,
          message: "Payment processed successfully",
          user_id: targetUserId,
          subscription_plan: "pro",
          expires_at: expirationDate.toISOString()
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Handle other events
    console.log('ℹ️ [stripe-webhook] Event ignored:', event.type);
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Event ${event.type} ignored` 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error('💥 [stripe-webhook] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
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