import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Review, RestaurantReview } from '@/types/database'

export function useReviews(tableId: string | null) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReviews = useCallback(async () => {
    if (!tableId) return
    const { data } = await supabase
      .from('reviews')
      .select('*, profiles(display_name, avatar_url), review_replies(*)')
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

  const submitReply = useCallback(async (reviewId: string, reply: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { error } = await supabase.from('review_replies').upsert({
      review_id: reviewId,
      restaurant_id: user.id,
      reply: reply.trim(),
    }, { onConflict: 'review_id' })
    if (error) throw error
    await fetchReviews()
  }, [fetchReviews])

  return { reviews, loading, submitReview, submitReply, refresh: fetchReviews }
}

export function useRestaurantReviews(hostId: string | null) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  const fetchReviews = useCallback(async () => {
    if (!hostId) return
    setLoading(true)
    const { data } = await supabase
      .from('reviews')
      .select('*, profiles!reviews_reviewer_id_fkey(display_name, avatar_url), review_replies(*)')
      .eq('host_id', hostId)
      .order('created_at', { ascending: false })
    if (data) setReviews(data as Review[])
    setLoading(false)
  }, [hostId])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  const submitReply = useCallback(async (reviewId: string, reply: string) => {
    if (!hostId) return
    const { error } = await supabase.from('review_replies').upsert({
      review_id: reviewId,
      restaurant_id: hostId,
      reply: reply.trim(),
    }, { onConflict: 'review_id' })
    if (error) throw error
    await fetchReviews()
  }, [hostId, fetchReviews])

  return { reviews, loading, submitReply, refresh: fetchReviews }
}

// ─── Restaurant public reviews (users reviewing the venue) ───────────────────

export function useRestaurantPublicReviews(restaurantId: string | null) {
  const [reviews, setReviews] = useState<RestaurantReview[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchReviews = useCallback(async () => {
    if (!restaurantId) return
    setLoading(true)
    const { data } = await supabase
      .from('restaurant_reviews')
      .select('*, profiles!restaurant_reviews_user_id_fkey(id, display_name, avatar_url), restaurant_review_replies(*)')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })
    if (data) setReviews(data as RestaurantReview[])
    setLoading(false)
  }, [restaurantId])

  useEffect(() => { fetchReviews() }, [fetchReviews])

  const submitReview = useCallback(async (rating: number, comment: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !restaurantId) throw new Error('Not authenticated')
    setSubmitting(true)
    setError(null)
    const { error: err } = await supabase.from('restaurant_reviews').upsert({
      user_id: user.id,
      restaurant_id: restaurantId,
      rating,
      comment: comment.trim() || null,
    }, { onConflict: 'user_id,restaurant_id' })
    if (err) { setError(err.message); setSubmitting(false); throw err }
    await fetchReviews()
    setSubmitting(false)
  }, [restaurantId, fetchReviews])

  const submitReply = useCallback(async (reviewId: string, reply: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { error: err } = await supabase.from('restaurant_review_replies').upsert({
      review_id: reviewId,
      restaurant_id: user.id,
      reply,
    }, { onConflict: 'review_id' })
    if (err) throw err
    await fetchReviews()
  }, [fetchReviews])

  const deleteReview = useCallback(async (reviewId: string) => {
    await supabase.from('restaurant_reviews').delete().eq('id', reviewId)
    await fetchReviews()
  }, [fetchReviews])

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null

  return { reviews, loading, submitting, error, submitReview, submitReply, deleteReview, avgRating, refresh: fetchReviews }
}
