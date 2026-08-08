import type { AgendaTable } from '@/hooks/useRestaurantAgenda'
import type { Profile } from '@/types/database'

interface LiveTableCardProps {
  table: AgendaTable
  onNavigate: (page: string, id?: string) => void
  t: (key: string) => string
}

function AvatarStack({ profiles }: { profiles: Profile[] }) {
  const visible = profiles.slice(0, 6)
  const extra = profiles.length - visible.length

  return (
    <div className="flex items-center">
      {visible.map((profile, i) => (
        <div
          key={profile.id}
          title={profile.display_name || profile.full_name || ''}
          className="w-9 h-9 rounded-full border-2 border-white dark:border-gray-800 overflow-hidden bg-gradient-to-br from-[#e94560] to-pink-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
          style={{ marginLeft: i > 0 ? '-10px' : 0, zIndex: visible.length - i }}
        >
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            (profile.display_name || profile.full_name || '?').charAt(0).toUpperCase()
          )}
        </div>
      ))}
      {extra > 0 && (
        <div
          className="w-9 h-9 rounded-full border-2 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 flex-shrink-0"
          style={{ marginLeft: '-10px' }}
        >
          +{extra}
        </div>
      )}
    </div>
  )
}

function EmptySeatSlots({ count }: { count: number }) {
  const shown = Math.min(count, 5)
  const extra = count - shown
  return (
    <div className="flex items-center">
      {Array.from({ length: shown }).map((_, i) => (
        <div
          key={i}
          className="w-9 h-9 rounded-full border-2 border-dashed border-gray-200 dark:border-gray-600 flex-shrink-0"
          style={{ marginLeft: i > 0 ? '-10px' : 0 }}
        />
      ))}
      {extra > 0 && (
        <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">+{extra}</span>
      )}
    </div>
  )
}

const STATUS_BORDER: Record<AgendaTable['status'], string> = {
  open: 'border-green-200 dark:border-green-800',
  full: 'border-blue-200 dark:border-blue-800',
  completed: 'border-gray-200 dark:border-gray-700',
  cancelled: 'border-red-200 dark:border-red-800',
}

const STATUS_LABEL_COLOR: Record<AgendaTable['status'], string> = {
  open: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30',
  full: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30',
  completed: 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700',
  cancelled: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30',
}

function OccupancyFill({ occupied, max, status }: { occupied: number; max: number; status: AgendaTable['status'] }) {
  const pct = max > 0 ? (occupied / max) * 100 : 0
  const barColor =
    status === 'full' ? 'bg-blue-500' :
    status === 'cancelled' ? 'bg-gray-300 dark:bg-gray-600' :
    pct > 75 ? 'bg-amber-500' :
    'bg-green-500'

  return (
    <div className="flex flex-col items-end gap-1.5">
      <span className="text-3xl font-black text-gray-900 dark:text-white leading-none">
        {occupied}
        <span className="text-base font-normal text-gray-400 dark:text-gray-500">/{max}</span>
      </span>
      <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function LiveTableCard({ table, onNavigate, t }: LiveTableCardProps) {
  const occupied = table.max_seats - table.available_seats
  const profiles = table.participants
    .map(p => p.profiles)
    .filter((p): p is Profile => Boolean(p))

  return (
    <div
      onClick={() => onNavigate('table-detail', table.id)}
      className={`bg-white dark:bg-gray-800 rounded-2xl border-2 ${STATUS_BORDER[table.status]} cursor-pointer hover:shadow-lg transition-all duration-200 group`}
    >
      <div className="p-5">
        {/* Top row: time + status + occupancy */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 mb-1">
              {table.status === 'open' && (
                <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                </span>
              )}
              <span className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                {table.time ? table.time.slice(0, 5) : (table.description || '—')}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_LABEL_COLOR[table.status]}`}>
                {t(`agenda.status${table.status.charAt(0).toUpperCase() + table.status.slice(1)}`)}
              </span>
            </div>
            {table.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{table.description}</p>
            )}
          </div>
          <OccupancyFill occupied={occupied} max={table.max_seats} status={table.status} />
        </div>

        {/* Avatar area */}
        <div className="flex items-center justify-between gap-4">
          {profiles.length > 0 ? (
            <AvatarStack profiles={profiles} />
          ) : (
            <span className="text-sm text-gray-400 dark:text-gray-500 italic">
              {t('agenda.noParticipants')}
            </span>
          )}
          {table.available_seats > 0 && table.status !== 'cancelled' && (
            <EmptySeatSlots count={table.available_seats} />
          )}
        </div>
      </div>

      {/* Footer hint */}
      <div className="px-5 py-2.5 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {t('agenda.clickForDetail')}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500 group-hover:text-[#e94560] transition-colors">→</span>
      </div>
    </div>
  )
}
