import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.1.0'

const stripe = Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2022-11-15',
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  try {
    const event = await req.json()

    console.log('✅ [Webhook] Event received:', event.type)

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const email = session.customer_email
      const customerId = session.customer
      const subscriptionId = session.subscription

      console.log(`📩 Email: ${email}`)
      console.log(`🔁 Sub ID: ${subscriptionId}`)

      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (userError || !user) {
        console.error('❌ Utilisateur non trouvé:', userError)
        return new Response('User not found', { status: 404 })
      }

      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 30)

      const { error: updateError } = await supabase
        .from('users')
        .update({
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_expires_at: expiresAt.toISOString(),
          pro_subscription_active: true
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('❌ Échec update user:', updateError)
        return new Response('Update failed', { status: 500 })
      }

      const { error: insertError } = await supabase.from('payments').insert({
        user_id: user.id,
        email,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        amount: session.amount_total / 100,
        currency: session.currency,
        status: 'paid',
        paid_at: new Date().toISOString()
      })

      if (insertError) {
        console.error('❌ Erreur insert payment:', insertError)
        return new Response('Insert failed', { status: 500 })
      }

      console.log('✅ Paiement enregistré pour', email)
      return new Response('Webhook traité avec succès', { status: 200 })
    }

    return new Response('Événement ignoré', { status: 200 })
  } catch (err) {
    console.error('❌ Erreur webhook Stripe:', err.message)
    return new Response(`Erreur webhook: ${err.message}`, { status: 400 })
  }
})
