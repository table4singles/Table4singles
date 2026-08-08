import { useState } from 'react'
import { Loader2, ArrowRight, Camera, ChevronLeft, LogOut, UtensilsCrossed, MapPin, Clock, Globe, Phone } from 'lucide-react'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { ErrorBanner } from '@/components/ErrorBanner'
import { LANGUAGE_OPTIONS, INTEREST_OPTIONS } from '@/lib/options'

const ADMIN_EMAIL = 'joseviangles@gmail.com'
const CUISINE_TYPES = ['Italiana', 'Japonesa', 'Mexicana', 'Francesa', 'Tailandesa', 'India', 'China', 'Española', 'Mediterránea', 'Americana', 'Coreana', 'Vietnamita', 'Griega', 'Turca', 'Fusión', 'Otra']
const PRICE_RANGES = ['€', '€€', '€€€', '€€€€']

export function OnboardingPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const isAdmin = user?.email === ADMIN_EMAIL
  const isRestaurant = profile?.role === 'restaurant'

  // User fields
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [fullName, setFullName] = useState(profile?.full_name || profile?.display_name || '')
  const [streetAddress, setStreetAddress] = useState('')
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('')
  const [country, setCountry] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [bio, setBio] = useState('')
  const [phone, setPhone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [languages, setLanguages] = useState<string[]>([])
  const [interests, setInterests] = useState<string[]>([])

  // Restaurant fields
  const [restaurantName, setRestaurantName] = useState(profile?.restaurant_name || profile?.display_name || '')
  const [restaurantAddress, setRestaurantAddress] = useState('')
  const [restaurantCity, setRestaurantCity] = useState('')
  const [restaurantCountry, setRestaurantCountry] = useState('España')
  const [restaurantPhone, setRestaurantPhone] = useState('')
  const [restaurantCuisine, setRestaurantCuisine] = useState('')
  const [restaurantPriceRange, setRestaurantPriceRange] = useState('€€')
  const [restaurantDescription, setRestaurantDescription] = useState('')
  const [restaurantWebsite, setRestaurantWebsite] = useState('')
  const [restaurantHours, setRestaurantHours] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleLanguage = (l: string) => setLanguages(prev => (prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]))
  const toggleInterest = (i: string) => setInterests(prev => (prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]))

  // TEST MODE: solo se requiere un nombre para continuar
  const isValid = isRestaurant ? restaurantName.trim().length > 0 : fullName.trim().length > 0

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingAvatar(true)
    setError(null)
    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar_${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage.from('restaurant-photos').upload(path, file, { upsert: true })
    if (uploadErr) {
      setError(uploadErr.message)
      setUploadingAvatar(false)
      return
    }
    const { data } = supabase.storage.from('restaurant-photos').getPublicUrl(path)
    setAvatarUrl(data.publicUrl)
    setUploadingAvatar(false)
  }

  const handleSubmit = async () => {
    if (!user || !isValid) return
    setSaving(true)
    setError(null)

    const updates = isRestaurant
      ? {
          display_name: restaurantName.trim(),
          restaurant_name: restaurantName.trim(),
          restaurant_address: restaurantAddress.trim(),
          city: restaurantCity.trim(),
          country: restaurantCountry.trim(),
          restaurant_phone: restaurantPhone.trim(),
          restaurant_cuisine: restaurantCuisine,
          restaurant_price_range: restaurantPriceRange,
          restaurant_description: restaurantDescription.trim(),
          restaurant_website: restaurantWebsite.trim() || null,
          restaurant_hours: restaurantHours.trim() || null,
          onboarding_completed: true,
        }
      : {
          avatar_url: avatarUrl || null,
          full_name: fullName.trim(),
          display_name: fullName.trim(),
          street_address: streetAddress.trim(),
          city: city.trim(),
          province: province.trim(),
          country: country.trim(),
          date_of_birth: dateOfBirth,
          bio: bio.trim(),
          phone: phone.trim(),
          instagram: instagram.trim() || null,
          languages: languages.length > 0 ? languages : null,
          interests: interests.length > 0 ? interests : null,
          onboarding_completed: true,
        }

    const { error: err } = await supabase.from('profiles').update(updates).eq('id', user.id)
    if (err) {
      setError(err.message)
      setSaving(false)
      return
    }
    await refreshProfile()
    setSaving(false)
    onNavigate('browse')
  }

  const handleBack = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            <LogOut className="w-3.5 h-3.5" />
            Cerrar sesión
          </button>
          <div className="text-center">
            {isRestaurant
              ? <UtensilsCrossed className="w-8 h-8 text-primary-500 mx-auto mb-2" />
              : <MapPin className="w-8 h-8 text-primary-500 mx-auto mb-2" />
            }
            <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
              {isRestaurant ? 'Configura tu restaurante' : 'Completa tu perfil'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {isRestaurant
                ? 'Rellena los datos de tu local para que los comensales puedan encontrarte'
                : 'Necesitamos estos datos antes de que empieces a usar Table4Singles'}
            </p>
          </div>
        </div>

        {error && <ErrorBanner message={error} className="mb-4" />}

        {/* ── USUARIO ── */}
        {!isRestaurant && (
          <div className="space-y-4">
            <div className="flex flex-col items-center mb-2">
              <label className="relative w-24 h-24 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-400 transition-colors cursor-pointer flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
                ) : uploadingAvatar ? (
                  <Loader2 className="w-6 h-6 text-gray-400 dark:text-gray-500 animate-spin" />
                ) : (
                  <Camera className="w-7 h-7 text-gray-400 dark:text-gray-500" />
                )}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} disabled={uploadingAvatar} className="hidden" />
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                {isAdmin ? 'Foto de perfil (opcional)' : 'Foto de perfil (obligatoria)'}
              </p>
            </div>

            <Field label="Nombre completo" value={fullName} onChange={setFullName} placeholder="Jose Angles" />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Dirección</label>
              <div className="space-y-3">
                <Field label="Calle y número" value={streetAddress} onChange={setStreetAddress} placeholder="Calle Mayor 12, 3ºB" hideLabel />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Ciudad" value={city} onChange={setCity} placeholder="Madrid" hideLabel />
                  <Field label="Provincia" value={province} onChange={setProvince} placeholder="Madrid" hideLabel />
                </div>
                <Field label="País" value={country} onChange={setCountry} placeholder="España" hideLabel />
              </div>
            </div>

            <Field label="Fecha de nacimiento" value={dateOfBirth} onChange={setDateOfBirth} type="date" />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Sobre ti</label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                rows={3}
                placeholder="Cuéntanos algo sobre ti..."
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Teléfono</label>
              <PhoneInput
                international
                defaultCountry="ES"
                value={phone}
                onChange={v => setPhone(v || '')}
                className="phone-input-custom"
              />
            </div>

            <Field label="Correo electrónico" value={user?.email || ''} onChange={() => {}} disabled />
            <Field label="Instagram (opcional)" value={instagram} onChange={setInstagram} placeholder="@tuusuario" />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Idiomas que hablas (opcional)</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map(l => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => toggleLanguage(l)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${languages.includes(l) ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Tus intereses (opcional)</label>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map(i => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleInterest(i)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${interests.includes(i) ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── RESTAURANTE ── */}
        {isRestaurant && (
          <div className="space-y-4">
            <Field label="Nombre del restaurante *" value={restaurantName} onChange={setRestaurantName} placeholder="La Taberna del Chef" />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" /> Ubicación *
              </label>
              <div className="space-y-3">
                <Field label="Dirección" value={restaurantAddress} onChange={setRestaurantAddress} placeholder="Calle Mayor 12, local 1" hideLabel />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Ciudad" value={restaurantCity} onChange={setRestaurantCity} placeholder="Madrid" hideLabel />
                  <Field label="País" value={restaurantCountry} onChange={setRestaurantCountry} placeholder="España" hideLabel />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-400" /> Teléfono de contacto *
              </label>
              <input
                value={restaurantPhone}
                onChange={e => setRestaurantPhone(e.target.value)}
                placeholder="+34 600 000 000"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5 flex items-center gap-1.5">
                <UtensilsCrossed className="w-3.5 h-3.5 text-gray-400" /> Tipo de cocina *
              </label>
              <select
                value={restaurantCuisine}
                onChange={e => setRestaurantCuisine(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option value="">Seleccionar tipo de cocina...</option>
                {CUISINE_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Rango de precios *</label>
              <div className="flex gap-2">
                {PRICE_RANGES.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setRestaurantPriceRange(p)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${restaurantPriceRange === p ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Descripción del restaurante *</label>
              <textarea
                value={restaurantDescription}
                onChange={e => setRestaurantDescription(e.target.value)}
                rows={3}
                placeholder="Cuéntanos qué hace especial a tu restaurante..."
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-400" /> Horarios (opcional)
              </label>
              <textarea
                value={restaurantHours}
                onChange={e => setRestaurantHours(e.target.value)}
                rows={2}
                placeholder="Ej: Lun-Vie 13:00-16:00 / 20:00-24:00. Sáb-Dom 12:00-24:00"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-gray-400" /> Página web (opcional)
              </label>
              <input
                value={restaurantWebsite}
                onChange={e => setRestaurantWebsite(e.target.value)}
                placeholder="https://www.mirestaurante.com"
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
              Podrás añadir fotos, especialidades y más desde tu perfil después del registro.
            </p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!isValid || saving}
          className="mt-6 w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
        >
          {saving
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <>{isRestaurant ? 'Activar mi restaurante' : 'Continuar'} <ArrowRight className="w-4 h-4" /></>
          }
        </button>
      </div>
    </div>
  )
}

function Field({
  label, value, onChange, placeholder, type = 'text', disabled = false, hideLabel = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  disabled?: boolean
  hideLabel?: boolean
}) {
  return (
    <div>
      {!hideLabel && <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={hideLabel ? label : placeholder}
        disabled={disabled}
        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:text-gray-500 dark:disabled:text-gray-400"
      />
    </div>
  )
}
