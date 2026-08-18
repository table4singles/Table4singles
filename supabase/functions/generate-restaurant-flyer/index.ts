import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const APP_URL = 'https://table4singles.online'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

declare const EdgeRuntime: { waitUntil: (promise: Promise<unknown>) => void }

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function buildPrompt(opts: {
  name: string
  city: string
  cuisine: string
}) {
  const name = opts.name.trim()
  const nameUpper = name.toUpperCase()
  const city = opts.city.trim() || 'España'
  const cuisine = opts.cuisine.trim() || 'mediterránea'

  return `Create a vertical A4 portrait print flyer (one single cohesive poster, not a collage of cards) for a restaurant × Table4Singles partnership.

RESTAURANT NAME — copy EXACTLY, do not change spelling, accents, or spacing:
"${name}"
Displayed in the title as: ${nameUpper}

CITY: ${city}
CUISINE: ${cuisine}

INPUT IMAGES (use them as official brand assets):
- Image 1 = the restaurant's official logo. Place it TOP-LEFT in the header. Reproduce it with PIXEL-ACCURATE fidelity: same shapes, colors, letters. Do NOT redraw, restyle, recolor, crop letters, or invent a replacement logo.
- Image 2 = the Table4Singles official logo (icon + wordmark). Place it TOP-RIGHT in the header. Reproduce it PIXEL-ACCURATE. Do NOT modify it.

LAYOUT (integrated as one piece, white paper, professional print):
1. Header on white: restaurant logo left | one thin gray vertical divider | Table4Singles logo right. Similar visual size. Only ONE divider. Logos fully visible, not cropped.
2. Centered title: "${nameUpper}" in the restaurant's brand color from its logo, then a smaller "by", then "TABLE4SINGLES" in dark navy. All caps.
3. Thin horizontal blue line with a small filled blue heart in the center.
4. Tagline centered in black: "Conecta, disfruta y conoce gente nueva en los mejores restaurantes."
5. Full-bleed photographic band integrated into the flyer (edge to edge of the page, NOT a floating rounded card with margins). Warm golden-hour scene: toast on an Ibiza-style restaurant terrace at sunset, palm trees, sea, people dining. The photo is part of the poster structure.
6. Over the photo:
   - LEFT: solid blue circle, white heart, text "LA MEJOR EXPERIENCIA EMPIEZA AQUÍ"
   - CENTER: a blank solid WHITE rounded square, empty, about 22% of the flyer width. This is a reserved hole. Do NOT put a QR, barcode, numbers, or any scannable pattern there.
   - RIGHT: white script text "Escanéame y descubre la app" with an arrow pointing LEFT toward the white square.
7. Wide solid blue bar overlapping the bottom edge of the photo: download icon + "DESCARGA TABLE4SINGLES Y ÚNETE A LA COMUNIDAD"
8. Three columns with blue icons: CONOCE GENTE (en lugares reales como ${name}) / DISFRUTA / CONECTA
9. Footer rounded box with globe: "UN MOVIMIENTO GLOBAL. Más restaurantes. Más conexiones. Más experiencias. Hoy aquí, mañana en todo el mundo."

CRITICAL RULES:
- Do NOT generate any QR code, barcode, or fake scan pattern. Leave the center white square empty.
- Do NOT alter, redraw, or hallucinate logos or the restaurant name.
- Do not add extra brand marks or extra vertical lines besides the single header divider.
- Spanish text exactly as written above.`
}

async function fetchBytes(url: string): Promise<{ bytes: Uint8Array; type: string } | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const type = res.headers.get('content-type') || 'image/png'
    const buf = new Uint8Array(await res.arrayBuffer())
    if (buf.byteLength < 80) return null
    return { bytes: buf, type: type.includes('jpeg') ? 'image/jpeg' : type.includes('webp') ? 'image/webp' : 'image/png' }
  } catch {
    return null
  }
}

function extFromType(type: string) {
  if (type.includes('jpeg')) return 'jpg'
  if (type.includes('webp')) return 'webp'
  return 'png'
}

