import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface AdminStats {
  total_users: number
  total_restaurants: number
  active_subscriptions: number
  total_ambassadors: number
  total_reservations: number
  paid_reservations: number
  reservation_revenue_cts: number
  mrr_cts: number
}

export interface AdminUser {
  id: string
  display_name: string | null
  email: string | null
  role: string
  created_at: string
  is_admin: boolean
  subscription_status: string | null
  referred_by: string | null
}

export interface AdminRestaurant {
  restaurant_id: string
  restaurant_name: string | null
  email: string | null
  subscription_status: string | null
  active_tables: number
  total_reservations: number
  ambassador_name: string | null
  joined_at: string
}

export interface AdminAmbassador {
  ambassador_user_id: string
  display_name: string | null
  email: string | null
  commission_rate: number
  status: string
  restaurants_referred: number
  active_subscriptions: number
  monthly_commission_cts: number
  applied_at: string
}

export interface AdminPayment {
  id: string
  user_id: string
  table_id: string
  amount: number
  currency: string
  status: string
  created_at: string
  stripe_session_id: string
  stripe_payment_intent_id: string | null
}

export interface AdminDemandRequest {
  id: string
  user_id: string
  display_name: string | null
  email: string | null
  city: string
  date_pref: string | null
  day_of_week: number | null
  time_pref: string | null
  cuisine: string | null
  interests: string[]
  language: string | null
  status: string
  created_at: string
}

export interface AdminData {
  stats: AdminStats | null
  users: AdminUser[]
  restaurants: AdminRestaurant[]
  ambassadors: AdminAmbassador[]
  payments: AdminPayment[]
  demandRequests: AdminDemandRequest[]
  loading: boolean
  error: string | null
  refresh: () => void
}

const EMPTY_STATS: AdminStats = {
  total_users: 0, total_restaurants: 0, active_subscriptions: 0,
  total_ambassadors: 0, total_reservations: 0, paid_reservations: 0,
  reservation_revenue_cts: 0, mrr_cts: 0,
}

export function useAdminData(isAdmin: boolean): AdminData {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([])
  const [ambassadors, setAmbassadors] = useState<AdminAmbassador[]>([])
  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [demandRequests, setDemandRequests] = useState<AdminDemandRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!isAdmin) { setLoading(false); return }
    setLoading(true)
    setError(null)

    Promise.all([
      supabase.rpc('get_admin_stats'),
      supabase.from('profiles')
        .select('id, display_name, email, role, created_at, is_admin, subscription_status, referred_by')
        .order('created_at', { ascending: false }),
      supabase.rpc('get_admin_restaurants'),
      supabase.rpc('get_admin_ambassadors'),
      supabase.from('reservation_payments').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('demand_requests')
        .select('id, user_id, city, date_pref, day_of_week, time_pref, cuisine, interests, language, status, created_at, profiles(display_name, email)')
        .order('created_at', { ascending: false })
        .limit(200),
    ]).then(([statsRes, usersRes, restRes, ambRes, payRes, demandRes]) => {
      if (statsRes.error) setError(statsRes.error.message)
      else setStats({ ...EMPTY_STATS, ...(statsRes.data as AdminStats) })

      setUsers((usersRes.data as AdminUser[]) ?? [])

      setRestaurants(((restRes.data ?? []) as any[]).map(r => ({
        restaurant_id: r.restaurant_id,
        restaurant_name: r.restaurant_name,
        email: r.email,
        subscription_status: r.subscription_status,
        active_tables: Number(r.active_tables ?? 0),
        total_reservations: Number(r.total_reservations ?? 0),
        ambassador_name: r.ambassador_name,
        joined_at: r.joined_at,
      })))

      setAmbassadors(((ambRes.data ?? []) as any[]).map(a => ({
        ambassador_user_id: a.ambassador_user_id,
        display_name: a.display_name,
        email: a.email,
        commission_rate: Number(a.commission_rate ?? 5),
        status: a.status,
        restaurants_referred: Number(a.restaurants_referred ?? 0),
        active_subscriptions: Number(a.active_subscriptions ?? 0),
        monthly_commission_cts: Number(a.monthly_commission_cts ?? 0),
        applied_at: a.applied_at,
      })))

      setPayments((payRes.data as AdminPayment[]) ?? [])

      setDemandRequests(((demandRes.data ?? []) as any[]).map(d => ({
        id: d.id,
        user_id: d.user_id,
        display_name: d.profiles?.display_name ?? null,
        email: d.profiles?.email ?? null,
        city: d.city,
        date_pref: d.date_pref,
        day_of_week: d.day_of_week,
        time_pref: d.time_pref,
        cuisine: d.cuisine,
        interests: d.interests ?? [],
        language: d.language,
        status: d.status,
        created_at: d.created_at,
      })))
      setLoading(false)
    })
  }, [isAdmin, tick])

  return { stats, users, restaurants, ambassadors, payments, demandRequests, loading, error, refresh: () => setTick(t => t + 1) }
}
