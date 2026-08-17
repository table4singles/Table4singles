import { useState, useEffect } from 'react'
import { Printer, Download, Users, MapPin, Heart, Globe, UtensilsCrossed } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { extractBrandColors, DEFAULT_BRAND, type BrandPalette } from '@/lib/extractBrandColors'
import type { Profile } from '@/types/database'

interface FlyerPageProps {
  restaurantId: string
}

export function FlyerPage({ restaurantId }: FlyerPageProps) {
  const [restaurant, setRestaurant] = useState<Profile | null>(null)
  const [brand, setBrand] = useState<BrandPalette>(DEFAULT_BRAND)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', restaurantId)
        .single()

      if (cancelled) return
      if (err || !data) {
        setError('Restaurante no encontrado')
        setLoading(false)
        return
      }

      setRestaurant(data)
      const palette = await extractBrandColors(data.avatar_url)
      if (!cancelled) {
        setBrand(palette)
        setLoading(false)
      }
    })()

    return () => { cancelled = true }
  }, [restaurantId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div
          className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: `${brand.primary} transparent transparent transparent` }}
        />
      </div>
    )
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Restaurante no encontrado</p>
      </div>
    )
  }

  const name = restaurant.restaurant_name || restaurant.display_name || ''
  const logo = restaurant.avatar_url
  const heroPhoto = restaurant.restaurant_photos?.[0] || '/hero-flyer.jpg'

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4 print:bg-white print:p-0 print:block">

      <div className="flex gap-3 mb-6 print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 shadow-sm transition-colors"
        >
          <Printer className="w-4 h-4" /> Imprimir
        </button>
        <a
          href="/icons/qr-app-logo.png"
          download="qr-table4singles.png"
          className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-medium text-sm shadow-sm transition-opacity hover:opacity-90"
          style={{ backgroundColor: brand.primary }}
        >
          <Download className="w-4 h-4" /> Descargar QR
        </a>
      </div>

      <div
        id="flyer"
        className="w-full max-w-[680px] bg-white shadow-2xl print:shadow-none print:max-w-none overflow-hidden"
        style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
      >

        {/* ── 1. Header: logo | divider | T4S ── */}
        <div className="flex items-center justify-between px-8 pt-7 pb-5 gap-4">
          <div className="flex items-center min-w-0 flex-1">
            {logo ? (
              <img
                src={logo}
                alt={name}
                className="h-[88px] max-w-[300px] w-auto object-contain object-left"
                crossOrigin="anonymous"
              />
            ) : (
              <p className="font-bold text-gray-800 text-xl leading-tight">{name}</p>
            )}
          </div>

          <div className="h-14 w-px bg-gray-300 flex-shrink-0" />

          <div className="flex items-center gap-2.5 flex-shrink-0">
            <img src="/icons/logo-icon.png" alt="Table4Singles" className="h-11 w-11 object-contain" />
            <p className="font-bold text-[#1a1a2e] text-lg leading-tight" style={{ fontFamily: "'Georgia', serif" }}>
              Table4Singles
            </p>
          </div>
        </div>

        {/* ── 2. Title ── */}
        <div className="text-center px-8 pt-2 pb-4">
          <h1
            className="text-[2rem] leading-tight uppercase tracking-tight"
            style={{ fontFamily: "'Arial Black', 'Arial', sans-serif", fontWeight: 900 }}
          >
            <span style={{ color: brand.primary }}>{name.toUpperCase()}</span>
            <span className="text-black font-normal text-lg mx-2 lowercase">by</span>
            <span className="text-[#1a1a2e]">TABLE4SINGLES</span>
          </h1>

          {/* ── 3. Blue line + heart ── */}
          <div className="flex items-center justify-center gap-3 mt-4 px-6">
            <div className="h-px flex-1 max-w-[180px]" style={{ backgroundColor: brand.primary }} />
            <Heart className="w-4 h-4 flex-shrink-0" style={{ color: brand.primary, fill: brand.primary }} />
            <div className="h-px flex-1 max-w-[180px]" style={{ backgroundColor: brand.primary }} />
          </div>

          {/* ── 4. Tagline ── */}
          <p
            className="text-gray-700 text-sm mt-4 max-w-md mx-auto leading-relaxed"
            style={{ fontFamily: "'Arial', sans-serif" }}
          >
            Conecta, disfruta y conoce gente nueva<br />en los mejores restaurantes.
          </p>
        </div>

        {/* ── 5. Hero + QR + badge + scan text ── */}
        <div className="relative mx-5 rounded-2xl overflow-hidden" style={{ minHeight: 340 }}>
          <img src={heroPhoto} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/15" />

          <div className="relative flex items-center justify-center py-12 px-4 min-h-[340px]">
            {/* Left badge */}
            <div
              className="absolute left-3 sm:left-5 bottom-8 sm:bottom-10 w-[88px] h-[88px] sm:w-[100px] sm:h-[100px] rounded-full flex flex-col items-center justify-center text-center shadow-lg z-10"
              style={{ backgroundColor: brand.primary, color: '#ffffff' }}
            >
              <Heart className="w-5 h-5 mb-1" strokeWidth={2.5} fill="none" />
              <div className="w-8 h-px bg-white/70 my-0.5" />
              <p
                className="text-[7px] sm:text-[8px] font-bold uppercase leading-tight px-1.5"
                style={{ fontFamily: "'Arial', sans-serif" }}
              >
                La mejor<br />experiencia<br />empieza aquí
              </p>
            </div>

            {/* QR */}
            <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-xl z-10">
              <img src="/icons/qr-app-logo.png" alt="QR Table4Singles" className="w-40 h-40 sm:w-48 sm:h-48" />
            </div>

            {/* Right scan text */}
            <div className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 text-white z-10 hidden sm:block">
              <p
                className="text-base italic leading-snug"
                style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}
              >
                Escanéame<br />y descubre<br />la app
              </p>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-white mt-1 ml-4">
                <path
                  d="M8 8 C 20 20, 28 28, 40 40"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
                <path d="M32 40 L40 40 L40 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>

        {/* ── 6. Download CTA bar ── */}
        <div className="mx-5 mt-5">
          <div
            className="rounded-sm py-3.5 px-4 flex items-center gap-4"
            style={{ backgroundColor: brand.primary, color: '#ffffff' }}
          >
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Download className="w-5 h-5" style={{ color: '#ffffff' }} />
            </div>
            <p
              className="font-black text-sm sm:text-base uppercase tracking-wide leading-tight"
              style={{ fontFamily: "'Arial Black', sans-serif" }}
            >
              Descarga Table4Singles y únete a la comunidad
            </p>
          </div>
        </div>

        {/* ── 7. Three features with vertical dividers ── */}
        <div
          className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch mx-5 mt-6 pb-6"
          style={{ fontFamily: "'Arial', sans-serif" }}
        >
          {[
            {
              icon: <Users className="w-8 h-8" strokeWidth={1.5} />,
              title: 'Conoce gente',
              desc: `en lugares reales como ${name}`,
            },
            {
              icon: <UtensilsCrossed className="w-8 h-8" strokeWidth={1.5} />,
              title: 'Disfruta',
              desc: 'de experiencias únicas y eventos exclusivos',
            },
            {
              icon: <MapPin className="w-8 h-8" strokeWidth={1.5} />,
              title: 'Conecta',
              desc: 'con personas cerca de ti',
            },
          ].flatMap(({ icon, title, desc }, i) => {
            const col = (
              <div key={title} className="flex flex-col items-center text-center gap-1.5 px-2 py-2">
                <div style={{ color: brand.primary }}>{icon}</div>
                <p className="font-black text-[11px] uppercase text-gray-900 leading-tight">{title}</p>
                <p className="text-[10px] text-gray-600 leading-tight">{desc}</p>
              </div>
            )
            if (i === 0) return [col]
            return [
              <div key={`div-${i}`} className="w-px self-stretch my-2" style={{ backgroundColor: brand.primaryLight }} />,
              col,
            ]
          })}
        </div>

        {/* ── 8. Global movement banner ── */}
        <div className="mx-5 mb-6">
          <div
            className="rounded-2xl border-2 px-5 py-4 flex items-center gap-4"
            style={{ borderColor: brand.primaryLight, backgroundColor: '#f8fbff' }}
          >
            <Globe className="w-10 h-10 flex-shrink-0" style={{ color: brand.primary }} strokeWidth={1.25} />
            <div className="flex-1 text-center">
              <p
                className="font-black text-xs text-gray-900 uppercase tracking-wide"
                style={{ fontFamily: "'Arial Black', sans-serif" }}
              >
                Un movimiento global
              </p>
              <p className="text-[10px] text-gray-600 mt-1 leading-relaxed" style={{ fontFamily: "'Arial', sans-serif" }}>
                Más restaurantes.{' '}
                <span className="font-bold" style={{ color: brand.primary }}>Más conexiones.</span>{' '}
                Más experiencias.<br />
                Hoy aquí, mañana en todo el mundo.
              </p>
            </div>
            <Globe className="w-10 h-10 flex-shrink-0 opacity-30" style={{ color: brand.primary }} strokeWidth={1} />
          </div>
        </div>

      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { margin: 0; }
          #flyer { width: 100%; max-width: 100% !important; }
        }
      `}</style>
    </div>
  )
}
