export type FlyerFormatCategory = 'poster' | 'table'
export type FlyerOrientation = 'portrait' | 'landscape'

export interface FlyerFormat {
  id: string
  label: string
  hint: string
  category: FlyerFormatCategory
  orientation: FlyerOrientation
  widthMm: number
  heightMm: number
}

/** Resolución de impresión (300 DPI). */
export const FLYER_EXPORT_DPI = 300

export const FLYER_FORMATS: FlyerFormat[] = [
  {
    id: 'a3-portrait',
    label: 'A3 vertical',
    hint: 'Cartel grande · 297×420 mm',
    category: 'poster',
    orientation: 'portrait',
    widthMm: 297,
    heightMm: 420,
  },
  {
    id: 'a4-portrait',
    label: 'A4 vertical',
    hint: 'Cartel estándar · 210×297 mm',
    category: 'poster',
    orientation: 'portrait',
    widthMm: 210,
    heightMm: 297,
  },
  {
    id: 'a5-portrait',
    label: 'A5 vertical',
    hint: 'Cartel pequeño · 148×210 mm',
    category: 'poster',
    orientation: 'portrait',
    widthMm: 148,
    heightMm: 210,
  },
  {
    id: 'a4-landscape',
    label: 'A4 horizontal',
    hint: 'Cartel apaisado · 297×210 mm',
    category: 'poster',
    orientation: 'landscape',
    widthMm: 297,
    heightMm: 210,
  },
  {
    id: 'a5-landscape',
    label: 'A5 horizontal',
    hint: 'Cartel mesa apaisado · 210×148 mm',
    category: 'table',
    orientation: 'landscape',
    widthMm: 210,
    heightMm: 148,
  },
  {
    id: 'a6-portrait',
    label: 'A6 vertical',
    hint: 'Tarjeta de mesa · 105×148 mm',
    category: 'table',
    orientation: 'portrait',
    widthMm: 105,
    heightMm: 148,
  },
  {
    id: 'a6-landscape',
    label: 'A6 horizontal',
    hint: 'Mini cartel mesa · 148×105 mm',
    category: 'table',
    orientation: 'landscape',
    widthMm: 148,
    heightMm: 105,
  },
  {
    id: 'a7-portrait',
    label: 'A7 vertical',
    hint: 'Mini tarjeta · 74×105 mm',
    category: 'table',
    orientation: 'portrait',
    widthMm: 74,
    heightMm: 105,
  },
]

export const DEFAULT_FLYER_FORMAT_ID = 'a4-portrait'

export function getFlyerFormat(id: string): FlyerFormat {
  return FLYER_FORMATS.find(f => f.id === id) ?? FLYER_FORMATS[1]
}

export function formatPixelSize(format: FlyerFormat, dpi = FLYER_EXPORT_DPI) {
  const mmToPx = (mm: number) => Math.round((mm / 25.4) * dpi)
  return {
    widthPx: mmToPx(format.widthMm),
    heightPx: mmToPx(format.heightMm),
  }
}

export function formatPrintPageSize(format: FlyerFormat): string {
  return `${format.widthMm}mm ${format.heightMm}mm`
}

export function slugifyFilename(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'restaurante'
}
