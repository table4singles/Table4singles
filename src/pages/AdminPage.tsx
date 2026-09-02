import { useState, useMemo } from 'react'
import {
  Users, UtensilsCrossed, Award, CreditCard, Loader2, RefreshCw,
  TrendingUp, Euro, CheckCircle, ShieldAlert, BellRing, Eye, MousePointerClick,
  UserPlus, Filter, QrCode, Sparkles, Search, Check,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { Navbar } from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAdminData, type AdminAnalyticsEvent, type AdminRestaurant } from '@/hooks/useAdminData'
import { supabase } from '@/lib/supabase'
import type { DiningTable } from '@/types/database'

interface AdminPageProps {
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

type Tab = 'resumen' | 'usuarios' | 'restaurantes' | 'embajadores' | 'movimientos' | 'demanda' | 'funnel' | 'especiales'

const DAY_KEYS = ['demand.dayMon', 'demand.dayTue', 'demand.dayWed', 'demand.dayThu', 'demand.dayFri', 'demand.daySat', 'demand.daySun']

const DATE_LOCALE_MAP: Record<string, string> = {
  es: 'es-ES', en: 'en-GB', de: 'de-DE', fr: 'fr-FR', it: 'it-IT',
  ru: 'ru-RU', pt: 'pt-PT', uk: 'uk-UA', ro: 'ro-RO', ar: 'ar-SA',
  sv: 'sv-SE', zh: 'zh-CN', ja: 'ja-JP',
}

const PAYMENT_BADGE: Record<string, string> = {
  paid:     'bg-green-100 text-green-700',
  pending:  'bg-yellow-100 text-yellow-700',
  refunded: 'bg-blue-100 text-blue-700',
  failed:   'bg-red-100 text-red-600',
}

export function AdminPage({ onNavigate, onAuthClick }: AdminPageProps) {
  const { t, language } = useLanguage()
  const dateLocale = DATE_LOCALE_MAP[language] ?? 'es-ES'
  const { profile } = useAuth()
  const [tab, setTab] = useState<Tab>('resumen')
  const isAdmin = profile?.is_admin === true
  const { stats, users, restaurants, ambassadors, payments, demandRequests, analyticsEvents, loading, error, refresh } = useAdminData(isAdmin)

  const SUB_BADGE: Record<string, { label: string; color: string }> = {
    active:     { label: t('admin.subActive'),    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    trialing:   { label: t('admin.subTrialing'),   color: 'bg-blue-100 text-blue-700' },
    past_due:   { label: t('admin.subPastDue'),    color: 'bg-orange-100 text-orange-700' },
    canceled:   { label: t('admin.subCanceled'),   color: 'bg-red-100 text-red-600' },
    incomplete: { label: t('admin.subIncomplete'), color: 'bg-orange-100 text-orange-700' },
    unpaid:     { label: t('admin.subUnpaid'),     color: 'bg-red-100 text-red-600' },
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar currentPage="admin" onNavigate={onNavigate} onAuthClick={onAuthClick} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
          <ShieldAlert className="w-12 h-12 text-red-400" />
          <p className="text-gray-600 dark:text-gray-300 font-medium">{t('admin.accessDenied')}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">{t('admin.adminOnly')}</p>
        </div>
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'resumen',      label: t('admin.tabResumen'),                                                                                icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'usuarios',     label: t('admin.tabUsuarios').replace('{count}', String(users.filter(u => u.role === 'user' || u.is_admin).length)),  icon: <Users className="w-4 h-4" /> },
    { id: 'restaurantes', label: t('admin.tabRestaurantes').replace('{count}', String(restaurants.length)),                            icon: <UtensilsCrossed className="w-4 h-4" /> },
    { id: 'embajadores',  label: t('admin.tabEmbajadores').replace('{count}', String(ambassadors.length)),                             icon: <Award className="w-4 h-4" /> },
    { id: 'movimientos',  label: t('admin.tabMovimientos').replace('{count}', String(payments.length)),                                icon: <CreditCard className="w-4 h-4" /> },
    { id: 'demanda',      label: t('admin.tabDemanda').replace('{count}', String(demandRequests.filter(d => d.status === 'active').length)), icon: <BellRing className="w-4 h-4" /> },
    { id: 'funnel',       label: t('admin.tabFunnel'),                                                                                   icon: <Filter className="w-4 h-4" /> },
    { id: 'especiales',   label: t('specialGuest.adminTabLabel'),                                                                        icon: <Sparkles className="w-4 h-4" /> },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar currentPage="admin" onNavigate={onNavigate} onAuthClick={onAuthClick} />
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 lg:pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">{t('admin.title')}</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('admin.subtitle')}</p>
          </div>
          <button onClick={refresh} disabled={loading} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> {t('admin.refresh')}
          </button>
        </div>

        {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>}

        <div className="flex gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 mb-6 overflow-x-auto">
          {tabs.map(tb => (
            <button key={tb.id} onClick={() => setTab(tb.id)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${tab === tb.id ? 'bg-[#129a93] text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
              {tb.icon} {tb.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>
        ) : (
          <>
            {tab === 'resumen'      && <TabResumen stats={stats} ambassadors={ambassadors} t={t} />}
            {tab === 'usuarios'     && <TabUsuarios users={users.filter(u => u.role === 'user' || u.is_admin)} t={t} dateLocale={dateLocale} />}
            {tab === 'restaurantes' && <TabRestaurantes restaurants={restaurants} t={t} dateLocale={dateLocale} subBadge={SUB_BADGE} />}
            {tab === 'embajadores'  && <TabEmbajadores ambassadors={ambassadors} t={t} dateLocale={dateLocale} />}
            {tab === 'movimientos'  && <TabMovimientos payments={payments} t={t} dateLocale={dateLocale} />}
            {tab === 'demanda'      && <TabDemanda requests={demandRequests} t={t} dateLocale={dateLocale} />}
            {tab === 'funnel'       && <TabFunnel events={analyticsEvents} t={t} language={language} />}
            {tab === 'especiales'   && <TabEspeciales restaurants={restaurants} t={t} dateLocale={dateLocale} />}
          </>
        )}
      </main>
    </div>
  )
}

function TabResumen({ stats, ambassadors, t }: { stats: any; ambassadors: any[]; t: (key: string) => string }) {
  const s = stats ?? {}
  const totalCommission = ambassadors.reduce((sum: number, a: any) => sum + (a.monthly_commission_cts ?? 0), 0)
  const kpis = [
    { label: t('admin.kpiUsers'),             value: s.total_users ?? 0,          icon: <Users className="w-5 h-5 text-blue-500" />,           bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: t('admin.kpiRestaurants'),       value: s.total_restaurants ?? 0,    icon: <UtensilsCrossed className="w-5 h-5 text-orange-500" />, bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { label: t('admin.kpiActiveSubs'),        value: s.active_subscriptions ?? 0, icon: <CheckCircle className="w-5 h-5 text-green-500" />,     bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: t('admin.kpiActiveAmbassadors'), value: s.total_ambassadors ?? 0,    icon: <Award className="w-5 h-5 text-purple-500" />,          bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: t('admin.kpiTotalReservations'), value: s.total_reservations ?? 0,   icon: <CreditCard className="w-5 h-5 text-teal-500" />,       bg: 'bg-teal-50 dark:bg-teal-900/20' },
    { label: t('admin.kpiPaidReservations'),  value: s.paid_reservations ?? 0,    icon: <CheckCircle className="w-5 h-5 text-teal-600" />,      bg: 'bg-teal-50 dark:bg-teal-900/20' },
  ]
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
            <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center mb-3`}>{k.icon}</div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{k.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Euro className="w-4 h-4 text-green-500" /> {t('admin.financial')}
          <span className="text-xs text-gray-400 font-normal">{t('admin.financialEstimateNote')}</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FinBox label={t('admin.mrrEstimated')}              value={`${((s.mrr_cts ?? 0) / 100).toFixed(2)} €`}                        desc={t('admin.mrrEstimatedDesc')} t={t} />
          <FinBox label={t('admin.reservationRevenue')}        value={`${((s.reservation_revenue_cts ?? 0) / 100).toFixed(2)} €`}         desc={t('admin.reservationRevenueDesc')} stripe t={t} />
          <FinBox label={t('admin.ambassadorCommissions')}     value={`${(totalCommission / 100).toFixed(2)} €`}                         desc={t('admin.ambassadorCommissionsDesc')} t={t} />
          <FinBox label={t('admin.netMrr')}                    value={`${(((s.mrr_cts ?? 0) - totalCommission) / 100).toFixed(2)} €`}    desc={t('admin.netMrrDesc')} t={t} />
        </div>
      </div>
    </div>
  )
}

function FinBox({ label, value, desc, stripe, t }: { label: string; value: string; desc: string; stripe?: boolean; t: (key: string) => string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
      <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs font-medium text-gray-700 dark:text-gray-200 mt-1">{label}</p>
      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{desc}</p>
      {stripe && <span className="inline-block mt-1 text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-medium">{t('ambassador.stripeNote')}</span>}
    </div>
  )
}

function TabUsuarios({ users, t, dateLocale }: { users: any[]; t: (key: string) => string; dateLocale: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"><Th>{t('admin.thName')}</Th><Th>{t('admin.thEmail')}</Th><Th>{t('admin.thRegistered')}</Th><Th>{t('admin.thAdmin')}</Th></tr></thead>
          <tbody>
            {users.length === 0
              ? <tr><td colSpan={4} className="text-center py-10 text-gray-400">{t('admin.noUsers')}</td></tr>
              : users.map(u => (
                <tr key={u.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <Td>{u.display_name || '—'}</Td><Td>{u.email || '—'}</Td><Td>{fmtDate(u.created_at, dateLocale)}</Td>
                  <Td>{u.is_admin ? <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">{t('admin.thAdmin')}</span> : '—'}</Td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TabRestaurantes({ restaurants, t, dateLocale, subBadge }: { restaurants: any[]; t: (key: string) => string; dateLocale: string; subBadge: Record<string, { label: string; color: string }> }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"><Th>{t('admin.thRestaurant')}</Th><Th>{t('admin.thEmail')}</Th><Th>{t('admin.thSubscription')}</Th><Th>{t('admin.thActiveTables')}</Th><Th>{t('admin.thReservations')}</Th><Th>{t('admin.thAmbassador')}</Th><Th>{t('admin.thRegistration')}</Th></tr></thead>
          <tbody>
            {restaurants.length === 0
              ? <tr><td colSpan={7} className="text-center py-10 text-gray-400">{t('admin.noRestaurants')}</td></tr>
              : restaurants.map(r => {
                const sub = r.subscription_status ? (subBadge[r.subscription_status] ?? { label: r.subscription_status, color: 'bg-gray-100 text-gray-600' }) : null
                return (
                  <tr key={r.restaurant_id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <Td><span className="font-medium">{r.restaurant_name || '—'}</span></Td>
                    <Td>{r.email || '—'}</Td>
                    <Td>{sub ? <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sub.color}`}>{sub.label}</span> : <span className="text-xs text-gray-400">{t('ambassador.noSubscription')}</span>}</Td>
                    <Td>{r.active_tables}</Td><Td>{r.total_reservations}</Td>
                    <Td>{r.ambassador_name || <span className="text-gray-400">—</span>}</Td>
                    <Td>{fmtDate(r.joined_at, dateLocale)}</Td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TabEmbajadores({ ambassadors, t, dateLocale }: { ambassadors: any[]; t: (key: string) => string; dateLocale: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"><Th>{t('admin.thAmbassadorCol')}</Th><Th>{t('admin.thEmail')}</Th><Th>{t('admin.thStatus')}</Th><Th>{t('ambassador.capturedLabel')}</Th><Th>{t('ambassador.withSubscription')}</Th><Th>{t('admin.thCommissionPct')}</Th><Th>{t('admin.thMonthlyCommission')}</Th><Th>{t('admin.thJoinDate')}</Th></tr></thead>
          <tbody>
            {ambassadors.length === 0
              ? <tr><td colSpan={8} className="text-center py-10 text-gray-400">{t('admin.noAmbassadors')}</td></tr>
              : ambassadors.map(a => (
                <tr key={a.ambassador_user_id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <Td><span className="font-medium">{a.display_name || '—'}</span></Td>
                  <Td>{a.email || '—'}</Td>
                  <Td><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{a.status === 'active' ? t('admin.statusActive') : t('ambassador.statusInactive')}</span></Td>
                  <Td>{a.restaurants_referred}</Td><Td>{a.active_subscriptions}</Td><Td>{a.commission_rate}%</Td>
                  <Td><span className={a.monthly_commission_cts > 0 ? 'text-green-600 font-semibold' : 'text-gray-400'}>{(a.monthly_commission_cts / 100).toFixed(2)} €{a.monthly_commission_cts === 0 && <span className="text-[10px] text-gray-400 ml-1">{t('admin.stripePending')}</span>}</span></Td>
                  <Td>{fmtDate(a.applied_at, dateLocale)}</Td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TabMovimientos({ payments, t, dateLocale }: { payments: any[]; t: (key: string) => string; dateLocale: string }) {
  return (
    <div className="space-y-4">
      {payments.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3 text-sm text-yellow-700 dark:text-yellow-300">
          {t('admin.noPaymentsBanner')}
        </div>
      )}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"><Th>{t('admin.thStripeSessionId')}</Th><Th>{t('admin.thAmount')}</Th><Th>{t('admin.thStatus')}</Th><Th>{t('admin.thDate')}</Th></tr></thead>
            <tbody>
              {payments.length === 0
                ? <tr><td colSpan={4} className="text-center py-10 text-gray-400">{t('admin.noPayments')}</td></tr>
                : payments.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <Td><span className="font-mono text-xs text-gray-500 truncate max-w-[160px] block">{p.stripe_session_id}</span></Td>
                    <Td><span className="font-semibold">{(p.amount / 100).toFixed(2)} {p.currency.toUpperCase()}</span></Td>
                    <Td><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PAYMENT_BADGE[p.status] ?? 'bg-gray-100 text-gray-600'}`}>{p.status}</span></Td>
                    <Td>{fmtDate(p.created_at, dateLocale)}</Td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const DEMAND_STATUS_BADGE: Record<string, string> = {
  active:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  matched:   'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  expired:   'bg-gray-100 text-gray-500',
  cancelled: 'bg-gray-100 text-gray-400',
}

function TabDemanda({ requests, t, dateLocale }: { requests: any[]; t: (key: string) => string; dateLocale: string }) {
  const fmtWhen = (r: any) => {
    if (r.date_pref) return fmtDate(r.date_pref, dateLocale)
    if (r.day_of_week !== null && r.day_of_week !== undefined) return t(DAY_KEYS[r.day_of_week])
    return '—'
  }
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.demandIntro')}</p>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <Th>{t('admin.thName')}</Th><Th>{t('demand.city')}</Th><Th>{t('admin.thWhen')}</Th>
              <Th>{t('demand.time')}</Th><Th>{t('demand.cuisine')}</Th><Th>{t('demand.language')}</Th>
              <Th>{t('admin.thStatus')}</Th><Th>{t('admin.thDate')}</Th>
            </tr></thead>
            <tbody>
              {requests.length === 0
                ? <tr><td colSpan={8} className="text-center py-10 text-gray-400">{t('admin.noDemand')}</td></tr>
                : requests.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <Td><span className="font-medium">{r.display_name || r.email || '—'}</span></Td>
                    <Td>{r.city}</Td>
                    <Td>{fmtWhen(r)}</Td>
                    <Td>{r.time_pref ? t(r.time_pref === 'midday' ? 'browse.midday' : 'browse.evening') : '—'}</Td>
                    <Td>{r.cuisine || <span className="text-gray-400">{t('demand.anyCuisine')}</span>}</Td>
                    <Td>{r.language || <span className="text-gray-400">{t('demand.anyLanguage')}</span>}</Td>
                    <Td><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DEMAND_STATUS_BADGE[r.status] ?? 'bg-gray-100 text-gray-600'}`}>{r.status}</span></Td>
                    <Td>{fmtDate(r.created_at, dateLocale)}</Td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const FUNNEL_RANGES = ['7d', '30d', '90d', 'all'] as const
type FunnelRange = typeof FUNNEL_RANGES[number]

function TabFunnel({ events, t, language }: { events: AdminAnalyticsEvent[]; t: (key: string) => string; language: string }) {
  const [range, setRange] = useState<FunnelRange>('30d')
  const locale = language === 'zh' ? 'zh-CN' : language === 'ja' ? 'ja-JP' : language === 'ar' ? 'ar' : language

  const filtered = useMemo(() => {
    if (range === 'all') return events
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
    const since = Date.now() - days * 86400000
    return events.filter(e => new Date(e.created_at).getTime() >= since)
  }, [events, range])

  const counts = useMemo(() => {
    const byName: Record<string, number> = {}
    filtered.forEach(e => { byName[e.event_name] = (byName[e.event_name] ?? 0) + 1 })
    return byName
  }, [filtered])

  const dailyChart = useMemo(() => {
    const byDay: Record<string, number> = {}
    filtered.forEach(e => {
      const day = e.created_at.split('T')[0]
      byDay[day] = (byDay[day] ?? 0) + 1
    })
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date: new Date(date + 'T12:00:00').toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
        [t('admin.funnelChartTitle')]: count,
      }))
  }, [filtered, locale, t])

  const views = counts.TABLE_VIEW ?? 0
  const started = counts.RESERVATION_STARTED ?? 0
  const completed = counts.RESERVATION_COMPLETED ?? 0
  const invitationsCreated = counts.INVITATION_CREATED ?? 0
  const invitationsClicked = counts.INVITATION_CLICKED ?? 0
  const referredSignups = counts.REFERRED_SIGNUP ?? 0
  const demandCreated = counts.DEMAND_REQUEST_CREATED ?? 0
  const qrScans = counts.QR_SCAN ?? 0

  const pct = (num: number, den: number) => den > 0 ? Math.round((num / den) * 100) : 0

  const kpis = [
    { label: t('admin.funnelTableViews'),           value: views,             icon: <Eye className="w-5 h-5 text-blue-500" />,               bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: t('admin.funnelReservationsStarted'),  value: started,           icon: <TrendingUp className="w-5 h-5 text-orange-500" />,       bg: 'bg-orange-50 dark:bg-orange-900/20' },
    { label: t('admin.funnelReservationsCompleted'),value: completed,         icon: <CheckCircle className="w-5 h-5 text-green-500" />,       bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: t('admin.funnelInvitationsCreated'),   value: invitationsCreated,icon: <UserPlus className="w-5 h-5 text-purple-500" />,         bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: t('admin.funnelInvitationsClicked'),   value: invitationsClicked,icon: <MousePointerClick className="w-5 h-5 text-teal-500" />, bg: 'bg-teal-50 dark:bg-teal-900/20' },
    { label: t('admin.funnelReferredSignups'),      value: referredSignups,   icon: <Users className="w-5 h-5 text-pink-500" />,              bg: 'bg-pink-50 dark:bg-pink-900/20' },
    { label: t('admin.funnelDemandRequests'),       value: demandCreated,     icon: <BellRing className="w-5 h-5 text-yellow-500" />,         bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { label: t('admin.funnelQrScans'),               value: qrScans,           icon: <QrCode className="w-5 h-5 text-[#129a93]" />,            bg: 'bg-teal-50 dark:bg-teal-900/20' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl">{t('admin.funnelIntro')}</p>
        <div className="flex gap-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1 flex-shrink-0">
          {FUNNEL_RANGES.map(r => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${range === r ? 'bg-[#129a93] text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
              {r === 'all' ? t('admin.rangeAll') : t(`analytics.range${r}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
            <div className={`w-10 h-10 rounded-lg ${k.bg} flex items-center justify-center mb-3`}>{k.icon}</div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{k.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{k.label}</p>
          </div>
        ))}
      </div>

      {(views > 0 || started > 0 || completed > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            {t('admin.funnelTableViews')} → {t('admin.funnelReservationsStarted')} → {t('admin.funnelReservationsCompleted')}
          </h3>
          <div className="space-y-3">
            <FunnelBar label={t('admin.funnelTableViews')} value={views} max={Math.max(views, 1)} color="bg-blue-500" />
            <FunnelBar label={t('admin.funnelReservationsStarted')} value={started} max={Math.max(views, 1)} color="bg-orange-500" suffix={`(${pct(started, views)}% ${t('admin.funnelViewToStart')})`} />
            <FunnelBar label={t('admin.funnelReservationsCompleted')} value={completed} max={Math.max(views, 1)} color="bg-green-500" suffix={`(${pct(completed, started)}% ${t('admin.funnelStartToComplete')})`} />
          </div>
        </div>
      )}

      {dailyChart.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t('admin.funnelChartTitle')}</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={dailyChart} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey={t('admin.funnelChartTitle')} fill="#129a93" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
          <Filter className="w-10 h-10 text-gray-200 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">{t('admin.funnelEmptyTitle')}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{t('admin.funnelEmptyDesc')}</p>
        </div>
      )}
    </div>
  )
}

function FunnelBar({ label, value, max, color, suffix }: { label: string; value: number; max: number; color: string; suffix?: string }) {
  const width = max > 0 ? Math.max((value / max) * 100, value > 0 ? 4 : 0) : 0
  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-gray-600 dark:text-gray-300 font-medium">{label}</span>
        <span className="text-gray-500 dark:text-gray-400">{value} {suffix}</span>
      </div>
      <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

function TabEspeciales({ restaurants, t, dateLocale }: { restaurants: AdminRestaurant[]; t: (key: string) => string; dateLocale: string }) {
  const [search, setSearch] = useState('')
  const [selectedRestaurant, setSelectedRestaurant] = useState<AdminRestaurant | null>(null)
  const [tables, setTables] = useState<DiningTable[]>([])
  const [loadingTables, setLoadingTables] = useState(false)
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null)
  const [guestName, setGuestName] = useState('')
  const [guestBio, setGuestBio] = useState('')
  const [guestPhotoUrl, setGuestPhotoUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const filteredRestaurants = search.trim()
    ? restaurants.filter(r => (r.restaurant_name ?? '').toLowerCase().includes(search.toLowerCase()))
    : restaurants

  const pickRestaurant = async (r: AdminRestaurant) => {
    setSelectedRestaurant(r)
    setSelectedTableId(null)
    setSaved(false)
    setLoadingTables(true)
    const today = new Date().toISOString().slice(0, 10)
    const { data } = await supabase
      .from('dining_tables')
      .select('*')
      .eq('host_id', r.restaurant_id)
      .eq('status', 'open')
      .gte('date', today)
      .order('date', { ascending: true })
    setTables((data as DiningTable[]) ?? [])
    setLoadingTables(false)
  }

  const pickTable = (tb: DiningTable) => {
    setSelectedTableId(tb.id)
    setGuestName(tb.special_guest_name ?? '')
    setGuestBio(tb.special_guest_bio ?? '')
    setGuestPhotoUrl(tb.special_guest_photo_url ?? '')
    setSaved(false)
  }

  const handleSave = async () => {
    if (!selectedTableId || !guestName.trim()) return
    setSaving(true)
    const { error } = await supabase
      .from('dining_tables')
      .update({
        is_special: true,
        special_guest_name: guestName.trim(),
        special_guest_bio: guestBio.trim() || null,
        special_guest_photo_url: guestPhotoUrl.trim() || null,
      })
      .eq('id', selectedTableId)
    setSaving(false)
    if (!error) {
      setSaved(true)
      setTables(prev => prev.map(tb => tb.id === selectedTableId
        ? { ...tb, is_special: true, special_guest_name: guestName.trim(), special_guest_bio: guestBio.trim() || null, special_guest_photo_url: guestPhotoUrl.trim() || null }
        : tb))
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">{t('specialGuest.adminIntro')}</p>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Restaurant picker */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{t('specialGuest.adminPickRestaurant')}</p>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('specialGuest.adminSearchPlaceholder')}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-[#129a93] outline-none"
            />
          </div>
          <div className="max-h-80 overflow-y-auto space-y-1">
            {filteredRestaurants.map(r => (
              <button
                key={r.restaurant_id}
                onClick={() => pickRestaurant(r)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedRestaurant?.restaurant_id === r.restaurant_id ? 'bg-[#129a93] text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
              >
                {r.restaurant_name || '—'}
              </button>
            ))}
          </div>
        </div>

        {/* Table picker */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{t('specialGuest.adminPickTable')}</p>
          {!selectedRestaurant ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">{t('specialGuest.adminPickRestaurant')}</p>
          ) : loadingTables ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 text-[#129a93] animate-spin" /></div>
          ) : tables.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">{t('specialGuest.adminNoTables')}</p>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-1">
              {tables.map(tb => (
                <button
                  key={tb.id}
                  onClick={() => pickTable(tb)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between gap-2 transition-colors ${selectedTableId === tb.id ? 'bg-[#129a93] text-white' : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                >
                  <span>{new Date(tb.date).toLocaleDateString(dateLocale, { day: 'numeric', month: 'short' })} {tb.time?.slice(0, 5) ?? ''}</span>
                  {tb.is_special && <Sparkles className={`w-3.5 h-3.5 flex-shrink-0 ${selectedTableId === tb.id ? 'text-white' : 'text-[#129a93]'}`} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Guest form */}
      {selectedTableId && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 space-y-3">
          <input
            value={guestName}
            onChange={e => setGuestName(e.target.value)}
            placeholder={t('specialGuest.namePlaceholder')}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#129a93] outline-none"
          />
          <textarea
            value={guestBio}
            onChange={e => setGuestBio(e.target.value)}
            rows={2}
            placeholder={t('specialGuest.bioPlaceholder')}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#129a93] outline-none resize-none"
          />
          <input
            type="url"
            value={guestPhotoUrl}
            onChange={e => setGuestPhotoUrl(e.target.value)}
            placeholder={t('specialGuest.photoPlaceholder')}
            className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#129a93] outline-none"
          />
          <button
            onClick={handleSave}
            disabled={saving || !guestName.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#129a93] text-white text-sm font-semibold rounded-xl hover:bg-[#0b7f79] disabled:opacity-40 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            {saved ? t('specialGuest.adminSaved') : t('specialGuest.adminSave')}
          </button>
        </div>
      )}
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">{children}</th>
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-gray-700 dark:text-gray-200 whitespace-nowrap">{children}</td>
}
function fmtDate(iso: string, locale: string = 'es-ES') {
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
}
