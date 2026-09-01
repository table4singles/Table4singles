import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, TrendingUp, Users, Star, CalendarDays, Loader2, QrCode } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { PageHeader } from '@/components/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { useViewMode } from '@/contexts/ViewModeContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell,
} from 'recharts'

interface AnalyticsPageProps {
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

const COLORS = ['#129a93', '#f97316', '#22c55e', '#3b82f6', '#a855f7']

export function AnalyticsPage({ onNavigate, onAuthClick }: AnalyticsPageProps) {
  const { user } = useAuth()
  const { effectiveRole } = useViewMode()
  const { t, language } = useLanguage()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d')

  const fetchAnalytics = useCallback(async () => {
    if (!user) return
    setLoading(true)

    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
    const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0]
    const locale = language === 'zh' ? 'zh-CN' : language === 'ja' ? 'ja-JP' : language === 'ar' ? 'ar' : language

    const [tablesRes, participantsRes, reviewsRes, paymentsRes, qrScansRes] = await Promise.all([
      supabase.from('dining_tables').select('id, date, status, max_seats, available_seats, time').eq('host_id', user.id).gte('date', since).order('date'),
      supabase.from('table_participants').select('table_id, status, created_at, dining_tables!inner(host_id, date)').eq('dining_tables.host_id', user.id).gte('created_at', `${since}T00:00:00`),
      supabase.from('restaurant_reviews').select('rating, created_at').eq('restaurant_id', user.id).gte('created_at', `${since}T00:00:00`),
      supabase.from('reservation_payments').select('amount, status, created_at, dining_tables!inner(host_id)').eq('dining_tables.host_id', user.id).eq('status', 'completed').gte('created_at', `${since}T00:00:00`),
      supabase.from('analytics_events').select('id, created_at').eq('event_name', 'QR_SCAN').eq('metadata->>restaurant_id', user.id).gte('created_at', `${since}T00:00:00`),
    ])

    const tables = tablesRes.data || []
    const participants = (participantsRes.data || []).filter((p: any) => p.status === 'approved')
    const reviews = reviewsRes.data || []
    const payments = paymentsRes.data || []
    const qrScans = qrScansRes.data || []

    const reservasByDay: Record<string, number> = {}
    participants.forEach((p: any) => {
      const day = p.created_at?.split('T')[0]
      if (day) reservasByDay[day] = (reservasByDay[day] || 0) + 1
    })
    const reservasChart = Object.entries(reservasByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date: new Date(date + 'T12:00:00').toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
        [t('analytics.reservationsLabel')]: count,
      }))

    const ocupacion = tables.length > 0
      ? Math.round(tables.reduce((sum, tab) => sum + ((tab.max_seats - tab.available_seats) / tab.max_seats) * 100, 0) / tables.length)
      : 0

    const avgRating = reviews.length > 0
      ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null

    const ratingDist = [1, 2, 3, 4, 5].map(r => ({
      rating: `${r}★`,
      cantidad: reviews.filter((rv: any) => rv.rating === r).length,
    }))

    const midday = tables.filter(tab => { const h = parseInt(tab.time?.slice(0, 2) || '0'); return h >= 12 && h < 17 }).length
    const evening = tables.filter(tab => { const h = parseInt(tab.time?.slice(0, 2) || '0'); return h >= 17 }).length
    const slotsChart = [
      { name: t('analytics.slotMidday'), value: midday },
      { name: t('analytics.slotEvening'), value: evening },
    ].filter(s => s.value > 0)

    setData({
      totalTables: tables.length,
      totalParticipants: participants.length,
      ocupacion,
      ingresos: payments.length * 2,
      qrScans: qrScans.length,
      avgRating,
      reservasChart,
      ratingDist,
      slotsChart,
      reservasKey: t('analytics.reservationsLabel'),
    })
    setLoading(false)
  }, [user, range, language, t])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  if (effectiveRole !== 'restaurant') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar currentPage="analytics" onNavigate={onNavigate} onAuthClick={onAuthClick} />
        <div className="text-center py-20">
          <p className="text-gray-500 dark:text-gray-400">{t('analytics.restaurantOnly')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar currentPage="analytics" onNavigate={onNavigate} onAuthClick={onAuthClick} />
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-8">
        <button onClick={() => onNavigate('restaurant-dashboard')} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> {t('analytics.back')}
        </button>

        <PageHeader
          title={t('analytics.title')}
          subtitle={t('analytics.subtitle')}
          variant="restaurant"
          action={
            <div className="flex gap-1 bg-white/20 rounded-xl p-1">
              {(['7d', '30d', '90d'] as const).map(r => (
                <button key={r} onClick={() => setRange(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${range === r ? 'bg-white text-gray-900' : 'text-white/90 hover:text-white'}`}>
                  {r === '7d' ? t('analytics.range7d') : r === '30d' ? t('analytics.range30d') : t('analytics.range90d')}
                </button>
              ))}
            </div>
          }
        />

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#129a93] animate-spin" /></div>
        ) : data ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <KpiCard icon={<CalendarDays className="w-5 h-5 text-blue-500" />} label={t('analytics.kpiTables')} value={data.totalTables} bg="bg-blue-50 dark:bg-blue-900/20" />
              <KpiCard icon={<Users className="w-5 h-5 text-green-500" />} label={t('analytics.kpiReservations')} value={data.totalParticipants} bg="bg-green-50 dark:bg-green-900/20" />
              <KpiCard icon={<TrendingUp className="w-5 h-5 text-orange-500" />} label={t('analytics.kpiOccupancy')} value={`${data.ocupacion}%`} bg="bg-orange-50 dark:bg-orange-900/20" />
              <KpiCard icon={<Star className="w-5 h-5 text-yellow-500" />} label={t('analytics.kpiRating')} value={data.avgRating ?? '—'} bg="bg-yellow-50 dark:bg-yellow-900/20" />
              <KpiCard icon={<QrCode className="w-5 h-5 text-[#129a93]" />} label={t('analytics.kpiQrScans')} value={data.qrScans} bg="bg-teal-50 dark:bg-teal-900/20" />
            </div>

            {data.reservasChart.length > 0 && (
              <ChartCard title={t('analytics.chartReservations')}>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.reservasChart} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey={data.reservasKey} fill="#129a93" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            )}

            <div className="grid sm:grid-cols-2 gap-6">
              {data.ratingDist.some((r: any) => r.cantidad > 0) && (
                <ChartCard title={t('analytics.chartRatings')}>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={data.ratingDist} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <XAxis dataKey="rating" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="cantidad" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {data.slotsChart.some((s: any) => s.value > 0) && (
                <ChartCard title={t('analytics.chartSlots')}>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart margin={{ top: 16, right: 8, bottom: 0, left: 8 }}>
                      <Pie data={data.slotsChart} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ name, percent }: any) => `${name} ${Math.round((percent ?? 0) * 100)}%`}>
                        {data.slotsChart.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}
            </div>

            {data.totalParticipants === 0 && data.totalTables === 0 && (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                <TrendingUp className="w-10 h-10 text-gray-200 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 font-medium">{t('analytics.emptyTitle')}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('analytics.emptyDesc')}</p>
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  )
}

function KpiCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string | number; bg: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      {children}
    </div>
  )
}
