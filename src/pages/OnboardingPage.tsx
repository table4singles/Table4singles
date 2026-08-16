import { useState } from 'react'
import { Loader2, ArrowRight, Camera, ChevronLeft, LogOut, UtensilsCrossed, MapPin, Clock, Globe, Phone, Check, X, Sparkles, Tag, Link } from 'lucide-react'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { ErrorBanner } from '@/components/ErrorBanner'
import { RestaurantHoursPicker } from '@/components/RestaurantHoursPicker'
import { LANGUAGE_OPTIONS, INTEREST_OPTIONS } from '@/lib/options'

const ADMIN_EMAIL = 'joseviangles@gmail.com'
const CUISINE_TYPES = ['Italiana', 'Japonesa', 'Mexicana', 'Francesa', 'Tailandesa', 'India', 'China', 'Española', 'Mediterránea', 'Americana', 'Coreana', 'Vietnamita', 'Griega', 'Turca', 'Fusión', 'Otra']
const PRICE_RANGES = ['0€-50€', '50€-100€', '100€-200€', '+200€']

const RESTAURANT_STEPS = [
  { label: 'Identidad', icon: UtensilsCrossed },
  { label: 'Ubicación', icon: MapPin },
  { label: 'Detalles', icon: Clock },
  { label: 'Confirmar', icon: Check },
]

