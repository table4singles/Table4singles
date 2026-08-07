import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { DiningTable, TableParticipant, Profile } from '@/types/database'

export interface AgendaTable extends DiningTable {
  participants: TableParticipant[]
}

export interface NewParticipantNotification {
  id: string
  participant: TableParticipant & { profiles: Profile }
  table: AgendaTable
  timestamp: number
}

export function useRestaurantAgenda(hostId: string | null) {
  const [tables, setTables] = useState<AgendaTable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<NewParticipantNotification[]>([])

  // Ref to avoid stale closures inside Realtime callbacks
  const tablesRef = useRef<AgendaTable[]>([])
  useEffect(() => { tablesRef.current = tables }, [tables])

  const fetchAgenda = useCallback(async () => {
    if (!hostId) return
    setLoading(true)
    setError(null)

    const { data: tablesData, error: tablesErr } = await supabase
      .from('dining_tables')
      .select('*')
      .eq('host_id', hostId)
      .order('date', { ascending: true })
      .order('time', { ascending: true })

    if (tablesErr) {
      setError(tablesErr.message)
      setLoading(false)
      return
    }

    const ids = (tablesData || []).map(t => t.id)
    let participantsByTable: Record<string, TableParticipant[]> = {}

    if (ids.length > 0) {
      const { data: partsData, error: partsErr } = await supabase
        .from('table_participants')
        .select('*, profiles(*)')
        .in('table_id', ids)

      if (partsErr) {
        setError(partsErr.message)
      } else {
        participantsByTable = (partsData || []).reduce((acc: Record<string, TableParticipant[]>, p) => {
          acc[p.table_id] = acc[p.table_id] || []
          acc[p.table_id].push(p)
          return acc
        }, {})
      }
    }

    setTables((tablesData || []).map(t => ({ ...t, participants: participantsByTable[t.id] || [] })))
    setLoading(false)
  }, [hostId])

  useEffect(() => { fetchAgenda() }, [fetchAgenda])

  // Supabase Realtime: listen to dining_tables updates (filtered by host_id)
  // When available_seats decreases → someone joined → re-fetch participants for that table
  useEffect(() => {
    if (!hostId) return

    const channel = supabase
      .channel(`restaurant-agenda-${hostId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'dining_tables',
          filter: `host_id=eq.${hostId}`,
        },
        async (payload) => {
          const updated = payload.new as DiningTable
          const prevTable = tablesRef.current.find(t => t.id === updated.id)

          // Merge updated table data immediately
          setTables(current =>
            current.map(t => (t.id === updated.id ? { ...t, ...updated } : t))
          )

          // Refetch participants on any seat change (join OR cancellation)
          const prevSeats = prevTable?.available_seats ?? updated.available_seats
          if (prevTable && updated.available_seats !== prevSeats) {
            const { data: partsData } = await supabase
              .from('table_participants')
              .select('*, profiles(*)')
              .eq('table_id', updated.id)

            if (partsData) {
              setTables(current =>
                current.map(t =>
                  t.id === updated.id ? { ...t, participants: partsData } : t
                )
              )

              // New join: available_seats went DOWN → show live toast + push
              if (updated.available_seats < prevSeats) {
                const prevIds = new Set((prevTable.participants || []).map(p => p.id))
                const newPart = partsData.find(p => !prevIds.has(p.id))

                if (newPart?.profiles) {
                  const notifId = `${newPart.id}-${Date.now()}`
                  setNotifications(current => [
                    ...current,
                    {
                      id: notifId,
                      participant: newPart as TableParticipant & { profiles: Profile },
                      table: { ...updated, participants: partsData },
                      timestamp: Date.now(),
                    },
                  ])

                  supabase.functions
                    .invoke('send-push-notification', {
                      body: {
                        host_id: hostId,
                        participant_profile: newPart.profiles,
                        table: { ...updated, participants: partsData },
                      },
                    })
                    .catch(() => { /* silent — push is best-effort */ })
                }
              }
            }
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [hostId])

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const byDate = useMemo(() => {
    const map: Record<string, AgendaTable[]> = {}
    for (const table of tables) {
      map[table.date] = map[table.date] || []
      map[table.date].push(table)
    }
    return map
  }, [tables])

  const datesWithTables = useMemo(() => Object.keys(byDate).sort(), [byDate])

  return {
    tables,
    byDate,
    datesWithTables,
    loading,
    error,
    refresh: fetchAgenda,
    notifications,
    dismissNotification,
  }
}
