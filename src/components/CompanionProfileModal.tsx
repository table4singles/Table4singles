import { useState } from 'react'
import { Mail, MapPin, ShieldCheck, X } from 'lucide-react'
import type { CompanionProfile } from '@/hooks/useCompanions'
import { useDinerTrustScore } from '@/hooks/useDinerReviews'
import { InviteToTableModal } from '@/components/InviteToTableModal'
import { Avatar } from '@/components/Avatar'
import { publicAge, publicLocation } from '@/lib/privacy'

function formatMemberSince(createdAt: string): string {
  const date = new Date(createdAt)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
}

interface CompanionProfileModalProps {
  companion: CompanionProfile
  onClose: () => void
  onNavigate: (page: string, id?: string) => void
}

export function CompanionProfileModal({ companion, onClose, onNavigate }: CompanionProfileModalProps) {
  const age = publicAge(companion)
  const { score } = useDinerTrustScore(companion.id)
  const location = publicLocation(companion)
  const [showInvite, setShowInvite] = useState(false)

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto relative" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-500">
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mb-5">
          <div className="w-24 h-24 rounded-full overflow-hidden mb-3">
            <Avatar src={companion.avatar_url} name={companion.display_name} className="w-full h-full" textClassName="text-3xl" />
          </div>
          <h3 className="text-lg font-display font-bold text-gray-900 dark:text-gray-100">
            {companion.display_name || 'Usuario'}{age !== null && <span className="font-normal text-gray-500 dark:text-gray-400">, {age}</span>}
          </h3>
          {location && (
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5" /> {location}
            </p>
          )}
          {score && score.reviewCount > 0 && (
            <div className="flex items-center gap-1 mt-2 text-sm text-green-600 dark:text-green-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Confianza {score.avgRating.toFixed(1)}/5 ({score.reviewCount} valoraciones)</span>
            </div>
          )}
        </div>

        {companion.bio && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Sobre mí</h4>
            <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{companion.bio}</p>
          </div>
        )}

        {companion.languages && companion.languages.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Idiomas</h4>
            <div className="flex flex-wrap gap-1.5">
              {companion.languages.map(l => (
                <span key={l} className="text-xs px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300">{l}</span>
              ))}
            </div>
          </div>
        )}

        {companion.interests && companion.interests.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Intereses</h4>
            <div className="flex flex-wrap gap-1.5">
              {companion.interests.map(i => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">{i}</span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => setShowInvite(true)}
          className="w-full py-2.5 mb-3 bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-300 rounded-xl text-sm font-medium hover:bg-primary-100 dark:hover:bg-primary-900 flex items-center justify-center gap-2"
        >
          <Mail className="w-4 h-4" /> Invitar a una cena
        </button>

        <p className="text-xs text-gray-400 dark:text-gray-500 text-center pt-2 border-t border-gray-100 dark:border-gray-800">
          Miembro desde {formatMemberSince(companion.created_at)}
        </p>
      </div>

      {showInvite && (
        <InviteToTableModal
          inviteeId={companion.id}
          inviteeName={companion.display_name || 'este usuario'}
          onClose={() => setShowInvite(false)}
          onNavigate={onNavigate}
        />
      )}
    </div>
  )
}
