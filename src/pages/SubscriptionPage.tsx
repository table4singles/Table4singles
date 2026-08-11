import { useState } from 'react'
import { ArrowLeft, CheckCircle, AlertCircle, Clock, XCircle, CreditCard, Loader2, Zap } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { useViewMode } from '@/contexts/ViewModeContext'
import { supabase } from '@/lib/supabase'

interface SubscriptionPageProps {
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

const STATUS_LABEL: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active: {
    label: 'Activa',
    color: 'text-green-700 bg-green-50 border-green-200',
    icon: <CheckCircle className="w-4 h-4 text-green-600" />,
  },
  trialing: {
    label: 'Periodo de prueba',
    color: 'text-blue-700 bg-blue-50 border-blue-200',
    icon: <Clock className="w-4 h-4 text-blue-600" />,
  },
  past_due: {
    label: 'Pago pendiente',
    color: 'text-orange-700 bg-orange-50 border-orange-200',
    icon: <AlertCircle className="w-4 h-4 text-orange-600" />,
  },
  canceled: {
    label: 'Cancelada',
    color: 'text-red-700 bg-red-50 border-red-200',
    icon: <XCircle className="w-4 h-4 text-red-600" />,
  },
  incomplete: {
    label: 'Incompleta',
    color: 'text-orange-700 bg-orange-50 border-orange-200',
    icon: <AlertCircle className="w-4 h-4 text-orange-600" />,
  },
  unpaid: {
    label: 'Impagada',
    color: 'text-red-700 bg-red-50 border-red-200',
    icon: <AlertCircle className="w-4 h-4 text-red-600" />,
  },
}

const FEATURES = [
  'Crea y gestiona mesas ilimitadas',
  'Toggle activa/inactiva en tiempo real',
  'Agenda de sala en vivo (Live · Lista · Calendario)',
  'Comensales confirmados y chat de mesa',
  'Reseñas y estadísticas de tu restaurante',
  'Visibilidad en el catálogo de Table4Singles',
]

export function SubscriptionPage({ onNavigate, onAuthClick }: SubscriptionPageProps) {
  const { profile, refreshProfile } = useAuth()
  const { effectiveRole } = useViewMode()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!profile || effectiveRole !== 'restaurant') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar currentPage="subscription" onNavigate={onNavigate} onAuthClick={onAuthClick} />
        <div className="text-center py-20">
          <p className="text-gray-500 dark:text-gray-400">Esta sección es solo para cuentas de restaurante.</p>
          <button onClick={() => onNavigate('browse')} className="mt-4 text-primary-600 dark:text-primary-400 font-medium text-sm">Volver</button>
        </div>
      </div>
    )
  }

  const status = profile.subscription_status
  const isActive = status === 'active' || status === 'trialing'
  const statusInfo = status ? (STATUS_LABEL[status] ?? null) : null

  const handleSubscribe = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('create-subscription-checkout', {})
      if (fnErr) throw fnErr
      if (data?.url) {
        window.location.href = data.url
      } else {
        throw new Error('No se recibió la URL de pago')
      }
    } catch (err: any) {
      setError(err.message || 'Error al iniciar el pago. Inténtalo de nuevo.')
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
          <ArrowLeft className="w-4 h-4" /> Volver al dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Suscripción</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Gestiona tu plan mensual de Table4Singles</p>
        </div>

        {/* Estado actual */}
        {statusInfo && (
          <div className={`flex items-center gap-2 border rounded-xl px-4 py-3 mb-6 text-sm font-medium ${statusInfo.color}`}>
            {statusInfo.icon}
            <span>Suscripción <strong>{statusInfo.label}</strong></span>
          </div>
        )}

        {/* Card de plan */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
          {/* Header plan */}
          <div className="bg-gradient-to-br from-[#e94560] to-[#c73652] px-6 py-6 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-5 h-5" />
              <span className="text-sm font-semibold uppercase tracking-wide opacity-90">Plan Restaurante</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-display font-bold">10 €</span>
              <span className="text-sm opacity-80">/ mes</span>
            </div>
            <p className="text-sm opacity-80 mt-1">Facturación mensual · Cancela cuando quieras</p>
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
              <div className="text-center py-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Tu suscripción está activa. Para cancelar o cambiar el método de pago, contacta con{' '}
                  <a href="mailto:hola@table4singles.online" className="text-primary-600 hover:underline">
                    hola@table4singles.online
                  </a>
                  .
                </p>
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
                    Redirigiendo a la pasarela de pago...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Suscribirse por 10 €/mes
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Info pago usuarios */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">¿Cuánto pagan los usuarios?</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Cada usuario abona un depósito de <strong className="text-gray-700 dark:text-gray-200">2 € por reserva</strong>. Este importe es reembolsable si el usuario cancela con suficiente antelación.
          </p>
        </div>
      </main>
    </div>
  )
}
