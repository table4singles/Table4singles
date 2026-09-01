import { Mail, X } from 'lucide-react'
import { usePendingInvite } from '@/contexts/PendingInviteContext'
import { useLanguage } from '@/contexts/LanguageContext'

/** Aviso persistente mientras el usuario busca una mesa para invitar a alguien
 * (flujo "invitar primero, reservar despues" desde la pestana Comensales). */
export function PendingInviteBanner() {
  const { pendingInvite, clearPendingInvite } = usePendingInvite()
  const { t } = useLanguage()

  if (!pendingInvite) return null

  const [before, after] = t('pendingInvite.searching').split('{name}')

  return (
    <div className="relative z-30 bg-primary-500 text-white shadow-md">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center gap-2 text-sm">
        <Mail className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1">{before}<strong>{pendingInvite.inviteeName}</strong>{after}</span>
        <button onClick={clearPendingInvite} className="p-1 hover:bg-white/20 rounded-full flex-shrink-0" aria-label={t('pendingInvite.cancelAria')}>
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
