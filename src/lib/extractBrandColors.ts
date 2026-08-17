/** Extrae una paleta de marca a partir de la URL del logo del restaurante. */

export interface BrandPalette {
  primary: string
  primaryDark: string
  primaryLight: string
  primarySoft: string
  onPrimary: string
}

export const DEFAULT_BRAND: BrandPalette = {
  primary: '#0066cc',
  primaryDark: '#004d99',
  primaryLight: '#66a3e0',
  primarySoft: '#f0f7ff',
  onPrimary: '#ffffff',
}

type RGB = { r: number; g: number; b: number }

function rgbToHex({ r, g, b }: RGB): string {
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`
}

function luminance({ r, g, b }: RGB): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

function saturation({ r, g, b }: RGB): number {
  const max = Math.max(r, g, b) / 255
  const min = Math.min(r, g, b) / 255
  if (max === min) return 0
  const l = (max + min) / 2
  const d = max - min
  return l > 0.5 ? d / (2 - max - min) : d / (max + min)
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  }
}

function darken(c: RGB, amount: number): RGB {
  return mix(c, { r: 0, g: 0, b: 0 }, amount)
}

function lighten(c: RGB, amount: number): RGB {
  return mix(c, { r: 255, g: 255, b: 255 }, amount)
}

function quantize(v: number, step = 24): number {
  return Math.min(255, Math.round(v / step) * step)
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo cargar el logo'))
    img.src = url
  })
}

/**
 * Analiza el logo y devuelve colores de marca.
 * Ignora blancos, negros y grises; prioriza tonos saturados.
 */
export async function extractBrandColors(logoUrl: string | null | undefined): Promise<BrandPalette> {
  if (!logoUrl) return DEFAULT_BRAND

  try {
    const img = await loadImage(logoUrl)
    const size = 64
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return DEFAULT_BRAND

    ctx.drawImage(img, 0, 0, size, size)
    const { data } = ctx.getImageData(0, 0, size, size)

    const buckets = new Map<string, { count: number; color: RGB; score: number }>()

    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3]
      if (a < 128) continue

      const color: RGB = {
        r: quantize(data[i]),
        g: quantize(data[i + 1]),
        b: quantize(data[i + 2]),
      }

      const lum = luminance(color)
      const sat = saturation(color)

      // Saltar fondo blanco/negro/gris
      if (lum > 0.92 || lum < 0.08) continue
      if (sat < 0.18) continue

      const key = `${color.r},${color.g},${color.b}`
      const prev = buckets.get(key)
      // Peso: frecuencia × saturación (prioriza color de marca)
      const weight = 1 + sat * 2
      if (prev) {
        prev.count += weight
        prev.score = prev.count * (0.5 + sat)
      } else {
        buckets.set(key, { count: weight, color, score: weight * (0.5 + sat) })
      }
    }

    if (buckets.size === 0) return DEFAULT_BRAND

    const ranked = [...buckets.values()].sort((a, b) => b.score - a.score)
    const primary = ranked[0].color

    const palette: BrandPalette = {
      primary: rgbToHex(primary),
      primaryDark: rgbToHex(darken(primary, 0.18)),
      primaryLight: rgbToHex(lighten(primary, 0.45)),
      primarySoft: rgbToHex(lighten(primary, 0.88)),
      onPrimary: luminance(primary) > 0.62 ? '#1a1a2e' : '#ffffff',
    }

    return palette
  } catch {
    return DEFAULT_BRAND
  }
}
