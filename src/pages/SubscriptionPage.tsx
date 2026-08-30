import { useState } from 'react'
import { ArrowLeft, CheckCircle, AlertCircle, Clock, XCircle, CreditCard, Loader2, Zap } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { PageHeader } from '@/components/PageHeader'
import { useAuth } from '@/contexts/AuthContext'
import { useViewMode } from '@/contexts/ViewModeContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'

interface SubscriptionPageProps {
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

const STATUS_STYLE: Record<string, { key: string; color: string; icon: React.ReactNode }> = {
  active: {
    key: 'active',
    color: 'text-green-700 bg-green-50 border-green-200',
    icon: <CheckCircle className="w-4 h-4 text-green-600" />,
  },
  trialing: {
    key: 'trialing',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    icon: <Clock className="w-4 h-4 text-blue-600" />,
  },
  past_due: {
    key: 'pastDue',
    color: 'text-orange-700 bg-orange-50 border-orange-200',
    icon: <AlertCircle className="w-4 h-4 text-orange-600" />,
  },
  canceled: {
    key: 'canceled',
    color: 'text-red-700 bg-red-50 border-red-200',
    icon: <XCircle className="w-4 h-4 text-red-600" />,
  },
  incomplete: {
    key: 'incomplete',
    color: 'text-orange-700 bg-orange-50 border-orange-200',
    icon: <AlertCircle className="w-4 h-4 text-orange-600" />,
  },
  unpaid: {
    key: 'unpaid',
    color: 'text-red-700 bg-red-50 border-red-200',
    icon: <AlertCircle className="w-4 h-4 text-red-600" />,
  },
}

export function SubscriptionPage({ onNavigate, onAuthClick }: SubscriptionPageProps) {
  const { profile, refreshProfile } = useAuth()
  const { effectiveRole } = useViewMode()
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const FEATURES = [
    t('subscription.features.tables'),
    t('subscription.features.reservations'),
    t('subscription.features.agenda'),
    t('subscription.features.analytics'),
    t('subscription.features.notifications'),
  ]

  if (!profile || effectiveRole !== 'restaurant') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar currentPage="subscription" onNavigate={onNavigate} onAuthClick={onAuthClick} />
        <div className="text-center py-20">
          <p className="text-gray-500 dark:text-gray-400">{t('subscription.notRestaurant')}</p>
          <button onClick={() => onNavigate('browse')} className="mt-4 text-primary-600 dark:text-primary-400 font-medium text-sm">{t('common.back')}</button>
        </div>
      </div>
    )
  }

  const status = profile.subscription_status
  const isActive = status === 'active' || status === 'trialing'
  const statusStyle = status ? (STATUS_STYLE[status] ?? null) : null
  const isNewSubscriber = !status || status === 'canceled'

  const handleSubscribe = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('create-subscription-checkout', {})
      if (fnErr) throw fnErr
      if (data?.url) {
        window.location.href = data.url
      } else {
        throw new Error(t('subscription.errors.noPaymentUrl'))
      }
    } catch (err: any) {
      setError(err.message || t('subscription.errors.startFailed'))
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar currentPage="subscription" onNavigate={onNavigate} onAuthClick={onAuthClick} />
      <main className="max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-8">
        <button
          onClick={() => onNavigate('restaurant-dashboard')}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> {t('subscription.backToDashboard')}
        </button>

        <PageHeader title={t('nav.subscription')} subtitle={t('subscription.pageSubtitle')} variant="restaurant" />

        {/* Estado actual */}
        {statusStyle && (
          <div className={`flex items-center gap-2 border rounded-xl px-4 py-3 mb-6 text-sm font-medium ${statusStyle.color}`}>
            {statusStyle.icon}
            <span>{t('subscription.statusPrefix')} <strong>{t(`subscription.status.${statusStyle.key}`)}</strong></span>
          </div>
        )}

        {/* Banner promo lanzamiento */}
        {isNewSubscriber && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl px-5 py-4 mb-5 flex items-start gap-3">
            <Zap className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800 dark:text-amber-300">{t('subscription.promoTitle')}</p>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">{t('subscription.promoDesc')}</p>
            </div>
          </div>
        )}

        {/* Card de plan */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
          {/* Header plan */}
          <div className="bg-gradient-to-br from-[#e94560] to-[#c73652] px-6 py-6 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5" />
              <span className="text-sm font-semibold uppercase tracking-wide opacity-90">{t('subscription.title')}</span>
            </div>
            {isNewSubscriber ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-display font-bold">10 €</span>
                  <span className="text-sm opacity-80 line-through">30 €</span>
                  <span className="bg-white/20 text-xs font-bold px-2 py-0.5 rounded-full">{t('subscription.threeMonthsBadge')}</span>
                </div>
                <p className="text-sm opacity-80 mt-1">{t('subscription.promoBadgeLine')}</p>
              </>
            ) : (
              <>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-display font-bold">10 €</span>
                  <span className="text-sm opacity-80">{t('subscription.perMonth')}</span>
                </div>
                <p className="text-sm opacity-80 mt-1">{t('subscription.regularBadgeLine')}</p>
              </>
            )}
          </div>

          {/* Features */}
          <div className="px-6 py-5">
            <ul className="space-y-3">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700 dark:text-gray-200">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div className="px-6 pb-6">
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {isActive ? (
              <div className="space-y-3 text-center">
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">✓ {t('subscription.statusActive')}</p>
                <button
                  onClick={async () => {
                    setLoading(true)
                    setError(null)
                    try {
                      const { data, error: fnErr } = await supabase.functions.invoke('create-billing-portal', {})
                      if (fnErr) throw fnErr
                      if (data?.url) window.location.href = data.url
                    } catch (err: any) {
                      setError(err.message || t('subscription.errors.portalFailed'))
                    }
                    setLoading(false)
                  }}
                  disabled={loading}
                  className="w-full py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2 disabled:opacity-60 transition-colors"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  {t('subscription.manageBilling')}
                </button>
                <p className="text-xs text-gray-400 dark:text-gray-500">{t('subscription.manageDesc')}</p>
              </div>
            ) : (
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="w-full py-3.5 bg-[#e94560] hover:bg-[#d63d56] disabled:opacity-60 text-white rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('subscription.processing')}
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    {isNewSubscriber ? t('subscription.startPromo') : t('subscription.subscribeBtn')}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Info pago usuarios */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">{t('subscription.usersPayTitle')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('subscription.usersPayBody')}</p>
        </div>
      </main>
    </div>
  )
}
