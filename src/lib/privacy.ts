/** Privacidad de comensales: ciudad y edad se muestran por separado, cada una solo si el usuario lo activa.
 *  La calle del comensal nunca es pública. La dirección del restaurante sí lo es. */

export function calculateAge(dateOfBirth: string | null | undefined): number | null {
  if (!dateOfBirth) return null
  const dob = new Date(dateOfBirth)
  if (Number.isNaN(dob.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age > 0 ? age : null
}

export function publicAge(profile: {
  date_of_birth?: string | null
  show_age?: boolean | null
}): number | null {
  if (!profile.show_age) return null
  return calculateAge(profile.date_of_birth)
}

export function publicLocation(profile: {
  show_city?: boolean | null
  city?: string | null
  province?: string | null
  country?: string | null
}): string {
  if (!profile.show_city) return ''
  return [profile.city, profile.province, profile.country].filter(Boolean).join(', ')
}

type SanitizableDiner = {
  show_city?: boolean | null
  show_age?: boolean | null
  city?: string | null
  province?: string | null
  country?: string | null
  date_of_birth?: string | null
  street_address?: string | null
}

/** Anula ciudad y/o edad por separado según cada flag. Nunca deja street_address del comensal. */
export function sanitizePublicDiner<T extends SanitizableDiner>(profile: T): T {
  const showCity = !!profile.show_city
  const showAge = !!profile.show_age
  return {
    ...profile,
    street_address: null,
    city: showCity ? profile.city ?? null : null,
    province: showCity ? profile.province ?? null : null,
    country: showCity ? profile.country ?? null : null,
    date_of_birth: showAge ? profile.date_of_birth ?? null : null,
  }
}

/** Dirección pública del restaurante: calle + ciudad + país. */
export function restaurantPublicLocation(place: {
  restaurant_address?: string | null
  city?: string | null
  country?: string | null
  restaurant_city?: string | null
  restaurant_country?: string | null
}): string {
  const parts = [
    place.restaurant_address,
    place.city ?? place.restaurant_city,
    place.country ?? place.restaurant_country,
  ].filter((p): p is string => !!p && p.trim().length > 0)
  return [...new Set(parts)].join(', ')
}
