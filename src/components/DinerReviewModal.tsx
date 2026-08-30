import { useState } from 'react'
import { Loader2, ShieldCheck } from 'lucide-react'
import { StarRating } from '@/components/StarRating'
import { useDinerReviews } from '@/hooks/useDinerReviews'
import { Avatar } from '@/components/Avatar'
import type { Profile } from '@/types/database'

interface DinerReviewModalProps {
  tableId: string
  coDiners: Profile[]
  onClose: () => void
}

export function DinerReviewModal({ tableId, coDiners, onClose }: DinerReviewModalProps) {
  const { submitRatings, submitting, error, alreadyRated } = useDinerReviews({ tableId })
  const [ratings, setRatings] = useState<Record<string, number>>({})

  const pending = coDiners.filter(d => !alreadyRated.includes(d.id))

  const handleSubmit = async () => {
    await submitRatings(ratings)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-5 h-5 text-primary-500" />
          <h3 className="text-lg font-display font-bold text-gray-900 dark:text-gray-100">Puntúa a tus comensales</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Solo se usa para calcular su confianza. Es privado: nadie sabrá quién puntuó qué.
        </p>

        {pending.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">Ya has puntuado a todos tus comensales de esta mesa.</p>
        ) : (
          <div className="space-y-4">
            {pending.map(diner => (
              <div key={diner.id} className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                    <Avatar src={diner.avatar_url} name={diner.display_name} className="w-full h-full" textClassName="text-xs" />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{diner.display_name || 'Usuario'}</span>
                </div>
                <StarRating rating={ratings[diner.id] || 0} onChange={r => setRatings(prev => ({ ...prev, [diner.id]: r }))} size="sm" />
              </div>
            ))}

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting || Object.values(ratings).every(r => !r)}
              className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar valoraciones'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
