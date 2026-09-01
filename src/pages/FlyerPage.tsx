import { useState, useEffect, useMemo, useRef } from 'react'
import { Printer, Download, Loader2, Sparkles, Info, ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { extractBrandColors, DEFAULT_BRAND, type BrandPalette } from '@/lib/extractBrandColors'
import {
  flyerHeroUrl,
  readFlyerStatus,
  checkExistingSlots,
  FLYER_SLOTS,
  STOCK_HERO,
  type FlyerSlot,
} from '@/lib/flyer'
import { downloadFlyerPng } from '@/lib/exportFlyer'
import { generateFlyerQrDataUrl } from '@/lib/flyerQr'
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

const MAX_SLOTS = 3

export function FlyerPage({ restaurantId }: FlyerPageProps) {
  const { user, profile: myProfile } = useAuth()
  const flyerRef = useRef<HTMLDivElement>(null)

  const [restaurant, setRestaurant] = useState<Profile | null>(null)
  const [brand, setBrand] = useState<BrandPalette>(DEFAULT_BRAND)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Slot activo y fotos ya generadas
  const [activeSlot, setActiveSlot] = useState<FlyerSlot>(1)
  const [slotHeros, setSlotHeros] = useState<Record<FlyerSlot, string>>({
    1: STOCK_HERO,
    2: STOCK_HERO,
    3: STOCK_HERO,
  })
  const [existingSlots, setExistingSlots] = useState<Set<FlyerSlot>>(new Set())
  const [qrDataUrl, setQrDataUrl] = useState<string | undefined>(undefined)

  // Estado de generación por slot
  const [generatingSlot, setGeneratingSlot] = useState<FlyerSlot | null>(null)
  const [genError, setGenError] = useState<string | null>(null)

  // Formato de descarga
  const [selectedFormatId, setSelectedFormatId] = useState(DEFAULT_FLYER_FORMAT_ID)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const selectedFormat = useMemo(() => getFlyerFormat(selectedFormatId), [selectedFormatId])
  const canGenerate = !!user && (user.id === restaurantId || myProfile?.is_admin)
  const heroUrl = slotHeros[activeSlot]

  // Cargar restaurante y fotos existentes
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
      const existing = await checkExistingSlots(restaurantId)

      if (!cancelled) {
        setBrand(palette)
        setExistingSlots(existing)
        const newHeros: Record<FlyerSlot, string> = { 1: STOCK_HERO, 2: STOCK_HERO, 3: STOCK_HERO }
        for (const slot of existing) {
          newHeros[slot] = flyerHeroUrl(restaurantId, slot, Date.now())
        }
        setSlotHeros(newHeros)
        // Activar primer slot con foto, o slot 1
        const firstFilled = FLYER_SLOTS.find(s => existing.has(s))
        if (firstFilled) setActiveSlot(firstFilled)
        setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [restaurantId])

  // QR único por restaurante — enlaza a su perfil público con atribución (?qr=restaurantId)
  useEffect(() => {
    let cancelled = false
    generateFlyerQrDataUrl(restaurantId).then(url => { if (!cancelled) setQrDataUrl(url) })
    return () => { cancelled = true }
  }, [restaurantId])

  const generateFlyer = async (slot: FlyerSlot) => {
    setGeneratingSlot(slot)
    setGenError(null)

    const { data, error: fnErr } = await supabase.functions.invoke('generate-restaurant-flyer', {
      body: { restaurantId, slot },
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
      setGeneratingSlot(null)
      setGenError(detail)
      return
    }

    // Esperar hasta recibir ok o error (máx 2 min)
    const deadline = Date.now() + 130_000
    while (Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 3000))
      const status = await readFlyerStatus(restaurantId, slot)
      if (status?.status === 'ok') {
        const url = flyerHeroUrl(restaurantId, slot, Date.now())
        setSlotHeros(prev => ({ ...prev, [slot]: url }))
        setExistingSlots(prev => new Set([...prev, slot]))
        setActiveSlot(slot)
        setGeneratingSlot(null)
        return
      }
      if (status?.status === 'error') {
        setGeneratingSlot(null)
        setGenError(status.error || 'No se pudo generar la foto')
        return
      }
    }

    setGeneratingSlot(null)
    setGenError('La generación tardó demasiado. Vuelve a intentarlo.')
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
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: `${brand.primary} transparent transparent transparent` }} />
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

  const slotsUsed = existingSlots.size
  const slotsLeft = MAX_SLOTS - slotsUsed
  const posterFormats = FLYER_FORMATS.filter(f => f.category === 'poster')
  const tableFormats = FLYER_FORMATS.filter(f => f.category === 'table')

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-8 px-4 print:bg-white print:p-0 print:block">

      {/* ── Panel de control ── */}
      <div className="w-full max-w-[720px] print:hidden mb-6 space-y-4">

        {/* Fotos IA */}
        {canGenerate && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Fotos IA</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Cada establecimiento puede generar hasta <strong>3 fotos distintas</strong> con IA (gpt-image-1.5).
                  Elige el formato correcto antes de generar.
                </p>
              </div>
              <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                slotsLeft === 0
                  ? 'bg-gray-100 text-gray-500'
                  : slotsLeft === 1
                    ? 'bg-yellow-50 text-yellow-700'
                    : 'bg-green-50 text-green-700'
              }`}>
                {slotsLeft === 0 ? 'Límite alcanzado' : `${slotsLeft} ${slotsLeft === 1 ? 'foto disponible' : 'fotos disponibles'}`}
              </span>
            </div>

            {/* Slots */}
            <div className="grid grid-cols-3 gap-2">
              {FLYER_SLOTS.map(slot => {
                const filled = existingSlots.has(slot)
                const isActive = activeSlot === slot
                const isGenerating = generatingSlot === slot

                return (
                  <div
                    key={slot}
                    className={`rounded-xl border-2 overflow-hidden transition-all ${
                      isActive ? 'border-[#129a93] shadow-md' : 'border-gray-200'
                    }`}
                  >
                    {/* Miniatura */}
                    <button
                      type="button"
                      onClick={() => { if (filled) setActiveSlot(slot) }}
                      disabled={!filled}
                      className="w-full aspect-video relative bg-gray-100"
                    >
                      {filled && !isGenerating ? (
                        <>
                          <img
                            src={slotHeros[slot]}
                            alt={`Foto ${slot}`}
                            className="w-full h-full object-cover"
                          />
                          {isActive && (
                            <div className="absolute inset-0 bg-[#129a93]/20 flex items-center justify-center">
                              <span className="bg-[#129a93] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Activa</span>
                            </div>
                          )}
                        </>
                      ) : isGenerating ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                          <p className="text-[10px] text-gray-400">Generando…</p>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-gray-400">
                          <ImageIcon className="w-5 h-5" />
                          <p className="text-[10px]">Sin foto</p>
                        </div>
                      )}
                    </button>

                    {/* Botón generar / regenerar */}
                    <div className="px-2 py-2 bg-gray-50 border-t border-gray-100 flex flex-col gap-1.5">
                      <p className="text-[11px] font-semibold text-gray-700 text-center">Foto {slot}</p>
                      <button
                        type="button"
                        onClick={() => generateFlyer(slot)}
                        disabled={!!generatingSlot || (!filled && slotsLeft === 0)}
                        className={`w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                          !!generatingSlot || (!filled && slotsLeft === 0)
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : filled
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              : 'text-white hover:opacity-90'
                        }`}
                        style={
                          !filled && !generatingSlot && slotsLeft > 0
                            ? { backgroundColor: brand.primary }
                            : {}
                        }
                      >
                        {isGenerating
                          ? <><Loader2 className="w-3 h-3 animate-spin" /> Generando…</>
                          : filled
                            ? <><Sparkles className="w-3 h-3" /> Regenerar</>
                            : <><Sparkles className="w-3 h-3" /> Generar</>}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {slotsLeft === 0 && (
              <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Has alcanzado el límite de 3 fotos. Puedes regenerar cualquiera de las existentes (sustituye la anterior).
                </p>
              </div>
            )}

            {genError && (
              <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                {genError}
              </p>
            )}

            {generatingSlot && (
              <p className="mt-3 text-xs text-gray-500">
                Generando foto {generatingSlot} con gpt-image-1.5 (calidad alta). Puede tardar 1–2 minutos…
              </p>
            )}
          </div>
        )}

        {/* Formato */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Formato de impresión</h2>
          <p className="text-xs text-gray-500 mb-4">
            <strong>Elige el formato antes de generar la foto IA</strong> — cada foto se crea para el tipo seleccionado.
            Cartel = diseño completo; Mesa = QR grande para poner en la mesa.
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
            {' · '}{selectedFormat.hint}
            {' · '}300 DPI
          </p>
        </div>

        {/* Acciones */}
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
        </div>

        {exportError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2 text-center">
            {exportError}
          </p>
        )}
      </div>

      {/* ── Preview ── */}
      <div ref={flyerRef} className="flex justify-center w-full print:block">
        <FlyerPreview
          format={selectedFormat}
          name={name}
          logo={logo}
          heroPhoto={heroUrl}
          brand={brand}
          qrSrc={qrDataUrl}
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
                  ? 'border-[#129a93] bg-red-50 ring-1 ring-[#129a93]/30'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className={`inline-block border-2 rounded-sm flex-shrink-0 ${
                    selected ? 'border-[#129a93]' : 'border-gray-400'
                  } ${isLandscape ? 'w-5 h-3.5' : 'w-3.5 h-5'}`}
                  aria-hidden
                />
                <span className={`text-xs font-semibold leading-tight ${selected ? 'text-[#129a93]' : 'text-gray-800'}`}>
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
