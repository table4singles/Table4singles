import { useState } from 'react'
import { ChevronDown, Clock, Users, HandHeart, CreditCard } from 'lucide-react'
import type { AgendaTable } from '@/hooks/useRestaurantAgenda'
import { ParticipantCard } from './ParticipantCard'

interface AgendaTableCardProps {
  table: AgendaTable
  onNavigate: (page: string, id?: string) => void
  t: (key: string) => string
}

function StatusBadge({ status, isActive, t }: { status: AgendaTable['status']; isActive: boolean; t: (key: string) => string }) {
  if (!isActive && status !== 'cancelled' && status !== 'completed') {
    return <span className="text-xs px-2 py-1 rounded-full flex-shrink-0 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">{t('agendaExtra.inactive')}</span>
  }
  const map: Record<AgendaTable['status'], string> = {
    open: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    full: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    completed: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
    cancelled: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  }
  const labels: Record<AgendaTable['status'], string> = {
    open: t('agenda.statusOpen'),
    full: t('agenda.statusFull'),
    completed: t('agenda.statusCompleted'),
    cancelled: t('agenda.statusCancelled'),
  }
  return <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${map[status]}`}>{labels[status]}</span>
}

export function AgendaTableCard({ table, onNavigate, t }: AgendaTableCardProps) {
  const [expanded, setExpanded] = useState(false)
  const occupied = table.max_seats - table.available_seats
  const isActive = table.is_active !== false

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden ${!isActive ? 'opacity-60' : ''}`}>
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left p-4 flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 text-sm text-gray-900 dark:text-white font-semibold">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-gray-400" />{table.time ? table.time.slice(0, 5) : (table.description || t('restaurantDashboard.tableSingular'))}</span>
            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400 font-normal">
              <Users className="w-3.5 h-3.5" />{occupied}/{table.max_seats} {t('agenda.seats')}
            </span>
          </div>
          {table.description && (
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">{table.description}</p>
          )}
        </div>
        <StatusBadge status={table.status} isActive={isActive} t={t} />
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700 px-4 pb-3">
          {table.participants.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 py-3">{t('agenda.noParticipants')}</p>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {table.participants.map(participant => (
                participant.profiles && (
                  <ParticipantCard
                    key={participant.id}
                    profile={participant.profiles}
                    badge={
                      participant.join_type === 'deposit' ? (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 flex-shrink-0">
                          <CreditCard className="w-3 h-3" /> {participant.deposit_paid ? t('agenda.depositPaid') : t('agenda.depositPending')}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-300 flex-shrink-0">
                          <HandHeart className="w-3 h-3" /> {t('agenda.wordJoin')}
                        </span>
                      )
                    }
                  />
                )
              ))}
            </div>
          )}
          <button
            onClick={() => onNavigate('table-detail', table.id)}
            className="mt-2 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
          >
            {t('agenda.viewDetail')}
          </button>
        </div>
      )}
    </div>
  )
}
