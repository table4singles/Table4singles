import React, { useState, useEffect } from 'react'
import { Save, Loader2, Check, Camera, X, UtensilsCrossed, ShieldCheck, CalendarDays, Gift, Clock, Hash, Link, Tag, MapPin, Phone, Globe, Plus, Award } from 'lucide-react'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { Navbar } from '@/components/Navbar'
import { ErrorBanner } from '@/components/ErrorBanner'
import { ShareButton } from '@/components/ShareButton'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { LANGUAGE_OPTIONS, INTEREST_OPTIONS } from '@/lib/options'
import { useMyTables } from '@/hooks/useTables'
import { useDinerTrustScore } from '@/hooks/useDinerReviews'

const CUISINE_TYPES = ['Italiana', 'Japonesa', 'Mexicana', 'Francesa', 'Tailandesa', 'India', 'China', 'Española', 'Mediterránea', 'Americana', 'Coreana', 'Vietnamita', 'Griega', 'Turca', 'Fusión', 'Otra']
const PRICE_RANGES = ['€', '€€', '€€€', '€€€€']

interface ProfilePageProps {
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

export function ProfilePage({ onNavigate, onAuthClick }: ProfilePageProps) {
  const { t } = useLanguage()
  const { profile, refreshProfile, user } = useAuth()
  const isRestaurant = profile?.role === 'restaurant'
  const { hosting, reservations } = useMyTables(!isRestaurant ? user?.id ?? null : null)
  const { score: trustScore } = useDinerTrustScore(!isRestaurant ? user?.id ?? null : null)

  const [displayName, setDisplayName] = useState('')
  const [fullName, setFullName] = useState('')
  const [bio, setBio] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('')
  const [country, setCountry] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [phone, setPhone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [languages, setLanguages] = useState<string[]>([])
  const [interests, setInterests] = useState<string[]>([])
  const [restaurantName, setRestaurantName] = useState('')
  const [restaurantAddress, setRestaurantAddress] = useState('')
  const [restaurantCuisine, setRestaurantCuisine] = useState('')
  const [restaurantDescription, setRestaurantDescription] = useState('')
  const [restaurantPhone, setRestaurantPhone] = useState('')
  const [restaurantWebsite, setRestaurantWebsite] = useState('')
  const [restaurantPriceRange, setRestaurantPriceRange] = useState('€€')
  const [restaurantHours, setRestaurantHours] = useState('')
  const [restaurantTotalTables, setRestaurantTotalTables] = useState<number | ''>('' )
  const [restaurantMenuUrl, setRestaurantMenuUrl] = useState('')
  const [restaurantOffers, setRestaurantOffers] = useState('')
  const [restaurantSpecialties, setRestaurantSpecialties] = useState<string[]>([])
  const [specialtyInput, setSpecialtyInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [referredCount, setReferredCount] = useState(0)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '')
      setFullName(profile.full_name || '')
      setBio(profile.bio || '')
      setStreetAddress(profile.street_address || '')
      setCity(profile.city || '')
      setProvince(profile.province || '')
      setCountry(profile.country || '')
      setDateOfBirth(profile.date_of_birth || '')
      setPhone(profile.phone || '')
      setInstagram(profile.instagram || '')
      setLanguages(profile.languages || [])
      setInterests(profile.interests || [])
      setRestaurantName(profile.restaurant_name || '')
      setRestaurantAddress(profile.restaurant_address || '')
      setRestaurantCuisine(profile.restaurant_cuisine || '')
      setRestaurantDescription(profile.restaurant_description || '')
      setRestaurantPhone(profile.restaurant_phone || '')
      setRestaurantWebsite(profile.restaurant_website || '')
      setRestaurantPriceRange(profile.restaurant_price_range || '€€')
      setRestaurantHours(profile.restaurant_hours || '')
      setRestaurantTotalTables(profile.restaurant_total_tables ?? '')
      setRestaurantMenuUrl(profile.restaurant_menu_url || '')
      setRestaurantOffers(profile.restaurant_offers || '')
      setRestaurantSpecialties(profile.restaurant_specialties || [])
    }
  }, [profile])

  useEffect(() => {
    if (!user || isRestaurant) return
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('referred_by', user.id)
      .then(({ count }) => setReferredCount(count || 0))
  }, [user, isRestaurant])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setError(null)
    const updates: Record<string, unknown> = isRestaurant
      ? {
          restaurant_name: restaurantName,
          restaurant_address: restaurantAddress,
          city,
          country,
          restaurant_phone: restaurantPhone,
          restaurant_website: restaurantWebsite,
          restaurant_cuisine: restaurantCuisine,
          restaurant_price_range: restaurantPriceRange,
          restaurant_specialties: restaurantSpecialties.length > 0 ? restaurantSpecialties : null,
          restaurant_description: restaurantDescription,
          restaurant_hours: restaurantHours || null,
          restaurant_total_tables: restaurantTotalTables !== '' ? Number(restaurantTotalTables) : null,
          restaurant_menu_url: restaurantMenuUrl || null,
          restaurant_offers: restaurantOffers || null,
        }
      : {
          display_name: displayName,
          full_name: fullName,
          bio,
          street_address: streetAddress,
          city,
          province,
          country,
          date_of_birth: dateOfBirth || null,
          phone,
          instagram: instagram || null,
          languages: languages.length > 0 ? languages : null,
          interests: interests.length > 0 ? interests : null,
        }
    const { error: err } = await supabase.from('profiles').update(updates).eq('id', user.id)
    if (err) {
      setError(err.message)
    } else {
      await refreshProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    setError(null)
    const ext = file.name.split('.').pop()
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage.from('restaurant-photos').upload(path, file, { upsert: true })
    if (uploadErr) {
      setError(uploadErr.message)
      setUploading(false)
      return
    }
    const { data } = supabase.storage.from('restaurant-photos').getPublicUrl(path)
    const currentPhotos = profile?.restaurant_photos || []
    const { error: updateErr } = await supabase.from('profiles').update({ restaurant_photos: [...currentPhotos, data.publicUrl] }).eq('id', user.id)
    if (updateErr) setError(updateErr.message)
    else await refreshProfile()
    setUploading(false)
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    setError(null)
    const ext = file.name.split('.').pop()
    const path = `${user.id}/avatar_${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage.from('restaurant-photos').upload(path, file, { upsert: true })
    if (uploadErr) {
      setError(uploadErr.message)
      setUploading(false)
      return
    }
    const { data } = supabase.storage.from('restaurant-photos').getPublicUrl(path)
    const { error: updateErr } = await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id)
    if (updateErr) setError(updateErr.message)
    else await refreshProfile()
    setUploading(false)
  }

  const now = Date.now()
  const tableEndMs = (date: string, time: string | null, until: string | null | undefined) => {
    if (until) return new Date(`${until}T23:59:59`).getTime()
    return new Date(`${date}T${time || '23:59:59'}`).getTime()
  }
  const dinnersAttended =
    hosting.filter(t => tableEndMs(t.date, t.time, t.available_until) < now).length +
    reservations.filter(r => tableEndMs(r.dining_tables.date, r.dining_tables.time, r.dining_tables.available_until) < now).length
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    : null

  const toggleLanguage = (l: string) => setLanguages(prev => (prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]))
  const toggleInterest = (i: string) => setInterests(prev => (prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]))

  const handleRemovePhoto = async (photoUrl: string) => {
    if (!user) return
    setError(null)
    const currentPhotos = profile?.restaurant_photos || []
    const { error: err } = await supabase.from('profiles').update({ restaurant_photos: currentPhotos.filter(p => p !== photoUrl) }).eq('id', user.id)
    if (err) setError(err.message)
    else await refreshProfile()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar currentPage="profile" onNavigate={onNavigate} onAuthClick={onAuthClick} />
      <main className="max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">{isRestaurant ? t('profile.titleRestaurant') : t('profile.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{isRestaurant ? t('profile.subtitleRestaurant') : t('profile.subtitle')}</p>
        </div>

        {error && <ErrorBanner message={error} className="mb-4" />}

        {!isRestaurant && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Mi actividad</h2>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center bg-gray-50 dark:bg-gray-900 rounded-xl py-4">
                <UtensilsCrossed className="w-5 h-5 text-primary-500 mx-auto mb-1.5" />
                <p className="text-lg font-bold text-gray-900 dark:text-white">{dinnersAttended}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Cenas</p>
              </div>
              <div className="text-center bg-gray-50 dark:bg-gray-900 rounded-xl py-4">
                <ShieldCheck className="w-5 h-5 text-green-500 mx-auto mb-1.5" />
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {trustScore && trustScore.reviewCount > 0 ? trustScore.avgRating.toFixed(1) : '—'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Confianza {trustScore && trustScore.reviewCount > 0 ? `(${trustScore.reviewCount})` : ''}</p>
              </div>
              <div className="text-center bg-gray-50 dark:bg-gray-900 rounded-xl py-4">
                <CalendarDays className="w-5 h-5 text-blue-500 mx-auto mb-1.5" />
                <p className="text-sm font-bold text-gray-900 dark:text-white capitalize">{memberSince || '—'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Miembro desde</p>
              </div>
            </div>
          </div>
        )}

        {!isRestaurant && user && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Gift className="w-5 h-5 text-primary-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Invita a tus amigos</h2>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Comparte tu enlace y descubre juntos nuevas cenas. Llevas <span className="font-semibold text-gray-700 dark:text-gray-200">{referredCount}</span> {referredCount === 1 ? 'persona invitada' : 'personas invitadas'}.
            </p>
            <ShareButton url={`${window.location.origin}/?ref=${user.id}`} />
          </div>
        )}

        {!isRestaurant && (
          <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-2xl border border-primary-200 dark:border-primary-800/40 p-6 mb-6">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Programa de Embajadores</h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Presenta Table4Singles a restaurantes y gana el <strong>5%</strong> de sus ingresos de forma indefinida.
            </p>
            <button
              onClick={() => onNavigate('ambassador')}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors"
            >
              <Award className="w-4 h-4" /> Ver programa
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-5">
          {!isRestaurant && (
            <div className="flex flex-col items-center mb-2">
              <label className="relative w-24 h-24 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary-400 transition-colors cursor-pointer flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-gray-900">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Foto de perfil" className="w-full h-full object-cover" />
                ) : uploading ? (
                  <Loader2 className="w-6 h-6 text-gray-400 dark:text-gray-500 animate-spin" />
                ) : (
                  <Camera className="w-7 h-7 text-gray-400 dark:text-gray-500" />
                )}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} disabled={uploading} className="hidden" />
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Foto de perfil</p>
            </div>
          )}

          <FormInput label={isRestaurant ? t('auth.restaurantName') : t('auth.name')} value={isRestaurant ? restaurantName : displayName} onChange={isRestaurant ? setRestaurantName : setDisplayName} />

          {!isRestaurant && (
            <>
              <FormInput label="Nombre completo" value={fullName} onChange={setFullName} />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Sobre ti</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none" />
              </div>

              <FormInput label="Calle y número" value={streetAddress} onChange={setStreetAddress} />

              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Ciudad" value={city} onChange={setCity} />
                <FormInput label="Provincia" value={province} onChange={setProvince} />
              </div>
              <FormInput label="País" value={country} onChange={setCountry} />

              <FormInput label="Fecha de nacimiento" value={dateOfBirth} onChange={setDateOfBirth} type="date" />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Teléfono</label>
                <PhoneInput international defaultCountry="ES" value={phone} onChange={v => setPhone(v || '')} className="phone-input-custom" />
              </div>

              <FormInput label="Instagram (opcional)" value={instagram} onChange={setInstagram} />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Idiomas que hablas</label>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Tus intereses</label>
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
            </>
          )}

          {isRestaurant && (
            <>
              {/* ── Información básica ── */}
              <SectionTitle icon={<MapPin className="w-4 h-4" />} label="Información básica" />
              <FormInput label="Dirección" value={restaurantAddress} onChange={setRestaurantAddress} placeholder="Calle Mayor 12, Barcelona" />
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Ciudad" value={city} onChange={setCity} placeholder="Barcelona" />
                <FormInput label="País" value={country} onChange={setCountry} placeholder="España" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" /> Teléfono</label>
                  <input value={restaurantPhone} onChange={e => setRestaurantPhone(e.target.value)} placeholder="+34 600 000 000" className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#e94560] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-gray-400" /> Web</label>
                  <input value={restaurantWebsite} onChange={e => setRestaurantWebsite(e.target.value)} placeholder="www.mirestaurante.com" className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#e94560] outline-none" />
                </div>
              </div>

              {/* ── Identidad ── */}
              <SectionTitle icon={<UtensilsCrossed className="w-4 h-4" />} label="Identidad del restaurante" />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Tipo de cocina</label>
                <select value={restaurantCuisine} onChange={e => setRestaurantCuisine(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#e94560] outline-none">
                  <option value="">Seleccionar...</option>
                  {CUISINE_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Rango de precios</label>
                <div className="flex gap-2">
                  {PRICE_RANGES.map(p => (
                    <button key={p} type="button" onClick={() => setRestaurantPriceRange(p)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${restaurantPriceRange === p ? 'bg-[#e94560] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-gray-400" /> Especialidades</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {restaurantSpecialties.map(s => (
                    <span key={s} className="flex items-center gap-1 px-3 py-1 bg-[#e94560]/10 text-[#e94560] rounded-full text-sm font-medium">
                      {s}
                      <button type="button" onClick={() => setRestaurantSpecialties(prev => prev.filter(x => x !== s))}><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={specialtyInput}
                    onChange={e => setSpecialtyInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && specialtyInput.trim()) { setRestaurantSpecialties(prev => [...prev, specialtyInput.trim()]); setSpecialtyInput('') } }}
                    placeholder="Ej: Paella, Chuletón, Sushi... (Enter para añadir)"
                    className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#e94560] outline-none"
                  />
                  <button type="button"
                    onClick={() => { if (specialtyInput.trim()) { setRestaurantSpecialties(prev => [...prev, specialtyInput.trim()]); setSpecialtyInput('') } }}
                    className="px-3 py-2.5 bg-[#e94560] text-white rounded-xl hover:bg-[#d63d56] transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Descripción</label>
                <textarea value={restaurantDescription} onChange={e => setRestaurantDescription(e.target.value)} rows={3}
                  placeholder="Cuéntanos qué hace especial a tu restaurante..."
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#e94560] outline-none resize-none" />
              </div>

              {/* ── Horarios y capacidad ── */}
              <SectionTitle icon={<Clock className="w-4 h-4" />} label="Horarios y capacidad" />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Horarios de apertura</label>
                <textarea value={restaurantHours} onChange={e => setRestaurantHours(e.target.value)} rows={2}
                  placeholder="Ej: Lun-Vie 13:00-16:00 / 20:00-24:00. Sáb-Dom 12:00-24:00"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#e94560] outline-none resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5 flex items-center gap-1.5"><Hash className="w-3.5 h-3.5 text-gray-400" /> Total de mesas en el local</label>
                <input type="number" min={1} max={200} value={restaurantTotalTables}
                  onChange={e => setRestaurantTotalTables(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Ej: 20"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#e94560] outline-none" />
              </div>

              {/* ── Carta y ofertas ── */}
              <SectionTitle icon={<Link className="w-4 h-4" />} label="Carta y ofertas" />
              <FormInput label="Enlace a la carta / menú" value={restaurantMenuUrl} onChange={setRestaurantMenuUrl} placeholder="https://mirestaurante.com/carta" />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">Ofertas especiales</label>
                <textarea value={restaurantOffers} onChange={e => setRestaurantOffers(e.target.value)} rows={2}
                  placeholder="Ej: Menú del día 14€, 2x1 en cócteles los jueves, Brunch domingos..."
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#e94560] outline-none resize-none" />
              </div>

              {/* ── Fotos ── */}
              <SectionTitle icon={<Camera className="w-4 h-4" />} label="Fotos del restaurante" />
              <div className="flex flex-wrap gap-3">
                {(profile?.restaurant_photos || []).map((photo, i) => (
                  <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden group">
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => handleRemovePhoto(photo)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {(profile?.restaurant_photos?.length || 0) < 8 && (
                  <label className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center cursor-pointer hover:border-[#e94560] transition-colors gap-1">
                    {uploading ? <Loader2 className="w-5 h-5 text-gray-400 animate-spin" /> : <><Camera className="w-5 h-5 text-gray-400" /><span className="text-xs text-gray-400">Añadir</span></>}
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} disabled={uploading} className="hidden" />
                  </label>
                )}
              </div>
            </>
          )}

          <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('profile.saving')}</> :
             saved ? <><Check className="w-4 h-4" /> {t('profile.saved')}</> :
             <><Save className="w-4 h-4" /> {t('profile.save')}</>}
          </button>
        </div>
      </main>
    </div>
  )
}

function FormInput({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#e94560] outline-none" />
    </div>
  )
}

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 pt-2 pb-0.5 border-b border-gray-100 dark:border-gray-700">
      <span className="text-[#e94560]">{icon}</span>
      <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">{label}</span>
    </div>
  )
}
