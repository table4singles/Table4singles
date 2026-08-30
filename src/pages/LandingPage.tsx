import { useState } from 'react'
import { Globe, Heart, UtensilsCrossed, Wine, Users, ArrowRight, MessageCircleOff, UsersRound, MapPinned, ChevronDown } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { Navbar } from '@/components/Navbar'

interface LandingPageProps {
  onNavigate: (page: string, id?: string) => void
  onAuthClick: (mode?: 'signin' | 'signup') => void
}

export function LandingPage({ onNavigate, onAuthClick }: LandingPageProps) {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen">
      <Navbar currentPage="landing" onNavigate={onNavigate} onAuthClick={onAuthClick} />

      {/* Hero — full-bleed photo */}
      <section className="relative overflow-hidden text-white">
        <img src="/hero-dinner.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-sky-600/90 via-sky-500/80 to-orange-400/85" />
        <div className="absolute -top-24 -left-16 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-orange-100 dark:from-gray-900 to-transparent" />

        <div className="relative max-w-5xl mx-auto px-4 pt-24 pb-28 md:pt-32 md:pb-36 text-center">
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 leading-tight whitespace-pre-line drop-shadow-sm">
            {t('landing.hero.title')}
          </h1>
          <p className="text-lg md:text-xl text-white/95 max-w-2xl mx-auto mb-10">
            {t('landing.hero.description')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button
              onClick={() => onNavigate('browse')}
              className="px-8 py-3.5 bg-white text-gray-900 hover:bg-gray-100 rounded-full font-bold text-lg shadow-e3 hover:shadow-e4 hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              {t('landing.hero.browseTables')} <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => onAuthClick('signup')}
              className="px-8 py-3.5 bg-slate-900/70 backdrop-blur text-white hover:bg-slate-900/90 rounded-full font-medium text-lg transition-colors"
            >
              {t('landing.hero.createTable')}
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-white/90">
            <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" /> {t('landing.facts.langs')}</span>
            <span className="flex items-center gap-1.5"><MapPinned className="w-4 h-4" /> {t('landing.facts.restaurants')}</span>
            <span className="flex items-center gap-1.5"><MessageCircleOff className="w-4 h-4" /> {t('landing.facts.noMatch')}</span>
          </div>
        </div>
      </section>

      {/* WHY US — differentiation */}
      <section className="relative py-20 bg-gradient-to-b from-orange-100 via-rose-50 to-sky-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <span className="inline-flex items-center text-xs font-bold tracking-[0.16em] uppercase text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900/30 rounded-full px-4 py-1.5 mb-6">
            {t('landing.whyUs.eyebrow')}
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">{t('landing.whyUs.title')}</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto mb-14">{t('landing.whyUs.subtitle')}</p>

          <div className="grid md:grid-cols-3 gap-6">
            <WhyCard icon={<MessageCircleOff className="w-6 h-6" />} title={t('landing.whyUs.point1Title')} desc={t('landing.whyUs.point1Desc')} />
            <WhyCard icon={<UsersRound className="w-6 h-6" />} title={t('landing.whyUs.point2Title')} desc={t('landing.whyUs.point2Desc')} />
            <WhyCard icon={<MapPinned className="w-6 h-6" />} title={t('landing.whyUs.point3Title')} desc={t('landing.whyUs.point3Desc')} />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gradient-to-b from-sky-100 via-teal-50 to-rose-50 dark:bg-gray-800">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl italic text-gray-900 dark:text-white mb-3">{t('landing.howItWorks.title')}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-14">{t('landing.howItWorks.subtitle')}</p>
          <div className="grid md:grid-cols-3 gap-10">
            <StepCard
              icon={<Globe className="w-7 h-7 text-white" />}
              bg="bg-emerald-400"
              number={1}
              title={t('landing.step1.title')}
              desc={t('landing.step1.desc')}
            />
            <StepCard
              icon={<Heart className="w-7 h-7 text-white" />}
              bg="bg-rose-400"
              number={2}
              title={t('landing.step2.title')}
              desc={t('landing.step2.desc')}
            />
            <StepCard
              icon={<UtensilsCrossed className="w-7 h-7 text-white" />}
              bg="bg-red-400"
              number={3}
              title={t('landing.step3.title')}
              desc={t('landing.step3.desc')}
            />
          </div>
        </div>
      </section>

      {/* Mediterranean section */}
      <section className="relative text-white overflow-hidden">
        <img
          src="/hero-flyer-default.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative max-w-3xl mx-auto px-4 py-24 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center"><Wine className="w-5 h-5 text-white" /></span>
            <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-gray-800/50" />
            <span className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center"><Users className="w-5 h-5 text-white" /></span>
            <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-gray-800/50" />
            <span className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center"><Heart className="w-5 h-5 text-white" /></span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">{t('landing.sunset.title')}</h2>
          <p className="text-lg text-white/80 max-w-xl mx-auto mb-8">{t('landing.sunset.desc')}</p>
          <div className="flex items-center justify-center -space-x-3 mb-8">
            <span className="w-11 h-11 rounded-full bg-orange-400 border-2 border-white flex items-center justify-center font-bold text-white text-sm">M</span>
            <span className="w-11 h-11 rounded-full bg-pink-400 border-2 border-white flex items-center justify-center font-bold text-white text-sm">L</span>
            <span className="w-11 h-11 rounded-full bg-teal-400 border-2 border-white flex items-center justify-center font-bold text-white text-sm">J</span>
          </div>
          <button
            onClick={() => onNavigate('browse')}
            className="px-8 py-3.5 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full font-medium text-lg transition-colors inline-flex items-center gap-2"
          >
            {t('landing.sunset.button')} <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-gradient-to-b from-rose-50 via-orange-50 to-sky-100 dark:bg-gray-900">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">{t('landing.faq.title')}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">{t('landing.faq.subtitle')}</p>
          </div>
          <div className="space-y-3">
            <FaqItem q={t('landing.faq.q1')} a={t('landing.faq.a1')} />
            <FaqItem q={t('landing.faq.q2')} a={t('landing.faq.a2')} />
            <FaqItem q={t('landing.faq.q3')} a={t('landing.faq.a3')} />
            <FaqItem q={t('landing.faq.q4')} a={t('landing.faq.a4')} />
            <FaqItem q={t('landing.faq.q5')} a={t('landing.faq.a5')} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 bg-gradient-to-br from-sky-500 via-sky-400 to-orange-400 text-white text-center overflow-hidden">
        <div className="absolute -bottom-20 -right-16 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="relative max-w-3xl mx-auto px-4">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">{t('landing.cta.title')}</h2>
          <p className="text-lg text-white/90 mb-8">{t('landing.cta.desc')}</p>
          <button
            onClick={() => onAuthClick('signup')}
            className="px-8 py-3.5 bg-white text-gray-800 hover:bg-gray-100 rounded-full font-semibold text-lg shadow-e3 hover:shadow-e4 hover:-translate-y-0.5 transition-all inline-flex items-center gap-2"
          >
            {t('landing.cta.button')} <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-slate-800">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-white">
              <img src="/icons/logo-icon.png" alt="" className="h-8 w-8 rounded-xl" />
              <span className="font-semibold text-lg">Table4Singles</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-400 dark:text-gray-500">
              <button onClick={() => onNavigate('aviso-legal')} className="hover:text-white transition-colors">{t('landing.footer.legal')}</button>
              <span className="text-gray-600 dark:text-gray-300">|</span>
              <button onClick={() => onNavigate('politica-privacidad')} className="hover:text-white transition-colors">{t('landing.footer.privacy')}</button>
            </div>
          </div>
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm">{t('landing.footer.tagline')}</p>
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

function WhyCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-2xl shadow-e3 p-6 text-left hover:-translate-y-0.5 transition-transform">
      <span className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-4">
        {icon}
      </span>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white/80 dark:bg-gray-800 rounded-2xl shadow-e2 border border-white/60 dark:border-gray-700 overflow-hidden backdrop-blur">
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
