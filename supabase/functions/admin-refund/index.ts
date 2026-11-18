// Admin: reintenta en Stripe un reembolso pendiente (solicitud de reembolso) y la marca como resuelta.
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

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: prof } = await admin.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
    if (!prof?.is_admin) return json({ error: 'No autorizado' }, 403)

    const { claimId } = await req.json()
    if (!claimId) return json({ error: 'claimId requerido' }, 400)

    const { data: claim } = await admin.from('refund_claims').select('id, table_id, user_id, status').eq('id', claimId).maybeSingle()
    if (!claim) return json({ ok: false, error: 'Solicitud no encontrada' })
    if (claim.status === 'resolved') return json({ ok: true, already: true })

    const { data: payment } = await admin.from('reservation_payments')
      .select('id, stripe_payment_intent_id')
      .eq('table_id', claim.table_id).eq('user_id', claim.user_id).eq('status', 'paid')
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    if (!payment?.stripe_payment_intent_id) return json({ ok: false, error: 'No hay un pago cobrado que devolver' })

    try {
      await stripe.refunds.create({ payment_intent: payment.stripe_payment_intent_id })
    } catch (e) {
      return json({ ok: false, error: 'Stripe: ' + String((e as Error).message ?? e) })
    }
    await admin.from('reservation_payments').update({ status: 'refunded', payout_status: 'none' }).eq('id', payment.id)
    await admin.from('refund_claims').update({ status: 'resolved' }).eq('id', claim.id)
    return json({ ok: true })
  } catch (e) {
    console.error(e)
    return json({ error: String((e as Error).message ?? e) }, 500)
  }
})
