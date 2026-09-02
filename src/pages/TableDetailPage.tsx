import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, MapPin, Clock, Users, Calendar, Loader2, MessageSquare, Star, Download, UserPlus, XCircle, PartyPopper, Check, Mail, Pencil, Save, UserMinus, BellRing, Sparkles } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { ShareButton } from '@/components/ShareButton'
import { StarRating } from '@/components/StarRating'
import { InviteModal } from '@/components/InviteModal'
import { CancelModal } from '@/components/CancelModal'
import { ParticipantCard } from '@/components/ParticipantCard'
import { PostDinnerReviewModal } from '@/components/PostDinnerReviewModal'
import { Avatar } from '@/components/Avatar'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { useViewMode } from '@/contexts/ViewModeContext'
import { usePendingInvite } from '@/contexts/PendingInviteContext'
import { useTableDetail, useTables } from '@/hooks/useTables'
import { TableCard } from '@/components/TableCard'
import { useReviews } from '@/hooks/useReviews'
import { useMessages } from '@/hooks/useMessages'
import { useInvitations } from '@/hooks/useInvitations'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useWaitlist } from '@/hooks/useWaitlist'
import { supabase } from '@/lib/supabase'
import { restaurantPublicLocation } from '@/lib/privacy'
import { resolveDateLocale } from '@/lib/dateLocale'

