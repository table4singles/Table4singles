import { useState } from 'react'
import { Star, MessageSquare, Send, User, Loader2, BarChart2 } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import { useRestaurantPublicReviews } from '@/hooks/useReviews'
import type { RestaurantReview } from '@/types/database'

interface RestaurantReviewsPageProps {
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

export function RestaurantReviewsPage({ onNavigate, onAuthClick }: RestaurantReviewsPageProps) {
  const { user } = useAuth()
  const { reviews, loading, avgRating, submitReply } = useRestaurantPublicReviews(user?.id ?? null)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Navbar currentPage="reviews" onNavigate={onNavigate} onAuthClick={onAuthClick} />
        <LoadingSpinner className="py-32" />
      </div>
    )
  }

  const dist = [5, 4, 3, 2, 1].map(s => ({
    star: s,
    count: reviews.filter(r => r.rating === s).length,
  }))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar currentPage="reviews" onNavigate={onNavigate} onAuthClick={onAuthClick} />
      <main className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-8 space-y-6">

        <div>
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Reseñas</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Lo que opinan tus clientes</p>
        </div>

        {/* Summary card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-5xl font-bold text-gray-900 dark:text-white">
                {avgRating !== null ? avgRating.toFixed(1) : '—'}
              </p>
              <div className="flex justify-center gap-0.5 mt-1">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} className={`w-4 h-4 ${avgRating && s <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 dark:text-gray-600'}`} />
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{reviews.length} {reviews.length === 1 ? 'reseña' : 'reseñas'}</p>
            </div>
            <div className="flex-1 space-y-1.5">
              {dist.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 w-3 text-right">{star}</span>
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                  <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 rounded-full transition-all"
                      style={{ width: reviews.length > 0 ? `${(count / reviews.length) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-4">{count}</span>
                </div>
              ))}
            </div>
            <div className="text-center">
              <BarChart2 className="w-8 h-8 text-[#e94560] mx-auto mb-1" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Puntuación<br />media</p>
            </div>
          </div>
        </div>

        {/* Reviews list */}
        {reviews.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
            <Star className="w-10 h-10 text-gray-200 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Aún no tienes reseñas</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Las reseñas de tus clientes aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
              <ReviewCard key={review.id} review={review} onReply={submitReply} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function ReviewCard({ review, onReply }: { review: RestaurantReview; onReply: (reviewId: string, reply: string) => Promise<void> }) {
  const existingReply = review.restaurant_review_replies?.[0]
  const [showReplyBox, setShowReplyBox] = useState(!existingReply)
  const [replyText, setReplyText] = useState(existingReply?.reply || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!replyText.trim()) return
    setSaving(true)
    try {
      await onReply(review.id, replyText.trim())
      setShowReplyBox(false)
    } finally {
      setSaving(false)
    }
  }

  const profile = review.profiles
  const initials = profile?.display_name?.charAt(0)?.toUpperCase() || '?'
  const date = new Date(review.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-bold text-gray-500">{initials}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{profile?.display_name || 'Usuario'}</p>
              <p className="text-xs text-gray-400 flex-shrink-0">{date}</p>
            </div>
            <div className="flex gap-0.5 mt-0.5">
              {[1,2,3,4,5].map(s => (
                <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200 dark:text-gray-600'}`} />
              ))}
            </div>
          </div>
        </div>

        {review.comment && (
          <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{review.comment}</p>
        )}

        {/* Existing reply */}
        {existingReply && !showReplyBox && (
          <div className="mt-4 pl-4 border-l-2 border-[#e94560]/30">
            <p className="text-xs font-semibold text-[#e94560] mb-1">Tu respuesta</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{existingReply.reply}</p>
            <button
              onClick={() => setShowReplyBox(true)}
              className="text-xs text-gray-400 hover:text-[#e94560] mt-1.5 transition-colors"
            >
              Editar respuesta
            </button>
          </div>
        )}

        {/* Reply box */}
        {showReplyBox && (
          <div className="mt-4">
            <div className="flex items-center gap-1.5 mb-2">
              <MessageSquare className="w-3.5 h-3.5 text-[#e94560]" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                {existingReply ? 'Editar respuesta' : 'Responder'}
              </span>
            </div>
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              rows={3}
              placeholder="Escribe tu respuesta al cliente..."
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#e94560] outline-none resize-none"
            />
            <div className="flex justify-end gap-2 mt-2">
              {existingReply && (
                <button
                  onClick={() => { setReplyText(existingReply.reply); setShowReplyBox(false) }}
                  className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={saving || !replyText.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#e94560] text-white text-sm font-medium rounded-lg hover:bg-[#d63d56] disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Guardar
              </button>
            </div>
          </div>
        )}

        {/* Reply CTA if no reply yet */}
        {!existingReply && !showReplyBox && (
          <button
            onClick={() => setShowReplyBox(true)}
            className="mt-3 flex items-center gap-1.5 text-xs text-[#e94560] hover:text-[#d63d56] font-medium transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" /> Responder
          </button>
        )}
      </div>
    </div>
  )
}
