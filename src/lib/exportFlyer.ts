import html2canvas from 'html2canvas'
import { type FlyerFormat, formatPixelSize, slugifyFilename } from '@/lib/flyerFormats'

export interface ExportFlyerOptions {
  flyerElement: HTMLElement
  format: FlyerFormat
  restaurantName: string
}

/** Captura el flyer visible (textos/QR reales) al tamaño de impresión 300 DPI. */
export async function downloadFlyerPng(options: ExportFlyerOptions): Promise<void> {
  const { flyerElement, format, restaurantName } = options
  const { widthPx, heightPx } = formatPixelSize(format)
  const rect = flyerElement.getBoundingClientRect()
  if (rect.width < 8 || rect.height < 8) throw new Error('No se pudo medir el flyer')

  const scale = Math.max(widthPx / rect.width, heightPx / rect.height)
  const captured = await html2canvas(flyerElement, {
    scale,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    logging: false,
  })

  const canvas = document.createElement('canvas')
  canvas.width = widthPx
  canvas.height = heightPx
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas no disponible')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, widthPx, heightPx)

  const cover = Math.max(widthPx / captured.width, heightPx / captured.height)
  const dw = captured.width * cover
  const dh = captured.height * cover
  ctx.drawImage(captured, (widthPx - dw) / 2, (heightPx - dh) / 2, dw, dh)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Error al exportar PNG'))), 'image/png')
  })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `flyer-${slugifyFilename(restaurantName)}-${format.id}.png`
  a.click()
  URL.revokeObjectURL(url)
}
