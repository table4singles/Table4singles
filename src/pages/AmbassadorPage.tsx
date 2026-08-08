import { useState, useEffect } from 'react'
import { Award, Copy, Check, Users, TrendingUp, ChevronLeft, Loader2, Star, Handshake } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

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

export function AmbassadorPage({ onNavigate, onAuthClick }: AmbassadorPageProps) {
  const { user, profile } = useAuth()
  const [ambassador, setAmbassador] = useState<AmbassadorRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [restaurantsReferred, setRestaurantsReferred] = useState(0)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const referralUrl = user ? `${window.location.origin}/?ref=${user.id}` : ''

  useEffect(() => {
    if (!user) return
    Promise.all([
      supabase.from('ambassadors').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('profiles').select('id', { count: 'exact', head: true })
        .eq('referred_by', user.id)
        .eq('role', 'restaurant'),
    ]).then(([{ data: amb }, { count }]) => {
      setAmbassador(amb)
      setRestaurantsReferred(count || 0)
      setLoading(false)
    })
  }, [user])

  const handleApply = async () => {
    if (!user) return
    setApplying(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('ambassadors')
      .insert({ user_id: user.id })
      .select()
      .single()
    if (err) {
      setError(err.message)
    } else {
      setAmbassador(data)
    }
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
          <button onClick={() => onAuthClick('signin')} className="px-6 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors">
            Iniciar sesión
          </button>
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

        <button
          onClick={() => onNavigate('profile')}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-6"
        >
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
            Presenta Table4Singles a restaurantes y gana una comisión del <strong className="text-white">5%</strong> de los ingresos que generen indefinidamente.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400 dark:text-gray-500" />
          </div>
        ) : ambassador ? (
          /* ── YA ES EMBAJADOR ── */
          <div className="space-y-4">
            {/* Estado */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 dark:text-white">Tu estado</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ambassador.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                  {ambassador.status === 'active' ? '✓ Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center bg-gray-50 dark:bg-gray-900 rounded-xl py-4">
                  <Users className="w-5 h-5 text-primary-500 mx-auto mb-1.5" />
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{restaurantsReferred}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Restaurantes</p>
                </div>
                <div className="text-center bg-gray-50 dark:bg-gray-900 rounded-xl py-4">
                  <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1.5" />
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{ambassador.commission_rate}%</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Comisión</p>
                </div>
                <div className="text-center bg-gray-50 dark:bg-gray-900 rounded-xl py-4">
                  <Star className="w-5 h-5 text-yellow-400 mx-auto mb-1.5" />
                  <p className="text-xl font-bold text-gray-900 dark:text-white">—</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">€ acumulado</p>
                </div>
              </div>
            </div>

            {/* Enlace de referido */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-1">Tu enlace de embajador</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Comparte este enlace con restaurantes. Cuando se registren y activen su cuenta, se vinculan automáticamente a ti.
              </p>
              <div className="flex gap-2">
                <div className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-700 dark:text-gray-300 truncate font-mono">
                  {referralUrl}
                </div>
                <button
                  onClick={handleCopy}
                  className="px-4 py-2.5 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors flex items-center gap-2 font-medium text-sm whitespace-nowrap"
                >
                  {copied ? <><Check className="w-4 h-4" /> Copiado</> : <><Copy className="w-4 h-4" /> Copiar</>}
                </button>
              </div>
            </div>

            {/* Cómo funciona */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Cómo funciona</h2>
              <ol className="space-y-3">
                {[
                  { n: 1, text: 'Comparte tu enlace con restaurantes que quieran unirse a Table4Singles.' },
                  { n: 2, text: 'El restaurante se registra usando tu enlace y completa su perfil.' },
                  { n: 3, text: 'Cuando el restaurante empiece a generar ingresos, recibirás el 5% de forma automática.' },
                  { n: 4, text: 'La comisión es indefinida: ganas mientras el restaurante use la plataforma.' },
                ].map(({ n, text }) => (
                  <li key={n} className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{n}</span>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : (
          /* ── SOLICITAR SER EMBAJADOR ── */
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Beneficios */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">¿Por qué hacerte embajador?</h2>
              <div className="space-y-3">
                {[
                  { icon: <TrendingUp className="w-5 h-5 text-green-500" />, title: '5% de comisión indefinida', desc: 'Por cada restaurante que captes, recibirás el 5% de todos los ingresos que genere en la plataforma, sin límite de tiempo.' },
                  { icon: <Users className="w-5 h-5 text-blue-500" />, title: 'Sin límite de restaurantes', desc: 'Puedes captar tantos restaurantes como quieras. Cuantos más traigas, más ganas.' },
                  { icon: <Handshake className="w-5 h-5 text-primary-500" />, title: 'Fácil de empezar', desc: 'Solo comparte tu enlace. El registro y el pago son automáticos.' },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3">
                    <div className="w-9 h-9 bg-gray-50 dark:bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
                      {icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleApply}
              disabled={applying}
              className="w-full py-4 bg-primary-500 text-white rounded-2xl font-semibold hover:bg-primary-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-base"
            >
              {applying ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Award className="w-5 h-5" /> Quiero ser embajador</>}
            </button>

            <p className="text-center text-xs text-gray-400 dark:text-gray-500 px-4">
              Al unirte aceptas que Table4Singles calculará y abonará las comisiones según los ingresos reales registrados en la plataforma una vez esté activo el sistema de pagos.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
