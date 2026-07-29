import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Invitation, Profile } from '@/types/database'

export function useInvitations(userId: string | null) {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInvitations = useCallback(async () => {
    if (!userId) return
    setError(null)
    const { data, error: err } = await supabase
      .from('invitations')
      .select('*')
      .eq('invitee_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    if (!err) setInvitations(data || [])
    else setError(err.message)
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchInvitations() }, [fetchInvitations])

  const searchUsers = useCallback(async (query: string): Promise<Profile[]> => {
    if (!query.trim()) return []
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .or(`display_name.ilike.%${query}%,email.ilike.%${query}%`)
      .neq('id', userId ?? '')
      .limit(10)
    if (err) throw err
    return data || []
  }, [userId])

  const sendInvitation = useCallback(async (tableId: string, inviteeId: string, paymentCovered: boolean) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { error: err } = await supabase.from('invitations').insert({
      table_id: tableId,
      inviter_id: user.id,
      invitee_id: inviteeId,
      payment_covered: paymentCovered,
    })
    if (err) throw err
  }, [])

  const respondInvitation = useCallback(async (invitationId: string, accept: boolean) => {
    const { data: inv, error: fetchErr } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitationId)
      .single()
    if (fetchErr || !inv) throw new Error('Invitation not found')

    const { error: err } = await supabase.from('invitations').update({
      status: accept ? 'accepted' : 'declined',
      updated_at: new Date().toISOString(),
    }).eq('id', invitationId)
    if (err) throw err

    if (accept) {
      // El cobro de depósito para invitados que pagan su propia parte se conecta
      // en la Fase de integración con Stripe; por ahora la plaza se confirma bajo palabra.
      const { error: joinErr } = await supabase.rpc('join_table', {
        p_table_id: inv.table_id,
        p_join_type: 'word',
      })
      if (joinErr) throw joinErr
    }

    await fetchInvitations()
  }, [fetchInvitations])

  return { invitations, loading, error, searchUsers, sendInvitation, respondInvitation, refresh: fetchInvitations }
}
