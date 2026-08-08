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
  /** Geocodifica (y cachea en BD) las coordenadas de los restaurantes que no las tengan, para poder mostrarlos en el mapa. */
  ensureCoordinates?: boolean
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

    const resolvePoint = async (restaurant: Profile): Promise<GeoPoint | null> => {
      if (restaurant.latitude != null && restaurant.longitude != null) {
        return { lat: restaurant.latitude, lon: restaurant.longitude }
      }
      const locationQuery = [restaurant.city, restaurant.province, restaurant.country].filter(Boolean).join(', ')
      if (!locationQuery) return null
      const point = await geocodeQuery(locationQuery)
      if (point) {
        // Cacheamos las coordenadas en el perfil para no tener que geocodificar de nuevo (best-effort, no bloquea la UI)
        supabase.from('profiles').update({ latitude: point.lat, longitude: point.lon }).eq('id', restaurant.id)
      }
      return point
    }

    if (!useRadius) {
      if (options.ensureCoordinates) {
        const withCoords: RestaurantWithDistance[] = []
        for (const restaurant of restaurantsData) {
          const point = await resolvePoint(restaurant)
          withCoords.push(point ? { ...restaurant, latitude: point.lat, longitude: point.lon } : restaurant)
        }
        setRestaurants(withCoords)
      } else {
        setRestaurants(restaurantsData)
      }
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
      const point = await resolvePoint(restaurant)
      if (!point) continue

      const distanceKm = haversineDistanceKm(center, point)
      if (distanceKm <= options.radiusKm!) {
        withDistance.push({ ...restaurant, latitude: point.lat, longitude: point.lon, distanceKm })
      }
    }

    withDistance.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
    setRestaurants(withDistance)
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.city, cuisineKey, options.search, options.radiusKm, options.ensureCoordinates])

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
        .eq('is_active', true)
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
