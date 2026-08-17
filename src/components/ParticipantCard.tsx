import { ShieldCheck } from 'lucide-react'
import type { Profile } from '@/types/database'
import { useDinerTrustScore } from '@/hooks/useDinerReviews'
import { publicAge } from '@/lib/privacy'

interface ParticipantCardProps {
  profile: Profile
  badge?: React.ReactNode
}

export function ParticipantCard({ profile, badge }: ParticipantCardProps) {
  const age = publicAge(profile)
  const { score } = useDinerTrustScore(profile.id)

  return (
    <div className="flex gap-3 py-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 flex items-center justify-center">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.display_name || 'Usuario'} className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-400 text-sm font-medium">{(profile.display_name || '?').charAt(0).toUpperCase()}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
            {profile.display_name || 'Usuario'}{age !== null && <span className="font-normal text-gray-500 dark:text-gray-400">, {age}</span>}
          </p>
          {badge}
        </div>

        {score && score.reviewCount > 0 && (
          <div className="flex items-center gap-1 mt-0.5 text-xs text-green-600 dark:text-green-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Confianza {score.avgRating.toFixed(1)}/5 ({score.reviewCount})</span>
          </div>
        )}

        {profile.bio && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{profile.bio}</p>}

        {((profile.languages && profile.languages.length > 0) || (profile.interests && profile.interests.length > 0)) && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {(profile.languages || []).map(l => (
              <span key={`lang-${l}`} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300">{l}</span>
            ))}
            {(profile.interests || []).map(i => (
              <span key={`int-${i}`} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">{i}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
