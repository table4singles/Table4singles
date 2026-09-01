import type { BrandPalette } from '@/lib/extractBrandColors'
import type { FlyerFormat } from '@/lib/flyerFormats'
import { Heart, Globe, MapPin, Users, UtensilsCrossed, Download } from 'lucide-react'

const T4S_LOGO = '/icons/logo-full.png'
/** Fallback mientras se genera el QR real (o si el restaurantId no está disponible) */
const QR_FALLBACK_SRC = '/icons/qr-app-logo.png'

interface FlyerPreviewProps {
  format: FlyerFormat
  name: string
  logo: string | null
  heroPhoto: string
  brand: BrandPalette
  qrSrc?: string
}

/** Contenedor externo que fija el ratio y limita el tamaño en pantalla */
export function FlyerPreview({ format, name, logo, heroPhoto, brand, qrSrc }: FlyerPreviewProps) {
  const isTable = format.category === 'table'
  const isLandscape = format.orientation === 'landscape'
  const maxW = isTable ? (isLandscape ? 560 : 340) : (isLandscape ? 720 : 500)
  const resolvedQr = qrSrc || QR_FALLBACK_SRC

  return (
    <div
      className="bg-white shadow-2xl print:shadow-none print:max-w-none overflow-hidden"
      style={{ width: '100%', maxWidth: maxW, aspectRatio: `${format.widthMm} / ${format.heightMm}` }}
    >
      <div id="flyer" className="w-full h-full bg-white overflow-hidden">
        {isTable
          ? <TableLayout format={format} name={name} logo={logo} heroPhoto={heroPhoto} brand={brand} qrSrc={resolvedQr} />
          : <PosterLayout format={format} name={name} logo={logo} heroPhoto={heroPhoto} brand={brand} qrSrc={resolvedQr} />}
      </div>
    </div>
  )
}

/* ─────────────────────────── CARTEL ─────────────────────────── */

