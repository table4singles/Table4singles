import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

/** Eventos del funnel principal (Sección 60 de la spec de producto). Solo captura
 * — sin dashboard todavía, eso es P1. Falla en silencio: nunca debe romper la UI. */
export type AnalyticsEventName =
  | 'TABLE_VIEW'
  | 'RESERVATION_STARTED'
  | 'RESERVATION_COMPLETED'
  | 'INVITATION_CREATED'
  | 'INVITATION_CLICKED'
  | 'REFERRED_SIGNUP'
  | 'DEMAND_REQUEST_CREATED'

export function useAnalytics() {
  const { user } = useAuth()

  const track = useCallback((eventName: AnalyticsEventName, metadata?: Record<string, unknown>) => {
    supabase.from('analytics_events').insert({
      event_name: eventName,
      user_id: user?.id ?? null,
      metadata: metadata ?? {},
    }).then(({ error }) => {
      if (error) console.warn('trackEvent failed', eventName, error.message)
    })
  }, [user])

  return { track }
}
