import { useState, useEffect } from 'react'
import { Printer, Download, Users, MapPin, Sparkles, Globe, Heart } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database'

interface FlyerPageProps {
  restaurantId: string
}

export function FlyerPage({ restaurantId }: FlyerPageProps) {
  const [restaurant, setRestaurant] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('*')
      .eq('id', restaurantId)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) setError('Restaurante no encontrado')
        else setRestaurant(data)
        setLoading(false)
      })
  }, [restaurantId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
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
  const city = restaurant.city || ''
  const cuisine = restaurant.restaurant_cuisine || ''

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4 print:bg-white print:p-0 print:block">

      {/* Botones de acción — ocultos al imprimir */}
      <div className="flex gap-3 mb-6 print:hidden">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 shadow-sm transition-colors"
        >
          <Printer className="w-4 h-4" /> Imprimir
        </button>
        <a
          href={`/icons/qr-app-logo.png`}
          download="qr-table4singles.png"
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white rounded-xl font-medium text-sm hover:bg-orange-600 shadow-sm transition-colors"
        >
          <Download className="w-4 h-4" /> Descargar QR
        </a>
      </div>

      {/* ── FLYER ── */}
      <div
        id="flyer"
        className="bg-[#f7f5f2] w-full max-w-[680px] shadow-2xl print:shadow-none print:max-w-none"
        style={{ fontFamily: "'Georgia', serif" }}
      >

        {/* Header logos */}
        <div className="flex items-center justify-between px-10 pt-8 pb-6">
          <div className="flex items-center gap-4">
            {logo ? (
              <img src={logo} alt={name} className="h-14 w-14 object-contain rounded-xl" />
            ) : (
              <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-blue-400 to-orange-400 flex items-center justify-center">
                <span className="text-white font-bold text-xl">{name.charAt(0)}</span>
              </div>
            )}
            <div>
              <p className="font-bold text-gray-800 text-lg leading-tight">{name}</p>
              {city && <p className="text-gray-500 text-xs">{city}{cuisine ? ` · ${cuisine}` : ''}</p>}
            </div>
          </div>

          {/* Separador */}
          <div className="h-12 w-px bg-gray-300 mx-2" />

          {/* T4S logo */}
          <div className="flex items-center gap-3">
            <img src="/icons/logo-icon.png" alt="Table4Singles" className="h-12 w-12 object-contain" />
            <div>
              <p className="font-bold text-gray-800 text-base leading-tight">Table4Singles</p>
              <p className="text-gray-400 text-[10px]">Cenas. Conexiones. Experiencias.</p>
            </div>
          </div>
        </div>

        {/* Línea decorativa */}
        <div className="px-10">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
        </div>

        {/* Título principal */}
        <div className="text-center px-10 pt-7 pb-5">
          <h1 className="text-4xl font-black tracking-tight uppercase" style={{ fontFamily: "'Arial Black', sans-serif" }}>
            <span className="text-orange-500">{name.toUpperCase()}</span>
            <span className="text-gray-500 font-normal text-2xl mx-3">by</span>
            <span className="text-[#1a1a2e]">TABLE4SINGLES</span>
          </h1>
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="h-px w-20 bg-orange-300" />
            <Heart className="w-4 h-4 text-orange-400 fill-orange-400" />
            <div className="h-px w-20 bg-orange-300" />
          </div>
          <p className="text-gray-600 text-sm mt-3 max-w-xs mx-auto leading-relaxed">
            Conecta, disfruta y conoce gente nueva<br />en los mejores restaurantes.
          </p>
        </div>

        {/* Sección central con foto de fondo + QR */}
        <div className="relative mx-6 rounded-2xl overflow-hidden" style={{ minHeight: 320 }}>
          {/* Foto de fondo */}
          <img
            src="/hero-dinner.jpg"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/45" />

          {/* Contenido sobre la foto */}
          <div className="relative flex flex-col items-center justify-center py-10 px-6 gap-4">

            {/* Badge izquierdo */}
            <div className="absolute left-5 top-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-orange-500/90 flex flex-col items-center justify-center text-white text-center p-2 shadow-lg">
              <Heart className="w-4 h-4 mb-1 fill-white" />
              <p className="text-[9px] font-bold uppercase leading-tight">La mejor experiencia empieza aquí</p>
            </div>

            {/* QR code */}
            <div className="bg-white rounded-2xl p-4 shadow-xl">
              <img src="/icons/qr-app-logo.png" alt="QR Table4Singles" className="w-44 h-44" />
            </div>

            {/* Texto escanéame */}
            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-white text-center">
              <p className="text-sm italic leading-tight" style={{ fontFamily: "'Georgia', serif" }}>
                Escanéame<br />y descubre<br />la app
              </p>
              <div className="mt-2 flex justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-white rotate-180">
                  <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* CTA descarga */}
        <div className="px-6 mt-5">
          <div className="bg-orange-500 rounded-xl py-4 flex items-center justify-center gap-3 text-white">
            <Download className="w-5 h-5" />
            <div className="text-center">
              <p className="font-black text-base uppercase tracking-wide">Descarga Table4Singles</p>
              <p className="text-xs text-orange-100 uppercase tracking-wider">y únete a la comunidad</p>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 px-6 mt-6 pb-6 border-b border-gray-200">
          {[
            { icon: <Users className="w-7 h-7" />, title: 'Conoce gente', desc: `en lugares reales como ${name}` },
            { icon: <Sparkles className="w-7 h-7" />, title: 'Disfruta', desc: 'de experiencias únicas y eventos exclusivos' },
            { icon: <MapPin className="w-7 h-7" />, title: 'Conecta', desc: 'con personas cerca de ti' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center text-center gap-1">
              <div className="text-orange-500">{icon}</div>
              <p className="font-black text-xs uppercase text-gray-800">{title}</p>
              <p className="text-[10px] text-gray-500 leading-tight">{desc}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-4">
          <Globe className="w-6 h-6 text-orange-400 flex-shrink-0" />
          <div className="text-center flex-1 px-4">
            <p className="font-black text-xs text-gray-800 uppercase tracking-wide">Un movimiento global</p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              Más restaurantes. <span className="text-orange-500 font-bold">Más conexiones.</span> Más experiencias.<br />
              Hoy aquí, mañana en todo el mundo.
            </p>
          </div>
          <Globe className="w-6 h-6 text-orange-400 flex-shrink-0" />
        </div>

        {/* URL discreta */}
        <div className="text-center pb-4">
          <p className="text-[9px] text-gray-400 tracking-widest">table4singles.online</p>
        </div>

      </div>

      {/* Print styles globales */}
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
