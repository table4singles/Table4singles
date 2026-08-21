import type { Language } from '@/i18n'

/** Locale BCP-47 para fechas según el idioma de la app. */
export function appLocale(language: Language): string {
  if (language === 'zh') return 'zh-CN'
  if (language === 'ja') return 'ja-JP'
  if (language === 'ar') return 'ar'
  if (language === 'pt') return 'pt-PT'
  return language
}
