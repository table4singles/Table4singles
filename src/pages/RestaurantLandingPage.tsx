import { useState } from 'react'
import {
  Clock, Megaphone, CalendarCheck, Ban, UserPlus, CalendarPlus, Users,
  ArrowRight, Sparkles, TrendingDown, ChevronDown, Euro, ShieldCheck, Smartphone,
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'

interface RestaurantLandingPageProps {
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

export function RestaurantLandingPage({ onNavigate, onAuthClick }: RestaurantLandingPageProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar currentPage="restaurant-landing" onNavigate={onNavigate} onAuthClick={onAuthClick} />

      {/* HERO — full-bleed photo + gradient */}
      <section className="relative overflow-hidden text-white">
        <img src="/hero-dinner.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-700/92 via-violet-600/85 to-amber-500/80" />
        <div className="absolute -top-24 -right-16 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white dark:from-gray-900 to-transparent" />

        <div className="relative max-w-4xl mx-auto px-4 pt-20 pb-28 md:pt-28 md:pb-36 text-center">
          <p className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.18em] uppercase bg-white/15 border border-white/25 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Para restaurantes
          </p>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 leading-[1.1] drop-shadow-sm">
            Tus mesas vacías,<br />llenas de gente nueva
          </h1>
          <p className="text-lg md:text-xl text-white/95 max-w-2xl mx-auto mb-10 leading-relaxed">
            Cada noche que una mesa se queda vacía es dinero que no vuelve. Table4Singles la llena con solteros que buscan justo eso: un plan y compañía. Tú publicas cuándo te interesa, nosotros traemos a la gente.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button
              onClick={() => onAuthClick('signup')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 hover:bg-gray-100 rounded-full font-bold text-lg shadow-e3 hover:shadow-e4 hover:-translate-y-0.5 transition-all"
            >
              Registra tu restaurante gratis <ArrowRight className="w-5 h-5" />
            </button>
            <a href="#como-funciona" className="text-white/90 font-semibold hover:text-white underline underline-offset-4">
              Ver cómo funciona
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-white/90">
            <span className="flex items-center gap-1.5"><Euro className="w-4 h-4" /> 3 meses por el precio de 1</span>
            <span className="flex items-center gap-1.5"><Ban className="w-4 h-4" /> Sin permanencia</span>
            <span className="flex items-center gap-1.5"><Smartphone className="w-4 h-4" /> Listo en 2 minutos</span>
          </div>
        </div>
      </section>

      {/* PROBLEMA → SOLUCIÓN */}
      <section className="relative py-20 bg-gradient-to-b from-white via-indigo-50/60 to-amber-50/40 dark:from-gray-900 dark:via-indigo-950/20 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.16em] uppercase text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 rounded-full px-4 py-1.5 mb-6">
            <TrendingDown className="w-3.5 h-3.5" /> El problema de siempre
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-5 leading-tight">
            Un martes a las 21h, la mitad de tu sala está vacía
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
            No es falta de buena comida — es que llenar las horas valle con publicidad tradicional cuesta dinero y no siempre funciona. Table4Singles resuelve justo eso: te trae comensales interesados en cenar acompañados, en las mesas y horarios que tú elijas publicar, sin gastar en anuncios.
          </p>
        </div>
      </section>

      {/* HOW IT WORKS — alternating rows */}
      <section id="como-funciona" className="py-20 bg-white dark:bg-gray-800 scroll-mt-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-4xl italic text-gray-900 dark:text-white mb-3">Así de simple</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Tres pasos, sin gestión añadida para tu equipo</p>
          </div>

          <div className="space-y-14">
            <StepRow
              number={1}
              icon={<UserPlus className="w-7 h-7 text-white" />}
              bg="from-indigo-500 to-indigo-600"
              title="Regístrate en 2 minutos"
              desc="Nombre, dirección y tipo de cocina. Sin papeleo, sin llamadas comerciales, sin compromiso inicial."
            />
            <StepRow
              number={2}
              icon={<CalendarPlus className="w-7 h-7 text-white" />}
              bg="from-violet-500 to-violet-600"
              title="Publica una mesa cuando te interese"
              desc="Eliges fecha, hora y plazas disponibles. Solo los días que tú decidas — nada se publica en automático. Menos de un minuto."
              reverse
            />
            <StepRow
              number={3}
              icon={<Users className="w-7 h-7 text-white" />}
              bg="from-amber-500 to-orange-500"
              title="Recibe comensales en tu agenda"
              desc="Los solteros que reservan aparecen al instante en tu panel, en tiempo real, listos para su mesa."
            />
          </div>
        </div>
      </section>

      {/* BENEFITS — photo backdrop */}
      <section className="relative py-24 overflow-hidden">
        <img src="/hero-flyer-default.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/85 via-gray-900/80 to-gray-900/90" />
        <div className="relative max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-3">Por qué unirte</h2>
            <p className="text-white/80 text-lg">Pensado para no dar trabajo extra a tu restaurante</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <BenefitCard icon={<Clock className="w-5 h-5" />} title="Llena horas valle" desc="Publica mesas justo en los tramos donde más te interesa tener ocupación." />
            <BenefitCard icon={<Megaphone className="w-5 h-5" />} title="Cero coste de publicidad" desc="Exposición ante clientela nueva sin invertir un euro en anuncios." />
            <BenefitCard icon={<CalendarCheck className="w-5 h-5" />} title="Tú decides cuándo" desc="Publicas mesas solo los días que te interesa. Nada automático ni forzado." />
            <BenefitCard icon={<Ban className="w-5 h-5" />} title="Sin permanencia" desc="Cancela tu suscripción cuando quieras, sin penalización." />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gradient-to-b from-amber-50/40 via-indigo-50/40 to-white dark:from-gray-900 dark:via-indigo-950/20 dark:to-gray-900">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">Todo lo que necesitas saber</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Las dudas más habituales, resueltas</p>
          </div>
          <div className="space-y-3">
            <FaqItem q="¿Cuánto cuesta exactamente?" a="10€/mes, sin coste de configuración. Con la oferta de lanzamiento, tu primer pago de 10€ cubre los tres primeros meses." />
            <FaqItem q="¿Tengo que ofrecer descuentos en la carta?" a="No. Tu carta y tus precios siguen siendo los de siempre — Table4Singles solo te trae comensales a las mesas que tú decides publicar." />
            <FaqItem q="¿Qué pasa si no se apunta nadie a una mesa?" a="No pierdes nada. Solo pagas la suscripción mensual fija, no hay coste por mesa publicada ni penalización si alguna no se llena." />
            <FaqItem q="¿Puedo cancelar cuando quiera?" a="Sí, sin permanencia ni penalización. Cancelas desde tu panel en cualquier momento." />
            <FaqItem q="¿Necesito instalar algo o formar a mi equipo?" a="No. Publicas la mesa desde el móvil en un minuto y las reservas te llegan directamente a tu panel — nada que instalar en el restaurante." />
          </div>
        </div>
      </section>

      {/* OFFER / FINAL CTA */}
      <section className="relative py-20 bg-gradient-to-br from-indigo-600 via-violet-500 to-amber-400 text-white text-center overflow-hidden">
        <div className="absolute -bottom-20 -left-16 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="relative max-w-2xl mx-auto px-4">
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.16em] uppercase bg-white/15 border border-white/25 rounded-full px-4 py-1.5 mb-6">
            <ShieldCheck className="w-3.5 h-3.5" /> Oferta de lanzamiento
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">3 meses por el precio de 1</h2>
          <p className="text-lg text-white/90 mb-8">
            Precio normal: 10€/mes. Con la oferta de lanzamiento, tu primer pago cubre los tres primeros meses.
          </p>
          <button
            onClick={() => onAuthClick('signup')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 hover:bg-gray-100 rounded-full font-bold text-lg shadow-e3 hover:shadow-e4 hover:-translate-y-0.5 transition-all"
          >
            Registra tu restaurante gratis <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-900 dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <p className="text-gray-400 text-sm">
            ¿Ya tienes cuenta?{' '}
            <button onClick={() => onAuthClick('signin')} className="text-white font-medium hover:underline">Inicia sesión</button>
          </p>
        </div>
      </footer>
    </div>
  )
}

function StepRow({ number, icon, bg, title, desc, reverse }: { number: number; icon: React.ReactNode; bg: string; title: string; desc: string; reverse?: boolean }) {
  return (
    <div className={`flex items-center gap-8 md:gap-14 ${reverse ? 'md:flex-row-reverse' : ''}`}>
      <div className={`flex-shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br ${bg} shadow-e3 flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <span className="text-xs font-bold tracking-[0.16em] uppercase text-gray-400 dark:text-gray-500">Paso {number}</span>
        <h3 className="font-display font-semibold text-xl md:text-2xl text-gray-900 dark:text-white mt-1 mb-2">{title}</h3>
        <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function BenefitCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 bg-white/95 dark:bg-gray-800/95 backdrop-blur rounded-2xl shadow-e3 p-5 hover:-translate-y-0.5 transition-transform">
      <span className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
        {icon}
      </span>
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>
      </div>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-e2 border border-gray-100 dark:border-gray-700 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-semibold text-gray-900 dark:text-white">{q}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <p className="px-5 pb-4 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{a}</p>
      )}
    </div>
  )
}
