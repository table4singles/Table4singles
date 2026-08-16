import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY    = Deno.env.get('RESEND_API_KEY') ?? ''
const SUPABASE_URL      = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const APP_URL           = 'https://table4singles.online'

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const { restaurantId, overrideEmail } = await req.json()
  if (!restaurantId) {
    return new Response(JSON.stringify({ error: 'restaurantId required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE)

  // Obtener datos del restaurante
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, display_name, restaurant_name, email, avatar_url, city, restaurant_cuisine')
    .eq('id', restaurantId)
    .single()

  if (error || !profile) {
    return new Response(JSON.stringify({ error: 'Restaurant not found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const name    = profile.restaurant_name || profile.display_name || 'Tu restaurante'
  const email   = overrideEmail || profile.email
  if (!email) {
    return new Response(JSON.stringify({ error: 'No email available' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const flyerUrl = `${APP_URL}/?flyer=${restaurantId}`
  const logoSrc  = profile.avatar_url || `${APP_URL}/icons/logo-icon.png`

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenido a Table4Singles</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);padding:32px 40px;text-align:center;">
            <img src="${APP_URL}/icons/logo-full.png" alt="Table4Singles" height="40" style="display:block;margin:0 auto;" />
          </td>
        </tr>

        <!-- Hero saludo -->
        <tr>
          <td style="padding:40px 40px 24px;text-align:center;">
            <div style="width:72px;height:72px;border-radius:16px;overflow:hidden;margin:0 auto 16px;">
              <img src="${logoSrc}" alt="${name}" width="72" height="72" style="object-fit:cover;display:block;" />
            </div>
            <h1 style="margin:0 0 8px;font-size:24px;color:#1a1a2e;font-weight:800;">
              ¡Bienvenido, ${name}! 🎉
            </h1>
            <p style="margin:0;color:#6b7280;font-size:15px;line-height:1.6;">
              Ya formas parte de <strong>Table4Singles</strong>. Tu restaurante está listo para conectar con nuevos clientes y crear experiencias únicas.
            </p>
          </td>
        </tr>

        <!-- Separador -->
        <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #e5e7eb;" /></td></tr>

        <!-- Sección flyer -->
        <tr>
          <td style="padding:32px 40px;text-align:center;">
            <div style="background:#fff8f0;border-radius:12px;padding:24px;border:2px dashed #fed7aa;">
              <div style="font-size:32px;margin-bottom:8px;">🎨</div>
              <h2 style="margin:0 0 8px;font-size:18px;color:#1a1a2e;font-weight:700;">
                Tu flyer personalizado está listo
              </h2>
              <p style="margin:0 0 20px;color:#6b7280;font-size:14px;line-height:1.6;">
                Hemos creado un flyer con tu logo y nombre para que puedas promocionar Table4Singles en tu local. Imprímelo, ponlo en la barra, o compártelo con tus clientes.
              </p>
              <a href="${flyerUrl}"
                style="display:inline-block;background:#f97316;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 32px;border-radius:50px;letter-spacing:0.5px;">
                Ver y descargar mi flyer →
              </a>
            </div>
          </td>
        </tr>

        <!-- Próximos pasos -->
        <tr>
          <td style="padding:8px 40px 32px;">
            <h3 style="margin:0 0 16px;font-size:15px;color:#1a1a2e;font-weight:700;">¿Qué puedes hacer ahora?</h3>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${[
                ['📋', 'Completa tu perfil', 'Añade fotos, horarios y descripción de tu restaurante.'],
                ['🍽️', 'Crea tu primera mesa', 'Publica una cena para que los usuarios reserven su plaza.'],
                ['📊', 'Revisa tus estadísticas', 'Consulta reservas, ocupación y valoraciones en tu panel.'],
              ].map(([icon, title, desc]) => `
              <tr>
                <td style="padding:8px 0;vertical-align:top;width:36px;">
                  <span style="font-size:20px;">${icon}</span>
                </td>
                <td style="padding:8px 0 8px 8px;">
                  <p style="margin:0;font-size:14px;font-weight:700;color:#1a1a2e;">${title}</p>
                  <p style="margin:2px 0 0;font-size:13px;color:#6b7280;">${desc}</p>
                </td>
              </tr>`).join('')}
            </table>
          </td>
        </tr>

        <!-- CTA ir al panel -->
        <tr>
          <td style="padding:0 40px 32px;text-align:center;">
            <a href="${APP_URL}"
              style="display:inline-block;background:#1a1a2e;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:50px;">
              Ir a mi panel
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#9ca3af;font-size:12px;">
              © 2026 Table4Singles · <a href="${APP_URL}/politica-privacidad" style="color:#9ca3af;">Política de privacidad</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  // Enviar via Resend
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Table4Singles <no-reply@table4singles.online>',
      to: [email],
      subject: `¡Bienvenido a Table4Singles, ${name}! Tu flyer te espera 🎨`,
      html,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    return new Response(JSON.stringify({ error: 'Resend error', detail: body }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
