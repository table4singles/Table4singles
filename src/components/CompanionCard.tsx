import { MapPin, ShieldCheck, User } from 'lucide-react'
import type { CompanionProfile } from '@/hooks/useCompanions'
import { useDinerTrustScore } from '@/hooks/useDinerReviews'

function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null
  const dob = new Date(dateOfBirth)
  if (Number.isNaN(dob.getTime())) return null
  const diff = Date.now() - dob.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}

interface CompanionCardProps {
  companion: CompanionProfile
  onClick: () => void
}

export function CompanionCard({ companion, onClick }: CompanionCardProps) {
  const age = calculateAge(companion.date_of_birth)
  const { score } = useDinerTrustScore(companion.id)
  const location = [companion.city, companion.country].filter(Boolean).join(', ')

  return (
    <button onClick={onClick} className="w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all overflow-hidden text-left flex items-center gap-4 p-4">
      <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 flex items-center justify-center">
        {companion.avatar_url ? (
          <img src={companion.avatar_url} alt={companion.display_name || 'Usuario'} className="w-full h-full object-cover" />
        ) : (
          <User className="w-7 h-7 text-gray-300 dark:text-gray-500" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white truncate">
          {companion.display_name || 'Usuario'}{age !== null && <span className="font-normal text-gray-500 dark:text-gray-400">, {age}</span>}
        </p>

        {location && (
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{location}</span>
          </p>
        )}

        {score && score.reviewCount > 0 && (
          <div className="flex items-center gap-1 mt-1 text-xs text-green-600 dark:text-green-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Confianza {score.avgRating.toFixed(1)}/5 ({score.reviewCount})</span>
          </div>
        )}

        {((companion.languages && companion.languages.length > 0) || (companion.interests && companion.interests.length > 0)) && (
          <div className="flex flex-wrap gap-1 mt-2">
            {(companion.languages || []).slice(0, 3).map(l => (
              <span key={`lang-${l}`} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300">{l}</span>
            ))}
            {(companion.interests || []).slice(0, 3).map(i => (
              <span key={`int-${i}`} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">{i}</span>
            ))}
          </div>
        )}
      </div>
    </button>
  )
}
