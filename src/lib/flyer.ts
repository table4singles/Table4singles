import { supabase } from '@/lib/supabase'

export function flyerStoragePath(restaurantId: string) {
  return `${restaurantId}/flyer.png`
}

export function flyerPublicUrl(restaurantId: string, cacheBust?: number) {
  const { data } = supabase.storage.from('restaurant-photos').getPublicUrl(flyerStoragePath(restaurantId))
  const url = data.publicUrl
  return cacheBust ? `${url}?t=${cacheBust}` : url
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
