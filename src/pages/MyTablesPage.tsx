import { useState, useEffect } from 'react'
import { Plus, CalendarDays, Users, Clock, Loader2, UtensilsCrossed, XCircle, ToggleLeft, ToggleRight } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { PageHeader } from '@/components/PageHeader'
import { CancelModal } from '@/components/CancelModal'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { useViewMode } from '@/contexts/ViewModeContext'
import { useMyTables } from '@/hooks/useTables'
import { useInvitations } from '@/hooks/useInvitations'
import { openWhatsAppInvite } from '@/lib/inviteLink'

interface MyTablesPageProps {
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
  initialTab?: Tab
}

type Tab = 'hosting' | 'reservations' | 'invitations'

export function MyTablesPage({ onNavigate, onAuthClick, initialTab }: MyTablesPageProps) {
  const { t, language } = useLanguage()
  const { user } = useAuth()
  const { effectiveRole } = useViewMode()
  const isRestaurant = effectiveRole === 'restaurant'
  const { hosting, reservations, loading, error, cancelHostedTable, cancelReservation, toggleActive } = useMyTables(user?.id ?? null)
  const { invitations, respondInvitation } = useInvitations(user?.id ?? null)
  const [tab, setTab] = useState<Tab>(initialTab ?? (isRestaurant ? 'hosting' : 'reservations'))

  useEffect(() => {
    if (initialTab) setTab(initialTab)
  }, [initialTab])
  const [cancelTableId, setCancelTableId] = useState<string | null>(null)
  const [cancelReservationTarget, setCancelReservationTarget] = useState<{ id: string; joinType: 'word' | 'deposit' } | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const localeMap: Record<string, string> = {
    es: 'es-ES', en: 'en-GB', de: 'de-DE', fr: 'fr-FR', it: 'it-IT',
    ru: 'ru-RU', pt: 'pt-PT', uk: 'uk-UA', ro: 'ro-RO', ar: 'ar-SA',
    sv: 'sv-SE', zh: 'zh-CN', ja: 'ja-JP',
  }
  const locale = localeMap[language] ?? 'es-ES'

  const totalDiners = hosting.reduce((sum, t) => sum + (t.max_seats - t.available_seats), 0)
  const activeCount = hosting.filter(t => t.is_active !== false && t.status !== 'cancelled').length

  const handleToggle = async (tableId: string, next: boolean) => {
    setTogglingId(tableId)
    try {
      await toggleActive(tableId, next)
    } catch {
      // revert already handled in hook
    }
    setTogglingId(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar currentPage="my-tables" onNavigate={onNavigate} onAuthClick={onAuthClick} />
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-8">
        <PageHeader
          title={isRestaurant ? t('myTables.title') : t('myTables.titleUser')}
          subtitle={isRestaurant ? t('myTables.subtitle') : t('myTables.subtitleUser')}
          variant={isRestaurant ? 'restaurant' : 'user'}
          action={isRestaurant && (
            <button onClick={() => onNavigate('create')} className="px-4 py-2.5 bg-white/95 text-gray-900 rounded-xl font-medium text-sm hover:bg-white transition-colors flex items-center gap-2 shadow-sm">
              <Plus className="w-4 h-4" /> {t('myTables.create')}
            </button>
          )}
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4">{error}</div>
        )}

        {/* Stat cards */}
        <div className={`grid gap-4 mb-6 ${isRestaurant ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {isRestaurant && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                <UtensilsCrossed className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{activeCount}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('myTables.activeTables')}</p>
              </div>
            </div>
          )}
          {isRestaurant && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{totalDiners}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('myTables.diners')}</p>
              </div>
            </div>
          )}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <CalendarDays className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{reservations.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('myTables.joined')}</p>
            </div>
          </div>
          {!isRestaurant && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{invitations.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('myTables.invitationsLabel')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          {(isRestaurant ? (['hosting', 'reservations', 'invitations'] as Tab[]) : (['reservations', 'invitations'] as Tab[])).map(t2 => (
            <button
              key={t2}
              onClick={() => setTab(t2)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t2 ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
            >
              {t(`myTables.tab.${t2}`)}
              {t2 === 'hosting' && ` (${hosting.length})`}
              {t2 === 'reservations' && ` (${reservations.length})`}
              {t2 === 'invitations' && invitations.length > 0 && (
                <span className="ml-1.5 w-5 h-5 bg-[#129a93] text-white rounded-full text-xs inline-flex items-center justify-center">{invitations.length}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-primary-500 animate-spin" /></div>
        ) : (
          <>
            {tab === 'hosting' && (
              hosting.length === 0 ? (
                <EmptyState icon={<UtensilsCrossed className="w-10 h-10" />} title={t('myTables.empty.hosting')} desc={t('myTables.empty.hostingDesc')} action={t('myTables.create')} onAction={() => onNavigate('create')} />
              ) : (
                <div className="space-y-4">
                  {hosting.map(table => {
                    const isActive = table.is_active !== false
                    return (
                      <div key={table.id} className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-all ${!isActive ? 'opacity-70' : ''}`}>
                        <div className="flex items-start gap-3">
                          <button onClick={() => onNavigate('table-detail', table.id)} className="flex-1 text-left min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                                  {table.description || table.restaurant_name}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {t('myTables.since')} {new Date(table.date).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}
                                  {table.available_until ? ` · ${t('myTables.until')} ${new Date(table.available_until).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}` : ''}
                                </p>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  {table.status === 'cancelled' && <span className="text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full">{t('myTables.statusCancelled')}</span>}
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isActive ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                                    {isActive ? t('myTables.statusAvailable') : t('myTables.statusUnavailable')}
                                  </span>
                                  <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                    <Users className="w-3 h-3" />{table.max_seats - table.available_seats}/{table.max_seats}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>

                          {table.status !== 'cancelled' && table.status !== 'completed' && (
                            <button
                              onClick={() => handleToggle(table.id, !isActive)}
                              disabled={togglingId === table.id}
                              className="flex-shrink-0 pt-0.5"
                              title={isActive ? t('myTables.markUnavailable') : t('myTables.markAvailable')}
                            >
                              {togglingId === table.id ? (
                                <Loader2 className="w-7 h-7 animate-spin text-gray-400" />
                              ) : isActive ? (
                                <ToggleRight className="w-8 h-8 text-green-500" />
                              ) : (
                                <ToggleLeft className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                              )}
                            </button>
                          )}
                        </div>

                        {table.status !== 'cancelled' && table.status !== 'completed' && (
                          <button onClick={() => setCancelTableId(table.id)} className="mt-3 text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> {t('myTables.cancel')}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            )}

            {tab === 'reservations' && (
              reservations.length === 0 ? (
                <EmptyState icon={<Clock className="w-10 h-10" />} title={t('myTables.empty.reservations')} desc={t('myTables.empty.reservationsDesc')} action={t('myTables.exploreTables')} onAction={() => onNavigate('browse')} />
              ) : (
                <div className="space-y-4">
                  {reservations.map(r => {
                    const dt = r.dining_tables as any
                    const isPast = dt?.date && dt?.time ? new Date(`${dt.date}T${dt.time}`) < new Date() : false
                    const dateStr = dt?.date ? new Date(dt.date + 'T12:00:00').toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'short' }) : ''
                    const timeStr = dt?.time ? dt.time.slice(0, 5) : ''
                    return (
                      <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-all">
                        <button onClick={() => dt?.host_id ? onNavigate('restaurant-profile', dt.host_id) : onNavigate('table-detail', r.table_id)} className="w-full text-left">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-gray-900 dark:text-white truncate">{dt?.restaurant_name}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                {dateStr}{timeStr ? ` · ${timeStr}` : ''}
                              </p>
                              <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400">{t('myTables.spotReserved')}</span>
                            </div>
                            {dt?.status === 'cancelled' && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-500 flex-shrink-0">{t('myTables.statusCancelled')}</span>
                            )}
                          </div>
                        </button>
                        {!isPast && dt?.status !== 'cancelled' && (
                          <div className="mt-3 flex items-center gap-3">
                            <button
                              onClick={() => openWhatsAppInvite(r.table_id, t('invite.waInviteText'))}
                              className="text-xs text-[#128C7E] hover:text-[#0d6e62] font-medium"
                            >
                              💬 {t('invite.inviteViaWhatsApp')}
                            </button>
                            <button onClick={() => setCancelReservationTarget({ id: r.id, joinType: r.join_type })} className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> {t('card.cancelReservation')}
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            )}

            {tab === 'invitations' && (
              invitations.length === 0 ? (
                <EmptyState icon={<Users className="w-10 h-10" />} title={t('myTables.empty.invitations')} desc={t('myTables.empty.invitationsDesc')} />
              ) : (
                <div className="space-y-4">
                  {invitations.map(inv => (
                    <div key={inv.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
                      <p className="text-sm text-gray-700 dark:text-gray-200 mb-3">
                        {t('myTables.invitation.invites')} — {inv.payment_covered ? t('myTables.invitation.included') : t('myTables.invitation.deposit')}
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => respondInvitation(inv.id, true)} className="flex-1 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600">
                          {t('myTables.invitation.accept')}
                        </button>
                        <button onClick={() => respondInvitation(inv.id, false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700">
                          {t('myTables.invitation.decline')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}

        {cancelTableId && (
          <CancelModal
            joinType="word"
            onClose={() => setCancelTableId(null)}
            onConfirm={async () => {
              await cancelHostedTable(cancelTableId)
              setCancelTableId(null)
            }}
          />
        )}

        {cancelReservationTarget && (
          <CancelModal
            joinType="deposit"
            depositAmount={2}
            onClose={() => setCancelReservationTarget(null)}
            onConfirm={async () => {
              await cancelReservation(cancelReservationTarget.id)
              setCancelReservationTarget(null)
            }}
          />
        )}
      </main>
    </div>
  )
}

function EmptyState({ icon, title, desc, action, onAction }: { icon: React.ReactNode; title: string; desc: string; action?: string; onAction?: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center mx-auto mb-4 text-primary-500 dark:text-primary-400">{icon}</div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{desc}</p>
      {action && onAction && (
        <button onClick={onAction} className="px-6 py-2.5 bg-[#129a93] text-white rounded-xl text-sm font-medium hover:bg-[#0b7f79]">{action}</button>
      )}
    </div>
  )
}
