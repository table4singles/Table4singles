import { useState } from 'react'
import { Loader2, Star, Users, UtensilsCrossed, ChevronRight, Check, X } from 'lucide-react'
import { StarRating } from '@/components/StarRating'
import { useDinerReviews } from '@/hooks/useDinerReviews'
import { useLanguage } from '@/contexts/LanguageContext'
import type { Profile } from '@/types/database'

interface PostDinnerReviewModalProps {
  tableId: string
  restaurantName: string
  hostId: string
  /** Comensales a puntuar (excluye al propio usuario) */
  coDiners: Profile[]
  /** Si ya ha valorado el restaurante (salta al paso 2) */
  alreadyReviewedRestaurant: boolean
  /** Si no es participante (solo el host puede puntuar comensales, no al restaurante) */
  isHostOnly?: boolean
  onSubmitRestaurant: (rating: number, comment: string) => Promise<void>
  onClose: () => void
}

type Step = 'restaurant' | 'diners' | 'done'

export function PostDinnerReviewModal({
  tableId,
  restaurantName,
  coDiners,
  alreadyReviewedRestaurant,
  isHostOnly = false,
  onSubmitRestaurant,
  onClose,
}: PostDinnerReviewModalProps) {
  const { t } = useLanguage()
  const hasDiners = coDiners.length > 0
  const initialStep: Step = isHostOnly || alreadyReviewedRestaurant ? 'diners' : 'restaurant'

  const [step, setStep] = useState<Step>(initialStep)
  const [restaurantRating, setRestaurantRating] = useState(0)
  const [restaurantComment, setRestaurantComment] = useState('')
  const [dinerRatings, setDinerRatings] = useState<Record<string, number>>({})
  const [submittingRestaurant, setSubmittingRestaurant] = useState(false)
  const [restaurantError, setRestaurantError] = useState<string | null>(null)

  const { submitRatings, submitting: submittingDiners, error: dinerError, alreadyRated } = useDinerReviews({ tableId })
  const pendingDiners = coDiners.filter(d => !alreadyRated.includes(d.id))

  const handleSubmitRestaurant = async () => {
    if (restaurantRating === 0) return
    setSubmittingRestaurant(true)
    setRestaurantError(null)
    try {
      await onSubmitRestaurant(restaurantRating, restaurantComment)
      if (hasDiners && pendingDiners.length > 0) {
        setStep('diners')
      } else {
        setStep('done')
      }
    } catch (e: any) {
      setRestaurantError(e.message || 'Error al enviar la valoración')
    }
    setSubmittingRestaurant(false)
  }

  const handleSubmitDiners = async () => {
    try {
      await submitRatings(dinerRatings)
      setStep('done')
    } catch {
      // el error se muestra desde el hook
    }
  }

  const skipDiners = () => setStep('done')

  const stepCount = isHostOnly ? 1 : hasDiners ? 2 : 1
  const currentStepNum = step === 'restaurant' ? 1 : step === 'diners' ? (isHostOnly ? 1 : 2) : stepCount

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <div>
            <h3 className="text-lg font-display font-bold text-gray-900 dark:text-white">
              {step === 'done' ? t('review.thankYou') : t('review.title')}
            </h3>
            {step !== 'done' && stepCount > 1 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {t('review.step').replace('{current}', String(currentStepNum)).replace('{total}', String(stepCount))}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barra de progreso */}
        {step !== 'done' && stepCount > 1 && (
          <div className="px-6 mt-3">
            <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-500"
                style={{ width: `${(currentStepNum / stepCount) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="p-6">
          {/* ── Paso 1: Restaurante ── */}
          {step === 'restaurant' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                <UtensilsCrossed className="w-5 h-5 text-orange-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{restaurantName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('review.restaurantQuestion')}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-2">
                  {t('review.overallRating')}
                </label>
                <StarRating rating={restaurantRating} onChange={setRestaurantRating} size="lg" />
                {restaurantRating > 0 && (
                  <p className="text-xs text-gray-400 mt-1.5">
                    {t(`review.rating${restaurantRating}` as Parameters<typeof t>[0])}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-2">
                  {t('review.commentOptional')}
                  <span className="text-xs font-normal text-gray-400 ml-1">· {t('review.commentPublic')}</span>
                </label>
                <textarea
                  value={restaurantComment}
                  onChange={e => setRestaurantComment(e.target.value)}
                  rows={3}
                  placeholder={t('review.commentPlaceholder3')}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                />
              </div>

              {restaurantError && (
                <p className="text-xs text-red-600">{restaurantError}</p>
              )}

              <div className="flex gap-3">
                {hasDiners && pendingDiners.length > 0 && (
                  <button
                    onClick={() => setStep('diners')}
                    className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    {t('review.skip')}
                  </button>
                )}
                <button
                  onClick={handleSubmitRestaurant}
                  disabled={restaurantRating === 0 || submittingRestaurant}
                  className="flex-1 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                >
                  {submittingRestaurant
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : hasDiners && pendingDiners.length > 0
                      ? <><span>{t('review.next')}</span><ChevronRight className="w-4 h-4" /></>
                      : t('review.submit')
                  }
                </button>
              </div>
            </div>
          )}

          {/* ── Paso 2: Comensales ── */}
          {step === 'diners' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
                <Users className="w-5 h-5 text-teal-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('review.yourDiners')}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('review.dinersPrivate')}
                  </p>
                </div>
              </div>

              {pendingDiners.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  {t('review.alreadyRatedAll')}
                </p>
              ) : (
                <div className="space-y-3">
                  {pendingDiners.map(diner => (
                    <div
                      key={diner.id}
                      className="flex items-center justify-between gap-3 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 flex items-center justify-center">
                          {diner.avatar_url ? (
                            <img src={diner.avatar_url} alt={diner.display_name || ''} className="w-full h-full object-cover" />
                          ) : (
                                <span className="text-gray-400 text-sm font-medium">
                              {(diner.display_name || '?').charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                          {diner.display_name || 'Usuario'}
                        </span>
                      </div>
                      <StarRating
                        rating={dinerRatings[diner.id] || 0}
                        onChange={r => setDinerRatings(prev => ({ ...prev, [diner.id]: r }))}
                        size="sm"
                      />
                    </div>
                  ))}
                </div>
              )}

              {dinerError && <p className="text-xs text-red-600">{dinerError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={skipDiners}
                  className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {t('review.skipForNow')}
                </button>
                <button
                  onClick={handleSubmitDiners}
                  disabled={submittingDiners || (pendingDiners.length > 0 && Object.values(dinerRatings).every(r => !r))}
                  className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                >
                  {submittingDiners
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : pendingDiners.length === 0 ? t('review.continue') : t('review.sendRatings')
                  }
                </button>
              </div>
            </div>
          )}

          {/* ── Done ── */}
          {step === 'done' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                <Check className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{t('review.ratingSent')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {t('review.ratingsHelp')}
                </p>
              </div>
              <div className="flex items-center justify-center gap-1 mt-2">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`w-5 h-5 ${s <= restaurantRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 dark:text-gray-700'}`} />
                ))}
              </div>
              <button
                onClick={onClose}
                className="mt-4 w-full py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors"
              >
                {t('review.close')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
