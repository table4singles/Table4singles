// El restaurante (o un admin) cancela una mesa: se devuelve en Stripe TODO lo cobrado a cada comensal
// (depósito de 2 € o cena especial con el 10 %), y después se cancela la mesa.
// Si algún reembolso falla, ese pago queda como 'paid' y el trigger de la base de datos crea una
// solicitud de reembolso pendiente para devolverlo a mano.
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

    const { tableId } = await req.json()
    if (!tableId) return json({ error: 'tableId requerido' }, 400)

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: table } = await admin.from('dining_tables').select('id, host_id, status').eq('id', tableId).maybeSingle()
    if (!table) return json({ ok: false, error: 'Mesa no encontrada' })
    if (table.host_id !== user.id) {
      const { data: prof } = await admin.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
      if (!prof?.is_admin) return json({ error: 'No autorizado' }, 403)
    }
    if (table.status === 'cancelled') return json({ ok: true, refunded: 0, failed: 0 })

    const { data: payments } = await admin.from('reservation_payments')
      .select('id, stripe_payment_intent_id')
      .eq('table_id', tableId).eq('status', 'paid')

    let refunded = 0
    let failed = 0
    for (const p of payments ?? []) {
      if (!p.stripe_payment_intent_id) { failed++; continue }
      try {
        await stripe.refunds.create({ payment_intent: p.stripe_payment_intent_id })
        await admin.from('reservation_payments').update({ status: 'refunded', payout_status: 'none' }).eq('id', p.id)
        refunded++
      } catch (e) {
        console.error('refund failed', p.id, e)
        failed++
      }
    }

    // Cancelar la mesa (el trigger avisa a los comensales y deja solicitudes para lo que no se pudo devolver)
    const { error: updErr } = await admin.from('dining_tables').update({ status: 'cancelled' }).eq('id', tableId)
    if (updErr) return json({ ok: false, error: updErr.message })
    return json({ ok: true, refunded, failed })
  } catch (e) {
    console.error(e)
    return json({ error: String((e as Error).message ?? e) }, 500)
  }
})
