/** Días ISO: 1=Lun … 7=Dom */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7

export interface HoursBlock {
  id: string
  days: Weekday[]
  open: string // HH:MM
  close: string // HH:MM
}

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
  6: 'Sáb',
  7: 'Dom',
}

export const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 7]

const DAY_ALIASES: Record<string, Weekday> = {
  lun: 1, lunes: 1, mon: 1, monday: 1,
  mar: 2, martes: 2, tue: 2, tuesday: 2,
  mie: 3, mié: 3, miercoles: 3, miércoles: 3, wed: 3, wednesday: 3,
  jue: 4, jueves: 4, thu: 4, thursday: 4,
  vie: 5, viernes: 5, fri: 5, friday: 5,
  sab: 6, sáb: 6, sabado: 6, sábado: 6, sat: 6, saturday: 6,
  dom: 7, domingo: 7, sun: 7, sunday: 7,
}

/** Opciones de hora cada 30 min (00:00–23:30) + 24:00 para cierre. */
export function buildTimeOptions(includeMidnightClose = true): string[] {
  const opts: string[] = []
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      opts.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }
  if (includeMidnightClose) opts.push('24:00')
  return opts
}

export function newHoursBlock(partial?: Partial<Omit<HoursBlock, 'id'>>): HoursBlock {
  return {
    id: crypto.randomUUID(),
    days: partial?.days ?? [1, 2, 3, 4, 5],
    open: partial?.open ?? '13:00',
    close: partial?.close ?? '16:00',
  }
}

function formatDayRange(days: Weekday[]): string {
  const sorted = [...new Set(days)].sort((a, b) => a - b)
  if (sorted.length === 0) return ''
  if (sorted.length === 7) return 'Todos los días'

  const ranges: string[] = []
  let start = sorted[0]
  let prev = sorted[0]

  const flush = () => {
    if (start === prev) ranges.push(WEEKDAY_LABELS[start])
    else ranges.push(`${WEEKDAY_LABELS[start]}-${WEEKDAY_LABELS[prev]}`)
  }

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === prev + 1) {
      prev = sorted[i]
    } else {
      flush()
      start = sorted[i]
      prev = sorted[i]
    }
  }
  flush()
  return ranges.join(', ')
}

/** Texto canónico para guardar en `restaurant_hours`. */
export function formatHoursBlocks(blocks: HoursBlock[]): string {
  const parts = blocks
    .filter(b => b.days.length > 0 && b.open && b.close)
    .map(b => `${formatDayRange(b.days)} ${b.open}-${b.close}`)
  return parts.join(' · ')
}

function parseDayToken(token: string): Weekday[] {
  const t = token.trim().toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
  if (!t) return []
  if (t.includes('todos')) return [...WEEKDAYS]

  // "lun-vie" / "lun–vie"
  const range = t.split(/[-–—]/)
  if (range.length === 2) {
    const a = DAY_ALIASES[range[0].trim()]
    const b = DAY_ALIASES[range[1].trim()]
    if (a && b && a <= b) {
      const days: Weekday[] = []
      for (let d = a; d <= b; d++) days.push(d as Weekday)
      return days
    }
  }

  const single = DAY_ALIASES[t]
  return single ? [single] : []
}

/**
 * Intenta parsear un string de horarios (nuestro formato o similar).
 * Si no se puede interpretar de forma fiable, devuelve [].
 */
export function parseHoursString(raw: string | null | undefined): HoursBlock[] {
  if (!raw?.trim()) return []

  const segments = raw
    .split(/[·;|]|(?:\s{2,})/)
    .map(s => s.trim())
    .filter(Boolean)

  const blocks: HoursBlock[] = []

  for (const seg of segments.length ? segments : [raw.trim()]) {
    // "Lun-Vie 13:00-16:00" o "Lun-Vie 13:00–16:00"
    const m = seg.match(/^(.+?)\s+(\d{1,2}:\d{2})\s*[-–—]\s*(\d{1,2}:\d{2})$/i)
    if (!m) continue

    const dayPart = m[1].trim()
    const open = normalizeTime(m[2])
    const close = normalizeTime(m[3])
    if (!open || !close) continue

    const days = dayPart
      .split(/[,/]/)
      .flatMap(parseDayToken)
      .filter((d, i, arr) => arr.indexOf(d) === i)
      .sort((a, b) => a - b) as Weekday[]

    if (days.length === 0) continue
    blocks.push({ id: crypto.randomUUID(), days, open, close })
  }

  return blocks
}

function normalizeTime(t: string): string | null {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h === 24 && min === 0) return '24:00'
  if (h < 0 || h > 23 || min < 0 || min > 59) return null
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
}
