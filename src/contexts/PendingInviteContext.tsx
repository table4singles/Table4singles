import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

const STORAGE_KEY = 't4s_pending_invite'

export interface PendingInvite {
  inviteeId: string
  inviteeName: string
}

interface PendingInviteContextType {
  pendingInvite: PendingInvite | null
  setPendingInvite: (invite: PendingInvite) => void
  clearPendingInvite: () => void
}

const PendingInviteContext = createContext<PendingInviteContextType | null>(null)

function readStored(): PendingInvite | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

/** Recuerda a quien se quiere invitar mientras el usuario busca una mesa, para poder
 * enviar la invitacion automaticamente en cuanto reserve (flujo "invitar primero, reservar despues"). */
export function PendingInviteProvider({ children }: { children: ReactNode }) {
  const [pendingInvite, setPendingInviteState] = useState<PendingInvite | null>(() => readStored())

  useEffect(() => {
    if (pendingInvite) localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingInvite))
    else localStorage.removeItem(STORAGE_KEY)
  }, [pendingInvite])

  const setPendingInvite = (invite: PendingInvite) => setPendingInviteState(invite)
  const clearPendingInvite = () => setPendingInviteState(null)

  return (
    <PendingInviteContext.Provider value={{ pendingInvite, setPendingInvite, clearPendingInvite }}>
      {children}
    </PendingInviteContext.Provider>
  )
}

export function usePendingInvite() {
  const ctx = useContext(PendingInviteContext)
  if (!ctx) throw new Error('usePendingInvite must be used within PendingInviteProvider')
  return ctx
}
