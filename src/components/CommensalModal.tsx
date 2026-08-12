import { X, Star, UtensilsCrossed, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'

interface CommensalProfile {
  id?: string
  display_name: string | null
  avatar_url: string | null
}

interface CommensalModalProps {
  profile: CommensalProfile
  onClose: () => void
}

interface PublicStats {
  totalDinners: number
  avgRating: number | null
  memberSince: string
}

export function CommensalModal({ profile, onClose }: CommensalModalProps) {
  const { t, language } = useLanguage()
  const initials = (profile.display_name ?? 'U').charAt(0).toUpperCase()
  const [stats, setStats] = useState<PublicStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  useEffect(() => {
    if (!profile.id) return
    setLoadingStats(true)

    async function fetchStats() {
      const [partRes, profileRes] = await Promise.all([
        supabase
          .from('table_participants')
          .select('id, created_at')
          .eq('user_id', profile.id!)
          .eq('status', 'approved'),
        supabase
          .from('profiles')
          .select('created_at')
          .eq('id', profile.id!)
          .single(),
      ])

      const dinners = partRes.data?.length ?? 0
      const locale = language === 'zh' ? 'zh-CN' : language === 'ja' ? 'ja-JP' : language === 'ar' ? 'ar' : language
      const memberSince = profileRes.data?.created_at
        ? new Date(profileRes.data.created_at).toLocaleDateString(locale, { month: 'long', year: 'numeric' })
        : ''

      setStats({ totalDinners: dinners, avgRating: null, memberSince })
      setLoadingStats(false)
    }

    fetchStats()
  }, [profile.id, language])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-20 bg-gradient-to-br from-[#e94560]/80 to-[#c23352]/90" />

        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          aria-label={t('commensalModal.close')}
        >
          <X className="w-4 h-4 text-white" />
        </button>

        <div className="px-6 pb-6">
          <div className="-mt-10 mb-3 flex items-end gap-3">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700 ring-4 ring-white dark:ring-gray-800 shadow-lg flex items-center justify-center flex-shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.display_name ?? ''} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-gray-400 dark:text-gray-300">{initials}</span>
              )}
            </div>
          </div>

          <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white">
            {profile.display_name || t('commensalModal.confirmedDiner')}
          </h2>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{t('commensalModal.member')}</p>

          {loadingStats ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 text-[#e94560] animate-spin" />
            </div>
          ) : stats ? (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <UtensilsCrossed className="w-4 h-4 text-[#e94560]" />
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalDinners}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {stats.totalDinners === 1 ? t('commensalModal.dinnerSingular') : t('commensalModal.dinnerPlural')}
                </p>
              </div>
              {stats.memberSince && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                  </div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight mt-1">{stats.memberSince}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('commensalModal.memberSince')}</p>
                </div>
              )}
            </div>
          ) : null}

          <button
            onClick={onClose}
            className="mt-5 w-full py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {t('commensalModal.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
