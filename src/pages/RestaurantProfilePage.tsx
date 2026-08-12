import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import { MapPin, UtensilsCrossed, Star, ChevronLeft, ChevronRight, Heart, MessageSquare, Loader2, User, Send, Clock, Tag, Link, Sparkles, CalendarDays, X } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { TableCard } from '@/components/TableCard'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { ErrorBanner } from '@/components/ErrorBanner'
import { useRestaurantProfile } from '@/hooks/useRestaurants'
import { useRestaurantPublicReviews } from '@/hooks/useReviews'
import { useFavorites } from '@/hooks/useFavorites'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import type { RestaurantReview } from '@/types/database'

interface RestaurantProfilePageProps {
  restaurantId: string
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DAY_LABELS = ['L','M','X','J','V','S','D']

export function RestaurantProfilePage({ restaurantId, onNavigate, onAuthClick }: RestaurantProfilePageProps) {
  const { user, profile: myProfile } = useAuth()
  const { restaurant, tables, loading, error } = useRestaurantProfile(restaurantId)
  const { reviews, avgRating, submitReview, submitReply, submitting } = useRestaurantPublicReviews(restaurantId)
  const { isFavorite, toggleFavorite } = useFavorites()
  const { t } = useLanguage()

  // Carousel
  const photos = restaurant?.restaurant_photos ?? []
  const [photoIdx, setPhotoIdx] = useState(0)
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startAuto = useCallback(() => {
    if (photos.length <= 1) return
    autoRef.current = setInterval(() => setPhotoIdx(i => (i + 1) % photos.length), 4000)
  }, [photos.length])
  useEffect(() => {
    startAuto()
    return () => { if (autoRef.current) clearInterval(autoRef.current) }
  }, [startAuto])
  const prevPhoto = () => { if (autoRef.current) clearInterval(autoRef.current); setPhotoIdx(i => (i - 1 + photos.length) % photos.length); startAuto() }
  const nextPhoto = () => { if (autoRef.current) clearInterval(autoRef.current); setPhotoIdx(i => (i + 1) % photos.length); startAuto() }

  // Date picker
  const todayStr = new Date().toISOString().slice(0, 10)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState<'midday' | 'evening' | ''>('')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [calYear, setCalYear] = useState(() => new Date().getFullYear())
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth())
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Review form
  const isRestaurant = myProfile?.role === 'restaurant'
  const myReview = user ? reviews.find(r => r.user_id === user.id) : null
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewHover, setReviewHover] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewDone, setReviewDone] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

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

  // Calendar grid
  const calDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay()
    const offset = (firstDay + 6) % 7
    const dim = new Date(calYear, calMonth + 1, 0).getDate()
    const cells: (number | null)[] = Array(offset).fill(null)
    for (let d = 1; d <= dim; d++) cells.push(d)
    return cells
  }, [calYear, calMonth])
  const toDateStr = (d: number) => `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1) }

  // Available dates from tables
  const availableDates = useMemo(() => {
    const s = new Set<string>()
    tables.forEach(tbl => { if (tbl.available_seats > 0 && tbl.date >= todayStr) s.add(tbl.date) })
    return s
  }, [tables, todayStr])

  // Filtered tables — only shown when BOTH date and time are chosen
  const showTables = !!(selectedDate && selectedTime)
  const filteredTables = useMemo(() => {
    if (!showTables) return []
    return tables.filter(tbl => {
      if (tbl.date !== selectedDate) return false
      if (tbl.time) {
        const h = parseInt(tbl.time.slice(0, 2))
        if (selectedTime === 'midday' && (h < 12 || h >= 17)) return false
        if (selectedTime === 'evening' && (h < 17 || h >= 24)) return false
      }
      return true
    })
  }, [tables, selectedDate, selectedTime, showTables])

  const dateLabel = selectedDate
    ? new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
    : 'Elige un día'
  const timeLabel = selectedTime === 'midday' ? `☀️ ${t('browse.midday')}` : selectedTime === 'evening' ? `🌙 ${t('browse.evening')}` : null

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

  const currentPhoto = photos[photoIdx] || null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar currentPage="browse" onNavigate={onNavigate} onAuthClick={onAuthClick} />

      <main className="max-w-3xl mx-auto pb-24 md:pb-8">

        {/* ── Carrusel de fotos ────────────────────────────── */}
        <div className="relative h-64 sm:h-80 bg-gray-200 dark:bg-gray-800 overflow-hidden">
          {currentPhoto ? (
            <img
              key={photoIdx}
              src={currentPhoto}
              alt={restaurant.restaurant_name ?? ''}
              className="w-full h-full object-cover transition-opacity duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <UtensilsCrossed className="w-16 h-16 text-gray-300 dark:text-gray-600" />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10" />

          {/* Back button */}
          <button
            onClick={() => onNavigate('browse')}
            className="absolute top-4 left-4 w-9 h-9 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          </button>

          {/* Favorite button */}
          {user && (
            <button
              onClick={() => toggleFavorite(restaurant.id)}
              className="absolute top-4 right-4 w-9 h-9 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white dark:hover:bg-gray-700 transition-colors"
              aria-label="Favorito"
            >
              <Heart className={`w-5 h-5 ${isFavorite(restaurant.id) ? 'fill-red-500 text-red-500' : 'text-gray-600 dark:text-gray-300'}`} />
            </button>
          )}

          {/* Carousel arrows */}
          {photos.length > 1 && (
            <>
              <button onClick={prevPhoto} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center transition-colors">
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <button onClick={nextPhoto} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center transition-colors">
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.map((_, i) => (
                  <button key={i} onClick={() => setPhotoIdx(i)} className={`w-1.5 h-1.5 rounded-full transition-all ${i === photoIdx ? 'bg-white w-4' : 'bg-white/50'}`} />
                ))}
              </div>
            </>
          )}

          {/* Restaurant name overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
            <h1 className="text-2xl font-display font-bold text-white drop-shadow">{restaurant.restaurant_name || 'Restaurante'}</h1>
            <p className="flex items-center gap-1 text-sm text-white/80 mt-0.5">
              <MapPin className="w-3.5 h-3.5" />
              {[restaurant.city, restaurant.country].filter(Boolean).join(', ') || 'Ubicación no especificada'}
            </p>
          </div>
        </div>

        <div className="px-4 pt-4 space-y-5">

          {/* ── Info del restaurante ─────────────────────────── */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
            <div className="flex items-center gap-2 flex-wrap mb-3">
              {restaurant.restaurant_cuisine && (
                <span className="text-xs px-2.5 py-1 bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 rounded-full font-medium">{restaurant.restaurant_cuisine}</span>
              )}
              {restaurant.restaurant_price_range && (
                <span className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full font-medium">{restaurant.restaurant_price_range}</span>
              )}
              {avgRating !== null && (
                <span className="text-xs px-2.5 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-full font-medium flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" /> {avgRating.toFixed(1)} <span className="opacity-70">({reviews.length})</span>
                </span>
              )}
            </div>

            {restaurant.restaurant_description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3">{restaurant.restaurant_description}</p>
            )}

            <div className="space-y-1.5">
              {restaurant.restaurant_hours && (
                <p className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{restaurant.restaurant_hours}
                </p>
              )}
              {restaurant.restaurant_offers && (
                <p className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <Tag className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{restaurant.restaurant_offers}
                </p>
              )}
              {restaurant.restaurant_menu_url && (
                <a href={restaurant.restaurant_menu_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-[#e94560] hover:underline">
                  <Link className="w-3.5 h-3.5 flex-shrink-0" />Ver menú
                </a>
              )}
              {restaurant.restaurant_specialties && restaurant.restaurant_specialties.length > 0 && (
                <div className="flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-gray-400" />
                  <div className="flex flex-wrap gap-1">
                    {restaurant.restaurant_specialties.map(s => (
                      <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Selector de fecha y hora (obligatorio) ───────── */}
          {tables.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">¿Cuándo quieres ir?</h2>

              <div className="flex flex-col sm:flex-row gap-3">
                {/* Date pill */}
                <div className="relative flex-1" ref={pickerRef}>
                  <button
                    onClick={() => setPickerOpen(o => !o)}
                    className={`w-full flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                      selectedDate
                        ? 'border-[#e94560] text-[#e94560] bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 hover:border-gray-300'
                    }`}
                  >
                    <CalendarDays className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left">{dateLabel}</span>
                    {selectedDate && (
                      <button onClick={e => { e.stopPropagation(); setSelectedDate('') }} className="p-0.5 hover:text-gray-800 dark:hover:text-gray-100">
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </button>

                  {pickerOpen && (
                    <div className="absolute top-full left-0 mt-1 z-30 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-3 w-72">
                      <div className="flex items-center justify-between mb-2 px-1">
                        <button onClick={prevMonth} disabled={calYear === new Date().getFullYear() && calMonth === new Date().getMonth()} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30">
                          <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                        <span className="text-xs font-semibold text-gray-700 dark:text-white">{MONTH_NAMES[calMonth]} {calYear}</span>
                        <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                          <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        </button>
                      </div>
                      <div className="grid grid-cols-7 mb-1">
                        {DAY_LABELS.map(l => <div key={l} className="text-center text-[10px] font-medium text-gray-400 dark:text-gray-500 py-0.5">{l}</div>)}
                      </div>
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
                              className={`relative mx-auto flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-all
                                ${isSel ? 'bg-[#e94560] text-white' : ''}
                                ${!isSel && hasTable && !isPast ? 'text-gray-900 dark:text-white hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer' : ''}
                                ${(!hasTable || isPast) && !isSel ? 'text-gray-300 dark:text-gray-600 cursor-default' : ''}
                              `}
                            >
                              {d}
                              {hasTable && !isPast && !isSel && (
                                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#e94560]" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Time pills */}
                <div className="flex gap-2">
                  {(['midday', 'evening'] as const).map(slot => (
                    <button
                      key={slot}
                      onClick={() => setSelectedTime(prev => prev === slot ? '' : slot)}
                      className={`flex-1 sm:flex-none px-4 py-3 rounded-xl border text-sm font-medium transition-all whitespace-nowrap ${
                        selectedTime === slot
                          ? 'border-[#e94560] text-[#e94560] bg-red-50 dark:bg-red-900/20'
                          : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 hover:border-gray-300'
                      }`}
                    >
                    {slot === 'midday' ? `☀️ ${t('browse.midday')}` : `🌙 ${t('browse.evening')}`}
                    </button>
                  ))}
                </div>
              </div>

              {selectedDate && selectedTime && (
                <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                  Mostrando mesas para el {dateLabel} · {timeLabel}
                </p>
              )}
            </div>
          )}

          {/* ── Mesas disponibles ────────────────────────────── */}
          {tables.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <UtensilsCrossed className="w-9 h-9 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">Sin mesas abiertas ahora mismo</p>
            </div>
          ) : !showTables ? (
            <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <CalendarDays className="w-9 h-9 text-gray-200 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Elige fecha y hora para ver las mesas</p>
              <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">
                {availableDates.size > 0
                  ? `${availableDates.size} día${availableDates.size > 1 ? 's' : ''} con disponibilidad`
                  : 'No hay plazas disponibles'}
              </p>
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
              <UtensilsCrossed className="w-9 h-9 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-gray-500 dark:text-gray-400 text-sm">Sin mesas para ese tramo horario</p>
              <button onClick={() => setSelectedTime('')} className="mt-2 text-xs text-[#e94560] hover:underline">Cambiar tramo</button>
            </div>
          ) : (
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                {filteredTables.length} {filteredTables.length === 1 ? 'mesa disponible' : 'mesas disponibles'}
              </h2>
              <div className="space-y-3">
                {filteredTables.map(table => (
                  <TableCard
                    key={table.id}
                    table={table}
                    participants={table.table_participants}
                    onClick={() => onNavigate('table-detail', table.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Reseñas ──────────────────────────────────────── */}
          <div className="pb-4">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Reseñas</h2>
              {avgRating !== null && (
                <span className="flex items-center gap-1 text-xs text-yellow-600 font-medium">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" /> {avgRating.toFixed(1)}
                  <span className="text-gray-400 font-normal">({reviews.length})</span>
                </span>
              )}
            </div>

            {user && !isRestaurant && !reviewDone && !myReview && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 mb-4">
                <p className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Deja tu opinión</p>
                {reviewError && <p className="text-xs text-red-500 mb-3">{reviewError}</p>}
                <div className="flex gap-1 mb-3">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} type="button" onMouseEnter={() => setReviewHover(s)} onMouseLeave={() => setReviewHover(0)} onClick={() => setReviewRating(s)} className="p-0.5 transition-transform hover:scale-110">
                      <Star className={`w-6 h-6 transition-colors ${s <= (reviewHover || reviewRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 dark:text-gray-600'}`} />
                    </button>
                  ))}
                </div>
                <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={3} placeholder="Tu experiencia (opcional)..." className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#e94560] outline-none resize-none" />
                <button onClick={handleSubmitReview} disabled={!reviewRating || submitting} className="mt-3 flex items-center gap-2 px-5 py-2 bg-[#e94560] text-white text-sm font-semibold rounded-xl hover:bg-[#d63d56] disabled:opacity-40 transition-colors">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Publicar
                </button>
              </div>
            )}

            {reviewDone && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 mb-4 text-center">
                <p className="text-green-700 dark:text-green-300 font-medium text-sm">¡Gracias por tu reseña!</p>
              </div>
            )}

            {myReview && !reviewDone && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 mb-4 text-xs text-blue-700 dark:text-blue-300">
                Ya has dejado una reseña para este restaurante.
              </div>
            )}

            {reviews.length === 0 ? (
              <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                <MessageSquare className="w-7 h-7 text-gray-200 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 dark:text-gray-500 text-sm">Sin reseñas todavía</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map(r => <PublicReviewCard key={r.id} review={r} isRestaurant={isRestaurant} onReply={submitReply} />)}
              </div>
            )}
          </div>
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
  const date = new Date(review.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })

  const handleSave = async () => {
    if (!replyText.trim()) return
    setSaving(true)
    try { await onReply(review.id, replyText.trim()); setShowReplyBox(false) }
    finally { setSaving(false) }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
          {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <User className="w-3.5 h-3.5 text-gray-400" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{profile?.display_name || 'Usuario'}</p>
            <p className="text-xs text-gray-400 flex-shrink-0">{date}</p>
          </div>
          <div className="flex gap-0.5 mt-0.5">
            {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 dark:text-gray-600'}`} />)}
          </div>
          {review.comment && <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{review.comment}</p>}
        </div>
      </div>

      {existingReply && (
        <div className="mt-3 ml-11 pl-3 border-l-2 border-[#e94560]/30">
          <p className="text-xs font-semibold text-[#e94560] mb-0.5">Respuesta del restaurante</p>
          <p className="text-xs text-gray-600 dark:text-gray-300">{existingReply.reply}</p>
        </div>
      )}

      {isRestaurant && !existingReply && !showReplyBox && (
        <button onClick={() => setShowReplyBox(true)} className="mt-2 ml-11 flex items-center gap-1 text-xs text-[#e94560] hover:text-[#d63d56] font-medium">
          <MessageSquare className="w-3 h-3" /> Responder
        </button>
      )}

      {isRestaurant && showReplyBox && (
        <div className="mt-3 ml-11">
          <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={2} placeholder="Tu respuesta..." className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#e94560] outline-none resize-none" />
          <div className="flex justify-end gap-2 mt-1.5">
            <button onClick={() => setShowReplyBox(false)} className="px-3 py-1.5 text-xs text-gray-500">Cancelar</button>
            <button onClick={handleSave} disabled={saving || !replyText.trim()} className="flex items-center gap-1 px-3 py-1.5 bg-[#e94560] text-white text-xs font-medium rounded-lg hover:bg-[#d63d56] disabled:opacity-50">
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Guardar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
