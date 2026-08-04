import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore - web-push deno compat via esm.sh
import webpush from 'https://esm.sh/web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

webpush.setVapidDetails(
  `mailto:${Deno.env.get('VAPID_EMAIL')}`,
  Deno.env.get('VAPID_PUBLIC_KEY')!,
  Deno.env.get('VAPID_PRIVATE_KEY')!,
)

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { host_id, participant_profile, table } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Fetch all push subscriptions for the restaurant
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', host_id)

    if (error) throw error
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), { headers: corsHeaders })
    }

    const occupied = table.max_seats - table.available_seats
    const dinerName = participant_profile?.display_name || participant_profile?.full_name || 'Nuevo comensal'

    const payload = JSON.stringify({
      title: `¡Nueva reserva! ${occupied}/${table.max_seats}`,
      body: `${dinerName} se ha apuntado a tu mesa de las ${table.time?.slice(0, 5) ?? ''}`,
      icon: participant_profile?.avatar_url || '/icon-192.png',
      badge: '/icon-96.png',
      url: '/?page=agenda',
    })

    const results = await Promise.allSettled(
      subs.map(sub =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        )
      ),
    )

    const sent = results.filter(r => r.status === 'fulfilled').length
    const failed = results.length - sent

    return new Response(JSON.stringify({ sent, failed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
