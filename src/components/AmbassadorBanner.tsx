import { useState } from 'react'
import { Award, X, ChevronRight } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

const STORAGE_KEY = 't4s_ambassador_banner_dismissed'

interface Props {
  onNavigate: (page: string) => void
}

export function AmbassadorBanner({ onNavigate }: Props) {
  const { t } = useLanguage()
  const [visible, setVisible] = useState(() => {
    try { return localStorage.getItem(STORAGE_KEY) !== 'true' } catch { return true }
  })

  if (!visible) return null

  const handleDismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, 'true') } catch { /* noop */ }
    setVisible(false)
  }

  return (
    <div className="fixed top-16 inset-x-0 z-40 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center gap-3 text-sm">
        <Award className="w-4 h-4 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="font-semibold">{t('ambassadorBanner.title')}</span>
          <span className="hidden sm:inline text-white/80 ml-2">{t('ambassadorBanner.desc')}</span>
        </div>
        <button
          onClick={() => { onNavigate('ambassador'); handleDismiss() }}
          className="flex items-center gap-1 text-xs font-semibold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors flex-shrink-0 whitespace-nowrap"
        >
          {t('ambassadorBanner.cta')} <ChevronRight className="w-3 h-3" />
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-white/20 rounded-full flex-shrink-0"
          aria-label={t('ambassadorBanner.dismiss')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
