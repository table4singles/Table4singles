import {
  type FlyerFormat,
  formatPixelSize,
  slugifyFilename,
} from '@/lib/flyerFormats'

const QR_TOP_RATIO = 0.405
const QR_WIDTH_RATIO = 0.22
const QR_PAD_RATIO = 0.014

interface DrawRect {
  x: number
  y: number
  width: number
  height: number
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('No se pudo cargar la imagen'))
    img.src = src
  })
}

function drawImageContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
): DrawRect {
  const imgAspect = img.naturalWidth / img.naturalHeight
  const boxAspect = boxW / boxH
  let dw: number
  let dh: number
  let dx: number
  let dy: number

  if (imgAspect > boxAspect) {
    dw = boxW
    dh = boxW / imgAspect
    dx = boxX
    dy = boxY + (boxH - dh) / 2
  } else {
    dh = boxH
    dw = boxH * imgAspect
    dx = boxX + (boxW - dw) / 2
    dy = boxY
  }

  ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, dx, dy, dw, dh)
  return { x: dx, y: dy, width: dw, height: dh }
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

function drawQrOverlay(
  ctx: CanvasRenderingContext2D,
  qr: HTMLImageElement,
  rect: DrawRect,
) {
  const qrW = rect.width * QR_WIDTH_RATIO
  const qrH = qrW
  const qrX = rect.x + (rect.width - qrW) / 2
  const qrY = rect.y + rect.height * QR_TOP_RATIO
  const pad = rect.width * QR_PAD_RATIO
  const bgX = qrX - pad
  const bgY = qrY - pad
  const bgW = qrW + pad * 2
  const bgH = qrH + pad * 2

  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.18)'
  ctx.shadowBlur = Math.max(4, rect.width * 0.012)
  ctx.shadowOffsetY = Math.max(2, rect.width * 0.004)
  roundRectPath(ctx, bgX, bgY, bgW, bgH, qrW * 0.06)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.restore()

  ctx.drawImage(qr, qrX, qrY, qrW, qrH)
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export interface ExportFlyerOptions {
  flyerImageUrl: string
  qrImageUrl: string
  format: FlyerFormat
  restaurantName: string
}

/** Compone flyer IA + QR real y descarga PNG listo para imprimir. */
export async function downloadFlyerPng(options: ExportFlyerOptions): Promise<void> {
  const { flyerImageUrl, qrImageUrl, format, restaurantName } = options
  const { widthPx, heightPx } = formatPixelSize(format)

  const [flyer, qr] = await Promise.all([
    loadImage(flyerImageUrl),
    loadImage(qrImageUrl),
  ])

  const canvas = document.createElement('canvas')
  canvas.width = widthPx
  canvas.height = heightPx
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas no disponible')

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, widthPx, heightPx)

  const drawRect = drawImageContain(ctx, flyer, 0, 0, widthPx, heightPx)
  drawQrOverlay(ctx, qr, drawRect)

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      b => (b ? resolve(b) : reject(new Error('Error al exportar PNG'))),
      'image/png',
    )
  })

  const slug = slugifyFilename(restaurantName)
  triggerDownload(blob, `flyer-${slug}-${format.id}.png`)
}
