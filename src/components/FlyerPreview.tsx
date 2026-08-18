import type { BrandPalette } from '@/lib/extractBrandColors'
import type { FlyerFormat } from '@/lib/flyerFormats'
import { Heart, Globe, MapPin, Users, UtensilsCrossed, Download } from 'lucide-react'

const QR_SRC = '/icons/qr-app-logo.png'
const T4S_LOGO = '/icons/logo-full.png'

interface FlyerPreviewProps {
  format: FlyerFormat
  name: string
  logo: string | null
  heroPhoto: string
  brand: BrandPalette
}

export function FlyerPreview({ format, name, logo, heroPhoto, brand }: FlyerPreviewProps) {
  const isTable = format.category === 'table'
  const isLandscape = format.orientation === 'landscape'
  const maxW = isTable ? (isLandscape ? 560 : 340) : (isLandscape ? 720 : 520)

  return (
    <div
      className="bg-white shadow-2xl print:shadow-none print:max-w-none overflow-hidden"
      style={{
        width: '100%',
        maxWidth: maxW,
        aspectRatio: `${format.widthMm} / ${format.heightMm}`,
      }}
    >
      <div id="flyer" className="w-full h-full bg-white overflow-hidden">
        {isTable
          ? <TableLayout format={format} name={name} logo={logo} heroPhoto={heroPhoto} brand={brand} />
          : <PosterLayout format={format} name={name} logo={logo} heroPhoto={heroPhoto} brand={brand} />}
      </div>
    </div>
  )
}

