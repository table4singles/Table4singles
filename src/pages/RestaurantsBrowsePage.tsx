import { useState } from 'react'
import { Search, SlidersHorizontal, MapPin, UtensilsCrossed, ChevronRight, Navigation, Heart, List, Map as MapIcon, X } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorBanner } from '@/components/ErrorBanner'
import { RestaurantsMap } from '@/components/RestaurantsMap'
import { useRestaurants, type RestaurantWithDistance } from '@/hooks/useRestaurants'
import { useFavorites } from '@/hooks/useFavorites'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { RADIUS_STEPS_KM } from '@/lib/geocoding'
import { restaurantPublicLocation } from '@/lib/privacy'
import { appLocale } from '@/lib/locale'

const CUISINE_TYPES = ['Italian', 'Japanese', 'Mexican', 'French', 'Thai', 'Indian', 'Chinese', 'Spanish', 'Mediterranean', 'American', 'Korean', 'Vietnamese', 'Greek', 'Turkish', 'Other']
const PRICE_RANGES = ['0€-50€', '50€-100€', '100€-200€', '+200€']

interface RestaurantsBrowsePageProps {
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

export function RestaurantsBrowsePage({ onNavigate, onAuthClick }: RestaurantsBrowsePageProps) {
  const { user } = useAuth()
  const { t, language } = useLanguage()
  const [search, setSearch] = useState('')
  const [cuisines, setCuisines] = useState<string[]>([])
  const [priceRanges, setPriceRanges] = useState<string[]>([])
  const [dateFilter, setDateFilter] = useState('')
  const [timeFilter, setTimeFilter] = useState<'midday' | 'evening' | ''>('')
  const [showFilters, setShowFilters] = useState(false)
  const [radiusIndex, setRadiusIndex] = useState(0)
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [view, setView] = useState<'list' | 'map'>('list')

  const radiusKm = radiusIndex > 0 ? RADIUS_STEPS_KM[radiusIndex - 1] : null
  const canUseRadius = search.trim().length > 0

  const toggleCuisine = (c: string) => {
    setCuisines(prev => (prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]))
  }
  const togglePrice = (p: string) => {
    setPriceRanges(prev => (prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]))
  }

  const clearAllFilters = () => {
    setSearch('')
    setCuisines([])
    setPriceRanges([])
    setDateFilter('')
    setTimeFilter('')
    setRadiusIndex(0)
    setOnlyFavorites(false)
  }

  const { restaurants: allRestaurants, loading, error, locationNotFound } = useRestaurants({
    search,
    cuisine: cuisines,
    priceRange: priceRanges,
    dateFilter: dateFilter || undefined,
    timeFilter: timeFilter || undefined,
    radiusKm,
    ensureCoordinates: view === 'map',
  })
  const { isFavorite, toggleFavorite } = useFavorites()
  const restaurants = onlyFavorites ? allRestaurants.filter(r => isFavorite(r.id)) : allRestaurants
  const hasFilters = !!(search || cuisines.length > 0 || priceRanges.length > 0 || dateFilter || timeFilter || radiusKm || onlyFavorites)
  const activeFilterCount = [cuisines.length > 0, priceRanges.length > 0, !!radiusKm, onlyFavorites].filter(Boolean).length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar currentPage="browse" onNavigate={onNavigate} onAuthClick={onAuthClick} />

      <main className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">{t('browse.title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('browse.subtitle')}</p>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder={t('browse.searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`relative px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${showFilters ? 'bg-primary-50 border-primary-200 text-primary-600 dark:bg-primary-900/30 dark:border-primary-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            <SlidersHorizontal className="w-5 h-5" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary-500 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          <div className="flex bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1">
            <button
              onClick={() => setView('list')}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${view === 'list' ? 'bg-primary-500 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              <List className="w-4 h-4" /> <span className="hidden sm:inline">{t('browse.list')}</span>
            </button>
            <button
              onClick={() => setView('map')}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${view === 'map' ? 'bg-primary-500 text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              <MapIcon className="w-4 h-4" /> <span className="hidden sm:inline">{t('browse.map')}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[160px]">
            <input
              type="date"
              value={dateFilter}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setDateFilter(e.target.value)}
              className="w-full pl-3 pr-8 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-gray-700 dark:text-gray-200"
            />
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setTimeFilter(prev => prev === 'midday' ? '' : 'midday')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors whitespace-nowrap ${timeFilter === 'midday' ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-600 dark:text-amber-300' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            ☀️ {t('browse.midday')}
          </button>
          <button
            onClick={() => setTimeFilter(prev => prev === 'evening' ? '' : 'evening')}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors whitespace-nowrap ${timeFilter === 'evening' ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-600 dark:text-indigo-300' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            🌙 {t('browse.evening')}
          </button>
          {(dateFilter || timeFilter) && (
            <button
              onClick={() => { setDateFilter(''); setTimeFilter('') }}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center gap-0.5"
            >
              <X className="w-3 h-3" /> {t('browse.clear')}
            </button>
          )}
        </div>

        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6 animate-fade-in space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{t('browse.filters')}</h3>
              {hasFilters && (
                <button onClick={clearAllFilters} className="flex items-center gap-1 text-xs text-primary-600 font-medium hover:text-primary-700">
                  <X className="w-3 h-3" /> {t('browse.clearAll')}
                </button>
              )}
            </div>

            <div>
              <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-2">{t('browse.priceRange')}</h3>
              <div className="flex gap-2">
                {PRICE_RANGES.map(p => (
                  <button
                    key={p}
                    onClick={() => togglePrice(p)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${priceRanges.includes(p) ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-2">{t('browse.cuisineType')}</h3>
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

            <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <Navigation className="w-4 h-4 text-primary-500" />
                <h3 className="font-medium text-gray-900 dark:text-white text-sm">{t('browse.searchRadius')}</h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {canUseRadius ? t('browse.radiusHintActive') : t('browse.radiusHintNeedCity')}
              </p>
              <input
                type="range"
                min={0}
                max={RADIUS_STEPS_KM.length}
                step={1}
                value={radiusIndex}
                disabled={!canUseRadius}
                onChange={e => setRadiusIndex(Number(e.target.value))}
                className="w-full accent-primary-500 disabled:opacity-40 disabled:cursor-not-allowed"
              />
              <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-1 px-0.5">
                <span>{t('browse.exact')}</span>
                {RADIUS_STEPS_KM.map(km => <span key={km}>{km}</span>)}
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mt-2">
                {radiusKm ? `${radiusKm} ${t('browse.aroundKm')}` : t('browse.exactMatch')}
              </p>
            </div>

            {user && (
              <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyFavorites}
                    onChange={e => setOnlyFavorites(e.target.checked)}
                    className="w-4 h-4 rounded accent-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-red-400" /> {t('browse.onlyFavorites')}
                  </span>
                </label>
              </div>
            )}
          </div>
        )}

        {error && <ErrorBanner message={error} className="mb-6" />}
        {locationNotFound && (
          <ErrorBanner message={t('browse.locationNotFound')} className="mb-6" />
        )}

        {loading ? (
          <LoadingSpinner className="py-32" />
        ) : restaurants.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-6">
              <UtensilsCrossed className="w-10 h-10 text-teal-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t('browse.noRestaurants')}</h3>
            <p className="text-gray-500 dark:text-gray-400">{hasFilters ? t('browse.adjustFilters') : t('browse.comingSoon')}</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {restaurants.length}{' '}
              {restaurants.length === 1 ? t('browse.restaurantsCount') : t('browse.restaurantsCountPlural')}
              {radiusKm ? ` ${t('browse.withinKm')} ${radiusKm} km` : ''}
              {dateFilter
                ? ` ${t('browse.withTablesOn')} ${new Date(dateFilter + 'T12:00:00').toLocaleDateString(appLocale(language), { day: 'numeric', month: 'short' })}`
                : ''}
            </p>
            {view === 'map' ? (
              <RestaurantsMap restaurants={restaurants} onSelect={id => onNavigate('restaurant-profile', id)} />
            ) : (
              <div className="space-y-4">
                {restaurants.map(r => (
                  <RestaurantCard
                    key={r.id}
                    restaurant={r}
                    onClick={() => onNavigate('restaurant-profile', r.id)}
                    isFavorite={user ? isFavorite(r.id) : false}
                    onToggleFavorite={user ? () => toggleFavorite(r.id) : undefined}
                    restaurantFallback={t('browse.restaurantFallback')}
                    locationUnspecified={t('browse.locationUnspecified')}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

function RestaurantCard({
  restaurant, onClick, isFavorite, onToggleFavorite, restaurantFallback, locationUnspecified,
}: {
  restaurant: RestaurantWithDistance
  onClick: () => void
  isFavorite?: boolean
  onToggleFavorite?: () => void
  restaurantFallback: string
  locationUnspecified: string
}) {
  const photo = restaurant.restaurant_photos?.[0] ?? restaurant.avatar_url
  const photoIsLogo = !restaurant.restaurant_photos?.[0] && !!restaurant.avatar_url
  return (
    <button onClick={onClick} className="relative w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all overflow-hidden text-left flex">
      {onToggleFavorite && (
        <span
          role="button"
          tabIndex={0}
          onClick={e => { e.stopPropagation(); onToggleFavorite() }}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onToggleFavorite() } }}
          className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-white dark:bg-gray-800/90 shadow flex items-center justify-center hover:scale-105 transition-transform"
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400 dark:text-gray-500'}`} />
        </span>
      )}
      <div className="w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 bg-gray-100 dark:bg-gray-700">
        {photo ? (
          <img src={photo} alt={restaurant.restaurant_name ?? ''} className={`w-full h-full ${photoIsLogo ? 'object-contain p-3' : 'object-cover'}`} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
            <UtensilsCrossed className="w-10 h-10" />
          </div>
        )}
      </div>
      <div className="flex-1 p-4 flex flex-col justify-center min-w-0">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{restaurant.restaurant_name || restaurantFallback}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{restaurantPublicLocation(restaurant) || locationUnspecified}</span>
        </p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {restaurant.restaurant_cuisine && (
            <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full">{restaurant.restaurant_cuisine}</span>
          )}
          {restaurant.restaurant_price_range && (
            <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">{restaurant.restaurant_price_range}</span>
          )}
          {restaurant.distanceKm != null && (
            <span className="text-xs px-2 py-0.5 bg-primary-50 text-primary-600 rounded-full flex items-center gap-1">
              <Navigation className="w-3 h-3" /> {restaurant.distanceKm < 1 ? '<1' : Math.round(restaurant.distanceKm)} km
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center pr-4 text-gray-300 dark:text-gray-600">
        <ChevronRight className="w-5 h-5" />
      </div>
    </button>
  )
}
