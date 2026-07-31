import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { DiningTable } from '@/types/database'

export interface InvitableTable {
  id: string
  restaurant_name: string
  restaurant_city: string
  date: string
  time: string
  available_seats: number
}

function isFutureTable(t: Pick<DiningTable, 'date' | 'time'>): boolean {
  return new Date(`${t.date}T${t.time}`) >= new Date()
}

function toInvitable(t: DiningTable): InvitableTable {
  return {
    id: t.id,
    restaurant_name: t.restaurant_name,
    restaurant_city: t.restaurant_city,
    date: t.date,
    time: t.time,
    available_seats: t.available_seats,
  }
}

/** Mesas desde las que el usuario puede invitar ahora mismo: como anfitrion, o como participante ya aprobado. Requiere plazas libres y fecha futura. */
export function useInvitableTables(userId: string | null) {
  const [tables, setTables] = useState<InvitableTable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTables = useCallback(async () => {
    if (!userId) {
      setTables([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)

    const [hostRes, participantRes] = await Promise.all([
      supabase.from('dining_tables').select('*').eq('host_id', userId).eq('status', 'open'),
      supabase.from('table_participants').select('*, dining_tables(*)').eq('user_id', userId).eq('status', 'approved'),
    ])

    if (hostRes.error) {
      setError(hostRes.error.message)
      setLoading(false)
      return
    }
    if (participantRes.error) {
      setError(participantRes.error.message)
      setLoading(false)
      return
    }

    const hostedTables = (hostRes.data || [])
      .filter((t): t is DiningTable => t.available_seats > 0 && isFutureTable(t))
      .map(toInvitable)

    const participantTables = (participantRes.data || [])
      .map((p: any) => p.dining_tables as DiningTable | null)
      .filter((t): t is DiningTable => !!t && t.status === 'open' && t.available_seats > 0 && isFutureTable(t))
      .map(toInvitable)

    const byId = new Map<string, InvitableTable>()
    for (const t of [...hostedTables, ...participantTables]) byId.set(t.id, t)

    setTables(Array.from(byId.values()).sort((a, b) => a.date.localeCompare(b.date)))
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchTables() }, [fetchTables])

  return { tables, loading, error, refresh: fetchTables }
}
