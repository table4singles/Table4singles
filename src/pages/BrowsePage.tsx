import { useState } from 'react'
import { Search, SlidersHorizontal, Plus, UtensilsCrossed, Heart } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { TableCard } from '@/components/TableCard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorBanner } from '@/components/ErrorBanner'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTables } from '@/hooks/useTables'

const CUISINE_TYPES = ['Italian', 'Japanese', 'Mexican', 'French', 'Thai', 'Indian', 'Chinese', 'Spanish', 'Mediterranean', 'American', 'Korean', 'Vietnamese', 'Greek', 'Turkish', 'Other']

interface BrowsePageProps {
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

export function BrowsePage({ onNavigate, onAuthClick }: BrowsePageProps) {
  const { t } = useLanguage()
  const [search, setSearch] = useState('')
  const [cuisines, setCuisines] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  const toggleCuisine = (c: string) => {
    setCuisines(prev => (prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]))
  }

  const { tables, loading, error } = useTables({ search, cuisine: cuisines })

  const hasFilters = search || cuisines.length > 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar currentPage="browse" onNavigate={onNavigate} onAuthClick={onAuthClick} />

      <main className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-8">
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
              <h3 className="font-medium text-gray-900 dark:text-white">{t('browse.cuisine')} <span className="text-gray-400 dark:text-gray-500 font-normal">(elige tantos como quieras)</span></h3>
              {hasFilters && (
                <button onClick={() => { setSearch(''); setCuisines([]) }} className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                  {t('browse.clearFilters')}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {CUISINE_TYPES.map(c => (
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
            <div className="w-20 h-20 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mx-auto mb-6">
              <UtensilsCrossed className="w-10 h-10 text-teal-600 dark:text-teal-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('browse.noResults')}</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{hasFilters ? t('browse.adjustFilters') : t('browse.beFirst')}</p>
            <button onClick={() => onNavigate('create')} className="px-8 py-3 bg-[#129a93] text-white rounded-xl font-medium hover:bg-[#0b7f79] transition-colors inline-flex items-center gap-2">
              <Plus className="w-5 h-5" /> {t('browse.createTable')}
            </button>

            <div className="border-t border-gray-200 dark:border-gray-700 mt-10 pt-8">
              <Heart className="w-8 h-8 text-pink-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-300 mb-2">¿Conoces un restaurante que te encantó? Compártelo con la comunidad</p>
              <button onClick={() => onNavigate('create')} className="text-teal-600 dark:text-teal-400 font-medium hover:text-teal-700 dark:hover:text-teal-300 inline-flex items-center gap-1.5">
                <UtensilsCrossed className="w-4 h-4" /> Sugerir un restaurante
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{tables.length} {t('browse.results')}</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {tables.map(table => (
                <TableCard key={table.id} table={table} onClick={() => onNavigate('table-detail', table.id)} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
