import { useState } from 'react'
import { X, Flag, Check } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

const CATEGORIES = ['no_show', 'inappropriate_behavior', 'safety_concern', 'other'] as const

interface ReportModalProps {
  tableId: string
  reportedId: string
  reportedName: string
  onClose: () => void
}

export function ReportModal({ tableId, reportedId, reportedName, onClose }: ReportModalProps) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('inappropriate_behavior')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!user) return
    setSubmitting(true)
    setError(null)
    const { error: err } = await supabase.from('reports').insert({
      table_id: tableId,
      reporter_id: user.id,
      reported_id: reportedId,
      category,
      details: details.trim() || null,
    })
    setSubmitting(false)
    if (err) setError(t('report.error'))
    else setSubmitted(true)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-500" /> {t('report.title')}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-6">
          {submitted ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{t('report.success')}</p>
              <button onClick={onClose} className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors">
                {t('report.close')}
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('report.subtitle').replace('{name}', reportedName)}</p>

              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t('report.categoryLabel')}</label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                      category === c
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                    }`}
                  >
                    {t(`report.categories.${c}`)}
                  </button>
                ))}
              </div>

              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">{t('report.detailsLabel')}</label>
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                rows={3}
                placeholder={t('report.detailsPlaceholder')}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none mb-4"
              />

              {error && <p className="text-xs text-red-600 mb-3">{error}</p>}

              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  {t('cancel.goBack')}
                </button>
                <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
                  {submitting ? t('report.submitting') : t('report.submit')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
