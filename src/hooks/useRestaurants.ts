import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { geocodeQuery, haversineDistanceKm, type GeoPoint } from '@/lib/geocoding'
import type { Profile, DiningTable } from '@/types/database'

export type RestaurantWithDistance = Profile & { distanceKm?: number }

interface UseRestaurantsOptions {
  city?: string
  cuisine?: string[]
  search?: string
  /** Radio en km. Si esta definido junto con `search`, se busca por proximidad geografica en vez de coincidencia de texto. */
  radiusKm?: number | null
}

export function useRestaurants(options: UseRestaurantsOptions = {}) {
  const [restaurants, setRestaurants] = useState<RestaurantWithDistance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [locationNotFound, setLocationNotFound] = useState(false)
  const cuisineKey = options.cuisine?.join(',') ?? ''

  const fetchRestaurants = useCallback(async () => {
    setLoading(true)
    setError(null)
    setLocationNotFound(false)

    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'restaurant')
      .order('restaurant_name', { ascending: true })

    const useRadius = !!options.radiusKm && !!options.search?.trim()

    if (options.cuisine && options.cuisine.length > 0) query = query.in('restaurant_cuisine', options.cuisine)
    if (!useRadius) {
      if (options.city) query = query.eq('city', options.city)
      if (options.search) {
        query = query.or(`restaurant_name.ilike.%${options.search}%,city.ilike.%${options.search}%`)
      }
    }

    const { data, error: err } = await query
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    const restaurantsData = (data || []) as Profile[]

    if (!useRadius) {
      setRestaurants(restaurantsData)
      setLoading(false)
      return
    }

    const center = await geocodeQuery(options.search!.trim())
    if (!center) {
      setLocationNotFound(true)
      setRestaurants([])
      setLoading(false)
      return
    }

    const withDistance: RestaurantWithDistance[] = []
    for (const restaurant of restaurantsData) {
      let point: GeoPoint | null =
        restaurant.latitude != null && restaurant.longitude != null
          ? { lat: restaurant.latitude, lon: restaurant.longitude }
          : null

      if (!point) {
        const locationQuery = [restaurant.city, restaurant.province, restaurant.country].filter(Boolean).join(', ')
        if (!locationQuery) continue
        point = await geocodeQuery(locationQuery)
        if (point) {
          // Cacheamos las coordenadas en el perfil para no tener que geocodificar de nuevo (best-effort, no bloquea la UI)
          supabase.from('profiles').update({ latitude: point.lat, longitude: point.lon }).eq('id', restaurant.id)
        }
      }

      if (!point) continue

      const distanceKm = haversineDistanceKm(center, point)
      if (distanceKm <= options.radiusKm!) {
        withDistance.push({ ...restaurant, distanceKm })
      }
    }

    withDistance.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
    setRestaurants(withDistance)
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.city, cuisineKey, options.search, options.radiusKm])

  useEffect(() => { fetchRestaurants() }, [fetchRestaurants])

  return { restaurants, loading, error, locationNotFound, refresh: fetchRestaurants }
}

export function useRestaurantProfile(restaurantId: string | null) {
  const [restaurant, setRestaurant] = useState<Profile | null>(null)
  const [tables, setTables] = useState<DiningTable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRestaurant = useCallback(async () => {
    if (!restaurantId) return
    setLoading(true)
    setError(null)

    const [profRes, tablesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', restaurantId).single(),
      supabase
        .from('dining_tables')
        .select('*')
        .eq('host_id', restaurantId)
        .eq('status', 'open')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true }),
    ])

    if (!profRes.error) setRestaurant(profRes.data)
    else setError(profRes.error.message)
    if (!tablesRes.error) setTables(tablesRes.data || [])
    setLoading(false)
  }, [restaurantId])

  useEffect(() => { fetchRestaurant() }, [fetchRestaurant])

  return { restaurant, tables, loading, error, refresh: fetchRestaurant }
}
