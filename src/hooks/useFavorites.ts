import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export function useFavorites() {
  const { user } = useAuth()
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavoriteIds(new Set())
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error } = await supabase.from('favorites').select('restaurant_id').eq('user_id', user.id)
    if (!error && data) setFavoriteIds(new Set(data.map(f => f.restaurant_id)))
    setLoading(false)
  }, [user])

  useEffect(() => { fetchFavorites() }, [fetchFavorites])

  const isFavorite = useCallback((restaurantId: string) => favoriteIds.has(restaurantId), [favoriteIds])

  const toggleFavorite = useCallback(async (restaurantId: string) => {
    if (!user) return
    const currentlyFavorite = favoriteIds.has(restaurantId)

    setFavoriteIds(prev => {
      const next = new Set(prev)
      if (currentlyFavorite) next.delete(restaurantId)
      else next.add(restaurantId)
      return next
    })

    if (currentlyFavorite) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('restaurant_id', restaurantId)
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, restaurant_id: restaurantId })
    }
  }, [user, favoriteIds])

  return { favoriteIds, isFavorite, toggleFavorite, loading, refresh: fetchFavorites }
}
