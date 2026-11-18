import { ArrowLeft } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface Props {
  onNavigate: (page: string) => void
  returnTo?: string
}

interface Section { title: string; body: string[] }
interface Content { back: string; title: string; updated: string; intro: string; sections: Section[] }

const ES: Content = {
  back: 'Volver',
  title: 'Condiciones de reserva y reembolsos',
  updated: 'Última actualización: 4 de noviembre de 2026',
  intro: 'Estas condiciones explican qué pagas al reservar una plaza en una mesa de Table4Singles, cuándo puedes cancelar y cuándo se te devuelve el dinero.',
  sections: [
    { title: '1. Qué se paga al reservar', body: [
      'Reserva en una mesa normal: depósito de gestión de 2 € por plaza, IVA incluido.',
      'Cena con invitado especial: el precio total que ves antes de pagar, IVA incluido. Incluye el precio de la cena y la gestión de Table4Singles, que se desglosa en el momento del pago.',
      'Los pagos se procesan con Stripe. Table4Singles no almacena los datos de tu tarjeta.',
    ] },
    { title: '2. El depósito de 2 € no es reembolsable', body: [
      'El depósito de 2 € de las mesas normales es una tasa de gestión y no se devuelve si cancelas tu plaza ni si no te presentas.',
      'La única excepción es cuando la cancelación la provoca el restaurante (apartado 4).',
    ] },
    { title: '3. Cancelar tu plaza', body: [
      'Puedes cancelar tu plaza desde «Mis reservas» hasta el día anterior a la cena. Con menos de un día de antelación ya no es posible cancelar.',
      'Cena con invitado especial: si cancelas dentro de plazo, te devolvemos el importe completo que pagaste.',
      'Mesa normal: el depósito de 2 € no se devuelve (apartado 2).',
      'Si no te presentas a la cena, no hay reembolso.',
    ] },
    { title: '4. Si cancela el restaurante', body: [
      'Si el restaurante cancela la mesa o te retira de ella, te devolvemos todo lo que hayas pagado, tanto en mesas normales como en cenas especiales, porque no es responsabilidad tuya.',
      'Te avisaremos dentro de la app.',
    ] },
    { title: '5. Cómo y cuándo se devuelve el dinero', body: [
      'Los reembolsos se hacen al mismo método de pago que usaste. Los ordenamos de inmediato, pero tu banco puede tardar varios días hábiles en reflejarlos.',
      'Si un reembolso automático fallara, lo gestionamos manualmente y te lo devolvemos igualmente.',
    ] },
    { title: '6. Derecho de desistimiento', body: [
      'La reserva de una cena es un servicio de ocio con una fecha concreta de ejecución, por lo que no se aplica el derecho de desistimiento de 14 días previsto para contratos a distancia, conforme al artículo 103 del Real Decreto Legislativo 1/2007. Esto no afecta a los derechos de reembolso descritos arriba.',
    ] },
    { title: '7. Contacto', body: [
      'Para cualquier duda sobre un cobro o un reembolso escribe a info@table4singles.online.',
    ] },
  ],
}

const EN: Content = {
  back: 'Back',
  title: 'Booking and refund terms',
  updated: 'Last updated: 4 November 2026',
  intro: 'These terms explain what you pay when you book a seat at a Table4Singles table, when you can cancel and when your money is refunded.',
  sections: [
    { title: '1. What you pay when booking', body: [
      'Regular table: a €2 management deposit per seat, VAT included.',
      'Special guest dinner: the total price you see before paying, VAT included. It covers the dinner price and Table4Singles’ service fee, shown separately at checkout.',
      'Payments are processed by Stripe. Table4Singles does not store your card details.',
    ] },
    { title: '2. The €2 deposit is non-refundable', body: [
      'The €2 deposit on regular tables is a management fee. It is not refunded if you cancel your seat or do not show up.',
      'The only exception is when the cancellation is caused by the restaurant (section 4).',
    ] },
    { title: '3. Cancelling your seat', body: [
      'You can cancel your seat from “My bookings” up to the day before the dinner. With less than one day’s notice you can no longer cancel.',
      'Special guest dinner: if you cancel in time, we refund the full amount you paid.',
      'Regular table: the €2 deposit is not refunded (section 2).',
      'If you do not show up to the dinner, there is no refund.',
    ] },
    { title: '4. If the restaurant cancels', body: [
      'If the restaurant cancels the table or removes you from it, we refund everything you paid, on both regular tables and special dinners, because it is not your responsibility.',
      'We will notify you in the app.',
    ] },
    { title: '5. How and when refunds are paid', body: [
      'Refunds go back to the payment method you used. We order them immediately, but your bank may take several business days to show them.',
      'If an automatic refund fails, we handle it manually and still refund you.',
    ] },
    { title: '6. Right of withdrawal', body: [
      'Booking a dinner is a leisure service with a specific date of performance, so the 14-day right of withdrawal for distance contracts does not apply, in accordance with article 103 of Spanish Royal Legislative Decree 1/2007. This does not affect the refund rights described above.',
    ] },
    { title: '7. Contact', body: [
      'For any question about a charge or a refund, write to info@table4singles.online.',
    ] },
  ],
}

export function ReservationTermsPage({ onNavigate, returnTo = 'landing' }: Props) {
  const { language } = useLanguage()
  const c = language === 'es' ? ES : EN
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <button onClick={() => onNavigate(returnTo)} className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6">
          <ArrowLeft className="w-4 h-4" /> {c.back}
        </button>
        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white border-b-2 border-primary-500 pb-3 mb-2">{c.title}</h1>
        <p className="text-sm text-gray-400 mb-6">{c.updated}</p>
        <div className="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
          <p>{c.intro}</p>
          {c.sections.map(s => (
            <section key={s.title}>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-2">{s.title}</h2>
              <ul className="list-disc pl-6 space-y-1">
                {s.body.map(p => <li key={p}>{p}</li>)}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
