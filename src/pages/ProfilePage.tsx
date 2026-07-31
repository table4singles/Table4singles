import { useState, useEffect } from 'react'
import { Save, Loader2, Check, Camera, X } from 'lucide-react'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { Navbar } from '@/components/Navbar'
import { ErrorBanner } from '@/components/ErrorBanner'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

const CUISINE_TYPES = ['Italian', 'Japanese', 'Mexican', 'French', 'Thai', 'Indian', 'Chinese', 'Spanish', 'Mediterranean', 'American', 'Korean', 'Vietnamese', 'Greek', 'Turkish', 'Other']
const PRICE_RANGES = ['$', '$$', '$$$', '$$$$']

interface ProfilePageProps {
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

export function ProfilePage({ onNavigate, onAuthClick }: ProfilePageProps) {
  const { t } = useLanguage()
  const { profile, refreshProfile, user } = useAuth()
  const isRestaurant = profile?.role === 'restaurant'

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
  const [restaurantName, setRestaurantName] = useState('')
  const [restaurantCuisine, setRestaurantCuisine] = useState('')
  const [restaurantDescription, setRestaurantDescription] = useState('')
  const [restaurantPhone, setRestaurantPhone] = useState('')
  const [restaurantWebsite, setRestaurantWebsite] = useState('')
  const [restaurantPriceRange, setRestaurantPriceRange] = useState('$$')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

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
      setRestaurantName(profile.restaurant_name || '')
      setRestaurantCuisine(profile.restaurant_cuisine || '')
      setRestaurantDescription(profile.restaurant_description || '')
      setRestaurantPhone(profile.restaurant_phone || '')
      setRestaurantWebsite(profile.restaurant_website || '')
      setRestaurantPriceRange(profile.restaurant_price_range || '$$')
    }
  }, [profile])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setError(null)
    const updates: Record<string, unknown> = {
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
    }
    if (isRestaurant) {
      Object.assign(updates, {
        restaurant_name: restaurantName,
        restaurant_cuisine: restaurantCuisine,
        restaurant_description: restaurantDescription,
        restaurant_phone: restaurantPhone,
        restaurant_website: restaurantWebsite,
        restaurant_price_range: restaurantPriceRange,
      })
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

  const handleRemovePhoto = async (photoUrl: string) => {
    if (!user) return
    setError(null)
    const currentPhotos = profile?.restaurant_photos || []
    const { error: err } = await supabase.from('profiles').update({ restaurant_photos: currentPhotos.filter(p => p !== photoUrl) }).eq('id', user.id)
    if (err) setError(err.message)
    else await refreshProfile()
  }

  const handleRoleSwitch = async () => {
    if (!user || !profile) return
    const newRole = profile.role === 'restaurant' ? 'user' : 'restaurant'
    setSaving(true)
    setError(null)
    const { error: err } = await supabase.from('profiles').update({ role: newRole }).eq('id', user.id)
    if (err) setError(err.message)
    else await refreshProfile()
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage="profile" onNavigate={onNavigate} onAuthClick={onAuthClick} />
      <main className="max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-gray-900">{isRestaurant ? t('profile.titleRestaurant') : t('profile.title')}</h1>
          <p className="text-gray-500 text-sm mt-1">{isRestaurant ? t('profile.subtitleRestaurant') : t('profile.subtitle')}</p>
        </div>

        {error && <ErrorBanner message={error} className="mb-4" />}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <FormInput label={isRestaurant ? t('auth.restaurantName') : t('auth.name')} value={isRestaurant ? restaurantName : displayName} onChange={isRestaurant ? setRestaurantName : setDisplayName} />

          {!isRestaurant && (
            <>
              <FormInput label="Nombre completo" value={fullName} onChange={setFullName} />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sobre ti</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none" />
              </div>

              <FormInput label="Calle y número" value={streetAddress} onChange={setStreetAddress} />

              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Ciudad" value={city} onChange={setCity} />
                <FormInput label="Provincia" value={province} onChange={setProvince} />
              </div>
              <FormInput label="País" value={country} onChange={setCountry} />

              <FormInput label="Fecha de nacimiento" value={dateOfBirth} onChange={setDateOfBirth} type="date" />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <PhoneInput international defaultCountry="ES" value={phone} onChange={v => setPhone(v || '')} className="phone-input-custom" />
              </div>

              <FormInput label="Instagram (opcional)" value={instagram} onChange={setInstagram} />
            </>
          )}

          {isRestaurant && (
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="City" value={city} onChange={setCity} />
              <FormInput label="Country" value={country} onChange={setCountry} />
            </div>
          )}

          {isRestaurant && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.cuisineType')}</label>
                <select value={restaurantCuisine} onChange={e => setRestaurantCuisine(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="">{t('profile.selectCuisine')}</option>
                  {CUISINE_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.priceRange')}</label>
                <div className="flex gap-2">
                  {PRICE_RANGES.map(p => (
                    <button key={p} onClick={() => setRestaurantPriceRange(p)} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${restaurantPriceRange === p ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={restaurantDescription} onChange={e => setRestaurantDescription(e.target.value)} rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormInput label={t('profile.phone')} value={restaurantPhone} onChange={setRestaurantPhone} />
                <FormInput label={t('profile.website')} value={restaurantWebsite} onChange={setRestaurantWebsite} />
              </div>

              {/* Photos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Photos</label>
                <div className="flex flex-wrap gap-3">
                  {(profile?.restaurant_photos || []).map((photo, i) => (
                    <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden group">
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleRemovePhoto(photo)}
                        className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {(profile?.restaurant_photos?.length || 0) < 6 && (
                    <label className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-primary-400 transition-colors">
                      {uploading ? <Loader2 className="w-5 h-5 text-gray-400 animate-spin" /> : <Camera className="w-6 h-6 text-gray-400" />}
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} disabled={uploading} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
            </>
          )}

          <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('profile.saving')}</> :
             saved ? <><Check className="w-4 h-4" /> {t('profile.saved')}</> :
             <><Save className="w-4 h-4" /> {t('profile.save')}</>}
          </button>
        </div>

        <button onClick={handleRoleSwitch} disabled={saving} className="mt-4 w-full py-3 border border-gray-200 bg-white text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 disabled:opacity-50 transition-colors">
          {isRestaurant ? 'Cambiar a cuenta personal' : 'Cambiar a cuenta de restaurante'}
        </button>
      </main>
    </div>
  )
}

function FormInput({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
    </div>
  )
}
