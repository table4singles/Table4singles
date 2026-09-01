import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

/** Estado de la lista de espera de una mesa para el usuario actual —
 * no la lista completa (eso es cosa del anfitrión/admin), solo si
 * él mismo ya está apuntado y con qué estado. */
export function useWaitlist(tableId: string | null, userId: string | null) {
  const [entry, setEntry] = useState<{ id: string; status: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchEntry = useCallback(async () => {
    if (!tableId || !userId) { setLoading(false); return }
    const { data } = await supabase
      .from('table_waitlist')
      .select('id, status')
      .eq('table_id', tableId)
      .eq('user_id', userId)
      .maybeSingle()
    setEntry(data)
    setLoading(false)
  }, [tableId, userId])

  useEffect(() => { fetchEntry() }, [fetchEntry])

  const join = useCallback(async () => {
    if (!tableId || !userId) return
    const { error } = await supabase.from('table_waitlist').insert({ table_id: tableId, user_id: userId })
    if (error) throw error
    await fetchEntry()
  }, [tableId, userId, fetchEntry])

  const leave = useCallback(async () => {
    if (!entry) return
    const { error } = await supabase.from('table_waitlist').delete().eq('id', entry.id)
    if (error) throw error
    setEntry(null)
  }, [entry])

  return { entry, loading, join, leave, refresh: fetchEntry }
}
