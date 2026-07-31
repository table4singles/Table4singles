import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface DinerTrustScore {
  avgRating: number
  reviewCount: number
}

/** Puntuacion de confianza agregada de un comensal (media + numero de valoraciones). Nunca expone las filas individuales. */
export function useDinerTrustScore(userId: string | null) {
  const [score, setScore] = useState<DinerTrustScore | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }
    setLoading(true)
    supabase
      .rpc('get_diner_trust_score', { p_user_id: userId })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setScore({ avgRating: Number(data[0].avg_rating) || 0, reviewCount: data[0].review_count || 0 })
        }
        setLoading(false)
      })
  }, [userId])

  return { score, loading }
}

interface UseDinerReviewsOptions {
  tableId: string
  onSubmitted?: () => void
}

/** Envio de valoraciones a los co-comensales de una mesa, una vez pasada la cena. */
export function useDinerReviews({ tableId, onSubmitted }: UseDinerReviewsOptions) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alreadyRated, setAlreadyRated] = useState<string[]>([])

  const fetchAlreadyRated = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('diner_reviews')
      .select('reviewee_id')
      .eq('table_id', tableId)
      .eq('reviewer_id', user.id)
    if (data) setAlreadyRated(data.map(r => r.reviewee_id))
  }, [tableId])

  useEffect(() => { fetchAlreadyRated() }, [fetchAlreadyRated])

  const submitRatings = useCallback(async (ratings: Record<string, number>) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    setSubmitting(true)
    setError(null)
    const rows = Object.entries(ratings)
      .filter(([revieweeId, rating]) => rating > 0 && revieweeId !== user.id)
      .map(([reviewee_id, rating]) => ({ table_id: tableId, reviewer_id: user.id, reviewee_id, rating }))

    if (rows.length === 0) {
      setSubmitting(false)
      return
    }

    const { error: err } = await supabase.from('diner_reviews').insert(rows)
    if (err) {
      setError(err.message)
      setSubmitting(false)
      throw err
    }
    await fetchAlreadyRated()
    setSubmitting(false)
    onSubmitted?.()
  }, [tableId, fetchAlreadyRated, onSubmitted])

  return { submitRatings, submitting, error, alreadyRated }
}
