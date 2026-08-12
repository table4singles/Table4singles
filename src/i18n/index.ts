import { es } from './es'
import { en } from './en'
import { de } from './de'
import { fr } from './fr'
import { it } from './it'
import { ru } from './ru'
import { pt } from './pt'
import { uk } from './uk'
import { ro } from './ro'
import { ar } from './ar'
import { sv } from './sv'
import { zh } from './zh'
import { ja } from './ja'

export type Language = 'es' | 'en' | 'de' | 'fr' | 'it' | 'ru' | 'pt' | 'uk' | 'ro' | 'ar' | 'sv' | 'zh' | 'ja'
export type Translations = typeof es

const translations: Record<Language, Translations> = { es, en, de, fr, it, ru, pt, uk, ro, ar, sv, zh, ja }

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

/** Languages that use RTL text direction */
export const RTL_LANGS: Language[] = ['ar']

export const languageOptions = [
  { code: 'es' as Language, emoji: '🇪🇸', label: 'Español' },
  { code: 'en' as Language, emoji: '🇬🇧', label: 'English' },
  { code: 'de' as Language, emoji: '🇩🇪', label: 'Deutsch' },
  { code: 'fr' as Language, emoji: '🇫🇷', label: 'Français' },
  { code: 'it' as Language, emoji: '🇮🇹', label: 'Italiano' },
  { code: 'ru' as Language, emoji: '🇷🇺', label: 'Русский' },
  { code: 'pt' as Language, emoji: '🇵🇹', label: 'Português' },
  { code: 'uk' as Language, emoji: '🇺🇦', label: 'Українська' },
  { code: 'ro' as Language, emoji: '🇷🇴', label: 'Română' },
  { code: 'ar' as Language, emoji: '🇸🇦', label: 'العربية' },
  { code: 'sv' as Language, emoji: '🇸🇪', label: 'Svenska' },
  { code: 'zh' as Language, emoji: '🇨🇳', label: '中文' },
  { code: 'ja' as Language, emoji: '🇯🇵', label: '日本語' },
]
