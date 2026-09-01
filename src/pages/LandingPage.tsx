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
    <div className="min-h-screen bg-navy-950">
      <Navbar currentPage="landing" onNavigate={onNavigate} onAuthClick={onAuthClick} />

      {/* Hero — full-bleed photo */}
      <section className="relative overflow-hidden text-white">
        <img src="/hero-dinner.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-navy-950/75 to-primary-950/70" />
        <div className="absolute -top-24 -left-16 w-96 h-96 rounded-full bg-gold-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-navy-950 to-transparent" />

        <div className="relative max-w-5xl mx-auto px-4 pt-24 pb-28 md:pt-32 md:pb-36 text-center">
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 leading-tight whitespace-pre-line drop-shadow-sm">
            {t('landing.hero.title')}
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10">
            {t('landing.hero.description')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button
              onClick={() => onNavigate('browse')}
              className="px-8 py-3.5 bg-gradient-to-r from-gold-300 to-gold-500 text-navy-900 hover:from-gold-200 hover:to-gold-400 rounded-full font-bold text-lg shadow-glow-gold hover:-translate-y-0.5 transition-all flex items-center gap-2"
            >
              {t('landing.hero.browseTables')} <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => onAuthClick('signup')}
              className="px-8 py-3.5 bg-white/10 backdrop-blur border border-white/20 text-white hover:bg-white/20 rounded-full font-medium text-lg transition-colors"
            >
              {t('landing.hero.createTable')}
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm font-medium text-white/80">
            <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-gold-400" /> {t('landing.facts.langs')}</span>
            <span className="flex items-center gap-1.5"><MapPinned className="w-4 h-4 text-gold-400" /> {t('landing.facts.restaurants')}</span>
            <span className="flex items-center gap-1.5"><MessageCircleOff className="w-4 h-4 text-gold-400" /> {t('landing.facts.noMatch')}</span>
          </div>
        </div>
      </section>

      {/* WHY US — differentiation */}
      <section className="relative py-20 bg-navy-950">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <span className="inline-flex items-center text-xs font-bold tracking-[0.16em] uppercase text-gold-300 bg-gold-400/10 border border-gold-400/25 rounded-full px-4 py-1.5 mb-6">
            {t('landing.whyUs.eyebrow')}
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">{t('landing.whyUs.title')}</h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto mb-14">{t('landing.whyUs.subtitle')}</p>

          <div className="grid md:grid-cols-3 gap-6">
            <WhyCard icon={<MessageCircleOff className="w-6 h-6" />} title={t('landing.whyUs.point1Title')} desc={t('landing.whyUs.point1Desc')} />
            <WhyCard icon={<UsersRound className="w-6 h-6" />} title={t('landing.whyUs.point2Title')} desc={t('landing.whyUs.point2Desc')} />
            <WhyCard icon={<MapPinned className="w-6 h-6" />} title={t('landing.whyUs.point3Title')} desc={t('landing.whyUs.point3Desc')} />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-navy-900">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl italic text-white mb-3">{t('landing.howItWorks.title')}</h2>
          <p className="text-gray-400 text-lg mb-14">{t('landing.howItWorks.subtitle')}</p>
          <div className="grid md:grid-cols-3 gap-10">
            <StepCard
              icon={<Globe className="w-7 h-7 text-navy-900" />}
              number={1}
              title={t('landing.step1.title')}
              desc={t('landing.step1.desc')}
            />
            <StepCard
              icon={<Heart className="w-7 h-7 text-navy-900" />}
              number={2}
              title={t('landing.step2.title')}
              desc={t('landing.step2.desc')}
            />
            <StepCard
              icon={<UtensilsCrossed className="w-7 h-7 text-navy-900" />}
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
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/90 via-black/75 to-navy-950/90" />
        <div className="relative max-w-3xl mx-auto px-4 py-24 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="w-10 h-10 rounded-full bg-gold-400/15 border border-gold-400/40 flex items-center justify-center"><Wine className="w-5 h-5 text-gold-300" /></span>
            <span className="w-1.5 h-1.5 rounded-full bg-gold-500/40" />
            <span className="w-10 h-10 rounded-full bg-gold-400/15 border border-gold-400/40 flex items-center justify-center"><Users className="w-5 h-5 text-gold-300" /></span>
            <span className="w-1.5 h-1.5 rounded-full bg-gold-500/40" />
            <span className="w-10 h-10 rounded-full bg-gold-400/15 border border-gold-400/40 flex items-center justify-center"><Heart className="w-5 h-5 text-gold-300" /></span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 text-gold-100">{t('landing.sunset.title')}</h2>
          <p className="text-lg text-white/75 max-w-xl mx-auto mb-8">{t('landing.sunset.desc')}</p>
          <div className="flex items-center justify-center -space-x-3 mb-8">
            <span className="w-11 h-11 rounded-full bg-gold-500 border-2 border-navy-950 flex items-center justify-center font-bold text-navy-900 text-sm">M</span>
            <span className="w-11 h-11 rounded-full bg-gold-400 border-2 border-navy-950 flex items-center justify-center font-bold text-navy-900 text-sm">L</span>
            <span className="w-11 h-11 rounded-full bg-gold-300 border-2 border-navy-950 flex items-center justify-center font-bold text-navy-900 text-sm">J</span>
          </div>
          <button
            onClick={() => onNavigate('browse')}
            className="px-8 py-3.5 bg-gradient-to-r from-gold-300 to-gold-500 text-navy-900 hover:from-gold-200 hover:to-gold-400 rounded-full font-bold text-lg shadow-glow-gold transition-all inline-flex items-center gap-2"
          >
            {t('landing.sunset.button')} <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-navy-950">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-3">{t('landing.faq.title')}</h2>
            <p className="text-gray-400 text-lg">{t('landing.faq.subtitle')}</p>
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
      <section className="relative py-20 bg-gradient-to-br from-navy-950 via-navy-900 to-primary-950 text-white text-center overflow-hidden border-t border-gold-500/10">
        <div className="absolute -bottom-20 -right-16 w-80 h-80 rounded-full bg-gold-400/10 blur-3xl" />
        <div className="relative max-w-3xl mx-auto px-4">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4 text-gold-200">{t('landing.cta.title')}</h2>
          <p className="text-lg text-white/80 mb-8">{t('landing.cta.desc')}</p>
          <button
            onClick={() => onAuthClick('signup')}
            className="px-8 py-3.5 bg-gradient-to-r from-gold-300 to-gold-500 text-navy-900 hover:from-gold-200 hover:to-gold-400 rounded-full font-semibold text-lg shadow-glow-gold hover:-translate-y-0.5 transition-all inline-flex items-center gap-2"
          >
            {t('landing.cta.button')} <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-black">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-white">
              <img src="/icons/logo-icon.png" alt="" className="h-8 w-8 rounded-xl" />
              <span className="font-semibold text-lg">Table4Singles</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <button onClick={() => onNavigate('aviso-legal')} className="hover:text-gold-400 transition-colors">{t('landing.footer.legal')}</button>
              <span className="text-gray-700">|</span>
              <button onClick={() => onNavigate('politica-privacidad')} className="hover:text-gold-400 transition-colors">{t('landing.footer.privacy')}</button>
            </div>
          </div>
          <p className="text-center text-gray-500 text-sm">{t('landing.footer.tagline')}</p>
        </div>
      </footer>
    </div>
  )
}

function StepCard({ icon, number, title, desc }: { icon: React.ReactNode; number: number; title: string; desc: string }) {
  return (
    <div className="text-center">
      <div className="w-14 h-14 bg-gradient-to-br from-gold-300 to-gold-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-glow-gold">
        {icon}
      </div>
      <h3 className="font-semibold text-lg text-white mb-2">{number}. {title}</h3>
      <p className="text-gray-400">{desc}</p>
    </div>
  )
}

function WhyCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-navy-900/90 backdrop-blur rounded-2xl shadow-e3 border border-gold-500/15 p-6 text-left hover:-translate-y-0.5 hover:border-gold-500/30 transition-all">
      <span className="w-11 h-11 rounded-xl bg-gold-400/10 text-gold-400 flex items-center justify-center mb-4">
        {icon}
      </span>
      <h3 className="font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-navy-900 rounded-2xl shadow-e2 border border-gold-500/15 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-semibold text-white">{q}</span>
        <ChevronDown className={`w-4 h-4 text-gold-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <p className="px-5 pb-4 text-sm text-gray-400 leading-relaxed">{a}</p>
      )}
    </div>
  )
}
