import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Review } from '@/types/database'

export function useReviews(tableId: string | null) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReviews = useCallback(async () => {
    if (!tableId) return
    const { data } = await supabase
      .from('reviews')
      .select('*, profiles(display_name)')
      .eq('table_id', tableId)
      .order('created_at', { ascending: false })
    if (data) setReviews(data as Review[])
    setLoading(false)
  }, [tableId])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  const submitReview = useCallback(async (review: {
    table_id: string
    host_id: string
    rating: number
    comment?: string
    ambiance_rating?: number
    food_rating?: number
    company_rating?: number
  }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { error } = await supabase.from('reviews').insert({
      ...review,
      reviewer_id: user.id,
    })
    if (error) throw error
    await fetchReviews()
  }, [fetchReviews])

  return { reviews, loading, submitReview, refresh: fetchReviews }
}

export function useRestaurantReviews(hostId: string | null) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!hostId) return
    setLoading(true)
    supabase
      .from('reviews')
      .select('*')
      .eq('host_id', hostId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setReviews(data as Review[])
        setLoading(false)
      })
  }, [hostId])

  return { reviews, loading }
}
