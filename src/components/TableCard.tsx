import { MapPin, Clock, Users, ChevronRight } from 'lucide-react'
import type { DiningTable } from '@/types/database'
import { useLanguage } from '@/contexts/LanguageContext'

interface TableCardProps {
  table: DiningTable
  onClick: () => void
}

export function TableCard({ table, onClick }: TableCardProps) {
  const { t, language } = useLanguage()
  const isFull = table.status === 'full' || table.available_seats <= 0
  const locale = language === 'de' ? 'de-DE' : language === 'en' ? 'en-GB' : 'es-ES'

  const formattedDate = new Date(table.date).toLocaleDateString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  const formattedTime = table.time ? table.time.slice(0, 5) : null

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
