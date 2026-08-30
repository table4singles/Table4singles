import { Mail, X } from 'lucide-react'
import { usePendingInvite } from '@/contexts/PendingInviteContext'

/** Aviso persistente mientras el usuario busca una mesa para invitar a alguien
 * (flujo "invitar primero, reservar despues" desde la pestana Comensales). */
export function PendingInviteBanner() {
  const { pendingInvite, clearPendingInvite } = usePendingInvite()

  if (!pendingInvite) return null

  return (
    <div className="relative z-30 bg-primary-500 text-white shadow-md">
      <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center gap-2 text-sm">
        <Mail className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1">Buscando mesa para invitar a <strong>{pendingInvite.inviteeName}</strong></span>
        <button onClick={clearPendingInvite} className="p-1 hover:bg-white/20 rounded-full flex-shrink-0" aria-label="Cancelar invitación pendiente">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
