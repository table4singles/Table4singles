import { useEffect, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/contexts/LanguageContext'

interface Row { table_id: string; table_date: string | null; guest_name: string | null; bookings: number; pending_cents: number; paid_cents: number }

// Cobros del restaurante por sus cenas especiales: solo SU importe (el 10 % de gestión no se muestra nunca).
export function SpecialEarnings() {
  const { t, language } = useLanguage()
  const [rows, setRows] = useState<Row[]>([])

  useEffect(() => {
    supabase.rpc('restaurant_special_earnings').then(({ data }) => setRows((data as Row[]) ?? []))
  }, [])

  if (rows.length === 0) return null
  const eur = (c: number) => (c / 100).toLocaleString(language, { style: 'currency', currency: 'EUR' })
  const pending = rows.reduce((a, r) => a + Number(r.pending_cents), 0)
  const paid = rows.reduce((a, r) => a + Number(r.paid_cents), 0)

  return (
    <div className="mb-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-gold-500" />
        <h2 className="font-semibold text-sm text-gray-900 dark:text-white">{t('specialGuest.earningsTitle')}</h2>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t('specialGuest.earningsNote')}</p>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('specialGuest.earningsPending')}</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{eur(pending)}</p>
        </div>
        <div className="rounded-lg bg-gray-50 dark:bg-gray-700/40 p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('specialGuest.earningsPaid')}</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{eur(paid)}</p>
        </div>
      </div>
      <ul className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
        {rows.map(r => (
          <li key={r.table_id} className="py-2 flex items-center justify-between gap-3">
            <span className="truncate text-gray-800 dark:text-gray-200">{r.guest_name ?? '—'}{r.table_date ? ` · ${r.table_date}` : ''}</span>
            <span className="text-xs text-gray-500 flex-shrink-0">{t('specialGuest.earningsBookings')}: {r.bookings}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
