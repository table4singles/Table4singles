import { useEffect, useRef, useState } from 'react'
import { X, Globe } from 'lucide-react'
import type { NewParticipantNotification } from '@/hooks/useRestaurantAgenda'
import { publicAge } from '@/lib/privacy'
import { Avatar } from '@/components/Avatar'

const AUTO_DISMISS_MS = 9000

interface LiveNotificationToastProps {
  notification: NewParticipantNotification
  onDismiss: (id: string) => void
  t: (key: string) => string
}

export function LiveNotificationToast({ notification, onDismiss, t }: LiveNotificationToastProps) {
  const [progress, setProgress] = useState(100)
  const [visible, setVisible] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { participant, table } = notification
  const profile = participant.profiles
  const age = publicAge(profile)
  const occupied = table.max_seats - table.available_seats
  const displayName = profile.display_name || profile.full_name || 'Usuario'

  function handleDismiss() {
    setVisible(false)
    setTimeout(() => onDismiss(notification.id), 300)
  }

  useEffect(() => {
    // Slide in on next tick
    const showTimer = setTimeout(() => setVisible(true), 30)

    const startTime = Date.now()
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const pct = Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS) * 100)
      setProgress(pct)
      if (pct === 0 && intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }, 50)

    const dismissTimer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onDismiss(notification.id), 300)
    }, AUTO_DISMISS_MS)

    return () => {
      clearTimeout(showTimer)
      clearTimeout(dismissTimer)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [notification.id, onDismiss])

  return (
    <div
      className={`w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300 ease-out ${
        visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-3 opacity-0 scale-95'
      }`}
    >
      {/* Progress bar */}
      <div className="h-1 bg-gray-100 dark:bg-gray-700">
        <div
          className="h-full bg-[#e94560] transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-xs font-bold text-[#e94560] uppercase tracking-wider">
              {t('agenda.newReservation')}
            </span>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-0.5 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Diner profile */}
        <div className="flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <Avatar
              src={profile.avatar_url}
              name={displayName}
              className="w-14 h-14 ring-2 ring-[#e94560]/30"
              textClassName="text-xl"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate">
              {displayName}
              {age && (
                <span className="text-gray-400 dark:text-gray-500 font-normal">, {age}</span>
              )}
            </p>
            {profile.languages && profile.languages.length > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <Globe className="w-3 h-3 text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {profile.languages.slice(0, 3).join(' · ')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Table info */}
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {t('agenda.joinedTable')}{table.time ? <> · <span className="font-medium text-gray-700 dark:text-gray-300">{table.time.slice(0, 5)}</span></> : null}
          </span>
          <span className="text-xs font-bold text-[#e94560] bg-[#e94560]/10 px-2.5 py-1 rounded-full">
            {occupied}/{table.max_seats}
          </span>
        </div>
      </div>
    </div>
  )
}

interface LiveNotificationStackProps {
  notifications: NewParticipantNotification[]
  onDismiss: (id: string) => void
  t: (key: string) => string
}

export function LiveNotificationStack({ notifications, onDismiss, t }: LiveNotificationStackProps) {
  if (notifications.length === 0) return null

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex flex-col gap-3 items-end">
      {notifications.slice(-3).map(n => (
        <LiveNotificationToast key={n.id} notification={n} onDismiss={onDismiss} t={t} />
      ))}
    </div>
  )
}