interface TableDetailPageProps {
  tableId: string
  paymentSuccess?: boolean
  paymentCancelled?: boolean
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

export function TableDetailPage({ tableId, paymentSuccess, paymentCancelled, onNavigate, onAuthClick }: TableDetailPageProps) {
  const { t, language } = useLanguage()
  const { user, profile } = useAuth()
  const { effectiveRole } = useViewMode()
  const isRestaurantUser = effectiveRole === 'restaurant'
  const { table, participants, hostProfile, loading, error, joinTable, cancelTable, refresh } = useTableDetail(tableId)
  const tablePrice = table?.is_special && table.deposit_amount ? Number(table.deposit_amount) : 2
  const { reviews, submitReview } = useReviews(tableId)
  const { messages, sendMessage } = useMessages(tableId)
  const { sendInvitation } = useInvitations(null)
  const { track } = useAnalytics()
  const { entry: waitlistEntry, join: joinWaitlist, leave: leaveWaitlist } = useWaitlist(tableId, user?.id ?? null)
  const [waitlistBusy, setWaitlistBusy] = useState(false)
  const { pendingInvite, clearPendingInvite } = usePendingInvite()
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [showPostDinnerReview, setShowPostDinnerReview] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [showCancel, setShowCancel] = useState(false)
  const [showCancelTable, setShowCancelTable] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [showAutoInvite, setShowAutoInvite] = useState(false)
  const [autoInvitePaymentCovered, setAutoInvitePaymentCovered] = useState(true)
  const [autoInviteSending, setAutoInviteSending] = useState(false)
  const [autoInviteError, setAutoInviteError] = useState<string | null>(null)
  const [autoInviteSuccess, setAutoInviteSuccess] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [editMaxSeats, setEditMaxSeats] = useState(0)
  const [editZone, setEditZone] = useState('')
  const [editIsSpecial, setEditIsSpecial] = useState(false)
  const [editGuestName, setEditGuestName] = useState('')
  const [editGuestBio, setEditGuestBio] = useState('')
  const [editGuestPhotoUrl, setEditGuestPhotoUrl] = useState('')
  const [editGuestPrice, setEditGuestPrice] = useState('2')
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [removingParticipantId, setRemovingParticipantId] = useState<string | null>(null)

  const trackedView = useRef(false)
  useEffect(() => {
    if (!table || trackedView.current) return
    trackedView.current = true
    track('TABLE_VIEW', { table_id: table.id, restaurant_city: table.restaurant_city, cuisine_type: table.cuisine_type })
  }, [table, track])

  // Cuando el usuario vuelve del pago: reconciliar (por si el webhook falló) y refrescar.
  const refreshedAfterPayment = useRef(false)
  useEffect(() => {
    if (!paymentSuccess || refreshedAfterPayment.current || !user || !tableId) return
    refreshedAfterPayment.current = true

    const run = async () => {
      try {
        await supabase.functions.invoke('reconcile-reservation', {
          body: { tableId },
        })
      } catch (err) {
        console.warn('reconcile-reservation:', err)
      }
      track('RESERVATION_COMPLETED', { table_id: tableId })
      await refresh()
      // Por si el webhook llega un poco más tarde
      setTimeout(() => refresh(), 2000)
      setTimeout(() => refresh(), 5000)
    }
    run()
  }, [paymentSuccess, user, tableId, refresh, track])

  // Si venias de "Comensales" con la intencion de invitar a alguien y aun no tenias mesa,
  // en cuanto confirmas el pago con deposito (redirect de Stripe) ofrecemos enviar la invitacion.
  useEffect(() => {
    if (paymentSuccess && pendingInvite) setShowAutoInvite(true)
  }, [paymentSuccess, pendingInvite])

  const locale = resolveDateLocale(language)
  const myParticipation = participants.find(p => p.user_id === user?.id)
  const isParticipant = !!myParticipation
  const isHost = table?.host_id === user?.id
  const isFull = table?.status === 'full' || (table?.available_seats ?? 0) <= 0
  const isCancelled = table?.status === 'cancelled'
  const isPast = table
    ? (table.available_until
        ? new Date(`${table.available_until}T23:59:59`) < new Date()
        : table.time
          ? new Date(`${table.date}T${table.time}`) < new Date()
          : false)
    : false
  const canReview = isParticipant && isPast && !isCancelled && !reviews.some(r => (r as any).reviewer_id === user?.id)
  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : null

  const coDiners = [
    ...(hostProfile && hostProfile.id !== user?.id ? [hostProfile] : []),
    ...participants.filter(p => p.profiles && p.user_id !== user?.id).map(p => p.profiles!),
  ]
  const canReviewDiners = (isParticipant || isHost) && isPast && !isCancelled && coDiners.length > 0

  const myInterests = profile?.interests ?? []
  const sharedInterests = myInterests.filter(i => coDiners.some(d => (d.interests ?? []).includes(i)))

  const handleJoinWord = async () => {
    setJoining(true)
    setJoinError(null)
    track('RESERVATION_STARTED', { table_id: tableId, join_type: 'word' })
    try {
      await joinTable('word')
      if (pendingInvite) setShowAutoInvite(true)
    } catch (err: any) {
      const msg = err.message || ''
      setJoinError(
        msg.includes('No seats available') ? 'No quedan plazas en esta mesa.'
          : msg.includes('Already joined') ? 'Ya tienes una plaza en esta mesa.'
          : msg.includes('not open') || msg.includes('Not open') ? 'Esta mesa no está disponible.'
          : msg || 'No se ha podido reservar la plaza. Inténtalo de nuevo.'
      )
    }
    setJoining(false)
  }

  const handleSendAutoInvite = async () => {
    if (!pendingInvite || !table) return
    setAutoInviteSending(true)
    setAutoInviteError(null)
    try {
      await sendInvitation(table.id, pendingInvite.inviteeId, autoInvitePaymentCovered)
      track('INVITATION_CREATED', { table_id: table.id, source: 'post_reservation' })
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
    track('RESERVATION_STARTED', { table_id: table.id, join_type: 'deposit' })
    try {
      const { data, error: fnError } = await supabase.functions.invoke('create-reservation-checkout', {
        body: { tableId: table.id },
      })
      if (fnError) throw fnError
      if (data?.url) {
        window.location.href = data.url
      } else {
        throw new Error(data?.error || 'No se recibió la URL de pago')
      }
    } catch (err: any) {
      setJoinError(err.message || 'Error al procesar el pago. Inténtalo de nuevo.')
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

  const openEdit = () => {
    if (!table) return
    setEditDate(table.date)
    setEditTime(table.time ? table.time.slice(0, 5) : '')
    setEditMaxSeats(table.max_seats)
    setEditZone(table.description || '')
    setEditIsSpecial(table.is_special)
    setEditGuestName(table.special_guest_name || '')
    setEditGuestBio(table.special_guest_bio || '')
    setEditGuestPhotoUrl(table.special_guest_photo_url || '')
    setEditGuestPrice(table.is_special && table.deposit_amount ? String(table.deposit_amount) : '2')
    setEditError(null)
    setShowEdit(true)
  }

  const handleSaveEdit = async () => {
    if (!table) return
    const occupied = table.max_seats - table.available_seats
    if (editMaxSeats < occupied) {
      setEditError(t('tableDetail.editMaxSeatsError').replace('{count}', String(occupied)))
      return
    }
    setEditSaving(true)
    setEditError(null)
    const { error: err } = await supabase
      .from('dining_tables')
      .update({
        date: editDate,
        time: editTime,
        max_seats: editMaxSeats,
        available_seats: editMaxSeats - occupied,
        description: editZone || null,
        is_special: editIsSpecial,
        special_guest_name: editIsSpecial ? editGuestName.trim() || null : null,
        special_guest_bio: editIsSpecial ? editGuestBio.trim() || null : null,
        special_guest_photo_url: editIsSpecial ? editGuestPhotoUrl.trim() || null : null,
        deposit_amount: editIsSpecial ? Number(editGuestPrice) || 2 : 2,
      })
      .eq('id', table.id)
    if (err) {
      setEditError(err.message)
    } else {
      setShowEdit(false)
      await refresh()
    }
    setEditSaving(false)
  }

  const handleRemoveParticipant = async (participantId: string) => {
    setRemovingParticipantId(participantId)
    try {
      const { error: err } = await supabase.rpc('remove_participant', { p_participant_id: participantId })
      if (err) throw err
      await refresh()
    } finally {
      setRemovingParticipantId(null)
    }
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return
    await sendMessage(chatInput.trim())
    setChatInput('')
  }

  const handleSubmitRestaurantReview = async (rating: number, comment: string) => {
    if (!table) return
    await submitReview({
      table_id: table.id,
      host_id: table.host_id,
      rating,
      comment: comment || undefined,
    })
  }

  const downloadICS = () => {
    if (!table) return
    const timePart = (table.time || '20:00').replace(/:/g, '')
    const dtStart = `${table.date.replace(/-/g, '')}T${timePart}00`
    const location = table.restaurant_address || table.restaurant_city
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nDTSTART:${dtStart}\nSUMMARY:Dinner at ${table.restaurant_name}\nLOCATION:${location}\nEND:VEVENT\nEND:VCALENDAR`
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
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 lg:pb-8">
        <button onClick={() => onNavigate('browse')} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4 text-sm">
          <ArrowLeft className="w-4 h-4" /> {t('create.back')}
        </button>

        {paymentCancelled && (
          <div className="flex items-center gap-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 mb-4">
            <XCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-orange-800 dark:text-orange-300">Pago no completado</p>
              <p className="text-xs text-orange-600 dark:text-orange-400">Has cancelado el proceso de pago. Tu plaza no está reservada. Puedes intentarlo de nuevo cuando quieras.</p>
            </div>
          </div>
        )}

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
            <ShareButton url={`${window.location.origin}/?invite=${table.id}`} />
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
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span>{restaurantPublicLocation(table) || `${table.restaurant_city}, ${table.restaurant_country}`}</span>
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
                {table.time && <InfoBox icon={<Clock className="w-4 h-4" />} label={table.time.slice(0, 5)} />}
                <InfoBox icon={<Users className="w-4 h-4" />} label={`${table.max_seats - table.available_seats}/${table.max_seats} ${t('tableDetail.seatsInfo')}`} />
              </div>

              {table.description && <p className="text-gray-600 dark:text-gray-300 text-sm">{table.description}</p>}

              {table.cuisine_type && (
                <span className="inline-block mt-3 px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm">{table.cuisine_type}</span>
              )}
            </div>

            {/* Invitado especial */}
            {table.is_special && (
              <div className="bg-gradient-to-br from-[#129a93]/10 to-gold-400/10 dark:from-[#129a93]/20 dark:to-gold-400/10 rounded-2xl border border-[#129a93]/20 p-6">
                <div className="flex items-center gap-1.5 mb-3 text-[#129a93]">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wide">{t('specialGuest.detailTitle')}</span>
                </div>
                <div className="flex items-start gap-4">
                  {table.special_guest_photo_url && (
                    <img src={table.special_guest_photo_url} alt={table.special_guest_name ?? ''} className="w-16 h-16 rounded-full object-cover flex-shrink-0 border-2 border-white dark:border-gray-800 shadow-sm" />
                  )}
                  <div className="min-w-0">
                    {table.special_guest_name && <p className="font-display font-bold text-lg text-gray-900 dark:text-white">{table.special_guest_name}</p>}
                    {table.special_guest_bio && <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">{table.special_guest_bio}</p>}
                  </div>
                </div>
              </div>
            )}

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
                      badge={<span className="text-xs px-2 py-1 rounded-full flex-shrink-0 bg-primary-50 text-primary-600">{t('tableDetail.hostLabel')}</span>}
                    />
                  )}
                  {participants.map(p => p.profiles && (
                    <div key={p.id} className="relative group">
                      <ParticipantCard
                        profile={p.profiles}
                        badge={null}
                      />
                      {isHost && !isPast && !isCancelled && (
                        <button
                          onClick={() => handleRemoveParticipant(p.id)}
                          disabled={removingParticipantId === p.id}
                          className="absolute top-3 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                          title="Eliminar comensal"
                        >
                          {removingParticipantId === p.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <UserMinus className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Shared interests */}
            {sharedInterests.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  {sharedInterests.length === 1 ? t('tableDetail.sharedInterestSingular') : t('tableDetail.sharedInterestPlural').replace('{count}', String(sharedInterests.length))}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {sharedInterests.map(i => (
                    <span key={i} className="px-3 py-1.5 bg-primary-50 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400 rounded-full text-sm font-medium">
                      {i}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{t('review.title')}</h3>
                  {avgRating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{avgRating}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {reviews.map(r => {
                    const reviewProfile = (r as any).profiles
                    const reply = (r as any).review_replies?.[0]
                    return (
                      <div key={r.id} className="border-b border-gray-50 dark:border-gray-800 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden">
                            <Avatar src={reviewProfile?.avatar_url} name={reviewProfile?.display_name} className="w-full h-full" textClassName="text-xs" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{reviewProfile?.display_name || 'Usuario'}</span>
                              <StarRating rating={r.rating} readonly size="sm" />
                            </div>
                            {r.comment && <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">{r.comment}</p>}
                          </div>
                        </div>
                        {reply && (
                          <div className="mt-2 ml-10 pl-3 border-l-2 border-primary-200 dark:border-primary-800">
                            <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-0.5">Respuesta del restaurante</p>
                            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{reply.reply}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Ready for another dinner? */}
            {isPast && !isCancelled && (isParticipant || isHost) && table && (
              <RecommendedDinners
                excludeTableId={table.id}
                city={table.restaurant_city}
                cuisine={table.cuisine_type}
                time={table.time}
                myInterests={myInterests}
                onNavigate={onNavigate}
              />
            )}
          </div>

          {/* Sidebar actions */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-3">
              {!user && !isFull && !isCancelled && !isPast && table?.is_active !== false && (
              <button onClick={() => onAuthClick('signin')} className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors text-sm">
                {t('tableDetail.loginToReserve')}
              </button>
              )}
              {user && !isHost && !isParticipant && !isFull && !isCancelled && !isPast && table?.is_active !== false && !isRestaurantUser && (
                <>
                  <button onClick={handleJoinDeposit} disabled={joining} className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 disabled:opacity-50 transition-colors text-sm flex items-center justify-center gap-1.5">
                    {joining ? t('card.redirecting') : t('tableDetail.reservePrice').replace('{price}', String(tablePrice))}
                  </button>
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center">{t('tableDetail.guaranteedSpot')}</p>
                  {joinError && <p className="text-xs text-red-600 text-center">{joinError}</p>}
                </>
              )}
              {user && !isHost && !isParticipant && table?.is_active === false && (
                <p className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 py-2">Esta mesa no está disponible ahora</p>
              )}
              {isParticipant && (
                <div className="text-center py-2 space-y-2">
                  <p className="text-sm font-medium text-green-600">{t('tableDetail.spotReserved')}</p>
                  {!isPast && (
                    <button onClick={() => setShowCancel(true)} className="text-xs text-red-500 hover:text-red-600 font-medium">
                      {t('card.cancelReservation')}
                    </button>
                  )}
                </div>
              )}
              {isFull && !isParticipant && !isHost && !isCancelled && !isPast && (
                <div className="text-center py-2">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">{t('card.tableFull')}</p>
                  {!user ? (
                    <button onClick={() => onAuthClick('signin')} className="w-full py-2.5 bg-primary-50 text-primary-700 border border-primary-200 rounded-xl text-sm font-medium hover:bg-primary-100 flex items-center justify-center gap-2">
                      <BellRing className="w-4 h-4" /> {t('waitlist.join')}
                    </button>
                  ) : waitlistEntry ? (
                    <div className="flex items-center justify-center gap-2 text-sm text-primary-600 dark:text-primary-400 font-medium">
                      <Check className="w-4 h-4" />
                      {waitlistEntry.status === 'notified' ? t('waitlist.notified') : t('waitlist.joined')}
                      <button
                        onClick={async () => { setWaitlistBusy(true); try { await leaveWaitlist() } finally { setWaitlistBusy(false) } }}
                        disabled={waitlistBusy}
                        className="text-gray-400 hover:text-red-500 underline text-xs disabled:opacity-50 ml-1"
                      >
                        {t('waitlist.leave')}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={async () => { setWaitlistBusy(true); try { await joinWaitlist() } finally { setWaitlistBusy(false) } }}
                      disabled={waitlistBusy}
                      className="w-full py-2.5 bg-primary-50 text-primary-700 border border-primary-200 rounded-xl text-sm font-medium hover:bg-primary-100 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {waitlistBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <BellRing className="w-4 h-4" />} {t('waitlist.join')}
                    </button>
                  )}
                </div>
              )}

              {isHost && !isCancelled && (
                <>
                  {!isPast && (
                    <button onClick={openEdit} className="w-full py-2.5 bg-[#129a93] text-white rounded-xl text-sm font-medium hover:bg-[#0b7f79] flex items-center justify-center gap-2">
                      <Pencil className="w-4 h-4" /> Editar mesa
                    </button>
                  )}
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

              {isParticipant && !isHost && !isCancelled && !isFull && !isPast && (
                <button onClick={() => setShowInvite(true)} className="w-full py-2.5 bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/30 rounded-xl text-sm font-medium hover:bg-[#25D366]/20 flex items-center justify-center gap-2">
                  <UserPlus className="w-4 h-4" /> {t('invite.title')}
                </button>
              )}

              {!isRestaurantUser && (
                <button onClick={downloadICS} className="w-full py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" /> Añadir al calendario
                </button>
              )}

              {(isParticipant || isHost) && (
                <button onClick={() => setShowChat(!showChat)} className="w-full py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  {isRestaurantUser ? `Mensajes a comensales (${messages.length})` : `${t('chat.title')} (${messages.length})`}
                </button>
              )}

              {(canReview || canReviewDiners) && (
                <button
                  onClick={() => setShowPostDinnerReview(true)}
                  className="w-full py-2.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800 rounded-xl text-sm font-medium hover:bg-yellow-100 dark:hover:bg-yellow-900/30 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Star className="w-4 h-4" /> Valorar experiencia
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

        {showPostDinnerReview && (
          <PostDinnerReviewModal
            tableId={table.id}
            restaurantName={table.restaurant_name}
            hostId={table.host_id}
            coDiners={coDiners}
            alreadyReviewedRestaurant={!canReview}
            isHostOnly={!canReview && canReviewDiners}
            onSubmitRestaurant={handleSubmitRestaurantReview}
            onClose={() => setShowPostDinnerReview(false)}
          />
        )}

        {showInvite && <InviteModal tableId={table.id} onClose={() => setShowInvite(false)} />}

        {showCancel && myParticipation && (
          <CancelModal
            joinType="deposit"
            depositAmount={tablePrice}
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

        {/* Edit table modal */}
        {showEdit && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowEdit(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-display font-bold text-gray-900 dark:text-white mb-5">{t('tableDetail.editTitle')}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{t('tableDetail.date')}</label>
                  <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#129a93] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{t('tableDetail.time')}</label>
                  <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#129a93] outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{t('tableDetail.editMaxSeatsLabel')}</label>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setEditMaxSeats(v => Math.max(1, v - 1))} className="w-10 h-10 rounded-xl border border-gray-300 dark:border-gray-600 flex items-center justify-center text-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700">−</button>
                    <span className="text-xl font-bold text-gray-900 dark:text-white w-8 text-center">{editMaxSeats}</span>
                    <button type="button" onClick={() => setEditMaxSeats(v => Math.min(20, v + 1))} className="w-10 h-10 rounded-xl border border-gray-300 dark:border-gray-600 flex items-center justify-center text-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700">+</button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">{t('tableDetail.editZoneLabel')}</label>
                  <div className="flex flex-wrap gap-2">
                    {(['salon', 'vip', 'terraza'] as const).map(z => {
                      const label = t(`createTable.zone.${z}`)
                      return (
                        <button key={z} type="button" onClick={() => setEditZone(label)} className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${editZone === label ? 'bg-[#129a93] text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'}`}>{label}</button>
                      )
                    })}
                  </div>
                  <input value={editZone} onChange={e => setEditZone(e.target.value)} placeholder={t('tableDetail.editZonePlaceholder')} className="mt-2 w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#129a93] outline-none" />
                </div>

