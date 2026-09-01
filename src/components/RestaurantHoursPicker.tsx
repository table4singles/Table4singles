import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  WEEKDAYS,
  WEEKDAY_LABELS,
  buildTimeOptions,
  formatHoursBlocks,
  newHoursBlock,
  parseHoursString,
  type HoursBlock,
  type Weekday,
} from '@/lib/restaurantHours'

const TIME_OPTIONS = buildTimeOptions(true)

interface RestaurantHoursPickerProps {
  value: string
  onChange: (formatted: string) => void
  className?: string
}

export function RestaurantHoursPicker({ value, onChange, className = '' }: RestaurantHoursPickerProps) {
  const { t } = useLanguage()
  const [blocks, setBlocks] = useState<HoursBlock[]>(() => parseHoursString(value))
  const [legacyText, setLegacyText] = useState(() => {
    const parsed = parseHoursString(value)
    return value.trim() && parsed.length === 0 ? value : null
  })

  // Recargar si el padre cambia el valor (p.ej. al cargar el perfil)
  useEffect(() => {
    const formatted = formatHoursBlocks(blocks)
    if (value === formatted) return
    const parsed = parseHoursString(value)
    if (parsed.length > 0) {
      setBlocks(parsed)
      setLegacyText(null)
    } else if (!value.trim()) {
      setBlocks([])
      setLegacyText(null)
    } else if (value !== formatted) {
      setLegacyText(value)
    }
    // Solo reaccionar a cambios externos de `value`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const emit = (next: HoursBlock[]) => {
    setBlocks(next)
    setLegacyText(null)
    onChange(formatHoursBlocks(next))
  }

  const updateBlock = (id: string, patch: Partial<HoursBlock>) => {
    emit(blocks.map(b => (b.id === id ? { ...b, ...patch } : b)))
  }

  const toggleDay = (id: string, day: Weekday) => {
    const block = blocks.find(b => b.id === id)
    if (!block) return
    const days = block.days.includes(day)
      ? block.days.filter(d => d !== day)
      : [...block.days, day].sort((a, b) => a - b)
    updateBlock(id, { days })
  }

  const addBlock = () => {
    emit([
      ...blocks,
      newHoursBlock(
        blocks.length === 0
          ? { days: [1, 2, 3, 4, 5], open: '13:00', close: '16:00' }
          : { days: [6, 7], open: '13:00', close: '23:00' },
      ),
    ])
  }

  const removeBlock = (id: string) => {
    emit(blocks.filter(b => b.id !== id))
  }

  const startEditing = () => {
    emit([newHoursBlock()])
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {legacyText && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-2.5 text-sm text-amber-900 dark:text-amber-100">
          <p className="mb-2">{t('hoursPicker.legacyLabel')} <span className="font-medium">{legacyText}</span></p>
          <button
            type="button"
            onClick={startEditing}
            className="text-xs font-medium text-[#129a93] hover:underline"
          >
            {t('hoursPicker.replaceWithPicker')}
          </button>
        </div>
      )}

      {blocks.map((block, index) => (
        <div
          key={block.id}
          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 p-3 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {t('hoursPicker.slotLabel').replace('{n}', String(index + 1))}
            </span>
            <button
              type="button"
              onClick={() => removeBlock(block.id)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              aria-label={t('hoursPicker.removeSlotAria')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{t('hoursPicker.daysLabel')}</p>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map(day => {
                const active = block.days.includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(block.id, day)}
                    className={`min-w-[2.5rem] px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      active
                        ? 'bg-[#129a93] text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-[#129a93]'
                    }`}
                  >
                    {WEEKDAY_LABELS[day]}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('hoursPicker.openLabel')}</label>
              <select
                value={block.open}
                onChange={e => updateBlock(block.id, { open: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#129a93] outline-none"
              >
                {TIME_OPTIONS.filter(t => t !== '24:00').map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('hoursPicker.closeLabel')}</label>
              <select
                value={block.close}
                onChange={e => updateBlock(block.id, { close: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-[#129a93] outline-none"
              >
                {TIME_OPTIONS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addBlock}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[#129a93] hover:underline"
      >
        <Plus className="w-4 h-4" />
        {blocks.length === 0 ? t('hoursPicker.addFirst') : t('hoursPicker.addAnother')}
      </button>

      {blocks.length > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t('hoursPicker.willSaveAs')}{' '}
          <span className="font-medium text-gray-700 dark:text-gray-200">
            {formatHoursBlocks(blocks) || '—'}
          </span>
        </p>
      )}
    </div>
  )
}