function PosterLayout({ format, name, logo, heroPhoto, brand, qrSrc }: FlyerPreviewProps & { qrSrc: string }) {
  const landscape = format.orientation === 'landscape'
  const accent = brand.primary
  const accentLight = brand.primaryLight

  if (landscape) {
    return (
      <div className="w-full h-full flex flex-col overflow-hidden">
        {/* Cabecera */}
        <div className="flex items-center gap-4 px-5 py-3 bg-white border-b border-gray-100">
          <LogoBlock logo={logo} name={name} maxH={52} />
          <div className="w-px self-stretch bg-gray-200 flex-shrink-0" />
          <img src={T4S_LOGO} alt="Table4Singles" className="h-9 w-auto object-contain" crossOrigin="anonymous" />
        </div>

        {/* Cuerpo */}
        <div className="flex-1 min-h-0 flex">
          {/* Foto integrada con overlay */}
          <div className="relative w-[58%]">
            <img src={heroPhoto} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
            {/* Overlay de marca: vignette lateral */}
            <div className="absolute inset-0" style={{
              background: `linear-gradient(to right, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.04) 60%, rgba(0,0,0,0.38) 100%)`,
            }} />
            {/* Gradiente de color de marca en la zona inferior */}
            <div className="absolute bottom-0 left-0 right-0 h-1/3" style={{
              background: `linear-gradient(to top, ${accent}cc 0%, transparent 100%)`,
            }} />
            <p
              className="absolute bottom-4 left-5 right-5 text-white font-black uppercase leading-tight text-xl drop-shadow-lg"
              style={{ fontFamily: 'Arial Black, Arial, sans-serif', textShadow: '0 2px 8px rgba(0,0,0,0.55)' }}
            >
              {name}
            </p>
          </div>

          {/* Panel derecho */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-5 py-4 gap-3 bg-white">
            <p className="text-[11px] font-black uppercase tracking-wide" style={{ color: accent, fontFamily: 'Arial Black, sans-serif' }}>
              by Table4Singles
            </p>
            <Divider color={accentLight} />
            <p className="text-gray-700 text-xs leading-snug">
              Conecta, disfruta y conoce gente nueva en los mejores restaurantes.
            </p>
            <div className="rounded-xl p-2 bg-white shadow-lg border border-gray-100 mt-1">
              <img src={qrSrc} alt="QR" className="w-32 h-32 block" crossOrigin="anonymous" />
            </div>
            <p className="font-black uppercase leading-tight text-xs text-gray-900" style={{ fontFamily: 'Arial Black, sans-serif' }}>
              Escanea y descarga la app
            </p>
            <p className="text-[10px] text-gray-500">Reserva mesa y conoce gente nueva</p>
          </div>
        </div>
      </div>
    )
  }

  // Cartel vertical (A3/A4/A5)
  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Cabecera con logos */}
      <div className="flex justify-center items-center gap-4 px-5 pt-4 pb-2 bg-white">
        <LogoBlock logo={logo} name={name} maxH={62} />
        <div className="h-10 w-px bg-gray-200 flex-shrink-0" />
        <img src={T4S_LOGO} alt="Table4Singles" className="h-10 w-auto max-w-[40%] object-contain" crossOrigin="anonymous" />
      </div>

      {/* Subtítulo */}
      <div className="text-center px-5 pb-2">
        <h1 className="uppercase leading-tight text-[1.5rem]" style={{ fontFamily: 'Arial Black, Arial, sans-serif', fontWeight: 900 }}>
          <span style={{ color: accent }}>{name.toUpperCase()}</span>
          <span className="text-black font-normal text-sm mx-1 lowercase"> by </span>
          <span className="text-[#1a1a2e]">TABLE4SINGLES</span>
        </h1>
        <div className="flex items-center justify-center gap-3 mt-1.5">
          <div className="h-px flex-1 max-w-[120px]" style={{ backgroundColor: accent }} />
          <Heart className="w-3.5 h-3.5" style={{ color: accent, fill: accent }} />
          <div className="h-px flex-1 max-w-[120px]" style={{ backgroundColor: accent }} />
        </div>
        <p className="text-gray-600 text-xs mt-1.5 leading-snug">
          Conecta, disfruta y conoce gente nueva en los mejores restaurantes.
        </p>
      </div>

      {/* Foto hero: ocupa la zona central, integrada con gradientes */}
      <div className="relative flex-1 min-h-0 mx-0">
        <img src={heroPhoto} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
        {/* Vignette top → integra con fondo blanco */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white to-transparent" />
        {/* Vignette bottom con color de marca */}
        <div className="absolute bottom-0 left-0 right-0 h-2/5" style={{
          background: `linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.15) 70%, transparent 100%)`,
        }} />
        {/* Overlay de marca sutil */}
        <div className="absolute inset-0" style={{
          background: `radial-gradient(ellipse at center, transparent 40%, ${accent}22 100%)`,
        }} />

        {/* QR centrado sobre la foto */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative z-10 rounded-2xl p-2.5 shadow-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.97)' }}>
            <img src={qrSrc} alt="QR Table4Singles" className="w-[140px] h-[140px] block" crossOrigin="anonymous" />
          </div>
        </div>

        {/* Etiqueta "Escanéame" */}
        <p
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white italic text-right drop-shadow-md leading-snug text-base"
          style={{ fontFamily: 'Brush Script MT, Segoe Script, cursive', textShadow: '0 2px 6px rgba(0,0,0,0.6)' }}
        >
          Escanéame<br />y descubre<br />la app
        </p>

        {/* Banner inferior sobre la foto */}
        <div
          className="absolute bottom-3 left-4 right-4 z-20 rounded-lg py-2 px-3 flex items-center gap-2 text-white"
          style={{ backgroundColor: accent, boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
        >
          <Download className="w-4 h-4 flex-shrink-0" />
          <p className="font-black uppercase tracking-wide leading-tight text-[10px]" style={{ fontFamily: 'Arial Black, sans-serif' }}>
            Descarga Table4Singles y únete a la comunidad
          </p>
        </div>
      </div>

      {/* Footer features */}
      <div className="grid grid-cols-3 divide-x divide-gray-100 mx-4 my-3">
        {[
          { icon: <Users className="w-5 h-5" strokeWidth={1.5} />, title: 'Conoce gente', desc: `en ${name}` },
          { icon: <UtensilsCrossed className="w-5 h-5" strokeWidth={1.5} />, title: 'Disfruta', desc: 'experiencias únicas' },
          { icon: <MapPin className="w-5 h-5" strokeWidth={1.5} />, title: 'Conecta', desc: 'personas cerca de ti' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="flex flex-col items-center text-center gap-0.5 px-2 py-1.5">
            <div style={{ color: accent }}>{icon}</div>
            <p className="font-black uppercase text-gray-900 leading-tight text-[9px]" style={{ fontFamily: 'Arial Black, sans-serif' }}>{title}</p>
            <p className="text-gray-500 leading-tight text-[8.5px]">{desc}</p>
          </div>
        ))}
      </div>

      {/* Tagline footer */}
      <div className="mx-4 mb-3">
        <div className="rounded-xl border px-3 py-2 flex items-center gap-2.5" style={{ borderColor: accentLight, backgroundColor: '#f8fbff' }}>
          <Globe className="w-6 h-6 flex-shrink-0" style={{ color: accent }} strokeWidth={1.25} />
          <div className="flex-1 text-center">
            <p className="font-black uppercase text-gray-900 text-[10px]" style={{ fontFamily: 'Arial Black, sans-serif' }}>Un movimiento global</p>
            <p className="text-gray-500 mt-0.5 leading-snug text-[9px]">
              Más restaurantes. <span className="font-bold" style={{ color: accent }}>Más conexiones.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────── MESA ─────────────────────────── */

function TableLayout({ format, name, logo, heroPhoto, brand, qrSrc }: FlyerPreviewProps & { qrSrc: string }) {
  const landscape = format.orientation === 'landscape'
  const accent = brand.primary

  if (landscape) {
    return (
      <div className="w-full h-full flex overflow-hidden">
        {/* Foto integrada */}
        <div className="w-[42%] relative flex-shrink-0">
          <img src={heroPhoto} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
          <div className="absolute inset-0" style={{
            background: `linear-gradient(135deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.42) 100%)`,
          }} />
          {/* Gradiente de marca lateral */}
          <div className="absolute inset-0" style={{
            background: `linear-gradient(to right, transparent 50%, ${accent}55 100%)`,
          }} />
          {/* Logo sobre la foto */}
          <div className="absolute inset-0 flex flex-col justify-between p-3">
            <LogoBlock logo={logo} name={name} maxH={52} whiteShadow />
            <p className="text-white font-black uppercase text-sm leading-tight drop-shadow-lg"
              style={{ fontFamily: 'Arial Black, sans-serif', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>
              {name}
            </p>
          </div>
        </div>

        {/* Panel derecho */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-3 gap-2 bg-white">
          <img src={T4S_LOGO} alt="Table4Singles" className="h-8 w-auto max-w-full object-contain" crossOrigin="anonymous" />
          <div className="rounded-xl p-2 bg-white shadow-md border border-gray-100">
            <img src={qrSrc} alt="QR" className="w-32 h-32 block" crossOrigin="anonymous" />
          </div>
          <p className="text-center font-black uppercase leading-tight text-gray-900 text-xs" style={{ fontFamily: 'Arial Black, sans-serif' }}>
            Escanea y descarga la app
          </p>
          <p className="text-center text-[10px] text-gray-500">Reserva mesa y conoce gente nueva</p>
        </div>
      </div>
    )
  }

  // Mesa vertical
  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      {/* Foto + logos */}
      <div className="h-[32%] relative flex-shrink-0">
        <img src={heroPhoto} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
        <div className="absolute inset-0" style={{
          background: `linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.5) 100%)`,
        }} />
        {/* Gradiente de color de marca */}
        <div className="absolute bottom-0 left-0 right-0 h-2/3" style={{
          background: `linear-gradient(to top, ${accent}bb 0%, transparent 100%)`,
        }} />
        {/* Logos centrados */}
        <div className="absolute inset-0 flex items-center justify-center gap-3 px-4 pt-2">
          <LogoBlock logo={logo} name={name} maxH={48} whiteShadow />
          <div className="w-px self-stretch bg-white/50 my-3" />
          <img src={T4S_LOGO} alt="Table4Singles" className="max-h-[40%] max-w-[42%] object-contain drop-shadow" crossOrigin="anonymous" />
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-3 gap-2 bg-white">
        <p className="text-center font-black uppercase leading-tight text-base" style={{ color: accent, fontFamily: 'Arial Black, sans-serif' }}>
          {name}
        </p>
        <div className="rounded-xl p-2 bg-white shadow-md border border-gray-100">
          <img src={qrSrc} alt="QR" className="w-36 h-36 block" crossOrigin="anonymous" />
        </div>
        <p className="text-center font-black uppercase leading-tight text-gray-900 text-xs" style={{ fontFamily: 'Arial Black, sans-serif' }}>
          Escanea y descarga Table4Singles
        </p>
        <p className="text-[10px] text-gray-500 text-center">Reserva mesa y conoce gente nueva</p>
      </div>
    </div>
  )
}

/* ─────────────────────────── HELPERS ─────────────────────────── */

/** Bloque de logo con fallback al nombre del restaurante */
function LogoBlock({
  logo,
  name,
  maxH,
  whiteShadow = false,
}: {
  logo: string | null
  name: string
  maxH: number
  whiteShadow?: boolean
}) {
  if (!logo) {
    return (
      <p
        className="font-black uppercase text-center leading-tight text-sm flex-1"
        style={{
          fontFamily: 'Arial Black, sans-serif',
          color: whiteShadow ? '#fff' : '#1a1a2e',
          textShadow: whiteShadow ? '0 2px 6px rgba(0,0,0,0.5)' : undefined,
        }}
      >
        {name}
      </p>
    )
  }
  return (
    <img
      src={logo}
      alt={name}
      crossOrigin="anonymous"
      className="flex-shrink-0 w-auto object-contain"
      style={{
        maxHeight: maxH,
        maxWidth: 180,
        filter: whiteShadow ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' : undefined,
      }}
    />
  )
}

function Divider({ color }: { color: string }) {
  return <div className="w-10 h-0.5 rounded-full" style={{ backgroundColor: color }} />
}
