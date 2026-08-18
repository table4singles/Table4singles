import { useState, useEffect, useMemo } from 'react'
import { Printer, Download, Users, MapPin, Heart, Globe, UtensilsCrossed, Loader2, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { extractBrandColors, DEFAULT_BRAND, type BrandPalette } from '@/lib/extractBrandColors'
import { flyerPublicUrl, readFlyerStatus } from '@/lib/flyer'
import { downloadFlyerPng } from '@/lib/exportFlyer'
import {
  DEFAULT_FLYER_FORMAT_ID,
  FLYER_FORMATS,
  formatPrintPageSize,
  getFlyerFormat,
  type FlyerFormat,
} from '@/lib/flyerFormats'
import { useAuth } from '@/contexts/AuthContext'
import type { Profile } from '@/types/database'

interface FlyerPageProps {
  restaurantId: string
}

export function FlyerPage({ restaurantId }: FlyerPageProps) {
  const { user, profile: myProfile } = useAuth()
  const [restaurant, setRestaurant] = useState<Profile | null>(null)
  const [brand, setBrand] = useState<BrandPalette>(DEFAULT_BRAND)
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedFormatId, setSelectedFormatId] = useState(DEFAULT_FLYER_FORMAT_ID)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const selectedFormat = useMemo(() => getFlyerFormat(selectedFormatId), [selectedFormatId])

  const canGenerate = !!user && (user.id === restaurantId || myProfile?.is_admin)

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

      const probe = flyerPublicUrl(restaurantId)
      let found = false
      try {
        const head = await fetch(probe, { method: 'HEAD', cache: 'no-store' })
        found = head.ok
      } catch { /* ignore */ }

      if (!cancelled) {
        setBrand(palette)
        if (found) setGeneratedUrl(flyerPublicUrl(restaurantId, Date.now()))
        setLoading(false)
      }
    })()

    return () => { cancelled = true }
  }, [restaurantId])

  const generateFlyer = async () => {
    setGenerating(true)
    setGenError(null)
    const { data, error: fnErr } = await supabase.functions.invoke('generate-restaurant-flyer', {
      body: { restaurantId },
    })
    if (fnErr || data?.error) {
      let detail = data?.error || fnErr?.message || 'No se pudo generar el flyer'
      const ctx = (fnErr as { context?: Response } | null)?.context
      if (ctx) {
        try {
          const body = await ctx.clone().json()
          detail = body.error || body.message || detail
          if (body.detail) detail = `${detail}: ${String(body.detail).slice(0, 240)}`
        } catch { /* ignore */ }
      }
      setGenerating(false)
      setGenError(detail)
      return
    }

    const deadline = Date.now() + 130_000
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 3000))
      const status = await readFlyerStatus(restaurantId)
      if (status?.status === 'ok') {
        setGeneratedUrl(flyerPublicUrl(restaurantId, Date.now()))
        setGenerating(false)
        return
      }
      if (status?.status === 'error') {
        setGenerating(false)
        setGenError(status.error || 'No se pudo generar el flyer')
        return
      }
    }

    setGenerating(false)
    setGenError('La generación está tardando demasiado. Vuelve a intentar en un minuto.')
  }

  const downloadFlyer = async () => {
    if (!generatedUrl || !restaurant) return
    setExporting(true)
    setExportError(null)
    try {
      await downloadFlyerPng({
        flyerImageUrl: generatedUrl,
        qrImageUrl: `${window.location.origin}/icons/qr-app-logo.png`,
        format: selectedFormat,
        restaurantName: restaurant.restaurant_name || restaurant.display_name || 'restaurante',
      })
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'No se pudo descargar el flyer')
    } finally {
      setExporting(false)
    }
  }

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

  const posterFormats = FLYER_FORMATS.filter(f => f.category === 'poster')
  const tableFormats = FLYER_FORMATS.filter(f => f.category === 'table')

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4 print:bg-white print:p-0 print:block">

      <div className="w-full max-w-[680px] print:hidden mb-6 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Formato de descarga e impresión</h2>
          <p className="text-xs text-gray-500 mb-4">
            Elige el tamaño antes de descargar. Vertical para carteles; horizontal o mini para mesas.
          </p>

          <FormatGroup
            title="Carteles"
            formats={posterFormats}
            selectedId={selectedFormatId}
            onSelect={setSelectedFormatId}
          />
          <FormatGroup
            title="Mesas"
            formats={tableFormats}
            selectedId={selectedFormatId}
            onSelect={setSelectedFormatId}
            className="mt-4"
          />

          <p className="text-[11px] text-gray-400 mt-3">
            Seleccionado: <span className="font-medium text-gray-600">{selectedFormat.label}</span>
            {' · '}
            {selectedFormat.hint}
            {' · '}
            300 DPI
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
          {generatedUrl ? (
            <button
              onClick={downloadFlyer}
              disabled={exporting}
              className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl font-medium text-sm shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: brand.primary }}
            >
              {exporting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparando…</>
                : <><Download className="w-4 h-4" /> Descargar PNG</>}
            </button>
          ) : (
            <span className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-400 rounded-xl font-medium text-sm">
              <Download className="w-4 h-4" /> Descarga PNG tras generar con IA
            </span>
          )}
          <a
            href="/icons/qr-app-logo.png"
            download="qr-table4singles.png"
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" /> Solo QR
          </a>
          {canGenerate && (
            <button
              onClick={generateFlyer}
              disabled={generating}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-60"
            >
              {generating
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando…</>
                : <><Sparkles className="w-4 h-4" /> {generatedUrl ? 'Regenerar flyer' : 'Generar flyer IA'}</>}
            </button>
          )}
        </div>
      </div>

      {exportError && (
        <p className="print:hidden mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2 max-w-[680px]">
          {exportError}
        </p>
      )}

      {genError && (
        <p className="print:hidden mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2 max-w-[680px]">
          {genError}
        </p>
      )}

      {generating && (
        <p className="print:hidden mb-4 text-sm text-gray-500">
        OpenAI está componiendo el flyer con tu logo (puede tardar 1–2 minutos)…
        </p>
      )}

      {generatedUrl ? (
        <div
          id="flyer"
          className="relative w-full max-w-[680px] bg-white shadow-2xl print:shadow-none print:max-w-none"
        >
          <img src={generatedUrl} alt={`Flyer ${name}`} className="w-full h-auto block" />
          {/* QR real — único elemento que no genera la IA */}
          <img
            src="/icons/qr-app-logo.png"
            alt="QR Table4Singles"
            className="absolute left-1/2 -translate-x-1/2 w-[22%] h-auto rounded-[6%] bg-white p-[1.4%] shadow-lg"
            style={{ top: '40.5%' }}
          />
        </div>
      ) : (
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

          <div className="flex items-center justify-center gap-3 mt-4 px-6">
            <div className="h-px flex-1 max-w-[180px]" style={{ backgroundColor: brand.primary }} />
            <Heart className="w-4 h-4 flex-shrink-0" style={{ color: brand.primary, fill: brand.primary }} />
            <div className="h-px flex-1 max-w-[180px]" style={{ backgroundColor: brand.primary }} />
          </div>

          <p
            className="text-gray-700 text-sm mt-4 max-w-md mx-auto leading-relaxed"
            style={{ fontFamily: "'Arial', sans-serif" }}
          >
            Conecta, disfruta y conoce gente nueva<br />en los mejores restaurantes.
          </p>
        </div>

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
      )}

      <style>{`
        @media print {
          @page { size: ${formatPrintPageSize(selectedFormat)}; margin: 0; }
          body { margin: 0; }
          #flyer { width: 100%; max-width: 100% !important; }
        }
      `}</style>
    </div>
  )
}

function FormatGroup({
  title,
  formats,
  selectedId,
  onSelect,
  className = '',
}: {
  title: string
  formats: FlyerFormat[]
  selectedId: string
  onSelect: (id: string) => void
  className?: string
}) {
  return (
    <div className={className}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">{title}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {formats.map(format => {
          const selected = format.id === selectedId
          const isLandscape = format.orientation === 'landscape'
          return (
            <button
              key={format.id}
              type="button"
              onClick={() => onSelect(format.id)}
              className={`text-left rounded-xl border p-2.5 transition-all ${
                selected
                  ? 'border-[#e94560] bg-red-50 ring-1 ring-[#e94560]/30'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={`inline-block border-2 rounded-sm flex-shrink-0 ${
                    selected ? 'border-[#e94560]' : 'border-gray-400'
                  } ${isLandscape ? 'w-5 h-3.5' : 'w-3.5 h-5'}`}
                  aria-hidden
                />
                <span className={`text-xs font-semibold leading-tight ${selected ? 'text-[#e94560]' : 'text-gray-800'}`}>
                  {format.label}
                </span>
              </div>
              <p className="text-[10px] text-gray-500 leading-snug">{format.hint}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
