import QRCode from 'qrcode'

/** URL de destino codificada en el QR de cada restaurante — lleva directo a su perfil público. */
export function flyerQrTargetUrl(restaurantId: string): string {
  return `${window.location.origin}/?qr=${restaurantId}`
}

/** Genera el QR como data URL PNG, único por restaurante, para poder atribuir escaneos. */
export function generateFlyerQrDataUrl(restaurantId: string): Promise<string> {
  return QRCode.toDataURL(flyerQrTargetUrl(restaurantId), {
    width: 600,
    margin: 1,
    color: { dark: '#0f172a', light: '#ffffff' },
  })
}
