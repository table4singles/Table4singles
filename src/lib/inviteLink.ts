export function getTableInviteUrl(tableId: string) {
  return `${window.location.origin}/?invite=${tableId}`
}

export function openWhatsAppInvite(tableId: string, message: string) {
  const url = getTableInviteUrl(tableId)
  const text = `${message} ${url}`
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
}
