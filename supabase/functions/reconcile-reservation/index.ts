import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Red de seguridad: tras volver de Stripe, el cliente llama a esta función.
 * Si el webhook falló pero el pago está completed en Stripe, crea la plaza aquí.
 */
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function confirmReservation(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  tableId: string,
) {
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
  if (table.available_seats <= 0) throw new Error('No quedan plazas')

  const { data: decremented, error: decErr } = await supabase
    .from('dining_tables')
    .update({ available_seats: table.available_seats - 1 })
    .eq('id', tableId)
    .eq('available_seats', table.available_seats)
    .select('available_seats')
    .maybeSingle()

  if (decErr) throw new Error(decErr.message)
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
    if (partErr.code === '23505') {
      await supabase
        .from('dining_tables')
        .update({ available_seats: table.available_seats })
        .eq('id', tableId)
        .eq('available_seats', decremented.available_seats)
      return { created: false, participantId: null }
    }
    throw new Error(partErr.message)
  }

  const dinerRes = await supabase.from('profiles').select('display_name, full_name').eq('id', userId).single()
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { tableId } = await req.json()
    if (!tableId) {
      return new Response(JSON.stringify({ error: 'tableId requerido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // ¿Ya tiene plaza?
    const { data: already } = await admin
      .from('table_participants')
      .select('id')
      .eq('table_id', tableId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (already) {
      return new Response(JSON.stringify({ ok: true, status: 'already_reserved' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Buscar pagos recientes de este usuario para esta mesa
    const { data: payments } = await admin
      .from('reservation_payments')
      .select('id, stripe_session_id, status')
      .eq('user_id', user.id)
      .eq('table_id', tableId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (!payments?.length) {
      return new Response(JSON.stringify({ ok: false, status: 'no_payment' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let paidSession: Stripe.Checkout.Session | null = null
    let paymentRow = payments.find(p => p.status === 'paid') ?? null

    for (const pay of payments) {
      if (!pay.stripe_session_id) continue
      const session = await stripe.checkout.sessions.retrieve(pay.stripe_session_id)
      if (session.payment_status === 'paid') {
        paidSession = session
        paymentRow = pay
        break
      }
    }

    if (!paidSession || !paymentRow) {
      return new Response(JSON.stringify({ ok: false, status: 'not_paid_yet' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const result = await confirmReservation(admin, user.id, tableId)

    await admin
      .from('reservation_payments')
      .update({
        status: 'paid',
        stripe_payment_intent_id: typeof paidSession.payment_intent === 'string'
          ? paidSession.payment_intent
          : paidSession.payment_intent?.id ?? null,
      })
      .eq('id', paymentRow.id)

    return new Response(JSON.stringify({
      ok: true,
      status: result.created ? 'reconciled' : 'already_reserved',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('reconcile-reservation error:', err)
    return new Response(JSON.stringify({ error: err.message ?? 'Error interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
