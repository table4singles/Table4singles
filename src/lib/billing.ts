// Cobro a restaurantes en pausa: los 3 primeros meses son gratis y no se muestra ningún pago.
// Poner a true para volver a mostrar suscripción, avisos y página de pago a todos los restaurantes.
// Los restaurantes que ya tienen una suscripción en Stripe la siguen viendo y gestionando.
export const BILLING_ENABLED = false

export const showBilling = (status?: string | null) => BILLING_ENABLED || !!status
