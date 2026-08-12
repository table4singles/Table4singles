import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { getTranslation, type Language, RTL_LANGS, languageOptions } from '@/i18n'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | null>(null)

const ALL_CODES = languageOptions.map(l => l.code)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('t4s-lang')
    if (saved && ALL_CODES.includes(saved as Language)) return saved as Language
    const browser = navigator.language.split('-')[0]
    if (ALL_CODES.includes(browser as Language)) return browser as Language
    return 'es'
  })

  useEffect(() => {
    document.documentElement.lang = language
    document.documentElement.dir = RTL_LANGS.includes(language) ? 'rtl' : 'ltr'
  }, [language])

  const setLanguage = useCallback((lang: Language) => {
    setLang(lang)
    localStorage.setItem('t4s-lang', lang)
  }, [])

  const t = useCallback((key: string) => getTranslation(language)(key), [language])

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
