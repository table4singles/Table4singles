import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported'

export function usePushSubscription() {
  const { user } = useAuth()
  const [permission, setPermission] = useState<PushPermission>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSupported =
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window

  useEffect(() => {
    if (!isSupported) {
      setPermission('unsupported')
      return
    }
    setPermission(Notification.permission as PushPermission)
  }, [isSupported])

  const subscribe = useCallback(async () => {
    if (!user || !VAPID_PUBLIC_KEY || !isSupported) return
    setLoading(true)
    setError(null)

    try {
      // Request notification permission
      const perm = await Notification.requestPermission()
      setPermission(perm as PushPermission)

      if (perm !== 'granted') {
        setError('Permiso denegado. Actívalo en los ajustes del navegador.')
        setLoading(false)
        return
      }

      // Register the service worker
      const registration = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      // Subscribe to Web Push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      const json = subscription.toJSON() as {
        endpoint: string
        keys: { p256dh: string; auth: string }
      }

      // Persist in Supabase
      const { error: dbErr } = await supabase.from('push_subscriptions').upsert(
        {
          user_id: user.id,
          endpoint: json.endpoint,
          p256dh: json.keys.p256dh,
          auth: json.keys.auth,
        },
        { onConflict: 'user_id,endpoint' }
      )

      if (dbErr) throw dbErr

      setSubscribed(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al activar notificaciones')
    } finally {
      setLoading(false)
    }
  }, [user, isSupported])

  const unsubscribe = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      const sub = await reg?.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('endpoint', sub.endpoint)
      }
      setSubscribed(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al desactivar')
    } finally {
      setLoading(false)
    }
  }, [user])

  return { permission, subscribed, loading, error, isSupported, subscribe, unsubscribe }
}
