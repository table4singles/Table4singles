import { useState, useEffect } from 'react'
import { Plus, CalendarDays, Users, Clock, Loader2, UtensilsCrossed, XCircle } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { CancelModal } from '@/components/CancelModal'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { useMyTables } from '@/hooks/useTables'
import { useInvitations } from '@/hooks/useInvitations'

interface MyTablesPageProps {
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
  initialTab?: Tab
}

type Tab = 'hosting' | 'reservations' | 'invitations'

export function MyTablesPage({ onNavigate, onAuthClick, initialTab }: MyTablesPageProps) {
  const { t, language } = useLanguage()
  const { user, profile } = useAuth()
  const isRestaurant = profile?.role === 'restaurant'
  const { hosting, reservations, loading, error, cancelHostedTable, cancelReservation } = useMyTables(user?.id ?? null)
  const { invitations, respondInvitation } = useInvitations(user?.id ?? null)
  const [tab, setTab] = useState<Tab>(initialTab ?? (isRestaurant ? 'hosting' : 'reservations'))

  useEffect(() => {
    if (initialTab) setTab(initialTab)
  }, [initialTab])
  const [cancelTableId, setCancelTableId] = useState<string | null>(null)
  const [cancelReservationTarget, setCancelReservationTarget] = useState<{ id: string; joinType: 'word' | 'deposit' } | null>(null)

  const locale = language === 'de' ? 'de-DE' : language === 'en' ? 'en-GB' : 'es-ES'

  const totalDiners = hosting.reduce((sum, t) => sum + (t.max_seats - t.available_seats), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage="my-tables" onNavigate={onNavigate} onAuthClick={onAuthClick} />
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-900">{isRestaurant ? t('myTables.title') : 'Mis reservas'}</h1>
            <p className="text-gray-500 text-sm mt-1">{isRestaurant ? t('myTables.subtitle') : 'Tus cenas y mesas reservadas'}</p>
          </div>
          {isRestaurant && (
            <button onClick={() => onNavigate('create')} className="px-4 py-2.5 bg-[#e94560] text-white rounded-xl font-medium text-sm hover:bg-[#d63d56] transition-colors flex items-center gap-2">
              <Plus className="w-4 h-4" /> {t('myTables.create')}
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4">{error}</div>
        )}

        {/* Stat cards */}
        <div className={`grid gap-4 mb-6 ${isRestaurant ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {isRestaurant && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                <UtensilsCrossed className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{hosting.length}</p>
                <p className="text-xs text-gray-500">{t('myTables.activeTables')}</p>
              </div>
            </div>
          )}
          {isRestaurant && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{totalDiners}</p>
                <p className="text-xs text-gray-500">{t('myTables.diners')}</p>
              </div>
            </div>
          )}
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <CalendarDays className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{reservations.length}</p>
              <p className="text-xs text-gray-500">{t('myTables.joined')}</p>
            </div>
          </div>
          {!isRestaurant && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">{invitations.length}</p>
                <p className="text-xs text-gray-500">Invitaciones</p>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {(isRestaurant ? (['hosting', 'reservations', 'invitations'] as Tab[]) : (['reservations', 'invitations'] as Tab[])).map(t2 => (
            <button
              key={t2}
              onClick={() => setTab(t2)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t2 ? 'border-teal-500 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              {t(`myTables.tab.${t2}`)}
              {t2 === 'hosting' && ` (${hosting.length})`}
              {t2 === 'reservations' && ` (${reservations.length})`}
              {t2 === 'invitations' && invitations.length > 0 && (
                <span className="ml-1.5 w-5 h-5 bg-[#e94560] text-white rounded-full text-xs inline-flex items-center justify-center">{invitations.length}</span>
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
                  {hosting.map(table => (
                    <div key={table.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all">
                      <button onClick={() => onNavigate('table-detail', table.id)} className="w-full text-left">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900">{table.restaurant_name}</h3>
                            <p className="text-sm text-gray-500">{table.restaurant_city}</p>
                            {table.status === 'cancelled' && <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-red-50 text-red-600 rounded-full">Cancelada</span>}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-700">{new Date(table.date).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}</p>
                            <p className="text-xs text-gray-400 flex items-center gap-1 justify-end"><Users className="w-3 h-3" />{table.max_seats - table.available_seats}/{table.max_seats}</p>
                          </div>
                        </div>
                      </button>
                      {table.status !== 'cancelled' && table.status !== 'completed' && new Date(`${table.date}T${table.time}`) > new Date() && (
                        <button onClick={() => setCancelTableId(table.id)} className="mt-3 text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> {t('myTables.cancel')}
                        </button>
                      )}
                    </div>
                  ))}
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
                    return (
                      <div key={r.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-all">
                        <button onClick={() => onNavigate('table-detail', r.table_id)} className="w-full text-left">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900">{dt?.restaurant_name}</h3>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${r.join_type === 'deposit' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'}`}>
                                {r.join_type === 'deposit' ? t('card.depositBadge') : t('card.wordBadge')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">{dt?.date && new Date(dt.date).toLocaleDateString(locale, { month: 'short', day: 'numeric' })}</p>
                          </div>
                        </button>
                        {!isPast && dt?.status !== 'cancelled' && (
                          <button onClick={() => setCancelReservationTarget({ id: r.id, joinType: r.join_type })} className="mt-3 text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> {t('card.cancelReservation')}
                          </button>
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
                    <div key={inv.id} className="bg-white rounded-xl border border-gray-100 p-4">
                      <p className="text-sm text-gray-700 mb-3">
                        {t('myTables.invitation.invites')} — {inv.payment_covered ? t('myTables.invitation.included') : t('myTables.invitation.deposit')}
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => respondInvitation(inv.id, true)} className="flex-1 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600">
                          {t('myTables.invitation.accept')}
                        </button>
                        <button onClick={() => respondInvitation(inv.id, false)} className="flex-1 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
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
            joinType={cancelReservationTarget.joinType}
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
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 text-gray-400">{icon}</div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{desc}</p>
      {action && onAction && (
        <button onClick={onAction} className="px-6 py-2.5 bg-[#e94560] text-white rounded-xl text-sm font-medium hover:bg-[#d63d56]">{action}</button>
      )}
    </div>
  )
}
