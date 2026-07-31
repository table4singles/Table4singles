import { useState } from 'react'
import { Search, SlidersHorizontal, MapPin, UtensilsCrossed, ChevronRight, Navigation } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorBanner } from '@/components/ErrorBanner'
import { useRestaurants, type RestaurantWithDistance } from '@/hooks/useRestaurants'
import { RADIUS_STEPS_KM } from '@/lib/geocoding'

const CUISINE_TYPES = ['Italian', 'Japanese', 'Mexican', 'French', 'Thai', 'Indian', 'Chinese', 'Spanish', 'Mediterranean', 'American', 'Korean', 'Vietnamese', 'Greek', 'Turkish', 'Other']

interface RestaurantsBrowsePageProps {
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

export function RestaurantsBrowsePage({ onNavigate, onAuthClick }: RestaurantsBrowsePageProps) {
  const [search, setSearch] = useState('')
  const [cuisines, setCuisines] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [radiusIndex, setRadiusIndex] = useState(0) // 0 = coincidencia exacta (sin radio)

  const radiusKm = radiusIndex > 0 ? RADIUS_STEPS_KM[radiusIndex - 1] : null
  const canUseRadius = search.trim().length > 0

  const toggleCuisine = (c: string) => {
    setCuisines(prev => (prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]))
  }

  const { restaurants, loading, error, locationNotFound } = useRestaurants({ search, cuisine: cuisines, radiusKm })
  const hasFilters = search || cuisines.length > 0 || radiusKm

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage="browse" onNavigate={onNavigate} onAuthClick={onAuthClick} />

      <main className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-gray-900">Restaurantes</h1>
          <p className="text-gray-500 text-sm mt-1">Encuentra tu próxima cena compartida</p>
        </div>

        {/* Search bar */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Busca por ciudad o nombre de restaurante"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
            />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${showFilters ? 'bg-primary-50 border-primary-200 text-primary-600' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 animate-fade-in space-y-5">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Tipo de cocina <span className="text-gray-400 font-normal">(elige tantos como quieras)</span></h3>
                {hasFilters && (
                  <button onClick={() => { setSearch(''); setCuisines([]); setRadiusIndex(0) }} className="text-xs text-primary-600 font-medium">
                    Limpiar filtros
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {CUISINE_TYPES.map(c => (
                  <button
                    key={c}
                    onClick={() => toggleCuisine(c)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${cuisines.includes(c) ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-1">
                <Navigation className="w-4 h-4 text-primary-500" />
                <h3 className="font-medium text-gray-900">Radio de búsqueda</h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                {canUseRadius
                  ? 'Busca restaurantes hasta X km a la redonda de la ciudad indicada arriba'
                  : 'Escribe una ciudad en el buscador de arriba para activar la búsqueda por radio'}
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
              <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-0.5">
                <span>Exacto</span>
                {RADIUS_STEPS_KM.map(km => <span key={km}>{km}</span>)}
              </div>
              <p className="text-sm font-medium text-gray-700 mt-2">
                {radiusKm ? `${radiusKm} km a la redonda` : 'Coincidencia exacta por texto'}
              </p>
            </div>
          </div>
        )}

        {error && <ErrorBanner message={error} className="mb-6" />}
        {locationNotFound && (
          <ErrorBanner message="No hemos encontrado esa ubicación. Prueba con otra ciudad." className="mb-6" />
        )}

        {loading ? (
          <LoadingSpinner className="py-32" />
        ) : restaurants.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-6">
              <UtensilsCrossed className="w-10 h-10 text-teal-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No hay restaurantes disponibles</h3>
            <p className="text-gray-500">{hasFilters ? 'Ajusta los filtros de búsqueda' : 'Vuelve pronto, estamos sumando restaurantes'}</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{restaurants.length} restaurantes{radiusKm ? ` a menos de ${radiusKm} km` : ''}</p>
            <div className="space-y-4">
              {restaurants.map(r => (
                <RestaurantCard key={r.id} restaurant={r} onClick={() => onNavigate('restaurant-profile', r.id)} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function RestaurantCard({ restaurant, onClick }: { restaurant: RestaurantWithDistance; onClick: () => void }) {
  const photo = restaurant.restaurant_photos?.[0]
  return (
    <button onClick={onClick} className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden text-left flex">
      <div className="w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0 bg-gray-100">
        {photo ? (
          <img src={photo} alt={restaurant.restaurant_name ?? ''} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <UtensilsCrossed className="w-10 h-10" />
          </div>
        )}
      </div>
      <div className="flex-1 p-4 flex flex-col justify-center min-w-0">
        <h3 className="font-semibold text-gray-900 truncate">{restaurant.restaurant_name || 'Restaurante'}</h3>
        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{[restaurant.city, restaurant.country].filter(Boolean).join(', ') || 'Ubicación no especificada'}</span>
        </p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          {restaurant.restaurant_cuisine && (
            <span className="text-xs px-2 py-0.5 bg-orange-50 text-orange-600 rounded-full">{restaurant.restaurant_cuisine}</span>
          )}
          {restaurant.restaurant_price_range && (
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{restaurant.restaurant_price_range}</span>
          )}
          {restaurant.distanceKm != null && (
            <span className="text-xs px-2 py-0.5 bg-primary-50 text-primary-600 rounded-full flex items-center gap-1">
              <Navigation className="w-3 h-3" /> {restaurant.distanceKm < 1 ? '<1' : Math.round(restaurant.distanceKm)} km
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center pr-4 text-gray-300">
        <ChevronRight className="w-5 h-5" />
      </div>
    </button>
  )
}
