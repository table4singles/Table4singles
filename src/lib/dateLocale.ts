/** Mapa completo de los 13 idiomas soportados a su locale BCP47 para
 * toLocaleDateString/toLocaleString. Usar esto en vez de reinventar el mapa en
 * cada página — ya hubo un bug real (fechas en español para 10 de los 13 idiomas)
 * por mapas parciales duplicados en varias páginas. */
export const DATE_LOCALE_MAP: Record<string, string> = {
  es: 'es-ES', en: 'en-GB', de: 'de-DE', fr: 'fr-FR', it: 'it-IT',
  ru: 'ru-RU', pt: 'pt-PT', uk: 'uk-UA', ro: 'ro-RO', ar: 'ar-SA',
  sv: 'sv-SE', zh: 'zh-CN', ja: 'ja-JP',
}

export function resolveDateLocale(language: string): string {
  return DATE_LOCALE_MAP[language] ?? 'es-ES'
}
