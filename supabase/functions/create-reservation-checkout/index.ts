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
      .select('id, restaurant_name, available_seats, is_active, is_special, deposit_amount, special_guest_name, special_price_by')
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

    // Mesas normales: 2€ no reembolsables, todo para Table4Singles.
    // Cena Especial con precio del restaurante: el comensal paga ese precio + 10 % de gestión (todo a
    // Table4Singles, que después paga al restaurante SOLO su importe; el 10 % no lo ve el restaurante).
    // Cena Especial con precio fijado por el admin: se cobra tal cual, sin 10 % ni pago al restaurante.
    const isSpecialPriced = !!(table.is_special && table.deposit_amount)
    const priceCents = isSpecialPriced ? Math.round(Number(table.deposit_amount) * 100) : 200
    const restaurantPriced = isSpecialPriced && table.special_price_by !== 'admin'
    const feeCents = restaurantPriced ? Math.round(priceCents * 0.1) : 0
    const unitAmount = priceCents + feeCents
    const restaurantAmount = restaurantPriced ? priceCents : 0

    const lineItems: any[] = [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: isSpecialPriced && table.special_guest_name
              ? `Cena con ${table.special_guest_name} en ${table.restaurant_name}`
              : `Reserva en ${table.restaurant_name}`,
            description: restaurantPriced
              ? 'Cena especial: reembolso completo si cancelas hasta el día anterior — Table4Singles'
              : 'Depósito de reserva no reembolsable — Table4Singles',
          },
          unit_amount: priceCents,
        },
        quantity: 1,
      },
    ]
    if (feeCents > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: { name: 'Gestión Table4Singles (10 %)' },
          unit_amount: feeCents,
        },
        quantity: 1,
      })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
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
      restaurant_amount: restaurantAmount,
      fee_amount: unitAmount - restaurantAmount,
      payout_status: restaurantAmount > 0 ? 'pending' : 'none',
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
