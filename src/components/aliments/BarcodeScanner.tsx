import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { NotFoundException } from '@zxing/library'
import { fetchByBarcode, type OFFResult } from '../../hooks/useOpenFoodFacts'
import Button from '../ui/Button'

interface Props {
  onResult: (result: OFFResult) => void
  onClose: () => void
}

type ScanState =
  | { status: 'idle' }
  | { status: 'loading'; barcode: string }
  | { status: 'found';     result: OFFResult }
  | { status: 'not_found'; barcode: string }
  | { status: 'error';     message: string }

export default function BarcodeScanner({ onResult, onClose }: Props) {
  const videoRef  = useRef<HTMLVideoElement>(null)
  const [state, setState] = useState<ScanState>({ status: 'idle' })
  const [manual, setManual] = useState('')

  const reset = () => setState({ status: 'idle' })

  useEffect(() => {
    if (state.status !== 'idle') return
    const reader = new BrowserMultiFormatReader()
    let stopped = false

    reader.decodeFromVideoDevice(undefined, videoRef.current!, async (result, err) => {
      if (stopped) return
      if (err instanceof NotFoundException) return
      if (err) { setState({ status: 'error', message: 'Erreur caméra.' }); return }
      if (!result) return
      stopped = true
      const barcode = result.getText()
      setState({ status: 'loading', barcode })
      try {
        const off = await fetchByBarcode(barcode)
        if (off) setState({ status: 'found', result: off })
        else     setState({ status: 'not_found', barcode })
      } catch {
        setState({ status: 'error', message: 'Impossible de contacter Open Food Facts.' })
      }
    })

    return () => {
      stopped = true
      BrowserMultiFormatReader.releaseAllStreams()
    }
  }, [state.status])

  const lookup = async (barcode: string) => {
    setState({ status: 'loading', barcode })
    try {
      const off = await fetchByBarcode(barcode)
      setState(off ? { status: 'found', result: off } : { status: 'not_found', barcode })
    } catch {
      setState({ status: 'error', message: 'Impossible de contacter Open Food Facts.' })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Camera */}
      <div className={`relative rounded-2xl overflow-hidden bg-black ${state.status !== 'idle' ? 'hidden' : ''}`}>
        <video ref={videoRef} className="w-full aspect-video object-cover" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-56 h-32 border-2 border-indigo-400 rounded-xl relative">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-indigo-300 rounded-tl" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-indigo-300 rounded-tr" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-indigo-300 rounded-bl" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-indigo-300 rounded-br" />
            <div className="absolute left-0 right-0 h-0.5 bg-indigo-400/70 animate-[scanline_2s_ease-in-out_infinite]" />
          </div>
        </div>
        <p className="absolute bottom-3 inset-x-0 text-center text-white text-xs opacity-75">
          Pointez vers le code-barres
        </p>
      </div>

      {/* Loading */}
      {state.status === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Recherche du produit…</p>
          <p className="text-gray-600 text-xs font-mono">{state.barcode}</p>
        </div>
      )}

      {/* Found */}
      {state.status === 'found' && (
        <div className="flex flex-col gap-4">
          <div className="bg-green-900/30 border border-green-700/50 rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <span className="text-2xl">✅</span>
              <div>
                <p className="font-bold text-white text-lg leading-tight">{state.result.nom}</p>
                {state.result.marque && <p className="text-gray-400 text-sm">{state.result.marque}</p>}
                {state.result.categorie && (
                  <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full mt-1 inline-block">
                    {state.result.categorie}
                  </span>
                )}
              </div>
            </div>
            <div className="bg-gray-800/60 rounded-xl px-4 py-3">
              <p className="text-xs text-gray-500 mb-2">Pour 100 g</p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                <span className="text-gray-400">Calories</span>  <span className="font-semibold text-yellow-400">{state.result.macro.calories} kcal</span>
                <span className="text-gray-400">Proteines</span> <span className="font-semibold text-blue-400">{state.result.macro.proteines} g</span>
                <span className="text-gray-400">Glucides</span>  <span className="font-semibold text-green-400">{state.result.macro.glucides} g</span>
                <span className="text-gray-400">Lipides</span>   <span className="font-semibold text-orange-400">{state.result.macro.lipides} g</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1 justify-center" onClick={reset}>
              Re-scanner
            </Button>
            <Button className="flex-1 justify-center" onClick={() => onResult(state.result)}>
              Utiliser
            </Button>
          </div>
        </div>
      )}

      {/* Not found */}
      {state.status === 'not_found' && (
        <div className="flex flex-col gap-3 items-center py-4">
          <p className="text-3xl">🔍</p>
          <p className="text-white font-medium">Produit introuvable</p>
          <p className="text-gray-500 text-sm text-center">
            Code <span className="font-mono text-gray-400">{state.barcode}</span> non référencé.
          </p>
          <Button variant="secondary" onClick={reset}>Réessayer</Button>
        </div>
      )}

      {/* Error */}
      {state.status === 'error' && (
        <div className="flex flex-col gap-3 items-center py-4">
          <p className="text-3xl">⚠️</p>
          <p className="text-red-400 font-medium">{state.message}</p>
          <Button variant="secondary" onClick={reset}>Réessayer</Button>
        </div>
      )}

      {/* Manual input */}
      {state.status === 'idle' && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-500 text-center">Ou entrez le code-barres manuellement</p>
          <div className="flex gap-2">
            <input
              type="tel"
              value={manual}
              onChange={e => setManual(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && lookup(manual)}
              placeholder="Ex : 3017620422003"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-indigo-500"
            />
            <Button size="sm" onClick={() => lookup(manual.trim())} disabled={!manual.trim()}>→</Button>
          </div>
        </div>
      )}

      <Button variant="ghost" className="justify-center" onClick={onClose}>Fermer</Button>
    </div>
  )
}