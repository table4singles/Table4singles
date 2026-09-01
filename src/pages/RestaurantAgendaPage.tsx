import { useMemo, useState } from 'react'
import { CalendarDays, List, Loader2, CalendarX, Tv2, Plus, Clock, Bell, BellOff } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { PageHeader } from '@/components/PageHeader'
import { AgendaCalendar } from '@/components/AgendaCalendar'
import { AgendaTableCard } from '@/components/AgendaTableCard'
import { LiveTableCard } from '@/components/LiveTableCard'
import { LiveNotificationStack } from '@/components/LiveNotificationToast'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { useViewMode } from '@/contexts/ViewModeContext'
import { useRestaurantAgenda } from '@/hooks/useRestaurantAgenda'
import { usePushSubscription } from '@/hooks/usePushSubscription'
import { resolveDateLocale } from '@/lib/dateLocale'

interface RestaurantAgendaPageProps {
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

type AgendaView = 'live' | 'list' | 'calendar'

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
}

function formatDateHeading(dateStr: string, locale: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const label = date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

// ─── Live Room Tab ────────────────────────────────────────────────────────────

interface LiveRoomProps {
  tables: ReturnType<typeof useRestaurantAgenda>['tables']
  onNavigate: (page: string, id?: string) => void
  t: (key: string) => string
}

function LiveRoom({ tables, onNavigate, t }: LiveRoomProps) {
  const today = todayStr()
  // Mesas cuya disponibilidad incluye hoy (desde date, hasta available_until o sin fin)
  const todayTables = tables.filter(tb => {
    if (tb.date > today) return false
    if (tb.available_until && tb.available_until < today) return false
    return tb.date === today || !tb.time || (tb.date <= today && (!tb.available_until || tb.available_until >= today))
  })
  const activeTables = todayTables.filter(tb => (tb.status === 'open' || tb.status === 'full') && tb.is_active !== false)
  const inactiveTables = todayTables.filter(tb => (tb.status === 'open' || tb.status === 'full') && tb.is_active === false)
  const pastTables = todayTables.filter(tb => tb.status === 'completed' || tb.status === 'cancelled')

  return (
    <div>
      {/* Live header */}
      <div className="flex items-center gap-2 mb-5">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#129a93] opacity-60" />
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#129a93]" />
        </span>
        <span className="text-sm font-bold text-[#129a93] uppercase tracking-wider">{t('agenda.liveNow')}</span>
        <span className="text-sm text-gray-400 dark:text-gray-500">·</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">{t('agenda.todayDate')}</span>
      </div>

      {todayTables.length === 0 ? (
        <div className="text-center py-14 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <div className="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center mx-auto mb-4">
            <Tv2 className="w-8 h-8 text-primary-500 dark:text-primary-400" />
          </div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{t('agenda.noTablesToday')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{t('agenda.noTablesTodayDesc')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeTables.length > 0 && (
            <div className="space-y-3">
              {activeTables.map(table => (
                <LiveTableCard key={table.id} table={table} onNavigate={onNavigate} t={t} />
              ))}
            </div>
          )}
          {inactiveTables.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 mt-2">{t('agenda.deactivated')}</p>
              <div className="space-y-2">
                {inactiveTables.map(table => (
                  <AgendaTableCard key={table.id} table={table} onNavigate={onNavigate} t={t} />
                ))}
              </div>
            </div>
          )}
          {pastTables.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 mt-4">{t('agenda.past')}</p>
              <div className="space-y-2">
                {pastTables.map(table => (
                  <AgendaTableCard key={table.id} table={table} onNavigate={onNavigate} t={t} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Hourly List Tab ──────────────────────────────────────────────────────────

interface HourlyListProps {
  byDate: ReturnType<typeof useRestaurantAgenda>['byDate']
  datesWithTables: string[]
  locale: string
  onNavigate: (page: string, id?: string) => void
  t: (key: string) => string
}

function TimelineSlot({ time, count, max, status, isActive, onClick, t }: {
  time: string
  count: number
  max: number
  status: string
  isActive: boolean
  onClick: () => void
  t: (key: string) => string
}) {
  const pct = max > 0 ? (count / max) * 100 : 0
  const barColor =
    !isActive ? 'bg-gray-300 dark:bg-gray-600' :
    status === 'full' ? 'bg-blue-500' :
    status === 'cancelled' ? 'bg-gray-300 dark:bg-gray-600' :
    pct > 75 ? 'bg-amber-500' :
    'bg-green-500'

  const statusLabel: Record<string, string> = {
    open: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    full: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    completed: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
    cancelled: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  }

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 py-3 px-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group text-left ${!isActive ? 'opacity-55' : ''}`}
    >
      {/* Time */}
      <div className="flex items-center gap-2 w-16 flex-shrink-0">
        <Clock className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{time}</span>
      </div>

      {/* Occupancy bar */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{count}/{max} {t('agenda.seats')}</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} rounded-full transition-all duration-500`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Status chip */}
      {!isActive ? (
        <span className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
          {t('agendaExtra.inactive')}
        </span>
      ) : (
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${statusLabel[status] || ''}`}>
          {count}/{max}
        </span>
      )}
    </button>
  )
}

function HourlyList({ byDate, datesWithTables, locale, onNavigate, t }: HourlyListProps) {
  const today = todayStr()
  const upcoming = datesWithTables.filter(d => d >= today)
  const past = datesWithTables.filter(d => d < today).reverse()

  function renderDate(date: string) {
    const tables = byDate[date]
    return (
      <div key={date} className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 px-1">
          {formatDateHeading(date, locale)}
          {date === today && (
            <span className="ml-2 text-xs text-[#129a93] font-bold">{t('agenda.today')}</span>
          )}
        </h3>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-50 dark:divide-gray-700">
          {tables.map(table => {
            const occupied = table.max_seats - table.available_seats
            return (
              <TimelineSlot
                key={table.id}
                time={table.time ? table.time.slice(0, 5) : (table.description || '—')}
                count={occupied}
                max={table.max_seats}
                status={table.status}
                isActive={table.is_active !== false}
                onClick={() => onNavigate('table-detail', table.id)}
                t={t}
              />
            )
          })}
        </div>
      </div>
    )
  }

  if (datesWithTables.length === 0) return null

  return (
    <div>
      {upcoming.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">{t('agenda.upcoming')}</p>
          {upcoming.map(renderDate)}
        </div>
      )}
      {past.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3 mt-6">{t('agenda.past')}</p>
          {past.map(renderDate)}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function RestaurantAgendaPage({ onNavigate, onAuthClick }: RestaurantAgendaPageProps) {
  const { t, language } = useLanguage()
  const { user, profile } = useAuth()
  const { effectiveRole } = useViewMode()
  const { tables, byDate, datesWithTables, loading, error, notifications, dismissNotification } =
    useRestaurantAgenda(user?.id ?? null)

  const push = usePushSubscription()

  const [view, setView] = useState<AgendaView>('live')
  const [month, setMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState<string>(todayStr())

  const locale = resolveDateLocale(language)

  const selectedDayTables = byDate[selectedDate] || []

  const isEmpty = datesWithTables.length === 0

  if (profile && effectiveRole !== 'restaurant') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar currentPage="agenda" onNavigate={onNavigate} onAuthClick={onAuthClick} />
        <div className="text-center py-20">
          <p className="text-gray-500 dark:text-gray-400">{t('agenda.restaurantOnly')}</p>
          <button onClick={() => onNavigate('profile')} className="mt-4 text-primary-600 dark:text-primary-400 font-medium text-sm">
            {t('agenda.goToProfile')}
          </button>
        </div>
      </div>
    )
  }

  const tabs: { id: AgendaView; label: string; icon: React.ReactNode }[] = [
    { id: 'live', label: t('agenda.liveTab'), icon: <Tv2 className="w-4 h-4" /> },
    { id: 'list', label: t('agenda.listTab'), icon: <List className="w-4 h-4" /> },
    { id: 'calendar', label: t('agenda.calendarTab'), icon: <CalendarDays className="w-4 h-4" /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar currentPage="agenda" onNavigate={onNavigate} onAuthClick={onAuthClick} />

      {/* Live notification toasts */}
      <LiveNotificationStack notifications={notifications} onDismiss={dismissNotification} t={t} />

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 lg:pb-8">
        {/* Header */}
        <PageHeader
          title={t('agenda.title')}
          subtitle={t('agenda.subtitle')}
          variant="restaurant"
          action={
            <div className="flex items-center gap-2">
              {/* Push notification toggle */}
              {push.isSupported && push.permission !== 'denied' && (
                <button
                  onClick={push.subscribed ? push.unsubscribe : push.subscribe}
                  disabled={push.loading}
                  title={push.subscribed ? t('agenda.pushDisable') : t('agenda.pushEnable')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors flex-shrink-0 bg-white/20 hover:bg-white/30 text-white"
                >
                  {push.loading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : push.subscribed
                      ? <Bell className="w-4 h-4" />
                      : <BellOff className="w-4 h-4" />
                  }
                  <span className="hidden sm:inline">
                    {push.subscribed ? t('agenda.pushActive') : t('agenda.pushEnable')}
                  </span>
                </button>
              )}
              <button
                onClick={() => onNavigate('create')}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/95 text-gray-900 rounded-xl text-sm font-medium hover:bg-white transition-colors flex-shrink-0 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{t('agenda.newTable')}</span>
              </button>
            </div>
          }
        />

        {/* Tab selector */}
        <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 mb-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === tab.id
                  ? 'bg-[#129a93] text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.id === 'live' && notifications.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-white/80 ml-0.5" />
              )}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl p-3 mb-4">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#129a93] animate-spin" />
          </div>
        ) : isEmpty && view !== 'live' ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center mx-auto mb-4 text-primary-500 dark:text-primary-400">
              <CalendarX className="w-9 h-9" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{t('agenda.noTables')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('agenda.noTablesDesc')}</p>
            <button
              onClick={() => onNavigate('create')}
              className="px-6 py-2.5 bg-[#129a93] text-white rounded-xl text-sm font-medium hover:bg-[#0b7f79]"
            >
              {t('agenda.newTable')}
            </button>
          </div>
        ) : view === 'live' ? (
          <LiveRoom tables={tables} onNavigate={onNavigate} t={t} />
        ) : view === 'list' ? (
          <HourlyList
            byDate={byDate}
            datesWithTables={datesWithTables}
            locale={locale}
            onNavigate={onNavigate}
            t={t}
          />
        ) : (
          /* Calendar view — calendario a la izquierda, mesas del día elegido a la derecha en desktop */
          <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start space-y-4 lg:space-y-0">
            <AgendaCalendar
              month={month}
              onMonthChange={setMonth}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              byDate={byDate}
              locale={locale}
            />
            <div className="lg:sticky lg:top-6">
              <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 px-1">
                {formatDateHeading(selectedDate, locale)}
              </h2>
              {selectedDayTables.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">
                  {t('agenda.noTablesThisDay')}
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedDayTables.map(table => (
                    <AgendaTableCard key={table.id} table={table} onNavigate={onNavigate} t={t} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
