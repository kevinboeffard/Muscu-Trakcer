import { useEffect, useRef, useState, useCallback } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { fetchByBarcode, type OFFResult } from '../../hooks/useOpenFoodFacts'
import Button from '../ui/Button'

interface Props {
  onResult: (result: OFFResult) => void
  onClose: () => void
}

type ScanState =
  | { status: 'scanning' }
  | { status: 'loading';   barcode: string }
  | { status: 'found';     result: OFFResult }
  | { status: 'not_found'; barcode: string }
  | { status: 'error';     message: string }

export default function BarcodeScanner({ onResult, onClose }: Props) {
  const videoRef   = useRef<HTMLVideoElement>(null)
  const controlRef = useRef<{ stop: () => void } | null>(null)
  const [state, setState] = useState<ScanState>({ status: 'scanning' })
  const [manual, setManual] = useState('')

  // ── Start camera scanning ────────────────────────────────────────────────
  useEffect(() => {
    if (state.status !== 'scanning') return
    if (!videoRef.current) return

    const reader = new BrowserMultiFormatReader()
    let handled = false

    const handleBarcode = async (barcode: string) => {
      if (handled) return
      handled = true
      controlRef.current?.stop()
      setState({ status: 'loading', barcode })
      try {
        const off = await fetchByBarcode(barcode)
        setState(off ? { status: 'found', result: off } : { status: 'not_found', barcode })
      } catch {
        setState({ status: 'error', message: 'Impossible de contacter Open Food Facts.' })
      }
    }

    // decodeFromVideoDevice is async — store controls for cleanup
    reader.decodeFromVideoDevice(
      undefined,          // undefined = default (rear) camera
      videoRef.current,
      (result, _err) => {
        if (handled) return
        if (result) handleBarcode(result.getText())
        // err is NotFoundException on every empty frame — ignore
      }
    )
    .then(controls => { controlRef.current = controls })
    .catch(() => setState({ status: 'error', message: "Impossible d'accéder à la caméra. Vérifiez les permissions." }))

    return () => {
      handled = true
      controlRef.current?.stop()
      controlRef.current = null
    }
  }, [state.status])

  // ── Manual lookup ──────────────────────────────────────────────────────────
  const lookup = useCallback(async (barcode: string) => {
    controlRef.current?.stop()
    setState({ status: 'loading', barcode })
    try {
      const off = await fetchByBarcode(barcode)
      setState(off ? { status: 'found', result: off } : { status: 'not_found', barcode })
    } catch {
      setState({ status: 'error', message: 'Impossible de contacter Open Food Facts.' })
    }
  }, [])

  const rescan = () => {
    controlRef.current?.stop()
    controlRef.current = null
    setManual('')
    setState({ status: 'scanning' })
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Camera — always in DOM so ref is available; hidden when not scanning */}
      <div className={state.status === 'scanning' ? 'relative rounded-2xl overflow-hidden bg-black' : 'hidden'}>
        <video ref={videoRef} className="w-full aspect-video object-cover" playsInline muted />
        {/* Viewfinder overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-56 h-32 relative">
            {/* Corners */}
            <span className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-indigo-400 rounded-tl-sm" />
            <span className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-indigo-400 rounded-tr-sm" />
            <span className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-indigo-400 rounded-bl-sm" />
            <span className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-indigo-400 rounded-br-sm" />
            {/* Scan line */}
            <div className="absolute inset-x-0 h-0.5 bg-indigo-400/80 animate-[scanline_2s_ease-in-out_infinite]" />
          </div>
        </div>
        <p className="absolute bottom-3 inset-x-0 text-center text-white/70 text-xs">
          Centrez le code-barres
        </p>
      </div>

      {/* Loading */}
      {state.status === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-10">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Recherche du produit...</p>
          <p className="text-gray-600 text-xs font-mono">{state.barcode}</p>
        </div>
      )}

      {/* Found */}
      {state.status === 'found' && (
        <div className="flex flex-col gap-4">
          <div className="bg-green-900/30 border border-green-700/50 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              {state.result.imageUrl && (
                <img src={state.result.imageUrl} alt={state.result.nom}
                  className="w-16 h-16 object-contain rounded-lg bg-gray-800 shrink-0" />
              )}
              <div>
                <p className="font-bold text-white leading-tight">{state.result.nom}</p>
                {state.result.marque && <p className="text-gray-400 text-sm">{state.result.marque}</p>}
                {state.result.categorie && (
                  <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full mt-1 inline-block">
                    {state.result.categorie}
                  </span>
                )}
              </div>
            </div>
            <div className="bg-gray-800/60 rounded-xl px-4 py-3 mt-1">
              <p className="text-xs text-gray-500 mb-2">Pour 100 g</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <span className="text-gray-400">Calories</span>  <span className="font-semibold text-yellow-400">{state.result.macro.calories} kcal</span>
                <span className="text-gray-400">Protéines</span> <span className="font-semibold text-blue-400">{state.result.macro.proteines} g</span>
                <span className="text-gray-400">Glucides</span>  <span className="font-semibold text-green-400">{state.result.macro.glucides} g</span>
                <span className="text-gray-400">Lipides</span>   <span className="font-semibold text-orange-400">{state.result.macro.lipides} g</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1 justify-center" onClick={rescan}>Re-scanner</Button>
            <Button className="flex-1 justify-center" onClick={() => onResult(state.result)}>Utiliser →</Button>
          </div>
        </div>
      )}

      {/* Not found */}
      {state.status === 'not_found' && (
        <div className="flex flex-col gap-3 items-center py-6">
          <p className="text-3xl">🔍</p>
          <p className="text-white font-medium">Produit introuvable</p>
          <p className="text-gray-500 text-sm text-center">
            Code <span className="font-mono text-gray-400 text-xs">{state.barcode}</span><br/>
            non référencé sur Open Food Facts.
          </p>
          <Button variant="secondary" onClick={rescan}>Re-scanner</Button>
        </div>
      )}

      {/* Error */}
      {state.status === 'error' && (
        <div className="flex flex-col gap-3 items-center py-6">
          <p className="text-3xl">⚠️</p>
          <p className="text-red-400 font-medium text-center text-sm">{state.message}</p>
          <Button variant="secondary" onClick={rescan}>Réessayer</Button>
        </div>
      )}

      {/* Manual barcode input — shown while scanning */}
      {state.status === 'scanning' && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-500 text-center">Ou saisissez le code manuellement</p>
          <div className="flex gap-2">
            <input
              type="tel" inputMode="numeric" value={manual}
              onChange={e => setManual(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && manual.length > 4 && lookup(manual)}
              placeholder="3017620422003"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-indigo-500"
            />
            <Button size="sm" onClick={() => lookup(manual)} disabled={manual.length < 8}>→</Button>
          </div>
        </div>
      )}

      <Button variant="ghost" className="justify-center" onClick={() => { controlRef.current?.stop(); onClose() }}>
        Fermer
      </Button>
    </div>
  )
}
