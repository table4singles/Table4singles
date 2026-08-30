import { useState } from 'react'
import { UtensilsCrossed, ShieldCheck, Award, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useMyTables } from '@/hooks/useTables'
import { useDinerTrustScore } from '@/hooks/useDinerReviews'
import { ShareButton } from './ShareButton'

const STORAGE_KEY = 't4s_activity_summary_dismissed'

interface ActivitySummaryCardProps {
  onNavigate: (page: string) => void
}

/** Compact, dismissible summary of "My activity" + "Invite friends" + the
 * ambassador teaser — surfaced on the home screen instead of buried in Profile,
 * where full detail still lives. */
export function ActivitySummaryCard({ onNavigate }: ActivitySummaryCardProps) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const { hosting, reservations } = useMyTables(user?.id ?? null)
  const { score: trustScore } = useDinerTrustScore(user?.id ?? null)
  const [visible, setVisible] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) !== 'true' } catch { return true }
  })

  if (!visible || !user) return null

  const now = Date.now()
  const tableEndMs = (date: string, time: string | null, until?: string | null) =>
    until ? new Date(`${until}T23:59:59`).getTime() : new Date(`${date}T${time || '23:59:59'}`).getTime()
  const dinnersAttended =
    hosting.filter(tb => tableEndMs(tb.date, tb.time, tb.available_until) < now).length +
    reservations.filter(r => tableEndMs(r.dining_tables.date, r.dining_tables.time, r.dining_tables.available_until) < now).length

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, 'true') } catch { /* noop */ }
    setVisible(false)
  }

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-e2 border border-gray-100 dark:border-gray-700 p-4 mb-6">
      <button
        onClick={dismiss}
        aria-label={t('ambassadorBanner.dismiss')}
        className="absolute top-3 right-3 p-1 text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-center gap-5 pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-1.5 text-sm">
          <UtensilsCrossed className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" />
          <span className="font-bold text-gray-900 dark:text-white">{dinnersAttended}</span>
          <span className="text-gray-500 dark:text-gray-400">{t('profile.dinners').toLowerCase()}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm">
          <ShieldCheck className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
          <span className="font-bold text-gray-900 dark:text-white">
            {trustScore && trustScore.reviewCount > 0 ? trustScore.avgRating.toFixed(1) : '—'}
          </span>
          <span className="text-gray-500 dark:text-gray-400">{t('profile.trust').toLowerCase()}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1">
          <ShareButton
            variant="solid"
            label={t('profile.inviteFriends')}
            url={`${window.location.origin}/?ref=${user.id}`}
            message={t('share.friendWaText')}
            tweetMessage={t('share.friendTweetText')}
          />
        </div>
        <button
          onClick={() => onNavigate('ambassador')}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 font-semibold text-sm hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
        >
          <Award className="w-4 h-4 flex-shrink-0" /> {t('profile.ambassadorTeaser')}
        </button>
      </div>
    </div>
  )
}
