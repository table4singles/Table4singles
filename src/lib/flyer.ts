import { supabase } from '@/lib/supabase'

export function flyerStoragePath(restaurantId: string) {
  return `${restaurantId}/flyer.png`
}

export function flyerPublicUrl(restaurantId: string, cacheBust?: number) {
  const { data } = supabase.storage.from('restaurant-photos').getPublicUrl(flyerStoragePath(restaurantId))
  const url = data.publicUrl
  return cacheBust ? `${url}?t=${cacheBust}` : url
}

export function flyerStatusUrl(restaurantId: string, cacheBust?: number) {
  const { data } = supabase.storage.from('restaurant-photos').getPublicUrl(`${restaurantId}/flyer-status.json`)
  const url = data.publicUrl
  return cacheBust ? `${url}?t=${cacheBust}` : url
}

export type FlyerJobStatus = {
  status: 'generating' | 'ok' | 'error'
  error?: string
  url?: string
}

export async function readFlyerStatus(restaurantId: string): Promise<FlyerJobStatus | null> {
  try {
    const res = await fetch(flyerStatusUrl(restaurantId, Date.now()), { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json() as FlyerJobStatus
  } catch {
    return null
  }
}

export async function flyerExists(restaurantId: string): Promise<boolean> {
  const url = flyerPublicUrl(restaurantId)
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store' })
    return res.ok
  } catch {
    return false
  }
}
