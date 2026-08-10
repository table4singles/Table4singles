import { useState, useEffect } from 'react'
import {
  Award, Copy, Check, Users, TrendingUp, ChevronLeft, Loader2, Handshake,
  UtensilsCrossed, CalendarDays, Euro, Info, CheckCircle, XCircle, Clock, AlertCircle,
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useAmbassadorStats } from '@/hooks/useAmbassadorStats'

interface AmbassadorRecord {
  id: string
  status: string
  commission_rate: number
  applied_at: string
}

interface AmbassadorPageProps {
  onNavigate: (page: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

const SUB_STATUS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  active:     { label: 'Suscripción activa',  icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'text-green-600 bg-green-50' },
  trialing:   { label: 'Periodo de prueba',   icon: <Clock className="w-3.5 h-3.5" />,        color: 'text-blue-600 bg-blue-50' },
  past_due:   { label: 'Pago pendiente',      icon: <AlertCircle className="w-3.5 h-3.5" />, color: 'text-orange-600 bg-orange-50' },
  canceled:   { label: 'Cancelada',           icon: <XCircle className="w-3.5 h-3.5" />,     color: 'text-red-500 bg-red-50' },
  incomplete: { label: 'Incompleta',          icon: <AlertCircle className="w-3.5 h-3.5" />, color: 'text-orange-600 bg-orange-50' },
}

export function AmbassadorPage({ onNavigate, onAuthClick }: AmbassadorPageProps) {
  const { user, profile } = useAuth()
  const [ambassador, setAmbassador] = useState<AmbassadorRecord | null>(null)
  const [loadingAmb, setLoadingAmb] = useState(true)
  const [applying, setApplying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { restaurants, totalReferred, activeSubscriptions, estimatedMonthlyEuros, loading: statsLoading } =
    useAmbassadorStats(ambassador ? (user?.id ?? null) : null, ambassador?.commission_rate)

  const referralUrl = user ? `${window.location.origin}/?ref=${user.id}` : ''

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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar currentPage="ambassador" onNavigate={onNavigate} onAuthClick={onAuthClick} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Award className="w-12 h-12 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">Inicia sesión para acceder al programa de embajadores.</p>
          <button onClick={() => onAuthClick('signin')} className="px-6 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors">Iniciar sesión</button>
        </div>
      </div>
    )
  }

  if (profile?.role === 'restaurant') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar currentPage="ambassador" onNavigate={onNavigate} onAuthClick={onAuthClick} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Award className="w-12 h-12 text-gray-300 dark:text-gray-600" />
          <p className="text-gray-500 dark:text-gray-400">El programa de embajadores es exclusivo para usuarios particulares.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar currentPage="ambassador" onNavigate={onNavigate} onAuthClick={onAuthClick} />
      <main className="max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-8">
        <button onClick={() => onNavigate('profile')} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-6">
          <ChevronLeft className="w-4 h-4" /> Volver al perfil
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Programa de Embajadores</h1>
              <p className="text-primary-100 text-sm">Table4Singles</p>
            </div>
          </div>
          <p className="text-primary-100 text-sm leading-relaxed">
            Capta restaurantes y gana el <strong className="text-white">{ambassador?.commission_rate ?? 5}%</strong> de la suscripción mensual de <strong className="text-white">cada restaurante que tú consigas</strong>, de forma indefinida.
          </p>
        </div>

        {/* Nota aclaratoria */}
        <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3 mb-6 text-sm text-blue-700 dark:text-blue-300">
          <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p>
            La comisión es <strong>por cada restaurante que tú captes</strong> con tu enlace. No es sobre el total de la plataforma. Si captas un restaurante con suscripción de 10 €/mes, recibes <strong>0,50 €/mes</strong> mientras mantenga la suscripción activa.
          </p>
        </div>

