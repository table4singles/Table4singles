import { useState, useMemo, useEffect } from 'react'
import { Plus, UtensilsCrossed, Users, Star, Loader2, XCircle, Calendar, Clock } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { CancelModal } from '@/components/CancelModal'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { useMyTables } from '@/hooks/useTables'
import { supabase } from '@/lib/supabase'

interface RestaurantDashboardPageProps {
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

export function RestaurantDashboardPage({ onNavigate, onAuthClick }: RestaurantDashboardPageProps) {
  const { t, language } = useLanguage()
  const { user, profile } = useAuth()
  const { hosting, loading, error, cancelHostedTable, refresh } = useMyTables(user?.id ?? null)
  const [cancelTableId, setCancelTableId] = useState<string | null>(null)
  const [avgRating, setAvgRating] = useState<number | null>(null)

  const locale = language === 'de' ? 'de-DE' : language === 'en' ? 'en-GB' : 'es-ES'

  useEffect(() => {
    if (!user) return
    supabase
      .from('reviews')
      .select('rating')
      .eq('host_id', user.id)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setAvgRating(data.reduce((sum, r) => sum + r.rating, 0) / data.length)
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

  if (profile && profile.role !== 'restaurant') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar currentPage="restaurant-dashboard" onNavigate={onNavigate} onAuthClick={onAuthClick} />
        <div className="text-center py-20">
          <p className="text-gray-500">Esta sección es solo para cuentas de restaurante.</p>
          <button onClick={() => onNavigate('profile')} className="mt-4 text-primary-600 font-medium text-sm">Ir a mi perfil</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage="restaurant-dashboard" onNavigate={onNavigate} onAuthClick={onAuthClick} />
      <main className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">{t('restaurantDashboard.title')}</h1>
            <p className="text-gray-500 text-sm mt-1">{profile?.restaurant_name || t('restaurantDashboard.subtitle')}</p>
          </div>
          <button onClick={() => onNavigate('create')} className="px-4 py-2.5 bg-[#e94560] text-white rounded-xl font-medium text-sm hover:bg-[#d63d56] transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> {t('restaurantDashboard.newTable')}
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4">{error}</div>}

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
              <UtensilsCrossed className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{hosting.length}</p>
              <p className="text-xs text-gray-500">{t('restaurantDashboard.activeTables')}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{totalDiners}</p>
              <p className="text-xs text-gray-500">{t('restaurantDashboard.totalDiners')}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{avgRating ? avgRating.toFixed(1) : '-'}</p>
              <p className="text-xs text-gray-500">{t('restaurantDashboard.avgRating')}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>
        ) : hosting.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 text-gray-400">
              <UtensilsCrossed className="w-10 h-10" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{t('restaurantDashboard.noTables')}</h3>
            <p className="text-sm text-gray-500 mb-4">{t('restaurantDashboard.noTablesDesc')}</p>
            <button onClick={() => onNavigate('create')} className="px-6 py-2.5 bg-[#e94560] text-white rounded-xl text-sm font-medium hover:bg-[#d63d56]">{t('restaurantDashboard.newTable')}</button>
          </div>
        ) : (
          <div className="space-y-8">
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('restaurantDashboard.upcoming')}</h2>
                <div className="space-y-3">
                  {upcoming.map(table => (
                    <TableRow key={table.id} table={table} locale={locale} t={t} onNavigate={onNavigate} onCancel={() => setCancelTableId(table.id)} />
                  ))}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('restaurantDashboard.past')}</h2>
                <div className="space-y-3">
                  {past.map(table => (
                    <TableRow key={table.id} table={table} locale={locale} t={t} onNavigate={onNavigate} />
                  ))}
                </div>
              </div>
            )}
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
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all">
      <button onClick={() => onNavigate('table-detail', table.id)} className="w-full text-left">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{table.restaurant_name}</h3>
            <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(table.date).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{table.time.slice(0, 5)}</span>
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{table.max_seats - table.available_seats}/{table.max_seats} {t('restaurantDashboard.seatsFilled')}</span>
            </div>
          </div>
          {table.status === 'cancelled' && <span className="text-xs px-2 py-1 bg-red-50 text-red-600 rounded-full">{t('restaurantDashboard.cancelled')}</span>}
          {table.status === 'completed' && <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full">{t('restaurantDashboard.completed')}</span>}
          {table.status === 'full' && <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full">Completa</span>}
          {table.status === 'open' && <span className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full">Abierta</span>}
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
