import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface AmbassadorRestaurant {
  restaurant_id: string
  restaurant_name: string | null
  subscription_status: string | null
  active_tables: number
  total_reservations: number
  joined_at: string
  monthly_commission_cts: number
}

export interface AmbassadorStats {
  restaurants: AmbassadorRestaurant[]
  totalReferred: number
  activeSubscriptions: number
  estimatedMonthlyEuros: number
  stripeReady: boolean
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useAmbassadorStats(userId: string | null, commissionRate = 5): AmbassadorStats {
  const [restaurants, setRestaurants] = useState<AmbassadorRestaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!userId) { setLoading(false); return }
    setLoading(true)
    supabase
      .rpc('get_ambassador_restaurants', { p_ambassador_id: userId })
      .then(({ data, error: err }) => {
        if (err) {
          setError(err.message)
          setRestaurants([])
        } else {
          setRestaurants((data ?? []).map((r: any) => ({
            restaurant_id: r.restaurant_id,
            restaurant_name: r.restaurant_name,
            subscription_status: r.subscription_status,
            active_tables: Number(r.active_tables ?? 0),
            total_reservations: Number(r.total_reservations ?? 0),
            joined_at: r.joined_at,
            monthly_commission_cts: r.subscription_status === 'active'
              ? Math.round(1000 * commissionRate / 100)
              : 0,
          })))
        }
        setLoading(false)
      })
  }, [userId, commissionRate, tick])

  const activeSubscriptions = restaurants.filter(r => r.subscription_status === 'active').length
  const estimatedMonthlyEuros = restaurants.reduce((sum, r) => sum + r.monthly_commission_cts, 0) / 100

  return {
    restaurants,
    totalReferred: restaurants.length,
    activeSubscriptions,
    estimatedMonthlyEuros,
    stripeReady: false,
    loading,
    error,
    refresh: () => setTick(t => t + 1),
  }
}
