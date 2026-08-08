import { useEffect, useState } from 'react'
import { X, Check, Loader2, UtensilsCrossed, CalendarDays } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { usePendingInvite } from '@/contexts/PendingInviteContext'
import { useInvitations } from '@/hooks/useInvitations'
import { useInvitableTables, type InvitableTable } from '@/hooks/useInvitableTables'

interface InviteToTableModalProps {
  inviteeId: string
  inviteeName: string
  onClose: () => void
  onNavigate: (page: string, id?: string) => void
}

function formatTableDate(t: InvitableTable): string {
  const date = new Date(`${t.date}T${t.time || '12:00'}`)
  if (Number.isNaN(date.getTime())) return t.date
  const label = date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })
  return t.time ? `${label} ${t.time.slice(0, 5)}` : label
}

export function InviteToTableModal({ inviteeId, inviteeName, onClose, onNavigate }: InviteToTableModalProps) {
  const { user } = useAuth()
  const { tables, loading } = useInvitableTables(user?.id ?? null)
  const { sendInvitation } = useInvitations(null)
  const { setPendingInvite } = usePendingInvite()
  const [selectedTable, setSelectedTable] = useState<InvitableTable | null>(null)
  const [paymentCovered, setPaymentCovered] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!loading && tables.length === 1) setSelectedTable(tables[0])
  }, [loading, tables])

  const handleSend = async () => {
    if (!selectedTable) return
    setSending(true)
    setError(null)
    try {
      await sendInvitation(selectedTable.id, inviteeId, paymentCovered)
      setSuccess(true)
    } catch {
      setError('No se ha podido enviar la invitación. Inténtalo de nuevo.')
    }
    setSending(false)
  }

  const goToRestaurants = () => {
    setPendingInvite({ inviteeId, inviteeName })
    onClose()
    onNavigate('browse')
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 pb-4">
          <div>
            <h2 className="text-xl font-display font-bold text-gray-900 dark:text-white">Invitar a una cena</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Invita a {inviteeName} a compartir mesa contigo</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-6">
          {success ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-7 h-7 text-green-600" />
              </div>
              <p className="font-medium text-gray-900 dark:text-white mb-1">Invitación enviada</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{inviteeName} recibirá tu invitación y podrá aceptarla o rechazarla.</p>
              <button onClick={onClose} className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors">
                Cerrar
              </button>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
            </div>
          ) : tables.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <UtensilsCrossed className="w-7 h-7 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="font-medium text-gray-900 dark:text-white mb-1">Aún no tienes mesa</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Necesitas tener una mesa reservada con plazas libres para poder invitar a {inviteeName}.
              </p>
              <button onClick={goToRestaurants} className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors">
                Buscar restaurante para invitar
              </button>
            </div>
          ) : !selectedTable ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Elige a qué mesa invitar</p>
              {tables.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTable(t)}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <CalendarDays className="w-4 h-4 text-primary-500 flex-shrink-0" />
                  <span>
                    <span className="font-medium text-gray-900 dark:text-white">{t.restaurant_name}</span>
                    <span className="text-gray-400 dark:text-gray-500 ml-1.5">{formatTableDate(t)}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 mb-4 text-sm">
                <p className="font-medium text-gray-900 dark:text-white">{selectedTable.restaurant_name}</p>
                <p className="text-gray-500 dark:text-gray-400">{formatTableDate(selectedTable)}</p>
                {tables.length > 1 && (
                  <button onClick={() => setSelectedTable(null)} className="text-xs text-primary-600 font-medium mt-1">Cambiar mesa</button>
                )}
              </div>

              <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Tipo de invitación</p>
              <div className="space-y-2 mb-4">
                <button onClick={() => setPaymentCovered(true)} className={`w-full text-left p-3 rounded-xl border-2 transition-all ${paymentCovered ? 'border-primary-500 bg-primary-50' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500'}`}>
                  <p className={`font-medium text-sm ${paymentCovered ? 'text-primary-700' : 'text-gray-700 dark:text-gray-200'}`}>Yo invito</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Te haces cargo del depósito de {inviteeName}</p>
                </button>
                <button onClick={() => setPaymentCovered(false)} className={`w-full text-left p-3 rounded-xl border-2 transition-all ${!paymentCovered ? 'border-primary-500 bg-primary-50' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500'}`}>
                  <p className={`font-medium text-sm ${!paymentCovered ? 'text-primary-700' : 'text-gray-700 dark:text-gray-200'}`}>Cada uno paga su parte</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{inviteeName} paga su propio depósito si acepta</p>
                </button>
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>}

              <button
                onClick={handleSend}
                disabled={sending}
                className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors"
              >
                {sending ? 'Enviando...' : 'Enviar invitación'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
