import { useState } from 'react'
import { X, BellRing, Check } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { useAnalytics } from '@/hooks/useAnalytics'
import { CUISINE_OPTIONS, INTEREST_OPTIONS, LANGUAGE_OPTIONS } from '@/lib/options'

interface DemandRequestModalProps {
  onClose: () => void
}

export function DemandRequestModal({ onClose }: DemandRequestModalProps) {
  const { t } = useLanguage()
  const { user, profile } = useAuth()
  const { track } = useAnalytics()
  const [city, setCity] = useState(profile?.city ?? '')
  const [dayOfWeek, setDayOfWeek] = useState<number | ''>('')
  const [timePref, setTimePref] = useState<'midday' | 'evening' | ''>('')
  const [cuisine, setCuisine] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [language, setLanguage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const toggleInterest = (i: string) => {
    setInterests(prev => (prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]))
  }

  const days = [
    t('demand.dayMon'), t('demand.dayTue'), t('demand.dayWed'), t('demand.dayThu'),
    t('demand.dayFri'), t('demand.daySat'), t('demand.daySun'),
  ]

  const handleSubmit = async () => {
    if (!user || !city.trim()) return
    setSubmitting(true)
    setError(null)
    const { error: err } = await supabase.from('demand_requests').insert({
      user_id: user.id,
      city: city.trim(),
      day_of_week: dayOfWeek === '' ? null : dayOfWeek,
      time_pref: timePref || null,
      cuisine: cuisine || null,
      interests,
      language: language || null,
    })
    setSubmitting(false)
    if (err) { setError(t('demand.error')); return }
    track('DEMAND_REQUEST_CREATED', { city: city.trim(), cuisine: cuisine || null })
    setDone(true)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BellRing className="w-5 h-5 text-primary-500" /> {t('demand.title')}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="px-6 pb-8 text-center">
            <div className="w-14 h-14 rounded-full bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-primary-500" />
            </div>
            <p className="font-semibold text-gray-900 dark:text-white mb-1">{t('demand.doneTitle')}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{t('demand.doneDesc')}</p>
            <button onClick={onClose} className="px-6 py-2.5 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors">
              {t('demand.close')}
            </button>
          </div>
        ) : (
          <div className="px-6 pb-6 space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('demand.subtitle')}</p>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5 block">{t('demand.city')}</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder={t('demand.cityPlaceholder')}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5 block">{t('demand.day')}</label>
              <div className="flex flex-wrap gap-2">
                {days.map((d, i) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDayOfWeek(dayOfWeek === i ? '' : i)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${dayOfWeek === i ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5 block">{t('demand.time')}</label>
              <div className="flex gap-2">
                {(['midday', 'evening'] as const).map(tp => (
                  <button
                    key={tp}
                    type="button"
                    onClick={() => setTimePref(timePref === tp ? '' : tp)}
                    className={`px-4 py-1.5 rounded-full text-sm transition-colors ${timePref === tp ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                  >
                    {t(tp === 'midday' ? 'browse.midday' : 'browse.evening')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5 block">{t('demand.cuisine')}</label>
              <select
                value={cuisine}
                onChange={e => setCuisine(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                <option value="">{t('demand.anyCuisine')}</option>
                {CUISINE_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5 block">{t('demand.language')}</label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-700 dark:text-white border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                <option value="">{t('demand.anyLanguage')}</option>
                {LANGUAGE_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5 block">{t('demand.interests')}</label>
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

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting || !city.trim()}
              className="w-full px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 disabled:opacity-50 transition-colors"
            >
              {submitting ? t('demand.sending') : t('demand.submit')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
