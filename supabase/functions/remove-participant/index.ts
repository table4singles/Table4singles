// El restaurante quita a un comensal de su mesa: no es culpa del comensal, así que se le devuelve todo lo pagado.
// Si el reembolso automático falla, queda una solicitud de reembolso pendiente (pestaña Reembolsos del admin).
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
    if (!part) return json({ ok: false, error: 'Participant not found' })
    const { data: table } = await admin.from('dining_tables').select('host_id').eq('id', part.table_id).single()
    if (table?.host_id !== user.id) return json({ error: 'No autorizado' }, 403)

    const { data: payment } = await admin.from('reservation_payments')
      .select('id, stripe_payment_intent_id')
      .eq('table_id', part.table_id).eq('user_id', part.user_id).eq('status', 'paid')
      .order('created_at', { ascending: false }).limit(1).maybeSingle()

    // Quita al comensal con la identidad del restaurante (comprueba que es el anfitrión)
    const { error: rmErr } = await userClient.rpc('remove_participant', { p_participant_id: participantId })
    if (rmErr) return json({ ok: false, error: rmErr.message })

    let refunded = false
    if (payment?.stripe_payment_intent_id) {
      try {
        await stripe.refunds.create({ payment_intent: payment.stripe_payment_intent_id })
        await admin.from('reservation_payments').update({ status: 'refunded', payout_status: 'none' }).eq('id', payment.id)
        refunded = true
      } catch (e) {
        console.error('refund failed', e)
        await admin.from('refund_claims').insert({
          table_id: part.table_id, user_id: part.user_id,
          reason: 'Comensal quitado por el restaurante: el reembolso automático falló', status: 'pending',
        })
      }
    } else if (payment) {
      await admin.from('refund_claims').insert({
        table_id: part.table_id, user_id: part.user_id,
        reason: 'Comensal quitado por el restaurante: pago sin referencia de Stripe', status: 'pending',
      })
    }
    return json({ ok: true, refunded })
  } catch (e) {
    console.error(e)
    return json({ error: String((e as Error).message ?? e) }, 500)
  }
})
