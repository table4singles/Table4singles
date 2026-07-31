import { MapPin, UtensilsCrossed, Star, ChevronLeft } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { TableCard } from '@/components/TableCard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorBanner } from '@/components/ErrorBanner'
import { useRestaurantProfile } from '@/hooks/useRestaurants'
import { useRestaurantReviews } from '@/hooks/useReviews'

interface RestaurantProfilePageProps {
  restaurantId: string
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

export function RestaurantProfilePage({ restaurantId, onNavigate, onAuthClick }: RestaurantProfilePageProps) {
  const { restaurant, tables, loading, error } = useRestaurantProfile(restaurantId)
  const { reviews } = useRestaurantReviews(restaurantId)

  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar currentPage="browse" onNavigate={onNavigate} onAuthClick={onAuthClick} />
        <LoadingSpinner className="py-32" />
      </div>
    )
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar currentPage="browse" onNavigate={onNavigate} onAuthClick={onAuthClick} />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <ErrorBanner message={error || 'Restaurante no encontrado'} />
        </div>
      </div>
    )
  }

  const photo = restaurant.restaurant_photos?.[0]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage="browse" onNavigate={onNavigate} onAuthClick={onAuthClick} />

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-8">
        <button onClick={() => onNavigate('browse')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ChevronLeft className="w-4 h-4" /> Volver a restaurantes
        </button>

        {/* Ficha del restaurante: foto izquierda, datos derecha */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
          <div className="flex flex-col sm:flex-row">
            <div className="w-full sm:w-64 h-56 sm:h-auto flex-shrink-0 bg-gray-100">
              {photo ? (
                <img src={photo} alt={restaurant.restaurant_name || ''} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <UtensilsCrossed className="w-12 h-12" />
                </div>
              )}
            </div>
            <div className="flex-1 p-6">
              <h1 className="text-2xl font-display font-bold text-gray-900">{restaurant.restaurant_name || 'Restaurante'}</h1>

              <p className="flex items-center gap-1.5 text-gray-500 mt-2">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                {[restaurant.city, restaurant.country].filter(Boolean).join(', ') || 'Ubicación no especificada'}
              </p>

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {restaurant.restaurant_cuisine && (
                  <span className="text-xs px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full font-medium">{restaurant.restaurant_cuisine}</span>
                )}
                {restaurant.restaurant_price_range && (
                  <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">{restaurant.restaurant_price_range}</span>
                )}
                {avgRating !== null && (
                  <span className="text-xs px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-full font-medium flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" /> {avgRating.toFixed(1)} ({reviews.length})
                  </span>
                )}
              </div>

              {restaurant.restaurant_description && (
                <p className="text-sm text-gray-600 mt-4 leading-relaxed">{restaurant.restaurant_description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Mesas disponibles */}
        <div>
          <h2 className="text-lg font-display font-bold text-gray-900 mb-4">Mesas disponibles</h2>
          {tables.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <UtensilsCrossed className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Este restaurante no tiene mesas abiertas ahora mismo</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {tables.map(table => (
                <TableCard key={table.id} table={table} onClick={() => onNavigate('table-detail', table.id)} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
