import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Firma de webhook ausente', { status: 400 })
  }

  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!,
    )
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    // ── Checkout completado ──────────────────────────────────────────────────
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const { type, user_id, table_id } = (session.metadata ?? {}) as Record<string, string>

      if (type === 'restaurant_subscription') {
        await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            subscription_id: session.subscription as string,
            stripe_customer_id: session.customer as string,
          })
          .eq('id', user_id)
      }

      if (type === 'reservation' && user_id && table_id) {
        // Comprobar si ya tiene reserva para evitar duplicados
        const { data: existing } = await supabase
          .from('table_participants')
          .select('id')
          .eq('table_id', table_id)
          .eq('user_id', user_id)
          .maybeSingle()

        if (!existing) {
          const { data: table } = await supabase
            .from('dining_tables')
            .select('available_seats')
            .eq('id', table_id)
            .single()

          if (table && table.available_seats > 0) {
            await supabase.from('table_participants').insert({
              table_id,
              user_id,
              status: 'approved',
              join_type: 'deposit',
              deposit_paid: true,
            })

            await supabase
              .from('dining_tables')
              .update({ available_seats: table.available_seats - 1 })
              .eq('id', table_id)
          }
        }

        // Marcar pago como pagado
        await supabase
          .from('reservation_payments')
          .update({
            status: 'paid',
            stripe_payment_intent_id: session.payment_intent as string,
          })
          .eq('stripe_session_id', session.id)
      }
    }

    // ── Suscripción actualizada ──────────────────────────────────────────────
    if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object as Stripe.Subscription
      const userId = await getUserIdFromCustomer(stripe, sub.customer as string)
      if (userId) {
        await supabase
          .from('profiles')
          .update({ subscription_status: sub.status })
          .eq('id', userId)
      }
    }

    // ── Suscripción cancelada/eliminada ──────────────────────────────────────
    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription
      const userId = await getUserIdFromCustomer(stripe, sub.customer as string)
      if (userId) {
        await supabase
          .from('profiles')
          .update({ subscription_status: 'canceled', subscription_id: null })
          .eq('id', userId)
      }
    }
  } catch (err: any) {
    console.error('Webhook handler error:', err.message)
    // Devolvemos 200 para que Stripe no reintente; loggeamos el error internamente
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

async function getUserIdFromCustomer(stripe: Stripe, customerId: string): Promise<string | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId)
    if (customer.deleted) return null
    return (customer as Stripe.Customer).metadata?.supabase_user_id ?? null
  } catch {
    return null
  }
}
