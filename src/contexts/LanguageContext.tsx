import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { getTranslation, type Language } from '@/i18n'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('t4s-lang')
    if (saved && ['es', 'en', 'de'].includes(saved)) return saved as Language
    const browser = navigator.language.split('-')[0]
    if (['es', 'en', 'de'].includes(browser)) return browser as Language
    return 'es'
  })

  const setLanguage = useCallback((lang: Language) => {
    setLang(lang)
    localStorage.setItem('t4s-lang', lang)
    document.documentElement.lang = lang
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
