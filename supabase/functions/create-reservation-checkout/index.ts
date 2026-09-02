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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()
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

    // Verificar mesa disponible
    const { data: table, error: tableError } = await supabase
      .from('dining_tables')
      .select('id, restaurant_name, available_seats, is_active, is_special, deposit_amount')
      .eq('id', tableId)
      .single()

    if (tableError || !table) {
      return new Response(JSON.stringify({ error: 'Mesa no encontrada' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (!table.is_active) {
      return new Response(JSON.stringify({ error: 'Esta mesa no está activa' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (table.available_seats <= 0) {
      return new Response(JSON.stringify({ error: 'No quedan plazas en esta mesa' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const origin = req.headers.get('origin') || 'https://www.table4singles.online'

    // Las mesas normales siempre cuestan 2€. Solo una Cena Especial (is_special)
    // puede tener un precio distinto, fijado explícitamente por el restaurante o
    // el admin al crear/editar el invitado especial (columna deposit_amount).
    const unitAmount = table.is_special && table.deposit_amount
      ? Math.round(Number(table.deposit_amount) * 100)
      : 200

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Reserva en ${table.restaurant_name}`,
              description: 'Depósito de reserva reembolsable — Table4Singles',
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}?payment=success&table=${tableId}`,
      cancel_url: `${origin}?payment=cancelled&table=${tableId}`,
      metadata: {
        type: 'reservation',
        user_id: user.id,
        table_id: tableId,
      },
    })

    // Registrar pago pendiente
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    await supabaseAdmin.from('reservation_payments').insert({
      user_id: user.id,
      table_id: tableId,
      stripe_session_id: session.id,
      amount: unitAmount,
      currency: 'eur',
      status: 'pending',
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('create-reservation-checkout error:', err)
    return new Response(JSON.stringify({ error: err.message ?? 'Error interno' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
