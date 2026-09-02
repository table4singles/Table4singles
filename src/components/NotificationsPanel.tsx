import { X, Bell } from 'lucide-react'
import type { Notification } from '@/types/database'
import { resolveDateLocale } from '@/lib/dateLocale'

interface NotificationsPanelProps {
  notifications: Notification[]
  onMarkAllRead: () => void
  onClose: () => void
  t: (key: string) => string
  language: string
}

function metaStr(metadata: Record<string, unknown> | null, key: string): string {
  const v = metadata?.[key]
  return typeof v === 'string' || typeof v === 'number' ? String(v) : ''
}

function formatShortDate(metadata: Record<string, unknown> | null, locale: string): string {
  const iso = metadata?.date
  if (typeof iso !== 'string') return ''
  const d = new Date(`${iso}T00:00:00`)
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })
}

/** Traduce título/cuerpo de una notificación a partir de `type` + `metadata`.
 *  title/body en la fila son un fallback en español (notificaciones antiguas,
 *  o `type` sin soporte todavía en este panel). */
function getNotificationText(n: Notification, t: (key: string) => string, locale: string): { title: string; body: string } {
  const m = n.metadata
  const name = metaStr(m, 'name')
  const restaurant = metaStr(m, 'restaurant')
  const rating = metaStr(m, 'rating')
  const city = metaStr(m, 'city')
  const time = metaStr(m, 'time')
  const date = formatShortDate(m, locale)
  const someone = t('notifications.types.someone')

  switch (n.type) {
    case 'new_participant':
      return { title: t('notifications.types.newParticipant.title'), body: t('notifications.types.newParticipant.body').replace('{name}', name || someone).replace('{restaurant}', restaurant) }
    case 'invitation':
      return { title: t('notifications.types.invitation.title'), body: t('notifications.types.invitation.body').replace('{name}', name || someone).replace('{restaurant}', restaurant) }
    case 'invitation_accepted':
      return { title: t('notifications.types.invitationAccepted.title'), body: t('notifications.types.invitationAccepted.body').replace('{name}', name || someone) }
    case 'invitation_declined':
      return { title: t('notifications.types.invitationDeclined.title'), body: t('notifications.types.invitationDeclined.body').replace('{name}', name || someone) }
    case 'new_review':
      return { title: t('notifications.types.newReview.title'), body: t('notifications.types.newReview.body').replace('{rating}', rating) }
    case 'table_cancelled':
      return { title: t('notifications.types.tableCancelled.title'), body: t('notifications.types.tableCancelled.body').replace('{restaurant}', restaurant) }
    case 'reminder_guest':
      return { title: t('notifications.types.reminderGuest.title'), body: t('notifications.types.reminderGuest.body').replace('{restaurant}', restaurant).replace('{date}', date).replace('{time}', time) }
    case 'reminder_host':
      return { title: t('notifications.types.reminderHost.title'), body: t('notifications.types.reminderHost.body').replace('{restaurant}', restaurant).replace('{time}', time) }
    case 'new_restaurant_review':
      return { title: t('notifications.types.newRestaurantReview.title'), body: t('notifications.types.newRestaurantReview.body').replace('{name}', name || someone).replace('{rating}', rating) }
    case 'updated_restaurant_review':
      return { title: t('notifications.types.updatedRestaurantReview.title'), body: t('notifications.types.updatedRestaurantReview.body').replace('{name}', name || someone).replace('{rating}', rating) }
    case 'participant_left':
      return { title: t('notifications.types.participantLeft.title'), body: t('notifications.types.participantLeft.body').replace('{name}', name || someone).replace('{restaurant}', restaurant) }
    case 'review_reply':
      return { title: t('notifications.types.reviewReply.title'), body: t('notifications.types.reviewReply.body').replace('{restaurant}', restaurant || t('notifications.types.theRestaurant')) }
    case 'removed_from_table':
      return { title: t('notifications.types.removedFromTable.title'), body: t('notifications.types.removedFromTable.body').replace('{restaurant}', restaurant) }
    case 'table_match':
      return { title: t('notifications.types.tableMatch.title'), body: t('notifications.types.tableMatch.body').replace('{restaurant}', restaurant).replace('{date}', date).replace('{city}', city) }
    case 'waitlist_spot_open':
      return { title: t('notifications.types.waitlistSpotOpen.title'), body: t('notifications.types.waitlistSpotOpen.body').replace('{restaurant}', restaurant).replace('{date}', date) }
    case 'special_guest_proposed':
      return name
        ? { title: t('notifications.types.specialGuest.title'), body: t('notifications.types.specialGuest.bodyNamed').replace('{name}', name) }
        : { title: t('notifications.types.specialGuest.title'), body: t('notifications.types.specialGuest.bodyUnnamed') }
    default:
      return { title: n.title, body: n.body }
  }
}

export function NotificationsPanel({ notifications, onMarkAllRead, onClose, t, language }: NotificationsPanelProps) {
  const locale = resolveDateLocale(language)
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 w-80 max-h-[400px] overflow-hidden z-50 animate-fade-in">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">{t('notifications.title')}</h3>
          <div className="flex items-center gap-2">
            {notifications.some(n => !n.read) && (
              <button onClick={onMarkAllRead} className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                {t('notifications.markAll')}
              </button>
            )}
            <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto max-h-[340px]">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-gray-400 dark:text-gray-500">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('notifications.empty')}</p>
            </div>
          ) : (
            notifications.map(n => {
              const { title, body } = getNotificationText(n, t, locale)
              return (
                <div key={n.id} className={`px-4 py-3 border-b border-gray-50 dark:border-gray-800 ${!n.read ? 'bg-primary-50/30' : ''}`}>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{body}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(n.created_at).toLocaleDateString(locale)}</p>
                </div>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}
