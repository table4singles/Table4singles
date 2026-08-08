import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { AgendaTable } from '@/hooks/useRestaurantAgenda'

interface AgendaCalendarProps {
  month: Date
  onMonthChange: (month: Date) => void
  selectedDate: string | null
  onSelectDate: (dateStr: string) => void
  byDate: Record<string, AgendaTable[]>
  locale: string
}

function pad(n: number) {
  return n.toString().padStart(2, '0')
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${pad(month + 1)}-${pad(day)}`
}

function dotColor(dayTables: AgendaTable[]): string {
  if (dayTables.some(t => t.status === 'open' && t.is_active !== false)) return 'bg-green-500'
  if (dayTables.some(t => t.status === 'full' && t.is_active !== false)) return 'bg-blue-500'
  return 'bg-gray-400'
}

export function AgendaCalendar({ month, onMonthChange, selectedDate, onSelectDate, byDate, locale }: AgendaCalendarProps) {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const firstOfMonth = new Date(year, monthIndex, 1)
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  // Monday-first weekday index (0 = Monday ... 6 = Sunday)
  const firstWeekday = (firstOfMonth.getDay() + 6) % 7
  const daysInPrevMonth = new Date(year, monthIndex, 0).getDate()

  const todayStr = toDateStr(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())

  const cells: { day: number; dateStr: string; inMonth: boolean }[] = []
  for (let i = 0; i < firstWeekday; i++) {
    const day = daysInPrevMonth - firstWeekday + 1 + i
    const prevMonth = monthIndex === 0 ? 11 : monthIndex - 1
    const prevYear = monthIndex === 0 ? year - 1 : year
    cells.push({ day, dateStr: toDateStr(prevYear, prevMonth, day), inMonth: false })
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, dateStr: toDateStr(year, monthIndex, day), inMonth: true })
  }
  while (cells.length % 7 !== 0) {
    const day = cells.length - (firstWeekday + daysInMonth) + 1
    const nextMonth = monthIndex === 11 ? 0 : monthIndex + 1
    const nextYear = monthIndex === 11 ? year + 1 : year
    cells.push({ day, dateStr: toDateStr(nextYear, nextMonth, day), inMonth: false })
  }

  const weekdayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, i + 1) // Jan 1 2024 is a Monday
    return d.toLocaleDateString(locale, { weekday: 'short' })
  })

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onMonthChange(new Date(year, monthIndex - 1, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white capitalize">
          {month.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
        </h3>
        <button
          onClick={() => onMonthChange(new Date(year, monthIndex + 1, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekdayLabels.map(label => (
          <div key={label} className="text-center text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map(cell => {
          const dayTables = byDate[cell.dateStr] || []
          const isToday = cell.dateStr === todayStr
          const isSelected = cell.dateStr === selectedDate
          return (
            <button
              key={cell.dateStr}
              onClick={() => onSelectDate(cell.dateStr)}
              className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-colors
                ${!cell.inMonth ? 'text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-200'}
                ${isSelected ? 'bg-primary-500 text-white hover:bg-primary-500' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                ${isToday && !isSelected ? 'ring-1 ring-primary-400' : ''}
              `}
            >
              <span>{cell.day}</span>
              {dayTables.length > 0 && (
                <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : dotColor(dayTables)}`} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
