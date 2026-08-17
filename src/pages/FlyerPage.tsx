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
          ? '/icons/bahia-mar-logo.png'
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
      ? '/icons/bahia-mar-logo.png'
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
        className="w-full max-w-[680px] bg-white shadow-2xl print:shadow-none print:max-w-none overflow-hidden"
        style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
      >

        {/* ── 1. Header: logos centrados, un solo divisor ── */}
        <div className="flex justify-center items-center gap-6 px-8 pt-8 pb-4">
          <div className="h-[96px] w-[210px] flex items-center justify-center">
            {logo ? (
              <img
                src={logo}
                alt={name}
                className="max-h-[96px] max-w-[210px] object-contain"
                crossOrigin="anonymous"
              />
            ) : (
              <p className="font-bold text-gray-800 text-lg leading-tight text-center">{name}</p>
            )}
          </div>

          <div className="h-[72px] w-px bg-gray-300 flex-shrink-0" />

          <div className="h-[96px] w-[210px] flex items-center justify-center">
            <img
              src="/icons/logo-full.png"
              alt="Table4Singles"
              className="max-h-[72px] max-w-[210px] w-auto object-contain"
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

        {/* ── 5. Hero integrado: foto limpia + un solo QR ── */}
        <div className="relative mx-6">
          <div className="relative rounded-2xl overflow-hidden">
            <img
              src={heroPhoto}
              alt=""
              className="w-full h-[400px] object-cover object-center"
            />
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.22) 55%, rgba(0,0,0,0.35) 100%)',
              }}
            />

            <div className="absolute inset-0 flex items-center justify-center px-4 sm:px-8">
              {/* Badge izquierda — centrado vertical como referencia */}
              <div
                className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 w-[92px] h-[92px] sm:w-[104px] sm:h-[104px] rounded-full flex flex-col items-center justify-center text-center z-10"
                style={{ backgroundColor: brand.primary, color: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}
              >
                <Heart className="w-5 h-5 mb-1" strokeWidth={2.5} fill="none" />
                <div className="w-9 h-px bg-white/80 my-0.5" />
                <p
                  className="text-[7px] sm:text-[8px] font-bold uppercase leading-tight px-1.5"
                  style={{ fontFamily: "'Arial', sans-serif" }}
                >
                  La mejor<br />experiencia<br />empieza aquí
                </p>
              </div>

              {/* QR grande — único, centrado */}
              <div
                className="relative z-10 rounded-2xl p-3 sm:p-4"
                style={{ backgroundColor: 'rgba(255,255,255,0.97)', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}
              >
                <img
                  src="/icons/qr-app-logo.png"
                  alt="QR Table4Singles"
                  className="w-[200px] h-[200px] sm:w-[220px] sm:h-[220px] block"
                />
              </div>

              {/* Texto + flecha apuntando al QR (hacia la izquierda) */}
              <div className="absolute right-2 sm:right-5 top-1/2 -translate-y-1/2 text-white z-10 text-right max-w-[118px]">
                <p
                  className="text-[1.05rem] italic leading-snug drop-shadow-md"
                  style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive" }}
                >
                  Escanéame<br />y descubre<br />la app
                </p>
                <svg
                  width="56"
                  height="40"
                  viewBox="0 0 56 40"
                  fill="none"
                  className="text-white/95 mt-1 ml-auto drop-shadow"
                  aria-hidden
                >
                  <path
                    d="M50 8 C 36 10, 22 16, 10 28"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M18 24 L8 30 L18 34"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* CTA solapando el borde inferior del hero — como referencia */}
          <div className="relative z-20 -mt-5 mx-2 sm:mx-4">
            <div
              className="rounded-md py-3.5 px-4 flex items-center gap-3 sm:gap-4"
              style={{ backgroundColor: brand.primary, color: '#ffffff', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
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

        {/* ── 7. Three features with vertical dividers ── */}
        <div
          className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch mx-6 mt-8 pb-6"
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
