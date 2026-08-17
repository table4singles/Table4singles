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
      const logoUrl =
        restaurantId === '96683ea6-3c2d-48df-9caa-8b615a70d154'
          ? '/icons/bahia-mar-logo.png?v=3'
          : data.avatar_url
      const palette = await extractBrandColors(logoUrl)
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
  const logo =
    restaurantId === '96683ea6-3c2d-48df-9caa-8b615a70d154'
      ? '/icons/bahia-mar-logo.png?v=3'
      : restaurant.avatar_url
  const heroPhoto = '/hero-dinner.jpg'

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
        className="w-full max-w-[680px] bg-white shadow-2xl print:shadow-none print:max-w-none overflow-x-hidden"
        style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
      >

        {/* ── 1. Header: logos centrados, un solo divisor ── */}
        <div className="flex justify-center items-center gap-4 sm:gap-6 px-4 pt-8 pb-3 overflow-visible">
          <div className="h-[120px] max-w-[300px] w-[46%] flex items-center justify-center overflow-visible shrink min-w-0">
            {logo ? (
              <img
                src={logo}
                alt={name}
                className="max-h-[120px] max-w-[300px] w-auto h-auto object-contain object-center"
                crossOrigin="anonymous"
              />
            ) : (
              <p className="font-bold text-gray-800 text-lg leading-tight text-center">{name}</p>
            )}
          </div>

          <div className="h-[76px] w-px bg-gray-300 flex-shrink-0" />

          <div className="h-[120px] max-w-[300px] w-[46%] flex items-center justify-center overflow-visible shrink min-w-0">
            <img
              src="/icons/logo-full.png"
              alt="Table4Singles"
              className="max-h-[88px] max-w-[300px] w-auto h-auto object-contain"
            />
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

        {/* ── 5. Hero a todo el ancho: banda fotográfica integrada ── */}
        <div className="relative mt-1">
          <div className="relative w-full">
            <img
              src={heroPhoto}
              alt=""
              className="w-full h-[420px] object-cover object-center block"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.16) 45%, rgba(0,0,0,0.32) 100%)',
              }}
            />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <div
                  className="absolute z-20 left-0 top-1/2 -translate-x-[62%] -translate-y-1/2 w-[92px] h-[92px] sm:w-[104px] sm:h-[104px] rounded-full flex flex-col items-center justify-center text-center"
                  style={{ backgroundColor: brand.primary, color: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.28)' }}
                >
                  <Heart className="w-5 h-5 mb-0.5" strokeWidth={2.5} fill="none" />
                  <p
                    className="text-[7px] sm:text-[8px] font-bold uppercase leading-tight px-2 mt-0.5"
                    style={{ fontFamily: "'Arial', sans-serif" }}
                  >
                    La mejor<br />experiencia
                  </p>
                  <p
                    className="text-[7px] sm:text-[8px] font-black uppercase leading-tight px-2"
                    style={{ fontFamily: "'Arial', sans-serif" }}
                  >
                    empieza aquí
                  </p>
                  <div className="w-8 h-px bg-white/85 mt-1" />
                </div>

                <div
                  className="relative z-10 rounded-2xl p-3 sm:p-3.5"
                  style={{ backgroundColor: 'rgba(255,255,255,0.97)', boxShadow: '0 8px 32px rgba(0,0,0,0.22)' }}
                >
                  <img
                    src="/icons/qr-app-logo.png"
                    alt="QR Table4Singles"
                    className="w-[188px] h-[188px] sm:w-[210px] sm:h-[210px] block"
                  />
                </div>
              </div>

              <div className="absolute right-3 sm:right-7 top-[46%] -translate-y-1/2 text-white z-10 flex flex-col items-end max-w-[130px]">
                <svg
                  width="78"
                  height="32"
                  viewBox="0 0 78 32"
                  fill="none"
                  className="text-white drop-shadow mb-0.5 -mr-1"
                  aria-hidden
                >
                  <path
                    d="M74 10 C 52 4, 30 7, 14 16"
                    stroke="currentColor"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M24 8 L10 16 L24 22"
                    stroke="currentColor"
                    strokeWidth="2.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
                <p
                  className="text-[1.08rem] italic leading-snug drop-shadow-md text-right"
                  style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}
                >
                  Escanéame<br />y descubre<br />la app
                </p>
              </div>
            </div>
          </div>

          {/* CTA solapando el borde inferior de la foto (mitad sobre foto, mitad debajo) */}
          <div
            className="absolute z-20 left-5 right-5 sm:left-8 sm:right-8"
            style={{ bottom: 0, transform: 'translateY(50%)' }}
          >
            <div
              className="rounded-md py-3.5 px-4 flex items-center gap-3 sm:gap-4"
              style={{ backgroundColor: brand.primary, color: '#ffffff', boxShadow: '0 6px 20px rgba(0,0,0,0.18)' }}
            >
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5" style={{ color: '#ffffff' }} />
              </div>
              <p
                className="font-black text-xs sm:text-sm uppercase tracking-wide leading-tight"
                style={{ fontFamily: "'Arial Black', sans-serif" }}
              >
                Descarga Table4Singles y únete a la comunidad
              </p>
            </div>
          </div>
        </div>

        <div className="h-10 sm:h-11" />

        {/* ── 7. Three features with vertical dividers ── */}
        <div
          className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch mx-6 mt-6 pb-6"
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
        <div className="mx-6 mb-6">
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
