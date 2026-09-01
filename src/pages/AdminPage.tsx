import { useState } from 'react'
import {
  Users, UtensilsCrossed, Award, CreditCard, Loader2, RefreshCw,
  TrendingUp, Euro, CheckCircle, ShieldAlert, BellRing,
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAdminData } from '@/hooks/useAdminData'

interface AdminPageProps {
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

type Tab = 'resumen' | 'usuarios' | 'restaurantes' | 'embajadores' | 'movimientos' | 'demanda'

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
  const { stats, users, restaurants, ambassadors, payments, demandRequests, loading, error, refresh } = useAdminData(isAdmin)

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
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar currentPage="admin" onNavigate={onNavigate} onAuthClick={onAuthClick} />
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-8">
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

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">{children}</th>
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 text-gray-700 dark:text-gray-200 whitespace-nowrap">{children}</td>
}
function fmtDate(iso: string, locale: string = 'es-ES') {
  return new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })
}
