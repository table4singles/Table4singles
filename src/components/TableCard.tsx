import { MapPin, Clock, Users, ChevronRight } from 'lucide-react'
import type { DiningTable } from '@/types/database'
import type { TableParticipantBasic } from '@/hooks/useRestaurants'
import { useLanguage } from '@/contexts/LanguageContext'

interface TableCardProps {
  table: DiningTable
  participants?: TableParticipantBasic[]
  onClick: () => void
}

export function TableCard({ table, participants, onClick }: TableCardProps) {
  const { t, language } = useLanguage()
  const isFull = table.status === 'full' || table.available_seats <= 0
  const locale = language === 'de' ? 'de-DE' : language === 'en' ? 'en-GB' : 'es-ES'

  const formattedDate = new Date(table.date + 'T12:00:00').toLocaleDateString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  const formattedTime = table.time ? table.time.slice(0, 5) : null

  const approved = (participants ?? []).filter(p => p.status === 'approved')
  const visibleAvatars = approved.slice(0, 5)
  const extraCount = approved.length - visibleAvatars.length

  return (
    <button onClick={onClick} className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md hover:border-gray-200 dark:hover:border-gray-500 transition-all text-left group">
      <div className="relative h-40 bg-gray-100 dark:bg-gray-700">
        <img
          src={table.restaurant_image_url || 'https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=600'}
          alt={table.restaurant_name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${isFull ? 'bg-gray-900/70 text-white' : 'bg-green-500/90 text-white'}`}>
            {isFull ? t('card.full') : t('card.available')}
          </span>
          {table.cuisine_type && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-white dark:bg-gray-800/90 text-gray-700 dark:text-gray-200">
              {table.cuisine_type}
            </span>
          )}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors truncate">
          {table.restaurant_name}
        </h3>
        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{table.restaurant_city}{table.restaurant_country ? `, ${table.restaurant_country}` : ''}</span>
        </div>

        {/* Comensales ya apuntados */}
        {approved.length > 0 && (
          <div className="flex items-center gap-2 mt-3">
            <div className="flex -space-x-2">
              {visibleAvatars.map((p, i) => (
                <div
                  key={p.user_id}
                  style={{ zIndex: visibleAvatars.length - i }}
                  className="relative w-7 h-7 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-600 overflow-hidden flex items-center justify-center flex-shrink-0"
                  title={p.profiles?.display_name ?? ''}
                >
                  {p.profiles?.avatar_url
                    ? <img src={p.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    : <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-300">
                        {(p.profiles?.display_name ?? '?').charAt(0).toUpperCase()}
                      </span>
                  }
                </div>
              ))}
              {extraCount > 0 && (
                <div className="relative w-7 h-7 rounded-full border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-gray-500 dark:text-gray-300">
                  +{extraCount}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {approved.length === 1 ? '1 comensal' : `${approved.length} comensales`}
            </span>
          </div>
        )}
        {approved.length === 0 && (
          <p className="mt-3 text-xs text-gray-400 dark:text-gray-500 italic">Sé el primero en unirte</p>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formattedDate}{formattedTime ? ` · ${formattedTime}` : ''}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {table.available_seats}/{table.max_seats}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-primary-500 transition-colors" />
        </div>
      </div>
    </button>
  )
}