function decodeBase64Png(b64: string): Uint8Array {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

function openaiErrorMessage(aiText: string): string {
  try {
    const parsed = JSON.parse(aiText)
    return parsed?.error?.message || parsed?.message || aiText.slice(0, 400)
  } catch {
    return aiText.slice(0, 400)
  }
}

async function writeStatus(
  supabase: SupabaseClient,
  restaurantId: string,
  payload: { status: 'generating' | 'ok' | 'error'; error?: string; url?: string },
) {
  const { error } = await supabase.storage
    .from('restaurant-photos')
    .upload(`${restaurantId}/flyer-status.json`, JSON.stringify(payload), {
      contentType: 'application/json',
      upsert: true,
    })
  if (error) console.error('flyer-status upload failed', error.message)
}

async function generateFlyer(restaurantId: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE)
  await writeStatus(supabase, restaurantId, { status: 'generating' })

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, display_name, restaurant_name, avatar_url, city, restaurant_cuisine, role')
    .eq('id', restaurantId)
    .single()

  if (error || !profile) {
    await writeStatus(supabase, restaurantId, { status: 'error', error: 'Restaurante no encontrado' })
    return
  }

  const name = profile.restaurant_name || profile.display_name || 'Restaurante'
  const logoUrl =
    restaurantId === '96683ea6-3c2d-48df-9caa-8b615a70d154'
      ? `${APP_URL}/icons/bahia-mar-logo.png`
      : profile.avatar_url

  const restaurantLogo = logoUrl ? await fetchBytes(logoUrl) : null
  const t4sLogo = await fetchBytes(`${APP_URL}/icons/logo-full.png`)
  if (!t4sLogo) {
    await writeStatus(supabase, restaurantId, { status: 'error', error: 'No se pudo cargar el logo de Table4Singles' })
    return
  }

  const form = new FormData()
  form.append('model', 'gpt-image-1')
  form.append('prompt', buildPrompt({
    name,
    city: profile.city || '',
    cuisine: profile.restaurant_cuisine || '',
  }))
  form.append('size', '1024x1536')
  form.append('quality', 'medium')
  form.append('input_fidelity', 'high')

  if (restaurantLogo) {
    form.append(
      'image[]',
      new Blob([restaurantLogo.bytes], { type: restaurantLogo.type }),
      `restaurant-logo.${extFromType(restaurantLogo.type)}`,
    )
  }
  form.append(
    'image[]',
    new Blob([t4sLogo.bytes], { type: t4sLogo.type }),
    `t4s-logo.${extFromType(t4sLogo.type)}`,
  )

  console.log('openai: calling images/edits', restaurantId)
  const aiRes = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: form,
    signal: AbortSignal.timeout(120_000),
  })

  const aiText = await aiRes.text()
  if (!aiRes.ok) {
    const message = openaiErrorMessage(aiText)
    console.error('openai error', aiRes.status, message)
    await writeStatus(supabase, restaurantId, { status: 'error', error: message })
    return
  }

  let b64 = ''
  try {
    const parsed = JSON.parse(aiText)
    b64 = parsed?.data?.[0]?.b64_json || ''
  } catch {
    await writeStatus(supabase, restaurantId, { status: 'error', error: 'Respuesta OpenAI inválida' })
    return
  }
  if (!b64) {
    await writeStatus(supabase, restaurantId, { status: 'error', error: 'OpenAI no devolvió imagen' })
    return
  }

  const pngBytes = decodeBase64Png(b64)
  const path = `${restaurantId}/flyer.png`
  const { error: upErr } = await supabase.storage
    .from('restaurant-photos')
    .upload(path, pngBytes, { contentType: 'image/png', upsert: true })

  if (upErr) {
    console.error('png upload failed', upErr.message)
    await writeStatus(supabase, restaurantId, { status: 'error', error: upErr.message })
    return
  }

  const publicUrl = supabase.storage.from('restaurant-photos').getPublicUrl(path).data.publicUrl
  console.log('flyer ready', restaurantId)
  await writeStatus(supabase, restaurantId, { status: 'ok', url: publicUrl })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  if (!OPENAI_API_KEY) {
    return json({ error: 'OPENAI_API_KEY no configurada en los secrets de Supabase' }, 500)
  }

  let restaurantId = ''
  try {
    const body = await req.json()
    restaurantId = body.restaurantId
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }
  if (!restaurantId) return json({ error: 'restaurantId required' }, 400)

  const job = generateFlyer(restaurantId).catch(async (err) => {
    console.error('generateFlyer failed', err)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE)
    await writeStatus(supabase, restaurantId, {
      status: 'error',
      error: err instanceof Error ? err.message : 'Error interno generando el flyer',
    })
  })

  try {
    EdgeRuntime.waitUntil(job)
  } catch {
    await job
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE)
    const { data } = await supabase.storage.from('restaurant-photos').download(`${restaurantId}/flyer-status.json`)
    const text = data ? await data.text() : ''
    try {
      const status = JSON.parse(text)
      if (status.status === 'error') return json({ error: status.error || 'Error generando el flyer' }, 502)
    } catch { /* ignore */ }
    return json({ ok: true, status: 'ok' })
  }

  return json({ ok: true, status: 'started' })
})
