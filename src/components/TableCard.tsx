import { Users, Sparkles } from 'lucide-react'
import { useState } from 'react'
import type { DiningTable } from '@/types/database'
import type { TableParticipantBasic } from '@/hooks/useRestaurants'
import { CommensalModal } from '@/components/CommensalModal'
import { Avatar } from '@/components/Avatar'
import { useLanguage } from '@/contexts/LanguageContext'
import { appLocale } from '@/lib/locale'

interface TableCardProps {
  table: DiningTable
  participants?: TableParticipantBasic[]
  onClick: () => void
  /** Muestra cabecera con foto/nombre/cocina del restaurante — para listados que
   * cruzan mesas de varios restaurantes (p.ej. "Próximas Cenas"), donde el
   * restaurante no es ya obvio por el contexto de la página. */
  showRestaurant?: boolean
}

export function TableCard({ table, participants, onClick, showRestaurant }: TableCardProps) {
  const { t, language } = useLanguage()
  const [modalProfile, setModalProfile] = useState<{ id?: string; display_name: string | null; avatar_url: string | null } | null>(null)

  const isFull = table.status === 'full' || table.available_seats <= 0
  const occupied = table.max_seats - table.available_seats

  const formattedDate = new Date(table.date + 'T12:00:00').toLocaleDateString(appLocale(language), {
    weekday: 'short', day: 'numeric', month: 'short',
  })
  const formattedTime = table.time ? table.time.slice(0, 5) : null

  const approved = (participants ?? []).filter(p => p.status === 'approved')
  const visibleAvatars = approved.slice(0, 4)
  const extraCount = approved.length - visibleAvatars.length

  const handleAvatarClick = (e: React.MouseEvent, p: TableParticipantBasic) => {
    e.stopPropagation()
    if (p.profiles) setModalProfile(p.profiles)
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
        className="w-full text-left bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-[#129a93]/30 hover:shadow-md transition-all group overflow-hidden cursor-pointer"
      >
        {showRestaurant && (
          <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-gray-100 dark:border-gray-700">
            {table.restaurant_image_url ? (
              <img src={table.restaurant_image_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center flex-shrink-0 text-primary-500 dark:text-primary-400 font-display font-bold text-sm">
                {table.restaurant_name?.[0]?.toUpperCase() ?? '?'}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{table.restaurant_name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                {[table.cuisine_type, table.restaurant_city].filter(Boolean).join(' · ')}
              </p>
            </div>
          </div>
        )}
        <div className="flex items-start justify-between gap-3 px-5 py-4">
          <div className="flex-1 min-w-0">
            {table.is_special && (
              <div className="inline-flex items-center gap-1 mb-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-[#129a93]/15 to-gold-400/15 text-[#129a93] dark:text-[#3abfb7]">
                <Sparkles className="w-3 h-3 flex-shrink-0" />
                <span className="text-[11px] font-bold uppercase tracking-wide truncate">
                  {table.special_guest_name || t('specialGuest.badge')}
                </span>
              </div>
            )}
            {/* Time + date */}
            <div className="flex items-center gap-2 mb-2">
              {formattedTime && (
                <span className="text-base font-bold text-gray-900 dark:text-white">{formattedTime}</span>
              )}
              <span className="text-sm text-gray-500 dark:text-gray-400">{formattedDate}</span>
            </div>

            {/* Zone / description */}
            {table.description && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">{table.description}</p>
            )}

            {/* Avatars + occupancy */}
            <div className="flex items-center gap-2.5">
              {approved.length > 0 ? (
                <>
                  <div className="flex -space-x-2">
                    {visibleAvatars.map((p, i) => (
                      <button
                        key={p.user_id}
                        onClick={e => handleAvatarClick(e, p)}
                        style={{ zIndex: visibleAvatars.length - i }}
                        className="relative w-7 h-7 rounded-full border-2 border-white dark:border-gray-800 overflow-hidden flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform"
                        title={p.profiles?.display_name ?? ''}
                      >
                        <Avatar src={p.profiles?.avatar_url} name={p.profiles?.display_name} className="w-full h-full" textClassName="text-[10px]" />
                      </button>
                    ))}
                    {extraCount > 0 && (
                      <div className="relative w-7 h-7 rounded-full border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-gray-500 dark:text-gray-300">
                        +{extraCount}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {approved.length === 1
                      ? `1 ${t('card.diner')}`
                      : `${approved.length} ${t('card.diners')}`}
                  </span>
                </>
              ) : (
                <span className="text-xs text-gray-400 dark:text-gray-500 italic">{t('card.beFirstJoin')}</span>
              )}
            </div>
          </div>

          {/* Right: status + seats */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isFull ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400'}`}>
              {isFull ? t('card.full') : t('card.available')}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Users className="w-3.5 h-3.5" />
              {isFull ? `${table.max_seats}/${table.max_seats}` : `${occupied}/${table.max_seats}`}
            </span>
          </div>
        </div>
      </div>

      {modalProfile && (
        <CommensalModal
          profile={modalProfile}
          onClose={() => setModalProfile(null)}
        />
      )}
    </>
  )
}