export function OnboardingPage({ onNavigate }: { onNavigate: (page: string, id?: string) => void }) {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const isAdmin = user?.email === ADMIN_EMAIL
  const isRestaurant = profile?.role === 'restaurant'

  // Wizard step for restaurants
  const [step, setStep] = useState(1)

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
  const [restaurantPriceRange, setRestaurantPriceRange] = useState('50€-100€')
  const [restaurantDescription, setRestaurantDescription] = useState('')
  const [restaurantWebsite, setRestaurantWebsite] = useState('')
  const [restaurantHours, setRestaurantHours] = useState('')
  const [restaurantMenuUrl, setRestaurantMenuUrl] = useState('')
  const [restaurantOffers, setRestaurantOffers] = useState('')
  const [restaurantSpecialties, setRestaurantSpecialties] = useState<string[]>([])
  const [specialtyInput, setSpecialtyInput] = useState('')

  const addSpecialty = (value: string) => {
    const trimmed = value.trim()
    if (trimmed && !restaurantSpecialties.includes(trimmed)) {
      setRestaurantSpecialties(prev => [...prev, trimmed])
    }
    setSpecialtyInput('')
  }
  const removeSpecialty = (s: string) => setRestaurantSpecialties(prev => prev.filter(x => x !== s))

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleLanguage = (l: string) => setLanguages(prev => (prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]))
  const toggleInterest = (i: string) => setInterests(prev => (prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]))

  // Validación por paso
  const step1Valid = restaurantName.trim().length > 0
  const isValid = isRestaurant ? step1Valid : fullName.trim().length > 0

  const canAdvance = () => {
    if (step === 1) return step1Valid
    return true // steps 2 and 3 are optional
  }

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
          avatar_url: avatarUrl || null,
          restaurant_address: restaurantAddress.trim(),
          city: restaurantCity.trim(),
          country: restaurantCountry.trim(),
          restaurant_phone: restaurantPhone.trim(),
          restaurant_cuisine: restaurantCuisine,
          restaurant_price_range: restaurantPriceRange,
          restaurant_description: restaurantDescription.trim(),
          restaurant_website: restaurantWebsite.trim() || null,
          restaurant_hours: restaurantHours.trim() || null,
          restaurant_menu_url: restaurantMenuUrl.trim() || null,
          restaurant_offers: restaurantOffers.trim() || null,
          restaurant_specialties: restaurantSpecialties.length > 0 ? restaurantSpecialties : null,
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
          date_of_birth: dateOfBirth || null,
          bio: bio.trim() || null,
          phone: phone.trim() || null,
          instagram: instagram.trim() || null,
          languages: languages.length > 0 ? languages : null,
          interests: interests.length > 0 ? interests : null,
          onboarding_completed: true,
        }

    const { error: err } = await supabase.from('profiles').update(updates).eq('id', user.id)
    if (err) {
      const msg = err.message || ''
      setError(
        msg.includes('invalid input syntax for type date')
          ? 'La fecha de nacimiento no es válida. Elígela en el calendario o déjala vacía.'
          : msg
      )
      setSaving(false)
      return
    }
    await refreshProfile()

    // Enviar email de bienvenida con flyer personalizado al restaurante
    // Se hace AWAIT para evitar que el navegador cancele la petición al navegar (EarlyDrop)
    if (isRestaurant) {
      try {
        await supabase.functions.invoke('send-welcome-restaurant', {
          body: { restaurantId: user.id },
        })
      } catch { /* silencioso — no bloquear si falla */ }
    }

    setSaving(false)
    const pendingTable = !isRestaurant ? localStorage.getItem('t4s_invite_table') : null
    if (pendingTable) {
      localStorage.removeItem('t4s_invite_table')
      onNavigate('table-detail', pendingTable)
    } else {
      onNavigate('browse')
    }
  }

  const handleBack = async () => {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 md:p-8">

        {/* Cabecera común */}
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

        {/* Indicador de pasos (solo restaurante) */}
        {isRestaurant && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              {RESTAURANT_STEPS.map((s, idx) => {
                const num = idx + 1
                const isCompleted = num < step
                const isCurrent = num === step
                return (
                  <div key={s.label} className="flex-1 flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-all ${isCompleted ? 'bg-primary-500 text-white' : isCurrent ? 'bg-primary-100 dark:bg-primary-900/40 border-2 border-primary-500 text-primary-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'}`}>
                      {isCompleted ? <Check className="w-4 h-4" /> : <s.icon className="w-3.5 h-3.5" />}
                    </div>
                    <span className={`text-[10px] font-medium ${isCurrent ? 'text-primary-600' : 'text-gray-400 dark:text-gray-500'}`}>{s.label}</span>
                  </div>
                )
              })}
            </div>
            {/* Línea de progreso */}
            <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mx-4">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-500"
                style={{ width: `${((step - 1) / (RESTAURANT_STEPS.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {error && <ErrorBanner message={error} className="mb-4" />}

        {/* ── USUARIO (sin wizard) ── */}
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

        {/* ── RESTAURANTE WIZARD ── */}
        {isRestaurant && (
          <div className="space-y-4">
            {/* Paso 1: Identidad */}
            {step === 1 && (
              <>
                {/* Logo del restaurante */}
                <div className="flex flex-col items-center mb-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3 self-start">
                    Logo del restaurante <span className="text-gray-400 font-normal">(recomendado)</span>
                  </p>
                  <label className="relative w-28 h-28 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-400 transition-colors cursor-pointer flex flex-col items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900 group">
                    {avatarUrl ? (
                      <>
                        <img src={avatarUrl} alt="Logo" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                      </>
                    ) : uploadingAvatar ? (
                      <Loader2 className="w-7 h-7 text-gray-400 animate-spin" />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 text-gray-400 dark:text-gray-500 mb-1" />
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 text-center px-2">Subir logo</span>
                      </>
                    )}
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} disabled={uploadingAvatar} className="hidden" />
                  </label>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 text-center">
                    Aparece en tu perfil y en el flyer que recibirás por email
                  </p>
                </div>

                <Field label="Nombre del restaurante *" value={restaurantName} onChange={setRestaurantName} placeholder="La Taberna del Chef" />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5 flex items-center gap-1.5">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-gray-400" /> Tipo de cocina
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Rango de precios</label>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Descripción del restaurante</label>
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
                    <Sparkles className="w-3.5 h-3.5 text-gray-400" /> Especialidades <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">Escribe un plato o producto estrella y pulsa Enter o la coma para añadirlo</p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {restaurantSpecialties.map(s => (
                      <span key={s} className="flex items-center gap-1 px-2.5 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-medium">
                        {s}
                        <button type="button" onClick={() => removeSpecialty(s)} className="hover:text-primary-900 dark:hover:text-primary-100">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    value={specialtyInput}
                    onChange={e => setSpecialtyInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSpecialty(specialtyInput) }
                    }}
                    onBlur={() => { if (specialtyInput.trim()) addSpecialty(specialtyInput) }}
                    placeholder="Ej: Paella valenciana, Pulpo a la gallega..."
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </>
            )}

            {/* Paso 2: Ubicación */}
            {step === 2 && (
              <>
                <div className="flex items-center gap-2 text-primary-600 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm font-medium">¿Dónde está tu restaurante?</span>
                </div>
                <div className="space-y-3">
                  <Field label="Dirección" value={restaurantAddress} onChange={setRestaurantAddress} placeholder="Calle Mayor 12, local 1" />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Ciudad" value={restaurantCity} onChange={setRestaurantCity} placeholder="Madrid" />
                    <Field label="País" value={restaurantCountry} onChange={setRestaurantCountry} placeholder="España" />
                  </div>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500">La ciudad se usa para que los usuarios te encuentren en el buscador.</p>
              </>
            )}

            {/* Paso 3: Contacto y horarios */}
            {step === 3 && (
              <>
                <div className="flex items-center gap-2 text-primary-600 mb-2">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm font-medium">Datos de contacto</span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" /> Teléfono de contacto
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
                    <Clock className="w-3.5 h-3.5 text-gray-400" /> Horarios (opcional)
                  </label>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-2">
                    Elige los días y luego la hora de apertura y cierre. Puedes añadir varios tramos (comida, cena, fin de semana…).
                  </p>
                  <RestaurantHoursPicker value={restaurantHours} onChange={setRestaurantHours} />
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-1.5">
                    <Link className="w-3.5 h-3.5 text-gray-400" /> URL del menú (opcional)
                  </label>
                  <input
                    value={restaurantMenuUrl}
                    onChange={e => setRestaurantMenuUrl(e.target.value)}
                    placeholder="https://www.mirestaurante.com/menu"
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-gray-400" /> Ofertas y promociones (opcional)
                  </label>
                  <textarea
                    value={restaurantOffers}
                    onChange={e => setRestaurantOffers(e.target.value)}
                    rows={2}
                    placeholder="Ej: Menú del día 15€, 2x1 en cócteles los martes..."
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                  />
                </div>
              </>
            )}

            {/* Paso 4: Confirmar */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-primary-600 mb-2">
                  <Check className="w-4 h-4" />
                  <span className="text-sm font-medium">Revisa tu información</span>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-3 text-sm">
                  <SummaryRow label="Nombre" value={restaurantName} />
                  {restaurantCuisine && <SummaryRow label="Cocina" value={restaurantCuisine} />}
                  <SummaryRow label="Precio" value={restaurantPriceRange} />
                  {restaurantDescription && <SummaryRow label="Descripción" value={restaurantDescription} multiline />}
                  {restaurantSpecialties.length > 0 && <SummaryRow label="Especialidades" value={restaurantSpecialties.join(', ')} multiline />}
                  {restaurantCity && <SummaryRow label="Ciudad" value={`${restaurantCity}${restaurantCountry ? `, ${restaurantCountry}` : ''}`} />}
                  {restaurantPhone && <SummaryRow label="Teléfono" value={restaurantPhone} />}
                  {restaurantHours && <SummaryRow label="Horarios" value={restaurantHours} />}
                  {restaurantWebsite && <SummaryRow label="Web" value={restaurantWebsite} />}
                  {restaurantMenuUrl && <SummaryRow label="Menú" value={restaurantMenuUrl} />}
                  {restaurantOffers && <SummaryRow label="Ofertas" value={restaurantOffers} multiline />}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                  Podrás editar todos estos datos y añadir fotos desde tu perfil de restaurante.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Botones de navegación */}
        <div className={`mt-6 flex gap-3 ${isRestaurant && step > 1 ? 'flex-row' : ''}`}>
          {isRestaurant && step > 1 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="px-4 py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" /> Atrás
            </button>
          )}
          {isRestaurant && step < 4 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canAdvance()}
              className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
            >
              Siguiente <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!isValid || saving}
              className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
            >
              {saving
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <>{isRestaurant ? '¡Activar mi restaurante!' : 'Continuar'} <ArrowRight className="w-4 h-4" /></>
              }
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function SummaryRow({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className={`flex ${multiline ? 'flex-col gap-0.5' : 'items-center justify-between'}`}>
      <span className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wide">{label}</span>
      <span className={`text-gray-900 dark:text-white font-medium ${multiline ? 'text-xs mt-0.5' : 'text-right'}`}>{value}</span>
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
