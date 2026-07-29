import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface CancelModalProps {
  joinType: 'word' | 'deposit'
  depositAmount?: number
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function CancelModal({ joinType, depositAmount = 7, onClose, onConfirm }: CancelModalProps) {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)

  const restaurantShare = (depositAmount * 0.6).toFixed(2)
  const platformShare = (depositAmount * 0.4).toFixed(2)

  const handleConfirm = async () => {
    setLoading(true)
    await onConfirm()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-xl font-display font-bold text-gray-900">{t('cancel.title')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-6">
          {joinType === 'deposit' ? (
            <>
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">{t('cancel.depositWarning')}</p>
              </div>
              <p className="text-sm font-medium text-gray-700 mb-2">{t('cancel.distribution')}</p>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('cancel.restaurant')} <span className="text-xs text-gray-400">({t('cancel.restaurantReason')})</span></span>
                  <span className="font-medium text-gray-900">{restaurantShare}€</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('cancel.platform')} <span className="text-xs text-gray-400">({t('cancel.platformReason')})</span></span>
                  <span className="font-medium text-gray-900">{platformShare}€</span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="font-semibold text-gray-900">{t('cancel.totalRetained')}</span>
                  <span className="font-semibold text-gray-900">{depositAmount.toFixed(2)}€</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mb-4">{t('cancel.typeDeposit')}</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-green-700 bg-green-50 rounded-xl p-3 mb-2">{t('cancel.wordNoPenalty')}</p>
              <p className="text-sm text-gray-500 mb-4">{t('cancel.wordDesc')}</p>
              <p className="text-xs text-gray-400 mb-4">{t('cancel.typeWord')}</p>
            </>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">
              {t('cancel.goBack')}
            </button>
            <button onClick={handleConfirm} disabled={loading} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 transition-colors">
              {loading ? t('cancel.cancelling') : t('cancel.confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
