import { useState } from 'react'
import { Search, SlidersHorizontal, BellRing, Store, Sparkles } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { PageHeader } from '@/components/PageHeader'
import { ActivitySummaryCard } from '@/components/ActivitySummaryCard'
import { TableCard } from '@/components/TableCard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorBanner } from '@/components/ErrorBanner'
import { EmptyStateIllustration } from '@/components/EmptyStateIllustration'
import { DemandRequestModal } from '@/components/DemandRequestModal'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTables, type QuickDateFilter } from '@/hooks/useTables'
import { CUISINE_OPTIONS } from '@/lib/options'

interface BrowsePageProps {
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

export function BrowsePage({ onNavigate, onAuthClick }: BrowsePageProps) {
  const { t } = useLanguage()
  const [search, setSearch] = useState('')
  const [cuisines, setCuisines] = useState<string[]>([])
  const [dateFilter, setDateFilter] = useState<QuickDateFilter | undefined>(undefined)
  const [showFilters, setShowFilters] = useState(false)
  const [showDemandModal, setShowDemandModal] = useState(false)

  const toggleCuisine = (c: string) => {
    setCuisines(prev => (prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]))
  }

  const { tables, loading, error } = useTables({ search, cuisine: cuisines, dateFilter, withParticipants: true })
  const specialTables = tables.filter(tb => tb.is_special)

  const hasFilters = search || cuisines.length > 0 || !!dateFilter

  const quickFilters: { id: QuickDateFilter; label: string }[] = [
    { id: 'today', label: t('upcomingDinners.today') },
    { id: 'tomorrow', label: t('upcomingDinners.tomorrow') },
    { id: 'week', label: t('upcomingDinners.thisWeek') },
    { id: 'weekend', label: t('upcomingDinners.weekend') },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar currentPage="browse" onNavigate={onNavigate} onAuthClick={onAuthClick} />

      <main className="max-w-6xl mx-auto px-4 py-6 pb-24 lg:pb-8">
        <ActivitySummaryCard onNavigate={onNavigate} />

        <PageHeader
          title={t('upcomingDinners.title')}
          subtitle={t('upcomingDinners.subtitle')}
          action={
            <button
              onClick={() => onNavigate('restaurants-list')}
              className="px-4 py-2.5 bg-white/95 text-gray-900 rounded-xl font-medium text-sm hover:bg-white transition-colors flex items-center gap-2 shadow-sm"
            >
              <Store className="w-4 h-4" /> {t('upcomingDinners.byRestaurant')}
            </button>
          }
        />

        {/* Cenas especiales */}
        {!hasFilters && specialTables.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-1.5 mb-3">
              <Sparkles className="w-4 h-4 text-[#129a93]" />
              <h2 className="font-display font-bold text-gray-900 dark:text-white">{t('specialGuest.sectionTitle')}</h2>
              <span className="text-sm text-gray-400 dark:text-gray-500">— {t('specialGuest.sectionSubtitle')}</span>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:overflow-visible">
              {specialTables.map(table => (
                <div key={table.id} className="w-72 flex-shrink-0 sm:w-auto">
                  <TableCard
                    table={table}
                    participants={table.table_participants}
                    showRestaurant
                    onClick={() => onNavigate('table-detail', table.id)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick date filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {quickFilters.map(f => (
            <button
              key={f.id}
              onClick={() => setDateFilter(dateFilter === f.id ? undefined : f.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${dateFilter === f.id ? 'bg-primary-500 text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder={t('browse.searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${showFilters ? 'bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-700 text-primary-600 dark:text-primary-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900 dark:text-white">{t('browse.cuisine')}</h3>
              {hasFilters && (
                <button onClick={() => { setSearch(''); setCuisines([]); setDateFilter(undefined) }} className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                  {t('browse.clearFilters')}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {CUISINE_OPTIONS.map(c => (
                <button
                  key={c}
                  onClick={() => toggleCuisine(c)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${cuisines.includes(c) ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && <ErrorBanner message={error} className="mb-6" />}

        {/* Results */}
        {loading ? (
          <LoadingSpinner className="py-32" />
        ) : tables.length === 0 ? (
          <div className="text-center py-20">
            <EmptyStateIllustration className="w-24 h-24 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {hasFilters ? t('upcomingDinners.noneMatch') : t('browse.noResults')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{hasFilters ? t('browse.adjustFilters') : t('browse.beFirst')}</p>
            <button
              onClick={() => setShowDemandModal(true)}
              className="px-8 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors inline-flex items-center gap-2"
            >
              <BellRing className="w-5 h-5" /> {t('upcomingDinners.notifyMe')}
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{tables.length} {t('browse.results')}</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {tables.map(table => (
                <TableCard
                  key={table.id}
                  table={table}
                  participants={table.table_participants}
                  showRestaurant
                  onClick={() => onNavigate('table-detail', table.id)}
                />
              ))}
            </div>
          </>
        )}

        {tables.length > 0 && (
          <div className="text-center mt-10 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{t('upcomingDinners.notFoundYours')}</p>
            <button onClick={() => setShowDemandModal(true)} className="text-primary-600 dark:text-primary-400 font-medium hover:text-primary-700 dark:hover:text-primary-300 inline-flex items-center gap-1.5">
              <BellRing className="w-4 h-4" /> {t('upcomingDinners.notifyMe')}
            </button>
          </div>
        )}
      </main>

      {showDemandModal && <DemandRequestModal onClose={() => setShowDemandModal(false)} />}
    </div>
  )
}
