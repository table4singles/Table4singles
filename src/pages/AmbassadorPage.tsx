import { useState, useEffect } from 'react'
import {
  Award, Copy, Check, Users, TrendingUp, ChevronLeft, Loader2, Handshake,
  UtensilsCrossed, CalendarDays, Euro, Info, CheckCircle, XCircle, Clock, AlertCircle,
  Share2, Mail, MessageCircle,
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { useViewMode } from '@/contexts/ViewModeContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'
import { useAmbassadorStats } from '@/hooks/useAmbassadorStats'

interface AmbassadorRecord {
  id: string
  status: string
  commission_rate: number
  applied_at: string
  referral_code?: string
}

interface AmbassadorPageProps {
  onNavigate: (page: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

export function AmbassadorPage({ onNavigate, onAuthClick }: AmbassadorPageProps) {
  const { user } = useAuth()
  const { effectiveRole } = useViewMode()
  const { t, language } = useLanguage()
  const [ambassador, setAmbassador] = useState<AmbassadorRecord | null>(null)
  const [loadingAmb, setLoadingAmb] = useState(true)
  const [applying, setApplying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const SUB_STATUS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    active:     { label: t('subscription.statusActive'),  icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'text-green-600 bg-green-50' },
    trialing:   { label: 'Periodo de prueba',             icon: <Clock className="w-3.5 h-3.5" />,        color: 'text-blue-600 bg-blue-50' },
    past_due:   { label: t('restaurantDashboard.subscriptionPastDue'), icon: <AlertCircle className="w-3.5 h-3.5" />, color: 'text-orange-600 bg-orange-50' },
    canceled:   { label: t('agenda.statusCancelled'),     icon: <XCircle className="w-3.5 h-3.5" />,     color: 'text-red-500 bg-red-50' },
    incomplete: { label: 'Incompleta',                    icon: <AlertCircle className="w-3.5 h-3.5" />, color: 'text-orange-600 bg-orange-50' },
  }

  const { restaurants, totalReferred, activeSubscriptions, estimatedMonthlyEuros, loading: statsLoading } =
    useAmbassadorStats(ambassador ? (user?.id ?? null) : null, ambassador?.commission_rate)

  const referralCode = ambassador?.referral_code ?? null
  const referralUrl = referralCode
    ? `${window.location.origin}/?ref=${referralCode}`
    : user ? `${window.location.origin}/?ref=${user.id}` : ''

  const shareText = `${t('ambassador.shareWhatsApp')} ${referralCode ?? ''} ${referralUrl}`

  const handleShareWhatsApp = () => {
    const text = `¡Hola! Te invito a unirte a Table4Singles, la plataforma de cenas compartidas para restaurantes. Regístrate con mi código ${referralCode ?? ''}: ${referralUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`${t('ambassador.title')} — Table4Singles`)
    const body = `¡Hola! Te invito a unirte a Table4Singles, la plataforma de cenas compartidas para restaurantes. Regístrate con mi código ${referralCode ?? ''}: ${referralUrl}`
    window.open(`mailto:?subject=${subject}&body=${encodeURIComponent(body)}`, '_blank')
  }

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Table4Singles', text: shareText, url: referralUrl })
      } catch { /* usuario canceló */ }
    } else {
      handleCopy()
    }
  }

  useEffect(() => {
    if (!user) { setLoadingAmb(false); return }
    supabase.from('ambassadors').select('*').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => { setAmbassador(data); setLoadingAmb(false) })
  }, [user])

  const handleApply = async () => {
    if (!user) return
    setApplying(true); setError(null)
    const { data, error: err } = await supabase.from('ambassadors').insert({ user_id: user.id }).select().single()
    if (err) setError(err.message)
    else setAmbassador(data)
    setApplying(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const locale = language === 'zh' ? 'zh-CN' : language === 'ja' ? 'ja-JP' : language === 'ar' ? 'ar' : language

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar currentPage="ambassador" onNavigate={onNavigate} onAuthClick={onAuthClick} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Award className="w-12 h-12 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">{t('ambassador.signInPrompt')}</p>
          <button onClick={() => onAuthClick('signin')} className="px-6 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors">{t('ambassador.signIn')}</button>
        </div>
      </div>
    )
  }

  if (effectiveRole === 'restaurant') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar currentPage="ambassador" onNavigate={onNavigate} onAuthClick={onAuthClick} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Award className="w-12 h-12 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">{t('ambassador.restaurantOnly')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar currentPage="ambassador" onNavigate={onNavigate} onAuthClick={onAuthClick} />
      <main className="max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-8">
        <button onClick={() => onNavigate('profile')} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-6">
          <ChevronLeft className="w-4 h-4" /> {t('ambassador.backToProfile')}
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{t('ambassador.title')}</h1>
              <p className="text-primary-100 text-sm">{t('ambassador.platformName')}</p>
            </div>
          </div>
          <p className="text-primary-100 text-sm leading-relaxed">
            {t('ambassador.description')} <strong className="text-white">{ambassador?.commission_rate ?? 5}%</strong>
          </p>
        </div>

        {/* Nota aclaratoria */}
        <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 mb-6 text-sm text-blue-700 dark:text-blue-300">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>{t('ambassador.infoNote')}</p>
        </div>

        {loadingAmb ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : ambassador ? (
          <div className="space-y-5">
            {/* KPIs */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-white">{t('ambassador.activity')}</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ambassador.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500'}`}>
                  {ambassador.status === 'active' ? t('ambassador.statusActive') : t('ambassador.statusInactive')}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <KpiBox icon={<Users className="w-5 h-5 text-primary-500" />} value={totalReferred} label={t('ambassador.capturedLabel')} />
                <KpiBox icon={<CheckCircle className="w-5 h-5 text-green-500" />} value={activeSubscriptions} label={t('ambassador.withSubscription')} />
                <KpiBox icon={<Euro className="w-5 h-5 text-yellow-500" />} value={`${estimatedMonthlyEuros.toFixed(2)} €`} label={t('ambassador.monthlyEstimate')} sublabel={t('ambassador.stripeNote')} />
              </div>
            </div>

            {/* Código + Compartir */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-1">{t('ambassador.codeTitle')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('ambassador.codeDesc')}</p>

              {referralCode && (
                <div className="flex items-center gap-3 mb-5">
                  <div className="px-6 py-3 bg-[#e94560]/10 dark:bg-[#e94560]/20 border-2 border-dashed border-[#e94560]/40 rounded-xl text-2xl font-bold font-mono tracking-widest text-[#e94560] select-all">
                    {referralCode}
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(referralCode); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                    className="px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {t('ambassador.copyCode')}
                  </button>
                </div>
              )}

              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">{t('ambassador.shareTitle')}</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button onClick={handleShareWhatsApp} className="flex flex-col items-center gap-1.5 py-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-800 rounded-xl transition-colors">
                  <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-400">{t('ambassador.shareWhatsApp')}</span>
                </button>
                <button onClick={handleShareEmail} className="flex flex-col items-center gap-1.5 py-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-xl transition-colors">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-400">{t('ambassador.shareEmail')}</span>
                </button>
                <button onClick={handleShareNative} className="flex flex-col items-center gap-1.5 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl transition-colors">
                  <Share2 className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{t('ambassador.shareMore')}</span>
                </button>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-500 dark:text-gray-400 truncate font-mono">
                  {referralUrl}
                </div>
                <button onClick={handleCopy} className="px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1.5 whitespace-nowrap transition-colors">
                  {copied ? <><Check className="w-3.5 h-3.5 text-green-500" /> {t('ambassador.copied')}</> : <><Copy className="w-3.5 h-3.5" /> {t('ambassador.copyLink')}</>}
                </button>
              </div>
            </div>

            {/* Restaurantes captados */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-white">{t('ambassador.restaurantsTitle')}</h2>
                {restaurants.length > 0 && (
                  <span className="text-xs px-2.5 py-1 bg-[#e94560]/10 text-[#e94560] rounded-full font-semibold">
                    {restaurants.length} {restaurants.length !== 1 ? t('ambassador.registeredCountPlural') : t('ambassador.registeredCount')}
                  </span>
                )}
              </div>
              {statsLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
              ) : restaurants.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                  <UtensilsCrossed className="w-10 h-10 text-gray-200 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t('ambassador.restaurantsEmpty')}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{t('ambassador.restaurantsEmptyDesc')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {restaurants.map(r => {
                    const subInfo = r.subscription_status ? (SUB_STATUS[r.subscription_status] ?? null) : null
                    const isActive = r.subscription_status === 'active'
                    return (
                      <div key={r.restaurant_id} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{r.restaurant_name || 'Restaurante sin nombre'}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                              {t('ambassador.registeredOn')} {new Date(r.joined_at).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          {subInfo ? (
                            <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${subInfo.color}`}>
                              {subInfo.icon} {subInfo.label}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-400">
                              <Clock className="w-3 h-3" /> {t('ambassador.noSubscription')}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <UtensilsCrossed className="w-3.5 h-3.5" />
                            {r.active_tables} {r.active_tables !== 1 ? t('ambassador.tablesPlural') : t('ambassador.tables')}
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3.5 h-3.5" />
                            {r.total_reservations} {r.total_reservations !== 1 ? t('ambassador.reservationsPlural') : t('ambassador.reservations')}
                          </span>
                          <span className={`ml-auto flex items-center gap-1 font-semibold ${isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                            <TrendingUp className="w-3.5 h-3.5" />
                            {isActive ? `${(r.monthly_commission_cts / 100).toFixed(2)} ${t('ambassador.perMonth')}` : `0,00 ${t('ambassador.perMonth')}`}
                          </span>
                        </div>
                        {!r.subscription_status && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
                            <Info className="w-3 h-3" /> {t('ambassador.remindSubscription')}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <HowItWorks commissionRate={ambassador.commission_rate} t={t} />
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>
            )}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">{t('ambassador.whyTitle')}</h2>
              <div className="space-y-3">
                {[
                  { icon: <TrendingUp className="w-5 h-5 text-green-500" />, title: t('ambassador.benefit1Title'), desc: t('ambassador.benefit1Desc') },
                  { icon: <Users className="w-5 h-5 text-blue-500" />, title: t('ambassador.benefit2Title'), desc: t('ambassador.benefit2Desc') },
                  { icon: <Handshake className="w-5 h-5 text-primary-500" />, title: t('ambassador.benefit3Title'), desc: t('ambassador.benefit3Desc') },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-gray-50 dark:bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">{icon}</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={handleApply} disabled={applying} className="w-full py-4 bg-primary-500 text-white rounded-2xl font-semibold hover:bg-primary-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-base">
              {applying ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Award className="w-5 h-5" /> {t('ambassador.apply')}</>}
            </button>
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 px-4">{t('ambassador.applyNote')}</p>
          </div>
        )}
      </main>
    </div>
  )
}

function KpiBox({ icon, value, label, sublabel }: { icon: React.ReactNode; value: string | number; label: string; sublabel?: string }) {
  return (
    <div className="text-center bg-gray-50 dark:bg-gray-900 rounded-xl py-4 px-2">
      <div className="flex items-center justify-center mb-1.5">{icon}</div>
      <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      {sublabel && <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{sublabel}</p>}
    </div>
  )
}

function HowItWorks({ commissionRate, t }: { commissionRate: number; t: (k: string) => string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <h2 className="font-semibold text-gray-900 dark:text-white mb-3">{t('ambassador.howItWorks')}</h2>
      <ol className="space-y-3">
        {[
          t('ambassador.benefit3Desc'),
          t('ambassador.benefit2Desc'),
          `${t('ambassador.withSubscription')} (€10/mes) → ${commissionRate}% = €${(10 * commissionRate / 100).toFixed(2)}/mes`,
          t('ambassador.benefit1Desc'),
        ].map((text, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
            <p className="text-sm text-gray-600 dark:text-gray-300">{text}</p>
          </li>
        ))}
      </ol>
    </div>
  )
}