function TableLayout({ format, name, logo, heroPhoto, brand }: FlyerPreviewProps) {
  const landscape = format.orientation === 'landscape'
  if (landscape) {
    return (
      <div className="w-full h-full flex">
        <div className="w-[42%] relative">
          <img src={heroPhoto} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/25 to-black/45" />
          <div className="absolute inset-0 p-4 flex flex-col justify-between">
            {logo
              ? <img src={logo} alt={name} className="max-h-16 max-w-[85%] object-contain" crossOrigin="anonymous" />
              : null}
            <p className="text-white font-black uppercase leading-tight text-lg sm:text-xl" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
              {name}
            </p>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-4 gap-3">
          <img src={T4S_LOGO} alt="Table4Singles" className="h-10 w-auto object-contain" crossOrigin="anonymous" />
          <div className="bg-white rounded-xl p-2 shadow-md border border-gray-100">
            <img src={QR_SRC} alt="QR Table4Singles" className="w-36 h-36 sm:w-44 sm:h-44 block" crossOrigin="anonymous" />
          </div>
          <p className="text-center font-black uppercase leading-tight text-gray-900 text-sm" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
            Escanea y descarga la app
          </p>
          <p className="text-center text-xs text-gray-500 leading-snug">Reserva mesa y conoce gente nueva</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="h-[30%] relative">
        <img src={heroPhoto} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-center justify-center gap-4 px-5">
          {logo
            ? <img src={logo} alt={name} className="max-h-[70%] max-w-[44%] object-contain drop-shadow" crossOrigin="anonymous" />
            : null}
          <img src={T4S_LOGO} alt="Table4Singles" className="max-h-[52%] max-w-[44%] object-contain drop-shadow" crossOrigin="anonymous" />
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-4 gap-3">
        <p className="text-center font-black uppercase leading-tight text-xl" style={{ color: brand.primary, fontFamily: 'Arial Black, Arial, sans-serif' }}>
          {name}
        </p>
        <div className="rounded-xl p-2 bg-white shadow-md border border-gray-100">
          <img src={QR_SRC} alt="QR Table4Singles" className="w-44 h-44 block" crossOrigin="anonymous" />
        </div>
        <p className="text-center font-black uppercase leading-tight text-gray-900 text-sm" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
          Escanea y descarga Table4Singles
        </p>
      </div>
    </div>
  )
}

function PosterLayout({ format, name, logo, heroPhoto, brand }: FlyerPreviewProps) {
  const landscape = format.orientation === 'landscape'
  if (landscape) {
    return (
      <div className="w-full h-full flex flex-col" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>
        <div className="flex items-center justify-center gap-5 px-6 pt-4 pb-2">
          <div className="h-16 w-[38%] flex items-center justify-center">
            {logo
              ? <img src={logo} alt={name} className="max-h-full max-w-full object-contain" crossOrigin="anonymous" />
              : <p className="font-bold">{name}</p>}
          </div>
          <div className="h-10 w-px bg-gray-300" />
          <div className="h-16 w-[38%] flex items-center justify-center">
            <img src={T4S_LOGO} alt="Table4Singles" className="max-h-[80%] max-w-full object-contain" crossOrigin="anonymous" />
          </div>
        </div>
        <div className="flex-1 flex min-h-0 px-4 pb-4 gap-4">
          <div className="relative w-[58%] overflow-hidden rounded-md">
            <img src={heroPhoto} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-black/10" />
          </div>
          <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
            <p className="font-black uppercase leading-tight text-2xl" style={{ color: brand.primary, fontFamily: 'Arial Black, Arial, sans-serif' }}>
              {name}
            </p>
            <p className="text-[#1a1a2e] font-black uppercase mt-1 text-sm" style={{ fontFamily: 'Arial Black, Arial, sans-serif' }}>
              by Table4Singles
            </p>
            <div className="bg-white rounded-xl p-2 shadow-lg my-3">
              <img src={QR_SRC} alt="QR Table4Singles" className="w-36 h-36 block" crossOrigin="anonymous" />
            </div>
            <p className="font-black uppercase leading-tight text-xs" style={{ fontFamily: 'Arial Black, Arial, sans-serif', color: brand.primary }}>
              Escanea y descarga la app
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ fontFamily: 'Georgia, Times New Roman, serif' }}>
      <div className="flex justify-center items-center gap-5 px-5 pt-5 pb-1">
        <div className="h-[72px] w-[42%] flex items-center justify-center">
          {logo
            ? <img src={logo} alt={name} className="max-h-full max-w-full object-contain" crossOrigin="anonymous" />
            : <p className="font-bold text-center">{name}</p>}
        </div>
        <div className="h-12 w-px bg-gray-300 flex-shrink-0" />
        <div className="h-[72px] w-[42%] flex items-center justify-center">
          <img src={T4S_LOGO} alt="Table4Singles" className="max-h-[80%] max-w-full object-contain" crossOrigin="anonymous" />
        </div>
      </div>

      <div className="text-center px-6 pt-1 pb-3">
        <h1 className="uppercase leading-tight text-[1.65rem]" style={{ fontFamily: 'Arial Black, Arial, sans-serif', fontWeight: 900 }}>
          <span style={{ color: brand.primary }}>{name.toUpperCase()}</span>
          <span className="text-black font-normal text-base mx-1 lowercase"> by </span>
          <span className="text-[#1a1a2e]">TABLE4SINGLES</span>
        </h1>
        <div className="flex items-center justify-center gap-3 mt-2">
          <div className="h-px flex-1 max-w-[140px]" style={{ backgroundColor: brand.primary }} />
          <Heart className="w-4 h-4" style={{ color: brand.primary, fill: brand.primary }} />
          <div className="h-px flex-1 max-w-[140px]" style={{ backgroundColor: brand.primary }} />
        </div>
        <p className="text-gray-700 text-[13px] mt-2 leading-snug" style={{ fontFamily: 'Arial, sans-serif' }}>
          Conecta, disfruta y conoce gente nueva en los mejores restaurantes.
        </p>
      </div>

      <div className="relative flex-1 min-h-0">
        <img src={heroPhoto} alt="" className="absolute inset-0 w-full h-full object-cover" crossOrigin="anonymous" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.10), rgba(0,0,0,0.32))' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="absolute left-4 top-1/2 -translate-y-1/2 w-[88px] h-[88px] rounded-full flex flex-col items-center justify-center text-center text-white px-2"
            style={{ backgroundColor: brand.primary, boxShadow: '0 4px 20px rgba(0,0,0,0.28)' }}
          >
            <Heart className="w-4 h-4 mb-1" strokeWidth={2.5} />
            <p className="font-black uppercase leading-tight text-[7px]" style={{ fontFamily: 'Arial, sans-serif' }}>
              La mejor experiencia empieza aquí
            </p>
          </div>
          <div className="relative z-10 rounded-xl p-2.5" style={{ backgroundColor: 'rgba(255,255,255,0.97)', boxShadow: '0 8px 32px rgba(0,0,0,0.22)' }}>
            <img src={QR_SRC} alt="QR Table4Singles" className="w-[150px] h-[150px] block" crossOrigin="anonymous" />
          </div>
          <p
            className="absolute right-5 top-[46%] -translate-y-1/2 text-white italic text-right drop-shadow-md leading-snug text-[17px]"
            style={{ fontFamily: 'Brush Script MT, Segoe Script, cursive' }}
          >
            Escanéame<br />y descubre<br />la app
          </p>
        </div>
        <div className="absolute left-5 right-5 bottom-0 translate-y-1/2 z-20">
          <div className="rounded-md py-2.5 px-3 flex items-center gap-3 text-white" style={{ backgroundColor: brand.primary, boxShadow: '0 6px 20px rgba(0,0,0,0.18)' }}>
            <Download className="w-5 h-5 flex-shrink-0" />
            <p className="font-black uppercase tracking-wide leading-tight text-[11px]" style={{ fontFamily: 'Arial Black, sans-serif' }}>
              Descarga Table4Singles y únete a la comunidad
            </p>
          </div>
        </div>
      </div>

      <div className="h-8" />
      <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-stretch mx-5 mt-2" style={{ fontFamily: 'Arial, sans-serif' }}>
        {[
          { icon: <Users className="w-6 h-6" strokeWidth={1.5} />, title: 'Conoce gente', desc: `en lugares reales como ${name}` },
          { icon: <UtensilsCrossed className="w-6 h-6" strokeWidth={1.5} />, title: 'Disfruta', desc: 'de experiencias únicas y eventos exclusivos' },
          { icon: <MapPin className="w-6 h-6" strokeWidth={1.5} />, title: 'Conecta', desc: 'con personas cerca de ti' },
        ].flatMap(({ icon, title, desc }, i) => {
          const col = (
            <div key={title} className="flex flex-col items-center text-center gap-1 px-2 py-2">
              <div style={{ color: brand.primary }}>{icon}</div>
              <p className="font-black uppercase text-gray-900 leading-tight text-[10px]">{title}</p>
              <p className="text-gray-600 leading-tight text-[9px]">{desc}</p>
            </div>
          )
          if (i === 0) return [col]
          return [
            <div key={`div-${i}`} className="w-px self-stretch my-2" style={{ backgroundColor: brand.primaryLight }} />,
            col,
          ]
        })}
      </div>
      <div className="mx-5 mb-4 mt-2">
        <div className="rounded-2xl border-2 px-4 py-3 flex items-center gap-3" style={{ borderColor: brand.primaryLight, backgroundColor: '#f8fbff' }}>
          <Globe className="w-8 h-8 flex-shrink-0" style={{ color: brand.primary }} strokeWidth={1.25} />
          <div className="flex-1 text-center">
            <p className="font-black uppercase text-gray-900 text-[11px]" style={{ fontFamily: 'Arial Black, sans-serif' }}>Un movimiento global</p>
            <p className="text-gray-600 mt-1 leading-snug text-[10px]">
              Más restaurantes. <span className="font-bold" style={{ color: brand.primary }}>Más conexiones.</span> Más experiencias.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
