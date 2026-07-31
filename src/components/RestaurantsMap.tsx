import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import type { RestaurantWithDistance } from '@/hooks/useRestaurants'

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
})

const DEFAULT_CENTER: [number, number] = [40.4168, -3.7038] // Madrid, fallback

interface RestaurantsMapProps {
  restaurants: RestaurantWithDistance[]
  onSelect: (id: string) => void
}

export function RestaurantsMap({ restaurants, onSelect }: RestaurantsMapProps) {
  const located = restaurants.filter(r => r.latitude != null && r.longitude != null)

  const center: [number, number] = located.length > 0
    ? [
        located.reduce((sum, r) => sum + (r.latitude || 0), 0) / located.length,
        located.reduce((sum, r) => sum + (r.longitude || 0), 0) / located.length,
      ]
    : DEFAULT_CENTER

  if (located.length === 0) {
    return (
      <div className="h-[420px] rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
        Ningún restaurante de esta lista tiene ubicación disponible todavía
      </div>
    )
  }

  return (
    <div className="h-[420px] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
      <MapContainer center={center} zoom={located.length === 1 ? 13 : 6} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {located.map(r => (
          <Marker key={r.id} position={[r.latitude as number, r.longitude as number]}>
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{r.restaurant_name || 'Restaurante'}</p>
                {r.restaurant_cuisine && <p className="text-gray-500 dark:text-gray-400">{r.restaurant_cuisine}</p>}
                <button onClick={() => onSelect(r.id)} className="mt-1.5 text-primary-600 font-medium">
                  Ver ficha →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
