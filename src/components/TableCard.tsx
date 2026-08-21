import { Users } from 'lucide-react'
import { useState } from 'react'
import type { DiningTable } from '@/types/database'
import type { TableParticipantBasic } from '@/hooks/useRestaurants'
import { CommensalModal } from '@/components/CommensalModal'
import { useLanguage } from '@/contexts/LanguageContext'
import { appLocale } from '@/lib/locale'

interface TableCardProps {
  table: DiningTable
  participants?: TableParticipantBasic[]
  onClick: () => void
}

export function TableCard({ table, participants, onClick }: TableCardProps) {
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
      <button
        onClick={onClick}
        className="w-full text-left bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-[#e94560]/30 hover:shadow-md transition-all group px-5 py-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
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
                        className="relative w-7 h-7 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-600 overflow-hidden flex items-center justify-center flex-shrink-0 hover:scale-110 transition-transform"
                        title={p.profiles?.display_name ?? ''}
                      >
                        {p.profiles?.avatar_url
                          ? <img src={p.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                          : <span className="text-[10px] font-bold text-gray-500 dark:text-gray-300">
                              {(p.profiles?.display_name ?? '?').charAt(0).toUpperCase()}
                            </span>
                        }
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
      </button>

      {modalProfile && (
        <CommensalModal
          profile={modalProfile}
          onClose={() => setModalProfile(null)}
        />
      )}
    </>
  )
}