                {/* Invitado especial */}
                <div>
                  <button
                    type="button"
                    onClick={() => setEditIsSpecial(v => !v)}
                    className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl border text-left transition-colors ${
                      editIsSpecial ? 'border-[#129a93] bg-[#129a93]/5' : 'border-gray-200 dark:border-gray-600 hover:border-[#129a93]/50'
                    }`}
                  >
                    <span className={`flex-1 text-sm font-medium ${editIsSpecial ? 'text-[#129a93]' : 'text-gray-700 dark:text-gray-200'}`}>{t('specialGuest.toggleLabel')}</span>
                    <span className={`w-10 h-6 rounded-full flex-shrink-0 relative transition-colors ${editIsSpecial ? 'bg-[#129a93]' : 'bg-gray-200 dark:bg-gray-600'}`}>
                      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${editIsSpecial ? 'left-[18px]' : 'left-0.5'}`} />
                    </span>
                  </button>
                  {editIsSpecial && (
                    <div className="mt-3 space-y-3">
                      <input
                        type="text"
                        value={editGuestName}
                        onChange={e => setEditGuestName(e.target.value)}
                        placeholder={t('specialGuest.namePlaceholder')}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#129a93] outline-none"
                      />
                      <textarea
                        value={editGuestBio}
                        onChange={e => setEditGuestBio(e.target.value)}
                        rows={2}
                        placeholder={t('specialGuest.bioPlaceholder')}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#129a93] outline-none resize-none"
                      />
                      <input
                        type="url"
                        value={editGuestPhotoUrl}
                        onChange={e => setEditGuestPhotoUrl(e.target.value)}
                        placeholder={t('specialGuest.photoPlaceholder')}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#129a93] outline-none"
                      />
                      <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t('specialGuest.priceLabel')}</label>
                        <input
                          type="number"
                          min="1"
                          step="0.5"
                          value={editGuestPrice}
                          onChange={e => setEditGuestPrice(e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#129a93] outline-none"
                        />
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('specialGuest.priceHint')}</p>
                      </div>
                    </div>
                  )}
                </div>

                {editError && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{editError}</p>}
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowEdit(false)} className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700">{t('common.cancel')}</button>
                <button onClick={handleSaveEdit} disabled={editSaving} className="flex-1 py-2.5 bg-[#129a93] text-white rounded-xl text-sm font-semibold hover:bg-[#0b7f79] disabled:opacity-50 flex items-center justify-center gap-2">
                  {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {t('common.save')}
                </button>
              </div>
            </div>
          </div>
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

function timeSlotOf(time: string | null): 'midday' | 'evening' | null {
  if (!time) return null
  const h = parseInt(time.slice(0, 2))
  if (h >= 12 && h < 17) return 'midday'
  if (h >= 17) return 'evening'
  return null
}

/** "¿Listo para otra cena?" — recomendación puntuada (no solo mismo cuisine/ciudad):
 * mismo cuisine, mismo franja horaria habitual, e intereses en común con quien YA
 * está apuntado a la mesa candidata (señal real de "gente parecida a ti"), para
 * cerrar el ciclo post-cena con una siguiente reserva relevante. */
function RecommendedDinners({ excludeTableId, city, cuisine, time, myInterests, onNavigate }: {
  excludeTableId: string
  city: string
  cuisine: string | null
  time: string | null
  myInterests: string[]
  onNavigate: (page: string, id?: string) => void
}) {
  const { t } = useLanguage()
  const { tables: candidates } = useTables({ city, withParticipants: true })
  const slot = timeSlotOf(time)

  const scored = candidates
    .filter(tb => tb.id !== excludeTableId)
    .map(tb => {
      let score = 0
      let topReason: 'cuisine' | 'interests' | 'time' | 'city' = 'city'
      let sharedCount = 0

      if (cuisine && tb.cuisine_type === cuisine) { score += 3; topReason = 'cuisine' }

      const candidateInterests = new Set(
        (tb.table_participants ?? []).flatMap(p => p.profiles?.interests ?? [])
      )
      sharedCount = myInterests.filter(i => candidateInterests.has(i)).length
      if (sharedCount > 0) {
        score += sharedCount
        if (sharedCount >= 2 || !(cuisine && tb.cuisine_type === cuisine)) topReason = 'interests'
      }

      if (slot && timeSlotOf(tb.time) === slot) { score += 1; if (topReason === 'city') topReason = 'time' }

      return { table: tb, score, topReason, sharedCount }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  if (scored.length === 0) return null

  const top = scored[0]
  const subtitle =
    top.topReason === 'interests' ? t(top.sharedCount === 1 ? 'tableDetail.sharedInterestSingular' : 'tableDetail.sharedInterestPlural').replace('{count}', String(top.sharedCount)) :
    top.topReason === 'cuisine' ? t('tableDetail.becauseYouLikeCuisine').replace('{cuisine}', cuisine ?? '') :
    top.topReason === 'time' ? t('tableDetail.becauseSameTime') :
    t('tableDetail.becauseYourCity')

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{t('tableDetail.readyForAnother')}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{subtitle}</p>
      <div className="space-y-3">
        {scored.map(({ table: tb }) => (
          <TableCard key={tb.id} table={tb} showRestaurant onClick={() => onNavigate('table-detail', tb.id)} />
        ))}
      </div>
    </div>
  )
}
