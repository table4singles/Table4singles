import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

declare const EdgeRuntime: { waitUntil: (promise: Promise<unknown>) => void }

/** Slots permitidos: 1, 2, 3 */
type Slot = 1 | 2 | 3
const VALID_SLOTS: Slot[] = [1, 2, 3]

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function heroPrompt(city: string, cuisine: string, slot: Slot) {
  const scenes: Record<Slot, string> = {
    1: `Photorealistic photograph of a golden-hour dinner on a Mediterranean restaurant terrace in ${city || 'Spain'}.
Wine glasses toasting, warm string lights, people dining together, sea view softly in background.
Shot on 35mm, cinematic, warm amber tones, magazine quality, full-bleed composition.`,
    2: `Photorealistic elegant interior of a ${cuisine || 'fine dining'} restaurant in ${city || 'Spain'} at night.
Candlelit tables, guests smiling, sommelier serving wine, soft bokeh background.
Shot on 50mm, intimate atmosphere, dark warm tones, editorial quality, full-bleed.`,
    3: `Photorealistic aerial view of a vibrant outdoor restaurant terrace in ${city || 'Spain'} at sunset.
Couples and small groups dining, colourful flowers, city skyline in distance.
Shot on wide lens, golden hour, lively atmosphere, magazine quality, full-bleed.`,
  }
  return `${scenes[slot]}
STRICT: absolutely no text, no letters, no logos, no watermark, no QR code, no captions, no numbers, no typography of any kind anywhere in the image.`
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

function statusPath(restaurantId: string, slot: Slot) {
  return `${restaurantId}/flyer-status-${slot}.json`
}

function heroPath(restaurantId: string, slot: Slot) {
  return `${restaurantId}/flyer-hero-${slot}.png`
}

async function writeStatus(
  supabase: SupabaseClient,
  restaurantId: string,
  slot: Slot,
  payload: { status: 'generating' | 'ok' | 'error'; error?: string; url?: string },
) {
  const { error } = await supabase.storage
    .from('restaurant-photos')
    .upload(statusPath(restaurantId, slot), JSON.stringify(payload), {
      contentType: 'application/json',
      upsert: true,
    })
  if (error) console.error('status upload failed', error.message)
}

async function generateHero(restaurantId: string, slot: Slot) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE)
  await writeStatus(supabase, restaurantId, slot, { status: 'generating' })

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, city, restaurant_cuisine')
    .eq('id', restaurantId)
    .single()

  if (error || !profile) {
    await writeStatus(supabase, restaurantId, slot, { status: 'error', error: 'Restaurante no encontrado' })
    return
  }

  const prompt = heroPrompt(profile.city || '', profile.restaurant_cuisine || '', slot)
  const models = ['gpt-image-1.5', 'gpt-image-1']
  let lastError = 'OpenAI no devolvió imagen'

  for (const model of models) {
    console.log('openai generations', model, restaurantId, 'slot', slot)
    const aiRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt,
        size: '1536x1024',
        quality: 'high',
      }),
      signal: AbortSignal.timeout(120_000),
    })

    const aiText = await aiRes.text()
    if (!aiRes.ok) {
      lastError = openaiErrorMessage(aiText)
      console.error('openai error', model, aiRes.status, lastError)
      continue
    }

    let b64 = ''
    try {
      b64 = JSON.parse(aiText)?.data?.[0]?.b64_json || ''
    } catch {
      lastError = 'Respuesta OpenAI inválida'
      continue
    }
    if (!b64) continue

    const pngBytes = decodeBase64Png(b64)
    const path = heroPath(restaurantId, slot)
    const { error: upErr } = await supabase.storage
      .from('restaurant-photos')
      .upload(path, pngBytes, { contentType: 'image/png', upsert: true })
    if (upErr) {
      await writeStatus(supabase, restaurantId, slot, { status: 'error', error: upErr.message })
      return
    }

    const publicUrl = supabase.storage.from('restaurant-photos').getPublicUrl(path).data.publicUrl
    console.log('hero ready', model, 'slot', slot, restaurantId)
    await writeStatus(supabase, restaurantId, slot, { status: 'ok', url: publicUrl })
    return
  }

  await writeStatus(supabase, restaurantId, slot, { status: 'error', error: lastError })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  if (!OPENAI_API_KEY) {
    return json({ error: 'OPENAI_API_KEY no configurada en los secrets de Supabase' }, 500)
  }

  let restaurantId = ''
  let slot: Slot = 1
  try {
    const body = await req.json()
    restaurantId = body.restaurantId
    const rawSlot = Number(body.slot ?? 1)
    slot = (VALID_SLOTS.includes(rawSlot as Slot) ? rawSlot : 1) as Slot
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }
  if (!restaurantId) return json({ error: 'restaurantId required' }, 400)

  const job = generateHero(restaurantId, slot).catch(async (err) => {
    console.error('generateHero failed', err)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE)
    await writeStatus(supabase, restaurantId, slot, {
      status: 'error',
      error: err instanceof Error ? err.message : 'Error interno generando la foto',
    })
  })

  try {
    EdgeRuntime.waitUntil(job)
  } catch {
    await job
  }

  return json({ ok: true, status: 'started', slot })
})
