import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { DiningTable, TableParticipant, Profile } from '@/types/database'

interface UseTablesOptions {
  city?: string
  cuisine?: string[]
  language?: string
  search?: string
  status?: string
}

export function useTables(options: UseTablesOptions = {}) {
  const [tables, setTables] = useState<DiningTable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const cuisineKey = options.cuisine?.join(',') ?? ''

  const fetchTables = useCallback(async () => {
    setLoading(true)
    setError(null)
    let query = supabase
      .from('dining_tables')
      .select('*')
      .eq('status', options.status || 'open')
      .eq('is_active', true)
      .order('date', { ascending: true })

    if (options.city) query = query.eq('restaurant_city', options.city)
    if (options.cuisine && options.cuisine.length > 0) query = query.in('cuisine_type', options.cuisine)
    if (options.search) {
      query = query.or(`restaurant_name.ilike.%${options.search}%,restaurant_city.ilike.%${options.search}%`)
    }

    const { data, error: err } = await query
    if (!err) setTables(data || [])
    else setError(err.message)
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.city, cuisineKey, options.search, options.status])

  useEffect(() => { fetchTables() }, [fetchTables])

  return { tables, loading, error, refresh: fetchTables }
}

export function useTableDetail(tableId: string | null) {
  const [table, setTable] = useState<DiningTable | null>(null)
  const [participants, setParticipants] = useState<TableParticipant[]>([])
  const [hostProfile, setHostProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTable = useCallback(async () => {
    if (!tableId) return
    setLoading(true)
    setError(null)

    const [tableRes, partRes] = await Promise.all([
      supabase.from('dining_tables').select('*').eq('id', tableId).single(),
      supabase.from('table_participants').select('*, profiles(*)').eq('table_id', tableId),
    ])

    if (!tableRes.error) setTable(tableRes.data)
    else setError(tableRes.error.message)
    if (!partRes.error) setParticipants(partRes.data || [])

    if (!tableRes.error && tableRes.data) {
      const { data: hostData } = await supabase.from('profiles').select('*').eq('id', tableRes.data.host_id).single()
      setHostProfile(hostData || null)
    }
    setLoading(false)
  }, [tableId])

  useEffect(() => { fetchTable() }, [fetchTable])

  // Realtime: actualizar participantes al instante cuando el webhook de Stripe los inserta
  useEffect(() => {
    if (!tableId) return

    const channel = supabase
      .channel(`table-detail-${tableId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'table_participants', filter: `table_id=eq.${tableId}` },
        () => { fetchTable() }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'dining_tables', filter: `id=eq.${tableId}` },
        () => { fetchTable() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [tableId, fetchTable])

  const joinTable = useCallback(async (joinType: 'word' | 'deposit' = 'word') => {
    if (!tableId) throw new Error('No table selected')
    const { error: err } = await supabase.rpc('join_table', { p_table_id: tableId, p_join_type: joinType })
    if (err) throw err
    await fetchTable()
  }, [tableId, fetchTable])

  const cancelTable = useCallback(async () => {
    if (!tableId) throw new Error('No table selected')
    const { error: err } = await supabase.from('dining_tables').update({ status: 'cancelled' }).eq('id', tableId)
    if (err) throw err
    await fetchTable()
  }, [tableId, fetchTable])

  return { table, participants, hostProfile, loading, error, refresh: fetchTable, joinTable, cancelTable }
}

export function useMyTables(userId: string | null) {
  const [hosting, setHosting] = useState<DiningTable[]>([])
  const [reservations, setReservations] = useState<(TableParticipant & { dining_tables: DiningTable })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMyTables = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError(null)

    const [hostRes, resRes] = await Promise.all([
      supabase.from('dining_tables').select('*').eq('host_id', userId).order('date', { ascending: false }),
      supabase.from('table_participants').select('*, dining_tables(*)').eq('user_id', userId).order('created_at', { ascending: false }),
    ])

    if (!hostRes.error) setHosting(hostRes.data || [])
    else setError(hostRes.error.message)
    if (!resRes.error) setReservations((resRes.data as any) || [])
    else setError(resRes.error.message)
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchMyTables() }, [fetchMyTables])

  const cancelHostedTable = useCallback(async (tableId: string) => {
    const { error: err } = await supabase.from('dining_tables').update({ status: 'cancelled' }).eq('id', tableId)
    if (err) throw err
    await fetchMyTables()
  }, [fetchMyTables])

  const cancelReservation = useCallback(async (participantId: string) => {
    const { error: err } = await supabase.rpc('cancel_reservation', { p_participant_id: participantId })
    if (err) throw err
    await fetchMyTables()
  }, [fetchMyTables])

  const toggleActive = useCallback(async (tableId: string, isActive: boolean) => {
    setHosting(current => current.map(t => (t.id === tableId ? { ...t, is_active: isActive } : t)))
    const { error: err } = await supabase.from('dining_tables').update({ is_active: isActive }).eq('id', tableId)
    if (err) {
      setHosting(current => current.map(t => (t.id === tableId ? { ...t, is_active: !isActive } : t)))
      throw err
    }
  }, [])

  return { hosting, reservations, loading, error, refresh: fetchMyTables, cancelHostedTable, cancelReservation, toggleActive }
}
