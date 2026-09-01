export const LANGUAGE_OPTIONS = [
  'Español',
  'Inglés',
  'Francés',
  'Alemán',
  'Italiano',
  'Portugués',
  'Catalán',
  'Otro',
] as const

// Mismos valores que usa CreateTablePage/OnboardingPage para `restaurant_cuisine`/
// `cuisine_type` — deben coincidir literalmente con lo guardado en BD para que
// cualquier filtro por cocina (Browse, Avísame) encuentre resultados reales.
export const CUISINE_OPTIONS = [
  'Italiana',
  'Japonesa',
  'Mexicana',
  'Francesa',
  'Tailandesa',
  'India',
  'China',
  'Española',
  'Mediterránea',
  'Americana',
  'Coreana',
  'Vietnamita',
  'Griega',
  'Turca',
  'Fusión',
  'Otra',
] as const

export const INTEREST_OPTIONS = [
  'Viajar',
  'Deporte',
  'Música',
  'Cine',
  'Arte',
  'Gastronomía',
  'Lectura',
  'Tecnología',
  'Naturaleza',
  'Fotografía',
  'Baile',
  'Yoga',
  'Mascotas',
  'Vida nocturna',
] as const
