import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

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

function heroPrompt(city: string, cuisine: string) {
  return `Photorealistic photograph of a golden-hour dinner on a restaurant terrace in ${city || 'the Mediterranean'}.
Atmosphere of ${cuisine || 'Mediterranean'} cuisine: wine glasses toasting, warm string lights, people dining, sea or skyline softly in the background.
Shot on 35mm, cinematic, natural textures, magazine quality, full-bleed, no collage.
STRICT: no text, no letters, no logos, no watermark, no QR code, no captions, no typography of any kind.`
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

async function generateHero(restaurantId: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE)
  await writeStatus(supabase, restaurantId, { status: 'generating' })

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, city, restaurant_cuisine')
    .eq('id', restaurantId)
    .single()

  if (error || !profile) {
    await writeStatus(supabase, restaurantId, { status: 'error', error: 'Restaurante no encontrado' })
    return
  }

  const prompt = heroPrompt(profile.city || '', profile.restaurant_cuisine || '')
  const models = ['gpt-image-1.5', 'gpt-image-1']
  let lastError = 'OpenAI no devolvió imagen'

  for (const model of models) {
    console.log('openai generations', model, restaurantId)
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
    const path = `${restaurantId}/flyer-hero.png`
    const { error: upErr } = await supabase.storage
      .from('restaurant-photos')
      .upload(path, pngBytes, { contentType: 'image/png', upsert: true })
    if (upErr) {
      await writeStatus(supabase, restaurantId, { status: 'error', error: upErr.message })
      return
    }
    const publicUrl = supabase.storage.from('restaurant-photos').getPublicUrl(path).data.publicUrl
    console.log('hero ready', model, restaurantId)
    await writeStatus(supabase, restaurantId, { status: 'ok', url: publicUrl })
    return
  }

  await writeStatus(supabase, restaurantId, { status: 'error', error: lastError })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  if (!OPENAI_API_KEY) {
    return json({ error: 'OPENAI_API_KEY no configurada en los secrets de Supabase' }, 500)
  }

  let restaurantId = ''
  try {
    restaurantId = (await req.json()).restaurantId
  } catch {
    return json({ error: 'JSON inválido' }, 400)
  }
  if (!restaurantId) return json({ error: 'restaurantId required' }, 400)

  const job = generateHero(restaurantId).catch(async (err) => {
    console.error('generateHero failed', err)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE)
    await writeStatus(supabase, restaurantId, {
      status: 'error',
      error: err instanceof Error ? err.message : 'Error interno generando la foto',
    })
  })

  try {
    EdgeRuntime.waitUntil(job)
  } catch {
    await job
  }

  return json({ ok: true, status: 'started' })
})
