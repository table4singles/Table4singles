import { Globe, Heart, UtensilsCrossed, Wine, Users, ArrowRight } from 'lucide-react'
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
      {/* Hero — clean gradient, no image */}
      <section className="bg-gradient-to-b from-sky-500 via-sky-400 to-orange-300 text-white">
        <div className="max-w-5xl mx-auto px-4 py-28 md:py-36 text-center">
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 leading-tight whitespace-pre-line">
            {t('landing.hero.title')}
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10">
            {t('landing.hero.description')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('browse')}
              className="px-8 py-3.5 bg-white text-gray-800 hover:bg-gray-100 rounded-full font-medium text-lg transition-colors flex items-center gap-2"
            >
              {t('landing.hero.browseTables')} <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => onAuthClick('signup')}
              className="px-8 py-3.5 bg-slate-800/70 backdrop-blur text-white hover:bg-slate-800/90 rounded-full font-medium text-lg transition-colors"
            >
              {t('landing.hero.createTable')}
            </button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl md:text-4xl italic text-gray-900 mb-3">{t('landing.howItWorks.title')}</h2>
          <p className="text-gray-500 text-lg mb-14">{t('landing.howItWorks.subtitle')}</p>
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
          src="https://images.pexels.com/photos/19721743/pexels-photo-19721743.jpeg?auto=compress&cs=tinysrgb&w=1200"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative max-w-3xl mx-auto px-4 py-24 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center"><Wine className="w-5 h-5 text-white" /></span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
            <span className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center"><Users className="w-5 h-5 text-white" /></span>
            <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
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
            className="px-8 py-3.5 bg-white text-gray-800 hover:bg-gray-100 rounded-full font-medium text-lg transition-colors inline-flex items-center gap-2"
          >
            {t('landing.sunset.button')} <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-cyan-600 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">{t('landing.cta.title')}</h2>
          <p className="text-lg text-white/90 mb-8">{t('landing.cta.desc')}</p>
          <button
            onClick={() => onAuthClick('signup')}
            className="px-8 py-3.5 bg-white text-gray-800 hover:bg-gray-100 rounded-full font-semibold text-lg transition-colors inline-flex items-center gap-2"
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
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <button onClick={() => onNavigate('aviso-legal')} className="hover:text-white transition-colors">{t('landing.footer.legal')}</button>
              <span className="text-gray-600">|</span>
              <button onClick={() => onNavigate('privacy')} className="hover:text-white transition-colors">{t('landing.footer.privacy')}</button>
            </div>
          </div>
          <p className="text-center text-gray-500 text-sm">{t('landing.footer.tagline')}</p>
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
      <h3 className="font-semibold text-lg text-gray-900 mb-2">{number}. {title}</h3>
      <p className="text-gray-500">{desc}</p>
    </div>
  )
}
