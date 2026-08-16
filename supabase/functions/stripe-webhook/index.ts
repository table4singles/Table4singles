import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

/** Inserta participante + decrementa plaza. Idempotente ante reintentos. */
async function confirmReservation(
  supabase: SupabaseClient,
  userId: string,
  tableId: string,
): Promise<{ created: boolean; participantId: string | null }> {
  const { data: existing } = await supabase
    .from('table_participants')
    .select('id')
    .eq('table_id', tableId)
    .eq('user_id', userId)
    .maybeSingle()

  if (existing) return { created: false, participantId: existing.id }

  const { data: table, error: tableErr } = await supabase
    .from('dining_tables')
    .select('available_seats, host_id, restaurant_name, time, max_seats, date')
    .eq('id', tableId)
    .single()

  if (tableErr || !table) throw new Error(`Mesa no encontrada: ${tableErr?.message}`)
  if (table.available_seats <= 0) throw new Error('No quedan plazas en esta mesa')

  // Optimistic lock: solo decrementa si available_seats no ha cambiado
  const { data: decremented, error: decErr } = await supabase
    .from('dining_tables')
    .update({ available_seats: table.available_seats - 1 })
    .eq('id', tableId)
    .eq('available_seats', table.available_seats)
    .select('available_seats')
    .maybeSingle()

  if (decErr) throw new Error(`Error al reservar plaza: ${decErr.message}`)
  if (!decremented) throw new Error('La plaza ya no estaba disponible')

  const { data: participant, error: partErr } = await supabase
    .from('table_participants')
    .insert({
      table_id: tableId,
      user_id: userId,
      status: 'approved',
      join_type: 'deposit',
      deposit_paid: true,
    })
    .select('id')
    .single()

  if (partErr) {
    // Unique violation: otro proceso ya insertó → revertir asiento
    if (partErr.code === '23505') {
      await supabase
        .from('dining_tables')
        .update({ available_seats: table.available_seats })
        .eq('id', tableId)
        .eq('available_seats', decremented.available_seats)
      const { data: again } = await supabase
        .from('table_participants')
        .select('id')
        .eq('table_id', tableId)
        .eq('user_id', userId)
        .maybeSingle()
      return { created: false, participantId: again?.id ?? null }
    }
    throw new Error(`Error al crear participante: ${partErr.message}`)
  }

  const dinerRes = await supabase
    .from('profiles')
    .select('display_name, full_name')
    .eq('id', userId)
    .single()

  const dinerName = dinerRes.data?.display_name || dinerRes.data?.full_name || 'Un comensal'
  const occupied = table.max_seats - decremented.available_seats
  const timeStr = table.time ? table.time.slice(0, 5) : ''

  await supabase.from('notifications').insert({
    user_id: table.host_id,
    type: 'new_reservation',
    title: `¡Nueva reserva! ${occupied}/${table.max_seats}`,
    body: `${dinerName} se ha apuntado a tu mesa${timeStr ? ` de las ${timeStr}` : ''} (${table.date})`,
    metadata: { table_id: tableId, user_id: userId, table_name: table.restaurant_name },
    read: false,
  })

  return { created: true, participantId: participant.id }
}

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Firma de webhook ausente', { status: 400 })
  }

  const body = await req.text()
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET no configurado')
    return new Response('Webhook secret missing', { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const { type, user_id, table_id } = (session.metadata ?? {}) as Record<string, string>
      console.log('checkout.session.completed', { type, user_id, table_id, sessionId: session.id })

      if (type === 'restaurant_subscription') {
        if (!user_id) throw new Error('subscription sin user_id en metadata')
        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            subscription_id: session.subscription as string,
            stripe_customer_id: session.customer as string,
          })
          .eq('id', user_id)
        if (error) throw new Error(`subscription update: ${error.message}`)
      }

      if (type === 'reservation') {
        if (!user_id || !table_id) throw new Error('reservation sin user_id/table_id en metadata')

        const result = await confirmReservation(supabase, user_id, table_id)
        console.log('reservation confirmada', result)

        const { error: payErr } = await supabase
          .from('reservation_payments')
          .update({
            status: 'paid',
            stripe_payment_intent_id: typeof session.payment_intent === 'string'
              ? session.payment_intent
              : session.payment_intent?.id ?? null,
          })
          .eq('stripe_session_id', session.id)
        if (payErr) throw new Error(`payment update: ${payErr.message}`)
      }
    }

    if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object as Stripe.Subscription
      const userId = await getUserIdFromCustomer(stripe, sub.customer as string)
      if (userId) {
        const { error } = await supabase
          .from('profiles')
          .update({ subscription_status: sub.status })
          .eq('id', userId)
        if (error) throw new Error(`sub updated: ${error.message}`)
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription
      const userId = await getUserIdFromCustomer(stripe, sub.customer as string)
      if (userId) {
        const { error } = await supabase
          .from('profiles')
          .update({ subscription_status: 'canceled', subscription_id: null })
          .eq('id', userId)
        if (error) throw new Error(`sub deleted: ${error.message}`)
      }
    }
  } catch (err: any) {
    console.error('Webhook handler error:', err.message)
    // 500 → Stripe reintenta el evento (antes devolvía 200 y se perdía la reserva)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

async function getUserIdFromCustomer(stripeClient: Stripe, customerId: string): Promise<string | null> {
  try {
    const customer = await stripeClient.customers.retrieve(customerId)
    if (customer.deleted) return null
    return (customer as Stripe.Customer).metadata?.supabase_user_id ?? null
  } catch {
    return null
  }
}
