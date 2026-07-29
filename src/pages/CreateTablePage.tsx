import { useState } from 'react'
import { ArrowLeft, Check, ChevronRight, Loader2 } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { ErrorBanner } from '@/components/ErrorBanner'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

const CUISINE_TYPES = ['Italian', 'Japanese', 'Mexican', 'French', 'Thai', 'Indian', 'Chinese', 'Spanish', 'Mediterranean', 'American', 'Korean', 'Vietnamese', 'Greek', 'Turkish', 'Other']

interface CreateTablePageProps {
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

export function CreateTablePage({ onNavigate, onAuthClick }: CreateTablePageProps) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [restaurantName, setRestaurantName] = useState('')
  const [restaurantAddress, setRestaurantAddress] = useState('')
  const [restaurantCity, setRestaurantCity] = useState('')
  const [restaurantCountry, setRestaurantCountry] = useState('')
  const [cuisineType, setCuisineType] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [maxSeats, setMaxSeats] = useState(6)
  const [description, setDescription] = useState('')
  const [depositAmount] = useState(7)

  const steps = [t('create.step.restaurant'), t('create.step.details'), t('create.step.preview')]

  const handleSubmit = async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    const { error: err } = await supabase.from('dining_tables').insert({
      host_id: user.id,
      restaurant_name: restaurantName,
      restaurant_address: restaurantAddress,
      restaurant_city: restaurantCity,
      restaurant_country: restaurantCountry,
      restaurant_image_url: null,
      date,
      time,
      max_seats: maxSeats,
      available_seats: maxSeats - 1,
      status: 'open',
      description,
      cuisine_type: cuisineType,
      languages: null,
      deposit_amount: depositAmount,
    })
    setLoading(false)
    if (!err) setSuccess(true)
    else setError(err.message)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar currentPage="create" onNavigate={onNavigate} onAuthClick={onAuthClick} />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-display font-bold text-gray-900 mb-2">{t('create.success.title')}</h2>
          <p className="text-gray-500 mb-8">{t('create.success.desc')}</p>
          <div className="flex justify-center gap-3">
            <button onClick={() => onNavigate('browse')} className="px-6 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors">
              {t('create.success.browse')}
            </button>
            <button onClick={() => { setSuccess(false); setStep(0); setRestaurantName(''); setDescription('') }} className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">
              {t('create.success.another')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage="create" onNavigate={onNavigate} onAuthClick={onAuthClick} />
      <main className="max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-8">
        <button onClick={() => step > 0 ? setStep(step - 1) : onNavigate('browse')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> {t('create.back')}
        </button>

        {/* Stepper */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${i <= step ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-sm hidden sm:block ${i <= step ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>{label}</span>
              {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {step === 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('create.restaurantDetails')}</h3>
              <FormInput label={t('create.step.restaurant')} placeholder={t('create.namePlaceholder')} value={restaurantName} onChange={setRestaurantName} />
              <FormInput label="Address" placeholder="123 Main Street" value={restaurantAddress} onChange={setRestaurantAddress} />
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="City" placeholder="Barcelona" value={restaurantCity} onChange={setRestaurantCity} />
                <FormInput label="Country" placeholder="Spain" value={restaurantCountry} onChange={setRestaurantCountry} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.cuisineType')}</label>
                <select value={cuisineType} onChange={e => setCuisineType(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="">{t('profile.selectCuisine')}</option>
                  {CUISINE_TYPES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={() => setStep(1)} disabled={!restaurantName || !restaurantCity} className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('create.diningDetails')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormInput label="Date" type="date" value={date} onChange={setDate} />
                <FormInput label="Time" type="time" value={time} onChange={setTime} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max seats</label>
                <input type="number" min={2} max={20} value={maxSeats} onChange={e => setMaxSeats(+e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder={t('create.descPlaceholder')} rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none" />
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-medium text-gray-700">{t('create.depositAmount')}: <span className="text-primary-600">{depositAmount}€</span></p>
                <p className="text-xs text-gray-500 mt-1">{t('create.depositDesc')}</p>
              </div>
              <button onClick={() => setStep(2)} disabled={!date || !time} className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('create.previewTitle')}</h3>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <p><span className="font-medium">Restaurant:</span> {restaurantName}</p>
                <p><span className="font-medium">Location:</span> {restaurantCity}, {restaurantCountry}</p>
                <p><span className="font-medium">Cuisine:</span> {cuisineType || '-'}</p>
                <p><span className="font-medium">Date:</span> {date} at {time}</p>
                <p><span className="font-medium">Seats:</span> {maxSeats}</p>
                <p><span className="font-medium">Deposit:</span> {depositAmount}€</p>
                {description && <p><span className="font-medium">Description:</span> {description}</p>}
              </div>
              {error && <ErrorBanner message={error} />}
              <button onClick={handleSubmit} disabled={loading} className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t('create.submit')}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function FormInput({ label, placeholder, type = 'text', value, onChange }: { label: string; placeholder?: string; type?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
    </div>
  )
}
