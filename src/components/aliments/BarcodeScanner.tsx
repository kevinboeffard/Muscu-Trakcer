import { useRef, useState, useCallback } from 'react'
import { BrowserMultiFormatReader } from '@zxing/library'
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
  const fileRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<ScanState>({ status: 'idle' })
  const [manual, setManual] = useState('')

  const lookup = useCallback(async (barcode: string) => {
    const code = barcode.trim()
    if (!code) return
    setState({ status: 'loading', barcode: code })
    try {
      const off = await fetchByBarcode(code)
      setState(off ? { status: 'found', result: off } : { status: 'not_found', barcode: code })
    } catch {
      setState({ status: 'error', message: 'Impossible de contacter Open Food Facts.' })
    }
  }, [])

  const handlePhoto = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setState({ status: 'loading', barcode: '…' })
    try {
      const reader = new BrowserMultiFormatReader()
      const result = await reader.decodeFromImageUrl(url)
      await lookup(result.getText())
    } catch {
      setState({ status: 'error', message: 'Code-barres non détecté. Cadre bien le code et réessaie.' })
    } finally {
      URL.revokeObjectURL(url)
      if (fileRef.current) fileRef.current.value = ''
    }
  }, [lookup])

  const reset = () => setState({ status: 'idle' })

  return (
    <div className="flex flex-col gap-4">

      {/* ── IDLE ── */}
      {state.status === 'idle' && (
        <div className="flex flex-col gap-3">
          {/* Photo button */}
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-4 bg-gray-800 hover:bg-gray-700 border-2 border-dashed border-indigo-500/50 hover:border-indigo-400 rounded-2xl p-5 transition-all group"
          >
            <span className="text-4xl group-hover:scale-110 transition-transform">📷</span>
            <div className="text-left">
              <p className="text-white font-semibold text-base">Photographier l'étiquette</p>
              <p className="text-gray-400 text-sm mt-0.5">Ouvre l'appareil photo → pointe vers le code-barres</p>
            </div>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhoto}
            className="hidden"
          />
          <p className="text-xs text-gray-600 text-center">
            Conseil : cadre uniquement le code-barres, bonne lumière
          </p>
        </div>
      )}

      {/* ── LOADING ── */}
      {state.status === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-300 font-medium">Analyse en cours…</p>
          {state.barcode !== '…' && (
            <p className="text-gray-600 text-xs font-mono">{state.barcode}</p>
          )}
        </div>
      )}

      {/* ── FOUND ── */}
      {state.status === 'found' && (
        <div className="flex flex-col gap-4">
          <div className="bg-green-900/30 border border-green-700/50 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              {state.result.imageUrl && (
                <img src={state.result.imageUrl} alt=""
                  className="w-16 h-16 object-cover rounded-xl shrink-0 bg-gray-800" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-lg">✅</span>
                  <p className="font-bold text-white text-base leading-tight truncate">{state.result.nom}</p>
                </div>
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
                <span className="text-gray-400">Protéines</span> <span className="font-semibold text-blue-400">{state.result.macro.proteines} g</span>
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
              Utiliser →
            </Button>
          </div>
        </div>
      )}

      {/* ── NOT FOUND ── */}
      {state.status === 'not_found' && (
        <div className="flex flex-col gap-3 items-center py-4">
          <p className="text-4xl">🔍</p>
          <p className="text-white font-semibold">Produit introuvable</p>
          <p className="text-gray-500 text-sm text-center">
            Code <span className="font-mono text-gray-300">{state.barcode}</span> non référencé sur Open Food Facts.
          </p>
          <Button variant="secondary" onClick={reset}>Réessayer</Button>
        </div>
      )}

      {/* ── ERROR ── */}
      {state.status === 'error' && (
        <div className="flex flex-col gap-3 items-center py-4">
          <p className="text-4xl">⚠️</p>
          <p className="text-red-400 text-sm text-center font-medium">{state.message}</p>
          <Button variant="secondary" onClick={reset}>Réessayer</Button>
        </div>
      )}

      {/* ── Saisie manuelle (toujours visible sauf loading) ── */}
      {state.status !== 'loading' && (
        <div className="flex flex-col gap-2 border-t border-gray-800 pt-3">
          <p className="text-xs text-gray-600 text-center">Ou entre le code-barres manuellement</p>
          <div className="flex gap-2">
            <input
              type="tel"
              value={manual}
              onChange={e => setManual(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && lookup(manual)}
              placeholder="Ex : 3017620422003"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-indigo-500"
            />
            <Button size="sm" onClick={() => lookup(manual)} disabled={!manual.trim()}>→</Button>
          </div>
        </div>
      )}

      <Button variant="ghost" className="justify-center" onClick={onClose}>Fermer</Button>
    </div>
  )
}
