import { useState, useEffect } from 'react'
import { ArrowLeft, MapPin, Clock, Users, Calendar, Loader2, MessageSquare, Star, Download, UserPlus, XCircle, PartyPopper, Check, Mail } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { ShareButton } from '@/components/ShareButton'
import { StarRating } from '@/components/StarRating'
import { InviteModal } from '@/components/InviteModal'
import { CancelModal } from '@/components/CancelModal'
import { ParticipantCard } from '@/components/ParticipantCard'
import { DinerReviewModal } from '@/components/DinerReviewModal'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { usePendingInvite } from '@/contexts/PendingInviteContext'
import { useTableDetail } from '@/hooks/useTables'
import { useReviews } from '@/hooks/useReviews'
import { useMessages } from '@/hooks/useMessages'
import { useInvitations } from '@/hooks/useInvitations'
import { supabase } from '@/lib/supabase'

interface TableDetailPageProps {
  tableId: string
  paymentSuccess?: boolean
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

export function TableDetailPage({ tableId, paymentSuccess, onNavigate, onAuthClick }: TableDetailPageProps) {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const { table, participants, hostProfile, loading, error, joinTable, cancelTable, refresh } = useTableDetail(tableId)
  const { reviews, submitReview } = useReviews(tableId)
  const { messages, sendMessage } = useMessages(tableId)
  const { sendInvitation } = useInvitations(null)
  const { pendingInvite, clearPendingInvite } = usePendingInvite()
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [showReview, setShowReview] = useState(false)
  const [showDinerReview, setShowDinerReview] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [showCancelTable, setShowCancelTable] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [showAutoInvite, setShowAutoInvite] = useState(false)
  const [autoInvitePaymentCovered, setAutoInvitePaymentCovered] = useState(true)
  const [autoInviteSending, setAutoInviteSending] = useState(false)
  const [autoInviteError, setAutoInviteError] = useState<string | null>(null)
  const [autoInviteSuccess, setAutoInviteSuccess] = useState(false)

  // Si venias de "Comensales" con la intencion de invitar a alguien y aun no tenias mesa,
  // en cuanto confirmas el pago con deposito (redirect de Stripe) ofrecemos enviar la invitacion.
  useEffect(() => {
    if (paymentSuccess && pendingInvite) setShowAutoInvite(true)
  }, [paymentSuccess, pendingInvite])

  const locale = language === 'de' ? 'de-DE' : language === 'en' ? 'en-GB' : 'es-ES'
  const myParticipation = participants.find(p => p.user_id === user?.id)
  const isParticipant = !!myParticipation
  const isHost = table?.host_id === user?.id
  const isFull = table?.status === 'full' || (table?.available_seats ?? 0) <= 0
  const isCancelled = table?.status === 'cancelled'
  const isPast = table ? new Date(`${table.date}T${table.time}`) < new Date() : false
  const canReview = isParticipant && isPast && !isCancelled && !reviews.some(r => (r as any).reviewer_id === user?.id)
  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : null

  const coDiners = [
    ...(hostProfile && hostProfile.id !== user?.id ? [hostProfile] : []),
    ...participants.filter(p => p.profiles && p.user_id !== user?.id).map(p => p.profiles!),
  ]
  const canReviewDiners = (isParticipant || isHost) && isPast && !isCancelled && coDiners.length > 0

  const handleJoinWord = async () => {
    setJoining(true)
    setJoinError(null)
    try {
      await joinTable('word')
      if (pendingInvite) setShowAutoInvite(true)
    } catch (err: any) {
      setJoinError(err.message || 'Error')
    }
    setJoining(false)
  }

  const handleSendAutoInvite = async () => {
    if (!pendingInvite || !table) return
    setAutoInviteSending(true)
    setAutoInviteError(null)
    try {
      await sendInvitation(table.id, pendingInvite.inviteeId, autoInvitePaymentCovered)
      setAutoInviteSuccess(true)
      clearPendingInvite()
    } catch {
      setAutoInviteError('No se ha podido enviar la invitación. Inténtalo de nuevo.')
    }
    setAutoInviteSending(false)
  }

  const handleJoinDeposit = async () => {
    if (!user || !table) return
    setJoining(true)
    setJoinError(null)
    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-checkout', {
        body: { tableId: table.id, userId: user.id },
      })
      if (fnError) throw fnError
      if (data?.url) window.location.href = data.url
    } catch {
      setJoinError('El pago con depósito estará disponible próximamente.')
    }
    setJoining(false)
  }

  const handleCancelReservation = async () => {
    if (!myParticipation) return
    const { error: err } = await supabase.rpc('cancel_reservation', { p_participant_id: myParticipation.id })
    if (err) throw err
    setShowCancel(false)
    await refresh()
  }

  const handleCancelTable = async () => {
    await cancelTable()
    setShowCancelTable(false)
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return
    await sendMessage(chatInput.trim())
    setChatInput('')
  }

  const handleSubmitReview = async () => {
    if (!table || reviewRating === 0) return
    await submitReview({
      table_id: table.id,
      host_id: table.host_id,
      rating: reviewRating,
      comment: reviewComment || undefined,
    })
    setShowReview(false)
    setReviewRating(0)
    setReviewComment('')
  }

  const downloadICS = () => {
    if (!table) return
    const dtStart = `${table.date.replace(/-/g, '')}T${table.time.replace(/:/g, '')}00`
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${dtStart}\nSUMMARY:Dinner at ${table.restaurant_name}\nLOCATION:${table.restaurant_address || table.restaurant_city}\nEND:VEVENT\nEND:VCALENDAR`
    const blob = new Blob([ics], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dinner-${table.restaurant_name.replace(/\s+/g, '-')}.ics`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar currentPage="browse" onNavigate={onNavigate} onAuthClick={onAuthClick} />
        <div className="flex items-center justify-center py-32"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>
      </div>
    )
  }

  if (!table || error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar currentPage="browse" onNavigate={onNavigate} onAuthClick={onAuthClick} />
        <div className="text-center py-20">
          <p className="text-gray-500 dark:text-gray-400">{error || 'Mesa no encontrada'}</p>
          <button onClick={() => onNavigate('browse')} className="mt-4 text-primary-600 font-medium text-sm">{t('create.back')}</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar currentPage="browse" onNavigate={onNavigate} onAuthClick={onAuthClick} />
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-8">
        <button onClick={() => onNavigate('browse')} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" /> {t('create.back')}
        </button>

        {paymentSuccess && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <PartyPopper className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">{t('myTables.paymentSuccess')}</p>
              <p className="text-xs text-green-600">{t('myTables.paymentSuccessDesc')}</p>
            </div>
          </div>
        )}

        {isCancelled && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-red-800">Esta mesa ha sido cancelada por el anfitrión</p>
          </div>
        )}

        {/* Header image */}
        <div className="relative h-56 md:h-72 rounded-2xl overflow-hidden mb-6">
          <img src={table.restaurant_image_url || 'https://images.pexels.com/photos/67468/pexels-photo-67468.jpeg?auto=compress&cs=tinysrgb&w=800'} alt={table.restaurant_name} className="w-full h-full object-cover" />
          <div className="absolute bottom-4 right-4 flex gap-2">
            <ShareButton url={`${window.location.origin}/table/${table.id}`} />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main info */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">{table.restaurant_name}</h1>
                  <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>{table.restaurant_city}, {table.restaurant_country}</span>
                  </div>
                </div>
                {avgRating && (
                  <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1.5 rounded-lg">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-semibold text-sm">{avgRating}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <InfoBox icon={<Calendar className="w-4 h-4" />} label={new Date(table.date).toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })} />
                <InfoBox icon={<Clock className="w-4 h-4" />} label={table.time.slice(0, 5)} />
                <InfoBox icon={<Users className="w-4 h-4" />} label={`${table.available_seats}/${table.max_seats} ${t('card.seats')}`} />
              </div>

              {table.description && <p className="text-gray-600 dark:text-gray-300 text-sm">{table.description}</p>}

              {table.cuisine_type && (
                <span className="inline-block mt-3 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm">{table.cuisine_type}</span>
              )}
            </div>

            {/* Participants */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('card.confirmedDiners')}</h3>
              {participants.length === 0 && !hostProfile ? (
                <p className="text-sm text-gray-400 dark:text-gray-500">{t('card.noDiners')}</p>
              ) : (
                <div>
                  {hostProfile && (
                    <ParticipantCard
                      profile={hostProfile}
                      badge={<span className="text-xs px-2 py-1 rounded-full flex-shrink-0 bg-primary-50 text-primary-600">Anfitrión</span>}
                    />
                  )}
                  {participants.map(p => p.profiles && (
                    <ParticipantCard
                      key={p.id}
                      profile={p.profiles}
                      badge={
                        <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${p.join_type === 'deposit' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                          {p.join_type === 'deposit' ? t('card.depositBadge') : t('card.wordBadge')}
                        </span>
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('review.title')}</h3>
                <div className="space-y-4">
                  {reviews.map(r => (
                    <div key={r.id} className="border-b border-gray-50 dark:border-gray-800 pb-3 last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{(r.profiles as any)?.display_name || 'User'}</span>
                        <StarRating rating={r.rating} readonly size="sm" />
                      </div>
                      {r.comment && <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar actions */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-3">
              {user && !isHost && !isParticipant && !isFull && !isCancelled && !isPast && (
                <>
                  <div className="relative">
                    <button onClick={handleJoinDeposit} disabled={joining} className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors text-sm">
                      {joining ? t('card.redirecting') : t('card.reserveDeposit')}
                    </button>
                    <span className="absolute -top-2 -right-2 text-[10px] font-semibold bg-gray-800 text-white px-2 py-0.5 rounded-full">Próximamente</span>
                  </div>
                  <button onClick={handleJoinWord} disabled={joining} className="w-full py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors text-sm">
                    {joining ? t('card.registering') : t('card.giveWord')}
                  </button>
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center">{t('card.depositNote')}</p>
                  {joinError && <p className="text-xs text-red-600 text-center">{joinError}</p>}
                </>
              )}
              {isParticipant && (
                <div className="text-center py-2 space-y-2">
                  <p className="text-sm font-medium text-green-600">
                    {myParticipation?.join_type === 'deposit' ? t('card.reservedDeposit') : t('card.reservedWord')}
                  </p>
                  {!isPast && (
                    <button onClick={() => setShowCancel(true)} className="text-xs text-red-500 hover:text-red-600 font-medium">
                      {t('card.cancelReservation')}
                    </button>
                  )}
                </div>
              )}
              {isFull && !isParticipant && !isHost && (
                <p className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">{t('card.tableFull')}</p>
              )}

              {isHost && !isCancelled && (
                <>
                  {!isFull && !isPast && (
                    <button onClick={() => setShowInvite(true)} className="w-full py-2.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-sm font-medium hover:bg-blue-100 flex items-center justify-center gap-2">
                      <UserPlus className="w-4 h-4" /> {t('invite.title')}
                    </button>
                  )}
                  {!isPast && (
                    <button onClick={() => setShowCancelTable(true)} className="w-full py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 flex items-center justify-center gap-2">
                      <XCircle className="w-4 h-4" /> {t('myTables.cancel')}
                    </button>
                  )}
                </>
              )}

              <button onClick={downloadICS} className="w-full py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Add to calendar
              </button>

              {(isParticipant || isHost) && (
                <button onClick={() => setShowChat(!showChat)} className="w-full py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" /> {t('chat.title')} ({messages.length})
                </button>
              )}

              {canReview && (
                <button onClick={() => setShowReview(true)} className="w-full py-2.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-xl text-sm font-medium hover:bg-yellow-100">
                  <Star className="w-4 h-4 inline mr-1" /> {t('review.title')}
                </button>
              )}

              {canReviewDiners && (
                <button onClick={() => setShowDinerReview(true)} className="w-full py-2.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-xl text-sm font-medium hover:bg-teal-100">
                  Puntúa a tus comensales
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Chat panel */}
        {showChat && (
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('chat.title')}</h3>
            <div className="max-h-64 overflow-y-auto space-y-3 mb-4">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">{t('chat.noMessages')}</p>
              ) : (
                messages.map(m => (
                  <div key={m.id} className={`flex ${m.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-3 py-2 rounded-xl text-sm ${m.sender_id === user?.id ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'}`}>
                      {m.sender_id !== user?.id && <p className="text-xs font-medium mb-0.5 opacity-70">{(m.profiles as any)?.display_name}</p>}
                      <p>{m.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder={t('chat.placeholder')}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
              <button onClick={handleSendMessage} className="px-4 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-medium hover:bg-primary-600">
                Send
              </button>
            </div>
          </div>
        )}

        {/* Review modal */}
        {showReview && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowReview(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-display font-bold text-gray-900 dark:text-white mb-4">{t('review.title')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('review.dinnerAt')} {table.restaurant_name}</p>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-1">{t('review.overallRating')}</label>
                  <StarRating rating={reviewRating} onChange={setReviewRating} size="lg" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-200 block mb-1">{t('review.comment')}</label>
                  <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder={t('review.commentPlaceholder')} rows={3} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none" />
                </div>
                <button onClick={handleSubmitReview} disabled={reviewRating === 0} className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 disabled:opacity-50">
                  {t('review.submit')}
                </button>
              </div>
            </div>
          </div>
        )}

        {showDinerReview && (
          <DinerReviewModal tableId={table.id} coDiners={coDiners} onClose={() => setShowDinerReview(false)} />
        )}

        {showInvite && <InviteModal tableId={table.id} onClose={() => setShowInvite(false)} />}

        {showCancel && myParticipation && (
          <CancelModal
            joinType={myParticipation.join_type}
            depositAmount={table.deposit_amount}
            onClose={() => setShowCancel(false)}
            onConfirm={handleCancelReservation}
          />
        )}

        {showCancelTable && (
          <CancelModal
            joinType="word"
            onClose={() => setShowCancelTable(false)}
            onConfirm={handleCancelTable}
          />
        )}

        {showAutoInvite && pendingInvite && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowAutoInvite(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
              {autoInviteSuccess ? (
                <div className="text-center py-2">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Check className="w-7 h-7 text-green-600" />
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white mb-1">Invitación enviada</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{pendingInvite.inviteeName} recibirá tu invitación a esta mesa.</p>
                  <button onClick={() => setShowAutoInvite(false)} className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors">
                    Cerrar
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="w-5 h-5 text-primary-500" />
                    <h3 className="text-lg font-display font-bold text-gray-900 dark:text-gray-100">Ya tienes tu mesa</h3>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    ¿Invitas ahora a <strong>{pendingInvite.inviteeName}</strong> a esta cena?
                  </p>

                  <div className="space-y-2 mb-4">
                    <button onClick={() => setAutoInvitePaymentCovered(true)} className={`w-full text-left p-3 rounded-xl border-2 transition-all ${autoInvitePaymentCovered ? 'border-primary-500 bg-primary-50' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500'}`}>
                      <p className={`font-medium text-sm ${autoInvitePaymentCovered ? 'text-primary-700' : 'text-gray-700 dark:text-gray-200'}`}>Yo invito</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Te haces cargo del depósito de {pendingInvite.inviteeName}</p>
                    </button>
                    <button onClick={() => setAutoInvitePaymentCovered(false)} className={`w-full text-left p-3 rounded-xl border-2 transition-all ${!autoInvitePaymentCovered ? 'border-primary-500 bg-primary-50' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500'}`}>
                      <p className={`font-medium text-sm ${!autoInvitePaymentCovered ? 'text-primary-700' : 'text-gray-700 dark:text-gray-200'}`}>Cada uno paga su parte</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{pendingInvite.inviteeName} paga su propio depósito si acepta</p>
                    </button>
                  </div>

                  {autoInviteError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{autoInviteError}</p>}

                  <div className="flex gap-2">
                    <button onClick={() => setShowAutoInvite(false)} className="flex-1 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      Más tarde
                    </button>
                    <button onClick={handleSendAutoInvite} disabled={autoInviteSending} className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors">
                      {autoInviteSending ? 'Enviando...' : 'Enviar invitación'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function InfoBox({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-3 text-center">
      <div className="flex items-center justify-center text-gray-400 dark:text-gray-500 mb-1">{icon}</div>
      <p className="text-sm text-gray-700 dark:text-gray-200 font-medium">{label}</p>
    </div>
  )
}
