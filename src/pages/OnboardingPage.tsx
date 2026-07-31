import { useState } from 'react'
import { Loader2, ArrowRight, Camera } from 'lucide-react'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { ErrorBanner } from '@/components/ErrorBanner'

const ADMIN_EMAIL = 'joseviangles@gmail.com'

export function OnboardingPage({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { user, profile, refreshProfile } = useAuth()
  const isAdmin = user?.email === ADMIN_EMAIL

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
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValid = (isAdmin || avatarUrl) && fullName.trim() && streetAddress.trim() && city.trim() && province.trim() && country.trim() && dateOfBirth && bio.trim() && phone.trim()

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
    const { error: err } = await supabase.from('profiles').update({
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
      onboarding_completed: true,
    }).eq('id', user.id)

    if (err) {
      setError(err.message)
      setSaving(false)
      return
    }
    await refreshProfile()
    setSaving(false)
    onNavigate('browse')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-display font-bold text-gray-900">Completa tu perfil</h1>
          <p className="text-gray-500 text-sm mt-1">Necesitamos estos datos antes de que empieces a usar Table4Singles</p>
        </div>

        {error && <ErrorBanner message={error} className="mb-4" />}

        <div className="space-y-4">
          <div className="flex flex-col items-center mb-2">
            <label className="relative w-24 h-24 rounded-full border-2 border-dashed border-gray-300 hover:border-primary-400 transition-colors cursor-pointer flex items-center justify-center overflow-hidden bg-gray-50">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : uploadingAvatar ? (
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              ) : (
                <Camera className="w-7 h-7 text-gray-400" />
              )}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarUpload} disabled={uploadingAvatar} className="hidden" />
            </label>
            <p className="text-xs text-gray-500 mt-2">
              {isAdmin ? 'Foto de perfil (opcional)' : 'Foto de perfil (obligatoria)'}
            </p>
          </div>

          <Field label="Nombre completo" value={fullName} onChange={setFullName} placeholder="Jose Angles" />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dirección</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Sobre ti</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={3}
              placeholder="Cuéntanos algo sobre ti..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
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
        </div>

        <button
          onClick={handleSubmit}
          disabled={!isValid || saving}
          className="mt-6 w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Continuar <ArrowRight className="w-4 h-4" /></>}
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
      {!hideLabel && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={hideLabel ? label : placeholder}
        disabled={disabled}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-gray-50 disabled:text-gray-500"
      />
    </div>
  )
}
