import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

Deno.serve(async (req) => {
  // Acepta llamadas GET (desde pg_cron via http extension) y POST (manual)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  // Calcular fecha de mañana (UTC)
  const tomorrow = new Date()
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  // Obtener todos los participantes de mesas mañana que tienen email
  const { data: reservations, error } = await supabase
    .from('table_participants')
    .select(`
      user_id,
      dining_tables!inner (
        id,
        date,
        time,
        restaurant_name,
        max_seats,
        available_seats,
        host_id,
        profiles!dining_tables_host_id_fkey (
          restaurant_name,
          city,
          restaurant_address
        )
      )
    `)
    .eq('dining_tables.date', tomorrowStr)
    .eq('dining_tables.status', 'open')
    .eq('dining_tables.is_active', true)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!reservations || reservations.length === 0) {
    return new Response(JSON.stringify({ sent: 0, message: 'No reservations for tomorrow' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Obtener emails de los participantes via auth.users
  const userIds = [...new Set(reservations.map((r: any) => r.user_id))]
  const { data: authUsers } = await supabase.auth.admin.listUsers()
  const emailMap: Record<string, string> = {}
  if (authUsers?.users) {
    for (const u of authUsers.users) {
      if (userIds.includes(u.id) && u.email) {
        emailMap[u.id] = u.email
      }
    }
  }

  // Obtener nombres de los participantes
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name, full_name')
    .in('id', userIds)

  const profileMap: Record<string, string> = {}
  if (profiles) {
    for (const p of profiles) {
      profileMap[p.id] = p.display_name || p.full_name || 'Comensal'
    }
  }

  let sent = 0
  const errors: string[] = []

  for (const reservation of reservations as any[]) {
    const userId = reservation.user_id
    const email = emailMap[userId]
    if (!email) continue

    const table = reservation.dining_tables
    const restaurantProfile = table.profiles
    const restaurantName = restaurantProfile?.restaurant_name || table.restaurant_name || 'el restaurante'
    const city = restaurantProfile?.city || ''
    const address = restaurantProfile?.restaurant_address || ''
    const timeStr = table.time ? table.time.slice(0, 5) : ''
    const userName = profileMap[userId] || 'Comensal'
    const dateFormatted = new Date(tomorrowStr + 'T12:00:00').toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long',
    })

    const html = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/></head>
<body style="font-family:Inter,sans-serif;background:#f9fafb;margin:0;padding:24px">
  <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
    <div style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 24px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700">🍽️ ¡Tu cena es mañana!</h1>
      <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:14px">Table4Singles</p>
    </div>
    <div style="padding:28px 24px">
      <p style="color:#374151;font-size:15px;margin:0 0 20px">Hola <strong>${userName}</strong>,</p>
      <p style="color:#374151;font-size:15px;margin:0 0 24px">Te recordamos que mañana tienes una reserva confirmada:</p>

      <div style="background:#f3f4f6;border-radius:12px;padding:20px;margin-bottom:24px">
        <p style="margin:0 0 8px;color:#111827;font-size:16px;font-weight:700">${restaurantName}</p>
        ${city ? `<p style="margin:0 0 4px;color:#6b7280;font-size:13px">📍 ${address ? address + ', ' : ''}${city}</p>` : ''}
        <p style="margin:0;color:#6b7280;font-size:13px">📅 ${dateFormatted}${timeStr ? ` · 🕐 ${timeStr}` : ''}</p>
      </div>

      <p style="color:#6b7280;font-size:13px;margin:0 0 8px">¿Ya no puedes asistir? Entra en la app y cancela tu plaza para que otro comensal pueda unirse.</p>

      <div style="text-align:center;margin-top:28px">
        <a href="https://table4singles.online" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-size:14px;font-weight:600">Ver mi reserva</a>
      </div>
    </div>
    <div style="padding:16px 24px;border-top:1px solid #e5e7eb;text-align:center">
      <p style="margin:0;color:#9ca3af;font-size:11px">Table4Singles · Cenas con gente nueva</p>
    </div>
  </div>
</body>
</html>`

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Table4Singles <hola@table4singles.online>',
          to: [email],
          subject: `🍽️ Recordatorio: Tu cena es mañana en ${restaurantName}`,
          html,
        }),
      })

      if (res.ok) {
        sent++
      } else {
        const errBody = await res.text()
        errors.push(`${email}: ${errBody}`)
      }
    } catch (e) {
      errors.push(`${email}: ${String(e)}`)
    }
  }

  return new Response(JSON.stringify({ sent, total: reservations.length, errors }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
