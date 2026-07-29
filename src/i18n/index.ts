import { es } from './es'
import { en } from './en'
import { de } from './de'

export type Language = 'es' | 'en' | 'de'
export type Translations = typeof es

const translations: Record<Language, Translations> = { es, en, de }

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.')
  let current: unknown = obj
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key]
    } else {
      return path
    }
  }
  return typeof current === 'string' ? current : path
}

export function getTranslation(lang: Language) {
  const t = (key: string): string => getNestedValue(translations[lang] as unknown as Record<string, unknown>, key)
  return t
}

export const languageOptions = [
  { code: 'es' as Language, emoji: '🇪🇸', label: 'Español' },
  { code: 'en' as Language, emoji: '🇬🇧', label: 'English' },
  { code: 'de' as Language, emoji: '🇩🇪', label: 'Deutsch' },
]
