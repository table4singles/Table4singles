import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Message } from '@/types/database'

export function useMessages(tableId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const fetchMessages = useCallback(async () => {
    if (!tableId) return
    const { data } = await supabase
      .from('messages')
      .select('*, profiles(display_name)')
      .eq('table_id', tableId)
      .order('created_at', { ascending: true })
    if (data) setMessages(data as Message[])
    setLoading(false)
  }, [tableId])

  useEffect(() => {
    fetchMessages()

    if (!tableId) return

    const channel = supabase
      .channel(`chat-${tableId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `table_id=eq.${tableId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
    }
  }, [tableId, fetchMessages])

  const sendMessage = useCallback(async (content: string) => {
    if (!tableId) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    const { error } = await supabase.from('messages').insert({
      table_id: tableId,
      sender_id: user.id,
      content,
    })
    if (error) throw error
  }, [tableId])

  return { messages, loading, sendMessage, refresh: fetchMessages }
}
