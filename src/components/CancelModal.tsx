import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface CancelModalProps {
  joinType: 'word' | 'deposit'
  depositAmount?: number
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function CancelModal({ joinType, depositAmount = 2, onClose, onConfirm }: CancelModalProps) {
  const { t } = useLanguage()
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    await onConfirm()
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white">{t('cancel.title')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-6">
          {joinType === 'deposit' ? (
            <>
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 mb-1">El depósito de {depositAmount.toFixed(2)}€ no será reembolsado</p>
                  <p className="text-xs text-amber-700">Este importe es una tasa de gestión no reembolsable al cancelar.</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-green-700 bg-green-50 rounded-xl p-3 mb-2">{t('cancel.wordNoPenalty')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('cancel.wordDesc')}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">{t('cancel.typeWord')}</p>
            </>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
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
