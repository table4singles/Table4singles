import { useState } from 'react'
import { ArrowLeft, Check, Loader2, Users, MapPin, CalendarDays, CalendarRange, Sparkles } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { PageHeader } from '@/components/PageHeader'
import { ErrorBanner } from '@/components/ErrorBanner'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

const ZONE_IDS = ['salon', 'vip', 'terraza', 'custom'] as const

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
  const [isSpecial, setIsSpecial] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [guestBio, setGuestBio] = useState('')
  const [guestPhotoUrl, setGuestPhotoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const locationLabel = zone === 'custom' ? customZone : t(`createTable.zone.${zone}`)

  const canSubmit = availableFrom && maxSeats >= 2 && (zone !== 'custom' || customZone.trim().length > 0) && (!isSpecial || guestName.trim().length > 0)

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
      is_special: isSpecial,
      special_guest_name: isSpecial ? guestName.trim() : null,
      special_guest_bio: isSpecial ? guestBio.trim() || null : null,
      special_guest_photo_url: isSpecial ? guestPhotoUrl.trim() || null : null,
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
    setIsSpecial(false)
    setGuestName('')
    setGuestBio('')
    setGuestPhotoUrl('')
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
          <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2">{t('createTable.success.title')}</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            {t('createTable.success.desc')}
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => onNavigate('agenda')}
              className="px-6 py-3 bg-[#129a93] text-white rounded-xl font-medium hover:bg-[#0b7f79] transition-colors"
            >
              {t('createTable.success.viewAgenda')}
            </button>
            <button
              onClick={resetForm}
              className="px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('createTable.success.createAnother')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar currentPage="my-tables" onNavigate={onNavigate} onAuthClick={onAuthClick} />
      <main className="max-w-lg mx-auto px-4 py-8 pb-24 lg:pb-8">
        <button
          onClick={() => onNavigate('agenda')}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> {t('createTable.backToAgenda')}
        </button>

        <PageHeader
          title={t('createTable.title')}
          subtitle={`${t('createTable.tableAt')} ${profile?.restaurant_name ?? t('createTable.yourRestaurant')}`}
          variant="restaurant"
        />

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-6">

          {/* Disponibilidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4 text-gray-400" /> {t('createTable.availability')}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1">
                  <CalendarRange className="w-3 h-3" /> {t('createTable.availableFrom')}
                </label>
                <input
                  type="date"
                  value={availableFrom}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setAvailableFrom(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#129a93] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1.5">{t('createTable.availableUntil')}</label>
                <input
                  type="date"
                  value={availableUntil}
                  min={availableFrom || new Date().toISOString().split('T')[0]}
                  onChange={e => setAvailableUntil(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#129a93] outline-none"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              {t('createTable.availabilityHint')}
            </p>
          </div>

          {/* Número de comensales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-gray-400" /> {t('createTable.maxSeats')}</span>
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
              <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gray-400" /> {t('createTable.location')}</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ZONE_IDS.map(id => (
                <button
                  key={id}
                  onClick={() => setZone(id)}
                  className={`py-2.5 px-4 rounded-xl text-sm font-medium border transition-colors text-left ${
                    zone === id
                      ? 'bg-[#129a93] text-white border-[#129a93]'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-[#129a93]/50'
                  }`}
                >
                  {t(`createTable.zone.${id}`)}
                </button>
              ))}
            </div>
            {zone === 'custom' && (
              <input
                type="text"
                placeholder={t('createTable.customZonePlaceholder')}
                value={customZone}
                onChange={e => setCustomZone(e.target.value)}
                className="mt-2 w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#129a93] outline-none"
              />
            )}
          </div>

          {/* Invitado especial */}
          <div>
            <button
              type="button"
              onClick={() => setIsSpecial(v => !v)}
              className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl border text-left transition-colors ${
                isSpecial ? 'border-[#129a93] bg-[#129a93]/5' : 'border-gray-200 dark:border-gray-600 hover:border-[#129a93]/50'
              }`}
            >
              <Sparkles className={`w-4 h-4 flex-shrink-0 ${isSpecial ? 'text-[#129a93]' : 'text-gray-400'}`} />
              <span className="flex-1">
                <span className={`block text-sm font-medium ${isSpecial ? 'text-[#129a93]' : 'text-gray-700 dark:text-gray-200'}`}>{t('specialGuest.toggleLabel')}</span>
                <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t('specialGuest.toggleHint')}</span>
              </span>
              <span className={`w-10 h-6 rounded-full flex-shrink-0 relative transition-colors ${isSpecial ? 'bg-[#129a93]' : 'bg-gray-200 dark:bg-gray-600'}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${isSpecial ? 'left-[18px]' : 'left-0.5'}`} />
              </span>
            </button>

            {isSpecial && (
              <div className="mt-3 space-y-3 pl-1">
                <input
                  type="text"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  placeholder={t('specialGuest.namePlaceholder')}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#129a93] outline-none"
                />
                <textarea
                  value={guestBio}
                  onChange={e => setGuestBio(e.target.value)}
                  rows={2}
                  placeholder={t('specialGuest.bioPlaceholder')}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#129a93] outline-none resize-none"
                />
                <input
                  type="url"
                  value={guestPhotoUrl}
                  onChange={e => setGuestPhotoUrl(e.target.value)}
                  placeholder={t('specialGuest.photoPlaceholder')}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#129a93] outline-none"
                />
              </div>
            )}
          </div>

          {error && <ErrorBanner message={error} />}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="w-full py-3.5 bg-[#129a93] text-white rounded-xl font-semibold hover:bg-[#0b7f79] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t('createTable.submit')}
          </button>
        </div>
      </main>
    </div>
  )
}
