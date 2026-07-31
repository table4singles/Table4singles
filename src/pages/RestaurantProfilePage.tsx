import { useMemo, useState } from 'react'
import { MapPin, UtensilsCrossed, Star, ChevronLeft, Heart, Filter } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { TableCard } from '@/components/TableCard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorBanner } from '@/components/ErrorBanner'
import { useRestaurantProfile } from '@/hooks/useRestaurants'
import { useRestaurantReviews } from '@/hooks/useReviews'
import { useFavorites } from '@/hooks/useFavorites'
import { useAuth } from '@/contexts/AuthContext'
import { LANGUAGE_OPTIONS } from '@/lib/options'

interface RestaurantProfilePageProps {
  restaurantId: string
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

export function RestaurantProfilePage({ restaurantId, onNavigate, onAuthClick }: RestaurantProfilePageProps) {
  const { user } = useAuth()
  const { restaurant, tables, loading, error } = useRestaurantProfile(restaurantId)
  const { reviews } = useRestaurantReviews(restaurantId)
  const { isFavorite, toggleFavorite } = useFavorites()
  const [dateFrom, setDateFrom] = useState('')
  const [language, setLanguage] = useState('')
  const [minSeats, setMinSeats] = useState(0)

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null

  const filteredTables = useMemo(() => {
    return tables.filter(t => {
      if (dateFrom && t.date < dateFrom) return false
      if (language && !(t.languages || []).includes(language)) return false
      if (minSeats > 0 && t.available_seats < minSeats) return false
      return true
    })
  }, [tables, dateFrom, language, minSeats])

  const hasTableFilters = dateFrom || language || minSeats > 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar currentPage="browse" onNavigate={onNavigate} onAuthClick={onAuthClick} />
        <LoadingSpinner className="py-32" />
      </div>
    )
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar currentPage="browse" onNavigate={onNavigate} onAuthClick={onAuthClick} />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <ErrorBanner message={error || 'Restaurante no encontrado'} />
        </div>
      </div>
    )
  }

  const photo = restaurant.restaurant_photos?.[0]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar currentPage="browse" onNavigate={onNavigate} onAuthClick={onAuthClick} />

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-8">
        <button onClick={() => onNavigate('browse')} className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4">
          <ChevronLeft className="w-4 h-4" /> Volver a restaurantes
        </button>

        {/* Ficha del restaurante: foto izquierda, datos derecha */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden mb-8">
          <div className="flex flex-col sm:flex-row">
            <div className="w-full sm:w-64 h-56 sm:h-auto flex-shrink-0 bg-gray-100 dark:bg-gray-700">
              {photo ? (
                <img src={photo} alt={restaurant.restaurant_name || ''} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                  <UtensilsCrossed className="w-12 h-12" />
                </div>
              )}
            </div>
            <div className="flex-1 p-6">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">{restaurant.restaurant_name || 'Restaurante'}</h1>
                {user && (
                  <button
                    onClick={() => toggleFavorite(restaurant.id)}
                    className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
                    aria-label="Marcar como favorito"
                  >
                    <Heart className={`w-5 h-5 ${isFavorite(restaurant.id) ? 'fill-red-500 text-red-500' : 'text-gray-400 dark:text-gray-500'}`} />
                  </button>
                )}
              </div>

              <p className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 mt-2">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                {[restaurant.city, restaurant.country].filter(Boolean).join(', ') || 'Ubicación no especificada'}
              </p>

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {restaurant.restaurant_cuisine && (
                  <span className="text-xs px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full font-medium">{restaurant.restaurant_cuisine}</span>
                )}
                {restaurant.restaurant_price_range && (
                  <span className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full font-medium">{restaurant.restaurant_price_range}</span>
                )}
                {avgRating !== null && (
                  <span className="text-xs px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-full font-medium flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" /> {avgRating.toFixed(1)} ({reviews.length})
                  </span>
                )}
              </div>

              {restaurant.restaurant_description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-4 leading-relaxed">{restaurant.restaurant_description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Mesas disponibles */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white">Mesas disponibles</h2>
          </div>

          {tables.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 mb-5">
              <div className="flex items-center gap-1.5 mb-3 text-gray-700 dark:text-gray-200">
                <Filter className="w-4 h-4" />
                <h3 className="text-sm font-medium">Filtrar mesas</h3>
                {hasTableFilters && (
                  <button onClick={() => { setDateFrom(''); setLanguage(''); setMinSeats(0) }} className="ml-auto text-xs text-primary-600 font-medium">
                    Limpiar
                  </button>
                )}
              </div>
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Desde</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Idioma</label>
                  <select
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="">Cualquiera</option>
                    {LANGUAGE_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Plazas libres mín.</label>
                  <input
                    type="number"
                    min={0}
                    value={minSeats || ''}
                    onChange={e => setMinSeats(Number(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {tables.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <UtensilsCrossed className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Este restaurante no tiene mesas abiertas ahora mismo</p>
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <UtensilsCrossed className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Ninguna mesa coincide con esos filtros</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {filteredTables.map(table => (
                <TableCard key={table.id} table={table} onClick={() => onNavigate('table-detail', table.id)} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
