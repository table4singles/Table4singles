import { useState, useRef, useEffect } from 'react'
import { Share2, X, Copy, Check } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface ShareButtonProps {
  url: string
}

export function ShareButton({ url }: ShareButtonProps) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const shareWhatsApp = () => {
    const text = `${t('share.waText')} ${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
    setOpen(false)
  }

  const shareTwitter = () => {
    const text = t('share.tweetText')
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank', 'noopener')
    setOpen(false)
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => { setCopied(false); setOpen(false) }, 1500)
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all">
        <Share2 className="w-4 h-4" /> {t('share.title')}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 w-56 animate-fade-in">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="font-medium text-sm text-gray-900 dark:text-white">{t('share.title')}</span>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg"><X className="w-4 h-4" /></button>
            </div>
            <button onClick={shareWhatsApp} className="w-full px-4 py-3 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
              <span className="text-lg">💬</span> {t('share.whatsapp')}
            </button>
            <button onClick={shareTwitter} className="w-full px-4 py-3 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
              <span className="text-lg">🐦</span> {t('share.twitter')}
            </button>
            <button onClick={copyLink} className="w-full px-4 py-3 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 border-t border-gray-100 dark:border-gray-700">
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? t('share.copied') : t('share.copy')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
