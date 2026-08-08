import { useState } from 'react'
import { Loader2, CalendarX, Plus, Bell, BellOff, Users, MapPin, CalendarDays, ToggleLeft, ToggleRight, ChevronRight } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { LiveNotificationStack } from '@/components/LiveNotificationToast'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { useRestaurantAgenda, type AgendaTable } from '@/hooks/useRestaurantAgenda'
import { usePushSubscription } from '@/hooks/usePushSubscription'

interface RestaurantAgendaPageProps {
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

type AgendaTab = 'active' | 'inactive'

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Table card with toggle ───────────────────────────────────────────────────

interface TableCardProps {
  table: AgendaTable
  onNavigate: (page: string, id?: string) => void
  onToggle: (id: string, active: boolean) => void
  toggling: string | null
}

function TableCard({ table, onNavigate, onToggle, toggling }: TableCardProps) {
  const occupied = table.max_seats - table.available_seats
  const isBusy = toggling === table.id
  const isActive = table.is_active

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border transition-all ${
      isActive
        ? 'border-gray-100 dark:border-gray-700 shadow-sm'
        : 'border-gray-200 dark:border-gray-700 opacity-60'
    }`}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Info */}
          <button
            onClick={() => onNavigate('table-detail', table.id)}
            className="flex-1 text-left min-w-0"
          >
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {table.description || 'Sin zona especificada'}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 ml-auto" />
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {occupied}/{table.max_seats} comensales
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3 h-3" />
                Desde {formatDate(table.date)}
              </span>
              {table.available_until && (
                <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  hasta {formatDate(table.available_until)}
                </span>
              )}
            </div>

            {/* Occupancy bar */}
            <div className="mt-2 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  occupied >= table.max_seats ? 'bg-blue-500' :
                  occupied / table.max_seats > 0.75 ? 'bg-amber-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${Math.max(4, (occupied / table.max_seats) * 100)}%` }}
              />
            </div>
          </button>

          {/* Toggle */}
          <button
            onClick={() => onToggle(table.id, !isActive)}
            disabled={isBusy}
            className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5"
            title={isActive ? 'Desactivar mesa' : 'Activar mesa'}
          >
            {isBusy ? (
              <Loader2 className="w-7 h-7 animate-spin text-gray-400" />
            ) : isActive ? (
              <ToggleRight className="w-8 h-8 text-green-500" />
            ) : (
              <ToggleLeft className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            )}
            <span className={`text-[10px] font-medium leading-none ${isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
              {isActive ? 'Activa' : 'Inactiva'}
            </span>
          </button>
        </div>

        {/* Participants */}
        {table.participants.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-50 dark:border-gray-700">
            <div className="flex -space-x-2">
              {table.participants.slice(0, 5).map(p => (
                <div key={p.id} className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-600 border-2 border-white dark:border-gray-800 overflow-hidden flex-shrink-0">
                  {p.profiles?.avatar_url ? (
                    <img src={p.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-gray-400">
                      {(p.profiles?.display_name ?? '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
              {table.participants.length} {table.participants.length === 1 ? 'comensal' : 'comensales'} apuntado{table.participants.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function RestaurantAgendaPage({ onNavigate, onAuthClick }: RestaurantAgendaPageProps) {
  const { t } = useLanguage()
  const { user, profile } = useAuth()
  const { tables, loading, error, notifications, dismissNotification, toggleActive } =
    useRestaurantAgenda(user?.id ?? null)

  const push = usePushSubscription()
  const [tab, setTab] = useState<AgendaTab>('active')
  const [toggling, setToggling] = useState<string | null>(null)

  const activeTables = tables.filter(t => t.is_active)
  const inactiveTables = tables.filter(t => !t.is_active)
  const shownTables = tab === 'active' ? activeTables : inactiveTables

  if (profile && profile.role !== 'restaurant') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar currentPage="agenda" onNavigate={onNavigate} onAuthClick={onAuthClick} />
        <div className="text-center py-20">
          <p className="text-gray-500 dark:text-gray-400">{t('agenda.restaurantOnly')}</p>
        </div>
      </div>
    )
  }

  const handleToggle = async (id: string, active: boolean) => {
    setToggling(id)
    await toggleActive(id, active)
    setToggling(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar currentPage="agenda" onNavigate={onNavigate} onAuthClick={onAuthClick} />

      <LiveNotificationStack notifications={notifications} onDismiss={dismissNotification} t={t} />

      <main className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Mis mesas</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
              {activeTables.length} activa{activeTables.length !== 1 ? 's' : ''} · {inactiveTables.length} inactiva{inactiveTables.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {push.isSupported && push.permission !== 'denied' && (
              <button
                onClick={push.subscribed ? push.unsubscribe : push.subscribe}
                disabled={push.loading}
                title={push.subscribed ? 'Desactivar notificaciones push' : 'Activar notificaciones push'}
                className={`p-2 rounded-xl text-sm font-medium transition-colors ${
                  push.subscribed
                    ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {push.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : push.subscribed ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </button>
            )}
            <button
              onClick={() => onNavigate('create')}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#e94560] text-white rounded-xl text-sm font-medium hover:bg-[#d63d56] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva mesa</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 mb-5">
          <button
            onClick={() => setTab('active')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'active'
                ? 'bg-[#e94560] text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <ToggleRight className="w-4 h-4" />
            Activas
            {activeTables.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === 'active' ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
                {activeTables.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('inactive')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'inactive'
                ? 'bg-[#e94560] text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <ToggleLeft className="w-4 h-4" />
            Inactivas
            {inactiveTables.length > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${tab === 'inactive' ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'}`}>
                {inactiveTables.length}
              </span>
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl p-3 mb-4">
            {error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#e94560] animate-spin" />
          </div>
        ) : shownTables.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-4 text-gray-400">
              <CalendarX className="w-9 h-9" />
            </div>
            {tab === 'active' ? (
              <>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Sin mesas activas</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Crea una nueva mesa para que los comensales puedan unirse.</p>
                <button
                  onClick={() => onNavigate('create')}
                  className="px-6 py-2.5 bg-[#e94560] text-white rounded-xl text-sm font-medium hover:bg-[#d63d56]"
                >
                  Crear primera mesa
                </button>
              </>
            ) : (
              <>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Sin mesas inactivas</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Todas tus mesas están activas.</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {shownTables.map(table => (
              <TableCard
                key={table.id}
                table={table}
                onNavigate={onNavigate}
                onToggle={handleToggle}
                toggling={toggling}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
