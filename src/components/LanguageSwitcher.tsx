import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { languageOptions } from '@/i18n'

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = languageOptions.find(l => l.code === language)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-lg" title={current?.label}>
        <span className="text-xl leading-none">{current?.emoji}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50 min-w-[160px] animate-fade-in max-h-72 overflow-y-auto">
          {languageOptions.map(l => (
            <button
              key={l.code}
              onClick={() => { setLanguage(l.code); setOpen(false) }}
              className={`w-full px-4 py-2.5 flex items-center gap-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${l.code === language ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-medium' : 'text-gray-700 dark:text-gray-200'}`}
            >
              <span className="text-lg">{l.emoji}</span>
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
