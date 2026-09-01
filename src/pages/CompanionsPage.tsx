import { useState } from 'react'
import { Search, SlidersHorizontal, Users, Loader2 } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { PageHeader } from '@/components/PageHeader'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorBanner } from '@/components/ErrorBanner'
import { CompanionCard } from '@/components/CompanionCard'
import { CompanionProfileModal } from '@/components/CompanionProfileModal'
import { useCompanions, type CompanionProfile } from '@/hooks/useCompanions'
import { useAuth } from '@/contexts/AuthContext'
import { useViewMode } from '@/contexts/ViewModeContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { LANGUAGE_OPTIONS, INTEREST_OPTIONS } from '@/lib/options'

interface CompanionsPageProps {
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

export function CompanionsPage({ onNavigate, onAuthClick }: CompanionsPageProps) {
  const { t } = useLanguage()
  const { user, profile } = useAuth()
  const { effectiveRole } = useViewMode()
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('')
  const [languages, setLanguages] = useState<string[]>([])
  const [interests, setInterests] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [selected, setSelected] = useState<CompanionProfile | null>(null)

  const toggleLanguage = (l: string) => {
    setLanguages(prev => (prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]))
  }
  const toggleInterest = (i: string) => {
    setInterests(prev => (prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]))
  }

  const { companions, loading, loadingMore, error, hasMore, loadMore } = useCompanions({
    currentUserId: user?.id ?? null,
    search,
    city,
    languages,
    interests,
  })

  const hasFilters = search || city || languages.length > 0 || interests.length > 0

  if (profile && effectiveRole !== 'user') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar currentPage="companions" onNavigate={onNavigate} onAuthClick={onAuthClick} />
        <div className="text-center py-20">
          <p className="text-gray-500 dark:text-gray-400">{t('companions.userOnly')}</p>
          <button onClick={() => onNavigate('profile')} className="mt-4 text-primary-600 font-medium text-sm">{t('agenda.goToProfile')}</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar currentPage="companions" onNavigate={onNavigate} onAuthClick={onAuthClick} />

      <main className="max-w-5xl mx-auto px-4 py-6 pb-24 lg:pb-8">
        <PageHeader title={t('nav.companions')} subtitle={t('companions.subtitle')} />

        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder={t('companions.searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none dark:text-gray-100"
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${showFilters ? 'bg-primary-50 border-primary-200 text-primary-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6 animate-fade-in space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900 dark:text-white">{t('browse.filters')}</h3>
              {hasFilters && (
                <button onClick={() => { setSearch(''); setCity(''); setLanguages([]); setInterests([]) }} className="text-xs text-primary-600 font-medium">
                  {t('browse.clearFilters')}
                </button>
              )}
            </div>

            <div>
              <h4 className="text-sm text-gray-600 dark:text-gray-300 mb-2">{t('profile.city')}</h4>
              <input
                type="text"
                placeholder={t('companions.cityPlaceholder')}
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none dark:text-gray-100"
              />
            </div>

            <div>
              <h4 className="text-sm text-gray-600 dark:text-gray-300 mb-2">{t('companions.languagesLabel')}</h4>
              <div className="flex flex-wrap gap-2">
                {LANGUAGE_OPTIONS.map(l => (
                  <button
                    key={l}
                    onClick={() => toggleLanguage(l)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${languages.includes(l) ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm text-gray-600 dark:text-gray-300 mb-2">{t('companions.interestsLabel')}</h4>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map(i => (
                  <button
                    key={i}
                    onClick={() => toggleInterest(i)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${interests.includes(i) ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {error && <ErrorBanner message={error} className="mb-6" />}

        {loading ? (
          <LoadingSpinner className="py-32" />
        ) : companions.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-teal-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('companions.emptyTitle')}</h3>
            <p className="text-gray-500 dark:text-gray-400">{hasFilters ? t('browse.adjustFilters') : t('companions.emptyDesc')}</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {companions.map(c => (
                <CompanionCard key={c.id} companion={c} onClick={() => setSelected(c)} />
              ))}
            </div>

            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t('browse.loadMore')}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {selected && <CompanionProfileModal companion={selected} onClose={() => setSelected(null)} onNavigate={onNavigate} />}
    </div>
  )
}
