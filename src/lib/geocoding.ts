// Geocodificación ligera basada en Nominatim (OpenStreetMap), sin API key.
// Se usa para ubicar aproximadamente una ciudad/dirección y poder filtrar
// restaurantes "a X km a la redonda". Los resultados se cachean en
// localStorage para no repetir peticiones para la misma consulta.

export interface GeoPoint {
  lat: number
  lon: number
}

const CACHE_PREFIX = 't4s_geocode_'
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 dias

interface CacheEntry {
  point: GeoPoint | null
  ts: number
}

function normalizeKey(query: string) {
  return query.trim().toLowerCase()
}

function readCache(key: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const entry: CacheEntry = JSON.parse(raw)
    if (Date.now() - entry.ts > CACHE_TTL_MS) return null
    return entry
  } catch {
    return null
  }
}

function writeCache(key: string, point: GeoPoint | null) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ point, ts: Date.now() }))
  } catch {
    // localStorage puede no estar disponible (modo privado, cuota, etc.)
  }
}

/**
 * Convierte un texto libre (ciudad, direccion...) en coordenadas aproximadas.
 * Devuelve null si no se encuentra nada o falla la peticion.
 */
export async function geocodeQuery(query: string): Promise<GeoPoint | null> {
  const key = normalizeKey(query)
  if (!key) return null

  const cached = readCache(key)
  if (cached) return cached.point

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
    const res = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!res.ok) {
      writeCache(key, null)
      return null
    }
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) {
      writeCache(key, null)
      return null
    }
    const point: GeoPoint = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
    if (Number.isNaN(point.lat) || Number.isNaN(point.lon)) {
      writeCache(key, null)
      return null
    }
    writeCache(key, point)
    return point
  } catch {
    return null
  }
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

/** Distancia en km entre dos puntos (formula de Haversine). */
export function haversineDistanceKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLon = Math.sin(dLon / 2)
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

/** Pasos fijos del slider de radio de busqueda, en km. */
export const RADIUS_STEPS_KM = [5, 10, 25, 50, 100, 200, 500] as const
