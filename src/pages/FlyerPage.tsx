import { useState, useEffect, useMemo, useRef } from 'react'
import { Printer, Download, Loader2, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { extractBrandColors, DEFAULT_BRAND, type BrandPalette } from '@/lib/extractBrandColors'
import { flyerHeroUrl, readFlyerStatus } from '@/lib/flyer'
import { downloadFlyerPng } from '@/lib/exportFlyer'
import { FlyerPreview } from '@/components/FlyerPreview'
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

const STOCK_HERO = '/hero-dinner.jpg'

export function FlyerPage({ restaurantId }: FlyerPageProps) {
  const { user, profile: myProfile } = useAuth()
  const flyerRef = useRef<HTMLDivElement>(null)
  const [restaurant, setRestaurant] = useState<Profile | null>(null)
  const [brand, setBrand] = useState<BrandPalette>(DEFAULT_BRAND)
  const [heroUrl, setHeroUrl] = useState(STOCK_HERO)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedFormatId, setSelectedFormatId] = useState(DEFAULT_FLYER_FORMAT_ID)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const selectedFormat = useMemo(() => getFlyerFormat(selectedFormatId), [selectedFormatId])
  const canGenerate = !!user && (user.id === restaurantId || myProfile?.is_admin)
  const hasAiHero = heroUrl !== STOCK_HERO

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

      let aiHero = STOCK_HERO
      try {
        const probe = flyerHeroUrl(restaurantId)
        const head = await fetch(probe, { method: 'HEAD', cache: 'no-store' })
        if (head.ok) aiHero = flyerHeroUrl(restaurantId, Date.now())
      } catch { /* stock */ }

      if (!cancelled) {
        setBrand(palette)
        setHeroUrl(aiHero)
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
      let detail = data?.error || fnErr?.message || 'No se pudo generar la foto'
      const ctx = (fnErr as { context?: Response } | null)?.context
      if (ctx) {
        try {
          const body = await ctx.clone().json()
          detail = body.error || body.message || detail
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
        setHeroUrl(flyerHeroUrl(restaurantId, Date.now()))
        setGenerating(false)
        return
      }
      if (status?.status === 'error') {
        setGenerating(false)
        setGenError(status.error || 'No se pudo generar la foto')
        return
      }
    }

    setGenerating(false)
    setGenError('La generación está tardando demasiado. Vuelve a intentar en un minuto.')
  }

  const downloadFlyer = async () => {
    const el = flyerRef.current?.querySelector('#flyer') as HTMLElement | null
    if (!el || !restaurant) return
    setExporting(true)
    setExportError(null)
    try {
      await downloadFlyerPng({
        flyerElement: el,
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

  const posterFormats = FLYER_FORMATS.filter(f => f.category === 'poster')
  const tableFormats = FLYER_FORMATS.filter(f => f.category === 'table')

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4 print:bg-white print:p-0 print:block">

      <div className="w-full max-w-[720px] print:hidden mb-6 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Formato de descarga e impresión</h2>
          <p className="text-xs text-gray-500 mb-4">
            Cartel = diseño completo. Mesa = QR grande y poco texto, para que se lea al lado del cubierto.
            Textos, logos y QR son reales; la IA solo genera la foto.
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
          {canGenerate && (
            <button
              onClick={generateFlyer}
              disabled={generating}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-60"
            >
              {generating
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Generando foto…</>
                : <><Sparkles className="w-4 h-4" /> {hasAiHero ? 'Nueva foto IA' : 'Foto IA (como ChatGPT)'}</>}
            </button>
          )}
        </div>
      </div>

      {exportError && (
        <p className="print:hidden mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2 max-w-[720px]">
          {exportError}
        </p>
      )}

      {genError && (
        <p className="print:hidden mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2 max-w-[720px]">
          {genError}
        </p>
      )}

      {generating && (
        <p className="print:hidden mb-4 text-sm text-gray-500">
          OpenAI (gpt-image-1.5, calidad alta) está generando la foto del cartel. Puede tardar 1–2 minutos.
        </p>
      )}

      <div ref={flyerRef} className="flex justify-center w-full print:block">
        <FlyerPreview
          format={selectedFormat}
          name={name}
          logo={logo}
          heroPhoto={heroUrl}
          brand={brand}
        />
      </div>

      <style>{`
        @media print {
          @page { size: ${formatPrintPageSize(selectedFormat)}; margin: 0; }
          body { margin: 0; }
          #flyer { width: 100% !important; height: 100vh !important; max-width: none !important; }
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
