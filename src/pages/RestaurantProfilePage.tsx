import { useMemo, useState, useRef, useEffect } from 'react'
import { MapPin, UtensilsCrossed, Star, ChevronLeft, ChevronRight, Heart, MessageSquare, Loader2, User, Send, Clock, Tag, Link, Sparkles, CalendarDays, ChevronDown, X } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { TableCard } from '@/components/TableCard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorBanner } from '@/components/ErrorBanner'
import { useRestaurantProfile } from '@/hooks/useRestaurants'
import { useRestaurantPublicReviews } from '@/hooks/useReviews'
import { useFavorites } from '@/hooks/useFavorites'
import { useAuth } from '@/contexts/AuthContext'
import { LANGUAGE_OPTIONS } from '@/lib/options'
import type { RestaurantReview } from '@/types/database'

interface RestaurantProfilePageProps {
  restaurantId: string
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

export function RestaurantProfilePage({ restaurantId, onNavigate, onAuthClick }: RestaurantProfilePageProps) {
  const { user, profile: myProfile } = useAuth()
  const { restaurant, tables, loading, error } = useRestaurantProfile(restaurantId)
  const { reviews, avgRating, submitReview, submitReply, submitting } = useRestaurantPublicReviews(restaurantId)
  const { isFavorite, toggleFavorite } = useFavorites()
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [calYear, setCalYear] = useState(() => new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth())
  const pickerRef = useRef<HTMLDivElement>(null)
  const [language, setLanguage] = useState('')
  const [minSeats, setMinSeats] = useState(0)
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewHover, setReviewHover] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewDone, setReviewDone] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const isRestaurant = myProfile?.role === 'restaurant'
  const myReview = user ? reviews.find(r => r.user_id === user.id) : null

  const handleSubmitReview = async () => {
    if (!reviewRating) return
    try {
      setReviewError(null)
      await submitReview(reviewRating, reviewComment)
      setReviewDone(true)
    } catch (e) {
      setReviewError((e as Error).message)
    }
  }

  // Dates with available tables
  const availableDates = useMemo(() => {
    const s = new Set<string>()
    tables.forEach(t => { if (t.available_seats > 0) s.add(t.date) })
    return s
  }, [tables])

  const filteredTables = useMemo(() => {
    return tables.filter(t => {
      if (selectedDate && t.date !== selectedDate) return false
      if (selectedTime && t.time) {
        const h = parseInt(t.time.slice(0, 2))
        if (selectedTime === 'midday' && (h < 12 || h >= 17)) return false
        if (selectedTime === 'evening' && (h < 17 || h >= 24)) return false
      }
      if (language && !(t.languages || []).includes(language)) return false
      if (minSeats > 0 && t.available_seats < minSeats) return false
      return true
    })
  }, [tables, selectedDate, selectedTime, language, minSeats])

  const hasFilters = !!(selectedDate || selectedTime || language || minSeats > 0)

  // Calendar helpers
  const todayStr = new Date().toISOString().slice(0, 10)
  const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const DAY_LABELS = ['L','M','X','J','V','S','D']
  const calDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay()
    const offset = (firstDay + 6) % 7
    const dim = new Date(calYear, calMonth + 1, 0).getDate()
    const cells: (number | null)[] = Array(offset).fill(null)
    for (let d = 1; d <= dim; d++) cells.push(d)
    return cells
  }, [calYear, calMonth])
  const toDateStr = (d: number) => `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1) } else setCalMonth(m => m-1) }
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1) } else setCalMonth(m => m+1) }

  const dateLabel = selectedDate
    ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
    : 'Cualquier día'

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar currentPage="browse" onNavigate={onNavigate} onAuthClick={onAuthClick} />
        <LoadingSpinner className="py-32" />
      </div>
    )
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar currentPage="browse" onNavigate={onNavigate} onAuthClick={onAuthClick} />
        <div className="max-w-3xl mx-auto px-4 py-8">
          <ErrorBanner message={error || 'Restaurante no encontrado'} />
        </div>
      </div>
    )
  }

  const photo = restaurant.restaurant_photos?.[0]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar currentPage="browse" onNavigate={onNavigate} onAuthClick={onAuthClick} />

      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-8">
        <button onClick={() => onNavigate('browse')} className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4">
          <ChevronLeft className="w-4 h-4" /> Volver a restaurantes
        </button>

        {/* Ficha del restaurante: foto izquierda, datos derecha */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden mb-8">
          <div className="flex flex-col sm:flex-row">
            <div className="w-full sm:w-64 h-56 sm:h-auto flex-shrink-0 bg-gray-100 dark:bg-gray-700">
              {photo ? (
                <img src={photo} alt={restaurant.restaurant_name || ''} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                  <UtensilsCrossed className="w-12 h-12" />
                </div>
              )}
            </div>
            <div className="flex-1 p-6">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">{restaurant.restaurant_name || 'Restaurante'}</h1>
                {user && (
                  <button
                    onClick={() => toggleFavorite(restaurant.id)}
                    className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-center transition-colors"
                    aria-label="Marcar como favorito"
                  >
                    <Heart className={`w-5 h-5 ${isFavorite(restaurant.id) ? 'fill-red-500 text-red-500' : 'text-gray-400 dark:text-gray-500'}`} />
                  </button>
                )}
              </div>

              <p className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 mt-2">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                {[restaurant.city, restaurant.country].filter(Boolean).join(', ') || 'Ubicación no especificada'}
              </p>

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {restaurant.restaurant_cuisine && (
                  <span className="text-xs px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full font-medium">{restaurant.restaurant_cuisine}</span>
                )}
                {restaurant.restaurant_price_range && (
                  <span className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full font-medium">{restaurant.restaurant_price_range}</span>
                )}
                {avgRating !== null && (
                  <span className="text-xs px-2.5 py-1 bg-yellow-50 text-yellow-700 rounded-full font-medium flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" /> {avgRating.toFixed(1)} ({reviews.length})
                  </span>
                )}
              </div>

              {restaurant.restaurant_description && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-4 leading-relaxed">{restaurant.restaurant_description}</p>
              )}

              {/* Campos extra de la migración 014 */}
              <div className="mt-4 space-y-2">
                {restaurant.restaurant_hours && (
                  <p className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Clock className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" />
                    <span>{restaurant.restaurant_hours}</span>
                  </p>
                )}
                {restaurant.restaurant_offers && (
                  <p className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Tag className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" />
                    <span>{restaurant.restaurant_offers}</span>
                  </p>
                )}
                {restaurant.restaurant_menu_url && (
                  <a
                    href={restaurant.restaurant_menu_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    <Link className="w-4 h-4 flex-shrink-0" />
                    Ver menú
                  </a>
                )}
                {restaurant.restaurant_specialties && restaurant.restaurant_specialties.length > 0 && (
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400" />
                    <div className="flex flex-wrap gap-1">
                      {restaurant.restaurant_specialties.map(s => (
                        <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mesas disponibles */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white">Mesas disponibles</h2>
          </div>

          {tables.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-5">

              {/* Date picker pill */}
              <div className="relative" ref={pickerRef}>
                <button
                  onClick={() => setPickerOpen(o => !o)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${selectedDate ? 'border-[#e94560] text-[#e94560] bg-red-50 dark:bg-red-900/20 font-medium' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:border-gray-300'}`}
                >
                  <CalendarDays className="w-4 h-4 flex-shrink-0" />
                  <span>{dateLabel}</span>
                  <ChevronDown className="w-3 h-3 flex-shrink-0 opacity-60" />
                </button>

                {pickerOpen && (
                  <div className="absolute top-full left-0 mt-1 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-3 w-64">
                    {/* Month nav */}
                    <div className="flex items-center justify-between mb-2 px-1">
                      <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </button>
                      <span className="text-xs font-semibold text-gray-700 dark:text-white">{MONTH_NAMES[calMonth]} {calYear}</span>
                      <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>
                    {/* Day headers */}
                    <div className="grid grid-cols-7 mb-1">
                      {DAY_LABELS.map(l => <div key={l} className="text-center text-[10px] font-medium text-gray-400 dark:text-gray-500 py-0.5">{l}</div>)}
                    </div>
                    {/* Days */}
                    <div className="grid grid-cols-7 gap-y-0.5">
                      {calDays.map((d, i) => {
                        if (!d) return <div key={i} />
                        const ds = toDateStr(d)
                        const hasTable = availableDates.has(ds)
                        const isPast = ds < todayStr
                        const isSel = selectedDate === ds
                        return (
                          <button
                            key={i}
                            disabled={!hasTable || isPast}
                            onClick={() => { setSelectedDate(isSel ? '' : ds); setPickerOpen(false) }}
                            className={`relative mx-auto flex items-center justify-center w-7 h-7 rounded-full text-xs transition-all
                              ${isSel ? 'bg-[#e94560] text-white font-bold' : ''}
                              ${!isSel && hasTable && !isPast ? 'text-gray-800 dark:text-white font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer' : ''}
                              ${(!hasTable || isPast) && !isSel ? 'text-gray-300 dark:text-gray-600 cursor-default' : ''}
                            `}
                          >
                            {d}
                            {hasTable && !isPast && !isSel && (
                              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#e94560]" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                    {selectedDate && (
                      <button onClick={() => { setSelectedDate(''); setPickerOpen(false) }} className="mt-3 w-full text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-center py-1">
                        Quitar fecha
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Time slot select */}
              <div className="relative">
                <select
                  value={selectedTime}
                  onChange={e => setSelectedTime(e.target.value)}
                  className={`appearance-none pl-3 pr-7 py-2 rounded-xl border text-sm cursor-pointer transition-all outline-none ${selectedTime ? 'border-[#e94560] text-[#e94560] bg-red-50 dark:bg-red-900/20 font-medium' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 hover:border-gray-300'}`}
                >
                  <option value="">🕐 Cualquier hora</option>
                  <option value="midday">☀️ Mediodía (12–17h)</option>
                  <option value="evening">🌙 Noche (17–24h)</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
              </div>

              {/* Clear button */}
              {hasFilters && (
                <button
                  onClick={() => { setSelectedDate(''); setSelectedTime(''); setLanguage(''); setMinSeats(0) }}
                  className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-xs text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 bg-white dark:bg-gray-800 hover:border-gray-300 transition-all"
                >
                  <X className="w-3 h-3" /> Limpiar
                </button>
              )}
            </div>
          )}

          {tables.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <UtensilsCrossed className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Este restaurante no tiene mesas abiertas ahora mismo</p>
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <UtensilsCrossed className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Ninguna mesa coincide con esos filtros</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {filteredTables.map(table => (
                <TableCard key={table.id} table={table} onClick={() => onNavigate('table-detail', table.id)} />
              ))}
            </div>
          )}
        </div>

        {/* ── Reseñas ─────────────────────────────────────────────── */}
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-5">
            <h2 className="text-lg font-display font-bold text-gray-900 dark:text-white">Reseñas</h2>
            {avgRating !== null && (
              <span className="flex items-center gap-1 text-sm text-yellow-600 font-medium">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> {avgRating.toFixed(1)} <span className="text-gray-400 font-normal">({reviews.length})</span>
              </span>
            )}
          </div>

          {/* Form for logged-in non-restaurant users */}
          {user && !isRestaurant && !reviewDone && !myReview && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 mb-5">
              <p className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Deja tu opinión</p>
              {reviewError && <p className="text-xs text-red-500 mb-3">{reviewError}</p>}
              <div className="flex gap-1 mb-3">
                {[1,2,3,4,5].map(s => (
                  <button key={s} type="button"
                    onMouseEnter={() => setReviewHover(s)}
                    onMouseLeave={() => setReviewHover(0)}
                    onClick={() => setReviewRating(s)}
                    className="p-0.5 transition-transform hover:scale-110">
                    <Star className={`w-7 h-7 transition-colors ${s <= (reviewHover || reviewRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 dark:text-gray-600'}`} />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                rows={3}
                placeholder="Cuéntanos tu experiencia (opcional)..."
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#e94560] outline-none resize-none"
              />
              <button
                onClick={handleSubmitReview}
                disabled={!reviewRating || submitting}
                className="mt-3 flex items-center gap-2 px-5 py-2 bg-[#e94560] text-white text-sm font-semibold rounded-xl hover:bg-[#d63d56] disabled:opacity-40 transition-colors"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Publicar reseña
              </button>
            </div>
          )}

          {reviewDone && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-5 mb-5 text-center">
              <p className="text-green-700 dark:text-green-300 font-medium">¡Gracias por tu reseña!</p>
            </div>
          )}

          {myReview && !reviewDone && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 mb-5 text-sm text-blue-700 dark:text-blue-300">
              Ya has dejado una reseña para este restaurante.
            </div>
          )}

          {/* Reviews list */}
          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <MessageSquare className="w-8 h-8 text-gray-200 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">Sin reseñas todavía. ¡Sé el primero!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map(r => <PublicReviewCard key={r.id} review={r} isRestaurant={isRestaurant} onReply={submitReply} />)}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function PublicReviewCard({ review, isRestaurant, onReply }: { review: RestaurantReview; isRestaurant: boolean; onReply: (reviewId: string, reply: string) => Promise<void> }) {
  const existingReply = review.restaurant_review_replies?.[0]
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [saving, setSaving] = useState(false)
  const profile = review.profiles
  const date = new Date(review.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })

  const handleSave = async () => {
    if (!replyText.trim()) return
    setSaving(true)
    try { await onReply(review.id, replyText.trim()); setShowReplyBox(false) }
    finally { setSaving(false) }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-gray-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{profile?.display_name || 'Usuario'}</p>
            <p className="text-xs text-gray-400 flex-shrink-0">{date}</p>
          </div>
          <div className="flex gap-0.5 mt-0.5">
            {[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 dark:text-gray-600'}`} />)}
          </div>
        </div>
      </div>
      {review.comment && <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{review.comment}</p>}

      {existingReply && (
        <div className="mt-4 pl-4 border-l-2 border-[#e94560]/30">
          <p className="text-xs font-semibold text-[#e94560] mb-1">Respuesta del restaurante</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">{existingReply.reply}</p>
        </div>
      )}

      {isRestaurant && !existingReply && !showReplyBox && (
        <button onClick={() => setShowReplyBox(true)} className="mt-3 flex items-center gap-1.5 text-xs text-[#e94560] hover:text-[#d63d56] font-medium transition-colors">
          <MessageSquare className="w-3.5 h-3.5" /> Responder
        </button>
      )}

      {isRestaurant && showReplyBox && (
        <div className="mt-4">
          <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={2} placeholder="Tu respuesta..." className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#e94560] outline-none resize-none" />
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={() => setShowReplyBox(false)} className="px-3 py-1.5 text-sm text-gray-500">Cancelar</button>
            <button onClick={handleSave} disabled={saving || !replyText.trim()} className="flex items-center gap-1.5 px-4 py-1.5 bg-[#e94560] text-white text-sm font-medium rounded-lg hover:bg-[#d63d56] disabled:opacity-50 transition-colors">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
