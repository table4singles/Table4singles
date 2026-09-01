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
            notifications.map(n => (
              <div key={n.id} className={`px-4 py-3 border-b border-gray-50 dark:border-gray-800 ${!n.read ? 'bg-primary-50/30' : ''}`}>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{n.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.body}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{new Date(n.created_at).toLocaleDateString(locale)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
