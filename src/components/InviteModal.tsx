import { useState } from 'react'
import { X, Search, Loader2, Check } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useInvitations } from '@/hooks/useInvitations'
import type { Profile } from '@/types/database'

interface InviteModalProps {
  tableId: string
  onClose: () => void
}

export function InviteModal({ tableId, onClose }: InviteModalProps) {
  const { t } = useLanguage()
  const { searchUsers, sendInvitation } = useInvitations(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<Profile | null>(null)
  const [paymentCovered, setPaymentCovered] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSearch = async (value: string) => {
    setQuery(value)
    setError(null)
    if (value.trim().length < 2) {
      setResults([])
      return
    }
    setSearching(true)
    try {
      const users = await searchUsers(value)
      setResults(users)
    } catch {
      setError(t('invite.errorSearch'))
    }
    setSearching(false)
  }

  const handleSend = async () => {
    if (!selected) return
    setSending(true)
    setError(null)
    try {
      await sendInvitation(tableId, selected.id, paymentCovered)
      setSuccess(true)
    } catch {
      setError(t('invite.errorSend'))
    }
    setSending(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 pb-4">
          <div>
            <h2 className="text-xl font-display font-bold text-gray-900">{t('invite.title')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('invite.subtitle')}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-6">
          {success ? (
            <div className="text-center py-6">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-7 h-7 text-green-600" />
              </div>
              <p className="font-medium text-gray-900 mb-1">{t('invite.success')}</p>
              <p className="text-sm text-gray-500 mb-4">{t('invite.successDesc')}</p>
              <p className="text-xs text-gray-400 mb-4">
                {paymentCovered ? t('invite.successBillIncluded') : t('invite.successDepositRequired')}
              </p>
              <button onClick={onClose} className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors">
                {t('invite.close')}
              </button>
            </div>
          ) : (
            <>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={query}
                  onChange={e => handleSearch(e.target.value)}
                  placeholder={t('invite.searchPlaceholder')}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>

              {searching && <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 text-primary-500 animate-spin" /></div>}

              {!searching && results.length > 0 && (
                <div className="space-y-1 mb-4 max-h-48 overflow-y-auto">
                  {results.map(u => (
                    <button
                      key={u.id}
                      onClick={() => setSelected(u)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-colors flex items-center justify-between ${selected?.id === u.id ? 'bg-primary-50 border border-primary-300' : 'hover:bg-gray-50 border border-transparent'}`}
                    >
                      <span>
                        <span className="font-medium text-gray-900">{u.display_name || 'Usuario'}</span>
                        {u.email && <span className="text-gray-400 ml-1.5">{u.email}</span>}
                      </span>
                      {selected?.id === u.id && <Check className="w-4 h-4 text-primary-600" />}
                    </button>
                  ))}
                </div>
              )}

              {selected && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">{t('invite.type')}</p>
                  <div className="space-y-2">
                    <button onClick={() => setPaymentCovered(true)} className={`w-full text-left p-3 rounded-xl border-2 transition-all ${paymentCovered ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <p className={`font-medium text-sm ${paymentCovered ? 'text-primary-700' : 'text-gray-700'}`}>{t('invite.iInvite')}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{t('invite.iInviteDesc')}</p>
                    </button>
                    <button onClick={() => setPaymentCovered(false)} className={`w-full text-left p-3 rounded-xl border-2 transition-all ${!paymentCovered ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <p className={`font-medium text-sm ${!paymentCovered ? 'text-primary-700' : 'text-gray-700'}`}>{t('invite.splitPay')}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{t('invite.splitPayDesc')}</p>
                    </button>
                  </div>
                </div>
              )}

              {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{error}</p>}

              <button
                onClick={handleSend}
                disabled={!selected || sending}
                className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors"
              >
                {sending ? t('invite.sending') : t('invite.send')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
