import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { sanitizePublicDiner } from '@/lib/privacy'

const PAGE_SIZE = 24

/** Columnas publicas de un comensal: nunca se incluyen email, phone, street_address, lat/lng ni datos de restaurante. */
export interface CompanionProfile {
  id: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  city: string | null
  province: string | null
  country: string | null
  date_of_birth: string | null
  show_city: boolean
  show_age: boolean
  languages: string[] | null
  interests: string[] | null
  created_at: string
}

const PUBLIC_COLUMNS = 'id, display_name, avatar_url, bio, city, province, country, date_of_birth, show_city, show_age, languages, interests, created_at'

interface UseCompanionsOptions {
  currentUserId: string | null
  search?: string
  city?: string
  languages?: string[]
  interests?: string[]
}

export function useCompanions({ currentUserId, search = '', city = '', languages = [], interests = [] }: UseCompanionsOptions) {
  const [companions, setCompanions] = useState<CompanionProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const pageRef = useRef(0)

  const buildQuery = useCallback((page: number) => {
    let query = supabase
      .from('profiles')
      .select(PUBLIC_COLUMNS)
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

    if (currentUserId) query = query.neq('id', currentUserId)
    if (search.trim()) query = query.ilike('display_name', `%${search.trim()}%`)
    if (city.trim()) {
      query = query.eq('show_city', true).ilike('city', `%${city.trim()}%`)
    }
    if (languages.length > 0) query = query.overlaps('languages', languages)
    if (interests.length > 0) query = query.overlaps('interests', interests)

    return query
  }, [currentUserId, search, city, languages, interests])

  const fetchPage = useCallback(async (page: number, append: boolean) => {
    if (append) setLoadingMore(true)
    else setLoading(true)
    setError(null)

    const { data, error: err } = await buildQuery(page)

    if (err) {
      setError(err.message)
    } else if (data) {
      const rows = (data as unknown as CompanionProfile[]).map(sanitizePublicDiner)
      setCompanions(prev => (append ? [...prev, ...rows] : rows))
      setHasMore(rows.length === PAGE_SIZE)
      pageRef.current = page
    }
    setLoading(false)
    setLoadingMore(false)
  }, [buildQuery])

  useEffect(() => {
    fetchPage(0, false)
  }, [fetchPage])

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return
    fetchPage(pageRef.current + 1, true)
  }, [fetchPage, loadingMore, hasMore])

  return { companions, loading, loadingMore, error, hasMore, loadMore }
}
