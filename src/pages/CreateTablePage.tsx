import { useState } from 'react'
import { ArrowLeft, Check, Loader2, Users, MapPin, CalendarDays, CalendarRange } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { ErrorBanner } from '@/components/ErrorBanner'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

const ZONES = [
  { id: 'salon', label: 'Salón' },
  { id: 'vip', label: 'Salón VIP' },
  { id: 'terraza', label: 'Terraza' },
  { id: 'custom', label: 'Zona específica' },
]

interface CreateTablePageProps {
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

export function CreateTablePage({ onNavigate, onAuthClick }: CreateTablePageProps) {
  const { t } = useLanguage()
  const { user, profile } = useAuth()

  const [availableFrom, setAvailableFrom] = useState(new Date().toISOString().split('T')[0])
  const [availableUntil, setAvailableUntil] = useState('')
  const [maxSeats, setMaxSeats] = useState(6)
  const [zone, setZone] = useState('salon')
  const [customZone, setCustomZone] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const locationLabel = zone === 'custom' ? customZone : ZONES.find(z => z.id === zone)?.label ?? ''

  const canSubmit = availableFrom && maxSeats >= 2 && (zone !== 'custom' || customZone.trim().length > 0)

  const handleSubmit = async () => {
    if (!user || !profile) return
    setLoading(true)
    setError(null)

    const { error: err } = await supabase.from('dining_tables').insert({
      host_id: user.id,
      restaurant_name: profile.restaurant_name ?? profile.display_name ?? '',
      restaurant_address: profile.restaurant_address ?? profile.street_address ?? null,
      restaurant_city: profile.city ?? '',
      restaurant_country: profile.country ?? '',
      restaurant_image_url: profile.restaurant_photos?.[0] ?? null,
      date: availableFrom,
      time: null,
      available_until: availableUntil || null,
      max_seats: maxSeats,
      available_seats: maxSeats,
      status: 'open',
      is_active: true,
      description: locationLabel,
      cuisine_type: profile.restaurant_cuisine ?? null,
      languages: null,
    })

    setLoading(false)
    if (!err) setSuccess(true)
    else setError(err.message)
  }

  function resetForm() {
    setSuccess(false)
    setAvailableFrom(new Date().toISOString().split('T')[0])
    setAvailableUntil('')
    setMaxSeats(6)
    setZone('salon')
    setCustomZone('')
    setError(null)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar currentPage="my-tables" onNavigate={onNavigate} onAuthClick={onAuthClick} />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2">¡Mesa creada!</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            Tu mesa está activa y visible para los comensales. Puedes activarla o desactivarla cuando quieras desde la Agenda.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => onNavigate('agenda')}
              className="px-6 py-3 bg-[#e94560] text-white rounded-xl font-medium hover:bg-[#d63d56] transition-colors"
            >
              Ver en Agenda
            </button>
            <button
              onClick={resetForm}
              className="px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Crear otra mesa
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar currentPage="my-tables" onNavigate={onNavigate} onAuthClick={onAuthClick} />
      <main className="max-w-lg mx-auto px-4 py-8 pb-24 md:pb-8">
        <button
          onClick={() => onNavigate('agenda')}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a Agenda
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Nueva mesa</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Mesa en <span className="font-medium text-gray-700 dark:text-gray-300">{profile?.restaurant_name ?? 'tu restaurante'}</span>
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-6">

          {/* Disponibilidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-gray-400" /> Período de disponibilidad
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1">
                  <CalendarRange className="w-3 h-3" /> Disponible desde
                </label>
                <input
                  type="date"
                  value={availableFrom}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setAvailableFrom(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#e94560] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">Disponible hasta (opcional)</label>
                <input
                  type="date"
                  value={availableUntil}
                  min={availableFrom || new Date().toISOString().split('T')[0]}
                  onChange={e => setAvailableUntil(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#e94560] outline-none"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Si no indicas fecha de fin, la mesa permanece disponible hasta que la desactives manualmente.
            </p>
          </div>

          {/* Número de comensales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-gray-400" /> Máximo de comensales</span>
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setMaxSeats(s => Math.max(2, s - 1))}
                className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-600 flex items-center justify-center text-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >−</button>
              <span className="text-3xl font-black text-gray-900 dark:text-white w-12 text-center">{maxSeats}</span>
              <button
                onClick={() => setMaxSeats(s => Math.min(20, s + 1))}
                className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-600 flex items-center justify-center text-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >+</button>
            </div>
          </div>

          {/* Ubicación dentro del local */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gray-400" /> Ubicación en el local</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ZONES.map(z => (
                <button
                  key={z.id}
                  onClick={() => setZone(z.id)}
                  className={`py-2.5 px-4 rounded-xl text-sm font-medium border transition-colors text-left ${
                    zone === z.id
                      ? 'bg-[#e94560] text-white border-[#e94560]'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-[#e94560]/50'
                  }`}
                >
                  {z.label}
                </button>
              ))}
            </div>
            {zone === 'custom' && (
              <input
                type="text"
                placeholder="Ej: Terraza interior, Reservado..."
                value={customZone}
                onChange={e => setCustomZone(e.target.value)}
                className="mt-2 w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#e94560] outline-none"
              />
            )}
          </div>

          {error && <ErrorBanner message={error} />}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="w-full py-3.5 bg-[#e94560] text-white rounded-xl font-semibold hover:bg-[#d63d56] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Crear mesa'}
          </button>
        </div>
      </main>
    </div>
  )
}
