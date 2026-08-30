import { Clock, Megaphone, CalendarCheck, Ban, UserPlus, CalendarPlus, Users, ArrowRight, Sparkles } from 'lucide-react'
import { Navbar } from '@/components/Navbar'

interface RestaurantLandingPageProps {
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

export function RestaurantLandingPage({ onNavigate, onAuthClick }: RestaurantLandingPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar currentPage="restaurant-landing" onNavigate={onNavigate} onAuthClick={onAuthClick} />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-500 to-amber-400 text-white">
        <div className="absolute -top-24 -right-16 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-4 py-20 md:py-28 text-center">
          <p className="text-xs font-bold tracking-[0.18em] uppercase text-white/80 mb-5">Para restaurantes</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Llena tus mesas vacías<br className="hidden md:block" /> con clientela nueva
          </h1>
          <p className="text-lg text-white/90 max-w-xl mx-auto mb-10">
            Table4Singles conecta a solteros que buscan cenar acompañados con restaurantes como el tuyo. Publica una mesa cuando tengas hueco — el resto lo hacemos nosotros.
          </p>

          <div className="inline-flex flex-col items-center gap-1 bg-white/15 backdrop-blur border border-white/25 rounded-2xl px-6 py-4 mb-10">
            <span className="inline-flex items-center gap-2 text-sm font-bold">
              <Sparkles className="w-4 h-4" /> Oferta de lanzamiento
            </span>
            <span className="font-display text-2xl font-bold">3 meses por el precio de 1</span>
            <span className="text-xs text-white/80">10€/mes después · sin permanencia</span>
          </div>

          <div>
            <button
              onClick={() => onAuthClick('signup')}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-gray-900 hover:bg-gray-100 rounded-full font-semibold text-lg transition-colors"
            >
              Registra tu restaurante gratis <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl italic text-gray-900 dark:text-white mb-3">Así de simple</h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-14">Tres pasos, sin gestión añadida para tu equipo</p>
          <div className="grid md:grid-cols-3 gap-10">
            <StepCard
              icon={<UserPlus className="w-7 h-7 text-white" />}
              bg="bg-indigo-500"
              number={1}
              title="Regístrate en 2 minutos"
              desc="Nombre, dirección y tipo de cocina. Sin papeleo ni compromiso inicial."
            />
            <StepCard
              icon={<CalendarPlus className="w-7 h-7 text-white" />}
              bg="bg-violet-500"
              number={2}
              title="Publica una mesa"
              desc="Eliges fecha, hora y plazas cuando te interese. Menos de un minuto."
            />
            <StepCard
              icon={<Users className="w-7 h-7 text-white" />}
              bg="bg-amber-500"
              number={3}
              title="Recibe comensales"
              desc="Solteros verificados reservan y aparecen en tu agenda en tiempo real."
            />
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">Por qué unirte</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">Pensado para no dar trabajo extra a tu restaurante</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-5">
            <BenefitCard icon={<Clock className="w-5 h-5" />} title="Llena horas valle" desc="Publica mesas justo en los tramos donde más te interesa tener ocupación." />
            <BenefitCard icon={<Megaphone className="w-5 h-5" />} title="Cero coste de publicidad" desc="Exposición ante clientela nueva sin invertir en anuncios." />
            <BenefitCard icon={<CalendarCheck className="w-5 h-5" />} title="Tú decides cuándo" desc="Publicas mesas solo los días que te interesa. Nada automático ni forzado." />
            <BenefitCard icon={<Ban className="w-5 h-5" />} title="Sin permanencia" desc="Cancela tu suscripción cuando quieras, sin penalización." />
          </div>
        </div>
      </section>

      {/* Offer repeat / final CTA */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 via-violet-500 to-amber-400 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">3 meses por el precio de 1</h2>
          <p className="text-lg text-white/90 mb-8">
            Precio normal: 10€/mes. Con la oferta de lanzamiento, tu primer pago cubre los tres primeros meses.
          </p>
          <button
            onClick={() => onAuthClick('signup')}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-gray-900 hover:bg-gray-100 rounded-full font-semibold text-lg transition-colors"
          >
            Registra tu restaurante gratis <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-800 dark:bg-gray-950">
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

function StepCard({ icon, bg, number, title, desc }: { icon: React.ReactNode; bg: string; number: number; title: string; desc: string }) {
  return (
    <div className="text-center">
      <div className={`w-14 h-14 ${bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
        {icon}
      </div>
      <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">{number}. {title}</h3>
      <p className="text-gray-500 dark:text-gray-400">{desc}</p>
    </div>
  )
}

function BenefitCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-4 bg-white dark:bg-gray-800 rounded-2xl shadow-e2 border border-gray-100 dark:border-gray-700 p-5">
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
