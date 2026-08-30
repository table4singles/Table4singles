import { useState, useMemo, useEffect } from 'react'
import { UtensilsCrossed, Users, Star, Loader2, XCircle, Calendar, Clock, CalendarClock, CalendarDays, AlertCircle, CheckCircle, CreditCard, TrendingUp } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { PageHeader } from '@/components/PageHeader'
import { CancelModal } from '@/components/CancelModal'
import { EmptyStateIllustration } from '@/components/EmptyStateIllustration'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { useViewMode } from '@/contexts/ViewModeContext'
import { useMyTables } from '@/hooks/useTables'
import { supabase } from '@/lib/supabase'

interface RestaurantDashboardPageProps {
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

export function RestaurantDashboardPage({ onNavigate, onAuthClick }: RestaurantDashboardPageProps) {
  const { t, language } = useLanguage()
  const { user, profile } = useAuth()
  const { effectiveRole } = useViewMode()
  const { hosting, loading, error, cancelHostedTable, refresh } = useMyTables(user?.id ?? null)
  const [cancelTableId, setCancelTableId] = useState<string | null>(null)
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [reviewCount, setReviewCount] = useState(0)

  const locale = language === 'de' ? 'de-DE' : language === 'en' ? 'en-GB' : 'es-ES'

  useEffect(() => {
    if (!user) return
    supabase
      .from('restaurant_reviews')
      .select('rating')
      .eq('restaurant_id', user.id)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setAvgRating(data.reduce((sum, r) => sum + r.rating, 0) / data.length)
          setReviewCount(data.length)
        } else {
          setAvgRating(null)
          setReviewCount(0)
        }
      })
  }, [user])

  const now = new Date()
  const { upcoming, past } = useMemo(() => {
    const up: typeof hosting = []
    const pa: typeof hosting = []
    for (const table of hosting) {
      if (new Date(`${table.date}T${table.time}`) >= now) up.push(table)
      else pa.push(table)
    }
    return { upcoming: up, past: pa }
  }, [hosting])

  const totalDiners = hosting.reduce((sum, tbl) => sum + (tbl.max_seats - tbl.available_seats), 0)

  if (profile && effectiveRole !== 'restaurant') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar currentPage="restaurant-dashboard" onNavigate={onNavigate} onAuthClick={onAuthClick} />
        <div className="text-center py-20">
          <p className="text-gray-500 dark:text-gray-400">{t('restaurantDashboard.restaurantOnly')}</p>
          <button onClick={() => onNavigate('profile')} className="mt-4 text-primary-600 dark:text-primary-400 font-medium text-sm">{t('agenda.goToProfile')}</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar currentPage="restaurant-dashboard" onNavigate={onNavigate} onAuthClick={onAuthClick} />
      <main className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-8">
        <PageHeader title={t('restaurantDashboard.title')} subtitle={profile?.restaurant_name || t('restaurantDashboard.subtitle')} variant="restaurant" />

        {error && <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl p-3 mb-4">{error}</div>}

        {/* Banner de suscripción */}
        {profile?.subscription_status === 'active' || profile?.subscription_status === 'trialing' ? (
          <div className="flex items-center gap-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 mb-6 text-sm">
            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="text-green-800 dark:text-green-300 font-medium">{t('restaurantDashboard.subscriptionActive')} {t('restaurantDashboard.subscriptionPlanDetail')}</span>
            <button onClick={() => onNavigate('subscription')} className="ml-auto text-xs text-green-700 dark:text-green-400 hover:underline font-medium">{t('restaurantDashboard.manageSubscription')}</button>
          </div>
        ) : profile?.subscription_status === 'past_due' ? (
          <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl px-4 py-3 mb-6 text-sm">
            <AlertCircle className="w-4 h-4 text-orange-600 flex-shrink-0" />
            <span className="text-orange-800 dark:text-orange-300 font-medium">{t('restaurantDashboard.subscriptionPastDue')}</span>
            <button onClick={() => onNavigate('subscription')} className="ml-auto text-xs text-orange-700 dark:text-orange-400 hover:underline font-medium">{t('restaurantDashboard.viewSubscription')}</button>
          </div>
        ) : (
          <div className="flex items-center gap-3 bg-[#e94560]/5 border border-[#e94560]/20 rounded-xl px-4 py-3 mb-6">
            <CreditCard className="w-4 h-4 text-[#e94560] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{t('restaurantDashboard.subscriptionInactive')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('restaurantDashboard.subscriptionNote')}</p>
            </div>
            <button
              onClick={() => onNavigate('subscription')}
              className="flex-shrink-0 px-3 py-1.5 bg-[#e94560] text-white rounded-lg text-xs font-semibold hover:bg-[#d63d56] transition-colors"
            >
              {t('restaurantDashboard.subscribeAction')}
            </button>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 flex flex-col items-center text-center gap-2 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
              <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
            </div>
            <div className="min-w-0 w-full">
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{hosting.length}</p>
              <p className="text-[10px] sm:text-xs leading-snug text-gray-500 dark:text-gray-400 break-words">
                {t('restaurantDashboard.activeTables')}
              </p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 flex flex-col items-center text-center gap-2 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
            </div>
            <div className="min-w-0 w-full">
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{totalDiners}</p>
              <p className="text-[10px] sm:text-xs leading-snug text-gray-500 dark:text-gray-400 break-words">
                {t('restaurantDashboard.totalDiners')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('reviews')}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 flex flex-col items-center text-center gap-2 min-w-0 text-left hover:shadow-md hover:border-yellow-300 dark:hover:border-yellow-600 transition-all"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
            </div>
            <div className="min-w-0 w-full">
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{avgRating ? avgRating.toFixed(1) : '-'}</p>
              <p className="text-[10px] sm:text-xs leading-snug text-gray-500 dark:text-gray-400 break-words">
                {reviewCount > 0
                  ? `${reviewCount} ${reviewCount === 1 ? t('restaurantDashboard.reviewSingular') : t('restaurantDashboard.reviewPlural')}`
                  : t('restaurantDashboard.avgRating')}
              </p>
            </div>
          </button>
        </div>

        {/* Quick access shortcuts */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => onNavigate('agenda')}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-left hover:shadow-md hover:border-[#e94560]/40 transition-all group"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#e94560]/10 flex items-center justify-center">
                <CalendarClock className="w-4 h-4 text-[#e94560]" />
              </div>
              <span className="font-semibold text-sm text-gray-900 dark:text-white">{t('nav.agenda')}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {upcoming.length > 0
                ? `${upcoming.length} ${upcoming.length !== 1 ? t('restaurantDashboard.tablePlural') : t('restaurantDashboard.tableSingular')} ${upcoming.length !== 1 ? t('restaurantDashboard.upcomingHintPlural') : t('restaurantDashboard.upcomingHint')}`
                : t('restaurantDashboard.liveRoom')}
            </p>
            <span className="text-[#e94560] text-xs font-medium mt-2 inline-block group-hover:underline">{t('restaurantDashboard.goToAgenda')} →</span>
          </button>

          <button
            onClick={() => onNavigate('my-tables')}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-left hover:shadow-md hover:border-[#e94560]/40 transition-all group"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="font-semibold text-sm text-gray-900 dark:text-white">{t('nav.myTables')}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {hosting.length > 0
                ? `${hosting.length} ${hosting.length !== 1 ? t('restaurantDashboard.tablePlural') : t('restaurantDashboard.tableSingular')} ${hosting.length !== 1 ? t('restaurantDashboard.publishedHintPlural') : t('restaurantDashboard.publishedHint')}`
                : t('restaurantDashboard.createFirstTable')}
            </p>
            <span className="text-blue-600 dark:text-blue-400 text-xs font-medium mt-2 inline-block group-hover:underline">{t('restaurantDashboard.goToTables')} →</span>
          </button>

          <button
            onClick={() => onNavigate('analytics')}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-left hover:shadow-md hover:border-purple-300 dark:hover:border-purple-600 transition-all group"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="font-semibold text-sm text-gray-900 dark:text-white">{t('analytics.title')}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('restaurantDashboard.analyticsDesc')}</p>
            <span className="text-purple-600 dark:text-purple-400 text-xs font-medium mt-2 inline-block group-hover:underline">{t('restaurantDashboard.goToAnalytics')} →</span>
          </button>

          <button
            onClick={() => onNavigate('subscription')}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-left hover:shadow-md hover:border-green-300 dark:hover:border-green-600 transition-all group"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="font-semibold text-sm text-gray-900 dark:text-white">{t('nav.subscription')}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('restaurantDashboard.subscriptionDesc')}</p>
            <span className="text-green-600 dark:text-green-400 text-xs font-medium mt-2 inline-block group-hover:underline">{t('restaurantDashboard.goToSubscription')} →</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>
        ) : upcoming.length === 0 ? (
          <div className="text-center py-16">
            <EmptyStateIllustration className="w-24 h-24 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{t('restaurantDashboard.noTables')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('restaurantDashboard.noTablesDesc')}</p>
            <button onClick={() => onNavigate('my-tables')} className="px-6 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium shadow-glow-coral hover:bg-primary-600 transition-colors">{t('restaurantDashboard.newTable')}</button>
          </div>
        ) : (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">{t('restaurantDashboard.upcoming')}</h2>
            <div className="space-y-3">
              {upcoming.map(table => (
                <TableRow key={table.id} table={table} locale={locale} t={t} onNavigate={onNavigate} onCancel={() => setCancelTableId(table.id)} />
              ))}
            </div>
          </div>
        )}

        {cancelTableId && (
          <CancelModal
            joinType="word"
            onClose={() => setCancelTableId(null)}
            onConfirm={async () => {
              await cancelHostedTable(cancelTableId)
              setCancelTableId(null)
              await refresh()
            }}
          />
        )}
      </main>
    </div>
  )
}

function TableRow({ table, locale, t, onNavigate, onCancel }: any) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-all">
      <button onClick={() => onNavigate('table-detail', table.id)} className="w-full text-left">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{table.restaurant_name}</h3>
            <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500 mt-1">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(table.date).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{table.time.slice(0, 5)}</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{table.max_seats - table.available_seats}/{table.max_seats} {t('restaurantDashboard.seatsFilled')}</span>
            </div>
          </div>
          {table.status === 'cancelled' && <span className="text-xs px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full">{t('restaurantDashboard.cancelled')}</span>}
          {table.status === 'completed' && <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full">{t('restaurantDashboard.completed')}</span>}
          {table.status === 'full' && <span className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">{t('restaurantDashboard.statusFull')}</span>}
          {table.status === 'open' && <span className="text-xs px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">{t('restaurantDashboard.statusOpen')}</span>}
        </div>
      </button>
      {onCancel && table.status !== 'cancelled' && (
        <button onClick={onCancel} className="mt-3 text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1">
          <XCircle className="w-3.5 h-3.5" /> {t('myTables.cancel')}
        </button>
      )}
    </div>
  )
}