        {loadingAmb ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : ambassador ? (
          <div className="space-y-5">
            {/* KPIs */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-white">Tu actividad</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ambassador.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500'}`}>
                  {ambassador.status === 'active' ? '✓ Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <KpiBox icon={<Users className="w-5 h-5 text-primary-500" />} value={totalReferred} label="Captados" />
                <KpiBox icon={<CheckCircle className="w-5 h-5 text-green-500" />} value={activeSubscriptions} label="Con suscripción" />
                <KpiBox icon={<Euro className="w-5 h-5 text-yellow-500" />} value={`${estimatedMonthlyEuros.toFixed(2)} €`} label="Est. mensual" sublabel="Activo con Stripe" />
              </div>
            </div>

            {/* Enlace */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Tu enlace de embajador</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Cuando un restaurante se registre usando este enlace, quedará vinculado a ti y generará comisión.
              </p>
              <div className="flex gap-2">
                <div className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 truncate font-mono">
                  {referralUrl}
                </div>
                <button onClick={handleCopy} className="px-4 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors flex items-center gap-2 font-medium text-sm whitespace-nowrap">
                  {copied ? <><Check className="w-4 h-4" /> Copiado</> : <><Copy className="w-4 h-4" /> Copiar</>}
                </button>
              </div>
            </div>

            {/* Restaurantes captados */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Tus restaurantes captados</h2>
              {statsLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
              ) : restaurants.length === 0 ? (
                <div className="text-center py-8">
                  <UtensilsCrossed className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Aún no has captado ningún restaurante.</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Comparte tu enlace para empezar a ganar.</p>
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
                            <p className="font-medium text-gray-900 dark:text-white text-sm">{r.restaurant_name || 'Restaurante sin nombre'}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                              Registrado el {new Date(r.joined_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          {subInfo ? (
                            <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${subInfo.color}`}>
                              {subInfo.icon} {subInfo.label}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-400">Sin suscripción</span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1"><UtensilsCrossed className="w-3.5 h-3.5" /> {r.active_tables} mesa{r.active_tables !== 1 ? 's' : ''} activa{r.active_tables !== 1 ? 's' : ''}</span>
                          <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {r.total_reservations} reserva{r.total_reservations !== 1 ? 's' : ''}</span>
                          <span className={`ml-auto flex items-center gap-1 font-semibold ${isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                            <TrendingUp className="w-3.5 h-3.5" />
                            {isActive ? `${(r.monthly_commission_cts / 100).toFixed(2)} €/mes` : '0,00 €/mes'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <HowItWorks commissionRate={ambassador.commission_rate} />
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">{error}</div>
            )}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">¿Por qué hacerte embajador?</h2>
              <div className="space-y-3">
                {[
                  { icon: <TrendingUp className="w-5 h-5 text-green-500" />, title: '5% sobre la suscripción del restaurante que captes', desc: 'Por cada restaurante que registres con tu enlace y active su suscripción (€10/mes), recibirás €0,50/mes de comisión de ese restaurante, sin límite de tiempo.' },
                  { icon: <Users className="w-5 h-5 text-blue-500" />, title: 'Sin límite de restaurantes', desc: 'Puedes captar tantos restaurantes como quieras. Tu comisión es la suma de lo que genera cada uno de los que hayas traído tú.' },
                  { icon: <Handshake className="w-5 h-5 text-primary-500" />, title: 'Fácil de empezar', desc: 'Solo comparte tu enlace personalizado. El registro y el cálculo de comisiones son automáticos.' },
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
              {applying ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Award className="w-5 h-5" /> Quiero ser embajador</>}
            </button>
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 px-4">
              Al unirte aceptas que Table4Singles calculará y abonará las comisiones según los ingresos reales de los restaurantes que hayas captado, una vez esté activo el sistema de pagos.
            </p>
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

function HowItWorks({ commissionRate }: { commissionRate: number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
      <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Cómo funciona</h2>
      <ol className="space-y-3">
        {[
          'Comparte tu enlace con restaurantes que quieran unirse a Table4Singles.',
          'El restaurante se registra usando tu enlace — queda vinculado a ti automáticamente.',
          `Cuando ese restaurante active su suscripción (€10/mes), recibirás el ${commissionRate}% = €${(10 * commissionRate / 100).toFixed(2)}/mes de ese restaurante.`,
          'La comisión es indefinida: ganas mientras el restaurante mantenga su suscripción activa.',
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
