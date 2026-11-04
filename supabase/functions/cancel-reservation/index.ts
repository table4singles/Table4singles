// Cancela una reserva. Si es una cena especial pagada y se cancela dentro de plazo (hasta el día anterior),
// devuelve el importe completo en Stripe. Las reservas normales de 2 € no se reembolsan.
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'No autorizado' }, 401)
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) return json({ error: 'No autorizado' }, 401)

    const { participantId } = await req.json()
    if (!participantId) return json({ error: 'participantId requerido' }, 400)

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: part } = await admin.from('table_participants').select('id, table_id, user_id').eq('id', participantId).maybeSingle()
    if (!part || part.user_id !== user.id) return json({ ok: false, error: 'Reservation not found' })
    const { data: table } = await admin.from('dining_tables').select('is_special').eq('id', part.table_id).single()
    const { data: payment } = await admin.from('reservation_payments')
      .select('id, stripe_payment_intent_id, amount')
      .eq('table_id', part.table_id).eq('user_id', user.id).eq('status', 'paid')
      .order('created_at', { ascending: false }).limit(1).maybeSingle()

    // Cancela (valida el plazo: solo hasta el día anterior) con la identidad del usuario
    const { error: cancelErr } = await userClient.rpc('cancel_reservation', { p_participant_id: participantId })
    if (cancelErr) return json({ ok: false, error: cancelErr.message.includes('CANCEL_TOO_LATE') ? 'CANCEL_TOO_LATE' : cancelErr.message })

    let refunded = false
    if (table?.is_special && payment?.stripe_payment_intent_id) {
      try {
        await stripe.refunds.create({ payment_intent: payment.stripe_payment_intent_id })
        await admin.from('reservation_payments').update({ status: 'refunded', payout_status: 'none' }).eq('id', payment.id)
        refunded = true
      } catch (e) {
        console.error('refund failed', e)
        // Queda constancia para devolverlo a mano
        await admin.from('refund_claims').insert({
          table_id: part.table_id, user_id: user.id,
          reason: 'Cancelación de cena especial: el reembolso automático falló', status: 'pending',
        })
      }
    }
    return json({ ok: true, refunded })
  } catch (e) {
    console.error(e)
    return json({ error: String((e as Error).message ?? e) }, 500)
  }
})
