import { supabase } from '@/lib/supabase'

export type FlyerSlot = 1 | 2 | 3
export const FLYER_SLOTS: FlyerSlot[] = [1, 2, 3]
export const STOCK_HERO = '/hero-dinner.jpg'

export function flyerHeroPath(restaurantId: string, slot: FlyerSlot = 1) {
  return `${restaurantId}/flyer-hero-${slot}.png`
}

export function flyerHeroUrl(restaurantId: string, slot: FlyerSlot = 1, cacheBust?: number) {
  const { data } = supabase.storage.from('restaurant-photos').getPublicUrl(flyerHeroPath(restaurantId, slot))
  const url = data.publicUrl
  return cacheBust ? `${url}?t=${cacheBust}` : url
}

export function flyerStatusUrl(restaurantId: string, slot: FlyerSlot = 1, cacheBust?: number) {
  const { data } = supabase.storage
    .from('restaurant-photos')
    .getPublicUrl(`${restaurantId}/flyer-status-${slot}.json`)
  const url = data.publicUrl
  return cacheBust ? `${url}?t=${cacheBust}` : url
}

export type FlyerJobStatus = {
  status: 'generating' | 'ok' | 'error'
  error?: string
  url?: string
}

export async function readFlyerStatus(restaurantId: string, slot: FlyerSlot = 1): Promise<FlyerJobStatus | null> {
  try {
    const res = await fetch(flyerStatusUrl(restaurantId, slot, Date.now()), { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json() as FlyerJobStatus
  } catch {
    return null
  }
}

/** Comprueba qué slots ya tienen foto generada. */
export async function checkExistingSlots(restaurantId: string): Promise<Set<FlyerSlot>> {
  const results = await Promise.all(
    FLYER_SLOTS.map(async slot => {
      try {
        const res = await fetch(flyerHeroUrl(restaurantId, slot), { method: 'HEAD', cache: 'no-store' })
        return res.ok ? slot : null
      } catch {
        return null
      }
    }),
  )
  return new Set(results.filter((s): s is FlyerSlot => s !== null))
}
