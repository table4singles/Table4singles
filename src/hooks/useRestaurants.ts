import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { geocodeQuery, haversineDistanceKm, type GeoPoint } from '@/lib/geocoding'
import type { Profile, DiningTable } from '@/types/database'

export type RestaurantWithDistance = Profile & { distanceKm?: number }

export type TableParticipantBasic = {
  user_id: string
  status: string
  profiles: { id: string; display_name: string | null; avatar_url: string | null } | null
}

export type DiningTableWithParticipants = DiningTable & {
  table_participants?: TableParticipantBasic[]
}

interface UseRestaurantsOptions {
  city?: string
  cuisine?: string[]
  priceRange?: string[]
  /** Filtra restaurantes que tienen mesas disponibles en esta fecha (YYYY-MM-DD) */
  dateFilter?: string
  /** Franja horaria: 'midday' = 12-17h, 'evening' = 17h+ */
  timeFilter?: 'midday' | 'evening'
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
  const priceKey = options.priceRange?.join(',') ?? ''

  const fetchRestaurants = useCallback(async () => {
    setLoading(true)
    setError(null)
    setLocationNotFound(false)

    // Si hay filtro de fecha, pre-obtenemos los IDs de restaurantes con mesas disponibles ese día
    let restaurantIdsWithTables: string[] | null = null
    if (options.dateFilter) {
      let tq = supabase
        .from('dining_tables')
        .select('host_id')
        .eq('date', options.dateFilter)
        .eq('status', 'open')
        .eq('is_active', true)
        .gt('available_seats', 0)
      if (options.timeFilter === 'midday') tq = tq.gte('time', '12:00:00').lt('time', '17:00:00')
      if (options.timeFilter === 'evening') tq = tq.gte('time', '17:00:00')
      const { data: tables } = await tq
      if (tables && tables.length > 0) {
        restaurantIdsWithTables = [...new Set(tables.map((t: { host_id: string }) => t.host_id))]
      } else {
        // No hay mesas ese día → resultado vacío
        setRestaurants([])
        setLoading(false)
        return
      }
    }

    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'restaurant')
      .order('restaurant_name', { ascending: true })

    const useRadius = !!options.radiusKm && !!options.search?.trim()

    if (options.cuisine && options.cuisine.length > 0) query = query.in('restaurant_cuisine', options.cuisine)
    if (options.priceRange && options.priceRange.length > 0) query = query.in('restaurant_price_range', options.priceRange)
    if (restaurantIdsWithTables) query = query.in('id', restaurantIdsWithTables)
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
  }, [options.city, cuisineKey, priceKey, options.dateFilter, options.timeFilter, options.search, options.radiusKm, options.ensureCoordinates])

  useEffect(() => { fetchRestaurants() }, [fetchRestaurants])

  return { restaurants, loading, error, locationNotFound, refresh: fetchRestaurants }
}

export function useRestaurantProfile(restaurantId: string | null) {
  const [restaurant, setRestaurant] = useState<Profile | null>(null)
  const [tables, setTables] = useState<DiningTableWithParticipants[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRestaurant = useCallback(async () => {
    if (!restaurantId) return
    setLoading(true)
    setError(null)

    // Query 1: profile + tables (sin nested join para evitar conflictos PostgREST)
    const [profRes, tablesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', restaurantId).single(),
      supabase
        .from('dining_tables')
        .select('*')
        .eq('host_id', restaurantId)
        .eq('status', 'open')
        .eq('is_active', true)
        .order('date', { ascending: true })
        .order('time', { ascending: true }),
    ])

    if (!profRes.error) setRestaurant(profRes.data)
    else setError(profRes.error.message)

    if (tablesRes.error) {
      setLoading(false)
      return
    }

    const rawTables: DiningTable[] = tablesRes.data || []

    if (rawTables.length === 0) {
      setTables([])
      setLoading(false)
      return
    }

    // Query 2: participantes aprobados para estas mesas
    const tableIds = rawTables.map(t => t.id)
    const { data: partData } = await supabase
      .from('table_participants')
      .select('table_id, user_id, status, profiles(id, display_name, avatar_url)')
      .in('table_id', tableIds)
      .eq('status', 'approved')

    // Agrupar por table_id
    const byTable: Record<string, TableParticipantBasic[]> = {}
    for (const p of (partData ?? [])) {
      const tid = (p as any).table_id as string
      if (!byTable[tid]) byTable[tid] = []
      byTable[tid].push(p as unknown as TableParticipantBasic)
    }

    setTables(rawTables.map(t => ({ ...t, table_participants: byTable[t.id] ?? [] })))
    setLoading(false)
  }, [restaurantId])

  useEffect(() => { fetchRestaurant() }, [fetchRestaurant])

  return { restaurant, tables, loading, error, refresh: fetchRestaurant }
}
